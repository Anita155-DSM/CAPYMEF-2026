import '../helpers/entorno.js';
import { describe, expect, it } from 'vitest';
import { CATEGORIAS_NOTICIAS, CATEGORIA_POR_DEFECTO } from '../../config/categoriasNoticias.js';
import { Noticia } from '../../models/noticia.models.js';

// La lista de categorías de noticias es fija en código. Estos tests cuidan que siga siendo coherente
// con el modelo y con lo que espera el frontend (un selector sin repetidos).
describe('categorías de noticias', () => {
  it('la categoría por defecto es "Otras" y está en la lista', () => {
    expect(CATEGORIA_POR_DEFECTO).toBe('Otras');
    expect(CATEGORIAS_NOTICIAS).toContain(CATEGORIA_POR_DEFECTO);
  });

  it('el valor por defecto del modelo Noticia es el mismo que el de la configuración', () => {
    expect(Noticia.rawAttributes.categoria.defaultValue).toBe(CATEGORIA_POR_DEFECTO);
  });

  it('no hay categorías repetidas, ni siquiera cambiando mayúsculas', () => {
    const normalizadas = CATEGORIAS_NOTICIAS.map((c) => c.toLowerCase());

    expect(new Set(normalizadas).size).toBe(CATEGORIAS_NOTICIAS.length);
  });

  it('ninguna categoría tiene espacios de más ni supera el largo de la columna (60 caracteres)', () => {
    for (const categoria of CATEGORIAS_NOTICIAS) {
      expect(categoria).toBe(categoria.trim());
      expect(categoria.length).toBeGreaterThan(0);
      expect(categoria.length).toBeLessThanOrEqual(60);
    }
  });

  it('"Otras" va última en la lista (es la opción de descarte del selector)', () => {
    expect(CATEGORIAS_NOTICIAS.at(-1)).toBe('Otras');
  });
});
