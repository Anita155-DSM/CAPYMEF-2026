import '../helpers/entorno.js';
import { describe, expect, it, vi } from 'vitest';
import { esUrlDeCloudinary, descargarPdfGuardado } from '../../services/comprobanteGuardado.service.js';

// Nunca se sale a internet: descargarPdfGuardado recibe un fetchFn falso que devuelve lo que cada
// test necesita (un PDF, un error, una respuesta vacía...).

const URL_CLOUDINARY = 'https://res.cloudinary.com/demo/raw/upload/comprobante.pdf';

// Arma una respuesta parecida a la de fetch con el contenido indicado.
const respuestaFalsa = (contenido, { ok = true } = {}) => ({
  ok,
  arrayBuffer: async () => {
    const buffer = Buffer.from(contenido);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  },
});

describe('esUrlDeCloudinary', () => {
  it('acepta una URL https de res.cloudinary.com', () => {
    expect(esUrlDeCloudinary('https://res.cloudinary.com/demo/raw/upload/x')).toBe(true);
  });

  it.each([
    ['http sin cifrar', 'http://res.cloudinary.com/demo/raw/upload/x'],
    ['otro dominio', 'https://ejemplo.com/demo/raw/upload/x'],
    // El clásico engaño: el dominio empieza igual pero en realidad es "evil.com".
    ['un dominio que solo empieza igual', 'https://res.cloudinary.com.evil.com/x'],
    // Cualquiera puede registrar un dominio que TERMINA en "cloudinary.com": no alcanza con mirar el final.
    ['un dominio ajeno que termina en cloudinary.com', 'https://evilcloudinary.com/x'],
    // Solo se descargan archivos de res.cloudinary.com, que es donde se guardan los comprobantes.
    ['otro subdominio de cloudinary', 'https://otro.cloudinary.com/x'],
    ['el dominio raíz de cloudinary', 'https://cloudinary.com/x'],
    // Lo que va antes de la @ es un usuario, no el dominio: el destino real es evil.com.
    ['el truco del usuario antes de la @', 'https://res.cloudinary.com@evil.com/x'],
    ['una IP (por ejemplo, un servicio interno)', 'https://169.254.169.254/latest/meta-data'],
    ['texto que no es una URL', 'esto no es una url'],
    ['una cadena vacía', ''],
    ['null', null],
    ['undefined', undefined],
  ])('rechaza %s', (_, url) => {
    expect(esUrlDeCloudinary(url)).toBe(false);
  });
});

describe('descargarPdfGuardado', () => {
  it('con un PDF válido devuelve un Buffer con el mismo contenido', async () => {
    const contenido = '%PDF-1.4 comprobante de prueba';
    const fetchFn = vi.fn().mockResolvedValue(respuestaFalsa(contenido));

    const resultado = await descargarPdfGuardado(URL_CLOUDINARY, { fetchFn });

    expect(Buffer.isBuffer(resultado)).toBe(true);
    expect(resultado.toString('latin1')).toBe(contenido);
  });

  it('pide el archivo sin seguir redirecciones y con un tiempo máximo', async () => {
    // redirect: 'error' evita que Cloudinary (o quien sea) nos mande a otro sitio;
    // la signal corta la descarga si no responde.
    const fetchFn = vi.fn().mockResolvedValue(respuestaFalsa('%PDF-1.4'));

    await descargarPdfGuardado(URL_CLOUDINARY, { fetchFn });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, opciones] = fetchFn.mock.calls[0];
    expect(url).toBe(URL_CLOUDINARY);
    expect(opciones.redirect).toBe('error');
    expect(opciones.signal).toBeInstanceOf(AbortSignal);
  });

  it('con una URL ajena devuelve null y ni siquiera hace la petición', async () => {
    const fetchFn = vi.fn();

    const resultado = await descargarPdfGuardado('https://ejemplo.com/comprobante.pdf', { fetchFn });

    expect(resultado).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('con un dominio ajeno que termina en cloudinary.com devuelve null y no hace la petición', async () => {
    const fetchFn = vi.fn();

    const resultado = await descargarPdfGuardado('https://evilcloudinary.com/x.pdf', { fetchFn });

    expect(resultado).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('si la respuesta no es ok (por ejemplo, 404) devuelve null', async () => {
    const fetchFn = vi.fn().mockResolvedValue(respuestaFalsa('', { ok: false }));

    expect(await descargarPdfGuardado(URL_CLOUDINARY, { fetchFn })).toBeNull();
  });

  it('si el contenido no empieza con %PDF devuelve null', async () => {
    // No se confía en el Content-Type: un HTML de error con status 200 no debe entregarse como comprobante.
    const fetchFn = vi.fn().mockResolvedValue(respuestaFalsa('<html>error</html>'));

    expect(await descargarPdfGuardado(URL_CLOUDINARY, { fetchFn })).toBeNull();
  });

  it('si el cuerpo viene vacío devuelve null', async () => {
    const fetchFn = vi.fn().mockResolvedValue(respuestaFalsa(''));

    expect(await descargarPdfGuardado(URL_CLOUDINARY, { fetchFn })).toBeNull();
  });

  it('si la petición lanza un error devuelve null sin romper', async () => {
    // Cloudinary caído o sin red: quien la llama regenera el PDF como plan B.
    const fetchFn = vi.fn().mockRejectedValue(new Error('sin conexión'));
    const espia = vi.spyOn(console, 'error').mockImplementation(() => {}); // evita ensuciar la salida

    const resultado = await descargarPdfGuardado(URL_CLOUDINARY, { fetchFn });

    expect(resultado).toBeNull();
    espia.mockRestore();
  });
});
