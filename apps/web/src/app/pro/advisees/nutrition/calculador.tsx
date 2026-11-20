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
 */
import {
  CITA_DEL_FACTOR_DE_ACTIVIDAD,
  FACTORES_DE_ACTIVIDAD,
  FICHA_DEL_METODO_DE_REPOSO,
  METODOS_DE_REPOSO,
  numero,
  type MacrosDelDia,
  type MetodoDeReposo,
  type TomaDeReferencia,
} from '@be/domain';
import { useEffect, useId, useState } from 'react';
import { CampoDeFecha } from '../../../../components/campo-de-fecha';
import { Aviso, Campo } from '../../../../components/formulario';
import { api } from '../../../../lib/api';
import { hoyEn } from '../seguimiento/estado';
import {
  calculadorInicial,
  calculoEnVivo,
  COPY_CALCULADOR as C,
  datoEnPalabras,
  declaracionParaElObjetivo,
  diaYMes,
  faltaEnPalabras,
  fichaEnUnaLinea,
  masaEnPalabras,
  parteEnPalabras,
  PROBLEMA_DEL_CALCULO,
  problemasDelCalculador,
  valoresParaElObjetivo,
  type ValoresDelCalculador,
} from './calculador-del-objetivo';
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
}: {
  tomas: TomasDelCalculador;
  valores: ValoresDelCalculador | null;
  onCambiar: (v: ValoresDelCalculador) => void;
  onUsar: (v: LoQueVaAlObjetivo) => void;
  onReleer: () => void;
}) {
  const id = useId();
  const hoy = hoyEn();
  const [usado, setUsado] = useState(false);
  // Al leer las tomas, el punto de partida: la más nueva, si hay.
  useEffect(() => {
    if (tomas.estado === 'listo' && !valores) onCambiar(calculadorInicial(tomas.habilitada ? tomas.tomas : [], hoy));
  }, [tomas, valores, onCambiar, hoy]);

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
  const ficha = FICHA_DEL_METODO_DE_REPOSO[valores.metodo];
  const err = (clave: string) => problemas[clave] ?? null;
  const paraElObjetivo = vivo ? valoresParaElObjetivo(vivo.resultado) : null;

  return (
    <div className="calculador" data-calculador>
      <p className="nota">{C.estimacion}</p>

      {/* ─── La referencia ─── */}
      <fieldset className="grupo" data-referencia-del-calculo>
        <legend>{C.referencia}</legend>
        {!tomas.habilitada ? <p className="nota">{C.sinAntropometria}</p> : lista.length === 0 ? <p className="nota">{C.sinTomas}</p> : null}
        {lista.length > 0 ? (
          <div className="opciones-en-linea">
            <label className="opcion-en-linea">
              <input type="radio" name={`${id}-fuente`} checked={valores.fuente === 'toma'} onChange={() => c({ fuente: 'toma' })} /> {C.deUnaToma}
            </label>
            <label className="opcion-en-linea">
              <input type="radio" name={`${id}-fuente`} checked={valores.fuente === 'a-mano'} onChange={() => c({ fuente: 'a-mano' })} /> {C.aMano}
            </label>
          </div>
        ) : null}
        {valores.fuente === 'toma' && lista.length > 0 ? (
          <>
            <div className="campo">
              <label htmlFor={`${id}-toma`}>{C.toma}</label>
              <select
                id={`${id}-toma`}
                value={valores.evaluationId}
                onChange={(e) => {
                  const t = lista.find((x) => x.evaluationId === e.target.value);
                  c({ evaluationId: e.target.value, corridaId: t?.composition.find((x) => x.leanMassKg !== null)?.calculationId ?? '' });
                }}
              >
                {lista.map((t, i) => (
                  <option key={t.evaluationId} value={t.evaluationId}>
                    Toma del {diaYMes(t.measuredOn)}
                    {i === 0 ? ' · la más nueva' : ''}
                  </option>
                ))}
              </select>
            </div>
            {toma ? (
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
              </dl>
            ) : null}
            {toma && toma.composition.length > 0 ? (
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
            {toma && (toma.heightCm === null || toma.ageYears === null) ? (
              <fieldset className="grupo grupo--anidado">
                <legend>{C.loQueFalta}</legend>
                <div className="fila-de-dato fila-de-dato--arriba">
                  {toma.heightCm === null ? <Campo id={`${id}-talla-agregada`} etiqueta="Talla (cm)" inputMode="decimal" value={valores.tallaAgregada} onChange={(e) => c({ tallaAgregada: e.target.value })} error={err('tallaAgregada')} /> : null}
                  {toma.ageYears === null ? <Campo id={`${id}-edad-agregada`} etiqueta="Edad (años)" inputMode="decimal" value={valores.edadAgregada} onChange={(e) => c({ edadAgregada: e.target.value })} error={err('edadAgregada')} /> : null}
                </div>
              </fieldset>
            ) : null}
          </>
        ) : (
          <>
            <CampoDeFecha id={`${id}-fecha`} etiqueta="Fecha de los datos" max={hoy} hoy={hoy} value={valores.fecha} onChange={(fecha) => c({ fecha })} error={err('fecha')} required />
            <div className="fila-de-dato fila-de-dato--arriba">
              <Campo id={`${id}-peso`} etiqueta="Peso (kg)" inputMode="decimal" value={valores.peso} onChange={(e) => c({ peso: e.target.value })} error={err('peso')} />
              <Campo id={`${id}-talla`} etiqueta="Talla (cm)" inputMode="decimal" value={valores.talla} onChange={(e) => c({ talla: e.target.value })} error={err('talla')} />
              <Campo id={`${id}-edad`} etiqueta="Edad (años)" inputMode="decimal" value={valores.edad} onChange={(e) => c({ edad: e.target.value })} error={err('edad')} />
            </div>
            <div className="fila-de-dato fila-de-dato--arriba">
              <Campo id={`${id}-masa-a-mano`} etiqueta="Masa libre de grasa (kg, opcional)" inputMode="decimal" value={valores.masaLibre} onChange={(e) => c({ masaLibre: e.target.value })} error={err('masaLibre')} />
              <Campo id={`${id}-nota-masa`} etiqueta="De dónde sale (opcional)" placeholder="Bioimpedancia del consultorio" value={valores.notaDeLaMasa} onChange={(e) => c({ notaDeLaMasa: e.target.value })} maxLength={200} />
            </div>
          </>
        )}
      </fieldset>

      {/* ─── El método ─── */}
      <fieldset className="grupo" data-metodo-del-calculo>
        <legend>{C.metodo}</legend>
        <div className="fila-de-dato fila-de-dato--arriba">
          <div className="campo">
            <label htmlFor={`${id}-metodo`}>{C.metodo}</label>
            <select id={`${id}-metodo`} value={valores.metodo} onChange={(e) => c({ metodo: e.target.value as MetodoDeReposo })}>
              {METODOS_DE_REPOSO.map((m) => (
                <option key={m} value={m}>
                  {fichaEnUnaLinea(m)}
                </option>
              ))}
            </select>
          </div>
          {ficha.necesita.includes('sex') ? (
            <fieldset className="grupo grupo--anidado">
              <legend>{C.sexo}</legend>
              <p className="campo__ayuda">{C.sexoAyuda}</p>
              <div className="opciones-en-linea">
                <label className="opcion-en-linea">
                  <input type="radio" name={`${id}-sexo`} checked={valores.sexo === 'FEMALE'} onChange={() => c({ sexo: 'FEMALE' })} /> {C.mujer}
                </label>
                <label className="opcion-en-linea">
                  <input type="radio" name={`${id}-sexo`} checked={valores.sexo === 'MALE'} onChange={() => c({ sexo: 'MALE' })} /> {C.hombre}
                </label>
              </div>
            </fieldset>
          ) : null}
        </div>
        <p className="nota">{ficha.poblacion}</p>
        {vivo ? (
          <div className="calculador__metodo" data-gasto-en-reposo>
            {vivo.resultado.resting.state === 'CALCULATED' ? (
              <dl className="datos">
                <div>
                  <dt>{C.formula}</dt>
                  <dd>{vivo.resultado.resting.equation}</dd>
                </div>
                <div>
                  <dt>{C.conLosDatos}</dt>
                  <dd data-formula-aplicada>{vivo.resultado.resting.applied} kcal</dd>
                </div>
                <div>
                  <dt>{C.reposo}</dt>
                  <dd>
                    <strong>{numero(vivo.resultado.resting.kcal, 0)} kcal por día</strong>
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="nota" data-falta-un-dato>
                {vivo.resultado.resting.state === 'MISSING_DATA' ? faltaEnPalabras(vivo.resultado.resting.missing) : vivo.resultado.resting.reason}
              </p>
            )}
            <details className="calculador__datos">
              <summary>Los datos que usa, con su origen</summary>
              <dl className="datos">
                <div>
                  <dt>Peso</dt>
                  <dd>{datoEnPalabras(vivo.datos.weightKg, 'kg')}</dd>
                </div>
                <div>
                  <dt>Talla</dt>
                  <dd>{datoEnPalabras(vivo.datos.heightCm, 'cm')}</dd>
                </div>
                <div>
                  <dt>Edad</dt>
                  <dd>{datoEnPalabras(vivo.datos.ageYears, 'años')}</dd>
                </div>
                <div>
                  <dt>{C.masaLibre}</dt>
                  <dd>{masaEnPalabras(vivo.datos.leanMassKg, vivo.datos.weightKg?.value ?? null)}</dd>
                </div>
              </dl>
            </details>
            <p className="nota calculador__cita">
              <span>{C.fuente}: </span>
              {ficha.cita}
            </p>
          </div>
        ) : null}
      </fieldset>

      {/* ─── Actividad y ajuste ─── */}
      <fieldset className="grupo" data-actividad-del-calculo>
        <legend>{C.factor}</legend>
        <p className="campo__ayuda">{C.factorAyuda}</p>
        <div className="fila-de-dato fila-de-dato--arriba">
          <div className="campo">
            <label htmlFor={`${id}-factores`}>Factores de referencia</label>
            <select id={`${id}-factores`} value={FACTORES_DE_ACTIVIDAD.find((f) => numero(f.valor, 2) === valores.factor || String(f.valor).replace('.', ',') === valores.factor)?.valor ?? ''} onChange={(e) => e.target.value && c({ factor: e.target.value.replace('.', ',') })}>
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
        <label className="opcion-en-linea">
          <input type="checkbox" checked={valores.conFactorDeDescanso} onChange={(e) => c({ conFactorDeDescanso: e.target.checked })} /> {C.otroFactor}
        </label>
        {valores.conFactorDeDescanso ? (
          <Campo id={`${id}-factor-descanso`} etiqueta={C.factorDeDescanso} inputMode="decimal" value={valores.factorDeDescanso} onChange={(e) => c({ factorDeDescanso: e.target.value })} error={err('factorDeDescanso')} />
        ) : null}
        <p className="nota calculador__cita">
          <span>{C.fuente}: </span>
          {CITA_DEL_FACTOR_DE_ACTIVIDAD}
        </p>
        <div className="fila-de-dato fila-de-dato--arriba">
          <div className="campo">
            <label htmlFor={`${id}-ajuste`}>{C.ajuste}</label>
            <select id={`${id}-ajuste`} value={valores.ajuste} onChange={(e) => c({ ajuste: e.target.value as ValoresDelCalculador['ajuste'] })}>
              <option value="ninguno">{C.sinAjuste}</option>
              <option value="KCAL">{C.enKcal}</option>
              <option value="PERCENT">{C.enPorcentaje}</option>
            </select>
          </div>
          {valores.ajuste !== 'ninguno' ? (
            <Campo
              id={`${id}-valor-ajuste`}
              etiqueta={valores.ajuste === 'KCAL' ? 'Ajuste (kcal por día, − para un déficit)' : 'Ajuste (puntos, − para un déficit)'}
              inputMode="text"
              value={valores.valorDelAjuste}
              onChange={(e) => c({ valorDelAjuste: e.target.value })}
              error={err('valorDelAjuste')}
            />
          ) : null}
        </div>
        {vivo?.resultado.totals && vivo.resultado.energy ? (
          <table className="tabla calculador__tabla" data-gasto-total>
            <thead>
              <tr>
                <th scope="col">Día</th>
                <th scope="col">{C.total}</th>
                <th scope="col">{C.energia}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{vivo.resultado.totals.restDay === null ? C.elDia : C.diaDeEntrenamiento}</th>
                <td>
                  {numero(vivo.resultado.resting.state === 'CALCULATED' ? vivo.resultado.resting.kcal : 0, 0)} × {numero(vivo.parametros.activity.factor, 2)} = {numero(vivo.resultado.totals.day, 0)} kcal
                </td>
                <td>
                  <strong>{numero(vivo.resultado.energy.day, 0)} kcal</strong>
                </td>
              </tr>
              {vivo.resultado.totals.restDay !== null && vivo.resultado.energy.restDay !== null ? (
                <tr>
                  <th scope="row">{C.diaDeDescanso}</th>
                  <td>
                    {numero(vivo.resultado.resting.state === 'CALCULATED' ? vivo.resultado.resting.kcal : 0, 0)} × {numero(vivo.parametros.activity.restDayFactor ?? 0, 2)} = {numero(vivo.resultado.totals.restDay, 0)} kcal
                  </td>
                  <td>
                    <strong>{numero(vivo.resultado.energy.restDay, 0)} kcal</strong>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        ) : null}
      </fieldset>

      {/* ─── Los macros ─── */}
      <fieldset className="grupo" data-macros-del-calculo>
        <legend>{C.macros}</legend>
        <label className="opcion-en-linea">
          <input type="checkbox" checked={valores.conMacros} onChange={(e) => c({ conMacros: e.target.checked })} /> {C.conMacros}
        </label>
        {valores.conMacros ? (
          <>
            <div className="opciones-en-linea" role="radiogroup" aria-label={C.base}>
              <span className="nota">{C.base}:</span>
              <label className="opcion-en-linea">
                <input type="radio" name={`${id}-base`} checked={valores.base === 'BODY_WEIGHT'} onChange={() => c({ base: 'BODY_WEIGHT' })} /> {C.delPeso}
              </label>
              <label className="opcion-en-linea">
                <input type="radio" name={`${id}-base`} checked={valores.base === 'LEAN_MASS'} onChange={() => c({ base: 'LEAN_MASS' })} /> {C.deLaMasa}
              </label>
            </div>
            <div className="fila-de-dato fila-de-dato--arriba">
              <Campo id={`${id}-proteina`} etiqueta={C.proteina} inputMode="decimal" value={valores.proteinaPorKg} onChange={(e) => c({ proteinaPorKg: e.target.value })} error={err('proteinaPorKg')} />
              <Campo id={`${id}-grasa`} etiqueta={C.grasa} inputMode="decimal" value={valores.grasaPorKg} onChange={(e) => c({ grasaPorKg: e.target.value })} error={err('grasaPorKg')} />
            </div>
            {vivo?.resultado.macros ? (
              <>
                <p className="nota">
                  Por kilo de {vivo.resultado.macros.base === 'LEAN_MASS' ? `masa libre de grasa (${numero(vivo.resultado.macros.baseKg, 1)} kg)` : `peso (${numero(vivo.resultado.macros.baseKg, 2)} kg)`}; los carbohidratos, por diferencia, con 4, 4 y 9 kcal por gramo.
                </p>
                <TablaDeMacros titulo={vivo.resultado.macros.restDay ? C.diaDeEntrenamiento : C.elDia} m={vivo.resultado.macros.day} />
                {vivo.resultado.macros.restDay ? <TablaDeMacros titulo={C.diaDeDescanso} m={vivo.resultado.macros.restDay} /> : null}
              </>
            ) : null}
          </>
        ) : null}
        {vivo?.resultado.issues.map((i) => (
          <p key={i} className="nota" role="status" data-problema-del-calculo>
            {PROBLEMA_DEL_CALCULO[i]}
          </p>
        ))}
      </fieldset>

      {!vivo ? <p className="nota">{C.sinCalculo}</p> : null}
      <div className="acciones">
        <button
          type="button"
          className="boton boton--secundario"
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

/** Los macros de un día: gramos, g/kg, kcal y la parte de la energía con su base y su número. */
function TablaDeMacros({ titulo, m }: { titulo: string; m: MacrosDelDia }) {
  const filas = [
    ['Proteínas', m.protein],
    ['Carbohidratos', m.carbohydrate],
    ['Grasas', m.fat],
  ] as const;
  return (
    <table className="tabla calculador__tabla" data-macros-del-dia>
      <caption>
        {titulo} · {numero(m.energyKcal, 0)} kcal
      </caption>
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
        {filas.map(([nombre, x]) => (
          <tr key={nombre}>
            <th scope="row">{nombre}</th>
            <td>{numero(x.grams, 0)} g</td>
            <td>{numero(x.perKg, 2)}</td>
            <td>{numero(x.kcal, 0)}</td>
            <td>{parteEnPalabras(x.energyShare, m.energyKcal)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
