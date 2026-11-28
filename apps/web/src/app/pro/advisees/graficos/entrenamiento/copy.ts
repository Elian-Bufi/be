/**
 * Los textos de los gráficos de Entrenamiento (WP-GRAFICOS fase 2, rama B; DL-174): el historial del cuadro del
 * ejercicio (GR-02, GR-03 y GR-05), su perfil (GR-06) y lo que GR-02 suma en «Analizar · Fuerza». Ubican, nunca
 * califican: pasan por `terminosProhibidosEnUnGrafico` con Entrenamiento (TEST-GRF-021). Sin el signo más-menos, sin
 * porcentajes y sin comparar el primer punto con el último: el ruido se dice antes que el cambio.
 *
 * Es puro: lo leen las pruebas de `apps/web/test/graficos-entrenamiento.test.mjs`.
 */
import { COPY_FUERZA } from '@be/domain';
import type { FichaDeLaLeyenda } from '../marcas';

/** El período del historial (GR-T31): 12 semanas, 6 meses o desde que la acompañás, como mucho un año. */
export type OpcionDePeriodo = 'DOCE_SEMANAS' | 'SEIS_MESES' | 'DESDE_EL_VINCULO';

/** Los dos pasos que el cuadro del ejercicio suma a los de ED-75: «Historial» y «Perfil». */
export type PasoDelHistorial = 'historial' | 'perfil';

const sesiones = (n: number): string => (n === 1 ? '1 sesión' : `${n} sesiones`);

export const COPY_DEL_HISTORIAL = {
  seccion: 'En el tiempo',
  queEs: 'Lo registrado de este ejercicio sesión a sesión, con las versiones del plan de fondo. Mirarlo no cambia nada del plan.',
  verElHistorial: 'Historial',
  verElPerfil: 'Perfil de carga y repeticiones',
  titulo: { historial: 'Historial', perfil: 'Perfil de carga y repeticiones' } satisfies Record<PasoDelHistorial, string>,
  periodo: 'Período',
  opciones: { DOCE_SEMANAS: '12 semanas', SEIS_MESES: '6 meses', DESDE_EL_VINCULO: 'Desde que la acompañás' } satisfies Record<OpcionDePeriodo, string>,
  /** Cómo se nombra el período en las frases: «en las últimas 12 semanas». */
  enElPeriodo: { DOCE_SEMANAS: 'en las últimas 12 semanas', SEIS_MESES: 'en los últimos 6 meses', DESDE_EL_VINCULO: 'desde que la acompañás' } satisfies Record<OpcionDePeriodo, string>,
  hastaUnAnio: 'Se ve el último año: el acompañamiento empezó antes y cada lectura abarca hasta un año.',
  sinInicio: 'No pudimos leer desde cuándo la acompañás: se ve el último año.',
  serie: 'Serie',
  serieN: (n: number) => `Serie ${n}`,
  unidad: 'Unidad',
  abrirEnAnalizar: 'Abrir en Analizar',
  abrirEnAnalizarDe: (que: string) => `Abrir en Analizar: ${que}`,
  sinSesiones: 'Sin sesiones registradas desde el inicio del acompañamiento.',
  sinSesionesEnElPeriodo: (enElPeriodo: string) => `Sin sesiones registradas de este ejercicio ${enElPeriodo}. Probá con un período más largo.`,
  noSeLeyo: 'No pudimos leer las sesiones registradas de este ejercicio.',
  queSeReintenta: 'el historial del ejercicio',
  noDisponible: 'Con el acceso de ahora no podés ver los registros de Entrenamiento de esta persona.',
  sesiones,
} as const;

