/**
 * PG-17 de WP-PULIDO-GRANDES (DL-173, con PG-D12): el plan en papel o en PDF, para la consulta. Arma la hoja con lo que
 * la pantalla del plan ya leyó: el profesional, la persona, la versión, desde cuándo vale, la próxima revisión y lo de
 * cada día (las comidas con sus opciones y cantidades, o las sesiones con sus series). Sin React, para la prueba
 * (TEST-PG-016, `test/plan-en-papel.test.mjs`); la dibuja `components/hoja-del-plan.tsx`.
 *
 * - **La hoja lleva un QR para bajar la app** (Dirección, 2026-11-14: «tiene que tener el QR para descargar»): el mismo
 *   archivo que ofrece la portada (`APK_DE_LA_ULTIMA`, PG-06). No lleva datos de la persona: ni su nombre, ni su
 *   identificador, ni el del plan. Se dibuja en el navegador (`components/codigo-qr.tsx`), sin servicios externos.
 * - **El papel no avisa cuando queda viejo:** la hoja dice qué versión muestra, el día en que se descargó y que lo
 *   vigente está siempre en la app.
 * - **Las fechas, en palabras** («martes 10 de noviembre de 2026»), las mismas de PG-14 (`fecha-en-palabras.ts`).
 * - **La próxima revisión es la acordada hoy** (la que lee el Resumen de la ficha), no la que se fijó al activar la
 *   versión: una revisión que mantuvo el plan pudo moverla. Si no se pudo leer, la hoja no la dice; sin fecha acordada,
 *   lo dice.
 * - **El nombre del archivo no lleva el de la persona:** el título de la pestaña queda en el historial del navegador
 *   (TB-05).
 * Lo que no hace: no genera un archivo en el servidor, no manda el plan por correo ni por WhatsApp y no imprime la
 * evolución ni las medidas.
 */
import {
  COPY_DEL_PLAN,
  COPY_DEL_PLAN_DE_ENTRENAMIENTO,
  COPY_ENTRENAMIENTO_POR_SERIE,
  COPY_RECETAS,
  cuentaDeLaSesion,
  diasDeLaSemanaEnPalabras,
  indicadoDelItem,
  loGeneralDelEjercicio,
  opcionesEnPalabras,
  renglonDelEjercicio,
  seriesDelEjercicio,
  tituloDeLaOpcion,
  type DatoGeneralDelEjercicio,
  type PlanConObjetivos,
  type SerieDelPlan,
  type VersionDePlan,
} from '@be/domain';
import { APK_DE_LA_ULTIMA, COPY_DESCARGA } from './descarga-de-la-app';
import { fechaCompleta, hoyEnBuenosAires } from './fecha-en-palabras';

export type AreaDeLaHoja = 'NUTRICION' | 'ENTRENAMIENTO';

const NOMBRE_DEL_AREA: Readonly<Record<AreaDeLaHoja, string>> = { NUTRICION: 'Nutrición', ENTRENAMIENTO: 'Entrenamiento' };

