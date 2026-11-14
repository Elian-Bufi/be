'use client';

/**
 * Un gráfico de Nutrición o Antropometría que lee sus datos (WP-GRAFICOS fase 2, rama C; DL-174): la lectura se repite
 * al cambiar la persona, el período o al pedir «Reintentar», y una respuesta tardía de otra lectura se descarta. Mientras
 * lee guarda su alto (no mueve la página); sin acceso no dibuja nada, ni siquiera el título: un área sin acceso no deja
 * rastro. Una falla no es un vacío: lo dice y ofrece «Reintentar».
 */
import { useEffect, useState, type DependencyList, type ReactNode } from 'react';
import type { PeriodoDelGrafico } from '../eje-de-fechas';
import { EstadoDelGraficoEnPantalla } from '../estado-del-grafico';
import type { DensidadDelGrafico } from '../paneles-alineados';
import type { GraficoLeido } from './leido';
import type { GraficoArmado } from './lienzo';
import { LienzoDeNutricionYCuerpo } from './lienzo-en-pantalla';

export type EstadoDeLaLectura<T> = GraficoLeido<T> | { readonly tipo: 'CARGANDO' };

/** Lee al montar y cada vez que cambian `deps`; `reintentar` vuelve a leer. */
export function useGraficoLeido<T>(leer: () => Promise<GraficoLeido<T>>, deps: DependencyList): { readonly estado: EstadoDeLaLectura<T>; readonly reintentar: () => void } {
  const [estado, setEstado] = useState<EstadoDeLaLectura<T>>({ tipo: 'CARGANDO' });
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    let vigente = true;
    setEstado({ tipo: 'CARGANDO' });
    leer().then(
      (r) => {
        // Con la sesión perdida la pantalla ya va al ingreso: no se cambia nada.
        if (vigente && r.tipo !== 'SESION') setEstado(r);
      },
      () => {
        if (vigente) setEstado({ tipo: 'ERROR', motivo: 'OTRO' });
      },
    );
    return () => {
      vigente = false;
    };
    // `leer` cambia en cada dibujo: lo que decide volver a leer son `deps` y «Reintentar».
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, vuelta]);
  return { estado, reintentar: () => setVuelta((v) => v + 1) };
}

/** El gráfico armado en el lienzo, o el estado de su lectura con su título. Sin acceso, nada. */
export function GraficoOEstado({
  titulo,
  estado,
  reintentar,
  periodo,
  densidad,
  antes = null,
}: {
  titulo: string;
  estado: EstadoDeLaLectura<GraficoArmado>;
  reintentar: () => void;
  periodo: PeriodoDelGrafico;
  densidad?: DensidadDelGrafico;
  antes?: ReactNode;
}) {
  if (estado.tipo === 'LISTO') return <LienzoDeNutricionYCuerpo titulo={titulo} periodo={periodo} grafico={estado.datos} densidad={densidad} antes={antes} />;
  if (estado.tipo === 'SESION' || estado.tipo === 'SIN_ACCESO') return null;
  return (
    <div className="grafico-base">
      <h3 className="grafico-base__titulo">{titulo}</h3>
      {antes}
      <EstadoDelGraficoEnPantalla estado={estado} onReintentar={reintentar} />
    </div>
  );
}
