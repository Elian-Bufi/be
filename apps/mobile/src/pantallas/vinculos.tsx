/**
 * APK · Vínculos del asesorado (docs/paquetes/WP-03.md §5; 10-B04 §5-§9).
 * - «Solicitudes recibidas» (CAND-10-REL-01/02): cada solicitud pendiente muestra profesional, alcance, finalidad,
 *   estado y fechas, el literal de 10-B04:250-251 y, justo encima de los botones, lo que implica aceptar (10-B04:265).
 * - «Aceptar vínculo» y «Rechazar solicitud» ejecutan directo, sin modal («no requiere modal dramático»,
 *   CAND-10-REL-03/04): botón explícito → acción → éxito → siguiente paso. Aceptar no autoriza el acceso: el siguiente
 *   paso es revisar el consentimiento (TEST-AUTH-006). Rechazar no pide motivo.
 * - «Tus vínculos» (REL-05), con el estado del vínculo y el de tu consentimiento, y «Solicitudes anteriores».
 * Solo se listan los ítems en los que esta cuenta es el asesorado, y como recibidas las que inició el profesional: el
 * APK es la superficie del asesorado (10-B01:100-119). `expectedVersion` es la versión que la tarjeta mostró.
 */
import { COPY, COPY_VINCULO, ETIQUETA_DE_FINALIDAD, estadoParaMostrar, type Resultado, type SolicitudDeVinculo, type Vinculo } from '@be/domain';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { EstadoDeCarga, VerMas } from '../estados';
import { dia, fecha } from '../formato';
import { falloDe, useClaveDeIntento, type Fallo } from '../intento';
import { useListaPaginada } from '../lista';
import { useSesionPerdida, type Ruta, type Salida } from '../navegacion';
import { Aviso, Boton, COLOR, Dato, Insignia, Parrafo, Seccion, Tarjeta, Titulo, estilos as ui } from '../ui';

type Decision = { readonly tipo: 'aceptada'; readonly vinculoId: string } | { readonly tipo: 'rechazada' };

export function PantallaDeVinculos({
  token,
  identidadId,
  salir,
  ir,
  subir,
}: {
  token: string;
  identidadId: string;
  salir: (motivo: Salida) => void;
  ir: (r: Ruta) => void;
  /** Lleva la pantalla al principio, donde queda el resultado de aceptar o rechazar. */
  subir: () => void;
}) {
  const sesionPerdida = useSesionPerdida(salir);
  const [decision, setDecision] = useState<Decision | null>(null);

  const pendientes = useListaPaginada(
    useCallback((cursor?: string) => api.consultarSolicitudes(token, { state: 'PENDIENTE', cursor }), [token]),
    sesionPerdida,
  );
  const vinculos = useListaPaginada(
    useCallback((cursor?: string) => api.consultarVinculos(token, { cursor }), [token]),
    sesionPerdida,
  );
  const anteriores = useListaPaginada(
    useCallback((cursor?: string) => api.consultarSolicitudes(token, { cursor }), [token]),
    sesionPerdida,
  );

  const recargarTodo = () => {
    void pendientes.recargar();
    void vinculos.recargar();
    void anteriores.recargar();
  };

  const soyElAsesorado = (x: { readonly advisee: { readonly identityId: string } }) => x.advisee.identityId === identidadId;
  const recibidas = pendientes.estado.tipo === 'listo' ? pendientes.estado.items.filter((s) => soyElAsesorado(s) && s.initiatedBy === 'PROFESSIONAL') : [];
  const propios = vinculos.estado.tipo === 'listo' ? vinculos.estado.items.filter(soyElAsesorado) : [];
  const resueltas = anteriores.estado.tipo === 'listo' ? anteriores.estado.items.filter((s) => soyElAsesorado(s) && s.state !== 'PENDIENTE') : [];

  return (
    <>
      <Titulo>Vínculos</Titulo>

      {decision?.tipo === 'aceptada' ? (
        <Aviso tipo="exito" titulo={COPY_VINCULO.vinculoAceptado}>
          <Parrafo>{COPY_VINCULO.vinculoAceptadoDetalle}</Parrafo>
          <Boton texto={COPY_VINCULO.revisarConsentimiento} onPress={() => ir({ nombre: 'consentimiento', vinculoId: decision.vinculoId })} />
        </Aviso>
      ) : null}
      {decision?.tipo === 'rechazada' ? <Aviso tipo="exito" titulo={COPY_VINCULO.solicitudRechazada} /> : null}

      <Seccion titulo="Solicitudes recibidas">
        <EstadoDeCarga estado={pendientes.estado} onReintentar={pendientes.recargar} />
        {pendientes.estado.tipo === 'listo' && recibidas.length === 0 ? <Parrafo>{COPY_VINCULO.sinSolicitudes}</Parrafo> : null}
        {recibidas.map((s) => (
          <SolicitudRecibida
            key={`${s.relationshipRequestId}:${s.version}`}
            s={s}
            token={token}
            sesionPerdida={sesionPerdida}
            alActualizar={recargarTodo}
            alDecidir={(d) => {
              setDecision(d);
              subir();
              recargarTodo();
            }}
          />
        ))}
        <VerMas estado={pendientes.estado} onVerMas={pendientes.verMas} />
      </Seccion>

      <Seccion titulo="Tus vínculos">
        <EstadoDeCarga estado={vinculos.estado} onReintentar={vinculos.recargar} />
        {vinculos.estado.tipo === 'listo' && propios.length === 0 ? <Parrafo>{COPY_VINCULO.sinVinculos}</Parrafo> : null}
        {propios.map((v) => (
          <TarjetaDeVinculo key={v.relationshipId} v={v} onVer={() => ir({ nombre: 'vinculo', id: v.relationshipId })} />
        ))}
        <VerMas estado={vinculos.estado} onVerMas={vinculos.verMas} />
      </Seccion>

      <Seccion titulo="Solicitudes anteriores">
        <EstadoDeCarga estado={anteriores.estado} onReintentar={anteriores.recargar} />
        {anteriores.estado.tipo === 'listo' && resueltas.length === 0 ? <Parrafo>{COPY_VINCULO.sinSolicitudes}</Parrafo> : null}
        {resueltas.map((s) => (
          <SolicitudAnterior key={s.relationshipRequestId} s={s} />
        ))}
        <VerMas estado={anteriores.estado} onVerMas={anteriores.verMas} />
      </Seccion>
    </>
  );
}

