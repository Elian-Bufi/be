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
 *
 * Con la pasada visual del 15/11: las versiones del plan llegan a los tres gráficos con lo que cambió en lo indicado al
 * empezar cada una (`bandasConElCambio`, la misma lectura que la fuerza de «Analizar»): «v8 · de 4 a 3 repeticiones» en
 * la línea de la versión; en GR-02, de todas las series, y en GR-03 y GR-05, de la serie elegida (revisión del 15/11).
 * GR-02 y GR-05 van a 240 px (los principales del paso); GR-03, tres paneles de 96.
 */
import { COPY_FUERZA, entraEnLaEstimacion, type VigenciaDePlan } from '@be/domain';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { BloqueDeEstado, Cargando } from '../../../../../components/estados';
import { Enlace } from '../../../../../components/enlace';
import { Icono } from '../../../../../components/icono';
import type { Resultado } from '../../../../../lib/api';
import { ICONO_DE_FALLA } from '../../../../../lib/fallas';
import { bandasDeVersion } from '../adaptadores';
import { CintaDelTiempoLeida } from '../cinta-del-tiempo-en-pantalla';
import { ProveedorDelCursor } from '../cursor-de-fechas';
import { inicioDelEje, type PeriodoDelGrafico } from '../eje-de-fechas';
import type { ParametrosDeLectura } from '../lecturas';
import type { EjercicioDelGraficoElegido, PropsDelGrafico } from '../registro-de-graficos';
import { CargaRepeticionesYRir } from './carga-repeticiones-y-rir-en-pantalla';
import { COPY_CARGA_REPETICIONES_Y_RIR, COPY_DEL_HISTORIAL as C, COPY_RIR_INDICADO_Y_REGISTRADO, type PasoDelHistorial as Paso } from './copy';
import { FuerzaEstimada } from './fuerza-estimada-en-pantalla';
import { bandasConElCambio, observacionesDelPeriodo } from './comparador';
import { ProveedorDelComparador, useComparador, useIndiceDelPeriodo, useInicioDelAcompanamiento } from './lecturas-del-ejercicio';
import { PerfilCargaRepeticiones } from './perfil-carga-repeticiones-en-pantalla';
import { haciaElProgresoEnAnalizar, haciaLaFuerzaEnAnalizar, haciaLoIndicadoEnAnalizar } from './periodo-del-historial';
import { enElPeriodo } from '../periodo-de-los-graficos';
import { SelectorDePeriodoDeGraficos, useEleccionDePeriodo } from '../selector-de-periodo-de-graficos';
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

/**
 * Las versiones del plan para los gráficos del historial, con el cambio de lo indicado del comparador que ya se leyó para
 * todos (`ProveedorDelComparador`). Mientras se lee, o si falla, van sin ese rótulo; si falla, GR-02 y GR-03 lo dicen.
 *
 * Dos juegos (revisión del 15/11): `delEjercicio`, con lo indicado en todas las series (GR-02: de cada sesión entra la
 * serie de mayor carga), y `deLaSerie`, con lo indicado en la serie elegida (GR-03 y GR-05 son de una serie: su línea no
 * dice un cambio que fue de otra).
 */
export function useBandasDelHistorial(lectura: Omit<ParametrosDeLectura, 'periodo'>, periodo: PeriodoDelGrafico, vigencias: readonly VigenciaDePlan[], exerciseKey: string, serie: number) {
  const { comparador } = useComparador(lectura, periodo);
  return useMemo(() => {
    if (comparador.tipo !== 'lista') {
      const sinCambio = bandasDeVersion(vigencias, 'ENTRENAMIENTO');
      return { delEjercicio: sinCambio, deLaSerie: sinCambio };
    }
    const observaciones = observacionesDelPeriodo(comparador.ejecuciones, exerciseKey, comparador.objetivosPorVersion, inicioDelEje(periodo), periodo.hasta);
    return { delEjercicio: bandasConElCambio(vigencias, observaciones), deLaSerie: bandasConElCambio(vigencias, observaciones, serie) };
  }, [comparador, vigencias, exerciseKey, periodo, serie]);
}

