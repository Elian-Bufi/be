/**
 * Apariencia del website (Dirección, 2026-09-30): «Azul noche» como presentación predeterminada y «Claro» como
 * alternativa. Reemplaza el tema fijo por superficie (claro en el espacio profesional, oscuro en la cara pública) por una
 * preferencia de la persona, **local al navegador**: vive en `localStorage`, no se sincroniza con la cuenta ni entre
 * dispositivos, y no identifica a nadie. Un valor desconocido es una preferencia inválida y cae al predeterminado.
 *
 * El tema se aplica con `data-tema` en `<html>`; los tokens de cada tema viven en `tokens.css`. Cambiar de tema nunca toca
 * datos, permisos, validaciones ni lo escrito en un formulario: es solo CSS.
 */
export const TEMAS = ['azul-noche', 'claro'] as const;
export type Tema = (typeof TEMAS)[number];
export const TEMA_PREDETERMINADO: Tema = 'azul-noche';
export const CLAVE_DE_APARIENCIA = 'be-apariencia';

export const NOMBRE_DEL_TEMA: Readonly<Record<Tema, string>> = { 'azul-noche': 'Azul noche', claro: 'Claro' };

/** Interpreta lo guardado: solo un tema conocido vale; cualquier otra cosa es el predeterminado. */
export const temaValido = (valor: unknown): Tema => (TEMAS.includes(valor as Tema) ? (valor as Tema) : TEMA_PREDETERMINADO);

/** Lee la preferencia guardada. Sin almacenamiento (privado, bloqueado, sin ventana), el predeterminado. */
export function leerTema(): Tema {
  try {
    return temaValido(window.localStorage.getItem(CLAVE_DE_APARIENCIA));
  } catch {
    return TEMA_PREDETERMINADO;
  }
}

/** Aplica el tema a la página y lo guarda si se puede; si no se puede guardar, igual se aplica hasta recargar. */
export function aplicarTema(tema: Tema): void {
  document.documentElement.dataset.tema = tema;
  try {
    window.localStorage.setItem(CLAVE_DE_APARIENCIA, tema);
  } catch {
    // Sin almacenamiento: la elección dura esta visita, y el control lo dice.
  }
}

/** Si el almacenamiento está disponible para guardar la preferencia (para decirlo en el control). */
export function sePuedeGuardar(): boolean {
  try {
    const prueba = `${CLAVE_DE_APARIENCIA}-prueba`;
    window.localStorage.setItem(prueba, '1');
    window.localStorage.removeItem(prueba);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lo que corre antes del primer dibujo, en línea en `<head>`: lee la preferencia y pone `data-tema` para que la página
 * no aparezca primero en un tema y después en otro. Es la misma regla que `leerTema`, escrita sin dependencias porque
 * corre antes que cualquier módulo. La CSP del despliegue ya admite scripts en línea (`script-src 'unsafe-inline'`).
 */
export const SCRIPT_DE_INICIO = `(function(){var t='${TEMA_PREDETERMINADO}';try{var v=localStorage.getItem('${CLAVE_DE_APARIENCIA}');if(v==='claro'||v==='azul-noche')t=v;}catch(e){}document.documentElement.setAttribute('data-tema',t);})();`;
