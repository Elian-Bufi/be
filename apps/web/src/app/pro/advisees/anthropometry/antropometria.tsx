'use client';

/**
 * Pestaña Antropometría del workspace (B10-07). Navegación local Tomas / Evolución / Lámina.
 * - 404 = no hay nada que mostrar, con el texto neutral de siempre, igual que en Nutrición (10-B10:407).
 * - Una **escritura** denegada retira el contenido de toda la pestaña, no solo la acción: «siguiente operación deny →
 *   UI limpia contenido» (B10-06:1145-1148; DL-091 punto 1).
 * - La vista activa vive en la URL (`vista=`).
 *
 * WP-ESCRITORIO-AREAS (parte 0): el encabezado es el marco del área, común a las cuatro (`MarcoDelArea`). La primera
 * sección se lee «Tomas», que es como la llaman su propia lista, el botón y el teléfono (C-58); su clave en la URL sigue
 * siendo `evaluaciones` (F-03).
 *
 * Parte 3: **«En preparación» dejó de ser una sección.** La carga de una toma se abre desde «Tomas» («Preparar una
 * toma»), y `vista=preparacion` sigue abriéndola: la usan el Resumen de la ficha y el pendiente del Espacio profesional.
 * Mientras se carga una toma, la sección marcada es «Tomas», con un enlace para volver a ella. Desde la parte 9, la carga usa
 * todo el ancho del marco (la figura y sus campos, maqueta 23) y tiene su ayuda. «Tomas» usa todo el ancho
 * del marco y tiene su ayuda; las tomas se leen una vez por visita y se vuelven a leer con «Actualizar» (el marco, además,
 * vuelve a preguntar el acceso al volver a la pestaña del navegador y ante un «no disponible»).
 */
import { COPY_ANTROPOMETRIA } from '@be/domain';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Cargando } from '../../../../components/estados';
import { Icono } from '../../../../components/icono';
import type { Resultado } from '../../../../lib/api';
import { useEspacioProfesional } from '../../espacio-profesional';
import { EstadoDeLecturaDelArea, MarcoDelArea, NoDisponibleEnElArea } from '../marco-del-area';
import { conVolver, useRetornoALaFicha } from '../retorno-y-preparacion';
import { hrefConCambios } from '../seguimiento/estado';
import { AyudaDeLaCarga } from './ayuda-de-la-carga';
import { AyudaDeTomas } from './ayuda-de-tomas';
import { VistaDeEvaluaciones } from './evaluaciones';
import { VistaDeEvolucion } from './evolucion';
import { VistaDePreparacion } from './preparacion';

// La lámina (DL-111) se carga recién cuando se abre: la pestaña no paga su peso de entrada.
const VistaDeLamina = dynamic(() => import('./lamina').then((m) => m.VistaDeLamina), { ssr: false, loading: () => <Cargando /> });

/** Las secciones que se ven en el marco. */
export const SECCIONES = [
  { clave: 'evaluaciones', texto: COPY_ANTROPOMETRIA.tomas, icono: 'lista' },
  { clave: 'evolucion', texto: COPY_ANTROPOMETRIA.evolucion, icono: 'analizar' },
  { clave: 'lamina', texto: COPY_ANTROPOMETRIA.lamina, icono: 'imagen' },
] as const;
type Seccion = (typeof SECCIONES)[number]['clave'];

/** Los valores de `vista` que la página admite: las tres secciones y la carga de una toma, que se abre desde «Tomas». */
export const VISTAS = ['evaluaciones', 'preparacion', 'evolucion', 'lamina'] as const;
export type Vista = (typeof VISTAS)[number];

