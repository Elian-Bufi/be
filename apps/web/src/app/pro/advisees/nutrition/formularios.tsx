'use client';

/**
 * Formularios de evaluación (NUT-02 de B10-05; API-NUT-01) y de objetivo (NUT-03; API-NUT-04).
 * - La evaluación marca la fuente de cada dato: informado, observado o calculado (REG-06-109; DL-048). Un dato
 *   calculado declara su método: BE no calcula.
 * - El objetivo es «Nueva versión de objetivo», nunca «Editar objetivo actual» (B05:267-297): una decisión profesional
 *   con fundamento obligatorio. DL-186 (pedido de Dirección del 2026-11-19) suma el calculador de macros a pedido: una
 *   estimación con su método a la vista que el profesional revisa; lo que se guarda lo escribe él (B05:312-318 queda
 *   enmendado por DL-186; INV-06-133 sigue: BE no decide el objetivo).
 * - Adenda de formularios: etiqueta persistente, unidad visible, errores junto al campo y «requerido» solo si lo es.
 */
import {
  CONCEPTOS_FRECUENTES_DE_NUTRICION,
  COPY_DE_LA_EVALUACION,
  type ConceptoFrecuente,
  COPY_NUTRICION,
  ETIQUETA_DE_FUENTE,
  leerNumero,
  MAXIMO_DE_CITAS_POR_EVALUACION,
  motivoDeNumeroIlegible,
  type CrearEvaluacionRequest,
  type CrearObjetivoRequest,
  type EvaluacionNutricional,
} from '@be/domain';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { CitaPosible } from '@be/domain';
import { useReceptorDeCitas, type ReceptorDeCitas } from '../contexto/citas';
import { citasQueCambiaron, claveDeCita, claveDeCitaVista, fundamentoConCitas, sumarCitas } from '../contexto/panel-de-contexto';
import { AnuncioDeLosAvisos, Aviso, Campo, erroresPorCampo, ResumenDeErrores, useAvisosVivos } from '../../../../components/formulario';
import { COPY_AVISOS_VIVOS } from '../../../../components/validacion-viva';
import { api } from '../../../../lib/api';
import { dia } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useNutricion } from './nutricion';
import { ConceptosFrecuentes, lugarDelConcepto } from '../conceptos-frecuentes';
import { RepartosHabituales } from './repartos-habituales';
import { KcalDelObjetivo } from './suma-de-los-rangos';
import { evaluacionMasReciente } from '../evaluacion-reciente';
import { ElegirFormularios, vincularAlRegistrar, type VinculosElegidos } from '../evaluacion/formularios-de-la-evaluacion';
import { hoyEn } from '../seguimiento/estado';
import { CalculadorDelObjetivo, useTomasDelCalculador, type LoQueVaAlObjetivo } from './calculador';
import { COPY_CALCULADOR, falloDeLaReferencia, fuenteEnPalabras, parametrosDelCalculador, pedidoConReferencia, type ValoresDelCalculador } from './calculador-del-objetivo';

type Fuente = 'REPORTED' | 'OBSERVED' | 'CALCULATED';
interface Dato {
  concepto: string;
  valor: string;
  unidad: string;
  fuente: Fuente;
  metodo: string;
}
const datoVacio = (): Dato => ({ concepto: '', valor: '', unidad: '', fuente: 'REPORTED', metodo: '' });
const ahoraLocal = (): string => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

/**
 * DL-146: dentro de «Empezar el plan», el paso ya se llama «Evaluación inicial» (`conTitulo={false}`). Los conceptos
 * frecuentes llenan el primer dato vacío; el contexto y las notas, opcionales, van plegados después de los datos.
 */
