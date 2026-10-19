// Pedidos a la API local para preparar los datos de cada recorrido, como lo haría cada persona desde su superficie
// (el profesional desde el website, el asesorado desde la APK). Sin SQL: los datos pasan por las mismas reglas que en uso.
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { join } from 'node:path';
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
  await pedir('POST', `/relationships/${vinculoId}/consents`, { token: ase, superficie: 'APK', cuerpo: { consentVersionId: requisitos.data.consentVersion.id } });
  return vinculoId;
}

/** El nombre visible de la persona, en la primera versión de su perfil (DL-009, DL-040). */
export const ponerNombre = (token, nombre) => pedir('PATCH', '/me/profile', { token, superficie: 'APK', cuerpo: { expectedVersion: 'v0', changes: { displayName: nombre } } });
