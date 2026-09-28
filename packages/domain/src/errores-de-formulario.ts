/**
 * DL-104 · qué hace la APK cuando la API rechaza una respuesta o una rectificación de formulario por sus datos.
 *
 * Lógica pura, sin React Native, para poder probarla sola (`errores-de-formulario.test.ts`) con el mismo cliente HTTP
 * que usa la APK. La pantalla (`apps/mobile/src/pantallas/formularios.tsx`) solo muestra lo que esto decide:
 * - **por campo:** el `422 FORM_RESPONSE_INVALID` trae un issue por número fuera de límites. Cada campo recibe un
 *   mensaje junto a él, con el rango que admite y la unidad de la plantilla; el resumen los nombra por su rótulo;
 * - **dato no aceptado:** es un `FORM_RESPONSE_INVALID` sin issues que la APK reconozca. Se dice que un dato no se
 *   aceptó, nunca que el servicio no está disponible: es un problema de datos, no de conexión ni del servidor;
 * - **cualquier otro fallo:** no es de esta función (`null`), y la pantalla sigue con `falloDe` (red, 404, conflicto,
 *   servicio).
 * Lo escrito no se toca: la pantalla conserva los valores, y la persona corrige solo lo marcado.
 */
import type { Resultado } from './cliente-http';
import { CODIGO_DE_NUMERO_FUERA_DE_LIMITES, ProblemaDeRespuestaSchema, type CampoDePlantilla, type ProblemaDeRespuesta } from './contratos-formularios';
import { COPY } from './copy';
import { COPY_FORMULARIOS } from './copy-formularios';
import { numero } from './formato-numeros';
import type { LimitesNumericos } from './formularios';

/** Qué pasó con el número, antes del rango que se admite. */
const MOTIVO: Readonly<Record<ProblemaDeRespuesta['code'], string>> = {
  [CODIGO_DE_NUMERO_FUERA_DE_LIMITES.NOT_INTEGER]: 'Sin decimales.',
  [CODIGO_DE_NUMERO_FUERA_DE_LIMITES.BELOW_MINIMUM]: 'Es menos de lo que se admite.',
  [CODIGO_DE_NUMERO_FUERA_DE_LIMITES.ABOVE_MAXIMUM]: 'Es más de lo que se admite.',
};

/**
 * Los valores que admite un campo, con la coma del país (DL-091 punto 4) y la unidad de la plantilla:
 * «Ingresá un número entero entre 1 y 7 días por semana.».
 */
export function valoresAdmitidos(limites: LimitesNumericos, unidad: string | null): string {
  const tipo = limites.integer ? 'un número entero' : 'un número';
  const u = unidad ? ` ${unidad}` : '';
  const { minimum: min, maximum: max } = limites;
  if (min !== undefined && max !== undefined) return `Ingresá ${tipo} entre ${numero(min)} y ${numero(max)}${u}.`;
  if (min !== undefined) return `Ingresá ${tipo} de ${numero(min)}${u} o más.`;
  if (max !== undefined) return `Ingresá ${tipo} de hasta ${numero(max)}${u}.`;
  return `Ingresá ${tipo}.`;
}

/** El mensaje de un campo: qué pasó y qué valores admite. */
export function mensajeDeProblema(p: ProblemaDeRespuesta, unidad: string | null): string {
  return `${MOTIVO[p.code]} ${valoresAdmitidos(p.limits, unidad)}`;
}

/**
 * Los issues que la APK reconoce: con la forma de DL-104 y de un campo que la pantalla muestra. Lo que no reconoce se
 * ignora (un issue de otra versión de la API, o de otro campo). Si un campo viene dos veces, vale el primero.
 */
export function problemasReconocidos(issues: unknown, camposMostrados: readonly string[]): ProblemaDeRespuesta[] {
  // El cliente pasa `details.issues` sin validarlo: si no es un arreglo, no hay nada reconocible (y no se rompe).
  if (!Array.isArray(issues)) return [];
  const vistos = new Set<string>();
  const reconocidos: ProblemaDeRespuesta[] = [];
  for (const issue of issues as readonly unknown[]) {
    const p = ProblemaDeRespuestaSchema.safeParse(issue);
    if (!p.success || !camposMostrados.includes(p.data.fieldCode) || vistos.has(p.data.fieldCode)) continue;
    vistos.add(p.data.fieldCode);
    reconocidos.push(p.data);
  }
  return reconocidos;
}

export type RechazoDeFormulario =
  | {
      readonly tipo: 'por-campo';
      /** Mensaje por `fieldCode`, para mostrarlo junto a cada campo. */
      readonly errores: Readonly<Record<string, string>>;
      /** Título del resumen, que se anuncia: «Revisá los campos marcados. Hay 1 dato que necesita corrección.». */
      readonly resumen: string;
      /** Una línea por campo, con su rótulo: «Cuántos días por semana…: Es más de lo que se admite. Ingresá…». */
      readonly lineas: readonly string[];
    }
  | { readonly tipo: 'dato-no-aceptado'; readonly mensaje: string };

/**
 * Qué mostrar ante el fallo de un envío de formulario, o `null` si no es un rechazo por los datos (y lo decide
 * `falloDe`). `campos` son los campos que la pantalla muestra, con su rótulo y su unidad de la plantilla (FRM-02).
 */
export function rechazoDeFormulario(r: Resultado<unknown>, campos: readonly CampoDePlantilla[]): RechazoDeFormulario | null {
  if (r.ok || r.tipo !== 'API' || r.codigo !== 'FORM_RESPONSE_INVALID') return null;
  const problemas = problemasReconocidos(
    r.issues,
    campos.map((c) => c.fieldCode),
  );
  if (problemas.length === 0) return { tipo: 'dato-no-aceptado', mensaje: COPY_FORMULARIOS.respuestaNoAceptada };
  const errores: Record<string, string> = {};
  const lineas: string[] = [];
  for (const p of problemas) {
    const campo = campos.find((c) => c.fieldCode === p.fieldCode) as CampoDePlantilla;
    const mensaje = mensajeDeProblema(p, campo.unit);
    errores[p.fieldCode] = mensaje;
    lineas.push(`${campo.label}: ${mensaje}`);
  }
  return { tipo: 'por-campo', errores, resumen: COPY.resumenDeErrores(problemas.length), lineas };
}
