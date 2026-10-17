import { Prisma } from '@prisma/client';
import { errores } from './errores';

/**
 * La búsqueda por nombre en los catálogos de alimentos (API-NUT-13 y su búsqueda) y de ejercicios (API-TRN-13 y su
 * búsqueda). Dos pedidos de Dirección del 2026-10-16 sobre el buscador; DL-098 es la parte de los proveedores externos.
 *
 * **Sin tildes ni mayúsculas.** «sandia» encuentra «Sandía», y «pina», «Piña». El profesional escribe rápido y sin
 * tildes; el catálogo las tiene. Se resuelve en la base con `translate` y `lower`, sin extensiones: cada letra marcada
 * pasa a su letra sin marca, en los dos lados de la comparación, y después todo a minúsculas.
 *
 * **El orden de las palabras, los plurales y los errores de tipeo (DL-139).** Lo escrito se parte en palabras y cada una
 * tiene que estar en el nombre:
 * - en cualquier orden: «pollo pechuga» encuentra «Pechuga de pollo». Los conectores cortos («de», «con», «y»…) no se
 *   exigen si hay otras palabras;
 * - en singular o en plural: «huevos» encuentra «Huevo»; «limones», «Limón»; «nueces», «Nuez»; y «nuez», «Nueces»
 *   (`formasDeLaPalabra`);
 * - con un error de tipeo, si así no aparece nada o casi nada: «manzna» encuentra «Manzana», y «sentadila»,
 *   «Sentadilla». Es la similitud de trigramas de `pg_trgm`, palabra por palabra, y solo completa la primera página.
 *
 * El orden del resultado: primero el nombre igual a lo escrito, después los que empiezan con la primera palabra, después
 * los que tienen todas las palabras y al final los parecidos. Dentro de cada grupo, como siempre: lo más nuevo primero.
 *
 * **Los nombres alternativos (DL-141, D-2).** Un ítem también se encuentra por sus nombres alternativos vigentes:
 * «aguacate» encuentra «Palta» y «bench press», «Press de banca». Cada nombre se mide solo, con las mismas reglas (todas
 * las palabras tienen que estar en un mismo nombre: «bench sentadilla» no mezcla dos), y el ítem va en el grupo de su
 * nombre que mejor coincide; a igual grupo gana el principal. La fila dice qué nombre alternativo coincidió
 * (`nombreAlternativo`), o `null` si fue el principal: lo muestran solo las operaciones que no lee la APK instalada.
 */
export const CON_MARCA = 'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇáàäâãéèëêíìïîóòöôõúùüûñç';
export const SIN_MARCA = 'AAAAAEEEEIIIIOOOOOUUUUNCaaaaaeeeeiiiiooooouuuunc';

/** La misma normalización en código: la de lo escrito, y la de las pruebas. */
export function sinMarcas(texto: string): string {
  let r = '';
  for (const ch of texto) {
    const i = CON_MARCA.indexOf(ch);
    r += i >= 0 ? SIN_MARCA[i] : ch;
  }
  return r.toLowerCase();
}

// ─── Las palabras ────────────────────────────────────────────────────────────────────────────────

/** Los conectores que no se exigen cuando hay otras palabras: «pollo con arroz» encuentra «Arroz con pollo». */
export const CONECTORES: ReadonlySet<string> = new Set(['a', 'al', 'con', 'de', 'del', 'e', 'el', 'en', 'la', 'las', 'lo', 'los', 'o', 'u', 'y']);

/**
 * Las formas con las que una palabra encuentra un nombre: ella misma, su singular y, si termina en «z», su plural. Son
 * reglas simples del plural castellano, sin diccionario, y ninguna deja menos de tres letras:
 * - sin la «s» final: «huevos» → «huevo», «dulces» → «dulce»;
 * - sin la «es» final: «limones» → «limon», «panes» → «pan» (no después de «c»: «dulces» no da «dulc»);
 * - «ces» → «z»: «nueces» → «nuez», «peces» → «pez»;
 * - «z» → «ces»: «nuez» → «nueces». Las demás palabras en singular ya encuentran su plural, porque están dentro de él.
 * Basta con que una forma esté dentro del nombre: una forma de más solo puede agregar resultados, nunca quitarlos.
 */
export function formasDeLaPalabra(palabra: string): readonly string[] {
  const formas = [palabra];
  const largo = palabra.length;
  if (palabra.endsWith('ces') && largo >= 5) formas.push(`${palabra.slice(0, -3)}z`);
  else if (palabra.endsWith('es') && largo >= 5) formas.push(palabra.slice(0, -2));
  if (palabra.endsWith('s') && largo >= 4) formas.push(palabra.slice(0, -1));
  if (palabra.endsWith('z') && largo >= 3) formas.push(`${palabra.slice(0, -1)}ces`);
  return [...new Set(formas)];
}

