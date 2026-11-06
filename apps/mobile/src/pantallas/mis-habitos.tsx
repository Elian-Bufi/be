/**
 * APK · «Mis hábitos» (DL-165 D-9; WP-FORMULARIOS-RONDA-2, FR-10 §4): lo que la persona contó de su sueño, su día, su
 * actividad y su semana, con su historia, y la autorización «Compartir mis hábitos con mis profesionales». Lee API-HBT-01
 * y escribe por API-HBT-02 (una versión nueva), 03 (compartir o cambiar con quiénes) y 04 (dejar de compartir).
 *
 * Lo que la pantalla sostiene:
 * - **los hábitos son de la persona:** lo vigente queda «como declarado por vos», y cambiarlo agrega una versión: lo
 *   anterior queda en su historia, que ve solo ella;
 * - **nadie los ve sin que ella lo decida:** sin la autorización, cada profesional ve solo lo de su formulario. Al
 *   compartir, se lee el texto entero (no se pliega lo que se acepta) y vienen marcados sus profesionales con el vínculo
 *   aceptado; ampliar la lista pide aceptar de nuevo (08 C-12), sacar a alguien no;
 * - **un profesional nuevo no los recibe solo:** la pantalla pregunta por él, y sin respuesta sigue sin verlos;
 * - **dejar de compartir siempre se puede**, con confirmación en la app, y no borra nada;
 * - **un profesional puede pedir verlos** (ronda 2.1, D-17 nueva; API-HBT-08 y 09): el pedido va arriba, con quién pide,
 *   para qué le sirve y que es su decisión, y dos respuestas del mismo peso. «Sí, que los vea» suma a quien pidió, con el
 *   texto a la vista (amplía la lista); «No, por ahora» no cambia nada. Siempre puede cambiar de idea en «Quiénes los ven».
 * Las decisiones están en `habitos-en-el-telefono.ts`, con sus pruebas.
 */
import {
  COPY,
  COPY_FORMULARIOS,
  COPY_HABITOS,
  SOLICITUD_DE_MIS_HABITOS,
  seOfreceQuitarRespuesta,
  topeDesdeLaTabla,
  type CompartirHabitosRequest,
  type ProfesionalParaHabitos,
  type Resultado,
} from '@be/domain';
import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { api } from '../api';
import { useCambiosSinGuardar } from '../cambios-sin-guardar';
import { DialogoDeConfirmacion, useAccionConfirmada } from '../dialogo';
import { Cargando, ErrorConReintento, SinActualizar } from '../estados';
import { dia } from '../formato';
import { armarRespuestas, BORRADOR_VACIO, borradorDeRespuestas, camposQueSeVen, mismoBorrador, problemasAntesDeEnviar, rechazoV2, reducirBorrador, tieneAlgo, valorDe, type Borrador, type EventoDeBorrador } from '../formulario-v2';
import {
  aQuienesPreguntarSinPedido,
  areasEnPalabras,
  elSiPideElTexto,
  exitoDeLaRespuesta,
  paraQueLeSirven,
  pedidosEnOrden,
  rechazoDeLaRespuesta,
  respuestaAlPedido,
  seAvisaQueSoloElLosVe,
  estadoEnPalabras,
  exitoDeCompartir,
  habitosEnPalabras,
  marcadosAlCambiar,
  marcadosAlCompartir,
  ofrecidosAlCompartir,
  pedidoDeCompartir,
  pedidoEnviable,
  pideElTexto,
  quienesLosReciben,
  rechazoDeCompartir,
  type ActoDeCompartir,
  type MisHabitos,
  type PedidoDeAcceso,
  type RespuestaAUnPedido,
} from '../habitos-en-el-telefono';
import { falloDe, useClaveDeIntento, type Fallo } from '../intento';
import { useLecturaRecordada } from '../lecturas';
import { useSesionPerdida, type Ir, type Salida } from '../navegacion';
import { PreguntaV2 } from '../pregunta-v2';
import { Aviso, Boton, Casilla, Dato, Parrafo, Seccion, Subtitulo, Tarjeta, Titulo, estilos as ui, estilosPorTema } from '../ui';
import { Accion, Acciones, faltaElA3 } from './tarjeta-de-inicio';

