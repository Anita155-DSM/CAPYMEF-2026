import '../helpers/entorno.js';
import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { validacionEvento, validacionActualizarEvento } from '../../middlewares/validator/evento.validator.js';

// Los validadores de eventos se prueban delante de un controlador falso, sin base de datos.
const app = express();
app.use(express.json());
const ok = (req, res) => res.status(200).json({ body: req.body });
app.post('/evento', validacionEvento, ok);
app.put('/evento', validacionActualizarEvento, ok);

const eventoValido = {
  titulo: 'Capacitación en facturación electrónica',
  descripcion: 'Cómo emitir facturas desde el sistema de ARCA.',
  fecha: '2026-12-10',
};

const crear = (datos) => request(app).post('/evento').send({ ...eventoValido, ...datos });
const actualizar = (datos) => request(app).put('/evento').send(datos);
const campos = (respuesta) => respuesta.body.errores.map((e) => e.campo);

describe('validacionEvento (crear)', () => {
  it('acepta un evento con solo los campos obligatorios', async () => {
    expect((await crear({})).status).toBe(200);
  });

  it('acepta un evento completo', async () => {
    const respuesta = await crear({
      horaInicio: '18:00',
      horaFin: '20:30',
      modalidad: 'virtual',
      lugar: 'https://meet.ejemplo.test/abc',
      cupoMaximo: '50',
      estado: 'programado',
      logosExternos: JSON.stringify(['https://logos.test/gobierno.png', 'http://logos.test/sponsor.jpg']),
    });

    expect(respuesta.status).toBe(200);
  });

  it.each(['titulo', 'descripcion', 'fecha'])('sin %s responde 400', async (campo) => {
    const { [campo]: _, ...sinCampo } = eventoValido;

    const respuesta = await request(app).post('/evento').send(sinCampo);

    expect(respuesta.status).toBe(400);
    expect(campos(respuesta)).toContain(campo);
  });

  it('un título de menos de 5 caracteres se rechaza', async () => {
    expect(campos(await crear({ titulo: 'Taller'.slice(0, 4) }))).toEqual(['titulo']);
  });

  it('una fecha que no es fecha se rechaza', async () => {
    expect(campos(await crear({ fecha: '10/12/2026' }))).toEqual(['fecha']);
  });

  it.each(['24:00', '9:00', '18:60', '18hs'])('la hora "%s" no tiene formato HH:MM y se rechaza', async (hora) => {
    const respuesta = await crear({ horaInicio: hora, horaFin: hora });

    expect(campos(respuesta)).toEqual(['horaInicio', 'horaFin']);
  });

  it('la modalidad solo puede ser presencial o virtual', async () => {
    expect(campos(await crear({ modalidad: 'hibrido' }))).toEqual(['modalidad']);
  });

  it('el lugar no puede superar los 255 caracteres', async () => {
    expect(campos(await crear({ lugar: 'x'.repeat(256) }))).toEqual(['lugar']);
  });

  it.each(['0', '-3', '2.5', 'muchos'])('un cupo máximo "%s" se rechaza (tiene que ser un entero mayor a 0)', async (cupoMaximo) => {
    expect(campos(await crear({ cupoMaximo }))).toEqual(['cupoMaximo']);
  });

  it('un cupo vacío se toma como "sin cupo" y no da error', async () => {
    expect((await crear({ cupoMaximo: '' })).status).toBe(200);
  });

  it('el estado solo puede ser programado, finalizado o cancelado', async () => {
    expect(campos(await crear({ estado: 'suspendido' }))).toEqual(['estado']);
  });

  it.each([
    ['no es JSON', 'https://logo.test/a.png', 'logosExternos debe ser un array de URLs en formato JSON.'],
    ['es JSON pero no un array', JSON.stringify({ url: 'https://logo.test/a.png' }), 'logosExternos debe ser un array.'],
    ['tiene una URL sin http/https', JSON.stringify(['https://logo.test/a.png', 'ftp://logo.test/b.png']), 'Todas las URLs de logosExternos deben ser links válidos (http/https).'],
    ['tiene algo que no es texto', JSON.stringify([123]), 'Todas las URLs de logosExternos deben ser links válidos (http/https).'],
  ])('logosExternos que %s se rechaza con un mensaje claro', async (_, logosExternos, mensaje) => {
    const respuesta = await crear({ logosExternos });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toEqual([{ campo: 'logosExternos', mensaje }]);
  });

  it('logosExternos vacío o como array vacío es válido', async () => {
    expect((await crear({ logosExternos: '' })).status).toBe(200);
    expect((await crear({ logosExternos: '[]' })).status).toBe(200);
  });
});

describe('validacionActualizarEvento (editar)', () => {
  it('un body vacío es válido: en la edición todo es opcional', async () => {
    expect((await actualizar({})).status).toBe(200);
  });

  it('la descripción, si se manda, no puede quedar vacía', async () => {
    const respuesta = await actualizar({ descripcion: '   ' });

    expect(respuesta.body.errores).toEqual([{ campo: 'descripcion', mensaje: 'La descripción no puede quedar vacía.' }]);
  });

  it('aplica las mismas reglas de formato que al crear', async () => {
    const respuesta = await actualizar({ titulo: 'Abc', fecha: 'mañana', horaInicio: '25:00', modalidad: 'mixta', estado: 'borrado', cupoMaximo: '0' });

    expect(respuesta.status).toBe(400);
    expect(campos(respuesta)).toEqual(['titulo', 'fecha', 'horaInicio', 'modalidad', 'cupoMaximo', 'estado']);
  });

  it('también revisa los logos externos', async () => {
    expect(campos(await actualizar({ logosExternos: 'no-json' }))).toEqual(['logosExternos']);
  });
});
