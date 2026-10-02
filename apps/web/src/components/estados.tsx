'use client';

/**
 * Estados de carga compartidos (10-B10:343-378): «Cargando…» sin datos ficticios, error con «Reintentar», y «Ver más»
 * para listas por cursor. DL-113 suma el estado vacío con su paso siguiente, para que todas las pantallas lo digan
 * igual: qué falta y qué se puede hacer, nunca un cero.
 */
import { COPY } from '@be/domain';
import type { ReactNode } from 'react';
import type { EstadoDeLista } from '../lib/lista';
import { Aviso } from './formulario';

/** Una región de estado: el lector de pantalla anuncia que se está cargando, y la marca respeta «reducir movimiento». */
export function Cargando() {
  return (
    <p className="cargando" role="status">
      Cargando…
    </p>
  );
}

/** Lo que todavía no hay, dicho como tal, con el paso siguiente si existe (una acción real, nunca un dato inventado). */
export function EstadoVacio({ titulo, children, accion }: { titulo: string; children?: ReactNode; accion?: ReactNode }) {
  return (
    <div className="estado-vacio">
      <p className="estado-vacio__titulo">{titulo}</p>
      {children}
      {accion ? <div className="acciones">{accion}</div> : null}
    </div>
  );
}

export function ErrorConReintento({ mensaje = COPY.errorDeVista, onReintentar }: { mensaje?: string; onReintentar: () => void }) {
  return (
    <Aviso tipo="error">
      <p>
        {mensaje}{' '}
        <button type="button" className="boton boton--enlace" onClick={onReintentar}>
          {COPY.reintentar}
        </button>
      </p>
    </Aviso>
  );
}

export function VerMas<T>({ estado, onVerMas }: { estado: EstadoDeLista<T>; onVerMas: () => void }) {
  if (estado.tipo !== 'listo' || !estado.siguiente) return null;
  return (
    <div className="acciones">
      {estado.mas === 'error' ? <p className="nota">{COPY.errorDeVista}</p> : null}
      <button type="button" className="boton boton--secundario" onClick={onVerMas} disabled={estado.mas === 'cargando'} aria-busy={estado.mas === 'cargando'}>
        {estado.mas === 'cargando' ? 'Cargando…' : estado.mas === 'error' ? COPY.reintentar : 'Ver más'}
      </button>
    </div>
  );
}
