'use client';

/**
 * «En preparación» (B10-07; API-ANT-07/08/09/10/11). Es donde se captura, y donde el legajo pone la frontera:
 * - lo que se guarda acá **no es historia**: no alimenta la evolución ni figura como última evaluación registrada
 *   (REG-06-215). La pantalla lo dice, no lo deja implícito;
 * - **registrar es un acto aparte de guardar** (REG-06-214 inciso 4), con su propia confirmación que explica que
 *   después no se edita;
 * - cada medición declara protocolo, unidad de origen y cómo se obtuvo: medido, reportado o importado. La **clase**
 *   del dato se deriva del origen, no la elige quien carga (04:1090).
 *
 * La toma se hace sobre la figura (DL-073, opción A; docs/paquetes/WP-IDENTIDAD-VISUAL.md, tramo D):
 * - qué se mide lo declara el protocolo elegido (B10-07 §18): sus métricas, agrupadas por familia (§15), forman la
 *   lista densa de §16 —teclado numérico, el foco pasa al campo siguiente—, que es también la tabla equivalente
 *   obligatoria de la figura (B10-10 §11);
 * - la figura ubica cada métrica que sabe dibujar y marca cuál tiene dato; tocar un punto lleva a su campo. Nunca
 *   califica: no recibe los valores;
 * - lo que el protocolo no declara se sigue pudiendo cargar «fuera del protocolo», como antes.
 * Los contratos de WP-05 no cambian: la pantalla cambia cómo se escribe el valor, no qué se manda.
 */
import {
  COPY_ANTROPOMETRIA,
  ETIQUETA_DE_FAMILIA,
  ETIQUETA_DE_ORIGEN,
  leerNumero,
  metricasDelProtocolo,
  metricasPorFamilia,
  motivoDeNumeroIlegible,
  puntosDeLaFigura,
  repartirEnElProtocolo,
  type Especificacion,
  type MedicionEscrita,
  type MetricaDelProtocolo,
} from '@be/domain';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Aviso, Campo } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { fecha, numeroEnCampo } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { EstadoDeLectura, useAntropometria } from './antropometria';
import { Figura } from './figura';

type Borrador = {
  evaluationId: string;
  version: string;
  context: string | null;
  recordedAt: string;
  measurements: {
    measurementId: string;
    metric: string;
    magnitude: { value: number; unit: string };
    dataClass: string;
    origin: string;
    occurredAt: string;
    recordedAt: string;
    protocol: { protocolVersionId: string };
  }[];
};

/**
 * Cuándo se guardó el borrador por última vez, con lo que dice la API y nunca con la hora de la pantalla. Cada guardado
 * reescribe las mediciones (API-ANT-10), así que la registrada más recientemente es la del último guardado. Sin
 * mediciones, lo único que se sabe es cuándo se abrió. Una hora inventada sería presentar como guardado lo que no
 * consta (B10-07 §8.1).
 */
function ultimoGuardado(b: Borrador): { rotulo: string; momento: string } {
  const masReciente = b.measurements.map((m) => m.recordedAt).sort().at(-1);
  return masReciente ? { rotulo: 'Guardado por última vez', momento: masReciente } : { rotulo: 'Abierta el', momento: b.recordedAt };
}

/** Una medición que el protocolo no declara: se carga libre, como en WP-05. */
interface FilaLibre {
  readonly clave: string;
  metric: string;
  value: string;
  unit: string;
}

/** El valor escrito para una métrica del protocolo, tal como lo lee una persona, y su unidad de origen. */
interface Escrito {
  valor: string;
  unidad: string;
}

/** ISO → `YYYY-MM-DDTHH:mm` en hora local, que es lo que entiende `datetime-local`. */
const paraElCampo = (iso: string): string => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const filaNueva = (): FilaLibre => ({ clave: `m-${Math.random().toString(36).slice(2, 9)}`, metric: '', value: '', unit: '' });
const idDelValor = (clave: string) => `ant-valor-${clave}`;

