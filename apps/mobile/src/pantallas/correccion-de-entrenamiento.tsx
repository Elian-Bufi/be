/**
 * APK · Corregir una sesión registrada (PA-04, decisión de Dirección del 2026-11-02), en su propia pantalla y en un paso.
 *
 * - **Con el lenguaje del registro:** una tarjeta por ejercicio, con su imagen y su estado («2 de 3 series registradas»),
 *   y una fila por serie, con la carga, las repeticiones y el RIR. Lo registrado viene escrito y tildado; lo
 *   planificado que no se registró, vacío y con el plan en gris, para cargarlo: así se suma lo que faltó. Un ejercicio
 *   planificado que no se registró aparece entero.
 * - **La casilla al final de cada serie**, la misma de la sesión (Dirección, 2026-11-02). Quitar una serie es destildarla:
 *   queda tachada, con «Deshacer», hasta registrar la corrección. Tildar una sin registro la suma con lo planificado
 *   («como el plan»); escribir en ella también la tilda. «Agregar una serie» suma una más.
 * - **La fila registrada** va en el azul elevado del tema, como en la sesión: la tilde de la casilla ya dice que quedó.
 * - **Qué cambia** se ve antes de registrar, en frases (UC-E02, paso 6), también lo que se quita («Se quita la serie 3 de
 *   Sentadilla»), y el motivo se elige de un toque.
 * - **El registro original no se toca** (REG-06-116): la corrección se suma a la cadena.
 * - Antes de enviar se vuelve a leer la ejecución: si lo que rige cambió mientras se corregía (por ejemplo, la corrigió el
 *   profesional), no se registra sobre lo viejo (UC-E02, E04).
 * - Las piezas son las de `ui.tsx` y la familia de íconos; la lógica, sin React, está en `correccion-de-la-sesion.ts`.
 */
import {
  COPY_ENTRENAMIENTO,
  COPY_ENTRENAMIENTO_POR_SERIE,
  numero,
  registroVigente,
  type EjecucionDeEntrenamiento,
  type PrescripcionConObjetivos,
  type Resultado,
  type SesionConObjetivos,
} from '@be/domain';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { Text, TextInput, useWindowDimensions, View, type KeyboardTypeOptions } from 'react-native';
import { api } from '../api';
import { useCambiosSinGuardar } from '../cambios-sin-guardar';
import {
  alTocarLaCasilla,
  ANCHO_DE_LA_CASILLA_EN_LA_CORRECCION,
  cambioLoQueRige,
  cambiosDelEstado,
  claveDeFila,
  CONDICIONES,
  corregir,
  disposicionDeLaCorreccion,
  estadoDeLaFila,
  estadoDelEjercicio,
  estadoInicial,
  filaComoElPlan,
  filaTildada,
  hayAlgoSinGuardar,
  MOTIVOS,
  pedidoDeCorreccion,
  pistaDeLaCasilla,
  sePuedeAgregar,
  TEXTOS_DE_LA_CORRECCION as T,
  textoCortoDeSerie,
  textoDeLosErrores,
  unidadDelEjercicioEnCorreccion,
  type AccionDeCorreccion,
  type EjercicioEnCorreccion,
  type FilaEnCorreccion,
  type MotivoDeCorreccion,
} from '../correccion-de-la-sesion';
import { Cargando, ErrorConReintento } from '../estados';
import { fechaCivil } from '../formato';
import { ImagenDeMedio } from '../imagen-de-medio';
import { falloDe, useClaveDeIntento } from '../intento';
import { useAccesoRetirado, useSesionPerdida, type Ir, type Salida } from '../navegacion';
import { AVISO_SIN_PLAN_POR_SERIE, placeholdersDeLaSerie, sesionDesdeLaOcurrencia, type ErroresDeFila, type FilaEscrita, type Unidad } from '../series-de-la-sesion';
import { Aviso, Boton, Campo, CasillaSola, Desplegable, estilosPorTema, Insignia, Parrafo, Seccion, Segmentos, Superficie, Titulo } from '../ui';
import { RESPALDO_DE_EJERCICIO } from './sesion-enfocada';

