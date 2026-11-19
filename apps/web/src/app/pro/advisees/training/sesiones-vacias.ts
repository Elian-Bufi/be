/**
 * C11 de Dirección (WP-ENTRENAMIENTO-PLANIFICACION, tramo 2) · «Sesiones vacías»: con una cantidad (3, por ejemplo), la
 * fase que se mira recibe Sesión A, B y C de una vez, sin pedir nombre ni propósito. Sin React.
 *
 * - **Se llaman como las de «Agregar sesión»:** «Sesión A», «Sesión B»…, siguiendo las que ya hay; el nombre se cambia
 *   cuando se quiera. No eligen un enfoque de entrenamiento («Tres sesiones» no es «Cuerpo entero»): están vacías.
 * - **Nacen con su identificador** (ENP-D17): sus días se eligen enseguida, junto a cada una.
 * - **Hasta 7 de una vez,** dentro del tope de la fase (30) o del microciclo (14): lo que no entra no se ofrece.
 */
import type { SesionE } from './ejercicio-del-editor';

/** «Sesión A», «Sesión B»… (la 27 en adelante sigue siendo «Sesión Z», como «Agregar sesión»). */
export const nombreDeSesionVacia = (n: number): string => `Sesión ${String.fromCharCode(64 + Math.min(Math.max(n, 1), 26))}`;

/** `cuantas` sesiones vacías, numeradas después de las `yaHay` que tiene la fase, cada una con su identificador. */
export function sesionesVacias(cuantas: number, yaHay: number, nuevoId: () => string): SesionE[] {
  return Array.from({ length: cuantas }, (_, n) => ({ sessionId: nuevoId(), label: nombreDeSesionVacia(yaHay + n + 1), instructions: null, prescriptions: [] }));
}

/** Las cantidades que se ofrecen: de 1 a 7, sin pasar el tope de sesiones del lugar. */
export const cantidadesDeSesionesVacias = (yaHay: number, tope: number): number[] => Array.from({ length: Math.max(0, Math.min(7, tope - yaHay)) }, (_, n) => n + 1);

/** «Sesión A», «Sesión A y B», «Sesión A, B y C», «Sesión A a E». */
export function cualesSeArman(cuantas: number, yaHay: number): string {
  const letra = (n: number) => nombreDeSesionVacia(yaHay + n).slice('Sesión '.length);
  if (cuantas <= 1) return `Sesión ${letra(1)}`;
  if (cuantas === 2) return `Sesión ${letra(1)} y ${letra(2)}`;
  if (cuantas === 3) return `Sesión ${letra(1)}, ${letra(2)} y ${letra(3)}`;
  return `Sesión ${letra(1)} a ${letra(cuantas)}`;
}

export const COPY_SESIONES_VACIAS = {
  titulo: 'Sesiones vacías',
  cuantas: 'Cuántas sesiones',
  armar: (cuantas: number, yaHay: number) => `Armar ${cualesSeArman(cuantas, yaHay)}`,
  ayuda: 'Sin nombre ni propósito: se llaman Sesión A, B, C… y el nombre se cambia cuando quieras. Sus días se eligen al costado.',
  /** PLT (DL-182): una plantilla no tiene días. */
  ayudaEnLaPlantilla: 'Sin nombre ni propósito: se llaman Sesión A, B, C… y el nombre se cambia cuando quieras.',
  armadas: (cuantas: number, yaHay: number) => `Quedaron ${cualesSeArman(cuantas, yaHay)}, vacías. Elegí sus días en la lista y agregá ejercicios a cada una.`,
} as const;
