/**
 * La letra de una sesión por su posición en la fase: A, B, C… (después de la Z, el número). La usan las tarjetas de las
 * sesiones, el almanaque y la matriz de días (ET1-D02). DL-198 (ET1-D20): salió de `plan-y-fases.tsx`, que quedó sin uso
 * con los cuadros de la tanda 1 y se borró.
 */
export const letraDeLaSesion = (n: number): string => (n < 26 ? String.fromCharCode(65 + n) : String(n + 1));
