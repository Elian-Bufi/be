'use client';

/**
 * El historial del ejercicio en el cuadro de la estación (WP-GRAFICOS fase 2, rama B; DL-174): los pasos «Historial»
 * (GR-02 si el ejercicio es de la lista de la v1, GR-03 y GR-05 alineados, con un solo cursor para los tres) y «Perfil»
 * (GR-06), que se abren en el mismo cuadro con «Atrás» (ED-10). Arriba, el período (12 semanas, 6 meses o desde que la
 * acompañás) y, si hace falta, la serie y la unidad; cada gráfico, con «Abrir en Analizar» y lo elegido. Nada de esto
 * escribe en el plan.
 *
 * El cuadro se abre para todos los ejercicios (GR-T30): los de la lista de la v1, desde «Detalle y fuerza estimada»
 * (ED-75); los demás, desde «La vez pasada» (GR-01). La tarjeta de fuerza sigue solo en la v1.
 */
import { COPY_FUERZA, entraEnLaEstimacion, type VigenciaDePlan } from '@be/domain';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { BloqueDeEstado, Cargando } from '../../../../../components/estados';
import { Enlace } from '../../../../../components/enlace';
import { Icono } from '../../../../../components/icono';
import type { Resultado } from '../../../../../lib/api';
import { ICONO_DE_FALLA } from '../../../../../lib/fallas';
import { hoyEn } from '../../seguimiento/estado';
import { bandasDeVersion } from '../adaptadores';
import { CintaDelTiempoLeida } from '../cinta-del-tiempo-en-pantalla';
import { ProveedorDelCursor } from '../cursor-de-fechas';
import type { PeriodoDelGrafico } from '../eje-de-fechas';
import type { ParametrosDeLectura } from '../lecturas';
import type { EjercicioDelGraficoElegido, PropsDelGrafico } from '../registro-de-graficos';
import { CargaRepeticionesYRir } from './carga-repeticiones-y-rir-en-pantalla';
import { COPY_CARGA_REPETICIONES_Y_RIR, COPY_DEL_HISTORIAL as C, COPY_RIR_INDICADO_Y_REGISTRADO, type OpcionDePeriodo, type PasoDelHistorial as Paso } from './copy';
import { FuerzaEstimada } from './fuerza-estimada-en-pantalla';
import { ProveedorDelComparador, useComparador, useIndiceDelPeriodo, useInicioDelAcompanamiento } from './lecturas-del-ejercicio';
import { PerfilCargaRepeticiones } from './perfil-carga-repeticiones-en-pantalla';
import { haciaElProgresoEnAnalizar, haciaLaFuerzaEnAnalizar, haciaLoIndicadoEnAnalizar, OPCIONES_DE_PERIODO, periodoDelHistorial } from './periodo-del-historial';
import { RirIndicadoYRegistrado } from './rir-indicado-y-registrado-en-pantalla';

/**
 * La cinta del tiempo (GR-23) debajo de GR-03 y GR-05: las versiones del plan, las revisiones, las notas de coordinación
 * y, de este ejercicio, las sesiones con cambios y las sustituciones (las de la sesión, del comparador ya leído). Solo
 * Entrenamiento: el cuadro es de un ejercicio del plan (GR-T31).
 */
function CintaDelEjercicio({ lectura, periodo, vigencias, exerciseKey }: { lectura: Omit<ParametrosDeLectura, 'periodo'>; periodo: PeriodoDelGrafico; vigencias: readonly VigenciaDePlan[]; exerciseKey: string }) {
  const { comparador } = useComparador(lectura, periodo);
  return (
    <CintaDelTiempoLeida
      lectura={lectura}
      alcances={['ENTRENAMIENTO']}
      vigencias={vigencias}
      ejecuciones={comparador.tipo === 'lista' ? comparador.ejecuciones : undefined}
      exerciseKey={exerciseKey}
      periodo={periodo}
      densidad="COMPACTA"
    />
  );
}

/** «Abrir en Analizar», con lo que abre dicho para el lector de pantalla. */
function AbrirEnAnalizar({ href, que }: { href: string; que: string }) {
  return (
    <p className="historial-del-ejercicio__analizar">
      <Enlace href={href} className="boton boton--enlace" data-abrir-en-analizar>
        <Icono nombre="analizar" tamano={18} />
        {C.abrirEnAnalizar}
        <span className="visualmente-oculto">: {que}</span>
      </Enlace>
    </p>
  );
}

