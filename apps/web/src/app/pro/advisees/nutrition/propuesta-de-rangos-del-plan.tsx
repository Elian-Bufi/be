'use client';

/**
 * WP-OBJETIVO-Y-CALCULADOR (OBC-07; DL-186) · «Proponer rangos desde el cálculo del objetivo», en el editor del plan. La
 * lógica y los textos están en `propuesta-de-rangos.ts`.
 *
 * - Lee el cálculo guardado con el objetivo vigente (API-OBC-03); si no tiene macros, usa los gramos del objetivo.
 * - Por día tipo: qué día usa (el de entrenamiento o el de descanso, si el cálculo tiene los dos) y el reparto por comida
 *   que elige el profesional, con «Repartir parejo» y «Sugerido por el nombre de cada comida».
 * - Muestra lo que se propone y lo que se reemplaza; guarda con API-PLN-03, como un rango escrito a mano. Nunca pisa un
 *   rango escrito sin la casilla de reemplazar.
 */
import { MACROS_DE_LA_PROPUESTA, numero, type RangosDelPlan, type ReferenciaYCalculo, type VersionDeObjetivo } from '@be/domain';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { Aviso } from '../../../../components/formulario';
import { api } from '../../../../lib/api';
import { mensajeDeFallo } from '../../../../lib/intento';
import {
  COPY_PROPUESTA as C,
  cuerpoConLaPropuesta,
  fuenteDeLaPropuesta,
  limitesEnPalabras,
  NOMBRE_DEL_MACRO_DE_LA_PROPUESTA,
  propuestaDelDia,
  repartoInicial,
  type DiaDeLaPropuesta,
  type DiaPropuesto,
  type RepartoEscrito,
} from './propuesta-de-rangos';
import type { RangosIndicadosHook } from './rangos-indicados-del-plan';

/** El botón que abre la propuesta. Aparece con la versión en preparación y los rangos ya leídos. */
export function PropuestaDeRangos({ token, planId, objetivo, dias, rangos }: { token: string; planId: string; objetivo: VersionDeObjetivo | null; dias: readonly DiaDeLaPropuesta[]; rangos: RangosIndicadosHook }) {
  const [abierta, setAbierta] = useState(false);
  if (rangos.estado.estado !== 'listo' || rangos.estado.datos.state === 'ACTIVATED' || !objetivo || dias.length === 0) return null;
  return (
    <>
      <button type="button" className="boton boton--secundario boton--compacto" data-proponer-rangos onClick={() => setAbierta(true)}>
        {C.abrir}
      </button>
      {abierta ? (
        <CuadroDeLaPropuesta
          token={token}
          planId={planId}
          objetivo={objetivo}
          dias={dias}
          datos={rangos.estado.datos}
          onGuardado={(nuevos, texto) => {
            rangos.setDatos(nuevos);
            rangos.setAviso(texto);
            setAbierta(false);
          }}
          onReleer={() => rangos.recargar()}
          onCerrar={() => setAbierta(false)}
        />
      ) : null}
    </>
  );
}

