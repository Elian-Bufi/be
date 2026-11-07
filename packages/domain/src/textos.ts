/**
 * Versiones de textos que el titular ve y acepta o recibe.
 * 08 §12.2: la evidencia guarda la versión mostrada = aceptada, con id + hash del texto.
 * 09 §31.2.5: «La versión mostrada debe ser la versión aceptada».
 *
 * TEXTOS DE DEMOSTRACIÓN — no son textos legales (08 R-08-05, gate §42-1; DEUDA_LEGAJO DL-028).
 * El hash (SHA-256 del texto UTF-8) está precalculado para que web y APK no necesiten crypto de Node;
 * `textos.test.ts` verifica que coincide con el contenido. La migración siembra el mismo catálogo.
 */

export const TipoDeTexto = {
  TERMINOS: 'TERMINOS',
  PRIVACIDAD_INFO: 'PRIVACIDAD_INFO',
  DATOS_SALUD_BE: 'DATOS_SALUD_BE',
  CONSECUENCIAS_DE_CIERRE: 'CONSECUENCIAS_DE_CIERRE',
  /** B2 para un profesional sanitario (08 §12.3). WP-03. */
  CONSENTIMIENTO_PROFESIONAL_SANITARIO: 'CONSENTIMIENTO_PROFESIONAL_SANITARIO',
  /** B2 para un profesional no sanitario (08 §12.3). WP-03. */
  CONSENTIMIENTO_PROFESIONAL_NO_SANITARIO: 'CONSENTIMIENTO_PROFESIONAL_NO_SANITARIO',
  /**
   * La información destacada de las fotos de comidas, dentro del alcance de Nutrición (08 §12.4 `EVIDENCIA_VISUAL`,
   * §21.3). Precierre del 2026-10-06, §6: es una **propuesta** (`VERSIONES_PROPUESTAS`).
   */
  EVIDENCIA_VISUAL: 'EVIDENCIA_VISUAL',
  /**
   * La declaración de mayoría de edad del alta (08 §24.7 a; gate §42, ítem 22; DEUDA_LEGAJO DL-023 y DL-138). La persona
   * declara que es adulta: BE no pide la fecha de nacimiento (minimización).
   */
  MAYORIA_DE_EDAD: 'MAYORIA_DE_EDAD',
  /**
   * DL-165 D-9 (FR-10): «Compartir mis hábitos con mis profesionales», el acto de la persona que deja que los profesionales
   * que ella elige vean sus hábitos (API-HBT-03). Es una **propuesta** (`VERSIONES_PROPUESTAS`), pendiente de validación
   * jurídica, como `EVIDENCIA_VISUAL` (DL-125).
   */
  HABITOS_COMPARTIDOS: 'HABITOS_COMPARTIDOS',
  /**
   * DL-163 D-13, ampliada por Dirección el 2026-11-07 (WP-TABLERO-ALTA-GAMA TB-55): «Compartir con mis profesionales lo de
   * otras áreas», el acto de la persona que deja que un profesional vea lo de otra área suya, en el nivel que ella elige
   * (API-RES-02). Desde el 2026-11-07, el texto de «resumen» (la primera versión, única para los dos niveles, quedó como
   * historia; TA-99 reemplazada). Es una **propuesta** (`VERSIONES_PROPUESTAS`), pendiente de
   * validación jurídica, como `HABITOS_COMPARTIDOS`.
   */
  RESUMENES_COMPARTIDOS: 'RESUMENES_COMPARTIDOS',
  /**
   * DL-163 D-13, ampliada; Dirección, 2026-11-07 (un texto distinto por nivel): «Compartir el plan de otras áreas con mis
   * profesionales», el texto del nivel «resumen y plan». Desde ese día, `RESUMENES_COMPARTIDOS` es el de «resumen». Una
   * **propuesta**, pendiente de validación jurídica.
   */
  RESUMENES_Y_PLAN_COMPARTIDOS: 'RESUMENES_Y_PLAN_COMPARTIDOS',
} as const;
export type TipoDeTexto = (typeof TipoDeTexto)[keyof typeof TipoDeTexto];

export interface VersionDeTexto {
  readonly id: string;
  readonly tipo: TipoDeTexto;
  readonly titulo: string;
  /** 08 §12.2 «finalidad». */
  readonly finalidad: string;
  readonly vigenteDesde: string;
  readonly texto: string;
  /** SHA-256 hex del texto (UTF-8). */
  readonly hash: string;
  /**
   * Versión a la que esta reemplaza (sucesión explícita, REG-06-12). `null` en la primera de cada tipo. B2 resuelve la
   * versión aplicable como la cabeza de esta cadena en la base (DEUDA_LEGAJO DL-038).
   */
  readonly reemplazaA: string | null;
}

