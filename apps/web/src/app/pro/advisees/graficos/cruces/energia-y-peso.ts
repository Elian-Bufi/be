/**
 * SP-02 · Calorías registradas × peso, de toma a toma (WP-GRAFICOS fase 2, DL-174). Solo en el caso 1: el mismo
 * profesional con Nutrición y Antropometría y planes o tomas propios en las dos (`caso-de-acceso.ts`).
 *
 * - **Paneles apilados:** las calorías por día, con el objetivo en escalón; su media semanal, que dice con cuántos días se
 *   hizo; y abajo el peso de cada toma como punto suelto, sin unir ni suavizar, con los días desde la toma anterior.
 *   Sin mínimo y máximo semanal mientras no exista el peso en casa.
 * - **La ventana**, fijada antes de mirar: de una toma de peso a la última, con 14 días o más entre las dos y el mismo
 *   protocolo (`ventanas.ts`). Las calorías se leen desde esa toma, o desde el cambio de objetivo si fue después, hasta el
 *   día anterior a la última toma.
 * - **El error de medición, dicho:** BE no lo tiene cargado, así que no se puede decir si la diferencia lo supera.
 * - Lo que también cambió, lo que BE no registra y la frase; y que lo registrado puede no ser todo lo comido.
 *
 * Es puro: lo prueba `apps/web/test/graficos-cruces.test.mjs`.
 */
import { diasEntreFechas, numero, valorConUnidad, type EscalonDelObjetivoApi, type PuntoAnalitico, type SerieAnalitica, type VigenciaDePlan } from '@be/domain';
import { carrilDeSerie } from '../adaptadores';
import { escalaDeLaSerie, lecturaDelPunto } from '../arma-tu-grafico/compositor';
import type { CarrilDeBarrasSemanales, CarrilDePuntos, SemanaDelCarril } from '../carriles';
import { delCatalogo, descripcionDeNutricion, diasEnPalabras, escalonesDelObjetivo, type LecturaDeUnCruce } from './carbohidratos-y-fuerza';
import { COPY_DE_LOS_CRUCES } from './copy';
import { LO_QUE_BE_NO_REGISTRA, versionesQueSeActivaron } from './lo-que-tambien-cambio';
import { diasDeNutricion, diaYMes, elDiaAnterior, tomasDe, ventanaDeLasTomas } from './ventanas';

const C = COPY_DE_LOS_CRUCES.energiaYPeso;

export interface EntradaDeEnergiaYPeso {
  /** Las calorías registradas por día (API-PRJ-01, grano DAY). */
  readonly energia: SerieAnalitica;
  /** Los escalones del objetivo de las calorías (DL-158). */
  readonly escalones: readonly EscalonDelObjetivoApi[];
  /** El peso de cada toma (API-PRJ-01, `antropometria.peso`). */
  readonly peso: SerieAnalitica;
  /** Las versiones de los planes que se leyeron, para decir qué más se activó en la ventana. */
  readonly vigencias: readonly VigenciaDePlan[];
  readonly periodo: { readonly desde: string; readonly hasta: string };
  readonly hoy: string;
}

const porDia = (valor: number, unidad: string): string => `${valorConUnidad(valor, unidad, 0)}/día`;

/** La lectura de SP-02: la ventana entre dos tomas, las calorías de ese tramo, el peso de cada toma y lo que no se sabe. */
export function lecturaDeEnergiaYPeso(e: EntradaDeEnergiaYPeso): LecturaDeUnCruce {
  const base = { noRegistra: LO_QUE_BE_NO_REGISTRA['SP-02'], frase: COPY_DE_LOS_CRUCES.frase };
  const par = ventanaDeLasTomas(tomasDe(e.peso));
  if (!par) return { ...base, ventana: null, falta: C.sinVentana, primeraLinea: [], lineas: [], tambienCambio: [] };
  const { a, b } = par;
  // El objetivo que regía el día de la última toma: si cambió después de la primera, las calorías se leen desde el cambio.
  const objetivo = [...e.escalones].sort((x, y) => x.from.localeCompare(y.from)).find((x) => x.from <= b.fecha && (x.to === null || b.fecha < x.to)) ?? null;
  const desdeElCambio = objetivo !== null && objetivo.from > a.fecha;
  const desde = desdeElCambio && objetivo ? objetivo.from : a.fecha;
  const hasta = elDiaAnterior(b.fecha);
  const dias = diasEntreFechas(desde, b.fecha);
  const d = diasDeNutricion(e.energia, desde, hasta, e.hoy);
  const unidad = e.peso.unit;
  const inicio = desdeElCambio ? `el cambio de objetivo del ${diaYMes(desde)}` : `la toma del ${diaYMes(a.fecha)}`;
  const tramo = `Desde ${inicio} hasta la toma del ${diaYMes(b.fecha)} (${numero(dias, 0)} ${dias === 1 ? 'día' : 'días'})`;
  const lineas = [
    d.mediana === null
      ? `${tramo}, no hay días con cantidades en todos sus registros y ninguna comida del plan sin registro: no hay mediana de calorías.`
      : `${tramo}, la mediana de calorías registradas fue de ${porDia(d.mediana, e.energia.unit)}, ${diasEnPalabras(d)}.`,
  ];
  const diferencia = Math.abs(b.valor - a.valor);
  if (Number(diferencia.toFixed(1)) === 0) lineas.push(`El peso fue de ${valorConUnidad(b.valor, unidad, 1)} en la toma del ${diaYMes(a.fecha)} y en la del ${diaYMes(b.fecha)}, ${numero(par.dias, 0)} días después.`);
  else {
    lineas.push(`El peso pasó de ${valorConUnidad(a.valor, unidad, 1)} en la toma del ${diaYMes(a.fecha)} a ${valorConUnidad(b.valor, unidad, 1)} en la del ${diaYMes(b.fecha)}, ${numero(par.dias, 0)} días después.`);
    lineas.push(C.errorDeMedicion(valorConUnidad(diferencia, unidad, 1)));
  }
  lineas.push(C.loRegistrado);
  return {
    ...base,
    ventana: { a: { desde: a.fecha, hasta: a.fecha }, b: { desde: b.fecha, hasta: b.fecha } },
    falta: null,
    primeraLinea: [],
    lineas,
    tambienCambio: versionesQueSeActivaron(e.vigencias, a.fecha, b.fecha),
  };
}

