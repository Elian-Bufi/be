/**
 * La explicación de los tiempos («Guardamos los tiempos que marcás…») se muestra una sola vez por cuenta en este
 * teléfono (AV2-33, el hallazgo de Dirección en la 0.25: volvía cada vez que se abría el entrenamiento, aunque se tocara
 * «Entendido»).
 *
 * - **La marca vive aparte**, en su propia clave de AsyncStorage por cuenta, como los ajustes del descanso. Antes vivía
 *   solo junto a las sesiones guardadas en el teléfono: si esa lectura fallaba (se aparta lo que no se puede leer y la
 *   sesión vuelve desde el servicio), la marca se perdía con ella. Se siguen leyendo las dos: alcanza con una.
 * - **Se marca al mostrarla**, no al tocar «Entendido»: queda a la vista hasta que la persona la cierra o sale, y la
 *   próxima vez ya no aparece. Es como los consejos de una sola vez de Apple y Material.
 * - Si el teléfono no deja leer la marca, se trata como no vista: se muestra, y se intenta marcar.
 *
 * Es lógica pura: el almacenamiento se inyecta (`ajustes-del-descanso.ts` pone AsyncStorage).
 */
import type { AlmacenDeTexto } from './descanso-automatico';

export const claveDeLaExplicacion = (cuenta: string): string => `be:explicacion-de-los-tiempos:${cuenta}`;

export interface MarcaDeLaExplicacion {
  /** Si la cuenta ya la vio en este teléfono; `null` mientras no se leyó. */
  vista(cuenta: string): boolean | null;
  leer(cuenta: string): Promise<boolean>;
  /** Marca la explicación como vista; `false` si no se pudo guardar (vale igual mientras la app siga abierta). */
  marcar(cuenta: string): Promise<boolean>;
  suscribir(alCambiar: () => void): () => void;
}

export function crearMarcaDeLaExplicacion(almacen: AlmacenDeTexto): MarcaDeLaExplicacion {
  const leidas = new Map<string, boolean>();
  const oyentes = new Set<() => void>();
  const fijar = (cuenta: string, vista: boolean) => {
    if (leidas.get(cuenta) === vista) return;
    leidas.set(cuenta, vista);
    for (const o of oyentes) o();
  };
  return {
    vista: (cuenta) => leidas.get(cuenta) ?? null,
    async leer(cuenta) {
      if (leidas.has(cuenta)) return leidas.get(cuenta) === true;
      let vista = false;
      try {
        vista = (await almacen.getItem(claveDeLaExplicacion(cuenta))) === '1';
      } catch {
        vista = false;
      }
      // Una marca puesta mientras se leía no se pisa.
      fijar(cuenta, leidas.get(cuenta) === true || vista);
      return leidas.get(cuenta) === true;
    },
    async marcar(cuenta) {
      fijar(cuenta, true);
      try {
        await almacen.setItem(claveDeLaExplicacion(cuenta), '1');
        return true;
      } catch {
        return false;
      }
    },
    suscribir(alCambiar) {
      oyentes.add(alCambiar);
      return () => {
        oyentes.delete(alCambiar);
      };
    },
  };
}

/**
 * Si la explicación se muestra al abrir la sesión: con la corrida en vivo, cuando ya se sabe lo de las dos marcas, y solo
 * si ninguna dice que se vio. `null`: todavía no se sabe (no se decide hasta leer).
 */
export function seMuestraLaExplicacion(d: { readonly enVivo: boolean; readonly vistaEnLasSesiones: boolean | null; readonly vistaEnElTelefono: boolean | null }): boolean | null {
  if (!d.enVivo) return false;
  if (d.vistaEnLasSesiones === true || d.vistaEnElTelefono === true) return false;
  if (d.vistaEnLasSesiones === null || d.vistaEnElTelefono === null) return null;
  return true;
}
