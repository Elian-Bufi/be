// react-native para el render en el navegador: react-native-web, con lo que Android hace y la web no.
// - La escala de letra del sistema (?escala=1.3): cada texto crece hasta su maxFontSizeMultiplier, como en Android.
// - adjustsFontSizeToFit con minimumFontScale, en dos fases, como Android: primero se reparte el ancho con todos los textos
//   a su tamaño completo (lo que hace Yoga), y después cada texto se achica, hasta su mínimo, para entrar en su caja. La
//   proporción final queda en data-ajuste, y si aun así no entra, data-cortado="si".
// - Keyboard.isVisible, que react-native-web no tiene.
import { createElement, forwardRef, useCallback, useLayoutEffect, useRef } from 'react';
import * as RNW from 'react-native-web';

export * from 'react-native-web';

const parametros = new URLSearchParams(globalThis.location?.search ?? '');
export const ESCALA_DE_LETRA = Number(parametros.get('escala') ?? '1');

function escalar(style, multiplicador) {
  const plano = RNW.StyleSheet.flatten(style) ?? {};
  if (multiplicador === 1) return plano;
  const nuevo = { ...plano };
  if (typeof nuevo.fontSize === 'number') nuevo.fontSize = nuevo.fontSize * multiplicador;
  if (typeof nuevo.lineHeight === 'number') nuevo.lineHeight = nuevo.lineHeight * multiplicador;
  return nuevo;
}

// ─── El ajuste de los textos que se achican para entrar ─────────────────────────────────────────
/** Si el texto no entra en su caja, con decimales: scrollWidth y clientWidth redondean, y el «…» aparece igual. */
function desborda(el) {
  const rango = document.createRange();
  rango.selectNodeContents(el);
  return rango.getBoundingClientRect().width > el.getBoundingClientRect().width + 0.01;
}
const ajustables = new Map();
let pedido = 0;

function ajustarTodo() {
  pedido = 0;
  const lista = [...ajustables.entries()].filter(([el]) => el.isConnected);
  // 1. Todo a tamaño completo y sin congelar: el navegador reparte el ancho como Yoga.
  for (const [el, a] of lista) {
    el.style.fontSize = `${a.base}px`;
    if (el.parentElement) el.parentElement.style.flex = '';
  }
  const anchos = lista.map(([el]) => el.parentElement?.getBoundingClientRect().width ?? 0);
  // 2. Cada caja queda con ese ancho, y su texto se achica hasta entrar.
  lista.forEach(([el], i) => {
    if (el.parentElement) el.parentElement.style.flex = `0 0 ${anchos[i]}px`;
  });
  for (const [el, a] of lista) {
    let proporcion = 1;
    while (desborda(el) && proporcion > a.minimo + 0.001) {
      proporcion = Math.max(a.minimo, proporcion - 0.01);
      el.style.fontSize = `${a.base * proporcion}px`;
    }
    el.dataset.ajuste = proporcion.toFixed(2);
    el.dataset.cortado = desborda(el) ? 'si' : 'no';
    el.dataset.medida = `${el.scrollWidth}/${el.clientWidth} ${getComputedStyle(el).fontFamily.split(",")[0]} ${document.fonts?.check?.("12px Roboto") ? "roboto" : "sin-roboto"}`;
  }
}
function programarAjuste() {
  if (!pedido) pedido = setTimeout(ajustarTodo, 0);
}
if (globalThis.document) {
  document.fonts?.addEventListener?.('loadingdone', programarAjuste);
  document.fonts?.ready.then(programarAjuste);
  globalThis.addEventListener?.('resize', programarAjuste);
  const repeticion = setInterval(programarAjuste, 400);
  setTimeout(() => clearInterval(repeticion), 8000);
}

export const Text = forwardRef(function Text(props, ref) {
  const { maxFontSizeMultiplier, adjustsFontSizeToFit, minimumFontScale = 0.5, allowFontScaling, style, ...resto } = props;
  const tope = typeof maxFontSizeMultiplier === 'number' && maxFontSizeMultiplier >= 1 ? maxFontSizeMultiplier : Infinity;
  const multiplicador = allowFontScaling === false ? 1 : Math.min(ESCALA_DE_LETRA, tope);
  const estilo = escalar(style, multiplicador);
  const propio = useRef(null);
  const unir = useCallback(
    (nodo) => {
      propio.current = nodo;
      if (typeof ref === 'function') ref(nodo);
      else if (ref) ref.current = nodo;
    },
    [ref],
  );
  useLayoutEffect(() => {
    const el = propio.current;
    if (!adjustsFontSizeToFit || !el || typeof estilo.fontSize !== 'number') return;
    ajustables.set(el, { base: estilo.fontSize, minimo: minimumFontScale });
    programarAjuste();
    return () => {
      ajustables.delete(el);
    };
  });
  return createElement(RNW.Text, { ...resto, ref: unir, style: estilo });
});

export function useWindowDimensions() {
  return { ...RNW.useWindowDimensions(), fontScale: ESCALA_DE_LETRA };
}

export const Keyboard = {
  ...RNW.Keyboard,
  isVisible: () => false,
  addListener: (...args) => RNW.Keyboard.addListener?.(...args) ?? { remove() {} },
};

// Los campos también crecen con la letra del sistema, como en Android (allowFontScaling, por omisión). El render de
// Inicio no tenía campos; Nutrición sí (las cantidades, «¿Qué comiste?»).
export const TextInput = forwardRef(function TextInput(props, ref) {
  const { maxFontSizeMultiplier, allowFontScaling, style, ...resto } = props;
  const tope = typeof maxFontSizeMultiplier === 'number' && maxFontSizeMultiplier >= 1 ? maxFontSizeMultiplier : Infinity;
  const multiplicador = allowFontScaling === false ? 1 : Math.min(ESCALA_DE_LETRA, tope);
  return createElement(RNW.TextInput, { ...resto, ref, style: escalar(style, multiplicador) });
});
