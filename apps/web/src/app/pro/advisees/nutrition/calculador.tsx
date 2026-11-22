'use client';

/**
 * WP-OBJETIVO-Y-CALCULADOR (DL-186; pedido de Dirección del 2026-11-19) · El calculador de macros en «Nueva versión de
 * objetivo», solo para el profesional. La lógica y los textos están en `calculador-del-objetivo.ts`.
 *
 * - La referencia: una toma de Antropometría (API-OBC-01, solo si la persona la habilitó) o datos a mano con su fecha.
 * - El gasto en reposo con el método a la vista: la fórmula con letras y con los números, los datos con su origen y la
 *   cita. Si falta un dato, lo dice. El factor de actividad (con otro para el día de descanso), el ajuste y los macros.
 * - «Usar estos valores» lleva las kcal, los gramos y la declaración del método al objetivo: el profesional los revisa y
 *   guarda. El objetivo sigue siendo su decisión, con su fundamento.
 * - Es una estimación, y se dice sin alarmismo. Ubica, no califica.
 * - RP-05 (WP-RECORRIDO-PLAN-PULIDO, DL-188): «Usar la toma del…» o «Cargar a mano»; «Hacer una antropometría», opcional,
 *   si el profesional tiene Antropometría con la persona; «De dónde sale», de la fuente; los textos largos (la población,
 *   las franjas del factor, las citas) detrás de «?» o «Fuente», con la fórmula y la cuenta a la vista; el desplegable del
 *   método entero; el día de descanso en su renglón; los g/kg con sus límites y paso de 0,1; el ajuste con su sentido y la
 *   cantidad sin signo; «Usar estos valores en el objetivo», primario, al pie. RP-09: cada método dice para quién sirve.
 */
import {
  CITA_DEL_FACTOR_DE_ACTIVIDAD,
  FACTORES_DE_ACTIVIDAD,
  FICHA_DEL_METODO_DE_REPOSO,
  LIMITES_DE_LOS_GRAMOS_POR_KG,
  METODOS_DE_REPOSO,
  notaDeLaPoblacion,
  numero,
  type DatosDelCalculoDeLaEvaluacion,
  type MacrosDelDia,
  type MetodoDeReposo,
  type TomaDeReferencia,
} from '@be/domain';
import { useEffect, useId, useState } from 'react';
import { CampoDeFecha } from '../../../../components/campo-de-fecha';
import { Enlace } from '../../../../components/enlace';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';
import { Aviso, Campo, RenglonDelAviso } from '../../../../components/formulario';
import { api } from '../../../../lib/api';
import { hoyEn } from '../seguimiento/estado';
import {
  actividadDeLaEvaluacion,
  calculadorInicial,
  calculoEnVivo,
  loQueTomoDeLaEvaluacion,
  COPY_CALCULADOR as C,
  datoEnPalabras,
  declaracionParaElObjetivo,
  deDondeSale,
  diaYMes,
  faltaEnPalabras,
  fichaEnUnaLinea,
  masaEnPalabras,
  parteEnPalabras,
  PROBLEMA_DEL_CALCULO,
  problemasDelCalculador,
  reposoEnVivo,
  valoresParaElObjetivo,
  type ValoresDelCalculador,
} from './calculador-del-objetivo';
import { CantidadDelMacro } from './cantidad-del-macro';
import { useNutricion } from './nutricion';

export type TomasDelCalculador = { readonly estado: 'leyendo' } | { readonly estado: 'falla' } | { readonly estado: 'listo'; readonly habilitada: boolean; readonly tomas: readonly TomaDeReferencia[] };

/** API-OBC-01: las tomas que se pueden usar, leídas una vez al abrir el calculador. */
export function useTomasDelCalculador(): { tomas: TomasDelCalculador; releer: () => void } {
  const { token, asesoradoId } = useNutricion();
  const [tomas, setTomas] = useState<TomasDelCalculador>({ estado: 'leyendo' });
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    let vigente = true;
    setTomas({ estado: 'leyendo' });
    void api.tomasDeReferencia(token, asesoradoId).then((r) => {
      if (!vigente) return;
      setTomas(r.ok ? { estado: 'listo', habilitada: r.datos.data.anthropometryEnabled, tomas: r.datos.data.measurements } : { estado: 'falla' });
    });
    return () => {
      vigente = false;
    };
  }, [token, asesoradoId, vuelta]);
  return { tomas, releer: () => setVuelta((n) => n + 1) };
}

