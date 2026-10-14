import PDFDocument from 'pdfkit';

/**
 * Descarga una imagen desde una URL y la devuelve como Buffer, para poder
 * insertarla en el PDF con pdfkit (que necesita Buffer o ruta local, no una URL).
 * Si falla la descarga, devuelve null en vez de tirar error — así un logo roto
 * no tira abajo la generación de todo el certificado.
 */
const obtenerImagenComoBuffer = async (url) => {
  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) return null;
    const arrayBuffer = await respuesta.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`No se pudo descargar el logo externo (${url}):`, error.message);
    return null;
  }
};

/**
 * Genera el PDF de un certificado de asistencia y lo devuelve como Buffer.
 *
 * @param {Object} datos
 * @param {Object} datos.socio  - { razonSocial }
 * @param {Object} datos.evento - { titulo, fecha, modalidad, logosExternos }
 * @returns {Promise<Buffer>}
 */
export const generarCertificadoAsistencia = async ({ socio, evento }) => {
  // Bajamos todos los logos externos ANTES de armar el PDF (pdfkit necesita
  // los buffers ya listos, no puede esperar una descarga a mitad de dibujo).
  const logosDescargados = [];
  if (Array.isArray(evento.logosExternos) && evento.logosExternos.length > 0) {
    for (const logoUrl of evento.logosExternos) {
      const buffer = await obtenerImagenComoBuffer(logoUrl);
      if (buffer) logosDescargados.push(buffer);
    }
  }

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
    const fechaFormateada = new Date(evento.fecha).toLocaleDateString('es-AR', {
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
        `Certificado generado automáticamente por el sistema de CAPYMEF el ${new Date().toLocaleString('es-AR')}.`,
        50,
        doc.page.height - 35,
        { align: 'center', width: anchoPagina - 100 }
      );

    doc.end();
  });
};
