/**
 * APK · Las piezas de la sesión enfocada de entrenamiento (WP-ENTRENAMIENTO-SERIES §7.2 a §7.5; referencia
 * `01_series_y_descanso_actualizado.png`). Las dibuja `PantallaDeSesion` (entrenamiento.tsx), que tiene el estado.
 *
 * - **Arriba** (PA-02, Dirección del 2026-11-02): la franja con la sesión y «Ver rutina», el ejercicio, «Ejercicio 2 de 5 ·
 *   Serie 3 de 4», una línea de tramos (uno por ejercicio) y los tiempos de la sesión y del ejercicio.
 * - **El ejercicio activo:** su imagen de 112 dp (o la mancuerna de la app si no tiene), «Ver técnica» y «Sustituir
 *   ejercicio» (DL-151). Sustituido, dice también el ejecutado, con la insignia.
 * - **La tabla:** Serie, carga con su unidad, Rep., RIR, Tiempo y una casilla al final de cada fila. Los campos vacíos
 *   muestran el objetivo de esa serie en gris (`placeholdersDeLaSerie`); lo escrito se ve en su fila aunque no esté
 *   activa (PA-01). Tildar registra la fila con lo escrito y, en lo vacío, lo planificado; la fila registrada va en el
 *   azul elevado del tema (Dirección, 2026-11-02: no en verde, la tilde de la casilla ya dice que quedó) y, si se tildó
 *   sin escribir nada, con el rótulo «como el plan»; destildar la deshace. El reloj de la fila mide la serie. La ayuda va plegada junto a la tabla. Con la
 *   letra grande pasa a tarjetas apiladas.
 * - **La banda «Plan de la serie N»**, que sigue a la vista aunque se escriba encima del placeholder.
 * - **El descanso** (DL-166, PV-7 a PV-12): arranca solo al tildar la serie, con su barra hasta el recomendado y el
 *   engranaje de sus ajustes al lado; con «Lo inicio yo», «Iniciar descanso». Llegar al recomendado no termina nada.
 *   La barra reemplazó al aro. Con movimiento reducido, igual: la barra no se anima.
 * - **Lectores de pantalla:** el conteo no se anuncia cada segundo. Lo que cambia cada segundo no se lee; el nombre
 *   accesible del temporizador dice los minutos, y la pantalla anuncia solo el inicio y el fin.
 *
 * Las superficies son mates, con su borde: sin brillos internos (§7.7). Nada califica: no hay puntajes ni juicios.
 */
import {
  COPY_ENTRENAMIENTO,
  COPY_ENTRENAMIENTO_POR_SERIE,
  COPY_INTEGRACIONES,
  COPY_REGISTRO_DE_COMIDAS,
  duracionParaMostrar,
  ETIQUETA_DE_CALIDAD_DE_TIEMPO,
  ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN,
  ETIQUETA_DE_PROVEEDOR,
  ETIQUETA_DE_REVISION_TECNICA,
  etiquetaDeCondicionRegistrada,
  nombreConAlternativo,
  numero,
  ROL_DE_LA_IMAGEN,
  textoDeDescanso,
  textoDeDuracion,
  textoDeLicencia,
  textoDeSegundos,
  type CalculoDeTiempos,
  type DuracionApi,
  type EjercicioEncontrado,
  type PrescripcionConObjetivos,
  type Resultado,
  type SesionConObjetivos,
} from '@be/domain';
import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View, type KeyboardTypeOptions } from 'react-native';
import type { EstadoDelGuardado, EstadoDeSincronizacion, ProblemaDeSincronizacion } from '../almacen-de-entrenamiento';
import { useMovimientoReducido } from '../estados';
import { BotonDeIcono, Icono } from '../icono';
import { llenadoDeLaBarra, type AjustesDelDescanso, type PermisoDeAvisos } from '../descanso-automatico';
import { TEXTOS_DEL_DESCANSO } from '../textos-del-descanso';
import { IconoDeCronometro, IconoDeEjercicio, IconoDeNube, IconoDePlan, IconoDeRutina } from '../iconos-de-entrenamiento';
import { Flecha, IconoDeRegistrado } from '../iconos-de-nutricion';
import { ImagenDeMedio, type RespaldoDeImagen } from '../imagen-de-medio';
import type { TramoDelRecorrido } from '../franja-de-la-sesion';
import { TEXTOS_DE_LA_SESION } from '../textos-de-la-sesion';
import { avisoDelGuardado as avisoDelGuardadoDe, lineaDelEnvio, TEXTOS_DEL_GUARDADO, textoDeEstadoDeFila } from '../textos-del-guardado';
import {
  ANCHO_DE_LA_CASILLA,
  ANCHO_DE_LA_COLUMNA_SERIE,
  hayAlgoEscrito,
  placeholdersDeLaSerie,
  SEPARACION_DE_CELDAS,
  textoDeTiempo,
  type bandaDeLaSerie,
  type ErroresDeFila,
  type FilaDeLaTabla,
  type FilaEscrita,
  type ResumenDelEjercicio,
  type SerieLocal,
  type Unidad,
} from '../series-de-la-sesion';
import { sustitutosPosibles, TEXTOS_DE_LA_SUSTITUCION, type EjercicioNombrado, type SustitucionDelEjercicio } from '../sustitucion-de-ejercicio';
import { Aviso, Ayuda, Boton, Campo, Casilla, CasillaSola, COLOR, Dato, Desplegable, estilosPorTema, Insignia, Parrafo, Segmentos } from '../ui';

/** El lado de la imagen del ejercicio activo, en dp (§7.2: de 100 a 140). */
export const TAMANO_DE_LA_IMAGEN = 112;

/** El respaldo de un ejercicio sin imagen, o con una que no se pudo mostrar: la mancuerna de la app. */
export const RESPALDO_DE_EJERCICIO: RespaldoDeImagen = {
  icono: ({ color, tamano }) => <IconoDeEjercicio color={color} tamano={tamano} />,
  sinImagen: COPY_ENTRENAMIENTO_POR_SERIE.sinImagen,
  noDisponible: COPY_REGISTRO_DE_COMIDAS.imagenNoDisponible,
};

type AlPerderLaSesion = (r: Resultado<unknown>) => boolean;

/** «4 minutos» o «menos de un minuto»: lo que dice el lector de pantalla de una duración que corre. Cambia por minuto. */
export function duracionParaLeer(ms: number | null): string {
  if (ms === null) return 'sin dato';
  const minutos = Math.floor(ms / 60_000);
  if (minutos === 0) return 'menos de un minuto';
  return `${numero(minutos, 0)} ${minutos === 1 ? 'minuto' : 'minutos'}`;
}

/** «01:02», o «—» si no hay duración para mostrar. */
const reloj = (d: DuracionApi | null) => (d && d.ms !== null ? (duracionParaMostrar(d.ms) ?? '—') : '—');

// ─── Arriba ─────────────────────────────────────────────────────────────────────────────────────

export interface Temporizador {
  /** Lo que se ve: «Sesión 04:12». */
  readonly texto: string;
  /** «estimado» si se reconstruyó con el reloj civil (la app se cerró o el teléfono durmió). */
  readonly calidad: string | null;
  /** Lo que dice el lector de pantalla: cambia por minuto, no por segundo. */
  readonly etiqueta: string;
}