type Que = 'aceptar' | 'rechazar';
type EstadoDeDecision =
  | { readonly tipo: 'libre' }
  | { readonly tipo: 'enviando'; readonly que: Que }
  | { readonly tipo: 'fallo'; readonly que: Que; readonly fallo: Fallo };

/**
 * Detalle de una solicitud recibida (CAND-10-REL-02) con su decisión. Un resultado incierto se reintenta con la misma
 * Idempotency-Key; cambiar de decisión es otro intento lógico y usa otra.
 */
function SolicitudRecibida({
  s,
  token,
  sesionPerdida,
  alDecidir,
  alActualizar,
}: {
  s: SolicitudDeVinculo;
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  alDecidir: (d: Decision) => void;
  alActualizar: () => void;
}) {
  const intento = useClaveDeIntento();
  const [estado, setEstado] = useState<EstadoDeDecision>({ tipo: 'libre' });
  const enCurso = useRef(false);
  const profesional = s.professional.displayName;

  async function decidir(que: Que) {
    if (enCurso.current) return;
    if (estado.tipo === 'fallo' && estado.que !== que) intento.descartar();
    enCurso.current = true;
    setEstado({ tipo: 'enviando', que });
    const clave = intento.actual();
    if (que === 'aceptar') {
      const r = await api.aceptarSolicitud(token, s.relationshipRequestId, s.version, clave);
      enCurso.current = false;
      intento.registrar(r);
      if (r.ok) return alDecidir({ tipo: 'aceptada', vinculoId: r.datos.data.relationshipId });
      if (sesionPerdida(r)) return;
      return setEstado({ tipo: 'fallo', que, fallo: falloDe(r) });
    }
    const r = await api.rechazarSolicitud(token, s.relationshipRequestId, s.version, clave);
    enCurso.current = false;
    intento.registrar(r);
    if (r.ok) return alDecidir({ tipo: 'rechazada' });
    if (sesionPerdida(r)) return;
    setEstado({ tipo: 'fallo', que, fallo: falloDe(r) });
  }

  const enviando = estado.tipo === 'enviando';
  const fallo = estado.tipo === 'fallo' ? estado.fallo : null;
  // La tarjeta mostró algo que ya no es vigente (o ya no se puede abrir): decidir de nuevo fallaría igual.
  const vieja = fallo?.tipo === 'actualizar' || fallo?.tipo === 'no-revelable';
  const texto = (que: Que, normal: string, enCursoTexto: string) =>
    estado.tipo === 'enviando' && estado.que === que ? enCursoTexto : estado.tipo === 'fallo' && estado.que === que && estado.fallo.tipo === 'incierto' ? COPY.reintentar : normal;

  return (
    <Tarjeta>
      <Text style={estilos.nombre}>{profesional}</Text>
      <Dato etiqueta={COPY_VINCULO.alcance} valor={s.scope.label} />
      <Dato etiqueta={COPY_VINCULO.finalidad} valor={ETIQUETA_DE_FINALIDAD[s.purpose]} />
      <Dato etiqueta="Estado" valor={COPY_VINCULO.estadoDeSolicitud[s.state]} />
      <Dato etiqueta="Recibida" valor={fecha(s.createdAt)} />
      {s.expiresAt ? <Dato etiqueta="Vence" valor={dia(s.expiresAt)} /> : null}
      <Parrafo>{COPY_VINCULO.detalleDeSolicitud}</Parrafo>
      <Parrafo>{COPY_VINCULO.confirmarAceptacion(profesional, s.scope.label)}</Parrafo>
      {!vieja ? (
        <>
          <Boton texto={texto('aceptar', COPY_VINCULO.aceptarVinculo, 'Aceptando…')} onPress={() => void decidir('aceptar')} ocupado={enviando && estado.que === 'aceptar'} deshabilitado={enviando} />
          <Boton
            texto={texto('rechazar', COPY_VINCULO.rechazarSolicitud, 'Rechazando…')}
            tipo="secundario"
            onPress={() => void decidir('rechazar')}
            ocupado={enviando && estado.que === 'rechazar'}
            deshabilitado={enviando}
          />
        </>
      ) : null}
      {fallo ? (
        <Aviso tipo="error" titulo={fallo.mensaje}>
          {vieja ? <Boton texto="Actualizar" tipo="secundario" onPress={alActualizar} /> : null}
        </Aviso>
      ) : null}
    </Tarjeta>
  );
}

