'use client';

/**
 * ED-11 (WP-EDITORES-PROFESIONAL, §2.4; DJ-8) y DL-203 (WP-PRESETS-POR-NIVEL) · La galería de presets, en un cuadro
 * enfocado (ED-10). **Una sola galería, con una pestaña por nivel** (DL-203), y en cada una «De BE · punto de partida» y
 * «Tuyos». Se abre desde cada lugar con su pestaña elegida:
 * - **Plan:** las plantillas (Dirección, 2026-11-12): una plantilla reemplaza el borrador entero, que se descarta y nace
 *   de nuevo desde ella, y el borrador nuevo anota de qué plantilla salió (`templateOrigin`). Las de BE se eligen al crear
 *   el plan, en «Empezar desde una plantilla»; acá se dice y se enlaza a «Plantillas y habituales».
 * - **Fase:** de BE, las estructuras de la semana (nombres de sesiones y días, sin ejercicios); tuyos, los presets de fase
 *   (DL-203), que se agregan como fase nueva, con sus semanas, sus días, su progresión y sus aproximaciones.
 * - **Sesión:** BE no tiene (no elige ejercicios, ED-D2); tuyos, los presets de sesión (DL-203), que van en la sesión
 *   vacía que se mira o como sesión nueva, y tus sesiones habituales (HAB, DL-109).
 * - **Series:** las cuatro prescripciones de BE, en la intensidad del plan o del ejercicio (DL-203), y tus prescripciones
 *   habituales (ED-13, API-HAB-06), que se aplican igual: con la vista previa del alcance si pisan algo (DJ-8).
 *
 * ENP-D10 (la prueba de Elián del 18/11): con la sesión vacía, «Usar» ya no queda apagado. ENP-D18: el preset de
 * prescripción vive en la pantalla, atado a la sesión, y se escribe en cada ejercicio que se agregue
 * (`onElegirParaLaSesionVacia`); no se guarda solo en el plan.
 *
 * Nada viene elegido al abrir ni al cambiar de pestaña (TEST-EDP-014). Elegir una tarjeta muestra su vista previa al
 * costado (los cuadros configuran; el panel muestra). «Usar» aplica con un clic si solo llena lo vacío; si pisa algo, el
 * mismo cuadro pasa a la vista previa del alcance («antes → después», lo que se pierde) y el principal dice a qué se
 * aplica. Un cuadro no abre otro: el paso reemplaza al anterior, con «Atrás». Ctrl+Z deshace lo aplicado.
 */
import {
  aplicarPresetDeBe,
  aplicarPrescripcionHabitual,
  COPY_PRESETS as C,
  detalleDelPreset,
  detalleDelPresetDeFase,
  detalleDelPresetDeSesion,
  ejercicioPlegadoDelEditor,
  NOMBRE_DE_LA_INTENSIDAD_DEL_PRESET,
  PRESETS_DE_ESTRUCTURA,
  repartoDeLaEstructura,
  PRESETS_DE_PRESCRIPCION,
  type EstructuraDePlanDeEntrenamientoEntrada,
  type IntensidadDelPreset,
  type PresetDeEstructura,
  type PresetDeFasePropio,
  type PresetDeSesionPropio,
  type PrescripcionHabitual,
  type PresetDePrescripcion,
  type SesionHabitual,
} from '@be/domain';
import { COPY_PLANTILLAS, COPY_PREPARACION_DE_PLANTILLA } from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CuadroEnfocado } from '../../../components/cuadro-enfocado';
import { Enlace } from '../../../components/enlace';
import { BloqueDeEstado, Cargando } from '../../../components/estados';
import type { Resultado } from '../../../lib/api';
import { ICONO_DE_FALLA, motivoDeFalla, razonDeFalla } from '../../../lib/fallas';
import type { PlantillaParaEmpezar } from './empezar-desde-plantilla';
import { alcanceDelPresetDeBe, alcanceDeLaHabitual, type AlcanceDelPreset } from './alcance-del-preset';
import { RepartoEnLaSilueta } from './training/panel-de-la-parte-b';
import { AYUDAS_DEL_EDITOR, ContenidoDeLaAyuda } from './training/ayudas-del-editor';

type SesionE = NonNullable<EstructuraDePlanDeEntrenamientoEntrada['blocks'][number]['sessions']>[number];
type PrescripcionE = SesionE['prescriptions'][number];

/** DL-203: las pestañas de la galería, una por nivel. */
export type PestanaDeLaGaleria = 'plan' | 'fase' | 'sesion' | 'series';
export const PESTANAS_DE_LA_GALERIA: readonly PestanaDeLaGaleria[] = ['plan', 'fase', 'sesion', 'series'];

type Elegido =
  | { readonly tipo: 'BE'; readonly preset: PresetDePrescripcion | PresetDeEstructura }
  | { readonly tipo: 'HABITUAL'; readonly sesion: SesionHabitual }
  | { readonly tipo: 'PRESCRIPCION'; readonly habitual: PrescripcionHabitual }
  | { readonly tipo: 'PLANTILLA'; readonly plantilla: PlantillaParaEmpezar }
  | { readonly tipo: 'SESION'; readonly preset: PresetDeSesionPropio }
  | { readonly tipo: 'FASE'; readonly preset: PresetDeFasePropio }
  | null;

