/**
 * APK · Nutrición del asesorado (docs/paquetes/WP-04.md §5; B10-05 NUT-08 a NUT-11; WP-NUTRICION-RECETAS §9).
 *
 * Desde WP-NUTRICION-RECETAS, la raíz de Nutrición tiene tres pestañas, que conservan su función:
 * - **Hoy** (`nutricion-hoy.tsx`, API-ING-01): las comidas del plan, el carrusel de opciones y el registro.
 * - **Plan**: el plan vigente con su objetivo y todos sus días (API-NUT-14), como antes. Muestra exactamente la
 *   instantánea vigente, nunca un borrador ni el catálogo actual (REG-06-105).
 * - **Registros** (API-ING-04): todos los registros, agrupados por día, con el estado de sus cantidades, sus fotos y lo
 *   deshecho marcado. El detalle (API-ING-03) muestra la opción, lo informado, la estimación de lo consumido cuando se
 *   puede calcular, las fotos y la estimación del profesional de una comida descrita (API-NUT-16), y deja completar,
 *   corregir o deshacer.
 * «Plan actual» y «Registros» siguen siendo pantallas propias desde Inicio y desde el menú.
 *
 * Sin puntajes, porcentajes ni juicios (REG-06-125). Un registro dice «Registrado», nunca «Cumplido» (B05:836-846).
 * Si el consentimiento o la A3 están revocados, el plan no está disponible (UC-P12 E06).
 * Toda cantidad se muestra con `cantidad`/`numero` y todo nutriente con `nutrienteParaMostrar` (`@be/domain`), con la
 * coma del país. La pestaña elegida se recuerda mientras dure la sesión.
 */
import {
  cantidad,
  COPY_EVIDENCIA_VISUAL,
  COPY_NUTRICION,
  COPY_REGISTRO_DE_COMIDAS,
  ETIQUETA_DE_PREPARACION,
  ETIQUETA_DE_UNIDAD,
  type HoyResponse,
  type Ingesta,
  type RegistroDeComida,
  type Resultado,
} from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { api } from '../api';
import { useDiaDeLaApi } from '../dia-de-la-api';
import { Cargando, ErrorConReintento, EstadoDeCarga, VerMas } from '../estados';
import { useBorrarFoto } from '../evidencia-visual';
import { fecha, fechaCivil, hora } from '../formato';
import { Flecha } from '../iconos-de-nutricion';
import { ImagenDeMedio } from '../imagen-de-medio';
import { falloDe } from '../intento';
import { useLecturaRecordada, useSeleccionRecordada } from '../lecturas';
import { useListaPaginada } from '../lista';
import { useSesionPerdida, type Ir, type Salida } from '../navegacion';
import { CajaInformativa, FranjaDeMacros, LineaDeFibra } from '../piezas-de-nutricion';
import { useDeshacer } from '../registro-de-comidas';
import { Aviso, Boton, COLOR, Dato, estilosPorTema, Insignia, Parrafo, Pestanas, Seccion, Subtitulo, Titulo } from '../ui';
import { HoyDeNutricion } from './nutricion-hoy';

/** Lo que acompaña al nombre de un ítem del plan: « · 150 g · cocido». La cantidad, con la coma del país. */
const detalleDeItem = (i: { quantity: { value: number; unit: 'g' | 'ml' | 'unit' } | null; preparationState: keyof typeof ETIQUETA_DE_PREPARACION | null }) =>
  `${i.quantity ? ` · ${cantidad(i.quantity.value, ETIQUETA_DE_UNIDAD[i.quantity.unit])}` : ''}${i.preparationState ? ` · ${ETIQUETA_DE_PREPARACION[i.preparationState].toLowerCase()}` : ''}`;

type AlPerderLaSesion = (r: Resultado<unknown>) => boolean;

// ─── La raíz: Hoy · Plan · Registros ────────────────────────────────────────────────────────────

type VistaDeNutricion = 'HOY' | 'PLAN' | 'REGISTROS';
const VISTAS: readonly { readonly valor: VistaDeNutricion; readonly texto: string }[] = [
  { valor: 'HOY', texto: COPY_REGISTRO_DE_COMIDAS.hoy },
  { valor: 'PLAN', texto: COPY_REGISTRO_DE_COMIDAS.plan },
  { valor: 'REGISTROS', texto: COPY_REGISTRO_DE_COMIDAS.registros },
];

