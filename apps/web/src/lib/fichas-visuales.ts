'use client';

/**
 * La ficha visual de los ejercicios (API-EJE-05; WP-CATALOGO-VISUAL, etapa 2): sus zonas musculares vigentes y su imagen
 * vigente, por identidad, de a 50 por pedido (el límite de la operación). La usan «Mis ejercicios», el detalle de un
 * ejercicio del catálogo y las zonas de una sesión del plan.
 * - **Lo que el profesional no ve no viene** (la API no lo responde): para la pantalla, ese ejercicio no tiene ficha.
 * - **Una lectura que falla se dice como falla,** con su motivo y un reintento: no es «sin zonas».
 * - Sin el área de Entrenamiento la API responde 403: la pantalla no muestra nada de zonas (mostrar u ocultar no
 *   autoriza nada).
 */
import type { FichaVisualDeEjercicio } from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type Resultado } from './api';
import { mensajeDeFallo } from './intento';

/** El límite de API-EJE-05 por pedido. */
const POR_PEDIDO = 50;

export type LecturaDeFichas =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'sin-area' }
  | { readonly tipo: 'falla'; readonly motivo: string }
  | { readonly tipo: 'lista'; readonly fichas: ReadonlyMap<string, FichaVisualDeEjercicio> };

export function useFichasVisuales(token: string | null, ids: readonly string[], sesionPerdida: (r: Resultado<unknown>) => boolean): { lectura: LecturaDeFichas; releer: () => void } {
  // Los identificadores como clave estable: la misma lista en otro arreglo no vuelve a pedir.
  const clave = [...new Set(ids)].sort().join(',');
  const [lectura, setLectura] = useState<LecturaDeFichas>({ tipo: 'cargando' });
  const [vuelta, setVuelta] = useState(0);
  const pedido = useRef(0);
  // Quien llama puede pasar una función nueva en cada render: se usa la última, sin volver a pedir por eso.
  const perdida = useRef(sesionPerdida);
  perdida.current = sesionPerdida;

  useEffect(() => {
    if (!token) return;
    const este = ++pedido.current;
    const lista = clave ? clave.split(',') : [];
    if (lista.length === 0) {
      setLectura({ tipo: 'lista', fichas: new Map() });
      return;
    }
    setLectura({ tipo: 'cargando' });
    void (async () => {
      const fichas = new Map<string, FichaVisualDeEjercicio>();
      for (let i = 0; i < lista.length; i += POR_PEDIDO) {
        const r = await api.fichasVisualesDeEjercicios(token, lista.slice(i, i + POR_PEDIDO));
        // Una respuesta que llega después de otro pedido no pisa al más nuevo.
        if (este !== pedido.current || perdida.current(r)) return;
        if (!r.ok) return setLectura(r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN' ? { tipo: 'sin-area' } : { tipo: 'falla', motivo: mensajeDeFallo(r) });
        for (const f of r.datos.data) fichas.set(f.exerciseId, f);
      }
      setLectura({ tipo: 'lista', fichas });
    })();
  }, [token, clave, vuelta]);

  const releer = useCallback(() => setVuelta((v) => v + 1), []);
  return { lectura, releer };
}
