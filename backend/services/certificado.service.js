import PDFDocument from 'pdfkit';
import https from 'node:https';
import dns from 'node:dns';
import { formatearFechaArgentina, formatearFechaHoraArgentina } from '../utils/fechas.js';
import { motivoUrlDeLogoInvalida, crearLookupSeguro, MAXIMO_LOGOS_EXTERNOS } from './urlSegura.service.js';

// ==========================================
// Descarga de los logos externos (defensa contra SSRF)
// ==========================================
// El validador del evento ya rechaza URLs peligrosas al cargarlas, pero puede haber logos viejos guardados de
// antes, así que acá se vuelve a revisar todo antes de descargar. Antes se usaba fetch(url) sin controles: seguía
// redirecciones, no tenía tiempo máximo ni tope de tamaño, y descargaba cualquier cosa.
// Se usa https.request (y no fetch) porque permite pasarle un "lookup" propio: la verificación de que el dominio
// apunta a una IP pública se hace en la MISMA resolución de DNS que usa la conexión (ver crearLookupSeguro).

// Tiempo máximo TOTAL de cada logo (no solo de espera entre datos): un servidor lento no puede trabar el certificado.
export const TIEMPO_MAXIMO_LOGO_MS = 5000;
// Un logo para el pie de un certificado pesa unos KB. 2 MB es un tope holgado; si se pasa, se corta la descarga.
export const TAMANO_MAXIMO_LOGO_BYTES = 2 * 1024 * 1024;

// Solo PNG y JPEG, y se mira la firma de los primeros bytes: el content-type lo declara el otro servidor y puede
// mentir (pdfkit tampoco acepta otros formatos).
const FIRMA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const FIRMA_JPEG = Buffer.from([0xff, 0xd8, 0xff]);
const tipoSegunFirma = (buffer) => {
  if (buffer.subarray(0, FIRMA_PNG.length).equals(FIRMA_PNG)) return 'image/png';
  if (buffer.subarray(0, FIRMA_JPEG.length).equals(FIRMA_JPEG)) return 'image/jpeg';
  return null;
};
const TIPOS_ACEPTADOS = ['image/png', 'image/jpeg'];

// Aviso en el log sin datos sensibles: solo el dominio y el motivo (la URL completa podría traer un token).
const avisarDescarte = (host, motivo) => console.warn(`Logo externo descartado (${host || 'URL inválida'}): ${motivo}.`);

/**
 * Descarga un logo externo y devuelve su Buffer, o null si no cumple alguna regla o falla. Nunca lanza error:
 * un logo malo no puede impedir que se genere el certificado.
 * requestFn y lookupFn se reemplazan en los tests para no salir a internet.
 */
