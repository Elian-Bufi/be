/**
 * Inicio · la tarjeta de Información (DL-117): las solicitudes sin responder, con `respondable` y el A3. Una lista parcial
 * no se presenta como el total. Desde DL-164 lee la bandeja (API-FRI-02): una con algo cargado por el profesional se
 * ofrece para revisar, no para completar.
 *
 * Y «Tus hábitos» (DL-165 D-9, FR-10), solo cuando hay algo que preguntar: un profesional empezó a acompañar a la persona
 * después de que ella compartió sus hábitos, y no los recibe solo (§4.3). La tarjeta pregunta y lleva a «Mis hábitos»,
 * donde se responde con el texto a la vista. Sin A3, con una falla o sin nada que preguntar, no se dibuja: no es una tarea.
 * Ronda 2.1 (D-17 nueva): si un profesional pidió verlos (API-HBT-08), la tarjeta muestra ese pedido primero, y lleva a
 * «Mis hábitos», donde se responde. Quien pidió no recibe además la pregunta por un profesional nuevo.
 */
import { COPY_FORMULARIOS, COPY_FORMULARIOS_V2, COPY_HABITOS, numero } from '@be/domain';
import { useCallback, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { api } from '../api';
import { SinActualizar } from '../estados';
import { dia as diaDe } from '../formato';
import { TEXTOS_DE_FORMULARIO_V2 } from '../formulario-v2';
import { areasEnPalabras, paraQueLeSirven, tarjetaDeHabitosEnInicio } from '../habitos-en-el-telefono';
import { useLecturaRecordada } from '../lecturas';
import { leerPendientes, PENDIENTES_EN_INICIO } from '../lecturas-de-inicio';
import type { Ir } from '../navegacion';
import { Boton, Insignia, Parrafo } from '../ui';
import { estilos, NoSePudo, SinA3, TarjetaDeInicio, Verificando, type AlPerderLaSesion } from './tarjeta-de-inicio';

/** API-FRI-02 filtrada a las pendientes, con el A3: responder lo exige (DL-115). */
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
              {/* Con algo cargado por el profesional, lo que sigue es revisarlo y confirmarlo (DL-164 D-4), no completarlo. */}
              {s.pendingProposal ? <Insignia texto={COPY_FORMULARIOS_V2.apk.paraConfirmar} /> : null}
              {s.respondable && !sinA3 ? (
                <Boton texto={s.pendingProposal ? TEXTOS_DE_FORMULARIO_V2.revisar : COPY_FORMULARIOS.completar} onPress={() => ir({ nombre: 'mi-solicitud', id: s.formRequestId })} />
              ) : null}
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
      <Boton texto="Ir a Información" tipo="enlace" icono="derecha" iconoAlFinal onPress={() => ir({ nombre: 'mis-solicitudes' })} />
    </TarjetaDeInicio>
  );
}

/**
 * API-HBT-01 y API-HBT-08, las mismas lecturas que «Mis hábitos»: la tarjeta aparece solo si un profesional pidió verlos o
 * si hay un profesional nuevo por el que preguntar. El pedido va primero (`tarjetaDeHabitosEnInicio`).
 */
export function PreguntaDeHabitos({ token, sesionPerdida, ir }: { token: string; sesionPerdida: AlPerderLaSesion; ir: Ir }) {
  const pedir = useCallback(() => api.misHabitos(token), [token]);
  const { r } = useLecturaRecordada(token, 'mis-habitos', pedir, sesionPerdida);
  const pedirPedidos = useCallback(() => api.pedidosDeAccesoAMisHabitos(token), [token]);
  const pedidos = useLecturaRecordada(token, 'pedidos-de-acceso', pedirPedidos, sesionPerdida);
  const tarjeta = tarjetaDeHabitosEnInicio(r?.ok ? r.datos.data : null, pedidos.r?.ok ? pedidos.r.datos.data : null);
  if (!tarjeta) return null;
  if (tarjeta.tipo === 'pedido') {
    const { pedido } = tarjeta;
    return (
      <TarjetaDeInicio zona="informacion" titulo={COPY_HABITOS.apk.pedidosTitulo}>
        <Text style={estilos.pregunta}>{COPY_HABITOS.apk.pedidoDe(pedido.professional.displayName, pedido.scope.label)}</Text>
        <Parrafo tenue>{paraQueLeSirven(pedido)}</Parrafo>
        <Parrafo tenue>{COPY_HABITOS.apk.esTuDecision}</Parrafo>
        <Boton texto={COPY_HABITOS.apk.nuevoResponder} onPress={() => ir({ nombre: 'mis-habitos' })} />
      </TarjetaDeInicio>
    );
  }
  const nuevo = tarjeta.profesional;
  return (
    <TarjetaDeInicio zona="informacion" titulo={COPY_HABITOS.apk.nuevoTitulo}>
      <Text style={estilos.pregunta}>{COPY_HABITOS.apk.nuevoPregunta(nuevo.professional.displayName)}</Text>
      <Text style={estilos.detalle}>{areasEnPalabras(nuevo)}</Text>
      <Parrafo tenue>{COPY_HABITOS.apk.nuevoDetalle}</Parrafo>
      <Boton texto={COPY_HABITOS.apk.nuevoResponder} onPress={() => ir({ nombre: 'mis-habitos' })} />
    </TarjetaDeInicio>
  );
}
