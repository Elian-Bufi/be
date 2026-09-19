/**
 * APK · Privacidad y consentimientos del asesorado (docs/paquetes/WP-03.md §5; 10-B02 §7-§11; 10-B04 §15-§19).
 * - Tratamiento de datos de salud (A3; PROTO-10-ACC-03/04): estado y versión aplicable desde CON-05. Otorgar es un
 *   acto explícito y separado (CON-06), con «Ahora no» igual de visible y sin colores que castiguen no aceptar
 *   (10-B02 §7.3). Revocar lleva la explicación de 10-B02:396 y «Confirmar revocación» (CON-08). Volver a autorizar es
 *   un acto nuevo, nunca «reactivar»: el acto revocado queda en el historial (10-B02 §11).
 * - Historial A3 (CON-07): versión, fecha de aceptación, estado y revocación; sin IP ni user-agent (10-B02 §9).
 * - Consentimientos a profesionales (CON-03; CAND-10-CON-03): el mismo contenido que desde Vínculos, con «Revocar
 *   acceso de [Profesional]» tan localizable como otorgar (CAND-10-CON-B).
 * Revocar A3 deja sin efecto los consentimientos a profesionales sin revocarlos: por eso la lista se vuelve a leer.
 */
import {
  COPY,
  COPY_VINCULO,
  ETIQUETA_DE_FINALIDAD,
  etiquetaDeConsentimiento,
  type ConsentimientoPropio,
  type RequisitoDeConsentimientoDeSaludResponse,
  type Resultado,
} from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { api } from '../api';
import { DialogoDeConfirmacion, useAccionConfirmada } from '../dialogo';
import { Cargando, ErrorConReintento, EstadoDeCarga, VerMas } from '../estados';
import { fecha } from '../formato';
import { falloDe, useClaveDeIntento, type Fallo } from '../intento';
import { useListaPaginada } from '../lista';
import { useSesionPerdida, type Ruta, type Salida } from '../navegacion';
import { AvisoDeAccesoRevocado, RevocarConsentimiento } from '../revocacion';
import { TextoDesplegable } from '../texto-versionado';
import { Aviso, Boton, COLOR, Dato, Insignia, Parrafo, Seccion, Subtitulo, Tarjeta, Titulo } from '../ui';

type RequisitoA3 = RequisitoDeConsentimientoDeSaludResponse['data'];
type CargaA3 = { readonly tipo: 'cargando' } | { readonly tipo: 'error'; readonly sinConexion: boolean } | { readonly tipo: 'listo'; readonly datos: RequisitoA3 };
type ResultadoA3 = 'otorgada' | 'revocada';