export const descargarLogoExterno = (url, {
  requestFn = https.request,
  lookupFn = dns.lookup,
  tiempoMaximoMs = TIEMPO_MAXIMO_LOGO_MS,
  tamanoMaximo = TAMANO_MAXIMO_LOGO_BYTES,
} = {}) => new Promise((resolve) => {
  let host = null;
  try { host = new URL(url).hostname; } catch { /* se informa abajo */ }

  const motivo = motivoUrlDeLogoInvalida(url);
  if (motivo) {
    avisarDescarte(host, `la URL ${motivo}`);
    return resolve(null);
  }

  let terminado = false;
  let pedido = null;
  const terminar = (buffer, motivoDescarte) => {
    if (terminado) return;
    terminado = true;
    clearTimeout(reloj);
    if (motivoDescarte) avisarDescarte(host, motivoDescarte);
    resolve(buffer);
  };
  const reloj = setTimeout(() => {
    pedido?.destroy();
    terminar(null, 'tardó demasiado');
  }, tiempoMaximoMs);

  try {
    pedido = requestFn(url, { method: 'GET', lookup: crearLookupSeguro(lookupFn), headers: { Accept: 'image/png, image/jpeg' } }, (respuesta) => {
      const estado = respuesta.statusCode;
      // Las redirecciones NO se siguen: podrían llevar a una dirección interna que no pasó por las verificaciones.
      if (estado >= 300 && estado < 400) {
        respuesta.resume();
        return terminar(null, 'respondió con una redirección (no se sigue)');
      }
      if (estado !== 200) {
        respuesta.resume();
        return terminar(null, `respondió ${estado}`);
      }

      const tipoDeclarado = String(respuesta.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      if (!TIPOS_ACEPTADOS.includes(tipoDeclarado)) {
        respuesta.resume();
        return terminar(null, 'no es una imagen PNG o JPEG');
      }

      // Si el servidor ya avisa que es más grande que el tope, ni se empieza a descargar.
      const tamanoDeclarado = Number(respuesta.headers['content-length']);
      if (Number.isFinite(tamanoDeclarado) && tamanoDeclarado > tamanoMaximo) {
        respuesta.destroy();
        return terminar(null, 'supera el tamaño máximo');
      }

      const partes = [];
      let total = 0;
      respuesta.on('data', (parte) => {
        total += parte.length;
        // Se corta apenas se pasa del tope (el content-length puede faltar o mentir).
        if (total > tamanoMaximo) {
          respuesta.destroy();
          pedido.destroy();
          return terminar(null, 'supera el tamaño máximo');
        }
        partes.push(parte);
      });
      respuesta.on('end', () => {
        const buffer = Buffer.concat(partes);
        if (tipoSegunFirma(buffer) !== tipoDeclarado) return terminar(null, 'el contenido no es la imagen que dice ser');
        terminar(buffer);
      });
      respuesta.on('error', () => terminar(null, 'se cortó la descarga'));
    });
    pedido.on('error', (error) => terminar(null, error.code === 'EDIRECCIONNOPUBLICA'
      ? 'el dominio apunta a una dirección que no es pública'
      : 'no se pudo conectar'));
    pedido.end();
  } catch {
    terminar(null, 'no se pudo conectar');
  }
});

/**
 * Genera el PDF de un certificado de asistencia y lo devuelve como Buffer.
 *
 * @param {Object} datos
 * @param {Object} datos.socio  - { razonSocial }
 * @param {Object} datos.evento - { titulo, fecha, modalidad, logosExternos }
 * @param {Object} [opcionesDescarga] - las de descargarLogoExterno (solo se usan en los tests)
 * @returns {Promise<Buffer>}
 */
export const generarCertificadoAsistencia = async ({ socio, evento }, opcionesDescarga = {}) => {
  // Bajamos todos los logos externos ANTES de armar el PDF (pdfkit necesita
  // los buffers ya listos, no puede esperar una descarga a mitad de dibujo).
  // Como mucho MAXIMO_LOGOS_EXTERNOS (un evento viejo podría tener más guardados) y en paralelo: cada uno tiene
  // su propio tiempo máximo, así el certificado no espera la suma de todos. Se conserva el orden.
  const urls = Array.isArray(evento.logosExternos) ? evento.logosExternos.slice(0, MAXIMO_LOGOS_EXTERNOS) : [];
  const descargados = await Promise.all(urls.map((logoUrl) => descargarLogoExterno(logoUrl, opcionesDescarga)));
  const logosDescargados = descargados.filter(Boolean);

  return new Promise((resolve, reject) => {
    // Orientación horizontal (landscape), típica de un certificado
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const anchoPagina = doc.page.width;

    // ===== Borde decorativo =====
    doc
      .lineWidth(2)
      .strokeColor('#1D7BB6')
      .rect(20, 20, anchoPagina - 40, doc.page.height - 40)
      .stroke();

    // ===== Encabezado institucional =====
    doc.moveDown(2);
    doc
      .fontSize(22)
      .fillColor('#132A46')
      .text('CAPYMEF', { align: 'center' });
    doc
      .fontSize(11)
      .fillColor('#1D7BB6')
      .text('Cámara de Pequeñas y Medianas Empresas de Formosa', { align: 'center' });

    doc.moveDown(2);

    // ===== Título del certificado =====
    doc
      .fontSize(30)
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .text('CERTIFICADO DE ASISTENCIA', { align: 'center' });

    doc.moveDown(2);

    // ===== Cuerpo =====
    doc
      .fontSize(13)
      .font('Helvetica')
      .fillColor('#333333')
      .text('Se certifica que', { align: 'center' });

    doc.moveDown(0.5);
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#1D7BB6')
      .text(socio.razonSocial, { align: 'center' });

    doc.moveDown(0.5);
    doc
      .fontSize(13)
      .font('Helvetica')
      .fillColor('#333333')
      .text('participó de la capacitación', { align: 'center' });

    doc.moveDown(0.5);
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#132A46')
      .text(`"${evento.titulo}"`, { align: 'center' });

    doc.moveDown(0.5);
    // evento.fecha es una fecha sin hora: con new Date(...) el certificado podía decir el día anterior.
    const fechaFormateada = formatearFechaArgentina(evento.fecha, {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#333333')
      .text(
        `realizada el ${fechaFormateada}, en modalidad ${evento.modalidad === 'virtual' ? 'virtual' : 'presencial'}.`,
        { align: 'center' }
      );

    // ===== Firmas =====
    const yFirmas = doc.page.height - 160;
    const anchoLinea = 180;

    doc
      .moveTo(anchoPagina / 2 - 220, yFirmas)
      .lineTo(anchoPagina / 2 - 220 + anchoLinea, yFirmas)
      .strokeColor('#000000')
      .lineWidth(1)
      .stroke();
    doc.fontSize(10).text('Presidente', anchoPagina / 2 - 220, yFirmas + 5, { width: anchoLinea, align: 'center' });

    doc
      .moveTo(anchoPagina / 2 + 40, yFirmas)
      .lineTo(anchoPagina / 2 + 40 + anchoLinea, yFirmas)
      .stroke();
    doc.fontSize(10).text('Secretario', anchoPagina / 2 + 40, yFirmas + 5, { width: anchoLinea, align: 'center' });

    // ===== Logos de entidades externas (gobierno, sponsors, etc.) =====
    if (logosDescargados.length > 0) {
      const yLogos = doc.page.height - 90;
      const anchoLogo = 70;
      const espacio = 20;
      const anchoTotal = logosDescargados.length * anchoLogo + (logosDescargados.length - 1) * espacio;
      let xActual = (anchoPagina - anchoTotal) / 2;

      for (const logoBuffer of logosDescargados) {
        try {
          doc.image(logoBuffer, xActual, yLogos, { fit: [anchoLogo, 50], align: 'center' });
        } catch (errorImagen) {
          console.error('Error al insertar un logo en el certificado:', errorImagen.message);
        }
        xActual += anchoLogo + espacio;
      }
    }

    // ===== Pie =====
    doc
      .fontSize(8)
      .fillColor('#999999')
      .text(
        `Certificado generado automáticamente por el sistema de CAPYMEF el ${formatearFechaHoraArgentina(new Date())}.`,
        50,
        doc.page.height - 35,
        { align: 'center', width: anchoPagina - 100 }
      );

    doc.end();
  });
};
