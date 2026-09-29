/**
 * Estado de la pantalla de formularios de la APK (`recuperacion-de-formulario.ts`, la lógica que usa la pantalla con
 * `useReducer`). Detecta los dos defectos de la auditoría del PR #113:
 * - A: después de «ya no se puede responder», cargar lo guardado podía dejar el envío habilitado con `response: null`;
 * - B: si esa carga fallaba, el reintento era una carga común y se perdía el tratamiento de la recuperación.
 * Cubre también la diferencia entre una solicitud pendiente válida y una que no admite respuesta (las dos tienen
 * `response: null`), la conservación del borrador y la reevaluación al volver a leer.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Resultado } from './cliente-http';
import type { ListaDeSolicitudesPropiasResponse } from './contratos-formularios';
import { COPY_FORMULARIOS } from './copy-formularios';
import type { DesenlaceDeEnvio } from './errores-de-formulario';
import {
  estadoInicialDeFormulario,
  habilitacion,
  reducirFormulario,
  respondibleDe,
  sePuedeEnviar,
  type EstadoDeFormulario,
  type EventoDeFormulario,
  type VistaDeSolicitud,
} from './recuperacion-de-formulario';

const pendienteValida: VistaDeSolicitud = { status: 'PENDING', response: null, respondable: true };
const pendienteNoRespondible: VistaDeSolicitud = { status: 'PENDING', response: null, respondable: false };
const respondida: VistaDeSolicitud = { status: 'RESPONDED', response: { effectiveView: { kind: 'ORIGINAL' } }, respondable: false };
const historiaNoResoluble: VistaDeSolicitud = { status: 'RESPONDED', response: { effectiveView: { kind: 'NOT_RESOLVABLE' } }, respondable: false };

const aplicar = (eventos: EventoDeFormulario[], inicio: EstadoDeFormulario = estadoInicialDeFormulario) => eventos.reduce(reducirFormulario, inicio);
/** Pantalla abierta sobre `vista`, con un borrador escrito (días 9, minutos 45 y un motivo). */
const conBorrador = (vista: VistaDeSolicitud) =>
  aplicar([
    { tipo: 'carga-lista', vista },
    { tipo: 'editar-valor', fieldCode: 'trn_dias_por_semana', valor: '9' },
    { tipo: 'editar-valor', fieldCode: 'trn_minutos_por_sesion', valor: '45' },
    { tipo: 'editar-motivo', motivo: 'Tengo un día más' },
  ]);
const BORRADOR = { valores: { trn_dias_por_semana: '9', trn_minutos_por_sesion: '45' }, motivo: 'Tengo un día más' };

const yaNoResponde: DesenlaceDeEnvio = { tipo: 'ya-no-se-puede', sobre: 'respuesta', mensaje: COPY_FORMULARIOS.noSePuedeResponderYa, acciones: ['cargar', 'volver'] };
const versionVieja: DesenlaceDeEnvio = { tipo: 'version-vieja', mensaje: COPY_FORMULARIOS.respuestaCambioAntesDeCorregir, acciones: ['cargar', 'volver'] };
const envioAnterior: DesenlaceDeEnvio = { tipo: 'envio-anterior-guardado', mensaje: COPY_FORMULARIOS.envioAnteriorGuardado, acciones: ['cargar', 'volver'] };

// ─── Qué admite la solicitud: del contrato, no de `response: null` ──────────────────────────────

test('habilitación · response null no quiere decir bloqueada: pendiente y respondable se responde; pendiente sin respondable, no', () => {
  assert.deepEqual(habilitacion(pendienteValida), { modo: 'responder' });
  assert.deepEqual(habilitacion(pendienteNoRespondible), { modo: 'sin-accion', motivo: 'no-admite-respuesta' });
  assert.deepEqual(habilitacion(respondida), { modo: 'corregir' });
  assert.deepEqual(habilitacion(historiaNoResoluble), { modo: 'sin-accion', motivo: 'no-admite-correccion' });
});

test('abrir una pendiente válida habilita el envío; abrir una que ya no admite respuesta lo deja deshabilitado, sin aviso de recuperación', () => {
  const valida = aplicar([{ tipo: 'carga-lista', vista: pendienteValida }]);
  assert.equal(sePuedeEnviar(valida), true);
  const bloqueada = aplicar([{ tipo: 'carga-lista', vista: pendienteNoRespondible }]);
  assert.equal(sePuedeEnviar(bloqueada), false);
  assert.equal(bloqueada.suspension, 'no-admite-respuesta');
  assert.equal(bloqueada.aviso, null);
});

// ─── Defecto A ──────────────────────────────────────────────────────────────────────────────────

