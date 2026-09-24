'use client';

/**
 * Formularios de evaluación (NUT-02 de B10-05; API-NUT-01) y de objetivo (NUT-03; API-NUT-04).
 * - La evaluación marca la fuente de cada dato: informado, observado o calculado (REG-06-109; DL-048). Un dato
 *   calculado declara su método: BE no calcula.
 * - El objetivo es «Nueva versión de objetivo», nunca «Editar objetivo actual» (B05:267-297): una decisión profesional
 *   con fundamento obligatorio. No hay botón de «Calcular» (B05:312-318; INV-06-133).
 * - Adenda de formularios: etiqueta persistente, unidad visible, errores junto al campo y «requerido» solo si lo es.
 */
import {
  COPY_NUTRICION,
  ETIQUETA_DE_FUENTE,
  leerNumero,
  type CrearEvaluacionRequest,
  type CrearObjetivoRequest,
  type EvaluacionNutricional,
} from '@be/domain';
import { useState, type FormEvent } from 'react';
import { Aviso, Campo, erroresPorCampo, ResumenDeErrores } from '../../../../components/formulario';
import { api } from '../../../../lib/api';
import { dia } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useNutricion } from './nutricion';

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

export function FormularioDeEvaluacion({ onRegistrada, onCancelar }: { onRegistrada: (evaluationId: string) => void; onCancelar: () => void }) {
  const { token, asesoradoId, sesionPerdida, accesoRetirado } = useNutricion();
  const intento = useClaveDeIntento();
  const [datos, setDatos] = useState<Dato[]>([datoVacio()]);
  const [contexto, setContexto] = useState('');
  const [notas, setNotas] = useState('');
  const [ocurrencia, setOcurrencia] = useState(ahoraLocal());
  const [errores, setErrores] = useState<{ id: string; texto: string }[]>([]);
  const [envios, setEnvios] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  const cambiar = (i: number, cambio: Partial<Dato>) => setDatos((ds) => ds.map((d, j) => (j === i ? { ...d, ...cambio } : d)));

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const problemas: { id: string; texto: string }[] = [];
    datos.forEach((d, i) => {
      if (!d.concepto.trim()) problemas.push({ id: `dato-${i}-concepto`, texto: `Dato ${i + 1}: falta el concepto.` });
      if (!d.valor.trim()) problemas.push({ id: `dato-${i}-valor`, texto: `Dato ${i + 1}: falta el valor.` });
      if (d.fuente === 'CALCULATED' && !d.metodo.trim()) problemas.push({ id: `dato-${i}-metodo`, texto: `Dato ${i + 1}: un dato calculado declara su método.` });
    });
    setErrores(problemas);
    setEnvios((n) => n + 1);
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
    };
    setEnviando(true);
    setFallo(null);
    const r = await api.crearEvaluacion(token, asesoradoId, cuerpo, intento.actual());
    intento.registrar(r);
    setEnviando(false);
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    onRegistrada(r.datos.data.evaluationId);
  }

  // El mismo error va al resumen y al campo (B10-10:164-165).
  const porCampo = erroresPorCampo(errores);
  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h3>{COPY_NUTRICION.nuevaEvaluacion}</h3>
      <ResumenDeErrores titulo="Revisá estos datos:" errores={errores} intento={envios} />
      <Campo id="evaluacion-ocurrencia" etiqueta="Fecha y hora de la evaluación" type="datetime-local" value={ocurrencia} onChange={(e) => setOcurrencia(e.target.value)} required />
      <div className="campo">
        <label htmlFor="evaluacion-contexto">Contexto (opcional)</label>
        <textarea id="evaluacion-contexto" rows={2} value={contexto} onChange={(e) => setContexto(e.target.value)} maxLength={1000} />
      </div>
      <fieldset className="grupo">
        <legend>Datos de la evaluación</legend>
        <p className="campo__ayuda">Cada dato indica de dónde sale. Un dato calculado declara el método: BE no calcula.</p>
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
      <div className="campo">
        <label htmlFor="evaluacion-notas">Notas del profesional (opcional)</label>
        <textarea id="evaluacion-notas" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={4000} />
      </div>
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
  if (!v.evaluacionId) e.push({ id: `${prefijo}-evaluacion`, texto: 'Elegí la evaluación de referencia.' });
  if (!positivo(v.kcal)) e.push({ id: `${prefijo}-kcal`, texto: 'Indicá el requerimiento energético (kcal por día).' });
  if (!noNegativo(v.proteina)) e.push({ id: `${prefijo}-proteina`, texto: 'Indicá las proteínas (g por día).' });
  if (!noNegativo(v.carbohidratos)) e.push({ id: `${prefijo}-carbohidratos`, texto: 'Indicá los carbohidratos (g por día).' });
  if (!noNegativo(v.grasas)) e.push({ id: `${prefijo}-grasas`, texto: 'Indicá las grasas (g por día).' });
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
        <div className="fila-de-dato">
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
  const [valores, setValores] = useState(objetivoVacio(evaluaciones[0]?.evaluationId ?? ''));
  const [errores, setErrores] = useState<{ id: string; texto: string }[]>([]);
  const [envios, setEnvios] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const problemas = erroresDeObjetivo(valores, 'objetivo');
    setErrores(problemas);
    setEnvios((n) => n + 1);
    if (problemas.length > 0) return;
    setEnviando(true);
    setFallo(null);
    const r = await api.crearObjetivo(token, asesoradoId, aObjetivo(valores), intento.actual());
    intento.registrar(r);
    setEnviando(false);
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
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
    <form className="formulario" onSubmit={enviar} noValidate>
      <h3>{COPY_NUTRICION.nuevaVersionDeObjetivo}</h3>
      <ResumenDeErrores titulo="Revisá estos datos:" errores={errores} intento={envios} />
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
