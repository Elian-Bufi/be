import {
  rotuloDeReferencia,
  type Alcance,
  type FinalidadDeNota,
  type NotaDeCoordinacion,
  type TipoDeReferenciaDeNota,
} from '@be/domain';
import type { FinalidadDeNotaDeCoordinacion, Prisma, TipoDeReferenciaDeNota as TipoDeReferenciaEnLaBase } from '@prisma/client';
import { fechaLocalEn, ZONA_POR_DEFECTO } from '../nutricion/zona';
import { nombreDeProfesional, resumenDeAlcance } from '../vinculo/lectura';

type Tx = Prisma.TransactionClient;

/**
 * Las notas de coordinación como se leen (WP-NOTAS-DE-COORDINACION; DL-140). Una sola forma de armarlas para sus tres
 * lectores: el autor (la respuesta de API-CRD-01), la persona (API-CRD-01-PROPIA) y los profesionales que la leen en la
 * línea de tiempo (API-DSH-04). Cambia solo qué notas vecinas ve cada uno: la persona, todas las suyas (08 §9.15); un
 * profesional, las que escribió o recibió.
 * - **Lo que se guardó, sin agregar nada:** ni resúmenes ni interpretaciones del texto (08 §11-bis.3).
 * - **Los nombres de los profesionales** salen de su perfil profesional, como en toda la API.
 * - **Las referencias se nombran sin abrirse** (CRD-D5): el rótulo dice qué es y de cuándo; el recurso se lee después por
 *   su propia operación, que vuelve a decidir con el PDP.
 */

/** Lo que se lee de una nota, con sus destinatarios, sus referencias y las notas que la citan o que ella cita. */
export const INCLUIR_NOTA = {
  destinatarios: { select: { destinatarioId: true }, orderBy: { destinatarioId: 'asc' } },
  referencias: { orderBy: { orden: 'asc' } },
  corrigeA: { select: { id: true, momentoDeRegistro: true, autorId: true, destinatarios: { select: { destinatarioId: true } } } },
  correcciones: {
    select: { id: true, momentoDeRegistro: true, autorId: true, destinatarios: { select: { destinatarioId: true } } },
    orderBy: [{ momentoDeRegistro: 'asc' }, { id: 'asc' }],
  },
} as const satisfies Prisma.NotaDeCoordinacionInclude;
export type FilaDeNota = Prisma.NotaDeCoordinacionGetPayload<{ include: typeof INCLUIR_NOTA }>;

/** Quién lee: la persona sobre la que trata, o un profesional. */
export type LectorDeNotas = { readonly tipo: 'TITULAR' } | { readonly tipo: 'PROFESIONAL'; readonly id: string };

/** Entre los profesionales, una nota la leen su autor y sus destinatarios (CRD-D1). */
export function laPuedeLeer(lector: LectorDeNotas, n: { readonly autorId: string; readonly destinatarios: readonly { readonly destinatarioId: string }[] }): boolean {
  if (lector.tipo === 'TITULAR') return true;
  return n.autorId === lector.id || n.destinatarios.some((d) => d.destinatarioId === lector.id);
}

/** CRD-D4: la finalidad, en la base y en el contrato. */
export const FINALIDAD_API: Readonly<Record<FinalidadDeNotaDeCoordinacion, FinalidadDeNota>> = {
  CONTEXTO_PARA_TU_AREA: 'CONTEXT_FOR_YOUR_AREA',
  CAMBIO_EN_MI_AREA: 'CHANGE_IN_MY_AREA',
  PEDIDO_DE_COORDINACION: 'COORDINATION_REQUEST',
};
export const FINALIDAD_EN_LA_BASE: Readonly<Record<FinalidadDeNota, FinalidadDeNotaDeCoordinacion>> = {
  CONTEXT_FOR_YOUR_AREA: 'CONTEXTO_PARA_TU_AREA',
  CHANGE_IN_MY_AREA: 'CAMBIO_EN_MI_AREA',
  COORDINATION_REQUEST: 'PEDIDO_DE_COORDINACION',
};

