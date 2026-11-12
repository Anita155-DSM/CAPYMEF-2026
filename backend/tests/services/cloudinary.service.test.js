import { afterEach, describe, expect, it, vi } from 'vitest';

// Cloudinary se reemplaza por un falso: nada sale a internet. Se prueba lo que hace NUESTRO código con
// sus respuestas (borrar sin romper el flujo, reconstruir el public_id, subir un PDF desde memoria).
const { destroy, upload_stream } = vi.hoisted(() => ({ destroy: vi.fn(), upload_stream: vi.fn() }));
vi.mock('cloudinary', () => ({ v2: { uploader: { destroy, upload_stream } } }));

const { eliminarImagenCloudinary, extraerPublicIdDeUrl, subirPDFCloudinary } = await import('../../services/cloudinary.service.js');
const { Writable } = await import('node:stream');

afterEach(() => {
  vi.restoreAllMocks();
  destroy.mockReset();
  upload_stream.mockReset();
});

describe('extraerPublicIdDeUrl', () => {
  it('saca la versión y la extensión de una URL de Cloudinary', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1712345678/capymef_noticias/abc123.webp';

    expect(extraerPublicIdDeUrl(url)).toBe('capymef_noticias/abc123');
  });

  it('funciona también sin número de versión', () => {
    expect(extraerPublicIdDeUrl('https://res.cloudinary.com/demo/raw/upload/capymef_comprobantes_pago/comprobante-1.pdf')).toBe('capymef_comprobantes_pago/comprobante-1');
  });

  it('conserva las subcarpetas', () => {
    expect(extraerPublicIdDeUrl('https://res.cloudinary.com/demo/image/upload/v1/a/b/c/foto.png')).toBe('a/b/c/foto');
  });

  it.each([
    ['vacía', ''],
    ['null', null],
    ['de otro sitio', 'https://otro-sitio.com/upload/v1/foto.png'],
    ['de Cloudinary sin /upload/', 'https://res.cloudinary.com/demo/image/foto.png'],
  ])('con una URL %s devuelve null (no hay nada que borrar)', (_, url) => {
    expect(extraerPublicIdDeUrl(url)).toBeNull();
  });
});

describe('eliminarImagenCloudinary', () => {
  it('pide a Cloudinary que borre el archivo con ese public_id', async () => {
    destroy.mockResolvedValue({ result: 'ok' });

    await eliminarImagenCloudinary('capymef_noticias/abc123');

    expect(destroy).toHaveBeenCalledWith('capymef_noticias/abc123');
  });

  it('sin public_id no llama a Cloudinary', async () => {
    await eliminarImagenCloudinary(null);

    expect(destroy).not.toHaveBeenCalled();
  });

  it('si Cloudinary falla no lanza el error (solo lo deja en el log), para no tapar el error original', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    destroy.mockRejectedValue(new Error('Cloudinary no responde'));

    await expect(eliminarImagenCloudinary('x')).resolves.toBeUndefined();
    expect(errorLog).toHaveBeenCalled();
  });
});

describe('subirPDFCloudinary', () => {
  // Simula el stream de subida de Cloudinary: junta lo que se le escribe y, al terminar, llama al
  // callback con el resultado (o con un error).
  const simularSubida = ({ error = null } = {}) => {
    const recibido = [];
    upload_stream.mockImplementation((opciones, callback) =>
      new Writable({
        write(chunk, _, listo) { recibido.push(chunk); listo(); },
        final(listo) {
          listo();
          if (error) callback(error);
          else callback(null, { secure_url: `https://res.cloudinary.com/demo/raw/upload/${opciones.folder}/${opciones.public_id}.pdf` });
        },
      })
    );
    return recibido;
  };

  it('sube el PDF desde memoria con la carpeta y el nombre indicados, como PDF privado (authenticated)', async () => {
    const recibido = simularSubida();
    const pdf = Buffer.from('%PDF-1.4 contenido');

    const resultado = await subirPDFCloudinary(pdf, { folder: 'capymef_comprobantes_pago', public_id: 'comprobante-9' });

    expect(upload_stream).toHaveBeenCalledWith(
      { folder: 'capymef_comprobantes_pago', public_id: 'comprobante-9', resource_type: 'auto', format: 'pdf', type: 'authenticated' },
      expect.any(Function)
    );
    expect(Buffer.concat(recibido).equals(pdf)).toBe(true);
    expect(resultado.secure_url).toBe('https://res.cloudinary.com/demo/raw/upload/capymef_comprobantes_pago/comprobante-9.pdf');
  });

  it('si Cloudinary responde con error, la promesa se rechaza con ese error', async () => {
    simularSubida({ error: new Error('cuota de almacenamiento excedida') });

    await expect(subirPDFCloudinary(Buffer.from('%PDF'), { folder: 'x', public_id: 'y' })).rejects.toThrow('cuota de almacenamiento excedida');
  });
});
