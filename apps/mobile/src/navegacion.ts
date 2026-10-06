/**
 * Navegación del APK por estado, sin librería de rutas: cada pantalla es un valor de `Ruta` (App.tsx la dibuja).
 * «Atrás» (botón de Android o el de la cabecera) nunca cierra la sesión.
 *
 * **Barra y cabecera (DL-117, decisión de Dirección del 2026-10-04).** La barra inferior lleva a cinco raíces: Inicio,
 * Nutrición, Entrenamiento, Evolución e Información. Cuenta se abre desde el avatar de la cabecera.
 *
 * **El origen.** Un detalle recuerda de dónde se abrió (`desde`: la ruta anterior entera), y «Atrás» vuelve ahí. Así, el
 * mismo detalle abierto desde Inicio vuelve a Inicio, y abierto desde su módulo vuelve al módulo. Lo decide `navegar()`,
 * una función pura:
 * - una raíz no tiene origen: la barra reinicia la cadena;
 * - ir a un detalle lo abre con `desde` igual a la pantalla actual;
 * - «reemplazar» hereda el origen de la pantalla actual (un borrador registrado pasa a ser su ejecución);
 * - ir a una pantalla que ya está en la cadena vuelve a ella, sin duplicarla;
 * - la cadena tiene un tope (`TOPE_DEL_ORIGEN`).
 *
 * **Módulo, pestaña y barra son tres cosas.** `moduloDe` dice a qué módulo pertenece una pantalla; `pestanaActiva`, qué
 * destino de la barra se resalta (Cuenta no resalta ninguno: no es un sexto destino); la barra se ve con sesión.
 */
import { CODIGOS_DE_SESION_NO_VALIDA, type Resultado, type SesionDeOcurrencia } from '@be/domain';
import { useCallback, useState } from 'react';

/** Las vistas de «Mi evolución», sus pestañas. */
export type VistaDeEvolucion = 'ultima' | 'comparar' | 'evolucion';

export type Ruta =
  | { readonly nombre: 'bienvenida'; readonly aviso?: string }
  | { readonly nombre: 'registro' }
  // `alEntrar`: adónde lleva iniciar sesión cuando no es Inicio (por ahora, solo de vuelta a Cuenta).
  | { readonly nombre: 'login'; readonly aviso?: string; readonly alEntrar?: 'cuenta' }
  // Las cinco raíces de la barra. Algunas aceptan un pedido de una sola vez: abrir la acción de registrar, o una vista y
  // una medida de «Mi evolución».
  | { readonly nombre: 'inicio' }
  | { readonly nombre: 'hoy'; readonly accion?: 'registrar' }
  | { readonly nombre: 'entrenamiento' }
  | { readonly nombre: 'mi-evolucion'; readonly vista?: VistaDeEvolucion; readonly metrica?: string }
  | { readonly nombre: 'mis-solicitudes' }
  // Los detalles: recuerdan de dónde se abrieron.
  | { readonly nombre: 'cuenta'; readonly desde?: Ruta }
  | { readonly nombre: 'vinculos'; readonly desde?: Ruta }
  | { readonly nombre: 'vinculo'; readonly id: string; readonly desde?: Ruta }
  | { readonly nombre: 'consentimiento'; readonly vinculoId: string; readonly desde?: Ruta }
  | { readonly nombre: 'privacidad'; readonly desde?: Ruta }
  | { readonly nombre: 'plan-actual'; readonly desde?: Ruta }
  | { readonly nombre: 'registros-nutricionales'; readonly desde?: Ruta }
  | { readonly nombre: 'registro-nutricional'; readonly id: string; readonly desde?: Ruta }
  // WP-NUTRICION-RECETAS: el detalle de una opción de una comida (`id` es la opción). Con `registroId`, completa o
  // corrige las cantidades de ese registro; sin él, registra.
  | { readonly nombre: 'opcion-de-comida'; readonly id: string; readonly comidaId?: string; readonly registroId?: string; readonly desde?: Ruta }
  // «Comí algo diferente», con el contexto de la comida y del día que se estaba viendo en Hoy.
  | {
      readonly nombre: 'comida-diferente';
      readonly comidaId: string;
      readonly comida: string;
      readonly fecha: string;
      readonly planId: string;
      readonly diaTipoId: string;
      readonly desde?: Ruta;
    }
  | { readonly nombre: 'historial-de-entrenamiento'; readonly desde?: Ruta }
  | { readonly nombre: 'plan-de-entrenamiento'; readonly id: string; readonly desde?: Ruta }
  | { readonly nombre: 'mi-solicitud'; readonly id: string; readonly desde?: Ruta }
  | { readonly nombre: 'sesion-de-entrenamiento'; readonly draftId: string; readonly sesion: SesionDeOcurrencia; readonly fecha: string; readonly desde?: Ruta }
  | { readonly nombre: 'ejecucion-de-entrenamiento'; readonly id: string; readonly aviso?: string; readonly desde?: Ruta };

