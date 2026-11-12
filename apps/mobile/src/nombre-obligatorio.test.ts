/**
 * El nombre obligatorio en la APK (`nombre-obligatorio.ts`; WP-USO-FINAL, UF-01 y UF-D1 a UF-D5; DL-169): el campo
 * «Nombre y apellido» del alta y de «Antes de seguir», lo que muestra la compuerta con cada respuesta de API-ACC-07
 * (TEST-UF-005, del lado de la APK) y lo que pasa al guardar el nombre. Cada caso dice primero lo que pide el paquete y
 * después lo prueba. Las respuestas de ejemplo pasan por los esquemas del dominio: son respuestas que la API podría dar.
 *
 * **Lo que esto no prueba:** el dibujo, TalkBack, el botón Atrás ni la red del teléfono. Eso queda para la candidata.
 * Uso: cd apps/mobile && npx jest src/nombre-obligatorio.test.ts --runInBand (después de construir @be/domain).
 */
import { beforeEach, describe, expect, test } from '@jest/globals';
import {
  COPY,
  COPY_DEL_NOMBRE,
  LoQueFaltaParaSeguirResponseSchema,
  MENSAJE_DE_CAMPO,
  PerfilPropioResponseSchema,
  type EditarPerfilPropioRequest,
  type LoQueFaltaParaSeguirResponse,
  type PerfilPropioResponse,
  type Resultado,
} from '@be/domain';
import {
  compuertaAlEmpezar,
  compuertaConLaRespuesta,
  compuertaEnMemoria,
  dejaSeguir,
  guardarElNombre,
  mensajeDelNombreEnLaRespuesta,
  revisarElNombre,
  vuelveAPreguntar,
  type ApiDelNombre,
  type MomentoDeLaPregunta,
} from './nombre-obligatorio';

const FALTA = MENSAJE_DE_CAMPO.DISPLAY_NAME_REQUIRED;
const INVALIDO = MENSAJE_DE_CAMPO.INVALID_DISPLAY_NAME;

const red = { ok: false, tipo: 'RED' } as const;
const rechazo = (status: number, codigo: string, issues: { code: string; path: string }[] = []) => ({ ok: false, tipo: 'API', status, codigo, issues }) as const;

describe('el campo «Nombre y apellido» (UF-01; UF-D5)', () => {
  test('vacío o con solo espacios, falta: no se envía y el campo lo dice', () => {
    expect(FALTA).toBe('Escribí tu nombre y apellido.');
    for (const texto of ['', '   ', '\n\t ']) expect(revisarElNombre(texto)).toEqual({ ok: false, mensaje: FALTA });
  });

  test('de más de 60 caracteres o con caracteres invisibles: el mensaje de inválido', () => {
    expect(revisarElNombre('a'.repeat(61))).toEqual({ ok: false, mensaje: INVALIDO });
    expect(revisarElNombre('Ana​Pérez')).toEqual({ ok: false, mensaje: INVALIDO });
    // 60 todavía entra.
    expect(revisarElNombre('a'.repeat(60))).toEqual({ ok: true, nombre: 'a'.repeat(60) });
  });

  test('completo: se envía como se guarda, sin espacios de más', () => {
    expect(revisarElNombre('  Persona   Sintética ')).toEqual({ ok: true, nombre: 'Persona Sintética' });
  });

  test('el 422 de la API por el nombre vuelve al campo con su mensaje; otro rechazo, no', () => {
    expect(mensajeDelNombreEnLaRespuesta([{ code: 'DISPLAY_NAME_REQUIRED', path: 'profile.displayName' }])).toBe(FALTA);
    expect(mensajeDelNombreEnLaRespuesta([{ code: 'ADULT_DECLARATION_REQUIRED', path: 'adultDeclaration' }, { code: 'INVALID_DISPLAY_NAME', path: 'profile.displayName' }])).toBe(INVALIDO);
    expect(mensajeDelNombreEnLaRespuesta([{ code: 'ADULT_DECLARATION_REQUIRED', path: 'adultDeclaration' }])).toBeNull();
    expect(mensajeDelNombreEnLaRespuesta([])).toBeNull();
  });
});