export function PantallaDeHoy({
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
  subir: () => void;
  /** Desde Inicio, «Registrar» abre Hoy en las comidas, o en la elección del día si hace falta (DL-117). */
  accion?: 'registrar';
  /** Lleva la pantalla a una altura, medida desde el principio del contenido. */
  llevarA?: (y: number) => void;
}) {
  const [vista, setVista] = useSeleccionRecordada<VistaDeNutricion>(token, 'nutricion:vista', 'HOY');
  // El pedido de Inicio abre Hoy una vez; después, las pestañas mandan.
  const pedido = useRef(accion);
  useEffect(() => {
    if (pedido.current === 'registrar') setVista('HOY');
  }, [setVista]);
  const visible: VistaDeNutricion = pedido.current === 'registrar' ? 'HOY' : vista;
  const yDeLaPantalla = useRef(0);
  const yDeLaVista = useRef(0);
  return (
    <View onLayout={(e) => (yDeLaPantalla.current = e.nativeEvent.layout.y)}>
      <Titulo>{COPY_NUTRICION.pestana}</Titulo>
      <Pestanas
        etiqueta={COPY_REGISTRO_DE_COMIDAS.queVer}
        opciones={VISTAS}
        valor={visible}
        alElegir={(v) => {
          pedido.current = undefined;
          setVista(v);
        }}
      />
      <View onLayout={(e) => (yDeLaVista.current = e.nativeEvent.layout.y)}>
        {visible === 'HOY' ? (
          <HoyDeNutricion token={token} salir={salir} ir={ir} subir={subir} accion={pedido.current} llevarA={(y) => llevarA?.(yDeLaPantalla.current + yDeLaVista.current + y)} />
        ) : null}
        {visible === 'PLAN' ? <ContenidoDelPlan token={token} salir={salir} /> : null}
        {visible === 'REGISTROS' ? <ListaDeRegistros token={token} salir={salir} ir={ir} /> : null}
      </View>
    </View>
  );
}

// ─── Plan actual ─────────────────────────────────────────────────────────────────────────────────

/** Carga «Hoy» (API-NUT-14) con el día tipo elegido: la misma lectura y la misma clave que la tarjeta de Inicio. */
function useHoy(token: string, salir: (m: Salida) => void) {
  const sesionPerdida = useSesionPerdida(salir);
  // El día del plan elegido se recuerda al volver a la zona, mientras dure la sesión.
  const [diaTipo, setDiaTipo] = useSeleccionRecordada<string | undefined>(token, 'hoy-nutricional:dia', undefined);
  const pedir = useCallback((): Promise<Resultado<HoyResponse>> => api.hoyNutricional(token, diaTipo), [token, diaTipo]);
  // Al entrar se verifica antes de mostrar (src/ciclo-de-lectura.ts). La clave nombra el día civil (en la zona con la que
  // la API resuelve «hoy») y el día del plan elegido. A la medianoche cambia, y se vuelve a leer.
  const hoyDeLaApi = useDiaDeLaApi();
  const { r, cargar, sinActualizar } = useLecturaRecordada(token, `hoy-nutricional:${hoyDeLaApi}:${diaTipo ?? ''}`, pedir, sesionPerdida);
  return { r, cargar, sinActualizar, setDiaTipo, sesionPerdida };
}

export function PantallaDePlanActual({ token, salir }: { token: string; salir: (m: Salida) => void }) {
  return (
    <View>
      <Titulo>{COPY_NUTRICION.planActual}</Titulo>
      <ContenidoDelPlan token={token} salir={salir} />
    </View>
  );
}

