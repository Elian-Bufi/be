'use client';

/**
 * WP-EVALUACION-Y-FORMULARIOS (DL-185): los formularios que la persona respondió, vinculados a la evaluación inicial de
 * Nutrición y de Entrenamiento. Dos piezas, iguales en las dos áreas:
 * - **`ElegirFormularios`**, dentro del formulario de la evaluación: los formularios del área que la persona le respondió
 *   a este profesional (API-CTX-01, que ya trae solo los propios), con su nombre, su fecha y «Ver respuestas», para marcar
 *   cuáles se vinculan al registrar (EVF-04). Al registrar, `vincularAlRegistrar` los manda con la versión que se vio.
 * - **`FormulariosDeLaEvaluacion`**, en la evaluación registrada: los vinculados (API-EVF-01), «Ver respuestas» con lo de la
 *   versión vinculada (API-EVF-04), «Desvincular» (API-EVF-03), «Vincular un formulario» y, si la persona registró una
 *   versión más nueva, el aviso y «Vincular la más nueva» (API-EVF-02; EVF-05).
 * Nada de lo respondido se escribe en la evaluación ni en otro campo (EVF-D02, EVF-D06), y nada se guarda en el navegador.
 * La conducta alimentaria se dice como en el panel del contexto (CTX-D09): «Conducta alimentaria», plegada.
 */
import {
  COPY_CONTEXTO,
  COPY_EVALUACION_Y_FORMULARIOS as C,
  MAXIMO_DE_FORMULARIOS_VINCULADOS,
  renglonesDelFormulario,
  type AreaDeLaEvaluacion,
  type FormularioEnElContexto,
  type FormularioVinculado,
  type FormulariosVinculadosResponse,
} from '@be/domain';
import { useCallback, useEffect, useId, useState, type ReactNode } from 'react';
import { Aviso } from '../../../../components/formulario';
import { api, nuevaClaveDeIdempotencia, type Resultado } from '../../../../lib/api';
import { diaSinElAnioEnCurso } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { alternarElegido, avisoDelRegistroVigente, dejarAvisoDeVinculos, formulariosParaVincular, tomarAvisoDeVinculos, vinculosAEnviar } from './formularios-vinculados';

type Lectura<T> = { readonly estado: 'cargando' } | { readonly estado: 'listo'; readonly datos: T } | { readonly estado: 'error' };

interface Comun {
  readonly area: AreaDeLaEvaluacion;
  readonly token: string;
  readonly asesoradoId: string;
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
}

