import { Inject, Injectable } from '@nestjs/common';
import type { EjercicioCandidato, LicenciaExterna } from '@be/domain';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { comoJson, consultarProveedor, ProveedorNoDisponible, type RespuestaDelProveedor } from './proveedor-http';

/**
 * wger (RF-038; 09v12 §7). Se consulta un ejercicio por su número y se normaliza para revisión: el nombre —en español
 * si wger lo tiene—, la categoría y los músculos y el material **tal como los declara el proveedor**. Esos músculos
 * nunca se copian como zona BE (09v12:397-401; B10-06 §22): son información para quien revisa.
 *
 * La licencia es la de la traducción elegida, porque el nombre es lo que se incorpora, con su autoría. wger publica
 * cada texto con su propia licencia y autor.
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
    if (respuesta.status === 404) return { encontrado: false };
    const json = comoJson(respuesta.cuerpo);
    if (respuesta.status !== 200 || json === null || typeof json !== 'object') throw new ProveedorNoDisponible(`respuesta inesperada ${respuesta.status}`);
    const { candidato, licencia } = normalizarEjercicio(json as Record<string, unknown>);
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
  const traducciones = (Array.isArray(e.translations) ? e.translations : []) as Traduccion[];
  const conNombre = traducciones.filter((t) => typeof t.name === 'string' && t.name.trim() !== '');
  const elegida = conNombre.find((t) => t.language === IDIOMA_ESPANOL) ?? conNombre.find((t) => t.language === IDIOMA_INGLES) ?? conNombre[0] ?? null;
  const idioma = elegida === null ? null : elegida.language === IDIOMA_ESPANOL ? 'es' : elegida.language === IDIOMA_INGLES ? 'en' : 'other';
  const nombres = (lista: unknown): string[] =>
    (Array.isArray(lista) ? lista : [])
      .map((m) => (m && typeof m === 'object' && typeof (m as { name?: unknown }).name === 'string' ? ((m as { name: string }).name.trim()) : ''))
      .filter((n) => n !== '');
  const categoria = e.category && typeof e.category === 'object' ? (e.category as { name?: unknown }).name : null;
  return {
    candidato: {
      name: elegida ? (elegida.name as string).trim().slice(0, 200) : null,
      nameLanguage: idioma,
      category: typeof categoria === 'string' && categoria.trim() !== '' ? categoria.trim() : null,
      primaryMuscles: nombres(e.muscles),
      secondaryMuscles: nombres(e.muscles_secondary),
      equipment: nombres(e.equipment),
    },
    licencia: licenciaDe(elegida, e),
  };
}

/** La licencia de la traducción elegida, con su autor; si wger no la informa, la del ejercicio. */
function licenciaDe(t: Traduccion | null, e: Record<string, unknown>): LicenciaExterna {
  const autor = (valor: unknown): string | null => (typeof valor === 'string' && valor.trim() !== '' ? valor.trim().slice(0, 200) : null);
  const conocida = typeof t?.license === 'number' ? LICENCIAS[t.license] : undefined;
  if (conocida) return { ...conocida, attribution: autor(t?.license_author) ?? autor(e.license_author) };
  const delEjercicio = e.license && typeof e.license === 'object' ? (e.license as { short_name?: unknown; full_name?: unknown; url?: unknown }) : null;
  return {
    id: typeof delEjercicio?.short_name === 'string' && delEjercicio.short_name.trim() !== '' ? delEjercicio.short_name.trim() : 'desconocida',
    label: typeof delEjercicio?.full_name === 'string' && delEjercicio.full_name.trim() !== '' ? delEjercicio.full_name.trim() : 'Licencia no informada por wger',
    url: typeof delEjercicio?.url === 'string' ? delEjercicio.url : null,
    attribution: autor(e.license_author),
  };
}
