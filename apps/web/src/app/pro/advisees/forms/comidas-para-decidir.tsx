'use client';

/**
 * FI-07 · las comidas habituales que contó la persona, para decidir con ella (WP-FORMULARIOS-DE-INICIO; DL-164 D-9).
 * Va dentro de la solicitud respondida de «Cómo comés hoy»: una tabla con una comida por renglón y, en cada una, las
 * cuatro decisiones del diseño (tal cual, ajustar la porción, mejorar, cambiar). **Nada viene elegido y nada se
 * guarda**: la decisión es de la charla, y lo que queda es el habitual (DL-109).
 * - «Pasar a Mis habituales» no crea el habitual acá: un habitual se guarda desde una comida del plan, con sus
 *   alimentos del catálogo («Guardar como habitual», `nutrition/habituales.tsx`), y ese editor no se abre con un nombre
 *   precargado. Se deja el nombre listo para copiar y el camino a Nutrición · Plan.
 * - Los textos ubican, no califican: ninguna comida es «buena» ni «mala». Las reglas están en `comidas-declaradas.ts`.
 */
import Link from 'next/link';
import { useId, useState } from 'react';
import { EnPartes } from '../../../../components/en-partes';
import { Aviso } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { COPY_COMIDAS_DECLARADAS as T, DECISIONES, type ComidaDeclarada, type Decision } from './comidas-declaradas';

export function ComidasParaDecidir({ comidas, asesoradoId }: { comidas: readonly ComidaDeclarada[]; asesoradoId: string }) {
  const id = useId();
  // La decisión de cada renglón vive solo en esta pantalla (D-9): al cerrar la solicitud, se va.
  const [decisiones, setDecisiones] = useState<ReadonlyMap<number, Decision>>(() => new Map());
  const [paraCopiar, setParaCopiar] = useState<ComidaDeclarada | null>(null);
  if (comidas.length === 0) return null;
  const decidir = (numero: number, decision: Decision | null) =>
    setDecisiones((d) => {
      const nuevas = new Map(d);
      if (decision === null) nuevas.delete(numero);
      else nuevas.set(numero, decision);
      return nuevas;
    });
  return (
    <section className="solicitud-abierta__bloque comidas-declaradas" aria-labelledby={`${id}-titulo`}>
      <div className="solicitud-abierta__titulo-de-bloque">
        <h4 id={`${id}-titulo`}>{T.titulo}</h4>
        <p className="nota">{T.bajada}</p>
      </div>
      <p className="nota">{T.nadaElegido}</p>
      <table className="tabla comidas-declaradas__tabla">
        <thead>
          <tr>
            <th scope="col">{T.comida}</th>
            <th scope="col">{T.decision}</th>
            <th scope="col">
              <span className="visualmente-oculto">{T.pasarAHabituales}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {comidas.map((c) => {
            const elegida = decisiones.get(c.numero) ?? null;
            return (
              <tr key={c.numero} data-comida={c.numero} data-decision={elegida ?? undefined}>
                <th scope="row" className="comidas-declaradas__comida">
                  <span className="comidas-declaradas__que">
                    {c.momento ? <span className="comidas-declaradas__momento">{c.momento}</span> : null}
                    {c.que ?? ''}
                  </span>
                  {c.detalle ? (
                    <span className="nota comidas-declaradas__detalle">
                      <EnPartes texto={c.detalle} />
                    </span>
                  ) : null}
                </th>
                <td>
                  <div className="comidas-declaradas__decisiones" role="radiogroup" aria-label={`${T.decision}: ${c.texto}`}>
                    {DECISIONES.map((d) => (
                      <label key={d.clave} className="opcion-de-inicio opcion-de-inicio--decision">
                        <input type="radio" name={`${id}-${c.numero}`} checked={elegida === d.clave} onChange={() => decidir(c.numero, d.clave)} />
                        <Icono nombre={d.icono} tamano={15} />
                        {d.texto}
                      </label>
                    ))}
                  </div>
                  {elegida !== null ? (
                    <button type="button" className="boton boton--enlace" onClick={() => decidir(c.numero, null)} aria-label={`${T.dejarSinDecidir}: ${c.texto}`}>
                      {T.dejarSinDecidir}
                    </button>
                  ) : null}
                </td>
                <td className="comidas-declaradas__pasar">
                  <button type="button" className="boton boton--secundario boton--compacto" aria-expanded={paraCopiar?.numero === c.numero} onClick={() => setParaCopiar((p) => (p?.numero === c.numero ? null : c))} aria-label={`${T.pasarAHabituales}: ${c.texto}`}>
                    <Icono nombre="habitual" tamano={18} />
                    {T.pasarAHabituales}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {paraCopiar ? <PasarAHabituales key={paraCopiar.numero} comida={paraCopiar} asesoradoId={asesoradoId} onCerrar={() => setParaCopiar(null)} /> : null}
    </section>
  );
}

/** El nombre listo para copiar y el camino al editor del plan, donde se guarda el habitual. */
function PasarAHabituales({ comida, asesoradoId, onCerrar }: { comida: ComidaDeclarada; asesoradoId: string; onCerrar: () => void }) {
  const id = useId();
  const [aviso, setAviso] = useState<string | null>(null);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(comida.texto);
      setAviso(T.copiado);
    } catch {
      setAviso(T.noSeCopio);
    }
  }
  return (
    <div className="comidas-declaradas__pasar-a-habituales" role="group" aria-labelledby={`${id}-titulo`}>
      <p id={`${id}-titulo`} className="comidas-declaradas__pasar-titulo">
        <Icono nombre="habitual" tamano={18} />
        {T.pasarAHabituales}
      </p>
      <p className="nota">{T.comoSePasa}</p>
      <div className="campo">
        <label htmlFor={`${id}-nombre`}>{T.nombreListo}</label>
        <input id={`${id}-nombre`} value={comida.texto} readOnly onFocus={(e) => e.currentTarget.select()} />
      </div>
      <div className="acciones">
        <button type="button" className="boton boton--secundario" onClick={() => void copiar()}>
          <Icono nombre="duplicar" tamano={18} />
          {T.copiar}
        </button>
        <Link className="boton boton--secundario" href={`/pro/advisees/nutrition?id=${encodeURIComponent(asesoradoId)}&vista=plan`}>
          <Icono nombre="plan" tamano={18} />
          {T.irAlPlan}
        </Link>
        <button type="button" className="boton boton--enlace" onClick={onCerrar}>
          {T.cerrar}
        </button>
      </div>
      {aviso ? (
        <Aviso tipo={aviso === T.copiado ? 'exito' : 'info'}>
          <p>{aviso}</p>
        </Aviso>
      ) : null}
    </div>
  );
}