/** El lunes de la semana de una fecha civil. */
export function lunesDeLaSemana(fecha: string): string {
  const t = Date.parse(`${fecha}T12:00:00Z`);
  const desdeElLunes = (new Date(t).getUTCDay() + 6) % 7;
  return new Date(t - desdeElLunes * 86_400_000).toISOString().slice(0, 10);
}

/**
 * La media semanal de las calorías, con los días que BE puede leer enteros (con cantidades en todos sus registros y sin
 * comidas del plan sin registro), y cuántos días tuvo. Una semana sin ninguno de esos días no tiene media: no es un cero.
 */
export function mediaSemanal(serie: SerieAnalitica, hoy: string): SemanaDelCarril[] {
  const porSemana = new Map<string, { incluidos: number[]; afuera: number }>();
  for (const p of serie.points) {
    if (p.partialBucket || p.date === hoy) continue;
    const lunes = lunesDeLaSemana(p.date);
    const semana = porSemana.get(lunes) ?? { incluidos: [], afuera: 0 };
    if (p.value !== null && p.quality === 'COMPLETE') semana.incluidos.push(p.value);
    else semana.afuera += 1;
    porSemana.set(lunes, semana);
  }
  return [...porSemana.entries()]
    .sort(([x], [y]) => x.localeCompare(y))
    .map(([lunes, s]) => {
      const n = s.incluidos.length;
      const valor = n === 0 ? null : s.incluidos.reduce((t, v) => t + v, 0) / n;
      const afuera = s.afuera > 0 ? `; ${numero(s.afuera, 0)} con algún dato faltante ${s.afuera === 1 ? 'quedó afuera' : 'quedaron afuera'}` : '';
      const lectura =
        valor === null
          ? `semana del ${diaYMes(lunes)}: sin días con cantidades en todos sus registros${afuera}`
          : `media de ${porDia(valor, serie.unit)} con ${numero(n, 0)} ${n === 1 ? 'día' : 'días'} con cantidades en todos sus registros${afuera}`;
      return { lunes, valor, dias: n, lectura };
    });
}

/** El peso de cada toma, con los días desde la anterior del mismo tramo comparable. */
function lecturaDelPeso(serie: SerieAnalitica): (p: PuntoAnalitico) => string {
  const tomas = tomasDe(serie);
  const definicion = delCatalogo('antropometria.peso').definicion;
  return (p) => {
    const i = tomas.findIndex((t) => t.clave === p.pointId);
    const anterior = i > 0 ? tomas.slice(0, i).reverse().find((t) => t.tramo === p.segment) : undefined;
    const dias = anterior ? diasEntreFechas(anterior.fecha, p.date) : null;
    return `${lecturaDelPunto(p, definicion, serie.unit)}${dias === null ? '' : ` · ${numero(dias, 0)} ${dias === 1 ? 'día' : 'días'} después de la toma anterior`}`;
  };
}

/** Los carriles de SP-02, en su orden: las calorías por día, su media semanal y el peso de cada toma, sin unir. */
export function carrilesDeEnergiaYPeso(e: EntradaDeEnergiaYPeso): (CarrilDePuntos | CarrilDeBarrasSemanales)[] {
  const energia = delCatalogo('nutricion.energia');
  const peso = delCatalogo('antropometria.peso');
  const semanas = mediaSemanal(e.energia, e.hoy);
  const conMedia = semanas.filter((s) => s.valor !== null).length;
  return [
    carrilDeSerie(e.energia, energia, {
      id: energia.id,
      nombre: C.carriles.energia,
      indice: 0,
      metodo: energia.metodo?.rotulo ?? null,
      escala: escalaDeLaSerie(energia, e.energia.unit),
      descripcion: descripcionDeNutricion(C.carriles.energia, e.energia, e.periodo, e.hoy),
      lectura: (p) => lecturaDelPunto(p, energia.definicion, e.energia.unit),
      escalones: escalonesDelObjetivo(e.escalones, 'kcal/day'),
    }),
    {
      tipo: 'BARRAS_SEMANALES',
      id: 'nutricion.energia-media-semanal',
      nombre: C.carriles.mediaSemanal,
      unidad: e.energia.unit,
      semanas,
      descripcion: `${C.carriles.mediaSemanal}: ${numero(conMedia, 0)} ${conMedia === 1 ? 'semana con media' : 'semanas con media'}; cada una dice con cuántos días se hizo.`,
    },
    carrilDeSerie(e.peso, peso, {
      id: peso.id,
      nombre: C.carriles.peso,
      indice: 1,
      metodo: null,
      escala: escalaDeLaSerie(peso, e.peso.unit),
      descripcion: `${C.carriles.peso}: ${numero(tomasDe(e.peso).length, 0)} ${tomasDe(e.peso).length === 1 ? 'toma' : 'tomas'}, como puntos sueltos.`,
      lectura: lecturaDelPeso(e.peso),
    }),
  ];
}
