'use client';

/**
 * WP-OBJETIVO-Y-CALCULADOR (OBC-07; DL-186) y RP-06 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · «Reparto por comida», a la vista
 * en cada día tipo del editor del plan. La lógica y los textos están en `propuesta-de-rangos.ts`.
 *
 * - Lo que se reparte es lo que rige: los gramos por día del objetivo vigente o, si no los tiene, el cálculo guardado con
 *   él (API-OBC-03); con el día de descanso del cálculo, si corresponde, para elegir cuál usa este día tipo.
 * - Una tabla con cada comida del día tipo y su parte del día, que suma 100; al lado, el rango que se propone de kcal, P,
 *   C y G de cada comida (con su margen), y el del día. Por omisión, la misma parte para las kcal y los tres macros; a
 *   pedido, cada macro por separado (el reparto de antes). «Repartir parejo» y «Sugerido por el nombre de cada comida».
 * - Guarda con API-PLN-03, como un rango escrito a mano. Igual que antes: solo llena los rangos vacíos, y reemplazar lo ya
 *   escrito es una casilla aparte con la lista de lo que se reemplaza.
 * - Antes era un cuadro detrás de «Proponer rangos desde el cálculo del objetivo», para todos los días a la vez: el mismo
 *   cálculo, ahora visible y día por día, sin duplicarlo.
 */
import { MACROS_DE_LA_PROPUESTA, numero, type RangosDelPlan, type ReferenciaYCalculo, type VersionDeObjetivo } from '@be/domain';
import { useEffect, useId, useMemo, useState } from 'react';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';
import { Aviso } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { mensajeDeFallo } from '../../../../lib/intento';
import { CantidadDelMacro, RotuloConIcono } from './cantidad-del-macro';
import {
  conParteUnica,
  COPY_PROPUESTA as C,
  cuerpoConLaPropuesta,
  fuenteDeLaPropuesta,
  kcalDeLosGramosDelDia,
  kcalDelRango,
  NOMBRE_DEL_MACRO_DE_LA_PROPUESTA,
  parteUnica,
  propuestaDelDia,
  repartoInicial,
  repartoInicialUnico,
  sumaDeLasPartes,
  type DiaDeLaPropuesta,
  type RepartoEscrito,
} from './propuesta-de-rangos';
import type { RangosIndicadosHook } from './rangos-indicados-del-plan';

type LecturaDelCalculo = { estado: 'leyendo' } | { estado: 'listo'; calculo: ReferenciaYCalculo | null } | { estado: 'falla' };

/** API-OBC-03: el cálculo guardado con el objetivo vigente, una vez por objetivo. */
function useCalculoDelObjetivo(token: string, versionId: string | null): LecturaDelCalculo {
  const [lectura, setLectura] = useState<LecturaDelCalculo>({ estado: 'leyendo' });
  useEffect(() => {
    if (!versionId) return;
    let vigente = true;
    setLectura({ estado: 'leyendo' });
    void api.referenciaDelObjetivo(token, versionId).then((r) => {
      if (vigente) setLectura(r.ok ? { estado: 'listo', calculo: r.datos.data.calculation } : { estado: 'falla' });
    });
    return () => {
      vigente = false;
    };
  }, [token, versionId]);
  return lectura;
}

const cifra = (x: { readonly min: number; readonly max: number }): string => (x.min === x.max ? numero(x.min, 0) : `${numero(x.min, 0)} a ${numero(x.max, 0)}`);

/**
 * El reparto por comida de un día tipo. `dia`: el día con sus comidas ya guardadas; `null` si el día todavía no se
 * guardó. `comidasSinGuardar`: cuántas comidas del día todavía no tienen identidad (reciben su parte al guardar).
 * `nombreDelDia`: donde se listan los repartos de todos los días tipo (el paso de los rangos del asistente), el título dice
 * de qué día es; dentro de un día tipo, su pestaña ya lo dice.
 */
