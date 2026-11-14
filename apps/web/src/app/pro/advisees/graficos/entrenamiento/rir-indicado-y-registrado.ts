/**
 * GR-05 · El RIR indicado y el RIR registrado a lo largo del bloque (WP-GRAFICOS fase 2, rama B; DL-174). Lo puro: las
 * sesiones de la serie elegida con lo indicado por la versión que rigió y lo registrado, el filtro «a igual carga», el
 * carril (el escalón discontinuo de cada versión y los puntos de lo registrado, en el mismo panel porque tienen la misma
 * unidad) y lo que se ve, dicho en palabras.
 *
 * - Lo indicado sale del comparador «Planificado y registrado» (API-TRN-21 y API-SER-01, GR-T14), sin una lectura nueva.
 * - Un RIR indicado como rango («RIR 1 a 2») es un segmento hueco. Si lo indicado cambia entre las sesiones de una misma
 *   versión, no se dibuja un escalón que no existió: va hueco en cada sesión (GR-T35).
 * - «A igual carga» deja solo las sesiones con exactamente esa carga **y esa unidad**: 80 kg no es 80 lb.
 * - Lo tildado sin escribir (carga rápida) son los valores del plan: va hueco y gris y no entra en lo que se describe.
 * - Se describe lo que se ve, por versión; no se resume en una cifra ni se nombra con palabras prohibidas.
 *
 * Es puro: lo prueba `apps/web/test/graficos-entrenamiento.test.mjs`.
 */
import { evolucion, numero, type ObservacionDeEvolucion } from '@be/domain';
import type { BandaDeVersion, CarrilDePuntos, EscalonDelCarril, PuntoDelCarril } from '../carriles';
import { textoDeLaMarca } from '../eje-de-fechas';
import { ESCALA_DEL_RIR } from './carga-repeticiones-y-rir';
import { mediana } from './comparador';
import { COPY_RIR_INDICADO_Y_REGISTRADO as C } from './copy';

type Carga = { readonly value: number; readonly unit: 'kg' | 'lb' };

/** Una sesión con la serie elegida: lo indicado por su versión y lo registrado, con la carga de esa misma serie. */
export interface SesionDelRir {
  readonly clave: string;
  readonly executionId: string;
  readonly fecha: string;
  /** La hora del hecho (para dos sesiones el mismo día). */
  readonly en: string;
  /** La versión del plan que ejecutó la sesión. */
  readonly planId: string;
  readonly indicado: { readonly desde: number; readonly hasta: number } | null;
  /** `null`: sin RIR escrito (nunca 0). */
  readonly registrado: number | null;
  /** Tildada sin escribir: los valores son los del plan. */
  readonly cargaRapida: boolean;
  /** La carga registrada en esa misma serie, con su unidad. */
  readonly carga: Carga | null;
  /** Dos registrados seguidos se unen solo si comparten tramo (un hueco corta). */
  readonly tramo: number | null;
}

/** Las sesiones de la serie elegida, en el orden en que ocurrieron. Una sesión sin nada indicado ni registrado no está. */
export function sesionesDelRir(observaciones: readonly ObservacionDeEvolucion[], serie: number): SesionDelRir[] {
  return evolucion(observaciones, { variable: 'rir' }, serie).flatMap((p): SesionDelRir[] => {
    const c = p.observacion.comparacion;
    const r = p.fila?.registrada;
    const delEjercicio = p.observacion.rol === 'planificado-y-registrado' || p.observacion.rol === 'por-sustitucion';
    const carga = delEjercicio && r && r.tipo === 'registrada' ? (r.serie.load ?? null) : null;
    const indicado = p.planificado.tipo === 'valor' ? { desde: p.planificado.valor, hasta: p.planificado.valor } : p.planificado.tipo === 'rango' ? { desde: p.planificado.min, hasta: p.planificado.max } : null;
    const registrado = p.registrado.tipo === 'valor' ? p.registrado.valor : null;
    if (indicado === null && registrado === null) return [];
    return [
      {
        clave: `${c.executionId}|${c.prescriptionId}`,
        executionId: c.executionId,
        fecha: c.fecha,
        en: c.ocurrio,
        planId: c.planId,
        indicado,
        registrado,
        cargaRapida: p.cargaRapida === true,
        carga: carga ? { value: carga.value, unit: carga.unit } : null,
        tramo: p.tramoRegistrado,
      },
    ];
  });
}

/** «80 kg», «175 lb»: la carga con su unidad. */
export const cargaEnPalabras = (c: Carga): string => `${numero(c.value)} ${c.unit}`;
/** La clave de una carga para «a igual carga»: el valor **y** la unidad. */
export const claveDeLaCarga = (c: Carga): string => `${c.value}|${c.unit}`;