test('A · «ya no se puede responder» suspende el envío; cargar lo guardado con response null y sin respondable lo deja suspendido, lo dice y conserva el borrador', () => {
  const rechazada = aplicar([{ tipo: 'enviando' }, { tipo: 'rechazado', desenlace: yaNoResponde }], conBorrador(pendienteValida));
  assert.equal(sePuedeEnviar(rechazada), false, 'después del rechazo no se puede reenviar');
  assert.deepEqual(rechazada.problema?.acciones, ['recuperar', 'volver']);
  const recargada = aplicar([{ tipo: 'cargar', intencion: 'recuperar' }, { tipo: 'carga-lista', vista: pendienteNoRespondible }], rechazada);
  assert.equal(sePuedeEnviar(recargada), false, 'el defecto anterior dejaba el envío habilitado');
  assert.equal(recargada.problema?.titulo, COPY_FORMULARIOS.sinRespuestaGuardada);
  assert.notEqual(recargada.aviso?.texto, COPY_FORMULARIOS.loGuardadoEstaArriba, 'arriba no hay nada guardado');
  assert.deepEqual(recargada.borrador, BORRADOR);
  assert.equal(recargada.borradorSinEnviar, true);
});

test('A · si al volver a consultar la solicitud se puede responder (por ejemplo, se reanudó el vínculo), el envío se habilita de nuevo', () => {
  const rechazada = aplicar([{ tipo: 'rechazado', desenlace: yaNoResponde }], conBorrador(pendienteValida));
  const reevaluada = aplicar([{ tipo: 'cargar', intencion: 'recuperar' }, { tipo: 'carga-lista', vista: pendienteValida }], rechazada);
  assert.equal(sePuedeEnviar(reevaluada), true);
  assert.equal(reevaluada.aviso?.texto, COPY_FORMULARIOS.sePuedeResponderDeNuevo);
  assert.equal(reevaluada.problema, null);
  assert.deepEqual(reevaluada.borrador, BORRADOR);
});

test('A · si ya estaba respondida desde otro lado, cargar lo guardado pasa a corregir con el borrador intacto', () => {
  const rechazada = aplicar([{ tipo: 'rechazado', desenlace: yaNoResponde }], conBorrador(pendienteValida));
  const recargada = aplicar([{ tipo: 'cargar', intencion: 'recuperar' }, { tipo: 'carga-lista', vista: respondida }], rechazada);
  assert.equal(habilitacion((recargada.carga as { vista: VistaDeSolicitud }).vista).modo, 'corregir');
  assert.equal(sePuedeEnviar(recargada), true);
  assert.equal(recargada.aviso?.texto, COPY_FORMULARIOS.loGuardadoEstaArriba);
  assert.deepEqual(recargada.borrador, BORRADOR);
});

// ─── Defecto B ──────────────────────────────────────────────────────────────────────────────────

test('B · si falla cargar lo guardado, el reintento sigue siendo una recuperación y termina con el mismo resultado', () => {
  const rechazada = aplicar([{ tipo: 'rechazado', desenlace: yaNoResponde }], conBorrador(pendienteValida));
  const fallida = aplicar([{ tipo: 'cargar', intencion: 'recuperar' }, { tipo: 'carga-fallida', sinConexion: true }], rechazada);
  assert.deepEqual(fallida.carga, { tipo: 'error', intencion: 'recuperar', sinConexion: true });
  assert.deepEqual(fallida.borrador, BORRADOR);
  // El reintento de la pantalla usa la intención guardada, no una carga común.
  const intencion = fallida.carga.tipo === 'error' ? fallida.carga.intencion : 'abrir';
  const reintentada = aplicar([{ tipo: 'cargar', intencion }, { tipo: 'carga-lista', vista: pendienteNoRespondible }], fallida);
  assert.equal(reintentada.problema?.titulo, COPY_FORMULARIOS.sinRespuestaGuardada);
  assert.equal(sePuedeEnviar(reintentada), false);
  assert.deepEqual(reintentada.borrador, BORRADOR);
  // Con otro resultado de la lectura, el mismo reintento da el aviso que corresponde.
  const conGuardada = aplicar([{ tipo: 'cargar', intencion }, { tipo: 'carga-lista', vista: respondida }], fallida);
  assert.equal(conGuardada.aviso?.texto, COPY_FORMULARIOS.loGuardadoEstaArriba);
});

test('B · una carga común (abrir) que falla se reintenta como abrir: no inventa un aviso de recuperación', () => {
  const fallida = aplicar([{ tipo: 'carga-fallida', sinConexion: false }]);
  assert.deepEqual(fallida.carga, { tipo: 'error', intencion: 'abrir', sinConexion: false });
  const abierta = aplicar([{ tipo: 'cargar', intencion: 'abrir' }, { tipo: 'carga-lista', vista: pendienteValida }], fallida);
  assert.equal(abierta.aviso, null);
  assert.equal(sePuedeEnviar(abierta), true);
});

// ─── Versión vieja y envío anterior guardado ────────────────────────────────────────────────────