const AVISO = 'Texto de demostración para el trabajo final BE. No es un texto legal ni se aplica a datos reales.';

const TERMINOS = `Términos de uso de BE — versión de demostración 2026-09

${AVISO}

1. BE es una plataforma que ayuda a asesorados y profesionales a organizar su trabajo de salud y entrenamiento.
2. Para usar BE necesitás una cuenta propia. Tu cuenta es personal e intransferible.
3. Crear una cuenta no te da acceso a datos de otras personas ni autoriza a ningún profesional a ver tus datos.
4. Podés cerrar tu cuenta cuando quieras desde Cuenta → Cerrar mi cuenta. El cierre impide nuevas sesiones y no se puede deshacer.
5. BE puede suspender una cuenta cuando exista un fundamento válido según su política. La suspensión no borra tu historia.
6. Estos términos pueden cambiar. Una versión nueva no se considera aceptada hasta que la aceptes.`;

const PRIVACIDAD = `Información de privacidad de BE — versión de demostración 2026-09

${AVISO}

Responsable: BE (proyecto académico). Contacto de privacidad: el canal que se publique antes de operar con datos reales.

Finalidades: crear y mantener tu cuenta; permitirte iniciar sesión; registrar la evidencia de los actos que realizás (esta información, los términos y los consentimientos que otorgues).

Datos que tratamos al crear tu cuenta: tu correo electrónico como identificador de acceso (obligatorio para crear la cuenta) y la contraseña, que se guarda solo como hash y nunca en claro. Sin estos datos no se puede crear la cuenta.

Destinatarios y encargados: el proveedor de infraestructura donde funciona BE. Ningún profesional accede a tus datos por el solo hecho de que crees una cuenta.

Datos de salud: crear la cuenta no autoriza el tratamiento de datos de salud. Ese tratamiento requiere un consentimiento separado, que podés otorgar o no más adelante.

Acceso excepcional de soporte: BE prevé un acceso excepcional, auditado y limitado, para resolver incidentes. Se registra y se informa.

Transferencias internacionales: la infraestructura puede estar fuera de Argentina. Antes de operar con datos reales se informará el destino y el mecanismo.

Tus derechos: acceder, rectificar y suprimir tus datos, y cerrar tu cuenta. El canal para ejercerlos se publicará antes de operar con datos reales.

Esta información es una constancia de que te informamos. No es un consentimiento para tratar datos de salud.`;

const DATOS_SALUD = `Consentimiento para el tratamiento de datos de salud por BE — versión de demostración 2026-09

${AVISO}

Si lo otorgás, BE podrá tratar los datos de salud que registres para operar el servicio y para mantener tu historia longitudinal.

Este consentimiento no autoriza a ningún profesional. Cada profesional necesita un consentimiento específico por alcance y finalidad.

Podés revocarlo cuando quieras. La revocación corta el tratamiento hacia adelante y no borra en silencio la historia ya registrada.`;

const CONSECUENCIAS_DE_CIERRE = `Cerrar mi cuenta

El cierre impide nuevas sesiones y nuevas operaciones cuando se hace efectivo. Los vínculos activos se finalizan mediante eventos y la historia no se borra silenciosamente. La conservación o supresión posterior se aplica según la política de privacidad.

El cierre no se puede deshacer.`;

/** 08 §12.3: texto diferenciado por perfil. Alcance y finalidad no van en el texto: son evidencia propia (08:374). */
const B2_SANITARIO = `Autorización de acceso a un profesional de la salud — versión de demostración 2026-09

${AVISO}

Autorizás a este profesional a acceder, dentro de BE, a la información pertinente y necesaria para la finalidad y el alcance que se indican en esta pantalla. No autorizás el acceso a toda tu información.

El profesional es un profesional de la salud: trata tu información en el marco de la relación profesional sanitaria, con deber de secreto profesional.

Este consentimiento vale solo para este profesional, este alcance y esta finalidad. No autoriza a otros profesionales ni otros alcances.

Podés revocarlo cuando quieras. La revocación corta el acceso hacia adelante, no finaliza el vínculo y no borra en silencio tu historia.

Aceptar esta versión no acepta versiones futuras.`;

