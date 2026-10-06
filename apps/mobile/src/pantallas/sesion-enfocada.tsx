/**
 * APK · Las piezas de la sesión enfocada de entrenamiento (WP-ENTRENAMIENTO-SERIES §7.2 a §7.5; referencia
 * `01_series_y_descanso_actualizado.png`). Las dibuja `PantallaDeSesion` (entrenamiento.tsx), que tiene el estado.
 *
 * - **Arriba:** «Ver rutina», el nombre de la sesión y un temporizador discreto con el tiempo sin pausas.
 * - **El ejercicio activo:** su imagen de 112 dp (o la mancuerna de la app si no tiene), su nombre, «Ejercicio N de M» y
 *   «Ver técnica».
 * - **La tabla:** Serie, carga con su unidad, Rep. y RIR. La fila activa lleva borde y «Serie actual»; las guardadas, sus
 *   valores y «Guardada»; los campos vacíos, el objetivo de esa serie en gris (`placeholdersDeLaSerie`), que nunca se
 *   envía. Con la letra grande pasa a tarjetas apiladas.
 * - **La banda «Plan de la serie N»**, que sigue a la vista aunque se escriba encima del placeholder, y la ayuda del RIR.
 * - **El descanso:** «Iniciar descanso» y «Finalizar descanso», con el recomendado de esa serie y el conteo ascendente.
 *   El aro es apoyo visual: no termina el descanso. Sin +15 s ni cierre automático. Con movimiento reducido, quieto.
 * - **Lectores de pantalla:** el conteo no se anuncia cada segundo. Lo que cambia cada segundo no se lee; el nombre
 *   accesible del temporizador dice los minutos, y la pantalla anuncia solo el inicio y el fin.
 *
 * Las superficies son mates, con su borde: sin brillos internos (§7.7). Nada califica: no hay puntajes ni juicios.
 */
import {
  COPY_ENTRENAMIENTO,
  COPY_ENTRENAMIENTO_POR_SERIE,
  COPY_REGISTRO_DE_COMIDAS,
  duracionParaMostrar,
  ETIQUETA_DE_CALIDAD_DE_TIEMPO,
  ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN,
  ETIQUETA_DE_REVISION_TECNICA,
  etiquetaDeCondicionRegistrada,
  numero,
  ROL_DE_LA_IMAGEN,
  textoDeDescanso,
  textoDeDuracion,
  textoDeLicencia,
  textoDeSegundos,
  type CalculoDeTiempos,
  type DuracionApi,
  type PrescripcionConObjetivos,
  type Resultado,
  type SesionConObjetivos,
} from '@be/domain';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View, type KeyboardTypeOptions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { EstadoDelGuardado, EstadoDeSincronizacion, ProblemaDeSincronizacion } from '../almacen-de-entrenamiento';
import { useMovimientoReducido } from '../estados';
import { IconoDeCronometro, IconoDeEjercicio, IconoDeNube, IconoDePlan, IconoDeRutina } from '../iconos-de-entrenamiento';
import { Flecha, IconoDeInformacion, IconoDeRegistrado } from '../iconos-de-nutricion';
import { ImagenDeMedio, type RespaldoDeImagen } from '../imagen-de-medio';
import { avisoDelGuardado as avisoDelGuardadoDe, lineaDelEnvio, TEXTOS_DEL_GUARDADO, textoDeEstadoDeFila } from '../textos-del-guardado';
import {
  ANCHO_DE_LA_COLUMNA_SERIE,
  placeholdersDeLaSerie,
  SEPARACION_DE_CELDAS,
  type bandaDeLaSerie,
  type ErroresDeFila,
  type FilaDeLaTabla,
  type FilaEscrita,
  type ResumenDelEjercicio,
  type SerieLocal,
  type Unidad,
} from '../series-de-la-sesion';
import { Aviso, Boton, Campo, COLOR, Dato, Desplegable, estilosPorTema, Insignia, Parrafo } from '../ui';

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
            <IconoDeCronometro color={COLOR.tenue} tamano={18} />
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

// ─── El ejercicio activo ────────────────────────────────────────────────────────────────────────