/** Una palabra buscada, normalizada, y las formas que la encuentran. */
export interface PalabraBuscada {
  readonly palabra: string;
  readonly formas: readonly string[];
}

/** Lo que se busca, ya leído. */
export interface Busqueda {
  /** Lo escrito, sin marcas, en minúsculas y con un espacio entre palabras: contra esto se mide el nombre «igual». */
  readonly texto: string;
  /** Las palabras que tienen que estar en el nombre, sin repetir. La primera es la del grupo «empieza con». */
  readonly palabras: readonly PalabraBuscada[];
}

/** Los signos pegados al principio o al final de una palabra («pollo,», «(bebible)»). Los del medio quedan («1,5%»). */
const SIGNOS_DE_LOS_BORDES = /^[.,;:!?¡¿()[\]{}"'«»]+|[.,;:!?¡¿()[\]{}"'«»]+$/g;

/**
 * Parte lo escrito en palabras, sin marcas y en minúsculas. Una palabra hecha solo de signos queda como está: se busca
 * tal cual. Sin nada escrito, `null`: el catálogo entero, como siempre.
 */
export function leerBusqueda(escrito: string): Busqueda | null {
  const sueltas = sinMarcas(escrito)
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p.replace(SIGNOS_DE_LOS_BORDES, '') || p);
  if (sueltas.length === 0) return null;
  const unicas = [...new Set(sueltas)];
  const conContenido = unicas.filter((p) => !CONECTORES.has(p));
  const palabras = (conContenido.length > 0 ? conContenido : unicas).map((palabra) => ({ palabra, formas: formasDeLaPalabra(palabra) }));
  return { texto: sueltas.join(' '), palabras };
}

// ─── Los errores de tipeo ────────────────────────────────────────────────────────────────────────

/**
 * Desde qué similitud una palabra con un error de tipeo encuentra el nombre: la similitud de trigramas de `pg_trgm`
 * entre la palabra buscada y la palabra (o las palabras seguidas) del nombre que mejor le corresponde
 * (`strict_word_similarity`), de 0 a 1. Ver DL-139: con qué casos se eligió.
 */
export const UMBRAL_DE_PARECIDO = 0.45;

/** Con menos resultados que estos, la primera página se completa con los parecidos: es el «casi nada» del pedido. */
export const POCOS_RESULTADOS = 3;

/**
 * Una palabra admite un error de tipeo si tiene al menos cuatro letras o números, y nada más. En una más corta, una
 * letra cambiada es otra palabra; y con un signo, «%» y «_» se buscan tal cual, nunca como comodines ni por parecido.
 */
export function admiteParecido(palabra: string): boolean {
  return palabra.length >= 4 && /^[a-z0-9]+$/.test(palabra);
}

// ─── El cursor ───────────────────────────────────────────────────────────────────────────────────

/**
 * El cursor del buscador: el último servido y su grupo (0 igual, 1 empieza con la primera palabra, 2 tiene todas las
 * palabras). Sigue siendo opaco: base64url de [momento, id, grupo]. Los parecidos no tienen cursor: van solo en la
 * primera página.
 */
