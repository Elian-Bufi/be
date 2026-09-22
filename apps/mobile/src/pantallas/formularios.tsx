/**
 * APK · «Información que me pidieron» (RF-071; UC-P33; API-FRM-06, 07 y 08).
 *
 * Lo que esta pantalla tiene que sostener, y por eso el copy dice lo que dice:
 * - **no responder es una opción legítima**: no hay barra de completitud, ni recordatorio culposo, ni nada que
 *   presente una solicitud sin responder como un incumplimiento;
 * - **lo que se responde queda como declarado por la persona** (09 §22.7): nunca como medición ni diagnóstico;
 * - **un campo opcional que no se completa se omite**, no viaja como cero ni como vacío (09:1586-1587);
 * - **corregir agrega, no reemplaza**: la respuesta anterior se conserva y se ve (09:1618).
 *
 * `respondable` lo decide la API en cada lectura, con la política vigente: si el vínculo se pausó o el
 * consentimiento se revocó, la solicitud sigue estando —es de la persona— pero ya no se puede responder.
 */
import { COPY_FORMULARIOS, type CampoDePlantilla, type RespuestaDeFormulario, type SolicitudDeFormulario, type SolicitudPropia, type VersionDePlantilla } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { api } from '../api';
import { Cargando, ErrorConReintento } from '../estados';
import { fecha } from '../formato';
import { falloDe, useClaveDeIntento } from '../intento';
import { useSesionPerdida, type Salida } from '../navegacion';
import { Aviso, Boton, Campo, Insignia, Parrafo, Seccion, Tarjeta, Titulo } from '../ui';

type Carga = { tipo: 'cargando' } | { tipo: 'listo'; datos: readonly SolicitudPropia[] } | { tipo: 'error'; sinConexion: boolean };

