/**
 * Nutrición · Hoy (WP-NUTRICION-RECETAS §9; DL-121; encargo de Dirección del 2026-10-05, §3 y §4), sobre API-ING-01.
 *
 * - **La fecha civil es la de la API**, y las comidas son las del plan, en fichas, con lo registrado marcado
 *   (`comidas-de-hoy.ts`). Si el plan tiene varios días, la persona elige cuál es hoy: BE no elige en silencio (DL-049).
 *   La elección es la misma de Inicio y de «Plan».
 * - **Por comida, el carrusel de sus opciones** (`carrusel-de-opciones.ts`; DL-194, A32-01, que vuelve sobre los
 *   segmentos de AV2-21): se desliza con imán y también con flechas, con «Opción n de m» y los puntitos; cada tarjeta, a
 *   todo el ancho, sin la vecina asomando. Con una sola opción, sin controles.
 * - **La opción** (A32-02): la foto grande a todo el ancho (sin foto, la miniatura de reemplazo de 72 dp al lado del
 *   nombre: el plato en una caja con el tinte del tema), el nombre con «Ver detalle», la franja de macros con sus íconos
 *   (A32-04; de las porciones del plan, una estimación, no lo consumido) y «Comí esta opción». Elegir no registra.
 * - **«Comí esta opción»** registra con el comando único (`registro-de-comidas.tsx`), con las cantidades sin confirmar:
 *   lo previsto nunca se convierte en consumido. Un doble toque o un reintento no duplican.
 * - **Con la comida registrada**, en lugar del carrusel: «Almuerzo registrado», la opción con su foto, «Cantidades sin
 *   confirmar» cuando corresponde, «Completar cantidades», «Ver o corregir registro», «Deshacer registro» y «Seguir con mi
 *   día».
 * - **«Comí algo diferente»** va debajo del carrusel, con la fecha y la comida.
 * - La opción a la vista, la comida y la altura se recuerdan al ir al detalle y volver (`useSeleccionRecordada`; la altura
 *   de las raíces, en App.tsx).
 * - Una escritura denegada retira el contenido (B10-06:1145-1148), como en el resto de la APK.
 */
import {
  COPY,
  COPY_ANTROPOMETRIA,
  COPY_NUTRICION,
  COPY_REGISTRO_DE_COMIDAS,
  textoDeComidaRegistrada,
  type HoyConOpcionesResponse,
  type OpcionConMacros,
  type RegistrarComidaRequest,
  type RegistroDeComida,
  type Resultado,
} from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, Text, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { api } from '../api';
import { anuncioDeLaOpcion, controlesDelCarrusel, desplazamientoDe, indiceDeLaOpcion, indiceDesdeDesplazamiento, indiceValido, medidasDelCarrusel, opcionesVistas, SEPARACION_ENTRE_TARJETAS } from '../carrusel-de-opciones';
import { intentoDeLaComida } from '../comando-de-registro';
import { comidaPedidaOElegida, comidaQueSeMuestra, comidaRegistrada, etiquetaDeLaComida, fichasPorFila, LETRA_DE_LA_FICHA, registroDeLaComida, RELLENO_DE_LA_FICHA, SEPARACION_DE_LAS_FICHAS } from '../comidas-de-hoy';
import { useDiaDeLaApi } from '../dia-de-la-api';
import { Cargando, ErrorConReintento, SinActualizar } from '../estados';
import { fechaLarga } from '../formato';
import { Icono } from '../icono';
import { Flecha, IconoDeCamara, IconoDePlato, IconoDeRegistrado, IconoSinRegistro } from '../iconos-de-nutricion';
import { ImagenDeMedio } from '../imagen-de-medio';
import { esIncierto, falloDe } from '../intento';
import { useLecturaRecordada, useSeleccionRecordada } from '../lecturas';
import { useMovimientoReducido } from '../movimiento-reducido';
import { useAccesoRetirado, useSesionPerdida, type Ir, type Salida } from '../navegacion';
import { CajaInformativa, FilaQueAbre, FranjaDeMacros } from '../piezas-de-nutricion';
import { ahoraEnElServidor, registrarComida, useDeshacer } from '../registro-de-comidas';
import { TEXTOS_DE_LA_VUELTA } from '../textos-de-la-vuelta';
import { Aviso, Boton, COLOR, EstadoVacio, estilosPorTema, Insignia, Parrafo, Superficie } from '../ui';

export type HoyConOpciones = HoyConOpcionesResponse['data'];
type Comida = HoyConOpciones['meals'][number];
type AlPerderLaSesion = (r: Resultado<unknown>) => boolean;
type AvisoDeHoy = { readonly tipo: 'exito' | 'error' | 'info'; readonly texto: string };

/**
 * «Hoy» con opciones (API-ING-01), con el día del plan elegido. La clave nombra el día civil de la API y el día del plan:
 * a la medianoche cambia y se vuelve a leer. La usan esta pestaña, el detalle de una opción y, desde DL-170 (AV2-13), las
 * comidas de Inicio: la misma lectura y la misma clave, así Inicio ve lo que se registró acá sin recargar.
 */
export function useLecturaDeHoyConOpciones(token: string, sesionPerdida: AlPerderLaSesion) {
  // El día del plan es la misma elección de Inicio y de «Plan» (API-NUT-14): se recuerda mientras dure la sesión.
  const [diaTipo, setDiaTipo] = useSeleccionRecordada<string | undefined>(token, 'hoy-nutricional:dia', undefined);
  const pedir = useCallback((): Promise<Resultado<HoyConOpcionesResponse>> => api.hoyConOpciones(token, diaTipo), [token, diaTipo]);
  const hoyDeLaApi = useDiaDeLaApi();
  const lectura = useLecturaRecordada(token, `hoy-con-opciones:${hoyDeLaApi}:${diaTipo ?? ''}`, pedir, sesionPerdida);
  return { ...lectura, setDiaTipo };
}

