'use client';

/**
 * NUT-13 Registros (B05:1072-1124) y NUT-12 Estructurar registro libre (B05:1014-1057).
 * - Contraste descriptivo: Prescripto / Registrado / Diferencia observada / Datos faltantes. Sin «82 % adherencia», sin
 *   «bien» ni «mal»; un día sin registro dice «Sin registro», nunca «0 %» ni «No cumplido» (REG-06-125; INV-06-135).
 * - Filtros por período; nunca «cumplidores / no cumplidores».
 * - Una comida fuera del plan se estructura como «Estimación profesional»: la descripción original queda en solo
 *   lectura y se conserva (INV-06-131). El botón dice «Agregar estimación», no «Corregir lo que comió».
 */
import { COPY_NUTRICION, ETIQUETA_DE_UNIDAD, type ContextoDeRevisionResponse, type ElementoDeCatalogo, type Ingesta } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Aviso, Campo } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { dia, fecha } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { EstadoDeLectura, useNutricion } from './nutricion';

type Contexto = ContextoDeRevisionResponse['data'];
const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
const hace = (dias: number) => {
  const d = new Date(`${hoy()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
};

export function VistaDeRegistros() {
  const { token, asesoradoId, sesionPerdida } = useNutricion();
  const [inicio, setInicio] = useState(hace(6));
  const [fin, setFin] = useState(hoy());
  const [r, setR] = useState<Resultado<{ data: Contexto }> | null>(null);

  const cargar = useCallback(async () => {
    setR(null);
    const res = await api.contextoDeRevision(token, asesoradoId, { periodStart: inicio, periodEnd: fin });
    if (sesionPerdida(res)) return;
    setR(res);
  }, [token, asesoradoId, sesionPerdida, inicio, fin]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <div className="secciones">
      <form
        className="fila-de-dato"
        onSubmit={(e) => {
          e.preventDefault();
          void cargar();
        }}
      >
        <Campo id="registros-desde" etiqueta="Desde" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        <Campo id="registros-hasta" etiqueta="Hasta" type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
        <button type="submit" className="boton boton--secundario">
          Ver período
        </button>
      </form>
      <EstadoDeLectura r={r} onReintentar={cargar}>
        {r?.ok ? <Contraste contexto={r.datos.data} onCambio={cargar} /> : null}
      </EstadoDeLectura>
    </div>
  );
}

function Contraste({ contexto, onCambio }: { contexto: Contexto; onCambio: () => void }) {
  const porId = new Map(contexto.registeredIntakes.map((i) => [i.executionId, i]));
  const dias = [...contexto.descriptiveContrast.days].reverse();
  return (
    <>
      <p className="nota">
        Lo prescripto y lo registrado, día por día. Un día o una comida sin registro es «{COPY_NUTRICION.sinRegistro}»: no se interpreta.
      </p>
      {dias.map((d) => (
        <section key={d.date} className="seccion" aria-labelledby={`dia-${d.date}`}>
          <h2 id={`dia-${d.date}`}>{dia(`${d.date}T12:00:00Z`)}</h2>
          {d.dataState === 'NO_DATA' ? <p className="insignia">{COPY_NUTRICION.sinRegistro}</p> : null}
          {d.meals.length > 0 ? (
            <table className="tabla">
              <caption className="nota">{COPY_NUTRICION.prescripto} y {COPY_NUTRICION.registrado.toLowerCase()} por comida</caption>
              <thead>
                <tr>
                  <th scope="col">Comida</th>
                  <th scope="col">{COPY_NUTRICION.registrado}</th>
                  <th scope="col">{COPY_NUTRICION.diferenciaObservada}</th>
                </tr>
              </thead>
              <tbody>
                {d.meals.map((m) => {
                  const ingesta = m.executionId ? porId.get(m.executionId) : undefined;
                  return (
                    <tr key={m.mealId}>
                      <th scope="row">{m.label}</th>
                      <td>
                        {m.state === 'REGISTERED' ? (
                          <>
                            {COPY_NUTRICION.registrado}
                            {ingesta?.observation ? <span className="nota"> · «{ingesta.observation}»</span> : null}
                          </>
                        ) : (
                          COPY_NUTRICION.sinRegistro
                        )}
                      </td>
                      <td>
                        {m.quantityDifferences.length > 0
                          ? m.quantityDifferences.map((q) => (
                              <span key={q.itemId} className="diferencia">
                                {q.name}: prescripto {q.prescribed.value} {ETIQUETA_DE_UNIDAD[q.unit]} · registrado {q.registered.value} {ETIQUETA_DE_UNIDAD[q.unit]} ·{' '}
                                {q.difference > 0 ? '+' : q.difference < 0 ? '−' : ''}
                                {Math.abs(q.difference)} {ETIQUETA_DE_UNIDAD[q.unit]}
                              </span>
                            ))
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : d.planId ? (
            <p className="nota">El plan tiene más de un día tipo y ese día no hay registros que indiquen cuál correspondía.</p>
          ) : (
            <p className="nota">Ese día no había un plan vigente.</p>
          )}
          {d.outsidePrescription.length > 0 ? (
            <>
              <h3>{COPY_NUTRICION.fueraDelPlan}</h3>
              <ul className="lista">
                {d.outsidePrescription.map((o) => {
                  const ingesta = porId.get(o.executionId);
                  return ingesta ? <RegistroLibre key={o.executionId} ingesta={ingesta} onCambio={onCambio} /> : null;
                })}
              </ul>
            </>
          ) : null}
        </section>
      ))}
    </>
  );
}

function RegistroLibre({ ingesta, onCambio }: { ingesta: Ingesta; onCambio: () => void }) {
  const { token, sesionPerdida } = useNutricion();
  const intento = useClaveDeIntento();
  const [abierto, setAbierto] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [gramos, setGramos] = useState('');
  const [alimento, setAlimento] = useState<ElementoDeCatalogo | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [opciones, setOpciones] = useState<ElementoDeCatalogo[]>([]);
  const [fallo, setFallo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const ultima = ingesta.corrections[ingesta.corrections.length - 1];
  const efectiva = ingesta.effectiveView.kind === 'CORRECTED' ? ingesta.corrections.find((c) => c.correctionId === (ingesta.effectiveView as { correctionId: string }).correctionId) : null;

  async function buscar() {
    const r = await api.buscarEnCatalogo(token, busqueda.trim());
    if (sesionPerdida(r)) return;
    setOpciones(r.ok ? r.datos.data : []);
  }

  async function enviar() {
    if (!descripcion.trim()) return setFallo('Describí lo que estimás.');
    const g = gramos.trim() === '' ? null : Number(gramos.replace(',', '.'));
    if (g !== null && !(g > 0)) return setFallo('La cantidad tiene que ser un número mayor que cero.');
    setEnviando(true);
    setFallo(null);
    const r = await api.corregirIngesta(
      token,
      ingesta.executionId,
      {
        reason: 'STRUCTURE_FREE_DESCRIPTION',
        structuredEstimate: { items: [{ catalogItemId: alimento?.catalogItemId ?? null, description: descripcion.trim(), quantity: g === null ? null : { value: g, unit: 'g' } }] },
        estimationStatement: 'Estimación profesional a partir del registro descriptivo.',
      },
      intento.actual(),
    );
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    setAbierto(false);
    onCambio();
  }

  return (
    <li className="lista__item">
      <p>
        <span className="insignia">{COPY_NUTRICION.fueraDelPlan}</span> {fecha(ingesta.occurredAt)}
      </p>
      <p>
        <strong>{COPY_NUTRICION.registroOriginal}:</strong> «{ingesta.description}»
        {ingesta.portionDescription ? ` · porción: ${ingesta.portionDescription}` : ''}
      </p>
      {efectiva ? (
        <p>
          <strong>{COPY_NUTRICION.estimacionProfesional}:</strong>{' '}
          {efectiva.structuredEstimate.items.map((i) => `${i.description}${i.quantity ? ` · ${i.quantity.value} ${ETIQUETA_DE_UNIDAD[i.quantity.unit]}` : ''}`).join('; ')}{' '}
          <span className="nota">
            ({efectiva.author.displayName}, {fecha(efectiva.recordedAt)}
            {ingesta.corrections.length > 1 ? `; ${ingesta.corrections.length} estimaciones en la historia` : ''})
          </span>
        </p>
      ) : null}
      {ultima && !efectiva ? <p className="nota">La historia de estimaciones no se puede resolver.</p> : null}
      {abierto ? (
        <fieldset className="grupo">
          <legend>{COPY_NUTRICION.agregarEstimacion}</legend>
          <Campo id={`est-${ingesta.executionId}-desc`} etiqueta="Qué estimás" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={200} />
          <Campo id={`est-${ingesta.executionId}-g`} etiqueta="Cantidad estimada en gramos (opcional)" inputMode="decimal" value={gramos} onChange={(e) => setGramos(e.target.value)} />
          <div className="fila-de-dato">
            <Campo id={`est-${ingesta.executionId}-buscar`} etiqueta="Alimento del catálogo (opcional)" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            <button type="button" className="boton boton--secundario" onClick={() => void buscar()}>
              Buscar
            </button>
          </div>
          {alimento ? <p>Alimento elegido: {alimento.name}</p> : null}
          {opciones.length > 0 && !alimento ? (
            <ul className="lista">
              {opciones.slice(0, 6).map((o) => (
                <li key={o.catalogItemId}>
                  <button type="button" className="boton boton--enlace" onClick={() => setAlimento(o)}>
                    {o.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {fallo ? (
            <Aviso tipo="error">
              <p>{fallo}</p>
            </Aviso>
          ) : null}
          <div className="acciones">
            <button type="button" className="boton boton--primario" onClick={() => void enviar()} disabled={enviando}>
              {enviando ? 'Guardando…' : COPY_NUTRICION.agregarEstimacion}
            </button>
            <button type="button" className="boton boton--secundario" onClick={() => setAbierto(false)} disabled={enviando}>
              Cancelar
            </button>
          </div>
        </fieldset>
      ) : (
        <button type="button" className="boton boton--enlace" onClick={() => setAbierto(true)}>
          {COPY_NUTRICION.agregarEstimacion}
        </button>
      )}
    </li>
  );
}
