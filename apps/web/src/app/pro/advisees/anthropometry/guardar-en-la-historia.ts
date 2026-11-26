'use client';

/**
 * DL-200 (AR-05) · Guardar en la historia los resultados de un método que tienen su método en el catálogo (API-CAL-01), de
 * una vez: así entran en la evolución, en «Mi evolución» de la APK y pueden quedar como referencia. Los pasos que el
 * catálogo no tiene (la densidad, las masas de Jackson y Pollock, el fraccionamiento con otra grasa) se muestran en la
 * toma, calculados en el momento desde lo medido, y no se guardan (AR-D02).
 *
 * Cada corrida es un pedido aparte, con su propia clave de idempotencia (la del intento lógico de ese método en esa toma):
 * un reintento después de una respuesta incierta no calcula dos veces. Lo que ya tiene una corrida vigente en la toma no
 * se vuelve a calcular. Se usa al registrar la toma (con lo elegido en «Qué vas a calcular») y desde cada método, en
 * «Tomas».
 */
import { asignacionAutomatica, corridaVigente, datosDelMetodo, pasosDelResultado, type CorridaDeCalculoApi, type EvaluacionAntropometricaApi, type MetodoApi, type ResultadoDelMetodo } from '@be/domain';
import { api, type Resultado } from '../../../../lib/api';

interface Intento {
  actual(que?: string | null): string;
  registrar(r: Resultado<unknown>): void;
}

/** Los métodos del catálogo que se pueden guardar para estos resultados: seleccionables, con datos y sin corrida vigente. */
export function metodosParaGuardar(resultados: readonly ResultadoDelMetodo[], toma: EvaluacionAntropometricaApi, metodos: readonly MetodoApi[], corridas: readonly CorridaDeCalculoApi[]): MetodoApi[] {
  const vigentes = new Set(corridas.filter((c) => c.evaluationId === toma.evaluationId && corridaVigente(c)).map((c) => c.methodId));
  const claves = [...new Set(resultados.flatMap((r) => pasosDelResultado(r).filter((p) => p.valor !== null && p.metodoDelCatalogo).map((p) => p.metodoDelCatalogo!)))];
  return claves
    .map((clave) => metodos.find((m) => m.key === clave && m.status === 'SELECTABLE'))
    .filter((m): m is MetodoApi => !!m && !vigentes.has(m.methodId) && datosDelMetodo(m, toma.measurements).every((d) => d.medicion !== null));
}

export type ResultadoDeGuardar =
  | { readonly tipo: 'hecho'; readonly guardados: number; readonly fallidos: readonly string[] }
  /** Una respuesta que corta todo (la sesión, el acceso): la pantalla ya la atendió. */
  | { readonly tipo: 'cortado' };

export async function guardarEnLaHistoria(o: {
  token: string;
  asesoradoId: string;
  toma: EvaluacionAntropometricaApi;
  metodos: readonly MetodoApi[];
  intento: Intento;
  /** `true` si la respuesta cortó la sesión o retiró el acceso (y la pantalla ya lo atendió). */
  corta: (r: Resultado<unknown>) => boolean;
}): Promise<ResultadoDeGuardar> {
  let guardados = 0;
  const fallidos: string[] = [];
  for (const metodo of o.metodos) {
    const entradas = asignacionAutomatica(datosDelMetodo(metodo, o.toma.measurements));
    const res = await api.ejecutarCalculo(
      o.token,
      o.asesoradoId,
      { purpose: metodo.purposes[0]!, methodVersionId: metodo.methodVersionId, inputBindings: metodo.requiredInputs.map((e) => ({ inputCode: e.inputCode, sourceRef: entradas[e.inputCode] ?? '' })) },
      o.intento.actual(`${o.toma.evaluationId}:${metodo.methodVersionId}`),
    );
    o.intento.registrar(res);
    if (o.corta(res)) return { tipo: 'cortado' };
    if (res.ok) guardados += 1;
    else fallidos.push(metodo.name);
  }
  return { tipo: 'hecho', guardados, fallidos };
}
