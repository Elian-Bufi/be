'use client';

/**
 * «Empezar desde una plantilla» (PF-09; DL-108), para un plan de un área: las plantillas activas del profesional, en un
 * diálogo, y «Crear el borrador desde esta plantilla» (WP-ESCRITORIO-AREAS, parte 5).
 * - **La lista se lee al abrir,** no al entrar a la sección: es una acción de vez en cuando.
 * - **Una lectura que falla dice su motivo y se reintenta.** No es «No tenés plantillas»: una falla no es una ausencia.
 * - **Nada viene elegido:** crear el borrador exige elegir.
 * El área dice cómo se leen sus plantillas y cómo se describe cada una; el borrador lo crea ella.
 * - DL-199 (ET3-02): en Entrenamiento, un selector de origen arriba, «Mis plantillas · Plantillas de BE», como el del
 *   Recetario de BE. Las de BE se leen la primera vez que se eligen y muestran sus fases y sesiones antes de aplicarlas.
 */
import { COPY_PLANTILLAS, COPY_PLANTILLAS_DE_BE, NOMBRE_DE_LA_DIVISION, type PlantillaDeBeApi } from '@be/domain';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { DialogoDeConfirmacion } from '../../../components/dialogo';
import { BloqueDeEstado, Cargando } from '../../../components/estados';
import type { Resultado } from '../../../lib/api';
import { ICONO_DE_FALLA, motivoDeFalla, razonDeFalla } from '../../../lib/fallas';

/** Una plantilla de la lista: la versión que se aplica, su nombre y lo que trae («4 comidas · Sin cantidades»). */
export interface PlantillaParaEmpezar {
  readonly versionId: string;
  readonly nombre: string;
  readonly detalle: string;
}

/** DL-199: las Plantillas de BE en el diálogo (Entrenamiento). */
export interface PlantillasDeBeParaEmpezar {
  readonly leer: () => Promise<Resultado<readonly PlantillaDeBeApi[]>>;
  readonly onAplicar: (clave: string, version: number) => void;
}

