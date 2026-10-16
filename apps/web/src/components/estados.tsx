'use client';

/**
 * Estados de carga compartidos (10-B10:343-378): «Cargando…» sin datos ficticios, error con «Reintentar», y «Ver más»
 * para listas por cursor. DL-113 suma el estado vacío con su paso siguiente, para que todas las pantallas lo digan
 * igual: qué falta y qué se puede hacer, nunca un cero.
 */
import { COPY, type NombreDeIcono } from '@be/domain';
import type { ReactNode } from 'react';
import type { EstadoDeLista } from '../lib/lista';
import { Aviso } from './formulario';
import { Icono } from './icono';

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

/**
 * Un estado dicho en el lugar de lo que falta (WP-ESCRITORIO-AMABLE, pantallas 15 y 19): un ícono, qué pasó, por qué y
 * qué se puede hacer. Se reconoce por el ícono y por el título, no por un color. Lo usan el gráfico de una métrica en
 * «Analizar» y un indicador o una tarjeta del Resumen: una falla nunca se presenta como ausencia de datos, y una
 * ausencia nunca como un cero.
 */
export function BloqueDeEstado({
  tipo,
  icono,
  titulo = null,
  children,
  onReintentar = null,
  deQue,
}: {
  /** Va en la clase del bloque. `cargando` se dibuja con borde punteado y se anuncia al lector de pantalla. */
  tipo: string;
  icono: NombreDeIcono;
  titulo?: string | null;
  children: ReactNode;
  onReintentar?: (() => void) | null;
  /** Qué se reintenta, para el lector de pantalla cuando hay varios «Reintentar» en la vista. */
  deQue?: string;
}) {
  return (
    <div className={`estado-de-grafico estado-de-grafico--${tipo}`} role={tipo === 'cargando' ? 'status' : undefined}>
      <Icono nombre={icono} tamano={24} />
      <div className="estado-de-grafico__texto">
        {titulo ? <p className="estado-de-grafico__titulo">{titulo}</p> : null}
        <p className="nota">{children}</p>
      </div>
      {onReintentar ? (
        <button type="button" className="boton boton--secundario boton--compacto" onClick={onReintentar}>
          <Icono nombre="actualizar" tamano={18} />
          Reintentar{deQue ? <span className="visualmente-oculto"> {deQue}</span> : null}
        </button>
      ) : null}
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
