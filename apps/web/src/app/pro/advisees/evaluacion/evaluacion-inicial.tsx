'use client';

/**
 * WP-EVALUACION-INICIAL-2 (DL-189) · las piezas de la evaluación inicial como pantallazo del caso. Las reglas son del
 * dominio (`evaluacion-inicial.ts`) y lo que se arma con las lecturas, de `evaluacion-inicial.ts` del website; acá, las
 * lecturas y el dibujo:
 * - `useLoQueSabeDeLaPersona`: lo que respondió a este profesional en el área (API-CTX-01, con lo corregido de API-FRI-03),
 *   lo pedido sin responder (API-FRM-04, con lo cargado de API-FRI-03 y su versión de API-FRI-01), lo que comparte de sus
 *   hábitos (API-HBT-05) y, en Nutrición, la toma de referencia (API-OBC-01, la misma del calculador). Ninguna escribe.
 * - `FechaDeLaEvaluacion` (RP-11): «Hoy, 12:12 · cambiar».
 * - `LoQueConto`, `LoMedido` y `LoQueNecesitaElCalculo` (RP-12), con las correcciones de la persona (RP-16).
 * - `CompletarAhora` (RP-14): crea por detrás las solicitudes que correspondan y abre «Cargar con la persona» ahí mismo.
 * Nada de la persona se guarda en el navegador.
 */
import {
  ALCANCE_DE_LA_EVALUACION,
  CLAVE_DEL_FORMULARIO_DE_HABITOS,
  COPY_EVALUACION_INICIAL as EI,
  COPY_EVALUACION_Y_FORMULARIOS as CEV,
  COPY_HABITOS,
  correccionesDeLaPersona,
  ETIQUETA_DE_ALCANCE,
  numero,
  SEXOS_DE_LA_EVALUACION,
  valorEscrito,
  type AreaDeLaEvaluacion,
  type DatoDeLaEvaluacionInicial,
  type DatoParaElCalculo,
  type HabitosParaElProfesionalResponse,
  type Plantilla,
  type TomaDeReferencia,
} from '@be/domain';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Enlace } from '../../../../components/enlace';
import { Aviso, Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api, nuevaClaveDeIdempotencia, type Resultado } from '../../../../lib/api';
import { dia, diaCivil, diaSinElAnioEnCurso, diaYMesCivil, horaDelDia } from '../../../../lib/formato';
import { esIncierto, mensajeDeFallo } from '../../../../lib/intento';
import { useSesion } from '../../../../lib/sesion';
import { usePersonaDelArea } from '../marco-del-area';
import { CargarLaSolicitud } from '../forms/cargar';
import { propositoAlElegir } from '../forms/formulario-de-inicio';
import { RespuestasDelFormulario } from './formularios-de-la-evaluacion';
import {
  aCampoLocal,
  correccionEnPalabras,
  origenEnPalabras,
  pedidoParaCompletar,
  pedidosParaCompletar,
  renglonesDeRespuestas,
  renglonesDelRespondido,
  resumenDelFormulario,
  type FormularioRespondido,
  type LosHabitosCompartidos,
  type RenglonEnPalabras,
  type SolicitudPendiente,
} from './datos-de-la-evaluacion';

export type Lectura<T> = { readonly estado: 'leyendo' } | { readonly estado: 'listo'; readonly datos: T } | { readonly estado: 'error' };

export interface LoQueSabeDeLaPersona {
  readonly respondidos: readonly FormularioRespondido[];
  readonly pendientes: readonly SolicitudPendiente[];
  readonly compartidos: LosHabitosCompartidos | null;
}

export interface LoMedidoLeido {
  /** Si la persona le habilitó Antropometría a este profesional (sin eso, ninguna toma). */
  readonly habilitada: boolean;
  readonly toma: TomaDeReferencia | null;
}

interface Comun {
  readonly area: AreaDeLaEvaluacion;
  readonly token: string;
  readonly asesoradoId: string;
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
}

const es404 = (r: Resultado<unknown>) => !r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND';

/** Un día de la API en la pantalla, sea un instante o un día civil (`AAAA-MM-DD`): «10 nov». */
export const diaCorto = (isoODia: string): string => (/^\d{4}-\d{2}-\d{2}$/.test(isoODia) ? diaYMesCivil(isoODia) : diaSinElAnioEnCurso(isoODia));
/** El mismo día con el año, para lo que queda registrado en la evaluación. */
export const diaConAnio = (isoODia: string): string => (/^\d{4}-\d{2}-\d{2}$/.test(isoODia) ? diaCivil(isoODia) : dia(isoODia));

