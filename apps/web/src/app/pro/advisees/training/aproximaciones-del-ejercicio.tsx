'use client';

/**
 * DL-196 (WP-EDITOR-ENTRENAMIENTO, EE-07; E9 y E17) · la mini sección «Aproximaciones», antes de las series efectivas: la
 * carga de trabajo, cuántas aproximaciones y el modo («Por %», que calcula BE, o «A mano»). En «Por %», los porcentajes,
 * el redondeo y la vista previa con su base («40 % de 100 kg = 40 kg»). Las series quedan en la tabla, arriba de las
 * efectivas y en un tono más suave; ahí se puede tocar cada carga.
 */
import { MAXIMO_DE_APROXIMACIONES, porcentajesPara, type AproximacionesDelEjercicio, type PasoDeRedondeo } from '@be/domain';
import { useId, useState } from 'react';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';
import { Icono } from '../../../../components/icono';
import { numeroEnCampo } from '../../../../lib/formato';
import {
  aproximacionesPorOmision,
  cargaDeTrabajo,
  coincidenConLosPorcentajes,
  conAproximacionesCalculadas,
  conCantidadAMano,
  cuantasAproximaciones,
  PASOS_DE_REDONDEO,
  unidadDeLaPrescripcion,
  ajusteDeLasAproximaciones,
} from './aproximaciones';
import type { PrescripcionE } from './ejercicio-del-editor';

export const COPY_APROXIMACIONES = {
  titulo: 'Aproximaciones',
  cargaDeTrabajo: 'Carga de trabajo',
  cuantas: 'Cuántas',
  ninguna: 'Ninguna',
  modo: 'Cómo',
  porPorcentaje: 'Por porcentaje',
  aMano: 'A mano',
  redondeo: 'Redondeo',
  aMultiplosDe: (paso: number, unidad: string) => `de a ${numeroEnCampo(paso)} ${unidad}`,
  porcentaje: (n: number) => `Porcentaje de la aproximación ${n}`,
  sinCarga: 'Escribí la carga de trabajo para que BE calcule las aproximaciones.',
  noCoinciden: 'Las cargas de la tabla no son las que salen de los porcentajes.',
  recalcular: 'Recalcular',
  pasarAMano: 'Dejarlas a mano',
  porcentajes: 'Porcentajes de la carga de trabajo',
  vistaPrevia: (reps: number, carga: number, unidad: string) => `${reps} × ${numeroEnCampo(carga)} ${unidad}`,
  base: (carga: number, unidad: string) => `Base: ${numeroEnCampo(carga)} ${unidad}, la carga de trabajo`,
  queSon:
    'Las aproximaciones son series con menos carga, antes de las efectivas, para llegar a la carga de trabajo. Se indican y se registran, pero no entran en las cuentas ni en los gráficos.',
  comoSeCalculan:
    'Por porcentaje: BE calcula cada una como una parte de la carga de trabajo (por ejemplo, 40, 60 y 80 % de la carga de trabajo) y la redondea al múltiplo que elijas: sin decimales raros, porque no todos los gimnasios tienen discos chicos. Las repeticiones bajan a medida que la carga sube (8, 5 y 3).',
  redondeoPorOmision: 'El redondeo sale del implemento: máquina de placas, de a 5; barra o discos, de a 2,5; mancuernas livianas (hasta unos 10 kg), de a 1. Lo cambiás cuando quieras.',
  aManoExplica: 'A mano: escribís cada una en la tabla, arriba de las efectivas. Podés tocar cualquier carga también en «Por porcentaje»: BE avisa que ya no coincide y no pisa nada.',
} as const;
const T = COPY_APROXIMACIONES;

