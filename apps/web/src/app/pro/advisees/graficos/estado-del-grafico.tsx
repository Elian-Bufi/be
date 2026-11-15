'use client';

/**
 * Los estados de un gráfico que no se dibuja (WP-GRAFICOS fase 2, DL-174): cargando (con alto fijo, para no mover la
 * página), sin datos (dice qué falta), falta historia (cuánto hace falta y cuánto hay), una falla (con «Reintentar», sin
 * parecer un vacío) y sin acceso, que **no dibuja nada**: un área sin acceso no deja rastro, ni en gris ni con candado.
 */
import { BloqueDeEstado } from '../../../../components/estados';
import { ICONO_DE_FALLA, textoDeFalla, type MotivoDeFalla } from '../../../../lib/fallas';
import { COPY_DE_LOS_GRAFICOS } from './copy';
import { empiezaAntesDelVinculo, type PeriodoDelGrafico } from './eje-de-fechas';

export type EstadoDelGrafico =
  | { readonly tipo: 'CARGANDO' }
  /** «Sin sesiones registradas desde el inicio del acompañamiento». */
  | { readonly tipo: 'SIN_DATOS'; readonly texto: string }
  /** «Se arma con 5 sesiones por lado; hay 3 y 7»: un número por lado, o uno solo (GR-T22). */
  | { readonly tipo: 'FALTA_HISTORIA'; readonly hay: readonly number[]; readonly hacen: number; readonly unidad: string }
  | { readonly tipo: 'ERROR'; readonly motivo: MotivoDeFalla }
  | { readonly tipo: 'SIN_ACCESO' };

/** El alto que guarda un gráfico mientras carga, para que la página no salte al llegar los datos. */
export const ALTO_MIENTRAS_CARGA = 160;

export function EstadoDelGraficoEnPantalla({ estado, onReintentar, alto = ALTO_MIENTRAS_CARGA }: { estado: EstadoDelGrafico; onReintentar?: () => void; alto?: number }) {
  switch (estado.tipo) {
    case 'SIN_ACCESO':
      return null;
    case 'CARGANDO':
      return (
        <div className="grafico-base__cargando" style={{ minHeight: alto }}>
          <BloqueDeEstado tipo="cargando" icono="espera">
            {COPY_DE_LOS_GRAFICOS.cargando}
          </BloqueDeEstado>
        </div>
      );
    case 'SIN_DATOS':
      return (
        <BloqueDeEstado tipo="vacio" icono="informacion">
          {estado.texto}
        </BloqueDeEstado>
      );
    case 'FALTA_HISTORIA':
      return (
        <BloqueDeEstado tipo="vacio" icono="informacion">
          {COPY_DE_LOS_GRAFICOS.faltaHistoria(estado.hacen, estado.unidad, estado.hay)}
        </BloqueDeEstado>
      );
    case 'ERROR':
      return (
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[estado.motivo]} onReintentar={onReintentar ?? null} deQue={COPY_DE_LOS_GRAFICOS.queSeReintenta} rol="alert">
          {textoDeFalla(estado.motivo, COPY_DE_LOS_GRAFICOS.queSeReintenta)}
        </BloqueDeEstado>
      );
  }
}

/** La nota del límite del vínculo (TB-16; DJ-14): solo si el período pedido empieza antes del acompañamiento. */
export function NotaDelInicio({ periodo }: { periodo: PeriodoDelGrafico }) {
  if (!empiezaAntesDelVinculo(periodo)) return null;
  return <p className="nota grafico-base__nota">{COPY_DE_LOS_GRAFICOS.inicioDelVinculo}</p>;
}
