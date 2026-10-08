const DBKEY='credicontafi_db_v3';
const money=n=>new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(Number(n||0));
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const today=()=>new Date().toISOString().slice(0,10);
let session=JSON.parse(localStorage.getItem('credicontafi_cliente_session')||'null');
let db=JSON.parse(localStorage.getItem(DBKEY)||'null')||{clients:[],credits:[],payments:[],credit_requests:[],products:[]};
function save(){localStorage.setItem(DBKEY,JSON.stringify(db))}
function loginView(){
document.getElementById('app').innerHTML=`<div class="login"><div class="login-card">
<img class="login-logo" src="logo.svg"><h1>Panel Cliente</h1><p class="muted">Consulta tus créditos, novedades y solicitudes.</p>
<form id="loginForm">
<div class="field"><label>DNI</label><input name="dni" inputmode="numeric" maxlength="8" required placeholder="Ingresa tu DNI"></div>
<div class="field" style="margin-top:10px"><label>Nombre completo</label><input name="name" required placeholder="Tal como figura en tu registro"></div>
<button class="btn primary" style="width:100%;margin-top:14px">Ingresar</button>
</form><div class="notice">Por seguridad, esta versión valida el DNI y nombre contra los clientes registrados en este dispositivo. Para consulta desde cualquier celular o PC necesitamos conectar el panel a Supabase.</div>
</div></div>`;
document.getElementById('loginForm').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));const c=db.clients.find(x=>String(x.dni||'').trim()===String(f.dni).trim()&&String(x.name||'').trim().toLowerCase()===String(f.name).trim().toLowerCase());if(!c){alert('No encontramos un cliente con esos datos.');return}session={clientId:c.id};localStorage.setItem('credicontafi_cliente_session',JSON.stringify(session));render('inicio')}}
function client(){return db.clients.find(c=>c.id===session?.clientId)}
function activeCredits(){return db.credits.filter(c=>c.client_id===session?.clientId&&!['PAGADO','ANULADO','CANCELADO'].includes(String(c.status||'').toUpperCase()))}
function paymentsFor(id){return db.payments.filter(p=>p.credit_id===id)}
function render(view='inicio'){
const c=client();if(!c){session=null;localStorage.removeItem('credicontafi_cliente_session');return loginView()}
document.getElementById('app').innerHTML=`<header class="top"><div class="topin"><div class="brand"><img src="logo.svg"><span>CREDICONTAFI</span></div><div class="user">Hola, ${esc(c.name)} · DNI ${esc(c.dni)} · <button class="btn" onclick="logout()">Salir</button></div></div></header>
<main><div class="hero"><h1>Hola, ${esc((c.name||'Cliente').split(' ')[0])} 👋</h1><p>Este es tu espacio personal para revisar tus créditos y solicitar uno nuevo.</p></div>
<nav class="nav">
<button class="${view==='inicio'?'active':''}" onclick="render('inicio')">🏠 Inicio</button>
<button class="${view==='novedades'?'active':''}" onclick="render('novedades')">📣 Novedades</button>
<button class="${view==='solicitar'?'active':''}" onclick="render('solicitar')">📝 Solicitar crédito</button>
<button class="${view==='simulador'?'active':''}" onclick="render('simulador')">🧮 Simulador</button>
<button class="${view==='creditos'?'active':''}" onclick="render('creditos')">💳 Mis créditos</button>
</nav><div id="content"></div></main>`;
const el=document.getElementById('content');({inicio:home,novedades:news,solicitar:request,simulador,creditos}[view]||home)(el)
}
function home(el){
const credits=activeCredits(), paid=credits.reduce((a,c)=>a+paymentsFor(c.id).reduce((x,p)=>x+Number(p.amount||0),0),0), original=credits.reduce((a,c)=>a+Number(c.amount||0),0);
el.innerHTML=`<div class="grid">
<div class="card"><div class="muted">Créditos activos</div><div class="metric">${credits.length}</div></div>
<div class="card"><div class="muted">Monto original</div><div class="metric">${money(original)}</div></div>
<div class="card"><div class="muted">Pagado registrado</div><div class="metric">${money(paid)}</div></div>
<div class="card"><div class="muted">Saldo estimado</div><div class="metric">${money(Math.max(0,original-paid))}</div></div></div>
<div class="section grid2"><div class="card"><h2>💳 Crédito activo</h2>${credits.length?credits.map(creditCard).join(''):'<div class="empty">No tienes créditos activos registrados.</div>'}</div>
<div class="card"><h2>📣 Novedades</h2><div class="news">${newsItems().slice(0,3).map(n=>`<article><div class="date">${n.date}</div><h3>${n.title}</h3><p class="muted">${n.text}</p></article>`).join('')}</div></div></div>`
}
function creditCard(c){const pays=paymentsFor(c.id),paid=pays.reduce((a,p)=>a+Number(p.amount||0),0),saldo=Math.max(0,Number(c.amount||0)-paid),quota=Number(c.installment_amount||c.estimated_payment||0);return `<div class="card" style="margin-bottom:10px;background:#f8fafc"><div style="display:flex;justify-content:space-between;gap:8px"><b>Expediente ${esc(c.file_no||'—')}</b><span class="badge ok">${esc(c.status||'VIGENTE')}</span></div><p class="muted">${esc(c.product_name||'Crédito')} · ${c.installments||'—'} cuotas</p><div class="grid"><div><span class="muted">Monto</span><br><b>${money(c.amount)}</b></div><div><span class="muted">Cuota</span><br><b>${quota?money(quota):'—'}</b></div><div><span class="muted">Pagado</span><br><b>${money(paid)}</b></div><div><span class="muted">Saldo</span><br><b>${money(saldo)}</b></div></div><div class="actions"><button class="btn primary" onclick="render('creditos')">Ver detalle</button></div></div>`}
function newsItems(){return[
{date:'Información',title:'Nuevos productos de crédito',text:'Consulta las condiciones de los productos disponibles y elige el que mejor se adapte a tu necesidad.'},
{date:'Atención al cliente',title:'Solicita tu crédito en línea',text:'Puedes registrar una solicitud desde tu panel para que sea revisada por CREDICONTAFI.'},
{date:'Consejo financiero',title:'Mantén tus cuotas al día',text:'Revisar tu cronograma y pagar oportunamente ayuda a mantener un buen historial.'}
]}
function news(el){el.innerHTML=`<h2>Novedades</h2><div class="news">${newsItems().map(n=>`<article><div class="date">${n.date}</div><h3>${n.title}</h3><p class="muted">${n.text}</p></article>`).join('')}</div>`}
function request(el){
const products=(db.products||[]).filter(p=>p.active!==false);
el.innerHTML=`<div class="card"><h2>📝 Solicitar crédito</h2><p class="muted">Completa los datos. La solicitud quedará registrada para evaluación; no significa aprobación automática.</p>
<form id="requestForm" class="form"><div class="field"><label>Producto</label><select name="product_id" id="reqProduct"><option value="">Seleccionar producto</option>${products.map(p=>`<option value="${p.id}">${esc(p.name)} · ${Number(p.monthly_rate||0)}% mensual</option>`).join('')}</select></div>
<div class="field"><label>Monto solicitado (S/)</label><input name="amount" type="number" min="1" step="0.01" required></div>
<div class="field"><label>Plazo (meses)</label><input name="term" type="number" min="1" required></div>
<div class="field"><label>Destino del crédito</label><select name="purpose" required><option value="">Seleccionar</option><option>Capital de trabajo</option><option>Compra de mercadería</option><option>Activo fijo</option><option>Consumo</option><option>Emergencia</option><option>Otro</option></select></div>
<div class="field full"><label>Comentario</label><textarea name="notes" rows="3" placeholder="Cuéntanos brevemente para qué necesitas el crédito"></textarea></div></form>
<div class="actions"><button class="btn primary" onclick="submitRequest()">Enviar solicitud</button></div></div>
<div id="requestMsg" class="notice hidden"></div>`
}
function submitRequest(){
const f=document.getElementById('requestForm');if(!f.reportValidity())return;const data=Object.fromEntries(new FormData(f));const product=(db.products||[]).find(p=>p.id===data.product_id);const row={id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(36),client_id:session.clientId,product_id:data.product_id||null,amount:Number(data.amount),term_months:Number(data.term),interest_rate:Number(product?.monthly_rate||0),purpose:data.purpose,notes:data.notes,status:'PENDIENTE_APROBACION',created_at:new Date().toISOString()};db.credit_requests=db.credit_requests||[];db.credit_requests.push(row);save();const msg=document.getElementById('requestMsg');msg.classList.remove('hidden');msg.textContent='Solicitud enviada correctamente. Quedará pendiente de evaluación y aprobación por CREDICONTAFI.';f.reset()
}
function simulador(el){
const products=(db.products||[]).filter(p=>p.active!==false);
el.innerHTML=`<div class="card"><h2>🧮 Simulador de crédito</h2><p class="muted">Resultado referencial. La aprobación y condiciones finales dependen de la evaluación.</p><form id="simForm" class="form">
<div class="field"><label>Producto</label><select id="simProduct">${products.map(p=>`<option value="${p.id}">${esc(p.name)} · ${Number(p.monthly_rate||0)}% mensual</option>`).join('')}</select></div>
<div class="field"><label>Monto (S/)</label><input id="simAmount" type="number" min="1" step="0.01" value="5000"></div>
<div class="field"><label>Plazo (meses)</label><input id="simTerm" type="number" min="1" value="12"></div>
<div class="field"><label>Tasa mensual (%)</label><input id="simRate" type="number" min="0" step="0.01" value="${Number(products[0]?.monthly_rate||0)}"></div>
</form><div class="actions"><button class="btn primary" onclick="calculate()">Calcular</button></div></div><div id="simResult" class="section"></div>`;
document.getElementById('simProduct').onchange=e=>{const p=products.find(x=>x.id===e.target.value);document.getElementById('simRate').value=Number(p?.monthly_rate||0)}
calculate()
}
function calculate(){const A=Number(document.getElementById('simAmount').value||0),n=Number(document.getElementById('simTerm').value||0),r=Number(document.getElementById('simRate').value||0)/100;let cuota=r?A*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):(n?A/n:0);const total=cuota*n,interest=Math.max(0,total-A);document.getElementById('simResult').innerHTML=`<div class="grid"><div class="card"><div class="muted">Cuota mensual estimada</div><div class="metric">${money(cuota)}</div></div><div class="card"><div class="muted">Monto solicitado</div><div class="metric">${money(A)}</div></div><div class="card"><div class="muted">Interés estimado</div><div class="metric">${money(interest)}</div></div><div class="card"><div class="muted">Total estimado</div><div class="metric">${money(total)}</div></div></div>`}
function creditos(el){
const credits=activeCredits();
if(!credits.length){el.innerHTML='<div class="card empty">No tienes créditos activos registrados.</div>';return}
el.innerHTML=`<h2>💳 Mis créditos activos</h2>${credits.map(c=>{const pays=paymentsFor(c.id),paid=pays.reduce((a,p)=>a+Number(p.amount||0),0),saldo=Math.max(0,Number(c.amount||0)-paid),quota=Number(c.installment_amount||c.estimated_payment||0);return `<div class="card section"><div style="display:flex;justify-content:space-between;gap:8px"><div><h2>${esc(c.file_no||'Crédito activo')}</h2><p class="muted">${esc(c.product_name||'Producto de crédito')}</p></div><span class="badge ok">${esc(c.status||'VIGENTE')}</span></div><div class="grid"><div><span class="muted">Monto original</span><br><b>${money(c.amount)}</b></div><div><span class="muted">Cuota</span><br><b>${quota?money(quota):'No registrada'}</b></div><div><span class="muted">Pagado</span><br><b>${money(paid)}</b></div><div><span class="muted">Saldo</span><br><b>${money(saldo)}</b></div></div><div class="section tablewrap"><table class="table"><thead><tr><th>Fecha</th><th>Monto pagado</th><th>Método</th><th>Referencia</th></tr></thead><tbody>${pays.map(p=>`<tr><td>${esc(p.date)}</td><td>${money(p.amount)}</td><td>${esc(p.method||'—')}</td><td>${esc(p.reference||'—')}</td></tr>`).join('')||'<tr><td colspan="4">Aún no hay pagos registrados.</td></tr>'}</tbody></table></div></div>`}).join('')}`
}
function logout(){session=null;localStorage.removeItem('credicontafi_cliente_session');loginView()}
(function(){session&&client()?render('inicio'):loginView()})()
