/**
 * Las lecturas de dos zonas que combinan más de un pedido: «Mi evolución» (con la búsqueda hacia atrás) e «Información»
 * (la lista junto con el estado del A3). Son funciones puras que reciben el cliente de la API, así las pruebas las
 * ejercitan con respuestas controladas (`scripts/ciclo-de-lectura.test.mjs`).
 *
 * Regla común (G5 de `ciclo-de-lectura.ts`): una falla en un pedido secundario no se disfraza de dato. Si es pasajera, de
 * acceso o de sesión, se devuelve tal cual y la pantalla la trata como corresponde. Solo un rechazo de otro tipo deja
 * lo que ya se tenía.
 */
import { clasificarFalla, type EvolucionResponse, type ListaDeSolicitudesPropiasResponse, type RequisitoDeConsentimientoDeSaludResponse, type Resultado } from '@be/domain';

type Datos = EvolucionResponse['data'];

export interface ApiDeLasZonas {
  miEvolucionAntropometrica(token: string, periodo?: { periodStart: string; periodEnd: string }): Promise<Resultado<EvolucionResponse>>;
  misSolicitudesDeFormulario(token: string): Promise<Resultado<ListaDeSolicitudesPropiasResponse>>;
  consultarRequisitoA3(token: string): Promise<Resultado<RequisitoDeConsentimientoDeSaludResponse>>;
}

const sinMediciones = (d: Datos): boolean => d.metrics.every((m) => m.series.length === 0);

/** Los 90 días civiles que terminan el día anterior a `inicio` (`AAAA-MM-DD`), para la API. */
export function periodoAnterior(inicio: string): { periodStart: string; periodEnd: string } {
  const fin = new Date(`${inicio}T12:00:00Z`);
  fin.setUTCDate(fin.getUTCDate() - 1);
  const desde = new Date(fin);
  desde.setUTCDate(desde.getUTCDate() - 89);
  return { periodStart: desde.toISOString().slice(0, 10), periodEnd: fin.toISOString().slice(0, 10) };
}

/**
 * «Mi evolución». La API mira de a 92 días como mucho. Si los últimos 90 no tienen ninguna medición, se mira hacia atrás,
 * de a 90 días y hasta un año: quien se mide cada tres o cuatro meses tiene que ver su última toma. Si tampoco hay nada,
 * queda el período actual, que dice que no hay mediciones.
 * Una falla pasajera, de acceso o de sesión en la búsqueda hacia atrás se devuelve: mostrar «sin mediciones» diría algo
 * que no se sabe, y un 403 taparía el aviso del A3.
 */
export async function leerMiEvolucion(api: ApiDeLasZonas, token: string): Promise<Resultado<Datos>> {
  const r = await api.miEvolucionAntropometrica(token);
  if (!r.ok) return r;
  let datos = r.datos.data;
  for (let i = 0; i < 3 && sinMediciones(datos); i++) {
    const anterior = await api.miEvolucionAntropometrica(token, periodoAnterior(datos.period.start));
    if (!anterior.ok && clasificarFalla(anterior) !== 'otra') return anterior;
    if (!anterior.ok) break;
    datos = anterior.datos.data;
  }
  return { ok: true, datos: sinMediciones(datos) ? r.datos.data : datos };
}

/** La lista de solicitudes y, al lado, si el A3 está vigente: se piden juntas y se confirman juntas. */
export interface ListaConA3 {
  readonly solicitudes: ListaDeSolicitudesPropiasResponse['data'];
  readonly sinA3: boolean;
}

/**
 * «Información». Solo un A3 leído y no vigente muestra el aviso. Si la consulta del A3 falla de forma pasajera, o por la
 * sesión, se devuelve esa falla: la lista sin el aviso diría que el A3 está bien sin saberlo.
 */
export async function leerLista(api: ApiDeLasZonas, token: string): Promise<Resultado<ListaConA3>> {
  const [r, requisito] = await Promise.all([api.misSolicitudesDeFormulario(token), api.consultarRequisitoA3(token)]);
  if (!requisito.ok) {
    const falla = clasificarFalla(requisito);
    if (falla === 'sesion' || falla === 'pasajera') return requisito;
  }
  if (!r.ok) return r;
  return { ok: true, datos: { solicitudes: r.datos.data, sinA3: requisito.ok && requisito.datos.data.currentConsent?.state !== 'ACTIVE' } };
}