export const COPY_HOJA_DEL_PLAN = {
  descargar: 'Descargar el plan en PDF',
  preparando: 'Preparando la hoja…',
  /** La pista del botón: lo que pasa al tocarlo, dicho antes. */
  ayuda: 'Se abre la ventana de impresión del navegador: en «Destino», elegí «Guardar como PDF». También sirve para imprimirla.',
  titulo: (area: string) => `Plan de ${area}`,
  marca: 'BE · Better Everyday',
  persona: 'Persona',
  profesional: 'Profesional',
  version: 'Versión',
  valeDesde: 'Vale desde',
  proximaRevision: 'Próxima revisión',
  sinFechaAcordada: 'Sin fecha acordada',
  datosDelPlan: 'Datos del plan',
  diaTipo: (dia: string) => `Día tipo: ${dia}`,
  nota: 'Nota',
  sesionesSinDia: 'Las sesiones no tienen un día fijo: cada vez se elige cuál hacer.',
  dias: (dias: string) => `Días: ${dias}`,
  indicaciones: 'Indicaciones',
  serie: COPY_ENTRENAMIENTO_POR_SERIE.columnaSerie,
  carga: COPY_DEL_PLAN_DE_ENTRENAMIENTO.cargaSugerida,
  repeticiones: COPY_ENTRENAMIENTO_POR_SERIE.columnaRepeticiones,
  rir: COPY_ENTRENAMIENTO_POR_SERIE.columnaRir,
  descanso: COPY_ENTRENAMIENTO_POR_SERIE.descansoRecomendado,
  sinObjetivo: COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo,
  seriesDe: (ejercicio: string) => `Series de ${ejercicio}`,
  appTitulo: COPY_DESCARGA.escanea,
  appTexto: 'Apuntá la cámara del teléfono al código para bajar BE, la app para Android. Ahí ves lo vigente de tu plan y registrás lo que hacés.',
  descargadaEl: (dia: string) => `Descargada el ${dia}.`,
  loVigente: (numero: number) => `Este papel muestra la versión ${numero}. Si tu profesional la cambia, lo vigente está siempre en la app.`,
  // «Ocultar nombres» (TB-05), antes de descargar.
  conNombresOcultosTitulo: '«Ocultar nombres» está prendido',
  conNombresOcultos:
    'La hoja sale como la pantalla: con la referencia en lugar del nombre de la persona y del tuyo. Para dársela con su nombre, apagá «Ocultar nombres» en el menú de tu cuenta y volvé a descargarla.',
  descargarSinNombres: 'Descargar sin los nombres',
  volver: 'Volver',
  nombreDelArchivo: (area: string, numero: number) => `BE · Plan de ${area} · versión ${numero}`,
} as const;
const C = COPY_HOJA_DEL_PLAN;

/** Lo que la pantalla sabe y la hoja no saca del plan: quiénes son, el número de la versión, la revisión y hoy. */
export interface ContextoDeLaHoja {
  /** El número de la versión para la persona (el orden de activación), el mismo que dice la pantalla. */
  readonly numero: number;
  /** El nombre como lo muestra la pantalla (con «Ocultar nombres», la referencia); `null` si todavía no se leyó. */
  readonly persona: string | null;
  readonly profesional: string;
  /** La próxima revisión acordada hoy: la fecha civil, `null` sin fecha acordada, `undefined` si no se pudo leer. */
  readonly proximaRevision: string | null | undefined;
  /** El día en que se descarga (`AAAA-MM-DD`, en Buenos Aires). */
  readonly hoy: string;
}

export interface DatoDeLaHoja {
  readonly rotulo: string;
  readonly valor: string;
}

export interface ItemDeLaHoja {
  readonly nombre: string;
  readonly indicado: string;
  readonly nota: string | null;
}

export interface OpcionDeLaHoja {
  readonly titulo: string;
  readonly receta: string | null;
  readonly items: readonly ItemDeLaHoja[];
  /** «Esta opción no tiene ítems.», si no tiene. */
  readonly vacia: string | null;
}

export interface ComidaDeLaHoja {
  readonly nombre: string;
  /** «2 opciones · se elige una». */
  readonly cuantas: string;
  readonly opciones: readonly OpcionDeLaHoja[];
  readonly vacia: string | null;
}

export interface DiaDeLaHoja {
  readonly titulo: string;
  readonly comidas: readonly ComidaDeLaHoja[];
  readonly vacio: string | null;
}

export interface EjercicioDeLaHoja {
  readonly nombre: string;
  /** Lo que piden sus series, en un renglón: «4 × 8–10 rep. · 47,5 kg · RIR 2 · descanso 02:00». */
  readonly resumen: string;
  readonly series: readonly SerieDelPlan[];
  readonly conRir: boolean;
  readonly conNota: boolean;
  readonly general: readonly DatoGeneralDelEjercicio[];
}

export interface SesionDeLaHoja {
  readonly titulo: string;
  /** «Días: lunes y jueves», con la agenda del plan; `null` sin agenda. */
  readonly dias: string | null;
  /** «3 ejercicios · 12 series». */
  readonly cuenta: string;
  readonly indicaciones: string | null;
  readonly ejercicios: readonly EjercicioDeLaHoja[];
  readonly vacia: string | null;
}

/** Un bloque, o un microciclo de un bloque, con sus sesiones en orden. */
export interface GrupoDeLaHoja {
  readonly titulo: string;
  readonly proposito: string | null;
  readonly sesiones: readonly SesionDeLaHoja[];
  readonly vacio: string | null;
}

