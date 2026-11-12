import zlib from 'node:zlib';

// Lee el texto que quedó escrito dentro de un PDF generado con pdfkit (no solo lo que se le pidió dibujar).
// pdfkit comprime cada página con zlib y escribe el texto en hexadecimal dentro de operadores TJ:
// [<4361...> 30 <6d...>] TJ. Alcanza con descomprimir y decodificar, sin sumar librerías.
// Es la misma técnica que usa comprobante.service.test.js; está acá para reutilizarla en otros tests.
export const extraerTextoPdf = (pdf) => {
  const binario = pdf.toString('latin1');
  const lineas = [];
  for (const stream of binario.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    let contenido;
    try {
      contenido = zlib.inflateSync(Buffer.from(stream[1], 'latin1')).toString('latin1');
    } catch {
      continue; // no es un stream comprimido de texto (por ejemplo, una fuente o una imagen)
    }
    for (const tj of contenido.matchAll(/\[(.*?)\]\s*TJ/g)) {
      lineas.push([...tj[1].matchAll(/<([0-9a-fA-F]*)>/g)].map((h) => Buffer.from(h[1], 'hex').toString('latin1')).join(''));
    }
  }
  // Una frase larga puede quedar partida en dos renglones: se une todo con espacios.
  return lineas.join(' ').replace(/\s+/g, ' ');
};

// Un PDF válido empieza con "%PDF".
export const esPdf = (buffer) => Buffer.isBuffer(buffer) && buffer.subarray(0, 4).toString('latin1') === '%PDF';
