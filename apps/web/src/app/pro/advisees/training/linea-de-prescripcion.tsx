'use client';

/**
 * ED-22 (WP-EDITORES-PROFESIONAL) y C7 de Dirección (WP-ENTRENAMIENTO-PLANIFICACION, tramo 2) · La escritura rápida, en
 * cada ejercicio de la estación: se escribe «4×8-12 RIR 2 · 60 kg · 90 s», se ve en vivo cómo se lee («Se lee: 4 series
 * · 8 a 12 · RIR 2 · 60 kg · 1:30») y «Aplicar» (o Enter, como antes) la escribe en las series de abajo. Nunca adivina: lo
 * que no entiende queda dicho, «Aplicar» queda apagado y no se aplica nada. Lo que se pierde (series con valores propios,
 * un valor propio reemplazado, un criterio % RM que pasa a RIR) se dice en la lectura, antes de aplicar. La gramática está
 * en «Cómo se lee el Plan».
 *
 * C7: lleva su rótulo a la vista («Escritura rápida»), y lo escrito sin aplicar vive en quien la muestra (`texto` y
 * `onTexto`, por ejercicio: `escritura-rapida.ts`): plegar el ejercicio, ir a otra sesión o el guardado no lo borran, y el
 * editor lo pregunta antes de salir o de activar.
 */
import { aplicarPrescripcion, COPY_PRESCRIPCION_RAPIDA as C, leerPrescripcion, vistaPreviaDePrescripcion } from '@be/domain';
import { useId, useState } from 'react';
import { Icono } from '../../../../components/icono';
import { COPY_ESCRITURA_RAPIDA as E } from './escritura-rapida';
import type { PrescripcionE } from './ejercicio-del-editor';

export function LineaDePrescripcion({
  id,
  nombre,
  prescripcion,
  onAplicar,
  texto: deAfuera,
  onTexto,
}: {
  id: string;
  nombre: string;
  prescripcion: PrescripcionE;
  onAplicar: (p: PrescripcionE, aviso: string | null) => void;
  /** El texto sin aplicar, si lo guarda quien muestra la línea; sin esto, lo guarda la línea. */
  texto?: string;
  onTexto?: (t: string) => void;
}) {
  const [propioTexto, setPropioTexto] = useState('');
  const texto = deAfuera ?? propioTexto;
  const setTexto = onTexto ?? setPropioTexto;
  const propio = useId();
  const lectura = texto.trim() === '' ? null : leerPrescripcion(texto);
  const aplicada = lectura?.ok ? aplicarPrescripcion(prescripcion, lectura.leida) : null;
  // C7: «Aplicar» a la vista; apagado (con `aria-disabled`, que conserva el foco) mientras no haya qué aplicar, y la
  // lectura de abajo dice por qué.
  const sinAplicar = !lectura ? E.sinTexto : !lectura.ok ? lectura.noSeEntiende : null;
  const aplicar = () => {
    if (!aplicada) return;
    onAplicar(aplicada.prescripcion, aplicada.cambio.carga.revisar);
    setTexto('');
  };
  return (
    <div className="linea-de-prescripcion" data-linea-de-prescripcion data-sin-aplicar={texto.trim() !== '' ? '' : undefined}>
      <label htmlFor={`${id}-linea`} className="linea-de-prescripcion__rotulo">
        {E.rotulo}
        <span className="visualmente-oculto"> de {nombre}</span>
      </label>
      <div className="linea-de-prescripcion__fila">
        <input
          id={`${id}-linea`}
          className="linea-de-prescripcion__campo"
          autoComplete="off"
          spellCheck={false}
          // C7: un ejemplo que no se lee como algo ya cargado.
          placeholder="Ej.: 4×8-12 RIR 2 · 60 kg · 90 s"
          aria-describedby={`${propio}-lectura`}
          aria-invalid={lectura && !lectura.ok ? true : undefined}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            aplicar();
          }}
        />
        <button
          type="button"
          className="boton boton--secundario boton--compacto"
          data-aplicar-la-linea
          aria-disabled={sinAplicar ? true : undefined}
          aria-describedby={`${propio}-lectura`}
          onClick={aplicar}
        >
          <Icono nombre="aplicar" tamano={15} />
          {E.aplicar}
          <span className="visualmente-oculto"> a {nombre}</span>
        </button>
      </div>
      <p id={`${propio}-lectura`} className="nota linea-de-prescripcion__lectura" aria-live="polite" data-lectura-de-la-linea>
        {!lectura ? E.ayuda : lectura.ok ? C.seLee(vistaPreviaDePrescripcion(lectura.leida)) : lectura.noSeEntiende}
        {aplicada && aplicada.cambio.sePierde.length > 0 ? (
          <span className="linea-de-prescripcion__se-pierde" data-se-pierde>
            {' '}
            Se pierde: {aplicada.cambio.sePierde.join(' · ')}.
          </span>
        ) : null}
      </p>
    </div>
  );
}
