/**
 * UF-05 de WP-USO-FINAL (DL-169; 08 §12.2 y §42, condición 1) · las versiones nuevas de los textos, para el uso real, **sin
 * publicar**. Son el borrador que revisa y valida la asesoría jurídica: hasta esa validación no están en
 * `CATALOGO_DE_TEXTOS`, ni en la base, ni se le muestran a nadie, y API-ACC-08 no las acepta.
 *
 * **Este módulo no se exporta del índice:** lo leen las pruebas y quien publica, y no viaja en el website ni en la APK.
 *
 * Cada versión sucede a la vigente de su tipo (`reemplazaA`) y no hereda sus aceptaciones (09 §31.2.6). Los diez textos
 * son los del §4.1 del paquete: términos, privacidad, datos de salud, cierre, B2 sanitario y no sanitario, evidencia
 * visual y lo que se comparte entre áreas (hábitos, resumen, y resumen y plan). Los cuatro primeros se reescriben para el
 * uso real; los otros seis son los vigentes sin el aviso de demostración ni la marca de propuesta, porque lo que dicen ya
 * es lo que hace la implementación. Lo que solo puede decir Dirección con la asesoría queda marcado «[A COMPLETAR: …]», y
 * con esa marca la versión no se puede publicar (`faltaParaPublicar`).
 *
 * **Cómo se publica** (WP-USO-FINAL §13.7): con la validación jurídica, el texto final pasa a `CATALOGO_DE_TEXTOS` con su
 * fecha y su hash, la migración que lo siembra se genera con `scripts/generar-sql-catalogo-de-textos.cjs --ids …`, y sale
 * de esta lista. Al desplegarse, API-ACC-07 pide los términos y la privacidad nuevos a quien aceptó los anteriores.
 */
import { createHash } from 'node:crypto';
import { CATALOGO_DE_TEXTOS, VERSION_VIGENTE, type TipoDeTexto, type VersionDeTexto } from './textos';

/** La validación jurídica de una versión (condición 1 del gate del 08 §42): quién y cuándo. `null` mientras falte. */
export interface ValidacionJuridica {
  readonly fecha: string;
  readonly quien: string;
}

export interface VersionSinPublicar extends Omit<VersionDeTexto, 'vigenteDesde' | 'reemplazaA'> {
  /** La vigente de su tipo, a la que sucede. */
  readonly reemplazaA: string;
  readonly validacionJuridica: ValidacionJuridica | null;
}

const ETIQUETA = 'versión 2026-11';
const RESPONSABLE = '[A COMPLETAR: nombre o razón social, domicilio y documento o CUIT del responsable de BE]';

const TERMINOS = `Términos de uso de BE — ${ETIQUETA}

Responsable del servicio: ${RESPONSABLE}.

1. BE es una plataforma que ayuda a las personas y a sus profesionales de nutrición, entrenamiento y antropometría a organizar su acompañamiento. BE no reemplaza la consulta con un profesional de la salud ni da indicaciones por su cuenta: los planes y las indicaciones son de cada profesional.
2. Para usar BE necesitás una cuenta propia, con tu nombre y un correo que sea tuyo. Tu cuenta es personal e intransferible, y sos responsable de cuidar tu contraseña. BE es solo para personas de 18 años o más.
3. Crear una cuenta no te da acceso a datos de otras personas ni autoriza a ningún profesional a ver tus datos. Cada profesional necesita tu autorización, por área y por finalidad.
4. Un profesional usa BE como tal después de que BE verifica su matrícula o su formación. Cada profesional es responsable de lo que indica.
5. Podés cerrar tu cuenta cuando quieras desde Cuenta → Cerrar mi cuenta. El cierre impide nuevas sesiones y no se puede deshacer. Qué se conserva y qué se suprime lo dice la información de privacidad.
6. BE puede suspender una cuenta cuando exista un fundamento válido según su política, por ejemplo un uso que ponga en riesgo a otras personas. La suspensión no borra tu historia.
7. Para pedir ayuda o hacer un reclamo, escribinos por «Ayuda y contacto», en la app (Perfil) o en el pie del sitio.
8. Estos términos pueden cambiar. Una versión nueva no se considera aceptada hasta que la aceptes: BE te la muestra al entrar, y sin aceptarla no podés seguir usando el servicio, aunque sí cerrar sesión o cerrar tu cuenta.
9. Estos términos se rigen por las leyes de la República Argentina. [A COMPLETAR: la jurisdicción para los conflictos, según la asesoría].`;

