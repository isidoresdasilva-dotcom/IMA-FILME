const DB="IMA_FILMES_DB_V6", VER=1;
const stores=["conteudos","ebooks","promocoes","usuarios","transacoes"];
let db, currentUser=null, currentView="home", selectedCover=0;

function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,VER);r.onupgradeneeded=()=>{db=r.result;stores.forEach(s=>{if(!db.objectStoreNames.contains(s))db.createObjectStore(s,{keyPath:"id"})})};r.onsuccess=()=>{db=r.result;res(db)};r.onerror=()=>rej(r.error)})}
function tx(store,mode="readonly"){return db.transaction(store,mode).objectStore(store)}
function all(store){return new Promise((res,rej)=>{const r=tx(store).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}
function put(store,obj){return new Promise((res,rej)=>{const r=tx(store,"readwrite").put(obj);r.onsuccess=()=>res(obj);r.onerror=()=>rej(r.error)})}
function remove(store,id){return new Promise((res,rej)=>{const r=tx(store,"readwrite").delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
function get(store,id){return new Promise((res,rej)=>{const r=tx(store).get(id);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}

function fileToDataURL(file){return new Promise((res,rej)=>{if(!file)return res("");const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=()=>rej(fr.error);fr.readAsDataURL(file)})}
async function autoCovers(file,name){
  if(!file)return Array.from({length:5},(_,i)=>({label:"Capa "+(i+1),style:i}));
  const url=URL.createObjectURL(file), v=document.createElement("video");
  v.src=url;v.muted=true;v.preload="metadata";
  await new Promise(r=>{v.onloadedmetadata=()=>r();v.onerror=()=>r()});
  const duration=isFinite(v.duration)?v.duration:60, points=[.05,.2,.4,.6,.8], out=[];
  for(let i=0;i<5;i++){
    const t=Math.max(0,Math.min(duration-.1,duration*points[i]));
    await new Promise(r=>{v.currentTime=t;v.onseeked=()=>r()});
    const c=document.createElement("canvas");c.width=640;c.height=360;c.getContext("2d").drawImage(v,0,0,c.width,c.height);
    out.push({label:`Capa ${i+1}`,data:c.toDataURL("image/jpeg",.72),style:i});
  }
  URL.revokeObjectURL(url);return out
}
function coverHtml(item){
  if(item.cover)return `<div class="cover"><img src="${item.cover}" alt=""><span class="tag">${esc(item.kind)}</span>${item.price>0?`<span class="price">${Number(item.price).toLocaleString("pt-AO")} Kz`:`<span class="price">GRÁTIS</span>`}</div>`;
  const n=esc(item.title||item.name||"Conteúdo");
  return `<div class="cover"><div class="cover-art">${n}</div><span class="tag">${esc(item.kind||"Conteúdo")}</span>${item.price>0?`<span class="price">${Number(item.price).toLocaleString("pt-AO")} Kz`:`<span class="price">GRÁTIS</span>`}</div>`
}
function card(item){
  const isBook=item.kind==="E-book", bought=item.free||item.price<=0;
  return `<article class="card">${coverHtml(item)}<div class="card-body"><h3>${esc(item.title||item.name)}</h3><div class="meta">${esc(item.description||"Conteúdo publicado na I.M.A FILMES.")}</div><div class="card-actions"><button class="mini-btn primary" onclick="details('${item.id}','${isBook?'ebook':'content'}')">Ver</button>${!bought?`<button class="mini-btn" onclick="buy('${item.id}','${isBook?'ebook':'content'}')">Comprar</button>`:""}</div></div></article>`
}
async function render(){
  const q=document.getElementById("search").value.trim().toLowerCase();
  const contents=await all("conteudos"), books=(await all("ebooks")).map(x=>({...x,kind:"E-book"}));
  const combined=[...contents,...books].filter(x=>!q||(x.title||x.name||"").toLowerCase().includes(q)||(x.description||"").toLowerCase().includes(q));
  document.getElementById("homeGrid").innerHTML=combined.slice(0,6).map(card).join("")||empty("Ainda não há conteúdos publicados.");
  document.getElementById("newGrid").innerHTML=combined.slice(-6).reverse().map(card).join("")||empty("Publique o primeiro conteúdo.");
  await renderView(combined)
}
function empty(t){return `<div class="notice" style="grid-column:1/-1">${t}</div>`}
async function renderView(combined){
  const sections={movies:"catalogView",series:"catalogView",ebooks:"catalogView"};
  ["homeView","catalogView","showcaseView","purchasesView","salesView","adminView"].forEach(id=>document.getElementById(id).classList.add("hidden"));
  if(currentView==="home"){document.getElementById("homeView").classList.remove("hidden");return}
  if(currentView==="movies"||currentView==="series"||currentView==="ebooks"){
    document.getElementById("catalogView").classList.remove("hidden");
    const title={movies:"Filmes",series:"Séries",ebooks:"I.M.A E-books"}[currentView];
    document.getElementById("catalogTitle").textContent=title;document.getElementById("catalogEyebrow").textContent="CATÁLOGO";
    const arr=combined.filter(x=>currentView==="ebooks"?x.kind==="E-book":currentView==="movies"?x.kind==="Filme":x.kind==="Série");
    document.getElementById("catalogGrid").innerHTML=arr.map(card).join("")||empty("Nenhum conteúdo nesta categoria.");
  }
  if(currentView==="showcase")await renderShowcase();
  if(currentView==="purchases")await renderPurchases();
  if(currentView==="sales")await renderSales();
  if(currentView==="admin")await renderAdmin();
}
async function renderShowcase(){
  document.getElementById("showcaseView").classList.remove("hidden");
  const promos=await all("promocoes"), now=Date.now();
  const active=promos.filter(p=>p.status==="active"&&p.end>now);
  const contents=[...(await all("conteudos")),...(await all("ebooks")).map(x=>({...x,kind:"E-book"}))];
  const arr=active.map(p=>contents.find(c=>c.id===p.contentId)).filter(Boolean);
  document.getElementById("promoGrid").innerHTML=arr.map(card).join("")||empty("A vitrine está pronta. O administrador ainda não ativou promoções.");
}
async function renderPurchases(){
  document.getElementById("purchasesView").classList.remove("hidden");
  const user=currentUser||{id:"demo"};
  const ts=(await all("transacoes")).filter(t=>t.userId===user.id&&t.type==="purchase");
  const contents=[...(await all("conteudos")),...(await all("ebooks")).map(x=>({...x,kind:"E-book"}))];
  document.getElementById("purchaseGrid").innerHTML=ts.map(t=>contents.find(c=>c.id===t.contentId)).filter(Boolean).map(card).join("")||empty("As suas compras aparecerão aqui.");
}
async function renderSales(){
  document.getElementById("salesView").classList.remove("hidden");
  if(!currentUser){document.getElementById("salesGrid").innerHTML=empty("Entre como criador para ver as suas vendas.");document.getElementById("salesStats").innerHTML="";return}
  const mine=[...(await all("conteudos")),...(await all("ebooks"))].filter(x=>x.ownerId===currentUser.id);
  const sales=(await all("transacoes")).filter(t=>t.type==="purchase"&&mine.some(m=>m.id===t.contentId));
  const gross=sales.reduce((a,b)=>a+Number(b.amount||0),0), commission=gross*.10;
  document.getElementById("salesStats").innerHTML=`<div class="stat"><small>Conteúdos</small><strong>${mine.length}</strong></div><div class="stat"><small>Vendas</small><strong>${sales.length}</strong></div><div class="stat"><small>Bruto</small><strong>${gross.toLocaleString("pt-AO")} Kz</strong></div><div class="stat"><small>Saldo do criador</small><strong>${(gross-commission).toLocaleString("pt-AO")} Kz</strong></div>`;
  document.getElementById("salesGrid").innerHTML=mine.map(card).join("")||empty("Você ainda não publicou conteúdos.");
}
async function renderAdmin(){
  document.getElementById("adminView").classList.remove("hidden");
  if(!currentUser||currentUser.role!=="admin"){document.getElementById("adminStats").innerHTML=empty("Acesso reservado ao administrador.");document.getElementById("adminPromos").innerHTML="";document.getElementById("adminContents").innerHTML="";return}
  const c=await all("conteudos"),e=await all("ebooks"),p=await all("promocoes"),u=await all("usuarios");
  document.getElementById("adminStats").innerHTML=`<div class="stat"><small>Filmes/Séries</small><strong>${c.length}</strong></div><div class="stat"><small>E-books</small><strong>${e.length}</strong></div><div class="stat"><small>Usuários</small><strong>${u.length}</strong></div><div class="stat"><small>Promoções ativas</small><strong>${p.filter(x=>x.status==="active"&&x.end>Date.now()).length}</strong></div>`;
  document.getElementById("adminPromos").innerHTML=p.map(x=>`<div class="admin-row"><span>${esc(x.contentTitle)} — ${x.days} dias — ${Number(x.price).toLocaleString("pt-AO")} Kz<br><small>Status: ${esc(x.status)}</small></span>${x.status==="pending"?`<button class="mini-btn primary" onclick="activatePromo('${x.id}')">Confirmar pagamento</button>`:""}</div>`).join("")||"<p class='login-note'>Sem pedidos.</p>";
  document.getElementById("adminContents").innerHTML=[...c,...e].map(x=>`<div class="admin-row"><span><b>${esc(x.title||x.name)}</b> — ${esc(x.kind||"E-book")}</span><span>${x.price>0?Number(x.price).toLocaleString("pt-AO")+" Kz":"Grátis"}</span></div>`).join("")||"<p class='login-note'>Sem conteúdos.</p>"
}
function setView(v){currentView=v;document.querySelectorAll(".nav[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===v));render()}
function modal(html){document.getElementById("modalBody").innerHTML=html;document.getElementById("modal").classList.remove("hidden")}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
function auth(){
  modal(`<h2>Entrar / criar conta</h2><p class="login-note">Conta local do protótipo. Para produção, teremos autenticação segura no servidor.</p><div class="form-grid"><div class="field full"><label>E-mail</label><input id="email" type="email" placeholder="voce@email.com"></div><div class="field"><label>Senha</label><input id="pass" type="password"></div><div class="field"><label>Perfil</label><select id="role"><option value="cliente">Cliente</option><option value="criador">Criador</option><option value="admin">Administrador (demo)</option></select></div></div><div class="form-actions"><button class="btn primary" onclick="login()">Entrar / criar</button></div>`)
}
async function login(){
  const email=document.getElementById("email").value.trim().toLowerCase(), pass=document.getElementById("pass").value, role=document.getElementById("role").value;
  if(!email||!pass)return alert("Preencha e-mail e senha.");
  let users=await all("usuarios"),u=users.find(x=>x.email===email);
  if(!u){u={id:uid(),email,pass,role};await put("usuarios",u)}
  else if(u.pass!==pass)return alert("Senha incorreta.");
  currentUser=u;closeModal();alert("Sessão iniciada como "+u.role);render()
}
function publish(){
  if(!currentUser){auth();return}
  if(currentUser.role!=="criador"&&currentUser.role!=="admin"){return alert("Somente criadores e administradores podem publicar.")}
  modal(`<h2>Publicar conteúdo</h2><div class="form-grid">
  <div class="field"><label>Tipo</label><select id="kind" onchange="togglePublishFields()"><option>Filme</option><option>Série</option><option>E-book</option></select></div>
  <div class="field"><label>Nome / título</label><input id="title"></div>
  <div class="field full"><label>Descrição</label><textarea id="desc"></textarea></div>
  <div class="field"><label>Preço (Kz)</label><input id="price" type="number" min="0" value="0"></div>
  <div class="field"><label>Acesso</label><select id="free"><option value="1">Grátis</option><option value="0">Pago</option></select></div>
  <div class="field"><label>Parcelamento</label><select id="installments"><option>Não</option><option>Sim</option></select></div>
  <div class="field"><label>Link de venda</label><input id="link" placeholder="https://..."></div>
  <div class="field full"><label>Capa manual (opcional)</label><input id="coverFile" type="file" accept="image/*" onchange="previewCover(event)"></div>
  <div id="videoField" class="field full"><label>Vídeo</label><input id="videoFile" type="file" accept="video/*" onchange="makeCovers(event)"></div>
  <div id="seriesField" class="field full hidden"><label>Temporadas</label><input id="seasons" type="number" min="1" value="1"><label>Episódios por temporada</label><input id="episodes" type="number" min="1" value="10"></div>
  <div id="covers" class="field full"></div></div><div class="form-actions"><button class="btn primary" onclick="savePublish()">Publicar</button></div>`)
}
function togglePublishFields(){const k=document.getElementById("kind").value;document.getElementById("videoField").classList.toggle("hidden",k==="E-book");document.getElementById("seriesField").classList.toggle("hidden",k!=="Série")}
async function previewCover(e){window.manualCover=await fileToDataURL(e.target.files[0])}
async function makeCovers(e){
  const file=e.target.files[0];if(!file)return;
  window.coverCandidates=await autoCovers(file,document.getElementById("title").value);
  selectedCover=0;
  document.getElementById("covers").innerHTML=`<label>Escolha uma das 5 capas automáticas</label><div class="cover-options">${window.coverCandidates.map((c,i)=>`<button class="cover-choice ${i===0?"selected":""}" onclick="chooseCover(${i})"><div style="background:${c.data?`url('${c.data}') center/cover`:`linear-gradient(145deg,hsl(${i*55} 45% 30%),#090b0f)`}">${c.label}</div></button>`).join("")}</div>`
}
function chooseCover(i){selectedCover=i;document.querySelectorAll(".cover-choice").forEach((b,n)=>b.classList.toggle("selected",n===i))}
async function savePublish(){
  const kind=document.getElementById("kind").value,title=document.getElementById("title").value.trim(),desc=document.getElementById("desc").value.trim();
  if(!title)return alert("Informe o nome/título.");
  const free=document.getElementById("free").value==="1", price=free?0:Number(document.getElementById("price").value||0);
  const cover=window.manualCover||window.coverCandidates?.[selectedCover]?.data||"";
  if(kind==="E-book"){
    await put("ebooks",{id:uid(),title,description:desc,cover,price,free,installments:document.getElementById("installments").value==="Sim",link:document.getElementById("link").value.trim(),ownerId:currentUser.id,createdAt:Date.now(),kind:"E-book"});
  }else{
    const vf=document.getElementById("videoFile").files[0],video=vf?await fileToDataURL(vf):"";
    await put("conteudos",{id:uid(),kind,title,name:title,description:desc,cover,video,price,free,installments:document.getElementById("installments").value==="Sim",link:document.getElementById("link").value.trim(),ownerId:currentUser.id,seasons:kind==="Série"?Number(document.getElementById("seasons").value||1):0,episodesPerSeason:kind==="Série"?Number(document.getElementById("episodes").value||1):0,createdAt:Date.now()});
  }
  closeModal();alert("Conteúdo publicado com sucesso.");render()
}
async function details(id,type){
  const item=await get(type==="ebook"?"ebooks":"conteudos",id);if(!item)return;
  const price=item.price>0?Number(item.price).toLocaleString("pt-AO")+" Kz":"Grátis";
  modal(`<h2>${esc(item.title||item.name)}</h2>${coverHtml({...item,kind:item.kind||"E-book"})}<p>${esc(item.description||"")}</p><p><b>${price}</b> ${item.installments?"• Aceita parcelamento":""}</p>${item.kind==="Série"?`<p class="login-note">Temporadas: ${item.seasons||1} • Episódios por temporada: ${item.episodesPerSeason||1}</p>`:""}<div class="form-actions"><button class="btn primary" onclick="closeModal();${item.price>0?`buy('${item.id}','${type}')`:""}">${item.price>0?"Comprar":"Acessar conteúdo"}</button>${item.link?`<button class="btn" onclick="window.open('${esc(item.link)}','_blank')">Link de venda</button>`:""}</div>`)
}
async function buy(id,type){
  const item=await get(type==="ebook"?"ebooks":"conteudos",id);if(!item)return;
  if(item.price<=0)return alert("Conteúdo gratuito: acesso liberado.");
  if(!currentUser){auth();return}
  if(!confirm(`Compra DEMO: ${item.title||item.name} por ${item.price} Kz.\nNenhum dinheiro real será cobrado nesta versão. Continuar?`))return;
  await put("transacoes",{id:uid(),type:"purchase",userId:currentUser.id,contentId:id,amount:Number(item.price),createdAt:Date.now()});
  alert("Compra demo registada.");render()
}
async function requestPromo(){
  if(!currentUser){auth();return}
  const contents=[...(await all("conteudos")),...(await all("ebooks"))];
  modal(`<h2>Solicitar promoção</h2><p class="login-note">Escolha o seu conteúdo. O administrador confirma o pagamento e ativa a promoção.</p><div class="form-grid"><div class="field full"><label>Conteúdo</label><select id="promoContent">${contents.filter(x=>x.ownerId===currentUser.id).map(x=>`<option value="${x.id}">${esc(x.title||x.name)}</option>`).join("")}</select></div><div class="field full"><label>Plano</label><select id="promoDays"><option value="7">7 dias — 500 Kz</option><option value="14">14 dias — 1.000 Kz</option></select></div></div><div class="form-actions"><button class="btn primary" onclick="savePromo()">Enviar pedido</button></div>`)
}
async function savePromo(){
  const id=document.getElementById("promoContent").value,days=Number(document.getElementById("promoDays").value);
  if(!id)return alert("Publique um conteúdo primeiro.");
  const allc=[...(await all("conteudos")),...(await all("ebooks"))],c=allc.find(x=>x.id===id);
  await put("promocoes",{id:uid(),contentId:id,contentTitle:c.title||c.name,ownerId:currentUser.id,days,price:days===7?500:1000,status:"pending",createdAt:Date.now()});
  closeModal();alert("Pedido enviado ao administrador.");render()
}
async function activatePromo(id){
  const p=await get("promocoes",id);if(!p)return;
  p.status="active";p.start=Date.now();p.end=Date.now()+p.days*86400000;await put("promocoes",p);render()
}
async function seed(){
  const users=await all("usuarios");
  if(!users.some(u=>u.email==="admin@ima.local"))await put("usuarios",{id:uid(),email:"admin@ima.local",pass:"IMA1234",role:"admin"});
  const c=await all("conteudos");
  if(!c.length){
    await put("conteudos",{id:uid(),kind:"Filme",title:"Meu Filme",name:"Meu Filme",description:"Exemplo de filme para começar o catálogo.",cover:"",video:"",price:0,free:true,ownerId:"demo",createdAt:Date.now()});
    await put("conteudos",{id:uid(),kind:"Série",title:"Minha Série",name:"Minha Série",description:"Exemplo de série com temporadas e episódios.",cover:"",video:"",price:1500,free:false,seasons:1,episodesPerSeason:10,ownerId:"demo",createdAt:Date.now()});
  }
}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
document.querySelectorAll("[data-action='publish']").forEach(b=>b.addEventListener("click",publish));
document.getElementById("btnLogin").onclick=auth;
document.getElementById("btnAdmin").onclick=()=>setView("admin");
document.getElementById("closeModal").onclick=closeModal;
document.getElementById("modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});
document.getElementById("search").addEventListener("input",render);
openDB().then(seed).then(render).catch(e=>alert("Erro ao iniciar o armazenamento: "+e.message));
