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
];

/**
 * Las versiones que todavía son una propuesta (precierre del 2026-10-06, §6): la API lo informa con cada requisito
 * (`textApproval: 'PENDING_APPROVAL'`) y la APK lo muestra junto al texto. Salen de acá cuando Dirección aprueba un texto,
 * que entra como una versión nueva.
 */
export const VERSIONES_PROPUESTAS: ReadonlySet<string> = new Set(['evidencia-visual-2026-10-propuesta']);

/** Versión vigente por tipo. Una versión nueva no hereda aceptación (09 §31.2.6). */
export const VERSION_VIGENTE: Readonly<Record<TipoDeTexto, VersionDeTexto>> = Object.fromEntries(
  CATALOGO_DE_TEXTOS.map((v) => [v.tipo, v]),
) as Record<TipoDeTexto, VersionDeTexto>;

/** Tipo de texto de B2 según el perfil del profesional (08 §12.3). */
export const TIPO_DE_TEXTO_DE_B2 = {
  SANITARIO: 'CONSENTIMIENTO_PROFESIONAL_SANITARIO',
  NO_SANITARIO: 'CONSENTIMIENTO_PROFESIONAL_NO_SANITARIO',
} as const satisfies Readonly<Record<'SANITARIO' | 'NO_SANITARIO', TipoDeTexto>>;