const PRIVACIDAD = `Información de privacidad de BE — ${ETIQUETA}

Responsable: ${RESPONSABLE}. Contacto de privacidad: la dirección de privacidad de «Ayuda y contacto», en la app (Perfil) y en el pie del sitio.

Finalidades: crear y mantener tu cuenta; permitirte iniciar sesión y recuperar el acceso; registrar la evidencia de los actos que realizás (esta información, los términos y los consentimientos que otorgues); y, solo si lo consentís aparte, tratar los datos de salud que registres para que funcione el acompañamiento con tus profesionales.

Datos que tratamos al crear tu cuenta: tu nombre; tu correo electrónico, como identificador de acceso; y la contraseña, que se guarda solo como hash y nunca en claro. Si entrás con Google, el identificador de tu cuenta de Google y su correo verificado. También tu declaración de que tenés 18 años o más. Sin estos datos no se puede crear la cuenta.

Datos de salud: crear la cuenta no autoriza el tratamiento de datos de salud. Ese tratamiento requiere un consentimiento separado, que podés otorgar o no, y revocar cuando quieras.

Quién accede: cada profesional ve solo lo que autorizaste, para su área y su finalidad, mientras el vínculo esté vigente. La administración de BE no accede a tus datos de salud, salvo el acceso excepcional de soporte, que queda registrado y se informa.

Encargados: el proveedor de la infraestructura donde funciona BE (Render); el proveedor del correo con que BE manda los códigos para recuperar el acceso; Google, si entrás con tu cuenta de Google; y el servicio de avisos del teléfono (Expo y Firebase Cloud Messaging), si los activás. Los avisos no llevan datos de salud.

Dónde están tus datos: en servidores de Render en Frankfurt (Alemania, Unión Europea). Es una transferencia internacional, que se hace con [A COMPLETAR: el mecanismo de la transferencia internacional, según la asesoría].

Cuánto tiempo: mientras tu cuenta esté abierta. Al cerrarla, se suprimen la contraseña y los datos que no hace falta conservar, y se conserva, por el plazo que exige la ley, la evidencia de los actos y lo que corresponda a la historia clínica. [A COMPLETAR: los plazos de conservación, según la asesoría].

Tus derechos: acceder a tus datos, rectificarlos y suprimirlos. Podés descargar lo tuyo y pedir el acceso, la rectificación o la supresión desde «Tus datos» (en la app, en Perfil; en el sitio, en Cuenta), o escribir a la dirección de privacidad. El acceso se responde dentro de los diez días corridos, y la rectificación o la supresión, dentro de los cinco días hábiles. La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326, atiende las denuncias y los reclamos por incumplimiento de las normas sobre protección de datos personales.

Esta información es una constancia de que te informamos. No es un consentimiento para tratar datos de salud.`;

const DATOS_SALUD = `Consentimiento para el tratamiento de datos de salud por BE — ${ETIQUETA}

Si lo otorgás, BE podrá tratar los datos de salud que registres, o que registren tus profesionales con tu autorización (por ejemplo, tus comidas, tus entrenamientos, tus medidas y las respuestas de tus formularios), para operar el servicio y mantener tu historia.

Este consentimiento no autoriza a ningún profesional. Cada profesional necesita tu autorización específica, por área y por finalidad.

Es libre: podés no otorgarlo. Sin él, no se registran datos de salud en BE.

Podés revocarlo cuando quieras, desde Privacidad. La revocación corta el tratamiento hacia adelante y no borra en silencio la historia ya registrada: para suprimirla, pedilo desde «Tus datos».

Aceptar esta versión no acepta versiones futuras.`;

const CIERRE = `Cerrar mi cuenta

El cierre impide nuevas sesiones y nuevas operaciones desde que se hace efectivo. Tus vínculos con profesionales se finalizan, y tus profesionales dejan de ver tus datos.

Se suprimen tu contraseña y los datos que no hace falta conservar. Se conservan, por el plazo que exige la ley, la evidencia de los actos que realizaste y lo que corresponda a la historia clínica, como lo explica la información de privacidad.

Antes de cerrar, podés descargar lo tuyo desde «Tus datos».

El cierre no se puede deshacer.`;

/**
 * El texto vigente de un tipo, para el uso real: sin el aviso de demostración ni la marca de propuesta, con la etiqueta de
 * la versión nueva en el título. Lo demás no cambia, porque ya dice lo que hace la implementación.
 */
