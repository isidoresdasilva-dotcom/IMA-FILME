const C = window.IMA_CONFIG || {};
const APP = 'I.M.A FILMES V10.1';

const ONLINE = !!(
  window.supabase &&
  C.SUPABASE_URL &&
  C.SUPABASE_ANON_KEY &&
  !C.SUPABASE_URL.includes('COLOQUE_AQUI')
);

const sb = ONLINE
  ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY)
  : null;

const BLOCKED = [
  'pornografia',
  'pornô',
  'porno',
  'porn',
  'xxx',
  'sexo explícito',
  'sex explicit',
  'nudez explícita'
];

let state = {
  user: null,
  profile: null,
  view: 'home',
  query: '',
  contents: [],
  favorites: new Set(),
  progress: new Map(),
  transactions: []
};

let localDB = null;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const esc = s =>
  String(s ?? '').replace(
    /[&<>"']/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c])
  );

function toast(text) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function uid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now() + '-' + Math.random().toString(16).slice(2);
}

function isBlocked(text) {
  const t = String(text || '').toLowerCase();
  return BLOCKED.some(w => t.includes(w));
}

/* =========================================================
   CAPAS AUTOMÁTICAS
========================================================= */

function fallbackCover(title, n = 0) {
  const c = document.createElement('canvas');
  c.width = 640;
  c.height = 360;

  const g = c.getContext('2d');

  const bg = [
    '#0f172a',
    '#172554',
    '#164e63',
    '#312e81',
    '#111827'
  ][n % 5];

  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);

  g.fillStyle = '#fff';
  g.font = 'bold 34px Arial';
  g.fillText('🎬 I.M.A FILMES', 30, 75);

  g.font = 'bold 25px Arial';
  g.fillText(
    String(title || 'I.M.A FILMES').slice(0, 30),
    30,
    145
  );

  g.font = '16px Arial';
  g.fillStyle = '#93c5fd';
  g.fillText('Capa automática ' + (n + 1), 30, 185);

  return c.toDataURL('image/jpeg', 0.86);
}

function autoCovers(file, title) {
  return new Promise(resolve => {
    const fallback = [0, 1, 2, 3, 4].map(i =>
      fallbackCover(title, i)
    );

    if (!file || !file.type.startsWith('video/')) {
      resolve(fallback);
      return;
    }

    const v = document.createElement('video');
    v.muted = true;
    v.preload = 'metadata';

    const objectUrl = URL.createObjectURL(file);
    v.src = objectUrl;

    v.onloadedmetadata = () => {
      const d =
        isFinite(v.duration) && v.duration > 0
          ? v.duration
          : 10;

      const times = [.05, .2, .4, .6, .8].map(p =>
        Math.max(
          .1,
          Math.min(
            Math.max(.2, d - .1),
            d * p
          )
        )
      );

      const c = document.createElement('canvas');
      c.width = 640;
      c.height = 360;

      const out = [];
      let i = 0;

      v.onseeked = () => {
        try {
          c.getContext('2d').drawImage(
            v,
            0,
            0,
            640,
            360
          );

          out.push(
            c.toDataURL('image/jpeg', 0.86)
          );

          i++;

          if (i < times.length) {
            v.currentTime = times[i];
          } else {
            URL.revokeObjectURL(objectUrl);
            resolve(
              out.length === 5
                ? out
                : fallback
            );
          }
        } catch (e) {
          URL.revokeObjectURL(objectUrl);
          resolve(fallback);
        }
      };

      v.currentTime = times[0];
    };

    v.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(fallback);
    };
  });
}

/* =========================================================
   CONVERSÃO DE ARQUIVOS
========================================================= */

function fileData(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }

    const r = new FileReader();

    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);

    r.readAsDataURL(file);
  });
}

function blobFromData(data) {
  if (data instanceof Blob) return data;

  if (typeof data !== 'string') return null;

  const p = data.split(',');

  if (p.length < 2) return null;

  const mime =
    (p[0].match(/data:([^;]+)/) || [])[1] ||
    'application/octet-stream';

  const bin = atob(p[1]);
  const a = new Uint8Array(bin.length);

  for (let i = 0; i < bin.length; i++) {
    a[i] = bin.charCodeAt(i);
  }

  return new Blob([a], { type: mime });
}

/* =========================================================
   MODAL
========================================================= */

function openModal(html) {
  $('#modalBody').innerHTML = html;
  $('#modal').classList.remove('hidden');
}

function closeModal() {
  $('#modal').classList.add('hidden');
  $('#modalBody').innerHTML = '';
}

/* =========================================================
   SUPABASE STORAGE
   IMPORTANTE:
   vídeos e ebooks são PRIVADOS.
========================================================= */

async function uploadPrivate(bucket, path, file, contentType) {
  if (!sb) {
    throw new Error('Supabase não está configurado.');
  }

  const { error } = await sb.storage
    .from(bucket)
    .upload(
      path,
      file,
      {
        contentType:
          contentType ||
          file.type ||
          'application/octet-stream',
        upsert: false
      }
    );

  if (error) throw error;

  return path;
}

async function uploadPublic(bucket, path, file, contentType) {
  if (!sb) {
    throw new Error('Supabase não está configurado.');
  }

  const { error } = await sb.storage
    .from(bucket)
    .upload(
      path,
      file,
      {
        contentType:
          contentType ||
          file.type ||
          'application/octet-stream',
        upsert: false
      }
    );

  if (error) throw error;

  const { data } = sb.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

async function signedUrl(bucket, path, expires = 3600) {
  if (!path || typeof path !== 'string') {
    return '';
  }

  if (
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }

  const { data, error } = await sb.storage
    .from(bucket)
    .createSignedUrl(path, expires);

  if (error) {
    console.warn(
      'Erro ao criar URL assinada:',
      error.message
    );
    return '';
  }

  return data?.signedUrl || '';
}
