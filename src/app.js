const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],R=document.documentElement;
const fm=n=>'$ '+Math.round(n||0).toLocaleString('es-AR'),p2=n=>String(n).padStart(2,'0');
const hoy=()=>{const d=new Date();return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())};
const COL={Efectivo:'#8fd3b0',Transferencia:'#b9a8ec',QR:'#f4b896',Tarjeta:'#86c1e6'},MEDIOS=Object.keys(COL);
const err=e=>alert(String(e.message||e).replace(/^Error invoking remote method '[^']+': Error: /,''));
let adm=false,prods=[],cat=null,mesa='Mostrador',tipo='local',ords={},ym=hoy().slice(0,7),selDay=hoy();
const cur=()=>ords[mesa]??={items:{},desc:0};
const sub=()=>Object.values(cur().items).reduce((a,i)=>a+i.n*i.precio,0),total=()=>Math.max(0,sub()-cur().desc);
function ask(title,fields,ok='Aceptar'){return new Promise(res=>{const d=$('#dlg');$('#dt').textContent=title;$('#dok').textContent=ok;
$('#df').innerHTML=fields.map((f,i)=>`<label>${f.l}${f.opts?`<select id="f${i}">${f.opts.map(o=>`<option value="${o[0]}"${o[0]==f.sel?' selected':''}>${o[1]}</option>`).join('')}</select>`:`<input id="f${i}" type="${f.t||'text'}" value="${f.v??''}">`}</label>`).join('');
d.onclose=()=>res(d.returnValue==='ok'?fields.map((f,i)=>$('#f'+i).value):null);d.showModal();$('#f0')&&$('#f0').focus()})}
function go(t){$$('nav button,.tab').forEach(e=>e.classList.remove('on'));$(`nav button[data-t=${t}]`).classList.add('on');$('#'+t).classList.add('on');({inicio:rI,caja:rC,stats:rS,cfg:rG,ventas:rV,viandas:rVi,stock:rSt})[t]()}
$$('nav button').forEach(b=>b.onclick=()=>go(b.dataset.t));
$('#lgn').onclick=async()=>{if(adm){adm=false}else{const r=await ask('Clave de administrador',[{l:'Clave',t:'password'}],'Entrar');if(!r)return;if(!await pilo.login(r[0]))return alert('Clave incorrecta');adm=true}
document.body.classList.toggle('adm',adm);$('#ses').textContent='Sesión: '+(adm?'administrador':'empleado');$('#lgn').textContent=adm?'Cerrar sesión de administrador':'Entrar como administrador';if(!adm)go('ventas')};
// ---- Ventas
async function rV(){prods=await pilo.productos();const cats=[...new Set(prods.map(p=>p.categoria))];cat=cats.includes(cat)?cat:cats[0];
$('#mesas').innerHTML=['Mostrador',...Array.from({length:8},(_,i)=>'Mesa '+(i+1)),'Afuera 1','Afuera 2'].map(m=>{const oc=ords[m]&&Object.keys(ords[m].items).length;return`<button class="mesa${oc?' oc':''}${m==mesa?' sel':''}" data-m="${m}">${m}<small>${oc?fm(Object.values(ords[m].items).reduce((a,i)=>a+i.n*i.precio,0)-ords[m].desc):'Libre'}</small></button>`}).join('');
$$('.mesa').forEach(b=>b.onclick=()=>{mesa=b.dataset.m;rV()});
$('#cats').innerHTML=cats.map(c=>`<button class="chip${c==cat?' on':''}">${c}</button>`).join('');$$('#cats .chip').forEach(b=>b.onclick=()=>{cat=b.textContent;rV()});
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
let I=0,E=0;Object.values(dias).forEach(d=>{I+=d.ingresos;E+=d.egresos});$('#k1').textContent=fm(I);$('#k2').textContent=fm(E);$('#k3').textContent=fm(I-E);
let h=['L','M','M','J','V','S','D'].map(x=>`<div class="dh">${x}</div>`).join('')+'<div class="day emp"></div>'.repeat(off);
for(let d=1;d<=n;d++){const f=`${ym}-${p2(d)}`,x=dias[f];h+=`<button class="day${f==hoy()?' hoy':''}${f==selDay?' sel':''}" data-f="${f}"><span>${d}</span>${x?`<b>${fm(x.ingresos)}</b>${x.egresos?`<i class="neg" style="font-style:normal">− ${fm(x.egresos)}</i>`:''}`:''}</button>`}
$('#cal').innerHTML=h;$$('.day[data-f]').forEach(b=>b.onclick=()=>{selDay=b.dataset.f;rI()});
const x=dias[selDay]||{ingresos:0,egresos:0,medios:{}};$('#det').innerHTML=`<h3>${selDay.split('-').reverse().join('/')}</h3><p class="small">Los fiados se cuentan cuando se cobran</p>`+MEDIOS.map(k=>`<div class="pay"><span><i class="dot" style="background:${COL[k]}"></i>${k}</span><b>${fm(x.medios[k])}</b></div>`).join('')+`<div class="pay"><span>Ingresos</span><b>${fm(x.ingresos)}</b></div><div class="pay"><span>Egresos</span><b>− ${fm(x.egresos)}</b></div><div class="pay"><b>Resultado del día</b><b>${fm(x.ingresos-x.egresos)}</b></div>`}
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
const aplicar=c=>{['c1','c2','c3','c4'].forEach(k=>c[k]&&R.style.setProperty('--'+k,c[k]));$('#nm').textContent=c.nombre||'Negocio';$('#lg').textContent=(c.nombre||'N')[0].toUpperCase();document.title=(c.nombre||'')+' · Gestión'};
async function rG(){const c=await pilo.config();$('#inn').value=c.nombre||'';$$('input[type=color]').forEach(i=>i.value=c[i.dataset.v]);
const p=await pilo.productos();$('#pl').innerHTML=p.map(x=>`<div class="row pl" data-i="${x.id}"><span>${x.categoria} · ${x.nombre}</span><b>${fm(x.precio)}</b></div>`).join('');
$$('.pl').forEach(e=>e.onclick=async()=>{const x=p.find(q=>q.id==e.dataset.i),r=await ask('Editar producto',[{l:'Categoría',v:x.categoria},{l:'Nombre',v:x.nombre},{l:'Precio ($)',t:'number',v:x.precio},{l:'Costo ($, opcional)',t:'number',v:x.costo}],'Guardar');if(r){await pilo.guardarProducto({id:x.id,categoria:r[0],nombre:r[1],precio:+r[2],costo:+r[3]||0});rG()}})}
$('#bnp').onclick=async()=>{const r=await ask('Nuevo producto',[{l:'Categoría'},{l:'Nombre'},{l:'Precio ($)',t:'number'},{l:'Costo ($, opcional)',t:'number'}],'Crear');if(r&&r[0]&&r[1]&&+r[2]>0){await pilo.guardarProducto({categoria:r[0],nombre:r[1],precio:+r[2],costo:+r[3]||0});rG()}};
$('#inn').onchange=async e=>{await pilo.setConfig('nombre',e.target.value);aplicar(await pilo.config())};$('#bdl').onclick=async()=>{try{await pilo.exportarBackup()}catch(e){err(e)}};
$('#brs').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(!confirm('Esto reemplaza TODOS los datos actuales por los del backup. ¿Continuar?'))return;try{await pilo.importarBackup(await f.text());alert('Backup restaurado');location.reload()}catch(x){err(x)}};
$$('input[type=color]').forEach(i=>i.oninput=async()=>{R.style.setProperty('--'+i.dataset.v,i.value);pilo.setConfig(i.dataset.v,i.value)});
$$('[data-th]').forEach(b=>b.onclick=()=>{R.dataset.theme=b.dataset.th;try{localStorage.setItem('tema',b.dataset.th)}catch{}});
$('#bpw').onclick=async()=>{const r=await ask('Nueva clave de administrador',[{l:'Clave nueva',t:'password'},{l:'Repetir clave',t:'password'}],'Cambiar');if(!r)return;if(r[0].length<4||r[0]!==r[1])return alert('Las claves no coinciden o son muy cortas (mínimo 4)');await pilo.cambiarClave(r[0]);alert('Clave cambiada')};
try{const t=localStorage.getItem('tema');if(t)R.dataset.theme=t}catch{}