/** ED-11: las plantillas en la galería. Aplicar una reemplaza el borrador (lo hace quien abre la galería). */
export interface PlantillasEnLaGaleria {
  readonly leer: () => Promise<Resultado<readonly PlantillaParaEmpezar[]>>;
  /** «versión 11 en preparación»: lo que se descarta. */
  readonly borrador: string;
  readonly reemplazando: boolean;
  readonly error: string | null;
  /**
   * Por qué no se puede reemplazar ahora (EDT-54): sin el objetivo vigente no nace la versión nueva, así que el borrador
   * no se descarta. `null`: se puede.
   */
  readonly noSePuede: string | null;
  readonly onReemplazar: (templateVersionId: string) => void;
}

export const COPY_PLANTILLAS_EN_LA_GALERIA = {
  pestanas: 'Qué querés usar',
  presets: 'Presets y habituales',
  plantillas: 'Tus plantillas',
  reemplazar: (nombre: string) => `Reemplazar el borrador con «${nombre}»`,
  reemplazando: 'Reemplazando…',
  sinObjetivoLeido: 'Falta leer el objetivo vigente de la persona: sin él no nace la versión nueva, y el borrador no se descarta. Actualizá la vista y probá de nuevo.',
  sinObjetivo: 'La persona no tiene un objetivo vigente: sin él no nace la versión nueva, y el borrador no se descarta. Escribí el objetivo y volvé a la galería.',
  queHace: (borrador: string, nombre: string) =>
    `Se descarta la ${borrador} con todo lo que tiene, y se crea una nueva desde «${nombre}», que anota de qué plantilla salió. La versión activa no cambia.`,
} as const;

/** DL-203: los textos de las pestañas por nivel. */
export const COPY_GALERIA_POR_NIVEL = {
  pestanas: 'Qué nivel querés reutilizar',
  pestana: { plan: 'Plan', fase: 'Fase', sesion: 'Sesión', series: 'Series' } satisfies Record<PestanaDeLaGaleria, string>,
  titulo: (p: PestanaDeLaGaleria, sesion: string) =>
    p === 'series' ? `Presets de series para ${sesion}` : p === 'sesion' ? 'Presets de sesión' : p === 'fase' ? 'Presets de fase' : 'Presets de plan',
  planesDeBe: 'Las Plantillas de BE se eligen al crear el plan, en «Empezar desde una plantilla».',
  irAPlantillas: 'Ver «Plantillas y habituales»',
  sinPlantillasAca: 'Las plantillas reemplazan un borrador entero: se usan desde la versión en preparación de un plan.',
  estructurasDeBe: 'Estructuras de la semana: nombres de sesiones y días, sin ejercicios.',
  sesionesDeBe: 'BE no arma sesiones: no elige ejercicios. Las tuyas, sí.',
  sinPresetsDeFase: 'Todavía no guardaste ninguna fase. Con «Guardar como preset», en el «⋯» de la fase, queda acá.',
  sinPresetsDeSesion: 'Todavía no guardaste ninguna sesión. Con «Guardar como preset», en el «⋯» de la sesión, queda acá.',
  tusPresetsDeSesion: 'Tus presets de sesión',
  tusSesionesHabituales: 'Tus sesiones habituales',
  usarComoFase: (despues: string | null) => (despues ? `Agregar como fase nueva, después de «${despues}»` : 'Agregar como fase nueva'),
  faseNueva: (despues: string | null) => `Se agrega como fase nueva${despues ? `, después de «${despues}»` : ''}, con sus semanas, sus sesiones, sus días, su progresión y sus aproximaciones. No se pisa nada.`,
  sinCargas: 'Sin cargas: en % RM, la carga sale del 1RM de la persona; en lo demás, se escribe en cada ejercicio.',
  dondeVaLaSesion: 'Dónde va',
  enEstaSesion: (nombre: string) => `En «${nombre}», que está vacía`,
  comoSesionNueva: 'Como sesión nueva, al final de la fase',
  usarSesion: (destino: 'esta' | 'nueva', nombre: string) => (destino === 'esta' ? `Usar en «${nombre}»` : 'Agregar como sesión nueva'),
  aplicarEnLaSesion: (preset: string, sesion: string) => `Aplicar «${preset}» en «${sesion}»`,
  cambiaEnLaSesion: 'Lo que cambia en la sesión',
  ejercicioSinNombre: 'Ejercicio',
  noDisponible: 'ya no está en tu catálogo',
} as const;

/**
 * ENP-D10 y ENP-D18: lo que hace «Usar» con la sesión vacía, dicho antes de usarlo. El texto anterior se leía como algo
 * guardado en el plan: el preset vive en la pantalla hasta que se agregan ejercicios.
 */
export const COPY_PRESET_CON_LA_SESION_VACIA = {
  queHace: 'La sesión todavía no tiene ejercicios: «Usar» lo deja en esta pantalla y se escribe en cada ejercicio que agregues. No queda guardado en el plan hasta entonces.',
} as const;

/** «4 × 5 · RIR 1 · 3:00»: una prescripción habitual en una línea, como se lee un ejercicio plegado. */
const enUnaLinea = (h: PrescripcionHabitual): string => ejercicioPlegadoDelEditor({ exerciseVersionId: '', ...structuredClone(h.prescription) } as PrescripcionE, 0).resumen;

