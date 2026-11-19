'use client';

/**
 * «Mis enfoques» (GR-27; WP-GRAFICOS rama E, DL-174 y DL-183): un cajón con la lista de tus enfoques, en cuántos lugares
 * está elegido cada uno (sin decir quiénes: GR-T63), y renombrar, duplicar, elegir para esta persona y borrar. Borrar
 * avisa antes en cuántos lugares estaba elegido, y esos lugares vuelven a los sugeridos para tus áreas (GR-T10).
 *
 * Un enfoque es configuración del profesional: no entra en la exportación de la persona (GR-T11) y su nombre lleva la
 * pista de no poner datos de salud, porque se usa con varias personas.
 */
import {
  avisoAlBorrar,
  LARGO_MAXIMO_DEL_NOMBRE_DEL_ENFOQUE,
  MAXIMO_DE_ENFOQUES,
  nombreDeLaCopia,
  textoDeLosLugares,
  type Enfoque,
  type Resultado,
} from '@be/domain';
import { useId, useState } from 'react';
import { Cajon } from '../../../../../components/cajon';
import { BloqueDeEstado, Cargando } from '../../../../../components/estados';
import { Icono } from '../../../../../components/icono';
import { textoDeFalla } from '../../../../../lib/fallas';
import { mensajeDeFallo } from '../../../../../lib/intento';
import type { LecturaDeEnfoques } from './lecturas-de-los-enfoques';
import { COPY_DE_PATRONES as C } from './patrones';

export const COPY_MIS_ENFOQUES = {
  titulo: 'Mis enfoques',
  detalle: 'Tus conjuntos de gráficos. Cada uno se elige para una persona o para un plan y queda hasta que lo cambies.',
  ninguno: 'Todavía no guardaste ningún enfoque. En «Patrones», «Guardar lo que ves como enfoque…» guarda los gráficos que estás mirando.',
  graficos: (n: number) => (n === 1 ? '1 gráfico' : `${n} gráficos`),
  elegidoAca: 'Elegido para esta persona',
  elegir: 'Elegir para esta persona',
  renombrar: 'Renombrar',
  duplicar: 'Duplicar',
  borrar: 'Borrar',
  confirmarBorrar: 'Sí, borrar',
  noBorrar: 'No borrar',
  guardarNombre: 'Guardar el nombre',
  cancelar: 'Cancelar',
  tope: `Hasta ${MAXIMO_DE_ENFOQUES} enfoques: para duplicar, borrá uno.`,
  queSeLee: 'tus enfoques',
} as const;

const M = COPY_MIS_ENFOQUES;

export interface PropsDeMisEnfoques {
  readonly abierto: boolean;
  readonly lectura: LecturaDeEnfoques;
  readonly recargar: () => void;
  /** El que está elegido en esta pantalla, si hay uno. */
  readonly elegidoId: string | null;
  readonly sobretitulo?: string | null;
  readonly onElegir: ((e: Enfoque) => void) | null;
  readonly crear: (nombre: string, contenido: Enfoque['content']) => Promise<Resultado<unknown>>;
  readonly reemplazar: (e: Pick<Enfoque, 'setId' | 'version'>, nombre: string, contenido: Enfoque['content']) => Promise<Resultado<unknown>>;
  readonly borrar: (setId: string) => Promise<Resultado<unknown>>;
  readonly onCerrar: () => void;
}

