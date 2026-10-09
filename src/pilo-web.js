// Conecta la interfaz con PiloStore. En el navegador: datos en IndexedDB y descargas. En el programa de escritorio (.exe): datos en un archivo de Documentos\Pilo y cuadros de "Guardar como".
(() => {
  window.PILO_V = Object.assign(window.PILO_V || {}, { web: '10' });
  const abrirDB = () => new Promise((ok, mal) => { const r = indexedDB.open('pilo', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error); });
  const idb = {
    load: async () => { const db = await abrirDB(); return new Promise((ok, mal) => { const g = db.transaction('kv').objectStore('kv').get('estado'); g.onsuccess = () => ok(g.result || null); g.onerror = () => mal(g.error); }); },
    save: async s => { const db = await abrirDB(); return new Promise((ok, mal) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(s, 'estado'); tx.oncomplete = ok; tx.onerror = () => mal(tx.error); }); }
  };
  let mem = null; const memoria = { load: async () => mem, save: async s => { mem = s; } };
  const disco = window.piloDisk ? { load: () => window.piloDisk.cargar(), save: s => window.piloDisk.guardar(s).catch(e => { window.alert('Atención: no se pudo guardar en la carpeta Documentos\\Pilo. Revisá que haya espacio en el disco y que la carpeta no esté bloqueada.\n' + (e && e.message ? e.message : '')); throw e; }) } : null; // lo expone el programa de escritorio
  const listo = PiloStore.crear(disco || (typeof indexedDB !== 'undefined' ? idb : memoria));
  const bajar = (blob, nombre) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  // Guarda un archivo: en el .exe abre el cuadro "Guardar como" y devuelve la ruta (o null si se cancela); en el navegador lo descarga
  const guardar = async (blob, nombre) => { if (window.piloDisk) return window.piloDisk.guardarArchivo(nombre, new Uint8Array(await blob.arrayBuffer())); bajar(blob, nombre); return 'la carpeta de Descargas'; };
  const N = ['config', 'setConfig', 'login', 'cambiarClave', 'productos', 'guardarProducto', 'cobrar', 'gasto', 'mes', 'deudaClientes', 'cobrarDeuda', 'cliente', 'cajaHoy', 'abrirCaja', 'cerrarCaja', 'stats', 'gastosRecientes', 'insumos', 'guardarInsumo', 'comprarInsumo', 'receta', 'setReceta', 'clientes', 'guardarCliente', 'preciosViandas', 'calcularVianda', 'agregarVianda', 'viandasLista', 'entregarVianda', 'quitarVianda', 'editarVianda', 'eliminarProducto', 'ajustarPrecios', 'dia', 'periodo', 'gastosPeriodo', 'backupVencido'];
  window.pilo = Object.fromEntries(N.map(k => [k, async (...a) => (await listo)[k](...a)]));
  window.pilo.exportar = async (tipo, ym) => {
    const w = tipo === 'pdf' && !window.piloDisk ? window.open('', '_blank') : null; // se abre en el clic, antes de esperar, para que no lo bloquee el navegador
    if (tipo === 'pdf' && !window.piloDisk && !w) throw new Error('El navegador bloqueó la ventana. Permití las ventanas emergentes para este sitio y probá de nuevo.');
    const rep = (await listo).reporte(ym);
    if (tipo === 'excel') return guardar(new Blob([PiloExport.excel(rep, 'array')], { type: 'application/octet-stream' }), `${rep.nombre}-${ym}.xlsx`);
    if (window.piloDisk) return window.piloDisk.pdf(PiloExport.html(rep), `${rep.nombre}-${ym}.pdf`);
    w.document.write(PiloExport.html(rep)); w.document.close(); w.focus(); setTimeout(() => w.print(), 400); return null; // en el diálogo de impresión elegí "Guardar como PDF"
  };
  window.pilo.exportarBackup = async () => { const s = await listo, r = await guardar(new Blob([s.dump()], { type: 'application/json' }), `pilo-backup-${PiloStore.hoy()}.json`); if (r) s.marcarBackup(); return r; };
  window.pilo.backupVencido = async () => window.piloDisk ? false : (await listo).backupVencido(); // en el .exe el backup semanal es automático
  window.pilo.importarBackup = async j => (await listo).restore(j);
})();
