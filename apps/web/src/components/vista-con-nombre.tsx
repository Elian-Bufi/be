'use client';

/**
 * Una vista con nombre (GUIA II.8): lo que se quiere ver, dicho con su nombre y con la cantidad que trae. La usan la
 * Línea de tiempo de la ficha y «Pendientes» del Espacio profesional, con las mismas clases.
 * - La elegida va llena y lo dice `aria-pressed`: se distingue por su relleno, no por un matiz.
 * - La cantidad es un dato: es la que se va a ver al elegirla. Sin ella (una lectura que falló o que no terminó) no hay
 *   número, y si la lista no se leyó entera es «al menos» («200+»).
 * - El lector de pantalla oye qué se cuenta («2 pendientes»): un número suelto no dice nada.
 */
import { numero, type NombreDeIcono } from '@be/domain';
import { Icono } from './icono';

export function BotonDeVista({
  clave,
  nombre,
  icono = null,
  elegida,
  cuenta,
  alMenos = false,
  unidad,
  onElegir,
}: {
  /** Va en `data-vista`: por ella la encuentran los recorridos. */
  clave: string;
  nombre: string;
  icono?: NombreDeIcono | null;
  elegida: boolean;
  cuenta: number | null;
  /** La lista no se leyó entera: la cantidad es un piso. */
  alMenos?: boolean;
  /** Qué se cuenta, en singular y en plural. */
  unidad: readonly [string, string];
  onElegir: () => void;
}) {
  return (
    <button type="button" className="vista-de-la-linea" data-vista={clave} aria-pressed={elegida} onClick={onElegir}>
      {icono ? <Icono nombre={icono} tamano={18} /> : null}
      {nombre}
      {cuenta !== null ? (
        <span className="vista-de-la-linea__cuenta">
          {numero(cuenta)}
          {alMenos ? '+' : ''}
          <span className="visualmente-oculto">
            {alMenos ? ' o más' : ''} {cuenta === 1 && !alMenos ? unidad[0] : unidad[1]}
          </span>
        </span>
      ) : null}
    </button>
  );
}
