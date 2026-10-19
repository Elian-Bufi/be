'use client';

/**
 * Pestaña «Información» del workspace (WP-07; RF-071; API-FRM-01 a 05). Es transversal a los tres alcances: no cuelga de
 * Nutrición, Entrenamiento ni Antropometría.
 *
 * Lo que la pantalla tiene que dejar claro, y por eso está escrito en el copy y no acá:
 * - pedir no concede nada (05:15098): hasta que la persona responda, no hay dato nuevo;
 * - lo respondido es **declarado por el asesorado**, no una medición ni un diagnóstico (09 §22.7);
 * - una solicitud sin responder no es un incumplimiento: se muestra como lo que es.
 *
 * WP-ESCRITORIO-AREAS (parte 0): el encabezado es el marco del área, común a las cuatro (`MarcoDelArea`). Como
 * Información es de las tres áreas, el acceso actual las nombra a las tres. Si se llegó desde Entrenamiento
 * (`volver=entrenamiento`), el camino de vuelta lleva a Entrenamiento y lo dice.
 *
 * Parte 4: **«Pedir información» dejó de ser una sección.** El marco tiene una sola, «Solicitudes» (`solicitudes.tsx`),
 * y el pedido es un cajón que se abre sobre ella (`pedir.tsx`). `vista=pedir` sigue abriéndolo: la usan el marco de la
 * ficha, Entrenamiento («Pedir información») y el botón de la sección. Cerrarlo deja `vista=solicitudes` con lo demás de
 * la dirección como estaba: la persona queda en Información, y el marco le ofrece la vuelta a donde vino. Lo que
 * «Solicitudes» elige —la vista y la solicitud abierta— también vive en la dirección (`ver=`, `solicitud=`), y
 * «Actualizar» lo conserva.
 */
import { COPY_PISTAS, COPY_FORMULARIOS } from '@be/domain';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AvisoFlotante } from '../../../../components/ayuda';
import { type Resultado } from '../../../../lib/api';
import { useEspacioProfesional } from '../../espacio-profesional';
import { EstadoDeLecturaDelArea, MarcoDelArea } from '../marco-del-area';
import { conVolver, useRetornoALaFicha } from '../retorno-y-preparacion';
import { hrefConCambios } from '../seguimiento/estado';
import { AyudaDeSolicitudes } from './ayuda-de-solicitudes';
import { PedidoDeInformacion } from './pedir';
import { VistaDeSolicitudes } from './solicitudes';

/** La sección que se ve en el marco: una sola. */
export const SECCIONES = [{ clave: 'solicitudes', texto: COPY_FORMULARIOS.solicitudes, icono: 'informacion', pista: COPY_PISTAS.secciones.solicitudes }] as const;

/** Los valores de `vista` que la página admite: la sección y el pedido, que se abre sobre ella. */
export const VISTAS = ['solicitudes', 'pedir'] as const;
export type Vista = (typeof VISTAS)[number];

export interface ContextoDeFormularios {
  readonly token: string;
  readonly asesoradoId: string;
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
  /**
   * Un éxito que sobrevive al cierre del cajón (DL-113): lo muestra la pestaña, fijo abajo. Un aviso adentro de un
   * diálogo que se cierra no lo lee nadie.
   */
  readonly avisar: (texto: string) => void;
  /** Lo que dice la dirección de la página: la vista, la solicitud abierta y el pedido viven ahí, y «Actualizar» los conserva. */
  readonly parametros: { get(clave: string): string | null };
  /** Cambia parámetros de la dirección sin salir de la sección (`null` saca uno). */
  readonly ir: (cambios: Readonly<Record<string, string | null>>, opciones?: { readonly agregarAlHistorial?: boolean }) => void;
}

const Contexto = createContext<ContextoDeFormularios | null>(null);

export function useFormularios(): ContextoDeFormularios {
  const c = useContext(Contexto);
  if (!c) throw new Error('useFormularios fuera de la pestaña Información');
  return c;
}

