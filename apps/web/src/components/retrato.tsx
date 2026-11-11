/**
 * El monograma de una persona (WP-TABLERO-ALTA-GAMA TB-05; DL-163 D-2): sus iniciales en tinta neutra sobre un círculo
 * de un solo tono, el mismo para todos. Va donde el profesional ya ve el nombre: «Pendientes» (después, «Te toca a
 * vos»), «Tus asesorados», el marco de la ficha, las notas del equipo, las novedades y el menú de la cuenta. Nunca en las
 * solicitudes ni en las invitaciones a quien no tiene un vínculo vigente, ni en los avisos, ni en Administración.
 *
 * - **Decorativo:** el nombre está escrito al lado; el lector de pantalla no oye las iniciales.
 * - **Sin nombre** (la referencia neutral, o con «Ocultar nombres»), el ícono «persona»: las iniciales nunca se inventan.
 * - **Tres tamaños:** chico en las filas y las notas, medio en el directorio, las novedades y el menú, y grande en el
 *   marco de la ficha.
 * - Nunca un aro alrededor, ni un color por persona, ni un estado de la persona encima (D-2; §7 del paquete).
 */
import { inicialesDe } from '../lib/retrato';
import { Icono } from './icono';

export type TamanoDelRetrato = 'chico' | 'medio' | 'grande';

const ICONO: Readonly<Record<TamanoDelRetrato, 15 | 18 | 24>> = { chico: 15, medio: 18, grande: 24 };

/** `nombre` es el que se ve en pantalla: con «Ocultar nombres», ya es la referencia, y el monograma lleva el ícono. */
export function Retrato({ nombre, tamano = 'chico' }: { nombre: string | null | undefined; tamano?: TamanoDelRetrato }) {
  const iniciales = inicialesDe(nombre);
  return (
    <span className={`retrato retrato--${tamano}`} aria-hidden="true" data-retrato={iniciales ? 'iniciales' : 'persona'}>
      {iniciales ?? <Icono nombre="persona" tamano={ICONO[tamano]} />}
    </span>
  );
}