export function EjercicioActivo({
  token,
  sesionPerdida,
  prescripcion: p,
  posicion,
  total,
  bases,
  onVerTecnica,
}: {
  token: string;
  sesionPerdida: AlPerderLaSesion;
  prescripcion: PrescripcionConObjetivos;
  posicion: number;
  total: number;
  bases: { readonly carga: string | null; readonly repeticiones: string | null };
  onVerTecnica: () => void;
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
        <Text style={estilos.nombreDelEjercicio} accessibilityRole="header">
          {p.exerciseName}
        </Text>
        <Text style={estilos.detalle}>{COPY_ENTRENAMIENTO_POR_SERIE.ejercicioDe(posicion, total)}</Text>
        {bases.carga ? <Text style={estilos.detalle}>{`Carga: ${bases.carga}`}</Text> : null}
        {bases.repeticiones ? <Text style={estilos.detalle}>{`Repeticiones: ${bases.repeticiones}`}</Text> : null}
        <Pressable accessibilityRole="button" onPress={onVerTecnica} style={({ pressed }) => [estilos.enlaceConFlecha, pressed && estilos.presionado]}>
          <Text style={estilos.textoDeEnlace}>{COPY_ENTRENAMIENTO_POR_SERIE.verTecnica}</Text>
          <Flecha color={COLOR.acento} hacia="derecha" tamano={18} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── La tabla de series ─────────────────────────────────────────────────────────────────────────


/** Lo registrado en cada celda: el valor, o «—» si no se informó (no es cero). */
function textoRegistrado(f: FilaDeLaTabla): { carga: string; repeticiones: string; rir: string } {
  const carga = f.registrada?.load ?? null;
  const repeticiones = f.registrada?.completedRepetitions ?? null;
  const rir = f.registrada?.rir ?? null;
  return {
    carga: carga === null ? '—' : numero(carga.value),
    repeticiones: repeticiones === null ? '—' : numero(repeticiones, 0),
    rir: rir === null ? '—' : numero(rir),
  };
}

function fraseDeLaFila(f: FilaDeLaTabla, unidad: Unidad, activa: boolean): string {
  const estado = activa ? COPY_ENTRENAMIENTO_POR_SERIE.serieActual : (textoDeEstadoDeFila(f) ?? 'Sin registrar');
  if (f.registrada) {
    const r = f.registrada;
    const partes = [r.load ? `${numero(r.load.value)} ${r.load.unit}` : 'carga no informada', r.completedRepetitions === null ? 'repeticiones no informadas' : `${numero(r.completedRepetitions, 0)} repeticiones`, r.rir === null ? 'RIR no informado' : `RIR ${numero(r.rir)}`];
    return `${COPY_ENTRENAMIENTO.serie} ${f.setIndex}, ${estado}: ${partes.join(', ')}`;
  }
  const p = placeholdersDeLaSerie(f.objetivo, unidad);
  return `${COPY_ENTRENAMIENTO.serie} ${f.setIndex}, ${estado}. Plan: carga ${p.carga}${p.carga === COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo ? '' : ` ${unidad}`}, repeticiones ${p.repeticiones}, RIR ${p.rir}`;
}

export function TablaDeSeries({
  filas,
  activa,
  unidad,
  escrita,
  errores,
  disposicion,
  onEnfocar,
  onEscribir,
}: {
  filas: readonly FilaDeLaTabla[];
  activa: number;
  unidad: Unidad;
  escrita: FilaEscrita;
  errores: ErroresDeFila;
  disposicion: 'tabla' | 'tarjetas';
  onEnfocar: (setIndex: number) => void;
  onEscribir: (campo: keyof FilaEscrita, texto: string) => void;
}) {
  return (
    <View>
      {disposicion === 'tabla' ? (
        <View style={estilos.encabezadoDeLaTabla} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={[estilos.columna, estilos.columnaSerie]}>{COPY_ENTRENAMIENTO_POR_SERIE.columnaSerie}</Text>
          <Text style={[estilos.columna, estilos.columnaDato]}>{unidad}</Text>
          <Text style={[estilos.columna, estilos.columnaDato]}>{COPY_ENTRENAMIENTO_POR_SERIE.columnaRepeticiones}</Text>
          <Text style={[estilos.columna, estilos.columnaDato]}>{COPY_ENTRENAMIENTO_POR_SERIE.columnaRir}</Text>
        </View>
      ) : null}
      {filas.map((f) =>
        disposicion === 'tabla' ? (
          <FilaDeTabla key={f.setIndex} fila={f} activa={f.setIndex === activa} unidad={unidad} escrita={escrita} errores={errores} onEnfocar={onEnfocar} onEscribir={onEscribir} />
        ) : (
          <TarjetaDeSerie key={f.setIndex} fila={f} activa={f.setIndex === activa} unidad={unidad} escrita={escrita} errores={errores} onEnfocar={onEnfocar} onEscribir={onEscribir} />
        ),
      )}
      <Text style={estilos.nota}>{COPY_ENTRENAMIENTO_POR_SERIE.enGris}</Text>
    </View>
  );
}

interface PropsDeFila {
  fila: FilaDeLaTabla;
  activa: boolean;
  unidad: Unidad;
  escrita: FilaEscrita;
  errores: ErroresDeFila;
  onEnfocar: (setIndex: number) => void;
  onEscribir: (campo: keyof FilaEscrita, texto: string) => void;
}

const CAMPOS: readonly { readonly campo: keyof FilaEscrita; readonly teclado: KeyboardTypeOptions }[] = [
  // Decimal para la carga y el RIR; entero para las repeticiones.
  { campo: 'carga', teclado: 'decimal-pad' },
  { campo: 'repeticiones', teclado: 'number-pad' },
  { campo: 'rir', teclado: 'decimal-pad' },
];

/** El nombre accesible de un campo de la fila activa: qué es, de qué serie, el plan de esa serie y el error si lo hay. */
function etiquetaDelCampo(campo: keyof FilaEscrita, setIndex: number, unidad: Unidad, placeholder: string, error: string | undefined): string {
  const que = campo === 'carga' ? `Carga en ${unidad} de la serie ${setIndex}` : campo === 'repeticiones' ? `Repeticiones de la serie ${setIndex}` : `RIR de la serie ${setIndex}, opcional`;
  const plan = placeholder === COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo ? COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo : `Plan: ${placeholder}`;
  return `${que}. ${plan}${error ? `. Revisá este campo: ${error}` : ''}`;
}

function FilaDeTabla({ fila: f, activa, unidad, escrita, errores, onEnfocar, onEscribir }: PropsDeFila) {
  const p = placeholdersDeLaSerie(f.objetivo, unidad);
  const estado = textoDeEstadoDeFila(f);
  if (activa && f.estado === 'sin-registrar') {
    return (
      <View style={estilos.filaActiva}>
        <Text style={estilos.serieActual}>{COPY_ENTRENAMIENTO_POR_SERIE.serieActual}</Text>
        <View style={estilos.fila}>
          <View style={estilos.celdaSerie}>
            <Text style={estilos.numeroDeSerie}>{numero(f.setIndex, 0)}</Text>
          </View>
          {CAMPOS.map(({ campo, teclado }) => (
            <CeldaEditable key={campo} valor={escrita[campo]} placeholder={p[campo]} teclado={teclado} error={errores[campo]} etiqueta={etiquetaDelCampo(campo, f.setIndex, unidad, p[campo], errores[campo])} onCambiar={(t) => onEscribir(campo, t)} />
          ))}
        </View>
      </View>
    );
  }
  const r = textoRegistrado(f);
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: activa }} accessibilityLabel={fraseDeLaFila(f, unidad, activa)} accessibilityHint={activa ? undefined : 'Enfoca esta serie'} onPress={() => onEnfocar(f.setIndex)} style={({ pressed }) => [activa ? estilos.filaActiva : estilos.filaQuieta, pressed && estilos.presionado]}>
      {activa ? <Text style={estilos.serieActual}>{COPY_ENTRENAMIENTO_POR_SERIE.serieActual}</Text> : null}
      <View style={estilos.fila}>
        <View style={estilos.celdaSerie}>
          {f.estado === 'guardada' ? <IconoDeRegistrado color={COLOR.botonTexto} fondo={COLOR.acento} tamano={18} /> : f.estado === 'pendiente-de-enviar' ? <IconoDeNube color={COLOR.tenue} tamano={18} /> : null}
          <Text style={estilos.numeroDeSerie}>{numero(f.setIndex, 0)}</Text>
        </View>
        {CAMPOS.map(({ campo }) => (
          <View key={campo} style={[estilos.celda, estilos.celdaQuieta]}>
            {f.registrada ? (
              <Text style={estilos.valorRegistrado}>{r[campo]}</Text>
            ) : (
              <Text style={[estilos.placeholder, p[campo] === COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo && estilos.placeholderSinObjetivo]} numberOfLines={2}>
                {p[campo]}
              </Text>
            )}
          </View>
        ))}
      </View>
      {estado ? <Text style={[estilos.estadoDeFila, (f.estado === 'en-conflicto' || f.proteccion === 'solo-en-la-app') && estilos.estadoEnConflicto]}>{estado}</Text> : null}
    </Pressable>
  );
}

