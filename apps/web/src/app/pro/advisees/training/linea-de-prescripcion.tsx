'use client';

/**
 * ED-22 (WP-EDITORES-PROFESIONAL) · La prescripción en una línea, en cada ejercicio de la estación: se escribe
 * «4×8-12 RIR 2 · 60 kg · 90 s», se ve la vista previa («Se lee: 4 series · 8 a 12 · RIR 2 · 60 kg · 1:30») y Enter la
 * aplica. Nunca adivina: lo que no entiende queda dicho y no se aplica nada. Lo que se pierde (series con valores propios,
 * un valor propio reemplazado) se dice en la vista previa, antes de Enter. La gramática está en «Atajos».
 */
import { aplicarPrescripcion, COPY_PRESCRIPCION_RAPIDA as C, leerPrescripcion, vistaPreviaDePrescripcion } from '@be/domain';
import { useId, useState } from 'react';
import type { PrescripcionE } from './ejercicio-del-editor';

export function LineaDePrescripcion({ id, nombre, prescripcion, onAplicar }: { id: string; nombre: string; prescripcion: PrescripcionE; onAplicar: (p: PrescripcionE, aviso: string | null) => void }) {
  const [texto, setTexto] = useState('');
  const propio = useId();
  const lectura = texto.trim() === '' ? null : leerPrescripcion(texto);
  const aplicada = lectura?.ok ? aplicarPrescripcion(prescripcion, lectura.leida) : null;
  return (
    <div className="linea-de-prescripcion" data-linea-de-prescripcion>
      <label htmlFor={`${id}-linea`} className="visualmente-oculto">
        {C.rotulo} de {nombre}
      </label>
      <input
        id={`${id}-linea`}
        className="linea-de-prescripcion__campo"
        autoComplete="off"
        spellCheck={false}
        placeholder="4×8-12 RIR 2 · 60 kg · 90 s"
        aria-describedby={`${propio}-lectura`}
        aria-invalid={lectura && !lectura.ok ? true : undefined}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          if (!aplicada) return;
          onAplicar(aplicada.prescripcion, aplicada.cambio.carga.revisar);
          setTexto('');
        }}
      />
      <kbd className="linea-de-prescripcion__tecla" aria-hidden="true">
        Enter
      </kbd>
      <p id={`${propio}-lectura`} className="nota linea-de-prescripcion__lectura" aria-live="polite">
        {!lectura ? C.ayuda : lectura.ok ? C.seLee(vistaPreviaDePrescripcion(lectura.leida)) : lectura.noSeEntiende}
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
