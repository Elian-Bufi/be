/**
 * APK · El registro rápido de una sesión del plan: «Ya la hice» (PA-03; Dirección, 2026-11-02; DL-160 y DL-161).
 *
 * La persona registra una sesión sin hacerla en vivo, desde un toque hasta el detalle que quiera, en un recorrido de dos
 * a cinco pasos cortos, cada uno en su cuadro, con la franja «Paso 2 de 4» arriba. Las reglas de qué se manda, cuándo se
 * salta un paso y qué no se pisa están en `registro-rapido.ts`, sin React.
 *
 * - **Sin cronómetros ni corrida**: no pasa por `useAbrirOcurrencia`, que hoy arranca la corrida sola. Abre el borrador
 *   (API-TRN-15) recién al tocar «Registrar sesión», lo guarda (API-TRN-17) y lo confirma (API-TRN-18) con su
 *   Idempotency-Key: un resultado incierto se reintenta con la misma clave y no duplica. Vale también el mismo día
 *   (DL-160): la regla «hoy se entrena con los cronómetros» deja de ser la única forma.
 * - **Lo planificado de cada serie** sale de API-SER-02. Sin esa lectura no se ofrece registrar con lo planificado: los
 *   objetivos generales de «Hoy» podrían no ser los de una serie.
 * - **No pisa nada en silencio**: si el borrador ya tiene series o un resumen, o la sesión corre en este teléfono, avisa
 *   y no lo toca (el PATCH reemplaza `exercises` entero).
 * - **La barra inferior queda a la vista**: no es la sesión enfocada. Salir con algo elegido pregunta antes.
 */