test('versión vieja: el envío queda suspendido hasta cargar la versión guardada; después se puede corregir y el borrador sigue', () => {
  const rechazada = aplicar([{ tipo: 'rechazado', desenlace: versionVieja }], conBorrador(respondida));
  assert.equal(rechazada.suspension, 'version-desactualizada');
  assert.equal(sePuedeEnviar(rechazada), false, 'reenviar sin recargar volvería a chocar con la versión vieja');
  const recargada = aplicar([{ tipo: 'cargar', intencion: 'recuperar' }, { tipo: 'carga-lista', vista: respondida }], rechazada);
  assert.equal(sePuedeEnviar(recargada), true);
  assert.equal(recargada.aviso?.texto, COPY_FORMULARIOS.loGuardadoEstaArriba);
  assert.deepEqual(recargada.borrador, BORRADOR);
});

test('envío anterior guardado: suspendido hasta cargar; al cargar, la solicitud respondida pasa a corregir con el borrador', () => {
  const rechazada = aplicar([{ tipo: 'rechazado', desenlace: envioAnterior }], conBorrador(pendienteValida));
  assert.equal(sePuedeEnviar(rechazada), false);
  const recargada = aplicar([{ tipo: 'cargar', intencion: 'recuperar' }, { tipo: 'carga-lista', vista: respondida }], rechazada);
  assert.equal(habilitacion((recargada.carga as { vista: VistaDeSolicitud }).vista).modo, 'corregir');
  assert.deepEqual(recargada.borrador, BORRADOR);
});

// ─── Borrador, rechazos por campo e incierto ────────────────────────────────────────────────────

test('borrador · ningún rechazo, carga ni error lo borra; solo un envío registrado lo limpia', () => {
  const eventos: EventoDeFormulario[] = [
    { tipo: 'enviando' },
    { tipo: 'rechazado', desenlace: { tipo: 'dato-no-aceptado', mensaje: COPY_FORMULARIOS.respuestaNoAceptada } },
    { tipo: 'fallo', titulo: 'No pudimos confirmar el resultado. Reintentá.', incierto: true },
    { tipo: 'cargar', intencion: 'recuperar' },
    { tipo: 'carga-fallida', sinConexion: true },
    { tipo: 'cargar', intencion: 'recuperar' },
    { tipo: 'carga-lista', vista: pendienteValida },
  ];
  let e = conBorrador(pendienteValida);
  for (const ev of eventos) {
    e = reducirFormulario(e, ev);
    assert.deepEqual(e.borrador, BORRADOR, ev.tipo);
  }
  const enviado = reducirFormulario(e, { tipo: 'enviado', texto: COPY_FORMULARIOS.respuestaEnviada });
  assert.deepEqual(enviado.borrador, { valores: {}, motivo: '' });
  assert.equal(enviado.borradorSinEnviar, false);
});

test('los rechazos por campo y el resultado incierto no suspenden el envío (se corrige o se reintenta)', () => {
  const porCampo = aplicar([{ tipo: 'rechazado', desenlace: { tipo: 'por-campo', errores: { trn_dias_por_semana: 'x' }, resumen: 'Revisá', lineas: ['x'] } }], conBorrador(pendienteValida));
  assert.equal(sePuedeEnviar(porCampo), true);
  const incierto = aplicar([{ tipo: 'fallo', titulo: 'No pudimos confirmar el resultado. Reintentá.', incierto: true }], conBorrador(pendienteValida));
  assert.equal(sePuedeEnviar(incierto), true);
  assert.equal(incierto.problema?.incierto, true);
});

// ─── respondable desde FRM-06 ───────────────────────────────────────────────────────────────────

function listaFalsa(paginas: { id: string; respondable: boolean }[][]) {
  const pedidos: (string | undefined)[] = [];
  const listar = async (cursor: string | undefined): Promise<Resultado<ListaDeSolicitudesPropiasResponse>> => {
    pedidos.push(cursor);
    const i = cursor ? Number(cursor) : 0;
    const hasMore = i + 1 < paginas.length;
    return {
      ok: true,
      datos: { data: paginas[i]!.map((f) => ({ formRequestId: f.id, respondable: f.respondable })) as never, page: { limit: 50, nextCursor: hasMore ? String(i + 1) : null, hasMore } },
    };
  };
  return { listar, pedidos };
}

test('respondable · se lee de FRM-06 recorriendo las páginas; si no está entre las pendientes, no se puede responder; un error se propaga', async () => {
  const dos = listaFalsa([[{ id: 'a', respondable: true }], [{ id: 'b', respondable: false }, { id: 'c', respondable: true }]]);
  assert.deepEqual(await respondibleDe('c', dos.listar), { ok: true, datos: true });
  assert.deepEqual(dos.pedidos, [undefined, '1']);
  assert.deepEqual(await respondibleDe('b', listaFalsa([[{ id: 'b', respondable: false }]]).listar), { ok: true, datos: false });
  assert.deepEqual(await respondibleDe('z', listaFalsa([[{ id: 'a', respondable: true }]]).listar), { ok: true, datos: false });
  assert.deepEqual(await respondibleDe('a', async () => ({ ok: false, tipo: 'RED' })), { ok: false, tipo: 'RED' });
});
