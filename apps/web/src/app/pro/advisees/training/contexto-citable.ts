/**
 * PF-02 · lógica del «Contexto declarado» del formulario de evaluación de entrenamiento, sin React ni Next, para poder
 * probarla sola (`scripts/contexto-citable.test.mjs`). Cubre las tres correcciones de la auditoría del PR 102:
 * - **versión vista:** cada respuesta citable guarda la versión que el profesional vio (`expectedVersion`, el `version`
 *   de FRM-05), y la cita la envía. Si la persona rectificó en el medio, la API responde 409 y no registra nada (DL-102);
 *   después de actualizar, las elegidas que cambiaron se desmarcan y se señalan para revisarlas;
 * - **paginación:** el contexto se carga por páginas con el cursor de FRM-04. Una página sin respuestas de entrenamiento
 *   no es un vacío definitivo si quedan páginas;
 * - **tope de 20 citas** (`formResponseReferences` admite hasta 20): no se puede marcar la 21, se puede desmarcar, y se
 *   valida también antes de enviar. Nunca se descarta una selección en silencio.
 */
import { numero, type DetalleDeSolicitudResponse, type ListaDeSolicitudesDeFormularioResponse, type Resultado, type VersionDePlantillaResponse } from '@be/domain';

/** El máximo de citas por evaluación: el mismo tope que el contrato (`formResponseReferences` hasta 20). */
export const MAXIMO_DE_CITAS = 20;
/** Tamaño de página de FRM-04 para el contexto. */
export const LIMITE_DE_PAGINA = '20';

/** Una respuesta que se puede citar: la versión vigente de un campo respondido, tal como el profesional la ve. */
export interface Citable {
  readonly formResponseId: string;
  readonly fieldCode: string;
  /** La versión de la respuesta que se mostró; viaja en la cita como precondición (DL-102). */
  readonly expectedVersion: string;
  readonly etiqueta: string;
  readonly valor: string;
  readonly fecha: string;
}

export const claveDe = (c: { formResponseId: string; fieldCode: string }): string => `${c.formResponseId}#${c.fieldCode}`;

/** Valor de una respuesta declarada, con su unidad: el número con coma (DL-091 punto 4). */
export function valorDeclarado(valor: string | number | boolean, unidad: string | null): string {
  const texto = typeof valor === 'number' ? numero(valor) : typeof valor === 'boolean' ? (valor ? 'Sí' : 'No') : valor;
  return unidad ? `${texto} ${unidad}` : texto;
}

/** De dónde se lee el contexto. En la pantalla es el cliente de la API; en las pruebas, una fuente falsa. */
export interface FuenteDeContexto {
  listar(cursor: string | undefined): Promise<Resultado<ListaDeSolicitudesDeFormularioResponse>>;
  detalle(formRequestId: string): Promise<Resultado<DetalleDeSolicitudResponse>>;
  version(templateId: string, templateVersionId: string): Promise<Resultado<VersionDePlantillaResponse>>;
}

export interface PaginaDeCitables {
  readonly citables: readonly Citable[];
  /** El cursor para pedir la página siguiente, o `null` si no hay más. */
  readonly siguiente: string | null;
}

type CamposDePlantilla = Map<string, { label: string; unit: string | null }>;

/**
 * Una página de FRM-04 (las Solicitudes que este profesional hoy puede leer, respondidas), convertida en respuestas
 * citables: solo las de ENTRENAMIENTO, en su versión vigente, con rótulo y unidad de su plantilla. `plantillas` es una
 * caché compartida entre páginas. El servidor vuelve a validar cada cita, y su versión, al registrar la evaluación.
 */
export async function cargarPaginaDeCitables(fuente: FuenteDeContexto, cursor: string | undefined, plantillas: Map<string, CamposDePlantilla>): Promise<Resultado<PaginaDeCitables>> {
  const lista = await fuente.listar(cursor);
  if (!lista.ok) return lista;
  const citables: Citable[] = [];
  for (const s of lista.datos.data.filter((x) => x.scope === 'ENTRENAMIENTO')) {
    const detalle = await fuente.detalle(s.formRequestId);
    if (!detalle.ok) return detalle;
    const respuesta = detalle.datos.data.response;
    if (!respuesta || respuesta.effectiveView.kind === 'NOT_RESOLVABLE') continue;
    const vista = respuesta.effectiveView;
    const rectificacion = vista.kind === 'RECTIFIED' ? respuesta.rectifications.find((r) => r.rectificationId === vista.rectificationId) : undefined;
    const vigentes = rectificacion ? rectificacion.answers : respuesta.original.answers;
    let campos = plantillas.get(s.templateVersionId);
    if (!campos) {
      const version = await fuente.version(s.templateId, s.templateVersionId);
      if (!version.ok) return version;
      campos = new Map(version.datos.data.sections.flatMap((sec) => sec.fields.map((c) => [c.fieldCode, { label: c.label, unit: c.unit }] as const)));
      plantillas.set(s.templateVersionId, campos);
    }
    for (const a of vigentes) {
      const campo = campos.get(a.fieldCode);
      citables.push({
        formResponseId: respuesta.formResponseId,
        fieldCode: a.fieldCode,
        expectedVersion: respuesta.version,
        etiqueta: campo?.label ?? a.fieldCode,
        // La misma unidad que la API devuelve al citar (DL-102): la declarada por la persona o, si falta, la de la plantilla.
        valor: valorDeclarado(a.value, a.unit ?? campo?.unit ?? null),
        fecha: rectificacion ? rectificacion.recordedAt : respuesta.submittedAt,
      });
    }
  }
  return { ok: true, datos: { citables, siguiente: lista.datos.page.hasMore ? lista.datos.page.nextCursor : null } };
}

