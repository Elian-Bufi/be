/**
 * WP-NUTRICION-ALIMENTOS (DL-180) · los alimentos del catálogo nutricional: su grupo (y el ícono del grupo), el nivel de
 * su origen en el buscador y los textos de esas piezas. Vive aparte para que lo usen `contratos-nutricion.ts` (el
 * buscador) y `contratos-alimentos.ts` (corregir, retirar y revisar) sin depender uno del otro.
 *
 * - **El grupo (NUA-05)** es un hecho aparte de las versiones del alimento: cambiarlo no emite una versión ni toca planes,
 *   recetas ni registros. Lo siembra BE para el catálogo base (con la curaduría de DL-141) y lo elige quien carga un
 *   alimento a mano. Sin grupo, o en «Otros», el ícono es el genérico, `alimento`.
 * - **El nivel del origen (NUA-03)** ubica, no califica: dice de dónde sale el dato. «Verificado» es una tabla oficial (USDA
 *   FoodData Central · SR Legacy) o un alimento cargado a mano que Administración certificó con una fuente; «Tuyo», lo
 *   que cargaste vos; «De otro profesional», lo que cargó otro y no está certificado (va después en el buscador, con aviso
 *   y con su composición a la vista antes de sumarlo). Lo importado de Open Food Facts y lo de demostración conservan el
 *   origen que ya decían («Open Food Facts · ODbL 1.0», «Demostración»).
 */
import { z } from 'zod';
import { Instante } from './contratos';
import type { NombreDeIcono } from './iconos';

// ─── El grupo ─────────────────────────────────────────────────────────────────────────────────────

/** Los grupos de alimentos, en el orden en que se ofrecen al elegir uno. */
export const GrupoDeAlimentoSchema = z.enum(['MEAT', 'FISH', 'EGGS', 'DAIRY', 'GRAINS', 'LEGUMES', 'VEGETABLES', 'FRUITS', 'FATS', 'NUTS', 'SWEETS', 'DRINKS', 'OTHER']);
export type GrupoDeAlimento = z.infer<typeof GrupoDeAlimentoSchema>;
export const GRUPOS_DE_ALIMENTO: readonly GrupoDeAlimento[] = GrupoDeAlimentoSchema.options;

/** Cómo se nombra cada grupo en pantalla. */
export const NOMBRE_DEL_GRUPO: Readonly<Record<GrupoDeAlimento, string>> = {
  MEAT: 'Carnes',
  FISH: 'Pescados y mariscos',
  EGGS: 'Huevos',
  DAIRY: 'Lácteos',
  GRAINS: 'Cereales, harinas y panificados',
  LEGUMES: 'Legumbres',
  VEGETABLES: 'Verduras y hortalizas',
  FRUITS: 'Frutas',
  FATS: 'Aceites y grasas',
  NUTS: 'Frutos secos y semillas',
  SWEETS: 'Azúcares y dulces',
  DRINKS: 'Bebidas e infusiones',
  OTHER: 'Otros',
};

/** El ícono de cada grupo, de la familia de BE (`iconos.ts`). «Otros» usa el genérico. */
export const ICONO_DEL_GRUPO: Readonly<Record<GrupoDeAlimento, NombreDeIcono>> = {
  MEAT: 'carnes',
  FISH: 'pescados',
  EGGS: 'huevos',
  DAIRY: 'lacteos',
  GRAINS: 'cereales',
  LEGUMES: 'legumbres',
  VEGETABLES: 'verduras',
  FRUITS: 'frutas',
  FATS: 'aceites',
  NUTS: 'frutos-secos',
  SWEETS: 'dulces',
  DRINKS: 'bebidas',
  OTHER: 'alimento',
};

/** El ícono de un alimento: el de su grupo; sin grupo (lo cargado antes de DL-180, lo importado), el genérico. */
export function iconoDelAlimento(grupo: GrupoDeAlimento | null | undefined): NombreDeIcono {
  return grupo ? ICONO_DEL_GRUPO[grupo] : 'alimento';
}

