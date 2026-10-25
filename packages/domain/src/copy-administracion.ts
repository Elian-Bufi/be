/**
 * WP-ADMINISTRACION (DL-155): los textos de Administración, en un solo lugar para el website y las pruebas. Siguen B10-03
 * §20: se dice «verificación», «habilitación», «observación», «suspensión» y «rehabilitación», por área; nunca
 * «certificado por BE», «profesional aprobado» ni una sanción. Habilitar para operar en BE no es certificar una matrícula,
 * y la pantalla lo dice.
 */
import { ETIQUETA_DE_ALCANCE, type Alcance } from './alcance';
import { cambioDeOperacion, puedeOperar, type DecisionAdministrativa, type EstadoDelArea, type EvaluacionDeDecision, type SituacionDeArea } from './administracion';
import type { EstadoDeHabilitacion, EstadoDeVerificacionProfesional } from './verificacion-profesional';

export const COPY_ADMINISTRACION = {
  marca: 'Administración de BE',
  /** La aclaración que va siempre a la vista en la lista y en la ficha. */
  noCertifica: 'Habilitar para operar en BE no es certificar una matrícula: BE no certifica matrículas ni credenciales profesionales.',

  entrada: {
    titulo: 'Entrar a Administración',
    queEs: 'Es la entrada de Administración de BE. Para usar BE como profesional o como persona, entrá desde la portada.',
    correo: 'Correo',
    contrasena: 'Contraseña',
    continuar: 'Continuar',
    entrando: 'Verificando…',
    credencialesInvalidas: 'No pudimos verificar los datos de acceso. Revisá el correo y la contraseña.',
    plazoVencido: 'Pasaron 10 minutos desde que escribiste la contraseña. Por seguridad, volvé a empezar.',
    sesionVencida: 'Tu sesión de Administración venció. Volvé a entrar.',
    sesionCerrada: 'Cerraste la sesión de Administración.',
    cerradaPorIntentos: 'Hubo cinco códigos que no valen seguidos: por seguridad, se cerró esta sesión. Volvé a entrar.',
    sinConexion: 'No pudimos preguntarle a BE por tu sesión: no hay conexión, o BE no respondió. Revisá la conexión y volvé a entrar.',
    noConfigurada: 'La administración no está configurada en este ambiente.',
    otroAmbito: 'Esta sesión no es de Administración. Entrá con tu cuenta administrativa.',
    faltaCorreo: 'Escribí el correo de tu cuenta administrativa.',
    faltaContrasena: 'Escribí tu contraseña.',
  },

  /** El marco de la consola: la barra y su menú. */
  consola: {
    nombre: 'Administración',
    profesionales: 'Profesionales',
    seguridad: 'Seguridad',
    navegacion: 'Secciones de Administración',
    menu: 'Administración',
    opcionSeguridad: 'Seguridad de tu acceso',
    opcionSeguridadNota: 'Autenticador y códigos de recuperación',
  },

  segundoFactor: {
    titulo: 'Código del autenticador',
    ayuda: 'Escribí los seis dígitos que muestra tu aplicación de códigos para BE.',
    campo: 'Código de seis dígitos',
    confirmar: 'Confirmar',
    confirmando: 'Confirmando…',
    usarRecuperacion: 'Usar un código de recuperación',
    usarAutenticador: 'Usar el código del autenticador',
    formaInvalida: 'El código tiene seis dígitos.',
    invalido: (restantes: number): string =>
      restantes > 0 ? `El código no es válido o ya se usó. Te quedan ${restantes} ${restantes === 1 ? 'intento' : 'intentos'}.` : 'El código no es válido o ya se usó.',
    porInactividad: 'Pasaron 15 minutos sin actividad: por seguridad, escribí un código nuevo del autenticador.',
    plazo: (hora: string): string => `Tenés hasta las ${hora} para completar este paso.`,
    demasiadosIntentos: 'Hubo demasiados intentos seguidos. Esperá unos minutos y volvé a entrar.',
    intentosRestantes: (n: number): string => (n === 1 ? 'Te queda 1 intento.' : `Te quedan ${n} intentos.`),
    bloqueado:
      'Hubo demasiados códigos del autenticador que no valen, seguidos: por seguridad, el autenticador quedó bloqueado. Entrá con un código de recuperación (eso lo desbloquea) o pedile al operador de BE que restablezca tu segundo factor.',
  },

  recuperacion: {
    titulo: 'Código de recuperación',
    ayuda: 'Cada código sirve una sola vez. Después de entrar, reemplazá el autenticador desde «Seguridad».',
    campo: 'Código de recuperación',
    formaInvalida: 'Un código de recuperación tiene 12 caracteres, en tres grupos de cuatro.',
    quedan: (n: number): string => (n === 1 ? 'Te queda 1 código de recuperación.' : `Te quedan ${n} códigos de recuperación.`),
    pocos: 'Te quedan pocos códigos de recuperación: generá unos nuevos desde «Seguridad».',
    despues: (n: number): string =>
      `Entraste con un código de recuperación, que ya no vale. ${n === 1 ? 'Te queda 1 código' : `Te quedan ${n} códigos`}. Si perdiste el autenticador, reemplazalo desde «Seguridad».`,
  },

  configuracion: {
    titulo: 'Configurar el autenticador',
    queEs: 'Administración pide un segundo factor: un código de seis dígitos de una aplicación de códigos (por ejemplo, la del teléfono).',
    paso1: 'Escribí el código de incorporación que te dio el operador de BE.',
    campoIncorporacion: 'Código de incorporación',
    formaIncorporacion: 'El código de incorporación tiene 20 caracteres, en cuatro grupos de cinco.',
    incorporacionInvalida: 'El código de incorporación no es válido, venció o ya se usó. Pedile uno nuevo al operador.',
    paso2: 'Escaneá el código QR con la aplicación, o cargá la clave a mano.',
    etiquetaQr: 'Código QR para cargar BE en la aplicación de códigos',
    clave: 'Clave para cargar a mano',
    datosDeLaClave: 'Tipo: basada en el tiempo · 6 dígitos · cada 30 segundos.',
    paso3: 'Escribí el código que muestra la aplicación para confirmar.',
    vence: (hora: string): string => `Esta configuración vence a las ${hora}. Si vence, empezá de nuevo.`,
    vencida: 'La configuración venció o ya no está pendiente. Empezá de nuevo.',
    cuenta: (cuenta: string, emisor: string): string => `Cuenta: ${cuenta} · Emisor: ${emisor}`,
    continuar: 'Continuar',
    cancelar: 'Cancelar',
    reemplazar: 'Reemplazar el autenticador',
    reemplazarAyuda: 'El autenticador actual sigue valiendo hasta que confirmes el nuevo. Para empezar, escribí tu contraseña.',
    reemplazado: 'Autenticador reemplazado. Los códigos de recuperación anteriores dejaron de valer.',
  },

  codigos: {
    titulo: 'Tus códigos de recuperación',
    ayuda: 'Guardalos fuera de esta computadora, en un lugar seguro. Cada uno sirve una sola vez para entrar si perdés el autenticador. No se vuelven a mostrar.',
    listo: 'Ya los guardé',
    regenerar: 'Generar códigos nuevos',
    regenerarAyuda: 'Los códigos anteriores dejan de valer. Para continuar, escribí tu contraseña.',
  },

  seguridad: {
    titulo: 'Seguridad de tu acceso',
    restantes: (n: number): string => (n === 1 ? 'Queda 1 código de recuperación sin usar.' : `Quedan ${n} códigos de recuperación sin usar.`),
    vigencia: 'El segundo factor vence después de 15 minutos sin actividad; la sesión, a las 8 horas.',
    perdiste: 'Si perdés el autenticador y los códigos, el operador de BE puede restablecer tu segundo factor: vas a tener que configurarlo de nuevo con un código de incorporación.',
    sesionVence: (dia: string, hora: string): string => `Esta sesión vence el ${dia} a las ${hora}.`,
    contrasenaIncorrecta: 'La contraseña no es correcta.',
    faltaContrasena: 'Escribí tu contraseña.',
    codigosVigentes: 'Códigos de recuperación',
    autenticador: 'Autenticador',
    autenticadorAyuda: 'Para cambiar de teléfono o de aplicación de códigos. El actual sigue valiendo hasta que confirmes el nuevo.',
    noLeida: 'el estado de tu acceso',
  },

  sesion: {
    cerrar: 'Cerrar sesión',
    cerrando: 'Cerrando…',
    recuperando: 'Recuperando la sesión de Administración…',
  },

  lista: {
    titulo: 'Profesionales',
    queEs: 'Los profesionales registrados en BE y su situación en cada área. Desde la ficha se decide sobre cada área por separado.',
    buscar: 'Buscar por nombre o correo',
    buscarBoton: 'Buscar',
    limpiar: 'Quitar la búsqueda',
    area: 'Área',
    situacion: 'Situación',
    todas: 'Todas',
    pendientes: (n: number): string => (n === 0 ? 'Ninguna área pendiente de revisión' : n === 1 ? '1 área pendiente de revisión' : `${n} áreas pendientes de revisión`),
    verPendientes: 'Ver las pendientes',
    coinciden: (n: number): string => (n === 1 ? '1 profesional' : `${n} profesionales`),
    vacio: 'Ningún profesional coincide con lo elegido.',
    vacioSinFiltros: 'Todavía no hay profesionales registrados en BE.',
    vacioSinFiltrosAyuda: 'En esta versión, los profesionales los registra el servicio interno de BE: no hay alta pública.',
    anterior: 'Anterior',
    siguiente: 'Siguiente',
    pagina: (n: number): string => `Página ${n}`,
    paginacion: 'Páginas de la lista',
    abrir: 'Abrir la ficha',
    abrirLaFichaDe: (nombre: string): string => `Abrir la ficha de ${nombre}`,
    profesional: 'Profesional',
    quitarFiltros: 'Ver todos los profesionales',
    sinCorreo: 'Sin correo de acceso',
    noLeida: 'la lista de profesionales',
  },

  /** El estado de la cuenta del profesional (no lo decide Administración: D-4). Se dice solo si no está en uso. */
  cuentaEnPalabras: { OPERATIVA: 'Cuenta en uso', SUSPENDIDA: 'Cuenta suspendida', CERRADA: 'Cuenta cerrada' } as const,

  ficha: {
    volver: 'Volver a la lista',
    identidad: 'Identidad profesional',
    tipoDePerfil: { HEALTH_PROFESSIONAL: 'Profesional de la salud', NON_HEALTH_PROFESSIONAL: 'Profesional no sanitario' } as const,
    correo: 'Correo de acceso',
    desde: 'Perfil profesional desde',
    cuenta: 'Cuenta',
    areas: 'Áreas',
    verificacion: 'Verificación',
    habilitacion: 'Habilitación para operar en BE',
    desdeElDia: (dia: string): string => `desde el ${dia}`,
    personas: (activas: number, pausadas: number): string => {
      const total = activas + pausadas;
      if (total === 0) return 'Sin personas vinculadas en esta área.';
      const base = total === 1 ? '1 persona vinculada' : `${total} personas vinculadas`;
      return pausadas > 0 ? `${base} (${pausadas} con el vínculo en pausa).` : `${base}.`;
    },
    sinAcciones: 'No hay decisiones de Administración para este estado.',
    sinAccionesPorque: {
      NOT_PRESENTED: 'El área no se presentó: presentarla es del profesional, y esta versión no tiene alta pública.',
      REJECTED: 'Rechazada: volver a presentarla es del profesional.',
    } as const,
    ultimaObservacion: (dia: string): string => `Última observación, el ${dia}:`,
    historial: 'Historial',
    historialAyuda: 'Las decisiones de Administración y los hechos automáticos, del más nuevo al más viejo. El fundamento interno lo ve solo Administración.',
    historialVacio: 'Todavía no hay hechos registrados.',
    historialVacioDelArea: 'Todavía no hay hechos registrados en esta área.',
    historialDelArea: 'Área del historial',
    masHistorial: 'Ver más del historial',
    noLeida: 'la ficha del profesional',
    historialNoLeido: 'el historial',
    noDisponible: 'No encontramos a este profesional. Puede que el enlace sea viejo.',
    actualizar: 'Actualizar',
    consultadaA: (hora: string): string => `Consultada a las ${hora}`,
    perfil: 'Perfil',
    transicion: (antes: string | null, despues: string): string => (antes ? `De «${antes}» a «${despues}».` : `Queda «${despues}».`),
    sinCambioDeEstado: (estado: string): string => `Sigue «${estado}».`,
  },

  decision: {
    fundamento: 'Fundamento interno',
    fundamentoAyuda: 'Por qué se decide. Queda en el historial; lo ve solo Administración.',
    mensaje: 'Texto para el profesional',
    mensajeAyuda: 'Lo que recibe el profesional en BE. No lleva el fundamento interno.',
    mensajeOpcional: 'Texto para el profesional (opcional)',
    faltaFundamento: 'Escribí el fundamento interno.',
    faltaMensaje: 'Escribí el texto para el profesional.',
    caracteres: (usados: number, tope: number): string => `${usados} de ${tope} caracteres`,
    cancelar: 'Cancelar',
    registrando: 'Registrando…',
    registrada: (que: string): string => `${que}: decisión registrada.`,
    avisados: (profesional: boolean, personas: number): string => {
      const a = [profesional ? 'al profesional' : null, personas > 0 ? (personas === 1 ? 'a 1 persona vinculada' : `a ${personas} personas vinculadas`) : null].filter(Boolean);
      return a.length === 0 ? '' : `Se avisó ${a.join(' y ')}.`;
    },
    conflicto: 'La situación de esta área cambió desde que la abriste. Revisá cómo está ahora; lo que escribiste sigue acá.',
    conflictoTitulo: 'La situación cambió',
    noPermitida: 'Esta decisión ya no corresponde al estado del área. Revisá cómo está ahora.',
    ahora: (situacion: string): string => `Cómo está ahora: ${situacion}.`,
    sigueDisponible: 'La decisión sigue disponible con la situación de ahora: si corresponde, confirmala de nuevo.',
    sinReleer: 'No pudimos volver a leer cómo está el área. Cerrá este diálogo y actualizá la ficha; lo que escribiste no se registró.',
    reverificar: 'Pasaron 15 minutos sin actividad: para registrar la decisión, escribí un código nuevo del autenticador. Lo que escribiste sigue acá.',
    codigoConfirmado: 'Código confirmado. Revisá la decisión y confirmala.',
    cerrar: 'Cerrar',
    queCambia: 'Qué cambia',
    queSigueIgual: 'Qué sigue igual',
    aQuienSeAvisa: 'A quién se avisa',
  },

  estadoDeVerificacion: {
    PENDIENTE: 'Pendiente de revisión',
    VERIFICADO: 'Verificada',
    RECHAZADO: 'Rechazada',
    SUSPENDIDO: 'Suspendida',
    ninguno: 'Sin presentación',
  } as const,
  estadoDeHabilitacion: { CONCEDIDA: 'Concedida', RETIRADA: 'Retirada', ninguno: 'Sin habilitación' } as const,

  situacion: {
    NOT_PRESENTED: 'Sin presentación',
    PENDING_REVIEW: 'Pendiente de revisión',
    CAN_OPERATE: 'Puede operar',
    VERIFIED_NOT_ENABLED: 'Verificada, sin habilitación',
    SUSPENDED: 'Suspendida',
    REJECTED: 'Rechazada',
  } as const satisfies Record<SituacionDeArea, string>,

  nombreDeLaDecision: {
    OBSERVE: 'Registrar observación',
    VERIFY: 'Verificar',
    REJECT: 'Rechazar',
    SUSPEND: 'Suspender',
    REINSTATE: 'Rehabilitar',
    GRANT_ENABLEMENT: 'Conceder habilitación',
    WITHDRAW_ENABLEMENT: 'Retirar habilitación',
  } as const satisfies Record<DecisionAdministrativa, string>,

  /** El tipo de cada hecho del 06, en palabras, para el historial. */
  hecho: {
    PerfilProfesionalCreado: 'Perfil profesional creado',
    AlcancePresentado: 'Área presentada',
    ObservacionRegistrada: 'Observación registrada',
    SubsanacionPresentada: 'Subsanación presentada',
    AlcanceVerificado: 'Área verificada',
    AlcanceRechazado: 'Área rechazada',
    AlcancePresentadoNuevamente: 'Área presentada de nuevo',
    AlcanceSuspendido: 'Área suspendida',
    AlcanceRehabilitado: 'Área rehabilitada',
    HabilitacionConcedida: 'Habilitación concedida',
    HabilitacionRetirada: 'Habilitación retirada',
  } as Readonly<Record<string, string>>,
  automatico: 'Automático · servicio interno de BE',
  deAdministracion: (nombre: string): string => `${nombre} · Administración`,
  textoAlProfesional: 'Texto comunicado al profesional',
  fundamentoInterno: 'Fundamento interno',
  versionRevisada: (n: number): string => `versión ${n} de la trayectoria`,
} as const;

