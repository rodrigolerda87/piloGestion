window.PILO_V=Object.assign(window.PILO_V||{},{app:'8'});
const nul=new Proxy(function(){},{get:(t,p)=>p===Symbol.toPrimitive?()=>'':nul,set:()=>true,apply:()=>nul}); // si falta un elemento (archivos de versiones mezcladas) no se corta todo el programa
const $=s=>{const e=document.querySelector(s);if(!e)console.warn('Pilo: falta el elemento',s);return e||nul},$$=s=>[...document.querySelectorAll(s)],R=document.documentElement;
const fm=n=>'$ '+Math.round(n||0).toLocaleString('es-AR'),p2=n=>String(n).padStart(2,'0');
const hoy=()=>{const d=new Date();return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())};
const COL={Efectivo:'#8fd3b0',Transferencia:'#b9a8ec',QR:'#f4b896',Tarjeta:'#86c1e6'},MEDIOS=Object.keys(COL);
const err=e=>alert(String(e.message||e).replace(/^Error invoking remote method '[^']+': Error: /,''));
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let adm=false,prods=[],cat=null,mesa='Mostrador',tipo='local',ords={},ym=hoy().slice(0,7),selDay=hoy();
const cur=()=>ords[mesa]??={items:{},desc:0};
const sub=()=>Object.values(cur().items).reduce((a,i)=>a+i.n*i.precio,0),total=()=>Math.max(0,sub()-cur().desc);
function ask(title,fields,ok='Aceptar',note,soloOk){return new Promise(res=>{const d=$('#dlg');$('#dt').textContent=title;$('#dok').textContent=ok;
$('#df').innerHTML=fields.map((f,i)=>`<label>${f.l}${f.opts?`<select id="f${i}">${f.opts.map(o=>`<option value="${o[0]}"${o[0]==f.sel?' selected':''}>${o[1]}</option>`).join('')}</select>`:`<input id="f${i}" type="${f.t||'text'}" value="${f.v??''}">`}</label>`).join('');
$('#dcan').style.display=soloOk?'none':'';const df=$('#df');if(note){df.insertAdjacentHTML('beforeend','<div id="dnote" style="font:800 17px \'Baloo 2\',sans-serif;margin-top:8px"></div>');const u=()=>{$('#dnote').innerHTML=note(fields.map((f,i)=>$('#f'+i).value))};df.oninput=u;df.onchange=u;u()}else{df.oninput=null;df.onchange=null}
d.onclose=()=>res(d.returnValue==='ok'?fields.map((f,i)=>$('#f'+i).value):null);d.showModal();$('#f0')&&$('#f0').focus()})}
// Cuadros propios en lugar de los avisos del navegador (confirmación y alerta): esos pueden estar bloqueados (Chrome, apps con navegador interno) y entonces los botones no hacen nada
const confirmar=(msg,ok='Aceptar')=>ask('Confirmar',[],ok,()=>esc(msg).replace(/\n/g,'<br>')).then(r=>!!r);
const aviso=msg=>ask('Aviso',[],'Entendido',()=>esc(msg).replace(/\n/g,'<br>'),true);
window.alert=m=>{aviso(m)};
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
// ---- Estadísticas: ventas de hoy y ganancia semanal / mensual / anual, con gráfico de barras y tabla por forma de pago
let per='mes',off=0;
const iso=d=>d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate()),MES=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],DIA=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
function rango(p,o){const h=new Date();
if(p==='sem'){const d=new Date(h.getFullYear(),h.getMonth(),h.getDate()-((h.getDay()+6)%7)+o*7),e=new Date(d.getFullYear(),d.getMonth(),d.getDate()+6),f=x=>x.toLocaleDateString('es-AR',{day:'numeric',month:'short'});return{desde:iso(d),hasta:iso(e),agrupar:'dia',titulo:`Semana del ${f(d)} al ${f(e)}`}}
if(p==='mes'){const d=new Date(h.getFullYear(),h.getMonth()+o,1),e=new Date(d.getFullYear(),d.getMonth()+1,0),t=d.toLocaleDateString('es-AR',{month:'long',year:'numeric'});return{desde:iso(d),hasta:iso(e),agrupar:'dia',titulo:t[0].toUpperCase()+t.slice(1)}}
const y=h.getFullYear()+o;return{desde:y+'-01-01',hasta:y+'-12-31',agrupar:'mes',titulo:'Año '+y}}
const corto=v=>{const a=Math.abs(v),s=v<0?'-':'';return s+(a>=1e6?(a/1e6).toFixed(1).replace('.0','')+' M':a>=1e3?Math.round(a/1e3)+'k':Math.round(a))};
function etiqueta(c,p){const [y,m,d]=c.split('-');return p==='anio'?MES[+m-1]:p==='sem'?DIA[new Date(y,m-1,d).getDay()]+' '+(+d):String(+d)}
function grafico(S,p){const W=720,H=250,pl=50,pr=8,pt=16,pb=30,n=S.length,bw=(W-pl-pr)/n,paso=p==='mes'?Math.ceil(n/16):1;
let mx=Math.max(0,...S.map(s=>s.ganancia)),mn=Math.min(0,...S.map(s=>s.ganancia)),ticks=[0];
if(mx>mn){const raw=(mx-mn)/4,mag=Math.pow(10,Math.floor(Math.log10(raw))),st=[1,2,5,10].map(x=>x*mag).find(x=>x>=raw);mn=Math.floor(mn/st)*st;mx=Math.ceil(mx/st)*st;ticks=[];for(let v=mn;v<=mx+st/2;v+=st)ticks.push(v)}else mx=1;
const rg=mx-mn,Y=v=>pt+(mx-v)/rg*(H-pt-pb),y0=Y(0);
let g='';ticks.forEach(v=>{const yy=Y(v);g+=`<line x1="${pl}" x2="${W-pr}" y1="${yy}" y2="${yy}" style="stroke:var(--ln)"/><text x="${pl-6}" y="${yy+4}" text-anchor="end" font-size="10" style="fill:var(--mut)">${corto(v)}</text>`});
g+=`<line x1="${pl}" x2="${W-pr}" y1="${y0}" y2="${y0}" style="stroke:var(--mut)"/>`;
S.forEach((s,i)=>{const v=s.ganancia,x=pl+i*bw+bw*.14,w=bw*.72,yy=Y(v),hh=v?Math.max(Math.abs(yy-y0),2):0,tit=p==='anio'?MES[+s.clave.slice(5)-1]+' '+s.clave.slice(0,4):s.clave.split('-').reverse().join('/');
g+=`<rect x="${x}" y="${Math.min(yy,y0)}" width="${w}" height="${hh}" rx="3" style="fill:${v<0?'#e0561f':'#0f9d9a'}"><title>${tit}: ${fm(v)} · ingresos ${fm(s.ingresos)} · egresos ${fm(s.egresos)}</title></rect>`;
if(i%paso===0)g+=`<text x="${x+w/2}" y="${H-10}" text-anchor="middle" font-size="10" style="fill:var(--mut)">${etiqueta(s.clave,p)}</text>`;
if(n<=12&&v)g+=`<text x="${x+w/2}" y="${v<0?yy+11:yy-4}" text-anchor="middle" font-size="9" style="fill:var(--tx)">${corto(v)}</text>`});
return`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ganancia por ${p==='anio'?'mes':'día'}" style="width:100%;height:auto;display:block">${g}</svg>`}
function tabla(P){const ms=[...new Set([...MEDIOS,...Object.keys(P.medios)])],g=x=>`<td class="${x<0?'rojo':''}">${fm(x)}</td>`;
return`<table class="tb"><tr><th>Forma de pago</th><th>Ingresos</th><th>Egresos</th><th>Ganancia</th></tr>`+ms.map(m=>{const x=P.medios[m]||{ingresos:0,egresos:0};return`<tr><td><i class="dot" style="background:${COL[m]||'#999'}"></i>${esc(m)}</td><td>${fm(x.ingresos)}</td><td>${fm(x.egresos)}</td>${g(x.ingresos-x.egresos)}</tr>`}).join('')+`<tr class="tt"><td>Total</td><td>${fm(P.totales.ingresos)}</td><td>${fm(P.totales.egresos)}</td>${g(P.totales.ganancia)}</tr></table>`}
async function rS(){const d=await pilo.dia(hoy());$('#s1').textContent=fm(d.vendido);$('#s1n').textContent=d.ventas.length+(d.ventas.length===1?' venta':' ventas');
const tot=await Promise.all(['sem','mes','anio'].map(async p=>(await pilo.periodo(rango(p,0))).totales.ganancia));['#s2','#s3','#s4'].forEach((s,i)=>$(s).textContent=fm(tot[i]));
$$('#stats .kbtn').forEach(b=>{b.classList.toggle('on',b.dataset.p===per);b.onclick=()=>{per=b.dataset.p;off=0;rS()}});
const r=rango(per,off),P=await pilo.periodo(r);$('#sptit').textContent=r.titulo;$('#sgraf').innerHTML=grafico(P.series,per);$('#stab').innerHTML=tabla(P);$('#spn').disabled=off>=0;$('#spn').style.opacity=off>=0?.4:1}
$('#spv').onclick=()=>{off--;rS()};$('#spn').onclick=()=>{if(off<0){off++;rS()}};
// ---- Configuración
const aplicar=c=>{['c1','c2','c3','c4'].forEach(k=>c[k]&&R.style.setProperty('--'+k,c[k]));$('#nm').textContent=c.nombre||'Negocio';pintaLogo($('#lg'),c.logo);$('#nsub').textContent=[c.direccion,c.telefono].filter(Boolean).join(' · ')||'Cafetería y comidas';$('#av').textContent=(c.usuario||'U')[0].toUpperCase();document.title=(c.nombre||'')+' · Gestión'};
async function rG(){const c=await pilo.config();$('#inu').value=c.usuario||'';$('#inm').value=c.nombre||'';$('#idir').value=c.direccion||'';$('#itel').value=c.telefono||'';pintaLogo($('#clogo'),c.logo);pcargarViandas();$$('input[type=color]').forEach(i=>i.value=c[i.dataset.v]);
const p=(await pilo.productos()).filter(x=>x.categoria!=='Viandas');$('#pl').innerHTML=p.map(x=>`<div class="row pl" data-i="${x.id}" style="align-items:flex-start"><span>${esc(x.categoria)} · ${esc(x.nombre)}</span><span style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end"><b>${fm(x.precio)}</b><button class="btn s" data-x="${x.id}" style="width:auto;padding:6px 10px">Eliminar</button></span></div>`).join('');
$$('#pl .pl').forEach(e=>e.onclick=()=>editProd(p.find(q=>q.id==e.dataset.i)));
$$('#pl [data-x]').forEach(b=>b.onclick=async ev=>{ev.stopPropagation();const x=p.find(q=>q.id==b.dataset.x);if(!await confirmar(`¿Eliminar "${x.nombre}"? Las ventas ya registradas no se modifican.`,'Eliminar'))return;await pilo.eliminarProducto(x.id);rG()})}
$('#bnp').onclick=async()=>{const r=await ask('Nuevo producto',[{l:'Categoría'},{l:'Nombre'},{l:'Precio ($)',t:'number'},{l:'Costo ($, opcional)',t:'number'}],'Crear');if(r&&r[0]&&r[1]&&+r[2]>0){await pilo.guardarProducto({categoria:r[0],nombre:r[1],precio:+r[2],costo:+r[3]||0});rG()}};
$('#inu').onchange=async e=>{await pilo.setConfig('usuario',e.target.value.trim());aplicar(await pilo.config())};$('#bdl').onclick=async()=>{try{await pilo.exportarBackup()}catch(e){err(e)}};
$('#brs').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(!await confirmar('Esto reemplaza TODOS los datos actuales por los del backup. ¿Continuar?','Restaurar'))return;try{await pilo.importarBackup(await f.text());await aviso('Backup restaurado');location.reload()}catch(x){err(x)}};
$$('input[type=color]').forEach(i=>i.oninput=async()=>{R.style.setProperty('--'+i.dataset.v,i.value);pilo.setConfig(i.dataset.v,i.value)});
$$('[data-th]').forEach(b=>b.onclick=()=>{R.dataset.theme=b.dataset.th;try{localStorage.setItem('tema',b.dataset.th)}catch{}});
$('#bpw').onclick=async()=>{const r=await ask('Nueva clave de administrador',[{l:'Clave nueva',t:'password'},{l:'Repetir clave',t:'password'}],'Cambiar');if(!r)return;if(r[0].length<4||r[0]!==r[1])return alert('Las claves no coinciden o son muy cortas (mínimo 4)');await pilo.cambiarClave(r[0]);alert('Clave cambiada')};
try{const t=localStorage.getItem('tema');if(t)R.dataset.theme=t}catch{}


