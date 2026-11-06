'use client';

/**
 * Las lecturas de una vista de área, cada una con su estado (bloque 5 del encargo de consolidación, 2026-10-19: «en
 * errores parciales, mostrale al profesional qué sección falta sin borrar el resto»). Resumen y Plan de Nutrición y de
 * Entrenamiento piden varias cosas a la vez; antes, si fallaba una, la vista entera pasaba a «No pudimos cargar».
 * - La primera vez se espera a todas: así la vista no se arma de a pedazos.
 * - Si alguna falló, arriba va UN aviso que dice qué falta, con «Reintentar lo que faltó», que vuelve a pedir solo eso;
 *   lo demás queda a la vista. Cada dato que dependía de lo que falta lo dice en su lugar («No se pudo leer»), nunca
 *   como si no hubiera nada.
 * - Un 404 no es una falla parcial: el área dejó de poder leerse, y la vista entera lo dice, como antes.
 */
import { nombresEnUnaFrase } from '@be/domain';
import type { ReactNode } from 'react';
import { Cargando } from '../../../components/estados';
import { Aviso } from '../../../components/formulario';
import { Icono } from '../../../components/icono';
import type { Resultado } from '../../../lib/api';
import { motivoDeFalla, razonDeFalla } from '../../../lib/fallas';
import { NoDisponibleEnElArea } from './marco-del-area';

/** Una lectura de la vista: `null` mientras llega. */
export type Lectura<T> = Resultado<T> | null;

/** El área dejó de poder leerse (404): no es una falla parcial. */
export const seRetiro = (l: Lectura<unknown>): boolean => !!l && !l.ok && l.tipo === 'API' && l.codigo === 'RESOURCE_NOT_FOUND';

/** La lectura llegó con una falla. */
export const fallo = (l: Lectura<unknown>): boolean => !!l && !l.ok;

/** Los datos de una respuesta `{ data }`, con la falla tal cual si la hubo. */
export const datosDe = <T,>(r: Resultado<{ readonly data: T }>): Resultado<T> => (r.ok ? { ok: true, datos: r.datos.data } : (r as Resultado<never>));

/**
 * El aviso de lo que falta: qué no se pudo leer, por qué, qué no se puede hacer mientras tanto (si algo) y un solo
 * «Reintentar lo que faltó».
 */
export function AvisoDeLoQueFalta({
  faltan,
  mientrasTanto = null,
  onReintentar,
}: {
  /** Cada lectura que falló, con lo que es: «el objetivo vigente». */
  faltan: readonly { readonly nombre: string; readonly lectura: Resultado<unknown> }[];
  /** Lo que no se puede hacer hasta leerlo, si algo: «Hasta leerlo, no se puede crear una versión nueva». */
  mientrasTanto?: string | null;
  onReintentar: () => void;
}) {
  const primera = faltan[0];
  if (!primera) return null;
  return (
    <Aviso tipo="error">
      <p>
        <strong>Falta una parte de esta vista:</strong> no pudimos leer {nombresEnUnaFrase(faltan.map((f) => f.nombre))}. {razonDeFalla(motivoDeFalla(primera.lectura))}
        {mientrasTanto ? ` ${mientrasTanto}.` : ''} Lo demás se leyó bien.
      </p>
      <button type="button" className="boton boton--secundario" onClick={onReintentar}>
        <Icono nombre="actualizar" tamano={18} />
        Reintentar lo que faltó
      </button>
    </Aviso>
  );
}

/**
 * Una vista con varias lecturas: espera a la primera vuelta, dice «no disponible» si el área dejó de poder leerse y, si
 * no, muestra lo que llegó con el aviso de lo que falta arriba.
 */
export function LecturasParciales({
  lecturas,
  mientrasTanto = null,
  onReintentar,
  children,
}: {
  lecturas: readonly { readonly nombre: string; readonly lectura: Lectura<unknown> }[];
  mientrasTanto?: string | null;
  onReintentar: () => void;
  children: ReactNode;
}) {
  if (lecturas.some(({ lectura }) => seRetiro(lectura))) return <NoDisponibleEnElArea />;
  if (lecturas.every(({ lectura }) => lectura === null)) return <Cargando />;
  const faltan = lecturas.flatMap(({ nombre, lectura }) => (lectura && !lectura.ok ? [{ nombre, lectura }] : []));
  return (
    <>
      <AvisoDeLoQueFalta faltan={faltan} mientrasTanto={mientrasTanto} onReintentar={onReintentar} />
      {children}
    </>
  );
}

/** En el lugar de un dato: «Cargando…» mientras llega, «No se pudo leer» si falló (el aviso de arriba lo reintenta), o el dato. */
export function SegunLectura<T>({ lectura, children }: { lectura: Lectura<T>; children: (datos: T) => ReactNode }) {
  if (lectura === null) return <span className="nota">Cargando…</span>;
  if (!lectura.ok) return <span className="nota">No se pudo leer.</span>;
  return <>{children(lectura.datos)}</>;
}
