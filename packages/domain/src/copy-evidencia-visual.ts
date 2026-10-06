/**
 * Copy de `EVIDENCIA_VISUAL` en la APK (08 §12.4 y §21.3; precierre del 2026-10-06, §6; DL-125). El texto que se acepta
 * es la versión del catálogo (`textos.ts`), tal cual: este copy es lo que lo rodea.
 * - **El momento es el de la subida** (08 §21.3): el texto aparece al subir la primera foto para un profesional, nunca
 *   enterrado en otro texto. «Ahora no» es tan visible como aceptar, y la comida se puede guardar sin la foto (08 §21.1).
 * - **El punto de aprobación queda a la vista:** mientras la versión sea una propuesta, la pantalla lo dice.
 * - **Revocar** no borra fotos ni el registro de la comida: corta las fotos nuevas y lo que ve el profesional.
 * - **Borrar una foto** (API-MED-05) borra la imagen y deja la constancia de que existió.
 */
export const COPY_EVIDENCIA_VISUAL = {
  titulo: 'Fotos de tus comidas',
  /** Encima del texto, en el momento de la subida. */
  antesDeTuPrimeraFoto: 'Antes de tu primera foto',
  paraQuien: (profesional: string) => `Para ${profesional}, en Nutrición.`,
  propuesta: 'Texto propuesto: pendiente de aprobación de Dirección y de validación jurídica.',
  version: (id: string) => `Versión ${id}`,
  aceptar: 'Aceptar y subir la foto',
  aceptando: 'Registrando…',
  ahoraNo: 'Ahora no',
  sinLaFoto: 'Podés guardar la comida sin la foto.',
  noSeRegistro: 'No se pudo registrar tu aceptación. La foto y lo que escribiste siguen acá: probá de nuevo.',
  noSeCargo: 'No se pudo cargar la información de las fotos. Probá de nuevo.',
  /** Cuenta → Privacidad. */
  explicacion: 'Lo que aceptaste antes de subir fotos para cada profesional de Nutrición.',
  ninguna: 'Todavía no aceptaste esta información para ningún profesional.',
  vigente: 'Vigente',
  revocada: 'Revocada',
  revocarPara: (profesional: string) => `Revocar fotos para ${profesional}`,
  revocar: 'Revocar',
  revocando: 'Revocando…',
  queImplicaRevocar:
    'Desde ahora no se suben fotos nuevas para este profesional, y deja de ver las que subiste. Tus fotos no se borran: las seguís viendo vos, y las podés borrar una por una.',
  revocadaListo: 'Listo: este profesional ya no ve tus fotos.',
  /** El registro de una comida (API-MED-05). */
  borrarFoto: 'Borrar esta foto',
  borrar: 'Borrar la foto',
  borrando: 'Borrando…',
  queImplicaBorrar: 'Se borra la imagen y queda la constancia de que existió. El registro de la comida sigue, sin esta foto.',
  fotoBorrada: 'La foto se borró.',
} as const;
