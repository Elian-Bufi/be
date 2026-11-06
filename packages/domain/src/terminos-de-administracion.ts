/**
 * WP-ADMINISTRACION (DL-155) · B10-03 §20 («Evitar»): lo que la administración nunca dice. También en negación: un «no es
 * una sanción» igual instala la idea. Lo revisan la prueba del dominio (`administracion.test.ts`) y
 * `scripts/copy-pantallas.test.cjs`, que recorre las pantallas de `/admin` y `copy-administracion.ts`. Vive aparte del copy
 * para que esa prueba no encuentre la lista misma.
 */
export const TERMINOS_PROHIBIDOS_DE_ADMINISTRACION: readonly string[] = [
  'certificado por be',
  'certificada por be',
  'certificación oficial',
  'aprobado globalmente',
  'profesional aprobado',
  'especialidad antropometría',
  'especialidad de antropometría',
  'cuenta castigada',
  'castigo',
  'sanción',
  'admin médico',
  'modo profesional',
  'ver como profesional',
  'actuar como profesional',
];

export function terminosProhibidosDeAdministracionEn(texto: string): string[] {
  const t = texto.toLowerCase();
  return TERMINOS_PROHIBIDOS_DE_ADMINISTRACION.filter((p) => t.includes(p));
}
