// Pedidos a la API local para preparar los datos de cada recorrido, como lo haría cada persona desde su superficie
// (el profesional desde el website, el asesorado desde la APK). Sin SQL: los datos pasan por las mismas reglas que en uso.
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import * as OTPAuth from 'otpauth';
import { API, REPO } from './entorno.mjs';

export const dominio = createRequire(join(REPO, 'packages/domain/'))(join(REPO, 'packages/domain/dist/index.js'));

/** La credencial de TODAS las cuentas de los recorridos: sintética, de una base local que se descarta. */
export const CREDENCIAL = 'clave-sintetica-de-recorrido-01';

export async function pedir(metodo, ruta, { token, cuerpo, superficie = 'WEB', esperado, clave } = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-BE-Surface': superficie };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (clave !== false && ['POST', 'PUT', 'DELETE'].includes(metodo)) headers['Idempotency-Key'] = clave ?? `recorrido-${randomUUID()}`;
  const r = await fetch(`${API}/api/v1${ruta}`, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const texto = await r.text();
  const json = texto ? JSON.parse(texto) : null;
  const esperados = esperado ? [esperado].flat() : [200, 201, 204];
  if (!esperados.includes(r.status)) throw new Error(`${metodo} ${ruta}: ${r.status} ${texto.slice(0, 500)}`);
  return json;
}

export async function registrar(correo) {
  const r = await pedir('POST', '/registrations', {
    cuerpo: {
      registrationIntent: 'ADVISEE',
      identity: { localIdentifier: correo, localCredential: CREDENCIAL },
      // DL-169 (UF-01): toda alta lleva el nombre; así ningún recorrido cae en «Antes de seguir».
      profile: { displayName: 'Persona Sintética' },
      termsAcceptance: { versionId: dominio.VERSION_VIGENTE.TERMINOS.id },
      privacyAcknowledgement: { versionId: dominio.VERSION_VIGENTE.PRIVACIDAD_INFO.id },
      adultDeclaration: { versionId: dominio.VERSION_VIGENTE.MAYORIA_DE_EDAD.id, declared: true },
    },
  });
  return r.data.identityId;
}

export const sesion = async (correo, superficie = 'WEB') =>
  (await pedir('POST', '/auth/sessions', { cuerpo: { method: 'LOCAL', identifier: correo, credential: CREDENCIAL }, superficie, clave: false })).data.session.accessToken;

/** El vínculo completo: el profesional lo pide, la persona lo acepta y da el consentimiento desde la APK. */
export async function vincular(pro, ase, aseId, alcance) {
  const solicitud = await pedir('POST', '/relationship-requests', {
    token: pro,
    cuerpo: { target: { type: 'ADVISEE', identityId: aseId }, scope: { code: alcance }, purpose: dominio.FINALIDAD_DE_ALCANCE[alcance] },
  });
  const aceptada = await pedir('POST', `/relationship-requests/${solicitud.data.relationshipRequestId}/accept`, {
    token: ase,
    superficie: 'APK',
    cuerpo: { expectedVersion: solicitud.data.version ?? 'v1' },
  });
  const vinculoId = aceptada.data.relationshipId;
  const requisitos = await pedir('GET', `/relationships/${vinculoId}/consent-requirements`, { token: ase, superficie: 'APK' });
  const consentimiento = await pedir('POST', `/relationships/${vinculoId}/consents`, { token: ase, superficie: 'APK', cuerpo: { consentVersionId: requisitos.data.consentVersion.id } });
  return { vinculoId, consentId: consentimiento.data.consentId };
}

/** El nombre visible de la persona, como versión nueva de su perfil (DL-009, DL-040; desde DL-169 la cuenta nace con uno). */
export async function ponerNombre(token, nombre) {
  const actual = (await pedir('GET', '/me/profile', { token, superficie: 'APK' })).data;
  return pedir('PATCH', '/me/profile', { token, superficie: 'APK', cuerpo: { expectedVersion: actual.version, changes: { displayName: nombre } } });
}

// ─── UF-11 (WP-USO-FINAL; DL-169): el segundo factor del profesional ─────────────────────────────────────────────────
// Desde UF-11, una sesión de un profesional actúa como profesional solo con su segundo factor verificado. La preparación
// lo configura por la API (como `/pro` la primera vez) y cada sesión nueva lo verifica: por la API, o en el navegador al
// entrar a `/pro`. La clave y los códigos viven solo en memoria, como los de Administración: nunca en `estado.json`.
const AUTENTICADORES = new Map();
const PERIODO_MS = 30_000;
const pasoActual = () => Math.floor(Date.now() / PERIODO_MS);

/** El código del autenticador para un paso de 30 s exacto. */
export const codigoDelPaso = (secreto, paso) =>
  new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secreto), algorithm: 'SHA1', digits: 6, period: 30 }).generate({ timestamp: paso * PERIODO_MS });

/**
 * El código que escribe quien entra (por la API o en el navegador): el del autenticador si el paso de 30 s avanzó desde el
 * último que se usó (uno usado no vale otra vez); si no, uno de recuperación, que sirve una sola vez.
 */
export function codigoParaEntrar(correo) {
  const a = AUTENTICADORES.get(correo);
  if (!a) throw new Error(`el profesional ${correo} no configuró su segundo factor en esta corrida`);
  const paso = pasoActual();
  if (paso > a.ultimoPaso) {
    a.ultimoPaso = paso;
    return { tipo: 'autenticador', codigo: codigoDelPaso(a.secreto, paso) };
  }
  const codigo = a.codigos.shift();
  if (!codigo) throw new Error('sin códigos de recuperación para otra sesión en el mismo paso de 30 s');
  return { tipo: 'recuperacion', codigo };
}

/** Deja la sesión de un profesional con su segundo factor verificado: lo configura la primera vez, o escribe un código. */
export async function verificarSegundoFactor(correo, token) {
  const estado = (await pedir('GET', '/me/second-factor', { token })).data.secondFactor.state;
  if (estado === 'VERIFIED' || estado === 'NOT_REQUIRED') return;
  if (estado === 'ENROLLMENT_REQUIRED') {
    const secreto = (await pedir('POST', '/me/second-factor/enrollment', { token, cuerpo: {}, clave: false })).data.secret;
    const paso = pasoActual();
    const confirmada = await pedir('POST', '/me/second-factor/enrollment/confirm', { token, cuerpo: { code: codigoDelPaso(secreto, paso) }, clave: false });
    AUTENTICADORES.set(correo, { secreto, ultimoPaso: paso, codigos: [...confirmada.data.recoveryCodes] });
    return;
  }
  if (estado !== 'REQUIRED') throw new Error(`el segundo factor de ${correo} está en ${estado}`);
  const { tipo, codigo } = codigoParaEntrar(correo);
  if (tipo === 'autenticador') await pedir('POST', '/me/second-factor/verification', { token, cuerpo: { code: codigo }, clave: false });
  else await pedir('POST', '/me/second-factor/recovery-code', { token, cuerpo: { recoveryCode: codigo }, clave: false });
}