export function SeccionDeAproximaciones({
  id,
  nombre,
  prescripcion: p,
  config,
  onCambiar,
  onConfig,
}: {
  id: string;
  nombre: string;
  prescripcion: PrescripcionE;
  /** Cómo se armaron (de la planificación), o `null` si todavía no se dijo. */
  config: AproximacionesDelEjercicio | null;
  onCambiar: (c: Partial<PrescripcionE>) => void;
  /** Guarda cómo se arman; si el ejercicio no tiene identificador, el editor le pone uno. */
  onConfig: (c: Omit<AproximacionesDelEjercicio, 'prescriptionId'>) => void;
}) {
  const propio = useId();
  const unidad = unidadDeLaPrescripcion(p);
  const trabajo = cargaDeTrabajo(p);
  const cuantas = cuantasAproximaciones(p);
  const actual = config ?? aproximacionesPorOmision(p, nombre, '');
  const [cargaEscrita, setCargaEscrita] = useState<string | null>(null);

  /** Escribe la configuración y, en «Por %», las series que salen de ella. */
  const aplicar = (c: Omit<AproximacionesDelEjercicio, 'prescriptionId'>, conCarga = p) => {
    onConfig(c);
    if (c.mode === 'FROM_WORKING_LOAD') {
      const sets = conAproximacionesCalculadas(conCarga, { ...c, prescriptionId: '' });
      if (sets) onCambiar({ ...(conCarga !== p ? { suggestedLoad: conCarga.suggestedLoad } : {}), sets: [...sets] });
      else if (conCarga !== p) onCambiar({ suggestedLoad: conCarga.suggestedLoad });
    }
  };
  const cambiarCuantas = (n: number) => {
    // Sin carga de trabajo todavía, las series se suman vacías: se calculan apenas se escriba la carga.
    if (actual.mode === 'MANUAL' || n === 0 || trabajo === null) {
      onConfig({ ...actual, workingLoadShares: n === 0 ? actual.workingLoadShares : [...porcentajesPara(n)] });
      return onCambiar({ sets: [...conCantidadAMano(p, n)] });
    }
    aplicar({ mode: 'FROM_WORKING_LOAD', workingLoadShares: [...porcentajesPara(n)], step: actual.step });
  };
  const noCoinciden = actual.mode === 'FROM_WORKING_LOAD' && cuantas > 0 && trabajo !== null && !coincidenConLosPorcentajes(p, { ...actual, prescriptionId: '' });
  const previas = actual.mode === 'FROM_WORKING_LOAD' && trabajo !== null && cuantas > 0 ? conAproximacionesCalculadas(p, { ...actual, prescriptionId: '' }) : null;
  return (
    <section className="aproximaciones-del-ejercicio con-ayuda-en-la-esquina" aria-labelledby={`${propio}-titulo`} data-aproximaciones data-recorrido="editor-entrenamiento-aproximaciones">
      <p id={`${propio}-titulo`} className="ejercicio-del-plan__subtitulo">
        {T.titulo}
      </p>
      <ExplicacionAPedido nombre="Qué son las aproximaciones" como="div" lugar="esquina">
        <p>{T.queSon}</p>
        <p>{T.comoSeCalculan}</p>
        <p>{T.redondeoPorOmision}</p>
        <p>{T.aManoExplica}</p>
      </ExplicacionAPedido>
      <div className="aproximaciones-del-ejercicio__renglon">
        <div className="campo">
          <label htmlFor={`${id}-trabajo`}>{T.cargaDeTrabajo}</label>
          <span className="datos-del-plan__con-unidad">
            <input
              id={`${id}-trabajo`}
              inputMode="decimal"
              value={cargaEscrita ?? (trabajo === null ? '' : numeroEnCampo(trabajo))}
              onChange={(e) => {
                setCargaEscrita(e.target.value);
                const n = Number(e.target.value.replace(',', '.'));
                const conCarga: PrescripcionE = { ...p, suggestedLoad: e.target.value.trim() === '' ? null : Number.isFinite(n) && n >= 0 ? { value: n, unit: unidad } : { value: Number.NaN, unit: unidad } };
                if (actual.mode === 'FROM_WORKING_LOAD' && cuantas > 0) aplicar(actual, conCarga);
                else onCambiar({ suggestedLoad: conCarga.suggestedLoad });
              }}
              onBlur={() => setCargaEscrita(null)}
              data-carga-de-trabajo
            />
            <span className="nota">{unidad}</span>
          </span>
        </div>
        <div className="campo">
          <label htmlFor={`${id}-cuantas`}>{T.cuantas}</label>
          <select id={`${id}-cuantas`} value={cuantas} onChange={(e) => cambiarCuantas(Number(e.target.value))} data-cuantas-aproximaciones>
            {Array.from({ length: MAXIMO_DE_APROXIMACIONES + 1 }, (_, n) => (
              <option key={n} value={n}>
                {n === 0 ? T.ninguna : n}
              </option>
            ))}
          </select>
        </div>
        <fieldset className="segmentos aproximaciones-del-ejercicio__modo" disabled={cuantas === 0}>
          <legend>{T.modo}</legend>
          <div className="segmentos__fila">
            {(
              [
                ['FROM_WORKING_LOAD', T.porPorcentaje],
                ['MANUAL', T.aMano],
              ] as const
            ).map(([modo, texto]) => (
              <label key={modo} className="segmento">
                <input type="radio" name={`${id}-modo`} checked={actual.mode === modo} onChange={() => (modo === 'FROM_WORKING_LOAD' ? aplicar({ ...actual, mode: 'FROM_WORKING_LOAD' }) : onConfig({ ...actual, mode: 'MANUAL' }))} data-modo-aproximaciones={modo} />
                {texto}
              </label>
            ))}
          </div>
        </fieldset>
        {actual.mode === 'FROM_WORKING_LOAD' && cuantas > 0 ? (
          <div className="campo">
            <label htmlFor={`${id}-redondeo`}>{T.redondeo}</label>
            <select id={`${id}-redondeo`} value={actual.step} onChange={(e) => aplicar({ ...actual, step: Number(e.target.value) as PasoDeRedondeo })} data-redondeo>
              {PASOS_DE_REDONDEO.map((x) => (
                <option key={x} value={x}>
                  {T.aMultiplosDe(x, unidad)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      {actual.mode === 'FROM_WORKING_LOAD' && cuantas > 0 ? (
        <div className="aproximaciones-del-ejercicio__porcentajes" role="group" aria-labelledby={`${propio}-porcentajes`}>
          <span id={`${propio}-porcentajes`} className="nota">
            {T.porcentajes}
          </span>
          {actual.workingLoadShares.slice(0, cuantas).map((pct, n) => (
            <CampoDePorcentaje
              key={n}
              n={n + 1}
              valor={pct}
              onValor={(v) => aplicar({ ...actual, workingLoadShares: actual.workingLoadShares.map((x, m) => (m === n ? v : x)) })}
            />
          ))}
          <span className="nota aproximaciones-del-ejercicio__base" data-base-de-las-aproximaciones>
            {trabajo === null ? T.sinCarga : T.base(trabajo, unidad)}
          </span>
        </div>
      ) : null}
      {previas ? (
        <p className="nota aproximaciones-del-ejercicio__vista-previa" data-vista-previa-de-aproximaciones>
          {previas
            .filter((s) => s.setKind === 'WARM_UP')
            .map((s) => T.vistaPrevia(s.repetitions && 'value' in s.repetitions ? s.repetitions.value : 0, s.suggestedLoad?.value ?? 0, unidad))
            .join(' · ')}
        </p>
      ) : null}
      {/* DL-197 (ET1-D07): si alguna bajó para no repetir, o entran menos, se dice en su renglón reservado (RP-19). */}
      {actual.mode === 'FROM_WORKING_LOAD' ? (
        <p className="nota aproximaciones-del-ejercicio__ajuste" role="status" data-ajuste-de-aproximaciones>
          {ajusteDeLasAproximaciones(p, { ...actual, prescriptionId: '' }) ?? ' '}
        </p>
      ) : null}
      {/* RP-19: el aviso tiene su renglón reservado mientras se calcula «Por porcentaje»: al tocar una carga de la tabla,
          aparece sin correr la tabla de abajo. No pisa nada: «Recalcular» o dejarlas a mano. */}
      {actual.mode === 'FROM_WORKING_LOAD' && cuantas > 0 ? (
        <div className="aproximaciones-del-ejercicio__lugar-del-aviso" role="status" data-lugar-del-aviso-de-aproximaciones>
          {noCoinciden ? (
            <p className="aviso-en-linea aproximaciones-del-ejercicio__no-coinciden" data-aproximaciones-no-coinciden>
              <Icono nombre="aviso" tamano={15} />
              {T.noCoinciden}
              <button type="button" className="boton boton--discreto" onClick={() => aplicar(actual)} data-recalcular-aproximaciones>
                <Icono nombre="actualizar" tamano={15} />
                {T.recalcular}
              </button>
              <button type="button" className="boton boton--discreto" onClick={() => onConfig({ ...actual, mode: 'MANUAL' })}>
                {T.pasarAMano}
              </button>
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/**
 * Un porcentaje de la carga de trabajo, de 5 a 95. Lo escrito se guarda aparte mientras se escribe: para pasar de 40 a 55
 * se borra y se escribe, y en el medio («», «5») no es un porcentaje válido. Se aplica apenas lo es; al salir, vuelve a
 * mostrar el que rige.
 */
function CampoDePorcentaje({ n, valor, onValor }: { n: number; valor: number; onValor: (v: number) => void }) {
  const [escrito, setEscrito] = useState<string | null>(null);
  const v = escrito === null ? null : Number(escrito.trim());
  const mal = escrito !== null && !(escrito.trim() !== '' && Number.isInteger(v) && v! >= 5 && v! <= 95);
  return (
    <label className="aproximaciones-del-ejercicio__porcentaje">
      <span className="visualmente-oculto">{T.porcentaje(n)}</span>
      <input
        inputMode="numeric"
        maxLength={2}
        value={escrito ?? String(valor)}
        aria-invalid={mal || undefined}
        onChange={(e) => {
          setEscrito(e.target.value);
          const x = Number(e.target.value.trim());
          if (e.target.value.trim() !== '' && Number.isInteger(x) && x >= 5 && x <= 95) onValor(x);
        }}
        onBlur={() => setEscrito(null)}
        data-porcentaje-de-aproximacion={n}
      />
    </label>
  );
}
