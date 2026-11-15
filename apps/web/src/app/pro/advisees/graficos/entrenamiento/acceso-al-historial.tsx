'use client';

/**
 * La entrada al historial del ejercicio desde el cuadro de la estación (WP-GRAFICOS fase 2, rama B; DL-174): «En el
 * tiempo», con «Historial» y «Perfil de carga y repeticiones», que abren su paso en el mismo cuadro (ED-10). El paso se
 * carga recién cuando se abre: el editor no carga los gráficos hasta que se piden.
 *
 * La usan los dos cuadros del ejercicio: «Detalle y fuerza estimada» (la lista de la v1, ED-75) y el de «La vez pasada»
 * (los demás ejercicios, GR-01). Así el cuadro se abre con el historial para todos los ejercicios (GR-T30).
 */
import dynamic from 'next/dynamic';
import { Cargando } from '../../../../../components/estados';
import { Icono } from '../../../../../components/icono';
import { COPY_DEL_HISTORIAL as C, type PasoDelHistorial } from './copy';

export { COPY_DEL_HISTORIAL } from './copy';
export type { PasoDelHistorial } from './copy';

/** El paso abierto («Historial» o «Perfil»), cargado al abrirlo. */
export const PasoDelHistorialDiferido = dynamic(() => import('./historial-del-ejercicio').then((m) => m.PasoDelHistorial), { ssr: false, loading: () => <Cargando /> });

export function AccesoAlHistorial({ nombre, onAbrir }: { nombre: string; onAbrir: (p: PasoDelHistorial) => void }) {
  return (
    <section className="acceso-al-historial" aria-label={C.seccion} data-acceso-al-historial>
      <p className="ejercicio-del-plan__subtitulo">{C.seccion}</p>
      <p className="nota">{C.queEs}</p>
      <p className="acceso-al-historial__botones">
        <button type="button" className="boton boton--secundario" data-abrir-historial onClick={() => onAbrir('historial')}>
          <Icono nombre="separadas" tamano={18} />
          {C.verElHistorial}
          <span className="visualmente-oculto"> de {nombre}</span>
        </button>
        <button type="button" className="boton boton--secundario" data-abrir-perfil onClick={() => onAbrir('perfil')}>
          <Icono nombre="comparar" tamano={18} />
          {C.verElPerfil}
          <span className="visualmente-oculto"> de {nombre}</span>
        </button>
      </p>
    </section>
  );
}
