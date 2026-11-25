'use client';

/**
 * DL-197 (WP-EDITOR-ENTRENAMIENTO-TANDA-1, ET1-02 a ET1-04) · los cuadros de configuración del editor del plan, la regla
 * que eligió Dirección: **los cuadros son para configurar; el panel lateral es para mirar** (GUIA-UX-UI).
 * - **«Configurar plan»:** inicio, duración en semanas o fin, objetivo, anotaciones privadas e intensidad del plan.
 * - **«Editar fase»:** nombre y semanas (más su objetivo y sus anotaciones), con «Duplicar fase» y «Quitar fase» al pie.
 * - **«Días de la semana»:** una matriz con todas las sesiones de la fase contra L a D; el nombre de cada sesión se edita
 *   ahí mismo.
 * Cada uno es un `CuadroEnfocado` (título, cruz, cuerpo y pie; Escape cierra y el foco vuelve a quien lo abrió) con el «?»
 * en la esquina, que explica paso a paso con un ejemplo resuelto. Lo que se escribe es un borrador del cuadro: entra al
 * plan con el botón principal; cerrar con cambios pregunta.
 */
import { COPY_NOTACION_DEL_ESFUERZO, DIAS_DE_LA_SEMANA, finDelPlan, type DiaDeLaSemana, type NotacionDelEsfuerzo, type PlanificacionDelPlan } from '@be/domain';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { CampoDeFecha } from '../../../../components/campo-de-fecha';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { Icono } from '../../../../components/icono';
import { DIA_CORTO, DIA_LARGO } from '../estacion/estacion';
import { AYUDAS_DEL_EDITOR, ContenidoDeLaAyuda } from './ayudas-del-editor';
import { conAnotacionesDelPlan, conFin, conInicio, conObjetivo, conSemanasDelPlan } from './fases-del-plan';
import { guardadoDeLaIntensidad, INTENSIDADES, intensidadElegida, type IntensidadElegida } from './intensidad-del-plan';

export { criterioDeLaIntensidad, type IntensidadElegida } from './intensidad-del-plan';