/** Las cargas escritas de la serie, para «a igual carga»: cada una con su unidad y en cuántas sesiones está. */
export function cargasDeLaSerie(sesiones: readonly SesionDelRir[]): { readonly clave: string; readonly carga: Carga; readonly sesiones: number }[] {
  const cuenta = new Map<string, { carga: Carga; sesiones: number }>();
  for (const s of sesiones) {
    if (!s.carga || s.cargaRapida || s.registrado === null) continue;
    const clave = claveDeLaCarga(s.carga);
    const actual = cuenta.get(clave);
    cuenta.set(clave, { carga: s.carga, sesiones: (actual?.sesiones ?? 0) + 1 });
  }
  return [...cuenta.entries()]
    .map(([clave, x]) => ({ clave, carga: x.carga, sesiones: x.sesiones }))
    .sort((a, b) => (a.carga.unit === b.carga.unit ? a.carga.value - b.carga.value : a.carga.unit < b.carga.unit ? -1 : 1));
}

/** «A igual carga»: solo las sesiones con esa carga y esa unidad, escritas por la persona. `null`: todas. */
export function aIgualCarga(sesiones: readonly SesionDelRir[], clave: string | null): SesionDelRir[] {
  if (clave === null) return [...sesiones];
  return sesiones.filter((s) => s.carga !== null && !s.cargaRapida && claveDeLaCarga(s.carga) === clave);
}

/** El rótulo de la versión que regía una fecha («v3 · desde el 2/9»), de las bandas del gráfico. */
export function versionDeLaFecha(fecha: string, bandas: readonly BandaDeVersion[]): string {
  return bandas.find((b) => fecha >= b.desde && (b.hasta === null || fecha < b.hasta))?.rotulo ?? C.sinVersion(textoDeLaMarca(fecha));
}

/** «v3 · desde el 2/9» dicho en una frase: «la versión 3 (desde el 2/9)». Otro rótulo queda como está. */
export const versionEnLaFrase = (rotulo: string): string => rotulo.replace(/^v(\d+) · desde el (.+)$/, 'la versión $1 (desde el $2)');

const conMayuscula = (t: string): string => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

/** Las sesiones agrupadas por la versión que las ejecutó, en el orden en que aparecen. */
function porVersion(sesiones: readonly SesionDelRir[]): readonly (readonly SesionDelRir[])[] {
  const grupos = new Map<string, SesionDelRir[]>();
  for (const s of sesiones) grupos.set(s.planId, [...(grupos.get(s.planId) ?? []), s]);
  return [...grupos.values()];
}

/** Si lo indicado es el mismo valor en todas las sesiones de la versión que lo tienen: el escalón. */
function indicadoDeLaVersion(sesiones: readonly SesionDelRir[]): number | null {
  const indicados = sesiones.flatMap((s) => (s.indicado ? [s.indicado] : []));
  if (indicados.length === 0) return null;
  const primero = indicados[0]!;
  return primero.desde === primero.hasta && indicados.every((x) => x.desde === primero.desde && x.hasta === primero.hasta) ? primero.desde : null;
}

/**
 * El carril de GR-05: lo registrado en puntos (llenos; huecos y grises si se tildaron sin escribir) y lo indicado como un
 * escalón discontinuo por versión, del primer al último día con sesiones de esa versión. Si lo indicado cambia entre las
 * sesiones de una versión, va hueco en cada sesión. Con «a igual carga» (`filtrado`), los puntos no se unen: entre dos
 * puede haber habido sesiones con otra carga.
 */
