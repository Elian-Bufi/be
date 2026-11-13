'use client';

/**
 * API-PLN-02 y API-PLN-03 en el editor y en el asistente de Nutrición (ED-34; decisión de Dirección del 2026-11-13,
 * «Último peso, guardado en gramos») · Los rangos que indica el profesional, por día tipo y por comida. La lógica y los
 * textos están en `rangos-indicados.ts`.
 *
 * - Una lista: «Todo el día» y cada comida, con su rango en una línea, y un botón para indicarlo o cambiarlo.
 * - El cuadro: por macronutriente, «g» o «g/kg», el mínimo y el máximo, y los gramos que resultan, que son los que se
 *   guardan. Con g/kg, el peso de referencia: el que usa el plan, el último registrado (solo con Antropometría habilitada)
 *   o uno a mano.
 * - Lo guardado no se mueve: un peso más nuevo, o la toma usada corregida o anulada, se avisa en neutro y se usa solo si el
 *   profesional lo elige.
 * - Los rangos se guardan aparte de la estructura (su propia revisión): no esperan al autoguardado ni lo frenan.
 */

import { MACROS_DEL_RANGO, type EscribirRangosRequest, type MacroDelRango, type RangosDelPlan } from '@be/domain';
import { useCallback, useId, useRef, useState } from 'react';
import { CampoDeFecha } from '../../../../components/campo-de-fecha';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { Aviso } from '../../../../components/formulario';
import { api } from '../../../../lib/api';
import { mensajeDeFallo } from '../../../../lib/intento';
import { hoyEn } from '../seguimiento/estado';
import {
  avisosDelPeso,
  COPY_RANGOS_INDICADOS as C,
  cuerpoParaGuardar,
  formularioDesde,
  gramosQueResultan,
  guardadoDelCuadro,
  kilosDelPeso,
  NOMBRE_DEL_MACRO,
  opcionesDelPeso,
  pesoEnPalabras,
  pesoInicial,
  pesoParaMandar,
  problemaDelCampo,
  problemasDelPesoAMano,
  problemasEnSuCampo,
  rangoEnPalabras,
  rangoEnUnaLinea,
  usaGramosPorKilo,
  type DondeVaElRango,
  type FormularioDelRango,
  type PesoElegido,
} from './rangos-indicados';

export type EstadoDeLosRangos = { readonly estado: 'leyendo' } | { readonly estado: 'falla' } | { readonly estado: 'listo'; readonly datos: RangosDelPlan };

/**
 * API-PLN-02: los rangos de la versión. Los lee `recargar`: el editor la llama con cada versión guardada de la estructura.
 * Cada pedido lleva su número: una lectura que llega después de otra más nueva, o de lo que devolvió un guardado, no pisa
 * la pantalla con una revisión vieja.
 */
export function useRangosIndicados(token: string, planId: string) {
  const [estado, setEstado] = useState<EstadoDeLosRangos>({ estado: 'leyendo' });
  const ultimo = useRef(0);
  const recargar = useCallback(async () => {
    const numero = ++ultimo.current;
    const r = await api.rangosDelPlan(token, planId);
    if (numero !== ultimo.current) return;
    setEstado(r.ok ? { estado: 'listo', datos: r.datos.data } : { estado: 'falla' });
  }, [token, planId]);
  const setDatos = useCallback((datos: RangosDelPlan) => {
    ultimo.current += 1;
    setEstado({ estado: 'listo', datos });
  }, []);
  return { estado, recargar, setDatos };
}

export type RangosIndicadosHook = ReturnType<typeof useRangosIndicados>;

/** Un día tipo con lo que necesita la lista: su identidad (si ya se guardó) y sus comidas. */
export interface DiaParaLosRangos {
  readonly dayTypeId?: string | undefined;
  readonly nombre: string;
  readonly comidas: readonly { readonly mealId?: string | undefined; readonly nombre: string }[];
}