export function PantallaDePrivacidad({
  token,
  salir,
  ir,
  volver,
}: {
  token: string;
  salir: (motivo: Salida) => void;
  ir: (r: Ruta) => void;
  /** «Ahora no»: vuelve a Cuenta sin decidir nada. */
  volver: () => void;
}) {
  const sesionPerdida = useSesionPerdida(salir);
  const [a3, setA3] = useState<CargaA3>({ tipo: 'cargando' });
  const [resultadoA3, setResultadoA3] = useState<ResultadoA3 | null>(null);
  const [revocado, setRevocado] = useState<{ readonly vinculoId: string } | null>(null);
  const generacion = useRef(0);

  const cargarA3 = useCallback(async () => {
    const esta = ++generacion.current;
    setA3({ tipo: 'cargando' });
    const r = await api.consultarRequisitoA3(token);
    if (esta !== generacion.current || sesionPerdida(r)) return;
    setA3(r.ok ? { tipo: 'listo', datos: r.datos.data } : { tipo: 'error', sinConexion: r.tipo === 'RED' });
  }, [token, sesionPerdida]);

  useEffect(() => {
    void cargarA3();
  }, [cargarA3]);

  const historial = useListaPaginada(
    useCallback((cursor?: string) => api.consultarHistorialA3(token, { cursor }), [token]),
    sesionPerdida,
  );
  const consentimientos = useListaPaginada(
    useCallback((cursor?: string) => api.consultarConsentimientos(token, { cursor }), [token]),
    sesionPerdida,
  );

  /** Después de un acto A3 cambian el estado, el historial y el efecto de los consentimientos a profesionales. */
  const releerTodo = () => {
    void cargarA3();
    void historial.recargar();
    void consentimientos.recargar();
  };

  return (
    <>
      <Titulo>Privacidad y consentimientos</Titulo>

      <Seccion titulo="Tratamiento de datos de salud">
        {resultadoA3 === 'otorgada' ? <Aviso tipo="exito" titulo={COPY_VINCULO.a3Otorgada} /> : null}
        {resultadoA3 === 'revocada' ? (
          <Aviso tipo="exito" titulo={COPY_VINCULO.a3Revocada}>
            <Parrafo>{COPY_VINCULO.a3RevocadaDetalle}</Parrafo>
          </Aviso>
        ) : null}
        {a3.tipo === 'cargando' ? <Cargando /> : null}
        {a3.tipo === 'error' ? <ErrorConReintento mensaje={COPY.errorA3} sinConexion={a3.sinConexion} onReintentar={() => void cargarA3()} /> : null}
        {a3.tipo === 'listo' ? (
          <TratamientoDeDatosDeSalud
            datos={a3.datos}
            token={token}
            sesionPerdida={sesionPerdida}
            ahoraNo={volver}
            alRecargar={releerTodo}
            alCambiar={(r) => {
              setResultadoA3(r);
              releerTodo();
            }}
          />
        ) : null}

        <Subtitulo>Historial</Subtitulo>
        <EstadoDeCarga estado={historial.estado} onReintentar={historial.recargar} />
        {historial.estado.tipo === 'listo' && historial.estado.items.length === 0 ? <Parrafo>{COPY_VINCULO.historialA3Vacio}</Parrafo> : null}
        {historial.estado.tipo === 'listo'
          ? historial.estado.items.map((acto) => (
              <Tarjeta key={acto.consentId}>
                <Insignia texto={COPY_VINCULO.estadoDeConsentimiento[acto.state]} positiva={acto.state === 'ACTIVE'} etiqueta="Estado" />
                <Dato etiqueta="Otorgado" valor={fecha(acto.acceptedAt)} />
                {acto.revokedAt ? <Dato etiqueta="Revocado" valor={fecha(acto.revokedAt)} /> : null}
                <Dato etiqueta="Versión" valor={acto.consentVersionId} />
              </Tarjeta>
            ))
          : null}
        <VerMas estado={historial.estado} onVerMas={historial.verMas} />
      </Seccion>

      <Seccion titulo="Consentimientos a profesionales">
        {revocado ? (
          <AvisoDeAccesoRevocado>
            <Boton texto={COPY_VINCULO.verVinculo} tipo="secundario" onPress={() => ir({ nombre: 'vinculo', id: revocado.vinculoId })} />
          </AvisoDeAccesoRevocado>
        ) : null}
        <EstadoDeCarga estado={consentimientos.estado} onReintentar={consentimientos.recargar} />
        {consentimientos.estado.tipo === 'listo' && consentimientos.estado.items.length === 0 ? <Parrafo>{COPY_VINCULO.sinConsentimientos}</Parrafo> : null}
        {consentimientos.estado.tipo === 'listo'
          ? consentimientos.estado.items.map((c) => (
              <ConsentimientoAProfesional
                key={c.consentId}
                c={c}
                token={token}
                sesionPerdida={sesionPerdida}
                onVerVinculo={() => ir({ nombre: 'vinculo', id: c.relationshipId })}
                alRecargar={() => void consentimientos.recargar()}
                alRevocar={() => {
                  setRevocado({ vinculoId: c.relationshipId });
                  void consentimientos.recargar();
                }}
              />
            ))
          : null}
        <VerMas estado={consentimientos.estado} onVerMas={consentimientos.verMas} />
      </Seccion>
    </>
  );
}

type ActoA3 = { readonly tipo: 'libre' } | { readonly tipo: 'enviando' } | { readonly tipo: 'fallo'; readonly fallo: Fallo };

/**
 * A3 según CON-05: `currentConsent` es el último acto; `null` = nunca otorgado. Sin A3 vigente, el texto de la versión
 * aplicable se muestra de entrada: es lo que se acepta y no hay un resumen aprobado que lo reemplace (10-B02 §7.1).
 */