export type CuerpoDeLaHoja =
  | { readonly area: 'NUTRICION'; readonly dias: readonly DiaDeLaHoja[]; readonly vacio: string | null }
  | { readonly area: 'ENTRENAMIENTO'; readonly grupos: readonly GrupoDeLaHoja[]; readonly sinDias: string | null; readonly vacio: string | null };

export interface HojaDelPlan {
  readonly area: AreaDeLaHoja;
  readonly titulo: string;
  /** El título de la pestaña mientras se imprime: el nombre que propone el navegador para el PDF. Sin nombres. */
  readonly nombreDelArchivo: string;
  readonly datos: readonly DatoDeLaHoja[];
  readonly cuerpo: CuerpoDeLaHoja;
  /** El QR para bajar la app: el archivo de la última publicación, sin datos de la persona. */
  readonly app: { readonly enlace: string; readonly titulo: string; readonly texto: string; readonly etiqueta: string };
  readonly pie: readonly string[];
}

const enOrden = <T extends { readonly order: number }>(nodos: readonly T[]): T[] => [...nodos].sort((a, b) => a.order - b.order);

/** Los datos de arriba: quiénes, qué versión, desde cuándo y la próxima revisión, cada uno solo si se sabe. */
function datosDeLaHoja(c: ContextoDeLaHoja, activadaEl: string | null): DatoDeLaHoja[] {
  const datos: DatoDeLaHoja[] = [];
  if (c.persona) datos.push({ rotulo: C.persona, valor: c.persona });
  datos.push({ rotulo: C.profesional, valor: c.profesional });
  datos.push({ rotulo: C.version, valor: String(c.numero) });
  if (activadaEl) datos.push({ rotulo: C.valeDesde, valor: fechaCompleta(hoyEnBuenosAires(new Date(activadaEl))) });
  if (c.proximaRevision !== undefined) datos.push({ rotulo: C.proximaRevision, valor: c.proximaRevision ? fechaCompleta(c.proximaRevision) : C.sinFechaAcordada });
  return datos;
}

function armar(area: AreaDeLaHoja, c: ContextoDeLaHoja, activadaEl: string | null, cuerpo: CuerpoDeLaHoja): HojaDelPlan {
  return {
    area,
    titulo: C.titulo(NOMBRE_DEL_AREA[area]),
    nombreDelArchivo: C.nombreDelArchivo(NOMBRE_DEL_AREA[area], c.numero),
    datos: datosDeLaHoja(c, activadaEl),
    cuerpo,
    app: { enlace: APK_DE_LA_ULTIMA, titulo: C.appTitulo, texto: C.appTexto, etiqueta: COPY_DESCARGA.etiquetaDelQr },
    pie: [C.descargadaEl(fechaCompleta(c.hoy)), C.loVigente(c.numero)],
  };
}

/** La hoja de una versión activa del plan de Nutrición: todos sus días tipo, con cada comida y sus opciones. */
export function hojaDeNutricion(version: Pick<VersionDePlan, 'activatedAt' | 'dayTypes'>, c: ContextoDeLaHoja): HojaDelPlan {
  const dias = enOrden(version.dayTypes).map((d): DiaDeLaHoja => {
    const comidas = enOrden(d.meals).map((m): ComidaDeLaHoja => {
      const opciones = enOrden(m.options);
      return {
        nombre: m.label,
        cuantas: opcionesEnPalabras(opciones.length),
        vacia: opciones.length === 0 ? COPY_DEL_PLAN.sinOpciones : null,
        opciones: opciones.map((o) => ({
          titulo: tituloDeLaOpcion(o, opciones.length),
          receta: o.recipe ? `${COPY_RECETAS.opcionDeReceta(o.recipe.name, o.recipe.versionNumber)}. ${COPY_RECETAS.porcionDeLaOpcion}` : null,
          items: o.items.map((i) => ({ nombre: i.name, indicado: indicadoDelItem(i), nota: i.note && i.note.trim() !== '' ? i.note : null })),
          vacia: o.items.length === 0 ? COPY_DEL_PLAN.sinItems : null,
        })),
      };
    });
    return { titulo: C.diaTipo(d.label), comidas, vacio: comidas.length === 0 ? COPY_DEL_PLAN.sinComidas : null };
  });
  return armar('NUTRICION', c, version.activatedAt, { area: 'NUTRICION', dias, vacio: dias.length === 0 ? COPY_DEL_PLAN.sinDiasTipo : null });
}

