const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],R=document.documentElement;
const fm=n=>'$ '+Math.round(n||0).toLocaleString('es-AR'),p2=n=>String(n).padStart(2,'0');
const hoy=()=>{const d=new Date();return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())};
const COL={Efectivo:'#8fd3b0',Transferencia:'#b9a8ec',QR:'#f4b896',Tarjeta:'#86c1e6'},MEDIOS=Object.keys(COL);
const err=e=>alert(String(e.message||e).replace(/^Error invoking remote method '[^']+': Error: /,''));
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let adm=false,prods=[],cat=null,mesa='Mostrador',tipo='local',ords={},ym=hoy().slice(0,7),selDay=hoy();
const cur=()=>ords[mesa]??={items:{},desc:0};
const sub=()=>Object.values(cur().items).reduce((a,i)=>a+i.n*i.precio,0),total=()=>Math.max(0,sub()-cur().desc);
function ask(title,fields,ok='Aceptar'){return new Promise(res=>{const d=$('#dlg');$('#dt').textContent=title;$('#dok').textContent=ok;
$('#df').innerHTML=fields.map((f,i)=>`<label>${f.l}${f.opts?`<select id="f${i}">${f.opts.map(o=>`<option value="${o[0]}"${o[0]==f.sel?' selected':''}>${o[1]}</option>`).join('')}</select>`:`<input id="f${i}" type="${f.t||'text'}" value="${f.v??''}">`}</label>`).join('');
d.onclose=()=>res(d.returnValue==='ok'?fields.map((f,i)=>$('#f'+i).value):null);d.showModal();$('#f0')&&$('#f0').focus()})}
function go(t,arg){$$('.tab').forEach(e=>e.classList.remove('on'));$('#'+t).classList.add('on');$('#back').style.display=t==='home'?'none':'';window.scrollTo(0,0);({home:rH,inicio:rI,caja:rC,stats:rS,cfg:rG,ventas:rV,viandas:rVi,stock:rSt,clientes:rCl,dia:rD})[t](arg)}
$$('[data-t]').forEach(b=>b.onclick=()=>go(b.dataset.t));$('#back').onclick=()=>go('home');
$('#lgn').onclick=async()=>{if(adm){adm=false}else{const r=await ask('Clave de administrador',[{l:'Clave',t:'password'}],'Entrar');if(!r)return;if(!await pilo.login(r[0]))return alert('Clave incorrecta');adm=true}
document.body.classList.toggle('adm',adm);$('#ses').textContent=(adm?'Administrador':'Empleado');$('#lgn').textContent=adm?'Cerrar sesión':'Entrar como administrador';go('home')};
// ---- Ventas
async function rV(){prods=await pilo.productos();const cats=[...new Set(prods.map(p=>p.categoria))];if(!cats.includes('Viandas'))cats.push('Viandas');cat=cats.includes(cat)?cat:cats[0];
$('#mesas').innerHTML=['Mostrador',...Array.from({length:8},(_,i)=>'Mesa '+(i+1)),'Afuera 1','Afuera 2'].map(m=>{const oc=ords[m]&&Object.keys(ords[m].items).length;return`<button class="mesa${oc?' oc':''}${m==mesa?' sel':''}" data-m="${m}">${m}<small>${oc?fm(Object.values(ords[m].items).reduce((a,i)=>a+i.n*i.precio,0)-ords[m].desc):'Libre'}</small></button>`}).join('');
$$('.mesa').forEach(b=>b.onclick=()=>{mesa=b.dataset.m;rV()});
$('#cats').innerHTML=cats.map(c=>`<button class="chip${c==cat?' on':''}">${c}</button>`).join('');$$('#cats .chip').forEach(b=>b.onclick=()=>{if(b.textContent==='Viandas')return nuevaVianda();cat=b.textContent;rV()});
$('#prods').innerHTML=prods.filter(p=>p.categoria==cat).map(p=>`<button class="prod" data-i="${p.id}">${p.nombre}<small>${fm(p.precio)}</small></button>`).join('');
$$('.prod').forEach(b=>b.onclick=()=>{const p=prods.find(x=>x.id==b.dataset.i),it=cur().items;it[p.id]=it[p.id]||{id:p.id,nombre:p.nombre,precio:p.precio,n:0};it[p.id].n++;rV()});
$('#tipos').innerHTML=[['local','En el local'],['llevar','Para llevar'],['delivery','Delivery']].map(t=>`<button class="chip${t[0]==tipo?' on':''}" data-t="${t[0]}">${t[1]}</button>`).join('');$$('#tipos .chip').forEach(b=>b.onclick=()=>{tipo=b.dataset.t;rV()});
$('#tt').textContent=mesa;const its=Object.values(cur().items);
$('#items').innerHTML=its.length?its.map(i=>`<div class="it" data-id="${i.id}"><span>${i.n} × ${i.nombre}</span><b>${fm(i.n*i.precio)}</b></div>`).join(''):'<span style="color:var(--mut)">Tocá un producto para agregarlo</span>';
$$('.it').forEach(e=>e.onclick=()=>{const it=cur().items[e.dataset.id];if(--it.n<=0)delete cur().items[e.dataset.id];rV()});
pilo.setConfig('cuentas',JSON.stringify(ords));$('#dsc').textContent=cur().desc?'Descuento: −'+fm(cur().desc):'';$('#tot').textContent=fm(total())}
async function cobrar(pagos,cid=null){const o=cur(),items=Object.values(o.items);if(!items.length)return alert('La cuenta está vacía');
try{await pilo.cobrar({mesa,tipo,descuento:o.desc,cliente_id:cid,items:items.map(i=>({producto_id:i.id,nombre:i.nombre,cantidad:i.n,precio:i.precio})),pagos});delete ords[mesa];rV()}catch(e){err(e)}}
$$('[data-m].btn').forEach(b=>b.onclick=()=>cobrar([{medio:b.dataset.m,monto:total()}]));
$('#bvac').onclick=()=>{delete ords[mesa];rV()};
$('#bdes').onclick=async()=>{const r=await ask('Descuento',[{l:'Porcentaje (%)',t:'number'},{l:'o monto en $',t:'number'}]);if(!r)return;cur().desc=Math.min(sub(),+r[1]||sub()*(+r[0]||0)/100);rV()};
$('#bdiv').onclick=async()=>{const r=await ask('Dividir pago · total '+fm(total()),MEDIOS.map(m=>({l:m,t:'number',v:0})));if(!r)return;cobrar(MEDIOS.map((m,i)=>({medio:m,monto:+r[i]||0})).filter(p=>p.monto>0))};
$('#bfia').onclick=async()=>{const cl=await pilo.deudaClientes();const r=await ask('Fiar a un cliente',[{l:'Cliente',opts:[['','— Cliente nuevo —'],...cl.map(c=>[c.id,`${c.nombre} (debe ${fm(c.deuda)})`])]},{l:'Nombre del cliente nuevo'}],'Fiar');if(!r)return;
let id=+r[0]||null;if(!id){if(!r[1].trim())return alert('Escribí el nombre del cliente');id=await pilo.cliente({nombre:r[1].trim()})}cobrar([{medio:'Fiado',monto:total()}],id)};
// ---- Inicio
async function rI(){const dias=await pilo.mes(ym),[y,m]=ym.split('-').map(Number),n=new Date(y,m,0).getDate(),off=(new Date(y,m-1,1).getDay()+6)%7;
const t=new Date(y,m-1,1).toLocaleDateString('es-AR',{month:'long',year:'numeric'});$('#mt').textContent=t[0].toUpperCase()+t.slice(1);
let I=0,E=0;const med={};Object.values(dias).forEach(d=>{I+=d.ingresos;E+=d.egresos;Object.entries(d.medios).forEach(([k,v])=>med[k]=(med[k]||0)+v)});$('#k1').textContent=fm(I);$('#k2').textContent=fm(E);$('#k3').textContent=fm(I-E);
let h=['L','M','M','J','V','S','D'].map(x=>`<div class="dh">${x}</div>`).join('')+'<div class="day emp"></div>'.repeat(off);
for(let d=1;d<=n;d++){const f=`${ym}-${p2(d)}`,x=dias[f];h+=`<button class="day${f==hoy()?' hoy':''}" data-f="${f}"><span>${d}</span>${x?`<b>${fm(x.ingresos)}</b>${x.egresos?`<i class="neg" style="font-style:normal">− ${fm(x.egresos)}</i>`:''}`:''}</button>`}
$('#cal').innerHTML=h;$$('.day[data-f]').forEach(b=>b.onclick=()=>go('dia',b.dataset.f));
$('#det').innerHTML=`<h3>Resumen del mes</h3><p class="small">Tocá un día del calendario para ver sus ventas y estadísticas</p>`+MEDIOS.map(k=>`<div class="pay"><span><i class="dot" style="background:${COL[k]}"></i>${k}</span><b>${fm(med[k])}</b></div>`).join('')+`<div class="pay"><b>Ganancia del mes</b><b>${fm(I-E)}</b></div>`}
const mv=k=>{const [y,m]=ym.split('-').map(Number),d=new Date(y,m-1+k,1);ym=d.getFullYear()+'-'+p2(d.getMonth()+1);selDay=ym+'-01';rI()};$('#pv').onclick=()=>mv(-1);$('#nx').onclick=()=>mv(1);
// ---- Caja y gastos
async function rC(){$('#hoyt').textContent=new Date().toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'});const c=await pilo.cajaHoy();
$('#cj').innerHTML=`<h3>Caja del día</h3>`+(!c.abierta?`<p class="small">La caja de hoy todavía no está abierta.</p><button class="btn" id="bab">Abrir caja</button>`:
`<div class="row"><span>Apertura</span><b>${fm(c.apertura)}</b></div><div class="row"><span>Efectivo cobrado</span><b>${fm(c.efectivo)}</b></div><div class="row"><span>Gastos en efectivo</span><b>− ${fm(c.gastosEf)}</b></div><div class="row"><span>Esperado en caja</span><b>${fm(c.esperado)}</b></div>`+
(c.cerrada?`<div class="row"><span>Contado al cierre</span><b>${fm(c.contado)}</b></div><div class="row"><span>Diferencia</span><b>${fm(c.contado-c.esperado)}</b></div>`:`<button class="btn" id="bce" style="margin-top:12px">Cerrar caja</button>`));
if($('#bab'))$('#bab').onclick=async()=>{const r=await ask('Abrir caja',[{l:'Efectivo inicial ($)',t:'number',v:0}]);if(r){await pilo.abrirCaja(+r[0]||0);rC()}};
if($('#bce'))$('#bce').onclick=async()=>{const r=await ask('Cerrar caja',[{l:'Efectivo contado ($)',t:'number',v:c.esperado}],'Cerrar');if(r){await pilo.cerrarCaja(+r[0]||0);rC()}};
const g=await pilo.gastosRecientes();$('#gl').innerHTML=g.length?g.map(x=>`<div class="row"><span>${x.fecha.slice(8)}/${x.fecha.slice(5,7)} · ${x.categoria}${x.proveedor?' · '+x.proveedor:''}</span><b>${fm(x.monto)}</b></div>`).join(''):'<p class="small">Todavía no hay gastos cargados.</p>';
const d=(await pilo.deudaClientes()).filter(x=>x.deuda>0);$('#dl').innerHTML=d.length?d.map(x=>`<div class="row"><span>${x.nombre}: <b>${fm(x.deuda)}</b></span><button class="btn s" data-c="${x.id}" data-d="${x.deuda}" style="width:90px">Cobrar</button></div>`).join(''):'<p class="small">No hay fiados pendientes.</p>';
$$('#dl [data-c]').forEach(b=>b.onclick=async()=>{const r=await ask('Cobrar fiado',[{l:'Monto ($)',t:'number',v:b.dataset.d},{l:'Medio de pago',opts:MEDIOS.map(m=>[m,m])}],'Cobrar');if(r){try{await pilo.cobrarDeuda({cliente_id:+b.dataset.c,monto:+r[0],medio:r[1]});rC()}catch(e){err(e)}}})}
$('#bgas').onclick=async()=>{const r=await ask('Registrar gasto',[{l:'Categoría',opts:['Insumos','Proveedor','Servicios','Alquiler','Sueldos','Otros'].map(x=>[x,x])},{l:'Proveedor o detalle'},{l:'Monto ($)',t:'number'},{l:'Medio de pago',opts:MEDIOS.map(m=>[m,m])}],'Guardar');
if(!r||!(+r[2]>0))return;await pilo.gasto({categoria:r[0],proveedor:r[1],monto:+r[2],medio:r[3]});rC()};
// ---- Estadísticas
async function rS(){const s=await pilo.stats();$('#s1').textContent=fm(s.hoy);$('#s2').textContent=fm(s.semana);$('#s3').textContent=fm(s.mes);const mx=Math.max(...s.porDia,1);
$('#bars').innerHTML=s.porDia.map(v=>`<div class="bar" style="height:${Math.max(v/mx*100,3)}%">${v?Math.round(v/1000)+'k':''}</div>`).join('');$('#bl').innerHTML=['L','M','M','J','V','S','D'].map(x=>`<div>${x}</div>`).join('');
const tt=MEDIOS.reduce((a,m)=>a+(s.medios[m]||0),0)||1;$('#pm').innerHTML=MEDIOS.map(m=>{const v=s.medios[m]||0;return`<div style="display:flex;justify-content:space-between"><span>${m}</span><b>${fm(v)} · ${Math.round(v/tt*100)}%</b></div><div class="pb"><i style="width:${v/tt*100}%;background:${COL[m]}"></i></div>`}).join('')}
// ---- Configuración
const aplicar=c=>{['c1','c2','c3','c4'].forEach(k=>c[k]&&R.style.setProperty('--'+k,c[k]));$('#nm').textContent=c.nombre||'Negocio';pintaLogo($('#lg'),c.logo);$('#nsub').textContent=[c.direccion,c.telefono].filter(Boolean).join(' · ')||'Cafetería y comidas';$('#av').textContent=(c.usuario||'U')[0].toUpperCase();document.title=(c.nombre||'')+' · Gestión'};
async function rG(){const c=await pilo.config();$('#inu').value=c.usuario||'';$$('input[type=color]').forEach(i=>i.value=c[i.dataset.v]);
const p=await pilo.productos();$('#pl').innerHTML=p.map(x=>`<div class="row pl" data-i="${x.id}" style="align-items:flex-start"><span>${esc(x.categoria)} · ${esc(x.nombre)}</span><span style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end">${precioTxt(x)}<button class="btn s" data-x="${x.id}" style="width:auto;padding:6px 10px">Eliminar</button></span></div>`).join('');
$$('#pl .pl').forEach(e=>e.onclick=()=>editProd(p.find(q=>q.id==e.dataset.i)));
$$('#pl [data-x]').forEach(b=>b.onclick=async ev=>{ev.stopPropagation();const x=p.find(q=>q.id==b.dataset.x);if(!confirm(`¿Eliminar "${x.nombre}"? Las ventas ya registradas no se modifican.`))return;await pilo.eliminarProducto(x.id);rG()})}
$('#bnp').onclick=async()=>{const r=await ask('Nuevo producto',[{l:'Categoría'},{l:'Nombre'},{l:'Precio ($)',t:'number'},{l:'Costo ($, opcional)',t:'number'}],'Crear');if(r&&r[0]&&r[1]&&+r[2]>0){await pilo.guardarProducto({categoria:r[0],nombre:r[1],precio:+r[2],costo:+r[3]||0});rG()}};
$('#inu').onchange=async e=>{await pilo.setConfig('usuario',e.target.value.trim());aplicar(await pilo.config())};$('#bdl').onclick=async()=>{try{await pilo.exportarBackup()}catch(e){err(e)}};
$('#brs').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(!confirm('Esto reemplaza TODOS los datos actuales por los del backup. ¿Continuar?'))return;try{await pilo.importarBackup(await f.text());alert('Backup restaurado');location.reload()}catch(x){err(x)}};
$$('input[type=color]').forEach(i=>i.oninput=async()=>{R.style.setProperty('--'+i.dataset.v,i.value);pilo.setConfig(i.dataset.v,i.value)});
$$('[data-th]').forEach(b=>b.onclick=()=>{R.dataset.theme=b.dataset.th;try{localStorage.setItem('tema',b.dataset.th)}catch{}});
$('#bpw').onclick=async()=>{const r=await ask('Nueva clave de administrador',[{l:'Clave nueva',t:'password'},{l:'Repetir clave',t:'password'}],'Cambiar');if(!r)return;if(r[0].length<4||r[0]!==r[1])return alert('Las claves no coinciden o son muy cortas (mínimo 4)');await pilo.cambiarClave(r[0]);alert('Clave cambiada')};
try{const t=localStorage.getItem('tema');if(t)R.dataset.theme=t}catch{}


