/**
 * UF-11 de WP-USO-FINAL (DL-169; UF-D12): los textos del segundo factor del profesional en `/pro`. Los del autenticador
 * son los de Administración (`COPY_ADMINISTRACION`), que ya pasaron por las guardias: el código, la clave, el QR y los
 * códigos de recuperación se dicen igual. Acá va lo que cambia para el profesional: por qué se pide, que la primera vez se
 * configura solo y que, si pasó el plazo, hay que volver a entrar.
 */
import { COPY_ADMINISTRACION } from './copy-administracion';

const A = COPY_ADMINISTRACION;

export const COPY_SEGUNDO_FACTOR_DEL_PROFESIONAL = {
  /** El paso del código, con autenticador. */
  codigo: {
    titulo: 'Confirmá que sos vos',
    queEs: 'Para ver a las personas que acompañás, BE pide el código de tu aplicación de códigos además de la contraseña. Lo pide una vez por sesión.',
    campo: A.segundoFactor.campo,
    ayuda: A.segundoFactor.ayuda,
    confirmar: A.segundoFactor.confirmar,
    confirmando: A.segundoFactor.confirmando,
    usarRecuperacion: A.segundoFactor.usarRecuperacion,
    usarAutenticador: A.segundoFactor.usarAutenticador,
    formaInvalida: A.segundoFactor.formaInvalida,
    invalido: A.segundoFactor.invalido,
    bloqueado:
      'Hubo demasiados códigos del autenticador que no valen, seguidos: por seguridad, el autenticador quedó bloqueado. Entrá con un código de recuperación, que lo desbloquea.',
    demasiadosIntentos: A.segundoFactor.demasiadosIntentos,
    perdisteTitulo: 'Si perdiste el autenticador y los códigos',
    perdiste: 'Escribile al equipo de BE por el canal de ayuda: después de verificar que sos vos, restablecen tu segundo factor y lo configurás de nuevo.',
  },
  recuperacion: {
    titulo: A.recuperacion.titulo,
    campo: A.recuperacion.campo,
    ayuda: 'Cada código sirve una sola vez. Si perdiste el autenticador, después de entrar reemplazalo desde «Seguridad».',
    formaInvalida: A.recuperacion.formaInvalida,
    despues: (n: number): string =>
      `Entraste con un código de recuperación, que ya no vale. ${n === 1 ? 'Te queda 1 código' : `Te quedan ${n} códigos`}. Si perdiste el autenticador, reemplazalo desde «Seguridad».`,
  },
  /** La primera vez: configurar el autenticador. */
  configuracion: {
    titulo: 'Configurá tu segundo factor',
    queEs:
      'Antes de ver a las personas que acompañás, BE te pide un segundo factor: un código de seis dígitos de una aplicación de códigos del teléfono (por ejemplo, Google Authenticator o Microsoft Authenticator). Se configura una sola vez.',
    empezar: 'Empezar',
    empezando: 'Preparando…',
    paso2: A.configuracion.paso2,
    etiquetaQr: A.configuracion.etiquetaQr,
    clave: A.configuracion.clave,
    datosDeLaClave: A.configuracion.datosDeLaClave,
    paso3: A.configuracion.paso3,
    cuenta: A.configuracion.cuenta,
    vence: A.configuracion.vence,
    vencida: A.configuracion.vencida,
    plazo: (hora: string): string => `Tenés hasta las ${hora} para configurarlo. Si se pasa, volvé a entrar.`,
    reemplazar: A.configuracion.reemplazar,
    reemplazarAyuda: 'El autenticador actual sigue valiendo hasta que confirmes el nuevo.',
    reemplazado: 'Autenticador reemplazado. Los códigos de recuperación anteriores dejaron de valer y tus otras sesiones vuelven a pedir el código.',
    cancelar: A.configuracion.cancelar,
  },
  codigos: {
    titulo: A.codigos.titulo,
    ayuda: A.codigos.ayuda,
    listo: A.codigos.listo,
    regenerar: A.codigos.regenerar,
    regenerarAyuda: 'Los códigos anteriores dejan de valer y tus otras sesiones vuelven a pedir el código.',
  },
  /** Sin autenticador y con el plazo vencido: volver a entrar. */
  volverAEntrar: {
    titulo: 'Volvé a entrar para configurar tu segundo factor',
    texto: 'Por seguridad, el segundo factor se configura en los 10 minutos que siguen a entrar con tu contraseña o con Google. Cerrá la sesión y volvé a entrar.',
  },
  /** «Seguridad», en `/pro`. */
  seguridad: {
    titulo: 'Seguridad de tu acceso',
    queEs: 'Tu segundo factor: el código de tu aplicación, que BE pide una vez por sesión para el espacio profesional.',
    restantes: A.seguridad.restantes,
    reciente: (hora: string): string => `Para reemplazar el autenticador o generar códigos nuevos, tenés hasta las ${hora}. Después, volvé a entrar.`,
    noReciente: 'Para reemplazar el autenticador o generar códigos nuevos, volvé a entrar: se pide una entrada reciente.',
  },
  pasoDesconocido: 'Hay una versión nueva de BE. Recargá la página para seguir.',
  salir: 'Cerrar sesión',
} as const;