function sinDemostracion(tipo: TipoDeTexto): string {
  const lineas = VERSION_VIGENTE[tipo].texto.split('\n\n');
  const titulo = lineas[0]!.replace(/ — versión (de demostración|propuesta) \d{4}-\d{2}$/, ` — ${ETIQUETA}`);
  const cuerpo = lineas.slice(1).filter((p) => !/^Texto de demostración para el trabajo final BE\./.test(p) && !/^Texto propuesto, pendiente de/.test(p));
  return [titulo, ...cuerpo].join('\n\n');
}

const huella = (texto: string): string => createHash('sha256').update(texto, 'utf8').digest('hex');

function version(id: string, tipo: TipoDeTexto, texto: string): VersionSinPublicar {
  const vigente = VERSION_VIGENTE[tipo];
  return { id, tipo, titulo: vigente.titulo, finalidad: vigente.finalidad, texto, hash: huella(texto), reemplazaA: vigente.id, validacionJuridica: null };
}

/** Las diez versiones nuevas, sin publicar (2026-11-12). */
export const VERSIONES_SIN_PUBLICAR: readonly VersionSinPublicar[] = [
  version('terminos-2026-11', 'TERMINOS', TERMINOS),
  version('privacidad-2026-11', 'PRIVACIDAD_INFO', PRIVACIDAD),
  version('datos-salud-2026-11', 'DATOS_SALUD_BE', DATOS_SALUD),
  version('cierre-cuenta-2026-11', 'CONSECUENCIAS_DE_CIERRE', CIERRE),
  version('acceso-profesional-sanitario-2026-11', 'CONSENTIMIENTO_PROFESIONAL_SANITARIO', sinDemostracion('CONSENTIMIENTO_PROFESIONAL_SANITARIO')),
  version('acceso-profesional-no-sanitario-2026-11', 'CONSENTIMIENTO_PROFESIONAL_NO_SANITARIO', sinDemostracion('CONSENTIMIENTO_PROFESIONAL_NO_SANITARIO')),
  version('evidencia-visual-2026-11', 'EVIDENCIA_VISUAL', sinDemostracion('EVIDENCIA_VISUAL')),
  version('habitos-compartidos-2026-11', 'HABITOS_COMPARTIDOS', sinDemostracion('HABITOS_COMPARTIDOS')),
  version('resumenes-compartidos-2026-11', 'RESUMENES_COMPARTIDOS', sinDemostracion('RESUMENES_COMPARTIDOS')),
  version('resumenes-y-plan-compartidos-2026-11', 'RESUMENES_Y_PLAN_COMPARTIDOS', sinDemostracion('RESUMENES_Y_PLAN_COMPARTIDOS')),
];

export type ImpedimentoDePublicacion = 'VALIDACION_JURIDICA' | 'DATOS_A_COMPLETAR' | 'AVISO_DE_DEMOSTRACION' | 'NO_SUCEDE_A_LA_VIGENTE' | 'HASH';

/**
 * Lo que le falta a una versión para publicarse; vacío, se puede publicar. La validación jurídica no se dispensa (la
 * condición 1 del gate: «no es dispensable por una mera acta de Dirección»), y ningún dato puede quedar por completar.
 */
export function faltaParaPublicar(v: VersionSinPublicar): readonly ImpedimentoDePublicacion[] {
  const falta: ImpedimentoDePublicacion[] = [];
  if (v.validacionJuridica === null) falta.push('VALIDACION_JURIDICA');
  if (/\[A COMPLETAR/.test(v.texto)) falta.push('DATOS_A_COMPLETAR');
  if (/demostración/i.test(v.texto)) falta.push('AVISO_DE_DEMOSTRACION');
  if (v.reemplazaA !== VERSION_VIGENTE[v.tipo].id) falta.push('NO_SUCEDE_A_LA_VIGENTE');
  if (v.hash !== huella(v.texto)) falta.push('HASH');
  return falta;
}

/**
 * El catálogo como quedaría al publicar estas versiones desde `vigenteDesde`, y la vigente de cada tipo: lo que usan las
 * pruebas para simular la publicación sin tocar `CATALOGO_DE_TEXTOS`.
 */
export function catalogoPublicando(versiones: readonly VersionSinPublicar[], vigenteDesde: string): { readonly catalogo: readonly VersionDeTexto[]; readonly vigentes: Readonly<Record<TipoDeTexto, VersionDeTexto>> } {
  const nuevas: VersionDeTexto[] = versiones.map(({ validacionJuridica: _, ...v }) => ({ ...v, vigenteDesde }));
  const catalogo = [...CATALOGO_DE_TEXTOS, ...nuevas];
  return { catalogo, vigentes: Object.fromEntries(catalogo.map((v) => [v.tipo, v])) as Record<TipoDeTexto, VersionDeTexto> };
}
