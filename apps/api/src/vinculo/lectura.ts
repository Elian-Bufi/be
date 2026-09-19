import {
  ETIQUETA_DE_ALCANCE,
  modoDeAcceso,
  type Alcance,
  type EstadoDeAlcanceDeVinculo,
  type Finalidad,
  type Procedencia,
  type SolicitudDeVinculo,
  type Vinculo,
} from '@be/domain';
import type {
  MotivoDeTransicionDeVinculo,
  Prisma,
  RolEnVinculo,
  SituacionDeConsentimiento,
  TipoDeEventoDeVinculo,
  VersionDeConsentimiento,
} from '@prisma/client';
import type { PdpService } from '../autorizacion/pdp.service';

/**
 * Modelos de lectura de REL y CON (09v8 §6-§7). No incluyen información sanitaria (09v8:1224) ni razones internas del
 * PDP (10-B04:640-645). Nombres visibles sin campos de perfil aprobados (DEUDA_LEGAJO DL-040): el profesional con su
 * nombre visible sintético y el asesorado con una referencia neutral, sin correo.
 */

export const token = (version: number): string => `v${version}`;
export const esToken = (valor: string, version: number): boolean => valor === token(version);

export const resumenDeAlcance = (alcance: Alcance) => ({ code: alcance, label: ETIQUETA_DE_ALCANCE[alcance] });

export function nombreDeProfesional(perfil: { nombreVisible: string } | null | undefined): string {
  return perfil?.nombreVisible ?? 'Profesional';
}

/** Referencia neutral: el profesional no ve el correo del asesorado (DL-040). */
export function nombreDeAsesorado(identidadId: string): string {
  return `Asesorado · ${identidadId.replace(/-/g, '').slice(-6)}`;
}

export const rolApi = (rol: RolEnVinculo): 'PROFESSIONAL' | 'ADVISEE' => (rol === 'PROFESIONAL' ? 'PROFESSIONAL' : 'ADVISEE');

/** Solicitud con lo necesario para su modelo de lectura. */
export type SolicitudConPartes = Prisma.SolicitudDeVinculoGetPayload<{
  include: { profesional: { select: { perfilProfesional: { select: { nombreVisible: true } } } } };
}>;
export const INCLUIR_PARTES_DE_SOLICITUD = {
  profesional: { select: { perfilProfesional: { select: { nombreVisible: true } } } },
} as const;

export function itemDeSolicitud(s: SolicitudConPartes): SolicitudDeVinculo {
  return {
    relationshipRequestId: s.id,
    version: token(s.version),
    professional: { identityId: s.profesionalId, displayName: nombreDeProfesional(s.profesional.perfilProfesional) },
    advisee: { identityId: s.asesoradoId, displayName: nombreDeAsesorado(s.asesoradoId) },
    scope: resumenDeAlcance(s.alcance),
    purpose: s.finalidad,
    state: s.estado,
    initiatedBy: rolApi(s.iniciador),
    createdAt: (s.momentoDeOcurrencia ?? s.momentoDeRegistro).toISOString(),
    expiresAt: s.venceEn.toISOString(),
  };
}

/** Componente de vínculo con partes y consentimiento, para su modelo de lectura. */
export type ComponenteConPartes = Prisma.AlcanceDeVinculoGetPayload<{
  include: {
    vinculo: { include: { profesional: { select: { perfilProfesional: { select: { nombreVisible: true } } } } } };
    consentimientos: { select: { id: true; finalidad: true; situacion: true } };
  };
}>;
export const INCLUIR_PARTES_DE_COMPONENTE = {
  vinculo: { include: { profesional: { select: { perfilProfesional: { select: { nombreVisible: true } } } } } },
  consentimientos: { select: { id: true, finalidad: true, situacion: true } },
} as const;

export function estadoDeConsentimientoEnVinculo(situacion: SituacionDeConsentimiento | null | undefined): 'REQUIRED' | 'ACTIVE' | 'REVOKED' {
  if (!situacion) return 'REQUIRED';
  return situacion === 'VIGENTE' ? 'ACTIVE' : 'REVOKED';
}

/**
 * Ítem de vínculo (09v8:1337-1349). El modo de acceso lo calcula el PDP con los hechos vigentes (RF-023). Un componente
 * que no está ACEPTADO no da acceso por definición (08 §14.1), y no se evalúa.
 */