/** CRD-D5: el tipo de lo citado, en la base y en el contrato (los mismos tipos de origen que la línea de tiempo). */
export const REFERENCIA_API: Readonly<Record<TipoDeReferenciaEnLaBase, TipoDeReferenciaDeNota>> = {
  VERSION_DE_PLAN_NUTRICIONAL: 'NUTRITION_PLAN_VERSION',
  REVISION_NUTRICIONAL: 'NUTRITION_REVIEW',
  VERSION_DE_PLAN_DE_ENTRENAMIENTO: 'TRAINING_PLAN_VERSION',
  REVISION_DE_ENTRENAMIENTO: 'TRAINING_REVIEW',
  EVALUACION_ANTROPOMETRICA: 'ANTHROPOMETRIC_EVALUATION',
};
export const REFERENCIA_EN_LA_BASE: Readonly<Record<TipoDeReferenciaDeNota, TipoDeReferenciaEnLaBase>> = {
  NUTRITION_PLAN_VERSION: 'VERSION_DE_PLAN_NUTRICIONAL',
  NUTRITION_REVIEW: 'REVISION_NUTRICIONAL',
  TRAINING_PLAN_VERSION: 'VERSION_DE_PLAN_DE_ENTRENAMIENTO',
  TRAINING_REVIEW: 'REVISION_DE_ENTRENAMIENTO',
  ANTHROPOMETRIC_EVALUATION: 'EVALUACION_ANTROPOMETRICA',
};

/** El nombre de cada profesional (autores y destinatarios), del perfil profesional, en una sola consulta. */
export async function nombresDeProfesionales(tx: Tx, ids: Iterable<string>): Promise<Map<string, string>> {
  const unicos = [...new Set(ids)];
  const nombres = new Map<string, string>(unicos.map((id) => [id, nombreDeProfesional(null)]));
  if (unicos.length === 0) return nombres;
  const perfiles = await tx.perfilProfesional.findMany({ where: { identidadId: { in: unicos } }, select: { identidadId: true, nombreVisible: true } });
  for (const p of perfiles) nombres.set(p.identidadId, nombreDeProfesional(p));
  return nombres;
}

const civil = (d: Date | null | undefined): string | null => (d ? fechaLocalEn(d, ZONA_POR_DEFECTO) : null);

/**
 * El rótulo de cada recurso citado, por `tipo|id`: lee solo el número de versión y el día de cada uno (la activación, la
 * revisión, la toma), una consulta por tipo. No lee su contenido.
 */
async function rotulosDeReferencias(tx: Tx, filas: readonly FilaDeNota[]): Promise<Map<string, string>> {
  const porTipo = new Map<TipoDeReferenciaEnLaBase, string[]>();
  for (const r of filas.flatMap((f) => f.referencias)) porTipo.set(r.tipo, [...(porTipo.get(r.tipo) ?? []), r.recursoId]);
  const datos = new Map<string, { fecha: string | null; version?: number | null }>();
  const ids = (t: TipoDeReferenciaEnLaBase) => porTipo.get(t) ?? [];
  // El número de una versión, para quien lee, es su orden de activación en el plan (1, 2, 3…), como en la línea de tiempo y
  // en la pestaña Plan (`versionesActivadas`); no el `version` de la fila, que es su token de concurrencia.
  const antesOIgual = (v: { id: string; planId: string; momentoDeActivacion: Date }) => ({
    planId: v.planId,
    estado: 'ACTIVADA' as const,
    OR: [{ momentoDeActivacion: { lt: v.momentoDeActivacion } }, { momentoDeActivacion: v.momentoDeActivacion, id: { lte: v.id } }],
  });
  if (ids('VERSION_DE_PLAN_NUTRICIONAL').length > 0) {
    for (const v of await tx.versionDePlanNutricional.findMany({ where: { id: { in: ids('VERSION_DE_PLAN_NUTRICIONAL') } }, select: { id: true, planId: true, momentoDeActivacion: true } })) {
      const activada = v.momentoDeActivacion ? { ...v, momentoDeActivacion: v.momentoDeActivacion } : null;
      const numero = activada ? await tx.versionDePlanNutricional.count({ where: antesOIgual(activada) }) : null;
      datos.set(`VERSION_DE_PLAN_NUTRICIONAL|${v.id}`, { fecha: civil(v.momentoDeActivacion), version: numero });
    }
  }
  if (ids('VERSION_DE_PLAN_DE_ENTRENAMIENTO').length > 0) {
    for (const v of await tx.versionDePlanDeEntrenamiento.findMany({ where: { id: { in: ids('VERSION_DE_PLAN_DE_ENTRENAMIENTO') } }, select: { id: true, planId: true, momentoDeActivacion: true } })) {
      const activada = v.momentoDeActivacion ? { ...v, momentoDeActivacion: v.momentoDeActivacion } : null;
      const numero = activada ? await tx.versionDePlanDeEntrenamiento.count({ where: antesOIgual(activada) }) : null;
      datos.set(`VERSION_DE_PLAN_DE_ENTRENAMIENTO|${v.id}`, { fecha: civil(v.momentoDeActivacion), version: numero });
    }
  }
  if (ids('REVISION_NUTRICIONAL').length > 0) {
    for (const r of await tx.revisionNutricional.findMany({ where: { id: { in: ids('REVISION_NUTRICIONAL') } }, select: { id: true, momentoDeOcurrencia: true, momentoDeRegistro: true } })) {
      datos.set(`REVISION_NUTRICIONAL|${r.id}`, { fecha: civil(r.momentoDeOcurrencia ?? r.momentoDeRegistro) });
    }
  }
  if (ids('REVISION_DE_ENTRENAMIENTO').length > 0) {
    for (const r of await tx.revisionDeEntrenamiento.findMany({ where: { id: { in: ids('REVISION_DE_ENTRENAMIENTO') } }, select: { id: true, momentoDeOcurrencia: true, momentoDeRegistro: true } })) {
      datos.set(`REVISION_DE_ENTRENAMIENTO|${r.id}`, { fecha: civil(r.momentoDeOcurrencia ?? r.momentoDeRegistro) });
    }
  }
  if (ids('EVALUACION_ANTROPOMETRICA').length > 0) {
    for (const e of await tx.evaluacionAntropometrica.findMany({ where: { id: { in: ids('EVALUACION_ANTROPOMETRICA') } }, select: { id: true, momentoDeOcurrencia: true } })) {
      datos.set(`EVALUACION_ANTROPOMETRICA|${e.id}`, { fecha: civil(e.momentoDeOcurrencia) });
    }
  }
  const rotulos = new Map<string, string>();
  for (const [clave, d] of datos) {
    const tipo = REFERENCIA_API[clave.slice(0, clave.indexOf('|')) as TipoDeReferenciaEnLaBase];
    rotulos.set(clave, rotuloDeReferencia(tipo, { fecha: d.fecha, version: d.version ?? null }));
  }
  return rotulos;
}

