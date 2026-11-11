/**
 * «Quién ve qué» (PV-3, decisión de Dirección del 2026-11-07; AV-05 de WP-APP-VUELTA-DE-ROSCA, DL-166), como lógica pura:
 * arma, con lo que la APK ya lee, una tarjeta por profesional con lo que autorizaste, desde cuándo, y si ve tus hábitos.
 *
 * - **Solo lee lo que existe:** el A3 (API-CON-05), los vínculos (API-REL-05), los consentimientos (API-CON-03), los
 *   hábitos compartidos (API-HBT-01) y los pedidos de verlos (API-HBT-08). No suma ninguna escritura: para cambiar algo,
 *   la tarjeta lleva al vínculo, a Privacidad o a «Mis hábitos».
 * - **Arriba, el tratamiento de los datos de salud (A3):** sin él, ningún profesional ve tus datos de salud, y cada área
 *   lo dice.
 * - **Un vínculo en pausa o terminado dice que no ve, y por qué.** Una autorización retirada, también.
 * - **«Qué incluye» va plegado** y sale de cada Alcance (su finalidad y su área), no de un texto escrito a mano.
 * - **Sin colores que juzguen:** «Lo ve» o «No lo ve» van con su ícono y su palabra; el estado nunca está plegado (III.7).
 * - **10-B04:** ningún texto dice que alguien «puede ver todos tus datos»; cada línea dice el área y el para qué.
 */
import { ETIQUETA_DE_ALCANCE, ETIQUETA_DE_FINALIDAD, type Alcance, type ConsentimientoPropio, type MisHabitosResponse, type PedidoDeAccesoParaLaPersona, type RequisitoDeConsentimientoDeSaludResponse, type Vinculo } from '@be/domain';
import type { VistaConPliegue } from './desplegable';
import { TEXTOS_DE_LA_VUELTA as T } from './textos-de-la-vuelta';

export interface AreaQueVe {
  readonly vinculoId: string;
  readonly area: string;
  /** Lo que se dice a la vista: el área, desde cuándo, o por qué no ve. */
  readonly linea: string;
  readonly ve: boolean;
  /** Lo plegado: para qué y dentro de qué área, del Alcance. */
  readonly queIncluye: readonly string[];
}

export type HabitosQueVe = typeof T.losVe | typeof T.noLosVe | typeof T.tePidioVerlos;

export interface TarjetaDeQuienVe {
  readonly profesionalId: string;
  readonly nombre: string;
  readonly areas: readonly AreaQueVe[];
  /** `null` si el profesional no está entre los de tus hábitos (por ejemplo, un vínculo terminado). */
  readonly habitos: HabitosQueVe | null;
}

export interface QuienVeQue {
  readonly a3: { readonly otorgado: boolean; readonly texto: string };
  readonly tarjetas: readonly TarjetaDeQuienVe[];
}

export interface LecturasDeQuienVe {
  readonly a3: RequisitoDeConsentimientoDeSaludResponse['data'];
  readonly vinculos: readonly Vinculo[];
  readonly consentimientos: readonly ConsentimientoPropio[];
  readonly habitos: Pick<MisHabitosResponse['data'], 'professionals'> | null;
  readonly pedidos: readonly PedidoDeAccesoParaLaPersona[] | null;
}

/** Arma la vista. `dia` formatea una fecha para mostrarla («26/9/2026»). */
export function quienVeQue(l: LecturasDeQuienVe, dia: (iso: string) => string): QuienVeQue {
  const a3Otorgado = l.a3.currentConsent?.state === 'ACTIVE';
  const consentimientoActivo = new Map(l.consentimientos.filter((c) => c.state === 'ACTIVE').map((c) => [c.relationshipId, c] as const));
  const porProfesional = new Map<string, { nombre: string; areas: AreaQueVe[] }>();
  for (const v of l.vinculos) {
    const alcance = v.scope.code as Alcance;
    const area = ETIQUETA_DE_ALCANCE[alcance] ?? v.scope.label;
    const consentimiento = consentimientoActivo.get(v.relationshipId);
    let linea: string;
    let ve = false;
    if (v.relationshipState === 'FINALIZADO') linea = `${area} · ${T.terminadoNoVe}`;
    else if (v.relationshipState === 'PAUSADO') linea = `${area} · ${T.enPausaNoVe}`;
    else if (v.consentState === 'REVOKED') linea = `${area} · ${T.revocadoNoVe}`;
    else if (v.consentState !== 'ACTIVE') linea = T.sinAutorizar(area);
    else {
      linea = T.autorizadoDesde(area, dia(consentimiento?.acceptedAt ?? v.acceptedAt));
      ve = a3Otorgado;
    }
    const queIncluye = [T.paraQue(ETIQUETA_DE_FINALIDAD[v.purpose]), T.dentroDe(v.scope.label), T.queIncluyeAclaracion];
    const id = v.professional.identityId;
    const tarjeta = porProfesional.get(id) ?? { nombre: v.professional.displayName, areas: [] };
    tarjeta.areas.push({ vinculoId: v.relationshipId, area, linea, ve, queIncluye });
    porProfesional.set(id, tarjeta);
  }
  const pidieron = new Set((l.pedidos ?? []).map((p) => p.professional.identityId));
  const tarjetas = [...porProfesional.entries()].map(([profesionalId, t]): TarjetaDeQuienVe => {
    const enHabitos = l.habitos?.professionals.find((p) => p.professional.identityId === profesionalId) ?? null;
    let habitos: HabitosQueVe | null = null;
    if (enHabitos) habitos = enHabitos.sharing === 'RECEIVES' && enHabitos.link === 'ACTIVE' ? T.losVe : pidieron.has(profesionalId) ? T.tePidioVerlos : T.noLosVe;
    return { profesionalId, nombre: t.nombre, areas: t.areas, habitos };
  });
  // Primero quien ve algo, después el resto; dentro de cada grupo, por nombre. Un orden fijo, sin juicio.
  tarjetas.sort((a, b) => Number(b.areas.some((x) => x.ve)) - Number(a.areas.some((x) => x.ve)) || a.nombre.localeCompare(b.nombre, 'es'));
  return { a3: { otorgado: a3Otorgado, texto: a3Otorgado ? T.a3Otorgado : T.a3NoOtorgado }, tarjetas };
}

/** Lo que dice el lector de la línea de hábitos: «Tus hábitos: no los ve». El ícono del ojo no se lee (§4.0). */
export const habitosParaLeer = (h: HabitosQueVe): string => T.habitosParaLeer(h);

/** Qué deja a la vista y qué pliega (III.7): quién, el estado y la fecha, a la vista; qué incluye, plegado. */
export const PLIEGUE_DE_QUIEN_VE_QUE: VistaConPliegue = { nombre: 'Quién ve qué', visible: ['quien', 'estado', 'fecha'], plegado: ['que-incluye'] };
