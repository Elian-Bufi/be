'use client';

/**
 * DL-192 (WP-RPE-Y-MAXIMO-ESTIMADO, RPE-D01) · en qué notación se lee el esfuerzo en el escritorio: RIR o RPE.
 *
 * - **La notación vive en la versión del plan** (`effortNotation`). Lo guardado es siempre el RIR: esto cambia solo cómo
 *   se escribe y se lee (`notacion-del-esfuerzo.ts` del dominio).
 * - **Lo que se lee de una persona** (los registros, la fuerza estimada) va en la del plan vigente, o la de la versión más
 *   nueva si no hay vigente (`notacionDeLasVersiones`), leída con API-TRN-08. Mientras no llega, o si la lectura falla, RIR:
 *   lo de siempre, y nunca un número cambiado.
 * - **El editor** provee la del borrador que se está editando, encima de la de la persona.
 */
import { NOTACION_POR_OMISION, notacionDeLasVersiones, type NotacionDelEsfuerzo } from '@be/domain';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../../../lib/api';

const Contexto = createContext<NotacionDelEsfuerzo>(NOTACION_POR_OMISION);

/** La notación que rige acá abajo: la del borrador en el editor, la del plan de la persona en lo demás; si no, RIR. */
export const useNotacionDelEsfuerzo = (): NotacionDelEsfuerzo => useContext(Contexto);

/** Una notación fija para lo de abajo: el editor, con la del borrador. */
export const ProveedorDeLaNotacion = Contexto.Provider;

/** La notación del plan de una persona con este profesional, para lo de abajo. */
export function ConLaNotacionDeLaPersona({ token, asesoradoId, children }: { token: string; asesoradoId: string; children: ReactNode }) {
  const [notacion, setNotacion] = useState<NotacionDelEsfuerzo>(NOTACION_POR_OMISION);
  useEffect(() => {
    let vigente = true;
    void api.listarPlanesDeEntrenamiento(token, asesoradoId).then((r) => {
      if (vigente && r.ok) setNotacion(notacionDeLasVersiones(r.datos.data));
    });
    return () => {
      vigente = false;
    };
  }, [token, asesoradoId]);
  return <Contexto.Provider value={notacion}>{children}</Contexto.Provider>;
}