/** Los gráficos del paso «Historial», adentro del proveedor del comparador: con las versiones y su cambio. */
function GraficosDelHistorial({
  props,
  vigencias,
  enLaLista,
  orientativas,
  onOrientativas,
  asesoradoId,
  exerciseId,
}: {
  props: PropsDelGrafico;
  vigencias: readonly VigenciaDePlan[];
  enLaLista: boolean;
  orientativas: boolean;
  onOrientativas: (x: boolean) => void;
  asesoradoId: string;
  exerciseId: string;
}) {
  const exerciseKey = `e:${exerciseId}`;
  const { periodo, ejercicio, lectura } = props;
  const serie = ejercicio?.serie ?? 1;
  const unidad = ejercicio?.unidad ?? null;
  const bandas = useBandasDelHistorial(lectura, periodo, vigencias, exerciseKey, serie);
  // GR-02, con el cambio de lo indicado en todas las series; GR-03 y GR-05, con el de la serie elegida.
  const conBandasDelEjercicio: PropsDelGrafico = { ...props, bandas: bandas.delEjercicio };
  const conBandasDeLaSerie: PropsDelGrafico = { ...props, bandas: bandas.deLaSerie };
  return (
    <ProveedorDelCursor>
      {enLaLista ? (
        <div className="historial-del-ejercicio__grafico">
          <FuerzaEstimada {...conBandasDelEjercicio} densidad="COMPLETA" incluirDeEntrada={orientativas} onIncluir={onOrientativas} />
          {unidad ? <AbrirEnAnalizar href={haciaLaFuerzaEnAnalizar(asesoradoId, exerciseId, unidad, orientativas, periodo)} que={COPY_FUERZA.nombreDeLaMetrica} /> : null}
        </div>
      ) : null}
      <div className="historial-del-ejercicio__grafico">
        <CargaRepeticionesYRir {...conBandasDeLaSerie} densidad="COMPACTA" />
        <AbrirEnAnalizar href={haciaElProgresoEnAnalizar(asesoradoId, exerciseKey, serie, unidad, periodo)} que={COPY_CARGA_REPETICIONES_Y_RIR.titulo(serie)} />
      </div>
      <div className="historial-del-ejercicio__grafico">
        <RirIndicadoYRegistrado {...conBandasDeLaSerie} densidad="COMPLETA" />
        <AbrirEnAnalizar href={haciaLoIndicadoEnAnalizar(asesoradoId, exerciseKey, periodo)} que={COPY_RIR_INDICADO_Y_REGISTRADO.titulo(serie)} />
      </div>
      <div className="historial-del-ejercicio__grafico">
        <CintaDelEjercicio lectura={lectura} periodo={periodo} vigencias={vigencias} exerciseKey={exerciseKey} />
      </div>
    </ProveedorDelCursor>
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
  const [serieElegida, setSerieElegida] = useState<number | null>(null);
  const [unidadElegida, setUnidadElegida] = useState<'kg' | 'lb' | null>(null);
  const [orientativas, setOrientativas] = useState(false);
  const lectura = useMemo(() => ({ token, asesoradoId, sesionPerdida }), [token, asesoradoId, sesionPerdida]);
  const inicio = useInicioDelAcompanamiento(token, asesoradoId, sesionPerdida);
  // WP-GRAFICOS-POR-FASE (GPF-01): el mismo selector que el resto de los gráficos, con las versiones del plan.
  const eleccion = useEleccionDePeriodo(token, asesoradoId, sesionPerdida, inicio);
  const periodo = eleccion.periodo;
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
          {eleccion.eleccion.tipo === 'DESDE_EL_VINCULO' && !periodo.recortado ? C.sinSesiones : C.sinSesionesEnElPeriodo(enElPeriodo(eleccion.eleccion, periodo))}
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
              <GraficosDelHistorial
                props={props}
                vigencias={indice.vigencias}
                enLaLista={enLaLista}
                orientativas={orientativas}
                onOrientativas={setOrientativas}
                asesoradoId={asesoradoId}
                exerciseId={exerciseId}
              />
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
      <div className="historial-del-ejercicio__periodo">
        <SelectorDePeriodoDeGraficos leida={eleccion} inicio={inicio} />
      </div>
      {cuerpo}
    </div>
  );
}
