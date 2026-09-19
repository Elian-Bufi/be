/**
 * Copy de WP-02, compartido por el website y el APK («comparten semántica y copy», 10-B11:51). Literal del Documento 10 donde existe (cita al lado); desvíos registrados en DEUDA_LEGAJO DL-024.
 * Prohibido (10-B02, 10-ADD, 10-B10): checkbox único, «Aceptar todo», «Ese correo ya tiene una cuenta»,
 * «usuario inexistente/contraseña incorrecta», «Tu cuenta está incompleta», «Eliminar todos mis datos», «Borrar historia».
 */
export const COPY = {
  /** 10-B02:143-155 — A1, etiqueta propia. */
  a1Titulo: 'Términos de uso',
  a1Texto: 'Confirmo que leí y acepto la versión indicada de los términos de BE.',
  /** 10-B02:143-155 — A2, etiqueta propia. No es consentimiento sensible (10-B02:155). */
  a2Titulo: 'Información de privacidad',
  a2Texto: 'Confirmo que recibí la información de privacidad correspondiente a esta versión.',
  /** 10-B02:157-166, sin «o recuperar el acceso» (DL-024: recuperación fuera de alcance). */
  registroNoDisponible: 'No pudimos completar el registro con esos datos.',
  registroNoDisponibleAyuda: 'Podés intentar iniciar sesión.',
  /** 10-B02:170-194 — sin auto-login. */
  cuentaCreada: 'Cuenta creada. Iniciá sesión para continuar con la configuración.',
  iniciarSesion: 'Iniciar sesión',
  /** 10-B02:198-225 — neutral: no dice qué falló. */
  loginFallido: 'No pudimos verificar los datos de acceso.',
  /** 10-B02:310-347 — literal, sin CTA de otorgamiento (DL-024). */
  cuentaSinA3: 'Para usar funciones que procesan datos de salud, revisá y autorizá el tratamiento correspondiente.',
  /** 10-B02:535-551. */
  errorA3: 'No pudimos cargar la información de privacidad necesaria.',
  /** 10-B02:436-458 — sin confundir con cerrar la cuenta. */
  cerrarSesion: 'Cerrar sesión',
  cerrarTodas: 'Cerrar todas mis sesiones',
  /** 10-ADD:39-96. */
  cerrarMiCuenta: 'Cerrar mi cuenta',
  confirmarCierre: 'Confirmar cierre',
  cancelar: 'Cancelar',
  cierreRegistrado: 'Solicitud de cierre registrada.',
  /** 10-B10:160-174. */
  resumenDeErrores: (n: number) =>
    n === 1 ? 'Revisá los campos marcados. Hay 1 dato que necesita corrección.' : `Revisá los campos marcados. Hay ${n} datos que necesitan corrección.`,
  /** 10-B10:355-378. */
  errorDeVista: 'No pudimos cargar esta vista.',
  reintentar: 'Reintentar',
  /** 10-B10:430-438; 10-B04:1117-1141. */
  verificando: 'Estamos verificando si la acción se completó.',
  resultadoIncierto: 'No pudimos confirmar el resultado. Reintentá.',
  /** Sin copy en el 10 (D-23): mensajes neutrales, sin códigos técnicos. */
  demasiadosIntentos: 'Demasiados intentos. Probá de nuevo más tarde.',
  noDisponible: 'El servicio no está disponible en este momento. Probá de nuevo más tarde.',
  versionDesactualizada: 'Los textos cambiaron mientras completabas el formulario. Recargá la página y revisalos de nuevo.',
  stepUp: 'Por seguridad, volvé a iniciar sesión para confirmar esta acción.',
} as const;

/** Mensajes de campo (sin copy en el 10: neutrales, sin códigos técnicos). */
export const MENSAJE_DE_CAMPO: Readonly<Record<string, string>> = {
  INVALID_LOCAL_IDENTIFIER: 'Ingresá un correo electrónico válido.',
  CREDENCIAL_DEMASIADO_CORTA: 'La contraseña debe tener al menos 12 caracteres.',
  CREDENCIAL_DEMASIADO_LARGA: 'La contraseña es demasiado larga.',
  A1_REQUERIDO: 'Para crear la cuenta tenés que aceptar los términos de uso.',
  A2_REQUERIDO: 'Para crear la cuenta tenés que confirmar que recibiste la información de privacidad.',
};
