/**
 * WP-ACCESO-GOOGLE (DEUDA_LEGAJO DL-138): el copy de entrar con Google, compartido por el website y la APK. Sin códigos
 * técnicos en pantalla. Google es una opción más: el correo y la contraseña siguen siempre a mano (UC-E05: «el acceso
 * local permanece disponible»).
 * Lo que se le dice a la persona es sobre su propia cuenta: solo llega con un ID token válido de Google para ese correo.
 */
import { AVISOS_DE_PRUEBA } from './ambiente-de-prueba';

export const COPY_ACCESO_GOOGLE = {
  continuarConGoogle: 'Continuar con Google',
  /** Entre el botón de Google y el formulario de correo y contraseña. */
  separador: 'o con tu correo',
  /** UC-E05 E01: Google sin configurar o sin responder. El acceso local no depende de Google. */
  noDisponible: 'Ahora no podemos usar Google. Podés entrar con tu correo y tu contraseña.',
  /** UC-E05 E03: el resultado de Google no se pudo verificar. */
  tokenInvalido: 'No pudimos verificar tu cuenta de Google. Probá de nuevo.',
  correoNoVerificado: 'Google todavía no verificó el correo de esa cuenta. Verificalo en Google, o entrá con tu correo y tu contraseña.',
  /** GOOGLE_LINK_REQUIRED: nunca se vincula sola (UC-E05 E02); la persona confirma su contraseña de BE una vez. */
  vincularTitulo: 'Confirmá tu contraseña de BE',
  vincularTexto: (correo: string) =>
    `Para entrar con Google a tu cuenta BE de ${correo}, confirmá tu contraseña una vez. Después vas a poder entrar solo con Google.`,
  vincular: 'Confirmar y entrar',
  /** GOOGLE_ACCOUNT_NOT_FOUND: la cuenta se crea con los mismos actos que el alta con correo. */
  crearTitulo: 'Crear tu cuenta con Google',
  crearTexto: (correo: string) =>
    `Todavía no tenés una cuenta BE con ${correo}. Para crearla, aceptá los términos, confirmá la información de privacidad y declará que tenés 18 años o más.`,
  crear: 'Crear mi cuenta',
  /** GOOGLE_ACCOUNT_ALREADY_LINKED. */
  yaVinculada: 'Tu cuenta BE ya está vinculada con otra cuenta de Google. Entrá con tu correo y tu contraseña.',
  /** GOOGLE_ACCOUNT_UNLINKED (RF-004, DL-172): la persona desvinculó esa cuenta de Google desde su cuenta. */
  desvinculada: 'Esa cuenta de Google se desvinculó de tu cuenta BE. Entrá con tu correo y tu contraseña; si querés, la volvés a vincular desde tu cuenta.',
  /** Un 401 neutral, como el del acceso local: no dice qué falló (10-B02:198-225). */
  accesoFallido: 'No pudimos verificar los datos de acceso.',
  // Las piezas de los pasos, iguales en el website y en la APK.
  /** Mientras BE verifica lo que respondió Google (API-GOO-01). */
  verificando: 'Verificando tu cuenta de Google…',
  /** La etiqueta del campo del paso de vincular: es la contraseña de BE, no la de Google. */
  contrasena: 'Contraseña de BE',
  contrasenaRequerida: 'Ingresá tu contraseña de BE.',
  vinculando: 'Confirmando…',
  creando: 'Creando tu cuenta…',
  /** Salir de un paso sin seguir con Google: vuelve al correo y la contraseña. */
  volver: 'Volver',
  /**
   * 08 §33: en el ambiente de prueba van solo datos sintéticos, y con Google el correo no se inventa: es el de la cuenta.
   * Es el mismo aviso que el alta con correo, para la cuenta de Google. Se muestra solo si `muestraLosAvisosDePrueba` lo
   * permite (UF-08).
   */
  avisoDePrueba: AVISOS_DE_PRUEBA.google,
} as const;
