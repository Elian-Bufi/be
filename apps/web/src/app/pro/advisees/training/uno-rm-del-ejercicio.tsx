'use client';

/**
 * DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2, ET2-01 a ET2-04) · el 1RM de referencia en el editor del plan, en un ejercicio en
 * % RM. Las cuentas son del dominio (`repeticion-maxima.ts`); acá se leen y se suman con API-RMX-01 y 02.
 * - **El renglón del ejercicio** dice el 1RM que usa BE y su origen, siempre a la vista («1RM 39 kg · calculado en la
 *   calibración del 25 nov»), la base del % RM («70 % de 39 kg = 27 kg») y, si las cargas no salen de ese 1RM, «Poner las
 *   cargas» o «Recalcular». Nada cambia solo: el profesional toca (ET2-D03).
 * - **El aviso:** un registro más nuevo que se aleja más del 10 % de lo guardado, con «Usar el registro».
 * - **El cuadro «1RM de referencia»** configura: calibración (la cuenta en vivo), el último registro en rango y lo
 *   declarado, con lo guardado debajo. El «?» en la esquina, con el ejemplo resuelto.
 * Sin persona (una plantilla) no hay 1RM: el renglón no aparece.
 */
import {
  avisoEnPalabras,
  baseDelPorcentaje,
  calibrar,
  cargaDelPorcentajeDe,
  COPY_UNO_RM,
  cuentaDelUnoRM,
  esfuerzoEnCampo,
  leerNumero,
  numero,
  origenDelUnoRM,
  unoRMEnUnRenglon,
  type NotacionDelEsfuerzo,
  type SumarUnoRMRequest,
  type UnoRMDelEjercicio,
  type UnoRMVigente,
} from '@be/domain';
import { useCallback, useEffect, useId, useState } from 'react';
import { CampoDeFecha } from '../../../../components/campo-de-fecha';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { Icono } from '../../../../components/icono';
import { api, nuevaClaveDeIdempotencia, type Resultado } from '../../../../lib/api';
import { hoyEnBuenosAires } from '../../../../lib/fecha-en-palabras';
import { mensajeDeFallo } from '../../../../lib/intento';
import { useNombres } from '../../../../lib/nombres-ocultos';
import { useNotacionDelEsfuerzo } from '../notacion-del-esfuerzo';
import type { PrescripcionE } from './ejercicio-del-editor';

type Unidad = 'kg' | 'lb';
type Origen = 'CALIBRATION' | 'RECORD' | 'DECLARED';

export const COPY_UNO_RM_EN_EL_EDITOR = {
  cargando: 'Leyendo el 1RM…',
  noSePudo: 'No se pudo leer el 1RM de referencia.',
  reintentar: 'Reintentar',
  definir: 'Definir el 1RM',
  cambiar: 'Cambiar el 1RM',
  sinPorcentaje: 'Escribí el % RM del ejercicio para ver la carga.',
  alDia: 'Las cargas salen de este 1RM.',
  guardado: (que: string) => `Se guardó el 1RM: ${que}.`,
  queOrigen: '¿De dónde sale?',
  carga: 'Carga',
  repeticiones: 'Repeticiones',
  rir: 'RIR',
  rpe: 'RPE',
  fecha: 'Fecha',
  valor: '1RM',
  nota: 'Nota',
  opcional: 'Opcional',
  laCuenta: 'La cuenta',
  sinRegistro: 'Todavía no hay una serie de la persona en rango en este ejercicio.',
  usarEste: 'Usar este registro',
  registroDel: (fecha: string) => `Registro del ${fecha}`,
  conLaSerie: (carga: string, reps: number, esfuerzo: string) => `${carga} × ${reps} a ${esfuerzo}`,
  vigente: 'El que usa BE',
  ninguno: 'Sin valores guardados todavía.',
  descartarElAviso: 'Seguir con el guardado',
} as const;