type Sesion = PlanConObjetivos['blocks'][number]['sessions'][number];

/** La hoja de una versión activa del plan de Entrenamiento: cada bloque (y microciclo), con sus sesiones y sus series. */
export function hojaDeEntrenamiento(version: Pick<PlanConObjetivos, 'activatedAt' | 'blocks' | 'agenda'>, c: ContextoDeLaHoja): HojaDelPlan {
  const diasDe = (s: Sesion): string | null => {
    if (!version.agenda) return null;
    const dias = diasDeLaSemanaEnPalabras(version.agenda.sessions.find((a) => a.sessionId === s.sessionId)?.weekdays ?? []);
    return dias ? C.dias(dias) : null;
  };
  const sesion = (s: Sesion): SesionDeLaHoja => {
    const ejercicios = enOrden(s.prescriptions).map((p): EjercicioDeLaHoja => {
      const { filas, conRir, conNota } = seriesDelEjercicio(p);
      return { nombre: p.exerciseName, resumen: renglonDelEjercicio(p), series: filas, conRir, conNota, general: loGeneralDelEjercicio(p) };
    });
    return {
      titulo: s.label,
      dias: diasDe(s),
      cuenta: cuentaDeLaSesion(s),
      indicaciones: s.instructions && s.instructions.trim() !== '' ? s.instructions : null,
      ejercicios,
      vacia: ejercicios.length === 0 ? COPY_DEL_PLAN_DE_ENTRENAMIENTO.sinEjercicios : null,
    };
  };
  const grupos = enOrden(version.blocks).flatMap((b): GrupoDeLaHoja[] => {
    if (b.microcycles.length === 0) {
      const sesiones = enOrden(b.sessions).map(sesion);
      return [{ titulo: b.label, proposito: b.purpose, sesiones, vacio: sesiones.length === 0 ? COPY_DEL_PLAN_DE_ENTRENAMIENTO.sinSesiones : null }];
    }
    return enOrden(b.microcycles).map((m) => {
      const sesiones = enOrden(m.sessions).map(sesion);
      return { titulo: `${b.label} · ${m.label}`, proposito: m.purpose ?? b.purpose, sesiones, vacio: sesiones.length === 0 ? COPY_DEL_PLAN_DE_ENTRENAMIENTO.sinSesiones : null };
    });
  });
  return armar('ENTRENAMIENTO', c, version.activatedAt, {
    area: 'ENTRENAMIENTO',
    grupos,
    sinDias: version.agenda ? null : C.sesionesSinDia,
    vacio: grupos.length === 0 ? COPY_DEL_PLAN_DE_ENTRENAMIENTO.sinBloques : null,
  });
}

/** Los textos de la hoja que se ven, para la prueba de palabras: ubican, no califican. */
export function textosDeLaHoja(h: HojaDelPlan): string[] {
  const textos = [h.titulo, h.nombreDelArchivo, ...h.datos.flatMap((d) => [d.rotulo, d.valor]), h.app.titulo, h.app.texto, ...h.pie];
  if (h.cuerpo.area === 'NUTRICION') {
    for (const d of h.cuerpo.dias) {
      textos.push(d.titulo, ...(d.vacio ? [d.vacio] : []));
      for (const m of d.comidas) {
        textos.push(m.nombre, m.cuantas, ...(m.vacia ? [m.vacia] : []));
        for (const o of m.opciones) textos.push(o.titulo, ...(o.receta ? [o.receta] : []), ...(o.vacia ? [o.vacia] : []), ...o.items.flatMap((i) => [i.nombre, i.indicado, ...(i.nota ? [i.nota] : [])]));
      }
    }
  } else {
    if (h.cuerpo.sinDias) textos.push(h.cuerpo.sinDias);
    for (const g of h.cuerpo.grupos) {
      textos.push(g.titulo, ...(g.proposito ? [g.proposito] : []));
      for (const s of g.sesiones) {
        textos.push(s.titulo, s.cuenta, ...(s.dias ? [s.dias] : []), ...(s.indicaciones ? [s.indicaciones] : []));
        for (const e of s.ejercicios) textos.push(e.nombre, e.resumen, ...e.general.flatMap((x) => [x.rotulo, x.valor]));
      }
    }
  }
  return textos;
}