export function RepartoPorComida({
  token,
  planId,
  objetivo,
  dia,
  comidasSinGuardar = 0,
  nombreDelDia = null,
  rangos,
}: {
  token: string;
  planId: string;
  objetivo: VersionDeObjetivo | null;
  dia: DiaDeLaPropuesta | null;
  comidasSinGuardar?: number;
  nombreDelDia?: string | null;
  rangos: RangosIndicadosHook;
}) {
  const id = useId();
  const calculo = useCalculoDelObjetivo(token, objetivo?.versionId ?? null);
  const [tolerancia, setTolerancia] = useState('10');
  const [escrito, setEscrito] = useState<RepartoEscrito | null>(null);
  const [porMacro, setPorMacro] = useState(false);
  const [reemplazar, setReemplazar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // El reparto escrito es de este día tipo: con otras comidas, vuelve al punto de partida. Revisión del PR: la clave son
  // las comidas, no sus nombres; con el nombre, cambiarle el nombre a una comida borraba las partes que se habían escrito.
  const claveDelDia = dia ? `${dia.dayTypeId}|${dia.comidas.map((c) => c.mealId).join(',')}` : '';
  useEffect(() => {
    setEscrito(null);
    setPorMacro(false);
    setReemplazar(false);
    setError(null);
  }, [claveDelDia]);

  const fuente = calculo.estado === 'listo' ? fuenteDeLaPropuesta(objetivo, calculo.calculo) : null;
  const r = escrito ?? (dia ? repartoInicialUnico(dia) : null);
  const t = Number(tolerancia.replace(',', '.'));
  const toleranciaValida = /^\d+([.,]\d+)?$/.test(tolerancia.trim()) && t >= 0 && t <= 50;
  const p = useMemo(() => (dia && r && fuente && toleranciaValida ? propuestaDelDia(dia, r, fuente, t) : null), [dia, r, fuente, toleranciaValida, t]);

  if (rangos.estado.estado !== 'listo' || rangos.estado.datos.state === 'ACTIVATED' || !objetivo) return null;
  const datos: RangosDelPlan = rangos.estado.datos;
  const cambiar = (e: RepartoEscrito) => {
    setEscrito(e);
    setError(null);
  };

  // El «?» va al lado del título y no adentro: el título nombra la sección, y la explicación no se le suma al abrirla.
  const encabezado = (
    <div className="reparto-por-comida__titulo">
      <h3 id={`${id}-titulo`}>
        <Icono nombre="objetivo" tamano={18} />
        {nombreDelDia ? C.tituloDelDia(nombreDelDia) : C.titulo}
      </h3>
      <ExplicacionAPedido nombre={C.queEsNombre}>{C.queEs}</ExplicacionAPedido>
    </div>
  );
  if (!dia || dia.comidas.length === 0) {
    return (
      <section className="reparto-por-comida" aria-labelledby={`${id}-titulo`} data-reparto-por-comida>
        {encabezado}
        {/* Con comidas nuevas todavía sin guardar, lo que falta es guardar; sin ninguna, agregarlas. */}
        <p className="nota" data-reparto-sin-comidas>{dia && comidasSinGuardar === 0 ? C.sinComidasGuardadas : C.sinDiaGuardado}</p>
      </section>
    );
  }
  if (!r) return null;
  const gramos = fuente ? (r.variante === 'descanso' && fuente.descanso ? fuente.descanso : fuente.dia) : null;
  const sumas = sumaDeLasPartes(dia, r);
  // La base del «%»: lo que suman los gramos del día, de donde salen las kcal de cada comida.
  const base = gramos ? kcalDeLosGramosDelDia(gramos) : 0;
  const listo = p?.ok ? { dayTypeId: dia.dayTypeId, dia: p.dia, comidas: dia.comidas.map((c, j) => ({ mealId: c.mealId, rango: p.comidas[j]! })) } : null;
  const nombre = (_: string, mealId: string | null) => (mealId === null ? 'todo el día' : (dia.comidas.find((c) => c.mealId === mealId)?.nombre ?? 'una comida'));
  const vistaPrevia = listo ? cuerpoConLaPropuesta(datos, [listo], nombre, reemplazar) : null;
  const conReemplazo = listo ? cuerpoConLaPropuesta(datos, [listo], nombre, true) : null;
  const yaEscritos = conReemplazo?.reemplazados.length ?? 0;
  const nuevos = vistaPrevia ? vistaPrevia.nuevos + vistaPrevia.reemplazados.length : 0;

  async function proponer() {
    if (!vistaPrevia || nuevos === 0) return;
    setEnviando(true);
    setError(null);
    const respuesta = await api.escribirRangosDelPlan(token, planId, vistaPrevia.cuerpo);
    setEnviando(false);
    if (respuesta.ok) {
      rangos.setDatos(respuesta.datos.data);
      rangos.setAviso(C.guardado(nuevos));
      setReemplazar(false);
      return;
    }
    if (respuesta.tipo === 'API' && (respuesta.codigo === 'VERSION_CONFLICT' || respuesta.issues.some((i) => i.code === 'RANGE_TARGET_NOT_IN_PLAN'))) {
      await rangos.recargar();
      return setError('Los rangos o el plan cambiaron mientras repartías: se volvieron a leer. Revisá el reparto y proponé otra vez.');
    }
    setError(mensajeDeFallo(respuesta));
  }

  const noSePuede = !fuente ? null : !toleranciaValida ? 'Revisá el margen: un número de 0 a 50.' : p && !p.ok ? 'Las partes no suman 100: ajustalas para proponer.' : nuevos === 0 ? C.nadaQueGuardar : null;

  return (
    <section className="reparto-por-comida" aria-labelledby={`${id}-titulo`} data-reparto-por-comida>
      {encabezado}
      {calculo.estado === 'leyendo' ? <p className="nota" role="status">Leyendo el objetivo…</p> : null}
      {calculo.estado === 'falla' ? <p className="nota">No se pudo leer el cálculo del objetivo. Se vuelve a intentar al abrir de nuevo el editor.</p> : null}
      {calculo.estado === 'listo' && !fuente ? <p className="nota">{C.sinFuente}</p> : null}
      {fuente && gramos ? (
        <>
          <p className="nota" data-fuente-de-la-propuesta>
            {fuente.texto}: <CantidadDelMacro macro="kcal" cifra={numero(gramos.kcal, 0)} /> · <CantidadDelMacro macro="protein" cifra={numero(gramos.protein, 0)} /> ·{' '}
            <CantidadDelMacro macro="carbohydrate" cifra={numero(gramos.carbohydrate, 0)} /> · <CantidadDelMacro macro="fat" cifra={numero(gramos.fat, 0)} />
          </p>
          <div className="reparto-por-comida__controles">
            {fuente.descanso ? (
              <fieldset className="segmentos">
                <legend>{C.variante}</legend>
                <div className="segmentos__fila">
                  <label className="segmento">
                    <input type="radio" name={`${id}-variante`} checked={r.variante === 'dia'} onChange={() => cambiar({ ...r, variante: 'dia' })} /> Día de entrenamiento ({numero(fuente.dia.kcal, 0)} kcal)
                  </label>
                  <label className="segmento">
                    <input type="radio" name={`${id}-variante`} checked={r.variante === 'descanso'} onChange={() => cambiar({ ...r, variante: 'descanso' })} /> Día de descanso ({numero(fuente.descanso.kcal, 0)} kcal)
                  </label>
                </div>
              </fieldset>
            ) : null}
            <button type="button" className="boton boton--quieto boton--compacto" onClick={() => cambiar(porMacro ? repartoInicial(dia, 'parejo', r.variante) : repartoInicialUnico(dia, 'parejo', r.variante))}>
              {C.parejo}
            </button>
            <button type="button" className="boton boton--quieto boton--compacto" onClick={() => cambiar(porMacro ? repartoInicial(dia, 'sugerido', r.variante) : repartoInicialUnico(dia, 'sugerido', r.variante))}>
              {C.sugerido}
            </button>
            <ExplicacionAPedido nombre={C.sugerido}>{C.sugeridoAyuda}</ExplicacionAPedido>
            <span className="reparto-por-comida__margen">
              <label htmlFor={`${id}-tolerancia`}>{C.tolerancia}</label>
              <input id={`${id}-tolerancia`} inputMode="decimal" size={3} aria-invalid={toleranciaValida ? undefined : true} value={tolerancia} onChange={(e) => (setTolerancia(e.target.value), setError(null))} />
            </span>
            <label className="opcion-en-linea">
              <input
                type="checkbox"
                checked={porMacro}
                onChange={(e) => {
                  setPorMacro(e.target.checked);
                  // Al volver a una parte por comida, cada comida toma la de sus proteínas si los macros diferían.
                  if (!e.target.checked) cambiar(dia.comidas.reduce((x, c) => conParteUnica(x, c.mealId, parteUnica(x, c.mealId) ?? x.comidas[c.mealId]?.protein ?? ''), r));
                }}
              />{' '}
              {C.porMacro}
            </label>
          </div>
          <div className="desplazable-x">
            <table className="tabla reparto-por-comida__tabla" data-tabla-del-reparto>
              <caption className="visualmente-oculto">
                {C.titulo}: {dia.nombre}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Comida</th>
                  {porMacro ? null : <th scope="col">{C.parte}</th>}
                  <th scope="col">
                    <RotuloConIcono macro="kcal" texto="kcal" />
                  </th>
                  {MACROS_DE_LA_PROPUESTA.map((m) => (
                    <th key={m} scope="col">
                      <RotuloConIcono macro={m} texto={NOMBRE_DEL_MACRO_DE_LA_PROPUESTA[m]} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dia.comidas.map((comida, j) => {
                  const rango = p?.ok ? p.comidas[j]! : null;
                  const unica = parteUnica(r, comida.mealId);
                  return (
                    <tr key={comida.mealId}>
                      <th scope="row">{comida.nombre}</th>
                      {porMacro ? null : (
                        <td>
                          <span className="reparto-por-comida__parte">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              inputMode="numeric"
                              aria-label={C.parteDe(comida.nombre)}
                              value={unica ?? ''}
                              onChange={(e) => cambiar(conParteUnica(r, comida.mealId, e.target.value))}
                              data-parte-de-la-comida
                            />
                            <span className="nota">{C.deLasKcal(base)}</span>
                          </span>
                        </td>
                      )}
                      <td data-kcal-propuestas>{rango ? <CantidadDelMacro macro="kcal" cifra={cifra(kcalDelRango(rango))} /> : '—'}</td>
                      {MACROS_DE_LA_PROPUESTA.map((m) => (
                        <td key={m}>
                          {porMacro ? (
                            <span className="reparto-por-comida__parte">
                              <input
                                inputMode="decimal"
                                size={3}
                                aria-label={`${NOMBRE_DEL_MACRO_DE_LA_PROPUESTA[m]} de ${comida.nombre}, parte del día`}
                                value={r.comidas[comida.mealId]?.[m] ?? ''}
                                onChange={(e) => cambiar({ ...r, comidas: { ...r.comidas, [comida.mealId]: { ...(r.comidas[comida.mealId] ?? { protein: '', carbohydrate: '', fat: '' }), [m]: e.target.value } } })}
                              />
                              <span className="nota">{`% de los ${numero(gramos[m], 0)} g`}</span>
                            </span>
                          ) : null}
                          {rango ? (
                            <span className="reparto-por-comida__rango" data-rango-propuesto>
                              <CantidadDelMacro macro={m} cifra={cifra(rango[m])} />
                            </span>
                          ) : porMacro ? null : (
                            '—'
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr className="reparto-por-comida__fila-del-dia">
                  <th scope="row">Todo el día</th>
                  {porMacro ? null : <td data-suma-de-las-partes>{C.sumaDeLasPartes(sumas.protein, base)}</td>}
                  <td>
                    <CantidadDelMacro macro="kcal" cifra={p?.ok ? cifra(kcalDelRango(p.dia)) : numero(gramos.kcal, 0)} />
                  </td>
                  {MACROS_DE_LA_PROPUESTA.map((m) => (
                    <td key={m} data-rango-del-dia-propuesto>
                      <CantidadDelMacro macro={m} cifra={p?.ok ? cifra(p.dia[m]) : numero(gramos[m], 0)} />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {p && !p.ok ? (
            porMacro ? (
              p.sumas.map((s) => (
                <p key={s.macro} className="campo__error" role="status">
                  {C.noSuma(NOMBRE_DEL_MACRO_DE_LA_PROPUESTA[s.macro], s.suma)}
                </p>
              ))
            ) : (
              <p className="campo__error" role="status" data-no-suma-100>
                {C.noSumaUnica(sumas.protein)}
              </p>
            )
          ) : null}
          {comidasSinGuardar > 0 ? <p className="nota">{C.sinGuardar}</p> : null}
          {yaEscritos > 0 && conReemplazo && vistaPrevia ? (
            <fieldset className="grupo grupo--anidado" data-reemplazar-rangos>
              <legend>Lo que ya escribiste</legend>
              <label className="opcion-en-linea">
                <input type="checkbox" checked={reemplazar} onChange={(e) => setReemplazar(e.target.checked)} /> {yaEscritos === 1 ? C.reemplazarUno : C.reemplazar(yaEscritos)}
              </label>
              <p className="nota">{reemplazar ? C.seReemplazan(conReemplazo.reemplazados.join(', ')) : C.seConservan(vistaPrevia.conservados.join(', '))}</p>
            </fieldset>
          ) : null}
          {error ? <Aviso tipo="error">{error}</Aviso> : null}
          <div className="acciones reparto-por-comida__acciones">
            <button type="button" className="boton boton--secundario" data-proponer-rangos disabled={enviando || noSePuede !== null} aria-busy={enviando} onClick={() => void proponer()}>
              {enviando ? C.guardando : C.proponer}
            </button>
            {noSePuede ? <span className="nota">{noSePuede}</span> : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
