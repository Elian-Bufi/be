/**
 * RP-17 (DL-190) · Kerr (1988), cinco componentes, en una toma: las cinco masas calculadas, su suma (el peso
 * estructurado) y la diferencia con el peso medido, en kg y en % del peso, que es como Kerr valida el modelo (tabla 5.1
 * de la tesis: en 1669 personas, la suma dio en promedio 1,1 kg, un 1,6 %, más que el peso medido).
 *
 * La suma **no es un método**: es la cuenta, a la vista, de los resultados ya registrados (cada uno con su método y su
 * precisión), así que suma los valores publicados y lo dice. Lo medido primero: el peso de la toma; lo inferido, con el
 * nombre de su ecuación. Una diferencia es una resta con signo: no califica (DL-111, decisión 11).
 */
import { aplicarPrecision } from './antropometria';
import type { EvaluacionAntropometricaApi } from './contratos-antropometria';
import type { CorridaDeCalculoApi } from './contratos-calculo';
import { corridaVigente } from './lamina';

/** Las cinco masas, en el orden de la tesis, con la métrica que da cada método. */
export const COMPONENTES_DE_KERR: readonly { readonly metrica: string; readonly nombre: string }[] = [
  { metrica: 'masa-piel-kerr', nombre: 'Piel' },
  { metrica: 'masa-adiposa-kerr', nombre: 'Adiposa' },
  { metrica: 'masa-muscular-kerr', nombre: 'Muscular' },
  { metrica: 'masa-osea-kerr', nombre: 'Ósea' },
  { metrica: 'masa-residual-kerr', nombre: 'Residual' },
];

export interface ComponenteDeKerr {
  readonly metrica: string;
  readonly nombre: string;
  /** El resultado vigente de la toma, en kg, o `null` si todavía no se calculó. */
  readonly valor: number | null;
  readonly metodo: string | null;
  readonly corridaId: string | null;
}

export interface FraccionamientoDeKerr {
  readonly componentes: readonly ComponenteDeKerr[];
  /** Los nombres de las masas que faltan calcular para tener la suma. */
  readonly faltan: readonly string[];
  /** El peso vigente de la toma, en kg; `null` si no se midió (o no en kg: BE no convierte en silencio). */
  readonly pesoMedido: number | null;
  /** La suma de las cinco masas, en kg, con un decimal: solo si están las cinco. */
  readonly pesoEstructurado: number | null;
  /** Peso estructurado − peso medido, en kg, con un decimal: positiva si la suma da más que la balanza. */
  readonly diferenciaKg: number | null;
  /** La diferencia en % del peso medido, con un decimal. */
  readonly diferenciaPorcentaje: number | null;
}

type Medicion = EvaluacionAntropometricaApi['measurements'][number];
const UN_DECIMAL = { decimales: 1, modo: 'MEDIO_ARRIBA' } as const;

/**
 * El fraccionamiento de una toma, o `null` si la toma no tiene ninguna masa de Kerr calculada. Si una masa está calculada
 * dos veces (la piel con la ecuación de hombres y con la de mujeres), cuenta la última que se registró, como hace la APK
 * con «Tu última toma»; las dos siguen a la vista en los resultados.
 */
export function fraccionamientoDeKerr(corridas: readonly CorridaDeCalculoApi[], evaluacionId: string, mediciones: readonly Medicion[]): FraccionamientoDeKerr | null {
  const deLaToma = corridas.filter((c) => c.evaluationId === evaluacionId && corridaVigente(c) && c.result.magnitude.unit === 'kg');
  const componentes = COMPONENTES_DE_KERR.map(({ metrica, nombre }): ComponenteDeKerr => {
    const ultima = deLaToma.filter((c) => c.result.metric === metrica).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
    return { metrica, nombre, valor: ultima?.result.magnitude.value ?? null, metodo: ultima?.methodName ?? null, corridaId: ultima?.calculationRunId ?? null };
  });
  if (componentes.every((c) => c.valor === null)) return null;
  const peso = mediciones.find((m) => m.metric === 'peso' && m.condition === 'EFFECTIVE' && m.effectiveMagnitude?.unit === 'kg')?.effectiveMagnitude?.value ?? null;
  const faltan = componentes.filter((c) => c.valor === null).map((c) => c.nombre);
  const suma = faltan.length === 0 ? componentes.reduce((t, c) => t + (c.valor ?? 0), 0) : null;
  const pesoEstructurado = suma === null ? null : aplicarPrecision(suma, UN_DECIMAL);
  const diferencia = suma !== null && peso !== null && peso > 0 ? suma - peso : null;
  return {
    componentes,
    faltan,
    pesoMedido: peso,
    pesoEstructurado,
    diferenciaKg: diferencia === null ? null : aplicarPrecision(diferencia, UN_DECIMAL),
    diferenciaPorcentaje: diferencia === null || peso === null ? null : aplicarPrecision((diferencia / peso) * 100, UN_DECIMAL),
  };
}
