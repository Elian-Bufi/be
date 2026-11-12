/**
 * Soporte de UF-11 (WP-USO-FINAL; DL-169; UF-D12): el segundo factor del profesional en las pruebas. Desde UF-11, una
 * sesión de un profesional actúa como profesional solo con su segundo factor verificado, así que cada sesión de un
 * profesional sintético lo configura (la primera vez) o lo verifica por la API real, como lo haría `/pro`:
 * - la primera vez, API-MFA-04 y 05, con el código calculado con la misma biblioteca (`otpauth`);
 * - después, API-MFA-02 con el código del paso siguiente al último usado (un código ya usado no vale otra vez) o, si el
 *   paso de 30 s todavía no avanzó, API-MFA-03 con uno de sus códigos de recuperación.
 * La clave y los códigos viven solo en la memoria de la prueba, nunca en un registro.
 */
import type { INestApplication } from '@nestjs/common';
import * as OTPAuth from 'otpauth';
import { conSesion, tokenDe } from './soporte-api';

const PERIODO_MS = 30_000;

interface Autenticador {
  readonly secreto: string;
  ultimoPaso: number;
  readonly codigosDeRecuperacion: string[];
}

/** Por identidad: lo que la prueba sabe del autenticador de cada profesional sintético. */
const autenticadores = new Map<string, Autenticador>();

const pasoActual = (): number => Math.floor(Date.now() / PERIODO_MS);

/** El código del autenticador para un paso de 30 s exacto. */
export function codigoDelPaso(secreto: string, paso: number): string {
  return new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secreto), algorithm: 'SHA1', digits: 6, period: 30 }).generate({ timestamp: paso * PERIODO_MS });
}

/** Lo que la prueba guardó del autenticador de un profesional (para las pruebas de UF-11). */
export function autenticadorDe(identidadId: string): Readonly<Autenticador> | undefined {
  return autenticadores.get(identidadId);
}

/**
 * Deja la sesión con el segundo factor verificado: la configura si el profesional todavía no tiene autenticador, o la
 * verifica con un código. A una sesión sin perfil profesional no le hace nada.
 */
export async function verificarSegundoFactor(app: INestApplication, identidadId: string, token: string): Promise<void> {
  const s = conSesion(app, token);
  const estado = (await s.get('/api/v1/me/second-factor').expect(200)).body.data.secondFactor.state as string;
  if (estado === 'VERIFIED' || estado === 'NOT_REQUIRED') return;
  if (estado === 'ENROLLMENT_REQUIRED') {
    const configuracion = await s.post('/api/v1/me/second-factor/enrollment').send({}).expect(200);
    const secreto = configuracion.body.data.secret as string;
    const paso = pasoActual();
    const confirmada = await s.post('/api/v1/me/second-factor/enrollment/confirm').send({ code: codigoDelPaso(secreto, paso) }).expect(200);
    autenticadores.set(identidadId, { secreto, ultimoPaso: paso, codigosDeRecuperacion: [...(confirmada.body.data.recoveryCodes as string[])] });
    return;
  }
  if (estado !== 'REQUIRED') throw new Error(`el segundo factor de la sesión está en ${estado}`);
  const a = autenticadores.get(identidadId);
  if (!a) throw new Error('un profesional con autenticador que esta prueba no configuró');
  const paso = pasoActual();
  if (paso > a.ultimoPaso) {
    await s.post('/api/v1/me/second-factor/verification').send({ code: codigoDelPaso(a.secreto, paso) }).expect(200);
    a.ultimoPaso = paso;
    return;
  }
  const codigo = a.codigosDeRecuperacion.shift();
  if (!codigo) throw new Error('sin códigos de recuperación para otra sesión en el mismo paso de 30 s');
  await s.post('/api/v1/me/second-factor/recovery-code').send({ recoveryCode: codigo }).expect(200);
}

/** Otra sesión de un profesional ya preparado, con su segundo factor verificado. */
export async function sesionDeProfesional(app: INestApplication, pro: { readonly correo: string; readonly id: string }, superficie: 'WEB' | 'APK' = 'WEB'): Promise<string> {
  const token = await tokenDe(app, pro.correo, superficie);
  await verificarSegundoFactor(app, pro.id, token);
  return token;
}
