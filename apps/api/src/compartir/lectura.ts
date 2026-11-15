/**
 * WP-COMPARTIR (DL-176) · lo que la propuesta necesita de la base, en una lectura: los componentes de vínculo de la persona
 * (también los terminados), el A3, el B2 de cada componente y su texto aplicable, las tres autorizaciones (lo de otras
 * áreas, los hábitos y la historia anterior) y los nombres. Sin reglas: las decide `compartir.ts` de @be/domain.
 *
 * Lo usan API-CMP-01 (sin cerrojos: es una lectura) y API-CMP-02 (con los cerrojos ya tomados, para comparar la versión que
 * vio la persona con la de ahora y escribir sobre eso mismo).
 */
import {
  COPY_VINCULO,
  ETIQUETA_DE_ALCANCE,
  TEXTO_DE_LA_HISTORIA_ANTERIOR,
  VERSION_VIGENTE,
  VERSIONES_PROPUESTAS,
  ultimaVersion,
  type EstadoParaCompartir,
  type LoQueSeComparte,
  type LoQueSePuedeCompartirResponse,
  type TextoDeLoQueSeComparte,
} from '@be/domain';
import type { Prisma, TipoDePerfilProfesional, VersionDeTexto } from '@prisma/client';
import { versionDeB2Aplicable } from '../consentimiento/consentimiento-profesional.service';
import { autorizacionVigente as autorizacionDeHabitosVigente, respuestasDeHabitos, ultimaVersionDeHabitos } from '../formularios/habitos-de-la-persona';
import { componentesDeLaPersona, nombresDe } from '../historia-anterior/autorizaciones';
import { autorizacionDeResumenesVigente } from '../resumenes/resumenes-de-la-persona';
import { resumenDeCadena } from '../vinculo/lectura';

type Tx = Prisma.TransactionClient;

/** Lo leído: el estado para la propuesta, los nombres, el perfil de cada profesional y los textos de B2 por id. */
export interface LoLeido {
  readonly estado: EstadoParaCompartir;
  readonly nombres: ReadonlyMap<string, string>;
  readonly perfiles: ReadonlyMap<string, TipoDePerfilProfesional>;
  readonly textosDeB2: ReadonlyMap<string, VersionDeTexto>;
}

/** Los ids de los textos vigentes de cada acto (el de B2, por componente, aparte). */
export const TEXTOS_PARA_COMPARTIR = {
  datosDeSalud: VERSION_VIGENTE.DATOS_SALUD_BE.id,
  resumen: VERSION_VIGENTE.RESUMENES_COMPARTIDOS.id,
  resumenYPlan: VERSION_VIGENTE.RESUMENES_Y_PLAN_COMPARTIDOS.id,
  historiaAnterior: TEXTO_DE_LA_HISTORIA_ANTERIOR.id,
  habitos: VERSION_VIGENTE.HABITOS_COMPARTIDOS.id,
} as const;

