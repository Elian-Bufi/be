'use client';

/**
 * Pestaña Antropometría del workspace (B10-07). Navegación local Evaluaciones / En preparación / Evolución.
 * - Cada vista pregunta a la API: el PDP decide en cada lectura, sin caché (08 §27.3).
 * - 404 = no hay nada que mostrar, con el texto neutral de siempre, igual que en Nutrición (10-B10:407).
 * - Una **escritura** denegada retira el contenido de toda la pestaña, no solo la acción: «siguiente operación deny →
 *   UI limpia contenido» (B10-06:1145-1148; DL-091 punto 1).
 * - La vista activa vive en la URL (`vista=`).
 *
 * WP-ESCRITORIO-AREAS (parte 0): el encabezado es el marco del área, común a las cuatro (`MarcoDelArea`). La primera
 * sección se lee «Tomas», que es como la llaman su propia lista, el botón y el teléfono (C-58); su clave en la URL sigue
 * siendo `evaluaciones` (F-03). «En preparación» sigue siendo una sección hasta que se recomponga «Tomas» (parte 3).
 */
import { COPY_ANTROPOMETRIA } from '@be/domain';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Cargando } from '../../../../components/estados';
import type { Resultado } from '../../../../lib/api';
import { useEspacioProfesional } from '../../espacio-profesional';
import { EstadoDeLecturaDelArea, MarcoDelArea, NoDisponibleEnElArea } from '../marco-del-area';
import { conVolver, useRetornoALaFicha } from '../retorno-y-preparacion';
import { VistaDeEvaluaciones } from './evaluaciones';
import { VistaDeEvolucion } from './evolucion';
import { VistaDePreparacion } from './preparacion';

// La lámina (DL-111) se carga recién cuando se abre: la pestaña no paga su peso de entrada.
const VistaDeLamina = dynamic(() => import('./lamina').then((m) => m.VistaDeLamina), { ssr: false, loading: () => <Cargando /> });

export const VISTAS = [
  { clave: 'evaluaciones', texto: 'Tomas', icono: 'lista' },
  { clave: 'preparacion', texto: 'En preparación', icono: 'borrador' },
  { clave: 'evolucion', texto: COPY_ANTROPOMETRIA.evolucion, icono: 'analizar' },
  { clave: 'lamina', texto: COPY_ANTROPOMETRIA.lamina, icono: 'imagen' },
] as const;
export type Vista = (typeof VISTAS)[number]['clave'];

export interface ContextoDeAntropometria {
  readonly token: string;
  readonly asesoradoId: string;
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
  /** `true` si una escritura recibió el 404 no revelador: la pestaña pasa a «no disponible» entera. */
  readonly accesoRetirado: (r: Resultado<unknown>) => boolean;
  /** Cambia de vista; con `evaluacionId`, Evaluaciones abre esa evaluación (por su lectura y su autorización habituales). */
  readonly irA: (vista: Vista, evaluacionId?: string) => void;
}

const Contexto = createContext<ContextoDeAntropometria | null>(null);

export function useAntropometria(): ContextoDeAntropometria {
  const c = useContext(Contexto);
  if (!c) throw new Error('useAntropometria fuera de la pestaña Antropometría');
  return c;
}

/**
 * Texto neutral del 404 del profesional (10-B10:407): el mismo para lo ajeno y para lo inexistente. Es el del marco del
 * área, que vuelve a preguntar el acceso.
 */
export const NoDisponible = NoDisponibleEnElArea;

/** Resultado de una lectura de la vista: 404 → neutral; otra falla → su motivo y «Reintentar». */
export const EstadoDeLectura = EstadoDeLecturaDelArea;

export function Antropometria() {
  const parametros = useSearchParams();
  const id = parametros.get('id') ?? '';
  const vistaPedida = parametros.get('vista');
  const vista: Vista = VISTAS.some((v) => v.clave === vistaPedida) ? (vistaPedida as Vista) : 'evaluaciones';
  const ruta = usePathname();
  const router = useRouter();
  const sesion = useEspacioProfesional(`/pro/advisees/anthropometry?id=${id}`);
  const { token, sesionPerdida } = sesion;

  const retorno = useRetornoALaFicha(id);
  const irA = useCallback(
    (v: Vista, evaluacionId?: string) =>
      router.replace(conVolver(`${ruta}?id=${encodeURIComponent(id)}&vista=${v}${evaluacionId ? `&evaluacion=${encodeURIComponent(evaluacionId)}` : ''}`, retorno.valor)),
    [router, ruta, id, retorno.valor],
  );
  const [retirado, setRetirado] = useState(false);
  const accesoRetirado = useCallback((r: Resultado<unknown>) => {
    if (r.ok || r.tipo !== 'API' || r.codigo !== 'RESOURCE_NOT_FOUND') return false;
    setRetirado(true);
    return true;
  }, []);
  const volverALeer = useCallback(() => setRetirado(false), []);
  const contexto = useMemo(() => (token ? { token, asesoradoId: id, sesionPerdida, accesoRetirado, irA } : null), [token, id, sesionPerdida, accesoRetirado, irA]);

  return (
    <MarcoDelArea
      alcance="ANTROPOMETRIA"
      titulo={COPY_ANTROPOMETRIA.pestana}
      etiqueta="Secciones de Antropometría"
      id={id}
      sesion={sesion}
      retorno={retorno}
      vistas={VISTAS}
      vista={vista}
      href={(clave) => conVolver(`${ruta}?id=${encodeURIComponent(id)}&vista=${clave}`, retorno.valor)}
      retirado={retirado}
      onActualizar={volverALeer}
    >
      {contexto ? (
        <Contexto.Provider value={contexto}>
          {vista === 'evaluaciones' ? <VistaDeEvaluaciones /> : null}
          {vista === 'preparacion' ? <VistaDePreparacion /> : null}
          {vista === 'evolucion' ? <VistaDeEvolucion /> : null}
          {vista === 'lamina' ? <VistaDeLamina /> : null}
        </Contexto.Provider>
      ) : null}
    </MarcoDelArea>
  );
}