/**
 * Ítem de «Tus vínculos»: contraparte, alcance, finalidad, estado y fecha (CAND-10-REL-01). Toda la tarjeta abre el
 * detalle; el lector de pantalla la anuncia como un solo botón con su contenido.
 */
function TarjetaDeVinculo({ v, onVer }: { v: Vinculo; onVer: () => void }) {
  const e = estadoParaMostrar(v, 'ADVISEE');
  const finalidad = ETIQUETA_DE_FINALIDAD[v.purpose];
  const desde = dia(v.acceptedAt);
  const resumen = [
    v.professional.displayName,
    `${COPY_VINCULO.alcance}: ${v.scope.label}`,
    `${COPY_VINCULO.finalidad}: ${finalidad}`,
    `Estado del vínculo: ${e.estado}`,
    e.detalle,
    `Desde: ${desde}`,
  ]
    .filter(Boolean)
    .join('. ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={resumen}
      accessibilityHint="Abre el detalle del vínculo"
      onPress={onVer}
      style={({ pressed }) => [ui.tarjeta, pressed && ui.presionado]}
    >
      <View importantForAccessibility="no-hide-descendants">
        <Text style={estilos.nombre}>{v.professional.displayName}</Text>
        <Dato etiqueta={COPY_VINCULO.alcance} valor={v.scope.label} />
        <Dato etiqueta={COPY_VINCULO.finalidad} valor={finalidad} />
        <Insignia texto={e.estado} positiva={v.relationshipState === 'ACEPTADO'} etiqueta="Estado del vínculo" />
        {e.detalle ? <Parrafo>{e.detalle}</Parrafo> : null}
        <Dato etiqueta="Desde" valor={desde} />
        <Text style={estilos.enlace}>{COPY_VINCULO.verVinculo}</Text>
      </View>
    </Pressable>
  );
}

/** Ítem compacto de una solicitud ya resuelta: contraparte, alcance, finalidad, estado y fecha. */
function SolicitudAnterior({ s }: { s: SolicitudDeVinculo }) {
  return (
    <Tarjeta>
      <Text style={ui.negrita}>{s.professional.displayName}</Text>
      <Text style={ui.parrafo}>
        {s.scope.label} · {ETIQUETA_DE_FINALIDAD[s.purpose]}
      </Text>
      <Text style={ui.tenue}>
        {COPY_VINCULO.estadoDeSolicitud[s.state]} · {s.initiatedBy === 'PROFESSIONAL' ? 'Recibida' : 'Enviada'} el {fecha(s.createdAt)}
      </Text>
    </Tarjeta>
  );
}

const estilos = StyleSheet.create({
  nombre: { fontSize: 18, fontWeight: '700', color: COLOR.texto, marginBottom: 4 },
  enlace: { fontSize: 16, fontWeight: '700', color: COLOR.azulOscuro, textDecorationLine: 'underline', marginTop: 8 },
});
