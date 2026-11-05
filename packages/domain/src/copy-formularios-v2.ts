/**
 * Textos de los formularios V2 (DL-164) que comparten el website y la APK. Ubicar, nunca calificar: los textos dicen
 * qué pasó y qué sigue, nunca juzgan lo que la persona respondió.
 */
import type { TipoDeCampoV2 } from './contratos-formularios-v2';
import { CODIGO_DE_NUMERO_FUERA_DE_LIMITES, CODIGO_DE_TEXTO_DEMASIADO_LARGO } from './contratos-formularios';
import { CODIGO_DE_PROBLEMA_V2, type CodigoDeProblemaV2 } from './formularios-v2';

export const NOMBRE_DE_TIPO_V2: Readonly<Record<TipoDeCampoV2, string>> = {
  TEXT: 'Texto',
  NUMBER: 'Número',
  BOOLEAN: 'Sí o no',
  CHOICE: 'Una opción',
  MULTI_CHOICE: 'Varias opciones',
  LIST: 'Lista',
  MATRIX: 'Tabla',
  FOODS: 'Alimentos',
  TIMES: 'Horarios',
};

/** Lo que se le dice a quien responde cuando un valor no se acepta: qué corregir, sin repetir lo que escribió. */
export const MENSAJE_DE_PROBLEMA_V2: Readonly<Record<CodigoDeProblemaV2, string>> = {
  [CODIGO_DE_PROBLEMA_V2.NOT_REQUESTED]: 'Esta pregunta no está en lo que te pidieron.',
  [CODIGO_DE_PROBLEMA_V2.UNKNOWN_FIELD]: 'Esta pregunta ya no está en el formulario.',
  [CODIGO_DE_PROBLEMA_V2.DUPLICATED]: 'Hay una respuesta repetida.',
  [CODIGO_DE_PROBLEMA_V2.TYPE_MISMATCH]: 'Esta respuesta no tiene la forma que pide la pregunta.',
  [CODIGO_DE_PROBLEMA_V2.NOT_VISIBLE]: 'Esta pregunta no aplica con lo que respondiste antes.',
  [CODIGO_DE_PROBLEMA_V2.REQUIRED]: 'Falta responder esta pregunta.',
  [CODIGO_DE_PROBLEMA_V2.EMPTY]: 'Escribí algo o dejala sin responder.',
  [CODIGO_DE_PROBLEMA_V2.UNKNOWN_OPTION]: 'Una de las opciones ya no está disponible.',
  [CODIGO_DE_PROBLEMA_V2.TOO_MANY]: 'Elegiste más de lo que admite esta pregunta.',
  [CODIGO_DE_PROBLEMA_V2.TOO_FEW]: 'Sumá al menos los que pide esta pregunta.',
  [CODIGO_DE_PROBLEMA_V2.EXCLUSIVE_OPTION]: 'Esa opción va sola: sacá las demás o elegí otra.',
  [CODIGO_DE_PROBLEMA_V2.OTHER_TEXT_NOT_ALLOWED]: 'El texto de «Otro» va solo si elegís «Otro».',
  [CODIGO_DE_PROBLEMA_V2.REPEATED_ITEM]: 'Este alimento ya está en la lista.',
  [CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_REQUIRED]: 'Falta completar un dato de este renglón.',
  [CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_UNKNOWN]: 'Este renglón tiene un dato que la pregunta no pide.',
  [CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_INVALID]: 'Revisá un dato de este renglón.',
  [CODIGO_DE_NUMERO_FUERA_DE_LIMITES.NOT_INTEGER]: 'Va un número entero.',
  [CODIGO_DE_NUMERO_FUERA_DE_LIMITES.BELOW_MINIMUM]: 'El número es más chico de lo que admite la pregunta.',
  [CODIGO_DE_NUMERO_FUERA_DE_LIMITES.ABOVE_MAXIMUM]: 'El número es más grande de lo que admite la pregunta.',
  [CODIGO_DE_TEXTO_DEMASIADO_LARGO]: 'El texto es más largo de lo que admite la pregunta.',
};

/**
 * DL-165 D-3: ningún texto dice cuántos minutos lleva un formulario (un tiempo estimado se lee como una promesa); lo que
 * falta lo dice «Parte 1 de 6». `estimatedMinutes` sigue en el contrato porque la APK 0.20 lo lee (DL-152).
 */
