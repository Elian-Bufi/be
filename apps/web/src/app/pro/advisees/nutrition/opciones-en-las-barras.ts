/**
 * RP-23 (WP-RECORRIDO-PLAN-PULIDO, DL-188; RP-D82) · Qué opciones se muestran en las barras de su comida. Por defecto,
 * ninguna: la franja de la comida y la del panel muestran solo la banda y el promedio. Cada opción tiene su casilla; las
 * tildadas suman su punto, en su color.
 *
 * - **Vive en la pantalla** y se recuerda por plan en `sessionStorage`, mientras la pestaña está abierta: al recargar o al
 *   volver al plan siguen tildadas. No viaja al guardar, la persona no lo ve y no tiene datos de salud: solo identidades.
 * - **Sin almacenamiento** (modo privado, cuota llena, un valor roto) sigue andando en la pantalla: cada acceso va con
 *   try/catch.
 * - La clave de una opción es la de su día tipo, su comida y su opción, con sus identificadores guardados. Una opción
 *   que todavía no se guardó (o cuya comida o día tipo no se guardaron) no se puede tildar: su lugar cambia al quitar,
 *   duplicar o mover y su identidad, al autoguardar, y la marca pasaría a otra opción o se perdería. El autoguardado le da
 *   su identidad en la primera pausa.
 */
import { useCallback, useEffect, useState } from 'react';

const PREFIJO = 'be:nutricion:en-las-barras:';

/** La clave con la que se recuerda una opción: «día|comida|opción». */
export const claveEnLasBarras = (dia: string, comida: string, opcion: string): string => `${dia}|${comida}|${opcion}`;

/** Lo recordado para un plan; ante cualquier problema, nada tildado. */
export function leerEnLasBarras(almacen: Pick<Storage, 'getItem'> | null | undefined, planId: string): ReadonlySet<string> {
  try {
    const crudo = almacen?.getItem(PREFIJO + planId);
    const lista: unknown = crudo ? JSON.parse(crudo) : [];
    return new Set(Array.isArray(lista) ? lista.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

/** Guarda lo tildado de un plan; sin nada tildado, borra la entrada. Un almacenamiento que falla no corta la pantalla. */
export function guardarEnLasBarras(almacen: Pick<Storage, 'setItem' | 'removeItem'> | null | undefined, planId: string, elegidas: ReadonlySet<string>): void {
  try {
    if (elegidas.size === 0) almacen?.removeItem(PREFIJO + planId);
    else almacen?.setItem(PREFIJO + planId, JSON.stringify([...elegidas]));
  } catch {
    // Sin almacenamiento, lo tildado vive solo en la pantalla.
  }
}

/** Tilda o destilda una opción, sin tocar el conjunto anterior. */
export function alternarEnLasBarras(elegidas: ReadonlySet<string>, clave: string): ReadonlySet<string> {
  const otra = new Set(elegidas);
  if (otra.has(clave)) otra.delete(clave);
  else otra.add(clave);
  return otra;
}

const almacenDeLaSesion = (): Storage | null => {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
};

/** El estado de las casillas de un plan: empieza sin nada tildado y, al montar, toma lo recordado en la sesión. */
export function useOpcionesEnLasBarras(planId: string): { readonly elegidas: ReadonlySet<string>; readonly alternar: (clave: string) => void } {
  const [elegidas, setElegidas] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => {
    setElegidas(leerEnLasBarras(almacenDeLaSesion(), planId));
  }, [planId]);
  const alternar = useCallback(
    (clave: string) =>
      setElegidas((x) => {
        const otra = alternarEnLasBarras(x, clave);
        guardarEnLasBarras(almacenDeLaSesion(), planId, otra);
        return otra;
      }),
    [planId],
  );
  return { elegidas, alternar };
}

/** Si la opción se puede tildar: ella, su comida y su día tipo, guardados (con su identificador). */
export const sePuedeMostrarEnLasBarras = (dia: { readonly dayTypeId?: string | null }, comida: { readonly mealId?: string | null }, opcion: { readonly optionId?: string | null }): boolean =>
  !!dia.dayTypeId && !!comida.mealId && !!opcion.optionId;

/**
 * Las opciones tildadas de una comida, por la clave de su franja (su `optionId`): lo que reciben la comida del editor y
 * su renglón en «Rangos y totales». Lo que no se guardó no cuenta, aunque haya quedado algo recordado con esa forma.
 */
export function enLasBarrasDeLaComida(
  elegidas: ReadonlySet<string>,
  dia: { readonly dayTypeId?: string | null },
  comida: { readonly mealId?: string | null; readonly options: readonly { readonly optionId?: string | null }[] },
): ReadonlySet<string> {
  const delDia = dia.dayTypeId;
  const deLaComida = comida.mealId;
  if (!delDia || !deLaComida) return new Set();
  return new Set(comida.options.flatMap((o) => (o.optionId && elegidas.has(claveEnLasBarras(delDia, deLaComida, o.optionId)) ? [o.optionId] : [])));
}
