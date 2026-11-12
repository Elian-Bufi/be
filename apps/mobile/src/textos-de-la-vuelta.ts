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
  agregaTuNombre: 'Agregá tu nombre',
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
  masDe: (n: number) => `Más de ${numero(n)}`,
  sinPlanDe: (area: string) => `${area}: todavía sin plan.`,

} as const;
