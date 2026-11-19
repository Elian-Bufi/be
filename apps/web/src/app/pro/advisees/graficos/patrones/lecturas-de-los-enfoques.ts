'use client';

/**
 * Las lecturas y escrituras de los enfoques (API-GRF-01 a 07; GR-27, DL-174) para «Patrones», en la ficha y en el editor
 * del plan. Todo va a la API, que decide con el PDP en cada pedido: lo único que queda en el navegador es lo que se está
 * viendo, en memoria, y nada se guarda en `localStorage`, `sessionStorage` ni IndexedDB.
 *
 * - Los enfoques son del profesional (API-GRF-01): se leen una vez por pantalla y se vuelven a leer después de escribir.
 * - Las elecciones son de la persona (API-GRF-05, lectura protegida): se leen con la ficha y se vuelven a leer cuando
 *   cambia el acceso (`version`). Sin un área permitida, la API responde 404 y no hay nada que elegir.
 * - Elegir pide la versión leída de la elección del lugar (`expectedVersion`); si otra pestaña eligió antes, 409: se
 *   vuelve a leer y se dice.
 * - Crear, borrar y quitar llevan su `Idempotency-Key` (`nuevaClaveDeIdempotencia`).
 */
import { type ContenidoDelEnfoque, type EleccionDeEnfoque, type Enfoque, type LugarDelEnfoque, type Resultado } from '@be/domain';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, nuevaClaveDeIdempotencia } from '../../../../../lib/api';
import { motivoDeFalla, type MotivoDeFalla } from '../../../../../lib/fallas';
import { leerDisponibles, type DisponiblesLeidos, type ParametrosDeLectura } from '../lecturas';
import type { PeriodoDelGrafico } from '../eje-de-fechas';

export type LecturaDeEnfoques =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla }
  | { readonly tipo: 'lista'; readonly enfoques: readonly Enfoque[] };

export type LecturaDeElecciones =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla }
  /** 404: sin un área permitida hoy con la persona, no hay elecciones que leer (el mismo 404 que una persona inexistente). */
  | { readonly tipo: 'sin-acceso' }
  | { readonly tipo: 'lista'; readonly elecciones: readonly EleccionDeEnfoque[] };

type SesionPerdida = (r: Resultado<unknown>) => boolean;

/** Tus enfoques (API-GRF-01) y lo que se hace con ellos (API-GRF-02 a 04). */
export function useEnfoques(token: string, sesionPerdida: SesionPerdida) {
  const [lectura, setLectura] = useState<LecturaDeEnfoques>({ tipo: 'cargando' });
  const generacion = useRef(0);
  const recargar = useCallback(async () => {
    const esta = ++generacion.current;
    const r = await api.listarEnfoques(token);
    if (esta !== generacion.current || sesionPerdida(r)) return;
    setLectura(r.ok ? { tipo: 'lista', enfoques: r.datos.data } : { tipo: 'error', motivo: motivoDeFalla(r) });
    // `sesionPerdida` no cambia la lectura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  useEffect(() => {
    void recargar();
  }, [recargar]);
  const crear = useCallback(
    async (name: string, content: ContenidoDelEnfoque) => {
      const r = await api.crearEnfoque(token, { name: name.trim(), content }, nuevaClaveDeIdempotencia());
      if (r.ok) void recargar();
      return r;
    },
    [token, recargar],
  );
  const reemplazar = useCallback(
    async (enfoque: Pick<Enfoque, 'setId' | 'version'>, name: string, content: ContenidoDelEnfoque) => {
      const r = await api.reemplazarEnfoque(token, enfoque.setId, { expectedVersion: enfoque.version, name: name.trim(), content });
      // Con o sin éxito se vuelve a leer: un 409 quiere decir que otra pestaña lo cambió.
      void recargar();
      return r;
    },
    [token, recargar],
  );
  const borrar = useCallback(
    async (setId: string) => {
      const r = await api.borrarEnfoque(token, setId, nuevaClaveDeIdempotencia());
      void recargar();
      return r;
    },
    [token, recargar],
  );
  return { lectura, recargar, crear, reemplazar, borrar };
}

