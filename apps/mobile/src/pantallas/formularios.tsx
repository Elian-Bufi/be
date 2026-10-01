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
import {
  LARGO_MAXIMO_DE_TEXTO_DE_RESPUESTA,
  LARGO_MAXIMO_DEL_MOTIVO_DE_RECTIFICACION,
  COPY,
  COPY_FORMULARIOS,
  desenlaceDeEnvio,
  estadoInicialDeFormulario,
  habilitacion,
  leerNumero,
  motivoDeNumeroIlegible,
  numero,
  reducirFormulario,
  respondibleDe,
  sePuedeEnviar,
  valorDeEleccionSiONo,
  type Accion,
  type CampoDePlantilla,
  type Intencion,
  type Resultado,
  type RespuestaDeFormulario,
  type SolicitudDeFormulario,
  type SolicitudPropia,
  type VersionDePlantilla,
} from '@be/domain';
import { useCallback, useEffect, useReducer, useState } from 'react';
import { View } from 'react-native';
import { api } from '../api';
import { Cargando, ErrorConReintento } from '../estados';
import { fecha } from '../formato';
import { falloDe, useClaveDeIntento } from '../intento';
import { useSesionPerdida, type Salida } from '../navegacion';
import { Aviso, Boton, Campo, CampoSiONo, Insignia, Parrafo, Seccion, Tarjeta, Titulo } from '../ui';

type Carga = { tipo: 'cargando' } | { tipo: 'listo'; datos: readonly SolicitudPropia[] } | { tipo: 'error'; sinConexion: boolean };

/** Lo respondido, escrito como lo lee una persona: «Sí»/«No», y los números con la coma del país (DL-091 punto 4). */
const valorRespondido = (v: string | number | boolean): string =>
  typeof v === 'boolean' ? (v ? COPY_FORMULARIOS.si : COPY_FORMULARIOS.no) : typeof v === 'number' ? numero(v) : v;

/** Las dos únicas respuestas posibles de un campo Sí/No; no elegir ninguna es el tercer estado y no es una opción de esta lista. */
const OPCIONES_SI_O_NO = [
  { valor: 'SI', texto: COPY_FORMULARIOS.si },
  { valor: 'NO', texto: COPY_FORMULARIOS.no },
] as const;

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

/**
 * Una solicitud propia: responder, corregir o solo ver. El estado vive en `reducirFormulario` (dominio,
 * `recuperacion-de-formulario.ts`), la misma lógica que prueban `recuperacion-de-formulario.test.ts`:
 * - qué se puede hacer sale del contrato: FRM-05 (solicitud y respuesta) más `respondable` de FRM-06, que decide el PDP.
 *   `response: null` no quiere decir bloqueada;
 * - la carga y su reintento son una sola operación con intención («abrir» o «recuperar»);
 * - el borrador (lo escrito y el motivo) solo se limpia cuando un envío se registra, y cargar nunca reenvía.
 */