/**
 * Una celda que se escribe. El objetivo de esa serie se ve en gris mientras está vacía: es un texto encima, que no recibe
 * toques ni entra en lo que se guarda. Se usa en lugar del placeholder del campo para que «Sin objetivo» pueda partirse en
 * dos líneas en una celda angosta.
 */
function CeldaEditable({ valor, placeholder, teclado, error, etiqueta, onCambiar }: { valor: string; placeholder: string; teclado: KeyboardTypeOptions; error: string | undefined; etiqueta: string; onCambiar: (texto: string) => void }) {
  return (
    <View style={[estilos.celda, estilos.celdaEditable, error ? estilos.celdaConError : null]}>
      {valor === '' ? (
        <View style={estilos.capaDelPlaceholder} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={[estilos.placeholder, placeholder === COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo && estilos.placeholderSinObjetivo]} numberOfLines={2}>
            {placeholder}
          </Text>
        </View>
      ) : null}
      <TextInput value={valor} onChangeText={onCambiar} keyboardType={teclado} accessibilityLabel={etiqueta} style={estilos.entradaDeCelda} selectTextOnFocus />
    </View>
  );
}

/** Con la letra grande: cada serie en su tarjeta, con sus tres campos y sus etiquetas. */
function TarjetaDeSerie({ fila: f, activa, unidad, escrita, errores, onEnfocar, onEscribir }: PropsDeFila) {
  const p = placeholdersDeLaSerie(f.objetivo, unidad);
  const estado = activa ? COPY_ENTRENAMIENTO_POR_SERIE.serieActual : textoDeEstadoDeFila(f);
  const titulo = `${COPY_ENTRENAMIENTO.serie} ${numero(f.setIndex, 0)}${estado ? ` · ${estado}` : ''}`;
  if (activa && f.estado === 'sin-registrar') {
    return (
      <View style={[estilos.tarjetaDeSerie, estilos.tarjetaActiva]}>
        <Text style={estilos.tituloDeTarjeta}>{titulo}</Text>
        {CAMPOS.map(({ campo, teclado }) => (
          <Campo
            key={campo}
            etiqueta={campo === 'carga' ? `${COPY_ENTRENAMIENTO.carga} (${unidad})` : campo === 'repeticiones' ? COPY_ENTRENAMIENTO_POR_SERIE.columnaRepeticiones : COPY_ENTRENAMIENTO_POR_SERIE.rirTitulo}
            value={escrita[campo]}
            placeholder={p[campo]}
            keyboardType={teclado}
            error={errores[campo] ?? null}
            onChangeText={(t) => onEscribir(campo, t)}
          />
        ))}
      </View>
    );
  }
  const r = textoRegistrado(f);
  const filas: readonly [string, string][] = [
    [`${COPY_ENTRENAMIENTO.carga} (${unidad})`, f.registrada ? r.carga : p.carga],
    [COPY_ENTRENAMIENTO_POR_SERIE.columnaRepeticiones, f.registrada ? r.repeticiones : p.repeticiones],
    [COPY_ENTRENAMIENTO_POR_SERIE.columnaRir, f.registrada ? r.rir : p.rir],
  ];
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: activa }} accessibilityLabel={fraseDeLaFila(f, unidad, activa)} onPress={() => onEnfocar(f.setIndex)} style={({ pressed }) => [estilos.tarjetaDeSerie, activa && estilos.tarjetaActiva, pressed && estilos.presionado]}>
      <Text style={estilos.tituloDeTarjeta}>{titulo}</Text>
      {filas.map(([etiqueta, valor]) => (
        <View key={etiqueta} style={estilos.parDeTarjeta}>
          <Text style={estilos.etiquetaDeTarjeta}>{etiqueta}</Text>
          <Text style={f.registrada ? estilos.valorRegistrado : estilos.placeholder}>{valor}</Text>
        </View>
      ))}
    </Pressable>
  );
}

