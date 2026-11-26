'use client';

/**
 * DL-197 (WP-EDITOR-ENTRENAMIENTO-TANDA-1, ET1-01, la estructura que eligió Dirección del prototipo) · la cabecera de las
 * fases y su barra horizontal:
 * - **«Fases del plan · 30 nov – 21 feb»**, con «Agregar fase» y «Configurar plan» a la derecha y el «?» en la esquina.
 * - **La barra:** cada fase es una tarjeta con su color arriba, su nombre, «Semanas 3–10» y «8 sem.», y un ancho
 *   proporcional a sus semanas. La elegida queda resaltada. Con muchas fases, la barra se desplaza de costado.
 * - **Con el teclado** es una lista de pestañas: ← y → pasan de una fase a otra (y la eligen), Inicio y Fin van a la primera
 *   y a la última; la elegida es la única en el orden de Tab.
 * - **Fases de más (F4, ET1-D03):** lo que pasa del fin del plan va rayado, y un aviso a la vista lo dice en su renglón
 *   reservado (RP-19). No se puede activar: «Antes de activar» trae las dos salidas.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';
import { Icono } from '../../../../components/icono';
import { COPY_BARRA_DE_FASES as T, faseConLaTecla, type TarjetaDeFase } from './barra-de-fases';

export function BarraDeFases({
  rango,
  tarjetas,
  elegida,
  onElegir,
  onAgregar,
  onConfigurar,
  deMas,
  onResolver,
  ayuda,
  idDelPanel,
}: {
  /** «30 nov – 21 feb», o `null` sin fechas. */
  rango: string | null;
  tarjetas: readonly TarjetaDeFase[];
  elegida: number;
  onElegir: (n: number) => void;
  onAgregar: () => void;
  /** «Configurar plan»; `null` en una plantilla (no tiene fechas ni persona). */
  onConfigurar: (() => void) | null;
  /** Las fases suman más que el plan: cuántas suman y cuánto dura el plan; `null` si entran. */
  deMas: { readonly suman: number; readonly plan: number } | null;
  onResolver: () => void;
  /** Lo que explica el «?»: qué es una fase, con un ejemplo. */
  ayuda: ReactNode;
  /** El identificador del contenido de la fase elegida (el `tabpanel`). */
  idDelPanel: string;
}) {
  const barra = useRef<HTMLDivElement>(null);
  // La elegida, siempre a la vista dentro de la barra (al elegir con el teclado o al llegar desde el almanaque).
  useEffect(() => {
    const el = barra.current?.querySelector<HTMLElement>(`[data-tarjeta-de-fase="${elegida + 1}"]`);
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [elegida]);
  return (
    <div className="barra-de-fases" data-recorrido="editor-entrenamiento-fases">
      <div className="barra-de-fases__cabecera con-ayuda-en-la-esquina">
        <h3 id="titulo-fases" className="barra-de-fases__titulo">
          {T.titulo}
          {rango ? <span className="barra-de-fases__rango"> · {rango}</span> : null}
        </h3>
        <div className="barra-de-fases__acciones">
          <button type="button" className="boton boton--quieto boton--compacto" data-agregar-bloque onClick={onAgregar}>
            <Icono nombre="mas" tamano={18} />
            {T.agregar}
          </button>
          {onConfigurar ? (
            <button type="button" id="configurar-plan" className="boton boton--secundario boton--compacto" data-configurar-plan data-recorrido="esfuerzo" onClick={onConfigurar}>
              <Icono nombre="engranaje" tamano={18} />
              {T.configurar}
            </button>
          ) : null}
        </div>
        <ExplicacionAPedido nombre="Qué es una fase" como="div" lugar="esquina">
          {ayuda}
        </ExplicacionAPedido>
      </div>
      {/* RP-19: el renglón del aviso está siempre (vacío no ocupa más que una línea) y no corre la barra. */}
      <p className="barra-de-fases__aviso" role="status" data-fases-de-mas={deMas ? `${deMas.suman}/${deMas.plan}` : undefined}>
        {deMas ? (
          <>
            <Icono nombre="aviso" tamano={15} />
            <span>{T.deMas(deMas.suman, deMas.plan)}</span>
            <button type="button" className="boton boton--discreto boton--con-flecha" data-navega data-resolver-fases-de-mas onClick={onResolver}>
              {T.resolver}
              <Icono nombre="derecha" tamano={15} />
            </button>
          </>
        ) : null}
      </p>
      {tarjetas.length > 0 ? (
        <div ref={barra} className="barra-de-fases__barra" role="tablist" aria-label={T.barra} aria-labelledby="titulo-fases" data-barra-de-fases={tarjetas.length}>
          {tarjetas.map((t) => {
            const es = t.posicion === elegida;
            return (
              <button
                key={t.posicion}
                type="button"
                role="tab"
                id={`tarjeta-de-fase-${t.numero}`}
                className="tarjeta-de-fase"
                aria-selected={es}
                aria-controls={es ? idDelPanel : undefined}
                tabIndex={es ? 0 : -1}
                data-fase={t.color}
                data-tarjeta-de-fase={t.numero}
                data-elegir-fase={t.numero}
                data-fuera={t.fuera > 0 ? '' : undefined}
                style={{ flexGrow: t.peso, ['--fuera' as string]: `${Math.round(t.fuera * 100)}%` }}
                onClick={() => onElegir(t.posicion)}
                onKeyDown={(e) => {
                  const otra = faseConLaTecla(t.posicion, tarjetas.length, e.key);
                  if (otra === null) return;
                  e.preventDefault();
                  onElegir(otra);
                  document.getElementById(`tarjeta-de-fase-${otra + 1}`)?.focus();
                }}
              >
                <span className="tarjeta-de-fase__nombre">
                  <span className="tarjeta-de-fase__numero" aria-hidden="true">
                    {t.numero}
                  </span>
                  {t.nombre}
                </span>
                <span className="tarjeta-de-fase__semanas">
                  <span>{t.desde !== null && t.hasta !== null ? T.semanas(t.desde, t.hasta) : T.sinSemanas}</span>
                  {t.semanas !== null ? <span className="tarjeta-de-fase__cuantas">{T.cuantas(t.semanas)}</span> : null}
                </span>
                {t.fuera > 0 ? <span className="visualmente-oculto">. {T.fueraDelPlan(Math.round(t.fuera * (t.semanas ?? 1)))}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
