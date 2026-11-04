import '../helpers/entorno.js';
import { describe, expect, it, vi } from 'vitest';

// multerMiddleware.js crea la carpeta 'uploads/constancias' apenas se importa. Para que el test no
// deje carpetas creadas en el proyecto, se le hace creer que ya existe; el resto de fs queda igual.
vi.mock('fs', async (importOriginal) => {
  const real = await importOriginal();
  const existsSync = (ruta) => ruta === 'uploads/constancias' || real.existsSync(ruta);
  return { ...real, existsSync, default: { ...real.default, existsSync } };
});

const { fileFilter: filtroDisco } = await import('../../middlewares/multer/multerMiddleware.js');
const { fileFilter: filtroComprobantes } = await import('../../middlewares/multer/multerCloudinary.js');
const { fileFilter: filtroEventos } = await import('../../middlewares/multer/multerEventos.js');
const { fileFilter: filtroNoticias } = await import('../../middlewares/multer/multerNoticias.js');

// Llama al fileFilter igual que multer: con un archivo (solo nombre y MIME, sin contenido) y un
// callback. Devuelve true si lo aceptó y false si lo rechazó con un error.
const pasaElFiltro = (fileFilter, originalname, mimetype) =>
  new Promise((resolve) => {
    fileFilter({}, { originalname, mimetype }, (error, aceptado) => resolve(!error && aceptado === true));
  });

// Cada filtro con los formatos que acepta hoy. Los de eventos y noticias son solo imágenes.
const filtros = [
  ['multerMiddleware (disco, deprecado)', filtroDisco, { pdf: true, webp: false }],
  ['multerCloudinary (comprobantes y constancias)', filtroComprobantes, { pdf: true, webp: true }],
  ['multerEventos', filtroEventos, { pdf: false, webp: true }],
  ['multerNoticias', filtroNoticias, { pdf: false, webp: true }],
];

// Archivos que ningún filtro debe aceptar. El MIME es válido a propósito: así cada caso prueba
// solo la extensión (salvo los dos últimos, que prueban el MIME).
const rechazados = [
  ['una extensión con letras de más', 'foto.pngx', 'image/png'],
  ['una doble extensión que termina en .exe', 'foto.png.exe', 'image/png'],
  ['un HTML', 'foto.html', 'image/png'],
  ['un archivo sin extensión', 'foto', 'image/png'],
  ['una extensión con texto agregado', 'foto.jpg&x=1', 'image/jpeg'],
  ['una extensión válida con MIME de HTML', 'foto.png', 'text/html'],
  ['una extensión válida con un MIME que solo contiene "png"', 'foto.png', 'text/png'],
];

describe.each(filtros)('fileFilter de %s', (_, fileFilter, acepta) => {
  it.each([
    ['foto.png', 'image/png'],
    ['FOTO.PNG', 'image/png'],
    ['foto.jpeg', 'image/jpeg'],
    ['foto.jpg', 'image/jpeg'],
  ])('acepta "%s"', async (nombre, mime) => {
    expect(await pasaElFiltro(fileFilter, nombre, mime)).toBe(true);
  });

  it.each(rechazados)('rechaza %s', async (_, nombre, mime) => {
    expect(await pasaElFiltro(fileFilter, nombre, mime)).toBe(false);
  });

  it(`${acepta.pdf ? 'acepta' : 'rechaza'} un PDF`, async () => {
    expect(await pasaElFiltro(fileFilter, 'constancia.pdf', 'application/pdf')).toBe(acepta.pdf);
  });

  it(`${acepta.webp ? 'acepta' : 'rechaza'} un WEBP`, async () => {
    expect(await pasaElFiltro(fileFilter, 'foto.webp', 'image/webp')).toBe(acepta.webp);
  });
});