/** Los errores de la fila activa, con texto, debajo de la tabla. El de cada campo también va en su nombre accesible. */
export function ErroresDeLaFila({ errores }: { errores: ErroresDeFila }) {
  const lista = (['carga', 'repeticiones', 'rir'] as const).filter((c) => errores[c]).map((c) => `${c === 'carga' ? COPY_ENTRENAMIENTO.carga : c === 'repeticiones' ? 'Repeticiones' : 'RIR'}: ${errores[c]}`);
  if (lista.length === 0) return null;
  return <Aviso tipo="error" titulo={lista.join(' ')} />;
}

// ─── La banda y la ayuda del RIR ────────────────────────────────────────────────────────────────

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

/** La ayuda y el ejemplo del RIR, literales del encargo: no se abrevian. */
export function AyudaDelRir() {
  const e = COPY_ENTRENAMIENTO_POR_SERIE;
  return (
    <View style={[estilos.tarjeta, estilos.conIcono]} accessible accessibilityLabel={`${e.rirTitulo}. ${e.rirAyuda}. ${e.rirEjemplo}`}>
      <IconoDeInformacion color={COLOR.acento} />
      <View style={estilos.textos}>
        <Text style={estilos.tituloDeBloque}>{e.rirTitulo}</Text>
        <Text style={estilos.textoDeBloque}>{e.rirAyuda}</Text>
        <Text style={estilos.detalle}>{e.rirEjemplo}</Text>
      </View>
    </View>
  );
}

