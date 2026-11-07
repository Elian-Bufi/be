/**
 * DL-163 D-13, ampliada por Dirección el 2026-11-07 (WP-TABLERO-ALTA-GAMA TB-52 a TB-56) · lo que la persona les comparte a
 * sus profesionales de otras áreas. Reglas puras que comparten la API y el website; la base las vuelve a exigir
 * (migración 20261107120100) y la autorización de cada lectura sigue en el PDP de la API (DL-095).
 *
 * **La autorización** (`autorizacion_de_resumenes`, versionada como la de los hábitos, DL-165 D-9) es un acto de la persona,
 * distinto de A3 y de B2: no autoriza un Alcance, sino que un profesional vea lo de **otra** área suya, con un nivel
 * (`SUMMARY` o `SUMMARY_AND_PLAN`, TA-85). Cada versión ACTIVA guarda sus renglones (TA-96):
 * - **por el componente de vínculo de quien recibe** (aceptado o en pausa): si ese vínculo termina y vuelve con otro, no
 *   lo hereda;
 * - **por el componente de vínculo de quien lleva el área de origen**: lo que se comparte es lo de ese profesional. Si la
 *   persona empieza con otro en esa área, a ese no se le comparte nada hasta que ella vuelva a elegir.
 * Lo que no está en la lista no se comparte (la lista es completa, como en API-HBT-03).
 */
import { ALCANCES, type Alcance } from './alcance';
import type { ValidationIssue } from './contratos';
import type { AgendaDeEntrenamiento } from './contratos-entrenamiento';
import { AREAS_CON_PLAN, laMatrizDejaVerElPlan, type AreaCompartida, type AreaConPlan, type NivelDeResumen, type PermisoDeResumen } from './contratos-resumenes-compartidos';
import { desdeCuandoSePuedeVolverAPedir } from './habitos-de-la-persona';
import { lunesDe } from './series-del-analisis';

/** Un componente de vínculo sin terminar de la persona, con su profesional (aceptado o en pausa). */
export interface ComponenteDeLaPersona {
  readonly profesionalId: string;
  readonly alcanceDeVinculoId: string;
  readonly alcance: Alcance;
  readonly estado: 'ACEPTADO' | 'PAUSADO';
}

/**
 * Un renglón de una versión ACTIVA: quién recibe (por uno de sus componentes), de qué componente de origen (el de quien
 * lleva el área), el área, el nivel y desde cuándo rige ese nivel (TA-97: un cambio de nivel lo reinicia).
 */
export interface RenglonDeResumen {
  readonly profesionalId: string;
  readonly alcanceDeVinculoId: string;
  readonly origenId: string;
  readonly area: Alcance;
  readonly nivel: NivelDeResumen;
  /** ISO 8601. */
  readonly desde: string;
}

const RANGO: Readonly<Record<NivelDeResumen, number>> = { SUMMARY: 1, SUMMARY_AND_PLAN: 2 };
const primero = (instantes: readonly string[]): string | null => (instantes.length === 0 ? null : [...instantes].sort()[0]!);

/** Las áreas que lleva un profesional con la persona: las de sus componentes sin terminar. */
export const areasDe = (profesionalId: string, componentes: readonly ComponenteDeLaPersona[]): Alcance[] =>
  ALCANCES.filter((a) => componentes.some((c) => c.profesionalId === profesionalId && c.alcance === a));

/**
 * Las áreas de origen que se le pueden compartir a un profesional: las que lleva otro profesional de la persona (un
 * componente sin terminar) y él no. Un profesional que ya lleva el área la ve por su Alcance, no como compartida.
 */
export function areasQueSeLePuedenCompartir(profesionalId: string, componentes: readonly ComponenteDeLaPersona[]): Alcance[] {
  const propias = new Set(areasDe(profesionalId, componentes));
  return ALCANCES.filter((a) => !propias.has(a) && componentes.some((c) => c.profesionalId !== profesionalId && c.alcance === a));
}

