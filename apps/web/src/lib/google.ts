/**
 * WP-ACCESO-GOOGLE (DEUDA_LEGAJO DL-138): Google Identity Services en el website, solo para conseguir el ID token de la
 * cuenta de Google que la persona elige. El token va de Google a la API en el cuerpo de un pedido (API-GOO-01 a 03), vive
 * en la memoria de la pantalla mientras dura el paso y no se guarda en ningún lado; la sesión es la de siempre (DL-012).
 * - **El client ID** «Aplicación web» llega en el build (`BE_GOOGLE_WEB_CLIENT_ID`, next.config.mjs). Sin él no hay botón
 *   y no se carga nada de Google.
 * - **El botón es el de Google** (un iframe de accounts.google.com): «Continuar con Google», en español, con el tema que
 *   acompaña a la apariencia elegida, y la cuenta se elige en una ventana de Google. Sin One Tap ni selección automática:
 *   Google aparece solo cuando la persona toca el botón.
 * - **Las cabeceras de be-web** (render.yaml): la CSP admite solo lo que pide Google Identity Services, y el
 *   Referrer-Policy deja que Google vea el origen del website, con el que valida el client ID.
 */
import { temaAplicado } from './apariencia';

export const CLIENT_ID_WEB_DE_GOOGLE: string | null = process.env.BE_GOOGLE_WEB_CLIENT_ID || null;

/** En español de América Latina: el botón y lo que muestra Google (`hl`, como lo indica Google). */
const IDIOMA = 'es-419';
const SCRIPT_DE_GOOGLE = `https://accounts.google.com/gsi/client?hl=${IDIOMA}`;

/** Lo que BE usa de `google.accounts.id` (la referencia de Google Identity Services), nada más. */
interface RespuestaDeGoogle {
  readonly credential?: string;
}
interface IdentidadDeGoogle {
  initialize(opciones: {
    client_id: string;
    callback: (respuesta: RespuestaDeGoogle) => void;
    auto_select: boolean;
    ux_mode: 'popup';
    itp_support: boolean;
  }): void;
  renderButton(
    elemento: HTMLElement,
    opciones: {
      type: 'standard';
      theme: 'outline' | 'filled_black';
      size: 'large';
      text: 'continue_with';
      shape: 'rectangular';
      logo_alignment: 'left';
      width: number;
      locale: string;
    },
  ): void;
}
declare global {
  interface Window {
    google?: { accounts?: { id?: IdentidadDeGoogle } };
  }
}

let carga: Promise<IdentidadDeGoogle> | null = null;
let inicializadoCon: string | null = null;
/** Quién recibe el ID token: el botón que está en pantalla. Google admite una sola configuración por página. */
let receptor: ((idToken: string) => void) | null = null;

/** Carga el script de Google una sola vez. Si falla (sin red, un bloqueador), el próximo intento lo vuelve a pedir. */
function cargarScript(): Promise<IdentidadDeGoogle> {
  const ya = window.google?.accounts?.id;
  if (ya) return Promise.resolve(ya);
  carga ??= new Promise<IdentidadDeGoogle>((resolver, rechazar) => {
    const script = document.createElement('script');
    script.src = SCRIPT_DE_GOOGLE;
    script.async = true;
    script.onload = () => {
      const id = window.google?.accounts?.id;
      if (id) resolver(id);
      else rechazar(new Error('Google Identity Services no quedó disponible'));
    };
    script.onerror = () => rechazar(new Error('No se pudo cargar Google Identity Services'));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    carga = null;
    throw error;
  });
  return carga;
}

/** El tema del botón de Google que acompaña a la apariencia de BE: el contorno sobre Claro, el oscuro sobre Azul noche. */
const temaDelBoton = (): 'outline' | 'filled_black' => (temaAplicado() === 'claro' ? 'outline' : 'filled_black');

/**
 * Dibuja el botón de Google en `elemento` y entrega el ID token a `alRecibir` cuando la persona elige una cuenta. Vuelve a
 * dibujarlo si la persona cambia la apariencia. Devuelve la función que lo retira.
 */
export async function dibujarBotonDeGoogle(clientId: string, elemento: HTMLElement, alRecibir: (idToken: string) => void): Promise<() => void> {
  const google = await cargarScript();
  if (inicializadoCon !== clientId) {
    google.initialize({
      client_id: clientId,
      callback: (respuesta) => {
        if (respuesta.credential) receptor?.(respuesta.credential);
      },
      auto_select: false,
      ux_mode: 'popup',
      itp_support: false,
    });
    inicializadoCon = clientId;
  }
  receptor = alRecibir;
  const dibujar = () => {
    elemento.replaceChildren();
    google.renderButton(elemento, {
      type: 'standard',
      theme: temaDelBoton(),
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      // Google acepta hasta 400 px: el ancho del formulario, sin pasarse.
      width: Math.max(200, Math.min(400, Math.floor(elemento.clientWidth || 400))),
      locale: IDIOMA,
    });
  };
  dibujar();
  const apariencia = new MutationObserver(dibujar);
  apariencia.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });
  return () => {
    apariencia.disconnect();
    if (receptor === alRecibir) receptor = null;
  };
}
