/**
 * De filas a la forma del contrato FRM, y de vuelta. Lo que acá no es cosmético:
 *
 * - la **seleccionabilidad** de una versión de plantilla no es una columna: se deriva de si tiene sucesora, igual
 *   que un método o una especificación (REG-06-209);
 * - `status`/`respondable` de la Solicitud tampoco son columnas: `RESPONDIDA` es que exista una Respuesta, y
 *   `respondable` es la proyección del PDP en el momento de la lectura (D-B, WP-07.md; 09:1610-1618);
 * - la vista efectiva de una Respuesta reutiliza `resolverVistaEfectiva` de B-06 (versionado.ts) sin modificarlo,
 *   traduciendo `CORREGIDA` → `RECTIFIED` acá, igual que hace `ejecuciones.service.ts` con `CORRECTED`.
 */
import { resolverVistaEfectiva, type RelacionDeCorreccion } from '@be/domain';
import type {
  PlantillaDeFormulario as FilaDePlantilla,
  RectificacionDeRespuestaDeFormulario as FilaDeRectificacion,
  RespuestaDeFormulario as FilaDeRespuesta,
  SolicitudDeFormulario as FilaDeSolicitud,
  VersionDePlantillaDeFormulario as FilaDeVersionDePlantilla,
} from '@prisma/client';

const token = (n: number): string => `v${n}`;

type PlantillaConVersiones = FilaDePlantilla & { versiones: { id: string }[] };
type VersionSeleccionable = FilaDeVersionDePlantilla & { sucesora?: { id: string } | null };
type VersionConPlantilla = VersionSeleccionable & { plantilla: { id: string; clave: string } };
type SolicitudConPartes = FilaDeSolicitud & { templateVersion: { nombre: string } };
type RespuestaConRectificaciones = FilaDeRespuesta & { rectificaciones: FilaDeRectificacion[] };

interface CampoDeContenido {
  fieldCode: string;
  label: string;
  dataType: 'TEXT' | 'NUMBER' | 'BOOLEAN';
  unit: string | null;
  category: string;
  helpText: string | null;
}
interface SeccionDeContenido {
  sectionCode: string;
  title: string;
  fields: CampoDeContenido[];
}
export interface ContenidoDePlantilla {
  sections: SeccionDeContenido[];
}

/** Los códigos de campo declarados por la plantilla, para validar contra ellos lo que pide una Solicitud (REG-06-13). */
export function codigosDeCampo(contenido: unknown): string[] {
  const c = contenido as ContenidoDePlantilla;
  return (c.sections ?? []).flatMap((s) => s.fields.map((f) => f.fieldCode));
}

/** Los campos de la plantilla, por código — la forma completa, para tipo/categoría (REG-06-209). */
export function camposPorCodigo(contenido: unknown): Map<string, CampoDeContenido> {
  const c = contenido as ContenidoDePlantilla;
  return new Map(c.sections.flatMap((s) => s.fields).map((f) => [f.fieldCode, f]));
}

/** Las categorías de los campos pedidos, para la pertinencia alcance×categoría (08 §11-bis; DL-095). */
export function categoriasDeCampos(contenido: unknown, fieldCodes: readonly string[]): string[] {
  const porCodigo = camposPorCodigo(contenido);
  return fieldCodes.flatMap((codigo) => {
    const campo = porCodigo.get(codigo);
    return campo ? [campo.category] : [];
  });
}

/** `true` si el valor de la respuesta tiene el tipo de JS que le corresponde al `dataType` declarado del campo. */
export function tipoDeValorCorrecto(dataType: CampoDeContenido['dataType'], value: unknown): boolean {
  if (dataType === 'TEXT') return typeof value === 'string' && value.trim().length > 0;
  if (dataType === 'NUMBER') return typeof value === 'number' && Number.isFinite(value);
  return typeof value === 'boolean';
}

export function plantillaApi(p: PlantillaConVersiones, ultima: VersionSeleccionable): unknown {
  return {
    templateId: p.id,
    key: p.clave,
    name: ultima.nombre,
    purpose: ultima.proposito,
    domain: ultima.dominio,
    status: ultima.sucesora ? 'HISTORICAL_NOT_SELECTABLE' : 'SELECTABLE',
    latestVersionId: ultima.id,
    fieldCount: codigosDeCampo(ultima.contenido).length,
    effectiveSince: ultima.momentoDeRegistro.toISOString(),
  };
}