export function PantallaDeFormularios({ token, salir, ir }: { token: string; salir: (m: Salida) => void; ir: (r: { nombre: 'mi-solicitud'; id: string }) => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' });

  const cargar = useCallback(async () => {
    setCarga({ tipo: 'cargando' });
    const r = await api.misSolicitudesDeFormulario(token);
    if (sesionPerdida(r)) return;
    setCarga(r.ok ? { tipo: 'listo', datos: r.datos.data } : { tipo: 'error', sinConexion: r.tipo === 'RED' });
  }, [token, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <View>
      <Titulo>{COPY_FORMULARIOS.pestana}</Titulo>
      <Parrafo tenue>{COPY_FORMULARIOS.podesNoResponder}</Parrafo>
      {carga.tipo === 'cargando' ? <Cargando /> : null}
      {carga.tipo === 'error' ? <ErrorConReintento sinConexion={carga.sinConexion} onReintentar={cargar} /> : null}
      {carga.tipo === 'listo' && carga.datos.length === 0 ? <Parrafo>{COPY_FORMULARIOS.sinSolicitudesPropias}</Parrafo> : null}
      {carga.tipo === 'listo'
        ? carga.datos.map((s) => (
            <Tarjeta key={s.formRequestId}>
              <Parrafo>{s.templateName}</Parrafo>
              <Insignia texto={s.status === 'RESPONDED' ? COPY_FORMULARIOS.respondida : COPY_FORMULARIOS.pendiente} positiva={s.status === 'RESPONDED'} />
              <Parrafo tenue>
                {COPY_FORMULARIOS.pedidoPor} {s.professional.displayName} · {fecha(s.createdAt)}
              </Parrafo>
              <Parrafo tenue>{s.purpose}</Parrafo>
              {s.respondable ? (
                <Boton texto={COPY_FORMULARIOS.completar} onPress={() => ir({ nombre: 'mi-solicitud', id: s.formRequestId })} />
              ) : s.status === 'RESPONDED' ? (
                <Boton texto="Ver mi respuesta" tipo="secundario" onPress={() => ir({ nombre: 'mi-solicitud', id: s.formRequestId })} />
              ) : (
                <Parrafo tenue>{COPY_FORMULARIOS.yaNoSePuedeResponder}</Parrafo>
              )}
            </Tarjeta>
          ))
        : null}
    </View>
  );
}

// ─── Completar o corregir una solicitud (API-FRM-05, 07 y 08) ───────────────────────────────────

interface Detalle {
  readonly request: SolicitudDeFormulario;
  readonly response: RespuestaDeFormulario | null;
}

type CargaDeDetalle = { tipo: 'cargando' } | { tipo: 'listo'; detalle: Detalle; plantilla: VersionDePlantilla } | { tipo: 'error'; sinConexion: boolean };

export function PantallaDeMiSolicitud({ token, id, salir }: { token: string; id: string; salir: (m: Salida) => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const [carga, setCarga] = useState<CargaDeDetalle>({ tipo: 'cargando' });
  const [valores, setValores] = useState<Record<string, string>>({});
  const [motivo, setMotivo] = useState('');
  const [aviso, setAviso] = useState<{ tipo: 'error' | 'exito'; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const clave = useClaveDeIntento();

  const cargar = useCallback(async () => {
    setCarga({ tipo: 'cargando' });
    const r = await api.consultarSolicitudDeFormulario(token, id);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setCarga({ tipo: 'error', sinConexion: r.tipo === 'RED' });
    const { templateId, templateVersionId } = r.datos.data.request;
    const v = await api.consultarVersionDePlantilla(token, templateId, templateVersionId);
    if (sesionPerdida(v)) return;
    if (!v.ok) return setCarga({ tipo: 'error', sinConexion: v.tipo === 'RED' });
    setCarga({ tipo: 'listo', detalle: r.datos.data, plantilla: v.datos.data });
  }, [token, id, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (carga.tipo === 'cargando') return <Cargando />;
  if (carga.tipo === 'error') return <ErrorConReintento sinConexion={carga.sinConexion} onReintentar={cargar} />;

  const { request, response } = carga.detalle;
  const campos = carga.plantilla.sections.flatMap((s) => s.fields);
  const pedidos = campos.filter((c: CampoDePlantilla) => request.requestedFieldCodes.includes(c.fieldCode));
  // La pantalla nunca muestra códigos: la etiqueta sale de la plantilla (10-B04:387-393).
  const etiqueta = (codigo: string) => campos.find((c) => c.fieldCode === codigo)?.label ?? codigo;
  const esCorreccion = response !== null;

  async function enviar() {
    setAviso(null);
    // Un campo sin completar se omite: nunca viaja como cero ni como cadena vacía (09:1586-1587).
    const answers = pedidos.flatMap((c): { fieldCode: string; value: string | number | boolean }[] => {
      const crudo = (valores[c.fieldCode] ?? '').trim();
      if (crudo === '') return [];
      if (c.dataType === 'NUMBER') {
        const n = Number(crudo.replace(',', '.'));
        return Number.isFinite(n) ? [{ fieldCode: c.fieldCode, value: n }] : [];
      }
      if (c.dataType === 'BOOLEAN') return [{ fieldCode: c.fieldCode, value: /^(s|si|sí|true|1)$/i.test(crudo) }];
      return [{ fieldCode: c.fieldCode, value: crudo }];
    });
    const faltaRequerido = request.requiredFieldCodes.some((codigo) => !answers.some((a) => a.fieldCode === codigo));
    if (faltaRequerido) return setAviso({ tipo: 'error', texto: COPY_FORMULARIOS.faltaRequerido });
    if (answers.length === 0) return setAviso({ tipo: 'error', texto: COPY_FORMULARIOS.faltaRequerido });

    setEnviando(true);
    const r = esCorreccion
      ? await api.rectificarRespuestaDeFormulario(token, response.formResponseId, { expectedVersion: response.version, reason: motivo, answers }, clave.actual())
      : await api.responderSolicitudDeFormulario(token, id, { answers }, clave.actual());
    clave.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setAviso({ tipo: 'error', texto: falloDe(r).mensaje });
    setAviso({ tipo: 'exito', texto: esCorreccion ? COPY_FORMULARIOS.rectificacionEnviada : COPY_FORMULARIOS.respuestaEnviada });
    setValores({});
    setMotivo('');
    void cargar();
  }

  return (
    <View>
      <Titulo>{request.templateName}</Titulo>
      <Parrafo tenue>
        {COPY_FORMULARIOS.pedidoPor} {request.professional.displayName} · {request.purpose}
      </Parrafo>
      {aviso ? (
        <Aviso tipo={aviso.tipo}>
          <Parrafo>{aviso.texto}</Parrafo>
        </Aviso>
      ) : null}

      {response ? (
        <Seccion titulo={COPY_FORMULARIOS.respuestaOriginal}>
          <Parrafo tenue>{COPY_FORMULARIOS.rectificarConservaHistoria}</Parrafo>
          {response.original.answers.map((a) => (
            <Parrafo key={a.fieldCode}>
              {etiqueta(a.fieldCode)}: {typeof a.value === 'boolean' ? (a.value ? 'Sí' : 'No') : String(a.value)}
            </Parrafo>
          ))}
          {response.rectifications.map((c) => (
            <View key={c.rectificationId}>
              <Parrafo tenue>
                {COPY_FORMULARIOS.correccion} · {fecha(c.recordedAt)} · {c.reason}
              </Parrafo>
              {c.answers.map((a) => (
                <Parrafo key={a.fieldCode}>
                  {etiqueta(a.fieldCode)}: {typeof a.value === 'boolean' ? (a.value ? 'Sí' : 'No') : String(a.value)}
                </Parrafo>
              ))}
            </View>
          ))}
        </Seccion>
      ) : null}

      <Seccion titulo={esCorreccion ? COPY_FORMULARIOS.rectificar : COPY_FORMULARIOS.responder}>
        <Parrafo tenue>{COPY_FORMULARIOS.loQueRespondesEsTuyo}</Parrafo>
        {pedidos.map((c) => (
          <Campo
            key={c.fieldCode}
            etiqueta={`${c.label}${request.requiredFieldCodes.includes(c.fieldCode) ? '' : ` (${COPY_FORMULARIOS.opcional})`}`}
            ayuda={c.helpText ?? (c.dataType === 'BOOLEAN' ? 'Respondé «sí» o «no».' : COPY_FORMULARIOS.omitirCampo)}
            value={valores[c.fieldCode] ?? ''}
            onChangeText={(t) => setValores({ ...valores, [c.fieldCode]: t })}
            keyboardType={c.dataType === 'NUMBER' ? 'numeric' : 'default'}
          />
        ))}
        {esCorreccion ? <Campo etiqueta={COPY_FORMULARIOS.motivoDeRectificacion} value={motivo} onChangeText={setMotivo} /> : null}
        <Boton
          texto={esCorreccion ? COPY_FORMULARIOS.rectificar : COPY_FORMULARIOS.enviarRespuesta}
          onPress={() => void enviar()}
          ocupado={enviando}
          deshabilitado={enviando || (esCorreccion && motivo.trim().length === 0)}
        />
      </Seccion>
    </View>
  );
}
