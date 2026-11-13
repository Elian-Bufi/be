/**
 * Los textos nuevos de WP-APP-VUELTA-DE-ROSCA (DL-166): Perfil, «Quién ve qué», Inicio, los desplegables y la sesión con
 * su descanso. Viven en un módulo puro para que `scripts/copy-pantallas.test.cjs` (T13) los revise con todas las listas
 * y la prueba del paquete los use sin React.
 *
 * Reglas que cumplen: ubican, nunca califican; ningún número es un juicio; nada dice «cumplimiento», «adherencia» ni
 * «racha»; los textos de acceso no prometen más de lo autorizado (10-B04: nunca «puede ver todos tus datos»).
 */
import { numero } from '@be/domain';

/** «3 ingredientes», «1 paso»: una cuenta con su palabra, en singular o plural. */
const cuantos = (n: number, uno: string, varios: string): string => `${numero(n)} ${n === 1 ? uno : varios}`;

export const TEXTOS_DE_LA_VUELTA = {
  cuantos,

  // ─── Los desplegables (AV-01, AV-08) ───────────────────────────────────────────────────────
  paraQueLoPide: 'Para qué lo pide',
  queIncluye: 'Qué incluye',

  // ─── La barra y Perfil (AV-02 a AV-04) ─────────────────────────────────────────────────────
  perfil: 'Perfil',
  hayAlgoParaResponder: 'hay algo para responder',
  compartir: 'Compartir',
  compartirTuIdentificador: 'Compartir tu identificador BE',
  tuInformacion: 'Tu información',
  misDatos: 'Mis datos',
  misDatosDetalle: 'Nombre, estado de la cuenta e identificador',
  misHabitos: 'Mis hábitos',
  quienVeQue: 'Quién ve qué',
  quienVeQueDetalle: 'Por profesional y por área',
  notasEntreEllos: 'Notas entre tus profesionales',
  notasEntreEllosDetalle: 'Lo que se escriben sobre vos',
  habitosSinCargar: 'Todavía no los contaste',
  habitosSinCompartir: 'Cargados, sin compartir',
  habitosLosVen: (n: number) => (n === 1 ? 'Los ve 1 profesional' : `Los ven ${numero(n)} profesionales`),
  tusProfesionales: 'Tus profesionales',
  sinProfesionales: 'Todavía no tenés profesionales.',
  desde: (fecha: string) => `desde el ${fecha}`,
  todosTusVinculos: 'Vínculos y solicitudes',
  formulariosYPedidos: 'Formularios y pedidos',
  paraResponder: 'Para responder',
  respondidos: 'Respondidos',
  nadaParaResponder: 'Nada para responder',
  unFormularioYUnPedido: (formularios: number, pedidos: number) =>
    [formularios > 0 ? cuantos(formularios, 'formulario', 'formularios') : null, pedidos > 0 ? cuantos(pedidos, 'pedido de hábitos', 'pedidos de hábitos') : null].filter(Boolean).join(' y '),
  ajustes: 'Ajustes',
  apariencia: 'Apariencia',
  avisos: 'Avisos',
  avisosDetalle: 'Comidas y entrenamiento',
  privacidad: 'Privacidad y consentimientos',
  sesionYEsteTelefono: 'Sesión y este teléfono',
  sesionYEsteTelefonoDetalle: 'Cerrar sesión',
  cerrarMiCuenta: 'Cerrar mi cuenta',

  // ─── «Quién ve qué» (AV-05) ────────────────────────────────────────────────────────────────
  tratamientoDeDatosDeSalud: 'Tratamiento de tus datos de salud',
  a3Otorgado: 'Lo autorizaste. Sin esto, ningún profesional ve tus datos de salud.',
  a3NoOtorgado: 'No está autorizado: por ahora, ningún profesional ve tus datos de salud.',
  loQueAutorizaste: 'Lo que autorizaste',
  autorizadoDesde: (area: string, fecha: string) => `${area} · desde el ${fecha}`,
  sinAutorizar: (area: string) => `${area} · todavía sin autorizar`,
  enPausaNoVe: 'El vínculo está en pausa: mientras tanto, no ve tus datos.',
  terminadoNoVe: 'El vínculo terminó: ya no ve tus datos.',
  revocadoNoVe: 'Retiraste tu autorización: no ve tus datos.',
  tusHabitos: 'Tus hábitos',
  losVe: 'Los ve',
  noLosVe: 'No los ve',
  tePidioVerlos: 'Te pidió verlos · No los ve',
  habitosParaLeer: (estado: string) => `Tus hábitos: ${estado.toLowerCase()}`,
  paraQue: (finalidad: string) => `Para: ${finalidad}.`,
  dentroDe: (area: string) => `Dentro del área: ${area}.`,
  queIncluyeAclaracion: 'Solo lo de esa área, mientras el vínculo esté vigente y tu autorización siga activa.',
  cambiar: 'Cambiar',
  cambiarEnElVinculo: 'Ver el vínculo',
  cambiarEnMisHabitos: 'Ir a Mis hábitos',
  cambiarEnPrivacidad: 'Ir a Privacidad',
  ningunVinculo: 'Todavía no tenés vínculos con profesionales.',

  // ─── Inicio (AV-06, AV-07, AV-17) ──────────────────────────────────────────────────────────
  entrenamientoDeHoy: 'Entrenamiento de hoy',
  // La sesión en curso (WP-APP-VUELTA-2 AV2-09): en Inicio se ve sola; en Entrenamiento, ninguna otra ofrece empezar.
  entrenamiento: 'Entrenamiento',
  enPausa: 'En pausa',
  continuar: 'Continuar',
  ejercicioYSerie: (ejercicio: string, serie: number) => `${ejercicio} · serie ${numero(serie)}`,
  verLasSesiones: (n: number) => `Ver las ${numero(n)} sesiones`,
  hayUnEntrenamientoEnCurso: (sesion: string) => `Hay un entrenamiento en curso: ${sesion}. Para iniciar otra, primero continualo o dejalo incompleto.`,
  empezar: 'Empezar',
  seguir: 'Seguir',
  sinRegistrar: 'Sin registrar',
  ejerciciosYSeries: (ejercicios: number, series: number) => `${cuantos(ejercicios, 'ejercicio', 'ejercicios')} · ${cuantos(series, 'serie', 'series')}`,
  yMas: (n: number) => `y ${numero(n)} más`,
  comidas: 'Comidas',
  // Las fichas de las comidas (WP-APP-VUELTA-2 AV2-10): la registrada dice su hora con la tilde; la que sigue,
  // «Registrar»; las anteriores sin registrar, «Sin registrar», neutras; las que vienen, sus opciones.
  registradaSinHora: 'Registrada',
  registrar: 'Registrar',
  opciones: (n: number) => cuantos(n, 'opción', 'opciones'),
  fichaRegistrada: (comida: string, hora: string) => `${comida}, registrado a las ${hora}`,
  fichaRegistradaSinHora: (comida: string) => `${comida}, registrado`,
  fichaQueSigue: (comida: string) => `${comida}, registrar`,
  fichaSinRegistrar: (comida: string) => `${comida}, sin registrar`,
  fichaPorVenir: (comida: string, opciones: number) => `${comida}, ${cuantos(opciones, 'opción', 'opciones')}`,
  fueraDelPlan: (n: number) => (n === 1 ? 'Y 1 registro fuera del plan.' : `Y ${numero(n)} registros fuera del plan.`),
  verElPlan: 'Ver el plan',
  cambiarElDia: 'Cambiar el día del plan',
  paraMirar: 'Para mirar',
  ultimos30Dias: 'Últimos 30 días',
  // ─── La actividad (WP-APP-VUELTA-2 AV2-12, con AV2-D2): nunca un total que mezcle lo hecho con lo no hecho ──
  actividad: 'Actividad',
  realizadas: (n: number) => (n === 1 ? 'realizada' : 'realizadas'),
  noRealizadas: (n: number) => cuantos(n, 'no realizada', 'no realizadas'),
  treintaDias: '30 días',
  actividadParaLeer: (partes: readonly string[]) => `Actividad de los últimos 30 días: ${partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`}`,
  sinActividad: 'No registraste sesiones en estos días.',
  // ─── La tira de la semana (WP-APP-VUELTA-2 AV2-08): celebra lo hecho, sin rachas ni ceros ──────
  sesionesRealizadasEstaSemana: (n: number) => (n === 1 ? '1 sesión realizada esta semana' : `${numero(n)} sesiones realizadas esta semana`),
  semanaParaLeer: (dias: string, hoy: string) => `Esta semana: ${dias} con sesión realizada. Hoy, ${hoy}`,
  semanaSinSesionesParaLeer: (hoy: string) => `Esta semana, de lunes a domingo. Hoy, ${hoy}`,
  // ─── La medida de la última toma (AV2-07): el cambio, dicho como un dato ─────────────────────
  mediciones: 'Mediciones',
  sinCambioDesde: (fecha: string) => `Sin cambio desde el ${fecha}`,
  cambioDesde: (diferencia: string, fecha: string) => `${diferencia} desde el ${fecha}`,
  sinAnteriorComparableOtroGrupo: 'Sin anterior comparable: la toma anterior usó otro protocolo, método o unidad.',
  verLaEvolucion: 'Ver la evolución',
  masDe: (n: number) => `Más de ${numero(n)}`,
  sinPlanDe: (area: string) => `${area}: todavía sin plan.`,

  // ─── Las pantallas vacías (vuelta 2): qué va a aparecer ahí y cuál es el siguiente paso ──────────
  vacios: {
    entrenamientoSinPlan: {
      titulo: 'Todavía no tenés un plan de entrenamiento activo',
      queAparece: 'Cuando tu profesional de entrenamiento active un plan, acá vas a ver la sesión de cada día, con sus ejercicios y sus series, y tu semana.',
      siguientePaso: 'Si ya tenés profesional, avisale que te arme el plan. Si todavía no, vinculate: abrí la invitación que te mandó o compartile tu identificador BE desde Perfil.',
      accion: 'Ver mis vínculos',
    },
    nutricionSinPlan: {
      titulo: 'Todavía no tenés un plan de Nutrición activo',
      queAparece: 'Cuando tu profesional de Nutrición active un plan, acá vas a ver las comidas de cada día con sus opciones, para registrar lo que comiste.',
      siguientePaso: 'Si ya tenés profesional, avisale que te arme el plan. Si todavía no, vinculate: abrí la invitación que te mandó o compartile tu identificador BE desde Perfil.',
      accion: 'Ver mis vínculos',
    },
    sinVinculos: {
      titulo: 'Todavía no tenés vínculos',
      queAparece: 'Acá van a aparecer los profesionales que te acompañan, con el área de cada uno y desde cuándo.',
      siguientePaso: 'Para empezar, abrí la invitación que te mandó tu profesional, o compartile tu identificador BE desde Perfil para que te la mande.',
      accion: 'Ir a Perfil',
    },
    sinComidasRegistradas: {
      titulo: 'Todavía no registraste comidas',
      queAparece: 'Acá van a aparecer las comidas que registres, agrupadas por día, con la opción o la foto de cada una.',
      siguientePaso: 'Para registrar una, andá a Hoy y tocá «Comí esta opción» o «Comí algo diferente».',
      accion: 'Ir a Hoy',
    },
    sinSesionesEnElPeriodo: {
      titulo: 'Sin sesiones registradas en este período',
      queAparece: 'Acá van a aparecer las sesiones que registres, con su fecha y lo que hiciste en cada ejercicio.',
      siguientePaso: 'Las registrás desde Entrenamiento: al terminar la sesión del día, o con «Ya la hice» si la hiciste sin la app.',
      accion: 'Ir a Entrenamiento',
    },
  },
} as const;
