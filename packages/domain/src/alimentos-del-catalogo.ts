/**
 * WP-NUTRICION-ALIMENTOS (DL-180) · los alimentos del catálogo nutricional: su grupo (y el ícono del grupo), el nivel de
 * su origen en el buscador y los textos de esas piezas. Vive aparte para que lo usen `contratos-nutricion.ts` (el
 * buscador) y `contratos-alimentos.ts` (corregir, retirar y revisar) sin depender uno del otro.
 *
 * - **El grupo (NUA-05)** es un hecho aparte de las versiones del alimento: cambiarlo no emite una versión ni toca planes,
 *   recetas ni registros. Lo siembra BE para el catálogo base (con la curaduría de DL-141) y lo elige quien carga un
 *   alimento a mano. Sin grupo, o en «Otros», el ícono es el genérico, `alimento`.
 * - **El nivel del origen (NUA-03)** ubica, no califica: dice de dónde sale el dato. «Verificado» es una tabla oficial (USDA
 *   FoodData Central · SR Legacy), lo que Administración sumó al canon o un alimento cargado a mano que certificó con una
 *   fuente; «Tuyo», lo que cargaste vos. Desde el segundo tramo (NUA-D14) no hay «De otro profesional»: lo cargado a mano
 *   es solo de quien lo cargó. Lo importado de Open Food Facts y lo de demostración conservan el
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

// ─── Las medidas caseras (NUA-08, aprobadas por Dirección el 2026-11-16) ─────────────────────────────

/**
 * NUA-08 · las medidas caseras de un alimento: la unidad, la cucharada, la taza y la porción, cada una con su equivalencia
 * en la unidad de su composición (gramos, o mililitros si se compone cada 100 ml). Las define quien carga el alimento a
 * mano; la tabla oficial trae solo las que documenta su fuente (en este tramo, ninguna). La cuenta va siempre en gramos:
 * una medida es una forma de escribir la cantidad, no un nutriente.
 */
export const TipoDeMedidaCaseraSchema = z.enum(['UNIT', 'TABLESPOON', 'CUP', 'PORTION']);
export type TipoDeMedidaCasera = z.infer<typeof TipoDeMedidaCaseraSchema>;
export const TIPOS_DE_MEDIDA_CASERA: readonly TipoDeMedidaCasera[] = TipoDeMedidaCaseraSchema.options;

/** Cómo se nombra cada medida, de a una y de a varias. */
export const NOMBRE_DE_LA_MEDIDA: Readonly<Record<TipoDeMedidaCasera, { readonly una: string; readonly varias: string }>> = {
  UNIT: { una: 'unidad', varias: 'unidades' },
  TABLESPOON: { una: 'cucharada', varias: 'cucharadas' },
  CUP: { una: 'taza', varias: 'tazas' },
  PORTION: { una: 'porción', varias: 'porciones' },
};

/** Una medida casera y cuánto es, en gramos (o mililitros, si el alimento se compone cada 100 ml). */
export const MedidaCaseraSchema = z.strictObject({ kind: TipoDeMedidaCaseraSchema, amount: z.number().positive().finite().max(5000) });
export type MedidaCasera = z.infer<typeof MedidaCaseraSchema>;
/** Las de un alimento: a lo sumo una de cada tipo. Una lista vacía quiere decir que no tiene. */
export const MedidasCaserasSchema = z
  .array(MedidaCaseraSchema)
  .max(4)
  .refine((m) => new Set(m.map((x) => x.kind)).size === m.length, { message: 'Una medida de cada tipo.' });
export type MedidasCaseras = z.infer<typeof MedidasCaserasSchema>;

/**
 * La medida que se eligió para la cantidad de un ítem del plan, con su equivalencia de ese momento: el ítem la conserva
 * aunque quien cargó el alimento la cambie después. La cantidad del ítem es siempre `count × amountPerUnit`, en gramos (o
 * mililitros), redondeada a 0,1.
 */
export const MedidaElegidaSchema = z.strictObject({
  kind: TipoDeMedidaCaseraSchema,
  count: z.number().positive().finite().max(100),
  amountPerUnit: z.number().positive().finite().max(5000),
});
export type MedidaElegida = z.infer<typeof MedidaElegidaSchema>;

/** Los gramos (o mililitros) de una medida elegida, redondeados a 0,1 como el resto de las cantidades del plan. */
export function cantidadDeLaMedida(m: Pick<MedidaElegida, 'count' | 'amountPerUnit'>): number {
  return Math.round(m.count * m.amountPerUnit * 10) / 10;
}

