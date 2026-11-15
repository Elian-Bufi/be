/**
 * Los textos de las piezas comunes de los gráficos (WP-GRAFICOS fase 2, DL-174). Cada rama tiene los suyos en su
 * carpeta; estos los usan todas. Ubican, nunca califican: pasan por `terminosProhibidosEnUnGrafico` con las tres áreas
 * (TEST-GRF-018).
 */
import { FRASE_DE_LA_COINCIDENCIA } from '@be/domain';

export const COPY_DE_LOS_GRAFICOS = {
  frase: FRASE_DE_LA_COINCIDENCIA,
  verLaTabla: 'Ver la tabla',
  ocultarLaTabla: 'Ocultar la tabla',
  fecha: 'Fecha',
  sinDato: 'sin dato',
  cargando: 'Cargando el gráfico…',
  reintentar: 'Reintentar',
  queSeReintenta: 'este gráfico',
  inicioDelVinculo: 'La historia empieza el día que empezaste a acompañarla.',
  leidoEnTramos: 'Se leyó en tramos de 92 días.',
  lecturaSinFecha: 'Elegí una fecha con las flechas, Inicio o Fin, o tocando el gráfico.',
  comoSeUsa: 'Flechas: la fecha anterior o la siguiente con datos. Mayúscula y flechas: un tramo. Escape: soltar.',
  leyenda: 'Cómo se leen las marcas',
  fueraDeLaEscala: (n: number) => (n === 1 ? '1 valor no entra en la escala: lleva una muesca.' : `${n} valores no entran en la escala: llevan una muesca.`),
  faltaHistoria: (hacen: number, unidad: string, hay: readonly number[]) =>
    hay.length > 1 ? `Se arma con ${hacen} ${unidad} por lado; hay ${hay.slice(0, -1).join(', ')} y ${hay[hay.length - 1]}.` : `Se arma con ${hacen} ${unidad}; hay ${hay[0] ?? 0}.`,
  tramoElegido: (desde: string, hasta: string) => `Del ${desde} al ${hasta}`,
  /** La lectura de entrada, sin una fecha elegida: el último valor de cada carril (pasada visual del 15/11). */
  loUltimo: 'Lo último',
  /** El cambio de lo indicado en texto (el SVG no se lee): en el nombre del gráfico y, si no entra en su línea, a la vista. */
  cambiosDeLoIndicado: (lista: readonly string[]) => `Lo indicado cambió: ${lista.join('; ')}.`,
  /** La línea tenue del período, debajo del título. */
  periodo: (desde: string, hasta: string | null) => (hasta === null ? `del ${desde} a hoy` : `del ${desde} al ${hasta}`),
} as const;

/**
 * La leyenda como fichas cortas, en una línea arriba del gráfico (pasada visual del 15/11; DISENO-VISUAL §1, principio
 * 7): la forma la dice el glifo, así que el texto se queda en lo esencial. El lector de pantalla oye el sentido entero.
 */
export const SENTIDO_CORTO = {
  REGISTRADO: 'Registrado',
  INDICADO: 'Indicado',
  SUBTOTAL: 'Subtotal',
  CARGA_RAPIDA: 'Carga rápida',
  ORIENTATIVA: 'De más de 10 a 12 rep. equivalentes',
  OBSERVADA_POR_EL_PROFESIONAL: 'Observado',
  REPORTADO: 'Reportado',
  CALCULADO: 'Calculado',
} as const;

/** Lo que dice cada glifo de la leyenda: la forma dice el estado además del color. */
export const SENTIDO_EN_LA_LEYENDA = {
  REGISTRADO: 'Registrado: lleno',
  INDICADO: 'Indicado por el plan: hueco',
  SUBTOTAL: 'Día con algo que falta: hueco',
  CARGA_RAPIDA: 'Tildado sin escribir (los números del plan): hueco y gris',
  ORIENTATIVA: 'De más de 10 a 12 repeticiones equivalentes: hueco',
  OBSERVADA_POR_EL_PROFESIONAL: 'Observado por el profesional: rombo',
  REPORTADO: 'Reportado por la persona: contorno cortado',
  CALCULADO: 'Calculado con un método: punto adentro',
} as const;
