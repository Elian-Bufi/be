/**
 * Nutrición · Hoy (WP-NUTRICION-RECETAS §9; DL-121; encargo de Dirección del 2026-10-05, §3 y §4), sobre API-ING-01.
 *
 * - **La fecha civil es la de la API**, y las comidas son las del plan, en fichas, con lo registrado marcado
 *   (`comidas-de-hoy.ts`). Si el plan tiene varios días, la persona elige cuál es hoy: BE no elige en silencio (DL-049).
 *   La elección es la misma de Inicio y de «Plan».
 * - **Por comida, un carrusel manual de sus opciones** (`carrusel-de-opciones.ts`): se ve una parte de la tarjeta
 *   siguiente, con «Opción n de m» y flechas accesibles, sin avance automático. Con una sola opción, sin controles. Solo
 *   la tarjeta a la vista la recorre el lector de pantalla.
 * - **Cada tarjeta:** la imagen de referencia o el ícono de respaldo, el nombre, la franja de macros de las porciones del
 *   plan (una estimación, no lo consumido), «Ver detalle» y «Comí esta opción». Deslizar no registra.
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
import { controlesDelCarrusel, desplazamientoDe, indiceDeLaOpcion, indiceDesdeDesplazamiento, indiceValido, medidasDelCarrusel, SEPARACION_ENTRE_TARJETAS } from '../carrusel-de-opciones';
import { intentoDeLaComida } from '../comando-de-registro';
import { comidaQueSeMuestra, comidaRegistrada, etiquetaDeLaComida, fichasPorFila, LETRA_DE_LA_FICHA, registroDeLaComida, RELLENO_DE_LA_FICHA, SEPARACION_DE_LAS_FICHAS } from '../comidas-de-hoy';
import { useDiaDeLaApi } from '../dia-de-la-api';
import { Cargando, ErrorConReintento, SinActualizar } from '../estados';
import { fechaLarga } from '../formato';
import { Flecha, IconoDeCamara, IconoDeRegistrado, IconoSinRegistro } from '../iconos-de-nutricion';
import { ImagenDeMedio } from '../imagen-de-medio';
import { esIncierto, falloDe } from '../intento';
import { useLecturaRecordada, useSeleccionRecordada } from '../lecturas';
import { useAccesoRetirado, useSesionPerdida, type Ir, type Salida } from '../navegacion';
import { CajaInformativa, FilaQueAbre, FranjaDeMacros } from '../piezas-de-nutricion';
import { ahoraEnElServidor, registrarComida, useDeshacer } from '../registro-de-comidas';
import { Aviso, Boton, COLOR, estilosPorTema, Insignia, Parrafo } from '../ui';

export type HoyConOpciones = HoyConOpcionesResponse['data'];
type Comida = HoyConOpciones['meals'][number];
type AlPerderLaSesion = (r: Resultado<unknown>) => boolean;
type AvisoDeHoy = { readonly tipo: 'exito' | 'error' | 'info'; readonly texto: string };

/**
 * «Hoy» con opciones (API-ING-01), con el día del plan elegido. La clave nombra el día civil de la API y el día del plan:
 * a la medianoche cambia y se vuelve a leer. La usan esta pestaña y el detalle de una opción.
 */
export function useHoyConOpciones(token: string, salir: (m: Salida) => void) {
  const sesionPerdida = useSesionPerdida(salir);
  // El día del plan es la misma elección de Inicio y de «Plan» (API-NUT-14): se recuerda mientras dure la sesión.
  const [diaTipo, setDiaTipo] = useSeleccionRecordada<string | undefined>(token, 'hoy-nutricional:dia', undefined);
  const pedir = useCallback((): Promise<Resultado<HoyConOpcionesResponse>> => api.hoyConOpciones(token, diaTipo), [token, diaTipo]);
  const hoyDeLaApi = useDiaDeLaApi();
  const lectura = useLecturaRecordada(token, `hoy-con-opciones:${hoyDeLaApi}:${diaTipo ?? ''}`, pedir, sesionPerdida);
  return { ...lectura, setDiaTipo, sesionPerdida };
}

