// WP-ENTORNO-DEL-TUTOR (DL-184) · lo escrito de la muestra: las notas propias de la profesional, las notas de la sesión que
// escribe cada persona y el texto de cada revisión. Notas de trabajo, cortas y en tono neutro (REQ-TUT-11): qué se ve, en
// qué se funda y qué se hace; nunca un juicio sobre el cuerpo o la conducta, ni una causa (REQ-TUT-40), ni el signo de
// porcentaje en Nutrición (REQ-TUT-35). R-TXT-01 los recorre todos con la guardia de vocabulario de BE.
import { azar } from '../../EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/herramientas.mjs';
import { EJ } from './personas.mjs';

/**
 * Por persona: `propias` (semana de su historia, texto, ancla opcional y si está archivada) y `deSesion` (las que la
 * persona le deja en una sesión; `ayer`: la de ayer, sin leer, que va a «Lo nuevo»).
 */
export const NOTAS = {
  tomas: {
    propias: [
      { semana: 0, texto: 'Primera consulta: nunca entrenó con cargas. Arrancamos con técnica y tres días.' },
      { semana: 4, texto: 'En la sentadilla, la profundidad mejoró con la caja de referencia.', ancla: 'EJERCICIO', ejercicio: EJ.sentadilla },
      { semana: 12, texto: 'Pidió cambiar el día del entrenamiento de pierna por el turno nuevo del trabajo.' },
      { semana: 26, texto: 'Prefiere el almuerzo de oficina con arroz: dejar dos opciones con arroz.', ancla: 'COMIDA', comida: 'Almuerzo' },
      { semana: 36, texto: 'Consultó por suplementos: le expliqué que con la proteína del plan alcanza; lo retomamos si cambia algo.', archivada: true },
      { semana: 54, texto: 'Fase de fuerza: probar 4 series de 4 a 6 en banca y sentadilla, y revisar al terminar.' },
    ],
    deSesion: [
      { semana: 9, texto: 'Hoy la sentadilla salió más cómoda con la caja.' },
      { semana: 31, texto: 'Volví del viaje; arranqué con las mismas cargas.' },
      { semana: 47, texto: 'El peso muerto se sintió pesado en la última serie.' },
      { semana: 58, texto: 'Me quedé sin tiempo para los laterales.' },
    ],
  },
  valeria: {
    propias: [
      { semana: 0, texto: 'Viene de otro entrenador y autorizó ver su historia anterior. Toma levotiroxina, estable.' },
      { semana: 10, texto: 'Prefiere entrenar antes de la cena los días de escuela.' },
      { semana: 26, texto: 'Cambió el horario de la escuela: la merienda pasa a ser antes de entrenar.', ancla: 'COMIDA', comida: 'Merienda' },
      { semana: 45, texto: 'Press de banca: a igual carga, el RIR que anota bajó de 2 a 1 en las últimas semanas.', ancla: 'EJERCICIO', ejercicio: EJ.banca },
      { semana: 50, texto: 'Descarga de una semana y después otro rango de repeticiones. Revisar la energía de los días de entrenamiento.' },
      { semana: 58, texto: 'Pidió recetas de almuerzo para llevar a la escuela.', archivada: true },
    ],
    deSesion: [
      { semana: 6, texto: 'Llegué tarde y acorté los accesorios.' },
      { semana: 44, texto: 'El press se sintió pesado otra vez.' },
      { semana: 49, texto: 'Mucho cansancio esta semana.' },
      { semana: 60, texto: 'El press salió mejor con el rango nuevo.' },
      { ayer: true, texto: 'La última serie de press me molestó el hombro izquierdo.' },
    ],
  },
  gustavo: {
    propias: [
      { semana: 0, texto: 'Molestia lumbar vieja, sin tratamiento actual: empezar con peso muerto rumano y cargas bajas.', ancla: 'EJERCICIO', ejercicio: EJ.rumano },
      { semana: 8, texto: 'El asado de los domingos queda como comida diferente: no lo cambiamos.', ancla: 'COMIDA', comida: 'Almuerzo' },
      { semana: 28, texto: 'Volvió después de la mudanza. Plan nutricional con medidas caseras para registrar más fácil.' },
      { semana: 40, texto: 'Pidió pasar el entrenamiento a la mañana temprano.', archivada: true },
    ],
    deSesion: [
      { semana: 5, texto: 'Sin molestias en la espalda.' },
      { semana: 28, texto: 'Primera sesión después de la mudanza.' },
      { semana: 44, texto: 'Hoy me sentí más firme en la sentadilla.' },
    ],
  },
  carolina: {
    propias: [
      { semana: 0, texto: 'Ovolactovegetariana: ningún alimento con carne ni pescado en el plan.' },
      { semana: 6, texto: 'Los fines de semana registra algo más: lo dejamos así, el promedio de la semana alcanza.' },
      { semana: 16, texto: 'Pausa planificada de seis semanas en mantenimiento.' },
      { semana: 22, texto: 'Segundo déficit, más corto. Mantener la proteína en 125 g por día.' },
      { semana: 30, texto: 'Pidió más opciones de almuerzo con legumbres.', ancla: 'COMIDA', comida: 'Almuerzo', archivada: true },
      { semana: 40, texto: 'Hip thrust: subir de a 5 kg cuando complete las tres series con RIR 2.', ancla: 'EJERCICIO', ejercicio: EJ.hipThrust },
    ],
    deSesion: [
      { semana: 3, texto: 'Primera semana completa.' },
      { semana: 20, texto: 'Hoy tenía más energía.' },
      { semana: 36, texto: 'Me costó el último día de la semana.' },
      { semana: 48, texto: 'Las sentadillas salieron más fluidas.' },
    ],
  },
  silvia: {
    propias: [
      { semana: 0, texto: 'Indicación médica de fuerza por osteopenia. Su nutricionista es la Lic. Natalia Y.: coordinar por notas.' },
      { semana: 1, texto: 'Buena técnica en la prensa; mantener RIR 3 las primeras semanas.', ancla: 'EJERCICIO', ejercicio: EJ.prensa },
      { semana: 4, texto: 'Pedirle a su nutricionista el plan vigente para el próximo plan.' },
    ],
    deSesion: [{ semana: 1, texto: 'Me gustó la máquina de prensa.' }, { semana: 4, texto: 'Volví después de la gripe.' }],
  },
};

