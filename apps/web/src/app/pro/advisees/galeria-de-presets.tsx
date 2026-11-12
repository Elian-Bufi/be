'use client';

/**
 * ED-11 (WP-EDITORES-PROFESIONAL, §2.4; DJ-8) · La galería de presets, en un cuadro enfocado (ED-10). Muestra juntos los
 * de BE («De BE · punto de partida») y los tuyos, filtrados por la tarea desde donde se abre:
 * - **prescripción** (desde una sesión o un ejercicio): las cuatro de BE y tus prescripciones habituales (ED-13,
 *   API-HAB-06), que se aplican igual: con la vista previa del alcance si pisan algo, y las cargas se conservan (DJ-8);
 * - **estructura** (desde la estructura o el asistente): las tres de BE, y tus sesiones habituales (HAB, DL-109). Y en
 *   otra pestaña, tus plantillas de plan (Dirección, 2026-11-12): una plantilla reemplaza el borrador entero, que se
 *   descarta y nace de nuevo desde ella, y el borrador nuevo anota de qué plantilla salió (`templateOrigin`).
 *
 * Nada viene elegido al abrir (TEST-EDP-014). Elegir una tarjeta muestra su vista previa al costado. «Usar» aplica con
 * un clic si solo llena lo vacío; si pisa algo, el mismo cuadro pasa a la vista previa del alcance («antes → después»,
 * lo que se pierde) y el principal dice a cuántos ejercicios se aplica. Un cuadro no abre otro: el paso reemplaza al
 * anterior, con «Atrás».
 */
import {
  COPY_PRESETS as C,
  ejercicioPlegadoDelEditor,
  PRESETS_DE_ESTRUCTURA,
  PRESETS_DE_PRESCRIPCION,
  prescripcionDelPreset,
  type EstructuraDePlanDeEntrenamientoEntrada,
  type PresetDeEstructura,
  type PrescripcionHabitual,
  type PresetDePrescripcion,
  type SesionHabitual,
} from '@be/domain';
import { COPY_PLANTILLAS } from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CuadroEnfocado } from '../../../components/cuadro-enfocado';
import { BloqueDeEstado, Cargando } from '../../../components/estados';
import type { Resultado } from '../../../lib/api';
import { ICONO_DE_FALLA, motivoDeFalla, razonDeFalla } from '../../../lib/fallas';
import type { PlantillaParaEmpezar } from './empezar-desde-plantilla';
import { alcanceDelPreset, alcanceDeLaHabitual, type AlcanceDelPreset } from './alcance-del-preset';

type SesionE = NonNullable<EstructuraDePlanDeEntrenamientoEntrada['blocks'][number]['sessions']>[number];
type PrescripcionE = SesionE['prescriptions'][number];

type Elegido =
  | { readonly tipo: 'BE'; readonly preset: PresetDePrescripcion | PresetDeEstructura }
  | { readonly tipo: 'HABITUAL'; readonly sesion: SesionHabitual }
  | { readonly tipo: 'PRESCRIPCION'; readonly habitual: PrescripcionHabitual }
  | { readonly tipo: 'PLANTILLA'; readonly plantilla: PlantillaParaEmpezar }
  | null;

/** ED-11: las plantillas en la galería de estructura. Aplicar una reemplaza el borrador (lo hace quien abre la galería). */
export interface PlantillasEnLaGaleria {
  readonly leer: () => Promise<Resultado<readonly PlantillaParaEmpezar[]>>;
  /** «versión 11 en preparación»: lo que se descarta. */
  readonly borrador: string;
  readonly reemplazando: boolean;
  readonly error: string | null;
  readonly onReemplazar: (templateVersionId: string) => void;
}

export const COPY_PLANTILLAS_EN_LA_GALERIA = {
  pestanas: 'Qué querés usar',
  presets: 'Presets y habituales',
  plantillas: 'Tus plantillas',
  reemplazar: (nombre: string) => `Reemplazar el borrador con «${nombre}»`,
  reemplazando: 'Reemplazando…',
  queHace: (borrador: string, nombre: string) =>
    `Se descarta la ${borrador} con todo lo que tiene, y se crea una nueva desde «${nombre}», que anota de qué plantilla salió. La versión activa no cambia.`,
} as const;

/** «4 × 5 · RIR 1 · 3:00»: una prescripción habitual en una línea, como se lee un ejercicio plegado. */
const enUnaLinea = (h: PrescripcionHabitual): string => ejercicioPlegadoDelEditor({ exerciseVersionId: '', ...structuredClone(h.prescription) } as PrescripcionE, 0).resumen;