import { COPY, COPY_ENTRENAMIENTO, COPY_ENTRENAMIENTO_POR_SERIE, type Ocurrencia, type Resultado, type SesionParaRegistrar } from '@be/domain';
import { Children, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { api } from '../api';
import { useCambiosSinGuardar } from '../cambios-sin-guardar';
import { useDiaDeLaApi } from '../dia-de-la-api';
import { entrenamientoLocal } from '../entrenamiento-en-curso';
import { Cargando, ErrorConReintento } from '../estados';
import { fechaLarga } from '../formato';
import { esIncierto, falloDe, useClaveDeIntento } from '../intento';
import { useAccesoRetirado, useSesionPerdida, type Ir, type Ruta, type Salida } from '../navegacion';
import {
  armarRegistro,
  borradorConDatos,
  claveDeSerie,
  diasParaElegir,
  ejerciciosConDetalle,
  elegir,
  ELECCIONES,
  escribir,
  esElUltimoPaso,
  diaFijo,
  franjaDe,
  franjasDisponibles,
  horaQueSigue,
  horasDisponibles,
  lineaDelPlan,
  lineaDeLaSerie,
  loQueVeTuProfesional,
  marcarCambio,
  marcarEjercicio,
  marcarSerie,
  NOMBRE_DEL_PASO,
  ocurrenciaDelDia,
  pasoAnterior,
  pasosDelRecorrido,
  pasoSiguiente,
  respuestasIniciales,
  seRegistraConElPlan,
  textoAntesDeRegistrar,
  textoDeHora,
  textoDelResumen,
  TEXTOS_DEL_REGISTRO_RAPIDO as T,
  type Contexto,
  type Franja,
  type LoQueMandamos,
  type Paso,
  type ResumenDelRegistroRapido,
  type Respuestas,
} from '../registro-rapido';
import { placeholdersDeLaSerie, unidadDelEjercicio, type ErroresDeFila, type FilaEscrita } from '../series-de-la-sesion';
import { Aviso, Ayuda, Boton, Campo, Casilla, estilosPorTema, Parrafo, Seccion, Segmentos, Subtitulo, Titulo } from '../ui';

/** Adónde lleva «Ya la hice» (o «La hice ese día») desde una tarjeta: la ocurrencia de esa fecha, de esa sesión. */
export function aRegistroRapido(o: Pick<Ocurrencia, 'occurrenceId' | 'date' | 'planId' | 'plannedSession'>, ocurrencia: { readonly occurrenceId: string; readonly fecha: string } = { occurrenceId: o.occurrenceId, fecha: o.date }): Ruta {
  return { nombre: 'registro-rapido', occurrenceId: ocurrencia.occurrenceId, fecha: ocurrencia.fecha, etiqueta: o.plannedSession.label, sessionId: o.plannedSession.sessionId, planId: o.planId };
}

/**
 * Dos acciones una al lado de la otra si entran en el ancho, y una debajo de la otra si no (letra grande, teléfono
 * angosto). Son los `Boton` de siempre: solo cambia cómo se ubican.
 */
export function AlLado({ children }: { children: ReactNode }) {
  return (
    <View style={estilos.alLado}>
      {Children.toArray(children).map((c, i) => (
        <View key={i} style={estilos.unoAlLado}>
          {c}
        </View>
      ))}
    </View>
  );
}

/** La franja del recorrido: «Paso 2 de 4 · Ejercicios» y un tramo por paso, lleno hasta el actual. */
function FranjaDePasos({ actual, total, nombre }: { actual: number; total: number; nombre: string }) {
  return (
    <View
      style={estilos.franja}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Paso ${actual} de ${total}: ${nombre}`}
      accessibilityValue={{ min: 1, max: total, now: actual }}
    >
      <Text style={estilos.textoDeLaFranja}>{`Paso ${actual} de ${total} · ${nombre}`}</Text>
      <View style={estilos.tramos}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[estilos.tramo, i < actual && estilos.tramoHecho]} />
        ))}
      </View>
    </View>
  );
}

type AvisoDeLaPantalla = { readonly tipo: 'error' | 'info'; readonly texto: string } | null;

/** Un rechazo de API-TRN-17 o 18, dicho para la persona (los mismos textos que «Finalizar» de la sesión enfocada). */
function textoDelRechazo(r: Resultado<unknown>): string {
  if (!r.ok && r.tipo === 'API') {
    const codigos = r.issues.map((i) => i.code);
    const otraVersion = 'A esa hora regía otra versión de tu plan. Revisá la hora de la sesión.';
    if (r.codigo === 'EXECUTION_DRAFT_NOT_READY') return codigos.includes('OCCURRED_AT_REQUIRED') ? T.faltaLaHora : codigos.includes('OCCURRED_AT_OUTSIDE_PLAN_VERSION') ? otraVersion : 'Falta registrar algo de la sesión antes de confirmar.';
    if (codigos.includes('OCCURRED_AT_OUTSIDE_PLAN_VERSION')) return otraVersion;
    if (codigos.some((c) => c.startsWith('OCCURRED_AT'))) return T.revisaLaHora;
  }
  return esIncierto(r) ? COPY.resultadoIncierto : falloDe(r).mensaje;
}

export function PantallaDeRegistroRapido({
  token,
  occurrenceId,
  fecha,
  etiqueta,
  sessionId,
  planId,
  salir,
  ir,
  volver,
  subir,
}: {
  token: string;
  occurrenceId: string;
  fecha: string;
  etiqueta: string;
  sessionId: string;
  planId: string;
  salir: (m: Salida) => void;
  ir: Ir;
  volver: () => boolean;
  subir: () => void;
}) {
  const sesionPerdida = useSesionPerdida(salir);
  const { retirado, accesoRetirado } = useAccesoRetirado();
  const hoy = useDiaDeLaApi();
  const [lectura, setLectura] = useState<Resultado<{ data: SesionParaRegistrar }> | null>(null);
  const [vuelta, setVuelta] = useState(0);
  const [r, setR] = useState<Respuestas | null>(null);
  const [paso, setPaso] = useState<Paso>('como');
  const [franja, setFranja] = useState<Franja | null>(null);
  const [aviso, setAviso] = useState<AvisoDeLaPantalla>(null);
  const [errores, setErrores] = useState<Readonly<Record<string, ErroresDeFila>>>({});
  const [ocupado, setOcupado] = useState(false);
  const [listo, setListo] = useState<{ readonly executionId: string; readonly resumen: ResumenDelRegistroRapido } | null>(null);
  // Una sesión ya registrada (por este recorrido o antes): se ofrece verla.
  const [registrada, setRegistrada] = useState<string | null>(null);
  // El borrador tiene datos que este recorrido no pisa: se ofrece ir a Entrenamiento, donde se continúa.
  const [conDatos, setConDatos] = useState(false);
  const intento = useClaveDeIntento();
  const nuestro = useRef<LoQueMandamos | null>(null);
  const enCurso = useRef(false);

  // API-SER-02: el plan de cada serie, que es lo que se registra con «lo planificado».
  useEffect(() => {
    let vigente = true;
    setLectura(null);
    void api.sesionParaRegistrar(token, occurrenceId).then((res) => {
      if (!vigente || sesionPerdida(res)) return;
      setLectura(res);
    });
    return () => {
      vigente = false;
    };
  }, [token, occurrenceId, sesionPerdida, vuelta]);

  const ctx = useMemo((): Contexto | null => (lectura?.ok ? { sesion: lectura.datos.data.session, fecha, hoy } : null), [lectura, fecha, hoy]);
  useEffect(() => {
    if (ctx && r === null) setR(respuestasIniciales(ctx));
  }, [ctx, r]);

  // Salir con algo elegido y sin registrar pregunta antes (DL-117: sin pérdidas silenciosas).
  useCambiosSinGuardar(r?.eleccion && !listo ? `el registro de «${etiqueta}»` : null);

  const irAPaso = useCallback(
    (destino: Paso, con: Respuestas) => {
      if (!ctx) return;
      const pasos = pasosDelRecorrido(ctx, con);
      setPaso(destino);
      subir();
      AccessibilityInfo.announceForAccessibility(`Paso ${pasos.indexOf(destino) + 1} de ${pasos.length}: ${NOMBRE_DEL_PASO[destino]}`);
    },
    [ctx, subir],
  );

  if (retirado) return <Aviso tipo="info" titulo={COPY_ENTRENAMIENTO.planNoDisponible} />;
  if (!lectura) return <Cargando forma="lista" />;
  if (!lectura.ok) return <ErrorConReintento mensaje={T.sinPlanDeLaSerie} sinConexion={lectura.tipo === 'RED'} onReintentar={() => setVuelta((v) => v + 1)} />;
  if (!ctx || !r) return <Cargando forma="lista" />;

  const pasos = pasosDelRecorrido(ctx, r);
  const numeroDelPaso = Math.max(1, pasos.indexOf(paso) + 1);
  const ahora = new Date();

  function cambiar(nuevas: Respuestas) {
    setR(nuevas);
    setAviso(null);
  }

  /** «Seguir»: revisa lo del paso y pasa al siguiente. Los errores del detalle se ven en su serie. */
  function seguir(con: Respuestas = r!) {
    if (!ctx) return;
    setAviso(null);
    if (paso === 'ejercicios' || paso === 'detalle') {
      const armado = armarRegistro(ctx, con, ahora);
      if (!armado.ok && armado.paso === paso) {
        setErrores(armado.errores ?? {});
        return setAviso({ tipo: 'error', texto: armado.motivo });
      }
    }
    setErrores({});
    irAPaso(pasoSiguiente(ctx, con, paso), con);
  }

  async function registrar() {
    if (!ctx || !r || enCurso.current) return;
    const armado = armarRegistro(ctx, r, new Date());
    if (!armado.ok) {
      setErrores(armado.errores ?? {});
      setAviso({ tipo: 'error', texto: armado.motivo });
      if (armado.paso !== paso) irAPaso(armado.paso, r);
      return;
    }
    enCurso.current = true;
    setOcupado(true);
    setAviso(null);
    setErrores({});
    setRegistrada(null);
    setConDatos(false);
    try {
      // Otro día, desde una sesión de hoy: la ocurrencia de esa fecha, de la misma sesión y la misma versión del plan.
      let ocurrencia = occurrenceId;
      if (r.dia !== fecha) {
        const res = await api.ocurrenciasDeEntrenamiento(token, { periodStart: r.dia, periodEnd: r.dia });
        if (sesionPerdida(res)) return;
        if (!res.ok) return setAviso({ tipo: 'error', texto: falloDe(res).mensaje });
        const elegida = ocurrenciaDelDia(res.datos.data.occurrences, sessionId, planId);
        if (!elegida.ok) return setAviso({ tipo: 'error', texto: elegida.motivo });
        if (elegida.executionId) {
          setRegistrada(elegida.executionId);
          return setAviso({ tipo: 'info', texto: T.yaEstabaRegistrada });
        }
        ocurrencia = elegida.occurrenceId;
      }
      // Lo que corre en este teléfono no se pisa: puede tener series sin enviar.
      if (entrenamientoLocal.sesiones().some((s) => s.occurrenceId === ocurrencia)) {
        setConDatos(true);
        return setAviso({ tipo: 'error', texto: T.enCursoEnElTelefono });
      }
      const b = await api.abrirBorradorDeEjecucion(token, ocurrencia);
      if (sesionPerdida(b)) return;
      if (!b.ok) {
        // Abrir el borrador es una escritura: con el 404 no revelador se retira el contenido (B10-06:1145-1148).
        if (accesoRetirado(b)) return;
        if (b.tipo === 'API' && b.codigo === 'ACTIVE_PLAN_REQUIRED') return setAviso({ tipo: 'error', texto: 'Tu plan ya no está vigente. Volvé a Entrenamiento y actualizá la pantalla.' });
        if (b.tipo === 'API' && b.codigo === 'OCCURRENCE_NOT_EXECUTABLE') return setAviso({ tipo: 'error', texto: 'Esa sesión no se puede registrar para esa fecha.' });
        return setAviso({ tipo: 'error', texto: falloDe(b).mensaje });
      }
      const borrador = b.datos.data;
      if (borrador.state === 'REGISTERED' && borrador.executionId) {
        // Una confirmación anterior de este mismo recorrido quedó sin respuesta, y había llegado: es la nuestra.
        if (nuestro.current?.draftId === borrador.draftId) return terminar(borrador.executionId, armado.resumen);
        setRegistrada(borrador.executionId);
        return setAviso({ tipo: 'info', texto: T.yaEstabaRegistrada });
      }
      if (borradorConDatos(borrador, nuestro.current)) {
        setConDatos(true);
        return setAviso({ tipo: 'error', texto: T.conDatosCargados });
      }
      const cuerpo = JSON.stringify(armado.changes);
      let version = borrador.version;
      const yaGuardado = nuestro.current?.draftId === borrador.draftId && nuestro.current.version === borrador.version && nuestro.current.cuerpo === cuerpo;
      if (!yaGuardado) {
        // Otras respuestas son otro intento: la clave de una confirmación anterior no se reusa con otro contenido.
        if (nuestro.current) intento.descartar();
        const g = await api.guardarBorradorDeEjecucion(token, borrador.draftId, { expectedVersion: borrador.version, changes: armado.changes });
        if (sesionPerdida(g)) return;
        if (!g.ok) {
          if (accesoRetirado(g)) return;
          return setAviso({ tipo: 'error', texto: textoDelRechazo(g) });
        }
        version = g.datos.data.version;
        nuestro.current = { draftId: borrador.draftId, version, cuerpo };
      }
      const c = await api.confirmarEjecucion(token, borrador.draftId, version, intento.actual());
      intento.registrar(c);
      if (sesionPerdida(c)) return;
      if (!c.ok) {
        if (accesoRetirado(c)) return;
        if (c.tipo === 'API' && c.codigo === 'EXECUTION_ALREADY_REGISTERED') {
          setConDatos(true);
          return setAviso({ tipo: 'info', texto: T.yaEstabaRegistrada });
        }
        return setAviso({ tipo: 'error', texto: textoDelRechazo(c) });
      }
      terminar(c.datos.data.executionId, armado.resumen);
    } finally {
      enCurso.current = false;
      setOcupado(false);
    }
  }

  function terminar(executionId: string, resumen: ResumenDelRegistroRapido) {
    setListo({ executionId, resumen });
    setPaso('listo');
    subir();
    AccessibilityInfo.announceForAccessibility(`${COPY_ENTRENAMIENTO.sesionRegistrada}. ${textoDelResumen(resumen)}`);
  }

  const diaElegido = r.dia;
  const armado = armarRegistro(ctx, r, ahora);
  const ultimo = esElUltimoPaso(ctx, r, paso);

  // Con «todo», hoy, la nota y el horario no son un paso: quedan a un toque desde el último.
  const puedePedirNota = ultimo && !pasos.includes('cuando');

  /** Lo de abajo de cada paso: seguir o registrar, y volver al paso anterior. */
  const acciones = () => (
    <>
      {aviso ? <Aviso tipo={aviso.tipo} titulo={aviso.texto} /> : null}
      {registrada ? <Boton texto={T.verElRegistro} tipo="secundario" onPress={() => ir({ nombre: 'ejecucion-de-entrenamiento', id: registrada }, 'reemplazar')} /> : null}
      {conDatos ? <Boton texto={T.irAEntrenamiento} tipo="secundario" onPress={() => ir({ nombre: 'entrenamiento' })} /> : null}
      {ultimo ? (
        <>
          {armado.ok ? <Parrafo>{textoAntesDeRegistrar(armado.resumen)}</Parrafo> : null}
          <Parrafo tenue>{COPY_ENTRENAMIENTO.confirmarEsDefinitivo}</Parrafo>
          <Boton texto={ocupado ? T.registrando : T.registrar} onPress={() => void registrar()} ocupado={ocupado} />
        </>
      ) : (
        <Boton texto={T.seguir} onPress={() => seguir()} deshabilitado={ocupado} />
      )}
      {puedePedirNota ? (
        <Boton
          texto={T.agregarNota}
          tipo="secundario"
          onPress={() => {
            const nuevas = { ...r, pidioNota: true };
            cambiar(nuevas);
            seguir(nuevas);
          }}
          deshabilitado={ocupado}
        />
      ) : null}
      <Boton texto={T.pasoAnterior} tipo="enlace" onPress={() => irAPaso(pasoAnterior(ctx, r, paso), r)} deshabilitado={ocupado} />
    </>
  );

  let contenido: ReactNode;
  if (paso === 'listo' && listo) {
    contenido = (
      <Seccion titulo={COPY_ENTRENAMIENTO.sesionRegistrada}>
        <Parrafo>{textoDelResumen(listo.resumen)}</Parrafo>
        <Parrafo tenue>{loQueVeTuProfesional(listo.resumen)}</Parrafo>
        <Boton texto={T.verElRegistro} onPress={() => ir({ nombre: 'ejecucion-de-entrenamiento', id: listo.executionId }, 'reemplazar')} />
        <Boton texto={T.volver} tipo="secundario" onPress={() => void volver()} />
      </Seccion>
    );
  } else if (paso === 'como') {
    contenido = (
      <Seccion titulo={T.como(etiqueta)}>
        {ELECCIONES.map((e) => (
          <Boton
            key={e.valor}
            texto={e.texto}
            tipo={r.eleccion === e.valor ? 'primario' : 'secundario'}
            seleccionado={r.eleccion === e.valor}
            onPress={() => {
              const nuevas = elegir(ctx, r, e.valor);
              cambiar(nuevas);
              setErrores({});
              irAPaso(pasoSiguiente(ctx, nuevas, 'como'), nuevas);
            }}
          />
        ))}
      </Seccion>
    );
  } else if (paso === 'ejercicios') {
    const ayuda = r.eleccion === 'todo' ? T.ayudaDeEjerciciosTodo : r.eleccion === 'parte' ? T.ayudaDeEjerciciosParte : T.ayudaDeEjerciciosDistinto;
    contenido = (
      <>
        <Seccion titulo={T.queEjercicios}>
          <Parrafo tenue>{ayuda}</Parrafo>
          {ctx.sesion.prescriptions.map((p) => {
            const e = r.ejercicios[p.prescriptionId];
            if (!e) return null;
            return (
              <Casilla key={p.prescriptionId} marcada={e.hecho} onCambio={(v) => cambiar(marcarEjercicio(r, p.prescriptionId, v))} titulo={p.exerciseName} texto={lineaDelPlan(p)}>
                {e.hecho ? (
                  seRegistraConElPlan(p) ? (
                    <Casilla marcada={e.cambio} onCambio={(v) => cambiar(marcarCambio(r, p.prescriptionId, v))} titulo={T.cambieAlgo} texto={T.cambieAlgoDetalle} />
                  ) : (
                    <Parrafo tenue>{T.anotarEnElPasoSiguiente}</Parrafo>
                  )
                ) : null}
              </Casilla>
            );
          })}
        </Seccion>
        {acciones()}
      </>
    );
  } else if (paso === 'detalle') {
    contenido = (
      <>
        <Seccion titulo={T.queCambio}>
          <Parrafo tenue>{T.ayudaDelDetalle}</Parrafo>
          <Ayuda titulo={T.comoSeRegistra}>
            <Parrafo>{T.explicacionDelDetalle}</Parrafo>
          </Ayuda>
          {ejerciciosConDetalle(ctx, r).map((p) => {
            const e = r.ejercicios[p.prescriptionId]!;
            const unidad = unidadDelEjercicio(p);
            return (
              <View key={p.prescriptionId}>
                <Subtitulo>{p.exerciseName}</Subtitulo>
                {!seRegistraConElPlan(p) ? <Parrafo tenue>{COPY_ENTRENAMIENTO_POR_SERIE.faltaUnDato}</Parrafo> : null}
                {p.sets.map((s) => {
                  const serie = e.series[s.setIndex];
                  if (!serie) return null;
                  const error = errores[claveDeSerie(p.prescriptionId, s.setIndex)];
                  const gris = placeholdersDeLaSerie(s.target, unidad);
                  // El rótulo visible es corto, como las columnas de la sesión; el lector de pantalla dice el campo entero.
                  const campo = (que: keyof FilaEscrita, visible: string, accesible: string, teclado: 'decimal-pad' | 'number-pad', enGris: string) => {
                    const mensaje = error?.[que];
                    return (
                      <View style={estilos.celda}>
                        <Campo
                          etiqueta={visible}
                          value={serie.escrita[que]}
                          placeholder={enGris}
                          error={mensaje}
                          keyboardType={teclado}
                          maxLength={20}
                          accessibilityLabel={mensaje ? `${accesible}. Revisá este campo: ${mensaje}` : accesible}
                          onChangeText={(v) => cambiar(escribir(r, p.prescriptionId, s.setIndex, que, v))}
                        />
                      </View>
                    );
                  };
                  return (
                    <Casilla
                      key={s.setIndex}
                      marcada={serie.hecha}
                      onCambio={(v) => cambiar(marcarSerie(r, p.prescriptionId, s.setIndex, v))}
                      titulo={T.serie(s.setIndex)}
                      texto={lineaDeLaSerie(s)}
                      error={error?.fila}
                    >
                      {serie.hecha ? (
                        <View style={estilos.celdas}>
                          {campo('carga', unidad, `Carga en ${unidad} de la serie ${s.setIndex}`, 'decimal-pad', gris.carga)}
                          {campo('repeticiones', COPY_ENTRENAMIENTO_POR_SERIE.columnaRepeticiones, `Repeticiones de la serie ${s.setIndex}`, 'number-pad', gris.repeticiones)}
                          {campo('rir', COPY_ENTRENAMIENTO_POR_SERIE.columnaRir, `RIR de la serie ${s.setIndex}, opcional`, 'decimal-pad', gris.rir)}
                        </View>
                      ) : null}
                    </Casilla>
                  );
                })}
              </View>
            );
          })}
        </Seccion>
        {acciones()}
      </>
    );
  } else {
    // «Nota y horario»: todo se toca, nada se escribe salvo la nota.
    const dias = diasParaElegir(ctx);
    const esHoy = diaElegido === hoy;
    const franjas = franjasDisponibles(diaElegido, ahora);
    const franjaElegida = franja ?? franjaDe(r.hora);
    const opcionesDeFranja = [...(esHoy ? [{ valor: 'recien', texto: T.recien }] : []), ...franjas.map((f) => ({ valor: f.valor as string, texto: f.texto }))];
    const horas = franjaElegida ? horasDisponibles(franjaElegida, diaElegido, ahora) : [];
    const fijo = diaFijo(ctx);
    const nota = <Campo etiqueta={T.nota} ayuda={T.ayudaDeLaNota} value={r.nota} onChangeText={(v) => cambiar({ ...r, nota: v })} multiline maxLength={1000} />;
    contenido = (
      <>
        {/* Con el día fijo (una pendiente, otro día), la hora es obligatoria y va primero; hoy, primero la nota. */}
        <Seccion titulo={fijo ? T.cuando : T.algoMas}>
          {fijo ? null : nota}
          {fijo ? <Parrafo>{fechaLarga(diaElegido)}</Parrafo> : <Subtitulo>{T.cuando}</Subtitulo>}
          {dias.length > 0 ? (
            <Segmentos
              etiqueta={T.cuando}
              opciones={dias}
              valor={diaElegido}
              compactos
              alElegir={(dia) => {
                // Una hora que ese día todavía no llegó se suelta: la API no acepta una hora futura.
                const hora = horaQueSigue(r.hora, dia, ahora);
                cambiar({ ...r, dia, hora });
                if (hora === null) setFranja(null);
              }}
            />
          ) : null}
          <Text style={estilos.etiqueta}>{esHoy ? T.aQueHoraOpcional : T.aQueHora}</Text>
          <Segmentos
            etiqueta={esHoy ? T.aQueHoraOpcional : T.aQueHora}
            opciones={opcionesDeFranja}
            valor={franjaElegida ?? (esHoy && r.hora === null ? 'recien' : '')}
            alElegir={(v) => {
              if (v === 'recien') {
                setFranja(null);
                return cambiar({ ...r, hora: null });
              }
              setFranja(v as Franja);
              if (franjaDe(r.hora) !== v) cambiar({ ...r, hora: null });
            }}
          />
          {horas.length > 0 ? (
            <Segmentos
              etiqueta={`Horas de la ${opcionesDeFranja.find((o) => o.valor === franjaElegida)?.texto.toLocaleLowerCase('es-AR') ?? ''}`}
              opciones={horas.map((h) => ({ valor: String(h), texto: textoDeHora(h) }))}
              valor={r.hora === null ? '' : String(r.hora)}
              compactos
              alElegir={(h) => cambiar({ ...r, hora: Number(h) })}
            />
          ) : null}
          {esHoy && r.hora === null ? <Parrafo tenue>{T.sinHoraHoy}</Parrafo> : null}
          {fijo ? nota : null}
        </Seccion>
        {acciones()}
      </>
    );
  }

  return (
    <View>
      <Titulo>{etiqueta}</Titulo>
      <Parrafo tenue>{diaElegido === hoy ? `${T.hoy} · ${fechaLarga(diaElegido)}` : fechaLarga(diaElegido)}</Parrafo>
      <FranjaDePasos actual={numeroDelPaso} total={pasos.length} nombre={NOMBRE_DEL_PASO[paso]} />
      {paso === 'como' && aviso ? <Aviso tipo={aviso.tipo} titulo={aviso.texto} /> : null}
      {contenido}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  alLado: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10 },
  unoAlLado: { flexGrow: 1, flexBasis: 'auto' },
  franja: { marginTop: 4, marginBottom: 6 },
  textoDeLaFranja: { fontSize: 14, fontWeight: '700', color: COLOR.tenue, marginBottom: 6 },
  tramos: { flexDirection: 'row', gap: 4 },
  // El tramo pendiente lleva el borde de los controles: el de las tarjetas casi no se ve sobre el fondo claro.
  tramo: { flex: 1, height: 6, borderRadius: 3, backgroundColor: COLOR.bordeControl },
  tramoHecho: { backgroundColor: COLOR.acento },
  celdas: { flexDirection: 'row', gap: 8, marginTop: 4 },
  celda: { flex: 1 },
  etiqueta: { fontSize: 16, fontWeight: '600', color: COLOR.texto, marginTop: 8 },
}));