const B2_NO_SANITARIO = `Autorización de acceso a un profesional que no es de la salud — versión de demostración 2026-09

${AVISO}

Autorizás a este profesional a acceder, dentro de BE, solo a la información pertinente y necesaria para la finalidad y el alcance que se indican en esta pantalla, con el mínimo detalle suficiente. No autorizás el acceso a tu expediente completo.

Este profesional no es un profesional de la salud. BE le impone un deber de confidencialidad sobre la información a la que accede.

Este consentimiento vale solo para este profesional, este alcance y esta finalidad. No autoriza a otros profesionales ni otros alcances.

Podés revocarlo cuando quieras. La revocación corta el acceso hacia adelante, no finaliza el vínculo y no borra en silencio tu historia.

Aceptar esta versión no acepta versiones futuras.`;

/**
 * 08 §12.4 `EVIDENCIA_VISUAL` y §21.3: la información destacada de una categoría, las fotos de comidas, que se registra
 * al habilitarla dentro del alcance de Nutrición. No es un consentimiento por foto. Cada afirmación es lo que hace la
 * implementación: quién ve la foto (API-MED-03), el acceso de 15 minutos y su registro, los metadatos que se quitan
 * (API-MED-02), el borrado de cada foto (API-MED-05) y la revocación (API-EVI-04).
 *
 * **Es una propuesta** (precierre del 2026-10-06, §6): la aprueba Dirección, con la validación jurídica, antes de usarse
 * con personas reales. La versión aprobada entra como sucesora de esta, con otro id, y no hereda sus aceptaciones.
 */
const PROPUESTA = 'Texto propuesto, pendiente de aprobación de Dirección y de validación jurídica.';

const EVIDENCIA_VISUAL = `Fotos de tus comidas — versión propuesta 2026-10

${AVISO}

${PROPUESTA}

Esta información es sobre una sola categoría de datos: las fotos de comidas que subís a BE. Se muestra antes de tu primera foto para el profesional que te acompaña en Nutrición, y queda registrada aparte.

Qué es: la foto de una comida que registrás, por ejemplo una comida diferente a la del plan. Es un dato personal de salud, y BE la protege por lo menos como al resto de tus datos de salud.

Es opcional: podés registrar tus comidas sin fotos. No subir fotos no cambia nada del servicio.

Quién la ve: vos y el profesional que te acompaña en Nutrición, mientras el vínculo, su autorización de acceso y tu consentimiento de datos de salud estén vigentes. No la ven otros asesorados ni otros profesionales. La administración de BE no tiene acceso, salvo el acceso excepcional de soporte, que queda registrado.

Cómo se guarda: la foto es privada y no tiene una dirección pública. Cada vez que alguien la abre, BE da un acceso que vence en 15 minutos como máximo y registra quién la abrió y cuándo. Al recibirla, BE quita de la imagen los datos que no hacen falta, como la ubicación y el modelo del teléfono.

Qué no hace BE con la foto: no calcula cantidades, calorías ni nutrientes, y no la envía a ningún servicio de inteligencia artificial.

Podés borrar cada foto cuando quieras, desde el registro de esa comida: se borra la imagen y queda la constancia de que existió.

Podés revocar esta autorización cuando quieras, desde Cuenta → Privacidad. Desde ese momento no se suben fotos nuevas para este profesional, y el profesional deja de verlas. Las fotos que ya subiste no se borran: las seguís viendo vos, y las podés borrar una por una.

Aceptar esta versión no acepta versiones futuras.`;

/**
 * 08 §24.7 a: «el alta requiere declaración de fecha de nacimiento/mayoría de edad». BE pide la declaración, no la fecha
 * (DL-138): para decidir si alguien puede usar BE alcanza con saber que es adulto, y la fecha sería un dato C3 más. Es la
 * declaración de la persona, con las palabras aprobadas por Dirección el 2026-10-16; no es un texto legal de BE, y por eso
 * no lleva el aviso de demostración.
 */
const MAYORIA_DE_EDAD = 'Declaro que tengo 18 años o más. BE es solo para personas adultas.';

/**
 * DL-165 D-9 (WP-FORMULARIOS-RONDA-2 §4.3 a §4.6): «Compartir mis hábitos con mis profesionales». Cada afirmación es lo que
 * hace la implementación: la categoría son las preguntas de `SECCION_DE_HABITOS` y nada de la salud; la lista es explícita
 * y la elige la persona (API-HBT-03); un profesional nuevo no la recibe solo (la app pregunta); lo ve solo con su vínculo
 * aceptado y su acceso autorizado (el PDP de API-HBT-05), sin la historia ni de qué formulario salió; cada lectura queda
 * registrada; retirarla corta para todos y no borra nada (API-HBT-04); cerrar la cuenta la retira.
 *
 * **Es una propuesta**, pendiente de validación jurídica: con personas reales, solo después de esa revisión (VJR-1, VJR-4 y
 * VJR-5 del 08) y del gate del 08 §42. La versión aprobada entra como sucesora de esta, con otro id, y no hereda sus
 * aceptaciones (09 §31.2.6).
 */
