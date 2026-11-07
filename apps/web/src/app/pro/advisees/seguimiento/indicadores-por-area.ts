/**
 * Los indicadores del Resumen por defecto, según las áreas del profesional (WP-TABLERO-ALTA-GAMA TB-25; DL-163 D-12;
 * propuesta, §18.4), sin React, para probarlos sin navegador (`apps/web/test/indicadores-por-area.test.mjs`,
 * TEST-TAG-018). Antes eran los mismos para todos (calorías, proteínas, la carga del ejercicio más registrado y el peso);
 * cada profesional mira primero lo suyo.
 *
 * | Áreas | Los cuatro |
 * |---|---|
 * | Nutrición | Calorías · Proteínas · Masa grasa (o peso) · Registros |
 * | Nutrición y Antropometría | Calorías · Proteínas · Masa grasa (o peso) · Suma de 6 pliegues |
 * | Entrenamiento | Carga de la serie principal · Series registradas · RIR · Masa libre de grasa (o peso), si la ve |
 * | Antropometría | Masa grasa (o peso) · Suma de 6 pliegues · Cintura · Perímetro del brazo flexionado |
 *
 * - **Las áreas del profesional** son las que ve en esta ficha: las lecturas del período que respondieron (TA-28). Con
 *   Nutrición y Entrenamiento juntas, que la tabla no dice, van calorías, proteínas, la carga de la serie principal y la
 *   masa grasa (o el peso) si ve Antropometría; si no, los registros (TA-28).
 * - **Lo que no hay no se inventa:** un indicador cuyo dato no está en el período no se pone (la masa grasa pasa al peso;
 *   la suma de pliegues, a los registros). Nunca se elige por la persona un valor que no existe.
 * - **«Series por semana»** es la cuenta de las series registradas del ejercicio principal, sesión a sesión: la referencia
 *   de un indicador no lleva grano (API-VAN) y el Resumen dibuja cada métrica en el suyo. La suma por semana está en
 *   «Analizar», agrupando por semana (TA-29).
 * - **Lo guardado por la cuenta manda** (`resumen-indicadores.tsx`): esto es solo lo de por defecto.
 */
import type { ReferenciaDeMetrica } from '@be/domain';
import type { Disponibles } from './series';

export const MAXIMO_DE_INDICADORES = 4;

const SIN_EJERCICIO = { exerciseKey: null, setIndex: null, unit: null } as const;
const nutricion = (id: string): ReferenciaDeMetrica => ({ metricId: `nutricion.${id}`, ...SIN_EJERCICIO });
const antropometria = (codigo: string): ReferenciaDeMetrica => ({ metricId: `antropometria.${codigo}`, ...SIN_EJERCICIO });

/** Las masas de dos compartimentos, en el orden del catálogo: Durnin y Womersley es la ecuación de pliegues de referencia. */
const MASA_GRASA = ['masa-grasa-durnin-womersley', 'masa-grasa-faulkner'] as const;
const MASA_LIBRE = ['masa-libre-de-grasa-durnin-womersley', 'masa-libre-de-grasa-faulkner'] as const;

/** La carga de la primera serie de un ejercicio, en su unidad; si no registra cargas, sus series registradas. */
export function indicadorDelEjercicio(e: NonNullable<Disponibles['ejercicios']>[number]): ReferenciaDeMetrica {
  const unidad = e.loadUnits[0];
  return unidad ? { metricId: 'entrenamiento.carga', exerciseKey: e.exerciseKey, setIndex: e.setNumbers[0] ?? 1, unit: unidad } : { metricId: 'entrenamiento.series-registradas', exerciseKey: e.exerciseKey, setIndex: null, unit: null };
}

export type AreasDelProfesional = { readonly nutricion: boolean; readonly entrenamiento: boolean; readonly antropometria: boolean };

/** Las áreas que el profesional ve en esta ficha: las lecturas del período que respondieron (TA-28). */
export const areasDe = (d: Pick<Disponibles, 'nutricion' | 'ejercicios' | 'antropometria'>): AreasDelProfesional => ({ nutricion: d.nutricion, entrenamiento: d.ejercicios !== null, antropometria: d.antropometria !== null });

/**
 * Los cuatro de por defecto, por las áreas del profesional (D-12), con lo que hay en el período. Un lugar sin su dato se
 * llena con su respaldo (la masa grasa con el peso, la suma de pliegues con los registros) o queda vacío; nunca hay dos
 * iguales.
 */
export function indicadoresPorDefecto(d: Pick<Disponibles, 'nutricion' | 'ejercicios' | 'antropometria'>): ReferenciaDeMetrica[] {
  const areas = areasDe(d);
  const hay = new Set((d.antropometria ?? []).map((m) => m.metricCode));
  const medida = (codigo: string): ReferenciaDeMetrica | null => (hay.has(codigo) ? antropometria(codigo) : null);
  const primeraQueHay = (codigos: readonly string[]): ReferenciaDeMetrica | null => codigos.map(medida).find((r): r is ReferenciaDeMetrica => r !== null) ?? null;
  const masaGrasaOPeso = primeraQueHay([...MASA_GRASA, 'peso']);
  const masaLibreOPeso = primeraQueHay([...MASA_LIBRE, 'peso']);
  const sumaDePliegues = medida('suma-6-pliegues-isak');
  const ejercicio = d.ejercicios?.[0] ?? null;
  const delEjercicio: (ReferenciaDeMetrica | null)[] = ejercicio
    ? [
        indicadorDelEjercicio(ejercicio),
        { metricId: 'entrenamiento.series-registradas', exerciseKey: ejercicio.exerciseKey, setIndex: null, unit: null },
        { metricId: 'entrenamiento.rir', exerciseKey: ejercicio.exerciseKey, setIndex: ejercicio.setNumbers[0] ?? 1, unit: null },
      ]
    : [];

  let lista: (ReferenciaDeMetrica | null)[];
  if (areas.nutricion && areas.entrenamiento) {
    lista = [nutricion('energia'), nutricion('proteinas'), delEjercicio[0] ?? null, (areas.antropometria ? masaGrasaOPeso : null) ?? nutricion('registros')];
  } else if (areas.nutricion) {
    lista = [nutricion('energia'), nutricion('proteinas'), areas.antropometria ? masaGrasaOPeso : null, (areas.antropometria ? sumaDePliegues : null) ?? nutricion('registros')];
  } else if (areas.entrenamiento) {
    lista = [...delEjercicio, areas.antropometria ? masaLibreOPeso : null];
  } else if (areas.antropometria) {
    lista = [masaGrasaOPeso, sumaDePliegues, medida('perimetro-cintura'), medida('perimetro-brazo-flexionado')];
  } else {
    lista = [];
  }
  const vistos = new Set<string>();
  return lista
    .filter((r): r is ReferenciaDeMetrica => r !== null)
    .filter((r) => {
      const clave = [r.metricId, r.exerciseKey ?? '', r.setIndex ?? '', r.unit ?? ''].join('|');
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    })
    .slice(0, MAXIMO_DE_INDICADORES);
}
