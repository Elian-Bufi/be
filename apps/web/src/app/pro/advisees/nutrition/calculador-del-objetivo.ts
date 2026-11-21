/**
 * WP-OBJETIVO-Y-CALCULADOR (DL-186) · El calculador del objetivo en el website, sin React: lo escrito, los datos que usa,
 * lo que se manda a la API y los textos. La cuenta es la del dominio (`calcularObjetivo`), la misma que rehace la API al
 * guardar: lo que se ve y lo que queda no pueden decir cosas distintas.
 *
 * - **La referencia:** una toma de Antropometría (si la persona la habilitó) o datos a mano, con su fecha. Lo que la toma no
 *   tiene se puede escribir a mano y queda marcado así.
 * - **Ubica, no califica:** sin colores de juicio ni palabras de evaluación. Lo que falta se dice: no se inventa.
 * - **El «%» siempre con su base y su número** («28,3 % de las 1.725 kcal»).
 * - **RP-05 (WP-RECORRIDO-PLAN-PULIDO, DL-188):** «De dónde sale» lo dice la fuente («Toma del 17/11» o «Cargado a mano»),
 *   sin un texto libre; la proteína y la grasa, dentro de `LIMITES_DE_LOS_GRAMOS_POR_KG` (fuera de ellos se avisa y no se
 *   propone); y el ajuste se elige como «Mantener», «Déficit» o «Superávit», con la cantidad siempre positiva. Por dentro
 *   se guarda con su signo, como pide el contrato.
 */
import {
  calcularObjetivo,
  declaracionCompartible,
  FICHA_DEL_METODO_DE_REPOSO,
  leerNumero,
  LIMITES_DE_LOS_GRAMOS_POR_KG,
  NOMBRE_DEL_DATO,
  numero,
  TOPES_DEL_CALCULADOR,
  type DatoDelCalculo,
  type DatosUsados,
  type MetodoDeReposo,
  type ObjetivoConReferenciaRequest,
  type ParametrosDelCalculo,
  type ReferenciaEntrada,
  type ResultadoDelCalculo,
  type ReferenciaYCalculo,
  type EstadoDeLaReferencia,
  type DatosDelCalculoDeLaEvaluacion,
  type TomaDeReferencia,
} from '@be/domain';

export interface ValoresDelCalculador {
  /** `toma`: una toma registrada. `a-mano`: los datos escritos. */
  readonly fuente: 'toma' | 'a-mano';
  readonly evaluationId: string;
  /** La corrida de la toma para la masa libre de grasa; vacío si no se usa. */
  readonly corridaId: string;
  readonly tallaAgregada: string;
  readonly edadAgregada: string;
  readonly fecha: string;
  readonly peso: string;
  readonly talla: string;
  readonly edad: string;
  readonly masaLibre: string;
  readonly sexo: '' | 'FEMALE' | 'MALE';
  readonly metodo: MetodoDeReposo;
  readonly factor: string;
  readonly conFactorDeDescanso: boolean;
  readonly factorDeDescanso: string;
  /** RP-05: el sentido del ajuste. La cantidad (`valorDelAjuste`) va siempre sin signo. */
  readonly ajuste: 'mantener' | 'deficit' | 'superavit';
  readonly unidadDelAjuste: 'KCAL' | 'PERCENT';
  readonly valorDelAjuste: string;
  readonly conMacros: boolean;
  readonly base: 'BODY_WEIGHT' | 'LEAN_MASS';
  readonly proteinaPorKg: string;
  readonly grasaPorKg: string;
  /**
   * DL-189 (EI-D15): si el calculador arrancó con lo que registró la evaluación, de qué día es, qué datos tomó de ella y el
   * nivel de actividad que dijo (se muestra junto al factor: BE no elige el factor). `null` o ausente: nada de la evaluación.
   */
  readonly deLaEvaluacion?: { readonly dia: string; readonly usados: readonly DatoDeLaEvaluacionUsado[]; readonly actividad: string | null } | null;
}