/** Por qué termina la sesión en el APK; cada motivo tiene su aviso en App.tsx. */
export type Salida = 'sesion-cerrada' | 'sesiones-cerradas' | 'sesion-no-valida' | 'sesion-vencida' | 'reautenticar' | 'cierre-registrado';

/** Cómo se navega: ir (el destino recuerda de dónde se abrió) o reemplazar (hereda el origen de la pantalla actual). */
export type ModoDeNavegacion = 'ir' | 'reemplazar';

/** La firma que reciben las pantallas para navegar. */
export type Ir = (destino: Ruta, modo?: ModoDeNavegacion) => void;

/** Pantallas que necesitan una sesión en memoria. */
export function requiereSesion(ruta: Ruta): boolean {
  return ruta.nombre !== 'bienvenida' && ruta.nombre !== 'registro' && ruta.nombre !== 'login';
}

// ─── La barra inferior: cinco raíces (DL-117) ───────────────────────────────────────────────────

/** Los destinos de la barra. */
export type Zona = 'inicio' | 'nutricion' | 'entrenamiento' | 'evolucion' | 'informacion';

/** El módulo de una pantalla: un destino de la barra, o Cuenta, que se abre desde el avatar. */
export type Modulo = Zona | 'cuenta';

/** Los cinco destinos, en el orden de la barra, con su texto y la raíz que abre cada uno. */
export const ZONAS: readonly { readonly zona: Zona; readonly texto: string; readonly ruta: Ruta }[] = [
  { zona: 'inicio', texto: 'Inicio', ruta: { nombre: 'inicio' } },
  { zona: 'nutricion', texto: 'Nutrición', ruta: { nombre: 'hoy' } },
  { zona: 'entrenamiento', texto: 'Entrenamiento', ruta: { nombre: 'entrenamiento' } },
  { zona: 'evolucion', texto: 'Evolución', ruta: { nombre: 'mi-evolucion' } },
  { zona: 'informacion', texto: 'Información', ruta: { nombre: 'mis-solicitudes' } },
];

/** Donde abre la APK al iniciar sesión o al recuperar una sesión guardada válida, y adonde vuelven las otras raíces. */
export const INICIO: Ruta = { nombre: 'inicio' };

/**
 * La pantalla que abre al iniciar sesión desde `login`: Inicio, salvo que Cuenta haya pedido volver a entrar para
 * confirmar una acción (el cierre de cuenta con reautenticación): entonces vuelve a Cuenta, donde quedó esa acción.
 */
export function alIniciarSesion(login: Ruta): Ruta {
  return login.nombre === 'login' && login.alEntrar === 'cuenta' ? { nombre: 'cuenta' } : INICIO;
}

/** Si la pantalla es una raíz: la abre la barra, no tiene origen y no lleva volver en la cabecera, sino el menú. */
export function esRaiz(ruta: Ruta): boolean {
  return ZONAS.some((z) => z.ruta.nombre === ruta.nombre);
}