export const COPY_FORMULARIOS_V2 = {
  obligatoria: 'Obligatoria',
  opcional: 'Opcional',
  otro: 'Otro',
  cualOtro: '¿Cuál?',
  sumarRenglon: (item: string) => `Sumar ${item}`,
  quitarRenglon: (item: string) => `Quitar ${item}`,
  sumarAlimento: 'Sumar otro alimento',
  motivo: 'Por qué',
  sinResponder: 'Sin responder',
  paraQue: 'Para qué se usa',
  // DL-165 D-2 · las ayudas, plegadas: el «para qué» se abre con un botón, y una pregunta opcional se suelta con otro.
  paraQueBoton: '¿Para qué?',
  /** El nombre del botón para el lector de pantalla: dice de qué pregunta es. */
  paraQueDe: (pregunta: string) => `¿Para qué? ${pregunta}`,
  quitarRespuesta: 'Quitar respuesta',
  quitarRespuestaDe: (pregunta: string) => `Quitar respuesta: ${pregunta}`,

  // DL-165 D-1 · una parte por pantalla, en la app y en «Cargar con la persona» (`partes-de-formulario.ts`).
  parte: (n: number, total: number) => `Parte ${n} de ${total}`,
  /** Lo que anuncia el lector de pantalla al cambiar de parte. */
  parteConTitulo: (n: number, total: number, titulo: string) => `Parte ${n} de ${total}: ${titulo}`,
  anterior: 'Anterior',
  siguiente: 'Siguiente',
  repasar: 'Repasar',
  repaso: 'Repasá antes de enviar',
  repasoBajada: 'Así queda lo que respondiste. Podés cambiar cualquier parte antes de enviar.',
  cambiarParte: 'Cambiar',
  cambiarParteDe: (titulo: string) => `Cambiar «${titulo}»`,
  volverALaParte: (titulo: string) => `Volver a «${titulo}»`,
  quedaronSinResponder: (n: number, titulo: string) =>
    n === 1 ? `En «${titulo}» quedó 1 pregunta obligatoria sin responder. Podés volver cuando quieras.` : `En «${titulo}» quedaron ${n} preguntas obligatorias sin responder. Podés volver cuando quieras.`,
  faltanPorResponder: (n: number) => (n === 1 ? 'Falta 1 pregunta obligatoria por responder.' : `Faltan ${n} preguntas obligatorias por responder.`),
  parteSinPreguntas: 'Con lo que respondiste antes, esta parte no tiene preguntas. Seguí con la próxima.',
  obligatoriaSinResponder: 'Sin responder · obligatoria',

  /** En la APK. */
  apk: {
    paraConfirmar: 'Para confirmar',
    paraResponder: 'Para responder',
    respondido: 'Respondido',
    actualizar: 'Actualizá la app para responder este formulario.',
    revisarTitulo: (profesional: string) => `Revisá lo que cargó ${profesional}`,
    revisarBajada: (profesional: string, formulario: string, fecha: string) =>
      `${profesional} cargó tus respuestas de «${formulario}» el ${fecha}, con lo que le contaste. Revisalas: si algo no es así, corregilo antes de confirmar.`,
    efectoDeConfirmar: 'Al confirmar, quedan en tu perfil como respuestas tuyas, con la aclaración de quién las cargó.',
    confirmar: 'Confirmo que son mis datos',
    corregir: 'Corregir',
    rechazar: 'No es correcto',
    rechazarPregunta: '¿Descartamos lo que se cargó? Se borra y el formulario queda para que lo respondas vos.',
    rechazarSi: 'Sí, descartar',
    rechazarNo: 'Volver',
    rechazado: 'Listo: se borró lo que se había cargado. El formulario sigue pendiente.',
    confirmado: 'Listo: tus respuestas quedaron guardadas.',
    corregidas: (n: number) => (n === 1 ? 'Corregiste 1 respuesta.' : `Corregiste ${n} respuestas.`),
  },

  /** En el website. */
  web: {
    cargar: 'Cargar con la persona',
    cargarBajada: 'Completalo con lo que la persona te cuenta. Lo va a ver en su app y lo tiene que confirmar: hasta entonces no queda en su perfil y no lo ve nadie más.',
    enviar: 'Enviar para que lo confirme',
    reemplazar: 'Guardar los cambios',
    esperando: 'Esperando que lo confirme',
    cargadoPorVos: (fecha: string) => `Cargado por vos el ${fecha} · falta que lo confirme`,
    retirar: 'Retirar lo cargado',
    retirarPregunta: '¿Retirás lo cargado? Se borra y la persona ya no lo ve. El formulario sigue pendiente.',
    noConfirmado: (fecha: string) => `La persona no confirmó lo cargado (${fecha}). El formulario sigue pendiente.`,
    retirado: (fecha: string) => `Retiraste lo cargado el ${fecha}.`,
    transcripcion: (profesional: string, cargado: string, confirmado: string) =>
      `Cargado por ${profesional} el ${cargado} · confirmado por la persona el ${confirmado}`,
    corregidas: (n: number) => (n === 0 ? 'Lo confirmó tal cual.' : n === 1 ? 'Corrigió 1 respuesta antes de confirmar.' : `Corrigió ${n} respuestas antes de confirmar.`),
    appNueva: 'Este formulario se responde con la app nueva. Si la persona tiene una versión anterior, no lo va a ver hasta actualizarla; mientras tanto, podés cargarlo con ella desde acá.',
  },
} as const;