export function DialogoEmpezarDesdePlantilla({
  abierto,
  leer,
  creando,
  error,
  onCerrar,
  onAplicar,
  dondeSeArman = COPY_PLANTILLAS.dondeSeArman,
  deBe,
}: {
  abierto: boolean;
  /** Las plantillas activas, todas. Una sesión vencida la resuelve quien llama. */
  leer: () => Promise<Resultado<readonly PlantillaParaEmpezar[]>>;
  creando: boolean;
  /** La falla al crear el borrador, si la hubo. */
  error: string | null;
  onCerrar: () => void;
  onAplicar: (templateVersionId: string) => void;
  /** PLT (DL-182): dónde se arman las plantillas del área (las de Entrenamiento, también en «Plantillas y habituales»). */
  dondeSeArman?: string;
  /** DL-199 (ET3-02): las Plantillas de BE, con su selector de origen. Sin esto, solo las propias. */
  deBe?: PlantillasDeBeParaEmpezar;
}) {
  const nombre = useId();
  const nombreDeBe = useId();
  const [lectura, setLectura] = useState<Resultado<readonly PlantillaParaEmpezar[]> | null>(null);
  const [elegida, setElegida] = useState('');
  const generacion = useRef(0);
  const [origen, setOrigen] = useState<'mias' | 'be'>('mias');
  const [lecturaDeBe, setLecturaDeBe] = useState<Resultado<readonly PlantillaDeBeApi[]> | null>(null);
  const [elegidaDeBe, setElegidaDeBe] = useState('');
  const generacionDeBe = useRef(0);
  const leerDeBe = deBe?.leer;
  const cargarDeBe = useCallback(async () => {
    if (!leerDeBe) return;
    const esta = ++generacionDeBe.current;
    setLecturaDeBe(null);
    const r = await leerDeBe();
    if (esta === generacionDeBe.current) setLecturaDeBe(r);
  }, [leerDeBe]);
  useEffect(() => {
    if (abierto) return;
    setOrigen('mias');
    setLecturaDeBe(null);
    setElegidaDeBe('');
    generacionDeBe.current++;
  }, [abierto]);
  useEffect(() => {
    if (abierto && origen === 'be' && lecturaDeBe === null) void cargarDeBe();
  }, [abierto, origen, lecturaDeBe, cargarDeBe]);
  const enBe = origen === 'be' && !!deBe;
  const laDeBe = enBe && lecturaDeBe?.ok ? (lecturaDeBe.datos.find((p) => p.key === elegidaDeBe) ?? null) : null;

  const cargar = useCallback(async () => {
    const esta = ++generacion.current;
    setLectura(null);
    const r = await leer();
    if (esta === generacion.current) setLectura(r);
  }, [leer]);

  useEffect(() => {
    if (!abierto) return;
    setElegida('');
    void cargar();
    return () => {
      generacion.current++;
    };
  }, [abierto, cargar]);

  return (
    <DialogoDeConfirmacion
      abierto={abierto}
      titulo={COPY_PLANTILLAS.empezarDesdePlantilla}
      textoVolver={COPY_PLANTILLAS.cancelar}
      textoConfirmar={COPY_PLANTILLAS.aplicar}
      textoEnviando={COPY_PLANTILLAS.creandoElBorrador}
      enviando={creando}
      error={error}
      confirmarDeshabilitado={enBe ? !laDeBe : !elegida}
      ancho={!!deBe}
      onVolver={onCerrar}
      onConfirmar={() => {
        if (!enBe) onAplicar(elegida);
        else if (laDeBe && deBe) deBe.onAplicar(laDeBe.key, laDeBe.version);
      }}
    >
      {abierto && deBe ? (
        <div className="selector-de-origen" role="group" aria-label={COPY_PLANTILLAS_DE_BE.deDonde}>
          <button type="button" className={`boton boton--compacto ${origen === 'mias' ? 'boton--primario' : 'boton--secundario'}`} aria-pressed={origen === 'mias'} onClick={() => setOrigen('mias')} disabled={creando} data-origen-mias>
            {COPY_PLANTILLAS_DE_BE.mias}
          </button>
          <button type="button" className={`boton boton--compacto ${origen === 'be' ? 'boton--primario' : 'boton--secundario'}`} aria-pressed={origen === 'be'} onClick={() => setOrigen('be')} disabled={creando} data-origen-de-be>
            {COPY_PLANTILLAS_DE_BE.deBe}
          </button>
        </div>
      ) : null}
      {!abierto ? null : enBe ? (
        <PlantillasDeBe lectura={lecturaDeBe} nombre={nombreDeBe} elegida={elegidaDeBe} onElegir={setElegidaDeBe} creando={creando} onReintentar={() => void cargarDeBe()} laElegida={laDeBe} />
      ) : !lectura ? (
        <Cargando />
      ) : !lectura.ok ? (
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[motivoDeFalla(lectura)]} titulo={COPY_PLANTILLAS.noCargaron} onReintentar={() => void cargar()} deQue="la lectura de las plantillas">
          {razonDeFalla(motivoDeFalla(lectura))}
        </BloqueDeEstado>
      ) : lectura.datos.length === 0 ? (
        <>
          <p>{COPY_PLANTILLAS.sinPlantillasActivas}</p>
          <p className="nota">{dondeSeArman}</p>
        </>
      ) : (
        <>
          <p className="nota">{COPY_PLANTILLAS.elegiUna}</p>
          <fieldset className="plantillas-para-empezar">
            <legend className="visualmente-oculto">{COPY_PLANTILLAS.plantillasActivas}</legend>
            {lectura.datos.map((p) => (
              <label key={p.versionId} className="plantilla-para-empezar">
                <input type="radio" name={nombre} value={p.versionId} checked={elegida === p.versionId} onChange={() => setElegida(p.versionId)} disabled={creando} />
                <span className="plantilla-para-empezar__nombre">{p.nombre}</span>
                <span className="plantilla-para-empezar__detalle nota">{p.detalle}</span>
              </label>
            ))}
          </fieldset>
        </>
      )}
    </DialogoDeConfirmacion>
  );
}