export function RangosIndicados({ token, planId, rangos, dias, titulo = true }: { token: string; planId: string; rangos: RangosIndicadosHook; dias: readonly DiaParaLosRangos[]; titulo?: boolean }) {
  const [abierto, setAbierto] = useState<(DondeVaElRango & { readonly nombre: string }) | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const { estado } = rangos;
  if (estado.estado === 'leyendo') return <p className="nota" role="status">{C.leyendo}</p>;
  if (estado.estado === 'falla')
    return (
      <p className="nota">
        {C.noSeLeyeron}{' '}
        <button type="button" className="boton boton--enlace" onClick={() => void rangos.recargar()}>
          {C.reintentar}
        </button>
      </p>
    );
  const datos = estado.datos;
  const activada = datos.state === 'ACTIVATED';
  const avisosDelPesoUsado = avisosDelPeso(datos);
  const rangoDe = (dayTypeId: string | undefined, mealId: string | null) => {
    const d = datos.dayTypes.find((x) => x.dayTypeId === dayTypeId);
    return mealId === null ? (d?.day ?? null) : (d?.meals.find((m) => m.mealId === mealId)?.range ?? null);
  };
  const fila = (dayTypeId: string | undefined, mealId: string | null | undefined, nombre: string) => {
    const r = dayTypeId && mealId !== undefined ? rangoDe(dayTypeId, mealId) : null;
    const sinGuardar = !dayTypeId || mealId === undefined;
    return (
      <li key={`${dayTypeId ?? 'nuevo'}-${mealId ?? 'dia'}-${nombre}`}>
        <span className="rangos-indicados__donde">{nombre}</span>{' '}
        {r ? (
          <span className="rangos-indicados__valor">
            <span aria-hidden="true">{rangoEnUnaLinea(r)}</span>
            <span className="visualmente-oculto">{rangoEnPalabras(r)}</span>
          </span>
        ) : (
          <span className="rangos-indicados__valor">{C.sinRango}</span>
        )}{' '}
        {activada ? null : sinGuardar ? (
          <span className="nota">· {C.guardaPrimero}</span>
        ) : (
          <button type="button" className="boton boton--enlace" onClick={() => (setAviso(null), setAbierto({ dayTypeId: dayTypeId!, mealId: mealId as string | null, nombre }))}>
            {r ? C.cambiar(nombre) : C.escribir(nombre)}
          </button>
        )}
      </li>
    );
  };
  return (
    <section className="rangos-indicados" aria-label={C.titulo} data-rangos-indicados>
      {titulo ? <h3>{C.titulo}</h3> : null}
      <p className="nota">{C.ayuda}</p>
      {datos.bodyWeight ? <p data-peso-usado>{pesoEnPalabras(datos.bodyWeight)}</p> : null}
      {datos.bodyWeightWithheld ? <p className="nota">{C.pesoRetenido}</p> : null}
      {avisosDelPesoUsado.map((texto) => (
        <p key={texto} className="nota" role="status" data-peso-mas-nuevo>
          {texto}
        </p>
      ))}
      {activada ? <p className="nota">{C.soloLectura}</p> : null}
      {aviso ? <Aviso tipo="exito">{aviso}</Aviso> : null}
      {dias.map((d) => (
        <div key={d.dayTypeId ?? d.nombre}>
          {dias.length > 1 ? <h4>{d.nombre}</h4> : null}
          <ul className="estacion__lista-del-panel">
            {fila(d.dayTypeId, null, C.elDia)}
            {d.comidas.map((m) => fila(d.dayTypeId, m.mealId, m.nombre))}
          </ul>
        </div>
      ))}
      {abierto ? (
        <CuadroDelRango
          key={`${abierto.dayTypeId}-${abierto.mealId}`}
          token={token}
          planId={planId}
          datos={datos}
          donde={abierto}
          onGuardado={(nuevos, texto) => {
            rangos.setDatos(nuevos);
            setAviso(texto);
            setAbierto(null);
          }}
          onReleer={() => rangos.recargar()}
          onCerrar={() => setAbierto(null)}
        />
      ) : null}
    </section>
  );
}

