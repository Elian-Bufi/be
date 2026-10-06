/**
 * Los textos del registro por serie y de los tiempos (WP-ENTRENAMIENTO-SERIES), iguales en la web y en la APK. Las
 * frases de Dirección van literales: la ayuda del RIR, su ejemplo y la explicación de los tiempos. Todo número pasa por
 * `numero` o `cantidad` (coma decimal). La comparación es descriptiva: no hay puntajes, cumplimiento ni «bien» o «mal».
 * La procedencia de una imagen se nombra con `ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN`, la misma de las recetas.
 */
import type { BaseDeCarga, BaseDeRepeticiones, CargaSchema } from './contratos-entrenamiento';
import type { CalidadDeTiempoApi, DescansoRegistrado, DuracionApi, LicenciaDeImagen, ObjetivoDeSerie, RevisionTecnica } from './contratos-entrenamiento-por-serie';
import { cantidad, numero } from './formato-numeros';
import type { RelacionConElObjetivo } from './relacion-con-el-objetivo';
import { diferenciaParaMostrar, duracionParaMostrar } from './tiempos-de-entrenamiento';
import type { z } from 'zod';

type Carga = z.infer<typeof CargaSchema>;
type Repeticiones = { readonly value: number } | { readonly min: number; readonly max: number };

export const COPY_ENTRENAMIENTO_POR_SERIE = {
  // Inicio y estructura
  hoy: 'Hoy',
  plan: 'Plan',
  historial: 'Historial',
  iniciarEntrenamiento: 'Iniciar entrenamiento',
  continuarEntrenamiento: 'Continuar entrenamiento',
  verRutina: 'Ver rutina',
  verTecnica: 'Ver técnica',
  ejercicioDe: (n: number, total: number) => `Ejercicio ${numero(n, 0)} de ${numero(total, 0)}`,
  serieDe: (n: number, total: number) => `Serie ${numero(n, 0)} de ${numero(total, 0)}`,
  siguienteEjercicio: 'Siguiente ejercicio',
  pasarAEsteEjercicio: 'Pasar a este ejercicio',
  ejercicioActivo: 'Ejercicio activo',
  sinImagen: 'Sin imagen del ejercicio',
  // La tabla
  columnaSerie: 'Serie',
  columnaRepeticiones: 'Rep.',
  columnaRir: 'RIR',
  serieActual: 'Serie actual',
  guardada: 'Guardada',
  enGris: 'En gris: lo planificado',
  sinObjetivo: 'Sin objetivo',
  planDeLaSerie: (n: number) => `Plan de la serie ${numero(n, 0)}`,
  descansoRecomendado: 'Descanso recomendado',
  // Registrar
  registrarSerie: (n: number) => `Registrar serie ${numero(n, 0)}`,
  faltaUnDato: 'Anotá la carga o las repeticiones que hiciste.',
  serieGuardada: (n: number) => `Serie ${numero(n, 0)} guardada`,
  pendienteDeEnviar: 'Guardada en el teléfono; falta enviarla',
  enviada: 'Guardado en esta sesión',
  noSePudoEnviar: 'No se pudo enviar. Queda guardada en el teléfono.',
  reintentar: 'Reintentar',
  // El RIR: la ayuda y el ejemplo son los del encargo de Dirección, sin abreviar.
  rirTitulo: 'RIR (opcional)',
  rirAyuda: 'Cuántas repeticiones más creés que podrías haber hecho manteniendo la técnica',
  rirEjemplo: 'RIR 2: creés que te quedaban 2 repeticiones',
  // Tiempos
  explicacionDeTiempos: 'Guardamos los tiempos que marcás para que vos y tu entrenador puedan revisarlos',
  entendido: 'Entendido',
  sesion: 'Sesión',
  sesionEnPausa: 'Sesión en pausa',
  pausarSesion: 'Pausar sesión',
  reanudarSesion: 'Reanudar sesión',
  iniciarDescanso: 'Iniciar descanso',
  finalizarDescanso: 'Finalizar descanso',
  descansoDeLaSerie: (n: number) => `Descanso · Serie ${numero(n, 0)}`,
  recomendadoTrasLaSerie: (n: number, t: string) => `Recomendado tras la serie ${numero(n, 0)}: ${t}`,
  sinDescansoRecomendado: 'Sin descanso recomendado',
  recomendado: (t: string) => `Recomendado: ${t}`,
  alTerminarSeguisCon: (n: number) => `Al terminar, seguís con la serie ${numero(n, 0)}`,
  cronometrarSerie: 'Cronometrar serie',
  finalizarSerie: 'Finalizar serie',
  finalizarDescansoEIniciarSerie: (n: number) => `Finalizar descanso e iniciar la serie ${numero(n, 0)}`,
  serieEnCurso: (n: number) => `Serie ${numero(n, 0)} en curso`,
  duracionMedida: 'Duración medida',
  duracionDesconocida: 'Duración desconocida',
  // Cerrar
  finalizarEntrenamiento: 'Finalizar entrenamiento',
  resumenAntesDeFinalizar: 'Antes de finalizar',
  seriesRegistradas: (hechas: number, planificadas: number) => `${numero(hechas, 0)} de ${numero(planificadas, 0)} series registradas`,
  sinRegistrar: 'Sin registrar',
  medicionAbierta: 'Hay una medición abierta',
  terminoAhora: 'Terminó ahora',
  dejarIncompleta: 'Dejarla incompleta',
  sesionSinFinalizar: 'Tenés un entrenamiento sin finalizar',
  dejarSesionIncompleta: 'Dejarlo incompleto',
  laSesionQuedoAbierta: 'La app se cerró con mediciones abiertas. No las cerramos por vos: decidí qué pasó.',
  // Profesional
  planificadoFrenteARegistrado: 'Planificado frente a registrado',
  tiemposDeLaSesion: 'Tiempos de la sesión',
  transcurrido: 'Tiempo transcurrido',
  pausas: 'Pausas',
  sinPausas: 'Sin pausas',
  sinEjercicioAsignado: 'Sin ejercicio asignado',
  noSonMinutosDeEsfuerzo: 'Son tiempos marcados en la app: incluyen descansos y carga de datos. No son minutos de esfuerzo ni una evaluación.',
} as const;

