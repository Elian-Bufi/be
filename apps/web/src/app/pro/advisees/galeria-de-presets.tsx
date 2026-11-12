'use client';

/**
 * ED-11 (WP-EDITORES-PROFESIONAL, §2.4; DJ-8) · La galería de presets, en un cuadro enfocado (ED-10). Muestra juntos los
 * de BE («De BE · punto de partida») y los tuyos, filtrados por la tarea desde donde se abre:
 * - **prescripción** (desde una sesión o un ejercicio): las cuatro de BE; las propias llegan con ED-13 (la API, en la
 *   ventana del vie 20), y mientras tanto se dice;
 * - **estructura** (desde la estructura o el asistente): las tres de BE, y tus sesiones habituales (HAB, DL-109).
 *
 * Nada viene elegido al abrir (TEST-EDP-014). Elegir una tarjeta muestra su vista previa al costado. «Usar» aplica con
 * un clic si solo llena lo vacío; si pisa algo, el mismo cuadro pasa a la vista previa del alcance («antes → después»,
 * lo que se pierde) y el principal dice a cuántos ejercicios se aplica. Un cuadro no abre otro: el paso reemplaza al
 * anterior, con «Atrás».
 */
import {
  COPY_PRESETS as C,
  PRESETS_DE_ESTRUCTURA,
  PRESETS_DE_PRESCRIPCION,
  prescripcionDelPreset,
  type EstructuraDePlanDeEntrenamientoEntrada,
  type PresetDeEstructura,
  type PresetDePrescripcion,
  type SesionHabitual,
} from '@be/domain';
import { useEffect, useState } from 'react';
import { CuadroEnfocado } from '../../../components/cuadro-enfocado';
import { alcanceDelPreset, type AlcanceDelPreset } from './alcance-del-preset';

type SesionE = NonNullable<EstructuraDePlanDeEntrenamientoEntrada['blocks'][number]['sessions']>[number];
type PrescripcionE = SesionE['prescriptions'][number];

type Elegido = { readonly tipo: 'BE'; readonly preset: PresetDePrescripcion | PresetDeEstructura } | { readonly tipo: 'HABITUAL'; readonly sesion: SesionHabitual } | null;

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
  onAplicarPrescripcion: (a: AlcanceDelPreset, nombre: string) => void;
  onAplicarEstructura: (p: PresetDeEstructura) => void;
  onInsertarHabitual: (h: SesionHabitual) => void;
  onCerrar: () => void;
}) {
  const [elegido, setElegido] = useState<Elegido>(null);
  const [paso, setPaso] = useState<'elegir' | 'alcance'>('elegir');
  const [soloElEjercicio, setSoloElEjercicio] = useState(ejercicio !== null);
  // El cuadro queda montado: el alcance se vuelve a elegir cada vez que se abre.
  useEffect(() => {
    if (abierto) setSoloElEjercicio(ejercicio !== null);
  }, [abierto, ejercicio]);
  const cerrar = () => {
    setElegido(null);
    setPaso('elegir');
    onCerrar();
  };
  const prescripciones = sesion?.prescriptions ?? [];
  const posiciones = soloElEjercicio && ejercicio !== null ? [ejercicio] : prescripciones.map((_, n) => n);
  const alcance = elegido?.tipo === 'BE' && elegido.preset.tipo === 'PRESCRIPCION' ? alcanceDelPreset(prescripciones, posiciones, prescripcionDelPreset(elegido.preset), nombreDe, nombreDeLaSesion) : null;

  const usar = () => {
    if (!elegido) return;
    if (elegido.tipo === 'HABITUAL') {
      onInsertarHabitual(elegido.sesion);
      return cerrar();
    }
    if (elegido.preset.tipo === 'ESTRUCTURA') {
      onAplicarEstructura(elegido.preset);
      return cerrar();
    }
    if (!alcance || alcance.filas.length === 0) return;
    // DJ-8: con un clic si solo llena lo vacío; si pisa algo, primero la vista previa del alcance.
    if (paso === 'elegir' && !alcance.soloLlenaLoVacio) return setPaso('alcance');
    onAplicarPrescripcion(alcance, elegido.preset.nombre);
    cerrar();
  };

  const presetsDeBe = tarea === 'prescripcion' ? PRESETS_DE_PRESCRIPCION : PRESETS_DE_ESTRUCTURA;
  const sinEjercicios = tarea === 'prescripcion' && prescripciones.length === 0;
  const titulo =
    paso === 'alcance' && elegido?.tipo === 'BE'
      ? C.aplicarA(elegido.preset.nombre, soloElEjercicio && ejercicio !== null ? nombreDe(prescripciones[ejercicio]!) : nombreDeLaSesion)
      : tarea === 'prescripcion'
        ? `Presets de prescripción para ${nombreDeLaSesion}`
        : 'Presets de estructura';
  const principal =
    paso === 'alcance' && alcance
      ? { texto: C.aplicarAEjercicios(alcance.filas.length), alTocar: usar }
      : { texto: C.usar, alTocar: usar, apagado: !elegido ? C.nadaElegido : sinEjercicios && elegido.tipo === 'BE' && elegido.preset.tipo === 'PRESCRIPCION' ? C.sinEjercicios : null };

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
      {paso === 'elegir' ? (
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
                <p className="nota">{C.prescripcionesPropiasMasAdelante}</p>
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
            ) : elegido.preset.tipo === 'ESTRUCTURA' ? (
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
                  <strong>{elegido.preset.nombre}</strong> · {elegido.preset.detalle}
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
