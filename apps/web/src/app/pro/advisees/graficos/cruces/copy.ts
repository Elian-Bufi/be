/**
 * Los textos de los cruces y de «Dos etapas» (WP-GRAFICOS fase 2, DL-174; GR-24, SP-01 y SP-02). Ubican, nunca califican:
 * cada uno pasa por `terminosProhibidosEnUnGrafico` con las áreas de su gráfico (TEST-GRF-072). Con Nutrición, sin el
 * signo de porcentaje; con Entrenamiento, «1RM estimado (Epley)» y nunca una marca; con Antropometría, el error de
 * medición dicho en cada cambio. La frase de la coincidencia es la del dominio, exacta.
 */
import { FRASE_DE_LA_COINCIDENCIA } from '@be/domain';

export const COPY_DE_LOS_CRUCES = {
  frase: FRASE_DE_LA_COINCIDENCIA,
  ventana: 'Ventana de lectura, fijada antes de mirar los datos',
  comoLeerlo: 'Cómo leerlo',
  tambienCambio: 'Lo que también cambió',
  noRegistra: 'Lo que BE no registra y también pudo cambiar',
  // Dice solo lo que se leyó: las versiones de los planes de las áreas de esta lectura. Que no haya otra no quiere decir
  // que nada más cambió (para eso va la lista de lo que BE no registra).
  sinCambiosQueSeSepan: 'En los planes que se leyeron no se activó otra versión en ese tramo.',
  sinLasVersiones: 'No se pudieron leer las versiones de tus otros planes: no se sabe si cambió alguna en ese tramo.',
  sinLoIndicadoDeLasEtapas: 'No se pudo leer lo indicado en cada versión del plan: no se sabe si cambió lo que pedía para el ejercicio.',
  mediana: 'mediana',
  fueraDeLaMediana: 'Fuera de la mediana',
  // La leyenda de «Lado a lado», en fichas: lo corto se ve; lo largo, el lector de pantalla. Solo las marcas que se ven.
  leyenda: {
    enLaMediana: { corto: 'En la mediana', largo: 'Punto lleno: entra en la mediana de la etapa' },
    afuera: { corto: 'Fuera de la mediana', largo: 'Punto hueco: se ve y no entra en la mediana (un día con algo que falta, hoy o una estimación orientativa)' },
    cargaRapida: { corto: 'Carga rápida', largo: 'Punto hueco y gris: los números del plan, precargados; no entra en la mediana' },
    observada: { corto: 'Observada', largo: 'Rombo: una serie observada por el profesional; no entra en la mediana' },
    mediana: { corto: 'Mediana', largo: 'Raya discontinua: la mediana de la etapa' },
  },
  dosEtapas: {
    titulo: 'Dos etapas del plan, lado a lado',
    pregunta: '¿Qué pasó con esta medida en la versión vigente del plan, comparada con la anterior?',
    comoLeerlo: [
      'Cada punto es una observación de la etapa, en su fecha dentro de la etapa; la raya es la mediana. La cantidad de cada lado va escrita.',
      'Con menos de 5 de un lado no se dibuja: con pocos puntos, una etapa parece estable o parece un salto.',
      'Las etapas no se ordenan por mejor o peor: A es la anterior y B la siguiente.',
      'Es observacional: el aprendizaje técnico, otro cambio del plan o el peso pueden explicar la diferencia.',
    ],
    sinEtapas: 'Para comparar dos etapas hacen falta dos versiones activadas del plan en el período.',
    sinPlan: 'No hay un plan tuyo en esta área: las etapas son las versiones de tus planes.',
    sinSerie: 'No hay observaciones de esta medida en las dos etapas.',
    elegiUnEjercicio: 'Elegí un ejercicio para comparar dos etapas del plan de Entrenamiento.',
    etapaDe: (letra: string, rotulo: string, fechas: string) => `Etapa ${letra} · ${rotulo} · ${fechas}`,
    detalleDeLaSerie: (nombre: string, area: string) => `${nombre}, entre las dos últimas versiones del plan de ${area}.`,
  },
  // GR-24 por semana, con la media de GR-12 (GR-VC13): cómo se arma cada barra, en «Cómo se arma cada barra».
  porSemana: {
    comoSeArma: [
      'Cada barra es la media de la semana (v1), de lunes a domingo, la misma que las calorías y los macronutrientes por día: el promedio de los días con cantidades en todos sus registros, si son 4 o más.',
      'Un subtotal (un día al que le falta alguna cantidad) o un día con una comida del plan sin registro no entra en la media, y se cuenta: la línea de debajo de cada gráfico dice con cuántos días se hizo y por qué quedaron afuera los otros. Pasá el mouse, tocá una barra o usá las flechas para leer otra semana.',
      'Una semana con días pero sin media va con una raya cortada sobre el eje, y sus días se ven igual; una sin ningún día con valor, en gris: ninguna es un cero. Hoy no cuenta hasta que termine el día.',
      'Una semana que cruza el cambio de etapa se parte en dos tramos, uno de cada lado: ninguna media mezcla días de A con días de B.',
      'La tabla de arriba resume cada etapa entera con el criterio que dice debajo de cada métrica: no es la media de estas semanas.',
    ],
  },
  carbohidratosYFuerza: {
    titulo: 'Carbohidratos registrados y 1RM estimado (Epley), en el mismo tiempo',
    pregunta: 'En la temporada en que cambiaron los carbohidratos, ¿también se movió el 1RM estimado?',
    ventana:
      'Dos etapas seguidas del objetivo nutricional, separadas por un cambio de versión, de 3 semanas o más cada una (la parte que cae en el período). Una sola ventana, sin mirar además el efecto del día anterior.',
    comoLeerlo: [
      'En estudios de grupos, los carbohidratos solos casi no cambian la fuerza cuando la energía alcanza (Henselmans 2022): por eso las calorías registradas van al lado.',
      'Cada unidad de RIR mueve la estimación en la carga dividida por 30, y el RIR que se escribe se yerra en cerca de una repetición: una diferencia de 4 kg puede ser solo el RIR.',
      'Un día con algún dato faltante o con una comida del plan sin registro no entra en la mediana: se cuenta y se dice. Un día sin registros es un hueco, no un cero.',
      'Es la historia de una sola persona en el tiempo, no un experimento.',
    ],
    sinEjercicio: 'Elegí un ejercicio de la lista de la estimación para ver su 1RM estimado al lado de los carbohidratos.',
    faltaVentana: {
      SIN_CAMBIO_DE_OBJETIVO: 'En el período no cambió el objetivo nutricional: la lectura se arma con dos etapas del objetivo, de 3 semanas o más cada una.',
      ETAPAS_CORTAS: 'Ninguna pareja de etapas seguidas del objetivo llega a 3 semanas por lado en el período: la lectura se arma con dos de 3 semanas o más.',
    },
    sinLoIndicado: 'No se pudo leer lo indicado en cada versión del plan de entrenamiento: no se sabe si cambió el RIR indicado.',
    sinDiferenciaTodavia: 'Todavía no alcanza para decir cuánto se mueve la estimación entre sesiones de una misma versión: hacen falta 4 sesiones o más.',
    diferenciaEntreSesiones: (texto: string) => `Entre sesiones de la misma versión aparecen diferencias de hasta ${texto}.`,
    carriles: { carbohidratos: 'Carbohidratos registrados', energia: 'Calorías registradas', fuerza: '1RM estimado (Epley)' },
  },
  energiaYPeso: {
    titulo: 'Calorías registradas y peso, de toma a toma',
    pregunta: 'El objetivo energético de esta temporada, ¿se ve reflejado en el peso, de una toma a la siguiente?',
    ventana: 'De una toma de peso a la última, con el mismo protocolo y 14 días o más entre las dos. Una sola ventana.',
    comoLeerlo: [
      'En estudios de grupos, el peso del día varía por el agua, el glucógeno y el sodio, y el equilibrio nuevo tarda mucho más que unas semanas (Hall 2011).',
      'La media semanal es la de las calorías por día (v1): el promedio de los días con cantidades en todos sus registros, si son 4 o más. Un día con algún dato faltante o con una comida del plan sin registro no entra, y se cuenta.',
      'Las tomas van como puntos sueltos: nada une dos tomas ni suaviza el peso.',
    ],
    sinVentana: 'Hacen falta dos tomas de peso con el mismo protocolo y 14 días o más entre las dos.',
    errorDeMedicion: (diferencia: string) => `BE no tiene cargado el error de medición de quien mide ni las condiciones de cada toma: no se puede decir si ${diferencia} lo supera.`,
    loRegistrado: 'Lo registrado puede no ser todo lo comido.',
    carriles: { energia: 'Calorías registradas', mediaSemanal: 'Media semanal de las calorías registradas', peso: 'Peso de cada toma' },
    // La leyenda del carril semanal: lo corto se ve; lo largo, el lector de pantalla.
    fichas: {
      entera: { corto: 'Semana entera', largo: 'Barra llena: los siete días de la semana entran en la media' },
      hueca: { corto: 'Con días afuera', largo: 'Barra hueca, con su contorno: algún día de la semana quedó afuera de la media' },
      sinMedia: { corto: 'Sin media', largo: 'Raya cortada sobre el eje: la semana tiene días con valor, pero no llega a 4 días con cantidades en todos sus registros; no es un cero' },
      sinDias: { corto: 'Sin días con valor', largo: 'Columna gris: ningún día de la semana tiene valor; no es un cero' },
    },
  },
} as const;