export const COPY_CUADROS_DEL_PLAN = {
  configurar: 'Configurar plan',
  guardarPlan: 'Guardar',
  inicio: 'Inicio',
  duracion: 'Duración',
  semanas: 'semanas',
  fin: 'Fin',
  sinInicio: 'Elegí cuándo empieza: con eso, cada fase y cada sesión tienen sus fechas.',
  objetivo: 'Objetivo del plan',
  objetivoAyuda: 'Lo que busca el plan, en tus palabras. La app de la persona todavía no lo muestra; sí va en la descarga de sus datos.',
  anotaciones: 'Anotaciones',
  soloVos: 'Solo vos',
  anotacionesAyuda: 'Lo que querés recordar de este plan: la persona no lo ve, ni en la app ni en lo que se descarga de sus datos.',
  intensidad: 'Intensidad del plan',
  nombreDeLaIntensidad: { RIR: 'RIR', RPE: 'RPE', PERCENT_RM: '% RM', NONE: 'Solo carga y repeticiones' } as Readonly<Record<IntensidadElegida, string>>,
  queEsLaIntensidad: {
    RIR: 'Repeticiones en reserva: cuántas más se podrían hacer.',
    RPE: 'Esfuerzo percibido, del 1 al 10. Se guarda como RIR (RPE = 10 − RIR).',
    PERCENT_RM: 'Una parte de la carga máxima para una repetición (1RM).',
    NONE: 'Sin criterio de intensidad: la carga y las repeticiones lo dicen todo.',
  } as Readonly<Record<IntensidadElegida, string>>,
  heredan: 'Cada ejercicio nuevo la toma. Uno puede tener otra, en su «Más opciones».',
  conOtra: (n: number, nombre: string) => (n === 1 ? `Ya hay 1 ejercicio con otra intensidad: queda como está, salvo que lo pases a ${nombre}.` : `Ya hay ${n} ejercicios con otra intensidad: quedan como están, salvo que los pases a ${nombre}.`),
  pasarlos: (n: number, nombre: string) => (n === 1 ? `Pasarlo a ${nombre} (se quita su objetivo de intensidad: lo escribís de nuevo)` : `Pasarlos a ${nombre} (se quita su objetivo de intensidad: lo escribís de nuevo)`),
  lasFasesSuman: (suman: number, del: number) => (suman === del ? `Las fases ocupan las ${del} semanas.` : suman < del ? `Las fases suman ${suman} de ${del} semanas.` : `Las fases suman ${suman} semanas: ${suman - del} más que el plan. Así no se activa.`),
  editarFase: 'Editar fase',
  nombreDeLaFase: 'Nombre',
  semanasDeLaFase: 'Semanas',
  alCambiarLaDuracion: 'Al cambiar la duración, se ajustan las fechas de las fases siguientes.',
  objetivoDeLaFase: 'Objetivo de la fase',
  objetivoDeLaFaseAyuda: 'Qué busca esta fase. La persona lo ve con su plan.',
  proposito: 'Propósito',
  guardarFase: 'Guardar fase',
  duplicar: 'Duplicar fase',
  quitar: 'Quitar fase',
  quitarPregunta: (nombre: string) => `¿Quitar «${nombre}»? Se van sus sesiones y sus ejercicios de esta versión.`,
  quitarSi: 'Sí, quitar la fase',
  quitarNo: 'No, dejarla',
  laUnica: 'Es la única fase de la versión.',
  faltaElNombre: 'Escribí el nombre de la fase.',
  semanasNoSeEntienden: 'Van de 1 a 52 semanas, en números enteros.',
  dias: 'Días de la semana',
  guardarDias: 'Guardar días',
  sinSesiones: 'Esta fase todavía no tiene sesiones: agregá una y después elegís sus días.',
  nombreDeLaSesion: (letra: string) => `Nombre de la sesión ${letra}`,
  diaDeLaSesion: (dia: DiaDeLaSemana, sesion: string) => `${DIA_LARGO[dia]}: ${sesion}`,
  sinNombre: 'Cada sesión necesita un nombre.',
} as const;
const T = COPY_CUADROS_DEL_PLAN;

/** Un número entero de semanas escrito, o `null` si el campo quedó vacío o no se entiende. */
export const leerSemanas = (s: string, maximo: number): number | null => {
  const n = Number(s.trim());
  return s.trim() !== '' && Number.isInteger(n) && n >= 1 && n <= maximo ? n : null;
};

/** Un área de texto con su rótulo, compacta. */
function Texto({ id, rotulo, valor, onCambiar, maximo, privado = false, placeholder }: { id: string; rotulo: ReactNode; valor: string | null | undefined; onCambiar: (v: string | null) => void; maximo: number; privado?: boolean; placeholder?: string }) {
  return (
    <div className={privado ? 'campo plan-y-fases__texto plan-y-fases__texto--privado' : 'campo plan-y-fases__texto'}>
      <label htmlFor={id}>{rotulo}</label>
      <textarea id={id} rows={3} maxLength={maximo} value={valor ?? ''} placeholder={placeholder} onChange={(e) => onCambiar(e.target.value || null)} />
    </div>
  );
}
const RotuloPrivado = ({ texto }: { texto: string }) => (
  <>
    {texto}{' '}
    <span className="etiqueta-de-dato plan-y-fases__privado">
      <Icono nombre="candado" tamano={15} />
      {T.soloVos}
    </span>
  </>
);

// ─── «Configurar plan» ────────────────────────────────────────────────────────────────────────────────────────────
export interface PlanConfigurado {
  readonly planificacion: PlanificacionDelPlan;
  readonly notacion: NotacionDelEsfuerzo;
  /** Pasar los ejercicios con otra intensidad a la del plan. */
  readonly pasarLosDemas: boolean;
}