/** Cómo se guarda cada grupo en la base (el enum `GrupoDeAlimento` de Prisma, en castellano). */
export const GRUPO_EN_LA_BASE = {
  MEAT: 'CARNES',
  FISH: 'PESCADOS',
  EGGS: 'HUEVOS',
  DAIRY: 'LACTEOS',
  GRAINS: 'CEREALES',
  LEGUMES: 'LEGUMBRES',
  VEGETABLES: 'VERDURAS',
  FRUITS: 'FRUTAS',
  FATS: 'ACEITES',
  NUTS: 'FRUTOS_SECOS',
  SWEETS: 'DULCES',
  DRINKS: 'BEBIDAS',
  OTHER: 'OTROS',
} as const satisfies Readonly<Record<GrupoDeAlimento, string>>;
export type GrupoDeAlimentoEnLaBase = (typeof GRUPO_EN_LA_BASE)[GrupoDeAlimento];
export const GRUPO_API: Readonly<Record<GrupoDeAlimentoEnLaBase, GrupoDeAlimento>> = Object.fromEntries(
  Object.entries(GRUPO_EN_LA_BASE).map(([api, base]) => [base, api]),
) as Record<GrupoDeAlimentoEnLaBase, GrupoDeAlimento>;

/**
 * Los grupos de la curaduría del catálogo base (`prisma/datos/catalogo-base/alimentos.json`, DL-141) y el grupo de BE de
 * cada uno: los cuatro de carnes van a «Carnes», y las leches y los quesos, a «Lácteos». Lo usa la siembra de la migración
 * `20261119120100_alimentos_del_catalogo`, y una prueba verifica que cada alimento sembrado tenga el suyo.
 */
export const GRUPO_DE_LA_CURADURIA: Readonly<Record<string, GrupoDeAlimento>> = {
  'Cereales, harinas y panificados': 'GRAINS',
  'Legumbres y derivados': 'LEGUMES',
  'Verduras y hortalizas': 'VEGETABLES',
  Frutas: 'FRUITS',
  'Carnes vacunas': 'MEAT',
  'Otras carnes': 'MEAT',
  'Cerdo y fiambres': 'MEAT',
  Aves: 'MEAT',
  'Pescados y mariscos': 'FISH',
  Huevos: 'EGGS',
  'Leches, yogures y postres': 'DAIRY',
  Quesos: 'DAIRY',
  'Aceites y grasas': 'FATS',
  'Frutos secos y semillas': 'NUTS',
  'Azúcares y dulces': 'SWEETS',
  'Bebidas e infusiones': 'DRINKS',
  'Condimentos, especias y otros': 'OTHER',
};

// ─── El nivel del origen ──────────────────────────────────────────────────────────────────────────

export const NivelDeOrigenSchema = z.enum(['VERIFIED', 'YOURS', 'OTHER_PROFESSIONAL', 'UNVERIFIED']);
export type NivelDeOrigen = z.infer<typeof NivelDeOrigenSchema>;

/** Lo que va a la vista en la fila. Lo importado y lo de demostración no suman nada: ya dicen su origen. */
export const ETIQUETA_DEL_NIVEL: Readonly<Record<NivelDeOrigen, string | null>> = {
  VERIFIED: 'Verificado',
  YOURS: 'Tuyo',
  OTHER_PROFESSIONAL: 'De otro profesional',
  UNVERIFIED: null,
};

/** Lo que hace falta para decir el nivel: la procedencia, el proveedor de la fuente, quién lo cargó y si está certificado. */
export interface DatosDelNivel {
  readonly provenance: 'BE_SYNTHETIC_SEED' | 'PROFESSIONAL_MANUAL' | 'CONTROLLED_IMPORT';
  readonly externalProvider: string | null;
  readonly loadedBy: 'YOU' | 'ANOTHER_PROFESSIONAL' | null;
  /** Administración certificó la versión vigente (NUA-04). */
  readonly certified: boolean;
}

/**
 * El nivel del origen de un alimento (NUA-03). La certificación de Administración vale más que quién lo cargó: lo
 * certificado es «Verificado» aunque sea tuyo o de otro profesional.
 */
