'use client';

/**
 * ED-07 · El cuadro «Antes de activar la versión 9 de Entrenamiento» (WP-EDITORES-PROFESIONAL; DJ-6; maqueta 10 de la v3).
 * La regla y los textos están en `antes-de-activar.ts`; los cambios, en `comparar-versiones.ts`. (El archivo se llama
 * distinto que la regla para que `./antes-de-activar` no sea ambiguo.)
 *
 * - Abre siempre, también con algo por corregir, y dice en este orden: lo que impide activar (cada cosa con «Ir a
 *   corregir», que lleva a su lugar) y lo que queda sin completar (sin bloquear); lo que cambia frente a la vigente; lo
 *   que va a ver la persona; y «¿Cuándo la revisás?», con «Sin fecha por ahora» y nada elegido.
 * - Con cambios sin guardar, ofrece primero «Guardar ahora»: lo que se activa es lo que guardó el servidor.
 * - Un solo botón principal, «Activar la versión 9 de Entrenamiento», apagado con su motivo a la vista mientras falte
 *   algo. Al abrirse, el foco va a «Volver al plan»: la acción de efecto nunca es la opción por defecto.
 * - Lo que pasa mientras se revisa se anuncia (`role="status"`); cada parte tiene su título y su ícono, nunca solo color.
 */
import { COPY_GUARDADO } from '@be/domain';
import type { ReactNode } from 'react';
import { DialogoDeConfirmacion } from '../../../components/dialogo';
import { Icono } from '../../../components/icono';
import { CAMBIOS_A_LA_VISTA, COPY_ANTES_DE_ACTIVAR as A, motivoDelPrincipal, type AreaQueSeActiva } from './antes-de-activar';
import { textoDeLosContadores, type CambiosFrenteALaVigente } from './comparar-versiones';

/** Una cosa que impide activar o que queda sin completar, con el camino a su lugar si lo tiene. */
export interface CosaParaRevisar {
  readonly texto: string;
  readonly ir?: (() => void) | null;
}