/** Si una raíz trae un pedido de una sola vez (una acción, una vista, una medida): abre arriba, no donde se la dejó. */
export function traePedido(ruta: Ruta): boolean {
  return (ruta.nombre === 'hoy' && ruta.accion !== undefined) || (ruta.nombre === 'mi-evolucion' && (ruta.vista !== undefined || ruta.metrica !== undefined));
}

/** El módulo de una pantalla. `null` fuera de la sesión (Bienvenida, registro, login). */
export function moduloDe(ruta: Ruta): Modulo | null {
  switch (ruta.nombre) {
    case 'inicio':
      return 'inicio';
    case 'hoy':
    case 'plan-actual':
    case 'registros-nutricionales':
    case 'registro-nutricional':
    case 'opcion-de-comida':
    case 'comida-diferente':
      return 'nutricion';
    case 'entrenamiento':
    case 'historial-de-entrenamiento':
    case 'plan-de-entrenamiento':
    case 'sesion-de-entrenamiento':
    case 'ejecucion-de-entrenamiento':
      return 'entrenamiento';
    case 'mi-evolucion':
      return 'evolucion';
    case 'mis-solicitudes':
    case 'mi-solicitud':
      return 'informacion';
    case 'cuenta':
    case 'vinculos':
    case 'vinculo':
    case 'consentimiento':
    case 'privacidad':
      return 'cuenta';
    case 'bienvenida':
    case 'registro':
    case 'login':
      return null;
    default: {
      // Una pantalla nueva sin módulo no compila: la barra tiene que saber qué resaltar.
      const sinModulo: never = ruta;
      return sinModulo;
    }
  }
}

/** De dónde se abrió una pantalla, si lo recuerda. */
export function desdeDe(ruta: Ruta): Ruta | undefined {
  return 'desde' in ruta ? ruta.desde : undefined;
}

/** La raíz donde empieza la cadena de origen de una pantalla (ella misma si es raíz), o `null` si la cadena no llega. */
export function raizDelOrigen(ruta: Ruta): Ruta | null {
  let r: Ruta | undefined = ruta;
  for (let i = 0; r && i <= TOPE_DEL_ORIGEN + 1; i++) {
    if (esRaiz(r)) return r;
    r = desdeDe(r);
  }
  return null;
}

const ZONA_DE_LA_RAIZ: Readonly<Record<string, Zona>> = Object.fromEntries(ZONAS.map((z) => [z.ruta.nombre, z.zona]));

/**
 * El destino que la barra resalta: la raíz donde empezó el camino hasta esta pantalla, o su módulo si no lo recuerda.
 * Cuenta no resalta ninguno: se abre desde el avatar y no es una especialidad.
 */
export function pestanaActiva(ruta: Ruta): Zona | null {
  const modulo = moduloDe(ruta);
  if (modulo === null || modulo === 'cuenta') return null;
  const raiz = raizDelOrigen(ruta);
  return raiz ? (ZONA_DE_LA_RAIZ[raiz.nombre] ?? modulo) : modulo;
}

/** La pantalla madre de siempre, para un detalle que no recuerda de dónde se abrió. */
function madre(ruta: Ruta): Ruta | null {
  switch (ruta.nombre) {
    case 'registro':
    case 'login':
      return { nombre: 'bienvenida' };
    case 'bienvenida':
    case 'inicio':
      return null;
    // Desde las otras raíces, y desde Cuenta sin origen, «atrás» vuelve a Inicio.
    case 'hoy':
    case 'entrenamiento':
    case 'mi-evolucion':
    case 'mis-solicitudes':
    case 'cuenta':
      return INICIO;
    case 'vinculos':
    case 'privacidad':
      return { nombre: 'cuenta' };
    case 'historial-de-entrenamiento':
      return { nombre: 'entrenamiento' };
    case 'plan-de-entrenamiento':
      return { nombre: 'historial-de-entrenamiento' };
    case 'mi-solicitud':
      return { nombre: 'mis-solicitudes' };
    case 'sesion-de-entrenamiento':
    case 'ejecucion-de-entrenamiento':
      return { nombre: 'entrenamiento' };
    case 'plan-actual':
    case 'registros-nutricionales':
    case 'opcion-de-comida':
    case 'comida-diferente':
      return { nombre: 'hoy' };
    case 'registro-nutricional':
      return { nombre: 'registros-nutricionales' };
    case 'vinculo':
      return { nombre: 'vinculos' };
    case 'consentimiento':
      return { nombre: 'vinculo', id: ruta.vinculoId };
    default: {
      const sinMadre: never = ruta;
      return sinMadre;
    }
  }
}