/** Resultado de una lectura de la vista: 404 → el texto neutral de siempre (10-B10:407); otra falla → su motivo y «Reintentar». */
export const EstadoDeLectura = EstadoDeLecturaDelArea;

export function Formularios() {
  const parametros = useSearchParams();
  const id = parametros.get('id') ?? '';
  const vistaPedida = parametros.get('vista');
  const vista: Vista = VISTAS.some((v) => v === vistaPedida) ? (vistaPedida as Vista) : 'solicitudes';
  const ruta = usePathname();
  const router = useRouter();
  const sesion = useEspacioProfesional(`/pro/advisees/forms?id=${id}`);
  const { token, sesionPerdida } = sesion;

  const retorno = useRetornoALaFicha(id);
  // Desde Entrenamiento se llega con `volver=entrenamiento` (la evaluación, en Resumen) o `volver=entrenamiento-plan`
  // («Empezar el plan», DL-145): no son direcciones de la ficha, y la vuelta es a esa sección de Entrenamiento.
  const volver = parametros.get('volver');
  const vuelta =
    volver === 'entrenamiento' || volver === 'entrenamiento-plan'
      ? { href: `/pro/advisees/training?id=${encodeURIComponent(id)}&vista=${volver === 'entrenamiento-plan' ? 'plan' : 'resumen'}`, texto: 'Volver a Entrenamiento' }
      : null;
  const enLaDireccion = parametros.toString();
  const ir = useCallback(
    (cambios: Readonly<Record<string, string | null>>, opciones?: { readonly agregarAlHistorial?: boolean }) => {
      const destino = hrefConCambios(ruta, new URLSearchParams(enLaDireccion), cambios);
      if (opciones?.agregarAlHistorial) router.push(destino, { scroll: false });
      else router.replace(destino, { scroll: false });
    },
    [router, ruta, enLaDireccion],
  );
  const [exito, setExito] = useState<string | null>(null);
  // Sube con cada solicitud enviada: «Solicitudes» se monta de nuevo y vuelve a leer la lista, que ya tiene una más.
  const [tanda, setTanda] = useState(0);
  const contexto = useMemo(() => (token ? { token, asesoradoId: id, sesionPerdida, avisar: setExito, parametros, ir } : null), [token, id, sesionPerdida, parametros, ir]);

  return (
    <MarcoDelArea
      alcance={null}
      titulo={COPY_FORMULARIOS.pestana}
      etiqueta="Secciones de Información"
      id={id}
      sesion={sesion}
      retorno={retorno}
      vuelta={vuelta}
      vistas={SECCIONES}
      // El pedido es de «Solicitudes»: es la sección que queda marcada mientras se arma.
      vista="solicitudes"
      href={() => conVolver(`${ruta}?id=${encodeURIComponent(id)}&vista=solicitudes`, retorno.valor)}
      ancho
      ayuda={<AyudaDeSolicitudes />}
    >
      {contexto ? (
        <Contexto.Provider value={contexto}>
          {exito ? (
            <AvisoFlotante onCerrar={() => setExito(null)} seQueda={!!retorno.href}>
              <p>{exito}</p>
              {retorno.href && !vuelta ? (
                <p>
                  {/* Un `Link`, no un ancla suelta: recargar la página cortaría la sesión, que vive en memoria (DL-012). */}
                  <Link href={retorno.href}>Volver a la ficha, donde estabas</Link>
                </p>
              ) : null}
            </AvisoFlotante>
          ) : null}
          <VistaDeSolicitudes key={tanda} />
          {/* El cajón está siempre montado: cerrarlo no descarta un pedido a medio armar. */}
          <PedidoDeInformacion
            abierto={vista === 'pedir'}
            onCerrar={() => ir({ vista: 'solicitudes' })}
            onReabrir={() => ir({ vista: 'pedir' })}
            // La nueva es la primera de la lista: se vuelve a «Todas» para que se vea, sin ninguna abierta.
            alEnviar={() => {
              setTanda((n) => n + 1);
              ir({ vista: 'solicitudes', ver: null, solicitud: null });
            }}
          />
        </Contexto.Provider>
      ) : null}
    </MarcoDelArea>
  );
}
