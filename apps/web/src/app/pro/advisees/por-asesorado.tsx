'use client';

/**
 * Lo de adentro se monta una vez por asesorado (bloque 3 del encargo de consolidación, 2026-10-19: «al cambiar de
 * asesorado, limpiar los datos y selecciones que pertenecen al anterior»). Sin esto, pasar de una persona a otra sin
 * salir de la página —un pendiente, una novedad, un enlace— dejaba a la vista lo leído y lo elegido de la anterior hasta
 * que llegaba lo nuevo. Con la clave, todo eso se descarta y se lee de nuevo para la persona que se abrió.
 * Lo escrito y todavía sin guardar de la anterior también se descarta: los editores de plan lo guardan solos en la
 * primera pausa (DL-148), y nada se guarda en el navegador.
 */
import { useSearchParams } from 'next/navigation';
import { Fragment, type ReactNode } from 'react';

export function PorAsesorado({ children }: { children: ReactNode }) {
  const id = useSearchParams().get('id') ?? '';
  return <Fragment key={id}>{children}</Fragment>;
}