/** Los códigos de los problemas de un pedido de API-RES-02, en `details.issues` del 422. */
export const CODIGO_DE_PROBLEMA_DE_RESUMEN = {
  /** Ese profesional no acompaña hoy a la persona (sin vínculo, o con el vínculo terminado). */
  NOT_AVAILABLE: 'SUMMARY_RECIPIENT_NOT_AVAILABLE',
  /** Esa área no se le puede compartir: nadie más la lleva hoy, o la lleva él. */
  AREA_NOT_SHAREABLE: 'SUMMARY_AREA_NOT_SHAREABLE',
  /** La matriz del plan completo no tiene la fila (TA-87; hoy, «todos con todos», no pasa con un área con plan). */
  PLAN_NOT_ALLOWED: 'SUMMARY_PLAN_NOT_ALLOWED',
} as const;

/**
 * Los problemas de los permisos de API-RES-02: cada profesional tiene que acompañar hoy a la persona; cada área, poder
 * compartírsele; y «resumen y plan», solo de un área con plan y con la fila de la matriz. Que Antropometría vaya solo con
 * «resumen» y que no se repita un par lo dice el schema (400).
 */
export function problemasDeLosPermisos(componentes: readonly ComponenteDeLaPersona[], permisos: readonly PermisoDeResumen[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  permisos.forEach((p, i) => {
    const id = p.professionalId.toLowerCase();
    const path = `grants[${i}]`;
    if (!componentes.some((c) => c.profesionalId === id)) return void issues.push({ code: CODIGO_DE_PROBLEMA_DE_RESUMEN.NOT_AVAILABLE, path });
    if (!areasQueSeLePuedenCompartir(id, componentes).includes(p.area)) return void issues.push({ code: CODIGO_DE_PROBLEMA_DE_RESUMEN.AREA_NOT_SHAREABLE, path });
    if (p.level === 'SUMMARY_AND_PLAN' && !(esAreaConPlan(p.area) && laMatrizDejaVerElPlan(p.area, areasDe(id, componentes)))) {
      issues.push({ code: CODIGO_DE_PROBLEMA_DE_RESUMEN.PLAN_NOT_ALLOWED, path });
    }
  });
  return issues;
}

export const esAreaConPlan = (area: Alcance): area is AreaConPlan => (AREAS_CON_PLAN as readonly string[]).includes(area);

/**
 * Los renglones que siguen valiendo: los de un componente de quien recibe y uno de origen que hoy siguen sin terminar. Un
 * vínculo que terminó se lleva lo suyo, sin escribir nada (el renglón queda en la historia).
 */
export function renglonesVigentes(renglones: readonly RenglonDeResumen[] | null, componentes: readonly ComponenteDeLaPersona[]): RenglonDeResumen[] {
  if (renglones === null) return [];
  const ids = new Set(componentes.map((c) => c.alcanceDeVinculoId));
  return renglones.filter((r) => ids.has(r.alcanceDeVinculoId) && ids.has(r.origenId));
}

/**
 * Los renglones de la versión nueva (API-RES-02): por cada permiso, por cada componente sin terminar de quien recibe y por
 * cada componente sin terminar de otro profesional en esa área. Desde cuándo: el del renglón anterior si sigue en el mismo
 * nivel; si es nuevo o cambió de nivel, `ahora` (TA-97). Los permisos ya vienen validados.
 */
export function renglonesDeLosPermisos(p: {
  readonly componentes: readonly ComponenteDeLaPersona[];
  readonly anteriores: readonly RenglonDeResumen[] | null;
  readonly permisos: readonly PermisoDeResumen[];
  readonly ahora: string;
}): RenglonDeResumen[] {
  const vigentes = renglonesVigentes(p.anteriores, p.componentes);
  const renglones: RenglonDeResumen[] = [];
  for (const permiso of p.permisos) {
    const id = permiso.professionalId.toLowerCase();
    const propios = p.componentes.filter((c) => c.profesionalId === id);
    const origenes = p.componentes.filter((c) => c.profesionalId !== id && c.alcance === permiso.area);
    for (const r of propios) {
      for (const o of origenes) {
        const antes = vigentes.find((v) => v.alcanceDeVinculoId === r.alcanceDeVinculoId && v.origenId === o.alcanceDeVinculoId);
        const desde = antes && antes.nivel === permiso.level ? antes.desde : p.ahora;
        renglones.push({ profesionalId: id, alcanceDeVinculoId: r.alcanceDeVinculoId, origenId: o.alcanceDeVinculoId, area: permiso.area, nivel: permiso.level, desde });
      }
    }
  }
  return renglones.sort((a, b) => a.alcanceDeVinculoId.localeCompare(b.alcanceDeVinculoId) || a.origenId.localeCompare(b.origenId));
}

/**
 * Si la versión nueva amplía lo compartido (08 C-12): un renglón que antes no valía, o uno que sube de nivel. Ampliar pide
 * el A3 y aceptar el texto vigente; bajar, sacar a alguien o dejar igual, no (TA-98): corta en el momento.
 */
export function ampliaLoCompartido(anteriores: readonly RenglonDeResumen[], nuevos: readonly RenglonDeResumen[]): boolean {
  return nuevos.some((n) => {
    const antes = anteriores.find((a) => a.alcanceDeVinculoId === n.alcanceDeVinculoId && a.origenId === n.origenId);
    return !antes || RANGO[n.nivel] > RANGO[antes.nivel];
  });
}

/** Los permisos que dicen hoy los renglones vigentes: uno por profesional y área, con el nivel más alto (para volver a escribirlos). */
export function permisosDeLosRenglones(renglones: readonly RenglonDeResumen[]): PermisoDeResumen[] {
  const porPar = new Map<string, PermisoDeResumen>();
  for (const r of renglones) {
    const clave = `${r.profesionalId}|${r.area}`;
    const antes = porPar.get(clave);
    if (!antes || RANGO[r.nivel] > RANGO[antes.level]) porPar.set(clave, { professionalId: r.profesionalId, area: r.area, level: r.nivel });
  }
  return [...porPar.values()];
}

/**
 * Lo que un profesional recibe de cada área: de los renglones vigentes que lo nombran con un componente que el PDP le
 * permite hoy (`permitidos`), el nivel más alto y, en ese nivel, el primer «desde». Sin renglones, nada.
 */
export function loQueRecibe(profesionalId: string, permitidos: readonly string[], renglones: readonly RenglonDeResumen[]): AreaCompartida[] {
  const ids = new Set(permitidos);
  const propios = renglones.filter((r) => r.profesionalId === profesionalId && ids.has(r.alcanceDeVinculoId));
  return ALCANCES.flatMap((area) => {
    const delArea = propios.filter((r) => r.area === area);
    if (delArea.length === 0) return [];
    const nivel = delArea.some((r) => r.nivel === 'SUMMARY_AND_PLAN') ? ('SUMMARY_AND_PLAN' as const) : ('SUMMARY' as const);
    return [{ area, level: nivel, since: primero(delArea.filter((r) => r.nivel === nivel).map((r) => r.desde))! }];
  });
}

/** Los renglones con «resumen y plan» de un área que un profesional recibe por un componente permitido: de ahí sale API-RES-06. */
export const renglonesDelPlan = (profesionalId: string, permitidos: readonly string[], area: Alcance, renglones: readonly RenglonDeResumen[]): RenglonDeResumen[] => {
  const ids = new Set(permitidos);
  return renglones.filter((r) => r.profesionalId === profesionalId && ids.has(r.alcanceDeVinculoId) && r.area === area && r.nivel === 'SUMMARY_AND_PLAN');
};

/**
 * TB-56 · «Sí, que lo vea» (API-RES-10): los permisos de la versión nueva. Con la autorización activa, los de hoy siguen y
 * quien pidió pasa a «resumen y plan» en esa área; sin compartir todavía, solo eso (la persona respondió un pedido, no eligió
 * a nadie más), como D-25 de los hábitos.
 */
export function permisosAlAceptarUnPedido(p: { readonly vigentes: readonly RenglonDeResumen[] | null; readonly profesionalId: string; readonly area: AreaConPlan }): PermisoDeResumen[] {
  const quien = p.profesionalId.toLowerCase();
  const otros = permisosDeLosRenglones(p.vigentes ?? []).filter((x) => !(x.professionalId === quien && x.area === p.area));
  return [...otros, { professionalId: quien, area: p.area, level: 'SUMMARY_AND_PLAN' }];
}

// ─── El pedido (TB-56; el mecanismo de DL-165 D-24) ─────────────────────────────────────────────

export type PorQueNoPuedePedirElPlan = 'YA_LO_VE' | 'NO_SE_PUEDE' | 'MUY_PRONTO';

/**
 * Si un profesional puede pedir ver el plan de un área: tiene que ser un área con plan, que lleve otro profesional hoy, con
 * la fila de la matriz para sus áreas, que no lo vea ya, y que hayan pasado 7 días desde su último pedido de esa área
 * (pendiente o respondido). No mira si hay un plan activado: decirlo revelaría algo que no se comparte (TA-100).
 */
export function puedePedirVerElPlan(p: {
  readonly area: Alcance;
  readonly areasDelProfesional: readonly Alcance[];
  readonly hayQuienLaLleve: boolean;
  readonly yaLoVe: boolean;
  readonly ultimoPedidoEl: string | null;
  readonly ahora: string;
}): { readonly puede: true } | { readonly puede: false; readonly motivo: PorQueNoPuedePedirElPlan; readonly desde: string | null } {
  if (!esAreaConPlan(p.area) || !p.hayQuienLaLleve || !laMatrizDejaVerElPlan(p.area, p.areasDelProfesional)) return { puede: false, motivo: 'NO_SE_PUEDE', desde: null };
  if (p.yaLoVe) return { puede: false, motivo: 'YA_LO_VE', desde: null };
  if (p.ultimoPedidoEl === null) return { puede: true };
  const desde = desdeCuandoSePuedeVolverAPedir(p.ultimoPedidoEl);
  return new Date(p.ahora).getTime() >= new Date(desde).getTime() ? { puede: true } : { puede: false, motivo: 'MUY_PRONTO', desde };
}

// ─── Lo avanzado (TA-86) ────────────────────────────────────────────────────────────────────────

/** Cuántas semanas trae lo avanzado, como mucho: las más recientes. */
export const SEMANAS_DE_LO_AVANZADO = 12;

const DIA = 86_400_000;
const masDias = (fecha: string, dias: number): string => new Date(Date.parse(`${fecha}T00:00:00.000Z`) + dias * DIA).toISOString().slice(0, 10);

/**
 * Lo registrado por semana de BE (lunes a domingo) desde la semana de la activación hasta la de hoy, las últimas 12, con
 * las semanas sin nada en cero. Las fechas son civiles, ya en la zona de la persona; las de antes de la activación no
 * cuentan.
 */
export function semanasDeLoAvanzado(p: { readonly activadoEl: string; readonly hoy: string; readonly registradas: readonly string[] }): { weekStart: string; recorded: number }[] {
  if (p.hoy < p.activadoEl) return [];
  const semanas: { weekStart: string; recorded: number }[] = [];
  for (let lunes = lunesDe(p.activadoEl); lunes <= p.hoy; lunes = masDias(lunes, 7)) semanas.push({ weekStart: lunes, recorded: 0 });
  const porLunes = new Map(semanas.map((s) => [s.weekStart, s] as const));
  for (const f of p.registradas) {
    if (f < p.activadoEl || f > p.hoy) continue;
    const s = porLunes.get(lunesDe(f));
    if (s) s.recorded++;
  }
  return semanas.slice(-SEMANAS_DE_LO_AVANZADO);
}

/** Las sesiones por semana que fija la agenda del plan (DL-137): la suma de los días de cada sesión; `null` sin agenda. */
export const sesionesPorSemanaDeLaAgenda = (agenda: AgendaDeEntrenamiento | null | undefined): number | null =>
  agenda ? agenda.sessions.reduce((n, s) => n + s.weekdays.length, 0) : null;
