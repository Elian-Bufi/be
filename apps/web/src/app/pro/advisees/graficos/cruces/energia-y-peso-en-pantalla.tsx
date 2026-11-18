'use client';

/**
 * SP-02 en pantalla (WP-GRAFICOS fase 2, DL-174): las calorías registradas por día con el objetivo en escalón, su media
 * semanal (que dice con cuántos días se hizo) y el peso de cada toma como punto suelto, en paneles apilados por fecha;
 * de fondo, la ventana entre las dos tomas; y la lectura del cruce (`lectura-del-cruce.tsx`).
 *
 * **Solo en el caso 1** (Nutrición y Antropometría con planes o tomas propios). Si un permiso cambió y una lectura dice
 * «sin acceso», no se dibuja nada.
 *
 * La pasada visual (15/11): una sola tarjeta con el lenguaje de la base. La frase fija, una vez, en las notas del gráfico;
 * la lectura del cruce, a la vista adentro de la tarjeta; la explicación fisiológica con su fuente, en su «Cómo leerlo»; y
 * la leyenda del carril semanal (la media de GR-12, GR-VC13) dice solo las semanas que se ven.
 */
import type { ReferenciaDeMetrica } from '@be/domain';
import { useEffect, useState } from 'react';
import { leyendaDeLosCarriles } from '../arma-tu-grafico/compositor';
import type { BandaDeVersion, CarrilDeBarrasSemanales } from '../carriles';
import { inicioDelEje } from '../eje-de-fechas';
import { EstadoDelGraficoEnPantalla, type EstadoDelGrafico } from '../estado-del-grafico';
import { leerSerieDelCatalogo } from '../lecturas';
import { PanelesAlineados } from '../paneles-alineados';
import type { PropsDelGrafico } from '../registro-de-graficos';
import { COPY_DE_LOS_CRUCES } from './copy';
import { carrilesDeEnergiaYPeso, fichasDeLasSemanas, lecturaDeEnergiaYPeso, type EntradaDeEnergiaYPeso } from './energia-y-peso';
import { LecturaDelCruce } from './lectura-del-cruce';

const C = COPY_DE_LOS_CRUCES.energiaYPeso;

type EstadoDelCruce = EstadoDelGrafico | { readonly tipo: 'LISTA'; readonly entrada: EntradaDeEnergiaYPeso };

const referencia = (metricId: string): ReferenciaDeMetrica => ({ metricId, exerciseKey: null, setIndex: null, unit: null });

export default function EnergiaYPeso({ lectura, periodo, densidad }: PropsDelGrafico) {
  const [estado, setEstado] = useState<EstadoDelCruce>({ tipo: 'CARGANDO' });
  const [vuelta, setVuelta] = useState(0);
  const clave = `${lectura.asesoradoId}|${periodo.desde}|${periodo.hasta}|${vuelta}`;
  useEffect(() => {
    let vigente = true;
    setEstado({ tipo: 'CARGANDO' });
    const p = { ...lectura, periodo };
    void (async () => {
      const [energia, peso] = await Promise.all([leerSerieDelCatalogo(p, referencia('nutricion.energia'), 'DAY'), leerSerieDelCatalogo(p, referencia('antropometria.peso'), 'ORIGINAL')]);
      if (!vigente) return;
      if (energia.tipo === 'cargando' || peso.tipo === 'cargando') return;
      if (energia.tipo === 'sin-acceso' || peso.tipo === 'sin-acceso') return setEstado({ tipo: 'SIN_ACCESO' });
      if (energia.tipo === 'error') return setEstado({ tipo: 'ERROR', motivo: energia.motivo });
      if (peso.tipo === 'error') return setEstado({ tipo: 'ERROR', motivo: peso.motivo });
      if (energia.tipo !== 'lista') return setEstado({ tipo: 'SIN_DATOS', texto: 'Sin registros de comida con cantidades en este período.' });
      if (peso.tipo !== 'lista') return setEstado({ tipo: 'SIN_DATOS', texto: 'Sin tomas de peso en este período.' });
      setEstado({
        tipo: 'LISTA',
        entrada: {
          energia: energia.observaciones,
          escalones: energia.escalones,
          peso: peso.observaciones,
          vigencias: energia.bandas,
          periodo: { desde: inicioDelEje(periodo), hasta: periodo.hasta },
          hoy: periodo.hoy,
        },
      });
    })();
    return () => {
      vigente = false;
    };
    // `clave` resume lo que cambia la lectura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  if (estado.tipo !== 'LISTA') return <EstadoDelGraficoEnPantalla estado={estado} onReintentar={() => setVuelta((v) => v + 1)} />;
  const l = lecturaDeEnergiaYPeso(estado.entrada);
  const bandas: BandaDeVersion[] = l.ventana ? [{ area: 'NUTRICION', desde: l.ventana.a.desde, hasta: l.ventana.b.hasta, rotulo: 'Ventana de lectura' }] : [];
  const carriles = carrilesDeEnergiaYPeso(estado.entrada);
  const semanal = carriles.find((c): c is CarrilDeBarrasSemanales => c.tipo === 'BARRAS_SEMANALES');
  return (
    <section className="cruce" aria-label={C.titulo}>
      <p className="cruce__pregunta">{C.pregunta}</p>
      <PanelesAlineados
        titulo={C.titulo}
        periodo={periodo}
        carriles={carriles}
        bandas={bandas}
        densidad={densidad}
        leyenda={leyendaDeLosCarriles(carriles)}
        fichas={semanal ? fichasDeLasSemanas(semanal.semanas) : []}
        notas={[COPY_DE_LOS_CRUCES.frase]}
        aclaraciones={C.comoLeerlo}
        aLaVista={<LecturaDelCruce lectura={l} ventana={C.ventana} />}
      />
    </section>
  );
}