function ContenidoDelPlan({ token, salir }: { token: string; salir: (m: Salida) => void }) {
  const { r, cargar } = useHoy(token, salir);
  if (!r) return <Cargando forma="lista" />;
  if (!r.ok) return <ErrorConReintento sinConexion={r.tipo === 'RED'} onReintentar={() => void cargar()} />;
  const plan = r.datos.data.activePlan;
  if (!plan) return <Aviso tipo="info" titulo={r.datos.data.planState === 'NOT_AVAILABLE' ? COPY_NUTRICION.planNoDisponible : COPY_NUTRICION.sinPlanAsesorado} />;
  return (
    <View>
      <Parrafo tenue>Vigente desde el {fecha(plan.activatedAt)}.</Parrafo>
      <Seccion titulo="Objetivo">
        <Parrafo tenue>{COPY_NUTRICION.objetivoDeclarado}</Parrafo>
        <Dato etiqueta="Energía" valor={`${cantidad(plan.objective.estimatedEnergyRequirement.value, 'kcal')} por día`} />
        <Dato etiqueta="Proteínas" valor={`${cantidad(plan.objective.macronutrientDistribution.protein.value, 'g')} por día`} />
        <Dato etiqueta="Carbohidratos" valor={`${cantidad(plan.objective.macronutrientDistribution.carbohydrate.value, 'g')} por día`} />
        <Dato etiqueta="Grasas" valor={`${cantidad(plan.objective.macronutrientDistribution.fat.value, 'g')} por día`} />
        {plan.objective.mealDistribution ? <Parrafo>{plan.objective.mealDistribution}</Parrafo> : null}
      </Seccion>
      {plan.dayTypes.map((d) => (
        <Seccion key={d.dayTypeId} titulo={d.label}>
          {d.meals.map((m) => (
            <View key={m.mealId}>
              <Subtitulo>{m.label}</Subtitulo>
              {m.options.map((o) => (
                <View key={o.optionId} style={s.opcion}>
                  <Text style={s.negrita}>{m.options.length > 1 ? `Opción ${o.order}: ${o.label}` : o.label}</Text>
                  {o.items.map((i) => (
                    <Text key={i.itemId} style={s.item}>
                      • {i.name}
                      {detalleDeItem(i)}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </Seccion>
      ))}
    </View>
  );
}

// ─── Registros (API-ING-04) ─────────────────────────────────────────────────────────────────────

export function PantallaDeRegistros({ token, salir, ir }: { token: string; salir: (m: Salida) => void; ir: Ir }) {
  return (
    <View>
      <Titulo>{COPY_NUTRICION.registros}</Titulo>
      <ListaDeRegistros token={token} salir={salir} ir={ir} />
    </View>
  );
}

/** El día anterior a una fecha civil (`AAAA-MM-DD`). */
function diaAnterior(fechaLocal: string): string {
  const d = new Date(`${fechaLocal.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** B10-05 NUT-11: agrupados en Hoy / Ayer / fecha, con etiquetas que no dependen del color (B05:968-983). */
function ListaDeRegistros({ token, salir, ir }: { token: string; salir: (m: Salida) => void; ir: Ir }) {
  const sesionPerdida = useSesionPerdida(salir);
  const lista = useListaPaginada(
    useCallback((cursor?: string) => api.listarMisRegistrosDeComida(token, { cursor }), [token]),
    sesionPerdida,
  );
  // «Hoy» es el día de la API, no el del teléfono.
  const hoy = useDiaDeLaApi();
  const ayer = diaAnterior(hoy);
  const grupo = (f: string) => (f === hoy ? COPY_REGISTRO_DE_COMIDAS.hoy : f === ayer ? COPY_REGISTRO_DE_COMIDAS.ayer : fechaCivil(f));
  return (
    <View>
      <EstadoDeCarga estado={lista.estado} onReintentar={() => void lista.recargar()} />
      {lista.estado.tipo === 'listo' && lista.estado.items.length === 0 ? <Parrafo>{COPY_REGISTRO_DE_COMIDAS.sinRegistros}</Parrafo> : null}
      {lista.estado.tipo === 'listo'
        ? lista.estado.items.map((registro, k, todos) => (
            <View key={registro.recordId}>
              {k === 0 || todos[k - 1]?.localDate !== registro.localDate ? <Subtitulo>{grupo(registro.localDate)}</Subtitulo> : null}
              <FilaDeRegistro registro={registro} onAbrir={() => ir({ nombre: 'registro-nutricional', id: registro.recordId })} />
            </View>
          ))
        : null}
      <VerMas estado={lista.estado} onVerMas={() => void lista.verMas()} />
    </View>
  );
}

/** Lo que se lee de un registro en la lista, que ya está agrupada por día: la hora, la comida, qué fue y qué se sabe. */
function resumenDeRegistro(r: RegistroDeComida): { readonly titulo: string; readonly detalle: string | null } {
  const queFue = r.kind === 'PLAN_OPTION' ? (r.option?.label ?? null) : r.description ? `«${r.description}»` : COPY_REGISTRO_DE_COMIDAS.comisteAlgoDiferente;
  const titulo = [hora(r.occurredAt), r.meal?.label ?? null, queFue].filter((t): t is string => t !== null).join(' · ');
  const detalle =
    r.kind === 'PLAN_OPTION'
      ? r.consumption
        ? COPY_REGISTRO_DE_COMIDAS.estadoDeCantidades[r.consumption.status]
        : null
      : r.evidence.length > 0
        ? COPY_REGISTRO_DE_COMIDAS.fotos(r.evidence.length)
        : null;
  return { titulo, detalle };
}

function FilaDeRegistro({ registro, onAbrir }: { registro: RegistroDeComida; onAbrir: () => void }) {
  const { titulo, detalle } = resumenDeRegistro(registro);
  const tipo = registro.kind === 'PLAN_OPTION' ? COPY_NUTRICION.delPlan : COPY_REGISTRO_DE_COMIDAS.algoDiferente;
  const deshecho = registro.annulment !== null;
  const paraLeer = [tipo, deshecho ? COPY_REGISTRO_DE_COMIDAS.deshechoInsignia : null, titulo, detalle].filter((t): t is string => t !== null).join('. ');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={paraLeer} onPress={onAbrir} style={({ pressed }) => [s.fila, pressed && s.presionada]}>
      <View style={s.textosDeFila}>
        <View style={s.insignias}>
          <Insignia texto={tipo} positiva={registro.kind === 'PLAN_OPTION'} />
          {deshecho ? <Insignia texto={COPY_REGISTRO_DE_COMIDAS.deshechoInsignia} /> : null}
        </View>
        <Text style={[s.item, deshecho && s.deshecho]}>{titulo}</Text>
        {detalle ? <Text style={s.detalle}>{detalle}</Text> : null}
      </View>
      <Flecha color={COLOR.acento} hacia="derecha" />
    </Pressable>
  );
}

// ─── El detalle de un registro (API-ING-03) ─────────────────────────────────────────────────────

export function PantallaDeRegistroNutricional({ token, id, salir, ir }: { token: string; id: string; salir: (m: Salida) => void; ir: Ir }) {
  const sesionPerdida = useSesionPerdida(salir);
  const pedir = useCallback(() => api.consultarRegistroDeComida(token, id), [token, id]);
  const { r, cargar } = useLecturaRecordada(token, `registro-de-comida:${id}`, pedir, sesionPerdida);
  const [aviso, setAviso] = useState<string | null>(null);
  if (!r) {
    return (
      <View>
        <Titulo>{COPY_REGISTRO_DE_COMIDAS.detalleDeRegistro}</Titulo>
        <Cargando forma="lista" />
      </View>
    );
  }
  if (!r.ok) {
    const f = falloDe(r);
    return f.tipo === 'no-revelable' ? <Aviso tipo="info" titulo={f.mensaje} /> : <ErrorConReintento sinConexion={r.tipo === 'RED'} onReintentar={() => void cargar()} />;
  }
  return (
    <DetalleDeRegistro
      token={token}
      registro={r.datos.data}
      aviso={aviso}
      sesionPerdida={sesionPerdida}
      ir={ir}
      alDeshacer={() => {
        setAviso(COPY_REGISTRO_DE_COMIDAS.deshecho);
        void cargar({ desdeCero: true });
      }}
      alBorrarFoto={() => {
        setAviso(COPY_EVIDENCIA_VISUAL.fotoBorrada);
        void cargar({ desdeCero: true });
      }}
      alActualizar={() => void cargar({ desdeCero: true })}
    />
  );
}

function DetalleDeRegistro({
  token,
  registro,
  aviso,
  sesionPerdida,
  ir,
  alDeshacer,
  alBorrarFoto,
  alActualizar,
}: {
  token: string;
  registro: RegistroDeComida;
  aviso: string | null;
  sesionPerdida: AlPerderLaSesion;
  ir: Ir;
  alDeshacer: () => void;
  alBorrarFoto: () => void;
  alActualizar: () => void;
}) {
  const vigente = registro.annulment === null;
  const deshacer = useDeshacer({ token, registro: vigente ? registro : null, sesionPerdida, alDeshacer, alActualizar });
  const borrarFoto = useBorrarFoto({ token, sesionPerdida, alBorrar: alBorrarFoto, alActualizar });
  const deUnaOpcion = registro.kind === 'PLAN_OPTION';
  return (
    <View>
      <Titulo>{COPY_REGISTRO_DE_COMIDAS.detalleDeRegistro}</Titulo>
      {aviso ? <Aviso tipo="exito" titulo={aviso} /> : null}
      <View style={s.insignias}>
        <Insignia texto={deUnaOpcion ? COPY_NUTRICION.delPlan : COPY_REGISTRO_DE_COMIDAS.algoDiferente} positiva={deUnaOpcion} />
        {vigente ? null : <Insignia texto={COPY_REGISTRO_DE_COMIDAS.deshechoInsignia} />}
      </View>
      {registro.annulment ? <Aviso tipo="info" titulo={COPY_REGISTRO_DE_COMIDAS.deshechoEl(fecha(registro.annulment.annulledAt))} /> : null}
      {registro.meal ? <Dato etiqueta={COPY_REGISTRO_DE_COMIDAS.comida} valor={registro.meal.label} /> : null}
      <Dato etiqueta={COPY_REGISTRO_DE_COMIDAS.cuando} valor={fecha(registro.occurredAt)} />
      <Dato etiqueta={COPY_REGISTRO_DE_COMIDAS.registrado} valor={fecha(registro.recordedAt)} />
      {registro.observation ? <Dato etiqueta={COPY_REGISTRO_DE_COMIDAS.observacion} valor={registro.observation} /> : null}
      {deUnaOpcion ? (
        <OpcionRegistrada token={token} registro={registro} sesionPerdida={sesionPerdida} />
      ) : (
        <ComidaDiferenteRegistrada token={token} registro={registro} sesionPerdida={sesionPerdida} onBorrarFoto={borrarFoto.abrir} />
      )}
      {vigente && deUnaOpcion && registro.option ? (
        <Boton
          texto={registro.consumption?.status === 'UNCONFIRMED' ? COPY_REGISTRO_DE_COMIDAS.completarCantidades : COPY_REGISTRO_DE_COMIDAS.corregirCantidades}
          tipo={registro.consumption?.status === 'UNCONFIRMED' ? 'primario' : 'secundario'}
          onPress={() => ir({ nombre: 'opcion-de-comida', id: registro.option!.optionId, comidaId: registro.meal?.mealId, registroId: registro.recordId })}
        />
      ) : null}
      {vigente ? <Boton texto={COPY_REGISTRO_DE_COMIDAS.deshacer} tipo="peligroSecundario" onPress={deshacer.abrir} /> : null}
      {deshacer.dialogo}
      {borrarFoto.dialogo}
    </View>
  );
}

/** Una opción registrada: la opción tal como estaba en el plan, lo que se informó y lo consumido si se puede calcular. */
function OpcionRegistrada({ token, registro, sesionPerdida }: { token: string; registro: RegistroDeComida; sesionPerdida: AlPerderLaSesion }) {
  const opcion = registro.option;
  const consumo = registro.consumption;
  const nombres = new Map((opcion?.items ?? []).map((i) => [i.itemId, i] as const));
  return (
    <View>
      {opcion ? (
        <Seccion titulo={opcion.label}>
          <ImagenDeMedio token={token} mediaId={opcion.image?.mediaId ?? null} sesionPerdida={sesionPerdida} rotulo={COPY_REGISTRO_DE_COMIDAS.imagenDeReferencia} />
        </Seccion>
      ) : null}
      {consumo ? (
        <Seccion titulo={COPY_REGISTRO_DE_COMIDAS.cuantoComiste}>
          <CajaInformativa
            titulo={COPY_REGISTRO_DE_COMIDAS.estadoDeCantidades[consumo.status]}
            texto={consumo.status === 'UNCONFIRMED' ? COPY_REGISTRO_DE_COMIDAS.cantidadesSinConfirmarDetalle : undefined}
          />
          {consumo.items.map((i) => {
            const item = nombres.get(i.itemId);
            const valor = i.notEaten ? COPY_REGISTRO_DE_COMIDAS.noLoComi : i.quantity ? cantidad(i.quantity.value, ETIQUETA_DE_UNIDAD[i.quantity.unit]) : COPY_REGISTRO_DE_COMIDAS.sinConfirmar;
            return <Dato key={i.itemId} etiqueta={item?.name ?? COPY_REGISTRO_DE_COMIDAS.ingredienteDelPlan} valor={valor} />;
          })}
          {consumo.source === 'RECTIFIED' && consumo.rectifiedAt ? <Parrafo tenue>{COPY_REGISTRO_DE_COMIDAS.rectificadoEl(fecha(consumo.rectifiedAt))}</Parrafo> : null}
        </Seccion>
      ) : null}
      {registro.consumed ? (
        <Seccion titulo={COPY_REGISTRO_DE_COMIDAS.estimacionDeLoQueComiste}>
          <FranjaDeMacros nutrientes={registro.consumed} />
          <LineaDeFibra nutrientes={registro.consumed} />
        </Seccion>
      ) : (
        <CajaInformativa titulo={COPY_REGISTRO_DE_COMIDAS.macrosSinCalcular} texto={COPY_REGISTRO_DE_COMIDAS.seCalculanAlConfirmar} />
      )}
    </View>
  );
}

/**
 * Una comida diferente: el texto original, la cantidad aproximada y las fotos. Los macros quedan sin calcular. Cada foto se
 * puede borrar (API-MED-05; 08:451): se borra la imagen, queda la constancia y el registro sigue, sin esa foto.
 */
function ComidaDiferenteRegistrada({
  token,
  registro,
  sesionPerdida,
  onBorrarFoto,
}: {
  token: string;
  registro: RegistroDeComida;
  sesionPerdida: AlPerderLaSesion;
  onBorrarFoto: (mediaId: string) => void;
}) {
  return (
    <View>
      <Seccion titulo={COPY_REGISTRO_DE_COMIDAS.comisteAlgoDiferente}>
        {registro.description ? <Parrafo>{registro.description}</Parrafo> : null}
        {registro.approximateQuantity ? <Dato etiqueta={COPY_REGISTRO_DE_COMIDAS.cantidadAproximadaInformada} valor={registro.approximateQuantity} /> : null}
        {registro.evidence.map((foto) => (
          <View key={foto.mediaId} style={s.foto}>
            <ImagenDeMedio token={token} mediaId={foto.mediaId} sesionPerdida={sesionPerdida} rotulo={COPY_REGISTRO_DE_COMIDAS.tuFoto} proporcion={4 / 3} />
            <Boton texto={COPY_EVIDENCIA_VISUAL.borrarFoto} tipo="peligroSecundario" onPress={() => onBorrarFoto(foto.mediaId)} />
          </View>
        ))}
        {registro.evidence.length > 0 ? <Parrafo tenue>{COPY_REGISTRO_DE_COMIDAS.fotoPrivada}</Parrafo> : null}
      </Seccion>
      <CajaInformativa titulo={COPY_REGISTRO_DE_COMIDAS.macrosSinCalcular} />
      {registro.annulment === null ? <EstimacionDelProfesional token={token} id={registro.recordId} sesionPerdida={sesionPerdida} /> : null}
    </View>
  );
}

/**
 * La estimación que el profesional hizo de una comida descrita (API-NUT-21), que conserva el texto original. Se lee
 * aparte, en API-NUT-16, porque el registro v2 no la trae: si no hay o no se puede leer, no se muestra nada.
 */
function EstimacionDelProfesional({ token, id, sesionPerdida }: { token: string; id: string; sesionPerdida: AlPerderLaSesion }) {
  const [ingesta, setIngesta] = useState<Ingesta | null>(null);
  useEffect(() => {
    let vigente = true;
    void api.consultarIngesta(token, id).then((r) => {
      if (!vigente || sesionPerdida(r)) return;
      if (r.ok) setIngesta(r.datos.data);
    });
    return () => {
      vigente = false;
    };
  }, [token, id, sesionPerdida]);
  if (!ingesta || ingesta.effectiveView.kind !== 'CORRECTED') return null;
  const correccionId = ingesta.effectiveView.correctionId;
  const efectiva = ingesta.corrections.find((c) => c.correctionId === correccionId);
  if (!efectiva) return null;
  return (
    <Seccion titulo={COPY_NUTRICION.estimacionProfesional}>
      {efectiva.structuredEstimate.items.map((e, k) => (
        <Text key={k} style={s.item}>
          • {e.description}
          {e.quantity ? ` · ${cantidad(e.quantity.value, ETIQUETA_DE_UNIDAD[e.quantity.unit])}` : ''}
        </Text>
      ))}
      <Parrafo tenue>{COPY_REGISTRO_DE_COMIDAS.estimacionDelProfesionalDe(efectiva.author.displayName, fecha(efectiva.recordedAt))}</Parrafo>
    </Seccion>
  );
}

const s = estilosPorTema((COLOR) => ({
  opcion: { marginVertical: 6 },
  negrita: { fontWeight: '700', color: COLOR.texto, fontSize: 16 },
  item: { fontSize: 16, color: COLOR.texto, lineHeight: 23 },
  insignias: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8 },
  foto: { marginVertical: 6 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, borderBottomWidth: 1, borderBottomColor: COLOR.borde, paddingVertical: 8 },
  presionada: { opacity: 0.8 },
  textosDeFila: { flex: 1 },
  deshecho: { color: COLOR.tenue, textDecorationLine: 'line-through' },
  detalle: { fontSize: 14, lineHeight: 19, color: COLOR.tenue },
}));
