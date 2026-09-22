/**
 * CAP-DAT — información profesional pertinente (06 §20.4, T-06-75/76/77; REG-06-209 a 213). Reglas puras que
 * comparten la API, el website y el APK. RF-071 (04:266-275), P0.
 *
 * **Dos estados persistidos, no más** (REG-06-210, 06:8526-8529): `PENDIENTE → RESPONDIDA`, sin retorno, sin
 * cancelar/rechazar/caducar — el 09 no declara esas operaciones y el patrón «solo agregar» del resto de BE lo
 * sostiene (D-B, `docs/paquetes/WP-07.md`). `respondable` **no es un tercer estado**: es una proyección del PDP,
 * calculada en cada lectura con la política vigente (09:1610-1618; REG-06-213). Esta unidad solo puede resolver la
 * mitad estructural — `PENDIENTE` y nada más —; la otra mitad (Vínculo, Alcance, B2 vigentes) depende de datos y
 * vive en el PDP de la API, igual que en el resto del proyecto.
 *
 * **Este módulo no decide pertinencia clínica.** La matriz alcance×categoría de abajo es deliberadamente
 * *maximally permissive*: clasifica, no filtra por criterio clínico, porque nadie con competencia clínica revisó
 * ese contenido todavía (08:92, «ninguna política interna de BE convierte a un perfil no sanitario en sujeto del
 * art. 8»; 08:382, VJR-1/VJR-4 «no se declara resuelta»). El límite de acceso real es Vínculo+Alcance+B2+PDP,
 * evaluado siempre por la API, nunca por esta matriz (DL-095).
 */
import type { TransicionDeMaquina } from './maquina';
import { transicionDe } from './maquina';
import type { Alcance } from './alcance';

// ─── Estado de la Solicitud (REG-06-210) ────────────────────────────────────────────────────────

export const EstadoDeSolicitudDeFormulario = { PENDIENTE: 'PENDIENTE', RESPONDIDA: 'RESPONDIDA' } as const;
export type EstadoDeSolicitudDeFormulario = (typeof EstadoDeSolicitudDeFormulario)[keyof typeof EstadoDeSolicitudDeFormulario];

/** El contrato usa los tokens en inglés del 09 (09:1508, `"status": "PENDING"`); el dominio, la palabra del 06. */
export const ESTADO_DE_SOLICITUD_DE_FORMULARIO_API: Readonly<Record<EstadoDeSolicitudDeFormulario, 'PENDING' | 'RESPONDED'>> = {
  PENDIENTE: 'PENDING',
  RESPONDIDA: 'RESPONDED',
};

export type ActorDeSolicitudDeFormulario = 'PROFESSIONAL' | 'ADVISEE';
export type TransicionDeSolicitudDeFormulario = 'CrearSolicitud' | 'RegistrarRespuesta';

/** Dos transiciones, ninguna más: crear (inicio → PENDIENTE) y responder (PENDIENTE → RESPONDIDA). */
export const TRANSICIONES_DE_SOLICITUD_DE_FORMULARIO: readonly TransicionDeMaquina<
  EstadoDeSolicitudDeFormulario,
  TransicionDeSolicitudDeFormulario,
  ActorDeSolicitudDeFormulario
>[] = [
  { transicion: 'CrearSolicitud', origen: null, destino: 'PENDIENTE', actores: ['PROFESSIONAL'], evento: 'SolicitudDeFormularioCreada' },
  { transicion: 'RegistrarRespuesta', origen: 'PENDIENTE', destino: 'RESPONDIDA', actores: ['ADVISEE'], evento: 'RespuestaDeFormularioRegistrada' },
];

/** La mitad estructural de «respondable»: falso en cuanto la Solicitud ya tiene Respuesta. La otra mitad —Vínculo,
 *  Alcance, B2 vigentes— la decide el PDP de la API con datos que este módulo no tiene (09:1610-1618). */
export function puedeSerRespondableEstructuralmente(estado: EstadoDeSolicitudDeFormulario): boolean {
  return transicionDe(TRANSICIONES_DE_SOLICITUD_DE_FORMULARIO, 'RegistrarRespuesta', estado) !== undefined;
}

// ─── Pertinencia (08 §11-bis, adaptada a P0) ────────────────────────────────────────────────────

export const CategoriaDeDato = {
  SALUD_Y_SEGURIDAD: 'SALUD_Y_SEGURIDAD',
  HABITOS_Y_CONTEXTO: 'HABITOS_Y_CONTEXTO',
  OBJETIVOS_Y_PREFERENCIAS: 'OBJETIVOS_Y_PREFERENCIAS',
  DATOS_GENERALES: 'DATOS_GENERALES',
} as const;
export type CategoriaDeDato = (typeof CategoriaDeDato)[keyof typeof CategoriaDeDato];
export const CATEGORIAS_DE_DATO: readonly CategoriaDeDato[] = Object.values(CategoriaDeDato);

/**
 * Configuración de política, no entidad de dominio (08:303: «del mismo orden que la matriz `EspecialidadPermiso`
 * del seed»). P0 permite las cuatro categorías en los tres Alcances: el catálogo sintético (D-D) no modela
 * diferenciación clínica real, así que fingir una matriz restrictiva sin respaldo sería una falsa precisión. La
 * forma de tabla (no un `true` implícito) es la que permite estrecharla después sin rediseñar el modelo (08:310).
 */
export const MATRIZ_DE_PERTINENCIA: Readonly<Record<Alcance, readonly CategoriaDeDato[]>> = {
  NUTRICION: CATEGORIAS_DE_DATO,
  ENTRENAMIENTO: CATEGORIAS_DE_DATO,
  ANTROPOMETRIA: CATEGORIAS_DE_DATO,
};

export function categoriaPertinenteParaAlcance(alcance: Alcance, categoria: CategoriaDeDato): boolean {
  return MATRIZ_DE_PERTINENCIA[alcance].includes(categoria);
}

// ─── Validaciones de forma de la Solicitud (09:1509-1520; FORM_REQUEST_INVALID) ─────────────────

/** REG-06-212: pedir un campo obligatorio que no se pidió no tiene sentido — «requerido» es un subconjunto de
 *  «solicitado», nunca un conjunto aparte. */
export function requeridosDentroDeSolicitados(requestedFieldCodes: readonly string[], requiredFieldCodes: readonly string[]): boolean {
  const solicitados = new Set(requestedFieldCodes);
  return requiredFieldCodes.every((codigo) => solicitados.has(codigo));
}

/** Cada código pedido tiene que existir en la versión de plantilla citada — nunca en el catálogo vigente, que puede
 *  haber cambiado (REG-06-13: la instantánea se reconstruye desde lo emitido). */
export function solicitudDentroDeLaPlantilla(requestedFieldCodes: readonly string[], codigosDeLaPlantilla: readonly string[]): boolean {
  const disponibles = new Set(codigosDeLaPlantilla);
  return requestedFieldCodes.every((codigo) => disponibles.has(codigo));
}