/** Una respuesta de API-ACC-07, validada con su esquema. */
const loQueFalta = (steps: { step: string; suggestion: string | null }[]): Resultado<LoQueFaltaParaSeguirResponse> => ({
  ok: true,
  datos: LoQueFaltaParaSeguirResponseSchema.parse({ data: { steps } }),
});
const MOMENTOS: readonly MomentoDeLaPregunta[] = ['al-entrar', 'de-nuevo', 'despues-de-guardar'];

describe('la compuerta «Antes de seguir» (API-ACC-07; UF-D4; TEST-UF-005)', () => {
  test('sin pasos, la app: en cualquier momento', () => {
    for (const momento of MOMENTOS) expect(compuertaConLaRespuesta(momento, loQueFalta([]))).toEqual({ tipo: 'abierta' });
    expect(dejaSeguir({ tipo: 'abierta' })).toBe(true);
  });

  test('falta el nombre: «Antes de seguir», con el nombre profesional propuesto o vacío, y la app no se muestra', () => {
    expect(compuertaConLaRespuesta('al-entrar', loQueFalta([{ step: 'DISPLAY_NAME', suggestion: null }]))).toEqual({ tipo: 'nombre', propuesta: null });
    expect(compuertaConLaRespuesta('al-entrar', loQueFalta([{ step: 'DISPLAY_NAME', suggestion: '  Lic. Sofía   Paz ' }]))).toEqual({ tipo: 'nombre', propuesta: 'Lic. Sofía Paz' });
    expect(compuertaConLaRespuesta('al-entrar', loQueFalta([{ step: 'DISPLAY_NAME', suggestion: '   ' }]))).toEqual({ tipo: 'nombre', propuesta: null });
    // También si aparece al volver a preguntar o después de guardar: no se saltea.
    expect(compuertaConLaRespuesta('de-nuevo', loQueFalta([{ step: 'DISPLAY_NAME', suggestion: null }]))).toEqual({ tipo: 'nombre', propuesta: null });
    expect(compuertaConLaRespuesta('despues-de-guardar', loQueFalta([{ step: 'DISPLAY_NAME', suggestion: null }]))).toEqual({ tipo: 'nombre', propuesta: null });
    expect(dejaSeguir({ tipo: 'nombre', propuesta: null })).toBe(false);
    expect(dejaSeguir({ tipo: 'preguntando' })).toBe(false);
  });

  test('un paso que esta versión no conoce, o una respuesta que no reconoce: actualizar la app, sin saltearlo', () => {
    expect(compuertaConLaRespuesta('al-entrar', loQueFalta([{ step: 'TERMS_VERSION', suggestion: null }]))).toEqual({ tipo: 'actualizar' });
    // Aunque venga junto con el nombre: la versión nueva resuelve los dos.
    expect(compuertaConLaRespuesta('al-entrar', loQueFalta([{ step: 'DISPLAY_NAME', suggestion: null }, { step: 'EMAIL_VERIFICATION', suggestion: null }]))).toEqual({ tipo: 'actualizar' });
    // Un 200 con otra forma (el cliente lo valida con un esquema estricto).
    expect(compuertaConLaRespuesta('al-entrar', rechazo(200, 'RESPUESTA_NO_RECONOCIDA'))).toEqual({ tipo: 'actualizar' });
    expect(compuertaConLaRespuesta('de-nuevo', rechazo(200, 'RESPUESTA_NO_RECONOCIDA'))).toEqual({ tipo: 'actualizar' });
    expect(dejaSeguir({ tipo: 'actualizar' })).toBe(false);
  });

  test('sin conexión al entrar: la app, sin saber, y vuelve a preguntar; si de nuevo no se sabe, nada cambia', () => {
    const alEntrar = compuertaConLaRespuesta('al-entrar', red);
    expect(alEntrar).toEqual({ tipo: 'sin-saber' });
    expect(dejaSeguir({ tipo: 'sin-saber' })).toBe(true);
    expect(vuelveAPreguntar({ tipo: 'sin-saber' })).toBe(true);
    expect(compuertaConLaRespuesta('de-nuevo', red)).toBeNull();
    // Lo mismo con el servicio no disponible, demasiados pedidos, una API sin la operación o un 502 que no es de BE.
    for (const r of [rechazo(503, 'SERVICE_UNAVAILABLE'), rechazo(429, 'RATE_LIMITED'), rechazo(404, 'NOT_FOUND'), rechazo(502, 'RESPUESTA_NO_RECONOCIDA')]) {
      expect(compuertaConLaRespuesta('al-entrar', r)).toEqual({ tipo: 'sin-saber' });
      expect(compuertaConLaRespuesta('de-nuevo', r)).toBeNull();
    }
    // Lo que se sabe no se vuelve a preguntar.
    for (const tipo of ['abierta', 'preguntando', 'actualizar'] as const) expect(vuelveAPreguntar({ tipo })).toBe(false);
    expect(vuelveAPreguntar({ tipo: 'nombre', propuesta: null })).toBe(false);
  });

  test('después de guardar el nombre, sin conexión: la app, porque el nombre ya quedó', () => {
    expect(compuertaConLaRespuesta('despues-de-guardar', red)).toEqual({ tipo: 'sin-saber' });
  });

  test('la sesión que la API ya no acepta se cierra, con el aviso que corresponde', () => {
    expect(compuertaConLaRespuesta('al-entrar', rechazo(401, 'SESSION_EXPIRED'))).toEqual({ tipo: 'sesion-perdida', motivo: 'sesion-vencida' });
    for (const codigo of ['SESSION_REVOKED', 'SESSION_INVALID', 'AUTHENTICATION_REQUIRED']) {
      expect(compuertaConLaRespuesta('de-nuevo', rechazo(401, codigo))).toEqual({ tipo: 'sesion-perdida', motivo: 'sesion-no-valida' });
    }
  });

  describe('en memoria, como la sesión', () => {
    beforeEach(() => compuertaEnMemoria.olvidar());

    test('una sesión que ya pasó no vuelve a preguntar si Android recrea la pantalla; otra sesión, sí', () => {
      expect(compuertaAlEmpezar('token-a')).toEqual({ tipo: 'preguntando' });
      compuertaEnMemoria.abrir('token-a');
      expect(compuertaAlEmpezar('token-a')).toEqual({ tipo: 'abierta' });
      expect(compuertaAlEmpezar('token-b')).toEqual({ tipo: 'preguntando' });
      // Cerrar la sesión la olvida.
      compuertaEnMemoria.olvidar();
      expect(compuertaAlEmpezar('token-a')).toEqual({ tipo: 'preguntando' });
    });
  });
});

