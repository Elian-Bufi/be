/**
 * «Patrones» y los enfoques (WP-GRAFICOS fase 2, rama E; GR-27, DL-174 y DL-183): qué tarjetas se dibujan con esta
 * persona, en qué sección, con qué ejercicio, y a dónde lleva «Abrir en Analizar». Es puro, sin JSX: lo prueba
 * `apps/web/test/graficos-patrones.test.mjs` (TEST-GRF-094 a 099 y TEST-GRPE-001 en adelante).
 *
 * Las reglas que cuida:
 * - **El permiso de la persona manda** (principio 10, DL-176): un gráfico de un área que el PDP no deja leer hoy no se
 *   dibuja, no se cuenta y no deja rastro, ni en gris ni con candado. «Patrones» lee solo lo que ya leen «Analizar» y las
 *   lecturas de cada gráfico (API-PRJ-01, API-DSH-04 y el comparador), siempre con el acceso propio del profesional:
 *   nunca lo que la persona comparte de otras áreas (API-RES), que vive en «Otras áreas».
 * - **Un enfoque guarda referencias, nunca datos:** abrirlo vuelve a pedir todo; un identificador que este website no
 *   conoce se ignora (GR-T17).
 * - **Lo que no aplica con esta persona no se dibuja** (GR-T08), pero se dice cuánto no se dibujó y por qué, si es de un
 *   área que se ve: «lo que falta» no esconde nada ni delata un área sin acceso.
 * - **Ubicar, nunca calificar:** los textos no juzgan, no comparan con otras personas y no dicen causas.
 */
import {
  CODIGOS_QUE_NO_SE_ELIGEN_SUELTOS,
  graficoSugerido,
  serieDisponible,
  sugeridosParaTusAreas,
  type ContenidoDelEnfoque,
  type EjercicioDelGrafico,
  type EjercicioDelPeriodo,
  type GraficoDelEnfoque,
  type UbicacionDelGrafico,
} from '@be/domain';
import { serieConAcceso, type ModoArmado } from '../arma-tu-grafico/compositor';
import { ejerciciosDeLaListaV1 } from '../cruces/preguntas-con-graficos';
import { inicioDelEje, type PeriodoDelGrafico } from '../eje-de-fechas';
import { haciaAnalizar, haciaElProgresoEnAnalizar, haciaLaFuerzaEnAnalizar, haciaLoIndicadoEnAnalizar } from '../entrenamiento/periodo-del-historial';
import type { ContextoDelRegistro, EjercicioDelGraficoElegido, GraficoRegistrado, RegistroDeGraficos } from '../registro-de-graficos';
import { codificarReferencia } from '../../seguimiento/estado';

// ─── Los textos ──────────────────────────────────────────────────────────────────────────────────────────────