export function versionDePlantillaApi(v: VersionConPlantilla): unknown {
  const contenido = v.contenido as unknown as ContenidoDePlantilla;
  return {
    templateId: v.plantilla.id,
    templateVersionId: v.id,
    key: v.plantilla.clave,
    name: v.nombre,
    purpose: v.proposito,
    domain: v.dominio,
    version: v.version,
    status: v.sucesora ? 'HISTORICAL_NOT_SELECTABLE' : 'SELECTABLE',
    sections: contenido.sections,
    supersededByVersionId: v.sucesora?.id ?? null,
    effectiveSince: v.momentoDeRegistro.toISOString(),
    provenanceNote: (v.procedencia as { rotulo?: string } | null)?.rotulo ?? 'Valores sintéticos de demostración.',
  };
}

export function solicitudApi(s: SolicitudConPartes, nombreProfesional: string, nombreAsesorado: string, respondida: boolean): unknown {
  return {
    formRequestId: s.id,
    professional: { identityId: s.profesionalId, displayName: nombreProfesional },
    advisee: { identityId: s.asesoradoId, displayName: nombreAsesorado },
    relationshipId: s.vinculoId,
    purpose: s.proposito,
    scope: s.alcance,
    templateVersionId: s.templateVersionId,
    templateName: s.templateVersion.nombre,
    requestedFieldCodes: s.camposSolicitados,
    requiredFieldCodes: s.camposRequeridos,
    status: respondida ? 'RESPONDED' : 'PENDING',
    createdAt: s.momentoDeRegistro.toISOString(),
  };
}

interface RespuestaDeCampoAlmacenada {
  fieldCode: string;
  value: string | number | boolean;
  unit?: string | null;
  profileSourceRef?: string | null;
}

function camposApi(contenido: unknown): unknown[] {
  const c = contenido as { answers: RespuestaDeCampoAlmacenada[] };
  return c.answers.map((a) => ({
    fieldCode: a.fieldCode,
    value: a.value,
    unit: a.unit ?? null,
    profileSourceRef: a.profileSourceRef ?? null,
    provenance: 'SELF_REPORTED' as const,
  }));
}

/**
 * Vista efectiva de una Respuesta, reutilizando `resolverVistaEfectiva` (B-06) sin modificarlo: la Respuesta original
 * es el «original» de la relación de corrección, y cada rectificación es un eslabón de su cadena (09:1618).
 */
export function respuestaApi(r: RespuestaConRectificaciones): unknown {
  const relaciones: RelacionDeCorreccion[] = r.rectificaciones.map((c) => ({
    id: c.id,
    originalId: r.id,
    correccionPreviaId: c.correccionPreviaId,
  }));
  const vista = resolverVistaEfectiva(r.id, relaciones);
  const effectiveView =
    vista.tipo === 'ORIGINAL' ? { kind: 'ORIGINAL' as const } : vista.tipo === 'CORREGIDA' ? { kind: 'RECTIFIED' as const, rectificationId: vista.id } : { kind: 'NOT_RESOLVABLE' as const };
  return {
    formResponseId: r.id,
    formRequestId: r.solicitudId,
    adviseeId: r.asesoradoId,
    templateVersionId: r.templateVersionId,
    original: { answers: camposApi(r.contenido) },
    rectifications: r.rectificaciones.map((c) => ({
      rectificationId: c.id,
      previousRectificationId: c.correccionPreviaId,
      reason: c.motivo,
      answers: camposApi(c.contenido),
      version: token(c.version),
      recordedAt: c.momentoDeRegistro.toISOString(),
    })),
    effectiveView,
    version: token(terminalVersion(r)),
    submittedAt: r.momentoDeRegistro.toISOString(),
  };
}

/** El token de concurrencia vigente: el de la rectificación terminal, o el de la Respuesta si no hay ninguna. */
export function terminalVersion(r: RespuestaConRectificaciones): number {
  const relaciones: RelacionDeCorreccion[] = r.rectificaciones.map((c) => ({ id: c.id, originalId: r.id, correccionPreviaId: c.correccionPreviaId }));
  const vista = resolverVistaEfectiva(r.id, relaciones);
  if (vista.tipo === 'CORREGIDA') return r.rectificaciones.find((c) => c.id === vista.id)!.version;
  return r.version;
}
