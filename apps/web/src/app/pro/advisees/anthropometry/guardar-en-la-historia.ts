'use client';

/**
 * DL-200 (AR-05) · Guardar en la historia los resultados de un método que tienen su método en el catálogo (API-CAL-01), de
 * una vez: así entran en la evolución, en «Mi evolución» de la APK y pueden quedar como referencia. Los pasos que el
 * catálogo no tiene (la densidad, las masas de Jackson y Pollock, el fraccionamiento con otra grasa) se muestran en la
 * toma, calculados en el momento desde lo medido, y no se guardan (AR-D02).
 *
 * Cada corrida es un pedido aparte, con su propia clave de idempotencia (la del intento lógico de ese método en esa toma,
 * en `ClavesPorPedido`): un reintento después de una respuesta incierta reusa la clave de ese pedido aunque en el medio se
 * hayan mandado otros, y no calcula dos veces. Lo que ya tiene una corrida vigente en la toma, o ya se guardó desde esta
 * pantalla, no se vuelve a calcular. Se usa al registrar la toma (con lo elegido en «Qué vas a calcular») y desde cada
 * método, en «Tomas».
 *
 * El sexo de la ecuación no es un dato de la toma (DL-111, decisión 5): si nadie lo eligió (ni la dirección, ni la figura
 * con que se registró, ni un resultado guardado), lo que tiene una ecuación por sexo no se guarda hasta que se elija.
 */
import { asignacionAutomatica, corridaVigente, datosDelMetodo, pasosDelResultado, sexoDelMetodo, type CorridaDeCalculoApi, type EvaluacionAntropometricaApi, type MetodoApi, type ResultadoDelMetodo } from '@be/domain';
import { api, type Resultado } from '../../../../lib/api';
import type { ClavesPorPedido } from '../../../../lib/clave-de-intento';
import { esIncierto } from '../../../../lib/intento';

/**
 * El pedido de guardar un método en una toma, con las mediciones que usa: con él se busca su clave de idempotencia. Si una
 * medición se corrige, el pedido es otro (otro cuerpo, otra clave) y se puede volver a guardar.
 */
export function pedidoDeGuardar(toma: Pick<EvaluacionAntropometricaApi, 'evaluationId' | 'measurements'>, metodo: MetodoApi): string {
  const entradas = asignacionAutomatica(datosDelMetodo(metodo, toma.measurements));
  return `${toma.evaluationId}:${metodo.methodVersionId}:${metodo.requiredInputs.map((e) => entradas[e.inputCode] ?? '').join(',')}`;
}

/**
 * Los métodos del catálogo que se pueden guardar para estos resultados: seleccionables, con datos, sin corrida vigente y
 * sin guardar ya desde esta pantalla. Con `sexoElegido` en `false`, tampoco los de una ecuación por sexo.
 */
export function metodosParaGuardar(
  resultados: readonly ResultadoDelMetodo[],
  toma: EvaluacionAntropometricaApi,
  metodos: readonly MetodoApi[],
  corridas: readonly CorridaDeCalculoApi[],
  o: { readonly claves?: ClavesPorPedido; readonly sexoElegido?: boolean } = {},
): MetodoApi[] {
  const vigentes = new Set(corridas.filter((c) => c.evaluationId === toma.evaluationId && corridaVigente(c)).map((c) => c.methodId));
  const claves = [...new Set(resultados.flatMap((r) => pasosDelResultado(r).filter((p) => p.valor !== null && p.metodoDelCatalogo).map((p) => p.metodoDelCatalogo!)))];
  return claves
    .map((clave) => metodos.find((m) => m.key === clave && m.status === 'SELECTABLE'))
    .filter((m): m is MetodoApi => !!m && !vigentes.has(m.methodId) && !o.claves?.hecho(pedidoDeGuardar(toma, m)) && (o.sexoElegido !== false || sexoDelMetodo(m) === null))
    .filter((m) => datosDelMetodo(m, toma.measurements).every((d) => d.medicion !== null));
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
  /** Una clave por pedido, compartida por todo lo que guarda en la misma pantalla. */
  claves: ClavesPorPedido;
  /** `true` si la respuesta cortó la sesión o retiró el acceso (y la pantalla ya lo atendió). */
  corta: (r: Resultado<unknown>) => boolean;
}): Promise<ResultadoDeGuardar> {
  let guardados = 0;
  const fallidos: string[] = [];
  for (const metodo of o.metodos) {
    const pedido = pedidoDeGuardar(o.toma, metodo);
    if (o.claves.hecho(pedido)) continue;
    const entradas = asignacionAutomatica(datosDelMetodo(metodo, o.toma.measurements));
    const res = await api.ejecutarCalculo(
      o.token,
      o.asesoradoId,
      { purpose: metodo.purposes[0]!, methodVersionId: metodo.methodVersionId, inputBindings: metodo.requiredInputs.map((e) => ({ inputCode: e.inputCode, sourceRef: entradas[e.inputCode] ?? '' })) },
      o.claves.actual(pedido),
    );
    o.claves.registrar(pedido, { ok: res.ok, incierto: esIncierto(res) });
    if (o.corta(res)) return { tipo: 'cortado' };
    if (res.ok) guardados += 1;
    else fallidos.push(metodo.name);
  }
  return { tipo: 'hecho', guardados, fallidos };
}