/** GR-02: el 1RM estimado (Epley) con las versiones de fondo, la lectura de cada versión y el ruido propio. */
export const COPY_FUERZA_ESTIMADA = {
  titulo: COPY_FUERZA.nombreDeLaMetrica,
  carril: COPY_FUERZA.nombreDeLaMetrica,
  metodo: COPY_FUERZA.metodo,
  incluir: 'Incluir las de más de 10 a 12 repeticiones equivalentes',
  /** La línea tenue debajo del título: «kg · una estimación por sesión · del 24 ago a hoy» (el método lo suma la base). */
  detalle: (unidad: string, periodo: string) => `${unidad} · una estimación por sesión · ${periodo}`,
  porVersion: 'Cada versión del plan',
  version: (etiqueta: string, desde: string) => `${etiqueta.replace(/^v/, 'Versión ')}, desde el ${desde}`,
  versionCorta: (etiqueta: string) => etiqueta.replace(/^v/, 'la versión '),
  sesiones,
  /** Lo que cuenta cada versión: las sesiones con estimación (GR-05 cuenta las de la serie, con RIR escrito o sin él). */
  sesionesConEstimacion: (n: number) => `${sesiones(n)} con estimación`,
  /**
   * Si no se pudo leer lo que indicaba el plan, la línea de cada versión va sin su cambio: se dice, porque callarlo haría
   * leer un salto del RIR indicado como un cambio de la fuerza (§5.12). La rama lo tenía en «Analizar» y se perdió al
   * traer la pasada visual (revisión del 15/11).
   */
  sinIndicado: 'No pudimos leer lo que indicaba el plan: si el RIR o las repeticiones indicadas cambiaron entre versiones, este gráfico no lo dice.',
  medianaDelRir: (rir: string) => `mediana del RIR registrado: ${rir}`,
  repeticiones: (desde: string, hasta: string) => (desde === hasta ? `${desde} repeticiones en la serie usada` : `de ${desde} a ${hasta} repeticiones en la serie usada`),
  ruido: (diferencia: string, unidad: string) => `entre sesiones de esta versión aparecen diferencias de hasta ${diferencia} ${unidad}`,
  ruidoSinAlcanzar: 'con menos de 4 sesiones de hasta 10 repeticiones equivalentes, todavía no alcanza para decir cuánto cambia entre sesiones',
  /** El ruido de la versión del punto elegido, en la lectura del costado de «Analizar · Fuerza»: antes que la anterior. */
  ruidoDeLaVersion: (version: string, diferencia: string, unidad: string) => `Entre sesiones de ${version} aparecen diferencias de hasta ${diferencia} ${unidad}.`,
  ruidoDeLaVersionSinAlcanzar: (version: string) => `En ${version}, con menos de 4 sesiones de hasta 10 repeticiones equivalentes, todavía no alcanza para decir cuánto cambia entre sesiones.`,
  descripcion: (n: number, bajo: string, alto: string) =>
    n === 1 ? `Una estimación en el período: ${bajo}.` : bajo === alto ? `${n} estimaciones en el período, todas de ${bajo}.` : `${n} estimaciones en el período, entre ${bajo} y ${alto}.`,
  lecturaOrientativa: 'orientativa',
  lecturaObservada: 'observada por vos',
  sinPuntos: 'En este período no hay estimaciones de este ejercicio en esta unidad.',
  comoSeCalculoTexto: [
    COPY_FUERZA.queEs,
    'Repeticiones equivalentes = repeticiones + RIR. Estimación = carga × (1 + repeticiones equivalentes / 30); con una sola repetición equivalente, la carga.',
    'De cada sesión entra una serie: de las que escribió la persona con RIR de 0 a 2, la de mayor carga, nunca la de mayor estimación. Lo tildado sin escribir (carga rápida) y lo que vino del plan no entran.',
    COPY_FUERZA.reglaDelRir,
  ],
  soloVos: 'Solo lo ves vos: la persona no ve estimaciones.',
} as const;

/**
 * Las fichas de la leyenda de lo que no es un punto (pasada visual: lo que se ve en el dibujo está en la leyenda). La
 * tira de abajo de cada gráfico de Entrenamiento tiene una marca por sesión, no por día; la línea cortada de GR-05 es lo
 * que indicaba cada versión.
 */