/** El nombre de un estado de verificación o de habilitación, o lo que se dice cuando no hay fila. */
export const estadoDeVerificacionEnPalabras = (e: EstadoDeVerificacionProfesional | null): string => (e ? COPY_ADMINISTRACION.estadoDeVerificacion[e] : COPY_ADMINISTRACION.estadoDeVerificacion.ninguno);
export const estadoDeHabilitacionEnPalabras = (e: EstadoDeHabilitacion | null): string => (e ? COPY_ADMINISTRACION.estadoDeHabilitacion[e] : COPY_ADMINISTRACION.estadoDeHabilitacion.ninguno);

/** La frase que resume si puede operar el área, y por qué no. Explica los dos estados sin fundirlos en uno. */
export function operacionEnPalabras(alcance: Alcance, e: EstadoDelArea): string {
  const area = ETIQUETA_DE_ALCANCE[alcance];
  if (puedeOperar(e)) return `Puede operar ${area} en BE.`;
  if (e.verificacion === null) return `No puede operar ${area}: el área no se presentó.`;
  if (e.verificacion === 'PENDIENTE') return `No puede operar ${area}: la verificación está pendiente.`;
  if (e.verificacion === 'RECHAZADO') return `No puede operar ${area}: la verificación fue rechazada.`;
  if (e.verificacion === 'SUSPENDIDO') return `No puede operar ${area}: la verificación está suspendida.`;
  return e.habilitacion === 'RETIRADA' ? `No puede operar ${area}: la habilitación está retirada.` : `No puede operar ${area}: falta conceder la habilitación.`;
}

