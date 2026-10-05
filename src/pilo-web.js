// Conecta la interfaz con PiloStore en el navegador: datos en IndexedDB, exportar a Excel/PDF y backups.
(() => {
  const abrirDB = () => new Promise((ok, mal) => { const r = indexedDB.open('pilo', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error); });
  const idb = {
    load: async () => { const db = await abrirDB(); return new Promise((ok, mal) => { const g = db.transaction('kv').objectStore('kv').get('estado'); g.onsuccess = () => ok(g.result || null); g.onerror = () => mal(g.error); }); },
    save: async s => { const db = await abrirDB(); return new Promise((ok, mal) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(s, 'estado'); tx.oncomplete = ok; tx.onerror = () => mal(tx.error); }); }
  };
  let mem = null; const memoria = { load: async () => mem, save: async s => { mem = s; } };
  const listo = PiloStore.crear(typeof indexedDB !== 'undefined' ? idb : memoria);
  const bajar = (blob, nombre) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  const N = ['config', 'setConfig', 'login', 'cambiarClave', 'productos', 'guardarProducto', 'cobrar', 'gasto', 'mes', 'deudaClientes', 'cobrarDeuda', 'cliente', 'cajaHoy', 'abrirCaja', 'cerrarCaja', 'stats', 'gastosRecientes', 'insumos', 'guardarInsumo', 'comprarInsumo', 'receta', 'setReceta', 'clientes', 'guardarCliente', 'agregarVianda', 'viandasLista', 'entregarVianda', 'quitarVianda', 'editarVianda', 'eliminarProducto', 'ajustarPrecios', 'dia', 'backupVencido'];
  window.pilo = Object.fromEntries(N.map(k => [k, async (...a) => (await listo)[k](...a)]));
  window.pilo.exportar = async (tipo, ym) => {
    const w = tipo === 'pdf' ? window.open('', '_blank') : null; // se abre en el clic, antes de esperar, para que no lo bloquee el navegador
    if (tipo === 'pdf' && !w) throw new Error('El navegador bloqueó la ventana. Permití las ventanas emergentes para este sitio y probá de nuevo.');
    const rep = (await listo).reporte(ym);
    if (tipo === 'excel') { bajar(new Blob([PiloExport.excel(rep, 'array')], { type: 'application/octet-stream' }), `${rep.nombre}-${ym}.xlsx`); return 'la carpeta de Descargas'; }
    w.document.write(PiloExport.html(rep)); w.document.close(); w.focus(); setTimeout(() => w.print(), 400); return null; // en el diálogo de impresión elegí "Guardar como PDF"
  };
  window.pilo.exportarBackup = async () => { const s = await listo; bajar(new Blob([s.dump()], { type: 'application/json' }), `pilo-backup-${PiloStore.hoy()}.json`); s.marcarBackup(); };
  window.pilo.importarBackup = async j => (await listo).restore(j);
})();