/** El cuadro de un rango: los tres macronutrientes, el peso de referencia y los gramos que resultan. */
function CuadroDelRango({
  token,
  planId,
  datos,
  donde,
  onGuardado,
  onReleer,
  onCerrar,
}: {
  token: string;
  planId: string;
  datos: RangosDelPlan;
  donde: DondeVaElRango & { readonly nombre: string };
  onGuardado: (datos: RangosDelPlan, texto: string) => void;
  onReleer: () => Promise<void>;
  onCerrar: () => void;
}) {
  const id = useId();
  const primero = useRef<HTMLSelectElement>(null);
  const actual = donde.mealId === null ? datos.dayTypes.find((d) => d.dayTypeId === donde.dayTypeId)?.day : datos.dayTypes.find((d) => d.dayTypeId === donde.dayTypeId)?.meals.find((m) => m.mealId === donde.mealId)?.range;
  const [form, setForm] = useState<FormularioDelRango>(() => formularioDesde(actual));
  const [peso, setPeso] = useState<PesoElegido>(() => pesoInicial(datos, hoyEn()));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Lo que la API marcó en un campo («protein.min», «kg», «fecha»); se borra al cambiar algo.
  const [delServidor, setDelServidor] = useState<Readonly<Record<string, string>>>({});
  const [cambiado, setCambiado] = useState(false);
  const hoy = hoyEn();
  const conGramosPorKilo = usaGramosPorKilo(form);
  const kg = kilosDelPeso(peso, datos.bodyWeight, datos.anthropometry.latestWeight);
  const delPeso = problemasDelPesoAMano(peso, hoy);
  const errKg = delPeso.kg ?? delServidor.kg ?? null;
  const errFecha = delPeso.fecha ?? delServidor.fecha ?? null;
  const guardado = guardadoDelCuadro(datos, donde, form, peso, hoy);

  const cambiar = (m: MacroDelRango, cambio: Partial<FormularioDelRango[MacroDelRango]>) => {
    setForm((f) => ({ ...f, [m]: { ...f[m], ...cambio } }));
    setDelServidor({});
    setCambiado(true);
  };
  const cambiarPeso = (nuevo: PesoElegido) => {
    setPeso(nuevo);
    setDelServidor({});
    setCambiado(true);
  };

  async function guardar(quitar = false) {
    const cuerpo: EscribirRangosRequest | null = quitar ? cuerpoParaGuardar(datos, donde, null, pesoParaMandar({ tipo: 'guardado' }, datos.bodyWeight, null)) : guardado.cuerpo;
    if (!cuerpo) return;
    setEnviando(true);
    setError(null);
    setDelServidor({});
    const r = await api.escribirRangosDelPlan(token, planId, cuerpo);
    setEnviando(false);
    if (r.ok) return onGuardado(r.datos.data, quitar ? C.quitado : C.guardado);
    if (r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT') {
      await onReleer();
      return setError(C.otroCambio);
    }
    const codigos = r.tipo === 'API' ? r.issues.map((i) => i.code) : [];
    if (codigos.includes('RANGE_TARGET_NOT_IN_PLAN')) {
      await onReleer();
      return setError(C.otroCambio);
    }
    if (codigos.includes('BODY_WEIGHT_OUTDATED')) {
      await onReleer();
      return setError(C.pesoViejo);
    }
    if (codigos.includes('BODY_WEIGHT_NOT_AVAILABLE')) {
      setPeso({ tipo: 'a-mano', kg: '', fecha: hoyEn() });
      return setError(C.pesoNoDisponible);
    }
    if (codigos.includes('BODY_WEIGHT_REQUIRED')) {
      await onReleer();
      return setError(C.faltoElPesoDelPlan);
    }
    if (r.tipo === 'API' && r.issues.length > 0) {
      const { campos, otros } = problemasEnSuCampo(r.issues, cuerpo, donde);
      setDelServidor(campos);
      return setError(otros === 0 ? C.revisaLoMarcado : C.noSeGuardo);
    }
    setError(mensajeDeFallo(r));
  }

  const opcionesDePeso = opcionesDelPeso(datos);

  return (
    <CuadroEnfocado
      abierto
      forma="dialogo"
      titulo={C.tituloDelCuadro(donde.nombre)}
      focoInicial={primero}
      ocupado={enviando}
      conCambios={cambiado}
      principal={{ texto: C.guardar, alTocar: () => void guardar(), apagado: guardado.apagado, enviando, textoEnviando: C.guardando }}
      pie={actual ? <button type="button" className="boton boton--secundario" disabled={enviando} onClick={() => void guardar(true)}>{C.quitar}</button> : null}
      onCerrar={onCerrar}
    >
      {error ? <Aviso tipo="error">{error}</Aviso> : null}
      <p className="nota">{C.vacioEsSinLimite}</p>
      <table className="tabla rangos-indicados__tabla">
        <thead>
          <tr>
            <th scope="col">Macronutriente</th>
            <th scope="col">Unidad</th>
            <th scope="col">Mínimo</th>
            <th scope="col">Máximo</th>
            <th scope="col">Se guarda</th>
          </tr>
        </thead>
        <tbody>
          {MACROS_DEL_RANGO.map((m, n) => {
            const c = form[m];
            const resultado = gramosQueResultan(c, kg);
            const errMin = problemaDelCampo(c, 'min') ?? delServidor[`${m}.min`] ?? null;
            const errMax = problemaDelCampo(c, 'max') ?? delServidor[`${m}.max`] ?? null;
            return (
              <tr key={m}>
                <th scope="row">{NOMBRE_DEL_MACRO[m]}</th>
                <td>
                  <select ref={n === 0 ? primero : undefined} aria-label={C.unidad(NOMBRE_DEL_MACRO[m])} value={c.unidad} onChange={(e) => cambiar(m, { unidad: e.target.value as 'g' | 'g_per_kg' })}>
                    <option value="g">g</option>
                    <option value="g_per_kg">g/kg</option>
                  </select>
                </td>
                <td>
                  <input inputMode="decimal" size={6} aria-label={C.minimo(NOMBRE_DEL_MACRO[m])} aria-invalid={errMin ? true : undefined} aria-describedby={errMin ? `${id}-${m}-min` : undefined} value={c.min} onChange={(e) => cambiar(m, { min: e.target.value })} />
                  {errMin ? (
                    <span id={`${id}-${m}-min`} className="campo__error">
                      {errMin}
                    </span>
                  ) : null}
                </td>
                <td>
                  <input inputMode="decimal" size={6} aria-label={C.maximo(NOMBRE_DEL_MACRO[m])} aria-invalid={errMax ? true : undefined} aria-describedby={errMax ? `${id}-${m}-max` : undefined} value={c.max} onChange={(e) => cambiar(m, { max: e.target.value })} />
                  {errMax ? (
                    <span id={`${id}-${m}-max`} className="campo__error">
                      {errMax}
                    </span>
                  ) : null}
                </td>
                <td data-se-guarda>{resultado ?? (c.unidad === 'g_per_kg' && (c.min || c.max) && kg === null ? (delPeso.kg ? C.revisaElPeso : C.faltaElPeso) : '')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {conGramosPorKilo ? (
        <fieldset className="rangos-indicados__peso">
          <legend>{C.peso}</legend>
          {!datos.anthropometry.enabled ? <p className="nota">{C.sinAntropometria}</p> : !datos.anthropometry.latestWeight ? <p className="nota">{C.sinPesoRegistrado}</p> : null}
          <p className="nota">{C.unPesoParaTodo}</p>
          {opcionesDePeso.map((o) => (
            <label key={o.valor} className="opcion-en-linea">
              <input
                type="radio"
                name={`${id}-peso`}
                checked={peso.tipo === o.valor}
                onChange={() => cambiarPeso(o.valor === 'a-mano' ? { tipo: 'a-mano', kg: '', fecha: hoy } : { tipo: o.valor })}
              />{' '}
              {o.texto}
            </label>
          ))}
          {peso.tipo === 'a-mano' ? (
            <div className="rangos-indicados__a-mano">
              <div className="campo">
                <label htmlFor={`${id}-kg`}>{C.kilos}</label>
                <input
                  id={`${id}-kg`}
                  inputMode="decimal"
                  size={6}
                  aria-invalid={errKg ? true : undefined}
                  aria-describedby={errKg ? `${id}-kg-error` : undefined}
                  value={peso.kg}
                  onChange={(e) => cambiarPeso({ ...peso, kg: e.target.value })}
                />
                {errKg ? (
                  <span id={`${id}-kg-error`} className="campo__error">
                    {errKg}
                  </span>
                ) : null}
              </div>
              {/* PG-14: el calendario propio, con el mismo límite de hoy y el mismo `id` (el error lleva el foco ahí). */}
              <CampoDeFecha id={`${id}-fecha`} etiqueta={C.fecha} max={hoy} hoy={hoy} value={peso.fecha} onChange={(fecha) => cambiarPeso({ ...peso, fecha })} error={errFecha} required />
            </div>
          ) : null}
        </fieldset>
      ) : null}
    </CuadroEnfocado>
  );
}
