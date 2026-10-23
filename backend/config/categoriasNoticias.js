// Categorías predefinidas para las noticias.
// Es una lista fija en código (y no una tabla ni un ENUM de la base) a propósito: si la Cámara
// quiere sumar, quitar o renombrar una categoría, se cambia una línea acá y listo, sin tocar la
// base de datos. El frontend la pide por GET /api/noticias/categorias para armar el selector del
// formulario y el filtro de la página pública, así que nunca queda desactualizado.
//
// IMPORTANTE: el texto se guarda tal cual figura acá. Si se RENOMBRA una categoría, las noticias
// ya guardadas con el nombre viejo quedan con un valor que ya no está en la lista (hay que
// actualizarlas con un UPDATE en la base). Sumar categorías nuevas no tiene ese problema.
export const CATEGORIAS_NOTICIAS = [
  'Institucional',
  'Comunicados oficiales',
  'Eventos y capacitaciones',
  'Beneficios para socios',
  'Financiamiento y créditos',
  'Normativa e impuestos',
  'Economía y empresas',
  'Novedades del sector',
  'Otras',
];

// Categoría que se asigna cuando no se envía ninguna (y a las noticias cargadas antes de que
// existiera este campo).
export const CATEGORIA_POR_DEFECTO = 'Otras';