export const COPY_DE_PATRONES = {
  vista: 'Patrones',
  pista: 'Los gráficos de esta persona en el mismo tiempo, con lo que pasó en cada momento.',
  enElTiempo: 'En el tiempo',
  enElTiempoDetalle: 'Todos sobre el mismo eje de fechas: elegir un día en uno lo elige en todos.',
  comparaciones: 'Comparaciones',
  comparacionesDetalle: 'Lo que no va sobre el tiempo, cada uno con su eje.',
  verLaRelacion: 'Ver la relación',
  verLaRelacionDetalle: 'Dos áreas en el mismo tiempo, con una ventana fijada antes de mirar y lo que también cambió. Que coincidan no dice que una cosa cause la otra.',
  abrirLaRelacion: 'Ver este cruce',
  agregarUnGrafico: 'Agregar un gráfico',
  agregarDetalle: 'Los sugeridos que faltan, o uno armado con hasta tres series.',
  armaTuGrafico: 'Armá tu gráfico',
  armaTuGraficoDetalle: 'Hasta tres series de tus áreas, alineadas o superpuestas.',
  abrirEnAnalizar: 'Abrir en Analizar',
  subir: 'Subir',
  bajar: 'Bajar',
  quitar: 'Quitar',
  noSeQuitaElUltimo: 'Un enfoque tiene al menos un gráfico.',
  tope: 'Un enfoque tiene hasta seis gráficos: quitá uno para sumar otro.',
  repetido: 'Ese gráfico ya está en el enfoque.',
  loQueFalta: 'Lo que falta',
  sinGraficos: 'Con lo que hay en este período no se puede dibujar ninguno de estos gráficos.',
  sinAreas: 'Con tu acceso actual no hay gráficos para mostrar de esta persona.',
  noSeLeyo: 'qué datos hay en el período',
  inicioDelAcompanamiento: 'La historia empieza el día que empezaste a acompañarla: lo anterior no se dibuja.',
  // El enfoque
  enfoque: 'Enfoque',
  sugeridos: 'Sugeridos para tus áreas',
  sugeridosDetalle: 'Los que BE propone con tus áreas, hasta que elijas un enfoque.',
  guardarComoEnfoque: 'Guardar lo que ves como enfoque…',
  editarEsteEnfoque: 'Editar este enfoque',
  misEnfoques: 'Mis enfoques…',
  elegido: (nombre: string) => `Enfoque: ${nombre}`,
  elegidoParaLaPersona: 'Elegido para esta persona. Queda hasta que lo cambies.',
  deshacer: 'Deshacer',
  volvioALosSugeridos: 'Volvió a los sugeridos para tus áreas.',
  editando: (nombre: string | null) => (nombre ? `Editando «${nombre}»` : 'Armando un enfoque nuevo'),
  editandoDetalle: 'Subí, bajá o quitá gráficos, o agregá otros. Nada se guarda hasta que toques «Guardar».',
  guardar: 'Guardar',
  guardarComoNuevo: 'Guardar como uno nuevo',
  cancelar: 'Cancelar',
  nombreDelEnfoque: 'Nombre del enfoque',
  pistaDelNombre: 'No pongas datos de salud: el enfoque se usa con varias personas.',
  faltaNombre: 'Poné un nombre al enfoque.',
  sinCambios: 'Todavía no cambiaste nada.',
  guardado: (nombre: string) => `Guardado «${nombre}» y elegido para esta persona.`,
  cambioDeOtraPestana: 'Este enfoque cambió en otra pestaña: se volvió a leer. Revisá y guardá otra vez.',
  eleccionDeOtraPestana: 'La elección cambió en otra pestaña: se volvió a leer.',
  tantosEnfoques: 'Ya tenés 50 enfoques: borrá uno en «Mis enfoques» para crear otro.',
  // En el editor del plan
  enfoqueDelPlan: 'Enfoque de este plan',
  enfoqueDeLaPersona: 'Enfoque de la persona',
  paraEstePlan: 'Para este plan',
  paraLaPersona: 'Para la persona',
  rigeElDelPlan: 'Rige en este plan. Queda hasta que lo cambies.',
  rigeElDeLaPersona: 'Este plan no tiene uno propio: rige el de la persona.',
  rigenLosSugeridos: 'Ni este plan ni la persona tienen uno: van los sugeridos para tus áreas.',
  volverALosSugeridos: 'Volver a los sugeridos',
  usarElDeLaPersona: 'Usar el de la persona',
  nadaSeEscribeEnElPlan: 'Lo que ves acá no escribe en el plan.',
} as const;

// ─── El ejercicio de un gráfico ──────────────────────────────────────────────────────────────────────────────

/** El ejercicio de un gráfico guardado, ya resuelto con esta persona; `NO_APLICA` si no se puede resolver en el período. */
export type EjercicioResuelto = EjercicioDelGraficoElegido | null | 'NO_APLICA';

const unidadDe = (e: Pick<EjercicioDelPeriodo, 'loadUnits'>): 'kg' | 'lb' | null => (e.loadUnits.includes('kg') ? 'kg' : e.loadUnits.includes('lb') ? 'lb' : null);

/**
 * GR-T08: uno fijo del catálogo (si tiene sesiones en el período) o «el más registrado» del período, del 1.º al 3.º.
 * Para un gráfico que pide la lista de la v1 (el 1RM estimado), «el más registrado» se cuenta entre los de esa lista
 * (GR-VE03): así un enfoque «Foco en fuerza» sirve con cualquier persona que haga alguno.
 */