/**
 * Carga desde el principio al menos `minimo` páginas y sigue mientras falte alguna de `buscadas` y queden páginas. Así,
 * al actualizar después de un conflicto, una elegida que se corrió a una página posterior (porque la persona respondió
 * otra Solicitud en el medio) se vuelve a encontrar, en lugar de darse por no disponible. Termina cuando FRM-04 no
 * tiene más páginas.
 */
export async function cargarPaginasDeCitables(
  fuente: FuenteDeContexto,
  plantillas: Map<string, CamposDePlantilla>,
  { minimo, buscadas = [] }: { minimo: number; buscadas?: readonly string[] },
): Promise<Resultado<PaginaDeCitables & { readonly paginas: number }>> {
  const citables: Citable[] = [];
  let cursor: string | undefined;
  let paginas = 0;
  const falta = () => buscadas.some((k) => !citables.some((c) => claveDe(c) === k));
  do {
    const r = await cargarPaginaDeCitables(fuente, cursor, plantillas);
    if (!r.ok) return r;
    citables.push(...r.datos.citables);
    paginas++;
    cursor = r.datos.siguiente ?? undefined;
  } while (cursor && (paginas < minimo || falta()));
  return { ok: true, datos: { citables, siguiente: cursor ?? null, paginas } };
}

/**
 * Marca o desmarca una respuesta. Desmarcar siempre se puede; marcar una más allá del tope no cambia nada y lo avisa
 * (`topeAlcanzado`), así la pantalla lo explica en lugar de ignorar el clic.
 */
export function alternarSeleccion(seleccion: readonly string[], clave: string): { seleccion: readonly string[]; topeAlcanzado: boolean } {
  if (seleccion.includes(clave)) return { seleccion: seleccion.filter((c) => c !== clave), topeAlcanzado: false };
  if (seleccion.length >= MAXIMO_DE_CITAS) return { seleccion, topeAlcanzado: true };
  return { seleccion: [...seleccion, clave], topeAlcanzado: false };
}

/** Validación antes de enviar: `null` si la selección se puede enviar; si no, cuántas sobran. */
export function excesoDeSeleccion(seleccion: readonly string[]): number | null {
  return seleccion.length > MAXIMO_DE_CITAS ? seleccion.length - MAXIMO_DE_CITAS : null;
}

/** Las citas a enviar, en el orden en que se muestran, cada una con la versión que se vio. */
export function citasAEnviar(citables: readonly Citable[], seleccion: readonly string[]): { formResponseId: string; fieldCode: string; expectedVersion: string }[] {
  return citables.filter((c) => seleccion.includes(claveDe(c))).map((c) => ({ formResponseId: c.formResponseId, fieldCode: c.fieldCode, expectedVersion: c.expectedVersion }));
}

/**
 * Después de actualizar el contexto por un conflicto de versión: se conservan marcadas las elegidas que siguen iguales y
 * se **desmarcan** las que cambiaron de versión o ya no están, que vuelven como `cambiadas` para señalarlas. Nada se
 * descarta en silencio: la pantalla muestra cada cambiada y el profesional decide si la vuelve a marcar.
 */
export function reconciliarSeleccion(seleccion: readonly string[], antes: readonly Citable[], despues: readonly Citable[]): { seleccion: readonly string[]; cambiadas: readonly string[] } {
  const versionAntes = new Map(antes.map((c) => [claveDe(c), c.expectedVersion]));
  const versionDespues = new Map(despues.map((c) => [claveDe(c), c.expectedVersion]));
  const siguen: string[] = [];
  const cambiadas: string[] = [];
  for (const clave of seleccion) {
    const ahora = versionDespues.get(clave);
    if (ahora !== undefined && ahora === versionAntes.get(clave)) siguen.push(clave);
    else cambiadas.push(clave);
  }
  return { seleccion: siguen, cambiadas };
}