export const FICHAS_DE_ENTRENAMIENTO = {
  tiraDeLaFuerza: {
    glifo: 'TIRA',
    corto: 'Cada sesión',
    largo: 'La tira de abajo del gráfico, una marca por sesión del ejercicio: entera con estimación, una raya baja sin estimación',
  },
  tiraDeLaSerie: {
    glifo: 'TIRA',
    corto: 'Cada sesión',
    largo: 'La tira de abajo de cada panel, una marca por sesión: entera con el dato escrito, a media altura con algo que falta y una raya baja sin el dato',
  },
  franja: {
    glifo: 'FRANJA',
    corto: 'Lo indicado',
    largo: 'Franja gris de fondo: lo que indicaba cada versión del plan para esta serie (el rango de repeticiones o la carga sugerida); lo registrado va encima',
  },
  escalon: {
    glifo: 'LINEA_CORTADA',
    corto: 'Indicado por versión',
    largo: 'Línea cortada: el RIR que indicaba cada versión del plan para esta serie, del primer al último día con sesiones de esa versión',
  },
} as const satisfies Record<string, FichaDeLaLeyenda>;

/** La ficha de la tira de GR-02 y la de GR-03, con nombres cortos para las pantallas. */
export const FICHA_DE_LA_TIRA = { fuerza: FICHAS_DE_ENTRENAMIENTO.tiraDeLaFuerza, serie: FICHAS_DE_ENTRENAMIENTO.tiraDeLaSerie } as const;

/** GR-03: carga, repeticiones y RIR de la misma serie, en tres paneles alineados. */
export const COPY_CARGA_REPETICIONES_Y_RIR = {
  /** GPF-05: un % RM no se convierte a kg (09v10:356). */
  porcentajeRmSinFranja: 'La carga se indica respecto del RM: BE no la convierte a kg ni a lb, así que no va como franja en el panel de la carga.',
  titulo: (serie: number) => `Carga, repeticiones y RIR de la serie ${serie}`,
  /** La línea tenue: cada panel tiene su unidad, así que dice qué es cada punto y el período. */
  detalle: (periodo: string) => `un punto por sesión, sin promediar · ${periodo}`,
  carga: (serie: number) => `Carga registrada en la serie ${serie}`,
  repeticiones: (serie: number) => `Repeticiones registradas en la serie ${serie}`,
  rir: (serie: number) => `RIR registrado en la serie ${serie}`,
  repeticionesEnPalabras: (n: string, uno: boolean) => `${n} ${uno ? 'repetición' : 'repeticiones'}`,
  rirEnPalabras: (n: string) => `RIR ${n}`,
  rirIndicadoEnPalabras: (desde: string, hasta: string) => (desde === hasta ? `RIR ${desde}` : `RIR ${desde} a ${hasta}`),
  cargaRapida: 'carga rápida (tildada sin escribir: los valores del plan)',
  corregida: 'corregida',
  delDia: (orden: string) => `sesión ${orden} del día`,
  descripcion: (n: number, serie: number) => (n === 1 ? `Una sesión con la serie ${serie} registrada.` : `${n} sesiones con la serie ${serie} registrada.`),
  sinRirEscrito: 'Un RIR sin escribir no es 0: no se dibuja y la tabla dice «sin dato».',
  rirDelPlan: 'Lo tildado sin escribir son los valores del plan, no de la persona: va hueco y gris, y no se compara con lo indicado.',
  indicadoHueco: 'El RIR que indicaba la versión de cada sesión va hueco, en el mismo panel que el registrado.',
  sinIndicado: 'No pudimos leer lo que indicaba el plan en cada sesión: el RIR indicado no está.',
  queSeReintenta: 'la carga, las repeticiones y el RIR',
  noSeLeyo: 'No pudimos leer la carga, las repeticiones y el RIR de esta serie.',
  sinDatos: (serie: number) => `En este período no hay sesiones con la serie ${serie} registrada.`,
} as const;