export function ejercicioResuelto(e: EjercicioDelGrafico | null, ejercicios: readonly EjercicioDelPeriodo[] | null, soloListaV1: boolean, soloConCarga = false): EjercicioResuelto {
  if (e === null) return null;
  const candidatos = soloListaV1 ? ejerciciosDeLaListaV1(ejercicios) : [...(ejercicios ?? [])].filter((x) => x.sessions > 0).sort((a, b) => b.sessions - a.sessions);
  if (e.kind === 'MOST_RECORDED' && soloConCarga) {
    // GR-VE13: para un gráfico de la carga, «el más registrado» es el más registrado con carga (unas dominadas sin lastre
    // dejarían el panel de la carga vacío). Uno fijo se respeta: lo eligió el profesional.
    const x = candidatos.filter((c) => c.loadUnits.length > 0)[e.rank - 1];
    return x ? { exerciseKey: x.exerciseKey, nombre: x.name, unidad: unidadDe(x), serie: null } : 'NO_APLICA';
  }
  if (e.kind === 'FIXED') {
    const x = candidatos.find((c) => c.exerciseKey.toLowerCase() === e.exerciseKey.toLowerCase());
    if (!x) return 'NO_APLICA';
    return { exerciseKey: x.exerciseKey, nombre: x.name, unidad: e.unit ?? unidadDe(x), serie: e.setIndex };
  }
  const x = candidatos[e.rank - 1];
  return x ? { exerciseKey: x.exerciseKey, nombre: x.name, unidad: unidadDe(x), serie: null } : 'NO_APLICA';
}

/** Los gráficos que dibujan la carga: su «más registrado» se busca entre los ejercicios con carga registrada. */
const GRAFICOS_DE_LA_CARGA: readonly string[] = ['entrenamiento.carga-repeticiones-y-rir', 'entrenamiento.perfil-carga-repeticiones'];
export const conCarga = (chartId: string): boolean => GRAFICOS_DE_LA_CARGA.includes(chartId);

// ─── Las tarjetas ────────────────────────────────────────────────────────────────────────────────────────────

/** Lo que guarda un gráfico armado de un enfoque (`kind: 'CUSTOM'`): solo referencias. */
export interface GraficoArmadoDelEnfoque {
  readonly title: string;
  readonly series: Extract<GraficoDelEnfoque, { kind: 'CUSTOM' }>['series'];
  readonly mode: ModoArmado;
}

interface BaseDeLaTarjeta {
  /** La posición en el enfoque (para subir, bajar y quitar). */
  readonly indice: number;
  /** Una clave estable para React y para la página (`data-tarjeta`). */
  readonly clave: string;
  readonly titulo: string;
  readonly referencia: GraficoDelEnfoque;
}

export interface TarjetaSugerida extends BaseDeLaTarjeta {
  readonly tipo: 'SUGERIDO';
  readonly grafico: GraficoRegistrado;
  readonly ejercicio: EjercicioDelGraficoElegido | null;
  readonly medida: string | null;
}

export interface TarjetaArmada extends BaseDeLaTarjeta {
  readonly tipo: 'ARMADO';
  /** Solo las series que se pueden leer hoy con esta persona: las de un área sin acceso no se piden ni dejan hueco. */
  readonly armado: GraficoArmadoDelEnfoque;
}

export type Tarjeta = TarjetaSugerida | TarjetaArmada;

export interface TarjetasDePatrones {
  readonly enElTiempo: readonly Tarjeta[];
  readonly comparaciones: readonly Tarjeta[];
  /** Los cruces que el enfoque nombra; los ofrecidos que no nombra se suman en «Ver la relación» (`crucesDeLaRelacion`). */
  readonly relacion: readonly TarjetaSugerida[];
  /** Cuántos gráficos de áreas que se ven no se pueden dibujar con esta persona en el período (lo que falta). */
  readonly noAplican: number;
}

/** Si el profesional ve hoy todas las áreas que pide un gráfico sugerido (un cruce pide las dos). */
function areasQueSeVen(chartId: string, c: ContextoDelRegistro): boolean {
  const s = graficoSugerido(chartId);
  if (!s) return true;
  return s.alcances.every((a) => c.acceso.alcances.includes(a)) && (s.alcances.length > 0 || c.acceso.alcances.length > 0);
}