export function nivelDeOrigen(d: DatosDelNivel): NivelDeOrigen {
  if (d.certified || d.externalProvider === 'USDA_FDC_SR_LEGACY') return 'VERIFIED';
  if (d.provenance === 'PROFESSIONAL_MANUAL') return d.loadedBy === 'ANOTHER_PROFESSIONAL' ? 'OTHER_PROFESSIONAL' : 'YOURS';
  return 'UNVERIFIED';
}

/** Lo de otro profesional va después en el buscador (NUA-03); lo demás, en su orden de siempre. */
export function ordenDelNivel(n: NivelDeOrigen): 0 | 1 {
  return n === 'OTHER_PROFESSIONAL' ? 1 : 0;
}

/** NUA-04: la certificación de la versión vigente, con la fuente que citó Administración. */
export const CertificacionDeAlimentoSchema = z.strictObject({ source: z.string().min(1).max(500), certifiedAt: Instante });
export type CertificacionDeAlimento = z.infer<typeof CertificacionDeAlimentoSchema>;

// ─── Los textos ───────────────────────────────────────────────────────────────────────────────────

export const COPY_ALIMENTOS = {
  grupo: 'Grupo',
  sinGrupo: 'Sin grupo',
  elegirGrupo: 'Elegí su grupo',
  /** NUA-D05: lo que se carga a mano lo ven los demás profesionales, con su nombre y sus valores. */
  avisoDeCompartir:
    'Lo ven también los demás profesionales de Nutrición de BE, como «De otro profesional», con su nombre y sus valores. No escribas datos de personas en el nombre.',
  /** NUA-03: lo de otro profesional, antes de sumarlo. */
  deOtroProfesional: 'De otro profesional',
  avisoDeOtroProfesional: 'Lo cargó a mano otro profesional y Administración no lo revisó: mirá sus valores cada 100 g antes de sumarlo.',
  sumarIgual: 'Sumarlo',
  volverABuscar: 'Volver a buscar',
  verificado: 'Verificado',
  tuyo: 'Tuyo',
  certificadoCon: (fuente: string) => `Certificado por Administración. Fuente: ${fuente}`,
  equivalenteSugerido: (de: string) => `Equivalente verificado de «${de}»`,
  tieneEquivalente: (verificado: string) => `Hay uno verificado equivalente: «${verificado}».`,
  /** NUA-02: la marca discreta de lo retirado, donde ya se cita. */
  retirado: 'retirado',
  retiradoEnPalabras: 'Este alimento se retiró del catálogo: lo que ya lo cita lo conserva, pero no se puede sumar de nuevo.',
  retiradoParaActivar: 'Se retiró del catálogo: cambialo por otro antes de activar.',
} as const;