/** La lectura de «Hoy» para las pantallas de Nutrición, que reciben cómo salir si la sesión ya no sirve. */
export function useHoyConOpciones(token: string, salir: (m: Salida) => void) {
  const sesionPerdida = useSesionPerdida(salir);
  return { ...useLecturaDeHoyConOpciones(token, sesionPerdida), sesionPerdida };
}

export function HoyDeNutricion({
  token,
  salir,
  ir,
  subir,
  accion,
  comida,
  llevarA,
}: {
  token: string;
  salir: (m: Salida) => void;
  ir: Ir;
  /** Lleva la pantalla arriba, donde queda el aviso de una acción. */
  subir: () => void;
  /** Desde Inicio, «Registrar» abre Hoy en las comidas, o en la elección del día si hace falta (DL-117). */
  accion?: 'registrar';
  /** La comida de la ficha que se tocó en Inicio (AV2-14). */
  comida?: string;
  /** Lleva la pantalla a una altura medida desde el principio de esta pestaña. */
  llevarA?: (y: number) => void;
}) {
  const { r, cargar, sinActualizar, setDiaTipo, sesionPerdida } = useHoyConOpciones(token, salir);
  const { retirado, accesoRetirado } = useAccesoRetirado();
  // El aviso de una acción (deshacer, un plan que cambió) vive acá: sobrevive a que el día se vuelva a leer desde cero.
  const [aviso, setAviso] = useState<AvisoDeHoy | null>(null);
  const avisar = useCallback(
    (nuevo: AvisoDeHoy | null) => {
      setAviso(nuevo);
      if (nuevo) subir();
    },
    [subir],
  );

  // Una escritura denegada retira el contenido entero: queda el mismo estado neutral que con el acceso suspendido.
  if (retirado) {
    return (
      <Aviso tipo="info" titulo={COPY_NUTRICION.planNoDisponible}>
        <Boton texto={COPY_REGISTRO_DE_COMIDAS.irAVinculos} tipo="secundario" onPress={() => ir({ nombre: 'vinculos' })} />
      </Aviso>
    );
  }
  // Mientras la API confirma el acceso, la estructura sin valores.
  if (!r) return <Cargando forma="lista" />;
  // DL-115 · sin A3, «Hoy» no se lee: el aviso con el camino a Privacidad, no un error. Los registros siguen guardados.
  if (!r.ok && r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN') {
    return (
      <Aviso tipo="info" titulo={COPY_NUTRICION.hoyNecesitaA3}>
        <Boton texto={COPY_ANTROPOMETRIA.irAPrivacidad} tipo="secundario" onPress={() => ir({ nombre: 'privacidad' })} />
      </Aviso>
    );
  }
  if (!r.ok) return <ErrorConReintento sinConexion={r.tipo === 'RED'} onReintentar={() => void cargar()} />;
  return (
    <>
      <SinActualizar visible={sinActualizar} onReintentar={() => void cargar()} />
      {aviso ? <Aviso tipo={aviso.tipo} titulo={aviso.texto} /> : null}
      <DiaDeNutricion
        key={r.datos.data.date}
        hoy={r.datos.data}
        token={token}
        ir={ir}
        sesionPerdida={sesionPerdida}
        accesoRetirado={accesoRetirado}
        elegirDia={setDiaTipo}
        avisar={avisar}
        actualizar={(desdeCero) => void cargar(desdeCero ? { desdeCero: true } : undefined)}
        accion={accion}
        comidaPedida={comida}
        llevarA={llevarA}
      />
    </>
  );
}