/**
 * La pantalla a la que vuelve «Atrás»: la de origen, si la recuerda; si no, la madre de siempre. `null`: no hay, y el
 * botón de Android queda en manos del sistema, que sale de la app. Pasa en Bienvenida y en Inicio.
 */
export function anterior(ruta: Ruta): Ruta | null {
  return desdeDe(ruta) ?? madre(ruta);
}

/** Cuántos niveles de origen se recuerdan, como mucho. Más atrás, cada pantalla vuelve a su madre de siempre. */
export const TOPE_DEL_ORIGEN = 6;

/** El identificador de una pantalla con datos propios, para saber si dos rutas son la misma pantalla. */
function identificador(ruta: Ruta): string | null {
  if ('id' in ruta) return ruta.id;
  if ('vinculoId' in ruta) return ruta.vinculoId;
  if ('draftId' in ruta) return ruta.draftId;
  if (ruta.nombre === 'comida-diferente') return ruta.comidaId;
  return null;
}

/** Si dos rutas muestran la misma pantalla (el mismo nombre y, si lo tiene, el mismo identificador). */
export function mismaPantalla(a: Ruta, b: Ruta): boolean {
  return a.nombre === b.nombre && identificador(a) === identificador(b);
}

/** La ruta sin su origen. */
function sinOrigen(ruta: Ruta): Ruta {
  if (!('desde' in ruta) || ruta.desde === undefined) return ruta;
  const { desde: _, ...resto } = ruta;
  return resto as Ruta;
}

/** La ruta como se la recuerda para volver: sin lo que era de una sola vez (un aviso, un pedido). */
function paraVolver(ruta: Ruta): Ruta {
  if (ruta.nombre === 'ejecucion-de-entrenamiento' && ruta.aviso !== undefined) {
    const { aviso: _, ...resto } = ruta;
    return resto;
  }
  if (traePedido(ruta)) return { nombre: ruta.nombre } as Ruta;
  return ruta;
}

/** La ruta con su cadena de origen recortada al tope. */
function recortar(ruta: Ruta, nivel = 0): Ruta {
  const desde = desdeDe(ruta);
  if (desde === undefined) return ruta;
  if (nivel >= TOPE_DEL_ORIGEN) return sinOrigen(ruta);
  return { ...ruta, desde: recortar(desde, nivel + 1) } as Ruta;
}

/** La ruta con este origen, o sin ninguno. */
function conOrigen(ruta: Ruta, desde: Ruta | undefined): Ruta {
  return recortar(desde === undefined ? sinOrigen(ruta) : ({ ...sinOrigen(ruta), desde } as Ruta));
}

/**
 * La pantalla que resulta de navegar desde `actual` hacia `destino`. La usan la barra, la cabecera, el menú y cada
 * pantalla, a través de `ir` en App.tsx. «Atrás» no pasa por acá: va directo a `anterior(ruta)`.
 */
