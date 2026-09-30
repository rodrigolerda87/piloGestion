# Pilo Gestión (versión web)

Sistema de gestión para cafetería / venta de comida: ventas y mesas, caja, gastos, fiados, stock y recetas, viandas, estadísticas y exportación a Excel y PDF.
Funciona 100% en el navegador: **los datos se guardan en el propio navegador de quien lo usa** (IndexedDB) y no se suben a ningún servidor.

## Ver el programa en el navegador (GitHub Pages)
1. Crear un repositorio nuevo en https://github.com/new (por ejemplo `pilo-gestion`).
2. Subir **el contenido** de esta carpeta (botón *Add file → Upload files*, arrastrar todo menos `node_modules`).
3. En el repositorio: *Settings → Pages → Build and deployment → Source: Deploy from branch → Branch: `main` / carpeta `/ (root)` → Save*.
4. A los 1-2 minutos queda en `https://TU-USUARIO.github.io/pilo-gestion/`.

> El repositorio puede ser público: contiene solo el programa, nunca tus ventas ni tus datos.

## Uso y datos
- Clave inicial del administrador: `admin` (cambiarla en Configuración). En la versión web esa clave evita el uso casual; no es seguridad fuerte, porque cualquiera con acceso a la PC podría abrir las herramientas del navegador.
- Los datos viven **en ese navegador y en esa PC**. Usá siempre el mismo navegador. Si se borran los datos del sitio o se cambia de PC, se pierden.
- Por eso: *Configuración → Backup de datos → Descargar* (el programa te lo recuerda cada semana) y *Restaurar* para volver a cargarlo.
- Excel: se descarga en la carpeta de Descargas. PDF: se abre el informe y en el diálogo de impresión se elige "Guardar como PDF" (permitir ventanas emergentes).

## Estructura (pensada para pasarla después a .exe)
- `index.html` y `src/app.js`: la interfaz (idéntica a la versión de escritorio).
- `src/store.js`: la lógica y los datos (ventas, caja, stock, fiados...).
- `src/pilo-web.js`: conecta la interfaz con el almacenamiento del navegador.
- `src/export.js`: genera el Excel y el informe en PDF.
- Para el .exe solo se reemplaza `pilo-web.js` por el puente de Electron; la interfaz y la lógica se reutilizan.

## Pruebas
```
npm install
npm test
```
