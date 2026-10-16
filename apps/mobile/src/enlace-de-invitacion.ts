/**
 * WP-INVITACION (DEUDA_LEGAJO DL-136): el secreto de una invitación que abrió la APK desde un enlace. Llega de dos formas:
 * - `be://invitacion?t=<token>`: el enlace `intent:` de la página /invitacion del website, en Android;
 * - `https://<website>/invitacion#t=<token>`: el enlace de la invitación, cuando Android lo abre directo en la app (App
 *   Links, con el `assetlinks.json` del website).
 * Cualquier otro enlace no es una invitación. Lógica pura, sin React Native: se prueba en Node.
 */
import { esTokenDeInvitacion, tokenDelFragmento, type SecretoDeInvitacionRequest } from '@be/domain';

export function invitacionDelEnlace(url: string | null | undefined): SecretoDeInvitacionRequest | null {
  if (!url) return null;
  const propio = /^be:\/\/invitacion\/?\?([^#]*)/i.exec(url);
  if (propio) {
    const token = new URLSearchParams(propio[1]).get('t')?.trim();
    return token && esTokenDeInvitacion(token) ? { token } : null;
  }
  const web = /^https:\/\/[^/?#]+\/invitacion\/?(?:\?[^#]*)?(#.*)?$/i.exec(url);
  if (web) {
    const token = tokenDelFragmento(web[1] ?? '');
    return token ? { token } : null;
  }
  return null;
}
