import PDFDocument from 'pdfkit';

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

    doc.moveDown(1.5);
    doc
      .fontSize(16)
      .fillColor('#000000')
      .text('Recibo de Pago', { align: 'center', underline: true });
    doc.moveDown(1);

    // ===== Datos del recibo =====
    doc.fontSize(11).fillColor('#000000');
    doc.text(`Recibo N°: ${pago.id}`);
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
    doc
      .fontSize(9)
      .fillColor('#666666')
      .text(
        `Comprobante generado automáticamente por el sistema de CAPYMEF el ${new Date().toLocaleString('es-AR')}.`,
        { align: 'center' }
      );

    doc.end();
  });
};