const A = COPY_HABITOS.apk;

/** Los rótulos del texto versionado, como en las fotos de comidas (08 §12.2: la versión mostrada es la aceptada). */
const T = {
  version: (id: string) => `Versión: ${id}`,
  vigenteDesde: (fecha: string) => `Vigente desde: ${fecha}`,
  huella: (hash: string) => `Huella SHA-256: ${hash}`,
} as const;

/** Lo que la pantalla avisa arriba después de una escritura o de volver a leer. `n` lo vuelve a anunciar aunque se repita. */
interface AvisoDeLaPantalla {
  readonly tipo: 'exito' | 'info';
  readonly texto: string;
  readonly n: number;
}

interface Comun {
  readonly d: MisHabitos;
  readonly token: string;
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
  readonly avisar: (tipo: 'exito' | 'info', texto: string) => void;
  readonly releer: () => void;
}

export function PantallaDeMisHabitos({ token, salir, ir, subir }: { token: string; salir: (m: Salida) => void; ir: Ir; subir: () => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const pedir = useCallback(() => api.misHabitos(token), [token]);
  // Al entrar se verifica antes de mostrar (src/ciclo-de-lectura.ts); la misma lectura que la tarjeta de Inicio.
  const { r, cargar, sinActualizar } = useLecturaRecordada(token, 'mis-habitos', pedir, sesionPerdida);
  // Ronda 2.1: los pedidos que esperan su respuesta (API-HBT-08), la misma lectura que la tarjeta de Inicio. Si no se pueden
  // leer (sin conexión, sin el A3), la pantalla sigue con lo suyo: lo que falla lo dice la lectura de «Mis hábitos».
  const pedirPedidos = useCallback(() => api.pedidosDeAccesoAMisHabitos(token), [token]);
  const pedidos = useLecturaRecordada(token, 'pedidos-de-acceso', pedirPedidos, sesionPerdida);
  const cargarPedidos = pedidos.cargar;
  const [aviso, setAviso] = useState<AvisoDeLaPantalla | null>(null);
  const avisar = useCallback(
    (tipo: 'exito' | 'info', texto: string) => {
      setAviso((a) => ({ tipo, texto, n: (a?.n ?? 0) + 1 }));
      subir();
    },
    [subir],
  );
  const releer = useCallback(() => {
    void cargar();
    void cargarPedidos();
  }, [cargar, cargarPedidos]);

  let cuerpo;
  if (r === null) cuerpo = <Cargando />;
  else if (!r.ok) {
    // DL-115 · sin el A3, lo propio no se lee (08:406): no es un error, y lo contado sigue guardado.
    cuerpo = faltaElA3(r) ? (
      <Aviso tipo="info" titulo={COPY_FORMULARIOS.necesitaA3}>
        <Boton texto={COPY_FORMULARIOS.irAPrivacidad} tipo="secundario" onPress={() => ir({ nombre: 'privacidad' })} />
      </Aviso>
    ) : (
      <ErrorConReintento sinConexion={r.tipo === 'RED'} onReintentar={releer} />
    );
  } else {
    const comun: Comun = { d: r.datos.data, token, sesionPerdida, avisar, releer };
    const esperando = pedidos.r?.ok ? pedidosEnOrden(pedidos.r.datos.data) : [];
    cuerpo = (
      <>
        <Parrafo tenue>{A.bajada}</Parrafo>
        <PedidosDeAcceso {...comun} pedidos={esperando} />
        {/* Quien pidió verlos ya tiene su pregunta en el pedido: no se le pregunta dos veces. */}
        {aQuienesPreguntarSinPedido(comun.d, esperando).map((p) => (
          <PreguntaPorUnNuevo key={p.professional.identityId} {...comun} p={p} />
        ))}
        <LoQueContaste {...comun} subir={subir} />
        <Compartir {...comun} />
      </>
    );
  }

  return (
    <View>
      <Titulo>{A.titulo}</Titulo>
      <SinActualizar visible={sinActualizar} onReintentar={releer} />
      {aviso ? <Aviso key={aviso.n} tipo={aviso.tipo} titulo={aviso.texto} /> : null}
      {cuerpo}
    </View>
  );
}

// ─── Lo vigente, el editor y la historia (API-HBT-01 y 02) ──────────────────────────────────────

function LoQueContaste({ d, token, sesionPerdida, avisar, releer, subir }: Comun & { readonly subir: () => void }) {
  const secciones = useMemo(() => [d.section], [d.section]);
  const [editando, setEditando] = useState(false);
  const [borrador, editar] = useReducer(reducirBorrador, BORRADOR_VACIO);
  /** Lo que se precargó al empezar a editar: sin tocarlo, no hay nada «sin guardar». */
  const [base, setBase] = useState<Borrador>(BORRADOR_VACIO);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [problema, setProblema] = useState<{ readonly titulo: string; readonly lineas: readonly string[]; readonly incierto: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [historiaAbierta, setHistoriaAbierta] = useState(false);
  const clave = useClaveDeIntento();
  const enCurso = useRef(false);
  // Salir con cambios pregunta antes: lo escrito en «Mis hábitos» no se guarda en el teléfono.
  useCambiosSinGuardar(editando && !mismoBorrador(borrador, base) ? 'tus hábitos' : null);

  /** Cambiar algo después de un resultado incierto es otro intento: la clave anterior no se reusa con otro pedido. */
  const editarBorrador = (ev: EventoDeBorrador) => {
    if (problema?.incierto) {
      clave.descartar();
      setProblema(null);
    }
    editar(ev);
  };
  const limpiarError = (fieldCode: string) => {
    if (!Object.keys(errores).some((k) => k === fieldCode || k.startsWith(`${fieldCode}/`))) return;
    setErrores((e) => Object.fromEntries(Object.entries(e).filter(([k]) => k !== fieldCode && !k.startsWith(`${fieldCode}/`))));
  };

  /** Abre el editor con lo vigente: la persona cambia lo que cambió, y lo anterior queda en la historia. */
  const empezar = () => {
    const valores = borradorDeRespuestas(secciones, d.current?.answers ?? []);
    editar({ tipo: 'cargar', valores });
    setBase(valores);
    setErrores({});
    setProblema(null);
    clave.descartar();
    setEditando(true);
    subir();
  };
  const cancelar = () => {
    editar({ tipo: 'limpiar' });
    setBase(BORRADOR_VACIO);
    setErrores({});
    setProblema(null);
    clave.descartar();
    setEditando(false);
  };

  async function guardar() {
    if (enCurso.current) return;
    const armadas = armarRespuestas(secciones, SOLICITUD_DE_MIS_HABITOS, borrador);
    const antes = problemasAntesDeEnviar(secciones, SOLICITUD_DE_MIS_HABITOS, armadas);
    if (antes) {
      setErrores({ ...antes.errores });
      setProblema({ titulo: antes.titulo, lineas: antes.lineas, incierto: false });
      return;
    }
    enCurso.current = true;
    setEnviando(true);
    setProblema(null);
    const r = await api.registrarMisHabitos(token, { expectedVersion: d.current?.version ?? null, answers: [...armadas.respuestas] }, clave.actual());
    enCurso.current = false;
    clave.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (r.ok) {
      cancelar();
      avisar('exito', A.guardados);
      releer();
      return;
    }
    // Entró otra versión mientras se editaba (otro formulario, otro teléfono): lo escrito queda, y se guarda sobre la nueva.
    if (r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT') {
      avisar('info', A.cambiaronMientras);
      releer();
      return;
    }
    // Sin el A3 (lo revocó en el medio): se vuelve a leer y la pantalla lo dice.
    if (faltaElA3(r)) {
      cancelar();
      releer();
      return;
    }
    const desenlace = rechazoV2(r, d.section.fields, armadas, { desdePropuesta: false, esCorreccion: false });
    if (desenlace?.tipo === 'por-campo') {
      setErrores({ ...desenlace.errores });
      setProblema({ titulo: desenlace.resumen, lineas: desenlace.lineas, incierto: false });
      return;
    }
    if (desenlace?.tipo === 'dato-no-aceptado') {
      setProblema({ titulo: desenlace.mensaje, lineas: [], incierto: false });
      return;
    }
    const fallo = falloDe(r);
    setProblema({ titulo: fallo.mensaje, lineas: [], incierto: fallo.tipo === 'incierto' });
  }

  const lineas = d.current ? habitosEnPalabras(d.section, d.current.answers) : [];
  const visibles = editando ? camposQueSeVen(secciones, SOLICITUD_DE_MIS_HABITOS, borrador) : new Set<string>();
  const armadasHoy = editando ? armarRespuestas(secciones, SOLICITUD_DE_MIS_HABITOS, borrador) : null;

  return (
    <>
      <Seccion titulo={d.section.title}>
        {editando ? (
          <>
            {d.section.intro ? <Parrafo tenue>{d.section.intro}</Parrafo> : null}
            {problema ? (
              <Aviso tipo="error" titulo={problema.titulo}>
                {problema.lineas.map((l) => (
                  <Parrafo key={l}>{l}</Parrafo>
                ))}
              </Aviso>
            ) : null}
            {d.section.fields
              .filter((c) => visibles.has(c.fieldCode))
              .map((c) => (
                <PreguntaV2
                  key={c.fieldCode}
                  campo={c}
                  // En «Mis hábitos» nada es obligatorio: el rótulo va sin «(Opcional)», que se leería en cada pregunta.
                  etiqueta={c.label}
                  borrador={borrador}
                  errores={errores}
                  puedeQuitar={seOfreceQuitarRespuesta(c, SOLICITUD_DE_MIS_HABITOS, tieneAlgo(valorDe(borrador, c)))}
                  tope={topeDesdeLaTabla(c, secciones, armadasHoy?.respuestas ?? [])}
                  editar={editarBorrador}
                  alTocar={limpiarError}
                />
              ))}
            <Boton texto={problema?.incierto ? COPY.reintentar : enviando ? A.guardando : A.guardar} onPress={() => void guardar()} ocupado={enviando} />
            <Boton texto={A.cancelar} tipo="secundario" onPress={cancelar} deshabilitado={enviando} />
          </>
        ) : (
          <>
            {d.current ? (
              <>
                {lineas.length > 0 ? lineas.map((l) => <Dato key={l.fieldCode} etiqueta={l.etiqueta} valor={l.valor} apilado />) : <Parrafo>{A.sinNadaDeclarado}</Parrafo>}
                <Parrafo tenue>{A.vigentesDesde(dia(d.current.recordedAt), d.current.origin)}</Parrafo>
              </>
            ) : (
              <Parrafo>{A.sinHabitos}</Parrafo>
            )}
            <Boton texto={d.current ? A.cambiarlos : A.contarlos} tipo={d.current ? 'secundario' : 'primario'} onPress={empezar} />
          </>
        )}
      </Seccion>
      {d.history.length > 0 && !editando ? (
        <View>
          <Boton texto={historiaAbierta ? A.ocultarHistoria : A.verHistoria} tipo="enlace" onPress={() => setHistoriaAbierta((a) => !a)} />
          {historiaAbierta ? (
            <View>
              <Subtitulo>{A.historia}</Subtitulo>
              <Parrafo tenue>{A.laHistoriaEsTuya}</Parrafo>
              {d.history.map((v) => {
                const anteriores = habitosEnPalabras(d.section, v.answers);
                return (
                  <Tarjeta key={v.habitsVersionId}>
                    <Text style={[ui.parrafo, ui.negrita]}>{A.versionDe(dia(v.recordedAt), v.origin)}</Text>
                    {anteriores.length > 0 ? anteriores.map((l) => <Dato key={l.fieldCode} etiqueta={l.etiqueta} valor={l.valor} apilado />) : <Parrafo tenue>{A.sinNadaDeclarado}</Parrafo>}
                  </Tarjeta>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}
    </>
  );
}

// ─── Compartir (API-HBT-03 y 04) ────────────────────────────────────────────────────────────────

/** El texto del acto, entero y a la vista: lo que se acepta no se pliega (08 §12.2; la versión mostrada es la aceptada). */
function TextoDelActo({ texto }: { texto: MisHabitos['text'] }) {
  const [titulo, ...parrafos] = texto.text.split('\n\n');
  return (
    <View style={estilos.texto}>
      <Parrafo>{A.leeAntes}</Parrafo>
      {texto.approval === 'PENDING_APPROVAL' ? <Aviso tipo="info" titulo={A.textoPropuesto} /> : null}
      <Text style={[ui.parrafo, ui.negrita]} accessibilityRole="header">
        {titulo}
      </Text>
      <Text style={ui.tenue}>{T.version(texto.id)}</Text>
      <Text style={ui.tenue}>{T.vigenteDesde(dia(texto.effectiveFrom))}</Text>
      <Text style={ui.tenue} selectable>
        {T.huella(texto.textHash)}
      </Text>
      {parrafos.map((p, i) => (
        <Text key={i} style={ui.parrafo}>
          {p}
        </Text>
      ))}
    </View>
  );
}

/**
 * Manda un pedido de API-HBT-03 con una clave por intento: si el resultado es incierto, el reintento usa la misma. Lo que
 * pide volver a leer (otra versión, un profesional que ya no la acompaña, un texto nuevo) se avisa arriba y se vuelve a
 * leer; un fallo propio se dice junto al botón.
 */
function useEnvioDeCompartir({ d, token, sesionPerdida, avisar, releer, alTerminar }: Comun & { readonly alTerminar: () => void }) {
  const clave = useClaveDeIntento();
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<Fallo | null>(null);
  const enCurso = useRef(false);
  const ultimo = useRef<{ readonly pedido: CompartirHabitosRequest; readonly acto: ActoDeCompartir } | null>(null);
  const enviar = async (pedido: CompartirHabitosRequest, acto: ActoDeCompartir) => {
    if (enCurso.current) return;
    ultimo.current = { pedido, acto };
    enCurso.current = true;
    setEnviando(true);
    setFallo(null);
    const r = await api.compartirMisHabitos(token, pedido, clave.actual());
    enCurso.current = false;
    clave.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (r.ok) {
      alTerminar();
      avisar('exito', exitoDeCompartir(d, acto));
      releer();
      return;
    }
    const motivo = rechazoDeCompartir(r);
    if (motivo || faltaElA3(r)) {
      alTerminar();
      if (motivo) avisar('info', motivo);
      releer();
      return;
    }
    setFallo(falloDe(r));
  };
  /** Con el resultado incierto: el mismo pedido, con la misma clave. */
  const reintentar = () => {
    if (ultimo.current) void enviar(ultimo.current.pedido, ultimo.current.acto);
  };
  return { enviando, fallo, enviar, reintentar, incierto: fallo?.tipo === 'incierto' };
}

/** Compartir por primera vez (o de nuevo), o cambiar con quiénes: las casillas y, si amplía, el texto antes de aceptar. */
function PanelDeCompartir({ tipo, alCerrar, ...comun }: Comun & { readonly tipo: 'compartir' | 'cambiar'; readonly alCerrar: () => void }) {
  const { d } = comun;
  const [marcados, setMarcados] = useState<ReadonlySet<string>>(() => (tipo === 'compartir' ? marcadosAlCompartir(d) : marcadosAlCambiar(d)));
  /** Compartir muestra el texto de entrada; cambiar, solo si lo que queda marcado amplía la lista. */
  const [conTexto, setConTexto] = useState(tipo === 'compartir');
  const envio = useEnvioDeCompartir({ ...comun, alTerminar: alCerrar });
  const lista = tipo === 'compartir' ? ofrecidosAlCompartir(d) : d.professionals;
  const acto: ActoDeCompartir = { tipo, marcados };
  const pedido = pedidoDeCompartir(d, acto);
  const ninguno = pedido.professionalIds.length === 0;
  const alternar = (id: string, marcar: boolean) =>
    setMarcados((m) => {
      const nuevo = new Set(m);
      if (marcar) nuevo.add(id);
      else nuevo.delete(id);
      return nuevo;
    });
  const confirmar = () => {
    if (envio.incierto) return envio.reintentar();
    if (!conTexto && pideElTexto(d, pedido)) {
      setConTexto(true);
      return;
    }
    void envio.enviar(pedido, acto);
  };
  return (
    <View style={estilos.panel}>
      {conTexto ? <TextoDelActo texto={d.text} /> : null}
      <Subtitulo>{A.quienesLosVen}</Subtitulo>
      {lista.map((p) => (
        <Casilla
          key={p.professional.identityId}
          marcada={marcados.has(p.professional.identityId)}
          onCambio={(v) => alternar(p.professional.identityId, v)}
          titulo={p.professional.displayName}
          texto={descripcionEnLaLista(p)}
          // Con el resultado incierto, el reintento tiene que mandar lo mismo.
          deshabilitada={envio.enviando || envio.incierto}
        />
      ))}
      {ninguno ? <Parrafo tenue>{A.eligiAlMenosUno}</Parrafo> : null}
      {envio.fallo ? <Aviso tipo="error" titulo={envio.fallo.mensaje} /> : null}
      <Boton
        texto={envio.incierto ? COPY.reintentar : conTexto ? A.aceptoYComparto : A.guardarCambios}
        onPress={confirmar}
        ocupado={envio.enviando}
        deshabilitado={ninguno || envio.enviando}
      />
      <Boton texto={A.cancelar} tipo="secundario" onPress={alCerrar} deshabilitado={envio.enviando} />
    </View>
  );
}

/** Cómo se lee un profesional en la lista de casillas: sus áreas y, si hace falta, su vínculo en pausa o que es nuevo. */
function descripcionEnLaLista(p: ProfesionalParaHabitos): string {
  return [areasEnPalabras(p), p.link === 'PAUSED' ? A.enPausa : null, p.sharing === 'NOT_ASKED' ? A.empezoDespues : null].filter((t): t is string => !!t).join(' ');
}

function Compartir(comun: Comun) {
  const { d, token, sesionPerdida, avisar, releer } = comun;
  const [panel, setPanel] = useState<'compartir' | 'cambiar' | null>(null);
  const cerrar = useCallback(() => setPanel(null), []);
  const retiro = useAccionConfirmada({
    sesionPerdida,
    alTerminar: () => {
      setPanel(null);
      avisar('exito', A.dejasteDeCompartir);
      releer();
    },
    alRecargar: releer,
    propios: { VERSION_CONFLICT: { mensaje: A.cambioLaAutorizacion, tipo: 'actualizar' } },
  });
  const activa = d.sharing.status === 'ACTIVE';
  const version = d.sharing.version;
  return (
    <Seccion titulo={A.compartirTitulo}>
      {activa ? (
        <>
          {d.sharing.activeSince ? <Parrafo>{A.compartiendoDesde(dia(d.sharing.activeSince))}</Parrafo> : null}
          <Subtitulo>{A.quienesLosVen}</Subtitulo>
          {quienesLosReciben(d).length === 0 ? <Parrafo tenue>{A.nadieLosVe}</Parrafo> : null}
          {panel === 'cambiar' ? (
            <PanelDeCompartir {...comun} tipo="cambiar" alCerrar={cerrar} />
          ) : (
            <>
              {d.professionals.map((p) => (
                <Dato key={p.professional.identityId} etiqueta={`${p.professional.displayName} · ${areasEnPalabras(p)}`} valor={estadoEnPalabras(p, dia)} apilado />
              ))}
              <Boton texto={A.cambiarConQuienes} tipo="secundario" onPress={() => setPanel('cambiar')} />
            </>
          )}
          {version ? <Boton texto={A.dejarDeCompartir} tipo="peligroSecundario" onPress={retiro.abrir} deshabilitado={panel !== null} /> : null}
          {version ? (
            <DialogoDeConfirmacion
              visible={retiro.visible}
              titulo={A.dejarDeCompartirPregunta}
              textoConfirmar={A.siDejarDeCompartir}
              textoEnviando={A.retirando}
              peligro
              enviando={retiro.enviando}
              fallo={retiro.fallo}
              onVolver={retiro.volver}
              onActualizar={retiro.actualizar}
              onConfirmar={() => void retiro.ejecutar((claveDeIntento) => api.dejarDeCompartirMisHabitos(token, { expectedVersion: version }, claveDeIntento))}
            >
              <Parrafo>{A.dejarDeCompartirEfecto}</Parrafo>
            </DialogoDeConfirmacion>
          ) : null}
        </>
      ) : (
        <>
          {d.sharing.status === 'WITHDRAWN' && d.sharing.withdrawnAt ? <Parrafo tenue>{A.retiradaEl(dia(d.sharing.withdrawnAt))}</Parrafo> : null}
          <Parrafo>{A.compartirApagado}</Parrafo>
          <Parrafo tenue>{A.compartirQueEs}</Parrafo>
          {ofrecidosAlCompartir(d).length === 0 ? (
            <Parrafo tenue>{A.sinProfesionales}</Parrafo>
          ) : panel === 'compartir' ? (
            <PanelDeCompartir {...comun} tipo="compartir" alCerrar={cerrar} />
          ) : (
            <Boton texto={A.compartir} onPress={() => setPanel('compartir')} />
          )}
        </>
      )}
    </Seccion>
  );
}

// ─── Ronda 2.1 · un profesional pide verlos (D-17 nueva; API-HBT-08 y 09) ─────────────────────────

/** Los pedidos que esperan su respuesta, arriba de todo: sin pedidos, no se dibuja nada. */
function PedidosDeAcceso({ pedidos, ...comun }: Comun & { readonly pedidos: readonly PedidoDeAcceso[] }) {
  if (pedidos.length === 0) return null;
  return (
    <Seccion titulo={A.pedidosTitulo}>
      {pedidos.map((p) => (
        <PedidoDeUnProfesional key={p.accessRequestId} {...comun} pedido={p} />
      ))}
    </Seccion>
  );
}

/**
 * Un pedido: quién pide y desde qué área, para qué le sirve, cuándo lo pidió, qué vería y que es su decisión. «Sí, que los
 * vea» y «No, por ahora» van con el mismo botón, uno al lado del otro: ninguna respuesta se empuja. El «Sí» amplía la
 * lista, así que primero muestra el texto entero (y, si todavía no compartía, que solo él los va a ver); después se acepta.
 * Una clave por intento: con un resultado incierto, el reintento manda lo mismo con la misma clave.
 */
function PedidoDeUnProfesional({ pedido, ...comun }: Comun & { readonly pedido: PedidoDeAcceso }) {
  const { d, token, sesionPerdida, avisar, releer } = comun;
  const id = pedido.professional.identityId;
  const nombre = pedido.professional.displayName;
  const [conTexto, setConTexto] = useState(false);
  const [enviando, setEnviando] = useState<RespuestaAUnPedido | null>(null);
  const [fallo, setFallo] = useState<{ readonly fallo: Fallo; readonly respuesta: RespuestaAUnPedido } | null>(null);
  const clave = useClaveDeIntento();
  const enCurso = useRef(false);

  async function responder(respuesta: RespuestaAUnPedido) {
    if (enCurso.current) return;
    // Otra respuesta que la del intento incierto es otro intento: no reusa la clave.
    if (fallo && fallo.respuesta !== respuesta) clave.descartar();
    enCurso.current = true;
    setEnviando(respuesta);
    setFallo(null);
    const r = await api.responderPedidoDeAcceso(token, pedido.accessRequestId, respuestaAlPedido(d, pedido, respuesta), clave.actual());
    enCurso.current = false;
    clave.registrar(r);
    setEnviando(null);
    if (sesionPerdida(r)) return;
    if (r.ok) {
      setConTexto(false);
      avisar('exito', exitoDeLaRespuesta(pedido, respuesta));
      releer();
      return;
    }
    // El pedido ya no espera, lo que comparte cambió o falta el A3: se vuelve a leer, y la pantalla lo dice.
    const motivo = rechazoDeLaRespuesta(r, respuesta);
    if (motivo || faltaElA3(r)) {
      setConTexto(false);
      if (motivo) avisar('info', motivo);
      releer();
      return;
    }
    setFallo({ fallo: falloDe(r), respuesta });
  }

  const ocupado = enviando !== null;
  const incierto = fallo?.fallo.tipo === 'incierto';
  return (
    <Tarjeta>
      <Text style={[ui.parrafo, ui.negrita]}>{A.pedidoDe(nombre, pedido.scope.label)}</Text>
      <Parrafo>{paraQueLeSirven(pedido)}</Parrafo>
      <Parrafo tenue>{A.pedidoEl(dia(pedido.requestedAt))}</Parrafo>
      <Parrafo tenue>{A.loQueVeria}</Parrafo>
      <Parrafo tenue>{A.esTuDecision}</Parrafo>
      {conTexto ? (
        <>
          {seAvisaQueSoloElLosVe(d, id) ? <Aviso tipo="info" titulo={A.soloEl(nombre)} /> : null}
          <TextoDelActo texto={d.text} />
        </>
      ) : null}
      {fallo ? <Aviso tipo="error" titulo={fallo.fallo.mensaje} /> : null}
      {incierto && fallo ? (
        <Boton texto={COPY.reintentar} onPress={() => void responder(fallo.respuesta)} ocupado={ocupado} />
      ) : conTexto ? (
        <>
          <Boton texto={A.aceptoYComparto} onPress={() => void responder('si')} ocupado={enviando === 'si'} deshabilitado={ocupado} />
          <Boton texto={A.cancelar} tipo="secundario" onPress={() => setConTexto(false)} deshabilitado={ocupado} />
        </>
      ) : (
        <Acciones>
          <Accion>
            <Boton texto={A.pedidoSi} tipo="secundario" onPress={() => (elSiPideElTexto(d, id) ? setConTexto(true) : void responder('si'))} ocupado={enviando === 'si'} deshabilitado={ocupado} />
          </Accion>
          <Accion>
            <Boton texto={A.pedidoNo} tipo="secundario" onPress={() => void responder('no')} ocupado={enviando === 'no'} deshabilitado={ocupado} />
          </Accion>
        </Acciones>
      )}
    </Tarjeta>
  );
}

// ─── Un profesional nuevo (§4.3: no los recibe solo, y sin respuesta no se suma) ───────────────────

function PreguntaPorUnNuevo({ p, ...comun }: Comun & { readonly p: ProfesionalParaHabitos }) {
  const { d } = comun;
  const id = p.professional.identityId;
  const [conTexto, setConTexto] = useState(false);
  const envio = useEnvioDeCompartir({ ...comun, alTerminar: () => setConTexto(false) });
  const sumar: ActoDeCompartir = { tipo: 'sumar', profesionalId: id };
  const noSumar: ActoDeCompartir = { tipo: 'no-sumar', profesionalId: id };
  const pedidoSi = pedidoDeCompartir(d, sumar);
  const pedidoNo = pedidoDeCompartir(d, noSumar);
  return (
    <Tarjeta>
      <Text style={[ui.parrafo, ui.negrita]}>{A.nuevoPregunta(p.professional.displayName)}</Text>
      <Parrafo tenue>{areasEnPalabras(p)}</Parrafo>
      <Parrafo tenue>{A.nuevoDetalle}</Parrafo>
      {conTexto ? <TextoDelActo texto={d.text} /> : null}
      {envio.fallo ? <Aviso tipo="error" titulo={envio.fallo.mensaje} /> : null}
      {envio.incierto ? (
        <Boton texto={COPY.reintentar} onPress={envio.reintentar} ocupado={envio.enviando} />
      ) : conTexto ? (
        <>
          <Boton texto={A.aceptoYComparto} onPress={() => void envio.enviar(pedidoSi, sumar)} ocupado={envio.enviando} />
          <Boton texto={A.cancelar} tipo="secundario" onPress={() => setConTexto(false)} deshabilitado={envio.enviando} />
        </>
      ) : (
        <>
          {/* Sumar a alguien amplía la lista: primero el texto, después aceptar (08 C-12). */}
          <Boton
            texto={A.nuevoSi}
            onPress={() => (pideElTexto(d, pedidoSi) ? setConTexto(true) : void envio.enviar(pedidoSi, sumar))}
            ocupado={envio.enviando}
          />
          {/* Con nadie más que los reciba hoy, no hay lista que mandar: no responder también lo deja sin verlos. */}
          {pedidoEnviable(pedidoNo) ? <Boton texto={A.nuevoNo} tipo="secundario" onPress={() => void envio.enviar(pedidoNo, noSumar)} deshabilitado={envio.enviando} /> : null}
        </>
      )}
    </Tarjeta>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  // El texto que se acepta, en un recuadro: se lee entero, con su versión y su huella.
  texto: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 8, padding: 12, marginVertical: 8, backgroundColor: COLOR.superficie },
  panel: { marginTop: 4 },
}));
