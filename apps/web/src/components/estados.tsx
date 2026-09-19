'use client';

/**
 * Estados de carga compartidos (10-B10:343-378): «Cargando…» sin datos ficticios, error con «Reintentar», y «Ver más»
 * para listas por cursor.
 */
import { COPY } from '@be/domain';
import type { EstadoDeLista } from '../lib/lista';
import { Aviso } from './formulario';

export function Cargando() {
  return <p aria-busy="true">Cargando…</p>;
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