// ─── Cronometrar una serie ──────────────────────────────────────────────────────────────────────

export type CronometroDeSerie =
  | { readonly tipo: 'disponible'; readonly serie: number }
  /** Con un descanso en curso: la acción compuesta «Finalizar descanso e iniciar la serie N». */
  | { readonly tipo: 'tras-descanso'; readonly serie: number }
  | { readonly tipo: 'en-curso'; readonly serie: number; readonly duracion: DuracionApi | null };

export function CronometrarSerie({ estado, medida, onCronometrar, onFinalizar, deshabilitado }: { estado: CronometroDeSerie | null; medida: string | null; onCronometrar: () => void; onFinalizar: () => void; deshabilitado: boolean }) {
  return (
    <View>
      {medida ? <Text style={estilos.detalle}>{medida}</Text> : null}
      {estado?.tipo === 'en-curso' ? (
        <View style={[estilos.tarjeta, estilos.medicion]} accessible={false}>
          <View style={estilos.conIcono} accessible accessibilityLabel={COPY_ENTRENAMIENTO_POR_SERIE.serieEnCurso(estado.serie)}>
            <IconoDeCronometro color={COLOR.acento} />
            <Text style={estilos.tituloDeBloque}>{COPY_ENTRENAMIENTO_POR_SERIE.serieEnCurso(estado.serie)}</Text>
          </View>
          <Text style={estilos.relojMediano} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            {reloj(estado.duracion)}
          </Text>
          <Boton texto={COPY_ENTRENAMIENTO_POR_SERIE.finalizarSerie} onPress={onFinalizar} deshabilitado={deshabilitado} />
        </View>
      ) : estado ? (
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: deshabilitado }} disabled={deshabilitado} onPress={onCronometrar} style={({ pressed }) => [estilos.tarjeta, estilos.filaDeAccion, deshabilitado && estilos.deshabilitado, pressed && estilos.presionado]}>
          <IconoDeCronometro color={COLOR.acento} />
          <Text style={[estilos.textoDeEnlace, estilos.textos]}>{estado.tipo === 'tras-descanso' ? COPY_ENTRENAMIENTO_POR_SERIE.finalizarDescansoEIniciarSerie(estado.serie) : COPY_ENTRENAMIENTO_POR_SERIE.cronometrarSerie}</Text>
          <Flecha color={COLOR.acento} hacia="derecha" tamano={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── El descanso ────────────────────────────────────────────────────────────────────────────────

export type EstadoDelDescanso =
  | { readonly tipo: 'disponible'; readonly serie: number; readonly recomendado: number | null }
  | { readonly tipo: 'en-curso'; readonly serie: number; readonly ejercicio: string | null; readonly duracion: DuracionApi | null; readonly recomendado: number | null; readonly siguiente: number | null };

/** El aro: apoyo visual del recomendado. No termina el descanso al completarse. Con movimiento reducido, quieto. */
function Aro({ fraccion, reducido }: { fraccion: number | null; reducido: boolean }) {
  const lado = 76;
  const radio = 32;
  const circunferencia = 2 * Math.PI * radio;
  const llena = Math.min(1, Math.max(0, fraccion ?? 0));
  return (
    <Svg width={lado} height={lado} accessible={false} importantForAccessibility="no-hide-descendants">
      <Circle cx={lado / 2} cy={lado / 2} r={radio} stroke={COLOR.borde} strokeWidth={7} fill="none" />
      {reducido || fraccion === null ? null : (
        <Circle
          cx={lado / 2}
          cy={lado / 2}
          r={radio}
          stroke={COLOR.acento}
          strokeWidth={7}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circunferencia} ${circunferencia}`}
          strokeDashoffset={circunferencia * (1 - llena)}
          transform={`rotate(-90 ${lado / 2} ${lado / 2})`}
        />
      )}
    </Svg>
  );
}

export function BloqueDeDescanso({ estado, onIniciar, onFinalizar, deshabilitado }: { estado: EstadoDelDescanso | null; onIniciar: () => void; onFinalizar: () => void; deshabilitado: boolean }) {
  const reducido = useMovimientoReducido();
  const e = COPY_ENTRENAMIENTO_POR_SERIE;
  if (!estado) return null;
  if (estado.tipo === 'disponible') {
    const recomendado = estado.recomendado === null ? e.sinDescansoRecomendado : e.recomendadoTrasLaSerie(estado.serie, textoDeSegundos(estado.recomendado) ?? '');
    return (
      <View style={[estilos.tarjeta, estilos.descansoAlPie]}>
        <View style={estilos.conIcono} accessible accessibilityLabel={`${COPY_ENTRENAMIENTO.descanso}. ${recomendado}`}>
          <IconoDeCronometro color={COLOR.acento} />
          <View style={estilos.textos}>
            <Text style={estilos.tituloDeBloque}>{COPY_ENTRENAMIENTO.descanso}</Text>
            <Text style={estilos.detalle}>{recomendado}</Text>
          </View>
        </View>
        <Boton texto={e.iniciarDescanso} tipo="secundario" onPress={onIniciar} deshabilitado={deshabilitado} />
      </View>
    );
  }
  const fraccion = estado.recomendado && estado.duracion?.ms !== null && estado.duracion?.ms !== undefined ? estado.duracion.ms / (estado.recomendado * 1000) : null;
  const recomendado = estado.recomendado === null ? e.sinDescansoRecomendado : e.recomendado(textoDeSegundos(estado.recomendado) ?? '');
  const titulo = e.descansoDeLaSerie(estado.serie);
  return (
    <View style={[estilos.tarjeta, estilos.descansoEnCurso]}>
      <Text style={estilos.tituloDeBloque} accessibilityRole="header">
        {titulo}
      </Text>
      {estado.ejercicio ? <Text style={estilos.detalle}>{estado.ejercicio}</Text> : null}
      <View style={estilos.reloj} accessible accessibilityLabel={`${titulo}, en curso. ${recomendado}`}>
        <Aro fraccion={fraccion} reducido={reducido} />
        <View style={estilos.textos}>
          <Text style={estilos.relojGrande} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            {reloj(estado.duracion)}
          </Text>
          <Text style={estilos.detalle}>{recomendado}</Text>
          {estado.duracion && estado.duracion.quality !== 'MEASURED' ? <Text style={estilos.calidad}>{ETIQUETA_DE_CALIDAD_DE_TIEMPO[estado.duracion.quality]}</Text> : null}
        </View>
      </View>
      <Boton texto={e.finalizarDescanso} onPress={onFinalizar} deshabilitado={deshabilitado} />
      {estado.siguiente !== null ? <Text style={estilos.notaCentrada}>{e.alTerminarSeguisCon(estado.siguiente)}</Text> : null}
    </View>
  );
}

// ─── Primera vez, mediciones abiertas y envío ───────────────────────────────────────────────────

/** La explicación de los tiempos, una vez por cuenta, al iniciar el primer entrenamiento. Literal del encargo. */
export function ExplicacionDeLosTiempos({ onEntendido }: { onEntendido: () => void }) {
  return (
    <View style={[estilos.tarjeta, estilos.explicacion]} accessibilityRole="summary">
      <View style={estilos.conIcono}>
        <IconoDeCronometro color={COLOR.acento} />
        <Text style={[estilos.tituloDeBloque, estilos.textos]}>{COPY_ENTRENAMIENTO_POR_SERIE.explicacionDeTiempos}</Text>
      </View>
      <Desplegable titulo="Qué se mide y quién lo ve">
        <Parrafo>
          Se guardan los momentos en que tocás Iniciar entrenamiento, Pausar sesión, Reanudar sesión, Iniciar y Finalizar descanso, Cronometrar serie y Finalizar entrenamiento. Abrir la técnica, la rutina, el plan o el historial no se guarda.
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
      return 'Tenés otro entrenamiento sin finalizar. Finalizalo o dejalo incompleto desde Entrenamiento, y después reintentá.';
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
          <IconoDeRegistrado color={COLOR.botonTexto} fondo={COLOR.exito} tamano={18} />
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

function Dialogo({ visible, titulo, onCerrar, children }: { visible: boolean; titulo: string; onCerrar: () => void; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={estilos.velo}>
        <ScrollView contentContainerStyle={estilos.centrado}>
          <View style={estilos.dialogo} accessibilityViewIsModal>
            <Text style={estilos.tituloDeDialogo} accessibilityRole="header">
              {titulo}
            </Text>
            {children}
            <Boton texto="Volver a la sesión" tipo="secundario" onPress={onCerrar} />
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
            {r ? <Text style={estilos.detalle}>{e.seriesRegistradas(r.registradas, r.planificadas)}</Text> : null}
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

/** Por ejercicio, «N de M series registradas» y las que quedan «Sin registrar» (DL-106: la ausencia no es «no realizada»). */
export function SeriesDelResumen({ resumen }: { resumen: readonly ResumenDelEjercicio[] }) {
  const e = COPY_ENTRENAMIENTO_POR_SERIE;
  return (
    <View>
      {resumen.map((r) => (
        <View key={r.prescriptionId} style={estilos.itemDeRutina} accessible accessibilityLabel={`${r.nombre}: ${e.seriesRegistradas(r.registradas, r.planificadas)}${r.sinRegistrar.length ? `. ${e.sinRegistrar}: ${r.sinRegistrar.map((n) => `${COPY_ENTRENAMIENTO.serie.toLowerCase()} ${n}`).join(', ')}` : ''}`}>
          <Text style={estilos.tituloDeBloque}>{r.nombre}</Text>
          <Text style={estilos.textoDeBloque}>{e.seriesRegistradas(r.registradas, r.planificadas)}</Text>
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
  enlaceConFlecha: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 48, alignSelf: 'flex-start' },
  // Superficies mates con su borde, sin brillo interno (§7.7).
  tarjeta: { borderRadius: 14, borderWidth: 1, borderColor: COLOR.borde, backgroundColor: COLOR.superficie, padding: 12, marginVertical: 6 },
  ejercicio: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ejercicioApilado: { flexDirection: 'column', alignItems: 'flex-start' },
  datosDelEjercicio: { flex: 1, minWidth: 140 },
  nombreDelEjercicio: { fontSize: 19, fontWeight: '800', color: COLOR.texto },
  detalle: { fontSize: 14, lineHeight: 20, color: COLOR.tenue },
  nota: { fontSize: 13, lineHeight: 18, color: COLOR.tenue, marginTop: 2 },
  notaCentrada: { fontSize: 14, lineHeight: 20, color: COLOR.tenue, textAlign: 'center' },
  // La tabla
  encabezadoDeLaTabla: { flexDirection: 'row', gap: SEPARACION_DE_CELDAS, paddingHorizontal: 6, marginTop: 6, marginBottom: 2 },
  columna: { fontSize: 14, fontWeight: '700', color: COLOR.tenue, textAlign: 'center' },
  columnaSerie: { width: ANCHO_DE_LA_COLUMNA_SERIE },
  columnaDato: { flex: 1 },
  fila: { flexDirection: 'row', alignItems: 'stretch', gap: SEPARACION_DE_CELDAS },
  filaQuieta: { borderRadius: 12, borderWidth: 2, borderColor: 'transparent', padding: 4, marginVertical: 2 },
  filaActiva: { borderRadius: 12, borderWidth: 2, borderColor: COLOR.acento, padding: 4, marginVertical: 2, backgroundColor: COLOR.superficie },
  serieActual: { fontSize: 13, fontWeight: '800', color: COLOR.acento, marginLeft: 4, marginBottom: 2 },
  celdaSerie: { width: ANCHO_DE_LA_COLUMNA_SERIE, alignItems: 'center', justifyContent: 'center', gap: 2 },
  numeroDeSerie: { fontSize: 18, fontWeight: '800', color: COLOR.texto },
  celda: { flex: 1, minHeight: 48, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  celdaQuieta: { borderColor: COLOR.borde, backgroundColor: COLOR.fondo },
  celdaEditable: { borderColor: COLOR.bordeControl, backgroundColor: COLOR.fondo },
  celdaConError: { borderColor: COLOR.error, borderWidth: 2 },
  capaDelPlaceholder: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  entradaDeCelda: { alignSelf: 'stretch', minHeight: 46, fontSize: 18, fontWeight: '800', color: COLOR.texto, textAlign: 'center', paddingHorizontal: 2, paddingVertical: 0 },
  placeholder: { fontSize: 16, color: COLOR.tenue, textAlign: 'center' },
  placeholderSinObjetivo: { fontSize: 12, lineHeight: 15 },
  valorRegistrado: { fontSize: 18, fontWeight: '800', color: COLOR.texto, textAlign: 'center' },
  estadoDeFila: { fontSize: 13, fontWeight: '600', color: COLOR.tenue, marginLeft: ANCHO_DE_LA_COLUMNA_SERIE + SEPARACION_DE_CELDAS, marginTop: 2 },
  estadoEnConflicto: { color: COLOR.error },
  tarjetaDeSerie: { borderRadius: 12, borderWidth: 1, borderColor: COLOR.borde, backgroundColor: COLOR.superficie, padding: 12, marginVertical: 4 },
  tarjetaActiva: { borderWidth: 2, borderColor: COLOR.acento },
  tituloDeTarjeta: { fontSize: 16, fontWeight: '800', color: COLOR.texto, marginBottom: 4 },
  parDeTarjeta: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 12, marginVertical: 2 },
  etiquetaDeTarjeta: { fontSize: 15, fontWeight: '600', color: COLOR.texto },
  // Bloques con ícono
  conIcono: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  textos: { flex: 1 },
  tituloDeBloque: { fontSize: 16, fontWeight: '800', color: COLOR.texto },
  textoDeBloque: { fontSize: 15, lineHeight: 21, color: COLOR.texto },
  filaDeAccion: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56 },
  medicion: { borderColor: COLOR.acento },
  relojMediano: { fontSize: 30, fontWeight: '800', color: COLOR.texto, fontVariant: ['tabular-nums'], marginVertical: 4 },
  // El descanso
  descansoAlPie: { gap: 4 },
  descansoEnCurso: { borderColor: COLOR.acento, borderWidth: 2 },
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