/** Lo que el calculador puede tomar de la evaluación para arrancar. */
export type DatoDeLaEvaluacionUsado = 'peso' | 'talla' | 'edad' | 'sexo';

/** El día de un instante en la zona de la persona (`AAAA-MM-DD`), como `hoyEn`. */
const diaEnLaZona = (iso: string, zona = 'America/Argentina/Buenos_Aires'): string => new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

/**
 * El punto de partida: la toma más nueva si hay, Mifflin-St Jeor, factor 1,55 y los macros sin escribir.
 *
 * DL-189 (EI-D15) · con `evaluacion` (lo que registró la evaluación del objetivo, `datosDelCalculoEnLaEvaluacion`), arranca
 * también con lo que ella dice, sin romper «Usar la toma del…» ni «Cargar a mano»:
 * - **lo medido sale de la toma**, siempre: con una toma, la referencia sigue siendo «Usar la toma del…» (la más nueva), y
 *   de la evaluación solo se completa lo que esa toma no tiene (la talla o la edad, si la evaluación las tiene declaradas);
 * - sin toma, «Cargar a mano» arranca con el peso, la talla y la edad **declarados** en la evaluación y con su fecha. Lo
 *   que la evaluación registró de una toma no se reusa: sin toma a la vista (sin el permiso de Antropometría, o con la toma
 *   anulada) el dato medido no está disponible, y no se copia por la puerta de atrás;
 * - el sexo de la ecuación, si la evaluación lo indicó (lo eligió el profesional, DL-186);
 * - el nivel de actividad no elige el factor: se muestra a su lado, en palabras.
 */
export function calculadorInicial(tomas: readonly TomaDeReferencia[], hoy: string, evaluacion: DatosDelCalculoDeLaEvaluacion | null = null): ValoresDelCalculador {
  const toma = tomas[0];
  const masa = toma?.composition.find((c) => c.leanMassKg !== null);
  const declarado = (d: { readonly valor: number; readonly medido: boolean } | null | undefined): string => (d && !d.medido ? String(d.valor).replace('.', ',') : '');
  const peso = toma ? '' : declarado(evaluacion?.pesoKg);
  const talla = toma ? '' : declarado(evaluacion?.tallaCm);
  const edad = toma ? '' : declarado(evaluacion?.edadAnios);
  const tallaAgregada = toma && toma.heightCm === null ? declarado(evaluacion?.tallaCm) : '';
  const edadAgregada = toma && toma.ageYears === null ? declarado(evaluacion?.edadAnios) : '';
  const sexo = evaluacion?.sexo ?? '';
  const usados: DatoDeLaEvaluacionUsado[] = [
    ...(peso ? (['peso'] as const) : []),
    ...(talla || tallaAgregada ? (['talla'] as const) : []),
    ...(edad || edadAgregada ? (['edad'] as const) : []),
    ...(sexo ? (['sexo'] as const) : []),
  ];
  const dia = evaluacion ? diaEnLaZona(evaluacion.occurredAt) : null;
  // «Fecha de los datos»: la de la evaluación, si de ella salen el peso, la talla o la edad (nunca posterior a hoy).
  const fecha = dia && (peso || talla || edad) && dia <= hoy ? dia : hoy;
  return {
    fuente: toma ? 'toma' : 'a-mano',
    evaluationId: toma?.evaluationId ?? '',
    corridaId: masa?.calculationId ?? '',
    tallaAgregada,
    edadAgregada,
    fecha,
    peso,
    talla,
    edad,
    masaLibre: '',
    sexo,
    metodo: 'MIFFLIN_ST_JEOR',
    factor: '1,55',
    conFactorDeDescanso: false,
    factorDeDescanso: '1,4',
    ajuste: 'mantener',
    unidadDelAjuste: 'KCAL',
    valorDelAjuste: '',
    conMacros: true,
    base: 'BODY_WEIGHT',
    proteinaPorKg: '',
    grasaPorKg: '',
    deLaEvaluacion: dia && (usados.length > 0 || evaluacion?.nivelDeActividad) ? { dia, usados, actividad: evaluacion?.nivelDeActividad ?? null } : null,
  };
}

