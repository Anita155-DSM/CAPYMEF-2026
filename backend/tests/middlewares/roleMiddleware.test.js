import '../helpers/entorno.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { verificarAdmin } from '../../middlewares/roleMiddleware.js';
import { CODIGOS_AUTH } from '../../middlewares/codigosAuth.js';

// verificarAdmin se prueba solo, con un req/res falsos: no necesita base ni servidor. Lo que importa es
// quién pasa, qué responde a quien no pasa y que nunca deje pasar por error.
const armarRes = () => {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('verificarAdmin', () => {
  it('deja pasar a un usuario con rol admin (llama a next y no responde nada)', () => {
    const res = armarRes();
    const next = vi.fn();

    verificarAdmin({ usuario: { id: 1, rol: 'admin' } }, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('a un socio le responde 403 con el código SIN_PERMISOS (la sesión sigue siendo válida)', () => {
    const res = armarRes();
    const next = vi.fn();

    verificarAdmin({ usuario: { id: 2, rol: 'socio' } }, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      exito: false,
      mensaje: 'Acceso denegado. Se requieren permisos de Administrador para realizar esta acción.',
      codigo: CODIGOS_AUTH.SIN_PERMISOS,
    });
  });

  it('si no hay usuario en la petición (verificarToken no corrió) también responde 403', () => {
    const res = armarRes();
    const next = vi.fn();

    verificarAdmin({}, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it.each(['Admin', 'ADMIN', ' admin', 'administrador'])('un rol parecido pero distinto ("%s") no pasa: la comparación es exacta', (rol) => {
    const res = armarRes();
    const next = vi.fn();

    verificarAdmin({ usuario: { rol } }, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('si algo falla adentro responde 500 con un mensaje genérico, sin dejar pasar', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = armarRes();
    const next = vi.fn();
    // Un req.usuario cuyo "rol" explota al leerse simula un error inesperado.
    const req = { usuario: Object.defineProperty({}, 'rol', { get: () => { throw new Error('falla'); } }) };

    verificarAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ exito: false, mensaje: 'Error interno al verificar permisos.' });
  });
});

describe('CODIGOS_AUTH', () => {
  it('no se puede modificar en tiempo de ejecución (está congelado)', () => {
    expect(Object.isFrozen(CODIGOS_AUTH)).toBe(true);
  });

  it('cada código es igual a su propio nombre, así el frontend puede compararlos como texto', () => {
    for (const [nombre, valor] of Object.entries(CODIGOS_AUTH)) {
      expect(valor).toBe(nombre);
    }
  });
});