/** Una medición escrita para repartir entre los campos y lo de fuera del protocolo; `fila` es la clave de su fila. */
type MedicionConFila = MedicionEscrita & { readonly fila: string };
const deLaFila = (f: FilaLibre): MedicionConFila => ({ fila: f.clave, metrica: f.metric, valor: f.value, unidad: f.unit });
const aLaFila = (m: MedicionConFila): FilaLibre => ({ clave: m.fila, metric: m.metrica, value: m.valor, unit: m.unidad });
const aLosCampos = (enSuCampo: Map<string, MedicionConFila>): Record<string, Escrito> =>
  Object.fromEntries([...enSuCampo].map(([clave, m]) => [clave, { valor: m.valor, unidad: m.unidad.trim() }]));

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
  const [escritos, setEscritos] = useState<Record<string, Escrito>>({});
  const [libres, setLibres] = useState<FilaLibre[]>([]);
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
  const [activa, setActiva] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  /** Las métricas que declara el protocolo elegido (B10-07 §18): lo que la figura y la lista ofrecen. */
  const metricas = useMemo(() => metricasDelProtocolo(especificaciones.find((e) => e.versionId === protocolo)?.content), [especificaciones, protocolo]);

  useEffect(() => {
    setProtocolo((p) => p || protocoloPorDefecto);
    if (!borrador) {
      setEscritos({});
      setLibres([]);
      return;
    }
    setContexto(borrador.context ?? '');
    const primera = borrador.measurements[0];
    const protocoloDelBorrador = primera?.protocol?.protocolVersionId ?? protocoloPorDefecto;
    if (primera) {
      setMomento(paraElCampo(primera.occurredAt));
      setProtocolo(protocoloDelBorrador);
      setOrigen(primera.origin === 'SELF_REPORTED' ? 'SELF_REPORTED' : 'DIRECT_CAPTURE');
    }
    // Lo que el protocolo del borrador declara, en una unidad que admite, va a su campo; lo demás, fuera del protocolo.
    // El valor se muestra como lo lee una persona, con coma decimal; `leerNumero` lo vuelve a aceptar (DL-091 punto 4).
    const { enSuCampo, fuera } = repartirEnElProtocolo(
      borrador.measurements.map((m): MedicionConFila => ({ fila: m.measurementId, metrica: m.metric, valor: numeroEnCampo(m.magnitude.value), unidad: m.magnitude.unit })),
      metricasDelProtocolo(especificaciones.find((e) => e.versionId === protocoloDelBorrador)?.content),
    );
    setEscritos(aLosCampos(enSuCampo));
    setLibres(fuera.map(aLaFila));
  }, [borrador, protocoloPorDefecto, especificaciones]);

  /**
   * Cambiar de protocolo no pierde nada, en ninguna dirección (`repartirEnElProtocolo`): lo que el nuevo no declara —o
   * declara en otra unidad— pasa a las mediciones fuera del protocolo, y una medición cargada fuera del protocolo que
   * el nuevo declara en esa unidad pasa a su campo. Lo que ya estaba en un campo va primero: si el nuevo lo declara,
   * conserva su campo. La unidad nunca se convierte (B10-07 §17).
   */
  function cambiarProtocolo(nuevo: string) {
    const deLosCampos = Object.entries(escritos)
      .filter(([, e]) => e.valor.trim() !== '')
      .map(([clave, e]): MedicionConFila => ({ fila: filaNueva().clave, metrica: clave, valor: e.valor, unidad: e.unidad }));
    const { enSuCampo, fuera } = repartirEnElProtocolo(
      [...deLosCampos, ...libres.map(deLaFila)],
      metricasDelProtocolo(especificaciones.find((e) => e.versionId === nuevo)?.content),
    );
    // Las filas que ya estaban fuera del protocolo conservan su lugar; las que salen de un campo se suman al final.
    const salen = new Set(deLosCampos.map((m) => m.fila));
    setEscritos(aLosCampos(enSuCampo));
    setLibres([...fuera.filter((m) => !salen.has(m.fila)), ...fuera.filter((m) => salen.has(m.fila))].map(aLaFila));
    setErrores({});
    setProtocolo(nuevo);
  }

  const escritoDe = (m: MetricaDelProtocolo): Escrito => escritos[m.clave] ?? { valor: '', unidad: m.unidades[0]! };
  const conDato = new Set(metricas.filter((m) => leerNumero(escritoDe(m).valor) !== null).map((m) => m.clave));
  const puntos = puntosDeLaFigura(metricas, conDato);

  /**
   * Lo que le falta a cada medición, por campo: guardar con una a medias las perdería en silencio. El mismo aviso que
   * se da arriba se marca en el campo que falta (B10-10:164-165; DL-091 punto 3).
   */
  function revisar(): Record<string, string> {
    const problemas: Record<string, string> = {};
    for (const m of metricas) {
      const texto = escritoDe(m).valor;
      // `leerNumero` acepta coma o punto y devuelve `null` si no es un número (DL-091 punto 4).
      if (texto.trim() !== '' && leerNumero(texto) === null) problemas[idDelValor(m.clave)] = motivoDeNumeroIlegible(texto);
    }
    libres.forEach((f, i) => {
      if (!f.metric.trim()) problemas[`ant-metrica-${i}`] = 'Falta la métrica.';
      if (!f.value.trim()) problemas[`ant-valor-libre-${i}`] = 'Falta el valor.';
      else if (leerNumero(f.value) === null) problemas[`ant-valor-libre-${i}`] = motivoDeNumeroIlegible(f.value);
      if (!f.unit.trim()) problemas[`ant-unidad-${i}`] = 'Falta la unidad.';
    });
    setErrores(problemas);
    return problemas;
  }

  const contenido = () => ({
    occurredAt: new Date(momento).toISOString(),
    specificationVersionId: protocolo,
    source: { type: origen },
    directMeasurements: [
      ...metricas
        .filter((m) => leerNumero(escritoDe(m).valor) !== null)
        .map((m) => ({ metricCode: m.clave, value: leerNumero(escritoDe(m).valor)!, unit: escritoDe(m).unidad })),
      ...libres
        .filter((f) => f.metric.trim() && leerNumero(f.value) !== null && f.unit.trim())
        .map((f) => ({ metricCode: f.metric.trim(), value: leerNumero(f.value)!, unit: f.unit.trim() })),
    ],
    professionalNotes: contexto.trim() || null,
  });

  /**
   * Guarda el contenido tal como está en la pantalla y devuelve el borrador que la API confirmó, o `null` si no se
   * pudo guardar (ya avisado). La usan «Guardar» y «Registrar evaluación» por igual: registrar sin pasar por acá
   * registraría lo último que quedó guardado en el servidor, no lo que la pantalla muestra —una sorpresa que
   * REG-06-214 inciso 4 no admite. Guardar y registrar siguen siendo dos actos y dos llamadas separadas; esto solo
   * asegura que el segundo parta siempre del primero.
   */
  async function guardarContenido(): Promise<Borrador | null> {
    if (Object.keys(revisar()).length > 0) {
      onAviso({ tipo: 'error', texto: COPY_ANTROPOMETRIA.medicionIncompleta });
      return null;
    }
    const res = borrador
      ? await api.guardarBorradorAntropometrico(token, borrador.evaluationId, { expectedVersion: borrador.version, ...contenido() })
      : await api.crearBorradorAntropometrico(token, asesoradoId, contenido(), intento.actual());
    if (!borrador) intento.registrar(res);
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(res) || accesoRetirado(res)) return null;
    if (!res.ok) {
      onAviso({ tipo: 'error', texto: mensajeDeFallo(res) });
      return null;
    }
    return res.datos.data as Borrador;
  }

  async function guardar() {
    setEnviando(true);
    onAviso(null);
    const fresco = await guardarContenido();
    setEnviando(false);
    if (!fresco) return;
    onAviso({ tipo: 'exito', texto: COPY_ANTROPOMETRIA.guardado });
    await onCambio();
  }

  async function registrar() {
    if (!borrador) return;
    setEnviando(true);
    onAviso(null);
    const fresco = await guardarContenido();
    if (!fresco) {
      setEnviando(false);
      setConfirmando(false);
      return;
    }
    // Lo que había en pantalla pudo vaciarse al guardar (la última fila libre, quitada; el último campo, borrado).
    if (fresco.measurements.length === 0) {
      setEnviando(false);
      setConfirmando(false);
      onAviso({ tipo: 'error', texto: COPY_ANTROPOMETRIA.sinContenidoRegistrable });
      await onCambio();
      return;
    }
    const res = await api.registrarEvaluacionAntropometrica(token, fresco.evaluationId, fresco.version, intento.actual());
    intento.registrar(res);
    setEnviando(false);
    setConfirmando(false);
    if (sesionPerdida(res) || accesoRetirado(res)) return;
    if (!res.ok) return onAviso({ tipo: 'error', texto: mensajeDeFallo(res) });
    onRegistrada();
  }

  /** Tocar un punto de la figura lleva al campo de esa medición: la figura ubica, la lista carga. */
  function elegirEnLaFigura(clave: string) {
    const campo = document.getElementById(idDelValor(clave));
    campo?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    campo?.focus({ preventScroll: true });
  }

  const escribir = (m: MetricaDelProtocolo, cambio: Partial<Escrito>) => setEscritos((xs) => ({ ...xs, [m.clave]: { ...escritoDe(m), ...cambio } }));
  const hayMedicionesGuardadas = !!borrador && borrador.measurements.length > 0;
  const guardado = borrador ? ultimoGuardado(borrador) : null;

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
        {guardado ? (
          <p className="nota">
            {guardado.rotulo}: {fecha(guardado.momento)}
          </p>
        ) : null}

        {/* El momento, el protocolo y el origen son de la toma entera: una evaluación es una toma (09v11 §6). */}
        <div className="grilla-de-datos">
          <Campo id="ant-momento" etiqueta={COPY_ANTROPOMETRIA.momentoDeLaToma} type="datetime-local" value={momento} onChange={(e) => setMomento(e.target.value)} />
          <div className="campo">
            <label htmlFor="ant-protocolo">{COPY_ANTROPOMETRIA.protocolo}</label>
            <select id="ant-protocolo" value={protocolo} onChange={(e) => cambiarProtocolo(e.target.value)}>
              {especificaciones.map((e) => (
                <option key={e.versionId} value={e.versionId}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="ant-origen">{COPY_ANTROPOMETRIA.origenDelDato}</label>
            <select id="ant-origen" value={origen} onChange={(e) => setOrigen(e.target.value as 'DIRECT_CAPTURE' | 'SELF_REPORTED')} aria-describedby="ant-origen-ayuda">
              <option value="DIRECT_CAPTURE">{ETIQUETA_DE_ORIGEN.DIRECT_CAPTURE}</option>
              <option value="SELF_REPORTED">{ETIQUETA_DE_ORIGEN.SELF_REPORTED}</option>
            </select>
            <p className="campo__ayuda" id="ant-origen-ayuda">
              {COPY_ANTROPOMETRIA.explicacionDeClases}
            </p>
          </div>
          <Campo id="ant-contexto" etiqueta="Contexto (opcional)" value={contexto} onChange={(e) => setContexto(e.target.value)} maxLength={2000} />
        </div>

        <h3>Mediciones</h3>
        {metricas.length > 0 ? (
          <div className={`toma${puntos.length > 0 ? '' : ' toma--sin-figura'}`}>
            {puntos.length > 0 ? (
              <div className="toma__figura">
                <Figura puntos={puntos} activa={activa} onElegir={elegirEnLaFigura} />
                <p className="nota">Tocá un punto para ir a su campo. La lista tiene las mismas mediciones, en el orden del protocolo.</p>
              </div>
            ) : null}
            <div className="toma__lista">
              {metricasPorFamilia(metricas).map((g) => (
                <fieldset key={g.familia} className="grupo">
                  <legend>{ETIQUETA_DE_FAMILIA[g.familia]}</legend>
                  <ul className="medidas">
                    {g.metricas.map((m) => {
                      const e = escritoDe(m);
                      const error = errores[idDelValor(m.clave)];
                      return (
                        <li key={m.clave} className={`medida${activa === m.clave ? ' medida--activa' : ''}`}>
                          <label htmlFor={idDelValor(m.clave)} className="medida__nombre">
                            {m.nombre}
                          </label>
                          <span className="medida__entrada">
                            <input
                              id={idDelValor(m.clave)}
                              inputMode="decimal"
                              autoComplete="off"
                              value={e.valor}
                              maxLength={12}
                              onFocus={() => setActiva(m.clave)}
                              onBlur={() => setActiva((a) => (a === m.clave ? null : a))}
                              onChange={(ev) => escribir(m, { valor: ev.target.value })}
                              aria-invalid={error ? true : undefined}
                              aria-describedby={error ? `${idDelValor(m.clave)}-error` : undefined}
                            />
                            {m.unidades.length > 1 ? (
                              <select aria-label={`Unidad de ${m.nombre}`} value={e.unidad} onChange={(ev) => escribir(m, { unidad: ev.target.value })}>
                                {m.unidades.map((u) => (
                                  <option key={u} value={u}>
                                    {u}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="medida__unidad">{m.unidades[0]}</span>
                            )}
                          </span>
                          {/* El estado se dice con texto, no solo con el punto de la figura (B10-10 §1). */}
                          <span className="medida__estado">{conDato.has(m.clave) ? 'Cargado' : 'Sin cargar'}</span>
                          {error ? (
                            <p id={`${idDelValor(m.clave)}-error`} className="campo__error">
                              <span aria-hidden="true">⚠ </span>
                              {error}
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              ))}
            </div>
          </div>
        ) : null}

        {metricas.length > 0 ? (
          <>
            <h4>Fuera del protocolo</h4>
            <p className="nota">Lo que el protocolo elegido no declara se carga acá, con qué se midió y su unidad.</p>
          </>
        ) : null}
        {libres.length === 0 && metricas.length === 0 && !hayMedicionesGuardadas ? <p>{COPY_ANTROPOMETRIA.sinBorrador}</p> : null}
        {libres.map((f, i) => (
          <div key={f.clave} className="nodo fila-de-dato">
            <Campo
              id={`ant-metrica-${i}`}
              etiqueta={COPY_ANTROPOMETRIA.metrica}
              value={f.metric}
              onChange={(e) => setLibres((xs) => xs.map((x) => (x.clave === f.clave ? { ...x, metric: e.target.value } : x)))}
              maxLength={60}
              error={errores[`ant-metrica-${i}`] ?? null}
            />
            <Campo
              id={`ant-valor-libre-${i}`}
              etiqueta={COPY_ANTROPOMETRIA.valor}
              inputMode="decimal"
              value={f.value}
              onChange={(e) => setLibres((xs) => xs.map((x) => (x.clave === f.clave ? { ...x, value: e.target.value } : x)))}
              maxLength={12}
              error={errores[`ant-valor-libre-${i}`] ?? null}
            />
            <Campo
              id={`ant-unidad-${i}`}
              etiqueta={COPY_ANTROPOMETRIA.unidad}
              value={f.unit}
              onChange={(e) => setLibres((xs) => xs.map((x) => (x.clave === f.clave ? { ...x, unit: e.target.value } : x)))}
              maxLength={24}
              error={errores[`ant-unidad-${i}`] ?? null}
            />
            <button
              type="button"
              className="boton boton--enlace"
              onClick={() => {
                // Los avisos van por posición: al quitar una fila las demás se corren, así que se descartan y se
                // recalculan en el próximo guardado, en vez de quedar pegados a la fila equivocada.
                setErrores({});
                setLibres((xs) => xs.filter((x) => x.clave !== f.clave));
              }}
            >
              {COPY_ANTROPOMETRIA.quitarMedicion}
            </button>
          </div>
        ))}
        <div className="acciones">
          <button type="button" className="boton boton--secundario" onClick={() => setLibres((xs) => [...xs, filaNueva()])} disabled={!protocolo}>
            {metricas.length > 0 ? 'Agregar otra medición' : COPY_ANTROPOMETRIA.agregarMedicion}
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
