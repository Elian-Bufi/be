/**
 * PG-08 de WP-PULIDO-GRANDES (DL-173, con PG-D4 a ratificar): la háptica con criterio, que confirma y no premia. Es la
 * lógica pura de los tres toques: cuáles hay, cuándo suena cada uno y qué hace el teléfono con cada uno. El único archivo
 * que toca el motor del teléfono es `haptica.ts`; la prueba `toques.test.ts` (TEST-PG-007) fija las dos cosas.
 *
 * - **Tres toques, ninguno más:** `confirmar` (un golpecito corto: «quedó»), `deshacer` (uno distinto) y `error` (un
 *   doble toque suave). Nunca una vibración de festejo: no hay toque para un logro, una semana cerrada ni un número.
 * - **Suena después, no al tocar:** cuando el servidor confirmó o cuando la serie quedó guardada en el teléfono. Una
 *   respuesta que no confirma da `error`.
 * - **Con el interruptor de Perfil apagado, ninguno** (PG-D4: «reducir movimiento» no la apaga, porque es otro sentido).
 * - **El texto que confirma sigue igual:** el toque lo acompaña, no lo reemplaza. La vibración del final del descanso es
 *   otra cosa y sigue como estaba.
 */

export type Toque = 'confirmar' | 'deshacer' | 'error';

export const TOQUES: readonly Toque[] = ['confirmar', 'deshacer', 'error'];

/**
 * En Android, los del sistema (`performHapticFeedback`, sin el permiso de vibrar): primero el que corresponde y, si el
 * teléfono no lo tiene (Android 10 o anterior no conoce «confirm» ni «reject»; «toggle-off» llega con Android 14), uno de
 * siempre. Son los valores de `AndroidHaptics` de expo-haptics.
 */
export const SECUENCIA_EN_ANDROID: Readonly<Record<Toque, readonly string[]>> = {
  confirmar: ['confirm', 'context-click'],
  deshacer: ['toggle-off', 'clock-tick'],
  error: ['reject', 'long-press'],
};

/** En iOS (sin presupuesto por ahora, pero sin quedar al azar): un impacto leve, la selección y el aviso doble. */
export const EN_IOS: Readonly<Record<Toque, { readonly tipo: 'impacto' | 'seleccion' | 'aviso'; readonly estilo: string | null }>> = {
  confirmar: { tipo: 'impacto', estilo: 'light' },
  deshacer: { tipo: 'seleccion', estilo: null },
  error: { tipo: 'aviso', estilo: 'warning' },
};

/** El toque que sigue a una respuesta del servidor: lo confirmado, según lo que se hizo; si no confirmó, `error`. */
export const toqueTrasLaRespuesta = (respuesta: { readonly ok: boolean }, al: 'guardar' | 'deshacer'): Toque => (!respuesta.ok ? 'error' : al === 'guardar' ? 'confirmar' : 'deshacer');

/** El toque que sigue a guardar en el teléfono una serie: tildarla confirma, destildarla deshace; si no quedó, ninguno. */
export function toqueTrasLaSerie(resultado: string): Toque | null {
  if (resultado === 'registrada') return 'confirmar';
  if (resultado === 'quitada') return 'deshacer';
  return null;
}

/** Si suena: solo con el interruptor prendido. */
export const suena = (toque: Toque | null, prendida: boolean): toque is Toque => toque !== null && prendida;

/**
 * Prueba la secuencia en orden hasta que el teléfono haga uno; devuelve cuál hizo, o `null` si ninguno (el texto de la
 * pantalla sigue diciendo lo que pasó).
 */
export async function primeroQueAnde(secuencia: readonly string[], hacer: (tipo: string) => Promise<void>): Promise<string | null> {
  for (const tipo of secuencia) {
    try {
      await hacer(tipo);
      return tipo;
    } catch {
      // Este teléfono no lo tiene: el siguiente.
    }
  }
  return null;
}
