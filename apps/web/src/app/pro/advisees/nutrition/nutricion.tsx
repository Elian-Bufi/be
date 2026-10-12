'use client';

/**
 * Pestaña Nutrición del workspace (B10-05). Navegación local Resumen / Plan / Registros / Revisiones (B05:124-131); nunca
 * «Evaluaciones / Objetivos / Planes / Comidas / Adherencia» como navegación global (B05:135-145).
 * - Cada vista pregunta a la API: el PDP decide en cada lectura, sin caché (08 §27.3).
 * - 404 = no hay nada que mostrar, con el texto neutral de siempre (UC-I02 E05; 10-B10:407): el mismo para un asesorado
 *   inexistente, ajeno, de otro alcance o que revocó.
 * - Una **escritura** denegada retira el contenido de toda la pestaña, no solo la acción: si el asesorado revocó el
 *   acceso, «siguiente operación deny → UI limpia contenido» (B10-06:1145-1148; DL-091 punto 1).
 * - La vista activa vive en la URL (`vista=`), así «Actualizar» y volver atrás la conservan.
 *
 * WP-ESCRITORIO-AREAS (parte 0): el encabezado es el marco del área, común a las cuatro (`MarcoDelArea`): el camino de
 * vuelta a la ficha, de quién es, el acceso actual de Nutrición, «Actualizar» con la hora y las secciones con su ícono.
 * Desde la parte 1, lo que una sección elige (el período, la vista, lo que está abierto) vive en la dirección, como en la
 * ficha: «Actualizar» vuelve a leer sin perderlo, y volver atrás lo recupera. Al cambiar de sección no se lleva.
 */
import { COPY_NUTRICION } from '@be/domain';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Resultado } from '../../../../lib/api';
import { useEspacioProfesional } from '../../espacio-profesional';
import { EstadoDeLecturaDelArea, MarcoDelArea, NoDisponibleEnElArea } from '../marco-del-area';
import { conVolver, useRetornoALaFicha } from '../retorno-y-preparacion';
import { hrefConCambios } from '../seguimiento/estado';
import { AyudaDeRegistros } from './ayuda-de-registros';
import { AyudaDelPlan } from './ayuda-del-plan';
import { VistaDePlan } from './plan';
import { VistaDeRegistros } from './registros';
import { VistaDeResumen } from './resumen';
import { VistaDeRevisiones } from './revisiones';

export const VISTAS = [
  { clave: 'resumen', texto: COPY_NUTRICION.resumen, icono: 'resumen' },
  { clave: 'plan', texto: 'Plan', icono: 'plan' },
  { clave: 'registros', texto: COPY_NUTRICION.registros, icono: 'lista' },
  { clave: 'revisiones', texto: COPY_NUTRICION.revisiones, icono: 'revision' },
] as const;
export type Vista = (typeof VISTAS)[number]['clave'];

export interface ContextoDeNutricion {
  readonly token: string;
  readonly asesoradoId: string;
  /** Verdadero si la respuesta cerró la sesión (la UI ya redirige). */
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
  /** `true` si una escritura recibió el 404 no revelador: la pestaña pasa a «no disponible» entera. */
  readonly accesoRetirado: (r: Resultado<unknown>) => boolean;
  readonly irA: (vista: Vista) => void;
  /** Los parámetros de la dirección: ahí vive lo que la sección elige. Solo identificadores, enumerados y fechas. */
  readonly parametros: { get(clave: string): string | null };
  /**
   * Cambia parámetros de la dirección sin salir de la sección; `null` quita uno. Por defecto reemplaza la entrada del
   * historial; con `agregarAlHistorial`, volver atrás recupera el estado anterior.
   */
  readonly ir: (cambios: Readonly<Record<string, string | null>>, opciones?: { readonly agregarAlHistorial?: boolean }) => void;
}

const Contexto = createContext<ContextoDeNutricion | null>(null);

export function useNutricion(): ContextoDeNutricion {
  const c = useContext(Contexto);
  if (!c) throw new Error('useNutricion fuera de la pestaña Nutrición');
  return c;
}

/** Texto neutral del 404 del profesional (10-B10:407). Es el del marco del área, que vuelve a preguntar el acceso. */
export const NoDisponible = NoDisponibleEnElArea;

/** Resultado de una lectura de la vista: 404 → neutral; otra falla → su motivo y «Reintentar». */
export const EstadoDeLectura = EstadoDeLecturaDelArea;

export function Nutricion() {
  const parametros = useSearchParams();
  const id = parametros.get('id') ?? '';
  const vistaPedida = parametros.get('vista');
  const vista: Vista = VISTAS.some((v) => v.clave === vistaPedida) ? (vistaPedida as Vista) : 'resumen';
  const ruta = usePathname();
  const router = useRouter();
  const sesion = useEspacioProfesional(`/pro/advisees/nutrition?id=${id}`);
  const { token, sesionPerdida } = sesion;

  const retorno = useRetornoALaFicha(id);
  const irA = useCallback((v: Vista) => router.replace(conVolver(`${ruta}?id=${encodeURIComponent(id)}&vista=${v}`, retorno.valor)), [router, ruta, id, retorno.valor]);
  const [retirado, setRetirado] = useState(false);
  const accesoRetirado = useCallback((r: Resultado<unknown>) => {
    if (r.ok || r.tipo !== 'API' || r.codigo !== 'RESOURCE_NOT_FOUND') return false;
    setRetirado(true);
    return true;
  }, []);
  const volverALeer = useCallback(() => setRetirado(false), []);
  const enLaDireccion = parametros.toString();
  const ir = useCallback(
    (cambios: Readonly<Record<string, string | null>>, opciones?: { readonly agregarAlHistorial?: boolean }) => {
      const destino = hrefConCambios(ruta, new URLSearchParams(enLaDireccion), cambios);
      if (opciones?.agregarAlHistorial) router.push(destino, { scroll: false });
      else router.replace(destino, { scroll: false });
    },
    [router, ruta, enLaDireccion],
  );
  const contexto = useMemo(
    () => (token ? { token, asesoradoId: id, sesionPerdida, accesoRetirado, irA, parametros, ir } : null),
    [token, id, sesionPerdida, accesoRetirado, irA, parametros, ir],
  );

  return (
    <MarcoDelArea
      alcance="NUTRICION"
      titulo={COPY_NUTRICION.pestana}
      etiqueta="Secciones de Nutrición"
      id={id}
      sesion={sesion}
      retorno={retorno}
      vistas={VISTAS}
      vista={vista}
      href={(clave) => conVolver(`${ruta}?id=${encodeURIComponent(id)}&vista=${clave}`, retorno.valor)}
      retirado={retirado}
      onActualizar={volverALeer}
      // Plan y Registros ya están recompuestas: usan todo el ancho y tienen su ayuda. Las demás conservan el suyo hasta su parte.
      ancho={vista === 'registros' || vista === 'plan'}
      ayuda={vista === 'registros' ? <AyudaDeRegistros /> : vista === 'plan' ? <AyudaDelPlan /> : null}
    >
      {contexto ? (
        <Contexto.Provider value={contexto}>
          {vista === 'resumen' ? <VistaDeResumen /> : null}
          {vista === 'plan' ? <VistaDePlan /> : null}
          {vista === 'registros' ? <VistaDeRegistros /> : null}
          {vista === 'revisiones' ? <VistaDeRevisiones /> : null}
        </Contexto.Provider>
      ) : null}
    </MarcoDelArea>
  );
}
