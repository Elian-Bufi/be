'use client';

/**
 * El estado de escritura de un borrador, igual en todos los editores (bloque 3 del encargo de consolidación): «Guardando…»,
 * «Guardado a las…» (solo con la respuesta del servidor), «Pendiente de guardar» y «No se pudo guardar». Discreto, al lado
 * de las acciones, y anunciado por el lector de pantalla cuando cambia. La regla y los textos están en el dominio
 * (`estadoDeGuardado`); el ícono acompaña al texto, nunca lo reemplaza.
 *
 * **ED-03 (WP-EDITORES-PROFESIONAL):** un fallo que no es el conflicto ofrece «Reintentar» (guarda con lo que está en
 * pantalla) y, plegado, el detalle técnico: la operación, el motivo, el código de la respuesta y la hora, sin datos de
 * la persona. El conflicto tiene su propio aviso, con «Cargar la versión guardada».
 */
import { COPY_GUARDADO, estadoDeGuardado, textoDelDetalleDelFallo, type DetalleDelFallo, type EntradaDeGuardado } from '@be/domain';
import { Icono } from './icono';

const ICONO = { guardando: 'reloj', guardado: 'tilde', pendiente: 'borrador', fallo: 'aviso' } as const;

export function EstadoDeGuardado({
  className,
  onReintentar,
  detalle = null,
  ...entrada
}: EntradaDeGuardado & {
  className?: string;
  /** «Reintentar»: guarda ya, con lo que está en pantalla. Sin él, el fallo se dice sin el botón. */
  onReintentar?: () => void;
  /** El detalle técnico del último fallo (ED-03). */
  detalle?: DetalleDelFallo | null;
}) {
  const { tipo, texto } = estadoDeGuardado(entrada);
  const conFallo = tipo === 'fallo' && !entrada.conflicto;
  return (
    <>
      <p className={['estado-de-guardado', className].filter(Boolean).join(' ')} data-estado={tipo} role="status" aria-live="polite">
        <Icono nombre={ICONO[tipo]} tamano={15} />
        {texto}
      </p>
      {conFallo && onReintentar ? (
        <button type="button" className="boton boton--quieto boton--compacto estado-de-guardado__reintentar" data-reintentar onClick={onReintentar}>
          <Icono nombre="actualizar" tamano={15} />
          {COPY_GUARDADO.reintentar}
        </button>
      ) : null}
      {conFallo && detalle ? (
        <details className="estado-de-guardado__detalle" data-detalle-tecnico>
          <summary>{COPY_GUARDADO.detalleTecnico}</summary>
          <p className="nota">{textoDelDetalleDelFallo(detalle)}</p>
        </details>
      ) : null}
    </>
  );
}