export async function leerLoQueSeComparte(tx: Tx, personaId: string): Promise<LoLeido> {
  const componentes = await componentesDeLaPersona(tx, personaId);
  const ids = componentes.map((c) => c.id);
  const profesionales = [...new Set(componentes.map((c) => c.profesionalId))];
  const [a3Vigente, a3Alguno, consentimientos, resumenes, habitos, ultimosHabitos, historia, perfiles, nombres] = await Promise.all([
    tx.actoRegistrable.findFirst({ where: { identidadId: personaId, tipo: 'DATOS_SALUD_BE', estado: 'VIGENTE' }, select: { momentoDeOcurrencia: true } }),
    tx.actoRegistrable.findFirst({ where: { identidadId: personaId, tipo: 'DATOS_SALUD_BE' }, select: { id: true } }),
    tx.consentimiento.findMany({ where: { alcanceDeVinculoId: { in: ids } }, include: { versiones: true } }),
    autorizacionDeResumenesVigente(tx, personaId),
    autorizacionDeHabitosVigente(tx, personaId),
    ultimaVersionDeHabitos(tx, personaId),
    tx.autorizacionDeHistoriaAnterior.findMany({ where: { asesoradoId: personaId, alcanceDeVinculoId: { in: ids } }, orderBy: { version: 'asc' } }),
    tx.perfilProfesional.findMany({ where: { identidadId: { in: profesionales } }, select: { identidadId: true, tipo: true } }),
    nombresDe(tx, profesionales),
  ]);
  const tipoDe = new Map(perfiles.map((p) => [p.identidadId, p.tipo] as const));

  // El texto de B2 aplicable a cada componente sin terminar, por el perfil de su profesional (uno por tipo de perfil).
  const porTipo = new Map<TipoDePerfilProfesional, VersionDeTexto>();
  for (const tipo of new Set(componentes.filter((c) => c.estado !== 'FINALIZADO').flatMap((c) => (tipoDe.has(c.profesionalId) ? [tipoDe.get(c.profesionalId)!] : [])))) {
    porTipo.set(tipo, await versionDeB2Aplicable(tx, tipo));
  }
  const textoDeB2 = new Map<string, string>();
  for (const c of componentes) {
    const tipo = tipoDe.get(c.profesionalId);
    const v = tipo ? porTipo.get(tipo) : undefined;
    if (c.estado !== 'FINALIZADO' && v) textoDeB2.set(c.id, v.id);
  }

  const b2 = new Map<string, { vigente: boolean; textoId: string | null; desde: string }>();
  for (const f of consentimientos) {
    if (f.versiones.length === 0) continue;
    const cadena = resumenDeCadena(f.versiones);
    b2.set(f.alcanceDeVinculoId, { vigente: f.situacion === 'VIGENTE', textoId: cadena.ultimaAceptacion.versionDeTextoId, desde: cadena.ultimaAceptacion.momentoDeOcurrencia.toISOString() });
  }

  const ultimasDeLaHistoria = new Map<string, { estado: 'VIGENTE' | 'RETIRADA'; version: number; desde: string }>();
  for (const id of ids) {
    const u = ultimaVersion(historia.filter((h) => h.alcanceDeVinculoId === id));
    if (u) ultimasDeLaHistoria.set(id, { estado: u.estado, version: u.version, desde: u.momentoDeOcurrencia.toISOString() });
  }

  const estado: EstadoParaCompartir = {
    componentes: componentes.map((c) => ({ id: c.id, profesionalId: c.profesionalId, alcance: c.alcance, estado: c.estado, inicio: c.inicio.toISOString() })),
    a3: { estado: a3Vigente ? 'VIGENTE' : a3Alguno ? 'REVOCADO' : 'NUNCA', desde: a3Vigente?.momentoDeOcurrencia.toISOString() ?? null },
    b2,
    textoDeB2,
    resumenes: {
      estado: resumenes === null ? 'NUNCA' : resumenes.fila.estado === 'ACTIVA' ? 'ACTIVA' : 'RETIRADA',
      version: resumenes?.fila.version ?? null,
      renglones: resumenes?.renglones ?? [],
    },
    habitos: {
      estado: habitos === null ? 'NUNCA' : habitos.fila.estado === 'ACTIVA' ? 'ACTIVA' : 'RETIRADA',
      version: habitos?.fila.version ?? null,
      renglones: habitos?.renglones ?? null,
      hayHabitos: ultimosHabitos !== null && respuestasDeHabitos(ultimosHabitos).length > 0,
    },
    historia: ultimasDeLaHistoria,
    textos: TEXTOS_PARA_COMPARTIR,
  };
  return { estado, nombres, perfiles: tipoDe, textosDeB2: new Map([...porTipo.values()].map((v) => [v.id, v] as const)) };
}

const aprobacion = (id: string, propuesta: boolean): 'PENDING_APPROVAL' | 'APPROVED' => (propuesta || VERSIONES_PROPUESTAS.has(id) ? 'PENDING_APPROVAL' : 'APPROVED');

