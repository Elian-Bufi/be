/**
 * Los textos de los gráficos de Antropometría (WP-GRAFICOS fase 2, rama C; DL-174): GR-18 y GR-20. Ubican, nunca
 * califican: una diferencia es una resta con su signo y su unidad, cada número va con su método, y nada une dos tomas.
 * Los recorre la guardia unida de los gráficos (`terminosProhibidosEnUnGrafico`, TEST-GRF-055).
 */
import { COPY_DESDE_EL_INICIO } from '@be/domain';

export const COPY_ANTROPOMETRIA_EN_GRAFICOS = {
  /** GR-D4: la misma línea que GR-16, hasta que exista el error de medición de quien mide (GR-17). */
  sinErrorDeMedicion: COPY_DESDE_EL_INICIO.sinErrorDeMedicion,
  soloPuntos: 'Antropometría va en puntos sueltos: nada une dos tomas.',
  parcial: 'Hay tomas de otro profesional que no se muestran: no entran en el gráfico.',
  leidoEnTramos: 'Las tomas se leyeron en tramos de 92 días.',

  // ─── GR-18 · el perfil por sitio entre dos tomas ─────────────────────────────────────────────
  perfil: {
    titulo: 'Perfil por sitio entre dos tomas',
    pregunta: '¿En qué sitios cambió y en cuáles no?',
    antes: 'Toma anterior',
    despues: 'Toma más nueva',
    comparar: 'Comparar',
    con: 'con',
    toma: (fecha: string, etiqueta: string) => `${etiqueta} · ${fecha}`,
    sitio: 'Sitio',
    diferencia: 'Diferencia',
    familia: { PLIEGUES: 'Pliegues', PERIMETROS: 'Perímetros', DIAMETROS: 'Diámetros' } as Readonly<Record<string, string>>,
    soloAntes: (fecha: string) => `sin dato en la toma del ${fecha}`,
    soloDespues: (fecha: string) => `sin dato en la toma del ${fecha}`,
    otroGrupo: 'no se comparan: otro protocolo, método o unidad',
    unaSolaToma: 'Hace falta otra toma con sitios medidos para comparar: hay una.',
    mismaToma: 'Elegí dos tomas distintas para compararlas.',
    sinTomas: 'Sin tomas con pliegues, perímetros o diámetros en estas fechas.',
    segmento: 'La línea une los dos valores del mismo sitio: es la diferencia entre dos tomas, no lo que pasó entre una y otra.',
    sinReduccionLocalizada:
      'El cambio en un sitio no dice que lo haya causado el entrenamiento de esa zona: la grasa no se reduce en forma localizada (Vispute et al., 2011).',
    leyendaAntes: 'Toma anterior: cuadrado',
    leyendaDespues: 'Toma más nueva: círculo',
    leyendaReportado: 'Reportado por la persona, no medido: contorno cortado',
    descripcion: (antes: string, despues: string, pares: number, sinPar: number) =>
      `Perfil por sitio entre la toma del ${antes} y la del ${despues}: ${pares} ${pares === 1 ? 'sitio con las dos tomas' : 'sitios con las dos tomas'}${sinPar > 0 ? `; ${sinPar} ${sinPar === 1 ? 'sitio sin par' : 'sitios sin par'}` : ''}.`,
  },

  // ─── GR-20 · la masa grasa según cada método ─────────────────────────────────────────────────
  masas: {
    titulo: 'Masa grasa según cada método',
    pregunta: '¿Cuántos kg de masa grasa estima cada método en cada toma, y cuánto se separan?',
    panelGrasa: 'Masa grasa',
    panelLibre: 'Masa libre de grasa',
    panelMuscular: 'Masa muscular esquelética (Lee)',
    porConstruccion:
      'Durnin y Womersley y Faulkner salen de los mismos pliegues de la misma toma: que se muevan juntos es por construcción, no una confirmación.',
    separacionNoEsCambio: 'La distancia entre dos métodos en una toma no es un cambio: es cuánto se separan dos estimaciones del mismo momento.',
    cadaNumero: 'Cada número es la estimación de un método, con su versión: no es una medición directa de la grasa de la persona.',
    leeAparte: 'Lee estima la masa muscular esquelética, otra cosa: va en su panel, con su eje.',
    ejeComun: 'En cada panel los métodos comparten el eje: uno propio por método agrandaría cualquier diferencia chica.',
    separan: (texto: string) => `se separan ${texto}`,
    columnaSeparacion: (panel: string) => `${panel}: cuánto se separan`,
    sinMasas: 'Sin masas calculadas en las tomas de estas fechas: cada método pide sus pliegues y sus datos de la persona.',
    leyendaSeparacion: 'Dos métodos de la misma toma, unidos por una línea fina: cuánto se separan',
    metodoSinNombre: 'método identificado, sin nombre en BE',
  },
} as const;
