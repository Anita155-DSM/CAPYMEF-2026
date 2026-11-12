import { describe, expect, it } from 'vitest';
import { tieneEnlacePrivado, ocultarLugarSiCorresponde } from '../../services/privacidadEvento.service.js';

// Funciones puras: deciden si el `lugar` de un evento (el link de la reunión, en los virtuales) se le
// muestra o no a quien consulta. No necesitan base de datos.
const LINK = 'https://meet.ejemplo.test/abc-defg-hij';
const virtual = { id: 'e1', titulo: 'Charla', modalidad: 'virtual', lugar: LINK };
const presencial = { id: 'e2', titulo: 'Taller', modalidad: 'presencial', lugar: 'Maipú 651, Formosa' };

describe('tieneEnlacePrivado', () => {
  it('un evento virtual tiene un link privado', () => {
    expect(tieneEnlacePrivado(virtual)).toBe(true);
  });

  it('un evento presencial no: su lugar es una dirección pública', () => {
    expect(tieneEnlacePrivado(presencial)).toBe(false);
  });

  it.each([null, undefined, {}, { modalidad: 'VIRTUAL' }])('con un evento vacío o una modalidad desconocida (%j) responde false sin romperse', (evento) => {
    expect(tieneEnlacePrivado(evento)).toBe(false);
  });
});

describe('ocultarLugarSiCorresponde', () => {
  it('virtual + quien NO puede verlo: devuelve el evento con lugar null', () => {
    expect(ocultarLugarSiCorresponde(virtual, false)).toEqual({ ...virtual, lugar: null });
  });

  it('virtual + quien SÍ puede verlo (admin o inscripto): devuelve el link', () => {
    expect(ocultarLugarSiCorresponde(virtual, true).lugar).toBe(LINK);
  });

  it('presencial: la dirección se muestra siempre, pueda o no ver links privados', () => {
    expect(ocultarLugarSiCorresponde(presencial, false).lugar).toBe('Maipú 651, Formosa');
  });

  it('nunca modifica el objeto recibido (devuelve una copia al ocultar)', () => {
    const original = { ...virtual };

    const resultado = ocultarLugarSiCorresponde(original, false);

    expect(original.lugar).toBe(LINK);
    expect(resultado).not.toBe(original);
  });

  it('conserva el resto de los campos del evento sin cambios', () => {
    const conExtras = { ...virtual, yaInscripto: false, cupoDisponible: 10 };

    expect(ocultarLugarSiCorresponde(conExtras, false)).toEqual({ ...conExtras, lugar: null });
  });
});