/** GR-05: el RIR indicado de cada versión, en escalón, y el registrado, en puntos, con «a igual carga». */
export const COPY_RIR_INDICADO_Y_REGISTRADO = {
  titulo: (serie: number) => `RIR indicado y registrado en la serie ${serie}`,
  carril: (serie: number) => `RIR de la serie ${serie}`,
  aIgualCarga: 'A igual carga',
  todas: 'Todas las cargas',
  opcion: (carga: string, n: number) => `${carga} (${sesiones(n)})`,
  escalon: (rir: string, version: string) => `RIR indicado ${rir} · ${version}`,
  lecturaRegistrado: (rir: string, carga: string | null) => (carga ? `RIR ${rir} con ${carga}` : `RIR ${rir}`),
  lecturaIndicado: (rir: string) => `RIR ${rir}`,
  sinRirEscrito: 'sin RIR escrito',
  /** «La versión 3 (desde el 2/9): 4 sesiones con 80 kg; RIR registrado de 1 a 2; indicado: 2.» */
  porVersion: (version: string, n: number, carga: string | null, registrado: string | null, indicado: string | null) =>
    `${version}: ${sesiones(n)}${carga ? ` con ${carga}` : ''}; ${registrado ? `RIR registrado ${registrado}` : 'sin RIR escrito'}; ${indicado ? `indicado: ${indicado}` : 'sin RIR indicado'}.`,
  deA: (desde: string, hasta: string) => (desde === hasta ? desde : `de ${desde} a ${hasta}`),
  segunLaSesion: (desde: string, hasta: string) => `de ${desde} a ${hasta}, según la sesión`,
  menos: (carga: string, antes: string, despues: string, medianaAntes: string, medianaDespues: string) =>
    `La misma carga (${carga}), con menos RIR registrado en ${despues} que en ${antes}: mediana de ${medianaDespues} frente a ${medianaAntes}.`,
  mas: (carga: string, antes: string, despues: string, medianaAntes: string, medianaDespues: string) =>
    `La misma carga (${carga}), con más RIR registrado en ${despues} que en ${antes}: mediana de ${medianaDespues} frente a ${medianaAntes}.`,
  igual: (carga: string, antes: string, despues: string, mediana: string) => `La misma carga (${carga}), con la misma mediana de RIR registrado en ${antes} y en ${despues}: ${mediana}.`,
  sinVersion: (desde: string) => `las sesiones desde el ${desde}`,
  escalonEnLaLeyenda: 'Línea cortada: el RIR que indicaba cada versión del plan para esta serie, del primer al último día con sesiones de esa versión.',
  varia: 'Donde lo indicado cambia según la sesión, va como marca hueca en cada sesión y no como escalón.',
  comoLeerloTexto: [
    'El escalón es el RIR que indicaba cada versión del plan para esta serie; los puntos, el que escribió la persona. Están en el mismo panel porque tienen la misma unidad.',
    '«A igual carga» deja solo las sesiones con exactamente esa carga y esa unidad: así lo registrado se lee sin que cambie la carga de por medio.',
    'Lo que se ve se describe, no se califica: una diferencia entre lo indicado y lo registrado es un dato. Quien tiene poca experiencia con la escala suele errar el RIR en una repetición o más.',
  ],
  sinSesiones: (serie: number) => `En este período no hay sesiones con la serie ${serie} registrada.`,
  sinSesionesConEsaCarga: 'Con esa carga no hay sesiones en el período.',
} as const;

