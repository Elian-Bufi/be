'use client';

/**
 * El estado de escritura de un borrador, igual en todos los editores (bloque 3 del encargo de consolidación): «Guardando…»,
 * «Guardado a las…» (solo con la respuesta del servidor), «Pendiente de guardar» y «No se pudo guardar». Discreto, al lado
 * de las acciones, y anunciado por el lector de pantalla cuando cambia. La regla y los textos están en el dominio
 * (`estadoDeGuardado`); el ícono acompaña al texto, nunca lo reemplaza.
 */
import { estadoDeGuardado, type EntradaDeGuardado } from '@be/domain';
import { Icono } from './icono';

const ICONO = { guardando: 'reloj', guardado: 'tilde', pendiente: 'borrador', fallo: 'aviso' } as const;

export function EstadoDeGuardado({ className, ...entrada }: EntradaDeGuardado & { className?: string }) {
  const { tipo, texto } = estadoDeGuardado(entrada);
  return (
    <p className={['estado-de-guardado', className].filter(Boolean).join(' ')} data-estado={tipo} role="status" aria-live="polite">
      <Icono nombre={ICONO[tipo]} tamano={15} />
      {texto}
    </p>
  );
}