/** Las elecciones de la persona (API-GRF-05) y elegir o quitar en un lugar (API-GRF-06 y 07). */
export function useElecciones(token: string, asesoradoId: string, sesionPerdida: SesionPerdida, version: number, alEscribir: () => void = () => undefined) {
  // Elegir o quitar cambia en cuántos lugares está elegido cada enfoque (`choices`): quien lista los enfoques los relee.
  const alEscribirRef = useRef(alEscribir);
  alEscribirRef.current = alEscribir;
  const [lectura, setLectura] = useState<LecturaDeElecciones>({ tipo: 'cargando' });
  const generacion = useRef(0);
  const recargar = useCallback(async () => {
    const esta = ++generacion.current;
    const r = await api.leerEleccionesDeEnfoque(token, asesoradoId);
    if (esta !== generacion.current || sesionPerdida(r)) return;
    if (r.ok) setLectura({ tipo: 'lista', elecciones: r.datos.data });
    else if (r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') setLectura({ tipo: 'sin-acceso' });
    else setLectura({ tipo: 'error', motivo: motivoDeFalla(r) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, asesoradoId]);
  useEffect(() => {
    void recargar();
  }, [recargar, version]);
  /** Elige `setId` en el lugar. `actual`: la elección que había exactamente ahí (su versión es la esperada). */
  const elegir = useCallback(
    async (lugar: LugarDelEnfoque, setId: string, actual: EleccionDeEnfoque | null) => {
      const expectedVersion = actual?.version ?? null;
      const cuerpo =
        lugar.tipo === 'PERSONA'
          ? { scope: 'PERSON' as const, setId, expectedVersion }
          : lugar.ambito === 'TRAINING_PLAN'
            ? { scope: 'TRAINING_PLAN' as const, trainingPlanId: lugar.planId, setId, expectedVersion }
            : { scope: 'NUTRITION_PLAN' as const, nutritionPlanId: lugar.planId, setId, expectedVersion };
      const r = await api.elegirEnfoque(token, asesoradoId, cuerpo);
      void recargar();
      if (r.ok) alEscribirRef.current();
      return r;
    },
    [token, asesoradoId, recargar],
  );
  const quitar = useCallback(
    async (eleccion: EleccionDeEnfoque) => {
      const r = await api.quitarEleccionDeEnfoque(token, asesoradoId, eleccion.choiceId, nuevaClaveDeIdempotencia());
      void recargar();
      if (r.ok) alEscribirRef.current();
      return r;
    },
    [token, asesoradoId, recargar],
  );
  return { lectura, recargar, elegir, quitar };
}

export type DisponiblesDelPeriodo = { readonly tipo: 'cargando' } | { readonly tipo: 'listo'; readonly disponibles: DisponiblesLeidos };

/**
 * Lo disponible en un período propio (el del editor del plan: 12 semanas, 6 meses o desde que la acompañás), con las mismas
 * tres lecturas de «Analizar» (`leerDisponibles`). En la ficha se usa `useDisponibles`, con el período de la ficha.
 */
export function useDisponiblesDelPeriodo(lectura: Omit<ParametrosDeLectura, 'periodo'>, periodo: PeriodoDelGrafico | null): { readonly estado: DisponiblesDelPeriodo; readonly recargar: () => void } {
  const [estado, setEstado] = useState<DisponiblesDelPeriodo>({ tipo: 'cargando' });
  const [vuelta, setVuelta] = useState(0);
  const generacion = useRef(0);
  const clave = periodo ? `${lectura.asesoradoId}|${periodo.desde}|${periodo.hasta}|${vuelta}` : null;
  useEffect(() => {
    if (!periodo) return;
    const esta = ++generacion.current;
    setEstado({ tipo: 'cargando' });
    void leerDisponibles({ ...lectura, periodo }).then((r) => {
      if (esta !== generacion.current || r === null) return;
      setEstado({ tipo: 'listo', disponibles: r.disponibles });
    });
    // `clave` resume lo que cambia la lectura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  return useMemo(() => ({ estado, recargar: () => setVuelta((v) => v + 1) }), [estado]);
}