export function FormularioDeEvaluacion({ onRegistrada, onCancelar, conTitulo = true }: { onRegistrada: (evaluationId: string) => void; onCancelar: () => void; conTitulo?: boolean }) {
  const { token, asesoradoId, sesionPerdida, accesoRetirado } = useNutricion();
  const intento = useClaveDeIntento();
  const [datos, setDatos] = useState<Dato[]>([datoVacio()]);
  const [contexto, setContexto] = useState('');
  const [notas, setNotas] = useState('');
  const [ocurrencia, setOcurrencia] = useState(ahoraLocal());
  // ED-04: los avisos se muestran al enviar y se actualizan al salir de cada campo.
  const avisos = useAvisosVivos(loQueFaltaEnLaEvaluacion);
  const errores = avisos.errores;
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  // DL-179 (CTX-D12, CTX-D13): las respuestas citadas desde el panel del contexto, con la versión que se vio. El mismo tope
  // de 20 que en Entrenamiento (DL-102); si una cambió antes de registrar, la API responde 409 y no se pierde ninguna.
  const [citas, setCitas] = useState<readonly CitaPosible[]>([]);
  const [citaCambiada, setCitaCambiada] = useState(false);
  // Revisión del PR: cuáles cambiaron, según el 409, para señalarlas en la lista hasta que se vuelvan a citar.
  const [cambiadas, setCambiadas] = useState<readonly string[]>([]);
  // DL-185 (EVF-04): los formularios que se vinculan al registrar, con la versión que se vio.
  const [vinculos, setVinculos] = useState<VinculosElegidos>([]);
  const receptor = useMemo<ReceptorDeCitas>(
    () => ({
      area: 'NUTRICION',
      destino: 'evaluacion',
      // Con la versión vista: después de «Volver a leer», una que cambió se puede citar de nuevo y reemplaza a la vieja.
      citadas: new Set(citas.map(claveDeCitaVista)),
      maximo: MAXIMO_DE_CITAS_POR_EVALUACION,
      citar: (nuevas) => {
        const propias = nuevas.filter((c) => c.area === 'NUTRICION');
        if (propias.length === 0) return 'otra-area';
        // Las del renglón, juntas: entran todas o ninguna en el tope de 20.
        const r = sumarCitas(citas, propias, MAXIMO_DE_CITAS_POR_EVALUACION);
        if (r.resultado === 'citada') {
          const citadasAhora = new Set(propias.map(claveDeCita));
          setCitas(r.lista);
          setCambiadas((xs) => xs.filter((x) => !citadasAhora.has(x)));
          setCitaCambiada(false);
        }
        return r.resultado;
      },
    }),
    [citas],
  );
  useReceptorDeCitas(receptor);

  const cambiar = (i: number, cambio: Partial<Dato>) => setDatos((ds) => ds.map((d, j) => (j === i ? { ...d, ...cambio } : d)));
  function elegirConcepto(c: ConceptoFrecuente) {
    const i = lugarDelConcepto(datos);
    setDatos((ds) => (i < ds.length ? ds.map((d, j) => (j === i ? { ...d, concepto: c.concepto, unidad: c.unidad } : d)) : [...ds, { ...datoVacio(), concepto: c.concepto, unidad: c.unidad }]));
    window.setTimeout(() => document.getElementById(`dato-${i}-valor`)?.focus(), 0);
  }

  /** Lo que falta en la evaluación, ahora (ED-04: se recalcula al enviar y al salir de cada campo). */
  function loQueFaltaEnLaEvaluacion(): { id: string; texto: string }[] {
    const problemas: { id: string; texto: string }[] = [];
    datos.forEach((d, i) => {
      if (!d.concepto.trim()) problemas.push({ id: `dato-${i}-concepto`, texto: `Dato ${i + 1}: falta el concepto.` });
      if (!d.valor.trim()) problemas.push({ id: `dato-${i}-valor`, texto: `Dato ${i + 1}: falta el valor.` });
      if (d.fuente === 'CALCULATED' && !d.metodo.trim()) problemas.push({ id: `dato-${i}-metodo`, texto: `Dato ${i + 1}: un dato calculado declara su método.` });
    });
    return problemas;
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const problemas = avisos.alEnviar();
    if (problemas.length > 0) return;
    const cuerpo: CrearEvaluacionRequest = {
      occurredAt: new Date(ocurrencia).toISOString(),
      context: contexto.trim() || null,
      assessment: {
        entries: datos.map((d) => ({
          concept: d.concepto.trim(),
          // Un valor que es un número se guarda como número, escrito con coma o con punto (DL-091 punto 4).
          value: leerNumero(d.valor) ?? d.valor.trim(),
          unit: d.unidad.trim() || null,
          source: d.fuente,
          methodStatement: d.fuente === 'CALCULATED' ? d.metodo.trim() : null,
        })),
      },
      evidenceReferences: [],
      professionalNotes: notas.trim() || null,
      ...(citas.length > 0 ? { formResponseReferences: citas.map((c) => ({ formResponseId: c.formResponseId, fieldCode: c.fieldCode, expectedVersion: c.expectedVersion })) } : {}),
    };
    setEnviando(true);
    setFallo(null);
    const r = await api.crearEvaluacion(token, asesoradoId, cuerpo, intento.actual(JSON.stringify(cuerpo.formResponseReferences ?? [])));
    intento.registrar(r);
    setEnviando(false);
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok && r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT') {
      // Nada se registró y nada se pierde: se señala cuál cambió, para volver a leerla y citarla.
      setCambiadas(citasQueCambiaron(cuerpo.formResponseReferences ?? [], r.issues));
      return setCitaCambiada(true);
    }
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    // DL-185 (EVF-D08): la evaluación ya quedó; si los vínculos no se guardan, la evaluación registrada lo avisa.
    setEnviando(true);
    await vincularAlRegistrar(token, 'nutrition', r.datos.data.evaluationId, vinculos);
    setEnviando(false);
    onRegistrada(r.datos.data.evaluationId);
  }

  // El mismo error va al resumen y al campo (B10-10:164-165).
  const porCampo = erroresPorCampo(errores);
  return (
    <form className="formulario" onSubmit={enviar} onBlur={avisos.alSalir} onKeyDown={avisos.alEnter} noValidate>
      {conTitulo ? <h3>{COPY_NUTRICION.nuevaEvaluacion}</h3> : null}
      <ResumenDeErrores titulo="Revisá estos datos:" errores={errores} intento={avisos.envios} />
      <AnuncioDeLosAvisos texto={avisos.anuncio(COPY_AVISOS_VIVOS.listoParaGuardar)} />
      <Campo id="evaluacion-ocurrencia" etiqueta="Fecha y hora de la evaluación" type="datetime-local" value={ocurrencia} onChange={(e) => setOcurrencia(e.target.value)} required />
      <fieldset className="grupo">
        <legend>Datos de la evaluación</legend>
        <p className="campo__ayuda">Cada dato indica de dónde sale. Un dato calculado declara el método: BE no calcula.</p>
        <ConceptosFrecuentes conceptos={CONCEPTOS_FRECUENTES_DE_NUTRICION} usados={datos.map((d) => d.concepto)} etiqueta={COPY_DE_LA_EVALUACION.paraEmpezar} onElegir={elegirConcepto} />
        {datos.map((d, i) => (
          <div key={i} className="fila-de-dato">
            <Campo id={`dato-${i}-concepto`} etiqueta="Concepto" value={d.concepto} onChange={(e) => cambiar(i, { concepto: e.target.value })} maxLength={120} error={porCampo[`dato-${i}-concepto`] ?? null} />
            <Campo id={`dato-${i}-valor`} etiqueta="Valor" value={d.valor} onChange={(e) => cambiar(i, { valor: e.target.value })} maxLength={500} error={porCampo[`dato-${i}-valor`] ?? null} />
            <Campo id={`dato-${i}-unidad`} etiqueta="Unidad (opcional)" value={d.unidad} onChange={(e) => cambiar(i, { unidad: e.target.value })} maxLength={30} />
            <div className="campo">
              <label htmlFor={`dato-${i}-fuente`}>Fuente</label>
              <select id={`dato-${i}-fuente`} value={d.fuente} onChange={(e) => cambiar(i, { fuente: e.target.value as Fuente })}>
                {(Object.keys(ETIQUETA_DE_FUENTE) as Fuente[]).map((f) => (
                  <option key={f} value={f}>
                    {ETIQUETA_DE_FUENTE[f]}
                  </option>
                ))}
              </select>
            </div>
            {d.fuente === 'CALCULATED' ? (
              <Campo id={`dato-${i}-metodo`} etiqueta="Método declarado" value={d.metodo} onChange={(e) => cambiar(i, { metodo: e.target.value })} maxLength={500} error={porCampo[`dato-${i}-metodo`] ?? null} />
            ) : null}
            {datos.length > 1 ? (
              <button type="button" className="boton boton--enlace" onClick={() => setDatos((ds) => ds.filter((_, j) => j !== i))}>
                Quitar dato {i + 1}
              </button>
            ) : null}
          </div>
        ))}
        <button type="button" className="boton boton--secundario" onClick={() => setDatos((ds) => [...ds, datoVacio()])}>
          Agregar dato
        </button>
      </fieldset>
      <ElegirFormularios area="nutrition" token={token} asesoradoId={asesoradoId} sesionPerdida={sesionPerdida} onCambio={setVinculos} />
      <fieldset className="grupo respuestas-citadas">
        <legend>Respuestas citadas (opcional)</legend>
        <p className="campo__ayuda">
          Lo que respondió la persona en tus formularios, como evidencia. Se cita desde «Contexto de la persona» (Alt + C), con «Citar». Hasta {MAXIMO_DE_CITAS_POR_EVALUACION}.
        </p>
        {citas.length === 0 ? <p className="nota">Todavía no citaste ninguna.</p> : null}
        {citaCambiada ? (
          <Aviso tipo="error" enfocar>
            <p>Una respuesta citada cambió desde que la viste: tocá «Volver a leer» en el contexto y citala de nuevo. No se registró nada.</p>
          </Aviso>
        ) : null}
        {citas.length > 0 ? (
          <ul className="lista-de-citas">
            {citas.map((c) => (
              <li key={claveDeCita(c)}>
                <span>
                  <strong>{c.pregunta}:</strong> {c.respuesta} <span className="nota">· {c.fuente.nombre} · {dia(c.fuente.fecha)}</span>
                  {cambiadas.includes(claveDeCita(c)) ? <span className="nota"> · Cambió desde que la viste: volvé a leer el contexto y citala de nuevo.</span> : null}
                </span>
                <button type="button" className="boton boton--enlace" aria-label={`Quitar la cita: ${c.pregunta}`} onClick={() => setCitas((xs) => xs.filter((x) => claveDeCita(x) !== claveDeCita(c)))}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </fieldset>
      <details className="campos-opcionales" open={contexto !== '' || notas !== '' ? true : undefined}>
        <summary>{COPY_DE_LA_EVALUACION.contextoYNotas}</summary>
        <div className="campo">
          <label htmlFor="evaluacion-contexto">Contexto (opcional)</label>
          <textarea id="evaluacion-contexto" rows={2} value={contexto} onChange={(e) => setContexto(e.target.value)} maxLength={1000} />
        </div>
        <div className="campo">
          <label htmlFor="evaluacion-notas">Notas del profesional (opcional)</label>
          <textarea id="evaluacion-notas" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={4000} />
        </div>
      </details>
      {fallo ? (
        <Aviso tipo="error" enfocar>
          <p>{fallo}</p>
        </Aviso>
      ) : null}
      <div className="acciones">
        <button type="submit" className="boton boton--primario" disabled={enviando} aria-busy={enviando}>
          {enviando ? 'Registrando…' : 'Registrar evaluación'}
        </button>
        <button type="button" className="boton boton--secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ─── Objetivo ────────────────────────────────────────────────────────────────────────────────────

export interface ValoresDeObjetivo {
  evaluacionId: string;
  kcal: string;
  proteina: string;
  carbohidratos: string;
  grasas: string;
  distribucion: string;
  fundamento: string;
  metodo: string;
  desde: string;
}
export const objetivoVacio = (evaluacionId: string): ValoresDeObjetivo => ({
  evaluacionId,
  kcal: '',
  proteina: '',
  carbohidratos: '',
  grasas: '',
  distribucion: '',
  fundamento: '',
  metodo: '',
  desde: ahoraLocal(),
});

/** Errores de los campos del objetivo, con el id del campo para el resumen accesible. */
export function erroresDeObjetivo(v: ValoresDeObjetivo, prefijo: string): { id: string; texto: string }[] {
  const e: { id: string; texto: string }[] = [];
  // `leerNumero` acepta coma o punto y devuelve `null` cuando no es un número: nunca NaN (DL-091 punto 4).
  const positivo = (s: string) => (leerNumero(s) ?? 0) > 0;
  const noNegativo = (s: string) => (leerNumero(s) ?? -1) >= 0;
  // Si hay algo escrito que no se entiende, el aviso dice por qué —«1.850» es ambiguo— en vez de pedir el dato otra vez.
  const aviso = (s: string, falta: string) => (s.trim() !== '' && leerNumero(s) === null ? motivoDeNumeroIlegible(s) : falta);
  if (!v.evaluacionId) e.push({ id: `${prefijo}-evaluacion`, texto: 'Elegí la evaluación de referencia.' });
  if (!positivo(v.kcal)) e.push({ id: `${prefijo}-kcal`, texto: aviso(v.kcal, 'Indicá el requerimiento energético (kcal por día).') });
  if (!noNegativo(v.proteina)) e.push({ id: `${prefijo}-proteina`, texto: aviso(v.proteina, 'Indicá las proteínas (g por día).') });
  if (!noNegativo(v.carbohidratos)) e.push({ id: `${prefijo}-carbohidratos`, texto: aviso(v.carbohidratos, 'Indicá los carbohidratos (g por día).') });
  if (!noNegativo(v.grasas)) e.push({ id: `${prefijo}-grasas`, texto: aviso(v.grasas, 'Indicá las grasas (g por día).') });
  if (!v.fundamento.trim()) e.push({ id: `${prefijo}-fundamento`, texto: 'El fundamento es obligatorio.' });
  return e;
}

export function aObjetivo(v: ValoresDeObjetivo): CrearObjetivoRequest {
  const g = (s: string) => ({ value: leerNumero(s) ?? 0, unit: 'g/day' as const });
  return {
    evaluationId: v.evaluacionId,
    effectiveFrom: new Date(v.desde).toISOString(),
    effectiveUntil: null,
    estimatedEnergyRequirement: { value: leerNumero(v.kcal) ?? 0, unit: 'kcal/day' },
    macronutrientDistribution: { protein: g(v.proteina), carbohydrate: g(v.carbohidratos), fat: g(v.grasas) },
    mealDistribution: v.distribucion.trim() || null,
    rationale: v.fundamento.trim(),
    methodStatement: v.metodo.trim() || null,
  };
}

/** NUP-07: lo escrito como número para la cuenta de las kcal, o `null` si todavía no es un número que sirva. */
const numeroPositivo = (s: string): number | null => {
  const n = leerNumero(s);
  return n !== null && n > 0 ? n : null;
};
const numeroNoNegativo = (s: string): number | null => {
  const n = leerNumero(s);
  return n !== null && n >= 0 ? n : null;
};

export function CamposDeObjetivo({
  valores,
  onCambiar,
  evaluaciones,
  prefijo,
  errores = {},
}: {
  valores: ValoresDeObjetivo;
  onCambiar: (v: ValoresDeObjetivo) => void;
  evaluaciones: readonly EvaluacionNutricional[];
  prefijo: string;
  /** El mismo error que enumera el resumen, indexado por el `id` del campo (B10-10:164-165). */
  errores?: Readonly<Record<string, string>>;
}) {
  const c = (cambio: Partial<ValoresDeObjetivo>) => onCambiar({ ...valores, ...cambio });
  const err = (sufijo: string) => errores[`${prefijo}-${sufijo}`] ?? null;
  const errorDeEvaluacion = err('evaluacion');
  const errorDeFundamento = err('fundamento');
  return (
    <>
      <p className="nota">{COPY_NUTRICION.noCalcula}</p>
      <div className={`campo${errorDeEvaluacion ? ' campo--error' : ''}`}>
        <label htmlFor={`${prefijo}-evaluacion`}>Evaluación de referencia</label>
        <select
          id={`${prefijo}-evaluacion`}
          value={valores.evaluacionId}
          aria-invalid={errorDeEvaluacion ? true : undefined}
          aria-describedby={errorDeEvaluacion ? `${prefijo}-evaluacion-error` : undefined}
          onChange={(e) => c({ evaluacionId: e.target.value })}
        >
          <option value="">Elegí una evaluación</option>
          {evaluaciones.map((ev) => (
            <option key={ev.evaluationId} value={ev.evaluationId}>
              Evaluación del {dia(ev.occurredAt)}
            </option>
          ))}
        </select>
        {errorDeEvaluacion ? (
          <p id={`${prefijo}-evaluacion-error`} className="campo__error">
            <span aria-hidden="true">⚠ </span>
            {errorDeEvaluacion}
          </p>
        ) : null}
      </div>
      <Campo
        id={`${prefijo}-kcal`}
        etiqueta="Requerimiento energético estimado (kcal por día)"
        inputMode="decimal"
        value={valores.kcal}
        onChange={(e) => c({ kcal: e.target.value })}
        error={err('kcal')}
      />
      <fieldset className="grupo">
        <legend>Distribución de macronutrientes (g por día)</legend>
        {/* NUP-10: los rótulos alineados arriba y el error debajo de su campo, sin mover la fila. */}
        <div className="fila-de-dato fila-de-dato--arriba">
          <Campo id={`${prefijo}-proteina`} etiqueta="Proteínas (g)" inputMode="decimal" value={valores.proteina} onChange={(e) => c({ proteina: e.target.value })} error={err('proteina')} />
          <Campo
            id={`${prefijo}-carbohidratos`}
            etiqueta="Carbohidratos (g)"
            inputMode="decimal"
            value={valores.carbohidratos}
            onChange={(e) => c({ carbohidratos: e.target.value })}
            error={err('carbohidratos')}
          />
          <Campo id={`${prefijo}-grasas`} etiqueta="Grasas (g)" inputMode="decimal" value={valores.grasas} onChange={(e) => c({ grasas: e.target.value })} error={err('grasas')} />
        </div>
        {/* NUP-07: las kcal que suman los gramos (4, 4 y 9, a la vista), frente a las escritas, y el porcentaje con su base.
            Avisa sin bloquear: se guarda igual. */}
        <KcalDelObjetivo kcal={numeroPositivo(valores.kcal)} gramos={{ protein: numeroNoNegativo(valores.proteina), carbohydrate: numeroNoNegativo(valores.carbohidratos), fat: numeroNoNegativo(valores.grasas) }} />
        {/* ED-13: usar un reparto habitual escribe sus gramos; el que se escribió se puede guardar como habitual. */}
        <RepartosHabituales gramos={valores} onUsar={(g) => c(g)} />
      </fieldset>
      <div className="campo">
        <label htmlFor={`${prefijo}-distribucion`}>Distribución por comidas (opcional)</label>
        <textarea id={`${prefijo}-distribucion`} rows={2} value={valores.distribucion} onChange={(e) => c({ distribucion: e.target.value })} maxLength={1000} />
      </div>
      <div className={`campo${errorDeFundamento ? ' campo--error' : ''}`}>
        <label htmlFor={`${prefijo}-fundamento`}>Fundamento</label>
        <p id={`${prefijo}-fundamento-ayuda`} className="campo__ayuda">
          Por qué fijás este objetivo. Es obligatorio: queda con la versión.
        </p>
        <textarea
          id={`${prefijo}-fundamento`}
          rows={3}
          aria-invalid={errorDeFundamento ? true : undefined}
          aria-describedby={errorDeFundamento ? `${prefijo}-fundamento-ayuda ${prefijo}-fundamento-error` : `${prefijo}-fundamento-ayuda`}
          value={valores.fundamento}
          onChange={(e) => c({ fundamento: e.target.value })}
          maxLength={4000}
        />
        {errorDeFundamento ? (
          <p id={`${prefijo}-fundamento-error`} className="campo__error">
            <span aria-hidden="true">⚠ </span>
            {errorDeFundamento}
          </p>
        ) : null}
      </div>
      <Campo id={`${prefijo}-metodo`} etiqueta="Método o referencia declarada (opcional)" value={valores.metodo} onChange={(e) => c({ metodo: e.target.value })} maxLength={1000} />
      <Campo id={`${prefijo}-desde`} etiqueta="Vigente desde" type="datetime-local" value={valores.desde} onChange={(e) => c({ desde: e.target.value })} />
    </>
  );
}

export function FormularioDeObjetivo({
  evaluaciones,
  onEmitido,
  onCancelar,
}: {
  evaluaciones: readonly EvaluacionNutricional[];
  onEmitido: () => void;
  onCancelar: () => void;
}) {
  const { token, asesoradoId, sesionPerdida, accesoRetirado } = useNutricion();
  const intento = useClaveDeIntento();
  const [valores, setValores] = useState(objetivoVacio(evaluacionMasReciente(evaluaciones)));
  // DL-179 (CTX-D12): «Citar» desde el panel suma un renglón con la cita y su fuente al fundamento (CTX-P07: sin citas
  // estructurales en el objetivo). Nunca lo de salud: el objetivo viaja con el plan que la persona comparte (API-RES-06).
  const receptorDelObjetivo = useMemo<ReceptorDeCitas>(
    () => ({
      area: 'NUTRICION',
      destino: 'objetivo',
      citadas: new Set<string>(),
      maximo: null,
      citar: (citas) => {
        const r = fundamentoConCitas(valores.fundamento, citas, (iso) => dia(iso));
        if (r.resultado === 'citada') setValores((v) => ({ ...v, fundamento: r.texto }));
        return r.resultado;
      },
    }),
    [valores.fundamento],
  );
  useReceptorDeCitas(receptorDelObjetivo);
  // En el primer plan, el formulario se abre apenas se registra la evaluación, antes de que la lista vuelva a leerse.
  useEffect(() => {
    if (evaluaciones.length > 0) setValores((v) => (v.evaluacionId ? v : { ...v, evaluacionId: evaluacionMasReciente(evaluaciones) }));
  }, [evaluaciones]);
  // ED-04: los avisos se muestran al enviar y se actualizan al salir de cada campo.
  const avisos = useAvisosVivos(() => erroresDeObjetivo(valores, 'objetivo'));
  const errores = avisos.errores;
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  // DL-186 (OBC-03 y OBC-04): el calculador, abierto a pedido. Con él, el objetivo se guarda con su referencia y su cálculo.
  const [conCalculador, setConCalculador] = useState(false);
  const [calculo, setCalculo] = useState<ValoresDelCalculador | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const problemas = avisos.alEnviar();
    if (problemas.length > 0) return;
    const hoy = hoyEn();
    const pedido = conCalculador && calculo ? pedidoConReferencia(aObjetivo(valores), calculo, hoy, parametrosDelCalculador(calculo, hoy) !== null) : null;
    if (conCalculador && calculo && !pedido) return setFallo('Revisá los datos de referencia del calculador (están marcados) o quitá el calculador.');
    setEnviando(true);
    setFallo(null);
    const r = pedido ? await api.crearObjetivoConReferencia(token, asesoradoId, pedido, intento.actual()) : await api.crearObjetivo(token, asesoradoId, aObjetivo(valores), intento.actual());
    intento.registrar(r);
    setEnviando(false);
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) return setFallo((pedido ? falloDeLaReferencia(r) : null) ?? mensajeDeFallo(r));
    onEmitido();
  }

  if (evaluaciones.length === 0) {
    return (
      <Aviso tipo="info">
        <p>Para definir un objetivo, primero registrá una evaluación: el objetivo se relaciona con ella.</p>
      </Aviso>
    );
  }
  return (
    <form className="formulario" onSubmit={enviar} onBlur={avisos.alSalir} onKeyDown={avisos.alEnter} noValidate>
      <h3>{COPY_NUTRICION.nuevaVersionDeObjetivo}</h3>
      <ResumenDeErrores titulo="Revisá estos datos:" errores={errores} intento={avisos.envios} />
      <AnuncioDeLosAvisos texto={avisos.anuncio(COPY_AVISOS_VIVOS.listoParaGuardar)} />
      <SeccionDelCalculador
        abierta={conCalculador}
        onAbrir={setConCalculador}
        valores={calculo}
        onCambiar={setCalculo}
        onUsar={(x: LoQueVaAlObjetivo) => setValores((v) => ({ ...v, kcal: x.kcal, proteina: x.proteina || v.proteina, carbohidratos: x.carbohidratos || v.carbohidratos, grasas: x.grasas || v.grasas, metodo: x.metodo }))}
      />
      <CamposDeObjetivo valores={valores} onCambiar={setValores} evaluaciones={evaluaciones} prefijo="objetivo" errores={erroresPorCampo(errores)} />
      {fallo ? (
        <Aviso tipo="error" enfocar>
          <p>{fallo}</p>
        </Aviso>
      ) : null}
      <div className="acciones">
        <button type="submit" className="boton boton--primario" disabled={enviando} aria-busy={enviando}>
          {enviando ? 'Guardando…' : 'Guardar nueva versión'}
        </button>
        <button type="button" className="boton boton--secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/**
 * DL-186 (OBC-03): el calculador dentro de «Nueva versión de objetivo», abierto a pedido. Cerrado, el objetivo se guarda
 * como siempre (API-NUT-04); abierto, con su referencia y su cálculo (API-OBC-02).
 */
function SeccionDelCalculador({
  abierta,
  onAbrir,
  valores,
  onCambiar,
  onUsar,
}: {
  abierta: boolean;
  onAbrir: (abierta: boolean) => void;
  valores: ValoresDelCalculador | null;
  onCambiar: (v: ValoresDelCalculador | null) => void;
  onUsar: (x: LoQueVaAlObjetivo) => void;
}) {
  return (
    <section className="calculador-del-objetivo" aria-labelledby="titulo-del-calculador" data-seccion-del-calculador>
      <div className="calculador-del-objetivo__cabecera">
        <h4 id="titulo-del-calculador">{COPY_CALCULADOR.titulo}</h4>
        <button
          type="button"
          className="boton boton--secundario boton--compacto"
          aria-expanded={abierta}
          data-abrir-el-calculador
          onClick={() => {
            if (abierta) onCambiar(null);
            onAbrir(!abierta);
          }}
        >
          {abierta ? 'Quitar el calculador' : 'Abrir el calculador'}
        </button>
      </div>
      <p className="nota">{COPY_CALCULADOR.resumen}</p>
      {abierta ? <CalculadorConSusTomas valores={valores} onCambiar={onCambiar} onUsar={onUsar} /> : null}
    </section>
  );
}

function CalculadorConSusTomas({ valores, onCambiar, onUsar }: { valores: ValoresDelCalculador | null; onCambiar: (v: ValoresDelCalculador | null) => void; onUsar: (x: LoQueVaAlObjetivo) => void }) {
  const { tomas, releer } = useTomasDelCalculador();
  const lista = tomas.estado === 'listo' && tomas.habilitada ? tomas.tomas : [];
  return (
    <>
      <CalculadorDelObjetivo tomas={tomas} valores={valores} onCambiar={onCambiar} onUsar={onUsar} onReleer={releer} />
      {valores ? <p className="nota" data-se-guarda-con>{COPY_CALCULADOR.seGuardaCon(fuenteEnPalabras(valores, lista))}</p> : null}
    </>
  );
}
