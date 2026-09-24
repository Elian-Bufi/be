'use client';

/**
 * «En preparación» (B10-07; API-ANT-07/08/09/10/11). Es donde se captura, y donde el legajo pone la frontera:
 * - lo que se guarda acá **no es historia**: no alimenta la evolución ni figura como última evaluación registrada
 *   (REG-06-215). La pantalla lo dice, no lo deja implícito;
 * - **registrar es un acto aparte de guardar** (REG-06-214 inciso 4), con su propia confirmación que explica que
 *   después no se edita;
 * - cada medición declara protocolo, unidad de origen y cómo se obtuvo: medido, reportado o importado. La **clase**
 *   del dato se deriva del origen, no la elige quien carga (04:1090).
 */
import { COPY_ANTROPOMETRIA, ETIQUETA_DE_ORIGEN, leerNumero, motivoDeNumeroIlegible, type Especificacion } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Aviso, Campo } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { fecha, numeroEnCampo } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { EstadoDeLectura, useAntropometria } from './antropometria';

type Borrador = {
  evaluationId: string;
  version: string;
  context: string | null;
  measurements: { measurementId: string; metric: string; magnitude: { value: number; unit: string }; dataClass: string; origin: string; occurredAt: string; protocol: { protocolVersionId: string } }[];
};

interface FilaEnEdicion {
  readonly clave: string;
  metric: string;
  value: string;
  unit: string;
}

/** ISO → `YYYY-MM-DDTHH:mm` en hora local, que es lo que entiende `datetime-local`. */
const paraElCampo = (iso: string): string => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const filaNueva = (): FilaEnEdicion => ({ clave: `m-${Math.random().toString(36).slice(2, 9)}`, metric: '', value: '', unit: '' });

export function VistaDePreparacion() {
  const { token, asesoradoId, sesionPerdida, irA } = useAntropometria();
  const [r, setR] = useState<Resultado<{ borrador: Borrador | null; especificaciones: Especificacion[] }> | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    setR(null);
    const [borradores, especificaciones] = await Promise.all([
      api.listarBorradoresAntropometricos(token, asesoradoId),
      api.listarEspecificaciones(token, { kind: 'PROTOCOL' }),
    ]);
    if (sesionPerdida(borradores) || sesionPerdida(especificaciones)) return;
    if (!borradores.ok) return setR(borradores as Resultado<never>);
    if (!especificaciones.ok) return setR(especificaciones as Resultado<never>);
    const resumen = borradores.datos.data[0];
    if (!resumen) return setR({ ok: true, datos: { borrador: null, especificaciones: especificaciones.datos.data } });
    // El borrador se lee en su propia colección (API-ANT-09): la de las registradas no lo devuelve (09v16:1718).
    const completo = await api.consultarBorradorAntropometrico(token, resumen.evaluationId);
    if (sesionPerdida(completo)) return;
    if (!completo.ok) return setR(completo as Resultado<never>);
    setR({ ok: true, datos: { borrador: completo.datos.data as Borrador, especificaciones: especificaciones.datos.data } });
  }, [token, asesoradoId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <EstadoDeLectura r={r} onReintentar={cargar}>
      {r?.ok ? (
        <Preparacion
          borrador={r.datos.borrador}
          especificaciones={r.datos.especificaciones}
          aviso={aviso}
          onAviso={setAviso}
          onCambio={cargar}
          onRegistrada={() => {
            setAviso({ tipo: 'exito', texto: COPY_ANTROPOMETRIA.registroHecho });
            irA('evaluaciones');
          }}
        />
      ) : null}
    </EstadoDeLectura>
  );
}

