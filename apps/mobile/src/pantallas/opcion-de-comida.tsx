/**
 * El detalle de una opción de una comida (WP-NUTRICION-RECETAS §9; encargo de Dirección del 2026-10-05, §4).
 *
 * - **La misma opción del carrusel:** la imagen de referencia, el nombre, la estimación para las porciones del plan (con
 *   la fibra), los ingredientes con su cantidad y su estado de preparación, y la preparación. Las cantidades del plan son
 *   lectura: no parecen campos completados.
 * - **«¿Cuánto comiste?», aparte** (`consumo-de-la-opcion.ts`): «Comí las porciones del plan» empieza desmarcada; o
 *   «Informar lo que comí de cada ingrediente», con un campo por ingrediente. Vacío es sin confirmar, nunca cero, y el
 *   cero no se acepta: para eso está «No lo comí».
 * - **«Comí esta opción» usa el mismo comando y el mismo intento que el carrusel** (`registro-de-comidas.tsx`): un doble
 *   toque o un reintento desde acá no duplican.
 * - **Si la comida ya tiene registro de esta opción**, el detalle completa o corrige sus cantidades (API-ING-05) en lugar
 *   de registrar otra vez. Si el registro es de otra opción, lo dice. Abierto desde un registro, lee ese registro
 *   (API-ING-03): la opción tal como estaba en el plan.
 * - Al volver, el carrusel queda en esta opción, la fecha y la altura: son las recordadas.
 */
import {
  cantidad,
  COPY,
  COPY_ANTROPOMETRIA,
  COPY_NUTRICION,
  COPY_RECETAS,
  COPY_REGISTRO_DE_COMIDAS,
  ETIQUETA_DE_PREPARACION,
  ETIQUETA_DE_UNIDAD,
  type ItemDeOpcion,
  type OpcionConMacros,
  type RegistroDeComida,
  type Resultado,
} from '@be/domain';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { api } from '../api';
import { useCambiosSinGuardar } from '../cambios-sin-guardar';
import { intentoDeLaComida } from '../comando-de-registro';
import { registroDeLaComida } from '../comidas-de-hoy';
import { cambiaronLasCantidades, consumoDesdeLaPantalla, pantallaDesdeElConsumo, SIN_CANTIDADES, type CantidadesEnPantalla } from '../consumo-de-la-opcion';
import { Cargando, ErrorConReintento } from '../estados';
import { fecha } from '../formato';
import { NUTRIENTES_DE_LA_FRANJA } from '../franja-de-macros';
import { ImagenDeMedio } from '../imagen-de-medio';
import { esIncierto, falloDe } from '../intento';
import { useLecturaRecordada } from '../lecturas';
import { useAccesoRetirado, useSesionPerdida, type Ir, type Salida } from '../navegacion';
import { CasillaSimple, Desplegador, FranjaDeMacros, LineaDeFibra } from '../piezas-de-nutricion';
import { ahoraEnElServidor, rectificarCantidades, registrarComida } from '../registro-de-comidas';
import { Aviso, Boton, Campo, estilosPorTema, Parrafo, Seccion, Titulo } from '../ui';
import { useHoyConOpciones } from './nutricion-hoy';

type AlPerderLaSesion = (r: Resultado<unknown>) => boolean;

export function PantallaDeOpcionDeComida({
  token,
  opcionId,
  comidaId,
  registroId,
  salir,
  ir,
  volver,
}: {
  token: string;
  opcionId: string;
  comidaId?: string;
  /** Si viene, se completan o corrigen las cantidades de ese registro. */
  registroId?: string;
  salir: (m: Salida) => void;
  ir: Ir;
  /** Vuelve a la pantalla de origen, sin preguntar: lo escrito ya se guardó. */
  volver: () => void;
}) {
  if (registroId) return <CompletarCantidades token={token} registroId={registroId} salir={salir} ir={ir} volver={volver} />;
  return <OpcionDelDia token={token} opcionId={opcionId} comidaId={comidaId ?? null} salir={salir} ir={ir} volver={volver} />;
}