/**
 * Las notas como las lee `lector`. Las notas vecinas (la que corrige y las que la corrigen) aparecen solo si este lector
 * también puede leerlas: la persona, siempre; un profesional, si las escribió o las recibió.
 */
export async function notasComoLasLee(tx: Tx, filas: readonly FilaDeNota[], lector: LectorDeNotas): Promise<NotaDeCoordinacion[]> {
  const nombres = await nombresDeProfesionales(
    tx,
    filas.flatMap((f) => [f.autorId, ...f.destinatarios.map((d) => d.destinatarioId)]),
  );
  const rotulos = await rotulosDeReferencias(tx, filas);
  return filas.map((f) => ({
    noteId: f.id,
    adviseeId: f.asesoradoId,
    author: { identityId: f.autorId, displayName: nombres.get(f.autorId) as string },
    originScope: resumenDeAlcance(f.alcanceDeOrigen as Alcance),
    purpose: FINALIDAD_API[f.finalidad],
    recipients: {
      mode: f.modoDeDestinatarios === 'UNO' ? ('ONE' as const) : ('ALL' as const),
      // Por nombre, para que «Para: …» se lea igual en cada lectura.
      people: f.destinatarios
        .map((d) => ({ identityId: d.destinatarioId, displayName: nombres.get(d.destinatarioId) as string }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName, 'es') || a.identityId.localeCompare(b.identityId)),
    },
    text: f.texto,
    // Lo citado se registró antes que la nota y no se borra (la base lo controla): siempre tiene su rótulo con fecha.
    references: f.referencias.map((r) => ({ type: REFERENCIA_API[r.tipo], id: r.recursoId, label: rotulos.get(`${r.tipo}|${r.recursoId}`) ?? rotuloDeReferencia(REFERENCIA_API[r.tipo], { fecha: null }) })),
    corrects: f.corrigeA && laPuedeLeer(lector, f.corrigeA) ? { noteId: f.corrigeA.id, recordedAt: f.corrigeA.momentoDeRegistro.toISOString() } : null,
    correctedBy: f.correcciones.filter((c) => laPuedeLeer(lector, c)).map((c) => ({ noteId: c.id, recordedAt: c.momentoDeRegistro.toISOString() })),
    recordedAt: f.momentoDeRegistro.toISOString(),
  }));
}