export function PasoDelHistorial({
  paso,
  token,
  asesoradoId,
  sesionPerdida,
  exerciseId,
  nombre,
}: {
  paso: Paso;
  token: string;
  asesoradoId: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  /** El ejercicio del catálogo (sin el prefijo `e:`). */
  exerciseId: string;
  nombre: string;
}) {
  const id = useId();
  const [opcion, setOpcion] = useState<OpcionDePeriodo>('DOCE_SEMANAS');
  const [serieElegida, setSerieElegida] = useState<number | null>(null);
  const [unidadElegida, setUnidadElegida] = useState<'kg' | 'lb' | null>(null);
  const [orientativas, setOrientativas] = useState(false);
  const hoy = useMemo(() => hoyEn(), []);
  const lectura = useMemo(() => ({ token, asesoradoId, sesionPerdida }), [token, asesoradoId, sesionPerdida]);
  const inicio = useInicioDelAcompanamiento(token, asesoradoId, sesionPerdida);
  const periodo = useMemo(() => (inicio.tipo === 'listo' ? periodoDelHistorial(opcion, hoy, inicio.inicio) : null), [inicio, opcion, hoy]);
  const { indice, recargar } = useIndiceDelPeriodo(lectura, periodo);
  const exerciseKey = `e:${exerciseId}`;
  const enLaLista = entraEnLaEstimacion(exerciseId);

  let cuerpo: ReactNode;
  if (!periodo || indice.tipo === 'cargando') cuerpo = <Cargando />;
  else if (indice.tipo === 'sin-acceso') cuerpo = <p data-no-disponible>{C.noDisponible}</p>;
  else if (indice.tipo === 'error') {
    cuerpo = (
      <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[indice.motivo]} onReintentar={recargar} deQue={C.queSeReintenta}>
        {C.noSeLeyo}
      </BloqueDeEstado>
    );
  } else {
    const ej = indice.ejercicios.find((e) => e.exerciseKey.toLowerCase() === exerciseKey.toLowerCase() && e.sessions > 0) ?? null;
    if (!ej) {
      cuerpo = (
        <BloqueDeEstado tipo="vacio" icono="informacion">
          {opcion === 'DESDE_EL_VINCULO' ? C.sinSesiones : C.sinSesionesEnElPeriodo(C.enElPeriodo[opcion])}
        </BloqueDeEstado>
      );
    } else {
      const series = ej.setNumbers.length > 0 ? [...ej.setNumbers].sort((a, b) => a - b) : [1];
      const serie = serieElegida !== null && series.includes(serieElegida) ? serieElegida : series.includes(1) ? 1 : series[0]!;
      const unidades = ej.loadUnits;
      const unidad = unidadElegida !== null && unidades.includes(unidadElegida) ? unidadElegida : (unidades[0] ?? null);
      const ejercicio: EjercicioDelGraficoElegido = { exerciseKey, nombre, unidad, serie };
      const props: PropsDelGrafico = { lectura, periodo, densidad: 'COMPACTA', ejercicio, medida: null, bandas: bandasDeVersion(indice.vigencias, 'ENTRENAMIENTO') };
      cuerpo = (
        <>
          {(paso === 'historial' && series.length > 1) || unidades.length > 1 ? (
            <div className="historial-del-ejercicio__elecciones">
              {paso === 'historial' && series.length > 1 ? (
                <div className="campo">
                  <label htmlFor={`${id}-serie`}>{C.serie}</label>
                  <select id={`${id}-serie`} value={serie} onChange={(e) => setSerieElegida(Number(e.target.value))} data-serie-del-historial>
                    {series.map((n) => (
                      <option key={n} value={n}>
                        {C.serieN(n)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              {unidades.length > 1 ? (
                <div className="campo">
                  <label htmlFor={`${id}-unidad`}>{C.unidad}</label>
                  <select id={`${id}-unidad`} value={unidad ?? ''} onChange={(e) => setUnidadElegida(e.target.value === 'lb' ? 'lb' : 'kg')} data-unidad-del-historial>
                    {unidades.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          ) : null}
          {/* Una sola lectura del comparador para todos los gráficos del paso (y para las sustituciones de la cinta). */}
          <ProveedorDelComparador lectura={lectura} periodo={periodo}>
            {paso === 'historial' ? (
              <ProveedorDelCursor>
                {enLaLista ? (
                  <div className="historial-del-ejercicio__grafico">
                    <FuerzaEstimada {...props} incluirDeEntrada={orientativas} onIncluir={setOrientativas} />
                    {unidad ? <AbrirEnAnalizar href={haciaLaFuerzaEnAnalizar(asesoradoId, exerciseId, unidad, orientativas, periodo)} que={COPY_FUERZA.nombreDeLaMetrica} /> : null}
                  </div>
                ) : null}
                <div className="historial-del-ejercicio__grafico">
                  <CargaRepeticionesYRir {...props} />
                  <AbrirEnAnalizar href={haciaElProgresoEnAnalizar(asesoradoId, exerciseKey, serie, unidad, periodo)} que={COPY_CARGA_REPETICIONES_Y_RIR.titulo(serie)} />
                </div>
                <div className="historial-del-ejercicio__grafico">
                  <RirIndicadoYRegistrado {...props} />
                  <AbrirEnAnalizar href={haciaLoIndicadoEnAnalizar(asesoradoId, exerciseKey, periodo)} que={COPY_RIR_INDICADO_Y_REGISTRADO.titulo(serie)} />
                </div>
                <div className="historial-del-ejercicio__grafico">
                  <CintaDelEjercicio lectura={lectura} periodo={periodo} vigencias={indice.vigencias} exerciseKey={exerciseKey} />
                </div>
              </ProveedorDelCursor>
            ) : (
              <PerfilCargaRepeticiones {...props} />
            )}
          </ProveedorDelComparador>
        </>
      );
    }
  }

  return (
    <div className="historial-del-ejercicio" data-historial-del-ejercicio={paso}>
      <p className="nota">{C.queEs}</p>
      <fieldset className="capas historial-del-ejercicio__periodo">
        <legend>{C.periodo}</legend>
        {OPCIONES_DE_PERIODO.map((o) => (
          <label key={o} className="capa">
            <input type="radio" name={`${id}-periodo`} value={o} checked={opcion === o} onChange={() => setOpcion(o)} />
            {C.opciones[o]}
          </label>
        ))}
      </fieldset>
      {periodo && opcion === 'DESDE_EL_VINCULO' && periodo.recortado ? <p className="nota">{inicio.tipo === 'listo' && inicio.fallo ? C.sinInicio : C.hastaUnAnio}</p> : null}
      {cuerpo}
    </div>
  );
}