/** Abierto desde el carrusel: la opción de hoy (API-ING-01), con la misma lectura que Hoy. */
function OpcionDelDia({ token, opcionId, comidaId, salir, ir, volver }: { token: string; opcionId: string; comidaId: string | null; salir: (m: Salida) => void; ir: Ir; volver: () => void }) {
  const { r, cargar, sesionPerdida } = useHoyConOpciones(token, salir);
  const { retirado, accesoRetirado } = useAccesoRetirado();
  if (retirado) return <SinAcceso ir={ir} />;
  if (!r) return <Esperando />;
  if (!r.ok && r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN') {
    return (
      <View>
        <Titulo>{COPY_REGISTRO_DE_COMIDAS.detalleDeLaComida}</Titulo>
        <Aviso tipo="info" titulo={COPY_NUTRICION.hoyNecesitaA3}>
          <Boton texto={COPY_ANTROPOMETRIA.irAPrivacidad} tipo="secundario" onPress={() => ir({ nombre: 'privacidad' })} />
        </Aviso>
      </View>
    );
  }
  if (!r.ok) return <ErrorConReintento sinConexion={r.tipo === 'RED'} onReintentar={() => void cargar()} />;
  const hoy = r.datos.data;
  const comida = hoy.meals.find((m) => m.mealId === comidaId) ?? null;
  const posicion = comida ? comida.options.findIndex((o) => o.optionId === opcionId) : -1;
  const opcion = comida && posicion >= 0 ? comida.options[posicion]! : null;
  // La opción ya no está en el plan de hoy (el plan cambió, o cambió el día): se dice, sin inventar nada.
  if (!comida || !opcion || !hoy.plan || !hoy.selectedDayTypeId) {
    return (
      <View>
        <Titulo>{COPY_REGISTRO_DE_COMIDAS.detalleDeLaComida}</Titulo>
        <Aviso tipo="info" titulo={COPY_NUTRICION.planCambio} />
      </View>
    );
  }
  const registro = registroDeLaComida(comida, hoy.records);
  const deEstaOpcion = registro?.kind === 'PLAN_OPTION' && registro.option?.optionId === opcion.optionId;
  return (
    <DetalleDeLaOpcion
      token={token}
      opcion={opcion}
      contexto={comida.options.length > 1 ? `${comida.label} · ${COPY_REGISTRO_DE_COMIDAS.opcionDe(posicion + 1, comida.options.length)}` : comida.label}
      sesionPerdida={sesionPerdida}
    >
      {registro && deEstaOpcion ? (
        <CuantoComiste
          key={registro.version}
          token={token}
          comida={{ label: comida.label }}
          opcion={opcion}
          modo={{ tipo: 'completar', registro }}
          sesionPerdida={sesionPerdida}
          accesoRetirado={accesoRetirado}
          volver={volver}
          alActualizar={() => void cargar({ desdeCero: true })}
        />
      ) : registro || comida.recordId ? (
        <Aviso tipo="info" titulo={COPY_REGISTRO_DE_COMIDAS.yaRegistradaConOtraOpcion} />
      ) : (
        <CuantoComiste
          token={token}
          comida={{ label: comida.label }}
          opcion={opcion}
          modo={{ tipo: 'registrar', fecha: hoy.date, planId: hoy.plan.planId, diaTipoId: hoy.selectedDayTypeId, comidaId: comida.mealId }}
          sesionPerdida={sesionPerdida}
          accesoRetirado={accesoRetirado}
          volver={volver}
          alActualizar={() => void cargar({ desdeCero: true })}
        />
      )}
    </DetalleDeLaOpcion>
  );
}