export function carrilDelRirIndicadoYRegistrado(
  sesiones: readonly SesionDelRir[],
  o: { readonly serie: number; readonly bandas: readonly BandaDeVersion[]; readonly tardias: ReadonlySet<string>; readonly filtrado: boolean },
): CarrilDePuntos {
  const puntos: PuntoDelCarril[] = sesiones.flatMap((s): PuntoDelCarril[] =>
    s.registrado === null
      ? []
      : [
          {
            clave: `r:${s.clave}`,
            fecha: s.fecha,
            hasta: null,
            en: s.en,
            valor: s.registrado,
            rango: null,
            tramo: `r${s.tramo ?? 0}`,
            marca: s.cargaRapida ? 'HUECA_GRIS' : 'LLENA',
            tarde: o.tardias.has(s.executionId),
            lectura: C.lecturaRegistrado(numero(s.registrado), s.carga ? cargaEnPalabras(s.carga) : null),
          },
        ],
  );
  const escalones: EscalonDelCarril[] = [];
  const indicado: PuntoDelCarril[] = [];
  for (const grupo of porVersion(sesiones)) {
    const valor = indicadoDeLaVersion(grupo);
    const conIndicado = grupo.filter((s) => s.indicado !== null);
    if (conIndicado.length === 0) continue;
    if (valor !== null) {
      const primera = conIndicado[0]!;
      const ultima = conIndicado[conIndicado.length - 1]!;
      escalones.push({ desde: primera.fecha, hasta: ultima.fecha, valor, rotulo: C.escalon(numero(valor), versionDeLaFecha(primera.fecha, o.bandas)) });
      continue;
    }
    for (const s of conIndicado) {
      const i = s.indicado!;
      indicado.push({
        clave: `i:${s.clave}`,
        fecha: s.fecha,
        hasta: null,
        en: s.en,
        valor: i.desde === i.hasta ? i.desde : null,
        rango: i.desde === i.hasta ? null : { desde: i.desde, hasta: i.hasta },
        tramo: `i:${s.clave}`,
        marca: 'HUECA',
        tarde: false,
        lectura: C.lecturaIndicado(i.desde === i.hasta ? numero(i.desde) : `${numero(i.desde)} a ${numero(i.hasta)}`),
      });
    }
  }
  const lineas = loQueSeVe(sesiones, o.bandas, null);
  return {
    tipo: 'PUNTOS',
    id: 'entrenamiento.rir-indicado-y-registrado',
    nombre: C.carril(o.serie),
    unidad: 'RIR',
    metodo: null,
    indice: 0,
    puntos,
    indicado,
    escalones,
    unir: !o.filtrado,
    escala: ESCALA_DEL_RIR,
    cobertura: [...new Set(puntos.map((p) => p.fecha))].sort().map((fecha) => ({ fecha, estado: 'con' as const })),
    descripcion: lineas.join(' '),
  };
}

/**
 * Lo que se ve, en palabras, por versión: cuántas sesiones, el RIR registrado (de lo escrito por la persona) y lo
 * indicado. Con «a igual carga», además, cómo se compara la mediana del RIR registrado entre dos versiones seguidas con
 * dos sesiones o más cada una: «La misma carga (80 kg), con menos RIR registrado en v3 que en v2: mediana de 1 frente a
 * 2.» Sin flechas y sin juicios.
 */
export function loQueSeVe(sesiones: readonly SesionDelRir[], bandas: readonly BandaDeVersion[], carga: Carga | null): string[] {
  const grupos = porVersion(sesiones);
  const lineas: string[] = [];
  const medianas: { readonly version: string; readonly mediana: number | null; readonly escritas: number }[] = [];
  for (const grupo of grupos) {
    const version = versionEnLaFrase(versionDeLaFecha(grupo[0]!.fecha, bandas));
    const escritas = grupo.flatMap((s) => (s.registrado !== null && !s.cargaRapida ? [s.registrado] : []));
    const indicados = grupo.flatMap((s) => (s.indicado ? [s.indicado.desde, s.indicado.hasta] : []));
    const registrado = escritas.length > 0 ? C.deA(numero(Math.min(...escritas)), numero(Math.max(...escritas))) : null;
    const minimo = indicados.length > 0 ? Math.min(...indicados) : null;
    const maximo = indicados.length > 0 ? Math.max(...indicados) : null;
    const indicado = minimo === null || maximo === null ? null : indicadoDeLaVersion(grupo) !== null ? numero(minimo) : C.segunLaSesion(numero(minimo), numero(maximo));
    lineas.push(C.porVersion(conMayuscula(version), grupo.length, carga ? cargaEnPalabras(carga) : null, registrado, indicado));
    medianas.push({ version, mediana: mediana(escritas), escritas: escritas.length });
  }
  if (carga) {
    for (let i = 1; i < medianas.length; i++) {
      const antes = medianas[i - 1]!;
      const despues = medianas[i]!;
      if (antes.escritas < 2 || despues.escritas < 2 || antes.mediana === null || despues.mediana === null) continue;
      const enPalabras = cargaEnPalabras(carga);
      if (despues.mediana < antes.mediana) lineas.push(C.menos(enPalabras, antes.version, despues.version, numero(antes.mediana), numero(despues.mediana)));
      else if (despues.mediana > antes.mediana) lineas.push(C.mas(enPalabras, antes.version, despues.version, numero(antes.mediana), numero(despues.mediana)));
      else lineas.push(C.igual(enPalabras, antes.version, despues.version, numero(antes.mediana)));
    }
  }
  return lineas;
}