export function MisEnfoques({ abierto, lectura, recargar, elegidoId, sobretitulo = null, onElegir, crear, reemplazar, borrar, onCerrar }: PropsDeMisEnfoques) {
  const id = useId();
  const [renombrando, setRenombrando] = useState<{ readonly setId: string; readonly nombre: string } | null>(null);
  const [porBorrar, setPorBorrar] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const enfoques = lectura.tipo === 'lista' ? lectura.enfoques : [];
  const tope = enfoques.length >= MAXIMO_DE_ENFOQUES;

  const hacer = async (accion: () => Promise<Resultado<unknown>>, despues?: () => void) => {
    setOcupado(true);
    setAviso(null);
    const r = await accion();
    setOcupado(false);
    if (!r.ok) {
      setAviso(r.tipo === 'API' && r.codigo === 'TOO_MANY_SETS' ? C.tantosEnfoques : r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT' ? C.cambioDeOtraPestana : mensajeDeFallo(r));
      return;
    }
    despues?.();
  };

  return (
    <Cajon abierto={abierto} titulo={M.titulo} sobretitulo={sobretitulo} ocupado={ocupado} onCerrar={onCerrar}>
      <div className="mis-enfoques" data-mis-enfoques>
        <p className="nota">{M.detalle}</p>
        {aviso ? (
          <p className="campo__error" role="alert">
            {aviso}
          </p>
        ) : null}
        {lectura.tipo === 'cargando' ? <Cargando /> : null}
        {lectura.tipo === 'error' ? (
          <BloqueDeEstado tipo="error" icono="aviso" onReintentar={recargar} textoDelBoton="Reintentar" rol="alert">
            {textoDeFalla(lectura.motivo, M.queSeLee)}
          </BloqueDeEstado>
        ) : null}
        {lectura.tipo === 'lista' && enfoques.length === 0 ? <p className="nota">{M.ninguno}</p> : null}
        <ul className="mis-enfoques__lista">
          {enfoques.map((e) => {
            const elegido = e.setId === elegidoId;
            return (
              <li key={e.setId} className="mis-enfoques__enfoque" data-enfoque={e.setId}>
                {renombrando?.setId === e.setId ? (
                  <form
                    className="mis-enfoques__renombrar"
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      if (renombrando.nombre.trim() === '') return;
                      void hacer(() => reemplazar(e, renombrando.nombre, e.content), () => setRenombrando(null));
                    }}
                  >
                    <div className="campo">
                      <label htmlFor={`${id}-${e.setId}`}>{C.nombreDelEnfoque}</label>
                      <input
                        id={`${id}-${e.setId}`}
                        type="text"
                        maxLength={LARGO_MAXIMO_DEL_NOMBRE_DEL_ENFOQUE}
                        value={renombrando.nombre}
                        aria-describedby={`${id}-${e.setId}-pista`}
                        onChange={(ev) => setRenombrando({ setId: e.setId, nombre: ev.target.value })}
                      />
                      <p id={`${id}-${e.setId}-pista`} className="campo__pista">
                        {C.pistaDelNombre}
                      </p>
                    </div>
                    <div className="mis-enfoques__acciones">
                      <button type="submit" className="boton boton--primario boton--compacto" disabled={ocupado || renombrando.nombre.trim() === ''}>
                        {M.guardarNombre}
                      </button>
                      <button type="button" className="boton boton--quieto boton--compacto" onClick={() => setRenombrando(null)}>
                        {M.cancelar}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="mis-enfoques__nombre">
                      <strong>{e.name}</strong>
                      <span className="nota">
                        {M.graficos(e.content.charts.length)} · {textoDeLosLugares(e.choices)}
                        {elegido ? ` · ${M.elegidoAca}` : ''}
                      </span>
                    </div>
                    {porBorrar === e.setId ? (
                      <div className="mis-enfoques__confirmar" role="group" aria-label={`${M.borrar} «${e.name}»`}>
                        <p>{avisoAlBorrar(e.choices)}</p>
                        <div className="mis-enfoques__acciones">
                          <button type="button" className="boton boton--peligro boton--compacto" disabled={ocupado} onClick={() => void hacer(() => borrar(e.setId), () => setPorBorrar(null))} data-confirmar-borrar>
                            {M.confirmarBorrar}
                          </button>
                          <button type="button" className="boton boton--quieto boton--compacto" onClick={() => setPorBorrar(null)}>
                            {M.noBorrar}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mis-enfoques__acciones">
                        {onElegir && !elegido ? (
                          <button type="button" className="boton boton--secundario boton--compacto" disabled={ocupado} onClick={() => onElegir(e)} data-elegir-enfoque>
                            {M.elegir}
                          </button>
                        ) : null}
                        <button type="button" className="boton boton--quieto boton--compacto" disabled={ocupado} onClick={() => setRenombrando({ setId: e.setId, nombre: e.name })}>
                          <Icono nombre="texto" tamano={18} />
                          {M.renombrar}
                        </button>
                        <button
                          type="button"
                          className="boton boton--quieto boton--compacto"
                          disabled={ocupado || tope}
                          title={tope ? M.tope : undefined}
                          onClick={() =>
                            void hacer(() =>
                              crear(
                                nombreDeLaCopia(
                                  e.name,
                                  enfoques.map((x) => x.name),
                                ),
                                e.content,
                              ),
                            )
                          }
                        >
                          <Icono nombre="duplicar" tamano={18} />
                          {M.duplicar}
                        </button>
                        <button type="button" className="boton boton--quieto boton--compacto" disabled={ocupado} onClick={() => setPorBorrar(e.setId)} data-borrar-enfoque>
                          <Icono nombre="cerrar" tamano={18} />
                          {M.borrar}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
        {tope ? <p className="nota">{M.tope}</p> : null}
      </div>
    </Cajon>
  );
}
