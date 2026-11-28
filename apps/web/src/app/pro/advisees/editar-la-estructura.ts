/**
 * Duplicar, reordenar y quitar en los editores de los planes (WP-TABLERO-ALTA-GAMA TB-48, segunda parte; propuesta
 * §23.6.9, §24.7 y §25.6). Antes no se podía copiar nada: ni un día tipo, ni una comida, ni una opción, ni una sesión,
 * ni un ejercicio; las comidas se movían solo con «Subir» y de las series se quitaba solo la última.
 * - **Una copia es del plan, no del original:** va justo después, sin identificadores de nodo (el servidor los asigna al
 *   guardar, como al insertar un habitual), y lo que tiene nombre se llama «… (copia)». Copia todo lo escrito: nombres,
 *   cantidades, cargas, notas e indicaciones. No escribe nada que el profesional no haya escrito (§27).
 * - **Mover no cambia nada más que el orden.** Los identificadores viajan con su nodo: la agenda de Entrenamiento, que
 *   cita cada sesión por el suyo, no se pierde.
 * - **Lo abierto sigue a su elemento:** las comidas y los ejercicios abiertos se guardan por su posición en la
 *   dirección, y al mover, copiar o quitar uno cada posición se corrige.
 * - **Sin microciclos nuevos (DL-203):** «Organizar por microciclos» salió del editor; los planes que ya los tienen se
 *   siguen editando.
 * Vive en el website hasta TB-20 (§8.2 del paquete), como `topes-del-plan.ts`. Sin React, para las pruebas.
 */
import { sinIdentificadoresDeComida, sinIdentificadoresDeSesion, type ComidaEntrada, type SesionEntrada } from '@be/domain';

// ─── Las posiciones ──────────────────────────────────────────────────────────────────────────────────────────────

/** Mueve, dentro de la lista, lo que está en `desde` a `hacia`. Cambia la lista que recibe: la copia del editor. */
export function mover<T>(lista: T[], desde: number, hacia: number): T[] {
  if (desde === hacia || desde < 0 || hacia < 0 || desde >= lista.length || hacia >= lista.length) return lista;
  const [x] = lista.splice(desde, 1);
  lista.splice(hacia, 0, x as T);
  return lista;
}

/** Dónde queda la posición `p` después de mover `desde` a `hacia`: lo movido va a `hacia`, y lo del medio se corre uno. */
export function posicionTrasMover(p: number, desde: number, hacia: number): number {
  if (p === desde) return hacia;
  if (desde < hacia && p > desde && p <= hacia) return p - 1;
  if (hacia < desde && p >= hacia && p < desde) return p + 1;
  return p;
}

/** Las posiciones abiertas después de mover una: cada una sigue a su elemento. */
export const posicionesTrasMover = (abiertas: ReadonlySet<number>, desde: number, hacia: number): Set<number> => new Set([...abiertas].map((p) => posicionTrasMover(p, desde, hacia)));

/**
 * La opción abierta de cada comida del día `dia` (`{ 'dia-comida': opción }`) después de mover la comida `desde` a
 * `hacia`: cada una sigue a su comida, y la que no tenía ninguna elegida (plegada como nació, NUP-D04) sigue sin elegir.
 * Las de los otros días no cambian. No toca `elegidas`.
 */
export function elegidasTrasMover(elegidas: Readonly<Record<string, number>>, dia: number, desde: number, hacia: number): Record<string, number> {
  return Object.fromEntries(
    Object.entries(elegidas).map(([clave, k]) => {
      const [d, c] = clave.split('-').map(Number);
      return [d === dia ? `${d}-${posicionTrasMover(c!, desde, hacia)}` : clave, k];
    }),
  );
}

/** Las posiciones abiertas después de insertar en `en`: las de `en` en adelante bajan un lugar. */
export const posicionesTrasInsertar = (abiertas: ReadonlySet<number>, en: number): Set<number> => new Set([...abiertas].map((p) => (p >= en ? p + 1 : p)));

/** Las posiciones abiertas después de quitar `n`: deja de estar abierta, y las de más abajo suben un lugar. */
export const posicionesTrasQuitar = (abiertas: ReadonlySet<number>, n: number): Set<number> => new Set([...abiertas].filter((p) => p !== n).map((p) => (p > n ? p - 1 : p)));

// ─── Las copias ──────────────────────────────────────────────────────────────────────────────────────────────────

export const SUFIJO_DE_LA_COPIA = ' (copia)';

/** «Almuerzo (copia)», dentro del largo que admite el contrato. Sin nombre, el de su lugar («Comida 2 (copia)»). */
export function nombreDeLaCopia(nombre: string, maximo: number, siNoTiene: string): string {
  const base = nombre.trim() || siNoTiene;
  return `${base.slice(0, Math.max(0, maximo - SUFIJO_DE_LA_COPIA.length)).trimEnd()}${SUFIJO_DE_LA_COPIA}`;
}