const HABITOS_COMPARTIDOS = `Compartir mis hábitos con mis profesionales — versión propuesta 2026-11

${AVISO}

Texto propuesto, pendiente de validación jurídica.

Esta autorización es sobre una sola categoría de datos: tus hábitos. Son las respuestas de la parte «Tus hábitos»: a qué hora te levantás y te acostás, cuántas horas dormís, cómo es tu día en movimiento, el ejercicio o el deporte de tu semana y cómo viene tu semana en estrés. No incluye tu salud (medicación, condiciones o embarazo) ni el resto de tus formularios.

Qué cambia: sin esta autorización, cada profesional ve solo lo que le respondiste a él, en su formulario. Con ella, los profesionales que elijas ven tus hábitos vigentes, aunque se los hayas contado a otro profesional o en «Mis hábitos». Ven la versión vigente, con su fecha y como declarada por vos. No ven de qué formulario salió ni tus versiones anteriores.

Quiénes los ven: solo los profesionales que elijas en la lista, mientras su vínculo con vos esté vigente y su acceso esté autorizado. Si un vínculo se pausa o termina, ese profesional deja de verlos. Un profesional que empiece a acompañarte después no los ve: BE te pregunta antes, y si no respondés, no los ve.

Cada vez que un profesional los abre, queda registrado.

Podés cambiar la lista o retirar esta autorización cuando quieras, desde «Mis hábitos». Al retirarla, ninguno de tus profesionales los ve desde ese momento. No se borra nada: tus hábitos siguen en tu app, y lo que cada profesional tiene de su propio formulario sigue siendo suyo. Retirarla no deshace lo que un profesional ya vio. Cerrar tu cuenta también la retira.

Aceptar esta versión no acepta versiones futuras.`;

/**
 * DL-163 D-13, ampliada (WP-TABLERO-ALTA-GAMA TB-52 a TB-56; §3.1 y §3.4): «Compartir con mis profesionales lo de otras
 * áreas». Cada afirmación es lo que hace la implementación: se da por profesional, por área y por nivel (API-RES-02); el
 * plan es la versión activada vigente, como la ve la persona, con su objetivo y lo avanzado (API-RES-06), sin borradores,
 * versiones anteriores, revisiones, notas internas ni evaluaciones; lo compartido es lo del profesional que lleva el área
 * hoy (TA-96); lo ve solo con su vínculo aceptado y su acceso autorizado (el PDP); quien lo ve no lo cambia y puede dejar
 * una nota que la persona lee (TB-53, CRD-D2); pedirlo no da acceso (TB-56); cada lectura queda registrada y la persona la
 * ve (API-RES-01), y quien lleva el área sabe con quién se comparte (API-RES-07); ampliar pide aceptar otra vez, y bajar o
 * retirar corta en el momento (API-RES-02 y 03); cerrar la cuenta la retira.
 *
 * **Es una propuesta**, pendiente de validación jurídica: con personas reales, solo después de esa revisión (VJR-1, VJR-4 y
 * VJR-5 del 08, y las dos preguntas de WP-TABLERO-ALTA-GAMA §9) y del gate del 08 §42. La versión aprobada entra como
 * sucesora de esta, con otro id, y no hereda sus aceptaciones (09 §31.2.6).
 */
