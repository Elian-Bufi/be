/**
 * APK · «Falta un paso» (pedido de Dirección del 2026-10-17): la persona autorizó a un profesional, pero sin el
 * tratamiento de datos de salud (A3) vigente el acceso no es efectivo (RF-023), y la app decía «Acceso autorizado ·
 * Activo» igual. Ahora lo dice, con el camino a Privacidad, donde la persona decide.
 *
 * Lee A3 con CON-05 (la misma lectura de Cuenta y de Privacidad). Solo aparece si la respuesta dice que no está vigente:
 * sin respuesta (sin conexión, un error) no se muestra, para no afirmar algo que no se sabe.
 */
import { COPY_VINCULO } from '@be/domain';
import { useEffect, useState } from 'react';
import { api } from './api';
import { Aviso, Boton, Parrafo } from './ui';

export function PasoQueFaltaParaElAcceso({ token, irAPrivacidad }: { token: string; irAPrivacidad: () => void }) {
  const [falta, setFalta] = useState(false);

  useEffect(() => {
    let vigente = true;
    void api.consultarRequisitoA3(token).then((r) => {
      if (vigente && r.ok) setFalta(r.datos.data.currentConsent?.state !== 'ACTIVE');
    });
    return () => {
      vigente = false;
    };
  }, [token]);

  if (!falta) return null;
  return (
    <Aviso tipo="info" titulo={COPY_VINCULO.faltaUnPaso}>
      <Parrafo>{COPY_VINCULO.faltaElTratamientoDeDatos}</Parrafo>
      <Boton texto={COPY_VINCULO.irAPrivacidad} onPress={irAPrivacidad} />
    </Aviso>
  );
}
