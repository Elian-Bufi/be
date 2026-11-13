/**
 * Las preferencias de la sesión en este teléfono (WP-PULIDO-GRANDES, DL-173): la pantalla encendida durante la sesión
 * (PG-05, con PG-D3) y la háptica (PG-08, con PG-D4). Se guardan como los ajustes del descanso: con AsyncStorage, se leen
 * una vez al abrir la app y, si el teléfono no deja leer, valen las de fábrica. No viajan a la API. Es lógica pura: el
 * almacenamiento se inyecta (`preferencias-en-el-telefono.ts` pone AsyncStorage) y la prueba usa uno en memoria.
 *
 * Van aparte de los ajustes del descanso para no cambiar lo que esos guardan ni su prueba (TEST-AVR-020).
 */
import type { AlmacenDeTexto } from './descanso-automatico';

export interface PreferenciasDelTelefono {
  /** PG-05: la pantalla no se apaga mientras corre la sesión. */
  readonly pantallaEncendida: boolean;
  /** PG-08: los tres toques (confirmar, deshacer y error). */
  readonly haptica: boolean;
}

/** Las de fábrica: las dos prendidas (PG-D3 y PG-D4, a ratificar), y se apagan desde la app. */
export const PREFERENCIAS_DE_FABRICA: PreferenciasDelTelefono = { pantallaEncendida: true, haptica: true };

export const CLAVE_DE_LAS_PREFERENCIAS = 'be:preferencias-del-telefono';

/** Lo guardado, si tiene la forma; lo que falte o no sirva, de fábrica. */
export function preferenciasDe(texto: string | null): PreferenciasDelTelefono {
  if (!texto) return PREFERENCIAS_DE_FABRICA;
  try {
    const p = JSON.parse(texto) as Partial<Record<keyof PreferenciasDelTelefono, unknown>>;
    return {
      pantallaEncendida: typeof p.pantallaEncendida === 'boolean' ? p.pantallaEncendida : PREFERENCIAS_DE_FABRICA.pantallaEncendida,
      haptica: typeof p.haptica === 'boolean' ? p.haptica : PREFERENCIAS_DE_FABRICA.haptica,
    };
  } catch {
    return PREFERENCIAS_DE_FABRICA;
  }
}

export interface PreferenciasGuardadas {
  leer(): Promise<PreferenciasDelTelefono>;
  /** `false` si no se pudieron guardar: siguen valiendo mientras la app esté abierta. */
  cambiar(cambios: Partial<PreferenciasDelTelefono>): Promise<boolean>;
  actuales(): PreferenciasDelTelefono;
  suscribir(alCambiar: () => void): () => void;
}

export function crearPreferenciasDelTelefono(almacen: AlmacenDeTexto): PreferenciasGuardadas {
  let actuales = PREFERENCIAS_DE_FABRICA;
  const oyentes = new Set<() => void>();
  const fijar = (p: PreferenciasDelTelefono) => {
    actuales = p;
    for (const o of oyentes) o();
  };
  return {
    async leer() {
      try {
        fijar(preferenciasDe(await almacen.getItem(CLAVE_DE_LAS_PREFERENCIAS)));
      } catch {
        fijar(PREFERENCIAS_DE_FABRICA);
      }
      return actuales;
    },
    async cambiar(cambios) {
      fijar({ ...actuales, ...cambios });
      try {
        await almacen.setItem(CLAVE_DE_LAS_PREFERENCIAS, JSON.stringify(actuales));
        return true;
      } catch {
        return false;
      }
    },
    actuales: () => actuales,
    suscribir(alCambiar) {
      oyentes.add(alCambiar);
      return () => {
        oyentes.delete(alCambiar);
      };
    },
  };
}