function DiaDeNutricion({
  hoy,
  token,
  ir,
  sesionPerdida,
  accesoRetirado,
  elegirDia,
  avisar,
  actualizar,
  accion,
  comidaPedida,
  llevarA,
}: {
  hoy: HoyConOpciones;
  token: string;
  ir: Ir;
  sesionPerdida: AlPerderLaSesion;
  accesoRetirado: AlPerderLaSesion;
  elegirDia: (dia: string | undefined) => void;
  avisar: (aviso: AvisoDeHoy | null) => void;
  actualizar: (desdeCero: boolean) => void;
  accion?: 'registrar';
  comidaPedida?: string;
  llevarA?: (y: number) => void;
}) {
  const [elegida, setElegida] = useSeleccionRecordada<string | null>(token, `nutricion:comida:${hoy.date}`, null);
  // AV2-14: la comida que se tocó en Inicio, una vez. Si está en el plan de hoy, pasa a ser la elegida (y queda recordada).
  const pedida = useRef(comidaPedida ?? null);
  const elegidaAhora = comidaPedidaOElegida(pedida.current, elegida, hoy.meals);
  useEffect(() => {
    if (pedida.current && elegidaAhora === pedida.current && elegida !== pedida.current) setElegida(pedida.current);
    pedida.current = null;
    // Solo al abrir: después, la persona elige.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Lo registrado en esta pantalla se muestra enseguida, con lo que respondió la API, mientras «Hoy» se vuelve a leer.
  // Cuando llega la lectura nueva, manda la API: lo de acá se olvida (si se deshizo en otro lado, no queda a la vista).
  const [recientes, setRecientes] = useState<Readonly<Record<string, RegistroDeComida>>>({});
  useEffect(() => {
    setRecientes({});
  }, [hoy]);
  const registros = [...Object.values(recientes), ...hoy.records];
  const comidaId = comidaQueSeMuestra(hoy.meals, registros, elegidaAhora);
  const comida = hoy.meals.find((m) => m.mealId === comidaId) ?? null;

  // El pedido de Inicio se atiende una vez, cuando aparece dónde se registra.
  const pedidoAtendido = useRef(accion !== 'registrar');
  const alUbicarLasComidas = (y: number) => {
    if (pedidoAtendido.current) return;
    pedidoAtendido.current = true;
    setTimeout(() => llevarA?.(y - 8), 0);
  };

  const alRegistrar = (mealId: string, registro: RegistroDeComida, nombre: string) => {
    setRecientes((r) => ({ ...r, [mealId]: registro }));
    setElegida(mealId);
    avisar(null);
    AccessibilityInfo.announceForAccessibility(textoDeComidaRegistrada(nombre));
    actualizar(false);
  };
  const alDeshacer = (mealId: string) => {
    setRecientes((r) => Object.fromEntries(Object.entries(r).filter(([id]) => id !== mealId)));
    avisar({ tipo: 'exito', texto: COPY_REGISTRO_DE_COMIDAS.deshecho });
    actualizar(true);
  };

  const plan = hoy.plan;
  return (
    <View>
      <View style={estilos.filaDeLaFecha}>
        <Icono nombre="calendario" tamano={20} tono="acento" />
        <Text style={estilos.fecha} accessibilityRole="header">
          {fechaLarga(hoy.date)}
        </Text>
      </View>
      {/* Vacía: qué va a aparecer acá y el siguiente paso (vuelta 2), no solo que no hay plan. */}
      {hoy.planState === 'NO_ACTIVE_PLAN' ? <EstadoVacio icono="nutricion" {...TEXTOS_DE_LA_VUELTA.vacios.nutricionSinPlan} accion={{ texto: TEXTOS_DE_LA_VUELTA.vacios.nutricionSinPlan.accion, onPress: () => ir({ nombre: 'vinculos' }) }} /> : null}
      {hoy.planState === 'NOT_AVAILABLE' ? (
        <Aviso tipo="info" titulo={COPY_NUTRICION.planNoDisponible}>
          <Boton texto={COPY_REGISTRO_DE_COMIDAS.irAVinculos} tipo="secundario" onPress={() => ir({ nombre: 'vinculos' })} />
        </Aviso>
      ) : null}

      {plan && !hoy.selectedDayTypeId ? (
        <View onLayout={(e) => alUbicarLasComidas(e.nativeEvent.layout.y)}>
          <Text style={estilos.pregunta} accessibilityRole="header">
            {COPY_NUTRICION.elegiDiaTipo}
          </Text>
          {hoy.dayTypes.map((d) => (
            <Boton key={d.dayTypeId} texto={d.label} tipo="secundario" onPress={() => elegirDia(d.dayTypeId)} />
          ))}
        </View>
      ) : null}

      {plan && hoy.selectedDayTypeId ? (
        <View onLayout={(e) => alUbicarLasComidas(e.nativeEvent.layout.y)}>
          {hoy.dayTypes.length > 1 ? (
            <View style={estilos.diaDelPlan}>
              <Text style={estilos.textoDelDia}>{COPY_REGISTRO_DE_COMIDAS.diaDelPlan(hoy.dayTypes.find((d) => d.dayTypeId === hoy.selectedDayTypeId)?.label ?? '')}</Text>
              <Boton texto={COPY_REGISTRO_DE_COMIDAS.cambiarElDia} tipo="enlace" onPress={() => elegirDia(undefined)} />
            </View>
          ) : null}
          {hoy.meals.length === 0 ? <Parrafo tenue>{COPY_REGISTRO_DE_COMIDAS.sinComidas}</Parrafo> : null}
          {hoy.meals.length > 0 ? <FichasDeComidas comidas={hoy.meals} registros={registros} elegida={comidaId} alElegir={setElegida} /> : null}
          {comida ? (
            <ComidaDeHoy
              key={comida.mealId}
              hoy={hoy}
              planId={plan.planId}
              diaTipoId={hoy.selectedDayTypeId}
              comida={comida}
              registro={registroDeLaComida(comida, registros)}
              token={token}
              ir={ir}
              sesionPerdida={sesionPerdida}
              accesoRetirado={accesoRetirado}
              alRegistrar={(registro) => alRegistrar(comida.mealId, registro, comida.label)}
              alDeshacer={() => alDeshacer(comida.mealId)}
              alPlanCambio={() => {
                avisar({ tipo: 'info', texto: COPY_NUTRICION.planCambio });
                actualizar(false);
              }}
              alActualizar={() => actualizar(true)}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Las comidas del día, en fichas: la elegida, llena; la registrada, con su tilde. El lector dice cuál y si tiene registro. */
function FichasDeComidas({ comidas, registros, elegida, alElegir }: { comidas: readonly Comida[]; registros: readonly RegistroDeComida[]; elegida: string | null; alElegir: (mealId: string) => void }) {
  const { fontScale } = useWindowDimensions();
  const [ancho, setAncho] = useState(0);
  // Todas en una fila si entran; si no, filas parejas (comidas-de-hoy.ts). El ancho de cada una sale de la fila medida.
  const porFila = fichasPorFila(ancho, comidas.map((c) => c.label), fontScale);
  const anchoDeFicha = ancho > 0 ? Math.floor((ancho - SEPARACION_DE_LAS_FICHAS * (porFila - 1)) / porFila) : undefined;
  return (
    <View style={estilos.fichas} onLayout={(e) => setAncho(e.nativeEvent.layout.width)} accessibilityRole="tablist" accessibilityLabel={COPY_REGISTRO_DE_COMIDAS.comidasDelDia}>
      {comidas.map((c) => {
        const registrada = comidaRegistrada(c, registros);
        const laElegida = c.mealId === elegida;
        return (
          <Pressable
            key={c.mealId}
            accessibilityRole="tab"
            accessibilityState={{ selected: laElegida }}
            accessibilityLabel={etiquetaDeLaComida(c.label, registrada)}
            onPress={() => alElegir(c.mealId)}
            style={({ pressed }) => [estilos.ficha, { width: anchoDeFicha }, laElegida && estilos.fichaElegida, pressed && estilos.presionada]}
          >
            <Text style={[estilos.textoDeFicha, laElegida && estilos.textoDeFichaElegida]}>{c.label}</Text>
            {/* Lo registrado, con un tilde en la esquina: no le quita lugar al nombre. El lector lo dice en la etiqueta. */}
            {registrada ? (
              <View style={estilos.marcaDeFicha}>
                <IconoDeRegistrado color={COLOR.botonTexto} fondo={COLOR.acento} tamano={18} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function ComidaDeHoy({
  hoy,
  planId,
  diaTipoId,
  comida,
  registro,
  token,
  ir,
  sesionPerdida,
  accesoRetirado,
  alRegistrar,
  alDeshacer,
  alPlanCambio,
  alActualizar,
}: {
  hoy: HoyConOpciones;
  planId: string;
  diaTipoId: string;
  comida: Comida;
  registro: RegistroDeComida | null;
  token: string;
  ir: Ir;
  sesionPerdida: AlPerderLaSesion;
  accesoRetirado: AlPerderLaSesion;
  alRegistrar: (registro: RegistroDeComida) => void;
  alDeshacer: () => void;
  alPlanCambio: () => void;
  alActualizar: () => void;
}) {
  if (registro || comida.recordId) {
    return <ComidaRegistrada token={token} comida={comida} registro={registro} sesionPerdida={sesionPerdida} ir={ir} alDeshacer={alDeshacer} alActualizar={alActualizar} />;
  }
  return (
    <OpcionesDeLaComida
      fecha={hoy.date}
      planId={planId}
      diaTipoId={diaTipoId}
      comida={comida}
      token={token}
      ir={ir}
      sesionPerdida={sesionPerdida}
      accesoRetirado={accesoRetirado}
      alRegistrar={alRegistrar}
      alPlanCambio={alPlanCambio}
      alActualizar={alActualizar}
    />
  );
}

// ─── Sin registro: el carrusel ───────────────────────────────────────────────────────────────────

function OpcionesDeLaComida({
  fecha,
  planId,
  diaTipoId,
  comida,
  token,
  ir,
  sesionPerdida,
  accesoRetirado,
  alRegistrar,
  alPlanCambio,
  alActualizar,
}: {
  fecha: string;
  planId: string;
  diaTipoId: string;
  comida: Comida;
  token: string;
  ir: Ir;
  sesionPerdida: AlPerderLaSesion;
  accesoRetirado: AlPerderLaSesion;
  alRegistrar: (registro: RegistroDeComida) => void;
  alPlanCambio: () => void;
  alActualizar: () => void;
}) {
  const [registrando, setRegistrando] = useState<string | null>(null);
  const [fallo, setFallo] = useState<{ readonly texto: string; readonly opcion: OpcionConMacros | null } | null>(null);
  // Una respuesta que llega después de irse de la pantalla no la toca: el comando conserva el intento.
  const montada = useRef(true);
  useEffect(
    () => () => {
      montada.current = false;
    },
    [],
  );

  async function comi(opcion: OpcionConMacros) {
    const cuerpo: RegistrarComidaRequest = {
      kind: 'PLAN_OPTION',
      activePlanId: planId,
      dayTypeId: diaTipoId,
      mealId: comida.mealId,
      optionId: opcion.optionId,
      occurredAt: ahoraEnElServidor(),
      // El registro rápido: la persona dijo qué opción comió, no cuánto. Lo previsto no pasa a consumido.
      consumption: { status: 'UNCONFIRMED' },
      observation: null,
    };
    setRegistrando(opcion.optionId);
    setFallo(null);
    const r = await registrarComida(token, intentoDeLaComida(token, fecha, comida.mealId), cuerpo);
    if (!montada.current) return;
    setRegistrando(null);
    if (sesionPerdida(r)) return;
    if (r.ok) return alRegistrar(r.datos.data);
    // 404 no revelador a una escritura: la pestaña entera retira el contenido.
    if (accesoRetirado(r)) return;
    if (esIncierto(r)) return setFallo({ texto: COPY_NUTRICION.noPudimosConfirmar, opcion });
    if (r.tipo === 'API' && r.codigo === 'EXECUTION_ALREADY_REGISTERED_INCOMPATIBLY') {
      setFallo({ texto: COPY_NUTRICION.yaRegistrada, opcion: null });
      return alActualizar();
    }
    if (r.tipo === 'API' && r.codigo === 'ACTIVE_PLAN_REQUIRED') return alPlanCambio();
    setFallo({ texto: falloDe(r).mensaje, opcion: null });
  }

  return (
    <View>
      <Superficie style={estilos.panel}>
        <View style={estilos.cabezaDeComida}>
          <Text style={estilos.nombreDeComida} accessibilityRole="header">
            {comida.label}
          </Text>
          <View style={estilos.estadoDeComida}>
            <IconoSinRegistro color={COLOR.tenue} />
            <Text style={estilos.textoDeEstado}>{COPY_REGISTRO_DE_COMIDAS.sinRegistro}</Text>
          </View>
        </View>
        {comida.options.length === 0 ? (
          <Parrafo tenue>{COPY_REGISTRO_DE_COMIDAS.sinOpciones}</Parrafo>
        ) : (
          <CarruselDeOpciones
            token={token}
            fecha={fecha}
            comida={comida}
            registrando={registrando}
            sesionPerdida={sesionPerdida}
            alVerDetalle={(o) => ir({ nombre: 'opcion-de-comida', id: o.optionId, comidaId: comida.mealId })}
            alComer={(o) => void comi(o)}
          />
        )}
        {fallo ? (
          <Aviso tipo="error" titulo={fallo.texto}>
            {fallo.opcion ? <Boton texto={COPY.reintentar} tipo="secundario" onPress={() => fallo.opcion && void comi(fallo.opcion)} ocupado={registrando !== null} /> : null}
          </Aviso>
        ) : null}
      </Superficie>
      <FilaQueAbre
        destacada
        texto={COPY_REGISTRO_DE_COMIDAS.comiAlgoDiferente}
        detalle={COPY_REGISTRO_DE_COMIDAS.agregarFotoODescribir}
        icono={<IconoDeCamara color={COLOR.acento} />}
        onPress={() => ir({ nombre: 'comida-diferente', comidaId: comida.mealId, comida: comida.label, fecha, planId, diaTipoId })}
      />
    </View>
  );
}

/** La proporción de la foto de una opción: a todo el ancho, como antes de AV2-21 (A32-02, con A32-D02). */
const PROPORCION_DE_LA_FOTO = 16 / 10;

/**
 * El carrusel de las opciones de una comida (DL-194, A32-01; la lógica, en `carrusel-de-opciones.ts`). Cada tarjeta ocupa
 * todo el ancho y se detiene entera con el imán (`snapToInterval`): la vecina no asoma (la queja del 2026-10-29). Arriba,
 * las flechas «Opción anterior» y «Opción siguiente», «Opción n de m» y los puntitos, para quien no descubre el gesto.
 * Cambiar de opción no registra. La opción a la vista se recuerda por su identidad, se anuncia «Opción n de m» al
 * cambiar y solo ella pide su imagen. Con una sola opción, ningún control y sin desplazar.
 */
function CarruselDeOpciones({
  token,
  fecha,
  comida,
  registrando,
  sesionPerdida,
  alVerDetalle,
  alComer,
}: {
  token: string;
  fecha: string;
  comida: Comida;
  registrando: string | null;
  sesionPerdida: AlPerderLaSesion;
  alVerDetalle: (opcion: OpcionConMacros) => void;
  alComer: (opcion: OpcionConMacros) => void;
}) {
  const opciones = comida.options;
  const total = opciones.length;
  const movimientoReducido = useMovimientoReducido();
  const [recordada, setRecordada] = useSeleccionRecordada<string | null>(token, `nutricion:opcion:${fecha}:${comida.mealId}`, null);
  const indice = indiceValido(indiceDeLaOpcion(opciones, recordada), total);
  const [ancho, setAncho] = useState(0);
  const lista = useRef<ScrollView>(null);
  const medidas = medidasDelCarrusel(ancho, total);
  const controles = controlesDelCarrusel(indice, total);
  // Solo la opción a la vista pide su imagen; la que ya estuvo a la vista la conserva (cada acceso queda en la API).
  const vistas = useRef<ReadonlySet<string>>(new Set());
  vistas.current = opcionesVistas(vistas.current, opciones[indice]?.optionId);
  // Donde empieza el carrusel: la opción recordada, sin animación. Se fija una vez, al medir.
  const inicio = useRef<number | null>(null);
  if (ancho > 0 && inicio.current === null) inicio.current = desplazamientoDe(indice, medidas.paso, total);
  const indiceActual = useRef(indice);
  indiceActual.current = indice;

  const elegir = (i: number, desplazar: boolean) => {
    const j = indiceValido(i, total);
    if (j !== indiceActual.current) {
      setRecordada(opciones[j]?.optionId ?? null);
      const anuncio = anuncioDeLaOpcion(j, total);
      if (anuncio) AccessibilityInfo.announceForAccessibility(anuncio);
    }
    if (desplazar) lista.current?.scrollTo({ x: desplazamientoDe(j, medidas.paso, total), animated: !movimientoReducido });
  };

  // Al medir (y si cambia el ancho), la tarjeta elegida queda alineada, sin animación.
  useEffect(() => {
    if (medidas.paso > 0) lista.current?.scrollTo({ x: desplazamientoDe(indiceActual.current, medidas.paso, total), animated: false });
  }, [medidas.paso, total]);

  // La opción cambia cuando el imán dejó una tarjeta entera a la vista: mientras se desliza, ni el contador ni el anuncio.
  const alDetenerse = (e: NativeSyntheticEvent<NativeScrollEvent>) => elegir(indiceDesdeDesplazamiento(e.nativeEvent.contentOffset.x, medidas.paso, total), false);

  if (total === 0) return null;
  return (
    <View>
      {controles.contador && controles.anterior && controles.siguiente ? (
        <View style={estilos.controles}>
          <BotonDeFlecha hacia="izquierda" texto={controles.anterior.etiqueta} habilitado={controles.anterior.habilitada} onPress={() => elegir(indice - 1, true)} />
          <View style={estilos.centroDeLosControles}>
            <Text style={estilos.contador}>{controles.contador}</Text>
            <View style={estilos.puntos} accessible={false} importantForAccessibility="no-hide-descendants">
              {controles.puntos.map((lleno, k) => (
                <View key={opciones[k]?.optionId ?? k} style={[estilos.punto, lleno && estilos.puntoElegido]} />
              ))}
            </View>
          </View>
          <BotonDeFlecha hacia="derecha" texto={controles.siguiente.etiqueta} habilitado={controles.siguiente.habilitada} onPress={() => elegir(indice + 1, true)} />
        </View>
      ) : null}
      <View onLayout={(e) => setAncho(Math.floor(e.nativeEvent.layout.width))}>
        {ancho > 0 ? (
          <ScrollView
            ref={lista}
            horizontal
            accessibilityLabel={COPY_REGISTRO_DE_COMIDAS.opcionesDe(comida.label)}
            showsHorizontalScrollIndicator={false}
            scrollEnabled={total > 1}
            snapToInterval={total > 1 ? medidas.paso : undefined}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            nestedScrollEnabled
            contentOffset={{ x: inicio.current ?? 0, y: 0 }}
            onMomentumScrollEnd={alDetenerse}
          >
            {opciones.map((o, i) => (
              <View
                key={o.optionId}
                style={[estilos.lugarDeTarjeta, { width: medidas.anchoDeTarjeta, marginRight: i < total - 1 ? SEPARACION_ENTRE_TARJETAS : 0 }]}
                // Solo la tarjeta a la vista la recorre el lector: las otras se alcanzan con las flechas.
                importantForAccessibility={i === indice ? 'auto' : 'no-hide-descendants'}
                accessibilityElementsHidden={i !== indice}
              >
                <TarjetaDeOpcion
                  token={token}
                  opcion={o}
                  cargarImagen={vistas.current.has(o.optionId)}
                  sesionPerdida={sesionPerdida}
                  registrando={registrando === o.optionId}
                  otraRegistrando={registrando !== null && registrando !== o.optionId}
                  alVerDetalle={() => alVerDetalle(o)}
                  alComer={() => alComer(o)}
                />
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Una opción del carrusel (A32-02): la foto grande a todo el ancho, «como estaba antes», que TalkBack llama «Imagen de
 * referencia». Sin foto, la miniatura de reemplazo de 72 dp al lado del nombre (hallazgo 13 de la 0.26), no un marco
 * grande vacío: el «hueco enorme» del 2026-10-29 era eso. Debajo, el nombre con «Ver detalle» al lado, «Estimación del plan» en `tenue` (no se toca), los macros con
 * sus íconos y «Comí esta opción».
 */
function TarjetaDeOpcion({
  token,
  opcion,
  cargarImagen,
  sesionPerdida,
  registrando,
  otraRegistrando,
  alVerDetalle,
  alComer,
}: {
  token: string;
  opcion: OpcionConMacros;
  cargarImagen: boolean;
  sesionPerdida: AlPerderLaSesion;
  registrando: boolean;
  otraRegistrando: boolean;
  alVerDetalle: () => void;
  alComer: () => void;
}) {
  const mediaId = opcion.image?.mediaId ?? null;
  return (
    <View style={estilos.opcion}>
      {mediaId ? (
        <ImagenDeMedio token={token} mediaId={mediaId} cargar={cargarImagen} sesionPerdida={sesionPerdida} rotulo={COPY_REGISTRO_DE_COMIDAS.imagenDeReferencia} proporcion={PROPORCION_DE_LA_FOTO} rotuloVisible={false} liviana />
      ) : null}
      <View style={estilos.cabezaDeOpcion}>
        {mediaId ? null : <MiniaturaSinFoto />}
        <View style={estilos.textosDeOpcion}>
          <Text style={estilos.nombreDeOpcion}>{opcion.label}</Text>
          <Text style={estilos.estimacion}>{COPY_REGISTRO_DE_COMIDAS.estimacionDelPlan}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`${COPY_REGISTRO_DE_COMIDAS.verDetalle}: ${opcion.label}`} onPress={alVerDetalle} hitSlop={4} style={({ pressed }) => [estilos.verDetalle, pressed && estilos.presionada]}>
          <Text style={estilos.textoVerDetalle}>{COPY_REGISTRO_DE_COMIDAS.verDetalle}</Text>
          <Flecha color={COLOR.acento} hacia="derecha" tamano={18} />
        </Pressable>
      </View>
      {/* Las tarjetas miden lo mismo: lo que sobra va antes de los macros, que quedan alineados abajo con el botón. */}
      <View style={estilos.empuje} />
      <FranjaDeMacros nutrientes={opcion.planned} />
      <Boton texto={registrando ? COPY_REGISTRO_DE_COMIDAS.guardando : COPY_REGISTRO_DE_COMIDAS.comiEstaOpcion} onPress={alComer} ocupado={registrando} deshabilitado={otraRegistrando} />
    </View>
  );
}

/** Una flecha del carrusel: 48 dp de toque, con su nombre para el lector, y deshabilitada en el extremo. */
function BotonDeFlecha({ hacia, texto, habilitado, onPress }: { hacia: 'izquierda' | 'derecha'; texto: string; habilitado: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityState={{ disabled: !habilitado }}
      disabled={!habilitado}
      onPress={onPress}
      style={({ pressed }) => [estilos.flecha, !habilitado && estilos.flechaDeshabilitada, pressed && estilos.presionada]}
    >
      <Flecha color={habilitado ? COLOR.acento : COLOR.tenue} hacia={hacia} />
    </Pressable>
  );
}

/** El lado de la miniatura de reemplazo de una opción sin foto, en dp (AV2-21). */
const TAMANO_DE_LA_MINIATURA = 72;

/**
 * La miniatura de una opción sin foto (hallazgo 13 de la 0.26): el plato en `azul` dentro de una caja con el tinte
 * `iconoFondo` del tema, como la caja del ícono de las tarjetas (AV2-T25), con el radio del marco de la foto. Es
 * decoración: el lector de pantalla no la recorre, y no dice «sin imagen» (el nombre de la opción alcanza).
 */
function MiniaturaSinFoto() {
  return (
    <View style={estilos.miniaturaSinFoto} accessible={false} importantForAccessibility="no-hide-descendants">
      <IconoDePlato color={COLOR.azul} tamano={36} />
    </View>
  );
}

// ─── Con registro ────────────────────────────────────────────────────────────────────────────────

/**
 * La comida registrada: lo que se eligió, con su foto, y qué se sabe de las cantidades. Los macros previstos no se
 * muestran como consumidos. Una comida diferente dice «Macros sin calcular».
 */
function ComidaRegistrada({
  token,
  comida,
  registro,
  sesionPerdida,
  ir,
  alDeshacer,
  alActualizar,
}: {
  token: string;
  comida: Comida;
  registro: RegistroDeComida | null;
  sesionPerdida: AlPerderLaSesion;
  ir: Ir;
  alDeshacer: () => void;
  alActualizar: () => void;
}) {
  const { width, fontScale } = useWindowDimensions();
  const deshacer = useDeshacer({ token, registro, sesionPerdida, alDeshacer, alActualizar });
  const deUnaOpcion = registro?.kind === 'PLAN_OPTION';
  const opcion = registro?.option ?? null;
  const posicion = opcion ? comida.options.findIndex((o) => o.optionId === opcion.optionId) : -1;
  const fotoId = deUnaOpcion ? (opcion?.image?.mediaId ?? null) : (registro?.evidence[0]?.mediaId ?? null);
  // La opción muestra su imagen o el respaldo; una comida diferente sin foto no muestra un marco vacío.
  const conImagen = deUnaOpcion || fotoId !== null;
  // Con letra grande o en un teléfono angosto, la imagen va debajo del texto.
  const apilada = fontScale >= 1.3 || width < 380;
  const estado = registro?.consumption?.status ?? null;
  const registroId = registro?.recordId ?? comida.recordId;
  const titular = textoDeComidaRegistrada(comida.label);
  return (
    <View>
      <View style={estilos.titular} accessible accessibilityRole="header" accessibilityLabel={titular}>
        <IconoDeRegistrado color={COLOR.botonTexto} fondo={COLOR.acento} tamano={34} />
        <Text style={estilos.textoDelTitular}>{titular}</Text>
      </View>
      {registro ? (
        <Superficie style={[estilos.tarjetaRegistrada, apilada && estilos.tarjetaApilada]}>
          <View style={estilos.textosRegistrados}>
            <Text style={estilos.nombreRegistrado}>{deUnaOpcion ? (opcion?.label ?? comida.label) : COPY_REGISTRO_DE_COMIDAS.comisteAlgoDiferente}</Text>
            {deUnaOpcion && posicion >= 0 && comida.options.length > 1 ? <Text style={estilos.posicion}>{COPY_REGISTRO_DE_COMIDAS.opcionDe(posicion + 1, comida.options.length)}</Text> : null}
            {!deUnaOpcion && registro.description ? <Text style={estilos.descripcion}>{registro.description}</Text> : null}
            {!deUnaOpcion && registro.approximateQuantity ? (
              <Text style={estilos.posicion}>{`${COPY_REGISTRO_DE_COMIDAS.cantidadAproximadaInformada}: ${registro.approximateQuantity}`}</Text>
            ) : null}
            <Insignia texto={COPY_REGISTRO_DE_COMIDAS.registrado} hecha etiqueta={comida.label} />
          </View>
          {conImagen ? (
            <View style={apilada ? estilos.imagenApilada : estilos.imagenAlLado}>
              <ImagenDeMedio
                token={token}
                mediaId={fotoId}
                sesionPerdida={sesionPerdida}
                rotulo={deUnaOpcion ? COPY_REGISTRO_DE_COMIDAS.imagenDeReferencia : COPY_REGISTRO_DE_COMIDAS.tuFoto}
                proporcion={apilada ? 16 / 10 : 4 / 3}
                respaldoCompacto={!apilada}
                liviana
              />
            </View>
          ) : null}
        </Superficie>
      ) : null}
      {deUnaOpcion && estado === 'UNCONFIRMED' ? <CajaInformativa titulo={COPY_REGISTRO_DE_COMIDAS.cantidadesSinConfirmar} texto={COPY_REGISTRO_DE_COMIDAS.cantidadesSinConfirmarDetalle} /> : null}
      {deUnaOpcion && estado !== null && estado !== 'UNCONFIRMED' ? <CajaInformativa titulo={COPY_REGISTRO_DE_COMIDAS.estadoDeCantidades[estado]} /> : null}
      {registro && !deUnaOpcion ? <CajaInformativa titulo={COPY_REGISTRO_DE_COMIDAS.macrosSinCalcular} /> : null}
      {registro && deUnaOpcion && estado === 'UNCONFIRMED' && opcion ? (
        <Boton texto={COPY_REGISTRO_DE_COMIDAS.completarCantidades} onPress={() => ir({ nombre: 'opcion-de-comida', id: opcion.optionId, comidaId: comida.mealId, registroId: registro.recordId })} />
      ) : null}
      {registroId ? <FilaQueAbre texto={COPY_REGISTRO_DE_COMIDAS.verOCorregir} onPress={() => ir({ nombre: 'registro-nutricional', id: registroId })} /> : null}
      {registro ? <Boton texto={COPY_REGISTRO_DE_COMIDAS.deshacer} tipo="enlace" icono="deshacer" onPress={deshacer.abrir} /> : null}
      <View style={estilos.separador} />
      <FilaQueAbre texto={COPY_REGISTRO_DE_COMIDAS.seguirConMiDia} onPress={() => ir({ nombre: 'inicio' })} />
      {deshacer.dialogo}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  // La fecha con el calendario al lado (PA-06): el margen va en la fila.
  filaDeLaFecha: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 6 },
  fecha: { flexShrink: 1, fontSize: 19, lineHeight: 25, fontWeight: '800', color: COLOR.texto },
  pregunta: { fontSize: 16, fontWeight: '700', color: COLOR.texto, marginTop: 4 },
  diaDelPlan: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12 },
  textoDelDia: { fontSize: 15, lineHeight: 21, color: COLOR.tenue },
  // El margen de arriba deja lugar al tilde de la esquina.
  fichas: { flexDirection: 'row', flexWrap: 'wrap', gap: SEPARACION_DE_LAS_FICHAS, marginTop: 12, marginBottom: 8 },
  ficha: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: RELLENO_DE_LA_FICHA / 2,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLOR.borde,
    backgroundColor: COLOR.superficie,
  },
  fichaElegida: { backgroundColor: COLOR.botonFondo, borderColor: COLOR.botonFondo },
  textoDeFicha: { fontSize: LETRA_DE_LA_FICHA, lineHeight: 19, fontWeight: '700', color: COLOR.texto, textAlign: 'center' },
  textoDeFichaElegida: { color: COLOR.botonTexto, fontWeight: '800' },
  // Sobre la esquina, con un aro del color del fondo que la separa de la ficha.
  marcaDeFicha: { position: 'absolute', top: -7, right: -7, borderRadius: 11, borderWidth: 2, borderColor: COLOR.fondo, backgroundColor: COLOR.fondo },
  presionada: { opacity: 0.8 },
  panel: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 16, padding: 10, marginTop: 6 },
  cabezaDeComida: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 12, marginBottom: 8, paddingHorizontal: 4 },
  nombreDeComida: { fontSize: 19, lineHeight: 25, fontWeight: '800', color: COLOR.texto },
  estadoDeComida: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textoDeEstado: { fontSize: 14, lineHeight: 19, color: COLOR.tenue },
  // Las flechas, «Opción n de m» y los puntitos, en una sola fila arriba de la tarjeta (A32-01).
  controles: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBottom: 6 },
  centroDeLosControles: { flexShrink: 1, alignItems: 'center', gap: 4 },
  contador: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: COLOR.texto, textAlign: 'center' },
  flecha: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  flechaDeshabilitada: { opacity: 0.45 },
  puntos: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  punto: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLOR.borde },
  puntoElegido: { backgroundColor: COLOR.acento },
  // Cada tarjeta, a todo el ancho y del alto de la más alta: lo que sobra va antes de los macros (`empuje`).
  lugarDeTarjeta: { alignSelf: 'stretch' },
  // La opción va directo en la tarjeta de la comida (AV2-21): sin otra tarjeta adentro.
  opcion: { flex: 1, paddingHorizontal: 4 },
  empuje: { flexGrow: 1 },
  // Del radio del marco de la foto (`imagen-de-medio.tsx`), con el tinte de la caja del ícono.
  miniaturaSinFoto: { width: TAMANO_DE_LA_MINIATURA, height: TAMANO_DE_LA_MINIATURA, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.iconoFondo },
  cabezaDeOpcion: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 2 },
  textosDeOpcion: { flex: 1 },
  nombreDeOpcion: { fontSize: 18, lineHeight: 24, fontWeight: '800', color: COLOR.texto },
  // «Estimación del plan» no se toca: en `tenue`, no en el cian de lo que se toca (AV2-21).
  estimacion: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: COLOR.tenue, marginTop: 2 },
  // «Ver detalle», al lado del nombre: 48 dp de toque sin otra fila (A32-D04).
  verDetalle: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 48, paddingLeft: 4 },
  textoVerDetalle: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: COLOR.acento },
  titular: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 8 },
  textoDelTitular: { flex: 1, fontSize: 23, lineHeight: 29, fontWeight: '800', color: COLOR.texto },
  tarjetaRegistrada: { flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: COLOR.borde, borderRadius: 16, padding: 12 },
  tarjetaApilada: { flexDirection: 'column-reverse' },
  textosRegistrados: { flex: 1, justifyContent: 'center' },
  nombreRegistrado: { fontSize: 19, lineHeight: 25, fontWeight: '800', color: COLOR.texto },
  posicion: { fontSize: 15, lineHeight: 21, color: COLOR.tenue, marginTop: 2 },
  descripcion: { fontSize: 16, lineHeight: 22, color: COLOR.texto, marginTop: 4 },
  imagenAlLado: { flex: 1, justifyContent: 'center' },
  imagenApilada: { alignSelf: 'stretch' },
  separador: { height: 1, backgroundColor: COLOR.borde, marginVertical: 6 },
}));
