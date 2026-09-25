import { Inject, Injectable } from '@nestjs/common';
import type { EjercicioCandidato, LicenciaExterna } from '@be/domain';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { comoJson, consultarProveedor, ProveedorNoDisponible, textoDelProveedor, type RespuestaDelProveedor } from './proveedor-http';

/**
 * wger (RF-038; 09v12 §7). Se consulta un ejercicio por su número y se normaliza para revisión: el nombre —en español
 * si wger lo tiene—, la categoría y los músculos y el material **tal como los declara el proveedor**. Esos músculos
 * nunca se copian como zona BE (09v12:397-401; B10-06 §22): son información para quien revisa.
 *
 * La licencia es la de la traducción elegida, porque el nombre es lo que se incorpora, con su autoría. wger publica
 * cada texto con su propia licencia y autor, y ninguno se toma prestado del otro: si la traducción no dice su licencia
 * o su autor, el candidato lo dice así (CC BY-SA cita a quien escribió el texto, no a quien cargó el ejercicio).
 */
const IDIOMA_ESPANOL = 4;
const IDIOMA_INGLES = 2;

/** Las licencias que wger publica en /api/v2/license/ (consultadas el 2026-09-24). */
const LICENCIAS: Readonly<Record<number, Omit<LicenciaExterna, 'attribution'>>> = {
  1: { id: 'CC-BY-SA-3.0', label: 'Creative Commons Attribution Share Alike 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/' },
  2: { id: 'CC-BY-SA-4.0', label: 'Creative Commons Attribution Share Alike 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  3: { id: 'CC0-1.0', label: 'Creative Commons Public Domain 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  4: { id: 'CC-BY-4.0', label: 'Creative Commons Attribution 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
  5: { id: 'ODbL-1.0', label: 'Open Database License (ODbL) 1.0', url: 'https://opendatacommons.org/licenses/odbl/1-0/' },
};

export type ResultadoDeWger =
  | { readonly encontrado: true; readonly candidato: EjercicioCandidato; readonly respuesta: RespuestaDelProveedor; readonly licencia: LicenciaExterna }
  | { readonly encontrado: false };

@Injectable()
export class Wger {
  constructor(@Inject(ENTORNO) private readonly entorno: Entorno) {}

  async consultar(numero: string): Promise<ResultadoDeWger> {
    const url = `${this.entorno.proveedores.wgerUrl}/api/v2/exerciseinfo/${encodeURIComponent(numero)}/`;
    const respuesta = await consultarProveedor(url, this.entorno.proveedores.presupuestoMs);
    const json = comoJson(respuesta.cuerpo);
    const cuerpo = json !== null && typeof json === 'object' && !Array.isArray(json) ? (json as Record<string, unknown>) : null;
    // «No existe ese ejercicio» es el 404 propio de wger: un JSON con `detail`. Un 404 con otra forma —una ruta que
    // cambió, como cuando `exercisebaseinfo` pasó a `exerciseinfo`— no dice nada del ejercicio: es una caída.
    if (respuesta.status === 404 && typeof cuerpo?.detail === 'string') return { encontrado: false };
    if (respuesta.status !== 200 || cuerpo === null) throw new ProveedorNoDisponible(`respuesta inesperada ${respuesta.status}`);
    const { candidato, licencia } = normalizarEjercicio(cuerpo);
    return { encontrado: true, candidato, respuesta, licencia };
  }
}

interface Traduccion {
  readonly language?: unknown;
  readonly name?: unknown;
  readonly license?: unknown;
  readonly license_author?: unknown;
}

/** El ejercicio tal como lo describe wger, llevado a la forma del candidato. Pura: se prueba sin red. */
export function normalizarEjercicio(e: Record<string, unknown>): { candidato: EjercicioCandidato; licencia: LicenciaExterna } {
  // Solo objetos: un `null` o un número en la lista no es una traducción (y no puede tirar la request).
  const traducciones = (Array.isArray(e.translations) ? e.translations : []).filter((t): t is Traduccion => t !== null && typeof t === 'object' && !Array.isArray(t));
  const conNombre = traducciones.filter((t) => textoDelProveedor(t.name) !== null);
  const elegida = conNombre.find((t) => t.language === IDIOMA_ESPANOL) ?? conNombre.find((t) => t.language === IDIOMA_INGLES) ?? conNombre[0] ?? null;
  const idioma = elegida === null ? null : elegida.language === IDIOMA_ESPANOL ? 'es' : elegida.language === IDIOMA_INGLES ? 'en' : 'other';
  const nombres = (lista: unknown): string[] =>
    (Array.isArray(lista) ? lista : [])
      .map((m) => (m && typeof m === 'object' ? textoDelProveedor((m as { name?: unknown }).name, 120) : null))
      .filter((n): n is string => n !== null);
  const categoria = e.category && typeof e.category === 'object' ? (e.category as { name?: unknown }).name : null;
  return {
    candidato: {
      name: elegida ? textoDelProveedor(elegida.name) : null,
      nameLanguage: idioma,
      category: textoDelProveedor(categoria, 120),
      primaryMuscles: nombres(e.muscles),
      secondaryMuscles: nombres(e.muscles_secondary),
      equipment: nombres(e.equipment),
    },
    licencia: licenciaDe(elegida, e),
  };
}

/**
 * La licencia del nombre que se incorpora: la de la traducción elegida, con **su** autor. Si no hay traducción —el
 * profesional escribe el nombre—, lo consultado es el ejercicio, y vale su licencia con su autor. El `id` se normaliza
 * por el número que publica wger, venga del texto o del ejercicio.
 */
function licenciaDe(t: Traduccion | null, e: Record<string, unknown>): LicenciaExterna {
  if (t !== null) {
    const conocida = typeof t.license === 'number' ? LICENCIAS[t.license] : undefined;
    const autor = textoDelProveedor(t.license_author);
    return conocida ? { ...conocida, attribution: autor } : { id: 'desconocida', label: 'Licencia no informada por wger', url: null, attribution: autor };
  }
  const delEjercicio = e.license && typeof e.license === 'object' ? (e.license as { id?: unknown; short_name?: unknown; full_name?: unknown; url?: unknown }) : null;
  const autor = textoDelProveedor(e.license_author);
  const conocida = typeof delEjercicio?.id === 'number' ? LICENCIAS[delEjercicio.id] : undefined;
  if (conocida) return { ...conocida, attribution: autor };
  return {
    id: textoDelProveedor(delEjercicio?.short_name, 60) ?? 'desconocida',
    label: textoDelProveedor(delEjercicio?.full_name, 120) ?? 'Licencia no informada por wger',
    url: typeof delEjercicio?.url === 'string' && delEjercicio.url.startsWith('https://') ? delEjercicio.url.slice(0, 300) : null,
    attribution: autor,
  };
}