const RESUMENES_COMPARTIDOS = `Compartir con mis profesionales lo de otras áreas — versión propuesta 2026-11

${AVISO}

Texto propuesto, pendiente de validación jurídica.

Esta autorización es para que un profesional que te acompaña en un área vea lo de otra área tuya, la que lleva otro profesional. La das por profesional y por área, en uno de dos niveles:
- Resumen: lo de esa área que BE arma para el área de quien lo recibe, con una tabla fija. Nunca incluye las molestias de «Antes de entrenar», lo de salud de tus formularios, las notas internas de tus profesionales ni sus evaluaciones.
- Resumen y plan: además, tu plan vigente de esa área, completo y de solo lectura, como lo ves vos en tu app, con su objetivo, quién lo armó, desde cuándo rige, la fecha de la próxima revisión y cuánto registraste cada semana desde que rige. No incluye los borradores, las versiones anteriores, lo que se habló en una revisión, las notas internas ni las evaluaciones. Antropometría no tiene plan: de esa área, solo el resumen.

Quiénes lo ven: solo los profesionales que elijas, en el nivel que elijas, mientras su vínculo con vos esté vigente y su acceso esté autorizado. Si un vínculo se pausa o termina, ese profesional deja de verlo. Lo que compartís es lo del profesional que lleva esa área hoy: si empezás con otro profesional en esa área, no se le comparte a nadie hasta que vuelvas a elegir. Un profesional que empiece a acompañarte después no ve nada de otras áreas hasta que lo elijas.

Quien ve tu plan no lo puede cambiar. Le puede dejar una nota a quien lleva esa área, y esa nota también la ves vos.

Un profesional te puede pedir ver tu plan de otra área. Pedirlo no le da acceso: lo decidís vos, y podés decir que no.

Cada vez que un profesional abre tu plan de otra área, queda registrado, y lo ves vos. Quien lleva esa área sabe con quién lo compartís.

Para sumar a alguien o pasar de «Resumen» a «Resumen y plan», aceptás este texto otra vez. Podés bajar de nivel, sacar a alguien o retirar esta autorización cuando quieras, y corta desde ese momento. No se borra nada, y retirarla no deshace lo que un profesional ya vio. Cerrar tu cuenta también la retira.

Aceptar esta versión no acepta versiones futuras.`;

/**
 * DL-163 D-13, ampliada; Dirección, 2026-11-07: **un texto distinto por nivel** (reemplaza TA-99 y ratifica TA-85). Este es
 * el de «resumen», sucesor del texto único de arriba: dice solo lo que se ve en ese nivel. Cada afirmación es lo que hace
 * la implementación (API-RES-02 a 07) o lo que declara la matriz del paquete (§3.1) para el resumen, que se lee con
 * API-RES-05 cuando exista (TB-29). **Es una propuesta**, pendiente de validación jurídica, como el de los hábitos.
 */
const RESUMEN_COMPARTIDO = `Compartir el resumen de otras áreas con mis profesionales — versión propuesta 2026-11

${AVISO}

Texto propuesto, pendiente de validación jurídica.

Esta autorización es para que un profesional que te acompaña en un área vea el resumen de otra área tuya, la que lleva otro profesional. La das por profesional y por área.

Qué ve: el resumen de esa área que BE arma para el área de quien lo recibe, con una tabla fija. Por ejemplo, de Entrenamiento, los días por semana del plan y las sesiones que registraste; de Antropometría, el peso y la composición en kilos, con su método; de Nutrición, solo desde cuándo rige tu plan y las fechas de tus revisiones, sin números. Nunca incluye las molestias de «Antes de entrenar», lo de salud de tus formularios, las notas internas de tus profesionales ni sus evaluaciones.

Qué no ve: tu plan completo. Para eso hay otra autorización, «Compartir el plan de otras áreas con mis profesionales», que se acepta aparte.

Quiénes lo ven: solo los profesionales que elijas, mientras su vínculo con vos esté vigente y su acceso esté autorizado. Si un vínculo se pausa o termina, ese profesional deja de verlo. Lo que compartís es lo del profesional que lleva esa área hoy: si empezás con otro profesional en esa área, no se le comparte a nadie hasta que vuelvas a elegir. Un profesional que empiece a acompañarte después no ve nada de otras áreas hasta que lo elijas.

Cada vez que un profesional lo abre, queda registrado, y lo ves vos. Quien lleva esa área sabe con quién lo compartís.

Podés sacar a alguien o retirar esta autorización cuando quieras, y corta desde ese momento. No se borra nada, y retirarla no deshace lo que un profesional ya vio. Cerrar tu cuenta también la retira.

Aceptar esta versión no acepta versiones futuras.`;

/**
 * La propuesta 3 del texto de «resumen» (2026-11-07): la 2 decía que la otra autorización «se acepta aparte», y eso
 * prometía algo que la implementación no hace igual (la de «resumen y plan» incluye este resumen y alcanza para un permiso
 * de «resumen», TA-111). Cambia solo ese párrafo. La 2 queda como historia, sin heredar aceptaciones (09 §31.2.6).
 */