export interface CursorDeBusqueda {
  readonly grupo: number;
  readonly momento: Date;
  readonly id: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function escribirCursorDeBusqueda(grupo: number, momento: Date, id: string): string {
  return Buffer.from(JSON.stringify([momento.toISOString(), id, grupo]), 'utf8').toString('base64url');
}

/**
 * Lee el cursor del buscador. Uno de antes de DL-139 ([momento, id]) se lee como del último grupo, que es la lista por
 * fecha: sin texto, sigue exactamente donde estaba. Uno inválido → 400 INVALID_CURSOR, como en las demás listas.
 */
export function leerCursorDeBusqueda(valor: unknown): CursorDeBusqueda | null {
  if (valor === undefined) return null;
  if (typeof valor !== 'string') throw errores.cursorInvalido();
  try {
    const leido: unknown = JSON.parse(Buffer.from(valor, 'base64url').toString('utf8'));
    if (Array.isArray(leido) && (leido.length === 2 || leido.length === 3) && typeof leido[0] === 'string' && typeof leido[1] === 'string') {
      const grupo: unknown = leido.length === 3 ? leido[2] : 2;
      const momento = new Date(leido[0]);
      if ((grupo === 0 || grupo === 1 || grupo === 2) && !Number.isNaN(momento.getTime()) && UUID.test(leido[1])) return { grupo, momento, id: leido[1] };
    }
  } catch {
    // cae al error neutral
  }
  throw errores.cursorInvalido();
}

// ─── La consulta ─────────────────────────────────────────────────────────────────────────────────

/**
 * Un catálogo versionado donde se busca: la versión se llama `v` y tiene `nombre`, `momento_de_registro` e `id`; las
 * filas devuelven `versionId` y `momentoDeRegistro`, con los que se arma el cursor.
 */
export interface CatalogoBuscable {
  /** Las columnas de cada fila. */
  readonly columnas: Prisma.Sql;
  /** La versión `v` y lo que haga falta para decidir qué ve quien busca. */
  readonly tablas: Prisma.Sql;
  /** Lo que puede ver quien busca: la versión vigente, disponible y de su ámbito. */
  readonly visibles: Prisma.Sql;
  /**
   * DL-141 D-2: los nombres alternativos vigentes del ítem de la fila, como una consulta que devuelve la columna
   * `"nombre"` y puede usar los alias de `tablas`. Sin esto, se busca solo en el nombre principal.
   */
  readonly nombresAlternativos?: Prisma.Sql;
}

/** Lo que el buscador suma a cada fila: el nombre alternativo que coincidió, o `null` si fue el principal (DL-141). */
export interface ConNombreAlternativo {
  readonly nombreAlternativo: string | null;
}

export interface ResultadoDeBusqueda<F> {
  readonly filas: readonly F[];
  readonly page: { readonly limit: number; readonly nextCursor: string | null; readonly hasMore: boolean };
}

/** Un nombre como se compara: sin marcas, en minúsculas y con un espacio entre palabras. */
const comparable = (nombre: Prisma.Sql): Prisma.Sql => Prisma.sql`btrim(regexp_replace(lower(translate(${nombre}, ${CON_MARCA}, ${SIN_MARCA})), '[[:space:]]+', ' ', 'g'))`;

/**
 * Los nombres de la fila contra los que se compara, cada uno ya comparable en `cmp."nombre"`: el principal (orden 0, sin
 * alternativo) y los alternativos vigentes (orden 1, con el nombre tal como está guardado en `cmp."alternativo"`).
 */
function nombresDeLaFila(catalogo: CatalogoBuscable): Prisma.Sql {
  const principal = Prisma.sql`SELECT NULL::text AS "alternativo", 0 AS "orden", ${comparable(Prisma.sql`v."nombre"`)} AS "nombre"`;
  if (!catalogo.nombresAlternativos) return Prisma.sql`(${principal})`;
  return Prisma.sql`(${principal} UNION ALL SELECT a."nombre", 1, ${comparable(Prisma.sql`a."nombre"`)} FROM (${catalogo.nombresAlternativos}) a)`;
}

/** Para LIKE: `\`, `%` y `_` se buscan como letras. */
const literal = (texto: string): string => texto.replace(/[\\%_]/g, (c) => `\\${c}`);

/** La palabra está dentro de un nombre comparable (`cmp."nombre"`), en alguna de sus formas. */
function contiene(p: PalabraBuscada): Prisma.Sql {
  return Prisma.sql`(${Prisma.join(
    p.formas.map((f) => Prisma.sql`cmp."nombre" LIKE ${`%${literal(f)}%`}`),
    ' OR ',
  )})`;
}

function todasLasPalabras(b: Busqueda): Prisma.Sql {
  return Prisma.join(b.palabras.map(contiene), ' AND ');
}

/** El grupo de cada nombre: 0 igual a lo escrito (en singular o en plural), 1 empieza con la primera palabra, 2 el resto. */
function grupo(b: Busqueda): Prisma.Sql {
  const iguales = [...formasDeLaPalabra(b.texto)];
  const comienzos = (b.palabras[0]?.formas ?? []).map((f) => `${literal(f)}%`);
  return Prisma.sql`CASE WHEN cmp."nombre" = ANY(${iguales}::text[]) THEN 0 WHEN cmp."nombre" LIKE ANY(${comienzos}::text[]) THEN 1 ELSE 2 END`;
}

/**
 * Cuánto se parece el nombre a una palabra: 1 si la tiene; si no, la mayor similitud de trigramas entre sus formas que
 * admiten parecido («manznas» se mide también como «manzna»); 0 si ninguna lo admite.
 */
function parecido(p: PalabraBuscada): Prisma.Sql {
  const formas = p.formas.filter(admiteParecido);
  const sinTenerla =
    formas.length === 0 ? Prisma.sql`0` : Prisma.sql`GREATEST(${Prisma.join(formas.map((f) => Prisma.sql`strict_word_similarity(${f}, cmp."nombre")`))})`;
  return Prisma.sql`CASE WHEN ${contiene(p)} THEN 1 ELSE ${sinTenerla} END`;
}

/**
 * Busca por nombre en un catálogo, con la paginación por cursor de siempre (`{ data, page }`):
 * 1. **Los que tienen todas las palabras** en alguno de sus nombres, por grupo y, dentro de cada grupo, lo más nuevo
 *    primero. El cursor lleva el grupo del último servido, así que las páginas siguen el mismo orden.
 * 2. **Los parecidos**, solo en la primera página y solo si la búsqueda exacta trajo menos de `POCOS_RESULTADOS` y no
 *    tiene más páginas: completan la página, del más parecido al menos parecido, y no tienen página siguiente. Cada
 *    palabra tiene que estar en un mismo nombre o parecerse a una de sus palabras al menos `UMBRAL_DE_PARECIDO`.
 * Cada fila dice qué nombre alternativo coincidió (DL-141), o `null` si fue el principal.
 */
export async function buscarEnCatalogo<F extends { readonly versionId: string; readonly momentoDeRegistro: Date }>(
  cliente: Pick<Prisma.TransactionClient, '$queryRaw'>,
  catalogo: CatalogoBuscable,
  busqueda: Busqueda | null,
  limite: number,
  cursor: CursorDeBusqueda | null,
): Promise<ResultadoDeBusqueda<F & ConNombreAlternativo>> {
  const despuesDelCursor =
    cursor === null
      ? Prisma.sql`TRUE`
      : Prisma.sql`(grp."grupo" > ${cursor.grupo}::int OR (grp."grupo" = ${cursor.grupo}::int AND (v."momento_de_registro", v."id") < (${cursor.momento}, ${cursor.id}::uuid)))`;
  const nombres = nombresDeLaFila(catalogo);
  // El nombre de la fila que mejor coincide: el de menor grupo y, a igual grupo, el principal. Sin texto, todo en el último
  // grupo y sin alternativo.
  const mejorNombre =
    busqueda === null
      ? Prisma.sql`(SELECT 2 AS "grupo", NULL::text AS "alternativo")`
      : Prisma.sql`(SELECT ${grupo(busqueda)} AS "grupo", cmp."alternativo"
           FROM ${nombres} cmp
          WHERE ${todasLasPalabras(busqueda)}
          ORDER BY 1, cmp."orden", cmp."alternativo"
          LIMIT 1)`;
  const exactas = await cliente.$queryRaw<(F & ConNombreAlternativo & { grupo: number })[]>`
    SELECT ${catalogo.columnas}, grp."grupo", grp."alternativo" AS "nombreAlternativo"
      FROM ${catalogo.tablas}
     CROSS JOIN LATERAL ${mejorNombre} grp
     WHERE ${catalogo.visibles}
       AND ${despuesDelCursor}
     ORDER BY grp."grupo", v."momento_de_registro" DESC, v."id" DESC
     LIMIT ${limite + 1}`;
  const hayMas = exactas.length > limite;
  const pagina = exactas.slice(0, limite);
  const ultima = pagina[pagina.length - 1];

  let parecidas: (F & ConNombreAlternativo)[] = [];
  if (busqueda !== null && cursor === null && !hayMas && pagina.length < Math.min(POCOS_RESULTADOS, limite) && busqueda.palabras.some((p) => p.formas.some(admiteParecido))) {
    // El nombre más parecido de cada fila; las que ya trajo la búsqueda exacta (por cualquiera de sus nombres) no vuelven.
    parecidas = await cliente.$queryRaw<(F & ConNombreAlternativo)[]>`
      SELECT ${catalogo.columnas}, par."alternativo" AS "nombreAlternativo"
        FROM ${catalogo.tablas}
       CROSS JOIN LATERAL (
         SELECT cmp."alternativo", (SELECT sum(u) FROM unnest(pts."puntajes") AS u) AS "suma"
           FROM ${nombres} cmp
          CROSS JOIN LATERAL (SELECT ARRAY[${Prisma.join(busqueda.palabras.map(parecido))}]::real[] AS "puntajes") pts
          WHERE (SELECT min(u) FROM unnest(pts."puntajes") AS u) >= ${UMBRAL_DE_PARECIDO}::real
          ORDER BY 2 DESC, cmp."orden", cmp."alternativo"
          LIMIT 1) par
       WHERE ${catalogo.visibles}
         AND NOT EXISTS (SELECT 1 FROM ${nombres} cmp WHERE ${todasLasPalabras(busqueda)})
       ORDER BY par."suma" DESC, v."momento_de_registro" DESC, v."id" DESC
       LIMIT ${limite - pagina.length}`;
  }

  return {
    filas: [...pagina, ...parecidas],
    page: { limit: limite, nextCursor: hayMas && ultima ? escribirCursorDeBusqueda(ultima.grupo, ultima.momentoDeRegistro, ultima.versionId) : null, hasMore: hayMas },
  };
}