export const ETIQUETA_DE_CALIDAD_DE_TIEMPO: Readonly<Record<CalidadDeTiempoApi, string>> = {
  MEASURED: 'medido',
  ESTIMATED: 'estimado',
  INCOMPLETE: 'incompleto',
  NO_DATA: 'no informado',
  INVALID: 'inconsistente',
};

/** Qué afirma cada calidad, para la ayuda de la vista del profesional. */
export const EXPLICACION_DE_CALIDAD: Readonly<Record<CalidadDeTiempoApi, string>> = {
  MEASURED: 'Inicio y fin marcados en la app, en el mismo uso, con su reloj interno.',
  ESTIMATED: 'Reconstruido con el reloj del teléfono, por ejemplo después de cerrar y abrir la app, o declarado al resolver una medición abierta.',
  INCOMPLETE: 'Tiene inicio pero no un fin confiable. No se completa con la hora de reapertura.',
  NO_DATA: 'No se marcó.',
  INVALID: 'Los instantes no son coherentes entre sí (el fin queda antes del inicio).',
};

export const ETIQUETA_DE_BASE_DE_CARGA: Readonly<Record<BaseDeCarga, string>> = {
  SINGLE_IMPLEMENT: 'una sola mancuerna o implemento',
  PER_IMPLEMENT: 'por mancuerna o implemento',
  TOTAL_EXTERNAL: 'carga externa total',
};

export const ETIQUETA_DE_BASE_DE_REPETICIONES: Readonly<Record<BaseDeRepeticiones, string>> = {
  PER_SET: 'por serie',
  PER_SIDE: 'por lado; no se duplican',
};

export const ETIQUETA_DE_REVISION_TECNICA: Readonly<Record<RevisionTecnica, string>> = {
  PENDING_PROFESSIONAL_REVIEW: 'Pendiente de revisión profesional',
  REVIEWED_BY_PROFESSIONAL: 'Revisada por el profesional',
};

