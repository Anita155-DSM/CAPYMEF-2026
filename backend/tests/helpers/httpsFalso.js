import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';

// https y DNS falsos para probar la descarga de logos externos sin salir a internet.
//
// crearDnsFalso({ 'host.test': ['93.184.216.34'] }): un dns.lookup que responde esas direcciones (y para un host
// que no está en la lista, una IP pública inventada).
//
// crearHttpsFalso({ 'https://host.test/logo.png': { status, headers, body | partes, nuncaResponde } }): un
// https.request que, igual que el de verdad, primero resuelve el nombre con el `lookup` que le pasa el código
// (así se prueba el lookup seguro) y recién después "responde". Anota cada pedido en `pedidos`.
export const IP_PUBLICA_DE_PRUEBA = '93.184.216.34';

export const crearDnsFalso = (direccionesPorHost = {}) => {
  const consultas = [];
  const lookup = (hostname, opciones, callback) => {
    consultas.push(hostname);
    const direcciones = (direccionesPorHost[hostname] ?? [IP_PUBLICA_DE_PRUEBA]).map((address) => ({
      address,
      family: address.includes(':') ? 6 : 4,
    }));
    setImmediate(() => {
      if (opciones?.all) callback(null, direcciones);
      else callback(null, direcciones[0].address, direcciones[0].family);
    });
  };
  return { lookup, consultas };
};

export const crearHttpsFalso = (respuestasPorUrl = {}) => {
  const pedidos = [];
  const request = (url, opciones, callback) => {
    const pedido = new EventEmitter();
    let destruido = false;
    const registro = { url, opciones, destruido: false, respondio: false };
    pedidos.push(registro);
    pedido.destroy = () => { destruido = true; registro.destruido = true; };
    pedido.end = () => {
      const { hostname } = new URL(url);
      // Como en la conexión real: si el lookup rechaza el host, el pedido falla y nunca llega a responder.
      opciones.lookup(hostname, {}, (error) => {
        if (destruido) return;
        if (error) return pedido.emit('error', error);
        const definida = respuestasPorUrl[url] ?? { status: 404, headers: {}, body: Buffer.alloc(0) };
        if (definida.nuncaResponde) return;
        const partes = definida.partes ?? [definida.body ?? Buffer.alloc(0)];
        const respuesta = Readable.from(partes);
        respuesta.statusCode = definida.status;
        respuesta.headers = definida.headers ?? {};
        registro.respondio = true;
        callback(respuesta);
      });
    };
    return pedido;
  };
  return { request, pedidos };
};

// Imágenes mínimas de verdad (pdfkit las puede insertar).
export const PNG_1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
export const respuestaPng = (body = PNG_1x1) => ({ status: 200, headers: { 'content-type': 'image/png', 'content-length': String(body.length) }, body });

// Cuántas imágenes quedaron dentro de un PDF de pdfkit. Una imagen con transparencia (como el PNG de prueba) se
// guarda como dos objetos /Image: la imagen y su máscara (/SMask). Se descuentan las máscaras.
export const imagenesEnPdf = (pdf) => {
  const texto = pdf.toString('latin1');
  const objetosImagen = (texto.match(/\/Subtype \/Image/g) || []).length;
  const mascaras = (texto.match(/\/SMask \d+ 0 R/g) || []).length;
  return objetosImagen - mascaras;
};