const enTexto = (n: number): string => String(Math.round(n * 10) / 10).replace('.', ',');

/** «1 taza = 240 g» (o «= 240 ml» si se compone cada 100 ml). */
export function equivalenciaEnPalabras(m: MedidaCasera, referencia: '100g' | '100ml' = '100g'): string {
  return `1 ${NOMBRE_DE_LA_MEDIDA[m.kind].una} = ${enTexto(m.amount)} ${referencia === '100ml' ? 'ml' : 'g'}`;
}

/** «2 tazas (480 g)», o «1½»… no: siempre con coma («1,5 tazas (360 g)»). */
export function medidaElegidaEnPalabras(m: MedidaElegida, unidad: 'g' | 'ml' = 'g'): string {
  const nombre = m.count === 1 ? NOMBRE_DE_LA_MEDIDA[m.kind].una : NOMBRE_DE_LA_MEDIDA[m.kind].varias;
  return `${enTexto(m.count)} ${nombre} (${enTexto(cantidadDeLaMedida(m))} ${unidad})`;
}

// ─── El nivel del origen ──────────────────────────────────────────────────────────────────────────

/**
 * Segundo tramo (NUA-D14; decisión de Dirección del 2026-11-19): lo cargado a mano es de quien lo cargó, así que no hay un
 * nivel «De otro profesional». «Verificado» es la tabla oficial, lo que Administración sumó al canon o lo que certificó.
 */
export const NivelDeOrigenSchema = z.enum(['VERIFIED', 'YOURS', 'UNVERIFIED']);
export type NivelDeOrigen = z.infer<typeof NivelDeOrigenSchema>;

/** Lo que va a la vista en la fila. Lo importado y lo de demostración no suman nada: ya dicen su origen. */
export const ETIQUETA_DEL_NIVEL: Readonly<Record<NivelDeOrigen, string | null>> = {
  VERIFIED: 'Verificado',
  YOURS: 'Tuyo',
  UNVERIFIED: null,
};

/** Lo que hace falta para decir el nivel: la procedencia, el proveedor de la fuente y si está verificado por Administración. */
export interface DatosDelNivel {
  readonly provenance: 'BE_SYNTHETIC_SEED' | 'PROFESSIONAL_MANUAL' | 'CONTROLLED_IMPORT';
  readonly externalProvider: string | null;
  readonly loadedBy: 'YOU' | 'ANOTHER_PROFESSIONAL' | null;
  /** Administración certificó la versión vigente (NUA-04) o lo sumó al canon (NUA-D16). */
  readonly certified: boolean;
}

/**
 * El nivel del origen de un alimento (NUA-03). Lo verificado por Administración vale más que quién lo cargó: un alimento
 * propio certificado es «Verificado».
 */
export function nivelDeOrigen(d: DatosDelNivel): NivelDeOrigen {
  if (d.certified || d.externalProvider === 'USDA_FDC_SR_LEGACY') return 'VERIFIED';
  return d.provenance === 'PROFESSIONAL_MANUAL' ? 'YOURS' : 'UNVERIFIED';
}

/** NUA-04: la certificación de la versión vigente, con la fuente que citó Administración. */
export const CertificacionDeAlimentoSchema = z.strictObject({ source: z.string().min(1).max(500), certifiedAt: Instante });
export type CertificacionDeAlimento = z.infer<typeof CertificacionDeAlimentoSchema>;

// ─── Los nombres parecidos (NUA-D15) ──────────────────────────────────────────────────────────────

/**
 * NUA-D15 · la clave con la que Administración agrupa las cargas a mano de nombre parecido: sin tildes, en minúsculas, con
 * un espacio entre palabras y sin plurales simples (cada palabra de más de tres letras pierde la «s» final después de una
 * vocal —«milanesas», «huevos»— o la «es» final después de l, n, r, d, j o z —«panes», «limones»—). No es una búsqueda:
 * agrupa lo que se escribió casi igual, para contar cuántos profesionales cargaron algo así.
 */
export function claveDeNombreParecido(nombre: string): string {
  const palabras = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  return palabras
    .map((p) => {
      if (p.length <= 3) return p;
      if (/[lnrdjz]es$/.test(p)) return p.slice(0, -2);
      if (/[aeiou]s$/.test(p)) return p.slice(0, -1);
      return p;
    })
    .join(' ');
}

// ─── Los textos ───────────────────────────────────────────────────────────────────────────────────