/** Las lecturas de la evaluación inicial (ninguna escribe). `releer` vuelve a leer todo, por ejemplo al volver de cargar. */
export function useLoQueSabeDeLaPersona({ area, token, asesoradoId, sesionPerdida }: Comun): { conto: Lectura<LoQueSabeDeLaPersona>; medido: Lectura<LoMedidoLeido>; releer: () => void } {
  const alcance = ALCANCE_DE_LA_EVALUACION[area];
  const [conto, setConto] = useState<Lectura<LoQueSabeDeLaPersona>>({ estado: 'leyendo' });
  const [medido, setMedido] = useState<Lectura<LoMedidoLeido>>({ estado: 'leyendo' });
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    let vigente = true;
    setConto({ estado: 'leyendo' });
    void (async () => {
      const [ctx, pedidas, habitos] = await Promise.all([
        api.respuestasDelContexto(token, asesoradoId),
        api.listarSolicitudesDeFormulario(token, asesoradoId, { status: 'PENDING', limit: '20' }),
        api.habitosDeLaPersona(token, asesoradoId),
      ]);
      if (!vigente || sesionPerdida(ctx) || sesionPerdida(pedidas) || sesionPerdida(habitos)) return;
      // Un 404 es «ninguna»: hoy no hay un área permitida, o no hay nada que leer.
      const forms = ctx.ok ? ctx.datos.data.forms : es404(ctx) ? [] : null;
      const solicitudes = pedidas.ok ? pedidas.datos.data : es404(pedidas) ? [] : null;
      if (forms === null || solicitudes === null) return setConto({ estado: 'error' });
      const delArea = forms.filter((f) => f.scope === alcance).sort((a, b) => b.answeredAt.localeCompare(a.answeredAt));
      // RP-16: lo que la persona corrigió de lo que cargó este profesional, de la transcripción (API-FRI-03).
      const respondidos = await Promise.all(
        delArea.map(async (form): Promise<FormularioRespondido> => {
          if (!form.transcribedConfirmedAt) return { form, corregidos: [] };
          const v = await api.consultarVistaDeSolicitud(token, form.formRequestId);
          return { form, corregidos: v.ok ? (v.datos.data.response?.transcription?.correctedFieldCodes ?? []) : [] };
        }),
      );
      // Lo pedido sin responder, con lo cargado que espera confirmación y su versión, para decirlo en palabras.
      const pendientes = await Promise.all(
        solicitudes
          .filter((s) => s.scope === alcance && s.status === 'PENDING')
          .map(async (solicitud): Promise<SolicitudPendiente> => {
            const v = await api.consultarVistaDeSolicitud(token, solicitud.formRequestId);
            const propuesta = v.ok && v.datos.data.proposal ? { answers: v.datos.data.proposal.answers, loadedAt: v.datos.data.proposal.loadedAt } : null;
            const version = propuesta ? await api.consultarDefinicionDePlantilla(token, solicitud.templateId, solicitud.templateVersionId) : null;
            return { solicitud, propuesta, version: version?.ok ? version.datos.data : null };
          }),
      );
      if (!vigente) return;
      setConto({ estado: 'listo', datos: { respondidos, pendientes, compartidos: habitos.ok ? habitos.datos.data : null } });
    })();
    return () => {
      vigente = false;
    };
  }, [token, asesoradoId, alcance, sesionPerdida, vuelta]);
  useEffect(() => {
    // La toma de referencia es la del calculador (API-OBC-01): solo en Nutrición.
    if (area !== 'nutrition') return setMedido({ estado: 'listo', datos: { habilitada: false, toma: null } });
    let vigente = true;
    setMedido({ estado: 'leyendo' });
    void api.tomasDeReferencia(token, asesoradoId).then((r) => {
      if (!vigente || sesionPerdida(r)) return;
      setMedido(r.ok ? { estado: 'listo', datos: { habilitada: r.datos.data.anthropometryEnabled, toma: r.datos.data.anthropometryEnabled ? (r.datos.data.measurements[0] ?? null) : null } } : { estado: 'error' });
    });
    return () => {
      vigente = false;
    };
  }, [area, token, asesoradoId, sesionPerdida, vuelta]);
  return { conto, medido, releer: useCallback(() => setVuelta((n) => n + 1), []) };
}

// ─── RP-11 · la fecha ───────────────────────────────────────────────────────────────────────────

