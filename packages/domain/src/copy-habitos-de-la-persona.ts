/**
 * Textos de los hábitos de la persona (DL-165 D-9; WP-FORMULARIOS-RONDA-2, FR-10), para la APK y el website. Frases
 * cortas, para personas: ubican y dicen qué pasa, nunca califican lo que la persona contó. Los verifica el mismo detector
 * de términos prohibidos que los formularios (`terminosProhibidosDeFormulariosEn`).
 *
 * El texto del acto («Compartir mis hábitos con mis profesionales») no está acá: es una versión de texto del catálogo
 * (`textos.ts`, `habitos-compartidos-2026-11-propuesta`), con su hash, y la API lo entrega con API-HBT-01.
 */
import type { Alcance } from './alcance';
import type { OrigenDeHabitos } from './contratos-habitos-de-la-persona';

/** De dónde salió una versión, sin decir de qué formulario ni de qué área (§4.4). */
const ORIGEN: Readonly<Record<OrigenDeHabitos, string>> = { FORM: 'en un formulario', MY_HABITS: 'en «Mis hábitos»' };

/**
 * Ronda 2.1 (D-17 nueva) · para qué le sirven los hábitos al profesional que pide verlos, según su área. Lo dicen la novedad
 * y la app al responder: una razón concreta, sin presión, sin «recomendado» y sin culpa.
 */
const PARA_QUE_LE_SIRVEN: Readonly<Record<Alcance, string>> = {
  NUTRICION: 'Le ayuda a armar un plan de comidas que entre en tu semana.',
  ENTRENAMIENTO: 'Le ayuda a armar un plan de entrenamiento que entre en tu semana.',
  ANTROPOMETRIA: 'Le ayuda a leer tus tomas junto con tu descanso y tu actividad.',
};