/** API-CTX-01 de la persona; un 404 (ninguna área permitida hoy) es «ninguno», no una falla. */
function useFormulariosRespondidos({ token, asesoradoId, sesionPerdida }: Omit<Comun, 'area'>, activo = true): { lectura: Lectura<readonly FormularioEnElContexto[]>; leer: () => Promise<void> } {
  const [lectura, setLectura] = useState<Lectura<readonly FormularioEnElContexto[]>>({ estado: 'cargando' });
  const leer = useCallback(async () => {
    setLectura({ estado: 'cargando' });
    const r = await api.respuestasDelContexto(token, asesoradoId);
    if (sesionPerdida(r)) return;
    if (r.ok) return setLectura({ estado: 'listo', datos: r.datos.data.forms });
    if (r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') return setLectura({ estado: 'listo', datos: [] });
    setLectura({ estado: 'error' });
  }, [token, asesoradoId, sesionPerdida]);
  useEffect(() => {
    if (activo) void leer();
  }, [leer, activo]);
  return { lectura, leer };
}

// ─── Lo que respondió, por sección ───────────────────────────────────────────────────────────────

/** Las respuestas de un formulario, por sección y en palabras; lo sensible, plegado y sin el nombre del trastorno. */
export function RespuestasDelFormulario({ form, encabezado }: { form: FormularioEnElContexto; encabezado?: string }) {
  return (
    <div className="formularios-de-la-evaluacion__respuestas">
      {encabezado ? <p className="nota">{encabezado}</p> : null}
      {renglonesDelFormulario(form).map((s) => (
        <section key={s.titulo} className="formularios-de-la-evaluacion__seccion" aria-label={s.titulo}>
          <h4>{s.titulo}</h4>
          <dl>
            {s.renglones.map((x) => (
              <div key={x.clave} className="formularios-de-la-evaluacion__dato">
                <dt>{x.pregunta}</dt>
                <dd>
                  {x.sensible ? (
                    <details>
                      <summary>{COPY_CONTEXTO.datoSensible}</summary>
                      <span>{x.respuesta}</span>
                    </details>
                  ) : (
                    x.respuesta
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

/** El renglón de un formulario para vincular: la casilla con el nombre, la fecha y «Ver respuestas». */
function FormularioParaElegir({ f, marcado, onAlternar }: { f: FormularioEnElContexto; marcado: boolean; onAlternar: () => void }) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  return (
    <li className="formularios-de-la-evaluacion__item" data-formulario-para-vincular={f.formResponseId}>
      <div className="formularios-de-la-evaluacion__cabecera">
        <label className="formularios-de-la-evaluacion__eleccion" htmlFor={`${id}-vincular`}>
          <input id={`${id}-vincular`} type="checkbox" checked={marcado} onChange={onAlternar} aria-describedby={`${id}-fecha`} />
          <span>
            <strong>{f.templateName}</strong>
            <span id={`${id}-fecha`} className="nota">
              {' '}
              · {f.rectified ? C.corregido(diaSinElAnioEnCurso(f.answeredAt)) : C.respondido(diaSinElAnioEnCurso(f.answeredAt))}
            </span>
          </span>
        </label>
        <button type="button" className="boton boton--enlace" aria-expanded={abierto} aria-controls={`${id}-respuestas`} onClick={() => setAbierto((x) => !x)}>
          {abierto ? C.ocultarRespuestas : C.verRespuestas}
        </button>
      </div>
      <div id={`${id}-respuestas`} hidden={!abierto}>
        {abierto ? <RespuestasDelFormulario form={f} /> : null}
      </div>
    </li>
  );
}

/** La lista con casillas: la usan el formulario de la evaluación y «Vincular un formulario». */
function ListaParaElegir({ forms, elegidos, onAlternar, tope }: { forms: readonly FormularioEnElContexto[]; elegidos: readonly string[]; onAlternar: (id: string) => void; tope: boolean }) {
  return (
    <>
      <ul className="formularios-de-la-evaluacion__lista">
        {forms.map((f) => (
          <FormularioParaElegir key={f.formResponseId} f={f} marcado={elegidos.includes(f.formResponseId)} onAlternar={() => onAlternar(f.formResponseId)} />
        ))}
      </ul>
      {tope ? <p className="nota" role="status">{C.tope(MAXIMO_DE_FORMULARIOS_VINCULADOS)}</p> : null}
    </>
  );
}

// ─── Al registrar la evaluación (EVF-04) ─────────────────────────────────────────────────────────

export type VinculosElegidos = readonly { formResponseId: string; expectedVersion: string }[];

/**
 * «Formularios que respondió (opcional)», dentro del formulario de la evaluación. Avisa lo elegido, con la versión que se
 * vio, cada vez que cambia. Sin formularios del área, lo dice; si la lectura falla, la evaluación se registra igual.
 */
export function ElegirFormularios({ area, token, asesoradoId, sesionPerdida, onCambio }: Comun & { readonly onCambio: (v: VinculosElegidos) => void }) {
  const { lectura, leer } = useFormulariosRespondidos({ token, asesoradoId, sesionPerdida });
  const [elegidos, setElegidos] = useState<readonly string[]>([]);
  const [tope, setTope] = useState(false);
  const forms = lectura.estado === 'listo' ? formulariosParaVincular(lectura.datos, area) : [];
  useEffect(() => {
    onCambio(vinculosAEnviar(forms, elegidos));
    // `forms` sale de `lectura`: se recalcula cuando cambia la lectura o lo elegido.
  }, [lectura, elegidos, onCambio]);
  return (
    <fieldset className="grupo formularios-de-la-evaluacion" data-elegir-formularios>
      <legend>{C.paraVincular}</legend>
      <p className="campo__ayuda">{C.ayudaParaVincular}</p>
      {lectura.estado === 'cargando' ? <p className="nota">{C.cargando}</p> : null}
      {lectura.estado === 'error' ? (
        <p className="nota">
          {C.noSePudieronLeer}{' '}
          <button type="button" className="boton boton--enlace" onClick={() => void leer()}>
            {C.volverALeer}
          </button>
        </p>
      ) : null}
      {lectura.estado === 'listo' && forms.length === 0 ? <p className="nota">{C.ningunoParaVincular}</p> : null}
      {forms.length > 0 ? (
        <ListaParaElegir
          forms={forms}
          elegidos={elegidos}
          tope={tope}
          onAlternar={(id) => {
            const r = alternarElegido(elegidos, id);
            setElegidos(r.elegidos);
            setTope(r.tope);
          }}
        />
      ) : null}
    </fieldset>
  );
}

/**
 * Después de registrar la evaluación: vincula lo elegido (EVF-D08). Si no se pudo, la evaluación ya está registrada: el
 * aviso queda para la evaluación, que lo muestra donde se vinculan.
 */
export async function vincularAlRegistrar(token: string, area: AreaDeLaEvaluacion, evaluationId: string, vinculos: VinculosElegidos): Promise<void> {
  if (vinculos.length === 0) return;
  const r = await api.vincularFormularios(token, area, evaluationId, { links: [...vinculos] }, nuevaClaveDeIdempotencia());
  if (r.ok) return;
  dejarAvisoDeVinculos(evaluationId, r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT' ? C.noSeVincularonPorVersion : C.noSeVincularon);
}

// ─── En la evaluación registrada (EVF-05) ────────────────────────────────────────────────────────

/** Un vinculado: nombre, fechas, el aviso de la más nueva, «Ver respuestas» (de la versión vinculada) y «Desvincular». */
function Vinculado({ v, comun, evaluationId, ocupado, onDesvincular, onVincularLaMasNueva }: { v: FormularioVinculado; comun: Comun; evaluationId: string; ocupado: boolean; onDesvincular: () => void; onVincularLaMasNueva: () => void }) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [contenido, setContenido] = useState<Lectura<FormularioEnElContexto> | null>(null);
  async function alternar() {
    const abrir = !abierto;
    setAbierto(abrir);
    if (!abrir || contenido?.estado === 'listo') return;
    setContenido({ estado: 'cargando' });
    const r = await api.formularioVinculado(comun.token, comun.area, evaluationId, v.linkId);
    if (comun.sesionPerdida(r)) return;
    setContenido(r.ok ? { estado: 'listo', datos: r.datos.data.form } : { estado: 'error' });
  }
  return (
    <li className="formularios-de-la-evaluacion__item" data-formulario-vinculado={v.formResponseId}>
      <div className="formularios-de-la-evaluacion__cabecera">
        <span>
          <strong>{v.templateName}</strong>
          <span className="nota">
            {' '}
            · {C.respondido(diaSinElAnioEnCurso(v.answeredAt))} · {C.vinculadoEl(diaSinElAnioEnCurso(v.linkedAt))}
          </span>
        </span>
        <span className="formularios-de-la-evaluacion__acciones">
          <button type="button" className="boton boton--enlace" aria-expanded={abierto} aria-controls={`${id}-respuestas`} onClick={() => void alternar()}>
            {abierto ? C.ocultarRespuestas : C.verRespuestas}
          </button>
          <button type="button" className="boton boton--enlace" aria-label={C.desvincularEste(v.templateName)} disabled={ocupado} onClick={onDesvincular}>
            {C.desvincular}
          </button>
        </span>
      </div>
      {v.laterVersion ? (
        <p className="nota formularios-de-la-evaluacion__mas-nueva" data-version-mas-nueva>
          {C.hayUnaMasNueva(diaSinElAnioEnCurso(v.laterVersion.answeredAt))}{' '}
          <button type="button" className="boton boton--enlace" disabled={ocupado} onClick={onVincularLaMasNueva}>
            {C.vincularLaMasNueva}
          </button>
        </p>
      ) : null}
      <div id={`${id}-respuestas`} hidden={!abierto}>
        {abierto && contenido?.estado === 'cargando' ? <p className="nota">{C.cargando}</p> : null}
        {abierto && contenido?.estado === 'error' ? <p className="nota">{C.noSePudoLeer}</p> : null}
        {abierto && contenido?.estado === 'listo' ? <RespuestasDelFormulario form={contenido.datos} encabezado={C.respuestasDeLaVersion(diaSinElAnioEnCurso(v.answeredAt))} /> : null}
      </div>
    </li>
  );
}

/**
 * «Formularios vinculados» de una evaluación registrada. `conTitulo={false}` cuando el lugar ya lo titula. Lee los
 * vinculados al montarse y, solo al tocar «Vincular un formulario», los que se pueden sumar.
 */
export function FormulariosDeLaEvaluacion({ area, token, asesoradoId, sesionPerdida, evaluationId, pie = null }: Comun & { readonly evaluationId: string; readonly pie?: ReactNode }) {
  const comun: Comun = { area, token, asesoradoId, sesionPerdida };
  const intento = useClaveDeIntento();
  const [lectura, setLectura] = useState<Lectura<FormulariosVinculadosResponse['data']['links']>>({ estado: 'cargando' });
  const [aviso, setAviso] = useState<{ tipo: 'info' | 'error' | 'exito'; texto: string } | null>(null);
  // EVF-D08: lo que dejó el registro de la evaluación si sus vínculos no se guardaron. Se muestra con la lista ya leída, y
  // solo si la lista confirma que no quedó ninguno (revisión del PR: un corte de red puede perder la respuesta, no el vínculo).
  const [avisoDelRegistro, setAvisoDelRegistro] = useState<string | null>(() => tomarAvisoDeVinculos(evaluationId));
  const [agregando, setAgregando] = useState(false);
  const [elegidos, setElegidos] = useState<readonly string[]>([]);
  const [tope, setTope] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const respondidos = useFormulariosRespondidos({ token, asesoradoId, sesionPerdida }, agregando);

  const leer = useCallback(async () => {
    const r = await api.formulariosVinculados(token, area, evaluationId);
    if (sesionPerdida(r)) return;
    if (r.ok) setAvisoDelRegistro((t) => avisoDelRegistroVigente(t, r.datos.data.links));
    setLectura(r.ok ? { estado: 'listo', datos: r.datos.data.links } : { estado: 'error' });
  }, [token, area, evaluationId, sesionPerdida]);
  useEffect(() => {
    void leer();
  }, [leer]);

  const links = lectura.estado === 'listo' ? lectura.datos : [];
  const paraSumar = respondidos.lectura.estado === 'listo' ? formulariosParaVincular(respondidos.lectura.datos, area, links) : [];

  /** Una escritura y su resultado: la lista que devuelve la API reemplaza a la de la pantalla. */
  async function escribir(pedido: (clave: string) => Promise<Resultado<FormulariosVinculadosResponse>>, exito: string, que: string) {
    setOcupado(true);
    setAviso(null);
    setAvisoDelRegistro(null);
    const r = await pedido(intento.actual(que));
    intento.registrar(r);
    setOcupado(false);
    if (sesionPerdida(r)) return false;
    if (r.ok) {
      setLectura({ estado: 'listo', datos: r.datos.data.links });
      setAviso({ tipo: 'exito', texto: exito });
      return true;
    }
    if (r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT') {
      setAviso({ tipo: 'error', texto: C.versionCambiada });
      void respondidos.leer();
      void leer();
      return false;
    }
    setAviso({ tipo: 'error', texto: mensajeDeFallo(r) });
    return false;
  }

  async function vincularElegidos() {
    const vinculos = vinculosAEnviar(paraSumar, elegidos);
    if (vinculos.length === 0) return;
    const ok = await escribir((clave) => api.vincularFormularios(token, area, evaluationId, { links: vinculos }, clave), vinculos.length === 1 ? C.vinculado : C.vinculadosVarios(vinculos.length), JSON.stringify(vinculos));
    if (ok) {
      setAgregando(false);
      setElegidos([]);
      setTope(false);
    }
  }

  async function vincularLaMasNueva(v: FormularioVinculado) {
    if (!v.laterVersion) return;
    const links = [{ formResponseId: v.formResponseId, expectedVersion: v.laterVersion.version }];
    await escribir((clave) => api.vincularFormularios(token, area, evaluationId, { links }, clave), C.vinculado, JSON.stringify(links));
  }

  return (
    <div className="formularios-de-la-evaluacion formularios-de-la-evaluacion--registrada" data-formularios-de-la-evaluacion={evaluationId}>
      <p className="lista__titulo">{C.vinculados}</p>
      {aviso ? (
        <Aviso tipo={aviso.tipo} enfocar={aviso.tipo === 'error'}>
          <p>{aviso.texto}</p>
        </Aviso>
      ) : avisoDelRegistro && lectura.estado !== 'cargando' ? (
        <Aviso tipo="error" enfocar>
          <p>{avisoDelRegistro}</p>
        </Aviso>
      ) : null}
      {lectura.estado === 'cargando' ? <p className="nota">{C.cargando}</p> : null}
      {lectura.estado === 'error' ? (
        <p className="nota">
          {C.noSePudoLeer}{' '}
          <button type="button" className="boton boton--enlace" onClick={() => void leer()}>
            {C.volverALeer}
          </button>
        </p>
      ) : null}
      {lectura.estado === 'listo' && links.length === 0 && !agregando ? <p className="nota">{C.sinVinculados}</p> : null}
      {links.length > 0 ? (
        <ul className="formularios-de-la-evaluacion__lista">
          {links.map((v) => (
            <Vinculado
              key={v.linkId}
              v={v}
              comun={comun}
              evaluationId={evaluationId}
              ocupado={ocupado}
              onDesvincular={() => void escribir((clave) => api.desvincularFormulario(token, area, evaluationId, v.linkId, clave), C.desvinculado, `quitar-${v.linkId}`)}
              onVincularLaMasNueva={() => void vincularLaMasNueva(v)}
            />
          ))}
        </ul>
      ) : null}
      {lectura.estado === 'listo' && !agregando && links.length < MAXIMO_DE_FORMULARIOS_VINCULADOS ? (
        <div className="acciones">
          <button type="button" className="boton boton--secundario" onClick={() => setAgregando(true)} data-vincular-otro>
            {C.vincularOtro}
          </button>
        </div>
      ) : null}
      {agregando ? (
        <div className="formularios-de-la-evaluacion__sumar" data-vincular-formularios>
          {respondidos.lectura.estado === 'cargando' ? <p className="nota">{C.cargando}</p> : null}
          {respondidos.lectura.estado === 'error' ? (
            <p className="nota">
              {C.noSePudoLeer}{' '}
              <button type="button" className="boton boton--enlace" onClick={() => void respondidos.leer()}>
                {C.volverALeer}
              </button>
            </p>
          ) : null}
          {respondidos.lectura.estado === 'listo' && paraSumar.length === 0 ? <p className="nota">{links.length > 0 ? C.todosVinculados : C.ningunoParaVincular}</p> : null}
          {paraSumar.length > 0 ? (
            <ListaParaElegir
              forms={paraSumar}
              elegidos={elegidos}
              tope={tope}
              onAlternar={(id) => {
                const r = alternarElegido(elegidos, id, links.length);
                setElegidos(r.elegidos);
                setTope(r.tope);
              }}
            />
          ) : null}
          <div className="acciones">
            <button type="button" className="boton boton--primario" disabled={ocupado || elegidos.length === 0} aria-busy={ocupado} onClick={() => void vincularElegidos()} data-vincular-elegidos>
              {elegidos.length > 0 ? C.vincularElegidos(elegidos.length) : C.vincular}
            </button>
            <button
              type="button"
              className="boton boton--secundario"
              disabled={ocupado}
              onClick={() => {
                setAgregando(false);
                setElegidos([]);
                setTope(false);
              }}
            >
              {C.cancelar}
            </button>
          </div>
        </div>
      ) : null}
      {/* DL-189 (RP-16): lo que la persona corrigió después, si el área lo muestra. */}
      {pie}
    </div>
  );
}