/** «Hoy, 12:12 · cambiar». Sin cambiarla (`valor` en `null`), la evaluación lleva el momento en que se registra (EI-D14). */
export function FechaDeLaEvaluacion({ id, valor, onCambiar, error }: { id: string; valor: string | null; onCambiar: (v: string | null) => void; error: string | null }) {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setAhora(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  if (valor === null) {
    return (
      <p className="fecha-de-la-evaluacion" data-fecha-automatica>
        <Icono nombre="reloj" tamano={15} />
        <span>{EI.hoy(horaDelDia(ahora))}</span>
        <span aria-hidden="true">·</span>
        <button type="button" className="boton boton--enlace" onClick={() => onCambiar(aCampoLocal(new Date()))} data-cambiar-la-fecha>
          {EI.cambiarLaFecha}
          <span className="visualmente-oculto"> la fecha y la hora de la evaluación</span>
        </button>
      </p>
    );
  }
  return (
    <div className="fecha-de-la-evaluacion fecha-de-la-evaluacion--abierta">
      <Campo id={id} etiqueta={EI.etiquetaDeLaFecha} ayuda={EI.ayudaDeLaFecha} type="datetime-local" value={valor} max={aCampoLocal(ahora)} onChange={(e) => onCambiar(e.target.value)} error={error} />
      <button type="button" className="boton boton--enlace" onClick={() => onCambiar(null)} data-usar-la-de-ahora>
        {EI.usarLaDeAhora}
      </button>
    </div>
  );
}

// ─── RP-12 · «Lo que contó {nombre}» ────────────────────────────────────────────────────────────

/** Unos renglones en palabras, en una lista de pregunta y respuesta. */
function Renglones({ renglones }: { renglones: readonly RenglonEnPalabras[] }) {
  if (renglones.length === 0) return null;
  return (
    <dl className="lo-que-conto-en-la-evaluacion__respuestas">
      {renglones.map((r) => (
        <div key={r.fieldCode}>
          <dt>{r.label}</dt>
          <dd>{r.text}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Un formulario respondido: su fecha y procedencia, lo que la persona corrigió (RP-16), lo crítico y «Ver todo». */
function Respondido({ r, nombre }: { r: FormularioRespondido; nombre: string }) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const renglones = renglonesDelRespondido(r.form);
  const correcciones = correccionesDeLaPersona({ corregidos: r.corregidos, respuestas: renglones });
  const cuando = r.form.transcribedConfirmedAt ? EI.confirmadoEl(nombre, diaCorto(r.form.transcribedConfirmedAt)) : r.form.rectified ? CEV.corregido(diaCorto(r.form.answeredAt)) : CEV.respondido(diaCorto(r.form.answeredAt));
  return (
    <li className="lo-que-conto-en-la-evaluacion__formulario" data-formulario-respondido={r.form.formResponseId}>
      <h5>{r.form.templateName}</h5>
      <p className="nota">{cuando}</p>
      {correcciones.length > 0 ? (
        <ul className="lo-que-conto-en-la-evaluacion__correcciones" data-correcciones>
          {correcciones.map((c) => (
            <li key={c.fieldCode}>
              <Icono nombre="corregido" tamano={15} />
              {correccionEnPalabras(c, nombre)}
            </li>
          ))}
        </ul>
      ) : null}
      <Renglones renglones={resumenDelFormulario(r.form.templateKey, renglones)} />
      <button type="button" className="boton boton--enlace" aria-expanded={abierto} aria-controls={`${id}-todo`} onClick={() => setAbierto((x) => !x)}>
        {abierto ? EI.ocultar : EI.verTodo}
        <span className="visualmente-oculto"> · {r.form.templateName}</span>
      </button>
      <div id={`${id}-todo`} hidden={!abierto}>
        {abierto ? <RespuestasDelFormulario form={r.form} /> : null}
      </div>
    </li>
  );
}

export function LoQueConto({
  nombre,
  lectura,
  onReleer,
  onCompletar,
  pedirHref,
  deshabilitado,
}: {
  nombre: string;
  lectura: Lectura<LoQueSabeDeLaPersona>;
  onReleer: () => void;
  /** RP-14: abrir «Cargar con la persona» sobre estas solicitudes pendientes, o (con `null`) crear las que correspondan. */
  onCompletar: (pendientes: readonly string[] | null) => void;
  /** «Enviárselo»: «Pedir información», como hoy. */
  pedirHref: string;
  deshabilitado: boolean;
}) {
  return (
    <section className="bloque-de-la-evaluacion" aria-labelledby="bloque-lo-que-conto" data-lo-que-conto>
      <h4 id="bloque-lo-que-conto">
        <Icono nombre="reportado" tamano={20} />
        {EI.loQueConto(nombre)}
      </h4>
      {lectura.estado === 'leyendo' ? <p className="nota">{EI.leyendo}</p> : null}
      {lectura.estado === 'error' ? (
        <p className="nota">
          {EI.noSePudoLeer}{' '}
          <button type="button" className="boton boton--enlace" onClick={onReleer}>
            {EI.volverALeer}
          </button>
        </p>
      ) : null}
      {lectura.estado === 'listo' ? <LoQueContoListo nombre={nombre} datos={lectura.datos} onCompletar={onCompletar} pedirHref={pedirHref} deshabilitado={deshabilitado} /> : null}
    </section>
  );
}

function LoQueContoListo({ nombre, datos, onCompletar, pedirHref, deshabilitado }: { nombre: string; datos: LoQueSabeDeLaPersona; onCompletar: (pendientes: readonly string[] | null) => void; pedirHref: string; deshabilitado: boolean }) {
  const { respondidos, pendientes, compartidos } = datos;
  const sinNada = respondidos.length === 0 && pendientes.length === 0;
  // Las pendientes sin nada cargado se completan juntas, sin crear otras (EI-D09).
  const sinCargar = pendientes.filter((p) => !p.propuesta).map((p) => p.solicitud.formRequestId);
  return (
    <>
      {respondidos.length > 0 ? (
        <>
          <ul className="lo-que-conto-en-la-evaluacion__lista">
            {respondidos.map((r) => (
              <Respondido key={r.form.formResponseId} r={r} nombre={nombre} />
            ))}
          </ul>
          <p className="nota">{EI.seVinculan}</p>
        </>
      ) : null}
      {pendientes.length > 0 ? (
        <ul className="lo-que-conto-en-la-evaluacion__lista" data-pendientes>
          {pendientes.map((p) => (
            <li key={p.solicitud.formRequestId} className="lo-que-conto-en-la-evaluacion__formulario" data-solicitud-pendiente={p.solicitud.formRequestId}>
              <h5>{p.solicitud.templateName}</h5>
              {p.propuesta ? (
                <>
                  <p className="nota">
                    <Icono nombre="sin-confirmar" tamano={15} /> {EI.cargadoSinConfirmar(diaCorto(p.propuesta.loadedAt), nombre)}
                  </p>
                  {p.version ? <Renglones renglones={resumenDelFormulario(p.version.key, renglonesDeRespuestas(p.version.sections, p.propuesta.answers))} /> : null}
                  <button type="button" className="boton boton--secundario boton--compacto" onClick={() => onCompletar([p.solicitud.formRequestId])} disabled={deshabilitado} data-seguir-cargando>
                    {EI.seguirCargando}
                  </button>
                </>
              ) : (
                <p className="nota">{EI.seLoPediste(diaCorto(p.solicitud.createdAt))}</p>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {sinCargar.length > 0 ? (
        <div className="acciones">
          <button type="button" className="boton boton--primario" onClick={() => onCompletar(sinCargar)} disabled={deshabilitado} data-completar-ahora>
            <Icono nombre="texto" tamano={18} />
            {EI.completarAhora(nombre)}
          </button>
        </div>
      ) : null}
      {sinNada ? (
        <>
          <p className="nota">{EI.sinFormularios(nombre)}</p>
          <div className="acciones">
            <button type="button" className="boton boton--primario" onClick={() => onCompletar(null)} disabled={deshabilitado} data-completar-ahora>
              <Icono nombre="texto" tamano={18} />
              {EI.completarAhora(nombre)}
            </button>
            <Enlace className="boton boton--secundario" href={pedirHref}>
              <Icono nombre="solicitar" tamano={18} />
              {EI.enviarselo}
            </Enlace>
          </div>
        </>
      ) : null}
      {compartidos?.current ? (
        <div className="lo-que-conto-en-la-evaluacion__compartidos" data-habitos-compartidos>
          <h5>{COPY_HABITOS.web.titulo}</h5>
          <p className="nota">{EI.compartidos(diaCorto(compartidos.current.recordedAt))}</p>
          <Renglones renglones={renglonesDeRespuestas([compartidos.section], compartidos.current.answers)} />
          <p className="nota">{EI.noSeVinculanLosCompartidos}</p>
        </div>
      ) : null}
    </>
  );
}

// ─── RP-12 · «Lo medido» ────────────────────────────────────────────────────────────────────────

export function LoMedido({ lectura, asesoradoId, onReleer }: { lectura: Lectura<LoMedidoLeido>; asesoradoId: string; onReleer: () => void }) {
  const toma = lectura.estado === 'listo' ? lectura.datos.toma : null;
  const partes = toma
    ? [
        toma.weightKg !== null ? `${EI.pesoTallaEdad.peso} ${numero(toma.weightKg, 2)} kg` : null,
        toma.heightCm !== null ? `${EI.pesoTallaEdad.talla} ${numero(toma.heightCm, 1)} cm` : null,
        toma.ageYears !== null ? `${EI.pesoTallaEdad.edad} ${numero(toma.ageYears, 0)} años` : null,
      ].filter((x): x is string => x !== null)
    : [];
  return (
    <section className="bloque-de-la-evaluacion" aria-labelledby="bloque-lo-medido" data-lo-medido>
      <h4 id="bloque-lo-medido">
        <Icono nombre="medido" tamano={20} />
        {EI.loMedido}
      </h4>
      {lectura.estado === 'leyendo' ? <p className="nota">{EI.leyendo}</p> : null}
      {/* Una lectura que falla se dice como falla, nunca como «sin tomas»: si no, se registra sin el peso que había. */}
      {lectura.estado === 'error' ? (
        <p className="nota" data-toma-sin-leer>
          {EI.noSePudoLeerLaToma}{' '}
          <button type="button" className="boton boton--enlace" onClick={onReleer}>
            {EI.volverALeer}
          </button>
        </p>
      ) : null}
      {lectura.estado === 'listo' && !toma ? <p className="nota" data-sin-toma>{EI.sinToma}</p> : null}
      {toma ? (
        <>
          <p className="nota">{EI.toma(diaCorto(toma.measuredOn))}</p>
          <ul className="lo-medido__datos">
            {partes.map((t) => (
              <li key={t}>{t}</li>
            ))}
            {toma.composition.map((c) => (
              <li key={c.calculationId}>
                {c.label} {numero(c.value, 1)} {c.unit}
              </li>
            ))}
          </ul>
          <Enlace className="boton boton--enlace" href={`/pro/advisees/anthropometry?id=${encodeURIComponent(asesoradoId)}&vista=evaluaciones&evaluacion=${encodeURIComponent(toma.evaluationId)}`}>
            {EI.verToma}
          </Enlace>
        </>
      ) : null}
    </section>
  );
}

// ─── RP-12 · «Lo que necesita el cálculo» ───────────────────────────────────────────────────────

/** El valor que se abre para cambiar: lo que vale hoy, como se escribe. */
function comoSeEscribe(d: DatoParaElCalculo): string {
  if (d.valor === null) return '';
  if (d.dato === 'sexo') return SEXOS_DE_LA_EVALUACION.find((s) => s.texto === d.valor)?.valor ?? '';
  return typeof d.valor === 'number' ? String(d.valor).replace('.', ',') : d.valor;
}

function DatoDelCalculo({ d, nombre, cambiado, onCambiar }: { d: DatoParaElCalculo; nombre: string; cambiado: boolean; onCambiar: (dato: DatoDeLaEvaluacionInicial, valor: string | undefined) => void }) {
  const id = useId();
  const [borrador, setBorrador] = useState<string | null>(null);
  const [problema, setProblema] = useState<string | null>(null);
  const listo = () => {
    if (borrador === null) return;
    if (borrador.trim() !== '' && valorEscrito(d.dato, borrador) === null) return setProblema(EI.valorIlegible(d.concepto));
    setProblema(null);
    // Sin cambiar nada, sigue como estaba (no pasa a «Cargado por vos»).
    if (!cambiado && borrador === comoSeEscribe(d)) onCambiar(d.dato, undefined);
    else onCambiar(d.dato, borrador);
    setBorrador(null);
  };
  return (
    <div className="dato-del-calculo" data-dato-del-calculo={d.dato} data-origen={d.origen?.tipo ?? 'SIN_INDICAR'}>
      <span className="dato-del-calculo__nombre" id={`${id}-nombre`}>
        {d.concepto}
      </span>
      {borrador === null ? (
        <>
          <span className="dato-del-calculo__valor">{d.texto ?? EI.sinIndicar}</span>
          <span className="dato-del-calculo__origen">{d.origen ? origenEnPalabras(d.origen, nombre, diaCorto) : null}</span>
          {d.alLado ? (
            <span className="dato-del-calculo__al-lado">
              {d.alLado.texto} · {origenEnPalabras(d.alLado.origen, nombre, diaCorto)}
            </span>
          ) : null}
          <button type="button" className="boton boton--enlace dato-del-calculo__cambiar" onClick={() => setBorrador(comoSeEscribe(d))} aria-describedby={`${id}-nombre`} data-cambiar-dato={d.dato}>
            {EI.cambiar}
          </button>
        </>
      ) : (
        <span className="dato-del-calculo__edicion">
          {d.dato === 'sexo' ? (
            <select id={`${id}-valor`} aria-labelledby={`${id}-nombre`} value={borrador} onChange={(e) => setBorrador(e.target.value)} autoFocus>
              <option value="">{EI.sinIndicar}</option>
              {SEXOS_DE_LA_EVALUACION.map((s) => (
                <option key={s.valor} value={s.valor}>
                  {s.texto}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={`${id}-valor`}
              aria-labelledby={`${id}-nombre`}
              aria-invalid={problema ? true : undefined}
              aria-describedby={problema ? `${id}-problema` : undefined}
              inputMode={d.dato === 'actividad' ? undefined : 'decimal'}
              value={borrador}
              maxLength={d.dato === 'actividad' ? 200 : 10}
              onChange={(e) => setBorrador(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  listo();
                }
              }}
              autoFocus
            />
          )}
          {d.unidad && d.dato !== 'sexo' && d.dato !== 'actividad' ? <span className="dato-del-calculo__unidad">{d.unidad}</span> : null}
          <button type="button" className="boton boton--secundario boton--compacto" onClick={listo} data-listo-dato={d.dato}>
            {EI.listo}
          </button>
          {problema ? (
            <span id={`${id}-problema`} className="campo__error">
              <span aria-hidden="true">⚠ </span>
              {problema}
            </span>
          ) : null}
        </span>
      )}
    </div>
  );
}

export function LoQueNecesitaElCalculo({
  datos,
  nombre,
  cambiados,
  onCambiar,
}: {
  datos: readonly DatoParaElCalculo[];
  nombre: string;
  cambiados: Readonly<Partial<Record<DatoDeLaEvaluacionInicial, string>>>;
  onCambiar: (dato: DatoDeLaEvaluacionInicial, valor: string | undefined) => void;
}) {
  return (
    <section className="bloque-de-la-evaluacion" aria-labelledby="bloque-lo-que-necesita" data-lo-que-necesita-el-calculo>
      <h4 id="bloque-lo-que-necesita">
        <Icono nombre="calculado" tamano={20} />
        {EI.loQueNecesita}
      </h4>
      <p className="nota">{EI.ayudaDelCalculo}</p>
      <div className="datos-del-calculo">
        {datos.map((d) => (
          <DatoDelCalculo key={d.dato} d={d} nombre={nombre} cambiado={cambiados[d.dato] !== undefined} onCambiar={onCambiar} />
        ))}
      </div>
    </section>
  );
}

// ─── RP-16 · lo que corrigió después de la evaluación ───────────────────────────────────────────

/**
 * RP-16 · en la evaluación registrada: lo que la persona corrigió al confirmar lo que cargó este profesional, si lo
 * confirmó después de registrarla. El antes es lo que quedó en la evaluación, cuando es un dato del cálculo (EI-D12).
 * Lee API-CTX-01 y, de cada formulario confirmado después, API-FRI-03. Sin correcciones, no se muestra nada.
 */
export function CorreccionesDespuesDeLaEvaluacion({
  area,
  token,
  asesoradoId,
  sesionPerdida,
  evaluacion,
}: Comun & {
  evaluacion: {
    readonly recordedAt: string;
    readonly assessment: { readonly entries: readonly { readonly concept: string; readonly value: string | number; readonly unit?: string | null }[] };
    readonly evidenceReferences: readonly string[];
  };
}) {
  const nombre = usePersonaDelArea() ?? EI.persona;
  const alcance = ALCANCE_DE_LA_EVALUACION[area];
  const entradas = evaluacion.assessment.entries;
  const evidencias = evaluacion.evidenceReferences;
  const desde = evaluacion.recordedAt;
  const [lineas, setLineas] = useState<readonly { readonly clave: string; readonly formulario: string; readonly texto: string }[]>([]);
  useEffect(() => {
    let vigente = true;
    void (async () => {
      const ctx = await api.respuestasDelContexto(token, asesoradoId);
      if (!vigente || sesionPerdida(ctx) || !ctx.ok) return;
      const despues = ctx.datos.data.forms.filter((f) => f.scope === alcance && f.transcribedConfirmedAt !== null && new Date(f.transcribedConfirmedAt).getTime() > new Date(desde).getTime());
      const todas: { clave: string; formulario: string; texto: string }[] = [];
      for (const form of despues) {
        const v = await api.consultarVistaDeSolicitud(token, form.formRequestId);
        if (!vigente || sesionPerdida(v)) return;
        const corregidos = v.ok ? (v.datos.data.response?.transcription?.correctedFieldCodes ?? []) : [];
        // El antes, solo si lo registrado salió de lo que se cargó con la persona en este formulario (EI-D12).
        const registrado = { entries: entradas, evidenceReferences: evidencias, formulario: form.templateName };
        for (const c of correccionesDeLaPersona({ corregidos, respuestas: renglonesDelRespondido(form), registrado })) {
          todas.push({ clave: `${form.formResponseId}-${c.fieldCode}`, formulario: form.templateName, texto: correccionEnPalabras(c, nombre) });
        }
      }
      if (vigente) setLineas(todas);
    })();
    return () => {
      vigente = false;
    };
  }, [token, asesoradoId, sesionPerdida, alcance, desde, entradas, evidencias, nombre]);
  if (lineas.length === 0) return null;
  return (
    <div className="correcciones-despues" data-correcciones-despues>
      <p className="lista__titulo">{EI.correccionesDespues(nombre)}</p>
      <ul className="lo-que-conto-en-la-evaluacion__correcciones">
        {lineas.map((l) => (
          <li key={l.clave}>
            <Icono nombre="corregido" tamano={15} />
            {l.texto} <span className="nota">· «{l.formulario}»</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── RP-14 · «Completarlo ahora con {nombre}» ───────────────────────────────────────────────────

type Preparacion =
  | { readonly tipo: 'leyendo' }
  | { readonly tipo: 'eligiendo'; readonly fijos: readonly Plantilla[]; readonly paraTildar: readonly { readonly plantilla: Plantilla; readonly motivo: string | null }[] }
  | { readonly tipo: 'creando' }
  | { readonly tipo: 'cargando'; readonly cola: readonly { readonly id: string; readonly nombre: string }[]; readonly indice: number }
  | { readonly tipo: 'falla'; readonly texto: string };

/**
 * RP-14 · «Completarlo ahora con {nombre}», ahí mismo: con `pendientes`, abre «Cargar con la persona» sobre esas (EI-D09);
 * sin ellas, crea por detrás el formulario del área y «Tus hábitos» si corresponde (EI-D08), pregunta antes por lo demás
 * que se puede tildar, y abre «Cargar con la persona» sobre cada una, en orden. Al terminar (o al volver), `onTerminar`.
 */
export function CompletarAhora({
  area,
  claveDelArea,
  nombre,
  token,
  asesoradoId,
  sesionPerdida,
  pendientes,
  onTerminar,
}: Comun & {
  claveDelArea: string;
  nombre: string;
  pendientes: readonly { readonly id: string; readonly nombre: string }[] | null;
  onTerminar: (aviso: string | null) => void;
}) {
  const yoId = useSesion().sesion?.identidadId ?? null;
  const alcance = ALCANCE_DE_LA_EVALUACION[area];
  const [estado, setEstado] = useState<Preparacion>(() => (pendientes && pendientes.length > 0 ? { tipo: 'cargando', cola: pendientes, indice: 0 } : { tipo: 'leyendo' }));
  const [tildados, setTildados] = useState<readonly string[]>([]);
  const [fallas, setFallas] = useState<readonly string[]>([]);

  /** Crea las solicitudes, en orden y cada una con su clave; si una falla, se dice cuál y sigue con las que salieron. */
  const crear = useCallback(
    async (plantillas: readonly Plantilla[]) => {
      setEstado({ tipo: 'creando' });
      const cola: { id: string; nombre: string }[] = [];
      const malas: string[] = [];
      for (const p of plantillas) {
        const v = await api.consultarDefinicionDePlantilla(token, p.templateId, p.latestVersionId);
        if (sesionPerdida(v)) return;
        if (!v.ok) {
          malas.push(EI.noSePudoPreparar(p.name, mensajeDeFallo(v)));
          continue;
        }
        const proposito = p.key === claveDelArea ? propositoAlElegir('', null, p.key).proposito : p.key === CLAVE_DEL_FORMULARIO_DE_HABITOS ? COPY_HABITOS.web.propositoDelFormulario : '';
        const cuerpo = pedidoParaCompletar(v.datos.data, alcance, proposito || EI.propositoGenerico(ETIQUETA_DE_ALCANCE[alcance]));
        // Un resultado incierto se reintenta una vez con la misma clave, como en «Pedir información»: no duplica el pedido.
        const clave = nuevaClaveDeIdempotencia();
        let r = await api.crearSolicitudDeFormulario(token, asesoradoId, cuerpo, clave);
        if (esIncierto(r)) r = await api.crearSolicitudDeFormulario(token, asesoradoId, cuerpo, clave);
        if (sesionPerdida(r)) return;
        if (r.ok) cola.push({ id: r.datos.data.formRequestId, nombre: p.name });
        else malas.push(EI.noSePudoPreparar(p.name, mensajeDeFallo(r)));
      }
      setFallas(malas);
      if (cola.length === 0) return setEstado({ tipo: 'falla', texto: malas.join(' ') || EI.noSePudoLeer });
      setEstado({ tipo: 'cargando', cola, indice: 0 });
    },
    [token, asesoradoId, sesionPerdida, alcance, claveDelArea],
  );

  // Sin pendientes: el catálogo y lo que sabe de los hábitos (API-FRM-01 y API-HBT-07), para saber qué crear. Una sola vez
  // por apertura, con una referencia y no un estado: con el modo estricto de React el efecto corre dos veces al montarse, y
  // con un estado las dos veían «sin leer» y pedían todo dos veces.
  const leido = useRef(false);
  useEffect(() => {
    if (estado.tipo !== 'leyendo' || leido.current) return;
    leido.current = true;
    void (async () => {
      const [catalogo, habitos, pedidas] = await Promise.all([
        api.listarPlantillasDeFormulario(token),
        api.habitosParaElProfesional(token, asesoradoId),
        api.listarSolicitudesDeFormulario(token, asesoradoId, { status: 'PENDING', limit: '20' }),
      ]);
      if (sesionPerdida(catalogo) || sesionPerdida(habitos) || sesionPerdida(pedidas)) return;
      if (!catalogo.ok) return setEstado({ tipo: 'falla', texto: mensajeDeFallo(catalogo) });
      const loQueSabe: HabitosParaElProfesionalResponse['data'] | null = habitos.ok ? habitos.datos.data : null;
      const yaPedidas = new Set(pedidas.ok ? pedidas.datos.data.filter((s) => s.scope === alcance).map((s) => s.templateId) : []);
      const r = pedidosParaCompletar({ catalogo: catalogo.datos.data, area: alcance, claveDelArea, loQueSabe, sinAccesoAHabitos: es404(habitos), yaPedidas, ahora: new Date().toISOString(), fecha: diaCorto });
      if (r.fijos.length === 0) return setEstado({ tipo: 'falla', texto: EI.sinFormularioDelArea });
      // «En un clic»: sin nada para tildar, se crean ya.
      if (r.paraTildar.length === 0) return void crear(r.fijos);
      setEstado({ tipo: 'eligiendo', fijos: r.fijos, paraTildar: r.paraTildar });
    })();
  }, [estado.tipo, token, asesoradoId, sesionPerdida, alcance, claveDelArea, crear]);

  if (estado.tipo === 'leyendo' || estado.tipo === 'creando') return <p className="nota" role="status">{EI.preparando}</p>;
  if (estado.tipo === 'falla') {
    return (
      <Aviso tipo="error" enfocar>
        <p>{estado.texto}</p>
        <p>
          <button type="button" className="boton boton--enlace" onClick={() => onTerminar(null)}>
            {EI.volverALaEvaluacion}
          </button>
        </p>
      </Aviso>
    );
  }
  if (estado.tipo === 'eligiendo') {
    return (
      <div className="completar-ahora" data-completar-ahora-eligiendo>
        <p>{EI.vasACompletar(nombre, estado.fijos.map((p) => `«${p.name}»`).join(' y '))}</p>
        <fieldset className="grupo">
          <legend>{EI.tambienPodesSumar}</legend>
          {estado.paraTildar.map(({ plantilla, motivo }) => (
            <label key={plantilla.templateId} className="opcion-en-linea">
              <input type="checkbox" checked={tildados.includes(plantilla.templateId)} onChange={() => setTildados((xs) => (xs.includes(plantilla.templateId) ? xs.filter((x) => x !== plantilla.templateId) : [...xs, plantilla.templateId]))} />{' '}
              {plantilla.name}
              {motivo ? <span className="nota"> · {motivo}</span> : null}
            </label>
          ))}
        </fieldset>
        <div className="acciones">
          <button type="button" className="boton boton--primario" onClick={() => void crear([...estado.fijos, ...estado.paraTildar.map((x) => x.plantilla).filter((p) => tildados.includes(p.templateId))])} data-seguir>
            {EI.seguir}
          </button>
          <button type="button" className="boton boton--secundario" onClick={() => onTerminar(null)}>
            {EI.volverALaEvaluacion}
          </button>
        </div>
      </div>
    );
  }
  const actual = estado.cola[estado.indice];
  const siguiente = estado.cola[estado.indice + 1] ?? null;
  if (!actual) return null;
  return (
    <div className="completar-ahora" data-completar-ahora-cargando={actual.id}>
      <CargarLaSolicitud
        key={actual.id}
        token={token}
        yoId={yoId}
        sesionPerdida={sesionPerdida}
        solicitudId={actual.id}
        textoDeVolver={EI.volverALaEvaluacion}
        aviso={
          fallas.length > 0 || siguiente ? (
            <Aviso tipo="info">
              {fallas.map((f) => (
                <p key={f}>{f}</p>
              ))}
              {siguiente ? <p>{EI.despuesSigue(siguiente.nombre)}</p> : null}
            </Aviso>
          ) : null
        }
        alEnviar={(texto) => (siguiente ? setEstado({ tipo: 'cargando', cola: estado.cola, indice: estado.indice + 1 }) : onTerminar(texto))}
        alVolver={() => onTerminar(null)}
      />
    </div>
  );
}
