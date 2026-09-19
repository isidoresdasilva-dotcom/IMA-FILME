const C=window.IMA_CONFIG||{};
const APP="I.M.A FILMES V10.1";
const ONLINE=!!(window.supabase&&C.SUPABASE_URL&&C.SUPABASE_ANON_KEY&&!String(C.SUPABASE_URL).includes("COLOQUE_AQUI"));
const sb=ONLINE?window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY):null;

const state={user:null,profile:null,view:"home",query:"",contents:[],favorites:new Set(),progress:new Map(),transactions:[],initialized:false};

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>crypto?.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2);

function toast(message){
  const el=$("#toast"); if(!el)return;
  el.textContent=message; el.classList.add("show");
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove("show"),2800);
}
function closeModal(){const m=$("#modal");if(m)m.classList.add("hidden")}
function openModal(html){const m=$("#modal"),b=$("#modalBody");if(!m||!b)return;b.innerHTML=html;m.classList.remove("hidden")}
function isBlobUrl(v){return typeof v==="string"&&v.startsWith("blob:")}
function fallbackCover(title,n=0){
  const cv=document.createElement("canvas");cv.width=640;cv.height=360;const x=cv.getContext("2d");
  x.fillStyle=["#07111f","#101b38","#102a43","#24154f","#111827"][n%5];x.fillRect(0,0,640,360);
  x.fillStyle="#fff";x.font="bold 34px Arial";x.fillText("🎬 I.M.A FILMES",30,70);
  x.font="bold 24px Arial";x.fillText(String(title||"I.M.A FILMES").slice(0,30),30,135);
  x.fillStyle="#93c5fd";x.font="16px Arial";x.fillText("Marketplace Digital",30,175);
  return cv.toDataURL("image/jpeg",.86);
}
function safeImageUrl(url,title){return !url||isBlobUrl(url)?fallbackCover(title):url}
function safeFileName(name){return String(name||"arquivo").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9._-]/g,"_")}
function nav(view){state.view=view;$("#sidebar")?.classList.remove("open");render()}
function navButton(view,icon,label){return `<button class="ima-nav-button ${state.view===view?"active":""}" data-view="${view}"><span class="ima-nav-icon">${icon}</span><span class="ima-nav-label">${label}</span><span class="ima-nav-arrow">›</span></button>`}

function renderNavigation(){
 const side=$("#sidebar");if(!side)return;
 side.innerHTML=`
 <div class="ima-sidebar-head"><div class="ima-logo">🎬</div><div><strong>I.M.A FILMES</strong><small>Marketplace Digital</small></div><button id="closeSidebar" class="icon-btn">×</button></div>
 <div class="ima-user-box"><div class="ima-avatar">👤</div><div><strong>${esc(state.profile?.name||state.user?.email||"Visitante")}</strong><small>${state.user?"Conta conectada":"Modo visitante"}</small></div></div>
 <nav class="ima-navigation">
 <div class="ima-nav-title">NAVEGAÇÃO</div>
 ${navButton("home","🏠","Início")}${navButton("films","🎬","Filmes")}${navButton("series","📺","Séries")}${navButton("anime","🍥","Anime")}${navButton("doramas","🌸","Doramas")}${navButton("ebooks","📚","E-books")}${navButton("favorites","❤️","Favoritos")}
 <div class="ima-nav-title">CRIADOR</div>
 ${navButton("publish","⬆️","Publicar conteúdo")}${navButton("products","🛍️","Meus produtos")}${navButton("profits","💰","Meus lucros")}${navButton("promote","🚀","Promover produtos")}${navButton("library","📥","Minha biblioteca")}
 <div class="ima-nav-title">CONTA</div>
 ${navButton("settings","⚙️","Configurações")}${navButton("admin","🛡️","Administrador")}
 </nav>
 <div class="ima-sidebar-footer"><div class="ima-online-status"><span class="${ONLINE?"online-dot":"offline-dot"}"></span>${ONLINE?"Sistema online":"Modo local"}</div><small>V10.1 • Marketplace digital</small></div>`;
 $("#closeSidebar")?.addEventListener("click",toggleMenu);
 $$(".ima-nav-button").forEach(b=>b.onclick=()=>nav(b.dataset.view));
}
function toggleMenu(){const s=$("#sidebar");if(s)s.classList.toggle("open")}

