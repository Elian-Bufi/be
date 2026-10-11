/**
 * Qué ícono acompaña a cada cosa de la ficha (WP-ESCRITORIO-AMABLE): una métrica, un área, la clase de un dato o el
 * motivo de una falla. Los comparten la entrada de «Analizar», sus gráficos y el Resumen. Un ícono acompaña siempre a
 * su palabra: nunca va solo ni dice algo que el texto no diga.
 */
import type { AreaDelResumen, DefinicionDeMetrica, NombreDeIcono, ReferenciaDeMetrica } from '@be/domain';
import type { MotivoDeFalla } from './contexto';

/** El ícono de cada métrica fija. */
export const ICONO_DE_METRICA: Readonly<Record<string, NombreDeIcono>> = {
  'nutricion.energia': 'calorias',
  'nutricion.carbohidratos': 'carbohidratos',
  'nutricion.grasas': 'grasas',
  'nutricion.proteinas': 'proteinas',
  'nutricion.fibra': 'fibra',
  'nutricion.registros': 'comida',
  'entrenamiento.carga': 'carga',
  'entrenamiento.repeticiones': 'repetir',
  'entrenamiento.series-registradas': 'series',
};

/** El ícono de una medida corporal, por lo que mide: una masa, un pliegue, un perímetro; lo demás es un resultado calculado. */
export function iconoDeLaMedida(d: DefinicionDeMetrica | null): NombreDeIcono {
  const familia = d?.familia ?? '';
  if (familia.startsWith('masa')) return 'peso';
  if (familia.startsWith('pliegue') || familia.startsWith('sumatoria')) return 'pliegue';
  if (familia.startsWith('perimetro')) return 'perimetro';
  return 'calculado';
}

/** El ícono de una métrica elegida, sea fija o una medida corporal. */
export const iconoDeLaReferencia = (ref: ReferenciaDeMetrica, definicion: DefinicionDeMetrica | null): NombreDeIcono => ICONO_DE_METRICA[ref.metricId] ?? iconoDeLaMedida(definicion);

export const ICONO_DEL_AREA: Readonly<Record<AreaDelResumen, NombreDeIcono>> = { NUTRICION: 'nutricion', ENTRENAMIENTO: 'entrenamiento', ANTROPOMETRIA: 'antropometria' };

/** El ícono de la clase de un dato: medido, reportado por la persona o calculado por un método. */
export const ICONO_DE_CLASE: Readonly<Record<'MEASURED' | 'REPORTED' | 'DERIVED', NombreDeIcono>> = { MEASURED: 'medido', REPORTED: 'reportado', DERIVED: 'calculado' };

/** El ícono de una falla, por su motivo: se reconoce sin depender de un color. */
export const ICONO_DE_FALLA: Readonly<Record<MotivoDeFalla, NombreDeIcono>> = { LIMITE: 'espera', RED: 'sin-conexion', SERVICIO: 'servicio', OTRO: 'aviso' };
