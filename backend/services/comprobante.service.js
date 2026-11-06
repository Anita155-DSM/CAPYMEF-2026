import PDFDocument from 'pdfkit';

// La Cámara factura por ARCA: este PDF es solo una constancia y tiene que decirlo.
export const LEYENDA_NO_FACTURA =
  'Documento no válido como factura. La factura correspondiente es emitida por la Cámara a través de ARCA.';

/**
 * Genera el PDF de un comprobante de pago y lo devuelve como Buffer
 * (para poder adjuntarlo a un mail o mandarlo directo como respuesta HTTP).
 *
 * @param {Object} datos
 * @param {Object} datos.socio  - { razonSocial, cuit }
 * @param {Object} datos.cuota  - { mes_anio }
 * @param {Object} datos.pago   - { id, fechaPago, montoAbonado, metodoPago, nroComprobante, observaciones }
 * @returns {Promise<Buffer>}
 */
export const generarComprobantePago = ({ socio, cuota, pago }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    // En vez de escribir a un archivo, juntamos el PDF en memoria (Buffer),
    // así lo podemos tanto mandar por mail como devolver directo en una respuesta HTTP.
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ===== Encabezado =====
    doc
      .fontSize(20)
      .fillColor('#132A46')
      .text('CAPYMEF', { align: 'center' });
    doc
      .fontSize(11)
      .fillColor('#1D7BB6')
      .text('Cámara de Pequeñas y Medianas Empresas de Formosa', { align: 'center' });

    // Por qué "Constancia" y no "Recibo": la Cámara no emite recibos, factura a través de ARCA. Este PDF
    // solo deja constancia de que el pago quedó registrado en el sistema y no puede presentarse como
    // recibo ni como factura (lo mismo dicen los términos y condiciones del sitio).
    doc.moveDown(1.5);
    doc
      .fontSize(16)
      .fillColor('#000000')
      .text('Constancia de Pago', { align: 'center', underline: true });
    doc.moveDown(1);

    // ===== Datos de la constancia =====
    doc.fontSize(11).fillColor('#000000');
    doc.text(`Constancia N°: ${pago.id}`);
    doc.text(`Fecha de pago: ${new Date(pago.fechaPago).toLocaleDateString('es-AR')}`);
    doc.moveDown(0.8);

    // ===== Datos del socio =====
    doc.font('Helvetica-Bold').text('Datos del Socio');
    doc.font('Helvetica');
    doc.text(`Razón Social: ${socio.razonSocial}`);
    doc.text(`CUIT: ${socio.cuit}`);
    doc.moveDown(0.8);

    // ===== Detalle del pago =====
    doc.font('Helvetica-Bold').text('Detalle del Pago');
    doc.font('Helvetica');
    doc.text(`Período de la cuota: ${cuota.mes_anio}`);
    doc.text(`Monto abonado: $${Number(pago.montoAbonado).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`);
    doc.text(`Método de pago: ${pago.metodoPago}`);
    if (pago.nroComprobante) doc.text(`N° de comprobante: ${pago.nroComprobante}`);
    if (pago.observaciones) doc.text(`Observaciones: ${pago.observaciones}`);
    doc.moveDown(1.5);

    // ===== Pie =====
    // Leyenda obligatoria y visible (en negrita y más oscura que el resto del pie): quien reciba este
    // PDF tiene que saber que no sirve como factura.
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#333333')
      .text(LEYENDA_NO_FACTURA, { align: 'center' });
    doc.moveDown(0.5);
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#666666')
      .text(
        `Comprobante generado automáticamente por el sistema de CAPYMEF el ${new Date().toLocaleString('es-AR')}.`,
        { align: 'center' }
      );

    doc.end();
  });
};
