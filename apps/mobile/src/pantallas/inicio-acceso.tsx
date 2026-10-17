/**
 * APK · Inicio: «Tu profesional todavía no puede ver tus datos» (pedido de Dirección del 2026-10-17). Una persona puede
 * creer que su profesional ya la acompaña cuando solo aceptó el vínculo: le falta autorizar su acceso, o el tratamiento
 * de datos de salud (A3). Este aviso va arriba de todo y lleva al vínculo, donde está el paso que falta.
 *
 * - Lee los vínculos aceptados (REL-05) y A3 (CON-05), las mismas lecturas de Vínculos y de Privacidad. No escribe.
 * - Aparece solo si hay algo que la persona puede hacer: un vínculo con su autorización pendiente, o autorizado pero sin
 *   efecto mientras falta A3. Si el acceso no es efectivo por otra razón (de la que la persona no puede ocuparse), no.
 * - Si una lectura falla, no se muestra: es un recordatorio, y las tarjetas de abajo tienen su propio «Reintentar».
 */
import { COPY_VINCULO, type Resultado } from '@be/domain';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { api } from '../api';
import type { Ir } from '../navegacion';
import { pasosQueFaltan, type PasoQueFalta } from '../pasos-del-acceso';
import { Aviso, Boton, Parrafo } from '../ui';

export function AccesoIncompleto({ token, sesionPerdida, ir }: { token: string; sesionPerdida: (r: Resultado<unknown>) => boolean; ir: Ir }) {
  const [faltan, setFaltan] = useState<readonly PasoQueFalta[]>([]);

  useEffect(() => {
    let vigente = true;
    void Promise.all([api.consultarVinculos(token, { state: 'ACEPTADO' }), api.consultarRequisitoA3(token)]).then(([v, a3]) => {
      if (!vigente || sesionPerdida(v) || sesionPerdida(a3) || !v.ok || !a3.ok) return;
      setFaltan(pasosQueFaltan(v.datos.data, a3.datos.data.currentConsent?.state === 'ACTIVE'));
    });
    return () => {
      vigente = false;
    };
  }, [token, sesionPerdida]);

  if (faltan.length === 0) return null;
  return (
    <Aviso tipo="info" titulo={COPY_VINCULO.inicioAccesoIncompletoTitulo}>
      {faltan.map(({ vinculo: v, que }) => (
        <View key={v.relationshipId}>
          <Parrafo>
            {que === 'autorizar'
              ? COPY_VINCULO.inicioFaltaAutorizar(v.professional.displayName, v.scope.label)
              : COPY_VINCULO.inicioFaltaElTratamiento(v.professional.displayName, v.scope.label)}
          </Parrafo>
          <Boton texto={COPY_VINCULO.completarElPaso} tipo="secundario" onPress={() => ir({ nombre: 'vinculo', id: v.relationshipId })} />
        </View>
      ))}
    </Aviso>
  );
}
