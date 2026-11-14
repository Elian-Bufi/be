'use client';

/**
 * SP-01 en pantalla (WP-GRAFICOS fase 2, DL-174): los carbohidratos registrados, las calorías al lado y el 1RM estimado
 * (Epley v1) de un ejercicio de la lista de la v1, en paneles alineados por fecha; las dos etapas del objetivo de fondo;
 * «Dos etapas» de los carbohidratos y del 1RM estimado; y la lectura del cruce (`lectura-del-cruce.tsx`).
 *
 * **Solo en el caso 1.** El registro no lo ofrece sin las dos áreas con planes propios (`caso-de-acceso.ts`), y si un
 * permiso cambió entre que se ofreció y que se lee, una lectura «sin acceso» hace que no se dibuje nada (`SIN_ACCESO`):
 * un área sin acceso no deja rastro.
 */
import { entraEnLaEstimacion, type ReferenciaDeMetrica } from '@be/domain';
import { useEffect, useState } from 'react';
import { ejercicioDeLaClave, escalaDeLaSerie, lecturaDelPunto } from '../arma-tu-grafico/compositor';
import { inicioDelEje } from '../eje-de-fechas';
import { EstadoDelGraficoEnPantalla, type EstadoDelGrafico } from '../estado-del-grafico';
import { leerSerieDelCatalogo } from '../lecturas';
import { PanelesAlineados } from '../paneles-alineados';
import type { PropsDelGrafico } from '../registro-de-graficos';
import { bandasDeLaVentana, carrilesDeCarbohidratosYFuerza, delCatalogo, lecturaDeCarbohidratosYFuerza, type EntradaDeCarbohidratosYFuerza } from './carbohidratos-y-fuerza';
import { COPY_DE_LOS_CRUCES } from './copy';
import { dosEtapasLadoALado, type DosEtapasLadoALado } from './dos-etapas';
import { DosEtapasEnPantalla } from './dos-etapas-en-pantalla';
import { LecturaDelCruce } from './lectura-del-cruce';
import { leerLaFuerza, leerLoIndicadoDelEjercicio } from './lecturas-de-los-cruces';

const C = COPY_DE_LOS_CRUCES.carbohidratosYFuerza;

type EstadoDelCruce = EstadoDelGrafico | { readonly tipo: 'LISTA'; readonly entrada: EntradaDeCarbohidratosYFuerza };

const referencia = (metricId: string): ReferenciaDeMetrica => ({ metricId, exerciseKey: null, setIndex: null, unit: null });

