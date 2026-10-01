/**
 * DL-111 · elegir un método de cálculo para una toma. El profesional ve, antes de calcular, **qué pide** el método y
 * si esta toma lo tiene, y **qué da**. Cada dato se asigna solo a la medición vigente de la toma con la misma clave y
 * una unidad que el método admite; el profesional la puede cambiar. «Disponible» no es «admisible» (REG-06-204): la
 * API vuelve a validar todo al calcular.
 */
import type { MetodoApi } from './contratos-calculo';
import type { EvaluacionAntropometricaApi } from './contratos-antropometria';

type Medicion = EvaluacionAntropometricaApi['measurements'][number];

export interface DatoDelMetodo {
  readonly codigo: string;
  readonly metrica: string;
  readonly unidades: readonly string[];
  /** La medición asignada (vigente, con valor y en una unidad admitida), o `null` si la toma no la tiene. */
  readonly medicion: { readonly id: string; readonly valor: number; readonly unidad: string } | null;
}

/** Qué pide el método y con qué medición de la toma se cubre cada dato, si la hay. */
export function datosDelMetodo(metodo: Pick<MetodoApi, 'requiredInputs'>, mediciones: readonly Medicion[]): DatoDelMetodo[] {
  return metodo.requiredInputs.map((e) => {
    const candidata = mediciones.find(
      (m) => m.condition === 'EFFECTIVE' && m.metric === e.metric && m.effectiveMagnitude !== null && e.acceptedUnits.includes(m.effectiveMagnitude.unit),
    );
    return {
      codigo: e.inputCode,
      metrica: e.metric,
      unidades: e.acceptedUnits,
      medicion: candidata && candidata.effectiveMagnitude ? { id: candidata.measurementId, valor: candidata.effectiveMagnitude.value, unidad: candidata.effectiveMagnitude.unit } : null,
    };
  });
}

/** La asignación automática como la pide la API: dato → medición, solo los que la toma cubre. */
export function asignacionAutomatica(datos: readonly DatoDelMetodo[]): Record<string, string> {
  return Object.fromEntries(datos.filter((d) => d.medicion !== null).map((d) => [d.codigo, d.medicion!.id]));
}

/** Los métodos que esta toma cubre por completo primero; adentro de cada grupo, por categoría y nombre. Nunca por «mejor». */
export function metodosParaLaToma(metodos: readonly MetodoApi[], mediciones: readonly Medicion[]): { posibles: MetodoApi[]; faltanDatos: MetodoApi[] } {
  const orden = (a: MetodoApi, b: MetodoApi) => (a.category ?? '').localeCompare(b.category ?? '') || a.name.localeCompare(b.name, 'es');
  const seleccionables = metodos.filter((m) => m.status === 'SELECTABLE');
  const cubre = (m: MetodoApi) => datosDelMetodo(m, mediciones).every((d) => d.medicion !== null);
  return { posibles: seleccionables.filter(cubre).sort(orden), faltanDatos: seleccionables.filter((m) => !cubre(m)).sort(orden) };
}