// ---- Exportar
const exp=tipo=>async()=>{try{const f=await pilo.exportar(tipo,ym);if(f)alert('Guardado en:\n'+f)}catch(e){err(e)}};$('#bxl').onclick=exp('excel');$('#bpd').onclick=exp('pdf');
// ---- Viandas: a retirar / con envío, cada una en efectivo o transferencia (4 precios)
const fh=f=>f===hoy()?'':' ('+f.split('-').reverse().slice(0,2).join('/')+')';
function vp(x,k){return x[k]??x.precio}
function camposV(x){return[['A retirar · efectivo ($)','precio'],['A retirar · transferencia ($)','p_retiro_transf'],['Con envío · efectivo ($)','p_envio_efectivo'],['Con envío · transferencia ($)','p_envio_transf']].map(([l,k])=>({l,t:'number',v:x?vp(x,k):''}))}
function precioTxt(x){return x.categoria==='Viandas'?`<span class="small">Retira ${fm(vp(x,'precio'))} ef. / ${fm(vp(x,'p_retiro_transf'))} transf.<br>Envío ${fm(vp(x,'p_envio_efectivo'))} ef. / ${fm(vp(x,'p_envio_transf'))} transf.</span>`:`<b>${fm(x.precio)}</b>`}
async function rVi(){const {pendientes:P,entregadas:E}=await pilo.viandasLista(),tp=m=>fm(P.filter(p=>p.medio===m).reduce((a,p)=>a+p.total,0)),ne=P.filter(p=>p.envio).length;
$('#vres').textContent=P.length?`Pendientes: ${P.length} (${ne} con envío, ${P.length-ne} a retirar) · a cobrar en efectivo ${tp('Efectivo')} · por transferencia ${tp('Transferencia')}`:'Ordenadas por horario';
const fila=(p,ent)=>`<div class="row" style="align-items:flex-start"><span><b>${esc(p.horario)}</b>${fh(p.fecha)} · <b>${esc(p.cliente)}</b><span class="tag">${p.envio?'Con envío':'A retirar'}</span><br><span class="small">${p.envio?esc(p.direccion||'Sin dirección'):'Retira en el local'}${p.telefono?' · '+esc(p.telefono):''}</span><br><span class="small">${p.cantidad} × ${esc(p.nombre)} · ${p.medio} · ${fm(p.total)}</span></span>${ent?'<span class="small">Entregada</span>':`<span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end"><button class="btn" data-e="${p.id}" style="width:auto;padding:8px 12px">Entregada</button><button class="btn s" data-ed="${p.id}" style="width:auto;padding:8px 12px">Modificar</button><button class="btn s" data-q="${p.id}" style="width:auto;padding:8px 12px">Quitar</button></span>`}</div>`;
$('#vh').innerHTML=P.length?P.map(p=>fila(p,0)).join(''):'<p class="small">No hay viandas pendientes. Se cargan desde Ventas → Viandas o con el botón "Nueva vianda".</p>';
$('#ve').innerHTML=E.length?E.map(p=>fila(p,1)).join(''):'<p class="small">Todavía no se entregó ninguna hoy.</p>';
$$('#vh [data-e]').forEach(b=>b.onclick=async()=>{if(!confirm('¿Marcar como entregada y cobrada?'))return;try{await pilo.entregarVianda(+b.dataset.e);rVi()}catch(e){err(e)}});
$$('#vh [data-ed]').forEach(b=>b.onclick=()=>editVi(P.find(x=>x.id==b.dataset.ed)));
$$('#vh [data-q]').forEach(b=>b.onclick=async()=>{if(!confirm('¿Quitar esta vianda de la lista?'))return;await pilo.quitarVianda(+b.dataset.q);rVi()})}
async function nuevaVianda(){const cl=await pilo.clientes(),pv=(await pilo.productos()).filter(p=>p.categoria==='Viandas');
if(!pv.length)return alert('Primero creá una vianda en Configuración → Productos → "Nueva vianda" con sus 4 precios.');
const r=await ask('Nueva vianda',[{l:'Cliente',opts:[['','— Cliente nuevo —'],...cl.map(c=>[c.id,c.nombre])]},{l:'Nombre (si es cliente nuevo)'},{l:'Teléfono (si es cliente nuevo)'},{l:'Dirección de entrega (vacío = la del cliente)'},{l:'Horario',t:'time',v:'12:00'},{l:'Vianda',opts:pv.map(p=>[p.id,`${p.nombre} — retira ${fm(vp(p,'precio'))}/${fm(vp(p,'p_retiro_transf'))} · envío ${fm(vp(p,'p_envio_efectivo'))}/${fm(vp(p,'p_envio_transf'))} (efectivo/transf.)`])},{l:'Cantidad',t:'number',v:1},{l:'Modalidad',opts:[['0','A retirar'],['1','Con envío']]},{l:'Forma de pago',opts:[['Efectivo','Efectivo'],['Transferencia','Transferencia']]}],'Agregar');
if(!r)return;const envio=r[7]==='1',dir0=r[3].trim();let id=+r[0]||null;const c0=cl.find(x=>x.id==id);
if(!id&&!r[1].trim())return alert('Elegí un cliente de la lista o escribí el nombre del nuevo');
const direccion=dir0||(c0&&c0.direccion)||'';if(envio&&!direccion)return alert('Para un envío hace falta la dirección');
if(!id)id=await pilo.cliente({nombre:r[1].trim(),telefono:r[2].trim(),direccion:dir0});
try{await pilo.agregarVianda({cliente_id:id,direccion,horario:r[4]||'12:00',producto_id:+r[5],cantidad:Math.max(1,+r[6]||1),envio,medio:r[8]});go('viandas')}catch(e){err(e)}}
async function editVi(p){const r=await ask('Modificar vianda · '+p.cliente,[{l:'Horario',t:'time',v:p.horario},{l:'Modalidad',opts:[['0','A retirar'],['1','Con envío']],sel:p.envio?'1':'0'},{l:'Dirección de entrega',v:p.direccion},{l:'Cantidad',t:'number',v:p.cantidad},{l:'Forma de pago',opts:[['Efectivo','Efectivo'],['Transferencia','Transferencia']],sel:p.medio}],'Guardar');
if(!r)return;const envio=r[1]==='1';if(envio&&!r[2].trim())return alert('Para un envío hace falta la dirección');
try{await pilo.editarVianda(p.id,{horario:r[0]||p.horario,envio,direccion:r[2].trim(),cantidad:Math.max(1,+r[3]||1),medio:r[4]});rVi()}catch(e){err(e)}}
$('#bnv').onclick=nuevaVianda;
// ---- Productos: editar, eliminar y aumentar precios por porcentaje
async function editProd(x){const v=x.categoria==='Viandas',r=await ask('Editar producto',v?[{l:'Categoría',v:x.categoria},{l:'Nombre',v:x.nombre},...camposV(x),{l:'Costo ($, opcional)',t:'number',v:x.costo}]:[{l:'Categoría',v:x.categoria},{l:'Nombre',v:x.nombre},{l:'Precio ($)',t:'number',v:x.precio},{l:'Costo ($, opcional)',t:'number',v:x.costo}],'Guardar');
if(!r)return;const o={id:x.id,categoria:r[0].trim()||x.categoria,nombre:r[1].trim()||x.nombre};
if(v)Object.assign(o,{precio:+r[2],p_retiro_transf:+r[3],p_envio_efectivo:+r[4],p_envio_transf:+r[5],costo:+r[6]||0});else Object.assign(o,{precio:+r[2],costo:+r[3]||0});
await pilo.guardarProducto(o);rG()}
async function aumentarPrecios(){const p=await pilo.productos(),d=$('#dpr'),cats=[...new Set(p.map(x=>x.categoria))];
$('#pls').innerHTML='<label><input type="checkbox" id="pall"> <b>Todos los productos</b></label>'+cats.map(c=>`<div style="margin-top:8px"><label><input type="checkbox" data-cat="${esc(c)}"> <b>${esc(c)}</b></label>`+p.filter(x=>x.categoria==c).map(x=>`<label style="display:flex;justify-content:space-between;gap:8px;padding-left:22px"><span><input type="checkbox" class="pk" value="${x.id}">${esc(x.nombre)}</span><span class="small">${fm(x.precio)} → <b class="np" data-v="${x.precio}"></b></span></label>`).join('')+'</div>').join('');
const prev=()=>{const pc=+$('#pp').value||0,rd=+$('#pr').value||1;$$('#pls .np').forEach(e=>e.textContent=fm(Math.max(0,Math.round(+e.dataset.v*(1+pc/100)/rd)*rd)))};prev();$('#pp').oninput=prev;$('#pr').onchange=prev;
const pk=()=>$$('#pls .pk');$('#pall').onchange=e=>pk().forEach(c=>c.checked=e.target.checked);
$$('#pls [data-cat]').forEach(b=>b.onchange=()=>{const ids=p.filter(x=>x.categoria==b.dataset.cat).map(x=>String(x.id));pk().filter(c=>ids.includes(c.value)).forEach(c=>c.checked=b.checked)});
const validar=()=>{const ids=pk().filter(c=>c.checked).map(c=>+c.value),pc=+$('#pp').value;if(!ids.length||!pc||pc<=-100){alert('Elegí al menos un producto y un porcentaje distinto de 0');return null}return{ids,porcentaje:pc,redondeo:+$('#pr').value||1}};
$('#pok').onclick=e=>{if(!validar())e.preventDefault()};
d.onclose=async()=>{if(d.returnValue!=='ok')return;const v=validar();if(!v)return;if(!confirm(`Se van a modificar ${v.ids.length} producto(s) con ${v.porcentaje>0?'un aumento':'una baja'} de ${Math.abs(v.porcentaje)}%. ¿Continuar?`))return;try{await pilo.ajustarPrecios(v);rG()}catch(x){err(x)}};d.showModal()}
$('#bpc').onclick=aumentarPrecios;
$('#bnpv').onclick=async()=>{const r=await ask('Nueva vianda (producto con 4 precios)',[{l:'Nombre',v:'Vianda del día'},...camposV()],'Crear');if(r&&r[0].trim()&&+r[1]>0){await pilo.guardarProducto({categoria:'Viandas',nombre:r[0].trim(),precio:+r[1],p_retiro_transf:+r[2]||+r[1],p_envio_efectivo:+r[3]||+r[1],p_envio_transf:+r[4]||+r[1]});rG()}};
// ---- Clientes
async function rCl(){const cl=await pilo.clientes(),q=$('#qcl').value.toLowerCase(),l=cl.filter(c=>[c.nombre,c.telefono,c.direccion,c.observaciones].join(' ').toLowerCase().includes(q));
$('#cll').innerHTML=l.length?l.map(c=>`<div class="row pl" data-i="${c.id}" style="align-items:flex-start"><span><b>${esc(c.nombre)}</b>${c.telefono?' · '+esc(c.telefono):''}<br><span class="small">${esc(c.direccion||'Sin dirección')}${c.observaciones?' · '+esc(c.observaciones):''}</span></span>${c.deuda>0?`<b style="color:#c26a6a">debe ${fm(c.deuda)}</b>`:''}</div>`).join(''):'<p class="small">No hay clientes para mostrar.</p>';
$$('#cll .pl').forEach(e=>e.onclick=()=>editCl(cl.find(x=>x.id==e.dataset.i)))}
async function editCl(c={}){const r=await ask(c.id?'Editar cliente':'Nuevo cliente',[{l:'Nombre',v:c.nombre},{l:'Teléfono',v:c.telefono},{l:'Dirección',v:c.direccion},{l:'Observaciones',v:c.observaciones}],'Guardar');
if(!r)return;if(!r[0].trim())return alert('El nombre es obligatorio');await pilo.guardarCliente({id:c.id,nombre:r[0].trim(),telefono:r[1].trim(),direccion:r[2].trim(),observaciones:r[3].trim()});rCl()}
$('#qcl').oninput=rCl;$('#bncl').onclick=()=>editCl();
// ---- Detalle de un día (al tocar un día del calendario)
let diaSel=hoy();const sh=(f,n)=>{const [y,m,d]=f.split('-').map(Number),x=new Date(y,m-1,d+n);return x.getFullYear()+'-'+p2(x.getMonth()+1)+'-'+p2(x.getDate())};
async function rD(f){if(f)diaSel=f;const d=await pilo.dia(diaSel),[y,m,dd]=diaSel.split('-').map(Number),t=new Date(y,m-1,dd).toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
$('#dt1').textContent=t[0].toUpperCase()+t.slice(1);
$('#dk').innerHTML=[['--c1','Cobrado',fm(d.ingresos)],['--c3','Gastos',fm(d.egresos)],['--c2','Resultado del día',fm(d.ingresos-d.egresos)],['--c4','Ventas realizadas',d.ventas.length]].map(k=>`<div class="kpi" style="background:var(${k[0]})"><small>${k[1]}</small><b>${k[2]}</b></div>`).join('');
const tl={local:'En el local',llevar:'Para llevar',delivery:'Delivery'};
$('#dv').innerHTML=d.ventas.length?d.ventas.map(v=>`<div class="row" style="align-items:flex-start"><span><b>${esc(v.hora)} ${esc(v.mesa)}</b> · ${tl[v.tipo]||v.tipo}${v.cliente?' · '+esc(v.cliente):''}<br><span class="small">${v.items.map(i=>i.cantidad+' × '+esc(i.nombre)).join(', ')}</span><br><span class="small">${v.pagos.map(p=>p.medio+' '+fm(p.monto)).join(' + ')}${v.descuento?' · descuento '+fm(v.descuento):''}</span></span><b>${fm(v.total)}</b></div>`).join(''):'<p class="small">No hubo ventas este día.</p>';
const tk=d.ventas.length?d.vendido/d.ventas.length:0;
$('#ds').innerHTML=`<div class="pay"><span>Total vendido</span><b>${fm(d.vendido)}</b></div><div class="pay"><span>Ticket promedio</span><b>${fm(tk)}</b></div>`+(d.fiado?`<div class="pay"><span>Quedó fiado</span><b>${fm(d.fiado)}</b></div>`:'')+d.cobrosDeuda.map(c=>`<div class="pay"><span>Cobro de fiado · ${esc(c.cliente)} (${c.medio})</span><b>${fm(c.monto)}</b></div>`).join('')
+'<h3 style="margin:14px 0 6px;font-size:15px">Por medio de pago</h3>'+MEDIOS.map(k=>`<div class="pay"><span><i class="dot" style="background:${COL[k]}"></i>${k}</span><b>${fm(d.medios[k])}</b></div>`).join('')
+'<h3 style="margin:14px 0 6px;font-size:15px">Más vendidos</h3>'+(d.top.length?d.top.map(x=>`<div class="pay"><span>${esc(x[0])}</span><b>${x[1]}</b></div>`).join(''):'<p class="small">—</p>');
$('#dg').innerHTML=d.gastos.length?d.gastos.map(g=>`<div class="row"><span>${esc(g.categoria)}${g.proveedor?' · '+esc(g.proveedor):''} · ${g.medio}</span><b>${fm(g.monto)}</b></div>`).join(''):'<p class="small">Sin gastos cargados.</p>'}
$('#dback').onclick=()=>{ym=diaSel.slice(0,7);go('inicio')};$('#dprev').onclick=()=>go('dia',sh(diaSel,-1));$('#dnext').onclick=()=>go('dia',sh(diaSel,1));
// ---- Modo claro / oscuro
function setTema(t){R.dataset.theme=t;try{localStorage.setItem('tema',t)}catch{}const o=t==='dark';$('#tema').setAttribute('aria-checked',o);$('#tl').textContent=o?'☀️':'🌙'}
const cambiarTema=()=>setTema(R.dataset.theme==='dark'?'light':'dark');$('#tema').onclick=cambiarTema;
{let t;try{t=localStorage.getItem('tema')}catch{}setTema(t||(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'))}
// ---- Stock y recetas
async function editIns(i={}){const r=await ask(i.id?'Editar insumo':'Nuevo insumo',[{l:'Nombre',v:i.nombre},{l:'Unidad (kg, lt, u)',v:i.unidad||'kg'},{l:'Stock actual',t:'number',v:i.stock??0},{l:'Costo por unidad ($)',t:'number',v:i.costo??0}],'Guardar');
if(r&&r[0]){await pilo.guardarInsumo({id:i.id,nombre:r[0],unidad:r[1],stock:+r[2]||0,costo:+r[3]||0});rSt()}}
async function rSt(){const ins=await pilo.insumos();$('#il').innerHTML=ins.map(i=>`<div class="row pl" data-i="${i.id}"><span>${i.nombre}</span><b style="${i.stock<0?'color:#c26a6a':''}">${+i.stock.toFixed(2)} ${i.unidad} · ${fm(i.costo)}/${i.unidad}</b></div>`).join('')||'<p class="small">Cargá tus insumos (café, leche, harina...).</p>';
$$('#il .pl').forEach(e=>e.onclick=()=>editIns(ins.find(x=>x.id==e.dataset.i)));
const p=await pilo.productos();$('#rl').innerHTML=p.map(x=>`<div class="row pl" data-i="${x.id}"><span>${x.nombre}</span><b>${x.costo_receta?`costo ${fm(x.costo_receta)} · margen ${Math.round((1-x.costo_receta/x.precio)*100)}%`:'sin receta'}</b></div>`).join('');
$$('#rl .pl').forEach(e=>e.onclick=async()=>{if(!ins.length)return alert('Primero cargá los insumos');const x=p.find(q=>q.id==e.dataset.i),cu=await pilo.receta(x.id),opts=[['','— ninguno —'],...ins.map(i=>[i.id,`${i.nombre} (${i.unidad})`])],f=[];
for(let k=0;k<5;k++){f.push({l:'Insumo '+(k+1),opts,sel:cu[k]?cu[k].insumo_id:''});f.push({l:'Cantidad por unidad vendida',t:'number',v:cu[k]?cu[k].cantidad:''})}
const r=await ask('Receta de '+x.nombre,f,'Guardar');if(!r)return;const l=[];for(let k=0;k<5;k++)if(r[2*k]&&+r[2*k+1]>0)l.push({insumo_id:+r[2*k],cantidad:+r[2*k+1]});await pilo.setReceta(x.id,l);rSt()})}
$('#bni').onclick=()=>editIns();
$('#bci').onclick=async()=>{const ins=await pilo.insumos();if(!ins.length)return alert('Primero cargá un insumo');const r=await ask('Registrar compra',[{l:'Insumo',opts:ins.map(i=>[i.id,`${i.nombre} (${i.unidad})`])},{l:'Cantidad comprada',t:'number'},{l:'Total pagado ($)',t:'number'},{l:'Medio de pago',opts:MEDIOS.map(m=>[m,m])}],'Registrar');
if(r&&+r[1]>0){try{await pilo.comprarInsumo({insumo_id:+r[0],cantidad:+r[1],monto:+r[2]||0,medio:r[3]});rSt()}catch(e){err(e)}}};
// ---- Mi Negocio (solo administrador): nombre, logo, dirección y teléfono
let logoTmp='';
function pintaLogo(el,src){if(src){el.style.background='none';el.innerHTML=`<img src="${src}" alt="">`}else{el.style.background='';el.textContent='☕'}}
async function miNegocio(){const c=await pilo.config(),d=$('#dneg');logoTmp=c.logo||'';$('#nn').value=c.nombre||'';$('#nd').value=c.direccion||'';$('#nt').value=c.telefono||'';pintaLogo($('#nlogo'),logoTmp);
d.onclose=async()=>{if(d.returnValue!=='ok')return;const n=$('#nn').value.trim();if(!n)return alert('El nombre del negocio no puede quedar vacío');
await pilo.setConfig('nombre',n);await pilo.setConfig('direccion',$('#nd').value.trim());await pilo.setConfig('telefono',$('#nt').value.trim());await pilo.setConfig('logo',logoTmp);aplicar(await pilo.config())};d.showModal()}
$('#bneg').onclick=miNegocio;$('#nok').onclick=e=>{if(!$('#nn').value.trim()){e.preventDefault();alert('El nombre del negocio no puede quedar vacío')}};
$('#nquit').onclick=()=>{logoTmp='';pintaLogo($('#nlogo'),'')};
$('#nfile').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;if(!f.type.startsWith('image/'))return alert('Elegí un archivo de imagen');const img=new Image(),u=URL.createObjectURL(f);
img.onload=()=>{const k=Math.min(1,256/Math.max(img.width,img.height)),cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(img.width*k));cv.height=Math.max(1,Math.round(img.height*k));cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);logoTmp=cv.toDataURL('image/png');URL.revokeObjectURL(u);pintaLogo($('#nlogo'),logoTmp)};
img.onerror=()=>{URL.revokeObjectURL(u);alert('No se pudo leer esa imagen')};img.src=u};
// ---- Inicio: mosaicos de colores y resumen del día
const META={ventas:['🛎️','#d9327a','#f0508f'],viandas:['🍱','#e0561f','#c4410e'],clientes:['👥','#1e90d6','#1676b6'],caja:['💵','#e6a22d','#d38a12'],inicio:['📅','#7b4df5','#6238d8'],stats:['📊','#0f9d9a','#0b7f7c'],stock:['📦','#1f9255','#177a44'],cfg:['⚙️','#4f5a82','#3b4468']};
Object.entries(META).forEach(([k,[e,c,d]])=>{const h=$(`#${k} .top h1`);if(h){const s=document.createElement('span');s.className='sq';s.style.cssText=`--c:${c};--d:${d}`;s.textContent=e;h.before(s)}});
function count(root){const red=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;$$(root+' [data-n]').forEach(e=>{const v=+e.dataset.n,p=e.dataset.p||'',t0=performance.now();if(red){e.textContent=p+v.toLocaleString('es-AR');return}const f=t=>{const k=Math.min(1,(t-t0)/800);e.textContent=p+Math.round(v*(1-Math.pow(1-k,3))).toLocaleString('es-AR');if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f)})}
async function rH(){const hr=new Date().getHours(),c=await pilo.config(),f=new Date().toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'});
$('#hsal').textContent=(hr<12?'Buenos días':hr<20?'Buenas tardes':'Buenas noches')+(c.usuario?', '+c.usuario:'');$('#hfecha').textContent=f[0].toUpperCase()+f.slice(1);
const [d,ca,V,cl,st]=await Promise.all([pilo.dia(hoy()),pilo.cajaHoy(),pilo.viandasLista(),pilo.clientes(),adm?pilo.stats():null]),P=V.pendientes,
oc=Object.keys(ords).filter(m=>Object.keys(ords[m].items).length),K=(t,v,cls,p,s)=>`<div class="card"><small>${t}</small><div class="n ${cls}" data-n="${Math.round(v)}" data-p="${p}"></div><p>${s}</p></div>`;
$('#hv1').textContent=`${d.ventas.length} ventas hoy · ${oc.length} cuentas abiertas`;$('#hv2').textContent=P.length?`${P.length} para entregar hoy`:'Sin pendientes';$('#hv3').textContent=`${cl.length} cargados`;
$('#hvend').style.display=adm?'':'none';if(adm)$('#hvend').innerHTML=`Vendido hoy <b data-n="${Math.round(d.vendido)}" data-p="$ "></b>`;
$('#hk').innerHTML=K('Efectivo en caja',ca.esperado,'g','$ ',ca.abierta?'Apertura '+fm(ca.apertura):'Caja sin abrir')+K('Ventas de hoy',d.ventas.length,'','','Registradas hoy')+K('Viandas pendientes',P.length,'o','',`${P.filter(p=>p.envio).length} con envío · ${P.filter(p=>!p.envio).length} a retirar`)
+(adm?K('Transferencias y QR',(d.medios.Transferencia||0)+(d.medios.QR||0),'','$ ','Cobrado hoy')+K('Ganancia del mes',st.mes,'g','$ ','Solo administrador'):'');
$('#hm').innerHTML=oc.length?oc.map(m=>`<span class="mp o">${esc(m)}</span>`).join(''):'<span class="small">No hay cuentas abiertas</span>';
$('#hvl').innerHTML=P.length?P.slice(0,3).map(p=>`<div class="row"><span><b>${esc(p.horario)}</b> ${esc(p.cliente)}</span><span class="tag">${p.envio?'Con envío':'A retirar'}</span></div>`).join(''):'<p class="small">No hay viandas pendientes</p>';
$('#htop').innerHTML=d.top.length?d.top.slice(0,3).map(x=>`<div class="row"><span>${esc(x[0])}</span><b>${x[1]}</b></div>`).join(''):'<p class="small">Todavía no hay ventas hoy</p>';count('#home')}
(async()=>{const c=await pilo.config();try{ords=JSON.parse(c.cuentas||'{}')}catch{}aplicar(c);rH();if(pilo.backupVencido&&await pilo.backupVencido()&&confirm('Hace más de una semana que no descargás un backup de tus datos. ¿Descargarlo ahora?'))await pilo.exportarBackup()})();
