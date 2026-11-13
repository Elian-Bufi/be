import type { IncomingMessage } from 'node:http';

/*
 * El límite del cuerpo JSON de las escrituras que llevan un plan entero (un borrador o una plantilla) o una receta (DL-168,
 * arreglo del 2026-11-11).
 *
 * El resto de la API sigue con los 16 KB de `LIMITE_DE_CUERPO` (bootstrap.ts): sus contratos son chicos. Un borrador de
 * plan no lo es: el editor del website manda el plan completo en cada guardado, con el identificador de cada nodo, porque
 * API-NUT-10 y API-TRN-10 reemplazan la estructura entera. Con 16 KB no entraba ni un plan de dos días tipo: el de Diego
 * Sosa, con su «Día habitual» duplicado y una colación con un alimento, pesa 16.406 bytes (22 más que el límite), y desde
 * ahí cada guardado se rechazaba en el parser, sin llegar a ninguna ruta (B28 de las capturas de los flujos de
 * planificación: el registro de la API muestra los PATCH con 400, «SIN_RUTA» y 0-1 ms).
 *
 * Por qué 700 KB: es diez veces el plan de Nutrición realista más grande (3 días tipo × 5 comidas × 3 opciones × 5
 * alimentos, cada alimento con una nota: 66 KB), redondeado hacia arriba. Entran también un plan de Entrenamiento de 12
 * semanas (5 sesiones por semana, 8 ejercicios y 4 series, con notas: 452 KB) y la receta más grande que admite el
 * contrato (18 KB). Esos tres se guardan, con su medida, en `test/integration/guardado-de-planes-grandes.int-spec.ts`.
 *
 * Las plantillas (ampliación de DL-168, el mismo día): «Guardar como plantilla» manda la estructura que está en el editor,
 * con sus identificadores, así que pesa lo mismo que el guardado del plan. Crear una plantilla y crear una versión nueva,
 * en Nutrición (API-TPN-01 y 04) y en Entrenamiento (API-TPL-01 y 04), tienen el mismo límite.
 *
 * Lo que no cambia:
 * - la validación del contrato, con sus topes por lista (7 días tipo, 12 comidas, 40 ítems…);
 * - la cota de elementos de `validacion.ts`, con el mismo techo para todas las rutas: un cuerpo con más de 6.000
 *   elementos de listas se rechaza con TOO_BIG sin recorrerlo. Así el trabajo de zod por pedido no crece con el límite.
 *   Un plan real queda muy lejos: el de Nutrición más grande tiene 288 elementos; el de Entrenamiento de 12 semanas,
 *   unos 2.900.
 */

/** 700 KB, en bytes (body-parser acepta el número tal cual). */
export const LIMITE_DE_PLANES_Y_RECETAS = 700 * 1024;

export interface RutaConLimiteMayor {
  readonly operacion: string;
  readonly metodo: 'POST' | 'PATCH';
  /** Sobre la ruta sin la consulta. Sin distinguir mayúsculas y con la barra final opcional, como el router de Express. */
  readonly patron: RegExp;
}

/**
 * Las catorce escrituras con el límite de planes y recetas: los borradores de planes, las plantillas, las recetas y, desde
 * ED-64 (WP-EDITORES-PROFESIONAL, DL-167), los habituales: una sesión de 8 ejercicios × 6 series con notas pasa los 16 KB. Las
 * demás de esas familias (validar, activar, descartar, cambiar el nombre o el estado de una plantilla, el cálculo de una
 * receta, su imagen) siguen con 16 KB: sus cuerpos son chicos.
 */
export const RUTAS_DE_PLANES_Y_RECETAS: readonly RutaConLimiteMayor[] = [
  { operacion: 'API-NUT-07', metodo: 'POST', patron: /^\/api\/v1\/advisees\/[^/]+\/nutrition\/plans\/?$/i },
  { operacion: 'API-NUT-10', metodo: 'PATCH', patron: /^\/api\/v1\/nutrition\/plans\/[^/]+\/?$/i },
  { operacion: 'API-TRN-07', metodo: 'POST', patron: /^\/api\/v1\/advisees\/[^/]+\/training\/plans\/?$/i },
  { operacion: 'API-TRN-10', metodo: 'PATCH', patron: /^\/api\/v1\/training\/plans\/[^/]+\/?$/i },
  { operacion: 'API-TPN-01', metodo: 'POST', patron: /^\/api\/v1\/nutrition\/plan-templates\/?$/i },
  { operacion: 'API-TPN-04', metodo: 'POST', patron: /^\/api\/v1\/nutrition\/plan-templates\/[^/]+\/versions\/?$/i },
  { operacion: 'API-TPL-01', metodo: 'POST', patron: /^\/api\/v1\/training\/plan-templates\/?$/i },
  { operacion: 'API-TPL-04', metodo: 'POST', patron: /^\/api\/v1\/training\/plan-templates\/[^/]+\/versions\/?$/i },
  { operacion: 'API-REC-01', metodo: 'POST', patron: /^\/api\/v1\/nutrition\/recipes\/?$/i },
  { operacion: 'API-REC-04', metodo: 'PATCH', patron: /^\/api\/v1\/nutrition\/recipes\/[^/]+\/?$/i },
  { operacion: 'API-HAB-04', metodo: 'POST', patron: /^\/api\/v1\/training\/session-presets\/?$/i },
  { operacion: 'API-HAB-05', metodo: 'PATCH', patron: /^\/api\/v1\/training\/session-presets\/[^/]+\/?$/i },
  { operacion: 'API-HAN-04', metodo: 'POST', patron: /^\/api\/v1\/nutrition\/meal-presets\/?$/i },
  { operacion: 'API-HAN-05', metodo: 'PATCH', patron: /^\/api\/v1\/nutrition\/meal-presets\/[^/]+\/?$/i },
];

/** Si el pedido es una de esas catorce escrituras, por su método y su ruta (sin la consulta). */
export function esEscrituraDePlanOReceta(req: Pick<IncomingMessage, 'method' | 'url'>): boolean {
  const ruta = (req.url ?? '').split('?')[0] ?? '';
  return RUTAS_DE_PLANES_Y_RECETAS.some((r) => r.metodo === req.method && r.patron.test(ruta));
}

/**
 * El `type` del parser de planes y recetas (bootstrap.ts): un cuerpo JSON, como el que lee el parser general, en una de
 * las catorce rutas. Lo que no cumple las dos cosas lo lee el general, con sus 16 KB.
 */
export function esJsonDePlanOReceta(req: IncomingMessage): boolean {
  const tipo = String(req.headers['content-type'] ?? '')
    .split(';')[0]
    ?.trim()
    .toLowerCase();
  return tipo === 'application/json' && esEscrituraDePlanOReceta(req);
}