/** El rol de la imagen, que se dice siempre que se muestra: ilustra, no certifica. */
export const ROL_DE_LA_IMAGEN = 'Ilustración para reconocer el ejercicio. No certifica la técnica ni reemplaza las indicaciones de tu profesional.';

/** «Uso: …» o «CC BY 4.0»: la licencia tal como se declaró. */
export function textoDeLicencia(l: LicenciaDeImagen): string {
  return l.kind === 'NO_EXTERNAL_LICENSE' ? `Sin licencia externa · ${l.usage}` : l.label;
}

/** «12–16 rep.» o «12 rep.»; `null` si la serie no fija repeticiones. */
export function textoDeRepeticiones(r: Repeticiones | null): string | null {
  if (!r) return null;
  return 'value' in r ? `${numero(r.value, 0)} rep.` : `${numero(r.min, 0)}–${numero(r.max, 0)} rep.`;
}

/** «16 kg» o «0 kg»: el cero se muestra, no se esconde. `null` si no hay carga. */
export const textoDeCarga = (c: Carga | null): string | null => (c ? cantidad(c.value, c.unit) : null);

/** «RIR 2,5»; `null` si no hay RIR. */
export const textoDeRir = (rir: number | null): string | null => (rir === null ? null : `RIR ${numero(rir)}`);

/** «16 kg · 12–16 rep. · RIR 3», o «Sin objetivo» si la serie no tiene ninguno. El descanso va aparte. */
export function textoDelPlanDeLaSerie(o: ObjetivoDeSerie): string {
  const partes = [textoDeCarga(o.suggestedLoad), textoDeRepeticiones(o.repetitions), textoDeRir(o.rir)].filter((p): p is string => p !== null);
  return partes.length > 0 ? partes.join(' · ') : COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo;
}

/** «01:30» para un recomendado en segundos; `null` si no hay. */
export const textoDeSegundos = (s: number | null): string | null => (s === null ? null : duracionParaMostrar(s * 1000));

/** «01:45 · medido», «Incompleto» o «No informado»: una duración con su calidad, sin mostrar un tiempo que no se afirma. */
export function textoDeDuracion(d: DuracionApi): string {
  if (d.ms === null) return d.quality === 'INCOMPLETE' ? 'Incompleto' : d.quality === 'INVALID' ? 'Inconsistente' : 'No informado';
  return `${duracionParaMostrar(d.ms)} · ${ETIQUETA_DE_CALIDAD_DE_TIEMPO[d.quality]}`;
}

/**
 * Un descanso en la vista del profesional: «01:45 registrado · 01:30 recomendado · +00:15». Si se estimó, dice
 * «estimado» en lugar de «registrado». Sin recomendado: «01:15 registrado · sin recomendado». Sin fin: «Incompleto ·
 * 01:30 recomendado». La diferencia no lleva juicio.
 */
export function textoDeDescanso(d: Pick<DescansoRegistrado, 'duration' | 'recommendedSeconds' | 'differenceMs'>): string {
  const recomendado = d.recommendedSeconds === null ? 'sin recomendado' : `${textoDeSegundos(d.recommendedSeconds)} recomendado`;
  if (d.duration.ms === null) return `${textoDeDuracion(d.duration)} · ${recomendado}`;
  const registrado = `${duracionParaMostrar(d.duration.ms)} ${d.duration.quality === 'MEASURED' ? 'registrado' : ETIQUETA_DE_CALIDAD_DE_TIEMPO[d.duration.quality]}`;
  const diferencia = diferenciaParaMostrar(d.differenceMs);
  return [registrado, recomendado, diferencia].filter((p): p is string => p !== null).join(' · ');
}

/** Cómo se lee la relación de un dato con su objetivo. Descriptiva: ni éxito ni falta. */
export const ETIQUETA_DE_RELACION: Readonly<Record<RelacionConElObjetivo, string | null>> = {
  DENTRO: 'dentro del rango',
  DEBAJO: 'por debajo',
  ENCIMA: 'por encima',
  IGUAL: 'igual',
  SIN_DATO: 'sin dato',
  SIN_OBJETIVO: null,
  UNIDADES_INCOMPATIBLES: 'otra unidad: no se compara',
  INVALIDO: 'no se compara',
};