/** Un perfil propio de ejemplo, validado con su esquema. */
const perfil = (displayName: string | null, version: string): Resultado<PerfilPropioResponse> => ({
  ok: true,
  datos: PerfilPropioResponseSchema.parse({ data: { displayName, version, updatedAt: version === 'v0' ? null : '2026-11-11T12:00:00.000Z' } }),
});

/** Una API de mentira: responde lo que se le diga, en orden, y anota cada pedido. */
function apiDePrueba(lecturas: Resultado<PerfilPropioResponse>[], cambios: Resultado<PerfilPropioResponse>[] = []) {
  const pedidos: { que: 'leer' | 'cambiar'; token: string; cuerpo?: EditarPerfilPropioRequest }[] = [];
  const api: ApiDelNombre = {
    async consultarPerfilPropio(token) {
      pedidos.push({ que: 'leer', token });
      const r = lecturas.shift();
      if (!r) throw new Error('una lectura de más');
      return r;
    },
    async editarPerfilPropio(token, cuerpo) {
      pedidos.push({ que: 'cambiar', token, cuerpo });
      const r = cambios.shift();
      if (!r) throw new Error('un cambio de más');
      return r;
    },
  };
  return { api, pedidos };
}

describe('guardar el nombre en «Antes de seguir» (API-ACC-06 con expectedVersion)', () => {
  test('lee el perfil propio para su versión y lo cambia con esa versión y el nombre normalizado', async () => {
    const { api, pedidos } = apiDePrueba([perfil(null, 'v0')], [perfil('Persona Sintética', 'v1')]);
    expect(await guardarElNombre(api, 't', '  Persona   Sintética ')).toEqual({ tipo: 'guardado' });
    expect(pedidos).toEqual([
      { que: 'leer', token: 't' },
      { que: 'cambiar', token: 't', cuerpo: { expectedVersion: 'v0', changes: { displayName: 'Persona Sintética' } } },
    ]);
  });

  test('vacío: el campo lo dice y no se llama a la API', async () => {
    const { api, pedidos } = apiDePrueba([]);
    expect(await guardarElNombre(api, 't', '  ')).toEqual({ tipo: 'campo', mensaje: FALTA });
    expect(pedidos).toEqual([]);
  });

  test('si el perfil ya tiene ese nombre (la respuesta anterior no llegó), no lo vuelve a escribir', async () => {
    const { api, pedidos } = apiDePrueba([perfil('Persona Sintética', 'v1')]);
    expect(await guardarElNombre(api, 't', 'Persona Sintética')).toEqual({ tipo: 'guardado' });
    expect(pedidos.map((p) => p.que)).toEqual(['leer']);
  });

  test('409: vuelve a leer y dice que cambió en otro lugar, con el nombre que quedó', async () => {
    const { api, pedidos } = apiDePrueba([perfil(null, 'v0'), perfil('Ana Pérez', 'v1')], [rechazo(409, 'VERSION_CONFLICT')]);
    expect(await guardarElNombre(api, 't', 'Ana')).toEqual({ tipo: 'cambio-en-otro-lugar', nombre: 'Ana Pérez', mensaje: COPY_DEL_NOMBRE.cambioEnOtroLugar });
    expect(pedidos.map((p) => p.que)).toEqual(['leer', 'cambiar', 'leer']);
    // Si la segunda lectura falla, lo dice igual, sin nombre para mostrar.
    const sinLeer = apiDePrueba([perfil(null, 'v0'), red], [rechazo(409, 'VERSION_CONFLICT')]);
    expect(await guardarElNombre(sinLeer.api, 't', 'Ana')).toEqual({ tipo: 'cambio-en-otro-lugar', nombre: null, mensaje: COPY_DEL_NOMBRE.cambioEnOtroLugar });
  });

  test('422 por el nombre: el campo', async () => {
    const { api } = apiDePrueba([perfil(null, 'v0')], [rechazo(422, 'INVALID_PROFILE_DATA', [{ code: 'INVALID_DISPLAY_NAME', path: 'changes.displayName' }])]);
    expect(await guardarElNombre(api, 't', 'Ana')).toEqual({ tipo: 'campo', mensaje: INVALIDO });
  });

  test('sin conexión no se sabe si quedó; otra falla, el servicio; la sesión perdida se cierra', async () => {
    expect(await guardarElNombre(apiDePrueba([red]).api, 't', 'Ana')).toEqual({ tipo: 'aviso', mensaje: COPY.resultadoIncierto });
    expect(await guardarElNombre(apiDePrueba([perfil(null, 'v0')], [red]).api, 't', 'Ana')).toEqual({ tipo: 'aviso', mensaje: COPY.resultadoIncierto });
    expect(await guardarElNombre(apiDePrueba([perfil(null, 'v0')], [rechazo(503, 'SERVICE_UNAVAILABLE')]).api, 't', 'Ana')).toEqual({ tipo: 'aviso', mensaje: COPY.noDisponible });
    expect(await guardarElNombre(apiDePrueba([perfil(null, 'v0')], [rechazo(429, 'RATE_LIMITED')]).api, 't', 'Ana')).toEqual({ tipo: 'aviso', mensaje: COPY.demasiadosIntentos });
    expect(await guardarElNombre(apiDePrueba([rechazo(401, 'SESSION_EXPIRED')]).api, 't', 'Ana')).toEqual({ tipo: 'sesion-perdida', motivo: 'sesion-vencida' });
    expect(await guardarElNombre(apiDePrueba([perfil(null, 'v0')], [rechazo(401, 'SESSION_REVOKED')]).api, 't', 'Ana')).toEqual({ tipo: 'sesion-perdida', motivo: 'sesion-no-valida' });
  });
});
