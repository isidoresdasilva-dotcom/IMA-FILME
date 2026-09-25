'use strict';
/* I.M.A FILMES V11 - publicação robusta. Sem atribuição onclick a elementos inexistentes. */
const C=window.IMA_CONFIG||{}; const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const has=(s,r=document)=>!!$(s,r); const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const state={user:null,profile:null,contents:[],view:'home',query:'',publishing:false};
let sb=null; const ONLINE=!!(window.supabase&&C.supabaseUrl&&C.supabaseKey); if(ONLINE) sb=supabase.createClient(C.supabaseUrl,C.supabaseKey);
function toast(msg){const t=$('#toast');if(!t)return; t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),3500)}
function openModal(html){const m=$('#modal'),b=$('#modalBody');if(!m||!b)return;b.innerHTML=html;m.classList.remove('hidden')}
function closeModal(){const m=$('#modal');if(m)m.classList.add('hidden')}
function slug(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)}
function typeOk(t){return ['Filme','Série','Anime','Dorama','E-book'].includes(t)}
async function init(){if(!ONLINE){toast('Modo demonstração: configure o Supabase.');render();return} try{const {data}=await sb.auth.getSession();if(data.session)await setUser(data.session.user);sb.auth.onAuthStateChange((_e,s)=>{setUser(s?.user||null).catch(console.error)});await loadContents();render()}catch(e){console.error(e);toast('Falha ao iniciar: '+e.message);render()}}
async function setUser(u){state.user=u;if(!u){state.profile=null;updateHeader();return} try{let {data,error}=await sb.from('profiles').select('*').eq('id',u.id).maybeSingle();if(error)throw error;if(!data){const name=u.user_metadata?.name||u.email?.split('@')[0]||'Utilizador';const r=await sb.from('profiles').upsert({id:u.id,name,username:slug(name),role:'user'}).select().single();if(r.error)throw r.error;data=r.data}state.profile=data}catch(e){console.error(e);state.profile={name:u.user_metadata?.name||u.email||'Utilizador',role:'user'}}updateHeader()}
function updateHeader(){const b=$('#loginBtn');if(b)b.textContent=state.user?'👤 '+(state.profile?.name||'Conta'):'Entrar'}
async function loadContents(){if(!ONLINE){state.contents=[];return}const {data,error}=await sb.from('contents').select('id,owner_id,type,title,description,year,price,free,cover_url,status,created_at').eq('status','active').order('created_at',{ascending:false});if(error)throw error;state.contents=data||[]}
function filtered(view=state.view){let a=state.contents;if(['films','series','anime','dorama','ebooks'].includes(view)){const map={films:'Filme',series:'Série',anime:'Anime',dorama:'Dorama',ebooks:'E-book'};a=a.filter(x=>x.type===map[view])}if(state.query){const q=state.query.toLowerCase();a=a.filter(x=>(x.title+' '+(x.description||'')).toLowerCase().includes(q))}return a}
function card(x){return `<article class="card"><img src="${esc(x.cover_url||'fundo.svg')}" onerror="this.src='fundo.svg'" alt="Capa"><div class="cardbody"><h3>${esc(x.title)}</h3><small>${esc(x.type)} · ${Number(x.price||0)>0?Number(x.price).toLocaleString('pt-AO')+' Kz':'Grátis'}</small><p>${esc(x.description||'Sem descrição.')}</p><button class="btn primary" data-play="${esc(x.id)}">▶ Assistir</button></div></article>`}
function home(){const a=filtered('home');$('#main').innerHTML=`<section class="hero"><div><span class="pill">PLATAFORMA DIGITAL</span><h1>I.M.A FILMES <em>V11</em></h1><p>Assista, publique e organize filmes, séries, anime, doramas e e-books.</p><button class="btn primary" data-nav="publish">⬆️ Publicar meu conteúdo</button></div></section><div class="head"><h2>Conteúdos recentes</h2><span>${a.length} item(ns)</span></div><div class="grid">${a.slice(0,12).map(card).join('')||empty('Ainda não há conteúdos publicados.')}</div>`;bindDynamic()}
function catalog(v){const labels={films:'Filmes',series:'Séries',anime:'Anime',dorama:'Doramas',ebooks:'E-books'};const a=filtered(v);$('#main').innerHTML=`<div class="head"><h1>${labels[v]}</h1><span>${a.length} item(ns)</span></div><div class="grid">${a.map(card).join('')||empty('Nenhum conteúdo encontrado.')}</div>`;bindDynamic()}
function empty(t){return `<div class="empty">${esc(t)}</div>`}
function bindDynamic(){$$('[data-nav]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.nav),{once:true}));$$('[data-play]').forEach(b=>b.addEventListener('click',()=>playContent(b.dataset.play),{once:true}))}
function navigate(v){state.view=v; if(v==='home')home();else if(['films','series','anime','dorama','ebooks'].includes(v))catalog(v);else if(v==='publish')publishPage();else if(v==='library')libraryPage();else if(v==='settings')settingsPage();}
function login(){if(!ONLINE){toast('Configure o Supabase para usar contas online.');return}openModal(`<h2>👤 Entrar / Criar conta</h2><div class="form"><input id="authName" placeholder="Nome (conta nova)"><input id="authEmail" type="email" placeholder="E-mail"><input id="authPass" type="password" placeholder="Senha (mín. 6 caracteres)"><button id="authSubmit" class="btn primary">Continuar</button></div>`);const b=$('#authSubmit');if(b)b.addEventListener('click',authSubmit)}
async function authSubmit(){const name=$('#authName')?.value.trim()||'Utilizador',email=$('#authEmail')?.value.trim().toLowerCase(),password=$('#authPass')?.value||'';if(!email||password.length<6)return toast('Informe e-mail e senha com pelo menos 6 caracteres.');const {data,error}=await sb.auth.signInWithPassword({email,password});if(error){const s=await sb.auth.signUp({email,password,options:{data:{name}}});if(s.error)return toast('❌ '+s.error.message);toast(s.data.session?'Conta criada e entrada efetuada.':'Conta criada. Verifique o e-mail se a confirmação estiver ativa.')}else toast('Entrada efetuada.');closeModal();if(data?.user)await setUser(data.user);await loadContents();navigate(state.view)}
function publishPage(){if(!state.user){$('#main').innerHTML=`<div class="panel"><h2>🔐 Entre para publicar</h2><p>É necessário estar autenticado.</p><button class="btn primary" data-login>Entrar / Criar conta</button></div>`;const b=$('[data-login]');if(b)b.addEventListener('click',login,{once:true});return}$('#main').innerHTML=`<div class="head"><h1>⬆️ Publicar conteúdo</h1></div><div class="panel"><div id="pubStatus" class="status">Pronto para publicar.</div><form id="publishForm" class="form"><label>Tipo<select id="pubType"><option>Filme</option><option>Série</option><option>Anime</option><option>Dorama</option><option>E-book</option></select></label><label>Título<input id="pubTitle" required maxlength="150"></label><label>Descrição<textarea id="pubDesc" maxlength="2000"></textarea></label><div class="two"><label>Preço (Kz)<input id="pubPrice" type="number" min="0" step="1" value="0"></label><label>Ano<input id="pubYear" type="number" min="1900" max="2100" value="${new Date().getFullYear()}"></label></div><label>Capa<input id="pubCover" type="file" accept="image/*" required></label><label>Vídeo<input id="pubVideo" type="file" accept="video/*" required></label><button id="publishBtn" class="btn primary" type="submit">🚀 Publicar conteúdo</button></form></div>`;const f=$('#publishForm');if(f)f.addEventListener('submit',publishSubmit)}
async function upload(bucket,path,file,opts={}){const r=await sb.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type||opts.contentType||undefined});if(r.error)throw r.error;return path}
async function signed(bucket,path){
  if(!path) throw Error('Caminho do vídeo vazio.');
  let clean=String(path).trim();
  if(/^https?:\/\//i.test(clean)){
    try{
      const u=new URL(clean);
      const marker=`/storage/v1/object/public/${bucket}/`;
      const marker2=`/storage/v1/object/sign/${bucket}/`;
      if(u.pathname.includes(marker)) clean=decodeURIComponent(u.pathname.split(marker)[1]);
      else if(u.pathname.includes(marker2)) clean=decodeURIComponent(u.pathname.split(marker2)[1].split('?')[0]);
      else if(u.pathname.includes(`/storage/v1/object/authenticated/${bucket}/`)) clean=decodeURIComponent(u.pathname.split(`/storage/v1/object/authenticated/${bucket}/`)[1]);
      else throw Error('A gravação antiga contém uma URL que não pertence ao bucket de vídeos. Publique o vídeo novamente.');
    }catch(e){ if(e instanceof Error && e.message) throw e; throw Error('URL do vídeo inválida.'); }
  }
  const r=await sb.storage.from(bucket).createSignedUrl(clean,3600);
  if(r.error) throw Error('Não foi possível criar a URL segura do vídeo: '+r.error.message);
  if(!r.data?.signedUrl) throw Error('O Supabase não devolveu uma URL segura para o vídeo.');
  return r.data.signedUrl;
}
async function publishSubmit(e){e.preventDefault();if(state.publishing)return;state.publishing=true;const btn=$('#publishBtn'),status=$('#pubStatus');if(btn){btn.disabled=true;btn.textContent='⏳ Publicando...'}if(status)status.textContent='1/4 Preparando publicação...';let contentId=null,coverPath=null,videoPath=null;try{if(!state.user)throw Error('Sessão expirada. Entre novamente.');const type=$('#pubType')?.value,title=$('#pubTitle')?.value.trim(),desc=$('#pubDesc')?.value.trim()||'',price=Math.max(0,Number($('#pubPrice')?.value||0)),year=Number($('#pubYear')?.value||new Date().getFullYear()),cover=$('#pubCover')?.files?.[0],video=$('#pubVideo')?.files?.[0];if(!typeOk(type)||!title||!cover||!video)throw Error('Preencha tipo, título, capa e vídeo.');if(video.size>2*1024*1024*1024)throw Error('Vídeo acima de 2 GB.');const base=Date.now()+'-'+crypto.randomUUID(),safe=slug(title)||'conteudo';coverPath=state.user.id+'/'+base+'-'+safe+'.'+(cover.name.split('.').pop()||'jpg');videoPath=state.user.id+'/'+base+'-'+safe+'.'+(video.name.split('.').pop()||'mp4');if(status)status.textContent='2/4 Enviando capa...';await upload('capas',coverPath,cover);if(status)status.textContent='3/4 Enviando vídeo...';await upload('videos',videoPath,video);if(status)status.textContent='4/4 Gravando no banco...';const ins=await sb.from('contents').insert({owner_id:state.user.id,type,title,description:desc,year,price,free:price===0,cover_url:sb.storage.from('capas').getPublicUrl(coverPath).data.publicUrl,status:'active'}).select('id').single();if(ins.error)throw ins.error;contentId=ins.data.id;const ep=await sb.from('episodes').insert({content_id:contentId,season_no:1,episode_no:1,title,video_url:videoPath}).select('id').single();if(ep.error)throw ep.error;await loadContents();toast('✅ Publicado com sucesso!');await playContent(contentId,true)}catch(err){console.error('V11 publish:',err);if(contentId)await sb.from('contents').delete().eq('id',contentId);if(videoPath)await sb.storage.from('videos').remove([videoPath]);if(coverPath)await sb.storage.from('capas').remove([coverPath]);if(status)status.textContent='❌ '+(err.message||'Falha na publicação.');toast('❌ '+(err.message||'Falha na publicação.'))}finally{state.publishing=false;if(btn){btn.disabled=false;btn.textContent='🚀 Publicar conteúdo'}}}
async function playContent(id,auto=false){
  const x=state.contents.find(c=>String(c.id)===String(id));
  if(!x) return toast('Conteúdo não encontrado.');
  try{
    if(!ONLINE) throw Error('O reprodutor online requer Supabase configurado.');
    let ep=null;
    const rpc=await sb.rpc('v11_get_episode',{p_content_id:id});
    if(rpc.error) throw Error('Falha ao localizar o episódio: '+rpc.error.message);
    if(Array.isArray(rpc.data)&&rpc.data.length) ep=rpc.data[0];
    if(!ep?.video_url) throw Error('Este conteúdo não possui vídeo publicado.');
    const url=await signed('videos',ep.video_url);
    openModal(`<div class="player"><button class="close" data-close aria-label="Fechar">✕</button><h2>${esc(x.title)}</h2><video id="player" controls playsinline preload="metadata"></video><div class="player-actions"><button id="startPlayer" class="btn primary">▶ Reproduzir</button><span id="playerStatus" class="small">Preparando vídeo seguro...</span></div><p>${esc(x.description||'')}</p></div>`);
    const c=$('[data-close]'); if(c)c.addEventListener('click',closeModal,{once:true});
    const v=$('#player'), start=$('#startPlayer'), status=$('#playerStatus');
    if(!v) throw Error('Área do reprodutor não foi criada.');
    v.src=url; v.load();
    v.addEventListener('loadedmetadata',()=>{if(status)status.textContent='Vídeo pronto.'},{once:true});
    v.addEventListener('canplay',()=>{if(status)status.textContent='Pronto para reproduzir.'},{once:true});
    v.addEventListener('error',()=>{
      const media=v.error;
      const code=media?.code||0;
      if(status)status.textContent='Erro de reprodução (código '+code+').';
      console.error('I.M.A FILMES player error',{code,message:media?.message,urlLength:url.length,path:ep.video_url});
      toast('❌ O navegador não conseguiu carregar este vídeo. Se continuar, publique o arquivo novamente.');
    });
    const startPlayback=async()=>{
      try{await v.play(); if(status)status.textContent='▶ Reproduzindo...';}
      catch(err){console.warn('Autoplay bloqueado:',err);if(status)status.textContent='Clique em Reproduzir para iniciar.';}
    };
    if(start)start.addEventListener('click',startPlayback);
    if(auto) setTimeout(startPlayback,150);
  }catch(e){console.error('V11.2 playContent:',e);toast('❌ Não foi possível reproduzir: '+(e.message||e));}
}
function libraryPage(){$('#main').innerHTML=`<div class="head"><h1>❤️ Minha biblioteca</h1></div><div class="panel">A biblioteca de compras e favoritos será ligada ao módulo de vendas da V11. Os conteúdos publicados por si continuam disponíveis no catálogo.</div>`}
function settingsPage(){$('#main').innerHTML=`<div class="head"><h1>⚙️ Conta</h1></div><div class="panel"><p><b>Utilizador:</b> ${esc(state.profile?.name||state.user?.email||'Visitante')}</p><p><b>Estado:</b> ${state.user?'Online':'Não autenticado'}</p>${state.user?'<button id="logout" class="btn danger">Sair</button>':''}</div>`;const b=$('#logout');if(b)b.addEventListener('click',async()=>{await sb.auth.signOut();state.user=null;state.profile=null;closeModal();navigate('home');updateHeader()},{once:true})}
function bindStatic(){const menu=$('#menuBtn');if(menu)menu.addEventListener('click',()=>$('#sidebar')?.classList.toggle('open'));const loginB=$('#loginBtn');if(loginB)loginB.addEventListener('click',()=>state.user?navigate('settings'):login());const search=$('#search');if(search)search.addEventListener('input',e=>{state.query=e.target.value;render()});const modal=$('#modal');if(modal)modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});$$('#sidebar [data-view]').forEach(b=>b.addEventListener('click',()=>{navigate(b.dataset.view);$('#sidebar')?.classList.remove('open')}))}
function render(){updateHeader();if(state.view==='home')home();else if(['films','series','anime','dorama','ebooks'].includes(state.view))catalog(state.view);else navigate(state.view)}
bindStatic(); init().catch(e=>{console.error(e);toast('Erro fatal: '+e.message)}); window.IMA_V11={state,navigate,loadContents};