/** GR-06: el perfil de carga y repeticiones de la persona en el ejercicio. */
export const COPY_PERFIL = {
  /** El título, sin la unidad: la unidad y el período van en la línea tenue (DISENO-VISUAL §1, principio 1). */
  titulo: 'Perfil de carga y repeticiones',
  detalle: (unidad: string, periodo: string) => `${unidad} según las repeticiones equivalentes · una marca por serie · ${periodo}`,
  queEs: (unidad: string) => `En X, las repeticiones equivalentes de cada serie (repeticiones + RIR); en Y, la carga en ${unidad}. Un ejercicio y una unidad por gráfico.`,
  leyenda: 'Cómo se leen las marcas',
  lasCurvas: (rotulos: readonly string[]) =>
    rotulos.length === 1 ? `La curva: ${rotulos[0]}.` : `Las curvas, de abajo arriba: ${rotulos.slice(0, -1).join(', ')} y ${rotulos[rotulos.length - 1]}.`,
  ejeX: 'Repeticiones equivalentes (repeticiones + RIR)',
  ejeY: (unidad: string) => `Carga (${unidad})`,
  recientes: 'Últimas 4 semanas: punto lleno',
  anteriores: 'Antes: cruz',
  /** La leyenda como fichas cortas: la forma la dice el glifo; el lector de pantalla oye el texto largo. */
  leyendaCorta: { recientes: 'Últimas 4 semanas', anteriores: 'Antes', curva: 'Igual 1RM estimado, de la fórmula' },
  recientesCorto: 'últimas 4 semanas',
  anterioresCorto: 'antes',
  curva: 'Curva de igual 1RM estimado (Epley), de la fórmula: línea cortada',
  rotuloDeLaCurva: (valor: string) => `≈ ${valor} · de la fórmula`,
  mostrarCurvas: 'Mostrar las curvas de la fórmula (Epley)',
  queSonLasCurvas: 'Las curvas son de la fórmula de Epley, no de la persona: cada una une las cargas que darían la misma estimación. Solo llegan hasta 12 repeticiones equivalentes.',
  sinCurvas: 'Este ejercicio no está en la lista de la estimación (Epley): van solo los puntos, sin las curvas de la fórmula.',
  queEntra: 'Entran solo las series que escribió la persona con RIR de 0 a 2: lo tildado sin escribir (carga rápida), lo que vino del plan y lo que no dice quién lo escribió quedan afuera.',
  /** Lo que entra, en una línea a la vista (§5.6: el rango de validez a la vista); el detalle, en «Cómo leerlo». */
  validez: 'Solo las series que escribió la persona, con RIR de 0 a 2.',
  /** El rótulo de una curva adentro del dibujo: «≈ 145»; la unidad está en la línea tenue y «de la fórmula», en la leyenda. */
  rotuloCortoDeLaCurva: (valor: string) => `≈ ${valor}`,
  fuera: (n: number) => (n === 1 ? '1 serie registrada no entra por eso.' : `${n} series registradas no entran por eso.`),
  lectura: (carga: string, repeticiones: number, rir: string, equivalentes: string, cuando: string) => `${carga} × ${repeticiones} · RIR ${rir} · ${equivalentes} repeticiones equivalentes · ${cuando}`,
  descripcion: (n: number, recientes: number) => `${n === 1 ? '1 serie' : `${n} series`} escritas por la persona; ${recientes === 1 ? '1 es' : `${recientes} son`} de las últimas 4 semanas.`,
  sinSeries: 'Sin series escritas por la persona con RIR de 0 a 2 en este período.',
  elegir: 'Flechas: la serie anterior o la siguiente, de menos a más repeticiones equivalentes. Inicio y Fin. Escape: soltar.',
  sinElegir: 'Elegí una serie con las flechas o tocándola.',
  tabla: 'Ver la tabla',
  ocultarTabla: 'Ocultar la tabla',
  columnas: { fecha: 'Fecha', carga: 'Carga', repeticiones: 'Repeticiones', rir: 'RIR', equivalentes: 'Repeticiones equivalentes', cuando: 'Cuándo' },
  noSeLeyo: 'No pudimos leer las series registradas de este ejercicio.',
  queSeReintenta: 'el perfil del ejercicio',
} as const;

/** Las preguntas cortas de cada gráfico, el título de su tarjeta en «Patrones». */
export const PREGUNTAS_DE_ENTRENAMIENTO = {
  fuerzaEstimada: '¿Cómo se movió el 1RM estimado, versión a versión?',
  cargaRepeticionesYRir: '¿Qué cambió entre sesiones: la carga, las repeticiones o el RIR?',
  rirIndicadoYRegistrado: '¿Con qué RIR registró la serie en la que el plan indicaba un RIR?',
  perfilCargaRepeticiones: '¿Qué carga mueve según las repeticiones equivalentes?',
} as const;