function TratamientoDeDatosDeSalud({
  datos,
  token,
  sesionPerdida,
  ahoraNo,
  alRecargar,
  alCambiar,
}: {
  datos: RequisitoA3;
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  ahoraNo: () => void;
  alRecargar: () => void;
  alCambiar: (r: ResultadoA3) => void;
}) {
  const intento = useClaveDeIntento();
  const [acto, setActo] = useState<ActoA3>({ tipo: 'libre' });
  const enCurso = useRef(false);
  const revocar = useAccionConfirmada({ sesionPerdida, alTerminar: () => alCambiar('revocada'), alRecargar });
  const actual = datos.currentConsent;

  async function otorgar() {
    if (enCurso.current) return;
    enCurso.current = true;
    setActo({ tipo: 'enviando' });
    const r = await api.otorgarA3(token, datos.consentVersion.id, intento.actual());
    enCurso.current = false;
    intento.registrar(r);
    if (r.ok) {
      setActo({ tipo: 'libre' });
      return alCambiar('otorgada');
    }
    if (sesionPerdida(r)) return;
    // Ya había un A3 vigente (otro dispositivo, otra pestaña): la pantalla mostró algo que ya no es así.
    setActo({ tipo: 'fallo', fallo: falloDe(r, { CONSENT_ALREADY_ACTIVE: { mensaje: COPY_VINCULO.contenidoCambio, tipo: 'actualizar' } }) });
  }

  if (actual?.state === 'ACTIVE') {
    return (
      <>
        <Insignia texto="Otorgado" positiva etiqueta="Tratamiento de datos de salud" />
        <Dato etiqueta="Desde" valor={fecha(actual.acceptedAt)} />
        <Dato etiqueta="Versión" valor={actual.consentVersionId} />
        <Boton texto={COPY_VINCULO.revocarA3} tipo="peligroSecundario" onPress={revocar.abrir} />
        <DialogoDeConfirmacion
          visible={revocar.visible}
          titulo={COPY_VINCULO.revocarA3}
          textoConfirmar={COPY_VINCULO.confirmarRevocacion}
          textoEnviando="Revocando…"
          peligro
          enviando={revocar.enviando}
          fallo={revocar.fallo}
          onVolver={revocar.volver}
          onActualizar={revocar.actualizar}
          onConfirmar={() => void revocar.ejecutar(() => api.revocarA3(token, actual.consentId))}
        >
          <Parrafo>{COPY_VINCULO.explicacionDeRevocacionA3}</Parrafo>
        </DialogoDeConfirmacion>
      </>
    );
  }

  const enviando = acto.tipo === 'enviando';
  const fallo = acto.tipo === 'fallo' ? acto.fallo : null;
  return (
    <>
      <Insignia texto="No otorgado" etiqueta="Tratamiento de datos de salud" />
      <Parrafo>{COPY.cuentaSinA3}</Parrafo>
      <TextoDesplegable version={datos.consentVersion} textoDelBoton={`Ver el texto (versión ${datos.consentVersion.id})`} abiertoAlInicio />
      {fallo ? (
        <Aviso tipo="error" titulo={fallo.mensaje}>
          {fallo.tipo === 'actualizar' ? <Boton texto="Actualizar" tipo="secundario" onPress={alRecargar} /> : null}
        </Aviso>
      ) : null}
      {fallo?.tipo !== 'actualizar' ? (
        <Boton
          texto={
            enviando
              ? 'Autorizando…'
              : fallo?.tipo === 'incierto'
                ? COPY.reintentar
                : actual?.state === 'REVOKED'
                  ? COPY_VINCULO.autorizarA3Nuevamente
                  : COPY_VINCULO.autorizarA3
          }
          onPress={() => void otorgar()}
          ocupado={enviando}
        />
      ) : null}
      <Boton texto={COPY_VINCULO.ahoraNo} tipo="secundario" onPress={ahoraNo} deshabilitado={enviando} />
    </>
  );
}

/** Ítem de CON-03 (10-B04 §16): profesional, alcance, finalidad, estado, fechas y estado actual del vínculo. */
function ConsentimientoAProfesional({
  c,
  token,
  sesionPerdida,
  onVerVinculo,
  alRecargar,
  alRevocar,
}: {
  c: ConsentimientoPropio;
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  onVerVinculo: () => void;
  alRecargar: () => void;
  alRevocar: () => void;
}) {
  return (
    <Tarjeta>
      <Text style={estilos.nombre}>{c.professional.displayName}</Text>
      <Dato etiqueta={COPY_VINCULO.alcance} valor={c.scope.label} />
      <Dato etiqueta={COPY_VINCULO.finalidad} valor={ETIQUETA_DE_FINALIDAD[c.purpose]} />
      <Insignia texto={etiquetaDeConsentimiento(c.state, c.accessMode)} positiva={c.state === 'ACTIVE' && c.accessMode === 'CONTEXTUAL'} etiqueta="Consentimiento" />
      <Dato etiqueta="Autorizado" valor={fecha(c.acceptedAt)} />
      {c.revokedAt ? <Dato etiqueta="Revocado" valor={fecha(c.revokedAt)} /> : null}
      <Dato etiqueta="Vínculo" valor={COPY_VINCULO.estadoDeVinculo[c.relationshipState]} />
      {c.state === 'ACTIVE' ? (
        <RevocarConsentimiento
          token={token}
          consentId={c.consentId}
          profesional={c.professional.displayName}
          sesionPerdida={sesionPerdida}
          alRevocar={alRevocar}
          alRecargar={alRecargar}
        />
      ) : null}
      <Boton texto={COPY_VINCULO.verVinculo} tipo="secundario" onPress={onVerVinculo} />
    </Tarjeta>
  );
}

const estilos = StyleSheet.create({
  nombre: { fontSize: 18, fontWeight: '700', color: COLOR.texto, marginBottom: 4 },
});