export function GaleriaDePresets({
  abierto,
  tarea,
  persona,
  sesion,
  nombreDeLaSesion,
  ejercicio = null,
  seReemplazan = [],
  nombreDe,
  habituales,
  prescripcionesHabituales = [],
  plantillas = null,
  onAplicarPrescripcion,
  onAplicarEstructura,
  onInsertarHabitual,
  onCerrar,
}: {
  abierto: boolean;
  tarea: 'prescripcion' | 'estructura';
  /** El nombre de la persona, o la referencia neutral: «Se escribe en el borrador: Diego no ve nada». */
  persona: string | null;
  /** La sesión que se mira: para la prescripción, sus ejercicios. */
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
  /** ED-11: las plantillas de plan, en su pestaña; solo en la galería de estructura y si hay un borrador que reemplazar. */
  plantillas?: PlantillasEnLaGaleria | null;
  onAplicarPrescripcion: (a: AlcanceDelPreset, nombre: string) => void;
  onAplicarEstructura: (p: PresetDeEstructura) => void;
  onInsertarHabitual: (h: SesionHabitual) => void;
  onCerrar: () => void;
}) {
  const [elegido, setElegido] = useState<Elegido>(null);
  const [paso, setPaso] = useState<'elegir' | 'alcance'>('elegir');
  const [soloElEjercicio, setSoloElEjercicio] = useState(ejercicio !== null);
  const [pestana, setPestana] = useState<'presets' | 'plantillas'>('presets');
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
    if (abierto && pestana === 'plantillas') void leerPlantillas();
  }, [abierto, pestana, leerPlantillas]);
  // El cuadro queda montado: el alcance se vuelve a elegir cada vez que se abre.
  useEffect(() => {
    if (abierto) setSoloElEjercicio(ejercicio !== null);
  }, [abierto, ejercicio]);
  const cerrar = () => {
    setElegido(null);
    setPaso('elegir');
    setPestana('presets');
    onCerrar();
  };
  const prescripciones = sesion?.prescriptions ?? [];
  const posiciones = soloElEjercicio && ejercicio !== null ? [ejercicio] : prescripciones.map((_, n) => n);
  const alcance =
    elegido?.tipo === 'BE' && elegido.preset.tipo === 'PRESCRIPCION'
      ? alcanceDelPreset(prescripciones, posiciones, prescripcionDelPreset(elegido.preset), nombreDe, nombreDeLaSesion)
      : elegido?.tipo === 'PRESCRIPCION'
        ? alcanceDeLaHabitual(prescripciones, posiciones, elegido.habitual.prescription as Parameters<typeof alcanceDeLaHabitual>[2], nombreDe, nombreDeLaSesion)
        : null;
  /** El nombre de lo elegido, si se aplica a ejercicios. */
  const nombreDelElegido = elegido?.tipo === 'PRESCRIPCION' ? elegido.habitual.name : elegido?.tipo === 'BE' ? elegido.preset.nombre : '';

  const usar = () => {
    if (!elegido) return;
    if (elegido.tipo === 'PLANTILLA') {
      // Reemplaza el borrador: el cuadro queda abierto con «Reemplazando…» hasta que el plan lo resuelve.
      plantillas?.onReemplazar(elegido.plantilla.versionId);
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
    if (!alcance || alcance.filas.length === 0) return;
    // DJ-8: con un clic si solo llena lo vacío; si pisa algo, primero la vista previa del alcance.
    if (paso === 'elegir' && !alcance.soloLlenaLoVacio) return setPaso('alcance');
    onAplicarPrescripcion(alcance, nombreDelElegido);
    cerrar();
  };

  const presetsDeBe = tarea === 'prescripcion' ? PRESETS_DE_PRESCRIPCION : PRESETS_DE_ESTRUCTURA;
  const sinEjercicios = tarea === 'prescripcion' && prescripciones.length === 0;
  const titulo =
    paso === 'alcance' && (elegido?.tipo === 'BE' || elegido?.tipo === 'PRESCRIPCION')
      ? C.aplicarA(nombreDelElegido, soloElEjercicio && ejercicio !== null ? nombreDe(prescripciones[ejercicio]!) : nombreDeLaSesion)
      : tarea === 'prescripcion'
        ? `Presets de prescripción para ${nombreDeLaSesion}`
        : 'Presets de estructura';
  const principal =
    elegido?.tipo === 'PLANTILLA'
      ? { texto: COPY_PLANTILLAS_EN_LA_GALERIA.reemplazar(elegido.plantilla.nombre), alTocar: usar, enviando: plantillas?.reemplazando ?? false, textoEnviando: COPY_PLANTILLAS_EN_LA_GALERIA.reemplazando }
      : paso === 'alcance' && alcance
      ? { texto: C.aplicarAEjercicios(alcance.filas.length), alTocar: usar }
      : { texto: C.usar, alTocar: usar, apagado: !elegido ? C.nadaElegido : sinEjercicios && (elegido.tipo === 'PRESCRIPCION' || (elegido.tipo === 'BE' && elegido.preset.tipo === 'PRESCRIPCION')) ? C.sinEjercicios : null };

  return (
    <CuadroEnfocado
      abierto={abierto}
      forma="dialogo"
      ancho
      titulo={titulo}
      sobretitulo={elegido?.tipo === 'BE' && paso === 'alcance' && elegido.preset.tipo === 'PRESCRIPCION' ? `${elegido.preset.detalle} · ${C.rotuloDeBe} · ${C.noEsRecomendacion}` : null}
      principal={principal}
      pie={<p className="nota galeria__pie">{C.escribeEnElBorrador(persona ?? 'la persona')}</p>}
      onCerrar={cerrar}
    >
      {tarea === 'estructura' && plantillas && paso === 'elegir' ? (
        <fieldset className="segmentos galeria__pestanas">
          <legend className="visualmente-oculto">{COPY_PLANTILLAS_EN_LA_GALERIA.pestanas}</legend>
          <div className="segmentos__fila">
            {(['presets', 'plantillas'] as const).map((p) => (
              <label key={p} className="segmento" data-pestana-de-la-galeria={p}>
                <input
                  type="radio"
                  name="pestana-de-la-galeria"
                  checked={pestana === p}
                  onChange={() => {
                    setPestana(p);
                    setElegido(null);
                  }}
                />
                {COPY_PLANTILLAS_EN_LA_GALERIA[p]}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      {paso === 'elegir' && pestana === 'plantillas' && plantillas ? (
        <div className="galeria" data-galeria="plantillas">
          <div className="galeria__grupos">
            <section aria-labelledby="galeria-plantillas">
              <h3 id="galeria-plantillas">{COPY_PLANTILLAS_EN_LA_GALERIA.plantillas}</h3>
              {!lecturaDePlantillas ? (
                <Cargando />
              ) : !lecturaDePlantillas.ok ? (
                <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[motivoDeFalla(lecturaDePlantillas)]} titulo={COPY_PLANTILLAS.noCargaron} onReintentar={() => void leerPlantillas()} deQue="la lectura de las plantillas">
                  {razonDeFalla(motivoDeFalla(lecturaDePlantillas))}
                </BloqueDeEstado>
              ) : lecturaDePlantillas.datos.length === 0 ? (
                <>
                  <p>{COPY_PLANTILLAS.sinPlantillasActivas}</p>
                  <p className="nota">{COPY_PLANTILLAS.dondeSeArman}</p>
                </>
              ) : (
                <ul className="galeria__tarjetas" role="list">
                  {lecturaDePlantillas.datos.map((p) => (
                    <li key={p.versionId}>
                      <button type="button" className="galeria__tarjeta" aria-pressed={elegido?.tipo === 'PLANTILLA' && elegido.plantilla.versionId === p.versionId} data-plantilla={p.versionId} onClick={() => setElegido({ tipo: 'PLANTILLA', plantilla: p })}>
                        <span className="galeria__nombre">{p.nombre}</span>
                        <span className="nota">{p.detalle}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
          <aside className="galeria__vista-previa" aria-live="polite" aria-label="Vista previa">
            {elegido?.tipo === 'PLANTILLA' ? (
              <>
                <p>
                  <strong>{elegido.plantilla.nombre}</strong> · {elegido.plantilla.detalle}
                </p>
                <p data-reemplaza-el-borrador>{COPY_PLANTILLAS_EN_LA_GALERIA.queHace(plantillas.borrador, elegido.plantilla.nombre)}</p>
                {plantillas.error ? (
                  <p className="campo__error" role="alert">
                    {plantillas.error}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="nota">{C.nadaElegido}</p>
            )}
          </aside>
        </div>
      ) : paso === 'elegir' ? (
        <div className="galeria" data-galeria={tarea}>
          <div className="galeria__grupos">
            <section aria-labelledby="galeria-de-be">
              <h3 id="galeria-de-be">{C.deBe}</h3>
              <ul className="galeria__tarjetas" role="list">
                {presetsDeBe.map((p) => (
                  <li key={p.clave}>
                    <button type="button" className="galeria__tarjeta" aria-pressed={elegido?.tipo === 'BE' && elegido.preset.clave === p.clave} data-preset={p.clave} onClick={() => setElegido({ tipo: 'BE', preset: p })}>
                      <span className="galeria__nombre">{p.nombre}</span>
                      <span className="nota">{p.detalle}</span>
                      <span className="etiqueta-de-dato">{C.rotuloDeBe}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="galeria-tuyos">
              <h3 id="galeria-tuyos">{C.tuyos}</h3>
              {tarea === 'prescripcion' ? (
                prescripcionesHabituales.length === 0 ? (
                  <p className="nota">{C.sinTuyos}</p>
                ) : (
                  <ul className="galeria__tarjetas" role="list" data-prescripciones-habituales>
                    {prescripcionesHabituales.map((h) => (
                      <li key={h.presetId}>
                        <button type="button" className="galeria__tarjeta" aria-pressed={elegido?.tipo === 'PRESCRIPCION' && elegido.habitual.presetId === h.presetId} onClick={() => setElegido({ tipo: 'PRESCRIPCION', habitual: h })}>
                          <span className="galeria__nombre">{h.name}</span>
                          <span className="nota">{enUnaLinea(h)} · sin cargas</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              ) : habituales.length === 0 ? (
                <p className="nota">{C.sinTuyos}</p>
              ) : (
                <ul className="galeria__tarjetas" role="list">
                  {habituales.map((h) => (
                    <li key={h.presetId}>
                      <button type="button" className="galeria__tarjeta" aria-pressed={elegido?.tipo === 'HABITUAL' && elegido.sesion.presetId === h.presetId} onClick={() => setElegido({ tipo: 'HABITUAL', sesion: h })}>
                        <span className="galeria__nombre">{h.name}</span>
                        <span className="nota">{C.tuyosSesiones}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
          <aside className="galeria__vista-previa" aria-live="polite" aria-label="Vista previa">
            {!elegido ? (
              <p className="nota">{C.nadaElegido}</p>
            ) : elegido.tipo === 'HABITUAL' ? (
              <>
                <p>
                  <strong>{elegido.sesion.name}</strong>
                </p>
                <p className="nota">{elegido.sesion.structure.prescriptions.length} ejercicios. Se suma al final de las sesiones que mirás.</p>
              </>
            ) : elegido.tipo === 'BE' && elegido.preset.tipo === 'ESTRUCTURA' ? (
              <>
                <p>{C.estructuraEscribe(elegido.preset.sesiones.length)}</p>
                <ul>
                  {elegido.preset.sesiones.map((s) => (
                    <li key={s.nombre}>{s.nombre}</li>
                  ))}
                </ul>
                <p className="nota" data-se-reemplazan={seReemplazan.length}>
                  {seReemplazan.length === 0
                    ? 'No se quita ninguna sesión: las del preset se suman al final.'
                    : `Se reemplazan ${seReemplazan.length === 1 ? 'la sesión' : 'las sesiones'} sin nada escrito (sin ejercicios, indicaciones ni días): ${seReemplazan.join(', ')}. Las demás quedan como están.`}
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>{nombreDelElegido}</strong> · {elegido.tipo === 'PRESCRIPCION' ? `${enUnaLinea(elegido.habitual)} · sin cargas` : elegido.tipo === 'BE' && elegido.preset.tipo === 'PRESCRIPCION' ? elegido.preset.detalle : ''}
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
                {alcance && alcance.filas.length > 0 ? <p className="nota">{alcance.resumen}</p> : <p className="nota">{C.sinEjercicios}</p>}
              </>
            )}
          </aside>
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
                    {f.cambio.carga.texto ? `${f.cambio.carga.texto} · se conserva` : 'Sin carga'}
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
          <button type="button" className="boton boton--enlace" onClick={() => setPaso('elegir')}>
            Atrás
          </button>
        </div>
      ) : null}
    </CuadroEnfocado>
  );
}

const antesYDespues = (antes: string, despues: string) => (antes === despues ? `${despues} · igual` : `${antes} → ${despues}`);
const segundos = (s: number | null) => (s === null ? 'Sin dato' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