function card(item){
 const title=item.title||"Sem título", cover=safeImageUrl(item.cover_url||item.cover,title);
 const fav=state.favorites.has(item.id), price=Number(item.price||0), free=item.free===true||price===0;
 return `<article class="card"><div class="card-media"><img class="cover" src="${esc(cover)}" alt="${esc(title)}" loading="lazy"><span class="card-type">${esc(item.type||"Conteúdo")}</span><span class="price ${free?"free":""}">${free?"GRÁTIS":price.toLocaleString("pt-AO")+" Kz"}</span></div><div class="cardbody"><h3>${esc(title)}</h3><div class="meta">${esc(item.profiles?.name||item.ownerName||"")} ${item.year?"• "+esc(item.year):""}</div><p class="desc">${esc(item.description||"Conteúdo disponível na I.M.A FILMES.")}</p><div class="actions"><button class="ima-btn ima-btn-primary" data-play="${esc(item.id)}">▶ Assistir</button><button class="ima-btn ima-btn-icon" data-fav="${esc(item.id)}">${fav?"❤️":"♡"}</button><button class="ima-btn ima-btn-icon" data-dl="${esc(item.id)}">↓</button><button class="ima-btn ima-btn-icon" data-share="${esc(item.id)}">↗</button></div></div></article>`
}
function empty(msg){return `<div class="empty" style="grid-column:1/-1"><div style="font-size:48px">🎬</div><h3>${esc(msg)}</h3><p>Explore a I.M.A FILMES ou publique seu próprio conteúdo.</p><button class="ima-btn ima-btn-primary" onclick="nav('publish')">⬆ Publicar conteúdo</button></div>`}
function bindCards(){
 $$("[data-play]").forEach(b=>b.onclick=()=>play(b.dataset.play));
 $$("[data-fav]").forEach(b=>b.onclick=()=>toggleFav(b.dataset.fav));
 $$("[data-dl]").forEach(b=>b.onclick=()=>download(b.dataset.dl));
 $$("[data-share]").forEach(b=>b.onclick=()=>share(b.dataset.share));
}
function filtered(kind=null){
 let a=[...state.contents].filter(x=>x&&x.status!=="removed");
 if(kind==="films")a=a.filter(x=>/filme/i.test(x.type||""));
 if(kind==="series")a=a.filter(x=>/s[ée]rie/i.test(x.type||""));
 if(kind==="anime")a=a.filter(x=>/anime/i.test(x.type||""));
 if(kind==="doramas")a=a.filter(x=>/dorama/i.test(x.type||""));
 if(kind==="ebooks")a=a.filter(x=>/e-?book/i.test(x.type||""));
 if(kind==="favorites")a=a.filter(x=>state.favorites.has(x.id));
 const q=state.query.trim().toLowerCase();
 if(q)a=a.filter(x=>[x.title,x.description,x.type].filter(Boolean).join(" ").toLowerCase().includes(q));
 return a;
}
function homePage(){
 const a=filtered(),m=$("#main");if(!m)return;
 m.innerHTML=`<section class="hero"><div class="hero-overlay"><span class="badge">🎬 MARKETPLACE DIGITAL</span><h1>I.M.A FILMES</h1><p>Assista, publique e venda seus conteúdos digitais.</p><div class="actions"><button id="heroPublish" class="ima-btn ima-btn-primary">⬆ Publicar conteúdo</button><button id="heroExplore" class="ima-btn">🎬 Explorar</button></div><p class="small">${ONLINE?"☁️ Plataforma online conectada":"💾 Modo local"}</p></div></section><div class="sectionhead"><h2>🎬 Conteúdos em destaque</h2><span class="meta">${a.length} conteúdo(s)</span></div><div class="grid">${a.length?a.slice(0,12).map(card).join(""):empty("Ainda não há conteúdos publicados.")}</div>`;
 $("#heroPublish")?.addEventListener("click",()=>nav("publish"));$("#heroExplore")?.addEventListener("click",()=>nav("films"));bindCards();
}
function catalog(kind){
 const names={films:"🎬 Filmes",series:"📺 Séries",anime:"🍥 Anime",doramas:"🌸 Doramas",ebooks:"📚 E-books",favorites:"❤️ Favoritos"},a=filtered(kind),m=$("#main");if(!m)return;
 m.innerHTML=`<div class="sectionhead"><div><h2>${names[kind]}</h2><div class="meta">Conteúdos disponíveis na plataforma</div></div><span class="meta">${a.length} item(ns)</span></div><div class="grid">${a.length?a.map(card).join(""):empty("Nenhum conteúdo encontrado.")}</div>`;bindCards();
}
function publishType(type,icon,label){return `<button type="button" class="publish-type ${type==="filme"?"selected":""}" data-type="${type}"><span>${icon}</span><strong>${label}</strong><small>Publicar ${label}</small></button>`}
function publishForm(type){
 const eb=type==="ebook";
 return `<div class="form-card"><div class="form-header"><div><h2>${typeIcon(type)} ${capitalize(type)}</h2><p>Preencha os dados do conteúdo.</p></div><span class="status-badge">NOVO</span></div>
 <label>Título<input id="pubTitle" maxlength="150" placeholder="Digite o título"></label>
 <label>Descrição<textarea id="pubDescription" rows="5" maxlength="3000" placeholder="Descreva seu conteúdo..."></textarea></label>
 <label>Capa<input id="pubCover" type="file" accept="image/*"><small>JPG ou PNG recomendado.</small></label>
 ${eb?`<label>Arquivo do e-book<input id="pubEbook" type="file" accept=".pdf,.epub"></label>`:`<label>Vídeo<input id="pubVideo" type="file" accept="video/*"></label>`}
 <h3>Tipo de acesso</h3><div class="access-buttons"><button type="button" class="access-btn selected" data-free="true">🟢 GRÁTIS</button><button type="button" class="access-btn" data-free="false">🔵 VENDER</button></div>
 <div id="priceArea" style="display:none"><label>Preço em Kz<input id="pubPrice" type="number" min="1" step="1" placeholder="Ex.: 1500"></label><div class="commission-info">💡 Comissão da plataforma: <strong>10%</strong></div></div>
 <button id="publishButton" class="ima-btn ima-btn-primary publish-main-button">⬆️ Publicar conteúdo</button><div id="publishStatus"></div></div>`
}
function typeIcon(t){return {filme:"🎬",série:"📺",anime:"🍥",dorama:"🌸",ebook:"📚"}[t]||"🎬"}
function capitalize(t){return String(t).charAt(0).toUpperCase()+String(t).slice(1)}
function publishPage(){
 const m=$("#main");if(!m)return;
 m.innerHTML=`<div class="page-title"><span class="page-icon">⬆️</span><div><h1>Publicar conteúdo</h1><p>Publique filmes, séries, anime, doramas ou e-books.</p></div></div><div class="publish-container"><div class="publish-choice"><h2>O que você deseja publicar?</h2><div class="publish-types">${publishType("filme","🎬","Filme")}${publishType("série","📺","Série")}${publishType("anime","🍥","Anime")}${publishType("dorama","🌸","Dorama")}${publishType("ebook","📚","E-book")}</div></div><div id="publishForm">${publishForm("filme")}</div></div>`;
 $$(".publish-type").forEach(b=>b.onclick=()=>{$$(".publish-type").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");$("#publishForm").innerHTML=publishForm(b.dataset.type);bindPublishForm()});bindPublishForm();
}
function bindPublishForm(){
 $$(".access-btn").forEach(b=>b.onclick=()=>{$$(".access-btn").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");$("#priceArea").style.display=b.dataset.free==="false"?"block":"none"});
 $("#publishButton")?.addEventListener("click",publishCurrent);
}
async function publishCurrent(){
 const title=$("#pubTitle")?.value.trim(),description=$("#pubDescription")?.value.trim(),type=$(".publish-type.selected")?.dataset.type||"filme",free=$(".access-btn.selected")?.dataset.free!=="false",price=free?0:Number($("#pubPrice")?.value||0);
 const cover=$("#pubCover")?.files?.[0]||null,video=$("#pubVideo")?.files?.[0]||null,ebook=$("#pubEbook")?.files?.[0]||null;
 if(!title)return toast("Digite o título.");if(!free&&price<=0)return toast("Informe um preço válido.");
 if(type==="ebook"&&!ebook)return toast("Selecione o e-book.");if(type!=="ebook"&&!video)return toast("Selecione o vídeo.");
 try{ONLINE&&state.user?await publishOnline({type,title,description,free,price,cover,video,ebook}):await publishLocal({type,title,description,free,price,cover,video,ebook});toast("✅ Conteúdo publicado!");nav("products")}catch(e){console.error(e);toast("❌ Erro ao publicar: "+(e.message||""))}
}
async function uploadPublic(bucket,path,file){const r=await sb.storage.from(bucket).upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false});if(r.error)throw r.error;return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl}
async function uploadPrivate(bucket,path,file){const r=await sb.storage.from(bucket).upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false});if(r.error)throw r.error;return path}
async function publishOnline(d){
 const id=uid(),coverUrl=d.cover?await uploadPublic(C.STORAGE_COVER_BUCKET||"capas",`${state.user.id}/${id}-${safeFileName(d.cover.name)}`,d.cover):fallbackCover(d.title);
 let ebookPath=null;if(d.ebook)ebookPath=await uploadPrivate(C.STORAGE_EBOOK_BUCKET||"ebooks",`${state.user.id}/${id}-${safeFileName(d.ebook.name)}`,d.ebook);
 const {error}=await sb.from("contents").insert({id,owner_id:state.user.id,title:d.title,description:d.description,type:d.type,price:d.price,free:d.free,cover_url:coverUrl,ebook_url:ebookPath,status:"published"});if(error)throw error;
 if(d.video){const p=await uploadPrivate(C.STORAGE_VIDEO_BUCKET||"videos",`${state.user.id}/${id}-${safeFileName(d.video.name)}`,d.video);const e=await sb.from("episodes").insert({id:uid(),content_id:id,season:1,episode_number:1,title:d.title,video_url:p});if(e.error)throw e.error}
 await loadData();
}
function fileToDataUrl(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(file)})}
async function publishLocal(d){
 const item={id:uid(),owner_id:state.user?.id||"local",ownerName:state.profile?.name||"Meu perfil",title:d.title,description:d.description,type:d.type,price:d.price,free:d.free,status:"published",cover_url:d.cover?await fileToDataUrl(d.cover):fallbackCover(d.title),video_file:d.video?await fileToDataUrl(d.video):null,ebook_file:d.ebook?await fileToDataUrl(d.ebook):null,created_at:new Date().toISOString()};
 state.contents.unshift(item);saveLocal();
}
function productsPage(){const a=state.contents.filter(x=>x.owner_id===state.user?.id||(!ONLINE&&x.owner_id==="local")),m=$("#main");m.innerHTML=`<div class="page-title"><span class="page-icon">🛍️</span><div><h1>Meus produtos</h1><p>Gerencie seus conteúdos publicados.</p></div></div><div class="stats-row"><div class="stat-card">📦<strong>${a.length}</strong><small>Produtos</small></div><div class="stat-card">🟢<strong>${a.filter(x=>x.status==="published").length}</strong><small>Publicados</small></div><div class="stat-card">💰<strong>${a.filter(x=>Number(x.price||0)>0).length}</strong><small>À venda</small></div></div><div class="grid">${a.length?a.map(card).join(""):empty("Você ainda não publicou produtos.")}</div>`;bindCards()}
function profitsPage(){const a=state.transactions.filter(x=>x.seller_id===state.user?.id),gross=a.reduce((s,x)=>s+Number(x.amount||x.gross_amount||0),0),net=gross*.9,m=$("#main");m.innerHTML=`<div class="page-title"><span class="page-icon">💰</span><div><h1>Meus lucros</h1><p>Acompanhe vendas e receitas.</p></div></div><div class="stats-row"><div class="stat-card">💵<strong>${gross.toLocaleString("pt-AO")} Kz</strong><small>Vendas</small></div><div class="stat-card">📊<strong>${(gross*.1).toLocaleString("pt-AO")} Kz</strong><small>Comissão 10%</small></div><div class="stat-card">💰<strong>${net.toLocaleString("pt-AO")} Kz</strong><small>Receita estimada</small></div></div><div class="form-card"><h2>📈 Histórico de vendas</h2>${a.length?a.map(x=>`<div class="sale-row"><strong>${esc(x.contents?.title||x.title||"Venda")}</strong><span>${Number(x.amount||0).toLocaleString("pt-AO")} Kz</span></div>`).join(""):"<div class=\"empty\">Ainda não existem vendas.</div>"}</div>`}
function promotePage(){const m=$("#main");m.innerHTML=`<div class="page-title"><span class="page-icon">🚀</span><div><h1>Promover produtos</h1><p>Aumente a visibilidade dos seus produtos.</p></div></div><div class="promotion-grid"><div class="promotion-card">🚀<h2>Plano 7 dias</h2><strong class="promotion-price">800 Kz</strong><p>⏱ 7 dias • 🎬 2 vídeos</p><button class="ima-btn ima-btn-primary" onclick="toast('Plano selecionado. Envie o comprovativo conforme as instruções da plataforma.')">Promover agora</button></div><div class="promotion-card">🚀<h2>Plano 1 mês</h2><strong class="promotion-price">1.600 Kz</strong><p>⏱ 30 dias • 🎬 4 vídeos</p><button class="ima-btn ima-btn-primary" onclick="toast('Plano selecionado. Envie o comprovativo conforme as instruções da plataforma.')">Promover agora</button></div></div><div class="form-card"><h3>💳 Pagamento</h3><p>Multicaixa Express ou transferência bancária.</p></div>`}
function libraryPage(){const m=$("#main");m.innerHTML=`<div class="page-title"><span class="page-icon">📥</span><div><h1>Minha biblioteca</h1><p>Conteúdos adquiridos ou salvos.</p></div></div>${empty("Sua biblioteca ainda está vazia.")}`}
function settingsPage(){const m=$("#main");m.innerHTML=`<div class="page-title"><span class="page-icon">⚙️</span><div><h1>Configurações</h1><p>Gerencie sua conta e preferências.</p></div></div><div class="settings-grid"><div class="form-card"><h2>👤 Perfil</h2><label>Nome<input id="profileName" value="${esc(state.profile?.name||"")}" placeholder="Seu nome"></label><button class="ima-btn ima-btn-primary" onclick="saveProfile()">💾 Salvar perfil</button></div><div class="form-card"><h2>🔐 Conta</h2><p>${esc(state.user?.email||"Visitante")}</p>${state.user?`<button class="ima-btn" onclick="logout()">🚪 Sair da conta</button>`:`<button class="ima-btn ima-btn-primary" onclick="loginModal()">🔐 Entrar</button>`}</div></div>`}
function adminPage(){const m=$("#main");m.innerHTML=`<div class="page-title"><span class="page-icon">🛡️</span><div><h1>Administrador</h1><p>Área administrativa da I.M.A FILMES.</p></div></div><div class="admin-warning">🔐 Área protegida<p>Acesso reservado ao administrador.</p><button class="ima-btn ima-btn-primary" onclick="adminLogin()">🛡️ Entrar no painel</button></div><div class="stats-row"><div class="stat-card">🎬<strong>${state.contents.length}</strong><small>Conteúdos</small></div><div class="stat-card">❤️<strong>${state.favorites.size}</strong><small>Favoritos</small></div><div class="stat-card">💳<strong>${state.transactions.length}</strong><small>Transações</small></div></div>`}
function render(){const m=$("#main");if(!m)return;renderNavigation();switch(state.view){case"films":catalog("films");break;case"series":catalog("series");break;case"anime":catalog("anime");break;case"doramas":catalog("doramas");break;case"ebooks":catalog("ebooks");break;case"favorites":catalog("favorites");break;case"publish":publishPage();break;case"products":productsPage();break;case"profits":profitsPage();break;case"promote":promotePage();break;case"library":libraryPage();break;case"settings":settingsPage();break;case"admin":adminPage();break;default:homePage()}}
function setupSearch(){const s=$("#search");if(s)s.oninput=e=>{state.query=e.target.value;render()}}
async function loadData(){
 if(!ONLINE){loadLocal();return}
 try{
  const c=await sb.from("contents").select("*,profiles:owner_id(name)").neq("status","removed");
  if(!c.error)state.contents=(c.data||[]).filter(x=>!isBlobUrl(x.cover_url));
  if(state.user){
   const [f,p,t]=await Promise.all([sb.from("favorites").select("content_id").eq("user_id",state.user.id),sb.from("progress").select("*").eq("user_id",state.user.id),sb.from("transactions").select("*,contents(title)").or(`buyer_id.eq.${state.user.id},seller_id.eq.${state.user.id}`)]);
   if(!f.error)state.favorites=new Set((f.data||[]).map(x=>x.content_id));
   if(!p.error)(p.data||[]).forEach(x=>state.progress.set(x.content_id,x));
   if(!t.error)state.transactions=t.data||[];
  }
 }catch(e){console.warn("loadData:",e)}
}
async function loadProfile(){if(!sb||!state.user)return;try{const r=await sb.from("profiles").select("*").eq("id",state.user.id).maybeSingle();if(!r.error)state.profile=r.data||null}catch(e){console.warn(e)}}
async function initAuth(){
 if(!sb){render();return}
 const r=await sb.auth.getSession();state.user=r.data?.session?.user||null;
 if(state.user)await loadProfile();await loadData();render();
 sb.auth.onAuthStateChange(async(_event,session)=>{state.user=session?.user||null;if(state.user)await loadProfile();else state.profile=null;await loadData();render()});
}
function saveLocal(){try{localStorage.setItem("IMA_FILMES_V10_LOCAL",JSON.stringify(state.contents.map(x=>({...x,video_file:null,ebook_file:null})))}catch(e){console.warn(e)}}
function loadLocal(){try{const a=JSON.parse(localStorage.getItem("IMA_FILMES_V10_LOCAL")||"[]");state.contents=Array.isArray(a)?a:[]}catch(e){state.contents=[]}}
function loginModal(){openModal(`<div class="modal-professional"><div class="modal-icon">👤</div><h2>Entrar na I.M.A FILMES</h2><label>E-mail<input id="loginEmail" type="email" placeholder="seu@email.com"></label><label>Senha<input id="loginPassword" type="password" placeholder="Sua senha"></label><button class="ima-btn ima-btn-primary" onclick="performLogin()">🔐 Entrar</button><button class="ima-btn" onclick="registerModal()">📝 Criar conta</button></div>`)}
async function performLogin(){const email=$("#loginEmail")?.value.trim(),password=$("#loginPassword")?.value;if(!email||!password)return toast("Preencha e-mail e senha.");if(!sb)return toast("Supabase não está configurado.");const r=await sb.auth.signInWithPassword({email,password});if(r.error)return toast(r.error.message);closeModal();toast("✅ Login realizado.");}
function registerModal(){openModal(`<div class="modal-professional"><div class="modal-icon">📝</div><h2>Criar conta</h2><label>E-mail<input id="registerEmail" type="email"></label><label>Senha<input id="registerPassword" type="password"></label><button class="ima-btn ima-btn-primary" onclick="performRegister()">📝 Criar conta</button></div>`)}
async function performRegister(){const email=$("#registerEmail")?.value.trim(),password=$("#registerPassword")?.value;if(!email||!password)return toast("Preencha e-mail e senha.");if(password.length<6)return toast("A senha deve ter pelo menos 6 caracteres.");const r=await sb.auth.signUp({email,password});if(r.error)return toast(r.error.message);closeModal();toast("✅ Conta criada. Verifique o e-mail se necessário.")}
async function logout(){if(sb)await sb.auth.signOut();state.user=null;state.profile=null;state.favorites=new Set();nav("home");toast("Você saiu da conta.")}
async function saveProfile(){const name=$("#profileName")?.value.trim();if(!state.user)return toast("Entre na sua conta primeiro.");if(!name)return toast("Digite seu nome.");const r=await sb.from("profiles").upsert({id:state.user.id,name});if(r.error)return toast(r.error.message);state.profile={...(state.profile||{}),name};render();toast("✅ Perfil atualizado.")}
function adminLogin(){loginModal()}
async function toggleFav(id){if(!state.user)return loginModal();if(!sb)return toast("Entre na sua conta.");const exists=state.favorites.has(id);try{if(exists){const r=await sb.from("favorites").delete().eq("user_id",state.user.id).eq("content_id",id);if(r.error)throw r.error;state.favorites.delete(id)}else{const r=await sb.from("favorites").insert({user_id:state.user.id,content_id:id});if(r.error)throw r.error;state.favorites.add(id)}render()}catch(e){toast("Não foi possível atualizar favoritos.")}}
async function resolveVideoUrl(value){if(!value||isBlobUrl(value))return null;if(/^https?:\/\//i.test(value))return value;try{const r=await sb.storage.from(C.STORAGE_VIDEO_BUCKET||"videos").createSignedUrl(value,3600);if(r.error)throw r.error;return r.data.signedUrl}catch(e){console.warn(e);return null}}
async function play(id){
 const item=state.contents.find(x=>x.id===id);if(!item)return;
 if(item.video_file){openModal(`<video controls autoplay style="width:100%;border-radius:12px" src="${esc(item.video_file)}"></video>`);return}
 if(!sb)return toast("Este conteúdo precisa estar disponível no modo online.");
 const r=await sb.from("episodes").select("*").eq("content_id",id).order("season").order("episode_number").limit(1).maybeSingle();
 if(r.error||!r.data)return toast("Vídeo ainda não disponível.");
 const url=await resolveVideoUrl(r.data.video_url);if(!url)return toast("Não foi possível abrir o vídeo.");
 openModal(`<h2>${esc(item.title)}</h2><video controls autoplay style="width:100%;border-radius:12px;background:#000" src="${esc(url)}"></video>`);
}
async function download(id){
 const item=state.contents.find(x=>x.id===id);if(!item)return;
 let url=item.ebook_file||item.video_file||null;
 if(!url&&sb){const r=await sb.from("episodes").select("video_url").eq("content_id",id).limit(1).maybeSingle();if(!r.error&&r.data)url=await resolveVideoUrl(r.data.video_url)}
 if(!url)return toast("Arquivo para download não encontrado.");
 const a=document.createElement("a");a.href=url;a.download=safeFileName(item.title||"IMA-FILMES");a.target="_blank";document.body.appendChild(a);a.click();a.remove();
}
async function share(id){const item=state.contents.find(x=>x.id===id);if(!item)return;const url=location.href.split("#")[0]+"#content="+encodeURIComponent(id);try{await navigator.clipboard.writeText(url);toast("🔗 Link copiado.");}catch(e){prompt("Copie o link:",url)}}
$("#menuBtn")?.addEventListener("click",toggleMenu);
$("#settingsBtn")?.addEventListener("click",()=>nav("settings"));
$("#profileBtn")?.addEventListener("click",()=>state.user?nav("settings"):loginModal());
document.addEventListener("click",e=>{if(e.target.matches("[data-close-modal]"))closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
Object.assign(window,{nav,toggleMenu,closeModal,loginModal,registerModal,performLogin,performRegister,logout,saveProfile,adminLogin});
document.addEventListener("DOMContentLoaded",()=>{setupSearch();render();initAuth();console.log("✅ I.M.A FILMES V10.1 iniciado:",ONLINE?"ONLINE":"LOCAL")});
