import '../helpers/entorno.js';
import { describe, expect, it } from 'vitest';
import {
  formatearFecha,
  formatearPeriodo,
  formatearMonto,
  diasEntre,
} from '../../services/notificacion.service.js';

// Son funciones puras (misma entrada -> misma salida, sin base de datos): arman los textos
// que reciben los socios en las notificaciones, así que un error acá se ve directo en pantalla.

describe('formatearFecha', () => {
  it('convierte una fecha ISO "AAAA-MM-DD" al formato argentino "DD/MM/AAAA"', () => {
    expect(formatearFecha('2026-10-10')).toBe('10/10/2026');
  });

  it('respeta los ceros a la izquierda de día y mes', () => {
    // Si se perdieran los ceros quedaría "5/3/2026", distinto al resto de las fechas del sistema.
    expect(formatearFecha('2026-03-05')).toBe('05/03/2026');
  });
});

describe('formatearPeriodo', () => {
  it('convierte un período "AAAA-MM" en "MM/AAAA"', () => {
    expect(formatearPeriodo('2026-08')).toBe('08/2026');
  });
});

describe('formatearMonto', () => {
  it('agrega el signo $ y el punto de miles argentino', () => {
    expect(formatearMonto(10000)).toBe('$10.000');
  });

  it('acepta el monto como texto, como lo devuelve Postgres para un DECIMAL', () => {
    // Sequelize devuelve los DECIMAL como string ("10000.00"); el formato tiene que ser el mismo.
    expect(formatearMonto('10000.00')).toBe('$10.000');
  });

  it('usa coma para los decimales, como se escribe en Argentina', () => {
    expect(formatearMonto(1500.5)).toBe('$1.500,5');
  });

  it('formatea el cero sin romperse', () => {
    expect(formatearMonto(0)).toBe('$0');
  });
});

describe('diasEntre', () => {
  it('cuenta los días entre dos fechas del mismo mes', () => {
    expect(diasEntre('2026-10-01', '2026-10-10')).toBe(9);
  });

  it('devuelve cero si las dos fechas son el mismo día', () => {
    expect(diasEntre('2026-10-10', '2026-10-10')).toBe(0);
  });

  it('cruza correctamente el cambio de mes y de año', () => {
    expect(diasEntre('2026-12-30', '2027-01-02')).toBe(3);
  });

  it('tiene en cuenta el 29 de febrero de los años bisiestos', () => {
    // 2028 es bisiesto: del 28/02 al 01/03 hay 2 días (pasa por el 29).
    expect(diasEntre('2028-02-28', '2028-03-01')).toBe(2);
  });

  it('da un número negativo si la fecha final es anterior a la inicial', () => {
    expect(diasEntre('2026-10-10', '2026-10-07')).toBe(-3);
  });
});