export function AntesDeActivar({
  abierto,
  area,
  persona,
  numero,
  vigente,
  primera,
  impiden,
  sinCompletar,
  revisando,
  sinRevisar,
  onVolverARevisar,
  sinGuardar,
  guardando,
  conflicto = false,
  onGuardarAhora,
  cambios,
  loQueVe,
  cuando,
  eligioCuando,
  activando,
  error,
  onActivar,
  onVolver,
}: {
  abierto: boolean;
  area: AreaQueSeActiva;
  /** El nombre de la persona o su referencia neutral (DL-169): «Lo que va a ver Diego». `null` mientras no se leyó. */
  persona: string | null;
  /** El número de esta versión: el de las activadas más uno (DJ-6). */
  numero: number;
  /** El número de la vigente, que queda en el historial; `null` si es la primera o no se pudo leer. */
  vigente: number | null;
  /** Es la primera versión del plan (no sale de otra). */
  primera: boolean;
  impiden: readonly CosaParaRevisar[];
  sinCompletar: readonly CosaParaRevisar[];
  revisando: boolean;
  /** La revisión de la API no se pudo hacer: se ofrece volver a revisar. */
  sinRevisar: boolean;
  onVolverARevisar: () => void;
  sinGuardar: boolean;
  guardando: boolean;
  /** El borrador cambió en otra pestaña (409): el principal y «Guardar ahora» quedan apagados hasta cargar lo guardado. */
  conflicto?: boolean;
  onGuardarAhora: () => void;
  /** Frente a la vigente; en la primera versión, frente a nada (todo es «agregado»). `null` si la vigente no se pudo leer. */
  cambios: CambiosFrenteALaVigente | null;
  loQueVe: readonly string[];
  /** «¿Cuándo la revisás?», el de siempre (REG-06-145 y TB-15). */
  cuando: ReactNode;
  eligioCuando: boolean;
  activando: boolean;
  error: string | null;
  onActivar: () => void;
  onVolver: () => void;
}) {
  const motivo = motivoDelPrincipal({ impiden: impiden.length, revisando, sinRevisar, sinGuardar, eligioCuando, conflicto });
  const aLaVista = cambios ? cambios.lista.slice(0, CAMBIOS_A_LA_VISTA) : [];
  return (
    <DialogoDeConfirmacion
      abierto={abierto}
      ancho
      titulo={A.titulo(numero, area)}
      textoVolver={A.volverAlPlan}
      textoConfirmar={A.activar(numero, area)}
      textoEnviando={A.activando}
      enviando={activando}
      error={error}
      focoEnVolver
      confirmarDeshabilitado={motivo !== null}
      motivo={motivo}
      onVolver={onVolver}
      onConfirmar={onActivar}
    >
      <p className="nota antes-de-activar__bajada">{A.bajada(vigente, primera)}</p>
      <div className="antes-de-activar" data-antes-de-activar>
        <div className="antes-de-activar__columna">
          {sinGuardar ? (
            <section className="antes-de-activar__parte antes-de-activar__sin-guardar" data-sin-guardar>
              <p>
                <Icono nombre="borrador" tamano={18} />
                <span>{A.cambiosSinGuardar}</span>
              </p>
              <button type="button" className="boton boton--secundario" data-guardar-ahora aria-disabled={guardando || conflicto || undefined} onClick={() => !guardando && !conflicto && onGuardarAhora()}>
                <Icono nombre="guardar" tamano={18} />
                {guardando ? COPY_GUARDADO.guardando : COPY_GUARDADO.guardarAhora}
              </button>
            </section>
          ) : null}

          <section className="antes-de-activar__parte" data-lo-que-impide aria-labelledby="antes-de-activar-impide">
            <h3 id="antes-de-activar-impide">
              <Icono nombre="aviso" tamano={18} />
              {A.loQueImpide}
              {impiden.length > 0 ? ` · ${impiden.length}` : ''}
            </h3>
            <p className="nota" role="status" aria-live="polite">
              {revisando ? A.revisando : sinRevisar && !sinGuardar ? A.noSePudoRevisar : impiden.length === 0 && !sinGuardar ? A.nadaImpide : ''}
            </p>
            {sinRevisar && !sinGuardar && !revisando ? (
              <button type="button" className="boton boton--quieto boton--compacto" onClick={onVolverARevisar}>
                <Icono nombre="actualizar" tamano={15} />
                {A.volverARevisar}
              </button>
            ) : null}
            {impiden.length > 0 ? (
              <ul className="antes-de-activar__lista" data-impiden>
                {impiden.map((c, n) => (
                  <li key={n}>
                    <span>{c.texto}</span>
                    {c.ir ? (
                      <button type="button" className="boton boton--quieto boton--compacto" onClick={c.ir}>
                        {A.irACorregir}
                        <Icono nombre="derecha" tamano={15} />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {sinCompletar.length > 0 ? (
              <>
                <p className="nota">{A.sinCompletar}</p>
                <ul className="antes-de-activar__lista" data-sin-completar>
                  {sinCompletar.map((c, n) => (
                    <li key={n}>
                      <span>{c.texto}</span>
                      {c.ir ? (
                        <button type="button" className="boton boton--enlace" onClick={c.ir}>
                          {A.ir}
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <p className="nota">{A.noJuzga}</p>
          </section>

          <section className="antes-de-activar__parte" data-lo-que-cambia aria-labelledby="antes-de-activar-cambia">
            <h3 id="antes-de-activar-cambia">
              <Icono nombre="comparar" tamano={18} />
              {primera || vigente === null ? A.loQueTiene : A.loQueCambia(vigente)}
            </h3>
            {primera ? <p className="nota">{A.primeraVersion}</p> : null}
            {cambios === null ? (
              primera ? null : <p>{A.sinLaVigente}</p>
            ) : cambios.lista.length === 0 ? (
              <p>{A.sinCambios}</p>
            ) : (
              <>
                <p className="antes-de-activar__contadores" data-contadores>
                  <strong>{textoDeLosContadores(cambios)}</strong>
                </p>
                <ul className="antes-de-activar__lista">
                  {aLaVista.map((t, n) => (
                    <li key={n}>{t}</li>
                  ))}
                </ul>
                {cambios.lista.length > aLaVista.length ? <p className="nota">{A.yMas(cambios.lista.length - aLaVista.length)}</p> : null}
              </>
            )}
          </section>
        </div>

        <div className="antes-de-activar__columna">
          <section className="antes-de-activar__parte" data-lo-que-ve aria-labelledby="antes-de-activar-ve">
            <h3 id="antes-de-activar-ve">
              <Icono nombre="ver" tamano={18} />
              {A.loQueVe(persona)}
            </h3>
            <ul className="antes-de-activar__lista">
              {loQueVe.map((t, n) => (
                <li key={n}>{t}</li>
              ))}
            </ul>
          </section>
          <section className="antes-de-activar__parte">{cuando}</section>
        </div>
      </div>
    </DialogoDeConfirmacion>
  );
}
