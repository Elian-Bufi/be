'use client';

/**
 * WP-OBJETIVO-Y-CALCULADOR (OBC-06; DL-186) · La referencia y el cálculo guardados con la versión vigente del objetivo
 * (API-OBC-03), en el resumen de Nutrición: de qué toma o de qué datos salió, con qué método, qué factor y qué ajuste, y
 * los macros. Lo guardado no se mueve: una toma más nueva o una corrección se avisan en neutro.
 * RP-05 (DL-188): las citas, detrás de «Fuente»; la fórmula y la cuenta, a la vista. RP-07: las kcal y los gramos, con su
 * ícono.
 */
import { CITA_DEL_FACTOR_DE_ACTIVIDAD, FICHA_DEL_METODO_DE_REPOSO, numero, type ReferenciaDelObjetivoResponse } from '@be/domain';
import { useEffect, useState } from 'react';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';
import { api } from '../../../../lib/api';
import { ajusteEnPalabras, avisosDeLaReferencia, datoEnPalabras, diaYMes, masaEnPalabras, parteEnPalabras, PROBLEMA_DEL_CALCULO, reposoEnPalabras } from './calculador-del-objetivo';
import { CantidadDelMacro } from './cantidad-del-macro';
import { useNutricion } from './nutricion';

type Lectura = { estado: 'leyendo' } | { estado: 'falla' } | { estado: 'listo'; datos: ReferenciaDelObjetivoResponse['data'] };

export function ReferenciaDelObjetivo({ versionId }: { versionId: string }) {
  const { token } = useNutricion();
  const [lectura, setLectura] = useState<Lectura>({ estado: 'leyendo' });
  useEffect(() => {
    let vigente = true;
    setLectura({ estado: 'leyendo' });
    void api.referenciaDelObjetivo(token, versionId).then((r) => {
      if (vigente) setLectura(r.ok ? { estado: 'listo', datos: r.datos.data } : { estado: 'falla' });
    });
    return () => {
      vigente = false;
    };
  }, [token, versionId]);
  if (lectura.estado === 'leyendo') return <p className="nota" role="status">Leyendo la referencia del objetivo…</p>;
  if (lectura.estado === 'falla') return <p className="nota">No se pudo leer la referencia del objetivo.</p>;
  const { calculation: c, anthropometry } = lectura.datos;
  const avisos = avisosDeLaReferencia(c, anthropometry);
  if (!c) return <p className="nota" data-sin-referencia>Esta versión del objetivo se escribió sin una toma de referencia ni un cálculo.</p>;
  const r = c.result;
  const p = c.parameters;
  return (
    <div className="referencia-del-objetivo" data-referencia-del-objetivo>
      <h3>Referencia y cálculo</h3>
      <p>
        {c.reference.source === 'RECORDED' ? (c.reference.measuredOn ? `Con la toma de Antropometría del ${diaYMes(c.reference.measuredOn)}` : 'Con una toma de Antropometría') : `Con datos a mano del ${diaYMes(c.reference.measuredOn ?? '')}`}
        {c.restingMethod ? ` · ${FICHA_DEL_METODO_DE_REPOSO[c.restingMethod].nombre}` : ' · sin cálculo'}
      </p>
      {avisos.map((a) => (
        <p key={a} className="nota" role="status" data-aviso-de-la-referencia>
          {a}
        </p>
      ))}
      {c.data ? (
        <dl className="datos datos--en-fila">
          <div>
            <dt>Peso</dt>
            <dd>{datoEnPalabras(c.data.weightKg, 'kg')}</dd>
          </div>
          <div>
            <dt>Talla</dt>
            <dd>{datoEnPalabras(c.data.heightCm, 'cm')}</dd>
          </div>
          <div>
            <dt>Edad</dt>
            <dd>{datoEnPalabras(c.data.ageYears, 'años')}</dd>
          </div>
          <div>
            <dt>Masa libre de grasa</dt>
            <dd>{masaEnPalabras(c.data.leanMassKg, c.data.weightKg?.value ?? null)}</dd>
          </div>
        </dl>
      ) : null}
      {r && p ? (
        <details className="referencia-del-objetivo__calculo">
          <summary>
            Cómo se calculó: {reposoEnPalabras(r.resting)} en reposo{r.energy ? ` · ${numero(r.energy.day, 0)} kcal con el factor y el ajuste` : ''}
          </summary>
          <dl className="datos">
            {r.resting.state === 'CALCULATED' ? (
              <>
                <div>
                  <dt>Fórmula</dt>
                  <dd>{r.resting.equation}</dd>
                </div>
                <div>
                  <dt>Con los datos</dt>
                  <dd>{r.resting.applied} kcal</dd>
                </div>
              </>
            ) : null}
            <div>
              <dt>Método</dt>
              <dd>
                {FICHA_DEL_METODO_DE_REPOSO[p.restingMethod].nombre}{' '}
                <ExplicacionAPedido boton="Fuente" nombre={`Fuente de ${FICHA_DEL_METODO_DE_REPOSO[p.restingMethod].nombre}`}>
                  {FICHA_DEL_METODO_DE_REPOSO[p.restingMethod].cita}
                </ExplicacionAPedido>
              </dd>
            </div>
            <div>
              <dt>Factor de actividad</dt>
              <dd>
                {numero(p.activity.factor, 2)}
                {p.activity.restDayFactor !== null ? ` · día de descanso ${numero(p.activity.restDayFactor, 2)}` : ''}{' '}
                <ExplicacionAPedido boton="Fuente" nombre="Fuente de los niveles de actividad">
                  {CITA_DEL_FACTOR_DE_ACTIVIDAD}
                </ExplicacionAPedido>
              </dd>
            </div>
            <div>
              <dt>Ajuste</dt>
              <dd>
                {/* RP-24 (RP-D95): «Déficit de 300 kcal por día», sin signo, como se escribe en el calculador. */}
                {ajusteEnPalabras(p.adjustment, r.totals?.day ?? null, numero)}
              </dd>
            </div>
            {r.totals && r.energy ? (
              <div>
                <dt>Energía</dt>
                <dd>
                  {numero(r.totals.day, 0)} kcal de gasto total → {numero(r.energy.day, 0)} kcal
                  {r.totals.restDay !== null && r.energy.restDay !== null ? ` · día de descanso: ${numero(r.totals.restDay, 0)} → ${numero(r.energy.restDay, 0)} kcal` : ''}
                </dd>
              </div>
            ) : null}
            {r.macros ? (
              <div>
                <dt>Macros del día</dt>
                <dd>
                  {(['protein', 'carbohydrate', 'fat'] as const).map((m, i) => (
                    <span key={m}>
                      {i > 0 ? ' · ' : ''}
                      <CantidadDelMacro macro={m} cifra={numero(r.macros!.day[m].grams, 0)} /> ({numero(r.macros!.day[m].perKg, 2)} g/kg, {parteEnPalabras(r.macros!.day[m].energyShare, r.macros!.day.energyKcal)})
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
          {r.issues.map((i) => (
            <p key={i} className="nota">
              {PROBLEMA_DEL_CALCULO[i]}
            </p>
          ))}
          <p className="nota">Es una estimación de partida: lo que rige es lo que escribiste en el objetivo.</p>
        </details>
      ) : null}
    </div>
  );
}
