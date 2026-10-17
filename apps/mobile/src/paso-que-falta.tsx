/**
 * APK · «Último paso: tus datos de salud» (pedido de Dirección del 2026-10-17). La persona autorizó a un profesional,
 * pero sin el tratamiento de datos de salud (A3) vigente el acceso no es efectivo (RF-023), y la app decía «Acceso
 * autorizado · Activo» igual. Dirección pidió que aceptar un vínculo sea un solo recorrido: aceptar, autorizar al
 * profesional y, si falta, el tratamiento de datos de salud, sin tener que ir a buscarlo.
 *
 * - **Sigue siendo un acto aparte** (CON-06; 10-B02 §7): el mismo bloque de Privacidad, con el texto de la versión
 *   aplicable a la vista, «Autorizar» explícito y «Ahora no» igual de visible. Nada queda otorgado por haber autorizado
 *   al profesional.
 * - **Lee A3 con CON-05** (la misma lectura de Cuenta y de Privacidad). Solo aparece si la respuesta dice que no está
 *   vigente: sin respuesta (sin conexión, un error) no se muestra, para no afirmar algo que no se sabe.
 * - **«Ahora no»** pliega el paso a un aviso con «Ir a Privacidad»: queda a mano, sin insistir. Inicio también lo recuerda.
 * - Al autorizar, «Listo», sin prometer qué ve el profesional (CAND-10-CON-02: nunca «ya puede ver todos tus datos»).
 */
import { COPY_VINCULO, type Resultado } from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { TratamientoDeDatosDeSalud, type RequisitoA3 } from './pantallas/privacidad';
import { Aviso, Boton, Parrafo, Seccion } from './ui';

type Paso = { readonly tipo: 'sin-saber' } | { readonly tipo: 'falta'; readonly datos: RequisitoA3 } | { readonly tipo: 'para-despues' } | { readonly tipo: 'listo' };

export function PasoQueFaltaParaElAcceso({
  token,
  sesionPerdida,
  irAPrivacidad,
  alCompletar,
}: {
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  irAPrivacidad: () => void;
  /** Después de autorizar: la pantalla que lo contiene vuelve a leer su estado. */
  alCompletar?: () => void;
}) {
  const [paso, setPaso] = useState<Paso>({ tipo: 'sin-saber' });
  const generacion = useRef(0);

  const leer = useCallback(async () => {
    const esta = ++generacion.current;
    const r = await api.consultarRequisitoA3(token);
    if (esta !== generacion.current || sesionPerdida(r) || !r.ok) return;
    setPaso(r.datos.data.currentConsent?.state === 'ACTIVE' ? { tipo: 'sin-saber' } : { tipo: 'falta', datos: r.datos.data });
  }, [token, sesionPerdida]);

  useEffect(() => {
    void leer();
    return () => {
      generacion.current++;
    };
  }, [leer]);

  if (paso.tipo === 'listo') {
    return (
      <Aviso tipo="exito" titulo={COPY_VINCULO.ultimoPasoListo}>
        <Parrafo>{COPY_VINCULO.ultimoPasoListoDetalle}</Parrafo>
      </Aviso>
    );
  }
  if (paso.tipo === 'para-despues') {
    return (
      <Aviso tipo="info" titulo={COPY_VINCULO.faltaUnPaso}>
        <Parrafo>{COPY_VINCULO.faltaElTratamientoDeDatos}</Parrafo>
        <Boton texto={COPY_VINCULO.irAPrivacidad} tipo="secundario" onPress={irAPrivacidad} />
      </Aviso>
    );
  }
  if (paso.tipo !== 'falta') return null;
  return (
    <Seccion titulo={COPY_VINCULO.ultimoPasoTitulo}>
      <Parrafo>{COPY_VINCULO.faltaElTratamientoDeDatos}</Parrafo>
      <TratamientoDeDatosDeSalud
        datos={paso.datos}
        token={token}
        sesionPerdida={sesionPerdida}
        ahoraNo={() => setPaso({ tipo: 'para-despues' })}
        alRecargar={() => void leer()}
        alCambiar={(r) => {
          if (r !== 'otorgada') return void leer();
          setPaso({ tipo: 'listo' });
          alCompletar?.();
        }}
      />
    </Seccion>
  );
}