export function navegar(actual: Ruta, destino: Ruta, modo: ModoDeNavegacion = 'ir'): Ruta {
  // Fuera de la sesión, o hacia una raíz, no hay origen: la barra reinicia la cadena.
  if (!requiereSesion(destino) || esRaiz(destino)) return sinOrigen(destino);
  // Si la pantalla ya está en la cadena (o es la actual), se vuelve a ella, con su propio origen, sin duplicarla.
  const base = modo === 'reemplazar' ? desdeDe(actual) : actual;
  for (let r = base, i = 0; r && i <= TOPE_DEL_ORIGEN + 1; r = desdeDe(r), i++) if (mismaPantalla(r, destino)) return r;
  // Un origen pedido explícitamente se respeta. Si no: reemplazar hereda el de la actual, e ir recuerda la actual.
  const explicito = desdeDe(destino);
  if (explicito !== undefined) return conOrigen(destino, explicito);
  if (modo === 'reemplazar') return conOrigen(destino, desdeDe(actual));
  return conOrigen(destino, requiereSesion(actual) ? paraVolver(actual) : undefined);
}

/** Texto para volver a un destino, para el botón de la cabecera y el lector de pantalla (10-B10 §9). */
export function textoDeVolverA(destino: Ruta): string {
  switch (destino.nombre) {
    case 'inicio':
      return 'Volver a Inicio';
    case 'cuenta':
      return 'Volver a Cuenta';
    case 'vinculos':
      return 'Volver a Vínculos';
    case 'vinculo':
      return 'Volver al vínculo';
    case 'privacidad':
      return 'Volver a Privacidad';
    case 'hoy':
      return 'Volver a Nutrición';
    case 'entrenamiento':
      return 'Volver a Entrenamiento de hoy';
    case 'registros-nutricionales':
      return 'Volver a Registros';
    case 'registro-nutricional':
      return 'Volver al registro';
    case 'mi-evolucion':
      return 'Volver a Mi evolución';
    case 'mis-solicitudes':
      return 'Volver a Información';
    case 'historial-de-entrenamiento':
      return 'Volver a Tu historial';
    default:
      return 'Volver';
  }
}

/**
 * «Escritura denegada → contenido retirado» (B10-06:1145-1148; S10-TRN-09). Si una **escritura** del asesorado recibe
 * el 404 no revelador —el mismo para inexistente, ajeno, de otro alcance o revocado (10-B04 §40)—, la pantalla no deja
 * el contenido viejo con un aviso encima: lo retira entero y queda en su estado neutral, el mismo que muestra cuando el
 * acceso está suspendido. Es el mecanismo `accesoRetirado` del website
 * (apps/web/src/app/pro/advisees/training/entrenamiento.tsx), escrito una sola vez para las pantallas del APK.
 *
 * El APK no recibe un 403 propio de «acceso suspendido»: la suspensión llega como `planState: 'NOT_AVAILABLE'` en la
 * lectura siguiente, y por eso el estado neutral es el mismo aviso que esa lectura ya dibuja.
 */
export function useAccesoRetirado(): { readonly retirado: boolean; readonly accesoRetirado: (r: Resultado<unknown>) => boolean } {
  const [retirado, setRetirado] = useState(false);
  const accesoRetirado = useCallback((r: Resultado<unknown>) => {
    if (r.ok || r.tipo !== 'API' || r.codigo !== 'RESOURCE_NOT_FOUND') return false;
    setRetirado(true);
    return true;
  }, []);
  return { retirado, accesoRetirado };
}

/** «Esta sesión ya no sirve»: la UI olvida el token y vuelve a Iniciar sesión. Devuelve `true` si salió. */
export function useSesionPerdida(salir: (motivo: Salida) => void) {
  return useCallback(
    (r: Resultado<unknown>) => {
      if (!r.ok && r.tipo === 'API' && CODIGOS_DE_SESION_NO_VALIDA.has(r.codigo)) {
        // Solo un código de sesión cierra la sesión. Un 403, un 429, un 5xx o la falta de red no: la pantalla lo dice y
        // deja reintentar (clasificarFalla, en @be/domain).
        salir(r.codigo === 'SESSION_EXPIRED' ? 'sesion-vencida' : 'sesion-no-valida');
        return true;
      }
      return false;
    },
    [salir],
  );
}
