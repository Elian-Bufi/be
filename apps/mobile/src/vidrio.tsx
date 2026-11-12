/**
 * El vidrio de la APK (WP-APP-VUELTA-2, DL-170), desde un solo lugar. La receta pura vive en `receta-de-vidrio.ts`;
 * acá están el contexto y los ganchos que la aplican.
 *
 * - **La superficie mate deja de ser la regla.** Desde el pulido del 2026-10-04 las tarjetas eran mates: la excepción 13
 *   de `REFERENCIAS_VISUALES.md` pedía que no hubiera nada adentro que pudiera quedar recortado, después de que un brillo
 *   dibujado como SVG de 100 % dejara una placa recortada de 16 a 24 dp antes del borde derecho (React Native 0.86 lo
 *   medía contra el contenido sin el relleno; WP-ENTRENAMIENTO-SERIES §7.7). Esa intención se conserva: el vidrio no
 *   agrega ninguna vista hija; todo es estilo de la misma vista (`boxShadow` y `experimental_backgroundImage`).
 * - **El nivel lo resuelve el contexto** (`NivelDeVidrio`): Seccion, TarjetaDeInicio y una Tarjeta suelta son nivel 1 y
 *   lo proveen; lo que va adentro baja solo a nivel 2. Fuera de toda tarjeta, una pieza que sería de nivel 2 (un aviso,
 *   una ficha) es de nivel 1.
 * - **El interruptor** (`activo`, §3.3): App.tsx lo prende solo en Inicio hasta el visto bueno de Dirección a la muestra;
 *   con él apagado, una tarjeta es la superficie opaca de hoy y nada desentona. Con el «Texto de alto contraste» de
 *   Android (`alto-contraste.ts`), todo vuelve a ser opaco y el fondo, liso.
 * - **Los estilos se arman una vez** por tema, nivel y estado, y se reusan: no cambian de identidad en cada dibujo.
 * La verificación en Android queda para el teléfono: el render del navegador no usa Yoga ni dibuja estas propiedades.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useApariencia } from './contexto-de-apariencia';
import { botonPrincipal, nivelQueSigue, superficieDeVidrio, vidrioPrendido, type EstiloDelBotonPrincipal, type EstiloDeSuperficie, type NivelDeLaSuperficie, type NivelDelContexto } from './receta-de-vidrio';
import { PALETAS, type Tema } from './tema';

export { RELLENO_DE_LA_TARJETA, RADIO_DE_LA_FICHA, RADIO_DE_LA_TARJETA } from './receta-de-vidrio';

export interface EstadoDelVidrio {
  /** El interruptor: prendido solo en Inicio hasta el visto bueno (AV2-26). */
  readonly activo: boolean;
  readonly altoContraste: boolean;
  /** El nivel del lugar: 0 fuera de toda tarjeta. */
  readonly nivel: NivelDelContexto;
}

const AFUERA: EstadoDelVidrio = { activo: false, altoContraste: false, nivel: 0 };

/** El contexto del vidrio: el interruptor, el alto contraste y el nivel del lugar. */
export const NivelDeVidrio = createContext<EstadoDelVidrio>(AFUERA);

/** Para la raíz (App.tsx): el interruptor y el alto contraste, para toda la app. */
export function ProveedorDeVidrio({ activo, altoContraste, children }: { activo: boolean; altoContraste: boolean; children: ReactNode }) {
  const valor = useMemo<EstadoDelVidrio>(() => ({ activo, altoContraste, nivel: 0 }), [activo, altoContraste]);
  return <NivelDeVidrio.Provider value={valor}>{children}</NivelDeVidrio.Provider>;
}

/** Lo que va adentro de una superficie queda en su nivel. Solo provee el contexto: no dibuja ninguna vista. */
export function DentroDelNivel({ nivel, children }: { nivel: NivelDeLaSuperficie; children: ReactNode }) {
  const afuera = useContext(NivelDeVidrio);
  const valor = useMemo<EstadoDelVidrio>(() => ({ ...afuera, nivel }), [afuera, nivel]);
  return <NivelDeVidrio.Provider value={valor}>{children}</NivelDeVidrio.Provider>;
}

/** El estado del vidrio donde se dibuja una pieza: si está prendido, el nivel del lugar y el tema. */
export function useVidrio(): EstadoDelVidrio & { readonly prendido: boolean; readonly tema: Tema } {
  const estado = useContext(NivelDeVidrio);
  const { tema } = useApariencia();
  return { ...estado, prendido: vidrioPrendido(estado), tema };
}

const superficies = new Map<string, EstiloDeSuperficie>();

/**
 * La superficie de una pieza, del nivel que sigue al lugar donde está, y ese nivel, para proveerlo a lo de adentro con
 * `DentroDelNivel`. El estilo es el mismo objeto mientras no cambien el tema, el nivel ni el estado del vidrio.
 */
export function useSuperficie(): { readonly estilo: EstiloDeSuperficie; readonly nivel: NivelDeLaSuperficie; readonly prendido: boolean } {
  const { tema, prendido, activo, altoContraste, nivel: lugar } = useVidrio();
  const nivel = nivelQueSigue(lugar);
  const clave = `${tema}|${nivel}|${prendido}`;
  let estilo = superficies.get(clave);
  if (!estilo) {
    estilo = superficieDeVidrio(PALETAS[tema], tema, nivel, { activo, altoContraste });
    superficies.set(clave, estilo);
  }
  return { estilo, nivel, prendido };
}

const botones = new Map<string, EstiloDelBotonPrincipal | null>();

/** El botón principal con la receta, o `null` con el vidrio apagado. El resplandor, solo habilitado. */
export function useBotonPrincipal(habilitado: boolean): EstiloDelBotonPrincipal | null {
  const { tema, prendido, activo, altoContraste } = useVidrio();
  const clave = `${tema}|${prendido}|${habilitado}`;
  if (!botones.has(clave)) botones.set(clave, botonPrincipal(PALETAS[tema], { activo, altoContraste, habilitado }));
  return botones.get(clave) ?? null;
}

/**
 * La sombra de las tarjetas de la lámina de la toma (pulido del 2026-10-04), que todavía no migraron: son opacas, y para
 * ellas `elevation` no deja mancha. Lo translúcido usa la receta, sin `elevation` (AV2-T4).
 */
export const sombraDeVidrio = (sombra: string) => ({ shadowColor: sombra, shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 }) as const;