/** Lo que el calculador lleva al objetivo. */
export interface LoQueVaAlObjetivo {
  readonly kcal: string;
  readonly proteina: string;
  readonly carbohidratos: string;
  readonly grasas: string;
  readonly metodo: string;
}

export function CalculadorDelObjetivo({
  tomas,
  valores,
  onCambiar,
  onUsar,
  onReleer,
  evaluacion = null,
}: {
  tomas: TomasDelCalculador;
  valores: ValoresDelCalculador | null;
  onCambiar: (v: ValoresDelCalculador) => void;
  onUsar: (v: LoQueVaAlObjetivo) => void;
  onReleer: () => void;
  /** DL-189 (EI-D15): lo que registró la evaluación del objetivo, para arrancar con ello (`datosDelCalculoEnLaEvaluacion`). */
  evaluacion?: DatosDelCalculoDeLaEvaluacion | null;
}) {
  const id = useId();
  const hoy = hoyEn();
  const { asesoradoId } = useNutricion();
  const [usado, setUsado] = useState(false);
  // RP-05: después de abrir «Hacer una antropometría» (en otra pestaña), se ofrece volver a leer las tomas.
  const [fueAAntropometria, setFueAAntropometria] = useState(false);
  // Al leer las tomas, el punto de partida: la más nueva, si hay, y lo que registró la evaluación (DL-189).
  useEffect(() => {
    if (tomas.estado === 'listo' && !valores) onCambiar(calculadorInicial(tomas.habilitada ? tomas.tomas : [], hoy, evaluacion));
  }, [tomas, valores, onCambiar, hoy, evaluacion]);

  if (tomas.estado === 'leyendo') return <p className="nota" role="status">Leyendo las tomas de Antropometría…</p>;
  if (tomas.estado === 'falla')
    return (
      <p className="nota">
        No se pudieron leer las tomas de Antropometría.{' '}
        <button type="button" className="boton boton--enlace" onClick={onReleer}>
          Reintentar
        </button>
      </p>
    );
  if (!valores) return null;
  const lista = tomas.habilitada ? tomas.tomas : [];
  const c = (cambio: Partial<ValoresDelCalculador>) => {
    setUsado(false);
    onCambiar({ ...valores, ...cambio });
  };
  const problemas = problemasDelCalculador(valores, hoy);
  const vivo = calculoEnVivo(valores, lista, hoy);
  const toma = lista.find((t) => t.evaluationId === valores.evaluationId) ?? null;
  const masNueva = lista[0] ?? null;
  const ficha = FICHA_DEL_METODO_DE_REPOSO[valores.metodo];
  const err = (clave: string) => problemas[clave] ?? null;
  const paraElObjetivo = vivo ? valoresParaElObjetivo(vivo.resultado) : null;
  // RP-19 (DL-188): el gasto en reposo no depende del factor, el ajuste ni los g/kg: se ve aunque esos no se entiendan.
  const reposo = reposoEnVivo(valores, lista);
  const notaDeEdad = notaDeLaPoblacion(valores.metodo, { ageYears: reposo.datos.ageYears?.value ?? null });
  const puedeDecirLaPoblacion = [1, 999].some((ageYears) => notaDeLaPoblacion(valores.metodo, { ageYears }) !== null);
  // RP-19: lo de abajo (el gasto total y los macros) tiene su lugar aunque falte el cálculo: «—» en vez de irse.
  const conDescanso = valores.conFactorDeDescanso;
  const kcalEnReposo = reposo.resting.state === 'CALCULATED' ? numero(reposo.resting.kcal, 0) : '—';
  const totales = vivo?.resultado.totals && vivo.resultado.energy ? { totals: vivo.resultado.totals, energy: vivo.resultado.energy } : null;
  const macrosDelCalculo = vivo?.resultado.macros ?? null;
  const problemasDelCalculo = vivo?.resultado.issues.map((i) => PROBLEMA_DEL_CALCULO[i]).join(' ') ?? '';
  const porQueNoSeUsa = usado ? null : !vivo ? C.sinCalculo : !paraElObjetivo ? C.sinKcalParaLlevar : null;
  const usarLaToma = (t: TomaDeReferencia) => c({ fuente: 'toma', evaluationId: t.evaluationId, corridaId: t.composition.find((x) => x.leanMassKg !== null)?.calculationId ?? '' });
  const L = LIMITES_DE_LOS_GRAMOS_POR_KG;
  const numeroConPunto = (s: string) => s.replace(',', '.');
  const factorDeReferencia = (escrito: string) => FACTORES_DE_ACTIVIDAD.find((f) => numero(f.valor, 2) === escrito || String(f.valor).replace('.', ',') === escrito)?.valor ?? '';

  return (
    // RP-19 (DL-188): `avisos-con-lugar`: el aviso de cada campo, que aparece mientras se escribe, tiene su renglón.
    <div className="calculador avisos-con-lugar" data-calculador>
      <p className="nota">{C.estimacion}</p>

      {/* ─── La referencia (RP-05: «Usar la toma del…» precarga; si no hay toma, a mano) ─── */}
      <fieldset className="grupo" data-referencia-del-calculo>
        <legend>{C.referencia}</legend>
        {!tomas.habilitada ? <p className="nota">{C.sinAntropometria}</p> : lista.length === 0 ? <p className="nota">{C.sinTomas}</p> : null}
        {/* DL-189 (EI-D15): de dónde arrancó lo que no es de la toma. */}
        {valores.deLaEvaluacion && loQueTomoDeLaEvaluacion(valores.deLaEvaluacion) ? (
          <p className="nota" data-arranco-con-la-evaluacion>
            {loQueTomoDeLaEvaluacion(valores.deLaEvaluacion)}
          </p>
        ) : null}
        {masNueva ? (
          <fieldset className="segmentos">
            <legend className="visualmente-oculto">{C.referencia}</legend>
            <div className="segmentos__fila">
              <label className="segmento">
                <input type="radio" name={`${id}-fuente`} checked={valores.fuente === 'toma'} onChange={() => usarLaToma(toma ?? masNueva)} />
                {C.usarLaToma(diaYMes((toma ?? masNueva).measuredOn))}
              </label>
              <label className="segmento">
                <input type="radio" name={`${id}-fuente`} checked={valores.fuente === 'a-mano'} onChange={() => c({ fuente: 'a-mano' })} />
                {C.cargarAMano}
              </label>
            </div>
          </fieldset>
        ) : null}
        {/* RP-05: a la toma, solo si el profesional tiene Antropometría con esta persona. Opcional, en otra pestaña: lo
            escrito en el objetivo no se pierde. */}
        {tomas.habilitada ? (
          <p className="calculador__hacer-una-toma">
            {/* Un `Enlace` (el `Link` de Next), no un ancla suelta: con `target="_blank"` el navegador abre la otra pestaña, que
                reanuda la sesión con su cookie (DL-147), y esta no se recarga (scripts/enlaces-del-website.test.cjs). */}
            <Enlace href={`/pro/advisees/anthropometry?id=${encodeURIComponent(asesoradoId)}&vista=preparacion`} target="_blank" rel="noopener" onClick={() => setFueAAntropometria(true)} data-hacer-una-antropometria>
              {C.hacerUnaAntropometria}
              <span className="visualmente-oculto"> {C.seAbreEnOtraPestana}</span>
            </Enlace>
            {fueAAntropometria ? (
              <>
                {' · '}
                <button type="button" className="boton boton--enlace" onClick={onReleer}>
                  {C.releerLasTomas}
                </button>
              </>
            ) : null}
          </p>
        ) : null}
        {valores.fuente === 'toma' && toma ? (
          <>
            {lista.length > 1 ? (
              <div className="campo campo--corto">
                <label htmlFor={`${id}-toma`}>{C.otraToma}</label>
                <select id={`${id}-toma`} value={valores.evaluationId} onChange={(e) => usarLaToma(lista.find((x) => x.evaluationId === e.target.value) ?? toma)}>
                  {lista.map((t, i) => (
                    <option key={t.evaluationId} value={t.evaluationId}>
                      Toma del {diaYMes(t.measuredOn)}
                      {i === 0 ? ' · la más nueva' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <dl className="datos datos--en-fila" data-datos-de-la-toma>
              <div>
                <dt>Peso</dt>
                <dd>{toma.weightKg === null ? 'Sin indicar' : `${numero(toma.weightKg, 2)} kg`}</dd>
              </div>
              <div>
                <dt>Talla</dt>
                <dd>{toma.heightCm === null ? 'Sin indicar' : `${numero(toma.heightCm, 2)} cm`}</dd>
              </div>
              <div>
                <dt>Edad</dt>
                <dd>{toma.ageYears === null ? 'Sin indicar' : `${numero(toma.ageYears, 0)} años`}</dd>
              </div>
              <div>
                <dt>{C.deDondeSale}</dt>
                <dd data-de-donde-sale>{deDondeSale(valores, lista)}</dd>
              </div>
            </dl>
            {toma.composition.length > 0 ? (
              <div className="campo">
                <label htmlFor={`${id}-masa`}>{C.masaLibre}</label>
                <select id={`${id}-masa`} value={valores.corridaId} onChange={(e) => c({ corridaId: e.target.value })}>
                  <option value="">{C.sinMasa}</option>
                  {toma.composition
                    .filter((x) => x.leanMassKg !== null)
                    .map((x) => (
                      <option key={x.calculationId} value={x.calculationId}>
                        {x.unit === 'kg' ? `${numero(x.leanMassKg as number, 1)} kg · ${x.label}` : `${numero(x.leanMassKg as number, 1)} kg · el peso menos la grasa de ${x.label}: ${numero(x.value, 1)} % de los ${numero(toma.weightKg ?? 0, 2)} kg`}
                      </option>
                    ))}
                </select>
              </div>
            ) : null}
            {toma.heightCm === null || toma.ageYears === null ? (
              <fieldset className="grupo grupo--anidado">
                <legend>{C.loQueFalta}</legend>
                <div className="fila-de-dato">
                  {toma.heightCm === null ? <Campo id={`${id}-talla-agregada`} etiqueta="Talla (cm)" inputMode="decimal" value={valores.tallaAgregada} onChange={(e) => c({ tallaAgregada: e.target.value })} error={err('tallaAgregada')} /> : null}
                  {toma.ageYears === null ? <Campo id={`${id}-edad-agregada`} etiqueta="Edad (años)" inputMode="decimal" value={valores.edadAgregada} onChange={(e) => c({ edadAgregada: e.target.value })} error={err('edadAgregada')} /> : null}
                </div>
              </fieldset>
            ) : null}
          </>
        ) : (
          <>
            <CampoDeFecha id={`${id}-fecha`} etiqueta="Fecha de los datos" max={hoy} hoy={hoy} value={valores.fecha} onChange={(fecha) => c({ fecha })} error={err('fecha')} required />
            <div className="fila-de-dato">
              <Campo id={`${id}-peso`} etiqueta="Peso (kg)" inputMode="decimal" value={valores.peso} onChange={(e) => c({ peso: e.target.value })} error={err('peso')} />
              <Campo id={`${id}-talla`} etiqueta="Talla (cm)" inputMode="decimal" value={valores.talla} onChange={(e) => c({ talla: e.target.value })} error={err('talla')} />
              <Campo id={`${id}-edad`} etiqueta="Edad (años)" inputMode="decimal" value={valores.edad} onChange={(e) => c({ edad: e.target.value })} error={err('edad')} />
              <Campo id={`${id}-masa-a-mano`} etiqueta="Masa libre de grasa (kg, opcional)" inputMode="decimal" value={valores.masaLibre} onChange={(e) => c({ masaLibre: e.target.value })} error={err('masaLibre')} />
            </div>
            <p className="nota" data-de-donde-sale>
              {C.deDondeSale}: {deDondeSale(valores, lista)}
            </p>
          </>
        )}
      </fieldset>

      {/* ─── El método (RP-05: el desplegable entero; RP-09: para quién sirve cada uno) ─── */}
      <fieldset className="grupo" data-metodo-del-calculo>
        <legend>{C.metodo}</legend>
        <div className="campo calculador__metodo-elegido">
          <span className="calculador__rotulo">
            <label htmlFor={`${id}-metodo`}>{C.metodo}</label>
            <ExplicacionAPedido nombre={C.poblacionDelMetodo}>{ficha.poblacion}</ExplicacionAPedido>
            <ExplicacionAPedido boton="Fuente" nombre={`${C.fuente} de ${ficha.nombre}`}>
              {ficha.cita}
            </ExplicacionAPedido>
          </span>
          <select id={`${id}-metodo`} value={valores.metodo} onChange={(e) => c({ metodo: e.target.value as MetodoDeReposo })}>
            {METODOS_DE_REPOSO.map((m) => (
              <option key={m} value={m}>
                {fichaEnUnaLinea(m)}
              </option>
            ))}
          </select>
        </div>
        {ficha.necesita.includes('sex') ? (
          <fieldset className="segmentos" data-sexo-de-la-ecuacion>
            <legend>{C.sexo}</legend>
            <div className="segmentos__fila">
              <label className="segmento">
                <input type="radio" name={`${id}-sexo`} checked={valores.sexo === 'FEMALE'} onChange={() => c({ sexo: 'FEMALE' })} /> {C.mujer}
              </label>
              <label className="segmento">
                <input type="radio" name={`${id}-sexo`} checked={valores.sexo === 'MALE'} onChange={() => c({ sexo: 'MALE' })} /> {C.hombre}
              </label>
            </div>
            <ExplicacionAPedido nombre={C.sexo}>{C.sexoAyuda}</ExplicacionAPedido>
          </fieldset>
        ) : null}
        {/* RP-19 (DL-188): siempre, con los tres renglones: la fórmula, la cuenta (o lo que falta) y el resultado (o «—»).
            Antes se iba con un factor que no se entendía, y el campo del factor, que está abajo, subía mientras se escribía. */}
        <div className="calculador__metodo" data-gasto-en-reposo={reposo.resting.state}>
          <dl className="datos">
            <div>
              <dt>{C.formula}</dt>
              <dd>{reposo.resting.state === 'CALCULATED' ? reposo.resting.equation : '—'}</dd>
            </div>
            <div>
              <dt>{C.conLosDatos}</dt>
              {reposo.resting.state === 'CALCULATED' ? (
                <dd data-formula-aplicada>{reposo.resting.applied} kcal</dd>
              ) : (
                <dd className="nota" data-falta-un-dato>
                  {reposo.resting.state === 'MISSING_DATA' ? faltaEnPalabras(reposo.resting.missing) : reposo.resting.reason}
                </dd>
              )}
            </div>
            <div>
              <dt>{C.reposo}</dt>
              <dd>
                {reposo.resting.state === 'CALCULATED' ? (
                  <strong>
                    <CantidadDelMacro macro="kcal" cifra={numero(reposo.resting.kcal, 0)} /> por día
                  </strong>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
          {/* La nota de la población (ten Haaf con el peso, fuera de los 18 a 35 años): su renglón se reserva con los métodos
              que la pueden decir, aunque todavía no la digan; con los demás, no ocupa lugar. */}
          {puedeDecirLaPoblacion ? (
            <RenglonDelAviso data-fuera-de-la-poblacion={notaDeEdad ? '' : undefined}>{notaDeEdad}</RenglonDelAviso>
          ) : null}
          <details className="calculador__datos">
            <summary>Los datos que usa, con su origen</summary>
            <dl className="datos">
              <div>
                <dt>Peso</dt>
                <dd>{datoEnPalabras(reposo.datos.weightKg, 'kg')}</dd>
              </div>
              <div>
                <dt>Talla</dt>
                <dd>{datoEnPalabras(reposo.datos.heightCm, 'cm')}</dd>
              </div>
              <div>
                <dt>Edad</dt>
                <dd>{datoEnPalabras(reposo.datos.ageYears, 'años')}</dd>
              </div>
              <div>
                <dt>{C.masaLibre}</dt>
                <dd>{masaEnPalabras(reposo.datos.leanMassKg, reposo.datos.weightKg?.value ?? null)}</dd>
              </div>
            </dl>
          </details>
        </div>
      </fieldset>

      {/* ─── Actividad y ajuste (RP-05: el día de descanso, en su propio renglón, al lado del factor del día) ─── */}
      <fieldset className="grupo" data-actividad-del-calculo>
        <legend>{C.factor}</legend>
        <p className="calculador__a-pedido">
          <ExplicacionAPedido nombre={C.queEsElFactor}>{C.factorAyuda}</ExplicacionAPedido>
          <ExplicacionAPedido boton="Fuente" nombre={`${C.fuente} de los niveles de actividad`}>
            {CITA_DEL_FACTOR_DE_ACTIVIDAD}
          </ExplicacionAPedido>
        </p>
        {/* DL-189 (EI-D15): lo que dijo la evaluación del nivel de actividad, en palabras; el factor lo elige el profesional. */}
        {valores.deLaEvaluacion && actividadDeLaEvaluacion(valores.deLaEvaluacion) ? (
          <p className="nota" data-actividad-de-la-evaluacion>
            {actividadDeLaEvaluacion(valores.deLaEvaluacion)}
          </p>
        ) : null}
        <div className="calculador__factores">
          <fieldset className="grupo grupo--anidado" data-factor-del-dia>
            <legend>{vivo?.parametros.activity.restDayFactor != null || valores.conFactorDeDescanso ? C.diaDeEntrenamiento : C.elDia}</legend>
            <div className="fila-de-dato">
              <div className="campo calculador__referencias">
                <label htmlFor={`${id}-factores`}>Factores de referencia</label>
                <select id={`${id}-factores`} value={factorDeReferencia(valores.factor)} onChange={(e) => e.target.value && c({ factor: e.target.value.replace('.', ',') })}>
                  <option value="">Otro (escribilo al lado)</option>
                  {FACTORES_DE_ACTIVIDAD.map((f) => (
                    <option key={f.valor} value={f.valor}>
                      {f.texto}
                    </option>
                  ))}
                </select>
              </div>
              <Campo id={`${id}-factor`} etiqueta="Factor del día" inputMode="decimal" value={valores.factor} onChange={(e) => c({ factor: e.target.value })} error={err('factor')} />
            </div>
          </fieldset>
          <fieldset className="grupo grupo--anidado" data-factor-del-descanso>
            <legend>{C.diaDeDescanso}</legend>
            <label className="opcion-en-linea">
              <input type="checkbox" checked={valores.conFactorDeDescanso} onChange={(e) => c({ conFactorDeDescanso: e.target.checked })} /> {C.otroFactor}
            </label>
            {valores.conFactorDeDescanso ? (
              <div className="fila-de-dato">
                <div className="campo calculador__referencias">
                  <label htmlFor={`${id}-factores-descanso`}>Factores de referencia</label>
                  <select id={`${id}-factores-descanso`} value={factorDeReferencia(valores.factorDeDescanso)} onChange={(e) => e.target.value && c({ factorDeDescanso: e.target.value.replace('.', ',') })}>
                    <option value="">Otro (escribilo al lado)</option>
                    {FACTORES_DE_ACTIVIDAD.map((f) => (
                      <option key={f.valor} value={f.valor}>
                        {f.texto}
                      </option>
                    ))}
                  </select>
                </div>
                <Campo id={`${id}-factor-descanso`} etiqueta={C.factorDeDescanso} inputMode="decimal" value={valores.factorDeDescanso} onChange={(e) => c({ factorDeDescanso: e.target.value })} error={err('factorDeDescanso')} />
              </div>
            ) : (
              <p className="nota">{C.mismoFactor}</p>
            )}
          </fieldset>
        </div>
        {/* RP-05: el sentido se elige; la cantidad va siempre sin signo. Por dentro se guarda con su signo. */}
        <div className="calculador__ajuste">
          <fieldset className="segmentos" data-sentido-del-ajuste>
            <legend>{C.ajuste}</legend>
            <div className="segmentos__fila">
              {(['mantener', 'deficit', 'superavit'] as const).map((s) => (
                <label key={s} className="segmento">
                  <input type="radio" name={`${id}-ajuste`} checked={valores.ajuste === s} onChange={() => c({ ajuste: s })} />
                  {s === 'mantener' ? C.mantener : s === 'deficit' ? C.deficit : C.superavit}
                </label>
              ))}
            </div>
          </fieldset>
          {valores.ajuste !== 'mantener' ? (
            <div className="fila-de-dato">
              <div className="campo campo--corto">
                <label htmlFor={`${id}-unidad-ajuste`}>{C.unidadDelAjuste}</label>
                <select id={`${id}-unidad-ajuste`} value={valores.unidadDelAjuste} onChange={(e) => c({ unidadDelAjuste: e.target.value as ValoresDelCalculador['unidadDelAjuste'] })}>
                  <option value="KCAL">{C.enKcal}</option>
                  <option value="PERCENT">{C.enPorcentaje}</option>
                </select>
              </div>
              <Campo id={`${id}-valor-ajuste`} etiqueta={C.cuanto(valores.unidadDelAjuste)} inputMode="decimal" value={valores.valorDelAjuste} onChange={(e) => c({ valorDelAjuste: e.target.value })} error={err('valorDelAjuste')} />
            </div>
          ) : null}
        </div>
        {/* RP-19 (DL-188): el gasto total tiene su lugar aunque falte el cálculo: «—» en cada celda, no una tabla que se va
            y vuelve debajo de los campos que se están escribiendo. */}
        <table className="tabla calculador__tabla calculador__tabla--total" data-gasto-total={totales ? 'listo' : 'sin-calculo'}>
          <colgroup>
            <col className="calculador__col-dia" />
            <col className="calculador__col-cuenta" />
            <col className="calculador__col-energia" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Día</th>
              <th scope="col">{C.total}</th>
              <th scope="col">{C.energia}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">{conDescanso ? C.diaDeEntrenamiento : C.elDia}</th>
              <td>{totales && vivo ? `${kcalEnReposo} × ${numero(vivo.parametros.activity.factor, 2)} = ${numero(totales.totals.day, 0)} kcal` : '—'}</td>
              <td>
                <strong>{totales ? <CantidadDelMacro macro="kcal" cifra={numero(totales.energy.day, 0)} /> : '—'}</strong>
              </td>
            </tr>
            {conDescanso ? (
              <tr>
                <th scope="row">{C.diaDeDescanso}</th>
                <td>
                  {totales && vivo && totales.totals.restDay !== null
                    ? `${kcalEnReposo} × ${numero(vivo.parametros.activity.restDayFactor ?? 0, 2)} = ${numero(totales.totals.restDay, 0)} kcal`
                    : '—'}
                </td>
                <td>
                  <strong>{totales && totales.energy.restDay !== null ? <CantidadDelMacro macro="kcal" cifra={numero(totales.energy.restDay, 0)} /> : '—'}</strong>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </fieldset>

      {/* ─── Los macros (RP-05: g/kg con límites con nombre y paso de 0,1) ─── */}
      <fieldset className="grupo" data-macros-del-calculo>
        <legend>{C.macros}</legend>
        <label className="opcion-en-linea">
          <input type="checkbox" checked={valores.conMacros} onChange={(e) => c({ conMacros: e.target.checked })} /> {C.conMacros}
        </label>
        {valores.conMacros ? (
          <>
            <fieldset className="segmentos">
              <legend>{C.base}</legend>
              <div className="segmentos__fila">
                <label className="segmento">
                  <input type="radio" name={`${id}-base`} checked={valores.base === 'BODY_WEIGHT'} onChange={() => c({ base: 'BODY_WEIGHT' })} /> {C.delPeso}
                </label>
                <label className="segmento">
                  <input type="radio" name={`${id}-base`} checked={valores.base === 'LEAN_MASS'} onChange={() => c({ base: 'LEAN_MASS' })} /> {C.deLaMasa}
                </label>
              </div>
            </fieldset>
            <div className="fila-de-dato">
              <Campo
                id={`${id}-proteina`}
                etiqueta={C.proteina}
                type="number"
                inputMode="decimal"
                min={L.proteina.minimo}
                max={L.proteina.maximo}
                step={L.proteina.paso}
                ayuda={C.entreLimites(L.proteina)}
                value={numeroConPunto(valores.proteinaPorKg)}
                onChange={(e) => c({ proteinaPorKg: e.target.value })}
                error={err('proteinaPorKg')}
              />
              <Campo
                id={`${id}-grasa`}
                etiqueta={C.grasa}
                type="number"
                inputMode="decimal"
                min={L.grasa.minimo}
                max={L.grasa.maximo}
                step={L.grasa.paso}
                ayuda={C.entreLimites(L.grasa)}
                value={numeroConPunto(valores.grasaPorKg)}
                onChange={(e) => c({ grasaPorKg: e.target.value })}
                error={err('grasaPorKg')}
              />
            </div>
            {/* RP-19: la nota y las tablas de los macros, siempre que se pidan; sin cálculo, con «—» en cada celda. */}
            <p className="nota">
              Por kilo de{' '}
              {valores.base === 'LEAN_MASS'
                ? `masa libre de grasa${macrosDelCalculo ? ` (${numero(macrosDelCalculo.baseKg, 1)} kg)` : ''}`
                : `peso${macrosDelCalculo ? ` (${numero(macrosDelCalculo.baseKg, 2)} kg)` : ''}`}
              ; los carbohidratos, por diferencia, con 4, 4 y 9 kcal por gramo.
            </p>
            <TablaDeMacros titulo={conDescanso ? C.diaDeEntrenamiento : C.elDia} m={macrosDelCalculo?.day ?? null} />
            {conDescanso ? <TablaDeMacros titulo={C.diaDeDescanso} m={macrosDelCalculo?.restDay ?? null} /> : null}
          </>
        ) : null}
        {/* RP-19: lo que el cálculo no pudo hacer, en su renglón reservado (antes, párrafos que aparecían arriba del botón). */}
        <RenglonDelAviso role="status" data-problema-del-calculo={problemasDelCalculo ? '' : undefined}>
          {problemasDelCalculo}
        </RenglonDelAviso>
      </fieldset>

      {/* RP-05: el paso que sigue, primario y al pie del resultado, a la derecha. RP-19: por qué está apagado, en el renglón
          reservado a su izquierda (antes, «Completá los datos de arriba» aparecía arriba del botón y lo corría). Lo que
          responde al toque va debajo del botón: no lo mueve. */}
      <div className="acciones calculador__usar">
        <RenglonDelAviso juntoAlBoton anunciar data-por-que-no-se-usa>
          {porQueNoSeUsa}
        </RenglonDelAviso>
        <button
          type="button"
          className="boton boton--primario"
          data-usar-el-calculo
          disabled={!vivo || !paraElObjetivo}
          onClick={() => {
            if (!vivo || !paraElObjetivo) return;
            onUsar({ ...paraElObjetivo, metodo: declaracionParaElObjetivo(vivo.parametros) });
            setUsado(true);
          }}
        >
          {C.usar}
        </button>
      </div>
      {usado ? <Aviso tipo="exito">{C.usados}</Aviso> : null}
    </div>
  );
}

const SIN_DATO = '—';

/**
 * Los macros de un día: gramos (con su ícono, RP-07), g/kg, kcal y la parte de la energía con su base y su número. RP-19:
 * sin cálculo (`m` en `null`), la misma tabla con «—» en cada celda y columnas fijas: lo que llega no la reacomoda.
 */
function TablaDeMacros({ titulo, m }: { titulo: string; m: MacrosDelDia | null }) {
  const filas = [
    ['Proteínas', 'protein', m?.protein ?? null],
    ['Carbohidratos', 'carbohydrate', m?.carbohydrate ?? null],
    ['Grasas', 'fat', m?.fat ?? null],
  ] as const;
  return (
    <table className="tabla calculador__tabla calculador__tabla--macros" data-macros-del-dia={m ? 'listo' : 'sin-calculo'}>
      <caption>
        {titulo} · {m ? <CantidadDelMacro macro="kcal" cifra={numero(m.energyKcal, 0)} /> : SIN_DATO}
      </caption>
      <colgroup>
        <col className="calculador__col-macro" />
        <col className="calculador__col-g" />
        <col className="calculador__col-g" />
        <col className="calculador__col-g" />
        <col className="calculador__col-parte" />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">Macro</th>
          <th scope="col">g</th>
          <th scope="col">g/kg</th>
          <th scope="col">kcal</th>
          <th scope="col">Parte de la energía</th>
        </tr>
      </thead>
      <tbody>
        {filas.map(([nombre, macro, x]) => (
          <tr key={nombre}>
            <th scope="row">{nombre}</th>
            <td>{x ? <CantidadDelMacro macro={macro} cifra={numero(x.grams, 0)} /> : SIN_DATO}</td>
            <td>{x ? numero(x.perKg, 2) : SIN_DATO}</td>
            <td>{x ? numero(x.kcal, 0) : SIN_DATO}</td>
            <td>{x && m ? parteEnPalabras(x.energyShare, m.energyKcal) : SIN_DATO}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