export interface ContextoDeAntropometria {
  readonly token: string;
  readonly asesoradoId: string;
  /** La identidad de quien mira: para decir «la corregiste vos» en la historia de una medición. */
  readonly miIdentidad: string | null;
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
  /** `true` si una escritura recibió el 404 no revelador: la pestaña pasa a «no disponible» entera. */
  readonly accesoRetirado: (r: Resultado<unknown>) => boolean;
  /** Cambia de vista; con `evaluacionId`, «Tomas» abre esa toma (por su lectura y su autorización habituales). */
  readonly irA: (vista: Vista, evaluacionId?: string) => void;
  /** Lo que dice la dirección de la página: la toma elegida vive ahí (`evaluacion=`), y «Actualizar» la conserva. */
  readonly parametros: URLSearchParams;
  /**
   * Cambia parámetros de la dirección sin salir de la vista (`null` los quita): en la carga de una toma, la familia y la
   * figura que se miran (`medidas`, `figura`). Reemplaza la entrada del historial.
   */
  readonly ir: (cambios: Readonly<Record<string, string | null>>) => void;
  /**
   * Lo que se acaba de hacer en la carga de una toma y se dice al volver a «Tomas» («Toma registrada…»). Vive en la
   * pestaña, no en la carga: esa vista se desmonta al volver.
   */
  readonly avisoDeTomas: string | null;
  readonly avisarEnTomas: (texto: string | null) => void;
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
  const vista: Vista = VISTAS.some((v) => v === vistaPedida) ? (vistaPedida as Vista) : 'evaluaciones';
  const ruta = usePathname();
  const router = useRouter();
  const sesion = useEspacioProfesional(`/pro/advisees/anthropometry?id=${id}`);
  const { token, sesionPerdida, yo } = sesion;
  const miIdentidad = yo.tipo === 'listo' ? yo.id : null;

  const retorno = useRetornoALaFicha(id);
  const hrefDe = useCallback((v: Vista) => conVolver(`${ruta}?id=${encodeURIComponent(id)}&vista=${v}`, retorno.valor), [ruta, id, retorno.valor]);
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
  const [avisoDeTomas, avisarEnTomas] = useState<string | null>(null);
  const enLaDireccion = parametros.toString();
  const ir = useCallback(
    (cambios: Readonly<Record<string, string | null>>) => router.replace(hrefConCambios(ruta, new URLSearchParams(enLaDireccion), cambios), { scroll: false }),
    [router, ruta, enLaDireccion],
  );
  const contexto = useMemo(
    () => (token ? { token, asesoradoId: id, miIdentidad, sesionPerdida, accesoRetirado, irA, parametros: new URLSearchParams(parametros.toString()), ir, avisoDeTomas, avisarEnTomas } : null),
    [token, id, miIdentidad, sesionPerdida, accesoRetirado, irA, parametros, ir, avisoDeTomas],
  );
  // La carga de una toma es de «Tomas»: es la sección que queda marcada mientras se carga.
  const seccion: Seccion = vista === 'preparacion' ? 'evaluaciones' : vista;

  return (
    <MarcoDelArea
      alcance="ANTROPOMETRIA"
      titulo={COPY_ANTROPOMETRIA.pestana}
      etiqueta="Secciones de Antropometría"
      id={id}
      sesion={sesion}
      retorno={retorno}
      vistas={SECCIONES}
      vista={seccion}
      href={hrefDe}
      retirado={retirado}
      onActualizar={volverALeer}
      ancho={vista === 'evaluaciones' || vista === 'preparacion'}
      ayuda={vista === 'evaluaciones' ? <AyudaDeTomas /> : vista === 'preparacion' ? <AyudaDeLaCarga /> : null}
    >
      {contexto ? (
        <Contexto.Provider value={contexto}>
          {vista === 'evaluaciones' ? <VistaDeEvaluaciones /> : null}
          {vista === 'preparacion' ? (
            <VistaDePreparacion
              vuelta={
                <Link href={hrefDe('evaluaciones')}>
                  <Icono nombre="izquierda" tamano={18} />
                  {COPY_ANTROPOMETRIA.volverATomas}
                </Link>
              }
            />
          ) : null}
          {vista === 'evolucion' ? <VistaDeEvolucion /> : null}
          {vista === 'lamina' ? <VistaDeLamina /> : null}
        </Contexto.Provider>
      ) : null}
    </MarcoDelArea>
  );
}
