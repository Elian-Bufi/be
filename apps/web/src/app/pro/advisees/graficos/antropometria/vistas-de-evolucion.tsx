'use client';

/**
 * Las dos vistas que GR-18 y GR-20 suman a «Evolución» de Antropometría (WP-GRAFICOS fase 2, rama C; DL-174): «Por
 * sitio» (el perfil entre dos tomas) y «Por método» (la masa grasa según cada método). Usan la lectura que ya hizo la
 * vista para su período (API-ANT-06): no piden nada más. La vista ya avisa si hay tomas de otro profesional, así que
 * los gráficos no lo repiten.
 */
import type { EvolucionResponse } from '@be/domain';
import { useMemo } from 'react';
import type { PeriodoDelGrafico } from '../eje-de-fechas';
import { MasasPorMetodo } from './masa-grasa-por-metodo-en-pantalla';
import { PerfilEntreDosTomas } from './perfil-por-sitio-en-pantalla';
import { observacionesDeLasTomas } from './tomas';

type Datos = EvolucionResponse['data'];

export function PorSitioEnEvolucion({ datos }: { datos: Datos }) {
  const observaciones = useMemo(() => observacionesDeLasTomas([datos]), [datos]);
  return <PerfilEntreDosTomas observaciones={observaciones} parcial={false} enTramos={false} />;
}

export function PorMetodoEnEvolucion({ datos, hoy }: { datos: Datos; hoy: string }) {
  const observaciones = useMemo(() => observacionesDeLasTomas([datos]), [datos]);
  const periodo = useMemo((): PeriodoDelGrafico => ({ desde: datos.period.start, hasta: datos.period.end, hoy, desdeElVinculo: null }), [datos, hoy]);
  return <MasasPorMetodo observaciones={observaciones} periodo={periodo} parcial={false} enTramos={false} />;
}