export async function itemDeVinculo(cliente: Prisma.TransactionClient, pdp: PdpService, c: ComponenteConPartes): Promise<Vinculo> {
  const consentimiento = c.consentimientos.find((x) => x.finalidad === c.finalidad) ?? null;
  const estado = c.estado as EstadoDeAlcanceDeVinculo;
  const acceso =
    estado === 'ACEPTADO' ? modoDeAcceso(await pdp.evaluarSinRegistrar(cliente, c.vinculo.profesionalId, c.vinculo.asesoradoId, c.alcance)) : 'BLOCKED';
  return {
    relationshipId: c.id,
    version: token(c.version),
    professional: { identityId: c.vinculo.profesionalId, displayName: nombreDeProfesional(c.vinculo.profesional.perfilProfesional) },
    advisee: { identityId: c.vinculo.asesoradoId, displayName: nombreDeAsesorado(c.vinculo.asesoradoId) },
    scope: resumenDeAlcance(c.alcance),
    purpose: c.finalidad as Finalidad,
    relationshipState: estado,
    consentState: estadoDeConsentimientoEnVinculo(consentimiento?.situacion),
    accessMode: acceso,
    pausedBy: estado === 'PAUSADO' && c.pausadoPor ? rolApi(c.pausadoPor) : null,
    acceptedAt: (c.momentoDeOcurrencia ?? c.momentoDeRegistro).toISOString(),
  };
}

/** Recorre la cadena de versiones desde la raíz (REG-06-12). */
export function cadenaOrdenada(versiones: readonly VersionDeConsentimiento[]): VersionDeConsentimiento[] {
  const porPredecesora = new Map(versiones.filter((v) => v.predecesoraId).map((v) => [v.predecesoraId as string, v]));
  const cadena: VersionDeConsentimiento[] = [];
  let actual = versiones.find((v) => v.predecesoraId === null);
  while (actual) {
    cadena.push(actual);
    actual = porPredecesora.get(actual.id);
  }
  return cadena;
}

/** Resumen de B2 para el titular: la última aceptación y, si está revocado, cuándo. */
export function resumenDeCadena(versiones: readonly VersionDeConsentimiento[]): {
  readonly cabeza: VersionDeConsentimiento;
  readonly ultimaAceptacion: VersionDeConsentimiento;
  readonly revocadoEn: Date | null;
} {
  const cadena = cadenaOrdenada(versiones);
  const cabeza = cadena[cadena.length - 1];
  const ultimaAceptacion = [...cadena].reverse().find((v) => v.decision !== 'REVOCACION');
  if (!cabeza || !ultimaAceptacion) throw new Error('cadena de consentimiento vacía');
  return { cabeza, ultimaAceptacion, revocadoEn: cabeza.decision === 'REVOCACION' ? cabeza.momentoDeOcurrencia : null };
}

/** Hecho de M-03 (T-06-N08). El actor es una identidad o el sistema; nunca ambos (CHECK en la base). */
export async function registrarEventoDeVinculo(
  tx: Prisma.TransactionClient,
  datos: {
    readonly tipo: TipoDeEventoDeVinculo;
    readonly profesionalId: string;
    readonly asesoradoId: string;
    readonly solicitudDeVinculoId?: string | null;
    readonly alcanceDeVinculoId?: string | null;
    readonly consentimientoId?: string | null;
    readonly versionDeConsentimientoId?: string | null;
    readonly estadoPrevio: string | null;
    readonly estadoPosterior: string;
    readonly motivo?: MotivoDeTransicionDeVinculo | null;
    readonly actor: { readonly identidadId: string } | 'SISTEMA';
    readonly procedencia: Procedencia;
    readonly momento: Date;
  },
): Promise<void> {
  await tx.eventoDeVinculo.create({
    data: {
      tipo: datos.tipo,
      profesionalId: datos.profesionalId,
      asesoradoId: datos.asesoradoId,
      solicitudDeVinculoId: datos.solicitudDeVinculoId ?? null,
      alcanceDeVinculoId: datos.alcanceDeVinculoId ?? null,
      consentimientoId: datos.consentimientoId ?? null,
      versionDeConsentimientoId: datos.versionDeConsentimientoId ?? null,
      estadoPrevio: datos.estadoPrevio,
      estadoPosterior: datos.estadoPosterior,
      motivo: datos.motivo ?? null,
      ...(datos.actor === 'SISTEMA' ? { actorServicio: 'SISTEMA' } : { actorId: datos.actor.identidadId }),
      procedencia: datos.procedencia as unknown as Prisma.InputJsonValue,
      momentoDeOcurrencia: datos.momento,
    },
  });
}