/** Los textos de lo que se lista, uno por id, en el orden en que aparecen. */
export function textosApi(items: readonly LoQueSeComparte[], textosDeB2: ReadonlyMap<string, VersionDeTexto>): TextoDeLoQueSeComparte[] {
  const vistos = new Map<string, TextoDeLoQueSeComparte>();
  const delCatalogo = (v: (typeof VERSION_VIGENTE)[keyof typeof VERSION_VIGENTE], kind: TextoDeLoQueSeComparte['kind']): TextoDeLoQueSeComparte => ({
    id: v.id,
    kind,
    title: v.titulo,
    text: v.texto,
    textHash: v.hash,
    effectiveFrom: v.vigenteDesde,
    approval: aprobacion(v.id, false),
  });
  for (const i of items) {
    if (vistos.has(i.textoId)) continue;
    let t: TextoDeLoQueSeComparte | null = null;
    if (i.tipo === 'HEALTH_DATA') t = delCatalogo(VERSION_VIGENTE.DATOS_SALUD_BE, 'HEALTH_DATA');
    else if (i.tipo === 'SUMMARY') t = i.nivel === 'SUMMARY_AND_PLAN' ? delCatalogo(VERSION_VIGENTE.RESUMENES_Y_PLAN_COMPARTIDOS, 'SUMMARY_AND_PLAN') : delCatalogo(VERSION_VIGENTE.RESUMENES_COMPARTIDOS, 'SUMMARY');
    else if (i.tipo === 'HABITS') t = delCatalogo(VERSION_VIGENTE.HABITOS_COMPARTIDOS, 'HABITS');
    else if (i.tipo === 'PREVIOUS_HISTORY') {
      const h = TEXTO_DE_LA_HISTORIA_ANTERIOR;
      t = { id: h.id, kind: 'PREVIOUS_HISTORY', title: h.titulo, text: h.texto, textHash: h.hash, effectiveFrom: h.vigenteDesde, approval: aprobacion(h.id, h.propuesta) };
    } else {
      const v = textosDeB2.get(i.textoId);
      if (v) t = { id: v.id, kind: 'AREA_CONSENT', title: v.titulo, text: v.texto, textHash: v.hash, effectiveFrom: v.vigenteDesde.toISOString(), approval: aprobacion(v.id, false) };
    }
    if (t) vistos.set(t.id, t);
  }
  return [...vistos.values()];
}

/** Lo que dice API-CMP-01 de cada cosa, con los nombres y el aviso del perfil (08 §12.3). */
export function itemsApi(items: readonly LoQueSeComparte[], l: Pick<LoLeido, 'nombres' | 'perfiles'>): LoQueSePuedeCompartirResponse['data']['items'] {
  const actor = (id: string) => ({ identityId: id, displayName: l.nombres.get(id) ?? 'Profesional' });
  return items.map((i) => {
    const base = { key: i.clave, given: i.dado, since: i.desde, offered: i.ofrecido, preselected: i.ofrecido && i.preseleccionado, textId: i.textoId };
    switch (i.tipo) {
      case 'HEALTH_DATA':
        return { kind: 'HEALTH_DATA' as const, ...base };
      case 'AREA_CONSENT':
        return {
          kind: 'AREA_CONSENT' as const,
          ...base,
          relationshipId: i.componenteId,
          professional: actor(i.profesionalId),
          scope: { code: i.area, label: ETIQUETA_DE_ALCANCE[i.area] },
          profileNotice: COPY_VINCULO.avisoDePerfil[l.perfiles.get(i.profesionalId) ?? 'NO_SANITARIO'],
        };
      case 'SUMMARY':
        return { kind: 'SUMMARY' as const, ...base, recipient: actor(i.profesionalId), area: i.area, level: i.nivel, from: i.deQuienes.map(actor) };
      case 'PREVIOUS_HISTORY':
        return { kind: 'PREVIOUS_HISTORY' as const, ...base, relationshipId: i.componenteId, professional: actor(i.profesionalId), area: i.area };
      case 'HABITS':
        return { kind: 'HABITS' as const, ...base, recipient: actor(i.profesionalId) };
    }
  });
}