export const COPY_ALIMENTOS = {
  grupo: 'Grupo',
  sinGrupo: 'Sin grupo',
  elegirGrupo: 'Elegí su grupo',
  /**
   * NUA-D14 y D15: lo cargado a mano es de quien lo carga, y Administración lo ve con su nombre (para sumar al catálogo
   * verificado lo que cargan varios). El formulario lo dice a la vista. NUA-D07 (ratificada por Dirección el 19/11): el
   * aviso de no escribir datos de personas en el nombre se mantiene, porque lo lee Administración.
   */
  esTuyo:
    'Lo ves solo vos. Administración lo puede ver, con tu nombre de profesional, para sumar al catálogo verificado lo que cargan varios profesionales; nunca ve a quién se lo indicaste. No escribas datos de personas en el nombre.',
  /** NUA-D16: un nombre igual al de uno verificado, antes de crear el propio. */
  yaExisteVerificado: (nombre: string) => `Ya existe «${nombre}» verificado: ¿usarlo?`,
  usarElVerificado: 'Usar el verificado',
  crearElMioIgual: 'Crear el mío igual',
  verificado: 'Verificado',
  tuyo: 'Tuyo',
  certificadoCon: (fuente: string) => `Verificado por Administración. Fuente: ${fuente}`,
  /** NUA-D16: si lo propio tiene un equivalente verificado, el buscador lo sugiere justo antes, con su composición. */
  hayVersionVerificada: 'Hay una versión verificada de este alimento',
  equivalenteSugerido: (de: string) => `Hay una versión verificada de «${de}»`,
  tieneEquivalente: (verificado: string) => `Hay una versión verificada de este alimento: «${verificado}».`,
  /** NUA-02: la marca discreta de lo retirado, donde ya se cita. */
  retirado: 'retirado',
  retiradoEnPalabras: 'Este alimento se retiró del catálogo: lo que ya lo cita lo conserva, pero no se puede sumar de nuevo.',
  retiradoParaActivar: 'Se retiró del catálogo: cambialo por otro antes de activar.',
  /** NUA-08: las medidas caseras, en el formulario del alimento y en la cantidad del ítem. */
  medidasCaseras: 'Medidas caseras',
  medidasCaserasAyuda: 'Si querés, cuánto pesa cada una. En el plan se elige la cantidad con ellas, y la cuenta se hace igual en gramos.',
  medidaCaseraCampo: (una: string, ml: boolean) => `1 ${una}, en ${ml ? 'ml' : 'g'}`,
  /** «= 135 g · 1 taza = 90 g»: la cantidad en gramos y la equivalencia de la medida, a la vista aunque el selector se corte. */
  equivaleA: (cantidad: string, equivalencia?: string) => (equivalencia ? `= ${cantidad} · ${equivalencia}` : `= ${cantidad}`),
  laPersonaVeGramos: 'La persona ve la cantidad en gramos.',
} as const;

/** «Mis alimentos» (`/pro/foods`): corregir (NUA-01) y retirar (NUA-02) lo que el profesional cargó a mano. */
export const COPY_MIS_ALIMENTOS = {
  titulo: 'Tus alimentos cargados a mano',
  queEs:
    'Si uno tiene un error, corregilo: nace una versión nueva, y los planes activados, las recetas y los registros conservan la versión que citaban. Si ya no lo querés usar, retiralo: deja de aparecer en el buscador, y lo que ya lo cita lo sigue mostrando. Son tuyos: no los ve ningún otro profesional.',
  sinAlimentos: 'Todavía no cargaste alimentos a mano. Se cargan desde una opción del plan, con «Crearlo a mano».',
  soloNutricion: 'Los alimentos son del área de Nutrición, y tu cuenta no la tiene habilitada.',
  version: (n: number) => `Versión ${n}`,
  cadaCien: (ml: boolean) => (ml ? 'cada 100 ml' : 'cada 100 g'),
  retirado: 'Retirado',
  retiradoNota: 'No aparece en tu buscador; los planes, las recetas y los registros que lo citan lo conservan.',
  sinRevisar: 'Sin revisión de Administración',
  verificado: (fuente: string) => `Verificado por Administración. Fuente: ${fuente}`,
  equivalente: (de: string) => `Hay una versión verificada de este alimento, «${de}»: el buscador te la sugiere antes del tuyo.`,
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
  dondeSeCorrigen: 'Los que cargaste a mano se corrigen o se retiran en',
  irAMisAlimentos: 'Mis alimentos',
  enElCuadro: '¿Uno tuyo tiene un error? Corregilo en',
  enOtraPestana: 'Mis alimentos (en otra pestaña)',
} as const;