function CuadroDeLaPropuesta({
  token,
  planId,
  objetivo,
  dias,
  datos,
  onGuardado,
  onReleer,
  onCerrar,
}: {
  token: string;
  planId: string;
  objetivo: VersionDeObjetivo;
  dias: readonly DiaDeLaPropuesta[];
  datos: RangosDelPlan;
  onGuardado: (datos: RangosDelPlan, texto: string) => void;
  onReleer: () => Promise<void>;
  onCerrar: () => void;
}) {
  const id = useId();
  const primero = useRef<HTMLInputElement>(null);
  const [calculo, setCalculo] = useState<{ estado: 'leyendo' } | { estado: 'listo'; calculo: ReferenciaYCalculo | null } | { estado: 'falla' }>({ estado: 'leyendo' });
  useEffect(() => {
    let vigente = true;
    void api.referenciaDelObjetivo(token, objetivo.versionId).then((r) => {
      if (vigente) setCalculo(r.ok ? { estado: 'listo', calculo: r.datos.data.calculation } : { estado: 'falla' });
    });
    return () => {
      vigente = false;
    };
  }, [token, objetivo.versionId]);
  const [tolerancia, setTolerancia] = useState('10');
  const [repartos, setRepartos] = useState<Readonly<Record<string, RepartoEscrito>>>(() => Object.fromEntries(dias.map((d) => [d.dayTypeId, repartoInicial(d)])));
  const [reemplazar, setReemplazar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cambiado, setCambiado] = useState(false);

  const fuente = calculo.estado === 'listo' ? fuenteDeLaPropuesta(objetivo, calculo.calculo) : null;
  const t = Number(tolerancia.replace(',', '.'));
  const toleranciaValida = /^\d+([.,]\d+)?$/.test(tolerancia.trim()) && t >= 0 && t <= 50;
  const propuestas = useMemo(() => (fuente && toleranciaValida ? dias.map((d) => ({ d, p: propuestaDelDia(d, repartos[d.dayTypeId] ?? repartoInicial(d), fuente, t) })) : []), [dias, repartos, fuente, toleranciaValida, t]);
  const listos: DiaPropuesto[] = propuestas.flatMap(({ d, p }) => (p.ok ? [{ dayTypeId: d.dayTypeId, dia: p.dia, comidas: d.comidas.map((c, j) => ({ mealId: c.mealId, rango: p.comidas[j]! })) }] : []));
  const nombre = (dayTypeId: string, mealId: string | null) => {
    const d = dias.find((x) => x.dayTypeId === dayTypeId);
    const lugar = mealId === null ? 'todo el día' : (d?.comidas.find((c) => c.mealId === mealId)?.nombre ?? 'una comida');
    return dias.length > 1 ? `${lugar} (${d?.nombre ?? ''})` : lugar;
  };
  const vistaPrevia = cuerpoConLaPropuesta(datos, listos, nombre, reemplazar);
  const conReemplazo = cuerpoConLaPropuesta(datos, listos, nombre, true);
  const yaEscritos = conReemplazo.reemplazados.length;
  const todosListos = propuestas.length > 0 && propuestas.every(({ p }) => p.ok);
  const nadaQueGuardar = todosListos && vistaPrevia.nuevos + vistaPrevia.reemplazados.length === 0;

  const cambiarReparto = (dayTypeId: string, cambio: RepartoEscrito) => {
    setRepartos((r) => ({ ...r, [dayTypeId]: cambio }));
    setCambiado(true);
  };

  async function guardar() {
    if (!todosListos || nadaQueGuardar) return;
    setEnviando(true);
    setError(null);
    const r = await api.escribirRangosDelPlan(token, planId, vistaPrevia.cuerpo);
    setEnviando(false);
    if (r.ok) return onGuardado(r.datos.data, C.guardado(vistaPrevia.nuevos + vistaPrevia.reemplazados.length));
    if (r.tipo === 'API' && (r.codigo === 'VERSION_CONFLICT' || r.issues.some((i) => i.code === 'RANGE_TARGET_NOT_IN_PLAN'))) {
      await onReleer();
      return setError('Los rangos o el plan cambiaron mientras mirabas la propuesta: se volvieron a leer. Cerrá y abrí la propuesta otra vez.');
    }
    setError(mensajeDeFallo(r));
  }

  return (
    <CuadroEnfocado
      abierto
      forma="dialogo"
      ancho
      titulo={C.titulo}
      focoInicial={primero}
      ocupado={enviando}
      conCambios={cambiado}
      principal={{
        texto: C.guardar,
        alTocar: () => void guardar(),
        apagado: !fuente ? C.sinFuente : !toleranciaValida ? 'Revisá el margen: un número de 0 a 50.' : !todosListos ? 'Hay un reparto que no suma 100: ajustalo para guardar.' : nadaQueGuardar ? C.nadaQueGuardar : null,
        enviando,
        textoEnviando: C.guardando,
      }}
      onCerrar={onCerrar}
    >
      <div className="propuesta-de-rangos" data-propuesta-de-rangos>
        <p className="nota">{C.queEs}</p>
        {error ? <Aviso tipo="error">{error}</Aviso> : null}
        {calculo.estado === 'leyendo' ? <p className="nota" role="status">Leyendo el cálculo del objetivo…</p> : null}
        {calculo.estado === 'falla' ? <Aviso tipo="error">No se pudo leer el cálculo del objetivo. Cerrá y probá de nuevo.</Aviso> : null}
        {calculo.estado === 'listo' && !fuente ? <Aviso tipo="info">{C.sinFuente}</Aviso> : null}
        {fuente ? (
          <>
            <p data-fuente-de-la-propuesta>
              <strong>{fuente.texto}:</strong> {numero(fuente.dia.kcal, 0)} kcal · proteínas {numero(fuente.dia.protein, 0)} g · carbohidratos {numero(fuente.dia.carbohydrate, 0)} g · grasas {numero(fuente.dia.fat, 0)} g
              {fuente.descanso ? ` (día de descanso: ${numero(fuente.descanso.kcal, 0)} kcal · carbohidratos ${numero(fuente.descanso.carbohydrate, 0)} g)` : ''}.
            </p>
            <div className="campo campo--corto">
              <label htmlFor={`${id}-tolerancia`}>{C.tolerancia}</label>
              <p id={`${id}-tolerancia-ayuda`} className="campo__ayuda">
                {C.toleranciaAyuda(fuente.dia.protein, Math.max(0, Math.floor(fuente.dia.protein * 0.9 + 0.5)), Math.floor(fuente.dia.protein * 1.1 + 0.5))}
              </p>
              <input ref={primero} id={`${id}-tolerancia`} inputMode="decimal" size={4} aria-describedby={`${id}-tolerancia-ayuda`} aria-invalid={toleranciaValida ? undefined : true} value={tolerancia} onChange={(e) => (setTolerancia(e.target.value), setCambiado(true))} />
            </div>
            {propuestas.map(({ d, p }) => {
              const r = repartos[d.dayTypeId] ?? repartoInicial(d);
              const gramos = r.variante === 'descanso' && fuente.descanso ? fuente.descanso : fuente.dia;
              return (
                <section key={d.dayTypeId} className="propuesta-de-rangos__dia" aria-label={d.nombre} data-propuesta-del-dia>
                  {dias.length > 1 ? <h4>{d.nombre}</h4> : null}
                  {fuente.descanso ? (
                    <fieldset className="grupo grupo--anidado">
                      <legend>{C.variante}</legend>
                      <div className="opciones-en-linea">
                        <label className="opcion-en-linea">
                          <input type="radio" name={`${id}-${d.dayTypeId}-variante`} checked={r.variante === 'dia'} onChange={() => cambiarReparto(d.dayTypeId, { ...r, variante: 'dia' })} /> Día de entrenamiento ({numero(fuente.dia.kcal, 0)} kcal)
                        </label>
                        <label className="opcion-en-linea">
                          <input type="radio" name={`${id}-${d.dayTypeId}-variante`} checked={r.variante === 'descanso'} onChange={() => cambiarReparto(d.dayTypeId, { ...r, variante: 'descanso' })} /> Día de descanso ({numero(fuente.descanso.kcal, 0)} kcal)
                        </label>
                      </div>
                    </fieldset>
                  ) : null}
                  {d.comidas.length === 0 ? <p className="nota">{C.sinComidasGuardadas}</p> : null}
                  {d.comidas.length > 0 ? (
                    <>
                      <div className="acciones acciones--en-linea">
                        <button type="button" className="boton boton--enlace" onClick={() => cambiarReparto(d.dayTypeId, repartoInicial(d, 'parejo', r.variante))}>
                          {C.parejo}
                        </button>
                        <button type="button" className="boton boton--enlace" onClick={() => cambiarReparto(d.dayTypeId, repartoInicial(d, 'sugerido', r.variante))}>
                          {C.sugerido}
                        </button>
                      </div>
                      <p className="nota">{C.sugeridoAyuda}</p>
                    </>
                  ) : null}
                  <div className="desplazable-x">
                    <table className="tabla propuesta-de-rangos__tabla" data-reparto-por-comida>
                      <caption className="visualmente-oculto">Reparto y rangos propuestos de {d.nombre}</caption>
                      <thead>
                        <tr>
                          <th scope="col">Dónde</th>
                          {MACROS_DE_LA_PROPUESTA.map((m) => (
                            <th key={m} scope="col">
                              {NOMBRE_DEL_MACRO_DE_LA_PROPUESTA[m]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {d.comidas.map((comida, j) => (
                          <tr key={comida.mealId}>
                            <th scope="row">{comida.nombre}</th>
                            {MACROS_DE_LA_PROPUESTA.map((m) => (
                              <td key={m}>
                                <span className="propuesta-de-rangos__parte">
                                  <input
                                    inputMode="decimal"
                                    size={3}
                                    aria-label={`${NOMBRE_DEL_MACRO_DE_LA_PROPUESTA[m]} de ${comida.nombre}, parte del día`}
                                    value={r.comidas[comida.mealId]?.[m] ?? ''}
                                    onChange={(e) => cambiarReparto(d.dayTypeId, { ...r, comidas: { ...r.comidas, [comida.mealId]: { ...(r.comidas[comida.mealId] ?? { protein: '', carbohydrate: '', fat: '' }), [m]: e.target.value } } })}
                                  />
                                  <span className="nota">{`% de los ${numero(gramos[m], 0)} g`}</span>
                                </span>
                                {p.ok ? <span className="propuesta-de-rangos__rango" data-rango-propuesto>{limitesEnPalabras(p.comidas[j]![m])}</span> : null}
                              </td>
                            ))}
                          </tr>
                        ))}
                        <tr className="panel-de-nutricion__fila-del-dia">
                          <th scope="row">Todo el día</th>
                          {MACROS_DE_LA_PROPUESTA.map((m) => (
                            <td key={m} data-rango-del-dia-propuesto>
                              {p.ok ? limitesEnPalabras(p.dia[m]) : `${numero(gramos[m], 0)} g`}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {!p.ok
                    ? p.sumas.map((s) => (
                        <p key={s.macro} className="campo__error" role="status">
                          {C.noSuma(NOMBRE_DEL_MACRO_DE_LA_PROPUESTA[s.macro], s.suma)}
                        </p>
                      ))
                    : null}
                </section>
              );
            })}
            {yaEscritos > 0 ? (
              <fieldset className="grupo grupo--anidado" data-reemplazar-rangos>
                <legend>Lo que ya escribiste</legend>
                <label className="opcion-en-linea">
                  <input type="checkbox" checked={reemplazar} onChange={(e) => (setReemplazar(e.target.checked), setCambiado(true))} /> {yaEscritos === 1 ? C.reemplazarUno : C.reemplazar(yaEscritos)}
                </label>
                <p className="nota">{reemplazar ? C.seReemplazan(conReemplazo.reemplazados.join(', ')) : C.seConservan(vistaPrevia.conservados.join(', '))}</p>
              </fieldset>
            ) : null}
          </>
        ) : null}
      </div>
    </CuadroEnfocado>
  );
}