export function PantallaDeMiSolicitud({ token, id, salir, volver }: { token: string; id: string; salir: (m: Salida) => void; volver: () => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const [estado, despachar] = useReducer(reducirFormulario, estadoInicialDeFormulario);
  const [datos, setDatos] = useState<{ detalle: Detalle; plantilla: VersionDePlantilla } | null>(null);
  /** Avisos por campo: un número escrito que no se entiende se marca ahí, no se descarta en silencio (B10-10:164-165). */
  const [errores, setErrores] = useState<Record<string, string>>({});
  /** Cada envío vuelve a montar el aviso, así se anuncia aunque el texto sea el mismo que en el intento anterior. */
  const [envios, setEnvios] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const clave = useClaveDeIntento();

  /**
   * Lee la solicitud (FRM-05), si hace falta `respondable` (FRM-06) y la plantilla (FRM-02). Una sola función para abrir,
   * recuperar y reintentar: el resultado lo interpreta el reductor según la intención. Leer no toca la clave de
   * idempotencia ni el borrador.
   */
  const cargar = useCallback(
    async (intencion: Intencion) => {
      despachar({ tipo: 'cargar', intencion });
      const fallar = (r: Resultado<unknown>) => despachar({ tipo: 'carga-fallida', sinConexion: !r.ok && r.tipo === 'RED' });
      const r = await api.consultarSolicitudDeFormulario(token, id);
      if (sesionPerdida(r)) return;
      if (!r.ok) return fallar(r);
      const { request, response } = r.datos.data;
      // Sin respuesta, lo que decide si se puede responder es `respondable` (FRM-06): una pendiente válida también tiene
      // `response: null`. Con respuesta no hace falta: corregir no depende del PDP (09:1633).
      let respondable = false;
      if (!response && request.status === 'PENDING') {
        const p = await respondibleDe(id, (cursor) => api.misSolicitudesDeFormulario(token, { status: 'PENDING', limit: '50', ...(cursor ? { cursor } : {}) }));
        if (sesionPerdida(p)) return;
        if (!p.ok) return fallar(p);
        respondable = p.datos;
      }
      const v = await api.consultarVersionDePlantilla(token, request.templateId, request.templateVersionId);
      if (sesionPerdida(v)) return;
      if (!v.ok) return fallar(v);
      setDatos({ detalle: r.datos.data, plantilla: v.datos.data });
      despachar({ tipo: 'carga-lista', vista: { status: request.status, response, respondable } });
    },
    [token, id, sesionPerdida],
  );

  useEffect(() => {
    void cargar('abrir');
  }, [cargar]);

  if (estado.carga.tipo === 'error') {
    // El reintento conserva la intención: si era recuperar lo guardado, sigue siéndolo y termina con el mismo aviso.
    const intencion = estado.carga.intencion;
    return <ErrorConReintento sinConexion={estado.carga.sinConexion} onReintentar={() => void cargar(intencion)} />;
  }
  if (estado.carga.tipo === 'cargando' || !datos) return <Cargando />;

  const { request, response } = datos.detalle;
  const vista = estado.carga.vista;
  const puede = habilitacion(vista);
  const { valores, motivo } = estado.borrador;
  const campos = datos.plantilla.sections.flatMap((s) => s.fields);
  const pedidos = campos.filter((c: CampoDePlantilla) => request.requestedFieldCodes.includes(c.fieldCode));
  // La pantalla nunca muestra códigos: la etiqueta sale de la plantilla (10-B04:387-393).
  const etiqueta = (codigo: string) => campos.find((c) => c.fieldCode === codigo)?.label ?? codigo;
  const esCorreccion = response !== null;
  const problema = estado.problema;
  // Si se abrió una solicitud que no admite acción y no hay otro problema a la vista, se dice por qué, con salidas.
  const sinAccion =
    !problema && puede.modo === 'sin-accion' ? (puede.motivo === 'no-admite-respuesta' ? COPY_FORMULARIOS.yaNoSePuedeResponder : COPY_FORMULARIOS.noSePuedeCorregirYa) : null;

  async function enviar() {
    setEnvios((n) => n + 1);
    // Lo que se escribió en un campo numérico y no es un número no se omite como si estuviera vacío: la persona lo
    // completó, y perderlo sin avisar haría que un requerido parezca faltante o que un opcional desaparezca.
    const ilegibles = Object.fromEntries(
      pedidos
        .filter((c) => c.dataType === 'NUMBER')
        .map((c) => [c.fieldCode, (valores[c.fieldCode] ?? '').trim()] as const)
        .filter(([, crudo]) => crudo !== '' && leerNumero(crudo) === null)
        .map(([codigo, crudo]) => [codigo, motivoDeNumeroIlegible(crudo)]),
    );
    setErrores(ilegibles);
    if (Object.keys(ilegibles).length > 0) return despachar({ tipo: 'problema-local', titulo: COPY_FORMULARIOS.numeroIlegible });
    // Un campo sin completar se omite: nunca viaja como cero ni como cadena vacía (09:1586-1587).
    const answers = pedidos.flatMap((c): { fieldCode: string; value: string | number | boolean }[] => {
      const crudo = (valores[c.fieldCode] ?? '').trim();
      if (crudo === '') return [];
      if (c.dataType === 'NUMBER') {
        // Coma o punto, como la persona lo escriba (DL-091 punto 4). Lo ilegible ya se señaló arriba.
        const n = leerNumero(crudo);
        return n === null ? [] : [{ fieldCode: c.fieldCode, value: n }];
      }
      if (c.dataType === 'BOOLEAN') {
        // Lo que llega acá ya es una elección, no algo escrito: si no eligió, el campo se omite (09:1586-1587).
        const elegido = valorDeEleccionSiONo(crudo);
        return elegido === null ? [] : [{ fieldCode: c.fieldCode, value: elegido }];
      }
      return [{ fieldCode: c.fieldCode, value: crudo }];
    });
    const faltaRequerido = request.requiredFieldCodes.some((codigo) => !answers.some((a) => a.fieldCode === codigo));
    if (faltaRequerido || answers.length === 0) return despachar({ tipo: 'problema-local', titulo: COPY_FORMULARIOS.faltaRequerido });

    despachar({ tipo: 'enviando' });
    setEnviando(true);
    const r = esCorreccion
      ? await api.rectificarRespuestaDeFormulario(token, response.formResponseId, { expectedVersion: response.version, reason: motivo, answers }, clave.actual())
      : await api.responderSolicitudDeFormulario(token, id, { answers }, clave.actual());
    clave.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) {
      // DL-104 (por campo o dato no aceptado), ya no se puede, versión vieja o envío anterior guardado: el reductor lo
      // traduce y, en los tres últimos, suspende el envío hasta volver a leer. Lo escrito queda y no se reenvía solo.
      const desenlace = desenlaceDeEnvio(r, pedidos, { esCorreccion });
      if (desenlace) {
        if (desenlace.tipo === 'por-campo') setErrores(desenlace.errores);
        return despachar({ tipo: 'rechazado', desenlace });
      }
      // Red, servicio o no disponible: `falloDe`. Si el resultado es incierto, se reintenta con la misma clave.
      const fallo = falloDe(r);
      return despachar({ tipo: 'fallo', titulo: fallo.mensaje, incierto: fallo.tipo === 'incierto' });
    }
    despachar({ tipo: 'enviado', texto: esCorreccion ? COPY_FORMULARIOS.rectificacionEnviada : COPY_FORMULARIOS.respuestaEnviada });
    void cargar('abrir');
  }

  const acciones = (lista: readonly Accion[]) => (
    <>
      {lista.includes('recuperar') ? (
        <Boton texto={esCorreccion || puede.modo !== 'sin-accion' ? COPY_FORMULARIOS.cargarLoGuardado : COPY_FORMULARIOS.actualizarEstado} tipo="secundario" onPress={() => void cargar('recuperar')} />
      ) : null}
      {lista.includes('volver') ? <Boton texto={COPY_FORMULARIOS.volverAMisSolicitudes} tipo="enlace" onPress={volver} /> : null}
    </>
  );

  return (
    <View>
      <Titulo>{request.templateName}</Titulo>
      <Parrafo tenue>
        {COPY_FORMULARIOS.pedidoPor} {request.professional.displayName} · {request.purpose}
      </Parrafo>
      {estado.aviso ? (
        <Aviso tipo={estado.aviso.tipo}>
          <Parrafo>{estado.aviso.texto}</Parrafo>
        </Aviso>
      ) : null}

      {response ? (
        <Seccion titulo={COPY_FORMULARIOS.respuestaOriginal}>
          <Parrafo tenue>{COPY_FORMULARIOS.rectificarConservaHistoria}</Parrafo>
          {response.effectiveView.kind === 'ORIGINAL' ? <Insignia texto={COPY_FORMULARIOS.vigente} positiva /> : null}
          {response.original.answers.map((a) => (
            <Parrafo key={a.fieldCode}>
              {etiqueta(a.fieldCode)}: {valorRespondido(a.value)}
            </Parrafo>
          ))}
          {response.rectifications.map((c) => (
            <View key={c.rectificationId}>
              <Parrafo tenue>
                {COPY_FORMULARIOS.correccion} · {fecha(c.recordedAt)} · {c.reason}
              </Parrafo>
              {response.effectiveView.kind === 'RECTIFIED' && response.effectiveView.rectificationId === c.rectificationId ? (
                <Insignia texto={COPY_FORMULARIOS.vigente} positiva />
              ) : null}
              {c.answers.map((a) => (
                <Parrafo key={a.fieldCode}>
                  {etiqueta(a.fieldCode)}: {valorRespondido(a.value)}
                </Parrafo>
              ))}
            </View>
          ))}
        </Seccion>
      ) : null}

      <Seccion titulo={esCorreccion ? COPY_FORMULARIOS.rectificar : COPY_FORMULARIOS.responder}>
        <Parrafo tenue>{COPY_FORMULARIOS.loQueRespondesEsTuyo}</Parrafo>
        {estado.borradorSinEnviar ? <Parrafo>{COPY_FORMULARIOS.borradorSinEnviar}</Parrafo> : null}
        {pedidos.map((c) => {
          const rotulo = `${c.label}${request.requiredFieldCodes.includes(c.fieldCode) ? '' : ` (${COPY_FORMULARIOS.opcional})`}`;
          // Sí/No se elige entre dos opciones: escribirlo obligaría a interpretar el texto, y lo mal interpretado
          // quedaría guardado como declarado por la persona (09 §22.7).
          return c.dataType === 'BOOLEAN' ? (
            <CampoSiONo
              key={c.fieldCode}
              etiqueta={rotulo}
              ayuda={c.helpText ?? COPY_FORMULARIOS.elegiSiONo}
              opciones={OPCIONES_SI_O_NO}
              valor={valores[c.fieldCode] ?? ''}
              onCambio={(v) => despachar({ tipo: 'editar-valor', fieldCode: c.fieldCode, valor: v })}
              pista={COPY_FORMULARIOS.volverASinResponder}
            />
          ) : (
            <Campo
              key={c.fieldCode}
              etiqueta={rotulo}
              ayuda={c.helpText ?? COPY_FORMULARIOS.omitirCampo}
              value={valores[c.fieldCode] ?? ''}
              error={errores[c.fieldCode] ?? null}
              onChangeText={(t) => {
                despachar({ tipo: 'editar-valor', fieldCode: c.fieldCode, valor: t });
                if (errores[c.fieldCode]) setErrores(({ [c.fieldCode]: _, ...resto }) => resto);
              }}
              // El teclado decimal de Android puede ofrecer coma: por eso el valor se lee con `leerNumero`.
              keyboardType={c.dataType === 'NUMBER' ? 'decimal-pad' : 'default'}
              // WP-07 §9.3: el texto tiene longitud acotada; el campo no deja pasarse (la API igual lo controla).
              {...(c.dataType === 'TEXT' ? { maxLength: LARGO_MAXIMO_DE_TEXTO_DE_RESPUESTA } : {})}
            />
          );
        })}
        {esCorreccion ? <Campo etiqueta={COPY_FORMULARIOS.motivoDeRectificacion} value={motivo} maxLength={LARGO_MAXIMO_DEL_MOTIVO_DE_RECTIFICACION} onChangeText={(m) => despachar({ tipo: 'editar-motivo', motivo: m })} /> : null}
        {problema ? (
          <Aviso key={envios} tipo="error" titulo={problema.titulo}>
            {problema.lineas.map((l) => (
              <Parrafo key={l}>{l}</Parrafo>
            ))}
            {acciones(problema.acciones)}
          </Aviso>
        ) : null}
        {sinAccion ? (
          <Aviso tipo="info" titulo={sinAccion}>
            {acciones(['recuperar', 'volver'])}
          </Aviso>
        ) : null}
        <Boton
          texto={problema?.incierto ? COPY.reintentar : esCorreccion ? COPY_FORMULARIOS.rectificar : COPY_FORMULARIOS.enviarRespuesta}
          onPress={() => void enviar()}
          ocupado={enviando}
          // Solo se envía si la solicitud lo admite y ningún rechazo conocido lo suspendió (`sePuedeEnviar`).
          deshabilitado={enviando || !sePuedeEnviar(estado) || (esCorreccion && motivo.trim().length === 0)}
        />
      </Seccion>
    </View>
  );
}
