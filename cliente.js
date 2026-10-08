const money=n=>new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(Number(n||0));
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const SUP=window.CREDICONTAFI_SUPABASE||{};
const supabase=window.supabase?.createClient(SUP.url,SUP.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let state={user:null,client:null,credits:[],payments:[],installments:[],products:[],documents:[],view:'inicio'};

function msg(t){const x=document.getElementById('msg');if(x)x.textContent=t||''}
function loginView(){
 document.getElementById('app').innerHTML=`<div class="login"><div class="login-card">
 <img class="login-logo" src="logo.svg"><h1>Panel Cliente</h1>
 <p class="muted">Ingresa con tu correo y contraseña.</p>
 <div class="tabs"><button class="btn primary" id="tabLogin">Ingresar</button><button class="btn" id="tabSignup">Crear cuenta</button></div>
 <div id="authbox"></div><div id="msg" class="notice hidden"></div>
 </div></div>`;
 document.getElementById('tabLogin').onclick=loginForm;
 document.getElementById('tabSignup').onclick=signupForm;
 loginForm();
}
function loginForm(){
 document.getElementById('authbox').innerHTML=`<form id="loginForm">
 <div class="field"><label>Correo electrónico</label><input name="email" type="email" autocomplete="email" required></div>
 <div class="field" style="margin-top:10px"><label>Contraseña</label><input name="password" type="password" autocomplete="current-password" required></div>
 <button class="btn primary" style="width:100%;margin-top:14px">Ingresar</button>
 </form>`;
 document.getElementById('loginForm').onsubmit=doLogin;
}
function signupForm(){
 document.getElementById('authbox').innerHTML=`<form id="signupForm">
 <div class="field"><label>DNI</label><input name="dni" inputmode="numeric" maxlength="8" required></div>
 <div class="field"><label>Nombres y apellidos completos</label><input name="full_name" required></div>
 <div class="field"><label>Correo electrónico</label><input name="email" type="email" required></div>
 <div class="field"><label>Contraseña</label><input name="password" type="password" minlength="6" required></div>
 <button class="btn primary" style="width:100%;margin-top:14px">Crear cuenta</button>
 <p class="muted" style="margin-top:10px">El DNI y nombre deben coincidir con un cliente que ya tenga un crédito registrado.</p>
 </form>`;
 document.getElementById('signupForm').onsubmit=doSignup;
}
async function doLogin(e){
 e.preventDefault();msg('Verificando acceso...');
 const f=Object.fromEntries(new FormData(e.target));
 const {error}=await supabase.auth.signInWithPassword({email:f.email.trim(),password:f.password});
 if(error){msg(error.message||'Correo o contraseña incorrectos.');return}
 await boot();
}
async function doSignup(e){
 e.preventDefault();msg('Validando datos y creando cuenta...');
 const f=Object.fromEntries(new FormData(e.target));
 const {error}=await supabase.auth.signUp({email:f.email.trim(),password:f.password,options:{data:{dni:f.dni.trim(),full_name:f.full_name.trim()},emailRedirectTo:location.origin+location.pathname}});
 if(error){msg(error.message||'No se pudo crear la cuenta.');return}
 const {data}=await supabase.auth.getSession();
 if(!data.session){msg('Cuenta creada. Revisa tu correo para confirmar la cuenta y luego ingresa.');return}
 await boot();
}
async function boot(){
 msg('');
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user){loginView();return}
 state.user=user;
 const {data,error:e}=await supabase.rpc('get_client_portal');
 if(e){msg('La autenticación funciona, pero falta activar la configuración SQL del Portal Cliente en Supabase.');console.error(e);return}
 state.client=e?null:data?.client||null;
 state.credits=data?.credits||[];
 state.payments=data?.payments||[];
 state.installments=data?.installments||[];
 state.products=data?.products||[];
 state.documents=data?.documents||[];
 if(!state.client){await supabase.auth.signOut();msg('No se encontró una cuenta de cliente vinculada.');loginView();return}
 render('inicio');
}
function render(view='inicio'){
 state.view=view;
 const c=state.client;
 document.getElementById('app').innerHTML=`<header class="top"><div class="topin"><div class="brand"><img src="logo.svg"><span>CREDICONTAFI</span></div><div class="user">Hola, ${esc(c.name)} · <button class="btn" id="logout">Salir</button></div></div></header>
 <main><div class="hero"><h1>Hola, ${esc((c.name||'Cliente').split(' ')[0])} 👋</h1><p>Tu espacio personal para revisar tus créditos y solicitar uno nuevo.</p></div>
 <nav class="nav">
 <button class="${view==='inicio'?'active':''}" onclick="render('inicio')">🏠 Inicio</button>
 <button class="${view==='novedades'?'active':''}" onclick="render('novedades')">📣 Novedades</button>
 <button class="${view==='solicitar'?'active':''}" onclick="render('solicitar')">📝 Solicitar crédito</button>
 <button class="${view==='simulador'?'active':''}" onclick="render('simulador')">🧮 Simulador</button>
 <button class="${view==='creditos'?'active':''}" onclick="render('creditos')">💳 Mis créditos</button>
 </nav><div id="content"></div></main>`;
 document.getElementById('logout').onclick=logout;
 ({inicio:home,novedades:news,solicitar:request,simulador,creditos}[view]||home)(document.getElementById('content'));
}
function activeCredits(){return state.credits.filter(c=>!['PAGADO','ANULADO','CANCELADO'].includes(String(c.status||'').toUpperCase()))}
function paymentsFor(id){return state.payments.filter(p=>String(p.credit_id)===String(id))}
function installmentsFor(id){return state.installments.filter(p=>String(p.credit_id)===String(id))}
function home(el){
 const credits=activeCredits(),paid=state.payments.reduce((a,p)=>a+Number(p.amount||0),0),original=credits.reduce((a,c)=>a+Number(c.amount||0),0);
 el.innerHTML=`<div class="grid"><div class="card"><div class="muted">Créditos activos</div><div class="metric">${credits.length}</div></div><div class="card"><div class="muted">Monto original</div><div class="metric">${money(original)}</div></div><div class="card"><div class="muted">Pagado registrado</div><div class="metric">${money(paid)}</div></div><div class="card"><div class="muted">Saldo estimado</div><div class="metric">${money(Math.max(0,original-paid))}</div></div></div>
 <div class="section grid2"><div class="card"><h2>💳 Crédito activo</h2>${credits.length?credits.map(creditCard).join(''):'<div class="empty">No tienes créditos activos registrados.</div>'}</div>
 <div class="card"><h2>📣 Novedades</h2><div class="news">${newsItems().map(n=>`<article><div class="date">${n.date}</div><h3>${n.title}</h3><p class="muted">${n.text}</p></article>`).join('')}</div></div></div>`;
}
function creditCard(c){const pays=paymentsFor(c.id),paid=pays.reduce((a,p)=>a+Number(p.amount||0),0),saldo=Math.max(0,Number(c.amount||0)-paid),quota=Number(c.installment_amount||c.estimated_payment||0);return `<div class="card" style="margin-bottom:10px;background:#f8fafc"><div style="display:flex;justify-content:space-between;gap:8px"><b>Expediente ${esc(c.file_no||'—')}</b><span class="badge ok">${esc(c.status||'VIGENTE')}</span></div><p class="muted">${esc(c.product_name||'Crédito')} · ${c.installments||'—'} cuotas</p><div class="grid"><div><span class="muted">Monto</span><br><b>${money(c.amount)}</b></div><div><span class="muted">Cuota</span><br><b>${quota?money(quota):'—'}</b></div><div><span class="muted">Pagado</span><br><b>${money(paid)}</b></div><div><span class="muted">Saldo</span><br><b>${money(saldo)}</b></div></div></div>`}
function newsItems(){return[
{date:'Información',title:'Nuevos productos de crédito',text:'Consulta las condiciones de los productos disponibles.'},
{date:'Atención al cliente',title:'Solicita tu crédito en línea',text:'Registra una solicitud desde tu panel para evaluación.'},
{date:'Consejo financiero',title:'Mantén tus cuotas al día',text:'Revisa tu cronograma y paga oportunamente.'}
]}
function news(el){el.innerHTML=`<h2>Novedades</h2><div class="news">${newsItems().map(n=>`<article><div class="date">${n.date}</div><h3>${n.title}</h3><p class="muted">${n.text}</p></article>`).join('')}</div>`}
function request(el){
 const products=state.products||[];
 el.innerHTML=`<div class="card"><h2>📝 Solicitar crédito</h2><p class="muted">La solicitud quedará registrada para evaluación.</p><form id="requestForm" class="form">
 <div class="field"><label>Producto</label><select name="product_id" required><option value="">Seleccionar producto</option>${products.map(p=>`<option value="${p.id}">${esc(p.name)} · ${Number(p.monthly_rate||0)}% mensual</option>`).join('')}</select></div>
 <div class="field"><label>Monto solicitado (S/)</label><input name="amount" type="number" min="1" step="0.01" required></div>
 <div class="field"><label>Plazo (meses)</label><input name="term" type="number" min="1" required></div>
 <div class="field"><label>Destino</label><select name="purpose" required><option value="">Seleccionar</option><option>Capital de trabajo</option><option>Compra de mercadería</option><option>Activo fijo</option><option>Consumo</option><option>Emergencia</option><option>Otro</option></select></div>
 <div class="field full"><label>Comentario</label><textarea name="notes" rows="3"></textarea></div>
 </form><div class="actions"><button class="btn primary" id="sendRequest">Enviar solicitud</button></div><div id="requestMsg" class="notice hidden"></div></div>`;
 document.getElementById('sendRequest').onclick=submitRequest;
}
async function submitRequest(){
 const f=document.getElementById('requestForm');if(!f.reportValidity())return;
 const d=Object.fromEntries(new FormData(f));
 const {error}=await supabase.rpc('submit_client_credit_request',{p_product_id:d.product_id,p_amount:Number(d.amount),p_term_months:Number(d.term),p_purpose:d.purpose,p_notes:d.notes||''});
 const m=document.getElementById('requestMsg');m.classList.remove('hidden');
 if(error)m.textContent=error.message||'No se pudo enviar la solicitud.';else{m.textContent='Solicitud enviada correctamente.';f.reset()}
}
function simulador(el){
 const products=state.products||[];
 el.innerHTML=`<div class="card"><h2>🧮 Simulador de crédito</h2><p class="muted">Resultado referencial.</p><form id="simForm" class="form"><div class="field"><label>Producto</label><select id="simProduct">${products.map(p=>`<option value="${p.id}">${esc(p.name)} · ${Number(p.monthly_rate||0)}% mensual</option>`).join('')}</select></div><div class="field"><label>Monto (S/)</label><input id="simAmount" type="number" min="1" value="5000"></div><div class="field"><label>Plazo (meses)</label><input id="simTerm" type="number" min="1" value="12"></div><div class="field"><label>Tasa mensual (%)</label><input id="simRate" type="number" min="0" step="0.01" value="${Number(products[0]?.monthly_rate||0)}"></div></form><div class="actions"><button class="btn primary" id="calc">Calcular</button></div></div><div id="simResult" class="section"></div>`;
 document.getElementById('simProduct').onchange=e=>{const p=products.find(x=>String(x.id)===String(e.target.value));document.getElementById('simRate').value=Number(p?.monthly_rate||0)};
 document.getElementById('calc').onclick=calculate;calculate();
}
function calculate(){const A=Number(document.getElementById('simAmount').value||0),n=Number(document.getElementById('simTerm').value||0),r=Number(document.getElementById('simRate').value||0)/100;const cuota=r?A*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):(n?A/n:0),total=cuota*n;document.getElementById('simResult').innerHTML=`<div class="grid"><div class="card"><div class="muted">Cuota mensual estimada</div><div class="metric">${money(cuota)}</div></div><div class="card"><div class="muted">Monto solicitado</div><div class="metric">${money(A)}</div></div><div class="card"><div class="muted">Interés estimado</div><div class="metric">${money(Math.max(0,total-A))}</div></div><div class="card"><div class="muted">Total estimado</div><div class="metric">${money(total)}</div></div></div>`}
function creditos(el){
 const credits=activeCredits();
 if(!credits.length){el.innerHTML='<div class="card empty">No tienes créditos activos registrados.</div>';return}
 el.innerHTML='<h2>💳 Mis créditos activos</h2>'+credits.map(c=>{const pays=paymentsFor(c.id),ins=installmentsFor(c.id),paid=pays.reduce((a,p)=>a+Number(p.amount||0),0),saldo=Math.max(0,Number(c.amount||0)-paid),quota=Number(c.installment_amount||c.estimated_payment||0);return `<div class="card section"><div style="display:flex;justify-content:space-between;gap:8px"><div><h2>${esc(c.file_no||'Crédito activo')}</h2><p class="muted">${esc(c.product_name||'Producto de crédito')}</p></div><span class="badge ok">${esc(c.status||'VIGENTE')}</span></div><div class="grid"><div><span class="muted">Monto original</span><br><b>${money(c.amount)}</b></div><div><span class="muted">Cuota</span><br><b>${quota?money(quota):'No registrada'}</b></div><div><span class="muted">Pagado</span><br><b>${money(paid)}</b></div><div><span class="muted">Saldo</span><br><b>${money(saldo)}</b></div></div><h3>Cronograma</h3><div class="tablewrap"><table class="table"><thead><tr><th>N.º</th><th>Vencimiento</th><th>Cuota</th><th>Estado</th></tr></thead><tbody>${ins.map(i=>`<tr><td>${esc(i.installment_number||i.number||'—')}</td><td>${esc(i.due_date||i.date||'—')}</td><td>${money(i.installment_amount||i.amount)}</td><td>${esc(i.status||'PENDIENTE')}</td></tr>`).join('')||'<tr><td colspan="4">No hay cronograma registrado.</td></tr>'}</tbody></table></div><h3>Pagos registrados</h3><div class="tablewrap"><table class="table"><thead><tr><th>Fecha</th><th>Monto</th><th>Método</th><th>Referencia</th></tr></thead><tbody>${pays.map(p=>`<tr><td>${esc(p.date||p.created_at||'')}</td><td>${money(p.amount)}</td><td>${esc(p.method||'—')}</td><td>${esc(p.reference||'—')}</td></tr>`).join('')||'<tr><td colspan="4">Aún no hay pagos registrados.</td></tr>'}</tbody></table></div></div>`}).join('');
}
async function logout(){await supabase.auth.signOut();state={user:null,client:null,credits:[],payments:[],installments:[],products:[],documents:[],view:'inicio'};loginView()}
(async()=>{if(!supabase){document.getElementById('app').innerHTML='<div class="login"><div class="login-card"><h2>Supabase no configurado</h2><p>Falta la configuración del Portal Cliente.</p></div></div>';return}const {data:{session}}=await supabase.auth.getSession();if(session)await boot();else loginView();supabase.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT')loginView()})})();