/** Abierto desde un registro: la opción tal como quedó registrada (API-ING-03), para completar o corregir. */
function CompletarCantidades({ token, registroId, salir, ir, volver }: { token: string; registroId: string; salir: (m: Salida) => void; ir: Ir; volver: () => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const { retirado, accesoRetirado } = useAccesoRetirado();
  const pedir = useCallback(() => api.consultarRegistroDeComida(token, registroId), [token, registroId]);
  const { r, cargar } = useLecturaRecordada(token, `registro-de-comida:${registroId}`, pedir, sesionPerdida);
  if (retirado) return <SinAcceso ir={ir} />;
  if (!r) return <Esperando />;
  if (!r.ok) {
    const f = falloDe(r);
    return f.tipo === 'no-revelable' ? <Aviso tipo="info" titulo={f.mensaje} /> : <ErrorConReintento sinConexion={r.tipo === 'RED'} onReintentar={() => void cargar()} />;
  }
  const registro = r.datos.data;
  const opcion = registro.option;
  if (!opcion || registro.annulment) {
    return (
      <View>
        <Titulo>{COPY_REGISTRO_DE_COMIDAS.detalleDeLaComida}</Titulo>
        <Aviso tipo="info" titulo={registro.annulment ? COPY_REGISTRO_DE_COMIDAS.deshechoEl(fechaDeAnulacion(registro)) : COPY_NUTRICION.planCambio} />
      </View>
    );
  }
  const label = registro.meal?.label ?? opcion.label;
  return (
    <DetalleDeLaOpcion token={token} opcion={opcion} contexto={label} sesionPerdida={sesionPerdida}>
      <CuantoComiste
        key={registro.version}
        token={token}
        comida={{ label }}
        opcion={opcion}
        modo={{ tipo: 'completar', registro }}
        sesionPerdida={sesionPerdida}
        accesoRetirado={accesoRetirado}
        volver={volver}
        alActualizar={() => void cargar({ desdeCero: true })}
      />
    </DetalleDeLaOpcion>
  );
}

const fechaDeAnulacion = (r: RegistroDeComida): string => (r.annulment ? fecha(r.annulment.annulledAt) : '');

function Esperando() {
  return (
    <View>
      <Titulo>{COPY_REGISTRO_DE_COMIDAS.detalleDeLaComida}</Titulo>
      <Cargando forma="lista" />
    </View>
  );
}

/** Una escritura denegada retira el contenido: el mismo estado neutral que con el acceso suspendido. */
function SinAcceso({ ir }: { ir: Ir }) {
  return (
    <Aviso tipo="info" titulo={COPY_NUTRICION.planNoDisponible}>
      <Boton texto={COPY_REGISTRO_DE_COMIDAS.irAVinculos} tipo="secundario" onPress={() => ir({ nombre: 'vinculos' })} />
    </Aviso>
  );
}

// ─── Lo que se ve de la opción ──────────────────────────────────────────────────────────────────

function DetalleDeLaOpcion({ token, opcion, contexto, sesionPerdida, children }: { token: string; opcion: OpcionConMacros; contexto: string; sesionPerdida: AlPerderLaSesion; children: ReactNode }) {
  const faltan = NUTRIENTES_DE_LA_FRANJA.some((n) => opcion.planned[n].value === null);
  const pasos = opcion.recipe?.steps ?? [];
  return (
    <View>
      <Titulo>{COPY_REGISTRO_DE_COMIDAS.detalleDeLaComida}</Titulo>
      <Text style={estilos.contexto}>{contexto}</Text>
      <ImagenDeMedio token={token} mediaId={opcion.image?.mediaId ?? null} sesionPerdida={sesionPerdida} rotulo={COPY_REGISTRO_DE_COMIDAS.imagenDeReferencia} />
      <Text style={estilos.nombre} accessibilityRole="header">
        {opcion.label}
      </Text>
      {opcion.recipe?.description ? <Parrafo tenue>{opcion.recipe.description}</Parrafo> : null}
      <Text style={estilos.estimacion}>{COPY_REGISTRO_DE_COMIDAS.estimacionDelPlan}</Text>
      <FranjaDeMacros nutrientes={opcion.planned} />
      <LineaDeFibra nutrientes={opcion.planned} />
      {faltan ? <Parrafo tenue>{COPY_RECETAS.faltanDatos}</Parrafo> : null}

      <Seccion titulo={COPY_REGISTRO_DE_COMIDAS.ingredientes}>
        <Text style={estilos.subrotulo}>{COPY_REGISTRO_DE_COMIDAS.porcionesDelPlan}</Text>
        {opcion.items.map((i, k) => (
          <FilaDeIngrediente key={i.itemId} item={i} primera={k === 0} />
        ))}
      </Seccion>

      {pasos.length > 0 ? (
        <Seccion titulo={COPY_REGISTRO_DE_COMIDAS.preparacion}>
          {pasos.map((paso, k) => (
            <View key={k} style={estilos.paso} accessible accessibilityLabel={`${COPY_REGISTRO_DE_COMIDAS.paso(k + 1)}. ${paso}`}>
              <View style={estilos.numeroDePaso}>
                <Text style={estilos.textoDelNumero}>{k + 1}</Text>
              </View>
              <Text style={estilos.textoDelPaso}>{paso}</Text>
            </View>
          ))}
        </Seccion>
      ) : null}

      {children}
    </View>
  );
}

/** Un ingrediente de las porciones del plan, en lectura: nombre, estado de preparación y cantidad. */
function FilaDeIngrediente({ item, primera }: { item: ItemDeOpcion; primera: boolean }) {
  const estado = item.preparationState ? ETIQUETA_DE_PREPARACION[item.preparationState] : null;
  const valor = item.quantity ? cantidad(item.quantity.value, ETIQUETA_DE_UNIDAD[item.quantity.unit]) : COPY_RECETAS.sinDato;
  const paraLeer = [item.name, estado, valor, item.note].filter((t): t is string => !!t).join(', ');
  return (
    <View style={[estilos.ingrediente, primera && estilos.primerIngrediente]} accessible accessibilityLabel={paraLeer}>
      <View style={estilos.textosDeIngrediente}>
        <Text style={estilos.nombreDeIngrediente}>{item.name}</Text>
        {estado ? <Text style={estilos.estadoDeIngrediente}>{estado}</Text> : null}
        {item.note ? <Text style={estilos.estadoDeIngrediente}>{item.note}</Text> : null}
      </View>
      <Text style={estilos.cantidadDeIngrediente}>{valor}</Text>
    </View>
  );
}

// ─── ¿Cuánto comiste? ───────────────────────────────────────────────────────────────────────────

type ModoDelFormulario =
  | { readonly tipo: 'registrar'; readonly fecha: string; readonly planId: string; readonly diaTipoId: string; readonly comidaId: string }
  | { readonly tipo: 'completar'; readonly registro: RegistroDeComida };

function CuantoComiste({
  token,
  comida,
  opcion,
  modo,
  sesionPerdida,
  accesoRetirado,
  volver,
  alActualizar,
}: {
  token: string;
  comida: { readonly label: string };
  opcion: OpcionConMacros;
  modo: ModoDelFormulario;
  sesionPerdida: AlPerderLaSesion;
  accesoRetirado: AlPerderLaSesion;
  volver: () => void;
  alActualizar: () => void;
}) {
  // Al registrar se parte de nada marcado; al completar o corregir, de lo que ya está registrado.
  const [inicial] = useState<CantidadesEnPantalla>(() => (modo.tipo === 'completar' ? pantallaDesdeElConsumo(modo.registro.consumption) : SIN_CANTIDADES));
  const [estado, setEstado] = useState<CantidadesEnPantalla>(inicial);
  const [errores, setErrores] = useState<Readonly<Record<string, string>>>({});
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<{ readonly texto: string; readonly incierto: boolean; readonly actualizar: boolean } | null>(null);
  const montada = useRef(true);
  useEffect(
    () => () => {
      montada.current = false;
    },
    [],
  );
  // Lo marcado o escrito sin guardar se declara: salir por la barra, la cabecera o atrás pregunta antes (DL-117).
  useCambiosSinGuardar(cambiaronLasCantidades(estado, inicial) ? `el registro de «${comida.label}»` : null);

  const cambiar = (nuevo: (e: CantidadesEnPantalla) => CantidadesEnPantalla) => {
    setEstado(nuevo);
    if (fallo && !fallo.incierto) setFallo(null);
  };

  async function guardar() {
    const armado = consumoDesdeLaPantalla(estado, opcion.items);
    if (!armado.ok) {
      setErrores(armado.errores);
      setFallo({ texto: COPY_NUTRICION.revisaLasCantidades, incierto: false, actualizar: false });
      return;
    }
    setErrores({});
    // Completar sin informar nada no cambia nada: se pide elegir una de las dos formas.
    if (modo.tipo === 'completar' && armado.consumo.status === 'UNCONFIRMED' && modo.registro.consumption?.status !== 'PLAN_PORTIONS' && modo.registro.consumption?.status !== 'REPORTED') {
      setFallo({ texto: COPY_REGISTRO_DE_COMIDAS.nadaParaCompletar, incierto: false, actualizar: false });
      return;
    }
    setEnviando(true);
    setFallo(null);
    const r =
      modo.tipo === 'registrar'
        ? await registrarComida(token, intentoDeLaComida(token, modo.fecha, modo.comidaId), {
            kind: 'PLAN_OPTION',
            activePlanId: modo.planId,
            dayTypeId: modo.diaTipoId,
            mealId: modo.comidaId,
            optionId: opcion.optionId,
            occurredAt: ahoraEnElServidor(),
            consumption: armado.consumo,
            observation: null,
          })
        : await rectificarCantidades(token, modo.registro, { consumption: armado.consumo, expectedVersion: modo.registro.version });
    if (!montada.current) return;
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (r.ok) return volver();
    // 404 no revelador a una escritura: la pantalla retira el contenido.
    if (accesoRetirado(r)) return;
    if (esIncierto(r)) return setFallo({ texto: COPY_NUTRICION.noPudimosConfirmar, incierto: true, actualizar: false });
    if (r.tipo === 'API' && r.codigo === 'EXECUTION_ALREADY_REGISTERED_INCOMPATIBLY') return setFallo({ texto: COPY_NUTRICION.yaRegistrada, incierto: false, actualizar: true });
    if (r.tipo === 'API' && r.codigo === 'ACTIVE_PLAN_REQUIRED') return setFallo({ texto: COPY_NUTRICION.planCambio, incierto: false, actualizar: true });
    const f = falloDe(r);
    setFallo({ texto: f.mensaje, incierto: false, actualizar: f.tipo === 'actualizar' });
  }

  const textoDelBoton = enviando
    ? COPY_REGISTRO_DE_COMIDAS.guardando
    : fallo?.incierto
      ? COPY.reintentar
      : modo.tipo === 'registrar'
        ? COPY_REGISTRO_DE_COMIDAS.comiEstaOpcion
        : COPY_REGISTRO_DE_COMIDAS.guardarCantidades;
  return (
    <Seccion titulo={COPY_REGISTRO_DE_COMIDAS.cuantoComiste}>
      <Parrafo tenue>{COPY_REGISTRO_DE_COMIDAS.lasCantidadesDelPlan}</Parrafo>
      <CasillaSimple
        marcada={estado.modo === 'porciones-del-plan'}
        texto={COPY_REGISTRO_DE_COMIDAS.comiLasPorcionesDelPlan}
        deshabilitada={enviando}
        onCambio={(marcada) => {
          setErrores({});
          cambiar((e) => ({ ...e, modo: marcada ? 'porciones-del-plan' : 'sin-confirmar' }));
        }}
      />
      {opcion.items.length > 0 ? (
        <Desplegador
          texto={COPY_REGISTRO_DE_COMIDAS.informarCantidades}
          abierto={estado.modo === 'informadas'}
          onPress={() => cambiar((e) => ({ ...e, modo: e.modo === 'informadas' ? 'sin-confirmar' : 'informadas' }))}
        />
      ) : null}
      {estado.modo === 'informadas' ? (
        <View>
          <Parrafo tenue>{COPY_REGISTRO_DE_COMIDAS.vacioNoEsCero}</Parrafo>
          {opcion.items.map((item) => (
            <CampoDeIngrediente
              key={item.itemId}
              item={item}
              escrito={estado.escritas[item.itemId] ?? ''}
              noComido={estado.noComidos[item.itemId] === true}
              error={errores[item.itemId] ?? null}
              deshabilitado={enviando}
              alEscribir={(texto) => {
                cambiar((e) => ({ ...e, escritas: { ...e.escritas, [item.itemId]: texto } }));
                // El error de un campo se va cuando la persona lo corrige, no recién al volver a guardar.
                setErrores((previos) => Object.fromEntries(Object.entries(previos).filter(([id]) => id !== item.itemId)));
              }}
              alMarcar={(noComido) => {
                cambiar((e) => ({ ...e, noComidos: { ...e.noComidos, [item.itemId]: noComido } }));
                setErrores((previos) => Object.fromEntries(Object.entries(previos).filter(([id]) => id !== item.itemId)));
              }}
            />
          ))}
        </View>
      ) : null}
      {fallo ? (
        <Aviso tipo="error" titulo={fallo.texto}>
          {fallo.actualizar ? <Boton texto={COPY_REGISTRO_DE_COMIDAS.actualizar} tipo="secundario" onPress={alActualizar} /> : null}
        </Aviso>
      ) : null}
      {fallo?.actualizar ? null : <Boton texto={textoDelBoton} onPress={() => void guardar()} ocupado={enviando} />}
    </Seccion>
  );
}

function CampoDeIngrediente({
  item,
  escrito,
  noComido,
  error,
  deshabilitado,
  alEscribir,
  alMarcar,
}: {
  item: ItemDeOpcion;
  escrito: string;
  noComido: boolean;
  error: string | null;
  deshabilitado: boolean;
  alEscribir: (texto: string) => void;
  alMarcar: (noComido: boolean) => void;
}) {
  const unidad = item.quantity ? ETIQUETA_DE_UNIDAD[item.quantity.unit] : null;
  return (
    <View style={estilos.campoDeIngrediente}>
      {item.quantity && unidad ? (
        // Con «No lo comí» marcado, el campo se apaga además de deshabilitarse: no cuenta lo que tenga escrito.
        <View style={noComido ? estilos.apagado : null}>
          <Campo
            etiqueta={COPY_REGISTRO_DE_COMIDAS.loQueComisteDe(item.name, unidad)}
            ayuda={COPY_REGISTRO_DE_COMIDAS.enElPlan(cantidad(item.quantity.value, unidad))}
            // El teclado decimal de Android puede ofrecer coma: el valor se lee con `leerNumero`.
            keyboardType="decimal-pad"
            value={noComido ? '' : escrito}
            editable={!noComido && !deshabilitado}
            error={error}
            onChangeText={alEscribir}
          />
        </View>
      ) : (
        <View>
          <Text style={estilos.nombreSinCantidad}>{item.name}</Text>
          <Text style={estilos.estadoDeIngrediente}>{COPY_REGISTRO_DE_COMIDAS.sinCantidadDelPlan}</Text>
        </View>
      )}
      <CasillaSimple marcada={noComido} texto={COPY_REGISTRO_DE_COMIDAS.noLoComi} paraLeer={`${COPY_REGISTRO_DE_COMIDAS.noLoComi}: ${item.name}`} onCambio={alMarcar} deshabilitada={deshabilitado} />
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  contexto: { fontSize: 15, lineHeight: 21, fontWeight: '700', color: COLOR.acento, marginTop: -6, marginBottom: 10 },
  nombre: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: COLOR.texto, marginTop: 10 },
  estimacion: { fontSize: 14, lineHeight: 19, fontWeight: '600', color: COLOR.acento, marginTop: 6 },
  subrotulo: { fontSize: 14, lineHeight: 19, fontWeight: '600', color: COLOR.acento, marginBottom: 4 },
  ingrediente: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 12, rowGap: 2, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLOR.borde },
  primerIngrediente: { borderTopWidth: 0 },
  textosDeIngrediente: { flexShrink: 1, flexGrow: 1, flexBasis: 160 },
  nombreDeIngrediente: { fontSize: 16, lineHeight: 22, color: COLOR.texto },
  estadoDeIngrediente: { fontSize: 14, lineHeight: 19, color: COLOR.tenue },
  cantidadDeIngrediente: { fontSize: 16, lineHeight: 22, fontWeight: '800', color: COLOR.texto, fontVariant: ['tabular-nums'] },
  paso: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginVertical: 6 },
  numeroDePaso: { minWidth: 28, height: 28, borderRadius: 14, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.botonFondo },
  textoDelNumero: { fontSize: 14, fontWeight: '800', color: COLOR.botonTexto },
  textoDelPaso: { flex: 1, fontSize: 16, lineHeight: 23, color: COLOR.texto },
  campoDeIngrediente: { borderTopWidth: 1, borderTopColor: COLOR.borde, paddingTop: 4, marginTop: 4 },
  nombreSinCantidad: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: COLOR.texto, marginTop: 8 },
  apagado: { opacity: 0.5 },
}));