export function HoyDeNutricion({
  token,
  salir,
  ir,
  subir,
  accion,
  llevarA,
}: {
  token: string;
  salir: (m: Salida) => void;
  ir: Ir;
  /** Lleva la pantalla arriba, donde queda el aviso de una acción. */
  subir: () => void;
  /** Desde Inicio, «Registrar» abre Hoy en las comidas, o en la elección del día si hace falta (DL-117). */
  accion?: 'registrar';
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
  llevarA?: (y: number) => void;
}) {
  const [elegida, setElegida] = useSeleccionRecordada<string | null>(token, `nutricion:comida:${hoy.date}`, null);
  // Lo registrado en esta pantalla se muestra enseguida, con lo que respondió la API, mientras «Hoy» se vuelve a leer.
  // Cuando llega la lectura nueva, manda la API: lo de acá se olvida (si se deshizo en otro lado, no queda a la vista).
  const [recientes, setRecientes] = useState<Readonly<Record<string, RegistroDeComida>>>({});
  useEffect(() => {
    setRecientes({});
  }, [hoy]);
  const registros = [...Object.values(recientes), ...hoy.records];
  const comidaId = comidaQueSeMuestra(hoy.meals, registros, elegida);
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
      <Text style={estilos.fecha} accessibilityRole="header">
        {fechaLarga(hoy.date)}
      </Text>
      {hoy.planState === 'NO_ACTIVE_PLAN' ? <Aviso tipo="info" titulo={COPY_NUTRICION.sinPlanAsesorado} /> : null}
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
      <View style={estilos.panel}>
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
          <Carrusel
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
      </View>
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

/**
 * El carrusel manual. El ancho de cada tarjeta deja ver una parte de la siguiente; cada gesto se detiene en una tarjeta
 * (`snapToInterval`), y las flechas hacen lo mismo. La opción a la vista se recuerda por su identidad.
 */
function Carrusel({
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
  const [recordada, setRecordada] = useSeleccionRecordada<string | null>(token, `nutricion:opcion:${fecha}:${comida.mealId}`, null);
  const [indice, setIndice] = useState(() => indiceDeLaOpcion(opciones, recordada));
  const [ancho, setAncho] = useState(0);
  const lista = useRef<ScrollView>(null);
  const medidas = medidasDelCarrusel(ancho, total);
  const controles = controlesDelCarrusel(indice, total);
  // Donde empieza el carrusel: la opción recordada, sin animación. Se fija una vez, al medir.
  const inicio = useRef<number | null>(null);
  if (ancho > 0 && inicio.current === null) inicio.current = desplazamientoDe(indice, medidas.paso, total);

  // Adónde va el carrusel después de una flecha: mientras se desliza solo, las posiciones de paso no cambian la opción
  // (el contador se anuncia, y no tiene que decir la anterior un instante).
  const destino = useRef<number | null>(null);
  // Las imágenes se piden cuando la tarjeta está a la vista o al lado, y quedan: cada acceso queda registrado en la API.
  const cercanas = useRef(new Set<number>());
  for (const k of [indice - 1, indice, indice + 1]) if (k >= 0 && k < total) cercanas.current.add(k);

  const elegir = (i: number, desplazar: boolean) => {
    const j = indiceValido(i, total);
    setIndice(j);
    const id = opciones[j]?.optionId ?? null;
    if (id !== recordada) setRecordada(id);
    if (desplazar) {
      destino.current = j;
      lista.current?.scrollTo({ x: desplazamientoDe(j, medidas.paso, total), animated: true });
    }
  };

  // Al medir (y si cambia el ancho), la tarjeta elegida queda alineada, sin animación.
  const indiceActual = useRef(indice);
  indiceActual.current = indice;
  useEffect(() => {
    if (medidas.paso > 0) lista.current?.scrollTo({ x: desplazamientoDe(indiceActual.current, medidas.paso, total), animated: false });
  }, [medidas.paso, total]);

  const alDesplazar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const j = indiceDesdeDesplazamiento(e.nativeEvent.contentOffset.x, medidas.paso, total);
    if (destino.current !== null) {
      if (j === destino.current) destino.current = null;
      return;
    }
    if (j !== indiceActual.current) elegir(j, false);
  };

  return (
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
          contentContainerStyle={{ paddingRight: medidas.rellenoFinal }}
          onScroll={alDesplazar}
          // Si la persona toma el carrusel con el dedo, manda el gesto, aunque una flecha lo estuviera moviendo.
          onScrollBeginDrag={() => {
            destino.current = null;
          }}
          scrollEventThrottle={32}
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
                cargarImagen={cercanas.current.has(i)}
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
      {controles.contador ? (
        <View style={estilos.controles}>
          <BotonDeFlecha hacia="izquierda" texto={COPY_REGISTRO_DE_COMIDAS.opcionAnterior} habilitado={controles.anteriorHabilitada} onPress={() => elegir(indice - 1, true)} />
          <Text style={estilos.contador} accessibilityLiveRegion="polite">
            {controles.contador}
          </Text>
          <BotonDeFlecha hacia="derecha" texto={COPY_REGISTRO_DE_COMIDAS.opcionSiguiente} habilitado={controles.siguienteHabilitada} onPress={() => elegir(indice + 1, true)} />
        </View>
      ) : null}
      {total > 1 ? (
        <View style={estilos.puntos} accessible={false} importantForAccessibility="no-hide-descendants">
          {opciones.map((o, i) => (
            <View key={o.optionId} style={[estilos.punto, i === indice && estilos.puntoElegido]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

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
  return (
    <View style={estilos.tarjeta}>
      <ImagenDeMedio token={token} mediaId={opcion.image?.mediaId ?? null} cargar={cargarImagen} sesionPerdida={sesionPerdida} rotulo={COPY_REGISTRO_DE_COMIDAS.imagenDeReferencia} />
      <Text style={estilos.nombreDeOpcion}>{opcion.label}</Text>
      <Text style={estilos.estimacion}>{COPY_REGISTRO_DE_COMIDAS.estimacionDelPlan}</Text>
      <FranjaDeMacros nutrientes={opcion.planned} />
      {/* Las tarjetas miden lo mismo: lo que sobra va antes de las acciones, que quedan alineadas abajo. */}
      <View style={estilos.empuje} />
      <FilaQueAbre texto={COPY_REGISTRO_DE_COMIDAS.verDetalle} acento onPress={alVerDetalle} />
      <Boton texto={registrando ? COPY_REGISTRO_DE_COMIDAS.guardando : COPY_REGISTRO_DE_COMIDAS.comiEstaOpcion} onPress={alComer} ocupado={registrando} deshabilitado={otraRegistrando} />
    </View>
  );
}

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
        <View style={[estilos.tarjetaRegistrada, apilada && estilos.tarjetaApilada]}>
          <View style={estilos.textosRegistrados}>
            <Text style={estilos.nombreRegistrado}>{deUnaOpcion ? (opcion?.label ?? comida.label) : COPY_REGISTRO_DE_COMIDAS.comisteAlgoDiferente}</Text>
            {deUnaOpcion && posicion >= 0 && comida.options.length > 1 ? <Text style={estilos.posicion}>{COPY_REGISTRO_DE_COMIDAS.opcionDe(posicion + 1, comida.options.length)}</Text> : null}
            {!deUnaOpcion && registro.description ? <Text style={estilos.descripcion}>{registro.description}</Text> : null}
            {!deUnaOpcion && registro.approximateQuantity ? (
              <Text style={estilos.posicion}>{`${COPY_REGISTRO_DE_COMIDAS.cantidadAproximadaInformada}: ${registro.approximateQuantity}`}</Text>
            ) : null}
            <Insignia texto={COPY_REGISTRO_DE_COMIDAS.registrado} positiva etiqueta={comida.label} />
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
              />
            </View>
          ) : null}
        </View>
      ) : null}
      {deUnaOpcion && estado === 'UNCONFIRMED' ? <CajaInformativa titulo={COPY_REGISTRO_DE_COMIDAS.cantidadesSinConfirmar} texto={COPY_REGISTRO_DE_COMIDAS.cantidadesSinConfirmarDetalle} /> : null}
      {deUnaOpcion && estado !== null && estado !== 'UNCONFIRMED' ? <CajaInformativa titulo={COPY_REGISTRO_DE_COMIDAS.estadoDeCantidades[estado]} /> : null}
      {registro && !deUnaOpcion ? <CajaInformativa titulo={COPY_REGISTRO_DE_COMIDAS.macrosSinCalcular} /> : null}
      {registro && deUnaOpcion && estado === 'UNCONFIRMED' && opcion ? (
        <Boton texto={COPY_REGISTRO_DE_COMIDAS.completarCantidades} onPress={() => ir({ nombre: 'opcion-de-comida', id: opcion.optionId, comidaId: comida.mealId, registroId: registro.recordId })} />
      ) : null}
      {registroId ? <FilaQueAbre texto={COPY_REGISTRO_DE_COMIDAS.verOCorregir} onPress={() => ir({ nombre: 'registro-nutricional', id: registroId })} /> : null}
      {registro ? <Boton texto={COPY_REGISTRO_DE_COMIDAS.deshacer} tipo="enlace" onPress={deshacer.abrir} /> : null}
      <View style={estilos.separador} />
      <FilaQueAbre texto={COPY_REGISTRO_DE_COMIDAS.seguirConMiDia} onPress={() => ir({ nombre: 'inicio' })} />
      {deshacer.dialogo}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  fecha: { fontSize: 19, lineHeight: 25, fontWeight: '800', color: COLOR.texto, marginTop: 10, marginBottom: 6 },
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
  panel: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 16, padding: 10, marginTop: 6, backgroundColor: COLOR.superficie },
  cabezaDeComida: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 12, marginBottom: 8, paddingHorizontal: 4 },
  nombreDeComida: { fontSize: 19, lineHeight: 25, fontWeight: '800', color: COLOR.texto },
  estadoDeComida: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textoDeEstado: { fontSize: 14, lineHeight: 19, color: COLOR.tenue },
  lugarDeTarjeta: { alignSelf: 'stretch' },
  tarjeta: { flex: 1, borderWidth: 1, borderColor: COLOR.borde, borderRadius: 14, padding: 10, backgroundColor: COLOR.superficieElevada },
  nombreDeOpcion: { fontSize: 18, lineHeight: 24, fontWeight: '800', color: COLOR.texto, marginTop: 8 },
  estimacion: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: COLOR.acento, marginTop: 2 },
  empuje: { flexGrow: 1 },
  controles: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 },
  contador: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: COLOR.texto, textAlign: 'center', flexShrink: 1 },
  flecha: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  flechaDeshabilitada: { opacity: 0.45 },
  puntos: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 2 },
  punto: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLOR.borde },
  puntoElegido: { backgroundColor: COLOR.acento },
  titular: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 8 },
  textoDelTitular: { flex: 1, fontSize: 23, lineHeight: 29, fontWeight: '800', color: COLOR.texto },
  tarjetaRegistrada: { flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: COLOR.borde, borderRadius: 16, padding: 12, backgroundColor: COLOR.superficie },
  tarjetaApilada: { flexDirection: 'column-reverse' },
  textosRegistrados: { flex: 1, justifyContent: 'center' },
  nombreRegistrado: { fontSize: 19, lineHeight: 25, fontWeight: '800', color: COLOR.texto },
  posicion: { fontSize: 15, lineHeight: 21, color: COLOR.tenue, marginTop: 2 },
  descripcion: { fontSize: 16, lineHeight: 22, color: COLOR.texto, marginTop: 4 },
  imagenAlLado: { flex: 1, justifyContent: 'center' },
  imagenApilada: { alignSelf: 'stretch' },
  separador: { height: 1, backgroundColor: COLOR.borde, marginVertical: 6 },
}));
