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
import { COPY_ANTROPOMETRIA, ETIQUETA_DE_ORIGEN, type Especificacion } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Aviso, Campo } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { fecha } from '../../../../lib/formato';
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
  protocolVersionId: string;
  origin: 'DIRECT_CAPTURE' | 'SELF_REPORTED';
  /**
   * Cuándo se tomó la medición, en el formato local del campo `datetime-local`. Es de la toma, no del guardado: si
   * cada «Guardar» lo reescribiera, la serie se correría sola y la evolución mostraría un día que no fue
   * (REG-06-152: la observación conserva su momento).
   */
  occurredAt: string;
}

/** ISO → `YYYY-MM-DDTHH:mm` en hora local, que es lo que entiende `datetime-local`. */
const paraElCampo = (iso: string): string => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const filaNueva = (protocolo: string): FilaEnEdicion => ({
  clave: `m-${Math.random().toString(36).slice(2, 9)}`,
  metric: '',
  value: '',
  unit: '',
  protocolVersionId: protocolo,
  origin: 'DIRECT_CAPTURE',
  occurredAt: paraElCampo(new Date().toISOString()),
});

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
    const completo = await api.consultarEvaluacionAntropometrica(token, resumen.evaluationId);
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
  const { token, asesoradoId, sesionPerdida } = useAntropometria();
  const intento = useClaveDeIntento();
  const protocoloPorDefecto = especificaciones[0]?.versionId ?? '';
  const [filas, setFilas] = useState<FilaEnEdicion[]>([]);
  const [contexto, setContexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (!borrador) return setFilas([]);
    setContexto(borrador.context ?? '');
    setFilas(
      borrador.measurements.map((m) => ({
        clave: m.measurementId,
        metric: m.metric,
        value: String(m.magnitude.value),
        unit: m.magnitude.unit,
        protocolVersionId: m.protocol?.protocolVersionId ?? protocoloPorDefecto,
        origin: m.origin === 'SELF_REPORTED' ? 'SELF_REPORTED' : 'DIRECT_CAPTURE',
        // El momento de la toma vuelve del borrador: guardar de nuevo no lo mueve.
        occurredAt: paraElCampo(m.occurredAt),
      })),
    );
  }, [borrador, protocoloPorDefecto]);

  /** Las filas que todavía no están completas: guardar con una a medias las perdería en silencio. */
  const incompletas = () => filas.filter((f) => !(f.metric.trim() && f.value.trim() && f.unit.trim() && f.occurredAt));

  const mediciones = () =>
    filas
      .filter((f) => f.metric.trim() && f.value.trim() && f.unit.trim() && f.occurredAt)
      .map((f) => ({
        metric: f.metric.trim(),
        magnitude: { value: Number(f.value.replace(',', '.')), unit: f.unit.trim() },
        protocolVersionId: f.protocolVersionId,
        origin: f.origin,
        occurredAt: new Date(f.occurredAt).toISOString(),
      }));

  async function crear() {
    if (incompletas().length > 0) return onAviso({ tipo: 'error', texto: COPY_ANTROPOMETRIA.medicionIncompleta });
    setEnviando(true);
    onAviso(null);
    const res = await api.crearBorradorAntropometrico(token, asesoradoId, { occurredAt: new Date().toISOString(), context: contexto.trim() || null, measurements: mediciones() }, intento.actual());
    intento.registrar(res);
    setEnviando(false);
    if (sesionPerdida(res)) return;
    if (!res.ok) return onAviso({ tipo: 'error', texto: mensajeDeFallo(res) });
    onAviso({ tipo: 'exito', texto: COPY_ANTROPOMETRIA.guardado });
    await onCambio();
  }

  async function guardar() {
    if (incompletas().length > 0) return onAviso({ tipo: 'error', texto: COPY_ANTROPOMETRIA.medicionIncompleta });
    if (!borrador) return crear();
    setEnviando(true);
    onAviso(null);
    const res = await api.guardarBorradorAntropometrico(token, borrador.evaluationId, {
      expectedVersion: borrador.version,
      context: contexto.trim() || null,
      measurements: mediciones(),
    });
    setEnviando(false);
    if (sesionPerdida(res)) return;
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
    if (sesionPerdida(res)) return;
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

        <h3>Mediciones</h3>
        {filas.length === 0 ? <p>{COPY_ANTROPOMETRIA.sinBorrador}</p> : null}
        {filas.map((f, i) => (
          <div key={f.clave} className="nodo nodo--dia">
            <Campo id={`ant-metrica-${i}`} etiqueta={COPY_ANTROPOMETRIA.metrica} value={f.metric} onChange={(e) => setFilas((xs) => xs.map((x) => (x.clave === f.clave ? { ...x, metric: e.target.value } : x)))} maxLength={60} />
            <Campo id={`ant-valor-${i}`} etiqueta={COPY_ANTROPOMETRIA.valor} inputMode="decimal" value={f.value} onChange={(e) => setFilas((xs) => xs.map((x) => (x.clave === f.clave ? { ...x, value: e.target.value } : x)))} maxLength={12} />
            <Campo id={`ant-unidad-${i}`} etiqueta={COPY_ANTROPOMETRIA.unidad} value={f.unit} onChange={(e) => setFilas((xs) => xs.map((x) => (x.clave === f.clave ? { ...x, unit: e.target.value } : x)))} maxLength={24} />
            <Campo
              id={`ant-momento-${i}`}
              etiqueta={COPY_ANTROPOMETRIA.momentoDeLaToma}
              type="datetime-local"
              value={f.occurredAt}
              onChange={(e) => setFilas((xs) => xs.map((x) => (x.clave === f.clave ? { ...x, occurredAt: e.target.value } : x)))}
            />
            <div className="campo">
              <label htmlFor={`ant-origen-${i}`}>{COPY_ANTROPOMETRIA.origenDelDato}</label>
              <select
                id={`ant-origen-${i}`}
                value={f.origin}
                onChange={(e) => setFilas((xs) => xs.map((x) => (x.clave === f.clave ? { ...x, origin: e.target.value as FilaEnEdicion['origin'] } : x)))}
              >
                <option value="DIRECT_CAPTURE">{ETIQUETA_DE_ORIGEN.DIRECT_CAPTURE}</option>
                <option value="SELF_REPORTED">{ETIQUETA_DE_ORIGEN.SELF_REPORTED}</option>
              </select>
              <p className="campo__ayuda">{COPY_ANTROPOMETRIA.explicacionDeClases}</p>
            </div>
            <div className="campo">
              <label htmlFor={`ant-protocolo-${i}`}>{COPY_ANTROPOMETRIA.protocolo}</label>
              <select
                id={`ant-protocolo-${i}`}
                value={f.protocolVersionId}
                onChange={(e) => setFilas((xs) => xs.map((x) => (x.clave === f.clave ? { ...x, protocolVersionId: e.target.value } : x)))}
              >
                {especificaciones.map((e) => (
                  <option key={e.versionId} value={e.versionId}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="boton boton--enlace" onClick={() => setFilas((xs) => xs.filter((x) => x.clave !== f.clave))}>
              {COPY_ANTROPOMETRIA.quitarMedicion}
            </button>
          </div>
        ))}
        <div className="acciones">
          <button type="button" className="boton boton--secundario" onClick={() => setFilas((xs) => [...xs, filaNueva(protocoloPorDefecto)])} disabled={!protocoloPorDefecto}>
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
