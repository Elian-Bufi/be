/**
 * Textos de los hábitos de la persona (DL-165 D-9; WP-FORMULARIOS-RONDA-2, FR-10), para la APK y el website. Frases
 * cortas, para personas: ubican y dicen qué pasa, nunca califican lo que la persona contó. Los verifica el mismo detector
 * de términos prohibidos que los formularios (`terminosProhibidosDeFormulariosEn`).
 *
 * El texto del acto («Compartir mis hábitos con mis profesionales») no está acá: es una versión de texto del catálogo
 * (`textos.ts`, `habitos-compartidos-2026-11-propuesta`), con su hash, y la API lo entrega con API-HBT-01.
 */
import type { OrigenDeHabitos } from './contratos-habitos-de-la-persona';

/** De dónde salió una versión, sin decir de qué formulario ni de qué área (§4.4). */
const ORIGEN: Readonly<Record<OrigenDeHabitos, string>> = { FORM: 'en un formulario', MY_HABITS: 'en «Mis hábitos»' };

export const COPY_HABITOS = {
  origen: ORIGEN,

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
  },
} as const;