/**
 * La revisión de Administración (`/admin/foods`, NUA-04; segundo tramo, NUA-D15 y D16): todas las cargas a mano, con el
 * nombre del profesional que las cargó, agrupadas por nombre parecido; y «Sumar al canon». Nunca a quién se le indicó.
 */
export const COPY_REVISION_DE_ALIMENTOS = {
  titulo: 'Alimentos cargados a mano',
  queVe:
    'Lo que los profesionales de Nutrición cargaron a mano: el nombre, los valores cada 100 g, el grupo y quién lo cargó, por su nombre de profesional. Nunca a quién se lo indicó ni sus planes. Cada carga es solo de quien la hizo; lo que conviene a todos se suma al canon.',
  vistas: { PARECIDOS: 'Parecidos', TODOS: 'Uno por uno' },
  filtros: { TODOS: 'Todos', PENDING: 'Sin revisar', CERTIFIED: 'Verificados', EQUIVALENT: 'Equivalentes' },
  buscar: 'Buscar por nombre',
  sinAlimentos: 'No hay alimentos cargados a mano con ese filtro.',
  cargadoPor: (nombre: string) => `Lo cargó ${nombre}`,
  /** NUA-D15: cuántos profesionales distintos cargaron algo así. */
  cuantosCargaron: (n: number, nombre: string) => (n === 1 ? `1 profesional cargó «${nombre}»` : `${n} profesionales cargaron «${nombre}»`),
  tambienComo: (nombres: string) => `También como: ${nombres}.`,
  cargas: (n: number) => (n === 1 ? '1 carga' : `${n} cargas`),
  sinParecidos: 'No hay cargas a mano con ese nombre.',
  revisar: 'Revisar',
  revisarTitulo: (nombre: string) => `Revisar «${nombre}»`,
  decisiones: { CERTIFY: 'Verificarlo con una fuente', EQUIVALENT: 'Es equivalente a uno verificado', CLEAR: 'Quitar lo decidido' },
  fuente: 'Fuente',
  fuenteAyuda: 'La tabla, la publicación o el rótulo de donde salen estos valores, con lo que haga falta para encontrarlo (edición, código o página).',
  faltaLaFuente: 'Falta la fuente.',
  buscarVerificado: 'Buscar entre los verificados (la tabla oficial y el canon)',
  faltaElEquivalente: 'Elegí el alimento verificado equivalente.',
  elegido: (nombre: string) => `Elegido: «${nombre}»`,
  ningunVerificado: 'Ningún alimento verificado coincide.',
  confirmar: 'Guardar la decisión',
  guardando: 'Guardando…',
  queQueda: {
    CERTIFY: 'Para quien lo cargó, el buscador va a decir «Verificado», con esta fuente, para esta versión. Si lo corrige, la versión nueva vuelve a esperar revisión.',
    EQUIVALENT: 'El buscador de quien lo cargó le va a sugerir el verificado justo antes del suyo. Lo suyo no cambia en sus planes ni en sus registros.',
    CLEAR: 'Vuelve a «Sin revisar». Los planes que ya lo citan no cambian.',
  },
  estado: { PENDING: 'Sin revisar', CERTIFIED: 'Verificado', EQUIVALENT: 'Equivalente' },
  decidido: (nombre: string) => `Quedó guardada la decisión sobre «${nombre}».`,
  cambioMientras: 'Este alimento cambió desde que lo abriste (quien lo cargó lo corrigió). Volvé a abrirlo para revisar la versión de ahora.',
  /** NUA-D16: sumar al canon. */
  sumarAlCanon: 'Sumar al canon',
  sumarAlCanonTitulo: (nombre: string) => `Sumar «${nombre}» al canon`,
  sumarAlCanonQueEs:
    'Nace un alimento verificado de BE, que ven todos los profesionales de Nutrición. Parte de los valores de la carga que elijas; corregilos si hace falta. La fuente es obligatoria.',
  partirDe: 'Partir de los valores de',
  marcarEquivalentes: 'Marcar las cargas de este grupo como equivalentes del nuevo (a cada autor, su buscador le sugiere el verificado; lo suyo no cambia)',
  sumado: (nombre: string, n: number) => (n === 0 ? `«${nombre}» quedó en el canon.` : `«${nombre}» quedó en el canon, y ${n === 1 ? '1 carga quedó marcada' : `${n} cargas quedaron marcadas`} como equivalente.`),
  sumando: 'Sumando…',
} as const;