/** Lo que lee y suma el renglón: el 1RM del ejercicio, con su estado. */
export function useUnoRM(o: { token: string; asesoradoId: string | null; exerciseId: string | null; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const { token, asesoradoId, exerciseId, sesionPerdida } = o;
  const [estado, setEstado] = useState<'leyendo' | 'listo' | 'falla'>('leyendo');
  const [datos, setDatos] = useState<UnoRMDelEjercicio | null>(null);
  const leer = useCallback(async () => {
    if (!asesoradoId || !exerciseId) return;
    setEstado('leyendo');
    const r = await api.unoRMDeLaPersona(token, asesoradoId, [exerciseId]);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setEstado('falla');
    setDatos(r.datos.data[0] ?? null);
    setEstado('listo');
  }, [token, asesoradoId, exerciseId, sesionPerdida]);
  useEffect(() => {
    void leer();
  }, [leer]);
  const sumar = useCallback(
    async (cuerpo: SumarUnoRMRequest, clave: string): Promise<string | null> => {
      if (!asesoradoId) return null;
      const r = await api.sumarUnoRM(token, asesoradoId, cuerpo, clave);
      if (sesionPerdida(r)) return null;
      if (!r.ok) return mensajeDeFallo(r) || COPY_UNO_RM_EN_EL_EDITOR.noSePudo;
      setDatos(r.datos.data.exercise);
      return null;
    },
    [token, asesoradoId, sesionPerdida],
  );
  return { estado, datos, leer, sumar };
}

const enKilos = (c: { readonly value: number; readonly unit: Unidad }): string => `${numero(c.value, 2)} ${c.unit}`;
/** «RIR 1» o, en un plan en RPE, «RPE 9». */
const esfuerzoEnPalabras = (rir: number, notacion: NotacionDelEsfuerzo): string => (notacion === 'RPE' ? `RPE ${esfuerzoEnCampo(rir, 'RPE')}` : `RIR ${numero(rir, 2)}`);

/** La carga que pide el % RM con el 1RM vigente, o `null` si falta algo o las unidades no coinciden. */
export function cargaQuePideElPorcentaje(p: PrescripcionE, vigente: UnoRMVigente | null, nombre: string): { readonly value: number; readonly unit: Unidad } | null {
  const pct = p.intensity?.criterion === 'PERCENT_RM' ? p.intensity.target.value : null;
  if (!vigente || pct === null || !Number.isFinite(pct) || pct <= 0) return null;
  return cargaDelPorcentajeDe(pct, vigente.valor, nombre, p.loadBasis ?? null);
}

/** Las cargas de las efectivas desde el 1RM: la común, y sin cargas propias en las efectivas (las aproximaciones quedan). */
export function conLasCargasDelUnoRM(p: PrescripcionE, carga: { readonly value: number; readonly unit: Unidad }, vigente: UnoRMVigente): Partial<PrescripcionE> {
  return {
    suggestedLoad: carga,
    sets: p.sets.map((s) => {
      if (s.setKind === 'WARM_UP' || s.suggestedLoad === undefined) return s;
      const { suggestedLoad: _propia, ...resto } = s;
      return resto as typeof s;
    }),
    // La referencia del % RM, a la vista de la persona: de dónde sale el 1RM.
    ...(p.intensity ? { intensity: { ...p.intensity, target: { ...p.intensity.target, reference: { description: unoRMEnUnRenglon(vigente) } } } } : {}),
  };
}

/** Si las cargas de las efectivas ya son las que pide el % RM. */
const cargasAlDia = (p: PrescripcionE, carga: { readonly value: number; readonly unit: Unidad }): boolean => {
  const comun = p.suggestedLoad;
  if (!comun || comun.value !== carga.value || comun.unit !== carga.unit) return false;
  return p.sets.every((s) => s.setKind === 'WARM_UP' || !s.suggestedLoad || (s.suggestedLoad.value === carga.value && s.suggestedLoad.unit === carga.unit));
};

/**
 * El renglón del 1RM, dentro del ejercicio abierto, debajo de sus botones: el 1RM y su origen, la base del % RM y lo que
 * se puede hacer. RP-19: ocupa siempre el mismo lugar (también mientras se lee).
 */
export function RenglonDelUnoRM({
  id,
  nombre,
  prescripcion: p,
  unidad,
  unoRM,
  onCambiar,
}: {
  id: string;
  nombre: string;
  prescripcion: PrescripcionE;
  unidad: Unidad;
  unoRM: ReturnType<typeof useUnoRM>;
  onCambiar: (c: Partial<PrescripcionE>) => void;
}) {
  const T = COPY_UNO_RM_EN_EL_EDITOR;
  const [cuadro, setCuadro] = useState(false);
  const [avisoVisto, setAvisoVisto] = useState<string | null>(null);
  const { estado, datos } = unoRM;
  const vigente = datos?.current ? { origen: datos.current.origin, valor: datos.current.value, fecha: datos.current.localDate, banda: datos.current.band, serie: null, entryId: datos.current.entryId } : null;
  const otraUnidad = !!vigente && vigente.valor.unit !== unidad;
  const carga = otraUnidad ? null : cargaQuePideElPorcentaje(p, vigente, nombre);
  const pct = p.intensity?.target.value ?? null;
  const aviso = datos?.warning ?? null;
  const claveDelAviso = aviso ? `${aviso.record.executionId}|${aviso.record.setIndex}` : null;
  return (
    <div className="uno-rm-del-ejercicio" data-uno-rm={estado} data-uno-rm-origen={vigente?.origen ?? 'NINGUNO'}>
      <div className="uno-rm-del-ejercicio__fila">
        <span className="uno-rm-del-ejercicio__valor" data-uno-rm-vigente>
          <Icono nombre="calculado" tamano={18} />
          {estado === 'leyendo' && !datos ? (
            <span className="nota">{T.cargando}</span>
          ) : estado === 'falla' && !datos ? (
            <span className="nota">{T.noSePudo}</span>
          ) : vigente ? (
            <>
              <strong>
                {COPY_UNO_RM.sigla} {enKilos(vigente.valor)}
              </strong>
              <span className="nota"> · {origenDelUnoRM(vigente.origen, vigente.fecha, vigente.banda)}</span>
            </>
          ) : (
            <span className="nota">{COPY_UNO_RM.sinValor}</span>
          )}
        </span>
        {estado === 'falla' && !datos ? (
          <button type="button" className="boton boton--discreto boton--compacto" onClick={() => void unoRM.leer()}>
            {T.reintentar}
          </button>
        ) : (
          <button type="button" className="boton boton--quieto boton--compacto" onClick={() => setCuadro(true)} data-abrir-uno-rm>
            {vigente ? T.cambiar : T.definir}
          </button>
        )}
      </div>
      {/* RP-19: el renglón de la base y de lo que se puede hacer está siempre, vacío o con su texto. */}
      <p className="nota uno-rm-del-ejercicio__base" role="status" data-base-del-porcentaje>
        {otraUnidad ? (
          COPY_UNO_RM.otraUnidad
        ) : vigente && carga && pct !== null ? (
          <>
            <span data-base-del-porcentaje-texto>{baseDelPorcentaje(pct, vigente.valor, carga)}</span>
            {cargasAlDia(p, carga) ? (
              <span> · {T.alDia}</span>
            ) : (
              <>
                {p.suggestedLoad ? <span> · {COPY_UNO_RM.noCoinciden(enKilos(vigente.valor))}</span> : null}
                <button type="button" className="boton boton--discreto boton--compacto" onClick={() => onCambiar(conLasCargasDelUnoRM(p, carga, vigente))} data-poner-las-cargas>
                  {p.suggestedLoad ? COPY_UNO_RM.recalcular : COPY_UNO_RM.ponerLasCargas}
                </button>
              </>
            )}
          </>
        ) : vigente ? (
          T.sinPorcentaje
        ) : (
          ' '
        )}
      </p>
      {aviso && avisoVisto !== claveDelAviso ? (
        <div className="uno-rm-del-ejercicio__aviso" role="status" data-aviso-del-uno-rm={aviso.relativeDifference}>
          <Icono nombre="info" tamano={18} />
          <span>
            {avisoEnPalabras({
              registro: { valor: aviso.record.value, fecha: aviso.record.localDate, serie: { carga: aviso.record.set.load, repeticiones: aviso.record.set.completedRepetitions, rir: aviso.record.set.rir }, banda: aviso.record.band, executionId: aviso.record.executionId, prescriptionId: aviso.record.prescriptionId, setIndex: aviso.record.setIndex },
              guardado: { entryId: datos?.history[0]?.entryId ?? '', origen: datos?.history[0]?.origin ?? 'CALIBRATION', valor: datos?.history[0]?.value ?? aviso.record.value, fecha: datos?.history[0]?.localDate ?? aviso.record.localDate, registradoEn: '', serie: null, banda: null },
              diferencia: aviso.relativeDifference,
            })}
          </span>
          <span className="uno-rm-del-ejercicio__acciones-del-aviso">
            <UsarElRegistro unoRM={unoRM} registro={aviso.record} exerciseId={datos!.exerciseId} />
            <button type="button" className="boton boton--discreto boton--compacto" onClick={() => setAvisoVisto(claveDelAviso)}>
              {T.descartarElAviso}
            </button>
          </span>
        </div>
      ) : null}
      <CuadroDelUnoRM abierto={cuadro} onCerrar={() => setCuadro(false)} id={id} nombre={nombre} unidad={unidad} unoRM={unoRM} />
    </div>
  );
}

/** «Usar el registro» (API-RMX-02 con `RECORD`): BE lo vuelve a leer y a calcular. */
function UsarElRegistro({ unoRM, registro, exerciseId, texto = COPY_UNO_RM.usarElRegistro }: { unoRM: ReturnType<typeof useUnoRM>; registro: NonNullable<UnoRMDelEjercicio['lastRecord']>; exerciseId: string; texto?: string }) {
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  const [clave] = useState(nuevaClaveDeIdempotencia);
  return (
    <>
      <button
        type="button"
        className="boton boton--quieto boton--compacto"
        disabled={enviando}
        onClick={async () => {
          setEnviando(true);
          const f = await unoRM.sumar({ origin: 'RECORD', exerciseId, executionId: registro.executionId, prescriptionId: registro.prescriptionId, setIndex: registro.setIndex }, clave);
          setEnviando(false);
          setFalla(f);
        }}
        data-usar-el-registro
      >
        {texto}
      </button>
      {falla ? (
        <span className="campo__error" role="alert">
          {falla}
        </span>
      ) : null}
    </>
  );
}

const RIRES = [0, 0.5, 1, 1.5, 2] as const;

/** El cuadro «1RM de referencia»: calibración, el último registro y lo declarado; lo guardado debajo. */
export function CuadroDelUnoRM({ abierto, onCerrar, id, nombre, unidad, unoRM }: { abierto: boolean; onCerrar: () => void; id: string; nombre: string; unidad: Unidad; unoRM: ReturnType<typeof useUnoRM> }) {
  const T = COPY_UNO_RM_EN_EL_EDITOR;
  const propio = useId();
  const notacion = useNotacionDelEsfuerzo();
  // TEST-TAG-004: el autor de cada valor, como lo dice «Ocultar nombres».
  const { delProfesional } = useNombres();
  const hoy = hoyEnBuenosAires();
  const datos = unoRM.datos;
  const [origen, setOrigen] = useState<Origen>('CALIBRATION');
  const [fecha, setFecha] = useState(hoy);
  const [carga, setCarga] = useState('');
  const [u, setU] = useState<Unidad>(unidad);
  const [repeticiones, setRepeticiones] = useState('');
  const [rir, setRir] = useState<number | null>(null);
  const [declarado, setDeclarado] = useState('');
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  const [clave, setClave] = useState(nuevaClaveDeIdempotencia);
  useEffect(() => {
    if (!abierto) return;
    setOrigen(datos?.lastRecord && !datos.current ? 'RECORD' : 'CALIBRATION');
    setFecha(hoy);
    setCarga('');
    setU(unidad);
    setRepeticiones('');
    setRir(null);
    setDeclarado('');
    setNota('');
    setFalla(null);
    setClave(nuevaClaveDeIdempotencia());
    // Solo al abrir: después, lo que se escribe es el borrador del cuadro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);
  const cargaN = leerNumero(carga);
  const repsN = repeticiones.trim() === '' ? null : Number(repeticiones);
  const serie = cargaN !== null && repsN !== null && Number.isInteger(repsN) && rir !== null ? { carga: { value: cargaN, unit: u }, repeticiones: repsN, rir } : null;
  const calibracion = serie ? calibrar(serie) : null;
  const declaradoN = leerNumero(declarado);
  const futura = fecha > hoy;
  const cambiar = <V,>(f: (v: V) => void) => (v: V) => {
    f(v);
    setFalla(null);
    setClave(nuevaClaveDeIdempotencia());
  };
  const apagado =
    origen === 'RECORD'
      ? 'Para usar el registro, tocá «Usar este registro».'
      : futura
        ? 'La fecha no puede ser posterior a hoy.'
        : origen === 'CALIBRATION'
          ? !serie
            ? 'Completá la carga, las repeticiones y el RIR.'
            : calibracion && !calibracion.ok
              ? COPY_UNO_RM.motivo[calibracion.motivo]
              : null
          : declaradoN === null || declaradoN <= 0
            ? 'Escribí el 1RM.'
            : null;
  const guardar = async () => {
    if (apagado || !datos) return;
    setEnviando(true);
    const n = nota.trim() || null;
    const cuerpo: SumarUnoRMRequest =
      origen === 'CALIBRATION'
        ? { origin: 'CALIBRATION', exerciseId: datos.exerciseId, localDate: fecha, load: serie!.carga, completedRepetitions: serie!.repeticiones, rir: serie!.rir, note: n }
        : { origin: 'DECLARED', exerciseId: datos.exerciseId, localDate: fecha, value: { value: declaradoN!, unit: u }, note: n };
    const f = await unoRM.sumar(cuerpo, clave);
    setEnviando(false);
    if (f) return setFalla(f);
    onCerrar();
  };
  const conCambios = carga !== '' || repeticiones !== '' || rir !== null || declarado !== '' || nota !== '';
  const ORIGENES: readonly Origen[] = ['CALIBRATION', 'RECORD', 'DECLARED'];
  return (
    <CuadroEnfocado
      abierto={abierto}
      forma="dialogo"
      ancho
      className="cuadro-del-uno-rm"
      titulo={COPY_UNO_RM.titulo}
      sobretitulo={nombre}
      conCambios={conCambios}
      ocupado={enviando}
      ayuda={{
        nombre: `Qué es el ${COPY_UNO_RM.titulo}`,
        contenido: (
          <div className="ayuda-con-ejemplo" data-ayuda-del-uno-rm>
            <p>{COPY_UNO_RM.queEs}</p>
            <p>{COPY_UNO_RM.calibracionExplicada}</p>
            <p className="ayuda-con-ejemplo__ejemplo" data-ejemplo-resuelto>{COPY_UNO_RM.calibracionEjemplo}</p>
            <p>{COPY_UNO_RM.reglaDelRegistro}</p>
            <p>{COPY_UNO_RM.orientativo}</p>
            <p>{COPY_UNO_RM.masReciente}</p>
            <p className="ayuda-con-ejemplo__ejemplo">{COPY_UNO_RM.ejemploDelPorcentaje}</p>
          </div>
        ),
      }}
      principal={origen === 'RECORD' ? null : { texto: COPY_UNO_RM.guardar, alTocar: () => void guardar(), apagado, enviando, textoEnviando: 'Guardando…' }}
      onCerrar={onCerrar}
    >
      <div className="cuadro-del-uno-rm__cuerpo" data-cuadro-del-uno-rm={origen}>
        {/* DL-199 (ET3, E5): qué es el 1RM ya está en el «?» del cuadro; acá queda para el lector, que lo oye con los orígenes. */}
        <p className="visualmente-oculto" id={`${propio}-que`}>
          {COPY_UNO_RM.queEs}
        </p>
        <div className="control-segmentado" role="radiogroup" aria-label={T.queOrigen} aria-describedby={`${propio}-que`}>
          {ORIGENES.map((o) => (
            <button
              key={o}
              id={`${propio}-origen-${o}`}
              type="button"
              role="radio"
              aria-checked={o === origen}
              tabIndex={o === origen ? 0 : -1}
              className="control-segmentado__opcion"
              onClick={() => setOrigen(o)}
              onKeyDown={(e) => {
                const n = ORIGENES.indexOf(o);
                const otro = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? ORIGENES[(n + 1) % 3] : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? ORIGENES[(n + 2) % 3] : null;
                if (!otro) return;
                e.preventDefault();
                setOrigen(otro);
                document.getElementById(`${propio}-origen-${otro}`)?.focus();
              }}
              data-origen-del-uno-rm={o}
            >
              {COPY_UNO_RM.origenes[o]}
            </button>
          ))}
        </div>
        {origen === 'CALIBRATION' ? (
          <div className="cuadro-del-uno-rm__seccion" data-calibracion>
            <p className="nota">{COPY_UNO_RM.calibracionExplicada}</p>
            <div className="cuadro-del-uno-rm__campos">
              <div className="cuadro-del-uno-rm__fecha">
                <CampoDeFecha id={`${id}-uno-rm-fecha`} etiqueta={T.fecha} value={fecha} max={hoy} onChange={cambiar(setFecha)} />
              </div>
              <div className="campo">
                <label htmlFor={`${id}-uno-rm-carga`}>{T.carga}</label>
                <span className="campo__con-unidad">
                  <input id={`${id}-uno-rm-carga`} inputMode="decimal" value={carga} onChange={(e) => cambiar(setCarga)(e.target.value)} data-calibracion-carga />
                  <select aria-label="Unidad" value={u} onChange={(e) => cambiar(setU)(e.target.value as Unidad)}>
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </span>
              </div>
              <div className="campo">
                <label htmlFor={`${id}-uno-rm-reps`}>{T.repeticiones}</label>
                <input id={`${id}-uno-rm-reps`} inputMode="numeric" value={repeticiones} onChange={(e) => cambiar(setRepeticiones)(e.target.value)} data-calibracion-repeticiones />
              </div>
              <div className="campo">
                <label htmlFor={`${id}-uno-rm-rir`}>{notacion === 'RPE' ? T.rpe : T.rir}</label>
                <select id={`${id}-uno-rm-rir`} value={rir === null ? '' : String(rir)} onChange={(e) => cambiar(setRir)(e.target.value === '' ? null : Number(e.target.value))} data-calibracion-rir>
                  <option value="">Elegir</option>
                  {RIRES.map((r) => (
                    <option key={r} value={String(r)}>
                      {notacion === 'RPE' ? `${esfuerzoEnCampo(r, 'RPE')} (RIR ${numero(r, 1)})` : numero(r, 1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="nota">{COPY_UNO_RM.reglaDeLaCalibracion}</p>
            {/* RP-19: el renglón de la cuenta está siempre. */}
            <p className="cuadro-del-uno-rm__cuenta" role="status" data-cuenta-del-uno-rm>
              <span className="nota">{T.laCuenta}: </span>
              {serie && calibracion?.ok ? <strong>{cuentaDelUnoRM(serie)}</strong> : <span className="nota">{apagado && origen === 'CALIBRATION' && serie ? apagado : '—'}</span>}
            </p>
          </div>
        ) : origen === 'RECORD' ? (
          <div className="cuadro-del-uno-rm__seccion" data-ultimo-registro>
            <p className="nota">{COPY_UNO_RM.reglaDelRegistro}</p>
            {datos?.lastRecord ? (
              <div className="cuadro-del-uno-rm__registro">
                <p>
                  <strong>
                    {COPY_UNO_RM.sigla} {enKilos(datos.lastRecord.value)}
                  </strong>{' '}
                  <span className="nota">· {origenDelUnoRM('RECORD', datos.lastRecord.localDate, datos.lastRecord.band)}</span>
                </p>
                <p className="nota">
                  {T.conLaSerie(enKilos(datos.lastRecord.set.load), datos.lastRecord.set.completedRepetitions, esfuerzoEnPalabras(datos.lastRecord.set.rir, notacion))} ·{' '}
                  {cuentaDelUnoRM({ carga: datos.lastRecord.set.load, repeticiones: datos.lastRecord.set.completedRepetitions, rir: datos.lastRecord.set.rir })}
                </p>
                {datos.lastRecord.band === 'ORIENTATIVE' ? <p className="nota">{COPY_UNO_RM.orientativo}</p> : null}
                {datos.current?.origin === 'RECORD' && datos.current.entryId === null ? (
                  <p className="nota">
                    <Icono nombre="tilde" tamano={15} /> {T.vigente}
                  </p>
                ) : (
                  <UsarElRegistro unoRM={unoRM} registro={datos.lastRecord} exerciseId={datos.exerciseId} texto={T.usarEste} />
                )}
              </div>
            ) : (
              <p className="nota" data-sin-registro>
                {T.sinRegistro}
              </p>
            )}
          </div>
        ) : (
          <div className="cuadro-del-uno-rm__seccion" data-declarado>
            <div className="cuadro-del-uno-rm__campos">
              <div className="cuadro-del-uno-rm__fecha">
                <CampoDeFecha id={`${id}-uno-rm-fecha-declarado`} etiqueta={T.fecha} value={fecha} max={hoy} onChange={cambiar(setFecha)} />
              </div>
              <div className="campo">
                <label htmlFor={`${id}-uno-rm-valor`}>{T.valor}</label>
                <span className="campo__con-unidad">
                  <input id={`${id}-uno-rm-valor`} inputMode="decimal" value={declarado} onChange={(e) => cambiar(setDeclarado)(e.target.value)} data-uno-rm-declarado />
                  <select aria-label="Unidad" value={u} onChange={(e) => cambiar(setU)(e.target.value as Unidad)}>
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </span>
              </div>
            </div>
          </div>
        )}
        {origen !== 'RECORD' ? (
          <div className="campo">
            <label htmlFor={`${id}-uno-rm-nota`}>
              {T.nota} <span className="nota">{T.opcional}</span>
            </label>
            <input id={`${id}-uno-rm-nota`} value={nota} maxLength={300} onChange={(e) => cambiar(setNota)(e.target.value)} />
          </div>
        ) : null}
        {falla ? (
          <p className="campo__error" role="alert">
            {falla}
          </p>
        ) : null}
        <section className="cuadro-del-uno-rm__historia" aria-labelledby={`${propio}-historia`}>
          <h3 id={`${propio}-historia`} className="cuadro-del-uno-rm__subtitulo">
            {COPY_UNO_RM.historial}
          </h3>
          {datos && datos.history.length > 0 ? (
            <ul className="cuadro-del-uno-rm__lista" data-historia-del-uno-rm={datos.history.length}>
              {datos.history.map((h) => (
                <li key={h.entryId}>
                  <strong>{enKilos(h.value)}</strong> <span className="nota">· {origenDelUnoRM(h.origin, h.localDate, h.band)} · {delProfesional(h.author)}</span>
                  {h.set ? <span className="nota"> · {cuentaDelUnoRM({ carga: h.set.load, repeticiones: h.set.completedRepetitions, rir: h.set.rir })}</span> : null}
                  {h.note ? <span className="nota"> · «{h.note}»</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="nota">{T.ninguno}</p>
          )}
        </section>
      </div>
    </CuadroEnfocado>
  );
}

/** El renglón con su lectura: lo dibuja el ejercicio abierto en % RM, con una persona y el ejercicio del catálogo. */
export function UnoRMDelEjercicio(o: {
  id: string;
  nombre: string;
  prescripcion: PrescripcionE;
  unidad: Unidad;
  token: string;
  asesoradoId: string;
  exerciseId: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  onCambiar: (c: Partial<PrescripcionE>) => void;
}) {
  const unoRM = useUnoRM({ token: o.token, asesoradoId: o.asesoradoId, exerciseId: o.exerciseId, sesionPerdida: o.sesionPerdida });
  return <RenglonDelUnoRM id={o.id} nombre={o.nombre} prescripcion={o.prescripcion} unidad={o.unidad} unoRM={unoRM} onCambiar={o.onCambiar} />;
}
