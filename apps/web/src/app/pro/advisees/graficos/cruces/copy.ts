/**
 * Los textos de los cruces y de «Dos etapas» (WP-GRAFICOS fase 2, DL-174; GR-24, SP-01 y SP-02). Ubican, nunca califican:
 * cada uno pasa por `terminosProhibidosEnUnGrafico` con las áreas de su gráfico (TEST-GRF-072). Con Nutrición, sin el
 * signo de porcentaje; con Entrenamiento, «1RM estimado (Epley v1)» y nunca una marca; con Antropometría, el error de
 * medición dicho en cada cambio. La frase de la coincidencia es la del dominio, exacta.
 */
import { FRASE_DE_LA_COINCIDENCIA } from '@be/domain';

export const COPY_DE_LOS_CRUCES = {
  frase: FRASE_DE_LA_COINCIDENCIA,
  ventana: 'Ventana de lectura, fijada antes de mirar los datos',
  comoLeerlo: 'Cómo leerlo',
  tambienCambio: 'Lo que también cambió',
  noRegistra: 'Lo que BE no registra y también pudo cambiar',
  sinCambiosQueSeSepan: 'BE no tiene registrado otro cambio en ese tramo.',
  mediana: 'mediana',
  fueraDeLaMediana: 'Fuera de la mediana',
  leyendaEntra: 'Entra en la mediana: llena',
  leyendaAfuera: 'Se ve y no entra en la mediana: hueca, o en rombo si la observó el profesional',
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
    etapaDe: (letra: string, rotulo: string, fechas: string) => `Etapa ${letra} · ${rotulo} · ${fechas}`,
    detalleDeLaSerie: (nombre: string, area: string) => `${nombre}, entre las dos últimas versiones del plan de ${area}.`,
  },
  carbohidratosYFuerza: {
    titulo: 'Carbohidratos registrados y 1RM estimado (Epley v1), en el mismo tiempo',
    pregunta: 'En la temporada en que cambiaron los carbohidratos, ¿también se movió el 1RM estimado?',
    ventana:
      'Dos etapas seguidas del objetivo nutricional, separadas por un cambio de versión, de 3 semanas o más cada una (la parte que cae en el período). Una sola ventana, sin mirar además el efecto del día anterior.',
    comoLeerlo: [
      'En estudios de grupos, los carbohidratos solos casi no cambian la fuerza cuando la energía alcanza (Henselmans 2022): por eso las calorías registradas van al lado.',
      'Cada unidad de RIR mueve la estimación en la carga dividida por 30, y el RIR que se escribe se yerra en cerca de una repetición: una diferencia de 4 kg puede ser solo el RIR.',
      'Un día con algún dato faltante o con una comida del plan sin registro no entra en la mediana: se cuenta y se dice. Un día sin registros es un hueco, no un cero.',
      'Es la historia de una sola persona en el tiempo, no un experimento.',
    ],
    sinEjercicio: 'Elegí un ejercicio de la lista de la v1 para ver su 1RM estimado al lado de los carbohidratos.',
    faltaVentana: {
      SIN_CAMBIO_DE_OBJETIVO: 'En el período no cambió el objetivo nutricional: la lectura se arma con dos etapas del objetivo, de 3 semanas o más cada una.',
      ETAPAS_CORTAS: 'Ninguna pareja de etapas seguidas del objetivo llega a 3 semanas por lado en el período: la lectura se arma con dos de 3 semanas o más.',
    },
    sinLoIndicado: 'No se pudo leer lo indicado en cada versión del plan de entrenamiento: no se sabe si cambió el RIR indicado.',
    sinDiferenciaTodavia: 'Todavía no alcanza para decir cuánto se mueve la estimación entre sesiones de una misma versión: hacen falta 4 sesiones o más.',
    diferenciaEntreSesiones: (texto: string) => `Entre sesiones de la misma versión aparecen diferencias de hasta ${texto}.`,
    carriles: { carbohidratos: 'Carbohidratos registrados', energia: 'Calorías registradas', fuerza: '1RM estimado (Epley v1)' },
  },
  energiaYPeso: {
    titulo: 'Calorías registradas y peso, de toma a toma',
    pregunta: 'El objetivo energético de esta temporada, ¿se ve reflejado en el peso, de una toma a la siguiente?',
    ventana: 'De una toma de peso a la última, con el mismo protocolo y 14 días o más entre las dos. Una sola ventana.',
    comoLeerlo: [
      'En estudios de grupos, el peso del día varía por el agua, el glucógeno y el sodio, y el equilibrio nuevo tarda mucho más que unas semanas (Hall 2011).',
      'La media semanal dice con cuántos días se hizo: un día con algún dato faltante o con una comida del plan sin registro no entra.',
      'Las tomas van como puntos sueltos: nada une dos tomas ni suaviza el peso.',
    ],
    sinVentana: 'Hacen falta dos tomas de peso con el mismo protocolo y 14 días o más entre las dos.',
    errorDeMedicion: (diferencia: string) => `BE no tiene cargado el error de medición de quien mide ni las condiciones de cada toma: no se puede decir si ${diferencia} lo supera.`,
    loRegistrado: 'Lo registrado puede no ser todo lo comido.',
    carriles: { energia: 'Calorías registradas', mediaSemanal: 'Media semanal de las calorías registradas', peso: 'Peso de cada toma' },
  },
} as const;