export default function CarbohidratosYFuerza({ lectura, periodo, densidad, ejercicio }: PropsDelGrafico) {
  const [estado, setEstado] = useState<EstadoDelCruce>({ tipo: 'CARGANDO' });
  const [vuelta, setVuelta] = useState(0);
  const exerciseId = ejercicio ? ejercicioDeLaClave(ejercicio.exerciseKey) : null;
  const deLaV1 = exerciseId !== null && entraEnLaEstimacion(exerciseId);
  const unidad = ejercicio?.unidad ?? 'kg';
  const clave = `${lectura.asesoradoId}|${periodo.desde}|${periodo.hasta}|${exerciseId ?? ''}|${unidad}|${vuelta}`;
  useEffect(() => {
    let vigente = true;
    if (!deLaV1 || exerciseId === null) {
      setEstado({ tipo: 'SIN_DATOS', texto: C.sinEjercicio });
      return;
    }
    setEstado({ tipo: 'CARGANDO' });
    const p = { ...lectura, periodo };
    void (async (id: string) => {
      const [carbohidratos, energia, fuerza] = await Promise.all([
        leerSerieDelCatalogo(p, referencia('nutricion.carbohidratos'), 'DAY'),
        leerSerieDelCatalogo(p, referencia('nutricion.energia'), 'DAY'),
        leerLaFuerza(p, id, unidad, true),
      ]);
      if (!vigente) return;
      const leidas = [carbohidratos, energia, fuerza];
      if (leidas.some((x) => x.tipo === 'cargando')) return;
      // Un permiso que cambió: el cruce no se dibuja ni deja rastro.
      if (leidas.some((x) => x.tipo === 'sin-acceso')) return setEstado({ tipo: 'SIN_ACCESO' });
      const fallida = leidas.find((x) => x.tipo === 'error');
      if (fallida && fallida.tipo === 'error') return setEstado({ tipo: 'ERROR', motivo: fallida.motivo });
      if (carbohidratos.tipo !== 'lista' || energia.tipo !== 'lista') return setEstado({ tipo: 'SIN_DATOS', texto: 'Sin registros de comida con cantidades desde el inicio del acompañamiento en este período.' });
      if (fuerza.tipo !== 'lista') return setEstado({ tipo: 'SIN_DATOS', texto: 'Sin sesiones de este ejercicio que permitan estimar el 1RM en este período.' });
      const objetivos = await leerLoIndicadoDelEjercicio(p, id, fuerza.bandas);
      if (!vigente) return;
      setEstado({
        tipo: 'LISTA',
        entrada: {
          carbohidratos: carbohidratos.observaciones,
          energia: energia.observaciones,
          escalones: carbohidratos.escalones,
          escalonesDeEnergia: energia.escalones,
          fuerza: fuerza.puntos,
          unidad,
          bandasDeEntrenamiento: fuerza.bandas,
          vigencias: [...carbohidratos.bandas, ...fuerza.bandas],
          objetivos,
          ejercicio: ejercicio?.nombre ?? 'el ejercicio',
          periodo: { desde: inicioDelEje(periodo), hasta: periodo.hasta },
          hoy: periodo.hoy,
        },
      });
    })(exerciseId);
    return () => {
      vigente = false;
    };
    // `clave` resume lo que cambia la lectura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  if (estado.tipo !== 'LISTA') return <EstadoDelGraficoEnPantalla estado={estado} onReintentar={() => setVuelta((v) => v + 1)} />;
  const e = estado.entrada;
  const lecturaDelCruce = lecturaDeCarbohidratosYFuerza(e);
  const carriles = carrilesDeCarbohidratosYFuerza(e);
  // «Dos etapas» de los carbohidratos y del 1RM estimado, con las dos etapas del objetivo (por fechas).
  let etapas: { carbohidratos: DosEtapasLadoALado; fuerza: DosEtapasLadoALado } | null = null;
  if (lecturaDelCruce.ventana) {
    const v = lecturaDelCruce.ventana;
    const a = { letra: 'A' as const, rotulo: `objetivo desde el ${Number(v.a.desde.slice(8, 10))}/${Number(v.a.desde.slice(5, 7))}`, desde: v.a.desde, ultimoDia: v.a.hasta, planVersionId: null };
    const b = { letra: 'B' as const, rotulo: `objetivo desde el ${Number(v.b.desde.slice(8, 10))}/${Number(v.b.desde.slice(5, 7))}`, desde: v.b.desde, ultimoDia: v.b.hasta, planVersionId: null };
    const carbo = delCatalogo('nutricion.carbohidratos');
    const uno = delCatalogo('entrenamiento.1rm-estimado');
    const fuerzaSerie = carriles[2];
    etapas = {
      carbohidratos: dosEtapasLadoALado({ serie: e.carbohidratos, definicion: carbo.definicion, a, b, leido: e.periodo, escala: escalaDeLaSerie(carbo, e.carbohidratos.unit), lectura: (p) => lecturaDelPunto(p, carbo.definicion, e.carbohidratos.unit) }),
      fuerza: dosEtapasLadoALado({
        serie: {
          metricId: uno.id,
          label: uno.definicion.nombre,
          unit: e.unidad,
          scale: 'RATIO',
          grain: 'ORIGINAL',
          aggregation: 'NONE',
          points: e.fuerza.map((p) => ({
            pointId: p.pointId,
            date: p.date,
            dateEnd: null,
            at: null,
            value: p.estimate.value,
            quality: p.estimate.band === 'CORE' ? ('COMPLETE' as const) : ('PARTIAL' as const),
            n: 1,
            segment: p.source === 'OBSERVED' ? `observada:${p.pointId}` : 'estimacion',
            corrected: false,
            partialBucket: false,
            dataClass: null,
            method: null,
            planVersionIds: [],
            coverage: null,
            missing: [],
            detail: [],
            sources: [],
            sourcesTruncated: false,
          })),
          gaps: [],
          segments: [],
          notes: [],
        },
        definicion: uno.definicion,
        a,
        b,
        leido: e.periodo,
        escala: escalaDeLaSerie(uno, e.unidad),
        lectura: (p) => fuerzaSerie?.puntos.find((x) => x.clave === p.pointId)?.lectura ?? '',
        fuerza: e.fuerza,
      }),
    };
  }
  return (
    <section className="cruce" aria-label={C.titulo}>
      <p className="cruce__pregunta">{C.pregunta}</p>
      <PanelesAlineados
        titulo={C.titulo}
        periodo={periodo}
        carriles={carriles}
        bandas={bandasDeLaVentana(lecturaDelCruce)}
        densidad={densidad}
        leyenda={['REGISTRADO', 'SUBTOTAL', 'ORIENTATIVA', 'OBSERVADA_POR_EL_PROFESIONAL']}
        notas={[COPY_DE_LOS_CRUCES.frase]}
      />
      <LecturaDelCruce lectura={lecturaDelCruce} ventana={C.ventana} comoLeerlo={C.comoLeerlo} />
      {etapas ? (
        <div className="cruce__etapas">
          <DosEtapasEnPantalla titulo="Carbohidratos registrados en las dos etapas del objetivo" d={etapas.carbohidratos} decimales={0} indice={0} densidad={densidad} />
          <DosEtapasEnPantalla titulo={`1RM estimado (Epley v1) de ${e.ejercicio} en las dos etapas`} d={etapas.fuerza} decimales={1} indice={2} densidad={densidad} />
        </div>
      ) : null}
    </section>
  );
}
