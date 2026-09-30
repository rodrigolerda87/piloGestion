// Capa de datos de Pilo: mismas funciones que el programa de escritorio, pero en JavaScript puro.
// Guarda todo en un objeto que se persiste con el "storage" que se le pase (IndexedDB en el navegador).
const PiloStore = (() => {
  const p2 = n => String(n).padStart(2, '0'), fechaLocal = d => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()), hoy = () => fechaLocal(new Date());
  const MEDIOS = ['Efectivo', 'Transferencia', 'QR', 'Tarjeta', 'Fiado'];
  const cr = () => globalThis.crypto || require('crypto').webcrypto, hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''), rnd = () => hex(cr().getRandomValues(new Uint8Array(8)));
  async function hash(clave, sal) { const te = new TextEncoder(), k = await cr().subtle.importKey('raw', te.encode(clave), 'PBKDF2', false, ['deriveBits']); return hex(await cr().subtle.deriveBits({ name: 'PBKDF2', salt: te.encode(sal), iterations: 100000, hash: 'SHA-256' }, k, 256)); }
  const SEED = [['Cafetería', 'Café chico', 2800], ['Cafetería', 'Jarrita', 3600], ['Cafetería', 'Café doble', 4200], ['Cafetería', 'Cortado', 3000], ['Cafetería', 'Lágrima', 3000], ['Cafetería', 'Café con leche', 3400], ['Cafetería', 'Té / mate cocido', 2500],
    ['Comidas', 'Milanesa al plato', 9800], ['Comidas', 'Sándwich de milanesa simple', 8200], ['Comidas', 'Sándwich de milanesa completo', 9500], ['Comidas', 'Lomo completo', 10500], ['Comidas', 'Hamburguesa', 8900], ['Comidas', 'Tostado', 5200], ['Comidas', 'Tostado con papas', 7800],
    ['Pizzas', 'Muzzarella', 9500], ['Pizzas', 'Fugazzeta', 10800], ['Pizzas', 'Napolitana', 10200], ['Empanadas', 'Carne', 1500], ['Empanadas', 'Árabe', 1600], ['Empanadas', 'Jamón y queso', 1500], ['Empanadas', 'Pollo', 1500],
    ['Panadería', 'Factura', 900], ['Panadería', 'Medialuna', 800], ['Viandas', 'Vianda del día', 7500]];
  async function crear(storage) {
    const raw = await storage.load(); let S = raw ? JSON.parse(raw) : null, cola = Promise.resolve();
    const persist = () => { const j = JSON.stringify(S); cola = cola.then(() => storage.save(j)); return cola; };
    const id = k => S.seq[k] = (S.seq[k] || 0) + 1;
    if (!S) {
      S = { seq: {}, config: { nombre: 'Pilo', c1: '#b9e4d3', c2: '#d9cdf5', c3: '#ffd9c2', c4: '#cde6f7', ultimo_backup: String(Date.now()) }, clientes: [], productos: [], insumos: [], recetas: [], ventas: [], venta_items: [], pagos: [], gastos: [], caja: {}, viandas: [], vianda_entregas: [] };
      const sal = rnd(); S.admin = { sal, hash: await hash('admin', sal) }; // clave inicial: admin (cambiarla en Configuración)
      SEED.forEach(p => S.productos.push({ id: id('productos'), categoria: p[0], nombre: p[1], precio: p[2], costo: 0, activo: 1 })); persist();
    }
    const sum = (a, f) => a.reduce((t, x) => t + f(x), 0), ins = i => S.insumos.find(x => x.id === i);
    const deuda = c => sum(S.pagos.filter(p => p.cliente_id === c.id && p.medio === 'Fiado'), p => p.monto) - sum(S.pagos.filter(p => p.cliente_id === c.id && p.venta_id == null), p => p.monto);
    const ing = (a, b) => sum(S.pagos.filter(p => p.fecha >= a && p.fecha <= b && p.medio !== 'Fiado'), p => p.monto), egr = (a, b) => sum(S.gastos.filter(g => g.fecha >= a && g.fecha <= b), g => g.monto);
    const api = {
      config: () => ({ ...S.config }), setConfig: (k, v) => { S.config[k] = String(v); persist(); },
      login: async c => (await hash(c, S.admin.sal)) === S.admin.hash,
      cambiarClave: async c => { const sal = rnd(); S.admin = { sal, hash: await hash(c, sal) }; persist(); },
      productos: () => S.productos.filter(p => p.activo).map(p => ({ ...p, costo_receta: sum(S.recetas.filter(r => r.producto_id === p.id), r => r.cantidad * (ins(r.insumo_id) ? ins(r.insumo_id).costo : 0)) })).sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre)),
      guardarProducto: p => { if (p.id) { Object.assign(S.productos.find(x => x.id === p.id), { categoria: p.categoria, nombre: p.nombre, precio: p.precio, costo: p.costo || 0 }); persist(); return p.id; } const n = id('productos'); S.productos.push({ id: n, categoria: p.categoria, nombre: p.nombre, precio: p.precio, costo: p.costo || 0, activo: 1 }); persist(); return n; },
      cobrar: ({ mesa = 'Mostrador', tipo = 'local', descuento = 0, cliente_id = null, items, pagos }) => {
        const total = sum(items, i => i.cantidad * i.precio) - descuento;
        if (Math.abs(sum(pagos, p => p.monto) - total) > 0.01) throw new Error('Los pagos no suman el total');
        if (pagos.some(p => !MEDIOS.includes(p.medio))) throw new Error('Medio de pago inválido');
        if (pagos.some(p => p.medio === 'Fiado') && !cliente_id) throw new Error('Para fiar hay que elegir un cliente');
        const vid = id('ventas'), f = hoy(); S.ventas.push({ id: vid, fecha: f, mesa, tipo, descuento, total, cliente_id, estado: 'cerrada' });
        items.forEach(i => { S.venta_items.push({ venta_id: vid, producto_id: i.producto_id, nombre: i.nombre, cantidad: i.cantidad, precio: i.precio });
          if (i.producto_id) S.recetas.filter(r => r.producto_id === i.producto_id).forEach(r => { const x = ins(r.insumo_id); if (x) x.stock -= r.cantidad * i.cantidad; }); });
        pagos.forEach(p => S.pagos.push({ id: id('pagos'), venta_id: vid, cliente_id, fecha: f, medio: p.medio, monto: p.monto })); persist(); return vid;
      },
      gasto: g => { const n = id('gastos'); S.gastos.push({ id: n, fecha: g.fecha || hoy(), categoria: g.categoria, proveedor: g.proveedor || '', monto: g.monto, medio: g.medio || 'Efectivo', nota: g.nota || '' }); persist(); return n; },
      mes: ym => { const d = {}, g = f => d[f] = d[f] || { ingresos: 0, egresos: 0, medios: {} };
        S.pagos.filter(p => p.fecha.startsWith(ym) && p.medio !== 'Fiado').forEach(p => { const x = g(p.fecha); x.ingresos += p.monto; x.medios[p.medio] = (x.medios[p.medio] || 0) + p.monto; });
        S.gastos.filter(e => e.fecha.startsWith(ym)).forEach(e => { g(e.fecha).egresos += e.monto; }); return d; },
      deudaClientes: () => S.clientes.map(c => ({ id: c.id, nombre: c.nombre, deuda: deuda(c) })).sort((a, b) => a.nombre.localeCompare(b.nombre)),
      cobrarDeuda: c => { S.pagos.push({ id: id('pagos'), venta_id: null, cliente_id: c.cliente_id, fecha: hoy(), medio: c.medio, monto: c.monto }); persist(); },
      cliente: c => { const n = id('clientes'); S.clientes.push({ id: n, nombre: c.nombre, telefono: c.telefono || '', cuit: c.cuit || '', cond_iva: c.cond_iva || '' }); persist(); return n; },
      cajaHoy: () => { const c = S.caja[hoy()], ef = sum(S.pagos.filter(p => p.fecha === hoy() && p.medio === 'Efectivo'), p => p.monto), ge = sum(S.gastos.filter(g => g.fecha === hoy() && g.medio === 'Efectivo'), g => g.monto);
        return { abierta: !!c, apertura: c ? c.apertura : 0, contado: c ? c.contado : null, cerrada: c ? !!c.cerrada : false, efectivo: ef, gastosEf: ge, esperado: (c ? c.apertura : 0) + ef - ge }; },
      abrirCaja: m => { S.caja[hoy()] = { apertura: m, contado: null, cerrada: 0 }; persist(); },
      cerrarCaja: m => { if (S.caja[hoy()]) { S.caja[hoy()].contado = m; S.caja[hoy()].cerrada = 1; persist(); } },
      gastosRecientes: () => [...S.gastos].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id).slice(0, 8),
      stats: () => { const h = hoy(), ym = h.slice(0, 7), f = n => { const d = new Date(); d.setDate(d.getDate() - n); return fechaLocal(d); }, s = f(6), porDia = [0, 0, 0, 0, 0, 0, 0], medios = {};
        S.pagos.filter(p => p.fecha >= f(27) && p.medio !== 'Fiado').forEach(p => { const [y, m, d] = p.fecha.split('-'); porDia[(new Date(y, m - 1, d).getDay() + 6) % 7] += p.monto; });
        S.pagos.filter(p => p.fecha.startsWith(ym) && p.medio !== 'Fiado').forEach(p => medios[p.medio] = (medios[p.medio] || 0) + p.monto);
        return { hoy: ing(h, h), semana: ing(s, h) - egr(s, h), mes: ing(ym + '-01', ym + '-31') - egr(ym + '-01', ym + '-31'), porDia: porDia.map(x => x / 4), medios }; },
      insumos: () => [...S.insumos].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      guardarInsumo: i => { if (i.id) { Object.assign(ins(i.id), { nombre: i.nombre, unidad: i.unidad, stock: i.stock, costo: i.costo }); persist(); return i.id; } const n = id('insumos'); S.insumos.push({ id: n, nombre: i.nombre, unidad: i.unidad, stock: i.stock || 0, costo: i.costo || 0 }); persist(); return n; },
      comprarInsumo: ({ insumo_id, cantidad, monto, medio = 'Efectivo' }) => { if (!(cantidad > 0)) throw new Error('La cantidad debe ser mayor a 0'); const i = ins(insumo_id); if (!i) throw new Error('Insumo inexistente');
        i.stock += cantidad; if (monto > 0) { i.costo = monto / cantidad; api.gasto({ categoria: 'Insumos', proveedor: i.nombre, monto, medio }); } persist(); },
      receta: pid => S.recetas.filter(r => r.producto_id === pid).map(r => ({ insumo_id: r.insumo_id, cantidad: r.cantidad })),
      setReceta: (pid, l) => { S.recetas = S.recetas.filter(r => r.producto_id !== pid).concat(l.map(x => ({ producto_id: pid, insumo_id: x.insumo_id, cantidad: x.cantidad }))); persist(); },
      viandas: () => [...S.viandas].sort((a, b) => a.cliente.localeCompare(b.cliente)),
      guardarVianda: v => { if (v.id) { Object.assign(S.viandas.find(x => x.id === v.id), { cliente: v.cliente, detalle: v.detalle, precio: v.precio, dias: v.dias, activo: v.activo }); persist(); return v.id; } const n = id('viandas'); S.viandas.push({ id: n, cliente: v.cliente, detalle: v.detalle || '', precio: v.precio, dias: v.dias, activo: 1 }); persist(); return n; },
      viandasHoy: () => { const d = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'][new Date().getDay()]; return S.viandas.filter(v => v.activo && v.dias.includes(d) && !S.vianda_entregas.some(e => e.vianda_id === v.id && e.fecha === hoy())).sort((a, b) => a.cliente.localeCompare(b.cliente)); },
      entregarVianda: (vid, medio) => { const v = S.viandas.find(x => x.id === vid); if (!v) throw new Error('Vianda inexistente'); let cid = null;
        if (medio === 'Fiado') { const c = S.clientes.find(x => x.nombre === v.cliente); cid = c ? c.id : api.cliente({ nombre: v.cliente }); }
        const r = api.cobrar({ mesa: 'Vianda: ' + v.cliente, tipo: 'delivery', cliente_id: cid, items: [{ producto_id: null, nombre: 'Vianda' + (v.detalle ? ' · ' + v.detalle : ''), cantidad: 1, precio: v.precio }], pagos: [{ medio, monto: v.precio }] });
        S.vianda_entregas.push({ vianda_id: vid, fecha: hoy() }); persist(); return r; },
      reporte: ym => ({ ym, nombre: S.config.nombre, dias: api.mes(ym),
        ventas: S.ventas.filter(v => v.fecha.startsWith(ym)).flatMap(v => S.venta_items.filter(i => i.venta_id === v.id).map(i => ({ fecha: v.fecha, mesa: v.mesa, tipo: v.tipo, nombre: i.nombre, cantidad: i.cantidad, precio: i.precio, subtotal: i.cantidad * i.precio }))),
        gastos: S.gastos.filter(g => g.fecha.startsWith(ym)).sort((a, b) => a.fecha.localeCompare(b.fecha)), deudas: api.deudaClientes().filter(d => d.deuda > 0) }),
      dump: () => JSON.stringify(S), marcarBackup: () => { S.config.ultimo_backup = String(Date.now()); persist(); },
      backupVencido: () => Date.now() - (+S.config.ultimo_backup || 0) > 7 * 864e5,
      restore: j => { const o = JSON.parse(j); if (!o || !Array.isArray(o.productos) || !o.config || !o.admin) throw new Error('El archivo no parece un backup de Pilo'); S = o; persist(); },
      flush: () => cola
    };
    return api;
  }
  return { crear, hoy };
})();
if (typeof module !== 'undefined') module.exports = PiloStore;
