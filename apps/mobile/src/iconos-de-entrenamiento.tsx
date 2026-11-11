/**
 * Los íconos de la sesión de entrenamiento (WP-ENTRENAMIENTO-SERIES §7). Acompañan a un texto que dice lo mismo: el lector
 * de pantalla no los recorre.
 *
 * Desde PA-06 (2026-11-02) los que tienen par en la familia de BE se dibujan de ahí (`icono.tsx`), con el mismo nombre y
 * la misma firma, así cada pantalla los sigue usando igual: la mancuerna es `entrenamiento`, la lista de la rutina es
 * `lista`, la hoja del plan es `plan` y la nube de lo que falta enviar es `sin-enviar`. Quedan propios el cronómetro, que
 * en cada lugar de la sesión pasa a un ícono distinto de la familia (el reloj, el descanso, empezar y terminar) cuando se
 * coloquen los íconos pantalla por pantalla, y la nube con el aviso de la recuperación, que es una ilustración de 96 dp.
 */
import Svg, { Circle, Path } from 'react-native-svg';
import type { Ocurrencia } from '@be/domain';
import { DibujoDeIcono, type NombreDeIcono } from './icono';

interface PropsDeIcono {
  readonly color: string;
  readonly tamano?: number;
}

const sinLector = { accessible: false, importantForAccessibility: 'no-hide-descendants' } as const;
const trazo = (color: string, grosor: number) => ({ stroke: color, strokeWidth: grosor, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }) as const;

/** La mancuerna del destino Entrenamiento: el respaldo de un ejercicio sin imagen. */
export function IconoDeEjercicio({ color, tamano = 40 }: PropsDeIcono) {
  return <DibujoDeIcono nombre="entrenamiento" color={color} tamano={tamano} />;
}

/** Un cronómetro: el temporizador de la sesión, el descanso y «Cronometrar serie». */
export function IconoDeCronometro({ color, tamano = 22, grosor = 1.8 }: PropsDeIcono & { readonly grosor?: number }) {
  const t = trazo(color, grosor);
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" {...sinLector}>
      <Circle cx={12} cy={13.5} r={7.5} {...t} />
      <Path d="M12 13.5V9.6M10 2.8h4M12 2.8v3.2M18.2 6.6l1.4-1.4" {...t} />
    </Svg>
  );
}

/** Una lista: «Ver rutina». */
export function IconoDeRutina({ color, tamano = 22 }: PropsDeIcono) {
  return <DibujoDeIcono nombre="lista" color={color} tamano={tamano} />;
}

/** Una hoja con renglones: la banda «Plan de la serie N». */
export function IconoDePlan({ color, tamano = 24 }: PropsDeIcono) {
  return <DibujoDeIcono nombre="plan" color={color} tamano={tamano} />;
}

/** Una nube: lo que está guardado en el teléfono y todavía falta enviar. */
export function IconoDeNube({ color, tamano = 20 }: PropsDeIcono) {
  return <DibujoDeIcono nombre="sin-enviar" color={color} tamano={tamano} />;
}

/**
 * La nube con un aviso: la comprobación de la sesión está tardando (referencia 02). El aviso va en el color de las
 * acciones destructivas, con su texto, que es un par medido por la prueba de contraste.
 */
export function IconoDeNubeConAviso({ color, aviso, textoDelAviso, tamano = 96 }: { readonly color: string; readonly aviso: string; readonly textoDelAviso: string; readonly tamano?: number }) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 48 48" {...sinLector}>
      <Path d="M14 35h19.5a7.6 7.6 0 0 0 1.1-15.1A10.6 10.6 0 0 0 14.2 17.4 8.8 8.8 0 0 0 14 35Z" {...trazo(color, 2.4)} />
      <Circle cx={35} cy={34} r={7.5} fill={aviso} />
      <Path d="M35 30v4.6" stroke={textoDelAviso} strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={35} cy={38} r={1.4} fill={textoDelAviso} />
    </Svg>
  );
}

/**
 * El ícono de la insignia de estado de una sesión del plan (PA-06), el mismo en Inicio y en Entrenamiento: acompaña al
 * texto de `vistaDeOcurrencia`, que es el que dice el estado. Sin registro, la marca vacía; en curso, el reloj; con
 * desvío, el desvío; no realizada, la salteada; registrada, el guardado. Nunca una tilde: la insignia no aprueba nada.
 */
export function iconoDelEstado(execution: Pick<Ocurrencia['execution'], 'state' | 'sessionCondition'>): NombreDeIcono {
  if (execution.state === 'DRAFT_IN_PROGRESS') return 'reloj';
  if (execution.state !== 'REGISTERED' || !execution.sessionCondition) return 'sin-registro';
  if (execution.sessionCondition === 'NOT_COMPLETED') return 'salteada';
  return execution.sessionCondition === 'COMPLETED_WITH_DEVIATION' ? 'desvio' : 'guardar';
}
