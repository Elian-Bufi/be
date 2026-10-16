/**
 * Fallas: por qué no llegó una lectura, y cómo se dice. Una falla nunca se presenta como ausencia de datos, y el código
 * de la API nunca se muestra (10-B01:1146-1189). Lo usan la ficha del asesorado y el Espacio profesional.
 */
import type { NombreDeIcono, Resultado } from '@be/domain';

/** Por qué falló una lectura. Decide el texto y el ícono. */
export type MotivoDeFalla = 'LIMITE' | 'RED' | 'SERVICIO' | 'OTRO';

export function motivoDeFalla(r: Resultado<unknown>): MotivoDeFalla {
  if (r.ok) return 'OTRO';
  if (r.tipo === 'RED') return 'RED';
  // El límite de lecturas protegidas es por profesional y por minuto: explorar muy rápido puede tocarlo.
  if (r.codigo === 'RATE_LIMITED') return 'LIMITE';
  return r.status >= 500 ? 'SERVICIO' : 'OTRO';
}

/** Por qué falló una lectura y qué se puede hacer, como va después de «No pudimos cargar X». */
const RAZON_DE_FALLA: Readonly<Record<MotivoDeFalla, string>> = {
  LIMITE: 'hubo muchas consultas seguidas. Esperá un minuto y reintentá.',
  RED: 'no hay conexión con BE. Revisá la conexión y reintentá.',
  SERVICIO: 'BE no está disponible en este momento. Reintentá en unos minutos.',
  OTRO: 'No es una ausencia de datos: reintentá.',
};

/** El texto de una falla, con lo que se puede hacer. Una falla nunca se presenta como ausencia de datos. */
export function textoDeFalla(motivo: MotivoDeFalla, que: string): string {
  return motivo === 'OTRO' ? `No pudimos cargar ${que}. ${RAZON_DE_FALLA.OTRO}` : `No pudimos cargar ${que}: ${RAZON_DE_FALLA[motivo]}`;
}

/** La misma razón, en una frase que se lee sola: para un bloque que ya dice arriba qué es lo que no cargó. */
export const razonDeFalla = (motivo: MotivoDeFalla): string => RAZON_DE_FALLA[motivo].replace(/^./, (c) => c.toUpperCase());

/** El ícono de una falla, por su motivo: se reconoce sin depender de un color. */
export const ICONO_DE_FALLA: Readonly<Record<MotivoDeFalla, NombreDeIcono>> = { LIMITE: 'espera', RED: 'sin-conexion', SERVICIO: 'servicio', OTRO: 'aviso' };