type AlPerderLaSesion = (r: Resultado<unknown>) => boolean;
type Lectura = null | { readonly tipo: 'error'; readonly sinConexion: boolean } | { readonly tipo: 'lista'; readonly x: EjecucionDeEntrenamiento; readonly sesion: SesionConObjetivos; readonly conPlan: boolean };

/** El lado de la miniatura del ejercicio, en dp. */
const LADO_DE_LA_IMAGEN = 56;
/** Lo que la tarjeta del ejercicio le quita al ancho de la pantalla: el relleno de la app y el de la tarjeta. */
const MARGEN_DE_LA_TARJETA = 2 * 20 + 2 * 13;

export function PantallaDeCorreccion({ token, id, salir, ir }: { token: string; id: string; salir: (m: Salida) => void; ir: Ir }) {
  const sesionPerdida = useSesionPerdida(salir);
  const { retirado, accesoRetirado } = useAccesoRetirado();
  const [lectura, setLectura] = useState<Lectura>(null);

  const cargar = useCallback(async () => {
    setLectura(null);
    const r = await api.consultarEjecucionDeEntrenamiento(token, id);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setLectura({ tipo: 'error', sinConexion: r.tipo === 'RED' });
    const x = r.datos.data;
    // El plan de cada serie, para mostrarlo en gris (API-SER-02 lee también una ocurrencia ya registrada). Si no se puede
    // leer, quedan las repeticiones de cada serie, que vienen con la ejecución.
    const s = await api.sesionParaRegistrar(token, x.occurrenceId);
    if (sesionPerdida(s)) return;
    setLectura({ tipo: 'lista', x, sesion: s.ok ? s.datos.data.session : sesionDesdeLaOcurrencia(x.plannedSession), conPlan: s.ok });
  }, [token, id, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Corregir es una escritura: denegada con el 404 no revelador, el registro se retira de la pantalla.
  if (retirado) return <Aviso tipo="info" titulo={COPY_ENTRENAMIENTO.planNoDisponible} />;
  if (!lectura) return <Cargando />;
  if (lectura.tipo === 'error') return <ErrorConReintento sinConexion={lectura.sinConexion} onReintentar={cargar} />;
  return (
    <FormularioDeLaCorreccion
      key={lectura.x.corrections.length}
      token={token}
      x={lectura.x}
      sesion={lectura.sesion}
      conPlan={lectura.conPlan}
      sesionPerdida={sesionPerdida}
      accesoRetirado={accesoRetirado}
      onReleer={cargar}
      onRegistrada={() => ir({ nombre: 'ejecucion-de-entrenamiento', id, aviso: T.registrada }, 'reemplazar')}
    />
  );
}

function FormularioDeLaCorreccion({
  token,
  x,
  sesion,
  conPlan,
  sesionPerdida,
  accesoRetirado,
  onReleer,
  onRegistrada,
}: {
  token: string;
  x: EjecucionDeEntrenamiento;
  sesion: SesionConObjetivos;
  conPlan: boolean;
  sesionPerdida: AlPerderLaSesion;
  accesoRetirado: AlPerderLaSesion;
  onReleer: () => void;
  onRegistrada: () => void;
}) {
  const base = useMemo(() => registroVigente(x), [x]);
  const [inicial] = useState(() => estadoInicial(x, sesion));
  const [estado, hacer] = useReducer(corregir, inicial);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const [errores, setErrores] = useState<ReadonlyMap<string, ErroresDeFila>>(new Map());
  const [conflicto, setConflicto] = useState(false);
  const intento = useClaveDeIntento();
  useCambiosSinGuardar(hayAlgoSinGuardar(estado, inicial) ? T.loQueEscribiste : null);
  const { width, fontScale } = useWindowDimensions();
  const disposicion = disposicionDeLaCorreccion(width - MARGEN_DE_LA_TARJETA, fontScale);

  const nombreDe = useCallback((prescriptionId: string) => estado.ejercicios.find((e) => e.prescriptionId === prescriptionId)?.nombre ?? 'Ejercicio', [estado.ejercicios]);
  const cambios = useMemo(() => cambiosDelEstado(estado, base, nombreDe), [estado, base, nombreDe]);
  const prescripcion = (prescriptionId: string): PrescripcionConObjetivos | null => sesion.prescriptions.find((p) => p.prescriptionId === prescriptionId) ?? null;
  // Al cambiar algo, los errores de la última vez se van: vuelven a decirse, si siguen, al registrar.
  const despachar = (a: AccionDeCorreccion) => {
    setFallo(null);
    setErrores(new Map());
    hacer(a);
  };
  // Tildar una serie sin plan que se pueda registrar tal cual no suma nada: se dice en su fila, al momento.
  const noSePudoTildar = (prescriptionId: string, setIndex: number, e: ErroresDeFila) => {
    setFallo(null);
    setErrores(new Map([[claveDeFila(prescriptionId, setIndex), e]]));
  };

  async function registrar() {
    const pedido = pedidoDeCorreccion(estado, base);
    if (!pedido.ok) {
      setErrores(pedido.errores);
      setFallo(pedido.mensaje);
      return;
    }
    setErrores(new Map());
    setFallo(null);
    setEnviando(true);
    // Lo que rige se vuelve a leer: si cambió mientras se corregía, la corrección se armaría sobre lo viejo (UC-E02, E04).
    const vigente = await api.consultarEjecucionDeEntrenamiento(token, x.executionId);
    if (sesionPerdida(vigente)) return;
    if (vigente.ok && cambioLoQueRige(x, vigente.datos.data)) {
      setEnviando(false);
      setConflicto(true);
      return;
    }
    const r = await api.corregirEjecucion(token, x.executionId, { reason: pedido.reason, correction: pedido.correction }, intento.actual());
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (accesoRetirado(r)) return;
    if (!r.ok) {
      const sinCambios = r.tipo === 'API' && r.issues.some((i) => i.code === 'CORRECTION_WITHOUT_CHANGES');
      return setFallo(sinCambios ? T.sinCambios : r.tipo === 'API' && r.issues.length > 0 ? T.datoNoAceptado : falloDe(r).mensaje);
    }
    onRegistrada();
  }

  const opcionesDeMotivo = MOTIVOS.map((m) => ({ valor: m, texto: T.motivos[m] }));
  return (
    <View>
      <Titulo>{T.titulo}</Titulo>
      <Parrafo tenue>
        {x.plannedSession.label} · {fechaCivil(x.date)}
      </Parrafo>
      <Parrafo>{T.bajada}</Parrafo>
      {conflicto ? (
        <Aviso tipo="info" titulo={T.conflicto}>
          <Boton texto={T.verLaVersionNueva} tipo="secundario" icono="actualizar" onPress={onReleer} />
        </Aviso>
      ) : null}

      <Seccion titulo={T.comoResulto} icono="desvio">
        <Segmentos etiqueta={T.comoResulto} opciones={CONDICIONES} valor={estado.condicion} alElegir={(condicion) => despachar({ tipo: 'condicion', condicion })} />
        <Desplegable titulo={T.comentario} abiertoAlInicio={estado.comentario !== ''}>
          <Campo etiqueta={T.comentario} value={estado.comentario} onChangeText={(texto) => despachar({ tipo: 'comentario', texto })} multiline />
        </Desplegable>
      </Seccion>

      {estado.condicion === 'NOT_COMPLETED' ? (
        <Parrafo tenue>{T.sinSeries}</Parrafo>
      ) : estado.forma === 'SET' ? (
        <>
          {!conPlan ? <Aviso tipo="info" titulo={AVISO_SIN_PLAN_POR_SERIE} /> : null}
          {estado.ejercicios.map((ej) => (
            <TarjetaDelEjercicio key={ej.prescriptionId} ej={ej} prescripcion={prescripcion(ej.prescriptionId)} token={token} sesionPerdida={sesionPerdida} errores={errores} disposicion={disposicion} hacer={despachar} noSePudoTildar={noSePudoTildar} />
          ))}
          {estado.sinDatosAntes ? (
            <Desplegable titulo={T.prefieroContarlo} abiertoAlInicio={estado.resumenDeSesion !== ''}>
              <Campo etiqueta={T.contaComoFue} value={estado.resumenDeSesion} onChangeText={(texto) => despachar({ tipo: 'resumen-de-sesion', texto })} multiline />
            </Desplegable>
          ) : null}
        </>
      ) : (
        <>
          {estado.ejercicios.map((ej) => (
            <Superficie key={ej.prescriptionId} style={estilos.tarjeta}>
              <CabezaDelEjercicio ej={ej} prescripcion={prescripcion(ej.prescriptionId)} token={token} sesionPerdida={sesionPerdida} />
              <Campo etiqueta={`${T.resumenDelEjercicio} (opcional)`} value={ej.resumen ?? ''} onChangeText={(texto) => despachar({ tipo: 'resumen', prescriptionId: ej.prescriptionId, texto })} multiline />
            </Superficie>
          ))}
          <Campo etiqueta={`${T.resumenDeLaSesion} (opcional)`} value={estado.resumenDeSesion} onChangeText={(texto) => despachar({ tipo: 'resumen-de-sesion', texto })} multiline />
        </>
      )}

      {/* Lo que cambia, antes de registrar (UC-E02, paso 6): el original sigue al lado. */}
      <Seccion titulo={T.queCambia} icono="corregido">
        {cambios.length === 0 ? (
          <Parrafo tenue>{T.sinCambiosTodavia}</Parrafo>
        ) : (
          <>
            <Text style={estilos.cuenta}>{T.cambios(cambios.length)}</Text>
            {cambios.map((c, i) => (
              <Parrafo key={i}>{c}</Parrafo>
            ))}
          </>
        )}
      </Seccion>

      <Seccion titulo={T.porQue} icono="texto">
        <Segmentos<MotivoDeCorreccion | ''> etiqueta={T.porQue} opciones={opcionesDeMotivo} valor={estado.motivo ?? ''} alElegir={(motivo) => (motivo ? despachar({ tipo: 'motivo', motivo }) : undefined)} />
        {estado.motivo === 'otro' ? <Campo etiqueta={T.otroMotivo} value={estado.otroMotivo} onChangeText={(texto) => despachar({ tipo: 'otro-motivo', texto })} /> : null}
        <Parrafo tenue>{T.nota}</Parrafo>
      </Seccion>

      {fallo ? <Aviso tipo="error" titulo={fallo} /> : null}
      <Boton texto={T.registrar} icono="corregido" onPress={() => void registrar()} ocupado={enviando} deshabilitado={conflicto} />
    </View>
  );
}

/** La miniatura, el nombre (con el ejecutado si se sustituyó) y el estado de lo registrado. */
function CabezaDelEjercicio({ ej, prescripcion, token, sesionPerdida }: { ej: EjercicioEnCorreccion; prescripcion: PrescripcionConObjetivos | null; token: string; sesionPerdida: AlPerderLaSesion }) {
  return (
    <View style={estilos.cabeza}>
      <ImagenDeMedio
        token={token}
        mediaId={prescripcion?.image?.mediaId ?? null}
        sesionPerdida={sesionPerdida}
        rotulo={prescripcion?.image?.altText || ej.nombre}
        tamano={LADO_DE_LA_IMAGEN}
        respaldo={RESPALDO_DE_EJERCICIO}
        respaldoCompacto
        rotuloVisible={false}
        ajuste="contener"
      />
      <View style={estilos.datos}>
        <Text style={estilos.nombre} accessibilityRole="header">
          {ej.nombre}
        </Text>
        {ej.ejecutado ? <Text style={estilos.detalle}>{`${COPY_ENTRENAMIENTO.ejecutado}: ${ej.ejecutado}`}</Text> : null}
        <Insignia texto={estadoDelEjercicio(ej)} />
      </View>
    </View>
  );
}

function TarjetaDelEjercicio({
  ej,
  prescripcion,
  token,
  sesionPerdida,
  errores,
  disposicion,
  hacer,
  noSePudoTildar,
}: {
  ej: EjercicioEnCorreccion;
  prescripcion: PrescripcionConObjetivos | null;
  token: string;
  sesionPerdida: AlPerderLaSesion;
  errores: ReadonlyMap<string, ErroresDeFila>;
  disposicion: 'tabla' | 'tarjetas';
  hacer: (a: AccionDeCorreccion) => void;
  noSePudoTildar: (prescriptionId: string, setIndex: number, errores: ErroresDeFila) => void;
}) {
  const unidad = unidadDelEjercicioEnCorreccion(ej);
  return (
    <Superficie style={estilos.tarjeta}>
      <CabezaDelEjercicio ej={ej} prescripcion={prescripcion} token={token} sesionPerdida={sesionPerdida} />
      <Segmentos<Unidad>
        compactos
        etiqueta={`${T.unidad}: ${ej.nombre}`}
        opciones={[
          { valor: 'kg', texto: 'kg' },
          { valor: 'lb', texto: 'lb' },
        ]}
        valor={unidad ?? 'kg'}
        alElegir={(u) => hacer({ tipo: 'unidad', prescriptionId: ej.prescriptionId, unidad: u })}
      />
      {disposicion === 'tabla' ? (
        <View style={estilos.encabezado} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={[estilos.columna, estilos.columnaSerie]}>{COPY_ENTRENAMIENTO_POR_SERIE.columnaSerie}</Text>
          <Text style={[estilos.columna, estilos.columnaDato]}>{unidad ?? COPY_ENTRENAMIENTO.carga}</Text>
          <Text style={[estilos.columna, estilos.columnaDato]}>{COPY_ENTRENAMIENTO_POR_SERIE.columnaRepeticiones}</Text>
          <Text style={[estilos.columna, estilos.columnaDato]}>{COPY_ENTRENAMIENTO_POR_SERIE.columnaRir}</Text>
          <View style={estilos.columnaCasilla} />
        </View>
      ) : null}
      {ej.filas.map((f) => (
        <FilaDeLaCorreccion
          key={f.setIndex}
          fila={f}
          ejercicio={ej.nombre}
          errores={textoDeLosErrores(errores.get(claveDeFila(ej.prescriptionId, f.setIndex)))}
          disposicion={disposicion}
          hacer={(a) => hacer({ ...a, prescriptionId: ej.prescriptionId, setIndex: f.setIndex } as AccionDeCorreccion)}
          noSePudoTildar={(e) => noSePudoTildar(ej.prescriptionId, f.setIndex, e)}
        />
      ))}
      {ej.filas.some((f) => f.origen !== 'registrada') ? <Text style={estilos.nota}>{T.enGris}</Text> : null}
      {sePuedeAgregar(ej) ? <Boton texto={T.agregarSerie} tipo="enlace" icono="mas" onPress={() => hacer({ tipo: 'agregar', prescriptionId: ej.prescriptionId })} /> : null}
    </Superficie>
  );
}

/** Los campos que se corrigen. El tiempo de la serie (DL-161) no se corrige acá: una serie reescrita conserva el suyo. */
type CampoDeLaCorreccion = 'carga' | 'repeticiones' | 'rir';

const CAMPOS: readonly { readonly campo: CampoDeLaCorreccion; readonly teclado: KeyboardTypeOptions }[] = [
  // Decimal para la carga y el RIR; entero para las repeticiones.
  { campo: 'carga', teclado: 'decimal-pad' },
  { campo: 'repeticiones', teclado: 'number-pad' },
  { campo: 'rir', teclado: 'decimal-pad' },
];

/** Lo que es un campo, de qué serie, y el plan de esa serie: el nombre accesible de la celda. */
function nombreDelCampo(campo: CampoDeLaCorreccion, f: FilaEnCorreccion, ejercicio: string, plan: string): string {
  const que = campo === 'carga' ? `Carga en ${f.unidad}` : campo === 'repeticiones' ? 'Repeticiones' : 'RIR, opcional';
  const delPlan = plan === COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo ? plan : `Plan: ${plan}`;
  return `${que} de la serie ${f.setIndex} de ${ejercicio}. ${delPlan}`;
}

/** La acción de una fila, sin el ejercicio ni la serie, que los pone la tarjeta. */
type AccionDeFila = { readonly tipo: 'escribir'; readonly campo: keyof FilaEscrita; readonly texto: string } | { readonly tipo: 'quitar' | 'deshacer' | 'tildar' };

/**
 * Una serie, con su casilla al final (Dirección, 2026-11-02). Tildada, va en el azul elevado del tema, y con «como el plan»
 * si va así; cambiada, con el borde del acento y lo que decía antes; sumada, «Nueva». Destildada, una registrada queda
 * tachada con «Deshacer» hasta registrar la corrección. Las vacías muestran el plan en gris.
 */
function FilaDeLaCorreccion({
  fila: f,
  ejercicio,
  errores,
  disposicion,
  hacer,
  noSePudoTildar,
}: {
  fila: FilaEnCorreccion;
  ejercicio: string;
  errores: string | null;
  disposicion: 'tabla' | 'tarjetas';
  hacer: (a: AccionDeFila) => void;
  noSePudoTildar: (errores: ErroresDeFila) => void;
}) {
  const estado = estadoDeLaFila(f);
  const tocarLaCasilla = () => {
    const r = alTocarLaCasilla(f);
    if ('errores' in r) noSePudoTildar(r.errores);
    else hacer({ tipo: r.accion });
  };
  const casilla = (
    <View style={estilos.columnaCasilla}>
      <CasillaSola marcada={filaTildada(f)} onCambio={tocarLaCasilla} etiqueta={T.casillaDeLaSerie(f.setIndex, ejercicio)} pista={pistaDeLaCasilla(f)} />
    </View>
  );
  if (estado === 'quitada') {
    return (
      <View style={estilos.filaQuitada}>
        <View style={estilos.textosDeLaQuitada}>
          <Text style={estilos.textoQuitada}>{T.seQuita(f.setIndex)}</Text>
          {f.antes ? <Text style={estilos.valoresQuitados}>{textoCortoDeSerie(f.antes)}</Text> : null}
          <Boton texto={T.deshacer} tipo="enlace" icono="deshacer" onPress={() => hacer({ tipo: 'deshacer' })} />
        </View>
        {casilla}
      </View>
    );
  }
  const plan = placeholdersDeLaSerie(f.objetivo, f.unidad);
  const marca = [estado === 'cambiada' && f.antes ? T.antes(textoCortoDeSerie(f.antes)) : null, estado === 'sumada' ? T.nueva : null, filaComoElPlan(f) ? T.comoElPlan : null].filter((x): x is string => x !== null).join(' · ');
  const estiloDeFila = [estilos.fila, filaTildada(f) && estilos.filaTildada, (estado === 'cambiada' || estado === 'sumada') && estilos.filaCambiada, errores ? estilos.filaConError : null];
  if (disposicion === 'tarjetas') {
    return (
      <View style={estiloDeFila}>
        <View style={estilos.tituloDeLaTarjeta}>
          <Text style={estilos.numeroEnTarjeta}>{`${COPY_ENTRENAMIENTO.serie} ${numero(f.setIndex, 0)}`}</Text>
          <View style={estilos.espacio} />
          {casilla}
        </View>
        {CAMPOS.map(({ campo, teclado }) => (
          <Campo
            key={campo}
            etiqueta={campo === 'carga' ? `${COPY_ENTRENAMIENTO.carga} (${f.unidad})` : campo === 'repeticiones' ? COPY_ENTRENAMIENTO_POR_SERIE.columnaRepeticiones : COPY_ENTRENAMIENTO_POR_SERIE.rirTitulo}
            value={f.escrita[campo]}
            placeholder={plan[campo]}
            keyboardType={teclado}
            onChangeText={(texto) => hacer({ tipo: 'escribir', campo, texto })}
          />
        ))}
        {marca ? <Text style={estilos.marca}>{marca}</Text> : null}
        {errores ? <Aviso tipo="error" titulo={errores} /> : null}
      </View>
    );
  }
  return (
    <View style={estiloDeFila}>
      <View style={estilos.celdas}>
        <View style={estilos.celdaSerie}>
          <Text style={estilos.numeroDeSerie}>{numero(f.setIndex, 0)}</Text>
        </View>
        {CAMPOS.map(({ campo, teclado }) => (
          <Celda key={campo} valor={f.escrita[campo]} plan={plan[campo]} teclado={teclado} etiqueta={`${nombreDelCampo(campo, f, ejercicio, plan[campo])}${errores ? `. Revisá: ${errores}` : ''}`} conError={errores !== null} onCambiar={(texto) => hacer({ tipo: 'escribir', campo, texto })} />
        ))}
        {casilla}
      </View>
      {marca ? <Text style={estilos.marca}>{marca}</Text> : null}
      {errores ? <Aviso tipo="error" titulo={errores} /> : null}
    </View>
  );
}

/**
 * Una celda que se escribe. El plan de esa serie se ve en gris mientras está vacía: es un texto encima, que no recibe
 * toques ni entra en lo que se guarda.
 */
function Celda({ valor, plan, teclado, etiqueta, conError, onCambiar }: { valor: string; plan: string; teclado: KeyboardTypeOptions; etiqueta: string; conError: boolean; onCambiar: (texto: string) => void }) {
  return (
    <View style={[estilos.celda, conError && estilos.celdaConError]}>
      {valor === '' ? (
        <View style={estilos.capaDelPlan} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={[estilos.plan, plan === COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo && estilos.planSinObjetivo]} numberOfLines={2}>
            {plan}
          </Text>
        </View>
      ) : null}
      <TextInput value={valor} onChangeText={onCambiar} keyboardType={teclado} accessibilityLabel={etiqueta} style={estilos.entrada} selectTextOnFocus />
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  tarjeta: { borderRadius: 14, borderWidth: 1, borderColor: COLOR.borde, padding: 12, marginVertical: 6 },
  cabeza: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  datos: { flex: 1 },
  nombre: { fontSize: 18, fontWeight: '800', color: COLOR.texto },
  detalle: { fontSize: 14, lineHeight: 20, color: COLOR.tenue },
  cuenta: { fontSize: 16, fontWeight: '800', color: COLOR.texto, marginBottom: 2 },
  nota: { fontSize: 13, lineHeight: 18, color: COLOR.tenue, marginTop: 4 },
  encabezado: { flexDirection: 'row', gap: 6, paddingHorizontal: 6, marginTop: 6, marginBottom: 2 },
  columna: { fontSize: 14, fontWeight: '700', color: COLOR.tenue, textAlign: 'center' },
  columnaSerie: { width: 44 },
  columnaDato: { flex: 1 },
  // La casilla al final de la fila, con sus 44 dp de toque (la misma columna que en la sesión).
  columnaCasilla: { width: ANCHO_DE_LA_CASILLA_EN_LA_CORRECCION, alignItems: 'center', justifyContent: 'center' },
  // La fila tildada va en el azul elevado, como la registrada en la sesión; la cambiada o sumada lleva además el borde del
  // acento.
  fila: { borderRadius: 12, borderWidth: 2, borderColor: 'transparent', padding: 4, marginVertical: 2 },
  // Tildada: borde fino del acento, como en la sesión (Dirección, 2026-11-02); cambiada o sumada: el mismo borde, grueso.
  filaTildada: { backgroundColor: COLOR.superficieElevada, borderColor: COLOR.acento, borderWidth: 1, padding: 5 },
  filaCambiada: { borderColor: COLOR.acento, borderWidth: 2, padding: 4 },
  filaConError: { borderColor: COLOR.error },
  celdas: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  celdaSerie: { width: 44, alignItems: 'center', justifyContent: 'center', gap: 2 },
  numeroDeSerie: { fontSize: 18, fontWeight: '800', color: COLOR.texto },
  celda: { flex: 1, minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: COLOR.bordeControl, backgroundColor: COLOR.fondo, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  celdaConError: { borderColor: COLOR.error, borderWidth: 2 },
  capaDelPlan: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  plan: { fontSize: 16, color: COLOR.tenue, textAlign: 'center' },
  planSinObjetivo: { fontSize: 12, lineHeight: 15 },
  entrada: { alignSelf: 'stretch', minHeight: 46, fontSize: 18, fontWeight: '800', color: COLOR.texto, textAlign: 'center', paddingHorizontal: 2, paddingVertical: 0 },
  marca: { fontSize: 13, fontWeight: '700', color: COLOR.tenue, marginLeft: 50, marginTop: 2 },
  // La destildada: una línea punteada, con lo que se quita tachado, «Deshacer» y la casilla vacía al final.
  filaQuitada: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 8, paddingRight: 4, marginVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: COLOR.borde, borderStyle: 'dashed' },
  textosDeLaQuitada: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10 },
  textoQuitada: { fontSize: 15, fontWeight: '700', color: COLOR.texto },
  valoresQuitados: { flexShrink: 1, fontSize: 15, color: COLOR.tenue, textDecorationLine: 'line-through' },
  tituloDeLaTarjeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  numeroEnTarjeta: { fontSize: 16, fontWeight: '800', color: COLOR.texto },
  espacio: { flex: 1 },
}));