export function BarraDeLaSesion({ nombre, temporizador, onVerRutina }: { nombre: string; temporizador: Temporizador | null; onVerRutina: () => void }) {
  return (
    <View style={estilos.barra}>
      <Pressable accessibilityRole="button" onPress={onVerRutina} hitSlop={4} style={({ pressed }) => [estilos.verRutina, pressed && estilos.presionado]}>
        <IconoDeRutina color={COLOR.acento} />
        <Text style={estilos.textoDeEnlace}>{COPY_ENTRENAMIENTO_POR_SERIE.verRutina}</Text>
      </Pressable>
      <View style={estilos.filaDeLaBarra}>
        <Text style={estilos.nombreDeLaSesion} accessibilityRole="header">
          {nombre}
        </Text>
        {temporizador ? (
          <View style={estilos.temporizador} accessible accessibilityLabel={temporizador.etiqueta}>
            <Icono nombre="reloj" tamano={18} tono="tenue" />
            <Text style={estilos.textoDelTemporizador} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              {temporizador.texto}
              {temporizador.calidad ? <Text style={estilos.calidad}>{` · ${temporizador.calidad}`}</Text> : null}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/**
 * La franja de arriba de la sesión guiada (PA-02, Dirección del 2026-11-02): el nombre de la sesión con «Ver rutina», el
 * ejercicio, «Ejercicio 2 de 5 · Serie 3 de 4», la línea de tramos (uno por ejercicio: lo registrado de cada uno, y el
 * actual marcado aparte) y los dos tiempos, el de la sesión y el del ejercicio. Los tiempos no se leen cada segundo: el
 * lector de pantalla dice los minutos.
 */
export function FranjaDeLaSesion({
  sesion,
  ejercicio,
  posicion,
  tramos,
  cuenta,
  tiempoDeLaSesion,
  tiempoDelEjercicio,
  onVerRutina,
}: {
  sesion: string;
  ejercicio: string;
  posicion: string;
  tramos: readonly TramoDelRecorrido[];
  cuenta: { readonly registradas: number; readonly planificadas: number };
  tiempoDeLaSesion: Temporizador | null;
  tiempoDelEjercicio: Temporizador | null;
  onVerRutina: () => void;
}) {
  const tiempos = [tiempoDeLaSesion, tiempoDelEjercicio].filter((t): t is Temporizador => t !== null);
  return (
    <View style={[estilos.tarjeta, estilos.franja]}>
      <View style={estilos.cabezaDeLaFranja}>
        <Text style={[estilos.detalle, estilos.textos]} numberOfLines={2}>
          {sesion}
        </Text>
        <Pressable accessibilityRole="button" onPress={onVerRutina} hitSlop={4} style={({ pressed }) => [estilos.verRutina, pressed && estilos.presionado]}>
          <IconoDeRutina color={COLOR.acento} />
          <Text style={estilos.textoDeEnlace}>{COPY_ENTRENAMIENTO_POR_SERIE.verRutina}</Text>
        </Pressable>
      </View>
      <Text style={estilos.nombreDelEjercicio} accessibilityRole="header">
        {ejercicio}
      </Text>
      <Text style={estilos.textoDeBloque}>{posicion}</Text>
      <View style={estilos.tramos} accessible accessibilityLabel={TEXTOS_DE_LA_SESION.tramos(cuenta.registradas, cuenta.planificadas)}>
        {tramos.map((t) => (
          <View key={t.prescriptionId} style={[estilos.tramo, t.actual && estilos.tramoActual]}>
            {/* El relleno y el resto se reparten el tramo con flex: sin literales de porcentaje, que T13 lee como puntaje. */}
            <View style={[estilos.rellenoDelTramo, { flex: t.fraccion }]} />
            <View style={{ flex: 1 - t.fraccion }} />
          </View>
        ))}
      </View>
      {tiempos.length > 0 ? (
        <View style={estilos.tiemposDeLaFranja} accessible accessibilityLabel={tiempos.map((t) => t.etiqueta).join('. ')}>
          <Icono nombre="reloj" tamano={18} tono="tenue" />
          <Text style={estilos.textoDelTemporizador} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            {tiempos.map((t) => t.texto).join(' · ')}
            {tiempos.some((t) => t.calidad) ? <Text style={estilos.calidad}>{` · ${tiempos.find((t) => t.calidad)?.calidad ?? ''}`}</Text> : null}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── El ejercicio activo ────────────────────────────────────────────────────────────────────────

export function EjercicioActivo({
  token,
  sesionPerdida,
  prescripcion: p,
  posicion,
  total,
  bases,
  ejecutado = null,
  conNombre = true,
  onVerTecnica,
  onSustituir,
}: {
  token: string;
  sesionPerdida: AlPerderLaSesion;
  prescripcion: PrescripcionConObjetivos;
  posicion: number;
  total: number;
  bases: { readonly carga: string | null; readonly repeticiones: string | null };
  /** El ejercicio que se registra en lugar del planificado (DL-151); `null` sin sustitución. El nombre grande sigue siendo el planificado. */
  ejecutado?: string | null;
  /** Sin el nombre ni «Ejercicio N de M»: en la sesión guiada los dice la franja de arriba (PA-02). */
  conNombre?: boolean;
  onVerTecnica: () => void;
  /** «Sustituir ejercicio» (DL-151). Sin ella, no se ofrece. */
  onSustituir?: () => void;
}) {
  const { fontScale } = useWindowDimensions();
  return (
    <View style={[estilos.tarjeta, estilos.ejercicio, fontScale >= 1.6 && estilos.ejercicioApilado]}>
      <ImagenDeMedio
        token={token}
        mediaId={p.image?.mediaId ?? null}
        sesionPerdida={sesionPerdida}
        rotulo={p.image?.altText || p.exerciseName}
        tamano={TAMANO_DE_LA_IMAGEN}
        respaldo={RESPALDO_DE_EJERCICIO}
        respaldoCompacto={fontScale > 1.3}
        rotuloVisible={false}
        ajuste="contener"
      />
      <View style={estilos.datosDelEjercicio}>
        {conNombre ? (
          <Text style={estilos.nombreDelEjercicio} accessibilityRole="header">
            {p.exerciseName}
          </Text>
        ) : null}
        {/* Las dos puntas a la vista: el nombre grande es el planificado, y esto lo que se registra (B10-06:772-778). */}
        {ejecutado ? <LineaDeLaSustitucion ejecutado={ejecutado} /> : null}
        {conNombre ? <Text style={estilos.detalle}>{COPY_ENTRENAMIENTO_POR_SERIE.ejercicioDe(posicion, total)}</Text> : null}
        {bases.carga ? <Text style={estilos.detalle}>{`Carga: ${bases.carga}`}</Text> : null}
        {bases.repeticiones ? <Text style={estilos.detalle}>{`Repeticiones: ${bases.repeticiones}`}</Text> : null}
        <Pressable accessibilityRole="button" onPress={onVerTecnica} style={({ pressed }) => [estilos.enlaceConFlecha, pressed && estilos.presionado]}>
          <Text style={estilos.textoDeEnlace}>{COPY_ENTRENAMIENTO_POR_SERIE.verTecnica}</Text>
          <Flecha color={COLOR.acento} hacia="derecha" tamano={18} />
        </Pressable>
        {onSustituir ? (
          <Pressable accessibilityRole="button" onPress={onSustituir} style={({ pressed }) => [estilos.enlaceConFlecha, pressed && estilos.presionado]}>
            <Text style={estilos.textoDeEnlace}>{COPY_ENTRENAMIENTO.sustituirEjercicio}</Text>
            <Flecha color={COLOR.acento} hacia="derecha" tamano={18} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** «Ejecutado: Press con mancuernas» con la insignia «Sustituido», leído como una sola frase. */
function LineaDeLaSustitucion({ ejecutado }: { ejecutado: string }) {
  const texto = `${COPY_ENTRENAMIENTO.ejecutado}: ${ejecutado}`;
  return (
    <View style={estilos.sustitucion} accessible accessibilityLabel={`${texto}. ${COPY_ENTRENAMIENTO.sustituido}`}>
      <Text style={estilos.textoDeBloque}>{texto}</Text>
      <Insignia texto={COPY_ENTRENAMIENTO.sustituido} />
    </View>
  );
}

// ─── La tabla de series ─────────────────────────────────────────────────────────────────────────

/** Lo registrado en cada celda: el valor, o «—» si no se informó (no es cero). */
function textoRegistrado(f: FilaDeLaTabla): { carga: string; repeticiones: string; rir: string; tiempo: string } {
  const carga = f.registrada?.load ?? null;
  const repeticiones = f.registrada?.completedRepetitions ?? null;
  const rir = f.registrada?.rir ?? null;
  const segundos = f.registrada?.durationSeconds ?? null;
  return {
    carga: carga === null ? '—' : numero(carga.value),
    repeticiones: repeticiones === null ? '—' : numero(repeticiones, 0),
    rir: rir === null ? '—' : numero(rir),
    tiempo: segundos === null ? '—' : textoDeTiempo(segundos),
  };
}

/** Cómo se cargó una serie registrada, dicho para el lector de pantalla (DL-161). */
const comoSeCargo = (f: FilaDeLaTabla): string => (f.registrada?.recordedAs === 'AS_PLANNED' ? TEXTOS_DE_LA_SESION.comoElPlan : 'escrita');

/** La frase de una fila para el lector de pantalla: su estado, lo registrado o lo escrito, y el plan. */
function fraseDeLaFila(f: FilaDeLaTabla, unidad: Unidad, activa: boolean, escrita: FilaEscrita | undefined): string {
  if (f.registrada) {
    const r = f.registrada;
    const estado = textoDeEstadoDeFila(f) ?? 'Registrada';
    const partes = [
      r.load ? `${numero(r.load.value)} ${r.load.unit}` : 'carga no informada',
      r.completedRepetitions === null ? 'repeticiones no informadas' : `${numero(r.completedRepetitions, 0)} repeticiones`,
      r.rir === null ? 'RIR no informado' : `RIR ${numero(r.rir)}`,
      ...(r.durationSeconds === null || r.durationSeconds === undefined ? [] : [`tiempo ${textoDeTiempo(r.durationSeconds)}`]),
    ];
    return `${COPY_ENTRENAMIENTO.serie} ${f.setIndex}${activa ? `, ${COPY_ENTRENAMIENTO_POR_SERIE.serieActual}` : ''}, ${estado}, ${comoSeCargo(f)}: ${partes.join(', ')}`;
  }
  const p = placeholdersDeLaSerie(f.objetivo, unidad);
  const estado = activa ? COPY_ENTRENAMIENTO_POR_SERIE.serieActual : escrita && hayAlgoEscrito(escrita) ? TEXTOS_DE_LA_SESION.escritaSinRegistrar : COPY_ENTRENAMIENTO_POR_SERIE.sinRegistrar;
  const escrito =
    escrita && hayAlgoEscrito(escrita)
      ? `. Escrito: ${[escrita.carga.trim() ? `carga ${escrita.carga} ${unidad}` : null, escrita.repeticiones.trim() ? `${escrita.repeticiones} repeticiones` : null, escrita.rir.trim() ? `RIR ${escrita.rir}` : null, (escrita.tiempo ?? '').trim() ? `tiempo ${escrita.tiempo}` : null].filter((x): x is string => x !== null).join(', ')}`
      : '';
  return `${COPY_ENTRENAMIENTO.serie} ${f.setIndex}, ${estado}${escrito}. Plan: carga ${p.carga}${p.carga === COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo ? '' : ` ${unidad}`}, repeticiones ${p.repeticiones}, RIR ${p.rir}`;
}

/** El reloj de las filas: el de la serie que corre, si hay una, y si se puede medir (en vivo, con la corrida y sin pausa). */
export interface RelojDeLaTabla {
  readonly disponible: boolean;
  readonly enCurso: { readonly setIndex: number; readonly texto: string; readonly minutos: string } | null;
}

export interface AccionesDeLaTabla {
  readonly onEnfocar: (setIndex: number) => void;
  readonly onEscribir: (setIndex: number, campo: keyof FilaEscrita, texto: string) => void;
  /** La casilla: tilda (registra) o destilda (deshace) la serie. */
  readonly onTildar: (fila: FilaDeLaTabla) => void;
  /** El reloj de la fila: arranca o para el de esa serie. */
  readonly onReloj: (setIndex: number) => void;
  /** Mantener apretado el reloj: escribir el tiempo sin medirlo. */
  readonly onEscribirTiempo: (setIndex: number) => void;
}

/**
 * La tabla de series de la sesión guiada (PA-02): Serie · kg · Rep. · RIR · Tiempo y una casilla al final de cada fila.
 * - En los campos vacíos se ve en gris lo planificado de esa serie. Lo escrito se ve en su fila aunque no esté activa
 *   (PA-01), con «Escrita, sin registrar».
 * - **Tildar registra la fila**: lo escrito y, en lo vacío, lo planificado que se veía. La fila registrada va en el azul
 *   elevado del tema; la tildada sin escribir nada lleva además «como el plan». Destildarla la deshace mientras no se
 *   finalice.
 * - **El reloj de la fila** arranca y para el de esa serie; tildar también lo para. El tiempo también se escribe.
 * - Con la letra grande pasa a tarjetas apiladas, con los mismos campos, la misma casilla y el mismo reloj.
 */
export function TablaDeSeries({
  filas,
  activa,
  unidad,
  escritas,
  errores,
  disposicion,
  reloj,
  escribiendoTiempo,
  ocupado,
  acciones,
}: {
  filas: readonly FilaDeLaTabla[];
  activa: number;
  unidad: Unidad;
  /** Lo escrito en cada fila de este ejercicio, por número de serie. */
  escritas: ReadonlyMap<number, FilaEscrita>;
  /** Los errores de la última fila que se quiso tildar. */
  errores: { readonly setIndex: number; readonly errores: ErroresDeFila } | null;
  disposicion: 'tabla' | 'tarjetas';
  reloj: RelojDeLaTabla;
  /** La fila en la que se está escribiendo el tiempo sin medirlo, si hay una. */
  escribiendoTiempo: number | null;
  ocupado: boolean;
  acciones: AccionesDeLaTabla;
}) {
  return (
    <View>
      {disposicion === 'tabla' ? (
        <View style={estilos.encabezadoDeLaTabla} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={[estilos.columna, estilos.columnaSerie]}>{COPY_ENTRENAMIENTO_POR_SERIE.columnaSerie}</Text>
          <Text style={[estilos.columna, estilos.columnaDato]}>{unidad}</Text>
          <Text style={[estilos.columna, estilos.columnaDato]}>{COPY_ENTRENAMIENTO_POR_SERIE.columnaRepeticiones}</Text>
          <Text style={[estilos.columna, estilos.columnaDato]}>{COPY_ENTRENAMIENTO_POR_SERIE.columnaRir}</Text>
          <Text style={[estilos.columna, estilos.columnaDato]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {TEXTOS_DE_LA_SESION.columnaTiempo}
          </Text>
          <View style={estilos.columnaCasilla} />
        </View>
      ) : null}
      {filas.map((f) => {
        const props: PropsDeFila = {
          fila: f,
          activa: f.setIndex === activa,
          unidad,
          escrita: escritas.get(f.setIndex),
          errores: errores?.setIndex === f.setIndex ? errores.errores : {},
          relojEnCurso: reloj.enCurso?.setIndex === f.setIndex ? reloj.enCurso : null,
          relojDisponible: reloj.disponible,
          escribiendoTiempo: escribiendoTiempo === f.setIndex,
          ocupado,
          acciones,
        };
        return disposicion === 'tabla' ? <FilaDeTabla key={f.setIndex} {...props} /> : <TarjetaDeSerie key={f.setIndex} {...props} />;
      })}
      <Text style={estilos.nota}>{COPY_ENTRENAMIENTO_POR_SERIE.enGris}</Text>
    </View>
  );
}

interface PropsDeFila {
  fila: FilaDeLaTabla;
  activa: boolean;
  unidad: Unidad;
  escrita: FilaEscrita | undefined;
  errores: ErroresDeFila;
  relojEnCurso: RelojDeLaTabla['enCurso'];
  relojDisponible: boolean;
  escribiendoTiempo: boolean;
  ocupado: boolean;
  acciones: AccionesDeLaTabla;
}

const CAMPOS: readonly { readonly campo: 'carga' | 'repeticiones' | 'rir'; readonly teclado: KeyboardTypeOptions }[] = [
  // Decimal para la carga y el RIR; entero para las repeticiones.
  { campo: 'carga', teclado: 'decimal-pad' },
  { campo: 'repeticiones', teclado: 'number-pad' },
  { campo: 'rir', teclado: 'decimal-pad' },
];

/** El largo máximo de lo que se escribe en una celda: el almacén descarta lo que pase de 40. */
const LARGO_DE_UNA_CELDA = 12;

/** El nombre accesible de un campo de la fila activa: qué es, de qué serie, el plan de esa serie y el error si lo hay. */
function etiquetaDelCampo(campo: keyof FilaEscrita, setIndex: number, unidad: Unidad, placeholder: string, error: string | undefined): string {
  const que =
    campo === 'carga' ? `Carga en ${unidad} de la serie ${setIndex}` : campo === 'repeticiones' ? `Repeticiones de la serie ${setIndex}` : campo === 'rir' ? `RIR de la serie ${setIndex}, opcional` : TEXTOS_DE_LA_SESION.tiempoDeLaSerie(setIndex);
  const plan = campo === 'tiempo' ? '' : placeholder === COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo ? `. ${COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo}` : `. Plan: ${placeholder}`;
  return `${que}${plan}${error ? `. Revisá este campo: ${error}` : ''}`;
}

/** El color de una fila según su estado: la registrada, en el azul elevado del tema; la activa, con su borde. */
function estiloDeLaFila(f: FilaDeLaTabla, activa: boolean) {
  const registrada = f.estado === 'guardada' || f.estado === 'pendiente-de-enviar';
  return [activa ? estilos.filaActiva : estilos.filaQuieta, registrada && estilos.filaRegistrada, registrada && activa && estilos.filaRegistradaActiva, f.estado === 'en-conflicto' && estilos.filaEnConflicto];
}

function FilaDeTabla({ fila: f, activa, unidad, escrita, errores, relojEnCurso, relojDisponible, escribiendoTiempo, ocupado, acciones }: PropsDeFila) {
  const p = placeholdersDeLaSerie(f.objetivo, unidad);
  const estado = f.estado === 'guardada' ? null : f.estado === 'sin-registrar' ? (!activa && escrita && hayAlgoEscrito(escrita) ? TEXTOS_DE_LA_SESION.escritaSinRegistrar : null) : textoDeEstadoDeFila(f);
  const editable = activa && f.estado === 'sin-registrar';
  const r = textoRegistrado(f);
  const comoElPlan = f.registrada?.recordedAs === 'AS_PLANNED';
  return (
    <View style={estiloDeLaFila(f, activa)}>
      {activa ? <Text style={estilos.serieActual}>{COPY_ENTRENAMIENTO_POR_SERIE.serieActual}</Text> : null}
      <View style={estilos.fila}>
        {/* El número de la serie lleva la frase entera de la fila para el lector de pantalla, y la enfoca. */}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: activa }}
          accessibilityLabel={fraseDeLaFila(f, unidad, activa, escrita)}
          accessibilityHint={activa ? undefined : 'Enfoca esta serie'}
          onPress={() => acciones.onEnfocar(f.setIndex)}
          style={({ pressed }) => [estilos.celdaSerie, pressed && estilos.presionado]}
        >
          <Text style={estilos.numeroDeSerie}>{numero(f.setIndex, 0)}</Text>
        </Pressable>
        {editable ? (
          CAMPOS.map(({ campo, teclado }) => (
            <CeldaEditable key={campo} valor={escrita?.[campo] ?? ''} placeholder={p[campo]} teclado={teclado} error={errores[campo]} etiqueta={etiquetaDelCampo(campo, f.setIndex, unidad, p[campo], errores[campo])} onCambiar={(t) => acciones.onEscribir(f.setIndex, campo, t)} />
          ))
        ) : (
          // Tocar los datos de una fila la enfoca. El lector de pantalla ya los oye en el número de la serie.
          <Pressable accessible={false} importantForAccessibility="no-hide-descendants" onPress={() => acciones.onEnfocar(f.setIndex)} style={estilos.datosDeLaFila}>
            {CAMPOS.map(({ campo }) => (
              <View key={campo} style={[estilos.celda, f.registrada ? estilos.celdaRegistrada : estilos.celdaQuieta]}>
                {f.registrada ? (
                  <Text style={estilos.valorRegistrado}>{r[campo]}</Text>
                ) : escrita && escrita[campo].trim() !== '' ? (
                  <Text style={estilos.valorRegistrado} numberOfLines={1}>
                    {escrita[campo]}
                  </Text>
                ) : (
                  <Text style={[estilos.placeholder, p[campo] === COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo && estilos.placeholderSinObjetivo]} numberOfLines={2}>
                    {p[campo]}
                  </Text>
                )}
              </View>
            ))}
          </Pressable>
        )}
        <CeldaDeTiempo fila={f} activa={activa} escrita={escrita} error={errores.tiempo} relojEnCurso={relojEnCurso} relojDisponible={relojDisponible} escribiendoTiempo={escribiendoTiempo} ocupado={ocupado} acciones={acciones} />
        <CasillaDeLaFila fila={f} ocupado={ocupado} onTildar={() => acciones.onTildar(f)} />
      </View>
      {estado || comoElPlan ? (
        // El estado de la fila y, si se tildó sin escribir nada, «como el plan».
        <View style={estilos.pieDeLaFila}>
          {estado ? <Text style={[estilos.estadoDeFila, (f.estado === 'en-conflicto' || f.proteccion === 'solo-en-la-app') && estilos.estadoEnConflicto, f.estado === 'pendiente-de-enviar' && f.proteccion !== 'solo-en-la-app' && estilos.estadoRegistrada]}>{estado}</Text> : null}
          {comoElPlan ? <Text style={estilos.comoElPlan}>{TEXTOS_DE_LA_SESION.comoElPlan}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

/**
 * La celda del tiempo (DL-161): lo registrado; el reloj de la serie que corre, que se toca para pararlo; lo escrito o lo
 * medido, que se corrige escribiendo; o el reloj para medir, que se mantiene apretado para escribir el tiempo sin medir.
 * Sin cronómetro (otro día, en pausa o sin iniciar la sesión), se escribe directo en la fila activa.
 */
function CeldaDeTiempo({ fila: f, activa, escrita, error, relojEnCurso, relojDisponible, escribiendoTiempo, ocupado, acciones }: Pick<PropsDeFila, 'fila' | 'activa' | 'escrita' | 'relojEnCurso' | 'relojDisponible' | 'escribiendoTiempo' | 'ocupado' | 'acciones'> & { error: string | undefined }) {
  const t = TEXTOS_DE_LA_SESION;
  if (f.registrada) {
    return (
      <View style={[estilos.celda, estilos.celdaRegistrada]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text style={estilos.valorDeTiempo}>{textoRegistrado(f).tiempo}</Text>
      </View>
    );
  }
  if (relojEnCurso) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t.pararElReloj(f.setIndex)}. ${t.relojEnCurso(f.setIndex, relojEnCurso.minutos)}`}
        accessibilityState={{ disabled: ocupado, busy: true }}
        disabled={ocupado}
        onPress={() => acciones.onReloj(f.setIndex)}
        style={({ pressed }) => [estilos.celda, estilos.celdaEnCurso, pressed && estilos.presionado]}
      >
        <Text style={estilos.relojDeLaFila} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {relojEnCurso.texto}
        </Text>
      </Pressable>
    );
  }
  const tiempo = escrita?.tiempo ?? '';
  // Se escribe en la fila activa cuando hay un tiempo para corregir, cuando se pidió escribirlo o cuando no hay reloj.
  if (activa && (tiempo !== '' || escribiendoTiempo || !relojDisponible)) {
    return <CeldaEditable valor={tiempo} placeholder="" teclado="numbers-and-punctuation" error={error} etiqueta={etiquetaDelCampo('tiempo', f.setIndex, 'kg', '', error)} enfocarAlMostrar={escribiendoTiempo} onCambiar={(texto) => acciones.onEscribir(f.setIndex, 'tiempo', texto)} />;
  }
  if (tiempo !== '' || !relojDisponible) {
    return (
      <Pressable accessible={false} importantForAccessibility="no-hide-descendants" onPress={() => acciones.onEnfocar(f.setIndex)} style={[estilos.celda, estilos.celdaQuieta]}>
        <Text style={tiempo !== '' ? estilos.valorDeTiempo : estilos.placeholder} numberOfLines={1}>
          {tiempo !== '' ? tiempo : '—'}
        </Text>
      </Pressable>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.medirLaSerie(f.setIndex)}
      accessibilityHint={t.mantenerParaEscribir}
      accessibilityState={{ disabled: ocupado }}
      accessibilityActions={[{ name: 'longpress', label: t.escribirElTiempo }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'longpress') acciones.onEscribirTiempo(f.setIndex);
      }}
      disabled={ocupado}
      onPress={() => acciones.onReloj(f.setIndex)}
      onLongPress={() => acciones.onEscribirTiempo(f.setIndex)}
      style={({ pressed }) => [estilos.celda, estilos.celdaEditable, pressed && estilos.presionado]}
    >
      <IconoDeCronometro color={COLOR.acento} tamano={22} />
    </Pressable>
  );
}

/**
 * La casilla de la fila (PA-02), al final: la `CasillaSola` de ui.tsx, la misma caja de todas las casillas de la APK, con
 * un área de toque de 44 dp. Su nombre dice lo que hace («Registrar la serie 2») y el lector agrega si está marcada.
 * Marcada es «registrada»: un estado, no una aprobación. Una serie en conflicto no se tilda ni se destilda acá: se
 * resuelve en el aviso del conflicto.
 */
function CasillaDeLaFila({ fila: f, ocupado, onTildar }: { fila: FilaDeLaTabla; ocupado: boolean; onTildar: () => void }) {
  const t = TEXTOS_DE_LA_SESION;
  const marcada = f.estado !== 'sin-registrar';
  const enConflicto = f.estado === 'en-conflicto';
  return (
    <View style={estilos.celdaCasilla}>
      <CasillaSola
        marcada={marcada}
        onCambio={onTildar}
        etiqueta={t.registrarLaSerie(f.setIndex)}
        pista={enConflicto ? t.enConflictoSinTilde : marcada ? t.pistaParaDestildar : t.pistaParaTildar}
        deshabilitada={ocupado || enConflicto}
      />
    </View>
  );
}

/**
 * Una celda que se escribe. El objetivo de esa serie se ve en gris mientras está vacía: es un texto encima, que no recibe
 * toques ni entra en lo que se guarda. Se usa en lugar del placeholder del campo para que «Sin objetivo» pueda partirse en
 * dos líneas en una celda angosta.
 */
function CeldaEditable({
  valor,
  placeholder,
  teclado,
  error,
  etiqueta,
  enfocarAlMostrar = false,
  onCambiar,
}: {
  valor: string;
  placeholder: string;
  teclado: KeyboardTypeOptions;
  error: string | undefined;
  etiqueta: string;
  enfocarAlMostrar?: boolean;
  onCambiar: (texto: string) => void;
}) {
  return (
    <View style={[estilos.celda, estilos.celdaEditable, error ? estilos.celdaConError : null]}>
      {valor === '' && placeholder !== '' ? (
        <View style={estilos.capaDelPlaceholder} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={[estilos.placeholder, placeholder === COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo && estilos.placeholderSinObjetivo]} numberOfLines={2}>
            {placeholder}
          </Text>
        </View>
      ) : null}
      <TextInput value={valor} onChangeText={onCambiar} keyboardType={teclado} accessibilityLabel={etiqueta} style={estilos.entradaDeCelda} maxLength={LARGO_DE_UNA_CELDA} autoFocus={enfocarAlMostrar} selectTextOnFocus />
    </View>
  );
}

/** Con la letra grande: cada serie en su tarjeta, con sus cuatro campos, el reloj y la casilla de ui.tsx. */
function TarjetaDeSerie({ fila: f, activa, unidad, escrita, errores, relojEnCurso, relojDisponible, ocupado, acciones }: PropsDeFila) {
  const t = TEXTOS_DE_LA_SESION;
  const p = placeholdersDeLaSerie(f.objetivo, unidad);
  const estado = activa ? COPY_ENTRENAMIENTO_POR_SERIE.serieActual : f.estado === 'sin-registrar' ? (escrita && hayAlgoEscrito(escrita) ? t.escritaSinRegistrar : null) : textoDeEstadoDeFila(f);
  // La tildada sin escribir nada lleva «como el plan» en su título; la escrita, nada más (DL-161).
  const comoElPlan = f.registrada?.recordedAs === 'AS_PLANNED' ? t.comoElPlan : null;
  const titulo = [`${COPY_ENTRENAMIENTO.serie} ${numero(f.setIndex, 0)}`, estado, comoElPlan].filter((x): x is string => x !== null).join(' · ');
  const etiquetaDe = (campo: keyof FilaEscrita) =>
    campo === 'carga' ? `${COPY_ENTRENAMIENTO.carga} (${unidad})` : campo === 'repeticiones' ? COPY_ENTRENAMIENTO_POR_SERIE.columnaRepeticiones : campo === 'rir' ? COPY_ENTRENAMIENTO_POR_SERIE.rirTitulo : `${t.columnaTiempo} (opcional)`;
  const casilla = (
    <Casilla
      marcada={f.estado !== 'sin-registrar'}
      onCambio={() => {
        if (!ocupado && f.estado !== 'en-conflicto') acciones.onTildar(f);
      }}
      titulo={t.registrarLaSerie(f.setIndex)}
      texto={f.estado === 'en-conflicto' ? t.enConflictoSinTilde : f.estado === 'sin-registrar' ? t.pistaParaTildar : t.pistaParaDestildar}
      deshabilitada={ocupado || f.estado === 'en-conflicto'}
    />
  );
  const botonDelReloj = relojEnCurso ? (
    <Boton texto={`${t.pararElReloj(f.setIndex)} · ${relojEnCurso.texto}`} tipo="secundario" onPress={() => acciones.onReloj(f.setIndex)} deshabilitado={ocupado} />
  ) : relojDisponible && f.estado === 'sin-registrar' && (escrita?.tiempo ?? '') === '' ? (
    <Boton texto={t.medirLaSerie(f.setIndex)} tipo="secundario" onPress={() => acciones.onReloj(f.setIndex)} deshabilitado={ocupado} />
  ) : null;
  if (activa && f.estado === 'sin-registrar') {
    return (
      <View style={[estilos.tarjetaDeSerie, estilos.tarjetaActiva]}>
        <Text style={estilos.tituloDeTarjeta}>{titulo}</Text>
        {(['carga', 'repeticiones', 'rir', 'tiempo'] as const).map((campo) => (
          <Campo
            key={campo}
            etiqueta={etiquetaDe(campo)}
            value={escrita?.[campo] ?? ''}
            placeholder={campo === 'tiempo' ? '' : p[campo]}
            keyboardType={campo === 'repeticiones' ? 'number-pad' : campo === 'tiempo' ? 'numbers-and-punctuation' : 'decimal-pad'}
            maxLength={LARGO_DE_UNA_CELDA}
            error={errores[campo] ?? null}
            onChangeText={(texto) => acciones.onEscribir(f.setIndex, campo, texto)}
          />
        ))}
        {botonDelReloj}
        {casilla}
      </View>
    );
  }
  const r = textoRegistrado(f);
  const valor = (campo: 'carga' | 'repeticiones' | 'rir' | 'tiempo'): string => {
    if (f.registrada) return r[campo];
    const escrito = escrita?.[campo] ?? '';
    if (escrito.trim() !== '') return escrito;
    return campo === 'tiempo' ? '—' : p[campo];
  };
  return (
    <View style={[estilos.tarjetaDeSerie, (f.estado === 'guardada' || f.estado === 'pendiente-de-enviar') && estilos.tarjetaRegistrada, activa && estilos.tarjetaActiva]}>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: activa }} accessibilityLabel={fraseDeLaFila(f, unidad, activa, escrita)} onPress={() => acciones.onEnfocar(f.setIndex)} style={({ pressed }) => [pressed && estilos.presionado]}>
        <Text style={estilos.tituloDeTarjeta}>{titulo}</Text>
        {(['carga', 'repeticiones', 'rir', 'tiempo'] as const).map((campo) => (
          <View key={campo} style={estilos.parDeTarjeta} importantForAccessibility="no-hide-descendants">
            <Text style={estilos.etiquetaDeTarjeta}>{etiquetaDe(campo)}</Text>
            <Text style={f.registrada || (escrita?.[campo] ?? '').trim() !== '' ? estilos.valorRegistrado : estilos.placeholder}>{valor(campo)}</Text>
          </View>
        ))}
      </Pressable>
      {botonDelReloj}
      {casilla}
    </View>
  );
}

/** Los errores de la fila que se quiso tildar, con texto, debajo de la tabla. El de cada campo también va en su nombre accesible. */
export function ErroresDeLaFila({ errores }: { errores: { readonly setIndex: number; readonly errores: ErroresDeFila } | null }) {
  if (!errores) return null;
  const e = errores.errores;
  const nombres = { carga: COPY_ENTRENAMIENTO.carga, repeticiones: 'Repeticiones', rir: 'RIR', tiempo: TEXTOS_DE_LA_SESION.columnaTiempo } as const;
  const lista = [...(e.fila ? [e.fila] : []), ...(['carga', 'repeticiones', 'rir', 'tiempo'] as const).filter((c) => e[c]).map((c) => `${nombres[c]}: ${e[c]}`)];
  if (lista.length === 0) return null;
  return <Aviso tipo="error" titulo={`${COPY_ENTRENAMIENTO.serie} ${numero(errores.setIndex, 0)}. ${lista.join(' ')}`} />;
}

// ─── La banda y la ayuda de la tabla ────────────────────────────────────────────────────────────

export function BandaDelPlan({ banda }: { banda: ReturnType<typeof bandaDeLaSerie> }) {
  return (
    <View style={[estilos.tarjeta, estilos.conIcono]} accessible accessibilityLabel={banda.completa}>
      <IconoDePlan color={COLOR.acento} />
      <View style={estilos.textos}>
        <Text style={estilos.tituloDeBloque}>{banda.titulo}</Text>
        <Text style={estilos.textoDeBloque}>{banda.plan}</Text>
        {banda.descanso ? <Text style={estilos.detalle}>{banda.descanso}</Text> : null}
      </View>
    </View>
  );
}

/**
 * La ayuda de la tabla, plegada junto a su encabezado con el (?) de `Ayuda` (ui.tsx): que tildar sin escribir
 * guarda lo planificado, cómo se deshace, que el tiempo es opcional y la ayuda del RIR con su ejemplo, literales del
 * encargo, sin abreviar.
 */
export function AyudaDeLaTabla() {
  const e = COPY_ENTRENAMIENTO_POR_SERIE;
  const t = TEXTOS_DE_LA_SESION;
  const faltaUnDato = `${e.faltaUnDato.charAt(0).toLowerCase()}${e.faltaUnDato.slice(1)}`;
  return (
    <Ayuda titulo={t.ayudaTitulo} icono="pregunta">
      <Parrafo>{t.ayudaTildar}</Parrafo>
      <Parrafo>{`${t.ayudaRango} Si la serie no tiene nada planificado en la carga ni en las repeticiones, ${faltaUnDato}`}</Parrafo>
      <Parrafo>{t.ayudaDestildar}</Parrafo>
      <Parrafo>{t.ayudaTiempo}</Parrafo>
      <Parrafo>{`${e.rirTitulo}: ${e.rirAyuda}. ${e.rirEjemplo}.`}</Parrafo>
      <Parrafo tenue>{t.ayudaGuardado}</Parrafo>
    </Ayuda>
  );
}

// ─── El descanso (DL-166: AV-10 a AV-12) ───────────────────────────────────────────────────────

export type EstadoDelDescanso =
  /** Con el ajuste manual («Lo inicio yo»): el descanso de la serie que se hizo, para iniciarlo a mano. */
  | { readonly tipo: 'disponible'; readonly serie: number; readonly recomendado: number | null }
  | { readonly tipo: 'en-curso'; readonly serie: number; readonly ejercicio: string | null; readonly duracion: DuracionApi | null; readonly recomendado: number | null; readonly siguiente: number | null };

/** Lo que el bloque dice del permiso de avisos (AVD-8): la frase de para qué con «Permitir avisos», o que vibra solo con la app abierta. */
export type AvisoDelPermiso = 'nada' | 'explicar' | 'solo-con-la-app-abierta';

/**
 * La barra del descanso (PV-7): de 0 al recomendado. Pasado el recomendado queda llena, sin cambiar de color y sin cortar
 * nada. No se anima: el ancho sale del tiempo transcurrido en cada dibujo, así con movimiento reducido es igual. El lector
 * la lee solo si la persona la recorre: «72 segundos de 90».
 */
function BarraDelDescanso({ llenado, segundos, recomendado }: { llenado: number; segundos: number; recomendado: number }) {
  return (
    <View accessible accessibilityLabel={TEXTOS_DEL_DESCANSO.barraParaLeer(segundos, recomendado)}>
      {/* Lo lleno y lo que falta reparten la pista: sin porcentajes en el código, que la guardia T13 lee. */}
      <View style={estilos.pistaDelDescanso}>
        <View style={[estilos.llenoDelDescanso, { flex: llenado }]} />
        <View style={{ flex: 1 - llenado }} />
      </View>
      <View style={estilos.extremosDelDescanso} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Text style={estilos.detalle}>0:00</Text>
        <Text style={estilos.detalle}>{textoDeSegundos(recomendado)}</Text>
      </View>
    </View>
  );
}

/**
 * El bloque del descanso, debajo del ejercicio y arriba de las series (PV-7). Corriendo: «Descanso · tras la serie N», el
 * conteo, «de 1:30 recomendado», la barra y «Al terminar, seguís con la serie N». Al lado, el engranaje de sus ajustes
 * («las configuraciones así tienen que ser contextuales»). Con «Lo inicio yo», «Iniciar descanso», como antes. Sin
 * recomendado, conteo sin barra. Terminarlo es «Empezar serie N», en la fila fija; si no queda una serie que empezar, el
 * bloque ofrece «Finalizar descanso».
 */
export function BloqueDeDescanso({
  estado,
  onIniciar,
  onFinalizar,
  onAjustes,
  avisoDelPermiso,
  onPermitir,
  onAhoraNo,
  deshabilitado,
}: {
  estado: EstadoDelDescanso | null;
  onIniciar: () => void;
  onFinalizar: () => void;
  onAjustes: () => void;
  avisoDelPermiso: AvisoDelPermiso;
  onPermitir: () => void;
  onAhoraNo: () => void;
  deshabilitado: boolean;
}) {
  const e = COPY_ENTRENAMIENTO_POR_SERIE;
  const T = TEXTOS_DEL_DESCANSO;
  if (!estado) return null;
  const engranaje = <BotonDeIcono nombre="engranaje" etiqueta={T.ajustesDelDescanso} onPress={onAjustes} />;
  if (estado.tipo === 'disponible') {
    const recomendado = estado.recomendado === null ? e.sinDescansoRecomendado : e.recomendadoTrasLaSerie(estado.serie, textoDeSegundos(estado.recomendado) ?? '');
    return (
      <View style={[estilos.tarjeta, estilos.descansoAlPie]}>
        <View style={estilos.cabezaDelDescanso}>
          <View style={[estilos.conIcono, estilos.textos]} accessible accessibilityLabel={`${COPY_ENTRENAMIENTO.descanso}. ${recomendado}`}>
            <Icono nombre="descanso" tamano={24} tono="acento" />
            <View style={estilos.textos}>
              <Text style={estilos.tituloDeBloque}>{COPY_ENTRENAMIENTO.descanso}</Text>
              <Text style={estilos.detalle}>{recomendado}</Text>
            </View>
          </View>
          {engranaje}
        </View>
        <Boton texto={e.iniciarDescanso} tipo="secundario" onPress={onIniciar} deshabilitado={deshabilitado} />
      </View>
    );
  }
  const ms = estado.duracion?.ms ?? null;
  const llenado = llenadoDeLaBarra(ms, estado.recomendado);
  const titulo = T.descansoTrasLaSerie(estado.serie);
  return (
    <View style={[estilos.tarjeta, estilos.descansoEnCurso]}>
      <View style={estilos.cabezaDelDescanso}>
        <View style={[estilos.conIcono, estilos.textos]}>
          <Icono nombre="descanso" tamano={20} tono="acento" />
          <Text style={[estilos.tituloDeBloque, estilos.textos]} accessibilityRole="header">
            {titulo}
          </Text>
        </View>
        {engranaje}
      </View>
      {estado.ejercicio ? <Text style={estilos.detalle}>{estado.ejercicio}</Text> : null}
      <View style={estilos.conteoDelDescanso}>
        {/* El conteo no se anuncia segundo a segundo: TalkBack dice solo el inicio y el recomendado (§4.0). */}
        <Text style={estilos.relojGrande} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {reloj(estado.duracion)}
        </Text>
        <Text style={estilos.detalle}>{estado.recomendado === null ? e.sinDescansoRecomendado : T.deRecomendado(textoDeSegundos(estado.recomendado) ?? '')}</Text>
      </View>
      {llenado !== null && estado.recomendado !== null ? <BarraDelDescanso llenado={llenado} segundos={Math.floor((ms ?? 0) / 1000)} recomendado={estado.recomendado} /> : null}
      {estado.duracion && estado.duracion.quality !== 'MEASURED' ? <Text style={estilos.calidad}>{ETIQUETA_DE_CALIDAD_DE_TIEMPO[estado.duracion.quality]}</Text> : null}
      {estado.siguiente !== null ? (
        <View style={estilos.conIcono}>
          <Icono nombre="derecha" tamano={18} tono="tenue" />
          <Text style={estilos.detalle}>{T.alTerminarSeguisCon(estado.siguiente)}</Text>
        </View>
      ) : (
        <Boton texto={e.finalizarDescanso} tipo="enlace" onPress={onFinalizar} deshabilitado={deshabilitado} />
      )}
      {avisoDelPermiso === 'explicar' ? (
        <View style={estilos.pedidoDelPermiso}>
          <Text style={estilos.detalle}>{T.paraVibrarBloqueado}</Text>
          <Boton texto={T.permitirAvisos} onPress={onPermitir} />
          <Boton texto={T.ahoraNo} tipo="enlace" onPress={onAhoraNo} />
        </View>
      ) : null}
      {avisoDelPermiso === 'solo-con-la-app-abierta' ? <Text style={estilos.detalle}>{T.vibraSoloConLaAppAbierta}</Text> : null}
    </View>
  );
}

/**
 * La hoja del engranaje (AV-11): cómo funciona el descanso en dos frases, y los ajustes, guardados en este teléfono. Cada
 * ajuste es un grupo de opciones con la elegida marcada. El de la serie siguiente («La inicio yo» o «Arranca sola») no
 * está: llega con AV-15, y hasta entonces no se ofrece una opción que todavía no funciona.
 */
export function HojaDelDescanso({
  visible,
  ajustes,
  permiso,
  onCambiar,
  onPermitir,
  onCerrar,
}: {
  visible: boolean;
  ajustes: AjustesDelDescanso;
  permiso: PermisoDeAvisos;
  onCambiar: (cambios: Partial<AjustesDelDescanso>) => void;
  onPermitir: () => void;
  onCerrar: () => void;
}) {
  const T = TEXTOS_DEL_DESCANSO;
  const { height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar} statusBarTranslucent>
      <View style={estilos.fondoDeLaHoja}>
        <ScrollView style={[estilos.hoja, { maxHeight: Math.round(height * 0.85) }]} contentContainerStyle={estilos.contenidoDeLaHoja} accessibilityViewIsModal>
          <View style={estilos.cabezaDelDescanso}>
            <View style={[estilos.conIcono, estilos.textos]}>
              <Icono nombre="engranaje" tamano={24} tono="acento" />
              <Text style={[estilos.tituloDeBloque, estilos.textos]} accessibilityRole="header">
                {T.comoFunciona}
              </Text>
            </View>
            <BotonDeIcono nombre="cerrar" etiqueta={T.cerrarLosAjustes} onPress={onCerrar} />
          </View>
          <Text style={estilos.detalle}>{T.comoFuncionaTexto}</Text>
          <Text style={estilos.detalle}>{T.comoFuncionaManual}</Text>
          <Text style={estilos.rotuloDeAjuste}>{T.empezarElDescanso}</Text>
          <Segmentos
            etiqueta={T.empezarElDescanso}
            opciones={[
              { valor: 'automatico', texto: T.alGuardarLaSerie },
              { valor: 'manual', texto: T.loInicioYo },
            ]}
            valor={ajustes.inicio}
            alElegir={(inicio) => onCambiar({ inicio })}
          />
          <CasillaSola marcada={ajustes.vibrar} onCambio={(vibrar) => onCambiar({ vibrar })} etiqueta={T.vibrarAlLlegar} />
          {ajustes.vibrar ? <CasillaSola marcada={ajustes.tambienBloqueado} onCambio={(tambienBloqueado) => onCambiar({ tambienBloqueado })} etiqueta={T.tambienBloqueado} /> : null}
          {ajustes.vibrar && ajustes.tambienBloqueado && permiso === 'sin-pedir' ? (
            <View style={estilos.pedidoDelPermiso}>
              <Text style={estilos.detalle}>{T.paraVibrarBloqueado}</Text>
              <Boton texto={T.permitirAvisos} onPress={onPermitir} />
            </View>
          ) : null}
          {ajustes.vibrar && ajustes.tambienBloqueado && permiso === 'negado' ? <Text style={estilos.detalle}>{T.vibraSoloConLaAppAbierta}</Text> : null}
          <Text style={[estilos.detalle, estilos.pieDeLaHoja]}>{T.ajustesEnEsteTelefono}</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Primera vez, mediciones abiertas y envío ───────────────────────────────────────────────────

/** La explicación de los tiempos, una vez por cuenta, al iniciar el primer entrenamiento. Literal del encargo. */
export function ExplicacionDeLosTiempos({ onEntendido }: { onEntendido: () => void }) {
  return (
    <View style={[estilos.tarjeta, estilos.explicacion]} accessibilityRole="summary">
      <View style={estilos.conIcono}>
        <Icono nombre="reloj" tamano={24} tono="acento" />
        <Text style={[estilos.tituloDeBloque, estilos.textos]}>{COPY_ENTRENAMIENTO_POR_SERIE.explicacionDeTiempos}</Text>
      </View>
      <Desplegable titulo="Qué se mide y quién lo ve">
        <Parrafo>
          Se guardan los momentos en que tocás Iniciar entrenamiento, Pausar sesión, Reanudar sesión, Iniciar y Finalizar descanso, el reloj de una serie y Finalizar entrenamiento. Abrir la técnica, la rutina, el plan o el historial no se guarda.
        </Parrafo>
        <Parrafo>Los ven vos y el profesional de tu plan. No usamos ubicación, micrófono, cámara ni sensores.</Parrafo>
        <Parrafo tenue>{COPY_ENTRENAMIENTO_POR_SERIE.noSonMinutosDeEsfuerzo}</Parrafo>
      </Desplegable>
      <Boton texto={COPY_ENTRENAMIENTO_POR_SERIE.entendido} tipo="secundario" onPress={onEntendido} />
    </View>
  );
}

/**
 * Una medición abierta que hay que resolver: la app se cerró con ella en curso (`laSesionQuedoAbierta`), o se quiere
 * finalizar con ella abierta (`medicionAbierta`). No se cierra sola: la persona decide qué pasó.
 */
export function AvisoDeMedicionAbierta({ titulo, descripcion, onTerminoAhora, onIncompleta, ocupado }: { titulo: string; descripcion: string; onTerminoAhora: () => void; onIncompleta: () => void; ocupado: boolean }) {
  return (
    <Aviso tipo="info" titulo={titulo}>
      <Parrafo>{descripcion}</Parrafo>
      <Boton texto={COPY_ENTRENAMIENTO_POR_SERIE.terminoAhora} onPress={onTerminoAhora} deshabilitado={ocupado} />
      <Boton texto={COPY_ENTRENAMIENTO_POR_SERIE.dejarIncompleta} tipo="secundario" onPress={onIncompleta} deshabilitado={ocupado} />
      <Parrafo tenue>«Terminó ahora» guarda este momento como el fin, declarado por vos: el tiempo queda como estimado. «Dejarla incompleta» no guarda ningún fin.</Parrafo>
    </Aviso>
  );
}

/** Qué pasó con un conflicto, dicho para la persona. Ninguno se pisa en silencio. */
export function explicacionDelConflicto(problema: Extract<ProblemaDeSincronizacion, { tipo: 'conflicto' }>): string {
  if (problema.de === 'borrador') {
    if (problema.motivo === 'SET_ALREADY_REGISTERED') return 'Una serie que guardaste en el teléfono ya está guardada con otros datos. No la pisamos: elegí qué hacer con la del teléfono.';
    if (problema.motivo === 'VERSION_CONFLICT') return 'El registro de esta sesión cambió en otro dispositivo. No pisamos esos cambios: actualizá para ver lo que quedó guardado.';
    return 'El servicio no aceptó un dato de las series. Actualizá para ver lo que quedó guardado.';
  }
  switch (problema.motivo) {
    case 'ANOTHER_SESSION_IN_PROGRESS':
      return 'Esta sesión se inició con otro entrenamiento sin finalizar. Continualo o dejalo incompleto: después, esta sesión se vuelve a enviar sin perder lo que marcaste ni lo que escribiste.';
    case 'SESSION_FINISHED':
      return 'Este entrenamiento ya se cerró en otro dispositivo. Los tiempos que marcaste acá no se guardaron.';
    case 'SESSION_ALREADY_STARTED':
    case 'RUN_MISMATCH':
    case 'SEQUENCE_REUSED':
    case 'EVENT_ID_REUSED':
      return 'Los tiempos de este entrenamiento se marcaron también en otro dispositivo. No pisamos lo que ya está guardado.';
    default:
      return 'El servicio no aceptó un tiempo marcado. No lo descartamos: decidí qué hacer.';
  }
}

/**
 * Dónde está lo registrado en esta sesión: primero el guardado en el teléfono (si no se pudo leer o guardar, lo dice con
 * su «Reintentar»), después el envío al servicio. Cada texto dice lo que es cierto en ese momento: «guardado en el
 * teléfono» solo con la escritura confirmada, y «enviado» solo con el servicio.
 */
export function EstadoDelEnvio({
  estado,
  guardado,
  problema,
  conflictos,
  onReintentar,
  onReintentarGuardado,
  onReintentarLectura,
  onActualizar,
  onUsarLoDelServidor,
  onDescartarSerie,
}: {
  estado: EstadoDeSincronizacion;
  guardado: EstadoDelGuardado;
  problema: ProblemaDeSincronizacion | null;
  conflictos: readonly (SerieLocal & { readonly nombre: string })[];
  onReintentar: () => void;
  onReintentarGuardado: () => void;
  onReintentarLectura: () => void;
  onActualizar: () => void;
  onUsarLoDelServidor: () => void;
  onDescartarSerie: (s: SerieLocal) => void;
}) {
  const e = COPY_ENTRENAMIENTO_POR_SERIE;
  const g = TEXTOS_DEL_GUARDADO;
  const delGuardado = avisoDelGuardadoDe(guardado, estado);
  const avisoDelGuardado = delGuardado ? (
    <Aviso tipo="error" titulo={delGuardado.titulo}>
      {delGuardado.textos.map((texto) => (
        <Parrafo key={texto}>{texto}</Parrafo>
      ))}
      <Boton texto={delGuardado.boton} tipo="secundario" onPress={delGuardado.accion === 'leer' ? onReintentarLectura : onReintentarGuardado} />
    </Aviso>
  ) : null;
  const linea = lineaDelEnvio(estado, guardado);
  if (estado === 'sincronizado' && linea) {
    return (
      <>
        {avisoDelGuardado}
        <View style={estilos.estadoDelEnvio} accessible accessibilityLabel={linea}>
          <IconoDeRegistrado color={COLOR.botonTexto} fondo={COLOR.acento} tamano={18} />
          <Text style={estilos.detalle}>{linea}</Text>
        </View>
      </>
    );
  }
  if ((estado === 'pendiente' || estado === 'enviando') && linea) {
    if (avisoDelGuardado) return avisoDelGuardado;
    const texto = linea;
    return (
      <View style={estilos.estadoDelEnvio} accessible accessibilityLabel={texto}>
        <IconoDeNube color={COLOR.tenue} />
        <Text style={estilos.detalle}>{texto}</Text>
      </View>
    );
  }
  if (estado === 'error') {
    return (
      <>
        {avisoDelGuardado}
        <Aviso tipo="error" titulo={g.noSePudoEnviar}>
          {problema?.tipo === 'error' && problema.sinConexion ? <Parrafo>Parece que no hay conexión.</Parrafo> : null}
          {guardado === 'en-el-telefono' ? <Parrafo>{g.quedaEnElTelefono}</Parrafo> : null}
          <Boton texto={e.reintentar} tipo="secundario" onPress={onReintentar} />
        </Aviso>
      </>
    );
  }
  const conflicto: Extract<ProblemaDeSincronizacion, { tipo: 'conflicto' }> = problema?.tipo === 'conflicto' ? problema : { tipo: 'conflicto', de: 'borrador', motivo: 'SET_ALREADY_REGISTERED' };
  return (
    <>
      {avisoDelGuardado}
      <Aviso tipo="error" titulo="Hay un conflicto con lo guardado">
        <Parrafo>{explicacionDelConflicto(conflicto)}</Parrafo>
        {conflictos.map((s) => (
          <View key={`${s.prescriptionId}-${s.serie.setIndex}`}>
            <Parrafo>{`${s.nombre} · ${COPY_ENTRENAMIENTO.serie} ${s.serie.setIndex}`}</Parrafo>
            <Boton texto="Descartar la del teléfono" tipo="peligroSecundario" onPress={() => onDescartarSerie(s)} />
          </View>
        ))}
        {conflicto.de === 'borrador' && conflictos.length === 0 ? <Boton texto="Actualizar" tipo="secundario" onPress={onActualizar} /> : null}
        {conflicto.de === 'tiempos' ? (
          <>
            <Boton texto={e.reintentar} tipo="secundario" onPress={onReintentar} />
            <Boton texto="Usar los tiempos guardados" tipo="peligroSecundario" onPress={onUsarLoDelServidor} />
          </>
        ) : null}
      </Aviso>
    </>
  );
}

// ─── La rutina y la técnica ─────────────────────────────────────────────────────────────────────

/** `ocupado`: mientras se guarda algo del diálogo, no se cierra, para que su resultado no quede sin decirse. */
function Dialogo({ visible, titulo, onCerrar, ocupado = false, children }: { visible: boolean; titulo: string; onCerrar: () => void; ocupado?: boolean; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={ocupado ? () => undefined : onCerrar}>
      <View style={estilos.velo}>
        {/* Como en la pantalla (App.tsx): con el teclado abierto, el primer toque en un botón ya lo acciona. */}
        <ScrollView contentContainerStyle={estilos.centrado} keyboardShouldPersistTaps="handled">
          <View style={estilos.dialogo} accessibilityViewIsModal>
            <Text style={estilos.tituloDeDialogo} accessibilityRole="header">
              {titulo}
            </Text>
            {children}
            <Boton texto="Volver a la sesión" tipo="secundario" onPress={onCerrar} deshabilitado={ocupado} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

/** «Ver rutina»: los ejercicios de la sesión. Ver la técnica de otro no cambia el activo; «Pasar a este ejercicio», sí. */
export function RutinaDeLaSesion({
  visible,
  sesion,
  activo,
  resumen,
  puedeCambiar,
  motivoParaNoCambiar,
  onVerTecnica,
  onPasarA,
  onCerrar,
}: {
  visible: boolean;
  sesion: SesionConObjetivos;
  activo: string;
  resumen: readonly ResumenDelEjercicio[];
  puedeCambiar: boolean;
  motivoParaNoCambiar: string | null;
  onVerTecnica: (prescriptionId: string) => void;
  onPasarA: (prescriptionId: string) => void;
  onCerrar: () => void;
}) {
  const e = COPY_ENTRENAMIENTO_POR_SERIE;
  return (
    <Dialogo visible={visible} titulo={sesion.label} onCerrar={onCerrar}>
      {sesion.prescriptions.map((p, i) => {
        const r = resumen.find((x) => x.prescriptionId === p.prescriptionId);
        const esActivo = p.prescriptionId === activo;
        return (
          <View key={p.prescriptionId} style={[estilos.itemDeRutina, esActivo && estilos.itemActivo]}>
            <Text style={estilos.tituloDeBloque}>{`${numero(i + 1, 0)}. ${p.exerciseName}`}</Text>
            {r?.ejecutado ? <LineaDeLaSustitucion ejecutado={r.ejecutado} /> : null}
            {r ? <Text style={estilos.detalle}>{seriesYEscritas(r)}</Text> : null}
            {esActivo ? <Insignia texto={e.ejercicioActivo} positiva /> : null}
            <Boton texto={e.verTecnica} tipo="enlace" onPress={() => onVerTecnica(p.prescriptionId)} />
            {esActivo ? null : <Boton texto={e.pasarAEsteEjercicio} tipo="secundario" onPress={() => onPasarA(p.prescriptionId)} deshabilitado={!puedeCambiar} />}
          </View>
        );
      })}
      {!puedeCambiar && motivoParaNoCambiar ? <Parrafo tenue>{motivoParaNoCambiar}</Parrafo> : null}
    </Dialogo>
  );
}

/**
 * «Ver técnica»: la imagen grande con su texto alternativo y su rol, la procedencia, la autoría, la licencia y la
 * revisión técnica, y las notas del profesional. La imagen ilustra para reconocer el ejercicio: no certifica la técnica.
 */
export function TecnicaDelEjercicio({ visible, prescripcion: p, token, sesionPerdida, onCerrar }: { visible: boolean; prescripcion: PrescripcionConObjetivos | null; token: string; sesionPerdida: AlPerderLaSesion; onCerrar: () => void }) {
  if (!p) return null;
  const notas = [
    ...(p.note ? [`${COPY_ENTRENAMIENTO.notas}: ${p.note}`] : []),
    ...p.sets.filter((s) => s.note).map((s) => `${COPY_ENTRENAMIENTO.serie} ${s.setIndex}: ${s.note}`),
    ...p.professionalParameters.map((q) => `${q.label}: ${typeof q.value === 'number' ? numero(q.value) : q.value}${q.unit ? ` ${q.unit}` : ''}`),
  ];
  return (
    <Dialogo visible={visible} titulo={p.exerciseName} onCerrar={onCerrar}>
      {/* La ilustración, entera. Su texto alternativo describe la imagen: no es una indicación, y se muestra rotulado. */}
      <ImagenDeMedio token={token} mediaId={p.image?.mediaId ?? null} sesionPerdida={sesionPerdida} rotulo={p.image?.altText || p.exerciseName} proporcion={1} respaldo={RESPALDO_DE_EJERCICIO} rotuloVisible={false} ajuste="contener" />
      <Parrafo tenue>{ROL_DE_LA_IMAGEN}</Parrafo>
      {p.image ? (
        <>
          <Dato etiqueta="Descripción de la imagen" valor={p.image.altText} />
          <Dato etiqueta="Procedencia" valor={ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN[p.image.provenance]} />
          <Dato etiqueta="Autoría" valor={p.image.authorship} />
          <Dato etiqueta="Licencia" valor={textoDeLicencia(p.image.license)} />
          <Dato etiqueta="Revisión técnica" valor={ETIQUETA_DE_REVISION_TECNICA[p.image.technicalReview]} />
        </>
      ) : null}
      {notas.length > 0 ? (
        <View style={estilos.notas}>
          <Text style={estilos.tituloDeBloque}>Indicaciones del profesional</Text>
          {notas.map((n) => (
            <Parrafo key={n}>{n}</Parrafo>
          ))}
        </View>
      ) : null}
    </Dialogo>
  );
}

// ─── Sustituir el ejercicio (DL-151) ────────────────────────────────────────────────────────────

/**
 * «Sustituir ejercicio», como en la 0.13.2: se busca en el catálogo el ejercicio que la persona hizo en lugar del
 * planificado y se confirma con «Confirmar sustitución: …». Es un diálogo, así que detrás la sesión sigue como estaba:
 * el temporizador, el descanso o la serie cronometrada, y la fila enfocada. Lo que se guarda lo decide la pantalla
 * (`onElegir`), con las reglas de `sustitucion-de-ejercicio.ts`.
 * - Los resultados no repiten el ejercicio que ya figura ni el planificado, en ninguna versión (`sustitutosPosibles`):
 *   volver al planificado tiene su propio botón.
 * - Un ejercicio importado dice de dónde vino también acá, donde se lo elige (RF-060; WP-08), y uno encontrado por un
 *   nombre alternativo lo muestra entre paréntesis (DL-141).
 * - Un error al buscar no es un catálogo vacío (B10-10:41).
 */
export function SustituirEjercicio({
  visible,
  sustitucion,
  buscar,
  sesionPerdida,
  ocupado,
  fallo,
  onElegir,
  onCerrar,
}: {
  visible: boolean;
  sustitucion: SustitucionDelEjercicio | null;
  /** API-TRN-13-BUSQUEDA: el texto va en el cuerpo, nunca en una URL (DL-130). */
  buscar: (texto: string) => Promise<Resultado<{ readonly data: readonly EjercicioEncontrado[] }>>;
  sesionPerdida: AlPerderLaSesion;
  ocupado: boolean;
  /** Por qué no se pudo guardar la sustitución, dicho adentro del diálogo, al lado de lo que se tocó. */
  fallo: string | null;
  onElegir: (elegido: EjercicioNombrado) => void;
  onCerrar: () => void;
}) {
  const t = TEXTOS_DE_LA_SUSTITUCION;
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<readonly EjercicioEncontrado[] | null>(null);
  // Sin conexión se dice que sustituir la necesita (R-5); otro fallo, que no se pudo buscar. Ninguno es un catálogo vacío.
  const [falloDeBusqueda, setFalloDeBusqueda] = useState<'sin-conexion' | 'otro' | null>(null);
  const [buscando, setBuscando] = useState(false);
  // Cada vez que se abre, la búsqueda empieza de cero. Mientras está abierto, un fallo no borra lo escrito.
  useEffect(() => {
    if (visible) return;
    setTexto('');
    setResultados(null);
    setFalloDeBusqueda(null);
  }, [visible]);
  if (!sustitucion) return null;
  const { planificado, ejecutado } = sustitucion;

  async function hacerLaBusqueda() {
    if (buscando) return;
    setBuscando(true);
    const r = await buscar(texto.trim());
    setBuscando(false);
    if (sesionPerdida(r)) return;
    setFalloDeBusqueda(r.ok ? null : r.tipo === 'RED' ? 'sin-conexion' : 'otro');
    setResultados(r.ok ? r.datos.data : null);
  }

  const opciones = sustitutosPosibles(sustitucion, resultados ?? []);
  return (
    <Dialogo visible={visible} titulo={COPY_ENTRENAMIENTO.sustituirEjercicio} onCerrar={onCerrar} ocupado={ocupado}>
      <Dato etiqueta={COPY_ENTRENAMIENTO.planificado} valor={planificado.nombre} />
      {ejecutado ? <LineaDeLaSustitucion ejecutado={ejecutado.nombre} /> : null}
      <Parrafo tenue>{t.ayuda}</Parrafo>
      {sustitucion.registradas > 0 ? <Parrafo tenue>{t.yaRegistradas(sustitucion.registradas)}</Parrafo> : null}
      <Campo etiqueta={t.campo} value={texto} onChangeText={setTexto} autoCorrect={false} returnKeyType="search" onSubmitEditing={() => void hacerLaBusqueda()} />
      <Boton texto={t.buscar} tipo="secundario" onPress={() => void hacerLaBusqueda()} ocupado={buscando} deshabilitado={ocupado} />
      {falloDeBusqueda ? <Aviso tipo="error" titulo={falloDeBusqueda === 'sin-conexion' ? t.sinConexionAlBuscar : t.noSePudoBuscar} /> : null}
      {resultados && opciones.length === 0 ? <Parrafo tenue>{t.sinResultados}</Parrafo> : null}
      {opciones.map((e) => (
        <Boton
          key={e.versionId}
          texto={`${COPY_ENTRENAMIENTO.confirmarSustitucion}: ${nombreConAlternativo(e.name, e.matchedAlternativeName)}${e.externalSource ? ` · ${COPY_INTEGRACIONES.importadoDe} ${ETIQUETA_DE_PROVEEDOR[e.externalSource.provider]}` : ''}`}
          tipo="secundario"
          onPress={() => onElegir({ versionId: e.versionId, nombre: e.name })}
          deshabilitado={ocupado}
        />
      ))}
      {ejecutado ? <Boton texto={t.volverAlPlanificado(planificado.nombre)} tipo="secundario" onPress={() => onElegir(planificado)} deshabilitado={ocupado} /> : null}
      {fallo ? <Aviso tipo="error" titulo={fallo} /> : null}
    </Dialogo>
  );
}

// ─── Antes de finalizar ─────────────────────────────────────────────────────────────────────────

export interface TiemposDelResumen {
  readonly sesion: DuracionApi | null;
  readonly calculo: CalculoDeTiempos | null;
  readonly nombreDe: (prescriptionId: string) => string;
}

/** Los tiempos marcados hasta ahora, cada uno con su calidad. No son minutos de esfuerzo ni una evaluación. */
export function TiemposMarcados({ tiempos }: { tiempos: TiemposDelResumen }) {
  const { calculo, nombreDe } = tiempos;
  return (
    <View>
      {tiempos.sesion ? <Dato etiqueta={COPY_ENTRENAMIENTO_POR_SERIE.sinPausas} valor={textoDeDuracion(tiempos.sesion)} /> : null}
      {(calculo?.rests ?? []).map((d) => (
        <Dato key={d.restId} etiqueta={`${COPY_ENTRENAMIENTO.descanso} · ${nombreDe(d.prescriptionId)} · ${COPY_ENTRENAMIENTO.serie} ${d.setIndex}`} valor={textoDeDescanso(d)} />
      ))}
      {(calculo?.timedSets ?? []).map((s) => (
        <Dato key={s.timingId} etiqueta={`${nombreDe(s.prescriptionId)} · ${COPY_ENTRENAMIENTO.serie} ${s.setIndex}`} valor={`${COPY_ENTRENAMIENTO_POR_SERIE.duracionMedida}: ${textoDeDuracion(s.duration)}`} />
      ))}
      <Parrafo tenue>{COPY_ENTRENAMIENTO_POR_SERIE.noSonMinutosDeEsfuerzo}</Parrafo>
    </View>
  );
}

/** «1 de 3 series registradas · 2 escritas sin registrar» (PA-01). */
export function seriesYEscritas(r: Pick<ResumenDelEjercicio, 'registradas' | 'planificadas' | 'escritas'>): string {
  const registradas = COPY_ENTRENAMIENTO_POR_SERIE.seriesRegistradas(r.registradas, r.planificadas);
  return r.escritas.length > 0 ? `${registradas} · ${TEXTOS_DE_LA_SESION.escritasEnElResumen(r.escritas.length)}` : registradas;
}

/**
 * Por ejercicio, «N de M series registradas», las que quedan «Sin registrar» (DL-106: la ausencia no es «no realizada»)
 * y la sustitución, si la hay: antes de confirmar se ven el planificado y el ejecutado (B10-06:824-838; DL-151).
 */
export function SeriesDelResumen({ resumen }: { resumen: readonly ResumenDelEjercicio[] }) {
  const e = COPY_ENTRENAMIENTO_POR_SERIE;
  return (
    <View>
      {resumen.map((r) => (
        <View
          key={r.prescriptionId}
          style={estilos.itemDeRutina}
          accessible
          accessibilityLabel={`${r.nombre}${r.ejecutado ? `. ${COPY_ENTRENAMIENTO.ejecutado}: ${r.ejecutado}, ${COPY_ENTRENAMIENTO.sustituido.toLowerCase()}` : ''}: ${seriesYEscritas(r)}${r.sinRegistrar.length ? `. ${e.sinRegistrar}: ${r.sinRegistrar.map((n) => `${COPY_ENTRENAMIENTO.serie.toLowerCase()} ${n}`).join(', ')}` : ''}`}
        >
          <Text style={estilos.tituloDeBloque}>{r.nombre}</Text>
          {r.ejecutado ? <LineaDeLaSustitucion ejecutado={r.ejecutado} /> : null}
          <Text style={estilos.textoDeBloque}>{seriesYEscritas(r)}</Text>
          {r.sinRegistrar.length > 0 ? <Text style={estilos.detalle}>{`${e.sinRegistrar}: ${r.sinRegistrar.map((n) => `${COPY_ENTRENAMIENTO.serie.toLowerCase()} ${n}`).join(', ')}`}</Text> : null}
        </View>
      ))}
    </View>
  );
}

/** La condición elegida, dicha con texto (no solo con el estilo del botón). */
export function textoDeLaCondicion(condicion: 'COMPLETED' | 'COMPLETED_WITH_DEVIATION' | 'NOT_COMPLETED' | null): string {
  return condicion ? `Elegiste: ${etiquetaDeCondicionRegistrada({ sessionCondition: condicion })}` : 'Todavía no indicaste cómo resultó la sesión.';
}

const estilos = estilosPorTema((COLOR) => ({
  presionado: { opacity: 0.75 },
  deshabilitado: { opacity: 0.6 },
  // Arriba
  barra: { marginBottom: 6 },
  verRutina: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, paddingHorizontal: 4 },
  filaDeLaBarra: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 12, rowGap: 4 },
  nombreDeLaSesion: { flexShrink: 1, fontSize: 24, fontWeight: '800', color: COLOR.texto },
  temporizador: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 },
  textoDelTemporizador: { fontSize: 15, fontWeight: '600', color: COLOR.tenue, fontVariant: ['tabular-nums'] },
  calidad: { fontSize: 13, fontWeight: '600', color: COLOR.tenue },
  textoDeEnlace: { fontSize: 16, fontWeight: '700', color: COLOR.acento },
  // La franja de arriba (PA-02): los tramos son una cuenta de series registradas, no un puntaje.
  franja: { gap: 2 },
  cabezaDeLaFranja: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tramos: { flexDirection: 'row', gap: 4, marginTop: 8, marginBottom: 4 },
  tramo: { flex: 1, flexDirection: 'row', height: 8, borderRadius: 4, backgroundColor: COLOR.borde, overflow: 'hidden' },
  tramoActual: { borderWidth: 1, borderColor: COLOR.acento },
  // El alto lo da el estiramiento de la fila (alignItems: 'stretch' por omisión).
  rellenoDelTramo: { backgroundColor: COLOR.acento },
  tiemposDeLaFranja: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 28 },
  enlaceConFlecha: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 48, alignSelf: 'flex-start' },
  // Superficies mates con su borde, sin brillo interno (§7.7).
  tarjeta: { borderRadius: 14, borderWidth: 1, borderColor: COLOR.borde, backgroundColor: COLOR.superficie, padding: 12, marginVertical: 6 },
  ejercicio: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ejercicioApilado: { flexDirection: 'column', alignItems: 'flex-start' },
  datosDelEjercicio: { flex: 1, minWidth: 140 },
  nombreDelEjercicio: { fontSize: 19, fontWeight: '800', color: COLOR.texto },
  // «Ejecutado: …» y la insignia «Sustituido», en un renglón que se parte si no entra.
  sustitucion: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8 },
  detalle: { fontSize: 14, lineHeight: 20, color: COLOR.tenue },
  nota: { fontSize: 13, lineHeight: 18, color: COLOR.tenue, marginTop: 2 },
  notaCentrada: { fontSize: 14, lineHeight: 20, color: COLOR.tenue, textAlign: 'center' },
  // La tabla
  encabezadoDeLaTabla: { flexDirection: 'row', gap: SEPARACION_DE_CELDAS, paddingHorizontal: 6, marginTop: 6, marginBottom: 2 },
  columna: { fontSize: 14, fontWeight: '700', color: COLOR.tenue, textAlign: 'center' },
  columnaSerie: { width: ANCHO_DE_LA_COLUMNA_SERIE },
  columnaDato: { flex: 1 },
  columnaCasilla: { width: ANCHO_DE_LA_CASILLA },
  fila: { flexDirection: 'row', alignItems: 'stretch', gap: SEPARACION_DE_CELDAS },
  filaQuieta: { borderRadius: 12, borderWidth: 2, borderColor: 'transparent', padding: 4, marginVertical: 2 },
  filaActiva: { borderRadius: 12, borderWidth: 2, borderColor: COLOR.acento, padding: 4, marginVertical: 2, backgroundColor: COLOR.superficie },
  serieActual: { fontSize: 13, fontWeight: '800', color: COLOR.acento, marginLeft: 4, marginBottom: 2 },
  // La fila registrada va en el azul elevado del tema, con un borde fino del acento (Dirección, 2026-11-02): no en el
  // verde del éxito, porque la tilde de la casilla ya dice que quedó, y con el borde para que en Claro se separe del
  // fondo. Fino (1) para no confundirse con la activa (2); el padding compensa para que la fila no cambie de tamaño.
  // El texto, el tenue y el acento se miden sobre ese azul.
  filaRegistrada: { backgroundColor: COLOR.superficieElevada, borderColor: COLOR.acento, borderWidth: 1, padding: 5 },
  filaRegistradaActiva: { borderColor: COLOR.acento, borderWidth: 2, padding: 4 },
  filaEnConflicto: { borderColor: COLOR.error },
  celdaSerie: { width: ANCHO_DE_LA_COLUMNA_SERIE, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 2 },
  datosDeLaFila: { flex: 3, flexDirection: 'row', alignItems: 'stretch', gap: SEPARACION_DE_CELDAS },
  numeroDeSerie: { fontSize: 18, fontWeight: '800', color: COLOR.texto },
  celda: { flex: 1, minHeight: 48, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  celdaQuieta: { borderColor: COLOR.borde, backgroundColor: COLOR.fondo },
  celdaEditable: { borderColor: COLOR.bordeControl, backgroundColor: COLOR.fondo },
  celdaConError: { borderColor: COLOR.error, borderWidth: 2 },
  // Las celdas de una fila registrada no llevan caja: el valor va directo sobre el azul elevado de la fila.
  celdaRegistrada: { borderColor: 'transparent', backgroundColor: 'transparent' },
  celdaEnCurso: { borderColor: COLOR.acento, borderWidth: 2, backgroundColor: COLOR.fondo },
  relojDeLaFila: { fontSize: 15, fontWeight: '800', color: COLOR.acento, fontVariant: ['tabular-nums'] },
  valorDeTiempo: { fontSize: 15, fontWeight: '800', color: COLOR.texto, textAlign: 'center', fontVariant: ['tabular-nums'] },
  // La casilla: 44 dp de toque, con la caja de ui.tsx (CasillaSola).
  celdaCasilla: { width: ANCHO_DE_LA_CASILLA, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  capaDelPlaceholder: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  entradaDeCelda: { alignSelf: 'stretch', minHeight: 46, fontSize: 18, fontWeight: '800', color: COLOR.texto, textAlign: 'center', paddingHorizontal: 2, paddingVertical: 0 },
  placeholder: { fontSize: 16, color: COLOR.tenue, textAlign: 'center' },
  placeholderSinObjetivo: { fontSize: 11, lineHeight: 14 },
  valorRegistrado: { fontSize: 18, fontWeight: '800', color: COLOR.texto, textAlign: 'center' },
  // Debajo de la fila: el estado y «como el plan», desde la columna de los datos.
  pieDeLaFila: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, marginLeft: ANCHO_DE_LA_COLUMNA_SERIE + SEPARACION_DE_CELDAS, marginTop: 2 },
  estadoDeFila: { fontSize: 13, fontWeight: '600', color: COLOR.tenue },
  comoElPlan: { fontSize: 12, fontWeight: '700', color: COLOR.tenue },
  estadoEnConflicto: { color: COLOR.error },
  estadoRegistrada: { color: COLOR.texto },
  tarjetaDeSerie: { borderRadius: 12, borderWidth: 1, borderColor: COLOR.borde, backgroundColor: COLOR.superficie, padding: 12, marginVertical: 4 },
  tarjetaActiva: { borderWidth: 2, borderColor: COLOR.acento },
  // La tarjeta registrada, como la fila: azul elevado y borde fino del acento, sin tocar su padding.
  tarjetaRegistrada: { backgroundColor: COLOR.superficieElevada, borderColor: COLOR.acento },
  tituloDeTarjeta: { fontSize: 16, fontWeight: '800', color: COLOR.texto, marginBottom: 4 },
  parDeTarjeta: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 12, marginVertical: 2 },
  etiquetaDeTarjeta: { fontSize: 15, fontWeight: '600', color: COLOR.texto },
  // Bloques con ícono
  conIcono: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  textos: { flex: 1 },
  tituloDeBloque: { fontSize: 16, fontWeight: '800', color: COLOR.texto },
  textoDeBloque: { fontSize: 15, lineHeight: 21, color: COLOR.texto },
  // El descanso
  descansoAlPie: { gap: 4 },
  descansoEnCurso: { borderColor: COLOR.acento, borderWidth: 2, gap: 6 },
  cabezaDelDescanso: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  conteoDelDescanso: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 },
  // La barra: la pista en el borde del tema y lo lleno en el acento. Llena, no cambia de color.
  pistaDelDescanso: { height: 10, borderRadius: 5, backgroundColor: COLOR.borde, overflow: 'hidden', flexDirection: 'row' },
  llenoDelDescanso: { height: 10, borderRadius: 5, backgroundColor: COLOR.acento },
  extremosDelDescanso: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  pedidoDelPermiso: { borderWidth: 1, borderColor: COLOR.acento, borderRadius: 12, padding: 12, gap: 4, marginTop: 6 },
  fondoDeLaHoja: { flex: 1, justifyContent: 'flex-end', backgroundColor: COLOR.velo },
  hoja: { backgroundColor: COLOR.superficie, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  contenidoDeLaHoja: { padding: 20, gap: 8 },
  rotuloDeAjuste: { fontSize: 16, fontWeight: '700', color: COLOR.texto, marginTop: 10 },
  pieDeLaHoja: { marginTop: 12 },
  reloj: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 8 },
  relojGrande: { fontSize: 40, fontWeight: '800', color: COLOR.texto, fontVariant: ['tabular-nums'] },
  explicacion: { borderColor: COLOR.acento },
  estadoDelEnvio: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 32, marginVertical: 2 },
  // Diálogos
  velo: { flex: 1, backgroundColor: COLOR.velo },
  centrado: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  dialogo: { backgroundColor: COLOR.superficie, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: COLOR.borde },
  tituloDeDialogo: { fontSize: 19, fontWeight: '800', color: COLOR.texto, marginBottom: 8 },
  itemDeRutina: { borderTopWidth: 1, borderTopColor: COLOR.borde, paddingVertical: 8 },
  itemActivo: { borderLeftWidth: 3, borderLeftColor: COLOR.acento, paddingLeft: 8 },
  notas: { marginTop: 8 },
}));