/** «Mis alimentos» (`/pro/foods`): corregir (NUA-01) y retirar (NUA-02) lo que el profesional cargó a mano. */
export const COPY_MIS_ALIMENTOS = {
  titulo: 'Tus alimentos cargados a mano',
  queEs:
    'Si uno tiene un error, corregilo: nace una versión nueva, y los planes activados, las recetas y los registros conservan la versión que citaban. Si ya no lo querés usar, retiralo: deja de aparecer en el buscador, y lo que ya lo cita lo sigue mostrando.',
  sinAlimentos: 'Todavía no cargaste alimentos a mano. Se cargan desde una opción del plan, con «Crearlo a mano».',
  soloNutricion: 'Los alimentos son del área de Nutrición, y tu cuenta no la tiene habilitada.',
  version: (n: number) => `Versión ${n}`,
  cadaCien: (ml: boolean) => (ml ? 'cada 100 ml' : 'cada 100 g'),
  retirado: 'Retirado',
  sinRevisar: 'Sin revisión de Administración',
  verificado: (fuente: string) => `Verificado por Administración. Fuente: ${fuente}`,
  equivalente: (de: string) => `Administración lo marcó como equivalente de «${de}»: el buscador sugiere ese en su lugar.`,
  compartido: 'Lo ven los demás profesionales de Nutrición como «De otro profesional».',
  soloVos: 'Por ahora lo ves solo vos: se comparte cuando lo corregís.',
  corregir: 'Corregir',
  retirar: 'Retirar',
  corregirTitulo: (nombre: string) => `Corregir «${nombre}»`,
  corregirQuePasa: (siguiente: number) =>
    `Nace la versión ${siguiente}. Los planes activados, las recetas y los registros conservan la versión que citaban; un borrador usa la nueva.`,
  verificadoVuelveARevision: 'Administración lo verificó: si cambiás el nombre o los valores, la versión nueva espera otra revisión.',
  guardarCorreccion: 'Guardar la corrección',
  guardando: 'Guardando…',
  retirarTitulo: (nombre: string) => `¿Retirar «${nombre}»?`,
  retirarQuePasa:
    'Deja de aparecer en el buscador y no se puede sumar a nada nuevo. No se borra: los planes, las recetas y los registros que lo citan lo siguen mostrando, con la marca «retirado». Un borrador que lo cita se sigue guardando, pero hay que cambiarlo antes de activarlo.',
  retirando: 'Retirando…',
  volver: 'Volver',
  corregido: (nombre: string, version: number) => `«${nombre}» quedó corregido: versión ${version}.`,
  sinCambios: (nombre: string) => `«${nombre}» no cambió: el nombre y los valores son los mismos.`,
  retiradoAviso: (nombre: string) => `«${nombre}» se retiró del catálogo.`,
  cambioMientras: 'Este alimento cambió desde que lo abriste. Volvé a abrirlo para ver la versión de ahora.',
} as const;

/** La revisión de Administración (`/admin/foods`, NUA-04): el nombre y los valores, nunca a quién se le indicó. */
export const COPY_REVISION_DE_ALIMENTOS = {
  titulo: 'Alimentos cargados a mano',
  queVe:
    'El nombre, los valores cada 100 g y el grupo de lo que cargaron a mano los profesionales de Nutrición. No se ve quién lo cargó ni a quién se le indicó.',
  filtros: { TODOS: 'Todos', PENDING: 'Sin revisar', CERTIFIED: 'Verificados', EQUIVALENT: 'Equivalentes' },
  buscar: 'Buscar por nombre',
  sinAlimentos: 'No hay alimentos cargados a mano con ese filtro.',
  revisar: 'Revisar',
  revisarTitulo: (nombre: string) => `Revisar «${nombre}»`,
  decisiones: { CERTIFY: 'Verificarlo con una fuente', EQUIVALENT: 'Es equivalente a uno de la tabla oficial', CLEAR: 'Quitar lo decidido' },
  fuente: 'Fuente',
  fuenteAyuda: 'La tabla, la publicación o el rótulo de donde salen estos valores, con lo que haga falta para encontrarlo (edición, código o página).',
  faltaLaFuente: 'Falta la fuente.',
  buscarVerificado: 'Buscar en la tabla oficial (USDA)',
  faltaElEquivalente: 'Elegí el alimento equivalente de la tabla oficial.',
  elegido: (nombre: string) => `Elegido: «${nombre}»`,
  ningunVerificado: 'Ningún alimento de la tabla oficial coincide.',
  confirmar: 'Guardar la decisión',
  guardando: 'Guardando…',
  queQueda: {
    CERTIFY: 'En el buscador va a decir «Verificado», con esta fuente, para esta versión. Si quien lo cargó lo corrige, la versión nueva vuelve a esperar revisión.',
    EQUIVALENT: 'El buscador va a sugerir el de la tabla oficial en su lugar. Los planes que ya lo citan no cambian.',
    CLEAR: 'Vuelve a «Sin revisar». Los planes que ya lo citan no cambian.',
  },
  estado: { PENDING: 'Sin revisar', CERTIFIED: 'Verificado', EQUIVALENT: 'Equivalente' },
  decidido: (nombre: string) => `Quedó guardada la decisión sobre «${nombre}».`,
  cambioMientras: 'Este alimento cambió desde que lo abriste (quien lo cargó lo corrigió). Volvé a abrirlo para revisar la versión de ahora.',
} as const;