/** Las notas de coordinación con la colega de Nutrición de Silvia (REQ-TUT-12): dos o tres en cada sentido. */
export const COORDINACION = [
  { de: 'julieta', hace: 30, texto: 'Hola, Natalia: Silvia empieza fuerza tres días por semana, con máquinas y mancuernas. Te aviso por si querés ajustar algo de las colaciones.' },
  { de: 'natalia', hace: 28, texto: 'Gracias, Julieta. Le dejo una colación con lácteo los días de entrenamiento.' },
  { de: 'julieta', hace: 12, texto: 'Esta semana no vino por gripe. Retoma el lunes con las mismas cargas.' },
  { de: 'natalia', hace: 10, texto: 'Anotado. Te comparto el plan vigente desde el resumen de Silvia.' },
  { de: 'julieta', hace: 3, texto: 'Estoy preparando el plan 2: sumamos un tercer día. Cuando lo active te aviso.' },
];

const POR_RESULTADO = {
  ENTRENAMIENTO: {
    MANTENER: [
      ['Registró la mayoría de las sesiones del período. Las cargas de los básicos siguen subiendo de a poco y el RIR anotado está cerca del indicado.', 'Las series registradas del período y las de la versión anterior.', 'Seguir con el plan.'],
      ['Sesiones registradas con regularidad; en los accesorios completa las series con el RIR indicado.', 'Las series registradas del período.', 'Seguir con el plan y revisar en cuatro semanas.'],
    ],
    AJUSTAR: [['Completó la fase con las series y el RIR indicados.', 'Las series registradas de la fase y el historial de cada ejercicio.', 'Pasar a la fase siguiente: «{nombre}».']],
  },
  NUTRICION: {
    MANTENER: [
      ['Registra la mayoría de los días; los fines de semana hay algo más registrado que lo indicado.', 'Lo registrado del período, día por día, y la toma más reciente.', 'Seguir con el plan.'],
      ['Las comidas registradas siguen la estructura del plan; algunos días quedan sin registro.', 'Lo registrado del período y la toma más reciente.', 'Seguir con el plan y revisar en cinco semanas.'],
    ],
    AJUSTAR: [['El período cierra con lo que se propuso para esta etapa.', 'Lo registrado del período y las tomas.', 'Nueva versión del plan: «{nombre}».']],
    CAMBIAR_OBJETIVO: [['Cambia la etapa: {razon}', 'Lo registrado del período y las tomas.', 'Nuevo objetivo de {kcal} kcal por día y la versión del plan «{nombre}».']],
  },
};

/** El texto de una revisión: interpretación, fundamento y acción, en lenguaje de profesional. */
export function textoDeRevision(p, x, versiones) {
  const r = azar(`BE-TUTOR-v1|${p.clave}|texto-revision|${x.clave}`);
  let resultado = 'MANTENER';
  let v = null;
  if (x.version !== null) {
    v = versiones[x.version];
    resultado = x.area === 'NUTRICION' && v.kcal !== versiones[x.version - 1].kcal ? 'CAMBIAR_OBJETIVO' : 'AJUSTAR';
  }
  const [interpretacion, fundamento, accion] = r.uno(POR_RESULTADO[x.area][resultado]);
  const llenar = (t) => t.replace('{nombre}', v?.nombre ?? '').replace('{razon}', v?.razon ?? '').replace('{kcal}', String(v?.kcal ?? ''));
  return { resultado, interpretacion: llenar(interpretacion), fundamento: llenar(fundamento), accion: llenar(accion) };
}