/** Lo que pisa un preset de sesión en la sesión vacía que se mira: el nombre y las indicaciones, si cambian. */
function loQuePisaLaSesion(sesion: SesionE | null, p: PresetDeSesionPropio): { readonly que: string; readonly antes: string; readonly despues: string }[] {
  if (!sesion) return [];
  const nueva = p.session.session;
  const filas: { que: string; antes: string; despues: string }[] = [];
  if (sesion.label.trim() !== nueva.label.trim()) filas.push({ que: 'Nombre', antes: sesion.label, despues: nueva.label });
  const antes = sesion.instructions?.trim() ?? '';
  const despues = nueva.instructions?.trim() ?? '';
  if (antes !== '' && antes !== despues) filas.push({ que: 'Indicaciones', antes, despues: despues || 'Sin indicaciones' });
  return filas;
}

export function GaleriaDePresets({
  abierto,
  pestana: pestanaInicial,
  persona,
  sesion,
  nombreDeLaSesion,
  ejercicio = null,
  seReemplazan = [],
  nombreDe,
  habituales,
  prescripcionesHabituales = [],
  presetsDeSesion = [],
  presetsDeFase = [],
  plantillas = null,
  intensidad = 'RIR',
  intensidadDe = () => intensidad,
  faseActual = null,
  noSePuedeAgregarFase = null,
  noSePuedeAgregarSesion = null,
  onAplicarPrescripcion,
  onElegirParaLaSesionVacia,
  onAplicarEstructura,
  onInsertarHabitual,
  onAplicarPresetDeSesion,
  onAplicarPresetDeFase,
  onCerrar,
}: {
  abierto: boolean;
  /** DL-203: la pestaña con la que se abre, según desde dónde (la sesión, la fase, el plan o un ejercicio). */
  pestana: PestanaDeLaGaleria;
  /** El nombre de la persona, o la referencia neutral: «Se escribe en el borrador: Diego no ve nada». */
  persona: string | null;
  /** La sesión que se mira: para la prescripción, sus ejercicios; para un preset de sesión, si está vacía. */
  sesion: SesionE | null;
  nombreDeLaSesion: string;
  /** La posición del ejercicio desde donde se abrió, si se abrió desde uno. */
  ejercicio?: number | null;
  /** ED-11 (DJ-8): las sesiones que un preset de estructura reemplaza, por nombre: solo las que no tienen nada propio. */
  seReemplazan?: readonly string[];
  nombreDe: (p: PrescripcionE) => string;
  habituales: readonly SesionHabitual[];
  /** ED-13: las prescripciones habituales del profesional (API-HAB-06). */
  prescripcionesHabituales?: readonly PrescripcionHabitual[];
  /** DL-203: los presets de sesión y de fase del profesional (API-HAB-06). */
  presetsDeSesion?: readonly PresetDeSesionPropio[];
  presetsDeFase?: readonly PresetDeFasePropio[];
  /** ED-11: las plantillas de plan, en su pestaña; solo si hay un borrador que reemplazar. */
  plantillas?: PlantillasEnLaGaleria | null;
  /** DL-203: la intensidad del plan, con la que se leen los presets de BE (RIR, RPE, % RM o sin esfuerzo). */
  intensidad?: IntensidadDelPreset;
  /** DL-203: la de cada ejercicio, si cambia la del plan (su criterio propio o «Sin criterio de intensidad»). */
  intensidadDe?: (p: PrescripcionE) => IntensidadDelPreset;
  /** DL-203: la fase que se mira, después de la cual va un preset de fase. */
  faseActual?: string | null;
  /** DL-203: por qué no entra otra fase (el tope del plan) u otra sesión (el de la fase); `null`: entra. */
  noSePuedeAgregarFase?: string | null;
  noSePuedeAgregarSesion?: string | null;
  onAplicarPrescripcion: (a: AlcanceDelPreset, nombre: string) => void;
  /** ENP-D10: con la sesión vacía, el preset queda para los ejercicios que se agreguen (cómo se aplica a cada uno). */
  onElegirParaLaSesionVacia?: (nombre: string, aplicar: (p: PrescripcionE) => PrescripcionE) => void;
  onAplicarEstructura: (p: PresetDeEstructura) => void;
  onInsertarHabitual: (h: SesionHabitual) => void;
  /** DL-203: un preset de sesión, en la sesión vacía que se mira (`esta`) o como sesión nueva. */
  onAplicarPresetDeSesion?: (p: PresetDeSesionPropio, destino: 'esta' | 'nueva') => void;
  /** DL-203: un preset de fase, como fase nueva. */
  onAplicarPresetDeFase?: (p: PresetDeFasePropio) => void;
  onCerrar: () => void;
}) {
  const [elegido, setElegido] = useState<Elegido>(null);
  const [paso, setPaso] = useState<'elegir' | 'alcance'>('elegir');
  const [soloElEjercicio, setSoloElEjercicio] = useState(ejercicio !== null);
  const [pestana, setPestana] = useState<PestanaDeLaGaleria>(pestanaInicial);
  const [destino, setDestino] = useState<'esta' | 'nueva'>('nueva');
  const [lecturaDePlantillas, setLecturaDePlantillas] = useState<Resultado<readonly PlantillaParaEmpezar[]> | null>(null);
  const generacion = useRef(0);
  const leer = plantillas?.leer ?? null;
  const leerPlantillas = useCallback(async () => {
    if (!leer) return;
    const esta = ++generacion.current;
    setLecturaDePlantillas(null);
    const r = await leer();
    if (esta === generacion.current) setLecturaDePlantillas(r);
  }, [leer]);
  // La lista se lee al abrir la pestaña, no al abrir la galería: es una acción de vez en cuando.
  useEffect(() => {
    if (abierto && pestana === 'plan') void leerPlantillas();
  }, [abierto, pestana, leerPlantillas]);
  // El cuadro queda montado: la pestaña y el alcance se vuelven a elegir cada vez que se abre.
  useEffect(() => {
    if (!abierto) return;
    setSoloElEjercicio(ejercicio !== null);
    setPestana(pestanaInicial);
  }, [abierto, ejercicio, pestanaInicial]);
  const prescripciones = sesion?.prescriptions ?? [];
  const sesionVacia = !!sesion && prescripciones.length === 0;
  // DL-203: un preset de sesión va por omisión en la sesión vacía que se mira; si tiene algo, solo como sesión nueva.
  useEffect(() => {
    setDestino(sesionVacia ? 'esta' : 'nueva');
  }, [sesionVacia, elegido]);
  const cerrar = () => {
    setElegido(null);
    setPaso('elegir');
    onCerrar();
  };
  const elegirPestana = (p: PestanaDeLaGaleria) => {
    setPestana(p);
    setElegido(null);
    setPaso('elegir');
  };
  const posiciones = soloElEjercicio && ejercicio !== null ? [ejercicio] : prescripciones.map((_, n) => n);
  const alcance =
    elegido?.tipo === 'BE' && elegido.preset.tipo === 'PRESCRIPCION'
      ? alcanceDelPresetDeBe(prescripciones, posiciones, elegido.preset, intensidadDe, nombreDe, nombreDeLaSesion)
      : elegido?.tipo === 'PRESCRIPCION'
        ? alcanceDeLaHabitual(prescripciones, posiciones, elegido.habitual.prescription as Parameters<typeof alcanceDeLaHabitual>[2], nombreDe, nombreDeLaSesion)
        : null;
  /** El nombre de lo elegido, si se aplica a ejercicios. */
  const nombreDelElegido = elegido?.tipo === 'PRESCRIPCION' ? elegido.habitual.name : elegido?.tipo === 'BE' ? elegido.preset.nombre : elegido?.tipo === 'SESION' || elegido?.tipo === 'FASE' ? elegido.preset.name : '';
  const pisaLaSesion = elegido?.tipo === 'SESION' && destino === 'esta' ? loQuePisaLaSesion(sesion, elegido.preset) : [];
  const sinEjercicios = pestana === 'series' && prescripciones.length === 0;

  const usar = () => {
    if (!elegido) return;
    if (elegido.tipo === 'PLANTILLA') {
      // Reemplaza el borrador: el cuadro queda abierto con «Reemplazando…» hasta que el plan lo resuelve. Si el nuevo no
      // puede nacer, no se descarta nada (EDT-54).
      if (!plantillas || plantillas.noSePuede) return;
      plantillas.onReemplazar(elegido.plantilla.versionId);
      return;
    }
    if (elegido.tipo === 'HABITUAL') {
      onInsertarHabitual(elegido.sesion);
      return cerrar();
    }
    if (elegido.tipo === 'BE' && elegido.preset.tipo === 'ESTRUCTURA') {
      onAplicarEstructura(elegido.preset);
      return cerrar();
    }
    // DL-203: un preset de fase se agrega como fase nueva: no pisa nada.
    if (elegido.tipo === 'FASE') {
      if (noSePuedeAgregarFase || !onAplicarPresetDeFase) return;
      onAplicarPresetDeFase(elegido.preset);
      return cerrar();
    }
    // DL-203: un preset de sesión, en la vacía (si pisa su nombre o sus indicaciones, primero «antes → después») o nueva.
    if (elegido.tipo === 'SESION') {
      if (!onAplicarPresetDeSesion || (destino === 'nueva' && noSePuedeAgregarSesion)) return;
      if (paso === 'elegir' && pisaLaSesion.length > 0) return setPaso('alcance');
      onAplicarPresetDeSesion(elegido.preset, destino);
      return cerrar();
    }
    // ENP-D10: con la sesión vacía, el preset queda para los ejercicios que se agreguen.
    if (sinEjercicios && onElegirParaLaSesionVacia && (elegido.tipo === 'PRESCRIPCION' || (elegido.tipo === 'BE' && elegido.preset.tipo === 'PRESCRIPCION'))) {
      if (elegido.tipo === 'PRESCRIPCION') {
        const h = elegido.habitual.prescription as Parameters<typeof aplicarPrescripcionHabitual>[1];
        onElegirParaLaSesionVacia(elegido.habitual.name, (x) => aplicarPrescripcionHabitual(x, h).prescripcion as PrescripcionE);
      } else if (elegido.preset.tipo === 'PRESCRIPCION') {
        // DL-203: cada ejercicio que se agregue lo toma en su intensidad (la del plan, o la suya si la cambia).
        const preset = elegido.preset;
        onElegirParaLaSesionVacia(preset.nombre, (x) => aplicarPresetDeBe(x, preset, intensidadDe(x)).prescripcion as PrescripcionE);
      }
      return cerrar();
    }
    if (!alcance || alcance.filas.length === 0) return;
    // DJ-8: con un clic si solo llena lo vacío; si pisa algo, primero la vista previa del alcance.
    if (paso === 'elegir' && !alcance.soloLlenaLoVacio) return setPaso('alcance');
    onAplicarPrescripcion(alcance, nombreDelElegido);
    cerrar();
  };

  const titulo =
    paso === 'alcance' && (elegido?.tipo === 'BE' || elegido?.tipo === 'PRESCRIPCION')
      ? C.aplicarA(nombreDelElegido, soloElEjercicio && ejercicio !== null ? nombreDe(prescripciones[ejercicio]!) : nombreDeLaSesion)
      : paso === 'alcance' && elegido?.tipo === 'SESION'
        ? COPY_GALERIA_POR_NIVEL.aplicarEnLaSesion(nombreDelElegido, nombreDeLaSesion)
        : COPY_GALERIA_POR_NIVEL.titulo(pestana, nombreDeLaSesion);
  const principal =
    elegido?.tipo === 'PLANTILLA'
      ? { texto: COPY_PLANTILLAS_EN_LA_GALERIA.reemplazar(elegido.plantilla.nombre), alTocar: usar, apagado: plantillas?.noSePuede ?? null, enviando: plantillas?.reemplazando ?? false, textoEnviando: COPY_PLANTILLAS_EN_LA_GALERIA.reemplazando }
      : elegido?.tipo === 'FASE'
        ? { texto: COPY_GALERIA_POR_NIVEL.usarComoFase(faseActual), alTocar: usar, apagado: noSePuedeAgregarFase }
        : elegido?.tipo === 'SESION'
          ? { texto: COPY_GALERIA_POR_NIVEL.usarSesion(destino, nombreDeLaSesion), alTocar: usar, apagado: destino === 'nueva' ? noSePuedeAgregarSesion : null }
          : paso === 'alcance' && alcance
            ? { texto: C.aplicarAEjercicios(alcance.filas.length), alTocar: usar }
            : { texto: C.usar, alTocar: usar, apagado: !elegido ? C.nadaElegido : sinEjercicios && !onElegirParaLaSesionVacia && (elegido.tipo === 'PRESCRIPCION' || (elegido.tipo === 'BE' && elegido.preset.tipo === 'PRESCRIPCION')) ? C.sinEjercicios : null };

  /** Una tarjeta de la galería: el nombre, el detalle y, en las de BE, su rótulo. */
  const tarjeta = (clave: string, pulsada: boolean, nombre: string, detalle: string, alElegir: () => void, deBe = false, datos: Record<string, string> = {}) => (
    <li key={clave}>
      <button type="button" className="galeria__tarjeta" aria-pressed={pulsada} onClick={alElegir} {...datos}>
        <span className="galeria__nombre">{nombre}</span>
        <span className="nota">{detalle}</span>
        {deBe ? <span className="etiqueta-de-dato">{C.rotuloDeBe}</span> : null}
      </button>
    </li>
  );
  const nombreDelEjercicio = (p: PresetDeSesionPropio | PresetDeFasePropio, versionId: string): string => {
    const e = p.exercises[versionId];
    return e ? (e.available ? e.exerciseName : `${e.exerciseName} (${COPY_GALERIA_POR_NIVEL.noDisponible})`) : COPY_GALERIA_POR_NIVEL.ejercicioSinNombre;
  };

  return (
    <CuadroEnfocado
      abierto={abierto}
      forma="dialogo"
      ancho
      titulo={titulo}
      sobretitulo={elegido?.tipo === 'BE' && paso === 'alcance' && elegido.preset.tipo === 'PRESCRIPCION' ? `${detalleDelPreset(elegido.preset, intensidad)} · ${C.rotuloDeBe} · ${C.noEsRecomendacion}` : null}
      ayuda={{ nombre: AYUDAS_DEL_EDITOR.presets.nombre, contenido: <ContenidoDeLaAyuda ayuda={AYUDAS_DEL_EDITOR.presets} /> }}
      paso={paso}
      principal={principal}
      pie={<p className="nota galeria__pie">{C.escribeEnElBorrador(persona ?? 'la persona')}</p>}
      onCerrar={cerrar}
    >
      {paso === 'elegir' ? (
        <fieldset className="segmentos galeria__pestanas" data-pestanas-de-la-galeria>
          <legend className="visualmente-oculto">{COPY_GALERIA_POR_NIVEL.pestanas}</legend>
          <div className="segmentos__fila">
            {PESTANAS_DE_LA_GALERIA.map((p) => (
              <label key={p} className="segmento" data-pestana-de-la-galeria={p}>
                <input type="radio" name="pestana-de-la-galeria" checked={pestana === p} onChange={() => elegirPestana(p)} />
                {COPY_GALERIA_POR_NIVEL.pestana[p]}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      {paso === 'elegir' && pestana === 'plan' ? (
        <div className="galeria" data-galeria="plan">
          <div className="galeria__grupos">
            <section aria-labelledby="galeria-plan-de-be">
              <h3 id="galeria-plan-de-be">{C.deBe}</h3>
              <p className="nota">{COPY_GALERIA_POR_NIVEL.planesDeBe}</p>
              <Enlace href="/pro/templates" className="boton boton--quieto boton--compacto" data-ir-a-plantillas>
                {COPY_GALERIA_POR_NIVEL.irAPlantillas}
              </Enlace>
            </section>
            <section aria-labelledby="galeria-plantillas">
              <h3 id="galeria-plantillas">{C.tuyos}</h3>
              {!plantillas ? (
                <p className="nota">{COPY_GALERIA_POR_NIVEL.sinPlantillasAca}</p>
              ) : !lecturaDePlantillas ? (
                <Cargando />
              ) : !lecturaDePlantillas.ok ? (
                <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[motivoDeFalla(lecturaDePlantillas)]} titulo={COPY_PLANTILLAS.noCargaron} onReintentar={() => void leerPlantillas()} deQue="la lectura de las plantillas">
                  {razonDeFalla(motivoDeFalla(lecturaDePlantillas))}
                </BloqueDeEstado>
              ) : lecturaDePlantillas.datos.length === 0 ? (
                <>
                  <p>{COPY_PLANTILLAS.sinPlantillasActivas}</p>
                  <p className="nota">{COPY_PREPARACION_DE_PLANTILLA.dondeSeArmanEntrenamiento}</p>
                </>
              ) : (
                <ul className="galeria__tarjetas" role="list">
                  {lecturaDePlantillas.datos.map((p) =>
                    tarjeta(p.versionId, elegido?.tipo === 'PLANTILLA' && elegido.plantilla.versionId === p.versionId, p.nombre, p.detalle, () => setElegido({ tipo: 'PLANTILLA', plantilla: p }), false, { 'data-plantilla': p.versionId }),
                  )}
                </ul>
              )}
            </section>
          </div>
          <aside className="galeria__vista-previa" aria-live="polite" aria-label="Vista previa">
            {elegido?.tipo === 'PLANTILLA' && plantillas ? (
              <>
                <p>
                  <strong>{elegido.plantilla.nombre}</strong> · {elegido.plantilla.detalle}
                </p>
                <p data-reemplaza-el-borrador>{COPY_PLANTILLAS_EN_LA_GALERIA.queHace(plantillas.borrador, elegido.plantilla.nombre)}</p>
                {plantillas.noSePuede ? (
                  <p className="campo__error" data-no-se-puede-reemplazar>
                    {plantillas.noSePuede}
                  </p>
                ) : null}
                {plantillas.error ? (
                  <p className="campo__error" role="alert">
                    {plantillas.error}
                  </p>
                ) : null}
              </>
            ) : null}
          </aside>
        </div>
      ) : paso === 'elegir' && pestana === 'fase' ? (
        <div className="galeria" data-galeria="fase">
          <div className="galeria__grupos">
            <section aria-labelledby="galeria-fase-de-be">
              <h3 id="galeria-fase-de-be">{C.deBe}</h3>
              <p className="nota">{COPY_GALERIA_POR_NIVEL.estructurasDeBe}</p>
              <ul className="galeria__tarjetas" role="list">
                {PRESETS_DE_ESTRUCTURA.map((p) => tarjeta(p.clave, elegido?.tipo === 'BE' && elegido.preset.clave === p.clave, p.nombre, p.detalle, () => setElegido({ tipo: 'BE', preset: p }), true, { 'data-preset': p.clave }))}
              </ul>
            </section>
            <section aria-labelledby="galeria-fase-tuyos">
              <h3 id="galeria-fase-tuyos">{C.tuyos}</h3>
              {presetsDeFase.length === 0 ? (
                <p className="nota">{COPY_GALERIA_POR_NIVEL.sinPresetsDeFase}</p>
              ) : (
                <ul className="galeria__tarjetas" role="list" data-presets-de-fase>
                  {presetsDeFase.map((p) => tarjeta(p.presetId, elegido?.tipo === 'FASE' && elegido.preset.presetId === p.presetId, p.name, detalleDelPresetDeFase(p.phase), () => setElegido({ tipo: 'FASE', preset: p })))}
                </ul>
              )}
            </section>
          </div>
          <aside className="galeria__vista-previa" aria-live="polite" aria-label="Vista previa">
            {elegido?.tipo === 'BE' && elegido.preset.tipo === 'ESTRUCTURA' ? (
              <>
                <p>{C.estructuraEscribe(elegido.preset.sesiones.length)}</p>
                <ul>
                  {elegido.preset.sesiones.map((s) => (
                    <li key={s.nombre}>{s.nombre}</li>
                  ))}
                </ul>
                {/* DL-196 parte B (E13): el reparto semanal típico de la estructura, en la silueta. */}
                <RepartoEnLaSilueta reparto={repartoDeLaEstructura(elegido.preset)} nombre={elegido.preset.clave} />
                <p className="nota" data-se-reemplazan={seReemplazan.length}>
                  {seReemplazan.length === 0
                    ? 'No se quita ninguna sesión: las del preset se suman al final.'
                    : `Se reemplazan ${seReemplazan.length === 1 ? 'la sesión' : 'las sesiones'} sin nada escrito (sin ejercicios, indicaciones ni días): ${seReemplazan.join(', ')}. Las demás quedan como están.`}
                </p>
              </>
            ) : elegido?.tipo === 'FASE' ? (
              <>
                <p>
                  <strong>{elegido.preset.name}</strong> · {detalleDelPresetDeFase(elegido.preset.phase)}
                </p>
                <ul className="galeria__lista-del-preset" data-sesiones-del-preset>
                  {elegido.preset.phase.sessions.map((s) => (
                    <li key={s.sessionId}>
                      {s.label}: {s.prescriptions.length === 0 ? 'sin ejercicios' : s.prescriptions.map((p) => nombreDelEjercicio(elegido.preset, p.exerciseVersionId)).join(', ')}
                    </li>
                  ))}
                </ul>
                <p className="nota" data-fase-nueva>
                  {COPY_GALERIA_POR_NIVEL.faseNueva(faseActual)}
                </p>
                <p className="nota">{COPY_GALERIA_POR_NIVEL.sinCargas}</p>
              </>
            ) : null}
          </aside>
        </div>
      ) : paso === 'elegir' && pestana === 'sesion' ? (
        <div className="galeria" data-galeria="sesion">
          <div className="galeria__grupos">
            <section aria-labelledby="galeria-sesion-de-be">
              <h3 id="galeria-sesion-de-be">{C.deBe}</h3>
              <p className="nota">{COPY_GALERIA_POR_NIVEL.sesionesDeBe}</p>
            </section>
            <section aria-labelledby="galeria-sesion-tuyos">
              <h3 id="galeria-sesion-tuyos">{C.tuyos}</h3>
              {presetsDeSesion.length === 0 && habituales.length === 0 ? (
                <p className="nota">{COPY_GALERIA_POR_NIVEL.sinPresetsDeSesion}</p>
              ) : (
                <ul className="galeria__tarjetas" role="list" data-presets-de-sesion>
                  {presetsDeSesion.map((p) => tarjeta(p.presetId, elegido?.tipo === 'SESION' && elegido.preset.presetId === p.presetId, p.name, detalleDelPresetDeSesion(p.session), () => setElegido({ tipo: 'SESION', preset: p })))}
                  {habituales.map((h) => tarjeta(`habitual-${h.presetId}`, elegido?.tipo === 'HABITUAL' && elegido.sesion.presetId === h.presetId, h.name, COPY_GALERIA_POR_NIVEL.tusSesionesHabituales, () => setElegido({ tipo: 'HABITUAL', sesion: h })))}
                </ul>
              )}
            </section>
          </div>
          <aside className="galeria__vista-previa" aria-live="polite" aria-label="Vista previa">
            {elegido?.tipo === 'HABITUAL' ? (
              <>
                <p>
                  <strong>{elegido.sesion.name}</strong>
                </p>
                <p className="nota">{elegido.sesion.structure.prescriptions.length} ejercicios. Se suma al final de las sesiones que mirás.</p>
              </>
            ) : elegido?.tipo === 'SESION' ? (
              <>
                <p>
                  <strong>{elegido.preset.name}</strong> · {detalleDelPresetDeSesion(elegido.preset.session)}
                </p>
                <ul className="galeria__lista-del-preset" data-ejercicios-del-preset>
                  {elegido.preset.session.session.prescriptions.map((p) => (
                    <li key={p.prescriptionId}>{nombreDelEjercicio(elegido.preset, p.exerciseVersionId)}</li>
                  ))}
                </ul>
                <fieldset className="galeria__alcance" data-donde-va-la-sesion>
                  <legend>{COPY_GALERIA_POR_NIVEL.dondeVaLaSesion}</legend>
                  {sesionVacia ? (
                    <label>
                      <input type="radio" name="destino-del-preset-de-sesion" checked={destino === 'esta'} onChange={() => setDestino('esta')} /> {COPY_GALERIA_POR_NIVEL.enEstaSesion(nombreDeLaSesion)}
                    </label>
                  ) : null}
                  <label>
                    <input type="radio" name="destino-del-preset-de-sesion" checked={destino === 'nueva'} onChange={() => setDestino('nueva')} /> {COPY_GALERIA_POR_NIVEL.comoSesionNueva}
                  </label>
                </fieldset>
                <p className="nota">{COPY_GALERIA_POR_NIVEL.sinCargas}</p>
              </>
            ) : null}
          </aside>
        </div>
      ) : paso === 'elegir' ? (
        <div className="galeria" data-galeria="series">
          <div className="galeria__grupos">
            <section aria-labelledby="galeria-de-be">
              <h3 id="galeria-de-be">{C.deBe}</h3>
              <ul className="galeria__tarjetas" role="list">
                {PRESETS_DE_PRESCRIPCION.map((p) => tarjeta(p.clave, elegido?.tipo === 'BE' && elegido.preset.clave === p.clave, p.nombre, detalleDelPreset(p, intensidad), () => setElegido({ tipo: 'BE', preset: p }), true, { 'data-preset': p.clave }))}
              </ul>
            </section>
            <section aria-labelledby="galeria-tuyos">
              <h3 id="galeria-tuyos">{C.tuyos}</h3>
              {prescripcionesHabituales.length === 0 ? (
                <p className="nota">{C.sinTuyos}</p>
              ) : (
                <ul className="galeria__tarjetas" role="list" data-prescripciones-habituales>
                  {prescripcionesHabituales.map((h) => tarjeta(h.presetId, elegido?.tipo === 'PRESCRIPCION' && elegido.habitual.presetId === h.presetId, h.name, `${enUnaLinea(h)} · sin cargas`, () => setElegido({ tipo: 'PRESCRIPCION', habitual: h })))}
                </ul>
              )}
            </section>
          </div>
          <aside className="galeria__vista-previa" aria-live="polite" aria-label="Vista previa">
            {/* DL-203: «Elegí un preset para ver qué trae.» va una sola vez, junto a «Usar» apagado. Acá, con nada elegido,
                la intensidad con la que se leen los presets de series. */}
            {!elegido ? (
              <p className="nota" data-intensidad-de-los-presets={intensidad}>
                {C.enLaIntensidad(NOMBRE_DE_LA_INTENSIDAD_DEL_PRESET[intensidad])}
              </p>
            ) : elegido.tipo === 'BE' || elegido.tipo === 'PRESCRIPCION' ? (
              <>
                <p>
                  <strong>{nombreDelElegido}</strong> · {elegido.tipo === 'PRESCRIPCION' ? `${enUnaLinea(elegido.habitual)} · sin cargas` : elegido.preset.tipo === 'PRESCRIPCION' ? detalleDelPreset(elegido.preset, intensidad) : ''}
                </p>
                {ejercicio !== null ? (
                  <fieldset className="galeria__alcance">
                    <legend>{C.alcance}</legend>
                    <label>
                      <input type="radio" name="alcance-del-preset" checked={soloElEjercicio} onChange={() => setSoloElEjercicio(true)} /> {C.esteEjercicio}
                    </label>
                    <label>
                      <input type="radio" name="alcance-del-preset" checked={!soloElEjercicio} onChange={() => setSoloElEjercicio(false)} /> {C.laSesion(prescripciones.length)}
                    </label>
                  </fieldset>
                ) : null}
                {alcance && alcance.filas.length > 0 ? <p className="nota">{alcance.resumen}</p> : <p className="nota" data-para-los-que-agregues>{onElegirParaLaSesionVacia ? COPY_PRESET_CON_LA_SESION_VACIA.queHace : C.sinEjercicios}</p>}
              </>
            ) : null}
          </aside>
        </div>
      ) : elegido?.tipo === 'SESION' ? (
        <div className="galeria__alcance-del-preset" data-alcance-del-preset-de-sesion>
          <table className="tabla">
            <caption className="visualmente-oculto">{COPY_GALERIA_POR_NIVEL.cambiaEnLaSesion}</caption>
            <thead>
              <tr>
                <th scope="col">Qué</th>
                <th scope="col">Antes → después</th>
              </tr>
            </thead>
            <tbody>
              {pisaLaSesion.map((f) => (
                <tr key={f.que}>
                  <th scope="row">{f.que}</th>
                  <td>{antesYDespues(f.antes, f.despues)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>{detalleDelPresetDeSesion(elegido.preset.session)}. {C.deshacerExplica}</p>
          <button type="button" className="boton boton--discreto" onClick={() => setPaso('elegir')}>
            Atrás
          </button>
        </div>
      ) : alcance ? (
        <div className="galeria__alcance-del-preset" data-alcance-del-preset>
          <table className="tabla">
            <caption className="visualmente-oculto">Lo que cambia en cada ejercicio</caption>
            <thead>
              <tr>
                <th scope="col">Ejercicio</th>
                <th scope="col">Series</th>
                <th scope="col">Repeticiones</th>
                <th scope="col">Intensidad</th>
                <th scope="col">Descanso</th>
                <th scope="col">Carga</th>
              </tr>
            </thead>
            <tbody>
              {alcance.filas.map((f) => (
                <tr key={f.posicion}>
                  <th scope="row">{f.nombre}</th>
                  <td>{antesYDespues(String(f.cambio.series.antes), String(f.cambio.series.despues))}</td>
                  <td>{antesYDespues(f.cambio.repeticiones.antes ?? 'Sin dato', f.cambio.repeticiones.despues)}</td>
                  <td>{antesYDespues(f.cambio.intensidad.antes ?? 'Sin dato', f.cambio.intensidad.despues ?? 'Sin dato')}</td>
                  <td>{antesYDespues(segundos(f.cambio.descanso.antes), segundos(f.cambio.descanso.despues))}</td>
                  <td>
                    {f.cambio.carga.delUnoRm ? C.cargaQueSaleDelUnoRm : f.cambio.carga.texto ? `${f.cambio.carga.texto} · se conserva` : 'Sin carga'}
                    {f.cambio.carga.revisar ? (
                      <span className="etiqueta-de-dato ejercicio-del-editor__revisar" data-carga-a-revisar>
                        {f.cambio.carga.revisar}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>{alcance.resumen}</p>
          <p>
            <strong>{C.loQueSePierde}</strong> {alcance.sePierde.length === 0 ? C.nada : alcance.sePierde.join(' · ')} {C.deshacerExplica}
          </p>
          <button type="button" className="boton boton--discreto" onClick={() => setPaso('elegir')}>
            Atrás
          </button>
        </div>
      ) : null}
    </CuadroEnfocado>
  );
}

const antesYDespues = (antes: string, despues: string) => (antes === despues ? `${despues} · igual` : `${antes} → ${despues}`);
const segundos = (s: number | null) => (s === null ? 'Sin dato' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
