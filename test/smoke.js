// Simula el uso de las pantallas en un navegador simulado (jsdom) y verifica que no haya errores.
const { JSDOM } = require('jsdom'), assert = require('assert'), path = require('path'), XLSX = require('xlsx');
(async () => {
  const errores = [], alerts = [];
  const dom = await JSDOM.fromFile(path.join(__dirname, '../index.html'), { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    beforeParse(w) { w.XLSX = XLSX; w.TextEncoder = TextEncoder; Object.defineProperty(w, 'crypto', { value: require('crypto').webcrypto }); w.alert = m => alerts.push(m); w.confirm = () => true; w.URL.createObjectURL = () => 'blob:x'; w.URL.revokeObjectURL = () => {}; w.HTMLAnchorElement.prototype.click = function () {};
      w.open = () => ({ document: { write() {}, close() {} }, focus() {}, print() {} });
      w.HTMLDialogElement.prototype.showModal = function () { this.returnValue = 'ok'; setTimeout(() => this.onclose && this.onclose(), 0); };
      w.addEventListener('error', e => errores.push(e.message)); w.addEventListener('unhandledrejection', e => errores.push(String(e.reason))); } });
  const w = dom.window, d = w.document, sleep = ms => new Promise(r => setTimeout(r, ms)), $ = s => d.querySelector(s);
  await sleep(800);
  assert(d.querySelectorAll('.prod').length > 0, 'productos en pantalla');
  await w.pilo.guardarVianda({ cliente: 'Ana', precio: 7000, dias: 'dom,lun,mar,mie,jue,vie,sab' });
  $('.mesa[data-m="Mesa 2"]').click(); await sleep(100); $('.prod').click(); $('.prod').click(); await sleep(100);
  assert.match($('#tot').textContent, /5\.600/, 'total 2 cafés');
  $('[data-m].btn[data-m="Efectivo"]').click(); await sleep(200);
  assert.strictEqual((await w.pilo.stats()).hoy, 5600, 'venta cobrada');
  d.body.classList.add('adm');
  for (const t of ['viandas', 'inicio', 'caja', 'stock', 'stats', 'cfg', 'ventas']) { $(`nav button[data-t=${t}]`).click(); await sleep(150); }
  $('nav button[data-t=viandas]').click(); await sleep(100); $('#vh [data-v]').click(); await sleep(200);
  assert.strictEqual((await w.pilo.viandasHoy()).length, 0, 'vianda entregada'); assert.strictEqual((await w.pilo.stats()).hoy, 12600);
  $('nav button[data-t=inicio]').click(); await sleep(150); assert($('#k1').textContent.includes('12.600'), 'calendario');
  $('#bxl').click(); $('#bpd').click(); $('nav button[data-t=cfg]').click(); await sleep(150); $('#bdl').click(); await sleep(150);
  assert.deepStrictEqual(errores, [], 'sin errores en pantalla'); console.log('OK: pantallas sin errores', alerts.length ? '(avisos: ' + alerts.join(' | ').replace(/\n/g, ' ') + ')' : '');
  process.exit(0);
})().catch(e => { console.error('SMOKE FALLÓ:', e.message); process.exit(1); });