/**
 * Las tarjetas de un enfoque (o de los sugeridos) con esta persona, cada una en su sección. Un identificador que este
 * website no conoce, uno que no se elige suelto y uno de un área sin acceso no aparecen y no se cuentan; uno de un área
 * que se ve, pero sin lo que pide en el período (un ejercicio, sesiones, tomas), se cuenta en `noAplican`.
 */
export function tarjetasDelEnfoque(charts: readonly GraficoDelEnfoque[], c: ContextoDelRegistro, registro: RegistroDeGraficos): TarjetasDePatrones {
  const enElTiempo: Tarjeta[] = [];
  const comparaciones: Tarjeta[] = [];
  const relacion: TarjetaSugerida[] = [];
  let noAplican = 0;
  charts.forEach((ref, indice) => {
    if (ref.kind === 'CUSTOM') {
      const series = ref.series.filter((s) => {
        const catalogo = serieDisponible(s.metricId);
        return catalogo !== null && serieConAcceso(catalogo, c.acceso);
      });
      // Sin ninguna serie que se pueda leer hoy, el gráfico no está (no se dice que falta un área).
      if (series.length === 0) return;
      enElTiempo.push({ tipo: 'ARMADO', indice, clave: `armado-${indice}`, titulo: ref.title, referencia: ref, armado: { title: ref.title, series, mode: ref.mode } });
      return;
    }
    const grafico = registro.grafico(ref.chartId);
    if (!grafico || CODIGOS_QUE_NO_SE_ELIGEN_SUELTOS.includes(grafico.codigo)) return;
    if (!areasQueSeVen(ref.chartId, c)) return;
    if (!grafico.ofrecido(c)) {
      noAplican++;
      return;
    }
    const ejercicio = ejercicioResuelto(ref.exercise, c.ejercicios, grafico.requiere.listaV1, conCarga(grafico.id));
    if (ejercicio === 'NO_APLICA' || (ejercicio === null && grafico.requiere.ejercicio)) {
      noAplican++;
      return;
    }
    const tarjeta: TarjetaSugerida = {
      tipo: 'SUGERIDO',
      indice,
      clave: `${ref.chartId}-${indice}`,
      titulo: grafico.titulo,
      referencia: ref,
      grafico,
      ejercicio,
      medida: ref.bodyMetric,
    };
    const ubicacion: UbicacionDelGrafico = grafico.ubicacion;
    if (ubicacion === 'RELACION') relacion.push(tarjeta);
    else if (ubicacion === 'COMPARACION') comparaciones.push(tarjeta);
    else enElTiempo.push(tarjeta);
  });
  return { enElTiempo, comparaciones, relacion, noAplican };
}

/**
 * «Ver la relación»: los cruces preparados que existen en el caso del profesional (SP-01 y SP-02 en el caso 1), los
 * nombre o no el enfoque. Sin las dos áreas con planes o tomas propios, ninguno: la sección no está.
 */
export function crucesDeLaRelacion(enElEnfoque: readonly TarjetaSugerida[], c: ContextoDelRegistro, registro: RegistroDeGraficos): TarjetaSugerida[] {
  const ofrecidos = registro.ofrecidos(c).filter((g) => g.ubicacion === 'RELACION');
  const extra = ofrecidos
    .filter((g) => !enElEnfoque.some((t) => t.grafico.id === g.id))
    .flatMap((g): TarjetaSugerida[] => {
      const referencia: GraficoDelEnfoque = { kind: 'SUGGESTED', chartId: g.id, exercise: g.requiere.ejercicio ? { kind: 'MOST_RECORDED', rank: 1 } : null, bodyMetric: null };
      const ejercicio = ejercicioResuelto(referencia.kind === 'SUGGESTED' ? referencia.exercise : null, c.ejercicios, g.requiere.listaV1, conCarga(g.id));
      if (ejercicio === 'NO_APLICA') return [];
      return [{ tipo: 'SUGERIDO', indice: -1, clave: `relacion-${g.id}`, titulo: g.titulo, referencia, grafico: g, ejercicio, medida: null }];
    });
  return [...enElEnfoque, ...extra];
}

/**
 * «Agregar un gráfico»: los sugeridos del registro que se ofrecen con esta persona y que el enfoque no tiene todavía, sin
 * los cruces (van en «Ver la relación») ni los que no se eligen sueltos. Con un ejercicio, «el más registrado».
 */