const RESUMEN_COMPARTIDO_3 = `Compartir el resumen de otras áreas con mis profesionales — versión propuesta 2026-11

${AVISO}

Texto propuesto, pendiente de validación jurídica.

Esta autorización es para que un profesional que te acompaña en un área vea el resumen de otra área tuya, la que lleva otro profesional. La das por profesional y por área.

Qué ve: el resumen de esa área que BE arma para el área de quien lo recibe, con una tabla fija. Por ejemplo, de Entrenamiento, los días por semana del plan y las sesiones que registraste; de Antropometría, el peso y la composición en kilos, con su método; de Nutrición, solo desde cuándo rige tu plan y las fechas de tus revisiones, sin números. Nunca incluye las molestias de «Antes de entrenar», lo de salud de tus formularios, las notas internas de tus profesionales ni sus evaluaciones.

Qué no ve: tu plan completo. Para eso hay otra autorización, «Compartir el plan de otras áreas con mis profesionales», que incluye también este resumen.

Quiénes lo ven: solo los profesionales que elijas, mientras su vínculo con vos esté vigente y su acceso esté autorizado. Si un vínculo se pausa o termina, ese profesional deja de verlo. Lo que compartís es lo del profesional que lleva esa área hoy: si empezás con otro profesional en esa área, no se le comparte a nadie hasta que vuelvas a elegir. Un profesional que empiece a acompañarte después no ve nada de otras áreas hasta que lo elijas.

Cada vez que un profesional lo abre, queda registrado, y lo ves vos. Quien lleva esa área sabe con quién lo compartís.

Podés sacar a alguien o retirar esta autorización cuando quieras, y corta desde ese momento. No se borra nada, y retirarla no deshace lo que un profesional ya vio. Cerrar tu cuenta también la retira.

Aceptar esta versión no acepta versiones futuras.`;

/**
 * El texto de «resumen y plan» (Dirección, 2026-11-07): el plan vigente completo, de solo lectura, con su objetivo y su
 * fundamento (que la persona ya ve; ratificado ese día) y lo registrado. Incluye el resumen de esa área: por eso bajar a
 * «resumen» no pide otro texto. Cada afirmación es lo que hace API-RES-06, 07, 08 a 10 y la regla de TB-53. **Es una
 * propuesta**, pendiente de validación jurídica (VJR-5 suma la pregunta del fundamento, §9 del paquete).
 */
const PLAN_COMPARTIDO = `Compartir el plan de otras áreas con mis profesionales — versión propuesta 2026-11

${AVISO}

Texto propuesto, pendiente de validación jurídica.

Esta autorización es para que un profesional que te acompaña en un área vea tu plan de otra área, la que lleva otro profesional: Nutrición o Entrenamiento. Antropometría no tiene plan. La das por profesional y por área.

Qué ve: tu plan vigente de esa área, completo y de solo lectura, como lo ves vos en tu app; su objetivo, con el fundamento que escribió tu profesional; quién lo armó; desde cuándo rige; la fecha de la próxima revisión; y cuánto registraste cada semana desde que rige, hasta las últimas 12 semanas. También ve el resumen de esa área.

Qué no ve: los borradores, las versiones anteriores, lo que se habló en una revisión, las notas internas de tus profesionales ni sus evaluaciones.

Quiénes lo ven: solo los profesionales que elijas, mientras su vínculo con vos esté vigente y su acceso esté autorizado. Si un vínculo se pausa o termina, ese profesional deja de verlo. Lo que compartís es lo del profesional que lleva esa área hoy: si empezás con otro profesional en esa área, no se le comparte a nadie hasta que vuelvas a elegir.

Quien ve tu plan no lo puede cambiar. Le puede dejar una nota a quien lleva esa área, y esa nota también la ves vos.

Un profesional te puede pedir ver tu plan de otra área. Pedirlo no le da acceso: lo decidís vos, y podés decir que no.

Cada vez que un profesional abre tu plan de otra área, queda registrado, y lo ves vos. Quien lleva esa área sabe con quién lo compartís.

Podés pasar a compartir solo el resumen, sacar a alguien o retirar esta autorización cuando quieras, y corta desde ese momento. No se borra nada, y retirarla no deshace lo que un profesional ya vio. Cerrar tu cuenta también la retira.

Aceptar esta versión no acepta versiones futuras.`;