// ---- Exportar
const exp=tipo=>async()=>{try{const f=await pilo.exportar(tipo,ym);if(f)alert('Guardado en:\n'+f)}catch(e){err(e)}};$('#bxl').onclick=exp('excel');$('#bpd').onclick=exp('pdf');
// ---- Viandas
async function rVi(){const h=await pilo.viandasHoy();$('#vh').innerHTML=h.length?h.map(v=>`<div class="row"><span><b>${v.cliente}</b> · ${v.detalle||'Vianda'} · ${fm(v.precio)}</span><button class="btn" data-v="${v.id}" style="width:110px">Entregada</button></div>`).join(''):'<p class="small">No quedan viandas por entregar hoy.</p>';
$$('#vh [data-v]').forEach(b=>b.onclick=async()=>{const r=await ask('Entrega y cobro',[{l:'Medio de pago',opts:[...MEDIOS,'Fiado'].map(m=>[m,m])}],'Confirmar');if(r){try{await pilo.entregarVianda(+b.dataset.v,r[0]);rVi()}catch(e){err(e)}}});
if(adm){const a=await pilo.viandas();$('#va').innerHTML=a.map(v=>`<div class="row pl" data-i="${v.id}"><span>${v.cliente} · ${v.detalle||''} · ${v.dias}${v.activo?'':' (pausada)'}</span><b>${fm(v.precio)}</b></div>`).join('')||'<p class="small">Todavía no cargaste viandas fijas.</p>';$$('#va .pl').forEach(e=>e.onclick=()=>editVi(a.find(x=>x.id==e.dataset.i)))}}
async function editVi(v={}){const r=await ask(v.id?'Editar vianda':'Nueva vianda fija',[{l:'Cliente',v:v.cliente},{l:'Detalle (opcional)',v:v.detalle},{l:'Precio ($)',t:'number',v:v.precio},{l:'Días (lun,mar,mie,jue,vie,sab,dom)',v:v.dias||'lun,mar,mie,jue,vie'},{l:'Estado',opts:[[1,'Activa'],[0,'Pausada']],sel:v.activo===0?0:1}],'Guardar');
if(r&&r[0]&&+r[2]>0){await pilo.guardarVianda({id:v.id,cliente:r[0],detalle:r[1],precio:+r[2],dias:r[3].toLowerCase(),activo:+r[4]});rVi()}}
$('#bnv').onclick=()=>editVi();
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
(async()=>{const c=await pilo.config();try{ords=JSON.parse(c.cuentas||'{}')}catch{}aplicar(c);rV();if(pilo.backupVencido&&await pilo.backupVencido()&&confirm('Hace más de una semana que no descargás un backup de tus datos. ¿Descargarlo ahora?'))await pilo.exportarBackup()})();