export const COPY_HABITOS = {
  origen: ORIGEN,
  paraQueLeSirven: PARA_QUE_LE_SIRVEN,

  /** En la APK, la persona. */
  apk: {
    // La entrada, en Información.
    entradaTitulo: 'Mis hábitos',
    entradaBajada: 'Tu sueño, tu día y tu semana: lo que contaste en tus formularios. Es tuyo y lo podés cambiar.',
    verMisHabitos: 'Ver mis hábitos',

    titulo: 'Mis hábitos',
    bajada: 'Lo que contaste de tu sueño, tu día, tu actividad y tu semana. Queda como declarado por vos.',
    sinHabitos: 'Todavía no contaste tus hábitos. Se guardan acá cuando respondés un formulario que los pregunta, o los podés contar ahora.',
    sinNadaDeclarado: 'Por ahora no contaste nada de tus hábitos.',
    contarlos: 'Contar mis hábitos',
    cambiarlos: 'Cambiar mis hábitos',
    vigentesDesde: (fecha: string, origen: OrigenDeHabitos) => `Así quedaron el ${fecha}, ${ORIGEN[origen]}.`,
    guardar: 'Guardar mis hábitos',
    guardando: 'Guardando…',
    cancelar: 'Cancelar',
    guardados: 'Listo: tus hábitos quedaron guardados.',
    cambiaronMientras: 'Tus hábitos cambiaron mientras los editabas, por ejemplo al responder un formulario. Volvimos a leerlos: revisá y guardá de nuevo.',
    historia: 'Lo que contaste antes',
    verHistoria: 'Ver lo que contaste antes',
    ocultarHistoria: 'Ocultar lo que contaste antes',
    versionDe: (fecha: string, origen: OrigenDeHabitos) => `${fecha}, ${ORIGEN[origen]}`,
    laHistoriaEsTuya: 'Tus versiones anteriores las ves solo vos.',

    // Compartir.
    compartirTitulo: 'Compartir mis hábitos con mis profesionales',
    compartirApagado: 'Hoy cada profesional ve solo lo que le respondiste a él, en su formulario.',
    compartirQueEs: 'Si los compartís, los profesionales que elijas ven tus hábitos vigentes, aunque se los hayas contado a otro. No ven tu salud ni el resto de tus formularios.',
    compartir: 'Compartir mis hábitos',
    compartiendoDesde: (fecha: string) => `Los compartís desde el ${fecha}.`,
    retiradaEl: (fecha: string) => `Dejaste de compartirlos el ${fecha}.`,
    quienesLosVen: 'Quiénes los ven',
    nadieLosVe: 'Por ahora ninguno de tus profesionales los ve.',
    losVe: 'Los ve',
    noLosVe: 'No los ve',
    enPausa: 'En pausa: no los ve mientras dure la pausa.',
    empezoDespues: 'Empezó a acompañarte después: todavía no los ve.',
    desde: (fecha: string) => `Desde el ${fecha}`,
    cambiarConQuienes: 'Cambiar con quiénes',
    guardarCambios: 'Guardar cambios',
    eligiAlMenosUno: 'Elegí al menos un profesional. Si no querés que nadie los vea, dejá de compartirlos.',
    sinProfesionales: 'Todavía no tenés profesionales que te acompañen. Cuando tengas, vas a poder compartirlos.',
    leeAntes: 'Leé esto antes de compartir:',
    aceptoYComparto: 'Acepto y comparto',
    compartidos: 'Listo: compartiste tus hábitos.',
    cambiosGuardados: 'Listo: guardamos con quiénes los compartís.',
    textoPropuesto: 'Texto propuesto, pendiente de validación jurídica.',
    cambioLaAutorizacion: 'Lo que compartís cambió desde que abriste esta pantalla. Volvimos a leerlo: revisá y probá de nuevo.',
    profesionalNoDisponible: 'Uno de los profesionales ya no te acompaña. Volvimos a leer la lista: revisala y probá de nuevo.',

    // Retirar.
    dejarDeCompartir: 'Dejar de compartir',
    dejarDeCompartirPregunta: '¿Dejás de compartir tus hábitos?',
    dejarDeCompartirEfecto: 'Desde ahora ninguno de tus profesionales los ve. No se borra nada: tus hábitos siguen acá, y lo que cada uno tiene de su formulario sigue siendo suyo.',
    siDejarDeCompartir: 'Sí, dejar de compartir',
    retirando: 'Dejando de compartir…',
    volver: 'Volver',
    dejasteDeCompartir: 'Listo: dejaste de compartir tus hábitos.',

    // Un profesional nuevo (en Inicio y en «Mis hábitos»).
    nuevoTitulo: 'Tus hábitos',
    nuevoPregunta: (profesional: string) => `${profesional} empezó a acompañarte. ¿Querés que vea tus hábitos?`,
    nuevoDetalle: 'Hoy no los ve. Si no respondés, sigue sin verlos.',
    nuevoSi: 'Sí, que los vea',
    nuevoNo: 'No, por ahora',
    nuevoResponder: 'Responder',
    nuevoSumado: (profesional: string) => `Listo: ${profesional} ya ve tus hábitos.`,
    nuevoNoSumado: (profesional: string) => `Listo: ${profesional} no los ve.`,

    // «¿Sigue igual?», en la parte «Tus hábitos» de un formulario.
    sigueIgual: (fecha: string) => `Ya lo respondiste el ${fecha}: ¿sigue igual?`,
    sigueIgualDetalle: 'Si algo cambió, cambialo acá. Lo que envíes queda también en «Mis hábitos».',

    // Ronda 2.1 (D-17 nueva) · un profesional pide ver tus hábitos (API-HBT-08 y 09). Las dos respuestas pesan lo mismo.
    pedidosTitulo: 'Te piden ver tus hábitos',
    pedidoDe: (profesional: string, area: string) => `${profesional}, de ${area}, te pide ver tus hábitos.`,
    pedidoEl: (fecha: string) => `Te lo pidió el ${fecha}.`,
    loQueVeria: 'Vería tus hábitos vigentes: tu sueño, tu día, tu actividad y tu semana. No ve tu salud ni el resto de tus formularios.',
    esTuDecision: 'Es tu decisión. La podés cambiar cuando quieras, acá en «Mis hábitos».',
    pedidoSi: 'Sí, que los vea',
    pedidoNo: 'No, por ahora',
    soloEl: (profesional: string) => `Solo ${profesional} los va a ver. A tus otros profesionales los podés sumar cuando quieras.`,
    pedidoAceptado: (profesional: string) => `Listo: ${profesional} ya ve tus hábitos.`,
    pedidoNoPorAhora: (profesional: string) => `Listo: por ahora, ${profesional} no los ve. Lo podés cambiar cuando quieras.`,
    pedidoYaNoEsta: 'Ese pedido ya no está para responder. Volvimos a leer tus hábitos.',
    /** El «Sí» volvió con un conflicto de versión: cambió el pedido o lo que compartís, y no se sabe cuál. */
    cambioMientrasRespondias: 'El pedido o lo que compartís cambió mientras respondías. Volvimos a leer: revisá y probá de nuevo.',
    respondiendo: 'Respondiendo…',
  },

  /** En el website, el profesional. */
  web: {
    titulo: 'Sus hábitos',
    declarado: 'Declarado por la persona',
    compartidoEl: (fecha: string) => `Compartido por la persona el ${fecha}`,
    actualizadoEl: (fecha: string, origen: OrigenDeHabitos) => `Actualizados el ${fecha}, ${ORIGEN[origen]}.`,
    sinHabitos: 'Todavía no contó sus hábitos.',
    noEsMedicion: 'No es una medición ni un diagnóstico.',
    // «Cargar con la persona», solo si este profesional ya los recibe.
    precargados: (fecha: string) => `Sus hábitos, como los compartió el ${fecha}: preguntale si siguen igual.`,

    // Ronda 2.1 (D-17 nueva) · «Pedir acceso a sus hábitos» (API-HBT-06 y 07), cuando la persona no se los comparte.
    noLosComparte: 'Por ahora no te comparte sus hábitos. Es su decisión.',
    queLeLlega: 'Si le pedís acceso, le llega como una novedad importante en su app, con tu nombre y para qué te sirven. Puede decir que sí o que no, y cambiarlo cuando quiera.',
    pedirAcceso: 'Pedir acceso a sus hábitos',
    volverAPedirAcceso: 'Volver a pedir acceso',
    pidiendo: 'Pidiendo…',
    pedidoEnviado: 'Listo: le pediste acceso. Lo decide la persona.',
    pedidoPendiente: (fecha: string) => `Le pediste acceso el ${fecha}. Lo decide la persona.`,
    pedidoRespondido: (fecha: string) => `Le pediste acceso el ${fecha}.`,
    volverAPedirDesde: (fecha: string) => `Podés volver a pedirlo desde el ${fecha}.`,
    yaLosComparte: 'La persona ya te comparte sus hábitos. Volvimos a leerlos.',

    // Ronda 2.1 (D-15 nueva; D-22) · al pedir un formulario de área, «Sumar «Tus hábitos»».
    sumarHabitos: 'Sumar «Tus hábitos»',
    sumarHabitosQueEs: 'Es un formulario aparte, con su sueño, su día, su actividad y su semana. Se envía junto con este, como otra solicitud.',
    sugerencia: {
      SIN_HABITOS: () => 'Todavía no tenés sus hábitos.',
      VIEJOS: (fecha: string) => `Los hábitos que ves son del ${fecha}: tienen más de 3 meses.`,
      RECIENTES: (fecha: string) => `Ya tenés sus hábitos del ${fecha}.`,
      PENDIENTE: (fecha: string) => `Ya le pediste sus hábitos el ${fecha}: esperan su respuesta.`,
    },
    /** El «para qué» de «Tus hábitos»: lo lee la persona en su app, junto al formulario. */
    propositoDelFormulario: 'Que tu plan entre en tu semana',
    enviadasLasDos: (formulario: string) => `Listo: enviaste «${formulario}» y «Tus hábitos».`,
    noSeEnvioHabitos: (formulario: string, motivo: string) => `«${formulario}» quedó enviado, pero «Tus hábitos» no: ${motivo} Lo podés pedir solo, eligiéndolo en la lista.`,
    noSeEnvioNinguna: (formulario: string) => `No se envió «${formulario}» ni «Tus hábitos».`,
    /** El segundo pedido salió sin respuesta: puede haber llegado o no. Antes de pedirlo de nuevo, que lo mire en la lista. */
    habitosSinConfirmar: (formulario: string) => `«${formulario}» quedó enviado. No pudimos confirmar si «Tus hábitos» también: fijate en «Solicitudes» antes de pedirlo de nuevo.`,
    /** Con más de un área con la persona y sin saber desde cuál llegó: desde cuál sale el pedido de acceso. */
    pedidoDesdeElArea: (area: string) => `Se lo pedís desde ${area}.`,
  },
} as const;
