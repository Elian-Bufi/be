// El cliente de la API para la cohorte: lo mismo que hace un cliente real (website o APK), con la superficie que
// corresponde a cada pedido. Reintenta ante un 429 o un corte de red, sin repetir una escritura que sí llegó: cada POST
// lleva su clave de idempotencia, y el reintento usa la misma.
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { REPO } from '../../rutas.mjs';

export const dominio = createRequire(`${REPO}/packages/domain/`)(`${REPO}/packages/domain/dist/index.js`);

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export function clienteDe(origen) {
  async function pedir(metodo, ruta, { token, cuerpo, superficie = 'WEB', esperado, capacidades, clave } = {}) {
    const headers = { 'Content-Type': 'application/json', 'X-BE-Surface': superficie };
    if (capacidades) headers[dominio.HEADER_DE_CAPACIDADES] = capacidades;
    if (token) headers.Authorization = `Bearer ${token}`;
    if (clave !== false && ['POST', 'PUT', 'DELETE'].includes(metodo)) headers['Idempotency-Key'] = clave ?? `cohorte-${randomUUID()}`;
    const esperados = esperado ? [esperado].flat() : [200, 201, 204];
    for (let intento = 1; ; intento++) {
      let r;
      try {
        r = await fetch(`${origen}/api/v1${ruta}`, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
      } catch (e) {
        if (intento >= 5) throw e;
        await espera(2000 * intento);
        continue;
      }
      const texto = await r.text();
      if (r.status === 429 && intento < 8) {
        await espera(Number(r.headers.get('retry-after') ?? 15) * 1000 + 500);
        continue;
      }
      if (r.status >= 502 && r.status <= 504 && intento < 5) {
        await espera(3000 * intento);
        continue;
      }
      const json = texto ? JSON.parse(texto) : null;
      if (!esperados.includes(r.status)) throw new Error(`${metodo} ${ruta}: ${r.status} ${texto.slice(0, 600)}`);
      return json;
    }
  }

  const sesion = async (correo, clave, superficie = 'WEB') =>
    (await pedir('POST', '/auth/sessions', { cuerpo: { method: 'LOCAL', identifier: correo, credential: clave }, superficie, clave: false })).data.session.accessToken;

  async function registrar(correo, clave, intencion, superficie) {
    const r = await pedir('POST', '/registrations', {
      superficie,
      cuerpo: {
        registrationIntent: intencion,
        identity: { localIdentifier: correo, localCredential: clave },
        termsAcceptance: { versionId: dominio.VERSION_VIGENTE.TERMINOS.id },
        privacyAcknowledgement: { versionId: dominio.VERSION_VIGENTE.PRIVACIDAD_INFO.id },
        // DL-138: toda alta declara la mayoría de edad (las personas de la cohorte son adultas).
        adultDeclaration: { versionId: dominio.VERSION_VIGENTE.MAYORIA_DE_EDAD.id, declared: true },
      },
    });
    return r.data.identityId;
  }

  /** El nombre visible de la persona (API-ACC-06), como lo declara desde «Cuenta». Solo si todavía no tiene. */
  async function ponerNombre(token, nombre) {
    const actual = (await pedir('GET', '/me/profile', { token })).data;
    if (actual.displayName === nombre) return;
    await pedir('PATCH', '/me/profile', { token, cuerpo: { expectedVersion: actual.version, changes: { displayName: nombre } } });
  }

  return { pedir, sesion, registrar, ponerNombre };
}