function Preparacion({
  borrador,
  especificaciones,
  aviso,
  onAviso,
  onCambio,
  onRegistrada,
}: {
  borrador: Borrador | null;
  especificaciones: Especificacion[];
  aviso: { tipo: 'exito' | 'error' | 'info'; texto: string } | null;
  onAviso: (a: { tipo: 'exito' | 'error' | 'info'; texto: string } | null) => void;
  onCambio: () => Promise<void>;
  onRegistrada: () => void;
}) {
  const { token, asesoradoId, sesionPerdida, accesoRetirado } = useAntropometria();
  const intento = useClaveDeIntento();
  const protocoloPorDefecto = especificaciones[0]?.versionId ?? '';
  const [filas, setFilas] = useState<FilaEnEdicion[]>([]);
  const [contexto, setContexto] = useState('');
  /**
   * El momento de la toma y la especificación son de la **evaluación**: una evaluación es una toma, con su protocolo
   * y su origen (09v11 §6). Son de la toma, no del guardado: si cada «Guardar» los reescribiera, la serie se correría
   * sola y la evolución mostraría un día que no fue (REG-06-152).
   */
  const [momento, setMomento] = useState(paraElCampo(new Date().toISOString()));
  const [protocolo, setProtocolo] = useState('');
  const [origen, setOrigen] = useState<'DIRECT_CAPTURE' | 'SELF_REPORTED'>('DIRECT_CAPTURE');
  const [enviando, setEnviando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    setProtocolo((p) => p || protocoloPorDefecto);
    if (!borrador) return setFilas([]);
    setContexto(borrador.context ?? '');
    const primera = borrador.measurements[0];
    if (primera) {
      setMomento(paraElCampo(primera.occurredAt));
      setProtocolo(primera.protocol?.protocolVersionId ?? protocoloPorDefecto);
      setOrigen(primera.origin === 'SELF_REPORTED' ? 'SELF_REPORTED' : 'DIRECT_CAPTURE');
    }
    // El valor se muestra como lo lee una persona, con coma decimal; `leerNumero` lo vuelve a aceptar (DL-091 punto 4).
    setFilas(borrador.measurements.map((m) => ({ clave: m.measurementId, metric: m.metric, value: numeroEnCampo(m.magnitude.value), unit: m.magnitude.unit })));
  }, [borrador, protocoloPorDefecto]);

  /**
   * Lo que le falta a cada fila, por campo: guardar con una a medias las perdería en silencio. El mismo aviso que ya
   * se daba arriba se marca ahora en el campo que falta (B10-10:164-165; DL-091 punto 3).
   */
  const [errores, setErrores] = useState<Record<string, string>>({});
  function revisar(): Record<string, string> {
    const problemas: Record<string, string> = {};
    filas.forEach((f, i) => {
      if (!f.metric.trim()) problemas[`ant-metrica-${i}`] = 'Falta la métrica.';
      if (!f.value.trim()) problemas[`ant-valor-${i}`] = 'Falta el valor.';
      // `leerNumero` acepta coma o punto y devuelve `null` si no es un número (DL-091 punto 4).
      else if (leerNumero(f.value) === null) problemas[`ant-valor-${i}`] = motivoDeNumeroIlegible(f.value);
      if (!f.unit.trim()) problemas[`ant-unidad-${i}`] = 'Falta la unidad.';
    });
    setErrores(problemas);
    return problemas;
  }

  const contenido = () => ({
    occurredAt: new Date(momento).toISOString(),
    specificationVersionId: protocolo,
    source: { type: origen },
    directMeasurements: filas
      .filter((f) => f.metric.trim() && leerNumero(f.value) !== null && f.unit.trim())
      .map((f) => ({ metricCode: f.metric.trim(), value: leerNumero(f.value)!, unit: f.unit.trim() })),
    professionalNotes: contexto.trim() || null,
  });

  async function crear() {
    if (Object.keys(revisar()).length > 0) return onAviso({ tipo: 'error', texto: COPY_ANTROPOMETRIA.medicionIncompleta });
    setEnviando(true);
    onAviso(null);
    const res = await api.crearBorradorAntropometrico(token, asesoradoId, contenido(), intento.actual());
    intento.registrar(res);
    setEnviando(false);
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(res) || accesoRetirado(res)) return;
    if (!res.ok) return onAviso({ tipo: 'error', texto: mensajeDeFallo(res) });
    onAviso({ tipo: 'exito', texto: COPY_ANTROPOMETRIA.guardado });
    await onCambio();
  }

  async function guardar() {
    if (Object.keys(revisar()).length > 0) return onAviso({ tipo: 'error', texto: COPY_ANTROPOMETRIA.medicionIncompleta });
    if (!borrador) return crear();
    setEnviando(true);
    onAviso(null);
    const res = await api.guardarBorradorAntropometrico(token, borrador.evaluationId, { expectedVersion: borrador.version, ...contenido() });
    setEnviando(false);
    if (sesionPerdida(res) || accesoRetirado(res)) return;
    if (!res.ok) return onAviso({ tipo: 'error', texto: mensajeDeFallo(res) });
    onAviso({ tipo: 'exito', texto: COPY_ANTROPOMETRIA.guardado });
    await onCambio();
  }

  async function registrar() {
    if (!borrador) return;
    setEnviando(true);
    const res = await api.registrarEvaluacionAntropometrica(token, borrador.evaluationId, borrador.version, intento.actual());
    intento.registrar(res);
    setEnviando(false);
    setConfirmando(false);
    if (sesionPerdida(res) || accesoRetirado(res)) return;
    if (!res.ok) return onAviso({ tipo: 'error', texto: mensajeDeFallo(res) });
    onRegistrada();
  }

  return (
    <div className="secciones">
      {aviso ? (
        <Aviso tipo={aviso.tipo} enfocar>
          <p>{aviso.texto}</p>
        </Aviso>
      ) : null}

      <section className="seccion" aria-labelledby="titulo-preparacion">
        <h2 id="titulo-preparacion">{borrador ? COPY_ANTROPOMETRIA.borradorEnCurso : COPY_ANTROPOMETRIA.nuevaEvaluacion}</h2>
        <p className="nota">{COPY_ANTROPOMETRIA.borradorNoEsHistoria}</p>
        {borrador ? <p className="nota">Guardado por última vez: {fecha(new Date().toISOString())}</p> : null}

        <Campo id="ant-contexto" etiqueta="Contexto (opcional)" value={contexto} onChange={(e) => setContexto(e.target.value)} maxLength={2000} />

        {/* El momento, el protocolo y el origen son de la toma entera: una evaluación es una toma (09v11 §6). */}
        <Campo id="ant-momento" etiqueta={COPY_ANTROPOMETRIA.momentoDeLaToma} type="datetime-local" value={momento} onChange={(e) => setMomento(e.target.value)} />
        <div className="campo">
          <label htmlFor="ant-protocolo">{COPY_ANTROPOMETRIA.protocolo}</label>
          <select id="ant-protocolo" value={protocolo} onChange={(e) => setProtocolo(e.target.value)}>
            {especificaciones.map((e) => (
              <option key={e.versionId} value={e.versionId}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="ant-origen">{COPY_ANTROPOMETRIA.origenDelDato}</label>
          <select id="ant-origen" value={origen} onChange={(e) => setOrigen(e.target.value as 'DIRECT_CAPTURE' | 'SELF_REPORTED')}>
            <option value="DIRECT_CAPTURE">{ETIQUETA_DE_ORIGEN.DIRECT_CAPTURE}</option>
            <option value="SELF_REPORTED">{ETIQUETA_DE_ORIGEN.SELF_REPORTED}</option>
          </select>
          <p className="campo__ayuda">{COPY_ANTROPOMETRIA.explicacionDeClases}</p>
        </div>

        <h3>Mediciones</h3>
        {filas.length === 0 ? <p>{COPY_ANTROPOMETRIA.sinBorrador}</p> : null}
        {filas.map((f, i) => (
          <div key={f.clave} className="nodo nodo--dia">
            <Campo
              id={`ant-metrica-${i}`}
              etiqueta={COPY_ANTROPOMETRIA.metrica}
              value={f.metric}
              onChange={(e) => setFilas((xs) => xs.map((x) => (x.clave === f.clave ? { ...x, metric: e.target.value } : x)))}
              maxLength={60}
              error={errores[`ant-metrica-${i}`] ?? null}
            />
            <Campo
              id={`ant-valor-${i}`}
              etiqueta={COPY_ANTROPOMETRIA.valor}
              inputMode="decimal"
              value={f.value}
              onChange={(e) => setFilas((xs) => xs.map((x) => (x.clave === f.clave ? { ...x, value: e.target.value } : x)))}
              maxLength={12}
              error={errores[`ant-valor-${i}`] ?? null}
            />
            <Campo
              id={`ant-unidad-${i}`}
              etiqueta={COPY_ANTROPOMETRIA.unidad}
              value={f.unit}
              onChange={(e) => setFilas((xs) => xs.map((x) => (x.clave === f.clave ? { ...x, unit: e.target.value } : x)))}
              maxLength={24}
              error={errores[`ant-unidad-${i}`] ?? null}
            />
            <button type="button" className="boton boton--enlace" onClick={() => {
                // Los avisos van por posición: al quitar una fila las demás se corren, así que se descartan y se
                // recalculan en el próximo guardado, en vez de quedar pegados a la fila equivocada.
                setErrores({});
                setFilas((xs) => xs.filter((x) => x.clave !== f.clave));
              }}>
              {COPY_ANTROPOMETRIA.quitarMedicion}
            </button>
          </div>
        ))}
        <div className="acciones">
          <button type="button" className="boton boton--secundario" onClick={() => setFilas((xs) => [...xs, filaNueva()])} disabled={!protocolo}>
            {COPY_ANTROPOMETRIA.agregarMedicion}
          </button>
          <button type="button" className="boton boton--secundario" onClick={() => void guardar()} disabled={enviando}>
            {COPY_ANTROPOMETRIA.guardarBorrador}
          </button>
          {borrador ? (
            <button type="button" className="boton boton--primario" onClick={() => setConfirmando(true)} disabled={enviando || borrador.measurements.length === 0}>
              {COPY_ANTROPOMETRIA.registrarEvaluacion}
            </button>
          ) : null}
        </div>
        {borrador && borrador.measurements.length === 0 ? <p className="nota">{COPY_ANTROPOMETRIA.sinContenidoRegistrable}</p> : null}
      </section>

      {confirmando && borrador ? (
        <dialog open className="dialogo" aria-labelledby="titulo-registrar">
          <h2 id="titulo-registrar">{COPY_ANTROPOMETRIA.registrarEvaluacion}</h2>
          <p>{COPY_ANTROPOMETRIA.explicacionDeRegistro}</p>
          <div className="acciones">
            <button type="button" className="boton boton--secundario" onClick={() => setConfirmando(false)} disabled={enviando}>
              Volver
            </button>
            <button type="button" className="boton boton--primario" onClick={() => void registrar()} disabled={enviando}>
              {COPY_ANTROPOMETRIA.confirmarRegistro}
            </button>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}