/** Los largos de los nombres en los contratos: 80 en Nutrición, salvo la opción; 120 en Entrenamiento. */
export const LARGO_DEL_NOMBRE = { diaTipo: 80, comida: 80, opcion: 120, sesion: 120 } as const;

type DiaTipoEntrada = { dayTypeId?: string; label: string; meals: ComidaEntrada[] };
type OpcionEntrada = ComidaEntrada['options'][number];
type PrescripcionEntrada = SesionEntrada['prescriptions'][number];

/** La copia de un día tipo, con sus comidas, sus opciones y sus ítems, sin ningún identificador. */
export function copiaDelDiaTipo<D extends DiaTipoEntrada>(d: D, n: number): D {
  const { dayTypeId: _dia, ...resto } = structuredClone(d);
  return { ...resto, label: nombreDeLaCopia(d.label, LARGO_DEL_NOMBRE.diaTipo, `Día tipo ${n + 1}`), meals: resto.meals.map(sinIdentificadoresDeComida) } as D;
}

/** La copia de una comida, con sus opciones y sus ítems (también las opciones de receta), sin identificadores. */
export function copiaDeLaComida<M extends ComidaEntrada>(m: M, j: number): M {
  return { ...sinIdentificadoresDeComida(structuredClone(m)), label: nombreDeLaCopia(m.label, LARGO_DEL_NOMBRE.comida, `Comida ${j + 1}`) } as M;
}

/** La copia de una opción, con sus ítems, sin identificadores. Una de receta sigue citando la misma versión. */
export function copiaDeLaOpcion<O extends OpcionEntrada>(o: O, k: number): O {
  const { optionId: _opcion, ...resto } = structuredClone(o);
  return { ...resto, label: nombreDeLaCopia(o.label, LARGO_DEL_NOMBRE.opcion, `Opción ${k + 1}`), items: resto.items.map(({ itemId: _item, ...i }) => i) } as O;
}

/** La copia de una sesión, con sus ejercicios y sus series, sin identificadores: no entra en la agenda hasta tener días. */
export function copiaDeLaSesion<S extends SesionEntrada>(s: S, k: number): S {
  return { ...sinIdentificadoresDeSesion(structuredClone(s)), label: nombreDeLaCopia(s.label, LARGO_DEL_NOMBRE.sesion, `Sesión ${k + 1}`) } as S;
}

/** La copia de un ejercicio de la sesión, con sus series y lo general, sin su identificador. El nombre es el del ejercicio. */
export function copiaDelEjercicio<P extends PrescripcionEntrada>(p: P): P {
  const { prescriptionId: _prescripcion, ...resto } = structuredClone(p);
  return resto as P;
}

/** Pone la copia justo después del original. Cambia la lista que recibe. */
export function duplicarEn<T>(lista: T[], n: number, copia: T): T[] {
  lista.splice(n + 1, 0, copia);
  return lista;
}

// ─── Las series ──────────────────────────────────────────────────────────────────────────────────────────────────

/** Las series sin la `n`: las demás conservan lo suyo, y las de abajo pasan a numerarse una menos. */
export const sinLaSerie = <S>(series: readonly S[], n: number): S[] => series.filter((_, m) => m !== n);

// ─── El microciclo ───────────────────────────────────────────────────────────────────────────────────────────────
// DL-203 (PN-D01; Dirección, 26/11): el editor ya no organiza una fase por microciclos ni agrega semanas. Las fases de N
// semanas con su semana tipo, la progresión, la descarga y «Duplicar la fase» lo cubren. Un plan que ya tiene
// microciclos se sigue leyendo y editando: el contrato, la API, la app y el lector del plan compartido no cambian.

// ─── Los textos ──────────────────────────────────────────────────────────────────────────────────────────────────

/** Los textos de duplicar y reordenar, en los dos editores. */
export const COPY_DE_LOS_EDITORES = {
  duplicarDiaTipo: 'Duplicar este día tipo',
  duplicarComida: 'Duplicar comida',
  duplicarOpcion: (k: number): string => `Duplicar opción ${k + 1}`,
  duplicarSesion: 'Duplicar esta sesión',
  duplicarEjercicio: 'Duplicar ejercicio',
  moverAntes: 'Mover antes',
  moverDespues: 'Mover después',
  subir: 'Subir',
  bajar: 'Bajar',
  yaEsElPrimero: 'Ya está primero.',
  yaEsElUltimo: 'Ya está último.',
  quitarLaSerie: (n: number): string => `Quitar la serie ${n + 1}`,
  duplicado: 'Se duplicó. La copia está justo después.',
  topeDeDiasTipo: (n: number): string => `Un plan lleva hasta ${n} días tipo.`,
} as const;