/** DL-199 (ET3-02): la lista de las Plantillas de BE y lo que trae la elegida (sus fases y sus sesiones). */
function PlantillasDeBe({
  lectura,
  nombre,
  elegida,
  onElegir,
  creando,
  onReintentar,
  laElegida,
}: {
  readonly lectura: Resultado<readonly PlantillaDeBeApi[]> | null;
  readonly nombre: string;
  readonly elegida: string;
  readonly onElegir: (clave: string) => void;
  readonly creando: boolean;
  readonly onReintentar: () => void;
  readonly laElegida: PlantillaDeBeApi | null;
}) {
  if (!lectura) return <Cargando />;
  if (!lectura.ok) {
    return (
      <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[motivoDeFalla(lectura)]} titulo={COPY_PLANTILLAS_DE_BE.noCargaron} onReintentar={onReintentar} deQue="la lectura de las Plantillas de BE">
        {razonDeFalla(motivoDeFalla(lectura))}
      </BloqueDeEstado>
    );
  }
  if (lectura.datos.length === 0) return <p>{COPY_PLANTILLAS_DE_BE.ninguna}</p>;
  return (
    <div className="plantillas-de-be" data-plantillas-de-be>
      <p className="nota">{COPY_PLANTILLAS_DE_BE.queTraen}</p>
      <fieldset className="plantillas-para-empezar plantillas-de-be__lista">
        <legend className="visualmente-oculto">{COPY_PLANTILLAS_DE_BE.deBe}</legend>
        {lectura.datos.map((p) => (
          <label key={p.key} className="plantilla-para-empezar" data-plantilla-de-be={p.key}>
            <input type="radio" name={nombre} value={p.key} checked={elegida === p.key} onChange={() => onElegir(p.key)} disabled={creando} />
            <span className="plantilla-para-empezar__nombre">{p.name}</span>
            <span className="plantilla-para-empezar__detalle nota">{COPY_PLANTILLAS_DE_BE.detalle(NOMBRE_DE_LA_DIVISION[p.split], p.daysPerWeek, p.weeks)}</span>
            {p.validation === 'PROPOSAL' ? <span className="plantilla-de-be__propuesta">{COPY_PLANTILLAS_DE_BE.propuesta}</span> : null}
          </label>
        ))}
      </fieldset>
      {/* Sin aria-live: elegir con las flechas le leía el plan entero en cada opción (la opción elegida ya se anuncia). Se
          desplaza adentro (alto fijo, RP-19): una región con foco, para recorrerla con el teclado. */}
      <div className="plantilla-de-be__vista" role="region" aria-label={laElegida ? laElegida.name : COPY_PLANTILLAS_DE_BE.deBe} tabIndex={0} data-vista-de-la-plantilla-de-be>
        {!laElegida ? (
          <p className="nota">{COPY_PLANTILLAS_DE_BE.elegiUna}</p>
        ) : (
          <>
            <p className="plantilla-de-be__descripcion">{laElegida.description}</p>
            <p className="nota">{COPY_PLANTILLAS_DE_BE.dias(laElegida.suggestedDays)}</p>
            {laElegida.phases.map((f, i) => (
              <section key={i} className="plantilla-de-be__fase" aria-label={f.name}>
                <h3 className="plantilla-de-be__titulo-de-fase">
                  {f.name} <span className="nota">· {COPY_PLANTILLAS_DE_BE.semanas(f.weeks)}{f.progression ? ` · ${f.progression}` : ''}</span>
                </h3>
                <div className="plantilla-de-be__sesiones">
                  {f.sessions.map((s, j) => (
                    <div key={j} className="plantilla-de-be__sesion">
                      <p className="plantilla-de-be__nombre-de-sesion">{s.label}</p>
                      <ul className="plantilla-de-be__ejercicios">
                        {s.exercises.map((e, k) => (
                          <li key={k}>
                            <span>{e.name}</span> <span className="nota">{e.prescription}</span>
                            {e.exerciseId ? null : <span className="nota"> · {COPY_PLANTILLAS_DE_BE.noDisponible}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
