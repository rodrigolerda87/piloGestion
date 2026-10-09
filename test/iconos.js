// Verifica que cada producto tenga un ícono apropiado y que el programa no dependa de emojis (en Windows 7 se ven como rectángulos).
const assert = require('assert'), fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../src/app.js'), 'utf8');
const i = src.indexOf('function icoNombre'), j = src.indexOf('function icono(p)'); const icoNombre = new Function(src.slice(i, j) + '; return icoNombre;')();
const caso = (nombre, categoria, esperado) => assert.strictEqual(icoNombre({ nombre, categoria }), esperado, `${nombre} (${categoria}) -> ${icoNombre({ nombre, categoria })}, esperado ${esperado}`);
[['Café chico', 'Cafetería', 'cafe'], ['Té / mate cocido', 'Cafetería', 'cafe'], ['Milanesa al plato', 'Comidas', 'plato'], ['Hamburguesa', 'Comidas', 'hamb'], ['Lomo completo', 'Comidas', 'hamb'], ['Sándwich de milanesa simple', 'Comidas', 'hamb'], ['Tostado con papas', 'Comidas', 'hamb'], ['Tostado', 'Comidas', 'hamb'],
 ['Carne', 'Empanadas', 'empanada'], ['Pollo', 'Empanadas', 'empanada'], ['Jamón y queso', 'Empanadas', 'empanada'], ['Medialuna', 'Panadería', 'medialuna'], ['Factura', 'Panadería', 'medialuna'], ['Muzzarella', 'Pizzas', 'pizza'], ['Vianda del día', 'Viandas', 'vianda'],
 ['Papas fritas', 'Extras', 'papas'], ['Jugo de naranja', 'Bebidas', 'vaso'], ['Licuado', 'Bebidas', 'vaso'], ['Agua mineral', 'Bebidas', 'botella'], ['Cerveza', 'Bebidas', 'botella'], ['Gaseosa 500', 'Bebidas', 'botella'], ['Flan con dulce de leche', 'Postres', 'torta'], ['Brownie', 'Postres', 'torta'], ['Helado', 'Postres', 'helado'],
 ['Mate', 'Infusiones', 'mate'], ['Té verde', 'Infusiones', 'te'], ['Cortado doble', 'Infusiones', 'cafe'], ['Pan casero', 'Almacén', 'pan'], ['Ñoquis', 'Pastas', 'plato'], ['Ensalada mixta', 'Varios', 'plato'], ['Alfajor', 'Kiosco', 'torta'], ['Cosa rara', 'Varios', 'cubiertos']].forEach(a => caso(...a));
const emo = /[\u{1F000}-\u{1FAFF}\u2600-\u27BF\u2B00-\u2BFF\uFE0F\u200D]/u;
['../index.html', '../src/app.js', '../src/pilo-web.js'].forEach(f => assert(!emo.test(fs.readFileSync(path.join(__dirname, f), 'utf8')), 'quedan emojis en ' + f));
const nombres = [...src.matchAll(/^(\w+):`/gm)].map(m => m[1]); ['cafe', 'plato', 'hamb', 'empanada', 'medialuna', 'pizza', 'vianda', 'papas', 'torta', 'vaso', 'botella', 'helado', 'pan', 'mate', 'te', 'cubiertos'].forEach(n => assert(nombres.includes(n), 'falta el dibujo ' + n));
console.log('OK: íconos apropiados y sin emojis');