// ---- Exportar
const exp=tipo=>async()=>{try{const f=await pilo.exportar(tipo,ym);if(f)alert('Guardado en:\n'+f)}catch(e){err(e)}};$('#bxl').onclick=exp('excel');$('#bpd').onclick=exp('pdf');
// ---- Viandas: el precio sale solo de la modalidad (retira / envío) y la forma de pago (precios editables en Configuración)
const fh=f=>f===hoy()?'':' ('+f.split('-').reverse().slice(0,2).join('/')+')';
const calcV=(c,envio,medio,n)=>{const unit=medio==='Transferencia'?c.transferencia:c.efectivo,env=envio?c.envio*Math.min(n,c.envio_max):0;return{unit,envio:env,total:unit*n+env}};
const notaV=(pc,iN,iM,iP)=>v=>{const n=Math.max(1,+v[iN]||1),r=calcV(pc,v[iM]==='1',v[iP],n);return`Total: <b>${fm(r.total)}</b> <span class="small">(${n} × ${fm(r.unit)}${r.envio?' + envío '+fm(r.envio):''})</span>`};
async function rVi(){const {pendientes:P,entregadas:E}=await pilo.viandasLista(),tp=m=>fm(P.filter(p=>p.medio===m).reduce((a,p)=>a+p.total,0)),ne=P.filter(p=>p.envio).length;
$('#vres').textContent=P.length?`Pendientes: ${P.length} (${ne} con envío, ${P.length-ne} a retirar) · a cobrar en efectivo ${tp('Efectivo')} · por transferencia ${tp('Transferencia')}`:'Ordenadas por horario';
const fila=(p,ent)=>`<div class="row" style="align-items:flex-start"><span><b>${esc(p.horario)}</b>${fh(p.fecha)} · <b>${esc(p.cliente)}</b><span class="tag">${p.envio?'Con envío':'A retirar'}</span><br><span class="small">${p.envio?esc(p.direccion||'Sin dirección'):'Retira en el local'}${p.telefono?' · '+esc(p.telefono):''}</span><br><span class="small">${p.cantidad} × ${esc(p.nombre)} · ${p.medio} · <b>${fm(p.total)}</b>${p.envio_monto?' (incluye envío '+fm(p.envio_monto)+')':''}</span></span>${ent?'<span class="small">Entregada</span>':`<span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end"><button class="btn" data-e="${p.id}" style="width:auto;padding:8px 12px">Entregada</button><button class="btn s" data-ed="${p.id}" style="width:auto;padding:8px 12px">Modificar</button><button class="btn s" data-q="${p.id}" style="width:auto;padding:8px 12px">Quitar</button></span>`}</div>`;
$('#vh').innerHTML=P.length?P.map(p=>fila(p,0)).join(''):'<p class="small">No hay viandas pendientes. Se cargan desde Ventas → Viandas o con el botón "Nueva vianda".</p>';
$('#ve').innerHTML=E.length?E.map(p=>fila(p,1)).join(''):'<p class="small">Todavía no se entregó ninguna hoy.</p>';
$$('#vh [data-e]').forEach(b=>b.onclick=async()=>{if(!await confirmar('¿Marcar como entregada y cobrada?','Entregada'))return;try{await pilo.entregarVianda(+b.dataset.e);rVi()}catch(e){err(e)}});
$$('#vh [data-ed]').forEach(b=>b.onclick=()=>editVi(P.find(x=>x.id==b.dataset.ed)));
$$('#vh [data-q]').forEach(b=>b.onclick=async()=>{if(!await confirmar('¿Quitar esta vianda de la lista?','Quitar'))return;await pilo.quitarVianda(+b.dataset.q);rVi()})}
async function nuevaVianda(){const cl=await pilo.clientes(),pc=await pilo.preciosViandas();
const r=await ask('Nueva vianda',[{l:'Cliente',opts:[['','— Cliente nuevo —'],...cl.map(c=>[c.id,c.nombre])]},{l:'Nombre (si es cliente nuevo)'},{l:'Teléfono (si es cliente nuevo)'},{l:'Dirección de entrega (vacío = la del cliente)'},{l:'Horario',t:'time',v:'12:00'},{l:'Cantidad',t:'number',v:1},{l:'Modalidad',opts:[['0','A retirar'],['1','Con envío']]},{l:'Forma de pago',opts:[['Efectivo','Efectivo'],['Transferencia','Transferencia']]}],'Agregar',notaV(pc,5,6,7));
if(!r)return;const envio=r[6]==='1',dir0=r[3].trim();let id=+r[0]||null;const c0=cl.find(x=>x.id==id);
if(!id&&!r[1].trim())return alert('Elegí un cliente de la lista o escribí el nombre del nuevo');
const direccion=dir0||(c0&&c0.direccion)||'';if(envio&&!direccion)return alert('Para un envío hace falta la dirección');
if(!id)id=await pilo.cliente({nombre:r[1].trim(),telefono:r[2].trim(),direccion:dir0});
try{await pilo.agregarVianda({cliente_id:id,direccion,horario:r[4]||'12:00',cantidad:Math.max(1,+r[5]||1),envio,medio:r[7]});go('viandas')}catch(e){err(e)}}
async function editVi(p){const pc=await pilo.preciosViandas(),r=await ask('Modificar vianda · '+p.cliente,[{l:'Horario',t:'time',v:p.horario},{l:'Modalidad',opts:[['0','A retirar'],['1','Con envío']],sel:p.envio?'1':'0'},{l:'Dirección de entrega',v:p.direccion},{l:'Cantidad',t:'number',v:p.cantidad},{l:'Forma de pago',opts:[['Efectivo','Efectivo'],['Transferencia','Transferencia']],sel:p.medio}],'Guardar',notaV(pc,3,1,4));
if(!r)return;const envio=r[1]==='1';if(envio&&!r[2].trim())return alert('Para un envío hace falta la dirección');
try{await pilo.editarVianda(p.id,{horario:r[0]||p.horario,envio,direccion:r[2].trim(),cantidad:Math.max(1,+r[3]||1),medio:r[4]});rVi()}catch(e){err(e)}}
$('#bnv').onclick=nuevaVianda;
// ---- Configuración: precios de viandas
async function pvEjemplo(){const c=await pilo.preciosViandas(),t=(e,m,n)=>fm(calcV(c,e,m,n).total);$('#pvx').textContent=`Con estos precios, 1 vianda: retira y paga en efectivo ${t(0,'Efectivo',1)} · retira y transfiere ${t(0,'Transferencia',1)} · con envío en efectivo ${t(1,'Efectivo',1)} · con envío y transferencia ${t(1,'Transferencia',1)}. Con 3 viandas con envío en efectivo: ${t(1,'Efectivo',3)}.`}
async function pcargarViandas(){const c=await pilo.preciosViandas();$('#pv1').value=c.efectivo;$('#pv2').value=c.transferencia;$('#pv3').value=c.envio;$('#pv4').value=c.envio_max;pvEjemplo()}
['vianda_efectivo','vianda_transferencia','vianda_envio','vianda_envio_max'].forEach((k,i)=>{$('#pv'+(i+1)).onchange=async e=>{const v=+e.target.value;if(e.target.value===''||!(v>=0)||(k==='vianda_envio_max'&&v<1)){alert('Poné un número válido');return pcargarViandas()}await pilo.setConfig(k,v);pvEjemplo()}});
// ---- Productos: editar, eliminar y aumentar precios por porcentaje
async function editProd(x){const r=await ask('Editar producto',[{l:'Categoría',v:x.categoria},{l:'Nombre',v:x.nombre},{l:'Precio ($)',t:'number',v:x.precio},{l:'Costo ($, opcional)',t:'number',v:x.costo}],'Guardar');
if(!r)return;await pilo.guardarProducto({id:x.id,categoria:r[0].trim()||x.categoria,nombre:r[1].trim()||x.nombre,precio:+r[2],costo:+r[3]||0});rG()}
async function aumentarPrecios(){const p=(await pilo.productos()).filter(x=>x.categoria!=='Viandas'),pc=await pilo.preciosViandas(),d=$('#dpr'),cats=[...new Set(p.map(x=>x.categoria))];
$('#pls').innerHTML=`<label><input type="checkbox" id="pall"> <b>Todo (productos y viandas)</b></label><label style="display:flex;justify-content:space-between;gap:8px;margin-top:8px"><span><input type="checkbox" id="pvia"> <b>🍱 Viandas</b> <span class="small">(efectivo, transferencia y envío)</span></span><span class="small">${fm(pc.efectivo)} → <b class="np" data-v="${pc.efectivo}"></b></span></label>`
+cats.map(c=>`<div style="margin-top:8px"><label><input type="checkbox" data-cat="${esc(c)}"> <b>${esc(c)}</b></label>`+p.filter(x=>x.categoria==c).map(x=>`<label style="display:flex;justify-content:space-between;gap:8px;padding-left:22px"><span><input type="checkbox" class="pk" value="${x.id}">${esc(x.nombre)}</span><span class="small">${fm(x.precio)} → <b class="np" data-v="${x.precio}"></b></span></label>`).join('')+'</div>').join('');
const prev=()=>{const pt=+$('#pp').value||0,rd=+$('#pr').value||1;$$('#pls .np').forEach(e=>e.textContent=fm(Math.max(0,Math.round(+e.dataset.v*(1+pt/100)/rd)*rd)))};prev();$('#pp').oninput=prev;$('#pr').onchange=prev;
const pk=()=>$$('#pls .pk');$('#pall').onchange=e=>{pk().forEach(c=>c.checked=e.target.checked);$('#pvia').checked=e.target.checked};
$$('#pls [data-cat]').forEach(b=>b.onchange=()=>{const ids=p.filter(x=>x.categoria==b.dataset.cat).map(x=>String(x.id));pk().filter(c=>ids.includes(c.value)).forEach(c=>c.checked=b.checked)});
const validar=()=>{const ids=pk().filter(c=>c.checked).map(c=>+c.value),viandas=$('#pvia').checked,pt=+$('#pp').value;if((!ids.length&&!viandas)||!pt||pt<=-100){alert('Elegí qué modificar y un porcentaje distinto de 0');return null}return{ids,viandas,porcentaje:pt,redondeo:+$('#pr').value||1}};
$('#pok').onclick=e=>{if(!validar())e.preventDefault()};
d.onclose=async()=>{if(d.returnValue!=='ok')return;const v=validar();if(!v)return;if(!await confirmar(`Se van a modificar ${v.ids.length} producto(s)${v.viandas?' y los precios de las viandas':''} con ${v.porcentaje>0?'un aumento':'una baja'} de ${Math.abs(v.porcentaje)}%. ¿Continuar?`,'Aplicar'))return;try{await pilo.ajustarPrecios(v);rG()}catch(x){err(x)}};d.showModal()}
$('#bpc').onclick=aumentarPrecios;
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
// ---- Mi Negocio (solo administrador): una sola pantalla con datos del negocio, colores, precios, productos y copias de seguridad
function pintaLogo(el,src){if(src){el.style.background='none';el.innerHTML=`<img src="${src}" alt="">`}else{el.style.background='';el.textContent='☕'}}
function guardaCfg(sel,clave,vacioOk){$(sel).onchange=async e=>{const v=e.target.value.trim();if(!vacioOk&&!v){alert('El nombre del negocio no puede quedar vacío');e.target.value=(await pilo.config())[clave]||'';return}await pilo.setConfig(clave,v);aplicar(await pilo.config())}}
guardaCfg('#inm','nombre',false);guardaCfg('#idir','direccion',true);guardaCfg('#itel','telefono',true);
$('#bneg').onclick=()=>go('cfg');
$('#cquit').onclick=async()=>{await pilo.setConfig('logo','');pintaLogo($('#clogo'),'');aplicar(await pilo.config())};
$('#cfile').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;if(!f.type.startsWith('image/'))return alert('Elegí un archivo de imagen');const img=new Image(),u=URL.createObjectURL(f);
img.onload=async()=>{const k=Math.min(1,256/Math.max(img.width,img.height)),cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(img.width*k));cv.height=Math.max(1,Math.round(img.height*k));cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);const url=cv.toDataURL('image/png');URL.revokeObjectURL(u);await pilo.setConfig('logo',url);pintaLogo($('#clogo'),url);aplicar(await pilo.config())};
img.onerror=()=>{URL.revokeObjectURL(u);alert('No se pudo leer esa imagen')};img.src=u};
// ---- Inicio: mosaicos de colores y resumen del día
const META={ventas:['🛎️','#d9327a','#f0508f'],viandas:['🍱','#e0561f','#c4410e'],clientes:['👥','#1e90d6','#1676b6'],caja:['💵','#e6a22d','#d38a12'],inicio:['📅','#7b4df5','#6238d8'],stats:['📊','#0f9d9a','#0b7f7c'],stock:['📦','#1f9255','#177a44'],cfg:['🏪','#4f5a82','#3b4468']};
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
(async()=>{const c=await pilo.config();try{ords=JSON.parse(c.cuentas||'{}')}catch{}aplicar(c);rH();if(pilo.backupVencido&&await pilo.backupVencido()&&await confirmar('Hace más de una semana que no descargás un backup de tus datos. ¿Descargarlo ahora?','Descargar'))await pilo.exportarBackup()})();
