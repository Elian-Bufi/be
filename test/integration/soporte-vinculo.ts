/**
 * Soporte e2e de WP-03 (vínculo, consentimiento y PDP). Solo datos sintéticos, con correos en `example.invalid`.
 * - Los profesionales se preparan con el servicio interno de verificación (DEUDA_LEGAJO DL-036). No hay endpoint
 *   administrativo.
 * - Todo lo demás pasa por la API real: registro, login, REL, CON y DSH-03.
 */
import type { INestApplication } from '@nestjs/common';
import { FINALIDAD_DE_ALCANCE, VERSION_VIGENTE, type Alcance, type TipoDePerfilProfesional } from '@be/domain';
import { VerificacionService } from '../../apps/api/src/profesional/verificacion.service';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { claveDeIdempotencia, conSesion, correoSintetico, registrarOk, tokenDe } from './soporte-api';

export interface Parte {
  readonly correo: string;
  readonly id: string;
  readonly token: string;
}

export const TIPO_POR_ALCANCE: Readonly<Record<Alcance, TipoDePerfilProfesional>> = {
  NUTRICION: 'SANITARIO',
  ENTRENAMIENTO: 'NO_SANITARIO',
  ANTROPOMETRIA: 'NO_SANITARIO',
};

/** Profesional sintético con perfil, alcance VERIFICADO y habilitación CONCEDIDA en cada alcance pedido. */
export async function prepararProfesional(app: INestApplication, etiqueta: string, alcances: readonly Alcance[]): Promise<Parte> {
  const correo = correoSintetico(`pro-${etiqueta}`);
  const id = await registrarOk(app, correo, 'WEB');
  const prisma = app.get(PrismaService);
  const verificacion = app.get(VerificacionService);
  for (const alcance of alcances) {
    await prisma.$transaction((tx) =>
      verificacion.prepararProfesional(tx, id, { alcance, tipo: TIPO_POR_ALCANCE[alcances[0]], nombreVisible: `Profesional sintético ${etiqueta}` }, new Date()),
    );
  }
  return { correo, id, token: await tokenDe(app, correo, 'WEB') };
}

/** Asesorado sintético; con `a3` otorga el tratamiento de datos de salud por API-CON-06. */
export async function prepararAsesorado(app: INestApplication, etiqueta: string, opciones: { a3?: boolean; superficie?: 'WEB' | 'APK' } = {}): Promise<Parte> {
  const correo = correoSintetico(`ase-${etiqueta}`);
  const id = await registrarOk(app, correo, opciones.superficie ?? 'APK');
  const token = await tokenDe(app, correo, opciones.superficie ?? 'APK');
  if (opciones.a3) await otorgarA3(app, token).expect(201);
  return { correo, id, token };
}

export function otorgarA3(app: INestApplication, token: string, clave = claveDeIdempotencia()) {
  return conSesion(app, token).post('/api/v1/me/health-data-consents', clave).send({ consentVersionId: VERSION_VIGENTE.DATOS_SALUD_BE.id });
}

export async function a3Vigente(app: INestApplication, token: string): Promise<string> {
  const r = await conSesion(app, token).get('/api/v1/me/health-data-consent-requirement').expect(200);
  return r.body.data.currentConsent.consentId as string;
}

export function cuerpoDeSolicitud(asesoradoId: string, alcance: Alcance): Record<string, unknown> {
  return { target: { type: 'ADVISEE', identityId: asesoradoId }, scope: { code: alcance }, purpose: FINALIDAD_DE_ALCANCE[alcance] };
}

export function solicitar(app: INestApplication, pro: Parte, asesoradoId: string, alcance: Alcance, clave = claveDeIdempotencia()) {
  return conSesion(app, pro.token).post('/api/v1/relationship-requests', clave).send(cuerpoDeSolicitud(asesoradoId, alcance));
}

export function aceptar(app: INestApplication, ase: Parte, solicitudId: string, version = 'v1', clave = claveDeIdempotencia()) {
  return conSesion(app, ase.token).post(`/api/v1/relationship-requests/${solicitudId}/accept`, clave).send({ expectedVersion: version });
}

/** CON-01 y CON-02 con la versión que CON-01 entrega: lo mismo que hace la pantalla. */
export async function consentir(app: INestApplication, ase: Parte, vinculoId: string): Promise<{ consentId: string; versionDeTexto: string }> {
  const requisitos = await conSesion(app, ase.token).get(`/api/v1/relationships/${vinculoId}/consent-requirements`).expect(200);
  const version = requisitos.body.data.consentVersion.id as string;
  const r = await conSesion(app, ase.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: version }).expect(201);
  return { consentId: r.body.data.consentId as string, versionDeTexto: version };
}

export function revocarB2(app: INestApplication, ase: Parte, consentId: string) {
  return conSesion(app, ase.token).post(`/api/v1/me/consents/${consentId}/revoke`).send({});
}

export function dashboard(app: INestApplication, pro: Parte, asesoradoId: string) {
  return conSesion(app, pro.token).get(`/api/v1/advisees/${asesoradoId}/dashboard`);
}

/** Vínculo por alcance ACEPTADO y, si se pide, con B2 vigente: el recorrido completo por la API. */
export async function vinculoCompleto(
  app: INestApplication,
  pro: Parte,
  ase: Parte,
  alcance: Alcance,
  opciones: { b2?: boolean } = { b2: true },
): Promise<{ solicitudId: string; vinculoId: string; consentId: string | null }> {
  const creada = await solicitar(app, pro, ase.id, alcance).expect(201);
  const solicitudId = creada.body.data.relationshipRequestId as string;
  const aceptada = await aceptar(app, ase, solicitudId).expect(200);
  const vinculoId = aceptada.body.data.relationshipId as string;
  const consentId = opciones.b2 === false ? null : (await consentir(app, ase, vinculoId)).consentId;
  return { solicitudId, vinculoId, consentId };
}

export async function versionDeVinculo(app: INestApplication, token: string, vinculoId: string): Promise<string> {
  const r = await conSesion(app, token).get(`/api/v1/relationships/${vinculoId}`).expect(200);
  return r.body.data.version as string;
}

export function pausar(app: INestApplication, token: string, vinculoId: string, version: string, motivo = 'DISPONIBILIDAD', clave = claveDeIdempotencia()) {
  return conSesion(app, token).post(`/api/v1/relationships/${vinculoId}/pause`, clave).send({ expectedVersion: version, reason: motivo });
}

export function reanudar(app: INestApplication, token: string, vinculoId: string, version: string, clave = claveDeIdempotencia()) {
  return conSesion(app, token).post(`/api/v1/relationships/${vinculoId}/resume`, clave).send({ expectedVersion: version });
}

export function finalizar(app: INestApplication, token: string, vinculoId: string, version: string, motivo = 'OBJETIVO_CUMPLIDO', clave = claveDeIdempotencia()) {
  return conSesion(app, token).post(`/api/v1/relationships/${vinculoId}/finalize`, clave).send({ expectedVersion: version, reason: motivo });
}