export const CATALOGO_DE_TEXTOS: readonly VersionDeTexto[] = [
  {
    id: 'terminos-2026-09-demo',
    tipo: 'TERMINOS',
    titulo: 'Términos de uso',
    finalidad: 'USO_DEL_SERVICIO',
    vigenteDesde: '2026-09-18T00:00:00.000Z',
    texto: TERMINOS,
    hash: '9373ea14836695df3f08a1947e34c3c3272d8cc84e29fe5c63c8320e7bb55d9b',
    reemplazaA: null,
  },
  {
    id: 'privacidad-2026-09-demo',
    tipo: 'PRIVACIDAD_INFO',
    titulo: 'Información de privacidad',
    finalidad: 'INFORMACION_DEL_TRATAMIENTO',
    vigenteDesde: '2026-09-18T00:00:00.000Z',
    texto: PRIVACIDAD,
    hash: '4d1d98a8b260d2f71481bac860fafb3da6c4fe251d69e6e05710ed897c9afbcd',
    reemplazaA: null,
  },
  {
    id: 'datos-salud-2026-09-demo',
    tipo: 'DATOS_SALUD_BE',
    titulo: 'Tratamiento de datos de salud',
    finalidad: 'HEALTH_DATA_PROCESSING_AND_LONGITUDINAL_HISTORY',
    vigenteDesde: '2026-09-18T00:00:00.000Z',
    texto: DATOS_SALUD,
    hash: 'a6e7a55ba7e2433aa28873226e71f91efe4fa08acb32d8ee32acad9c42b82d70',
    reemplazaA: null,
  },
  {
    id: 'cierre-cuenta-2026-09-demo',
    tipo: 'CONSECUENCIAS_DE_CIERRE',
    titulo: 'Cerrar mi cuenta',
    finalidad: 'CONSECUENCIAS_DEL_CIERRE',
    vigenteDesde: '2026-09-18T00:00:00.000Z',
    texto: CONSECUENCIAS_DE_CIERRE,
    hash: '9fe2d19c00bc2987a0277c78f053d9b9de01fcd2e6d709db31cfc31924da5c5b',
    reemplazaA: null,
  },
  {
    id: 'acceso-profesional-sanitario-2026-09-demo',
    tipo: 'CONSENTIMIENTO_PROFESIONAL_SANITARIO',
    titulo: 'Autorizar acceso a un profesional de la salud',
    finalidad: 'AUTORIZACION_DE_ACCESO_PROFESIONAL',
    vigenteDesde: '2026-09-19T00:00:00.000Z',
    texto: B2_SANITARIO,
    hash: '913b8a9be1a387617e6fedbc9b1d24e1237c0bf2f785e209cc9d56c027ca8f17',
    reemplazaA: null,
  },
  {
    id: 'acceso-profesional-no-sanitario-2026-09-demo',
    tipo: 'CONSENTIMIENTO_PROFESIONAL_NO_SANITARIO',
    titulo: 'Autorizar acceso a un profesional que no es de la salud',
    finalidad: 'AUTORIZACION_DE_ACCESO_PROFESIONAL',
    vigenteDesde: '2026-09-19T00:00:00.000Z',
    texto: B2_NO_SANITARIO,
    hash: 'b85090bdc5cd7b730a91093d14cba57c83f13d644b55dff97157535b67db4023',
    reemplazaA: null,
  },
  {
    id: 'evidencia-visual-2026-10-propuesta',
    tipo: 'EVIDENCIA_VISUAL',
    titulo: 'Fotos de tus comidas',
    finalidad: 'INFORMACION_DESTACADA_DE_EVIDENCIA_VISUAL',
    vigenteDesde: '2026-10-06T00:00:00.000Z',
    texto: EVIDENCIA_VISUAL,
    hash: '88eb764c3382f241a1d6f7f0a51e5daa3d0774232957492d860e1549f34e28a1',
    reemplazaA: null,
  },
  {
    id: 'mayoria-de-edad-2026-10',
    tipo: 'MAYORIA_DE_EDAD',
    titulo: 'Declaración de mayoría de edad',
    // 08 §24.7 a: «finalidad exclusiva de elegibilidad».
    finalidad: 'ELEGIBILIDAD_POR_MAYORIA_DE_EDAD',
    vigenteDesde: '2026-10-16T00:00:00.000Z',
    texto: MAYORIA_DE_EDAD,
    hash: 'cd090b1e6ae3d68033962ed5b8effd2b6a0b8db7bd3f046e1fadf06b986c60f6',
    reemplazaA: null,
  },
  {
    id: 'habitos-compartidos-2026-11-propuesta',
    tipo: 'HABITOS_COMPARTIDOS',
    titulo: 'Compartir mis hábitos con mis profesionales',
    finalidad: 'COMPARTIR_HABITOS_CON_PROFESIONALES',
    vigenteDesde: '2026-11-05T00:00:00.000Z',
    texto: HABITOS_COMPARTIDOS,
    hash: '039e752d5c17f469f640068f246cba10190c5a563ad9b546a05269996b5326ee',
    reemplazaA: null,
  },
  {
    id: 'resumenes-compartidos-2026-11-propuesta',
    tipo: 'RESUMENES_COMPARTIDOS',
    titulo: 'Compartir con mis profesionales lo de otras áreas',
    finalidad: 'COMPARTIR_OTRAS_AREAS_CON_PROFESIONALES',
    vigenteDesde: '2026-11-07T00:00:00.000Z',
    texto: RESUMENES_COMPARTIDOS,
    hash: '774d3a27ed2391eda7a10fc74ce1b7aa8fa3fb1939e6ef6feb1d50522e9664d3',
    reemplazaA: null,
  },
  // Dirección, 2026-11-07: un texto por nivel. El de «resumen» sucede al texto único (no hereda sus aceptaciones, 09
  // §31.2.6); el de «resumen y plan» es de un tipo nuevo.
  {
    id: 'resumenes-compartidos-2026-11-propuesta-2',
    tipo: 'RESUMENES_COMPARTIDOS',
    titulo: 'Compartir el resumen de otras áreas con mis profesionales',
    finalidad: 'COMPARTIR_RESUMEN_DE_OTRAS_AREAS_CON_PROFESIONALES',
    vigenteDesde: '2026-11-07T12:00:00.000Z',
    texto: RESUMEN_COMPARTIDO,
    hash: '6153eff056a37b986519dbe406d6378c0d3a8d80c5c75397bf59faa9f8ff7d1f',
    reemplazaA: 'resumenes-compartidos-2026-11-propuesta',
  },
  // 2026-11-07: la propuesta 3 del texto de «resumen» sucede a la 2 (no promete lo que no existe).
  {
    id: 'resumenes-compartidos-2026-11-propuesta-3',
    tipo: 'RESUMENES_COMPARTIDOS',
    titulo: 'Compartir el resumen de otras áreas con mis profesionales',
    finalidad: 'COMPARTIR_RESUMEN_DE_OTRAS_AREAS_CON_PROFESIONALES',
    vigenteDesde: '2026-11-07T18:00:00.000Z',
    texto: RESUMEN_COMPARTIDO_3,
    hash: '95095b6067f74e5fb514fd0177397de394257025364162ce030eac0fe07eb45e',
    reemplazaA: 'resumenes-compartidos-2026-11-propuesta-2',
  },
  {
    id: 'resumenes-y-plan-compartidos-2026-11-propuesta',
    tipo: 'RESUMENES_Y_PLAN_COMPARTIDOS',
    titulo: 'Compartir el plan de otras áreas con mis profesionales',
    finalidad: 'COMPARTIR_PLAN_DE_OTRAS_AREAS_CON_PROFESIONALES',
    vigenteDesde: '2026-11-07T12:00:00.000Z',
    texto: PLAN_COMPARTIDO,
    hash: '61e0f29043089c9f562a8660d1dd1850081267080bc80f1e34600d0464688ee5',
    reemplazaA: null,
  },
];