export function sugeridosQueFaltan(charts: readonly GraficoDelEnfoque[], c: ContextoDelRegistro, registro: RegistroDeGraficos): { readonly grafico: GraficoRegistrado; readonly referencia: GraficoDelEnfoque }[] {
  return registro
    .ofrecidos(c)
    .filter((g) => g.ubicacion !== 'RELACION' && !CODIGOS_QUE_NO_SE_ELIGEN_SUELTOS.includes(g.codigo))
    .filter((g) => !charts.some((x) => x.kind === 'SUGGESTED' && x.chartId === g.id))
    .flatMap((g) => {
      const referencia: GraficoDelEnfoque = { kind: 'SUGGESTED', chartId: g.id, exercise: g.requiere.ejercicio || g.requiere.listaV1 ? { kind: 'MOST_RECORDED', rank: 1 } : null, bodyMetric: null };
      const ejercicio = ejercicioResuelto(referencia.kind === 'SUGGESTED' ? referencia.exercise : null, c.ejercicios, g.requiere.listaV1, conCarga(g.id));
      return ejercicio === 'NO_APLICA' ? [] : [{ grafico: g, referencia }];
    });
}

/**
 * Los sugeridos para tus áreas con esta persona (sin enfoque elegido): la lista del dominio, solo con lo que se puede
 * dibujar hoy (un área sin acceso no deja rastro; un gráfico sin lo que pide en el período no se propone).
 */
export function sugeridosConEstaPersona(c: ContextoDelRegistro, registro: RegistroDeGraficos): GraficoDelEnfoque[] {
  return sugeridosParaTusAreas(c.acceso.alcances, (g) => {
    const t = tarjetasDelEnfoque([g], c, registro);
    return t.enElTiempo.length + t.comparaciones.length === 1;
  });
}

// ─── «Abrir en Analizar» ─────────────────────────────────────────────────────────────────────────────────────

/**
 * A dónde lleva «Abrir en Analizar», con el ejercicio, la serie y el período ya elegidos; `null` si «Analizar» no tiene
 * una pregunta para ese gráfico (las medidas por método y por sitio, y «Dos etapas», que ya vive ahí con sus etapas).
 */
export function enlaceEnAnalizar(t: Tarjeta, asesoradoId: string, periodo: PeriodoDelGrafico): string | null {
  if (t.tipo === 'ARMADO') {
    const p = new URLSearchParams({ id: asesoradoId, vista: 'analizar', m: t.armado.series.map(codificarReferencia).join(','), desde: inicioDelEje(periodo), hasta: periodo.hasta });
    if (t.armado.mode === 'OVERLAY') p.set('modo', 'S');
    return `/pro/advisees?${p.toString()}`;
  }
  const e = t.ejercicio;
  switch (t.grafico.id) {
    case 'entrenamiento.fuerza-estimada':
      return e && e.exerciseKey.startsWith('e:') ? haciaLaFuerzaEnAnalizar(asesoradoId, e.exerciseKey.slice(2), e.unidad ?? 'kg', false, periodo) : null;
    case 'entrenamiento.carga-repeticiones-y-rir':
    case 'entrenamiento.perfil-carga-repeticiones':
      return e ? haciaElProgresoEnAnalizar(asesoradoId, e.exerciseKey, e.serie ?? 1, e.unidad, periodo) : null;
    case 'entrenamiento.rir-indicado-y-registrado':
      return e ? haciaLoIndicadoEnAnalizar(asesoradoId, e.exerciseKey, periodo) : null;
    case 'nutricion.energia-por-dia':
    case 'nutricion.macros-en-paneles':
    case 'nutricion.macros-por-kilo':
      return haciaAnalizar(asesoradoId, { pregunta: 'nutricion-por-dia-y-por-semana' }, periodo);
    case 'nutricion.indicado-y-registrado-por-dia':
      return haciaAnalizar(asesoradoId, { pregunta: 'registrado-vs-indicado', area: 'NUTRICION' }, periodo);
    case 'cruce.carbohidratos-y-fuerza':
    case 'cruce.energia-y-peso':
      return haciaAnalizar(asesoradoId, { pregunta: 'ver-la-relacion' }, periodo);
    default:
      return null;
  }
}