export function CuadroConfigurarPlan({
  abierto,
  sobretitulo,
  planificacion,
  notacion,
  semanasDeLasFases,
  conOtraIntensidad,
  onGuardar,
  onCerrar,
}: {
  abierto: boolean;
  sobretitulo: string | null;
  planificacion: PlanificacionDelPlan;
  notacion: NotacionDelEsfuerzo;
  /** Cuántas semanas suman las fases que las tienen. */
  semanasDeLasFases: number;
  /** Cuántos ejercicios del plan tienen un criterio distinto del de esta intensidad. */
  conOtraIntensidad: (i: IntensidadElegida) => number;
  onGuardar: (c: PlanConfigurado) => void;
  onCerrar: () => void;
}) {
  const id = useId();
  const [p, setP] = useState(planificacion);
  const [intensidad, setIntensidad] = useState<IntensidadElegida>(intensidadElegida(planificacion, notacion));
  const [semanasEscritas, setSemanasEscritas] = useState<string | null>(null);
  const [pasar, setPasar] = useState(false);
  // Cada vez que se abre, empieza con lo del plan.
  useEffect(() => {
    if (!abierto) return;
    setP(planificacion);
    setIntensidad(intensidadElegida(planificacion, notacion));
    setSemanasEscritas(null);
    setPasar(false);
    // Solo al abrir: mientras está abierto, lo que se escribe es el borrador del cuadro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);
  const intensidadDeAntes = intensidadElegida(planificacion, notacion);
  const cambio = JSON.stringify(p) !== JSON.stringify(planificacion) || intensidad !== intensidadDeAntes || semanasEscritas !== null;
  const fin = p.startDate && p.weeks ? finDelPlan(p.startDate, p.weeks) : '';
  const otros = intensidad !== intensidadDeAntes && !((intensidad === 'RIR' || intensidad === 'RPE') && (intensidadDeAntes === 'RIR' || intensidadDeAntes === 'RPE')) ? conOtraIntensidad(intensidad) : 0;
  const teclasDeLaIntensidad = (e: KeyboardEvent<HTMLButtonElement>, actual: IntensidadElegida) => {
    const n = INTENSIDADES.indexOf(actual);
    const otra = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? INTENSIDADES[(n + 1) % 4] : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? INTENSIDADES[(n + 3) % 4] : null;
    if (!otra) return;
    e.preventDefault();
    setIntensidad(otra);
    document.getElementById(`${id}-intensidad-${otra}`)?.focus();
  };
  return (
    <CuadroEnfocado
      abierto={abierto}
      forma="dialogo"
      ancho
      className="cuadro-del-plan"
      titulo={T.configurar}
      sobretitulo={sobretitulo}
      conCambios={cambio}
      ayuda={{ nombre: AYUDAS_DEL_EDITOR.plan.nombre, contenido: <ContenidoDeLaAyuda ayuda={AYUDAS_DEL_EDITOR.plan} /> }}
      principal={{
        texto: T.guardarPlan,
        alTocar: () => {
          const g = guardadoDeLaIntensidad(intensidad, notacion);
          onGuardar({ planificacion: { ...p, intensity: g.intensity }, notacion: g.notacion, pasarLosDemas: pasar && otros > 0 });
        },
      }}
      onCerrar={onCerrar}
    >
      <div className="cuadro-del-plan__cuerpo" data-configurar-plan-abierto>
        <div className="datos-del-plan__fechas">
          <div className="datos-del-plan__fecha" data-inicio-del-plan>
            <CampoDeFecha id={`${id}-inicio`} etiqueta={T.inicio} value={p.startDate ?? ''} onChange={(f) => setP(conInicio(p, f))} vaciable />
          </div>
          <div className="campo datos-del-plan__semanas">
            <label htmlFor={`${id}-semanas`}>{T.duracion}</label>
            <span className="datos-del-plan__con-unidad">
              <input
                id={`${id}-semanas`}
                inputMode="numeric"
                value={semanasEscritas ?? (p.weeks === null ? '' : String(p.weeks))}
                aria-describedby={`${id}-unidad ${id}-nota`}
                onChange={(e) => {
                  setSemanasEscritas(e.target.value);
                  setP(conSemanasDelPlan(p, leerSemanas(e.target.value, 104)));
                }}
                onBlur={() => setSemanasEscritas(null)}
                data-semanas-del-plan
              />
              <span id={`${id}-unidad`} className="nota">
                {T.semanas}
              </span>
            </span>
          </div>
          {p.startDate ? (
            <div className="datos-del-plan__fecha" data-fin-del-plan>
              <CampoDeFecha id={`${id}-fin`} etiqueta={T.fin} value={fin} min={p.startDate} onChange={(f) => f && setP(conFin(p, f))} />
            </div>
          ) : null}
        </div>
        {/* RP-19: el renglón de la nota está siempre. */}
        <p id={`${id}-nota`} className="nota datos-del-plan__nota" aria-live="polite" data-nota-del-plan>
          {!p.startDate ? T.sinInicio : p.weeks && semanasDeLasFases > 0 ? T.lasFasesSuman(semanasDeLasFases, p.weeks) : ' '}
        </p>
        <fieldset className="intensidad-del-plan" data-intensidad-del-plan={intensidad}>
          <legend>{T.intensidad}</legend>
          <div className="control-segmentado" role="radiogroup" aria-label={T.intensidad}>
            {INTENSIDADES.map((i) => (
              <button
                key={i}
                id={`${id}-intensidad-${i}`}
                type="button"
                role="radio"
                aria-checked={i === intensidad}
                tabIndex={i === intensidad ? 0 : -1}
                className="control-segmentado__opcion"
                onClick={() => setIntensidad(i)}
                onKeyDown={(e) => teclasDeLaIntensidad(e, i)}
                data-intensidad={i}
              >
                {T.nombreDeLaIntensidad[i]}
              </button>
            ))}
          </div>
          <p className="nota intensidad-del-plan__que-es">
            {T.queEsLaIntensidad[intensidad]} {T.heredan}
          </p>
          {/* RP-19: el renglón de los que ya tienen otra está siempre, vacío o con su casilla. */}
          <div className="intensidad-del-plan__otros" data-con-otra-intensidad={otros}>
            {otros > 0 ? (
              <>
                <p className="nota">{T.conOtra(otros, T.nombreDeLaIntensidad[intensidad])}</p>
                <label className="intensidad-del-plan__pasar">
                  <input type="checkbox" checked={pasar} onChange={(e) => setPasar(e.target.checked)} data-pasar-los-demas />
                  {T.pasarlos(otros, T.nombreDeLaIntensidad[intensidad])}
                </label>
              </>
            ) : null}
          </div>
          {intensidad === 'RPE' ? <p className="nota">{COPY_NOTACION_DEL_ESFUERZO.queEs}</p> : null}
        </fieldset>
        <div className="datos-del-plan__textos">
          <Texto id={`${id}-objetivo`} rotulo={T.objetivo} valor={p.goal} onCambiar={(v) => setP(conObjetivo(p, v))} maximo={1000} placeholder={T.objetivoAyuda} />
          <Texto id={`${id}-anotaciones`} rotulo={<RotuloPrivado texto={T.anotaciones} />} valor={p.privateNotes?.plan} onCambiar={(v) => setP(conAnotacionesDelPlan(p, v))} maximo={4000} privado placeholder={T.anotacionesAyuda} />
        </div>
      </div>
    </CuadroEnfocado>
  );
}

// ─── «Editar fase» ────────────────────────────────────────────────────────────────────────────────────────────────
export interface FaseEditada {
  readonly nombre: string;
  readonly semanas: number | null;
  readonly objetivo: string | null;
  readonly anotaciones: string | null;
}

export function CuadroEditarFase({
  abierto,
  sobretitulo,
  fase,
  enLaPlantilla,
  fechas,
  sePuedeQuitar,
  onGuardar,
  onDuplicar,
  onQuitar,
  onCerrar,
}: {
  abierto: boolean;
  sobretitulo: string | null;
  fase: FaseEditada;
  /** Una plantilla no tiene semanas ni anotaciones: solo el nombre y el propósito. */
  enLaPlantilla: boolean;
  /** «Semanas 3–10 · 14 dic – 7 feb», o `null` sin fechas. */
  fechas: string | null;
  sePuedeQuitar: boolean;
  onGuardar: (f: FaseEditada) => void;
  onDuplicar: () => void;
  onQuitar: () => void;
  onCerrar: () => void;
}) {
  const id = useId();
  const [f, setF] = useState(fase);
  const [semanasEscritas, setSemanasEscritas] = useState<string>(fase.semanas === null ? '' : String(fase.semanas));
  const [quitando, setQuitando] = useState(false);
  const [falta, setFalta] = useState<string | null>(null);
  const nombre = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!abierto) return;
    setF(fase);
    setSemanasEscritas(fase.semanas === null ? '' : String(fase.semanas));
    setQuitando(false);
    setFalta(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);
  const semanasMal = semanasEscritas.trim() !== '' && leerSemanas(semanasEscritas, 52) === null;
  const cambio = JSON.stringify(f) !== JSON.stringify(fase) || semanasEscritas !== (fase.semanas === null ? '' : String(fase.semanas));
  return (
    <CuadroEnfocado
      abierto={abierto}
      forma="dialogo"
      className="cuadro-del-plan"
      titulo={T.editarFase}
      sobretitulo={sobretitulo}
      conCambios={cambio}
      focoInicial={nombre}
      focoEnCancelar={quitando}
      ayuda={{ nombre: AYUDAS_DEL_EDITOR.editarFase.nombre, contenido: <ContenidoDeLaAyuda ayuda={AYUDAS_DEL_EDITOR.editarFase} /> }}
      pie={
        quitando ? (
          <div className="cuadro-del-plan__quitar" role="alertdialog" aria-labelledby={`${id}-quitar`} data-confirmar-quitar-fase>
            <p id={`${id}-quitar`}>{T.quitarPregunta(fase.nombre)}</p>
            <div className="acciones">
              <button type="button" className="boton boton--secundario boton--compacto" autoFocus onClick={() => setQuitando(false)}>
                {T.quitarNo}
              </button>
              <button type="button" className="boton boton--quieto boton--compacto" data-quitar-fase-si onClick={onQuitar}>
                {T.quitarSi}
              </button>
            </div>
          </div>
        ) : (
          <div className="cuadro-del-plan__secundarias">
            <button type="button" className="boton boton--quieto boton--compacto" data-duplicar-fase onClick={onDuplicar}>
              <Icono nombre="duplicar" tamano={18} />
              {T.duplicar}
            </button>
            <button type="button" className="boton boton--quieto boton--compacto" data-quitar-fase aria-disabled={sePuedeQuitar ? undefined : true} aria-describedby={sePuedeQuitar ? undefined : `${id}-la-unica`} onClick={() => sePuedeQuitar && setQuitando(true)}>
              <Icono nombre="cerrar" tamano={18} />
              {T.quitar}
            </button>
            {sePuedeQuitar ? null : (
              <span id={`${id}-la-unica`} className="nota">
                {T.laUnica}
              </span>
            )}
          </div>
        )
      }
      principal={{
        texto: T.guardarFase,
        apagado: f.nombre.trim() === '' ? T.faltaElNombre : semanasMal ? T.semanasNoSeEntienden : null,
        alTocarApagado: () => {
          setFalta(f.nombre.trim() === '' ? T.faltaElNombre : T.semanasNoSeEntienden);
          (f.nombre.trim() === '' ? nombre.current : document.getElementById(`${id}-semanas`))?.focus();
        },
        alTocar: () => onGuardar({ ...f, nombre: f.nombre.trim(), semanas: enLaPlantilla ? null : leerSemanas(semanasEscritas, 52) }),
      }}
      onCerrar={onCerrar}
    >
      <div className="cuadro-del-plan__cuerpo" data-editar-fase-abierto>
        <div className="datos-de-la-fase__renglon">
          <div className="campo cuadro-del-plan__nombre">
            <label htmlFor={`${id}-nombre`}>{T.nombreDeLaFase}</label>
            <input ref={nombre} id={`${id}-nombre`} value={f.nombre} maxLength={120} onChange={(e) => setF({ ...f, nombre: e.target.value })} data-nombre-de-la-fase />
          </div>
          {enLaPlantilla ? null : (
            <div className="campo datos-del-plan__semanas">
              <label htmlFor={`${id}-semanas`}>{T.semanasDeLaFase}</label>
              <input id={`${id}-semanas`} inputMode="numeric" value={semanasEscritas} aria-describedby={`${id}-ajuste`} aria-invalid={semanasMal || undefined} onChange={(e) => setSemanasEscritas(e.target.value)} data-semanas-de-la-fase />
            </div>
          )}
        </div>
        {enLaPlantilla ? null : (
          // RP-19: la nota del ajuste (o lo que no se entiende) en su renglón, siempre.
          <p id={`${id}-ajuste`} className={semanasMal || falta ? 'campo__error cuadro-del-plan__nota' : 'nota cuadro-del-plan__nota'} data-nota-de-la-fase>
            {semanasMal ? T.semanasNoSeEntienden : falta ?? (fechas ? `${fechas}. ${T.alCambiarLaDuracion}` : T.alCambiarLaDuracion)}
          </p>
        )}
        <div className="datos-del-plan__textos">
          <Texto id={`${id}-objetivo`} rotulo={enLaPlantilla ? T.proposito : T.objetivoDeLaFase} valor={f.objetivo} onCambiar={(v) => setF({ ...f, objetivo: v })} maximo={1000} placeholder={T.objetivoDeLaFaseAyuda} />
          {enLaPlantilla ? null : <Texto id={`${id}-anotaciones`} rotulo={<RotuloPrivado texto={T.anotaciones} />} valor={f.anotaciones} onCambiar={(v) => setF({ ...f, anotaciones: v })} maximo={2000} privado />}
        </div>
      </div>
    </CuadroEnfocado>
  );
}

// ─── «Días de la semana» ──────────────────────────────────────────────────────────────────────────────────────────
export interface SesionDeLaMatriz {
  readonly id: string | null;
  readonly letra: string;
  readonly nombre: string;
  readonly dias: readonly DiaDeLaSemana[];
}

/** Mueve el foco por la matriz con las flechas (fila y columna), Inicio y Fin. */
function moverEnLaMatriz(e: KeyboardEvent<HTMLElement>, prefijo: string, fila: number, columna: number, filas: number) {
  const destino =
    e.key === 'ArrowRight'
      ? [fila, Math.min(7, columna + 1)]
      : e.key === 'ArrowLeft'
        ? [fila, Math.max(0, columna - 1)]
        : e.key === 'ArrowDown'
          ? [Math.min(filas - 1, fila + 1), columna]
          : e.key === 'ArrowUp'
            ? [Math.max(0, fila - 1), columna]
            : e.key === 'Home'
              ? [fila, 1]
              : e.key === 'End'
                ? [fila, 7]
                : null;
  if (!destino) return;
  // En el campo del nombre, ← y → mueven el cursor del texto; solo ↑ y ↓ cambian de fila, y → al final pasa al lunes.
  const campo = e.currentTarget instanceof HTMLInputElement ? e.currentTarget : null;
  if (campo && (e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End' || (e.key === 'ArrowRight' && (campo.selectionStart ?? 0) < campo.value.length))) return;
  e.preventDefault();
  document.getElementById(`${prefijo}-${destino[0]}-${destino[1]}`)?.focus();
}

export function CuadroDiasDeLaSemana({
  abierto,
  sobretitulo,
  fase,
  sesiones,
  onGuardar,
  onCerrar,
  pie,
}: {
  abierto: boolean;
  sobretitulo: string | null;
  /** «Base · Semanas 1–4», de qué fase son los días. */
  fase: string;
  sesiones: readonly SesionDeLaMatriz[];
  onGuardar: (s: readonly SesionDeLaMatriz[]) => void;
  onCerrar: () => void;
  /** Lo que se avisa de los días (dos sesiones el mismo día, los días de un preset), debajo de la matriz. */
  pie?: ReactNode;
}) {
  const id = useId();
  const [filas, setFilas] = useState(sesiones);
  useEffect(() => {
    if (abierto) setFilas(sesiones);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);
  const cambio = JSON.stringify(filas) !== JSON.stringify(sesiones);
  const sinNombre = filas.some((s) => s.nombre.trim() === '');
  const alternar = (n: number, d: DiaDeLaSemana) =>
    setFilas((x) => x.map((s, m) => (m !== n ? s : { ...s, dias: s.dias.includes(d) ? s.dias.filter((y) => y !== d) : DIAS_DE_LA_SEMANA.filter((y) => y === d || s.dias.includes(y)) })));
  return (
    <CuadroEnfocado
      abierto={abierto}
      forma="dialogo"
      ancho
      className="cuadro-del-plan"
      titulo={T.dias}
      sobretitulo={sobretitulo}
      conCambios={cambio}
      ayuda={{ nombre: AYUDAS_DEL_EDITOR.semanaTipo.nombre, contenido: <ContenidoDeLaAyuda ayuda={AYUDAS_DEL_EDITOR.semanaTipo} /> }}
      principal={filas.length > 0 ? { texto: T.guardarDias, apagado: sinNombre ? T.sinNombre : null, alTocar: () => onGuardar(filas.map((s) => ({ ...s, nombre: s.nombre.trim() }))) } : null}
      onCerrar={onCerrar}
    >
      <div className="cuadro-del-plan__cuerpo" data-dias-de-la-fase data-recorrido="editor-entrenamiento-dias">
        <p className="nota">{fase}</p>
        {filas.length === 0 ? (
          <p className="nota">{T.sinSesiones}</p>
        ) : (
          <table className="dias-de-la-fase__tabla matriz-de-dias">
            <caption className="visualmente-oculto">{`${T.dias}: ${fase}`}</caption>
            <thead>
              <tr>
                <th scope="col" className="matriz-de-dias__sesion">
                  Sesión
                </th>
                {DIAS_DE_LA_SEMANA.map((d) => (
                  <th key={d} scope="col" abbr={DIA_LARGO[d]}>
                    {DIA_CORTO[d]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((s, n) => (
                <tr key={s.id ?? `sin-id-${n}`} data-dias-de-la-sesion={n + 1}>
                  <th scope="row" className="dias-de-la-fase__sesion">
                    <span className="dias-de-la-fase__letra" aria-hidden="true">
                      {s.letra}
                    </span>
                    <label htmlFor={`${id}-${n}-0`} className="visualmente-oculto">
                      {T.nombreDeLaSesion(s.letra)}
                    </label>
                    <input
                      id={`${id}-${n}-0`}
                      className="matriz-de-dias__nombre"
                      value={s.nombre}
                      maxLength={120}
                      aria-invalid={s.nombre.trim() === '' || undefined}
                      onChange={(e) => setFilas((x) => x.map((y, m) => (m === n ? { ...y, nombre: e.target.value } : y)))}
                      onKeyDown={(e) => moverEnLaMatriz(e, id, n, 0, filas.length)}
                      data-nombre-de-la-sesion={n + 1}
                    />
                  </th>
                  {DIAS_DE_LA_SEMANA.map((d, c) => (
                    <td key={d}>
                      <button
                        id={`${id}-${n}-${c + 1}`}
                        type="button"
                        className="dias-de-la-fase__dia"
                        aria-pressed={s.dias.includes(d)}
                        aria-label={T.diaDeLaSesion(d, s.nombre || s.letra)}
                        disabled={!s.id}
                        data-dia={d}
                        onClick={() => alternar(n, d)}
                        onKeyDown={(e) => moverEnLaMatriz(e, id, n, c + 1, filas.length)}
                      >
                        <span aria-hidden="true">{s.dias.includes(d) ? s.letra : ''}</span>
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* RP-19: el aviso del nombre vacío, en su renglón. */}
        <p className={sinNombre ? 'campo__error cuadro-del-plan__nota' : 'nota cuadro-del-plan__nota'} role={sinNombre ? 'alert' : undefined}>
          {sinNombre ? T.sinNombre : ' '}
        </p>
        {pie}
      </div>
    </CuadroEnfocado>
  );
}
