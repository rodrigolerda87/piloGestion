// Genera el Excel (.xlsx) y el HTML para el PDF de un mes.
const PiloExport = (() => {
const XLSX = typeof require !== 'undefined' ? require('xlsx') : window.XLSX;
const MEDIOS = ['Efectivo', 'Transferencia', 'QR', 'Tarjeta'];
const $ = n => '$ ' + Math.round(n || 0).toLocaleString('es-AR');
const filasDias = r => Object.keys(r.dias).sort().map(f => { const d = r.dias[f]; const o = { Fecha: f, Ingresos: d.ingresos, Egresos: d.egresos, Resultado: d.ingresos - d.egresos }; MEDIOS.forEach(m => o[m] = d.medios[m] || 0); return o; });
function excel(r, tipo = 'buffer') {
  const wb = XLSX.utils.book_new(), add = (n, rows) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), n);
  add('Resumen por día', filasDias(r));
  add('Ventas detalle', r.ventas.map(v => ({ Fecha: v.fecha, Mesa: v.mesa, Tipo: v.tipo, Producto: v.nombre, Cantidad: v.cantidad, Precio: v.precio, Subtotal: v.subtotal })));
  add('Gastos', r.gastos.map(g => ({ Fecha: g.fecha, Categoría: g.categoria, Proveedor: g.proveedor, Monto: g.monto, Medio: g.medio, Nota: g.nota })));
  add('Fiados pendientes', r.deudas.map(d => ({ Cliente: d.nombre, Deuda: d.deuda })));
  return XLSX.write(wb, { type: tipo, bookType: 'xlsx' });
}
function html(r) {
  const f = filasDias(r), t = k => f.reduce((a, x) => a + x[k], 0), esc = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const porCat = {}; r.gastos.forEach(g => porCat[g.categoria] = (porCat[g.categoria] || 0) + g.monto);
  const tabla = (cab, filas) => `<table><tr>${cab.map(c => `<th>${c}</th>`).join('')}</tr>${filas.map(x => `<tr>${x.map((c, i) => `<td${i ? ' class="n"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</table>`;
  return `<meta charset="utf-8"><style>body{font:12px system-ui,Arial;color:#2c2a3a;margin:18px}h1{margin:0}h2{margin:18px 0 6px;font-size:14px}table{width:100%;border-collapse:collapse}th{background:#d9cdf5;text-align:left}th,td{padding:5px 7px;border-bottom:1px solid #e7e3f1}.n{text-align:right}</style>
<div style="display:flex;align-items:center;gap:12px">${r.logo ? `<img src="${r.logo}" style="width:56px;height:56px;object-fit:contain">` : ''}<div><h1>${esc(r.nombre)} · Informe ${r.ym}</h1><div>${esc([r.direccion, r.telefono].filter(Boolean).join(' · '))}</div></div></div><p>Ingresos ${$(t('Ingresos'))} · Egresos ${$(t('Egresos'))} · <b>Ganancia ${$(t('Resultado'))}</b></p>
<h2>Por medio de pago</h2>${tabla(['Medio', 'Total'], MEDIOS.map(m => [m, $(t(m))]))}
<h2>Por día</h2>${tabla(['Fecha', 'Ingresos', 'Egresos', 'Resultado'], f.map(x => [x.Fecha, $(x.Ingresos), $(x.Egresos), $(x.Resultado)]))}
<h2>Gastos por categoría</h2>${tabla(['Categoría', 'Total'], Object.entries(porCat).map(([k, v]) => [esc(k), $(v)]))}
<h2>Fiados pendientes</h2>${tabla(['Cliente', 'Deuda'], r.deudas.map(d => [esc(d.nombre), $(d.deuda)]))}`;
}
return { excel, html, version: '6' };
})();
if (typeof module !== 'undefined') module.exports = PiloExport;
