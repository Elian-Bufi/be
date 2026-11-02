/**
 * Los textos de la sesión guiada de la APK (PA-01 y PA-02, decisiones de Dirección del 2026-11-02): la franja de arriba,
 * la casilla de cada serie, el reloj de la fila, la ayuda plegada de la tabla, lo escrito sin registrar y «Antes de
 * finalizar». Es un módulo puro: las pruebas comprueban cada frase, y la guardia T13 la recorre.
 *
 * Nada califica a la persona. La casilla dice un estado («registrada»), nunca un juicio: no hay «bien», «excelente» ni
 * puntajes, y la ausencia de una serie es «sin registrar», no «no realizada» (DL-106).
 */
import { numero } from '@be/domain';

/** «1», «1 y 2», «1, 2 y 3». */
export function enumerar(numeros: readonly number[]): string {
  const textos = numeros.map((n) => numero(n, 0));
  if (textos.length <= 1) return textos.join('');
  return `${textos.slice(0, -1).join(', ')} y ${textos[textos.length - 1]}`;
}

/** «la serie 2» o «las series 1 y 2». */
const lasSeries = (numeros: readonly number[]): string => (numeros.length === 1 ? `la serie ${enumerar(numeros)}` : `las series ${enumerar(numeros)}`);

export const TEXTOS_DE_LA_SESION = {
  // La franja de arriba
  ejercicioYSerie: (ejercicio: number, total: number, serie: string) => `Ejercicio ${numero(ejercicio, 0)} de ${numero(total, 0)} · ${serie}`,
  serieDe: (n: number, planificadas: number) => `Serie ${numero(n, 0)} de ${numero(planificadas, 0)}`,
  serieDeMas: (n: number) => `Serie ${numero(n, 0)} · sin planificar`,
  esteEjercicio: 'Este ejercicio',
  /** Lo que dice el lector de pantalla de la línea de tramos: cuántas series hay registradas, sin porcentajes. */
  tramos: (registradas: number, planificadas: number) => `${numero(registradas, 0)} de ${numero(planificadas, 0)} series planificadas registradas en la sesión`,
  // La tabla
  columnaTiempo: 'Tiempo',
  serieRegistrada: (n: number) => `Serie ${numero(n, 0)} registrada`,
  /** El nombre de la casilla de la fila: lo que hace. El lector agrega si está marcada. */
  registrarLaSerie: (n: number) => `Registrar la serie ${numero(n, 0)}`,
  /** El rótulo chico de una serie tildada sin escribir nada (DL-161, `AS_PLANNED`). Las escritas no llevan rótulo. */
  comoElPlan: 'como el plan',
  pistaParaTildar: 'Tildala al terminarla. Sin nada escrito, queda lo planificado que ves en gris.',
  pistaParaDestildar: 'Destildala para deshacer el registro mientras no finalices.',
  enConflictoSinTilde: 'Resolvé el conflicto de esta serie más abajo.',
  escritaSinRegistrar: 'Escrita, sin registrar',
  medirLaSerie: (n: number) => `Medir el tiempo de la serie ${numero(n, 0)}`,
  pararElReloj: (n: number) => `Parar el reloj de la serie ${numero(n, 0)}`,
  relojEnCurso: (n: number, minutos: string) => `Reloj de la serie ${numero(n, 0)} en curso: ${minutos}`,
  escribirElTiempo: 'Escribir el tiempo',
  mantenerParaEscribir: 'Mantenelo apretado para escribir el tiempo sin medirlo.',
  tiempoDeLaSerie: (n: number) => `Tiempo de la serie ${numero(n, 0)}, opcional`,
  serieMedida: (n: number) => `Serie ${numero(n, 0)} medida`,
  serieRegistradaAnuncio: (n: number) => `Serie ${numero(n, 0)} registrada`,
  serieDestildada: (n: number) => `Serie ${numero(n, 0)} sin registrar`,
  cambiarUnidad: (a: 'kg' | 'lb') => `Cambiar a ${a}`,
  agregarUnaSerie: 'Agregar una serie',
  // La ayuda plegada, junto a la tabla
  ayudaTitulo: 'Cómo se registra',
  ayudaTildar:
    'Tildá la casilla de cada serie cuando la termines. Si no escribiste nada, se registra lo planificado que ves en gris. Si escribiste algo, se registra lo que escribiste y, en lo que quedó vacío, lo planificado. Tu profesional ve si la serie se escribió o se tildó con lo planificado.',
  ayudaRango: 'Si las repeticiones del plan van en un rango (por ejemplo, 10–12), anotá las que hiciste: tildar sin escribirlas no elige un número por vos.',
  ayudaDestildar: 'Para corregir una serie, destildala: vuelve a quedar sin registrar, con lo que habías escrito, mientras no finalices.',
  ayudaTiempo:
    'El tiempo es opcional. Tocá el reloj de la fila para medir la serie y otra vez para pararlo; tildar la serie también lo para. Para escribirlo sin medir, mantené apretado el reloj; lo medido también se puede corregir. Va en minutos y segundos (1:30) o solo en segundos (45).',
  ayudaGuardado: 'Lo que escribís queda guardado en el teléfono: podés ir a otra pantalla y volver sin perderlo.',
  // El tiempo escrito
  tiempoIlegible: 'Escribí el tiempo en minutos y segundos (1:30) o solo en segundos (45).',
  tiempoMaximo: 'Revisá el tiempo: el máximo es de 10 horas.',
  // Tildar sin datos
  repeticionesEnRango: (rango: string) => `Las repeticiones del plan van en un rango (${rango}): anotá las que hiciste, o la carga.`,
  // Antes de finalizar
  escritasTitulo: 'Series escritas sin registrar',
  escritasDe: (nombre: string, series: readonly number[]) => `${nombre}: ${lasSeries(series)}.`,
  escritasPregunta: '¿Las registramos antes de finalizar? En lo que quedó vacío va lo planificado.',
  registrarlas: 'Registrarlas',
  descartarLoEscrito: 'Descartar lo escrito',
  descartarDetalle: 'Se borra lo que escribiste en las series sin registrar. Lo ya registrado no cambia.',
  descartar: 'Descartar',
  noSePudoRegistrar: (nombre: string, serie: number, motivo: string) => `${nombre}, serie ${numero(serie, 0)}: ${motivo}`,
  registradasDeUna: (n: number) => (n === 1 ? 'Registramos 1 serie.' : `Registramos ${numero(n, 0)} series.`),
  sinTildarNoCuentan: 'Las series sin tildar quedan sin registrar: no cuentan como hechas.',
  quedanEscritas: 'Te quedaron series escritas sin registrar: registralas o descartá lo escrito antes de finalizar.',
  escritasEnElResumen: (n: number) => (n === 1 ? '1 escrita sin registrar' : `${numero(n, 0)} escritas sin registrar`),
  // La barra inferior
  conSesionEnCurso: 'con una sesión en curso',
} as const;