export interface EfectoDeLaDecision {
  readonly titulo: string;
  readonly confirmar: string;
  readonly cambia: readonly string[];
  readonly sigueIgual: readonly string[];
  readonly avisos: readonly string[];
  /** Cuántas personas reciben el aviso (las vinculadas, si cambia que pueda operar). */
  readonly personasAvisadas: number;
  readonly mensajeObligatorio: boolean;
}

/**
 * Lo que dice la confirmación de una decisión: profesional, área, qué cambia, qué sigue igual y a quiénes se avisa. Sale del
 * mismo dominio que decide (`evaluarDecision`), así lo que se promete es lo que pasa. Sin una evaluación permitida no hay
 * efecto que mostrar.
 */
export function efectoDeLaDecision(p: {
  readonly decision: DecisionAdministrativa;
  readonly alcance: Alcance;
  readonly profesional: string;
  readonly antes: EstadoDelArea;
  readonly evaluacion: Extract<EvaluacionDeDecision, { permitida: true }>;
  readonly personas: { readonly active: number; readonly paused: number };
  readonly mensajeObligatorio: boolean;
}): EfectoDeLaDecision {
  const area = ETIQUETA_DE_ALCANCE[p.alcance];
  const despues = p.evaluacion.despues;
  const cambio = cambioDeOperacion(p.antes, despues);
  const personas = cambio === 'SIN_CAMBIO' ? 0 : p.personas.active + p.personas.paused;
  const nombre = COPY_ADMINISTRACION.nombreDeLaDecision[p.decision];
  const operaDespues = puedeOperar(despues);
  const conservado = `Sus planes, registros y borradores de ${area} se conservan.`;
  const otras = 'Las otras áreas no cambian.';
  let cambia: string[];
  let sigueIgual: string[];
  switch (p.decision) {
    case 'OBSERVE':
      cambia = [`Queda registrada la observación sobre ${area}, con el texto para el profesional.`];
      sigueIgual = ['La verificación sigue pendiente: una observación no la rechaza ni la suspende.', otras];
      break;
    case 'VERIFY':
      cambia = [`La verificación de ${area} pasa a verificada.`, operaDespues ? `Puede operar ${area} en BE desde su próxima acción.` : `Todavía no puede operar ${area}: falta conceder la habilitación, que es otra decisión.`];
      sigueIgual = ['La habilitación no cambia.', otras, 'Verificar es una decisión administrativa de BE: no certifica una matrícula.'];
      break;
    case 'REJECT':
      cambia = [`La verificación de ${area} pasa a rechazada: no puede operar el área.`];
      sigueIgual = ['La historia del área se conserva.', otras];
      break;
    case 'SUSPEND':
      cambia = [`Deja de poder operar ${area} en BE desde su próxima acción, aunque tenga la sesión abierta.`];
      sigueIgual = [conservado, otras, 'La habilitación queda como está.'];
      break;
    case 'REINSTATE':
      cambia = [
        `La verificación de ${area} vuelve a verificada.`,
        operaDespues
          ? `Vuelve a poder operar ${area}: el acceso a cada persona depende otra vez de su vínculo y su autorización.`
          : `Todavía no puede operar ${area}: ${despues.habilitacion === 'RETIRADA' ? 'la habilitación está retirada' : 'falta conceder la habilitación'}.`,
      ];
      sigueIgual = ['No se reactivan vínculos finalizados ni autorizaciones revocadas.', 'La suspensión queda en el historial.', otras];
      break;
    case 'GRANT_ENABLEMENT':
      cambia = [
        `Se concede la habilitación para operar ${area} en BE.`,
        operaDespues ? `Puede operar ${area} desde su próxima acción; el acceso a cada persona depende de su vínculo y su autorización.` : `Todavía no puede operar ${area}: la verificación no está vigente.`,
      ];
      sigueIgual = ['La verificación no cambia.', 'Habilitar para operar en BE no es certificar una matrícula.', otras];
      break;
    case 'WITHDRAW_ENABLEMENT':
      cambia = [`Se retira la habilitación: deja de poder operar ${area} en BE desde su próxima acción, aunque tenga la sesión abierta.`];
      sigueIgual = ['La verificación queda como está.', conservado, otras];
      break;
  }
  const avisos = [
    'El profesional recibe una novedad en BE con la decisión y el texto para el profesional. El fundamento interno no viaja.',
    personas > 0
      ? `${personas === 1 ? 'La persona vinculada' : `Las ${personas} personas vinculadas`} en ${area} ${personas === 1 ? 'recibe' : 'reciben'} un aviso con el efecto, sin los motivos.`
      : cambio === 'SIN_CAMBIO'
        ? 'A las personas vinculadas no se les avisa: no cambia lo que el profesional puede hacer con su información.'
        : `No hay personas vinculadas en ${area} para avisar.`,
  ];
  return { titulo: `${nombre} · ${area} de ${p.profesional}`, confirmar: `${nombre} ${area}`, cambia, sigueIgual, avisos, personasAvisadas: personas, mensajeObligatorio: p.mensajeObligatorio };
}

// La lista de lo que Administración nunca dice vive en `terminos-de-administracion.ts`: si estuviera acá, la prueba que
// recorre este archivo la encontraría a ella misma.
