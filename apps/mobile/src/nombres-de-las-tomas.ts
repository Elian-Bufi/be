/**
 * Las tomas por su fecha (DL-170, AV2-20): «2 sept», «9 nov», nunca «T1» ni «T2». El dominio sigue numerando las tomas
 * del período (`tomasDelPeriodo`, `etiqueta: T{n}`) y esa clave puede seguir adentro, pero la APK no la muestra: «T1»
 * era jerga, y cambiaba de sentido con el período. El cambio va en la APK y no en el dominio, para no redesplegar
 * (AV2-T13).
 *
 * Si dos tomas caen el mismo día, se distinguen por su orden en ese día: «9 nov (1)» y «9 nov (2)». Es un módulo puro:
 * la prueba lo usa sin React.
 */
import { fechaCorta } from './formato';

/** Las tomas con su `etiqueta` cambiada por la fecha corta, en el mismo orden. */
export function conNombresPorFecha<T extends { readonly fecha: string; readonly etiqueta: string }>(tomas: readonly T[]): T[] {
  const porDia = new Map<string, number>();
  for (const t of tomas) porDia.set(t.fecha.slice(0, 10), (porDia.get(t.fecha.slice(0, 10)) ?? 0) + 1);
  const vistas = new Map<string, number>();
  return tomas.map((t) => {
    const dia = t.fecha.slice(0, 10);
    const orden = (vistas.get(dia) ?? 0) + 1;
    vistas.set(dia, orden);
    const fecha = fechaCorta(dia);
    return { ...t, etiqueta: (porDia.get(dia) ?? 0) > 1 ? `${fecha} (${orden})` : fecha };
  });
}