/** DL-189: lo que tomó de la evaluación, en una frase: «Arrancó con lo que registró la evaluación del 21/11: la talla y el sexo de la ecuación.» */
export function loQueTomoDeLaEvaluacion(d: NonNullable<ValoresDelCalculador['deLaEvaluacion']>): string | null {
  if (d.usados.length === 0) return null;
  const nombres = d.usados.map((u) => ({ peso: 'el peso', talla: 'la talla', edad: 'la edad', sexo: 'el sexo de la ecuación' })[u]);
  const lista = nombres.length <= 1 ? nombres.join('') : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`;
  return `Arrancó con lo que registró la evaluación del ${diaYMes(d.dia)}: ${lista}. Revisalo antes de usarlo.`;
}

/** DL-189: el nivel de actividad de la evaluación, junto al factor: BE no elige el factor por él. */
export const actividadDeLaEvaluacion = (d: NonNullable<ValoresDelCalculador['deLaEvaluacion']>): string | null => (d.actividad ? `Nivel de actividad en la evaluación del ${diaYMes(d.dia)}: ${d.actividad}.` : null);

/** Un número escrito, o `null` si está vacío o no se entiende (nunca cero ni NaN). */
const num = (s: string): number | null => leerNumero(s);
const enRango = (x: number | null, t: { readonly minimo: number; readonly maximo: number }): number | null => (x !== null && x >= t.minimo && x <= t.maximo ? x : null);

/** Los datos que usa el cálculo, con su origen: los de la toma, o lo escrito a mano (que vale). */
export function datosUsados(v: ValoresDelCalculador, tomas: readonly TomaDeReferencia[]): DatosUsados {
  const T = TOPES_DEL_CALCULADOR;
  if (v.fuente === 'a-mano') {
    const aMano = (x: number | null) => (x === null ? null : { value: x, origin: 'MANUAL' as const });
    const masa = num(v.masaLibre);
    return {
      weightKg: aMano(enRango(num(v.peso), T.pesoKg)),
      heightCm: aMano(enRango(num(v.talla), T.tallaCm)),
      ageYears: aMano(enRango(num(v.edad), T.edadAnios)),
      // RP-05: de dónde sale lo dice el origen («a mano»): ya no hay una nota escrita.
      leanMassKg: masa !== null && masa > 0 && masa <= T.pesoKg.maximo ? { value: masa, origin: 'MANUAL', method: null, bodyFatValue: null } : null,
    };
  }
  const toma = tomas.find((t) => t.evaluationId === v.evaluationId);
  if (!toma) return { weightKg: null, heightCm: null, ageYears: null, leanMassKg: null };
  const deLaToma = (x: number | null) => (x === null ? null : { value: x, origin: 'MEASUREMENT' as const });
  const oAMano = (x: number | null, escrito: string, t: { readonly minimo: number; readonly maximo: number }) => {
    if (x !== null) return deLaToma(x);
    const e = enRango(num(escrito), t);
    return e === null ? null : { value: e, origin: 'MANUAL' as const };
  };
  const corrida = toma.composition.find((c) => c.calculationId === v.corridaId && c.leanMassKg !== null) ?? null;
  return {
    weightKg: deLaToma(toma.weightKg),
    heightCm: oAMano(toma.heightCm, v.tallaAgregada, T.tallaCm),
    ageYears: oAMano(toma.ageYears, v.edadAgregada, T.edadAnios),
    leanMassKg: corrida ? { value: corrida.leanMassKg as number, origin: corrida.unit === 'kg' ? 'CALCULATION' : 'FROM_BODY_FAT', method: corrida.label, bodyFatValue: corrida.unit === '%' ? corrida.value : null } : null,
  };
}

/** Lo que tiene de malo cada campo escrito, por su clave; vacío si todo se entiende y está en sus topes. */
export function problemasDelCalculador(v: ValoresDelCalculador, hoy: string): Readonly<Record<string, string>> {
  const T = TOPES_DEL_CALCULADOR;
  const p: Record<string, string> = {};
  const revisar = (clave: string, texto: string, t: { readonly minimo: number; readonly maximo: number }, unidad: string, obligatorio = false) => {
    if (texto.trim() === '') {
      if (obligatorio) p[clave] = 'Escribilo para calcular.';
      return;
    }
    const x = num(texto);
    if (x === null) p[clave] = 'Escribí un número, por ejemplo 1,55.';
    else if (x < t.minimo || x > t.maximo) p[clave] = `Entre ${numero(t.minimo)} y ${numero(t.maximo)} ${unidad}.`.replace(/ \.$/, '.');
  };
  if (v.fuente === 'a-mano') {
    if (!v.fecha) p.fecha = 'Elegí la fecha de los datos.';
    else if (v.fecha > hoy) p.fecha = 'La fecha no puede ser posterior a hoy.';
    revisar('peso', v.peso, T.pesoKg, 'kg');
    revisar('talla', v.talla, T.tallaCm, 'cm');
    revisar('edad', v.edad, T.edadAnios, 'años');
    revisar('masaLibre', v.masaLibre, { minimo: 1, maximo: T.pesoKg.maximo }, 'kg');
    const peso = num(v.peso);
    const masa = num(v.masaLibre);
    if (!p.masaLibre && masa !== null && peso !== null && masa >= peso) p.masaLibre = 'La masa libre de grasa es menor que el peso.';
  } else {
    if (!v.evaluationId) p.toma = 'Elegí una toma.';
    revisar('tallaAgregada', v.tallaAgregada, T.tallaCm, 'cm');
    revisar('edadAgregada', v.edadAgregada, T.edadAnios, 'años');
  }
  revisar('factor', v.factor, T.factor, '', true);
  if (v.conFactorDeDescanso) revisar('factorDeDescanso', v.factorDeDescanso, T.factor, '', true);
  if (v.ajuste !== 'mantener') {
    // RP-05: la cantidad va sin signo; el sentido ya está elegido.
    const texto = v.valorDelAjuste.trim();
    const x = num(texto);
    const t = v.unidadDelAjuste === 'KCAL' ? T.ajusteKcal : T.ajustePorcentaje;
    if (texto === '') p.valorDelAjuste = v.unidadDelAjuste === 'KCAL' ? 'Escribí cuánto, por ejemplo 300.' : 'Escribí cuánto, por ejemplo 15.';
    else if (/^[−+-]/.test(texto)) p.valorDelAjuste = `Escribí la cantidad sin signo: «${v.ajuste === 'deficit' ? 'Déficit' : 'Superávit'}» ya dice para qué lado.`;
    else if (x === null) p.valorDelAjuste = 'Escribí un número, por ejemplo 300.';
    else if (!(x > 0)) p.valorDelAjuste = 'Escribí una cantidad mayor que cero, o elegí «Mantener».';
    else if (x > t.maximo) p.valorDelAjuste = v.unidadDelAjuste === 'KCAL' ? `Hasta ${numero(t.maximo)} kcal por día.` : `Hasta ${numero(t.maximo)}, en porcentaje del gasto total.`;
  }
  if (v.conMacros) {
    // RP-05: para un cálculo nuevo valen los límites con nombre del dominio (los topes del contrato son más anchos).
    const L = LIMITES_DE_LOS_GRAMOS_POR_KG;
    revisar('proteinaPorKg', v.proteinaPorKg, L.proteina, 'g/kg', true);
    revisar('grasaPorKg', v.grasaPorKg, L.grasa, 'g/kg', true);
  }
  return p;
}

/** RP-05: el ajuste como lo guarda el contrato, con su signo: un déficit de 300 es −300; mantener, ninguno. */
export function ajusteEscrito(v: Pick<ValoresDelCalculador, 'ajuste' | 'unidadDelAjuste' | 'valorDelAjuste'>): ParametrosDelCalculo['adjustment'] {
  if (v.ajuste === 'mantener') return null;
  const x = num(v.valorDelAjuste.trim());
  if (x === null || !(x > 0)) return null;
  return { kind: v.unidadDelAjuste, value: v.ajuste === 'deficit' ? -x : x } as ParametrosDelCalculo['adjustment'];
}

/** Los parámetros, si todo lo necesario se entiende; `null` si falta algo (los problemas lo dicen en su campo). */
export function parametrosDelCalculador(v: ValoresDelCalculador, hoy: string): ParametrosDelCalculo | null {
  const p = problemasDelCalculador(v, hoy);
  const claves = ['factor', 'factorDeDescanso', 'valorDelAjuste', 'proteinaPorKg', 'grasaPorKg'];
  if (claves.some((c) => p[c])) return null;
  return {
    sex: v.sexo === '' ? null : v.sexo,
    restingMethod: v.metodo,
    activity: { factor: num(v.factor) as number, restDayFactor: v.conFactorDeDescanso ? (num(v.factorDeDescanso) as number) : null },
    adjustment: ajusteEscrito(v),
    macros: v.conMacros ? { base: v.base, proteinPerKg: num(v.proteinaPorKg) as number, fatPerKg: num(v.grasaPorKg) as number } : null,
  };
}

/** El cálculo en vivo, o `null` si los parámetros todavía no se entienden. */
export function calculoEnVivo(v: ValoresDelCalculador, tomas: readonly TomaDeReferencia[], hoy: string): { readonly datos: DatosUsados; readonly parametros: ParametrosDelCalculo; readonly resultado: ResultadoDelCalculo } | null {
  const parametros = parametrosDelCalculador(v, hoy);
  if (!parametros) return null;
  const datos = datosUsados(v, tomas);
  return { datos, parametros, resultado: calcularObjetivo(datos, parametros) };
}

/** La referencia como la pide la API, o `null` si todavía no se puede mandar. */
export function referenciaDelCalculador(v: ValoresDelCalculador, hoy: string): ReferenciaEntrada | null {
  const p = problemasDelCalculador(v, hoy);
  if (v.fuente === 'toma') {
    if (!v.evaluationId || p.tallaAgregada || p.edadAgregada) return null;
    return { source: 'RECORDED', evaluationId: v.evaluationId, leanMassCalculationId: v.corridaId || null, additions: { heightCm: num(v.tallaAgregada), ageYears: num(v.edadAgregada) } };
  }
  if (p.fecha || p.peso || p.talla || p.edad || p.masaLibre) return null;
  // RP-05: «De dónde sale» lo dice la fuente (a mano); el contrato no pide la nota, y no se manda.
  return { source: 'MANUAL', measuredOn: v.fecha, weightKg: num(v.peso), heightCm: num(v.talla), ageYears: num(v.edad), leanMassKg: num(v.masaLibre), leanMassNote: null };
}

/** El cuerpo de API-OBC-02: el objetivo escrito, la referencia y, si se calculó, los parámetros. */
export function pedidoConReferencia(objective: ObjetivoConReferenciaRequest['objective'], v: ValoresDelCalculador, hoy: string, conCalculo: boolean): ObjetivoConReferenciaRequest | null {
  const reference = referenciaDelCalculador(v, hoy);
  if (!reference) return null;
  const parameters = conCalculo ? parametrosDelCalculador(v, hoy) : null;
  if (conCalculo && !parameters) return null;
  return { objective, reference, parameters };
}

// ─── Textos ──────────────────────────────────────────────────────────────────────────────────────

/** «10/11» desde «2026-11-10». */
export const diaYMes = (fecha: string): string => `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;
const kcal = (x: number) => `${numero(x, 0)} kcal`;

/** De dónde salen los datos, en una frase: «con la toma del 10/11» o «con datos a mano del 10/11». */
export function fuenteEnPalabras(v: Pick<ValoresDelCalculador, 'fuente' | 'fecha' | 'evaluationId'>, tomas: readonly TomaDeReferencia[]): string {
  if (v.fuente === 'a-mano') return v.fecha ? `con datos a mano del ${diaYMes(v.fecha)}` : 'con datos a mano';
  const t = tomas.find((x) => x.evaluationId === v.evaluationId);
  return t ? `con la toma del ${diaYMes(t.measuredOn)}` : 'con una toma de Antropometría';
}

/** RP-05: de dónde salen los datos, para el renglón «De dónde sale»: «Toma del 17/11» o «Cargado a mano». */
export function deDondeSale(v: Pick<ValoresDelCalculador, 'fuente' | 'evaluationId'>, tomas: readonly TomaDeReferencia[]): string {
  if (v.fuente === 'a-mano') return 'Cargado a mano';
  const t = tomas.find((x) => x.evaluationId === v.evaluationId);
  return t ? `Toma del ${diaYMes(t.measuredOn)}` : 'Una toma de Antropometría';
}

/** Un dato usado, con su origen: «68 kg (toma)», «162 cm (a mano)». */
export function datoEnPalabras(d: { readonly value: number; readonly origin: string } | null, unidad: string): string {
  if (!d) return 'Sin indicar';
  return `${numero(d.value, 2)} ${unidad} · ${d.origin === 'MANUAL' ? 'a mano' : 'de la toma'}`;
}

/** La masa libre de grasa usada, con su método o su cuenta. */
export function masaEnPalabras(m: DatosUsados['leanMassKg'], pesoKg: number | null = null): string {
  if (!m) return 'Sin indicar';
  if (m.origin === 'FROM_BODY_FAT') return `${numero(m.value, 1)} kg · el peso menos la grasa: ${numero(m.bodyFatValue ?? 0, 1)} % de los ${numero(pesoKg ?? 0, 2)} kg (${m.method ?? 'de la toma'})`;
  if (m.origin === 'CALCULATION') return `${numero(m.value, 1)} kg · ${m.method ?? 'de la toma'}`;
  return `${numero(m.value, 1)} kg · a mano${m.method ? ` (${m.method})` : ''}`;
}

/** Lo que falta para un método, en una frase: «Falta la talla y el sexo de la ecuación.» */
export function faltaEnPalabras(faltan: readonly DatoDelCalculo[]): string {
  const nombres = faltan.map((f) => NOMBRE_DEL_DATO[f]);
  const lista = nombres.length <= 1 ? nombres.join('') : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`;
  return `Para este método falta ${lista}. Cargalo a mano o elegí otro método: BE no lo inventa.`;
}

/** El gasto en reposo en una línea, o por qué no hay. */
export function reposoEnPalabras(r: ResultadoDelCalculo['resting']): string {
  if (r.state === 'CALCULATED') return `${kcal(r.kcal)} por día`;
  if (r.state === 'MISSING_DATA') return faltaEnPalabras(r.missing);
  return r.reason;
}

/** La parte de la energía con su base y su número: «28,3 % de las 1.725 kcal». */
export const parteEnPalabras = (parte: number, base: number): string => `${numero(parte, 1)} % de las ${numero(base, 0)} kcal`;

export const PROBLEMA_DEL_CALCULO: Readonly<Record<ResultadoDelCalculo['issues'][number], string>> = {
  LEAN_MASS_MISSING: 'Los macros por masa libre de grasa necesitan ese dato: elegí una corrida de la toma, escribilo a mano o usá el peso.',
  WEIGHT_MISSING: 'Los macros por kilo necesitan el peso.',
  CARBOHYDRATE_NEGATIVE: 'La proteína y la grasa ya pasan la energía del día: los carbohidratos quedan en 0 g. Revisá los g/kg o el ajuste.',
  ENERGY_NOT_POSITIVE: 'Con este ajuste, la energía del día queda en cero o menos: el déficit es mayor que el gasto total. Revisá el ajuste o el factor.',
};

/**
 * La declaración para el objetivo: solo el método. El objetivo lo ven también los profesionales con los que la persona
 * comparte Nutrición; la toma, el factor, el ajuste y los g/kg quedan con el cálculo, detrás del permiso de Antropometría.
 */
export function declaracionParaElObjetivo(parametros: ParametrosDelCalculo): string {
  return declaracionCompartible(parametros);
}

/** Lo que se lleva al objetivo: las kcal y los gramos del día (el de entrenamiento si hay dos). */
export function valoresParaElObjetivo(resultado: ResultadoDelCalculo): { readonly kcal: string; readonly proteina: string; readonly carbohidratos: string; readonly grasas: string } | null {
  // Sin energía positiva no hay nada que llevar: el objetivo pide kcal mayores que cero.
  if (!resultado.energy || !(resultado.energy.day > 0)) return null;
  const m = resultado.macros?.day ?? null;
  const t = (x: number) => String(x);
  return { kcal: t(resultado.energy.day), proteina: m ? t(m.protein.grams) : '', carbohidratos: m ? t(m.carbohydrate.grams) : '', grasas: m ? t(m.fat.grams) : '' };
}

/**
 * La ficha del método en una línea, para la lista, con para quién sirve (RP-09): «Mifflin-St Jeor (1990) · adultos en
 * general · usa peso, talla, edad y sexo».
 */
export function fichaEnUnaLinea(metodo: MetodoDeReposo): string {
  const f = FICHA_DEL_METODO_DE_REPOSO[metodo];
  const usa = f.necesita.map((d) => NOMBRE_DEL_DATO[d].replace(/^(el|la) /, '').replace('sexo de la ecuación', 'sexo'));
  return `${f.nombre} · ${f.paraQuien} · usa ${usa.length <= 1 ? usa.join('') : `${usa.slice(0, -1).join(', ')} y ${usa.at(-1)}`}`;
}

// ─── Lo guardado con el objetivo (API-OBC-03) ────────────────────────────────────────────────────

/** Los avisos de cómo está hoy la referencia, en neutro. Lo guardado no cambia. */
export function avisosDeLaReferencia(c: ReferenciaYCalculo | null, a: EstadoDeLaReferencia): string[] {
  const avisos: string[] = [];
  if (a.newerMeasurement) avisos.push(`Hay una toma más nueva, del ${diaYMes(a.newerMeasurement.measuredOn)}. El objetivo sigue con lo que se usó; para usarla, escribí una versión nueva del objetivo.`);
  if (a.referenceState === 'CHANGED') avisos.push('Un dato de la toma usada se corrigió o se anuló después. El objetivo sigue con los valores que se usaron.');
  if (c?.anthropometryWithheld) avisos.push('La referencia es una toma de Antropometría que hoy no tenés habilitada: sus datos y el cálculo no se muestran. Queda el método.');
  return avisos;
}

/**
 * Lo que dice el formulario cuando API-OBC-02 rechaza la referencia. `MEASUREMENT_NOT_AVAILABLE` es el mismo para «sin
 * permiso», «no existe» y «es de otro» (OBC-D02): el texto no elige entre ellos. `null` si el rechazo es otro.
 */
export function falloDeLaReferencia(r: { readonly ok: boolean; readonly tipo?: string; readonly issues?: readonly { readonly code: string }[] }): string | null {
  if (r.ok || r.tipo !== 'API') return null;
  const codigos = new Set((r.issues ?? []).map((i) => i.code));
  if (codigos.has('MEASUREMENT_NOT_AVAILABLE')) return 'La toma elegida ya no se puede usar de referencia. Quitá el calculador, abrilo de nuevo y elegí otra toma o los datos a mano.';
  if (codigos.has('DATE_IN_FUTURE')) return 'La fecha de los datos a mano no puede ser posterior a hoy.';
  if (codigos.has('LEAN_MASS_NOT_BELOW_WEIGHT')) return 'La masa libre de grasa tiene que ser menor que el peso.';
  return null;
}

export const COPY_CALCULADOR = {
  // RP-05: el título es la acción; los datos pueden venir de una toma o escribirse a mano.
  titulo: 'Calcular',
  resumen: 'Opcional. Estima el gasto con el método que elijas, a la vista, y propone las kcal y los gramos del día. Vos decidís qué guardar.',
  estimacion: 'Es una estimación: las ecuaciones describen poblaciones, no a esta persona. Sirve de punto de partida para tu criterio.',
  referencia: 'Datos de referencia',
  deUnaToma: 'Una toma de Antropometría',
  aMano: 'Datos a mano',
  sinAntropometria: 'La persona no te habilitó Antropometría: los datos van a mano.',
  sinTomas: 'Todavía no registraste tomas de Antropometría con esta persona: los datos van a mano.',
  toma: 'Toma',
  usarLaToma: (fecha: string) => `Usar la toma del ${fecha}`,
  cargarAMano: 'Cargar a mano',
  otraToma: 'Otra toma',
  hacerUnaAntropometria: 'Hacer una antropometría',
  seAbreEnOtraPestana: '(se abre en otra pestaña)',
  releerLasTomas: 'Volver a leer las tomas',
  deDondeSale: 'De dónde sale',
  masaLibre: 'Masa libre de grasa',
  sinMasa: 'No usar masa libre de grasa',
  loQueFalta: 'Lo que la toma no tiene, a mano (opcional)',
  sexo: 'Sexo de la ecuación',
  sexoAyuda: 'Las ecuaciones se publicaron por sexo. Lo elegís vos: no es un dato de la toma.',
  mujer: 'Mujer',
  hombre: 'Hombre',
  metodo: 'Método del gasto en reposo',
  poblacionDelMetodo: 'Para quién se publicó',
  formula: 'Fórmula',
  conLosDatos: 'Con los datos',
  fuente: 'Fuente',
  reposo: 'Gasto en reposo',
  factor: 'Factor de actividad',
  factorAyuda: 'Multiplica el gasto en reposo. Las franjas de la FAO/OMS/UNU (2004): 1,40 a 1,69 sedentario o liviano; 1,70 a 1,99 activo o moderado; 2,00 a 2,40 vigoroso.',
  queEsElFactor: 'Qué es el factor de actividad',
  otroFactor: 'Usar otro factor para el día de descanso',
  factorDeDescanso: 'Factor del día de descanso',
  mismoFactor: 'Sin otro factor, el día de descanso usa el del día.',
  total: 'Gasto total',
  ajuste: 'Ajuste',
  mantener: 'Mantener',
  deficit: 'Déficit',
  superavit: 'Superávit',
  enKcal: 'kcal por día',
  enPorcentaje: 'porcentaje del gasto total',
  unidadDelAjuste: 'En',
  cuanto: (u: 'KCAL' | 'PERCENT') => (u === 'KCAL' ? 'Cuánto (kcal por día)' : 'Cuánto (porcentaje del gasto total)'),
  energia: 'Energía del día',
  macros: 'Macros',
  conMacros: 'Calcular los macros (proteína y grasa en g/kg, carbohidratos por diferencia)',
  base: 'Por kilo de',
  delPeso: 'el peso',
  deLaMasa: 'la masa libre de grasa',
  proteina: 'Proteína (g/kg)',
  grasa: 'Grasa (g/kg)',
  entreLimites: (l: { readonly minimo: number; readonly maximo: number }) => `De ${numero(l.minimo, 1)} a ${numero(l.maximo, 1)}, de a 0,1.`,
  diaDeEntrenamiento: 'Día de entrenamiento',
  diaDeDescanso: 'Día de descanso',
  elDia: 'El día',
  usar: 'Usar estos valores en el objetivo',
  usados: 'Listo: las kcal, los gramos y el método quedaron en el objetivo. Revisalos antes de guardar. La toma, el factor, el ajuste y los g/kg quedan con el cálculo, solo para vos: el objetivo lo pueden ver otros profesionales con los que la persona comparte Nutrición.',
  seGuardaCon: (fuente: string) => `Al guardar, el objetivo queda vinculado a la referencia (${fuente}) y al cálculo.`,
  sinCalculo: 'Completá los datos de arriba para ver el cálculo.',
} as const;
