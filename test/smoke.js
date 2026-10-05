// Simula el uso de las pantallas en un navegador simulado (jsdom) y verifica que no haya errores.
const { JSDOM } = require('jsdom'), assert = require('assert'), path = require('path'), XLSX = require('xlsx');
(async () => {
  const errores = [], alerts = [];
  const dom = await JSDOM.fromFile(path.join(__dirname, '../index.html'), { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    beforeParse(w) { w.XLSX = XLSX; w.TextEncoder = TextEncoder; Object.defineProperty(w, 'crypto', { value: require('crypto').webcrypto }); w.scrollTo = () => {}; w.alert = m => alerts.push(m); w.confirm = () => true; w.URL.createObjectURL = () => 'blob:x'; w.URL.revokeObjectURL = () => {}; w.HTMLAnchorElement.prototype.click = function () {};
      w.open = () => ({ document: { write() {}, close() {} }, focus() {}, print() {} });
      w.HTMLDialogElement.prototype.showModal = function () { this.returnValue = 'ok'; if (w.__fill) { const f = w.__fill; w.__fill = null; f(this); } setTimeout(() => this.onclose && this.onclose(), 0); };
      w.addEventListener('error', e => errores.push(e.message)); w.addEventListener('unhandledrejection', e => errores.push(String(e.reason))); } });
  const w = dom.window, d = w.document, sleep = ms => new Promise(r => setTimeout(r, ms)), $ = s => d.querySelector(s), fill = (dlg, o) => Object.entries(o).forEach(([k, v]) => { dlg.querySelector('#f' + k).value = v; });
  const nav = async t => { $(`[data-t=${t}]`).click(); await sleep(150); };
  await sleep(800);
  await nav('ventas'); assert(d.querySelectorAll('.prod').length > 0, 'productos en pantalla'); assert.strictEqual($('#back').style.display, '', 'botón volver visible'); $('#back').click(); await sleep(200); assert($('#home').classList.contains('on'));
  { const hd = $('header'), bg = w.getComputedStyle(hd).backgroundColor, jc = w.getComputedStyle(hd).justifyContent; assert(['', 'transparent', 'rgba(0, 0, 0, 0)'].includes(bg) && jc !== 'center', 'el encabezado no hereda los estilos de las barras del gráfico (' + bg + '/' + jc + ')'); assert.strictEqual(w.getComputedStyle($('#bneg')).display, 'none', 'Mi Negocio oculto para el empleado'); }
  assert(/Buen/.test($('#hsal').textContent), 'saludo'); assert($('#hk').textContent.includes('Efectivo en caja') && !$('#hk').textContent.includes('Ganancia'), 'inicio del empleado: sin ganancias'); assert.strictEqual($('#hvend').style.display, 'none');
  assert(!$('.tile[data-t=caja]').hasAttribute('data-a'), 'Caja y gastos visible para el empleado'); assert($('.tile[data-t=stats]').hasAttribute('data-a'), 'Estadísticas solo admin'); assert.strictEqual(w.getComputedStyle($('.tile[data-t=stats]')).display, 'none', 'mosaico de administrador oculto para el empleado'); 
  // modo oscuro / claro
  const t0 = d.documentElement.dataset.theme; $('#tema').click(); assert.notStrictEqual(d.documentElement.dataset.theme, t0, 'cambia el tema'); $('#tema').click(); assert.strictEqual(d.documentElement.dataset.theme, t0);
  // venta en mesa
  $('.mesa[data-m="Mesa 2"]').click(); await sleep(100); $('.prod').click(); $('.prod').click(); await sleep(100);
  assert.match($('#tot').textContent, /5\.600/, 'total 2 cafés'); $('[data-m].btn[data-m="Efectivo"]').click(); await sleep(200);
  assert.strictEqual((await w.pilo.stats()).hoy, 5600, 'venta cobrada');
  // clientes
  await nav('clientes'); w.__fill = x => fill(x, { 0: 'Laura', 1: '3412223333', 2: 'Calle Falsa 123', 3: 'sin cebolla' }); $('#bncl').click(); await sleep(250);
  const laura = (await w.pilo.clientes()).find(c => c.nombre === 'Laura'); assert(laura && laura.direccion === 'Calle Falsa 123' && laura.observaciones === 'sin cebolla', 'cliente guardado');
  assert($('#cll').textContent.includes('Calle Falsa 123'), 'cliente en la lista'); $('#qcl').value = 'zzz'; $('#qcl').oninput(); await sleep(150); assert($('#cll').textContent.includes('No hay clientes')); $('#qcl').value = ''; $('#qcl').oninput();
  // viandas desde Ventas: cliente de la lista + cliente nuevo
  await nav('ventas'); const chip = () => [...d.querySelectorAll('#cats .chip')].find(c => c.textContent === 'Viandas');
  await w.pilo.guardarProducto({ categoria: 'Viandas', nombre: 'Vianda armada', precio: 7000, p_retiro_transf: 7500, p_envio_efectivo: 8000, p_envio_transf: 8500 });
  w.__fill = x => fill(x, { 0: laura.id, 4: '12:30', 7: '1', 8: 'Efectivo' }); chip().click(); await sleep(300);
  assert($('#viandas').classList.contains('on'), 'abre la pestaña Viandas');
  await nav('ventas'); w.__fill = x => fill(x, { 0: '', 1: 'Pedro', 3: 'Mitre 55', 4: '11:15', 7: '0', 8: 'Transferencia' }); chip().click(); await sleep(300);
  const tv = $('#vh').textContent; assert(tv.includes('Laura') && tv.includes('Calle Falsa 123') && tv.includes('Con envío') && tv.includes('Pedro') && tv.includes('A retirar') && tv.includes('Retira en el local'), 'viandas con cliente, dirección y modalidad');
  assert(tv.indexOf('Pedro') < tv.indexOf('Laura'), 'ordenadas por horario'); assert($('#vres').textContent.includes('transferencia'));
  $('#vh [data-e]').click(); await sleep(250); assert.strictEqual((await w.pilo.stats()).hoy, 5600 + 7500, 'vianda entregada y cobrada (Pedro: retira, transferencia)');
  w.__fill = x => fill(x, { 1: '0', 4: 'Efectivo' }); $('#vh [data-ed]').click(); await sleep(250); assert.match($('#vh').textContent, /A retirar/); assert.match($('#vh').textContent, /7\.000/, 'modificar a retiro en efectivo de la otra vianda'); assert($('#ve').textContent.includes('Pedro'));
  // admin: todas las pestañas y detalle del día
  w.__fill = x => fill(x, { 0: 'admin' }); $('#lgn').click(); await sleep(700); assert(d.body.classList.contains('adm'), 'login de administrador'); assert($('#hk').textContent.includes('Ganancia del mes') && $('#hvend').style.display !== 'none', 'inicio del administrador con ganancias'); assert.notStrictEqual(w.getComputedStyle($('.tile[data-t=stats]')).display, 'none');
  assert($('.sq'), 'iconos de color en los títulos'); assert.notStrictEqual(w.getComputedStyle($('#bneg')).display, 'none', 'Mi Negocio visible para el administrador'); assert(!$('#inn'), 'el nombre ya no está duplicado en Configuración');
  await w.pilo.setConfig('logo', 'data:image/png;base64,iVBORw0KGgo='); w.__fill = x => { x.querySelector('#nn').value = 'Café Uri'; x.querySelector('#nd').value = 'San Martín 123'; x.querySelector('#nt').value = '3462 555555'; }; $('#bneg').click(); await sleep(300);
  assert.strictEqual($('#nm').textContent, 'Café Uri', 'nombre del negocio'); assert($('#nsub').textContent.includes('San Martín 123') && $('#nsub').textContent.includes('3462 555555'), 'dirección y teléfono'); assert($('#lg img'), 'logo en el encabezado'); assert.strictEqual((await w.pilo.config()).direccion, 'San Martín 123', 'guardado');
  // productos: eliminar y aumentar precios
  await nav('cfg'); const n0 = (await w.pilo.productos()).length, med0 = (await w.pilo.productos()).find(x => x.nombre === 'Medialuna').precio, fact0 = (await w.pilo.productos()).find(x => x.nombre === 'Factura').precio;
  w.__fill = x => { x.querySelector('#pp').value = '10'; [...x.querySelectorAll('.pk')].filter(c => c.parentElement.textContent.includes('Medialuna')).forEach(c => { c.checked = true; }); }; $('#bpc').click(); await sleep(300);
  assert.strictEqual((await w.pilo.productos()).find(x => x.nombre === 'Medialuna').precio, Math.round(med0 * 1.1 / 10) * 10, 'aumento % aplicado al producto elegido'); assert.strictEqual((await w.pilo.productos()).find(x => x.nombre === 'Factura').precio, fact0, 'los no elegidos no cambian');
  $('#pl [data-x]').click(); await sleep(250); assert.strictEqual((await w.pilo.productos()).length, n0 - 1, 'producto eliminado desde la pantalla'); for (const t of ['inicio', 'caja', 'stock', 'stats', 'cfg', 'viandas', 'ventas']) await nav(t);
  await nav('inicio'); const hoy = w.pilo && (await w.pilo.dia(new Date().toISOString().slice(0, 10))); const cel = $('.day.hoy'); assert(cel, 'día de hoy marcado'); cel.click(); await sleep(250);
  assert($('#dia').classList.contains('on'), 'el calendario lleva al día'); assert($('#dv').textContent.includes('Mesa 2') && $('#dv').textContent.includes('Vianda'), 'ventas del día'); assert($('#ds').textContent.includes('Más vendidos') && $('#dk').textContent.includes('Cobrado'), 'estadísticas del día');
  $('#dprev').click(); await sleep(150); assert($('#dv').textContent.includes('No hubo ventas'), 'día anterior sin ventas'); $('#dback').click(); await sleep(150); assert($('#inicio').classList.contains('on')); $('#back').click(); await sleep(250); assert($('#home').classList.contains('on') && $('#back').style.display === 'none', 'volver al inicio'); assert($('#htop').textContent.includes('Cortado') || $('#htop').textContent.includes('Café'), 'más vendidos en el inicio');
  $('[data-t=cfg]').click(); await sleep(150); w.__fill = null; const pre = $('#inu'); pre.value = 'Uri'; pre.onchange({ target: pre }); await sleep(150); assert.strictEqual($('#av').textContent, 'U'); $('[data-t=inicio]').click(); await sleep(150);
  $('#bxl').click(); $('#bpd').click(); await nav('cfg'); $('#bdl').click(); await sleep(150);
  assert.deepStrictEqual(errores, [], 'sin errores en pantalla'); console.log('OK: pantallas sin errores', alerts.length ? '(avisos: ' + alerts.join(' | ').replace(/\n/g, ' ') + ')' : '');
  process.exit(0);
})().catch(e => { console.error('SMOKE FALLÓ:', e.message); process.exit(1); });