// ─── Lo que falta ────────────────────────────────────────────────────────────────────────────────────────────

/** Lo que falta, dicho sin esconder nada y sin nombrar un área sin acceso. */
export function loQueFalta(o: { readonly noAplican: number; readonly empiezaAntesDelVinculo: boolean }): string[] {
  const salida: string[] = [];
  if (o.noAplican > 0) {
    salida.push(
      o.noAplican === 1
        ? '1 gráfico del enfoque no se dibuja: con esta persona no hay en el período lo que pide (un ejercicio con sesiones, tomas o registros).'
        : `${o.noAplican} gráficos del enfoque no se dibujan: con esta persona no hay en el período lo que piden (un ejercicio con sesiones, tomas o registros).`,
    );
  }
  if (o.empiezaAntesDelVinculo) salida.push(COPY_DE_PATRONES.inicioDelAcompanamiento);
  return salida;
}

/** Los gráficos de un contenido, o ninguno (los sugeridos se calculan aparte). */
export const graficosDe = (contenido: ContenidoDelEnfoque | null): readonly GraficoDelEnfoque[] => contenido?.charts ?? [];

// ─── Lo que se ve y el orden al editar ───────────────────────────────────────────────────────────────────────

/**
 * «Guardar lo que ves como enfoque…» guarda lo que se ve (revisión adversaria de «Patrones»): los gráficos del enfoque que se
 * dibujan con esta persona, en el orden del enfoque, y un armado con solo las series que se leen. Lo de un área sin acceso,
 * un identificador que este website no conoce y lo que no aplica en el período no se ven: no se guardan ni se cuentan.
 */
export function graficosQueSeVen(charts: readonly GraficoDelEnfoque[], c: ContextoDelRegistro, registro: RegistroDeGraficos): GraficoDelEnfoque[] {
  const t = tarjetasDelEnfoque(charts, c, registro);
  return [...t.enElTiempo, ...t.comparaciones, ...t.relacion]
    .sort((a, b) => a.indice - b.indice)
    .map((x): GraficoDelEnfoque => (x.tipo === 'ARMADO' ? { kind: 'CUSTOM', title: x.armado.title, series: [...x.armado.series], mode: x.armado.mode } : x.referencia));
}

/** Con qué gráfico del enfoque se intercambia una tarjeta al subirla o bajarla (su posición en el enfoque), o `null`. */
export interface VecinasDeLaTarjeta {
  readonly anterior: number | null;
  readonly siguiente: number | null;
}

/**
 * «Subir» y «Bajar» mueven entre las tarjetas que se ven en la misma sección: intercambiar con un gráfico que no se ve (de
 * un área sin acceso, o que no aplica) o con uno de otra sección no cambiaría nada en pantalla.
 */
export function vecinasEnLaSeccion(lista: readonly Tarjeta[]): ReadonlyMap<string, VecinasDeLaTarjeta> {
  return new Map(lista.map((t, k): [string, VecinasDeLaTarjeta] => [t.clave, { anterior: lista[k - 1]?.indice ?? null, siguiente: lista[k + 1]?.indice ?? null }]));
}

/** Intercambia dos gráficos del enfoque; con una posición fuera del enfoque, queda como está. */
export function intercambiarGraficos(contenido: ContenidoDelEnfoque, a: number, b: number): ContenidoDelEnfoque {
  const n = contenido.charts.length;
  if (a === b || a < 0 || b < 0 || a >= n || b >= n) return contenido;
  const charts = [...contenido.charts];
  [charts[a], charts[b]] = [charts[b]!, charts[a]!];
  return { ...contenido, charts };
}

/**
 * Quitar la elección del plan devuelve lo que rige sin ella (GR-T09): el enfoque de la persona, si tiene uno; si no, los
 * sugeridos. El botón dice a dónde vuelve, sin prometer los sugeridos cuando va a regir el de la persona.
 */
export const textoAlQuitarDelPlan = (laPersonaTieneUno: boolean): string => (laPersonaTieneUno ? COPY_DE_PATRONES.usarElDeLaPersona : COPY_DE_PATRONES.volverALosSugeridos);