/**
 * Las versiones que todavía son una propuesta (precierre del 2026-10-06, §6): la API lo informa con cada requisito
 * (`textApproval: 'PENDING_APPROVAL'`) y la APK lo muestra junto al texto. Salen de acá cuando Dirección aprueba un texto,
 * que entra como una versión nueva.
 */
export const VERSIONES_PROPUESTAS: ReadonlySet<string> = new Set(['evidencia-visual-2026-10-propuesta', 'habitos-compartidos-2026-11-propuesta', 'resumenes-compartidos-2026-11-propuesta', 'resumenes-compartidos-2026-11-propuesta-2', 'resumenes-compartidos-2026-11-propuesta-3', 'resumenes-y-plan-compartidos-2026-11-propuesta']);

/** Versión vigente por tipo. Una versión nueva no hereda aceptación (09 §31.2.6). */
export const VERSION_VIGENTE: Readonly<Record<TipoDeTexto, VersionDeTexto>> = Object.fromEntries(
  CATALOGO_DE_TEXTOS.map((v) => [v.tipo, v]),
) as Record<TipoDeTexto, VersionDeTexto>;

/** Tipo de texto de B2 según el perfil del profesional (08 §12.3). */
export const TIPO_DE_TEXTO_DE_B2 = {
  SANITARIO: 'CONSENTIMIENTO_PROFESIONAL_SANITARIO',
  NO_SANITARIO: 'CONSENTIMIENTO_PROFESIONAL_NO_SANITARIO',
} as const satisfies Readonly<Record<'SANITARIO' | 'NO_SANITARIO', TipoDeTexto>>;
