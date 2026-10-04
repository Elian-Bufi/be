/**
 * Inicio · la tarjeta de Información (DL-117): las solicitudes sin responder, con `respondable` y el A3. Una lista parcial
 * no se presenta como el total.
 */
import { COPY_FORMULARIOS, numero } from '@be/domain';
import { useCallback, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { api } from '../api';
import { SinActualizar } from '../estados';
import { dia as diaDe } from '../formato';
import { useLecturaRecordada } from '../lecturas';
import { leerPendientes, PENDIENTES_EN_INICIO } from '../lecturas-de-inicio';
import type { Ir } from '../navegacion';
import { Boton, Parrafo } from '../ui';
import { estilos, NoSePudo, SinA3, TarjetaDeInicio, Verificando, type AlPerderLaSesion } from './tarjeta-de-inicio';

/** API-FRM-06 filtrada a las pendientes, con el A3: responder lo exige (DL-115). */
export function Pendientes({ token, sesionPerdida, ir }: { token: string; sesionPerdida: AlPerderLaSesion; ir: Ir }) {
  const pedir = useCallback(() => leerPendientes(api, token), [token]);
  const { r, cargar, sinActualizar } = useLecturaRecordada(token, 'inicio-pendientes', pedir, sesionPerdida);
  let contenido: ReactNode;
  if (!r) contenido = <Verificando />;
  else if (!r.ok) contenido = <NoSePudo falla={r} reintentar={() => void cargar()} />;
  else {
    const { pendientes, hayMas, sinA3 } = r.datos;
    const n = pendientes.length;
    contenido =
      n === 0 ? (
        <Parrafo>{COPY_FORMULARIOS.sinSolicitudesPropias}</Parrafo>
      ) : (
        <>
          {/* Con más páginas, la cuenta de esta lista no es el total: se dice que hay más. */}
          <Parrafo>
            {hayMas
              ? `Tenés más de ${numero(PENDIENTES_EN_INICIO)} solicitudes sin responder. Acá ves las ${numero(PENDIENTES_EN_INICIO)} más recientes.`
              : `${numero(n)} ${n === 1 ? 'solicitud sin responder' : 'solicitudes sin responder'}.`}
          </Parrafo>
          {sinA3 ? <SinA3 texto={COPY_FORMULARIOS.necesitaA3} ir={ir} /> : null}
          {pendientes.map((s) => (
            <View key={s.formRequestId} style={estilos.fila}>
              <Text style={estilos.nombre}>{s.templateName}</Text>
              <Text style={estilos.detalle}>{`${s.professional.displayName} · ${diaDe(s.createdAt)}`}</Text>
              {s.respondable && !sinA3 ? <Boton texto={COPY_FORMULARIOS.completar} onPress={() => ir({ nombre: 'mi-solicitud', id: s.formRequestId })} /> : null}
              {!s.respondable ? <Parrafo tenue>Por ahora no se puede responder. El detalle está en Información.</Parrafo> : null}
            </View>
          ))}
        </>
      );
  }
  return (
    <TarjetaDeInicio zona="informacion" titulo="Para responder">
      {contenido}
      <SinActualizar visible={sinActualizar} onReintentar={() => void cargar()} />
      <Boton texto="Ir a Información" tipo="enlace" onPress={() => ir({ nombre: 'mis-solicitudes' })} />
    </TarjetaDeInicio>
  );
}
