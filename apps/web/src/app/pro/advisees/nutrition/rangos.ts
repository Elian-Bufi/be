/**
 * ED-31 y ED-34 (WP-EDITORES-PROFESIONAL) · Los totales de cada opción y los rangos de Nutrición, sin React.
 *
 * - **La cuenta es la del dominio** (`calcularNutrientes`, `SUM_SOURCE_PER_100G_V1`): gramos ÷ 100 × lo que trae la
 *   fuente cada 100 g, con las kcal de la fuente y nunca 4/4/9. El estado crudo o cocido no cambia la cuenta: sale del
 *   alimento elegido del catálogo.
 * - **Lo que falta es «Sin dato», nunca cero** (TEST-EDP-029): un ítem sin cantidad, sin composición conocida, en
 *   unidades o con un nutriente que la fuente no trae deja ese nutriente sin total, y se nombra qué lo impide.
 * - **El rango de una comida** va de la opción que menos aporta a la que más, nutriente por nutriente. Dos alternativas
 *   de la misma comida nunca se suman entre sí.
 * - **El rango del día (DJ-4)** suma el mínimo de cada comida y el máximo de cada comida: «El día va de 1.850 a 2.420 kcal
 *   según lo que elija». Ninguna opción viene elegida. Un hueco en cualquier comida deja el día «Sin dato» y lo nombra
 *   (TEST-EDP-032).
 * - **Es una estimación del editor** (§8.2): hasta API-PLN-01, los totales se calculan solo en el website, con la
 *   composición de la versión disponible de cada alimento. Al guardar no viaja nada de esto, y la persona no lo ve.
 * - Sin «%» y sin semáforo: se describe, no se califica (B05; `copy-nutricion.ts`).
 */
import { calcularNutrientes, decimalExacto, nutrienteParaMostrar, pestanaDeLaOpcion, sumaExacta, type ComposicionParaCalcular, type EstructuraDePlanEntrada } from '@be/domain';

type Estructura = EstructuraDePlanEntrada['dayTypes'];
type Dia = Estructura[number];
type Comida = Dia['meals'][number];
type Opcion = Comida['options'][number];

/** Los nutrientes de la tabla y de la línea de cada opción, en su orden: kcal, proteínas, carbohidratos y grasas. */
export const NUTRIENTES_DEL_RANGO = ['energyKcal', 'proteinG', 'carbohydrateG', 'fatG'] as const;
export type NutrienteDelRango = (typeof NUTRIENTES_DEL_RANGO)[number];

/** Lo que se sabe de la composición de cada alimento, por su identidad en el catálogo. */
export type ComposicionConocida = ComposicionParaCalcular | 'leyendo' | 'sin-composicion';
export type Composiciones = ReadonlyMap<string, ComposicionConocida>;

/**
 * Por qué un nutriente no tiene total:
 * - los del dominio (`SIN_CANTIDAD`, `SIN_COMPOSICION`, `SIN_DATO_DEL_NUTRIENTE`), y `EN_UNIDADES` u `OTRA_UNIDAD` cuando
 *   la unidad no tiene equivalencia;
 * - `LEYENDO`: la composición del alimento todavía no llegó;
 * - `RECETA_SIN_GUARDAR`: una opción de receta se arma en el servidor al guardar (DL-119);
 * - `SIN_ALIMENTOS`, `SIN_OPCIONES` y `SIN_COMIDAS`: no hay nada que sumar.
 */
export type PorQueFalta =
  | 'SIN_CANTIDAD'
  | 'SIN_COMPOSICION'
  | 'SIN_DATO_DEL_NUTRIENTE'
  | 'EN_UNIDADES'
  | 'OTRA_UNIDAD'
  | 'LEYENDO'
  | 'RECETA_SIN_GUARDAR'
  | 'SIN_ALIMENTOS'
  | 'SIN_OPCIONES'
  | 'SIN_COMIDAS';

export interface QueFalta {
  /** Dónde: «Almuerzo · Opción 2». Vacío dentro de una opción. */
  readonly donde: string;
  /** Qué: el alimento o la receta; vacío si falta todo. */
  readonly nombre: string;
  readonly motivo: PorQueFalta;
}

export interface ValorDeLaOpcion {
  /** El total exacto, en decimal con punto; `null` si algo lo impide. */
  readonly exacto: string | null;
  readonly faltan: readonly QueFalta[];
}
export type TotalDeLaOpcion = Readonly<Record<NutrienteDelRango, ValorDeLaOpcion>>;

export type Rango = { readonly tipo: 'rango'; readonly min: string; readonly max: string } | { readonly tipo: 'sin-dato'; readonly faltan: readonly QueFalta[] };
export type RangoPorNutriente = Readonly<Record<NutrienteDelRango, Rango>>;

/** Un ítem, como lo usa la cuenta: el de la opción o, en una de receta, el que armó la API al guardar. */
export interface ItemParaElTotal {
  readonly catalogItemId: string;
  readonly quantity: { readonly value: number; readonly unit: 'g' | 'ml' | 'unit' } | null;
  readonly nombre: string;
}

const porNutriente = <T>(f: (n: NutrienteDelRango) => T): Readonly<Record<NutrienteDelRango, T>> =>
  Object.fromEntries(NUTRIENTES_DEL_RANGO.map((n) => [n, f(n)])) as Record<NutrienteDelRango, T>;

const sinRepetir = (faltan: readonly QueFalta[]): QueFalta[] => {
  const vistos = new Set<string>();
  return faltan.filter((f) => {
    const clave = `${f.donde}|${f.nombre}|${f.motivo}`;
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
};

const todoFalta = (falta: QueFalta): TotalDeLaOpcion => porNutriente(() => ({ exacto: null, faltan: [falta] }));

/**
 * El total de una opción, nutriente por nutriente. `items` en `null`: una opción de receta que todavía no se guardó (sus
 * ítems los arma la API). `receta`: su nombre, para decirlo.
 */
export function totalDeLaOpcion(items: readonly ItemParaElTotal[] | null, composiciones: Composiciones, receta: string | null = null): TotalDeLaOpcion {
  if (items === null) return todoFalta({ donde: '', nombre: receta ?? '', motivo: 'RECETA_SIN_GUARDAR' });
  if (items.length === 0) return todoFalta({ donde: '', nombre: '', motivo: 'SIN_ALIMENTOS' });
  const conocida = (id: string) => composiciones.get(id);
  const resultado = calcularNutrientes(
    items.map((it, n) => {
      const c = conocida(it.catalogItemId);
      // Una cantidad que no se entiende (NaN mientras se escribe) no es un número: queda sin cantidad, nunca cero.
      const cantidad = it.quantity && Number.isFinite(it.quantity.value) && it.quantity.value >= 0 ? it.quantity : null;
      return { clave: String(n), cantidad, composicion: c && typeof c === 'object' ? c : null };
    }),
  );
  return porNutriente((nutriente) => {
    const v = resultado.nutrientes[nutriente];
    const faltan = v.faltan.map((f): QueFalta => {
      const it = items[Number(f.clave)]!;
      const c = conocida(it.catalogItemId);
      const motivo: PorQueFalta =
        f.motivo === 'SIN_COMPOSICION' && c === 'leyendo'
          ? 'LEYENDO'
          : f.motivo === 'UNIDAD_SIN_EQUIVALENCIA'
            ? it.quantity?.unit === 'unit'
              ? 'EN_UNIDADES'
              : 'OTRA_UNIDAD'
            : f.motivo;
      return { donde: '', nombre: it.nombre, motivo };
    });
    return { exacto: v.exacto, faltan: sinRepetir(faltan) };
  });
}

/** Compara dos decimales exactos: negativo si `a` es menor. */
function comparar(a: string, b: string): number {
  const x = decimalExacto(a)!;
  const y = decimalExacto(b)!;
  const d = x.n * y.d - y.n * x.d;
  return d < 0n ? -1 : d > 0n ? 1 : 0;
}

/**
 * El rango de una comida: de la opción que menos aporta a la que más, por nutriente. Las alternativas no se suman. Sin
 * opciones, o con una opción sin total en ese nutriente, es «Sin dato» y dice dónde.
 */
export function rangoDeLaComida(opciones: readonly { readonly nombre: string; readonly total: TotalDeLaOpcion }[], comida: string): RangoPorNutriente {
  return porNutriente((n): Rango => {
    if (opciones.length === 0) return { tipo: 'sin-dato', faltan: [{ donde: comida, nombre: '', motivo: 'SIN_OPCIONES' }] };
    const faltan = opciones.flatMap((o) => o.total[n].faltan.map((f) => ({ ...f, donde: `${comida} · ${o.nombre}` })));
    if (opciones.some((o) => o.total[n].exacto === null)) return { tipo: 'sin-dato', faltan: sinRepetir(faltan) };
    const valores = opciones.map((o) => o.total[n].exacto!);
    const orden = [...valores].sort(comparar);
    return { tipo: 'rango', min: orden[0]!, max: orden[orden.length - 1]! };
  });
}

/**
 * El rango del día (DJ-4): la suma de los mínimos y la de los máximos de cada comida. Nunca suma dos alternativas de la
 * misma comida. Un hueco en cualquier comida deja el día sin dato, con lo que lo impide.
 */
export function rangoDelDia(comidas: readonly RangoPorNutriente[], dia: string): RangoPorNutriente {
  return porNutriente((n): Rango => {
    if (comidas.length === 0) return { tipo: 'sin-dato', faltan: [{ donde: dia, nombre: '', motivo: 'SIN_COMIDAS' }] };
    const huecos = comidas.flatMap((c) => (c[n].tipo === 'sin-dato' ? c[n].faltan : []));
    if (huecos.length > 0) return { tipo: 'sin-dato', faltan: sinRepetir(huecos) };
    const rangos = comidas.map((c) => c[n] as Extract<Rango, { tipo: 'rango' }>);
    return { tipo: 'rango', min: sumaExacta(rangos.map((r) => r.min)), max: sumaExacta(rangos.map((r) => r.max)) };
  });
}

/** El nombre de una comida como se dice en el editor. */
export const nombreDeLaComida = (m: Pick<Comida, 'label'>, j: number): string => m.label.trim() || `Comida ${j + 1}`;
/** El nombre de un día tipo como se dice en el editor. */
export const nombreDelDiaTipo = (d: Pick<Dia, 'label'>, i: number): string => d.label.trim() || `Día tipo ${i + 1}`;

/** Los ítems de una opción para la cuenta: los suyos o, si es de receta, los que armó la API (o `null`, sin guardar). */
export function itemsParaElTotal(opcion: Opcion, nombres: Readonly<Record<string, string>>, deLaReceta: (optionId: string | undefined) => readonly { readonly catalogItemId: string; readonly name: string; readonly quantity: ItemParaElTotal['quantity'] }[] | null): readonly ItemParaElTotal[] | null {
  if (opcion.recipeVersionId) return deLaReceta(opcion.optionId)?.map((it) => ({ catalogItemId: it.catalogItemId, quantity: it.quantity, nombre: it.name || nombres[it.catalogItemId] || 'Elemento' })) ?? null;
  return opcion.items.map((it) => ({ catalogItemId: it.catalogItemId, quantity: it.quantity, nombre: nombres[it.catalogItemId] ?? 'Elemento' }));
}

export interface RangosDelDia {
  readonly comidas: readonly { readonly nombre: string; readonly opciones: readonly { readonly nombre: string; readonly total: TotalDeLaOpcion }[]; readonly rango: RangoPorNutriente }[];
  readonly dia: RangoPorNutriente;
}

/** Todo «Rangos y totales» de un día tipo: cada opción, cada comida y el día. */
export function rangosDelDia(
  dia: Dia,
  i: number,
  composiciones: Composiciones,
  nombres: Readonly<Record<string, string>>,
  deLaReceta: Parameters<typeof itemsParaElTotal>[2],
  nombreDeLaReceta: (recipeVersionId: string) => string | null = () => null,
): RangosDelDia {
  const comidas = dia.meals.map((m, j) => {
    const nombre = nombreDeLaComida(m, j);
    const opciones = m.options.map((o, k) => ({ nombre: pestanaDeLaOpcion(o, k), total: totalDeLaOpcion(itemsParaElTotal(o, nombres, deLaReceta), composiciones, o.recipeVersionId ? (nombreDeLaReceta(o.recipeVersionId) ?? o.label) : null) }));
    return { nombre, opciones, rango: rangoDeLaComida(opciones, nombre) };
  });
  return { comidas, dia: rangoDelDia(comidas.map((c) => c.rango), nombreDelDiaTipo(dia, i)) };
}

/** Los alimentos de la estructura cuya composición todavía no se conoce, una vez cada uno, con su nombre. */
export function alimentosSinComposicion(items: readonly ItemParaElTotal[], composiciones: Composiciones): readonly { readonly catalogItemId: string; readonly nombre: string }[] {
  const vistos = new Set<string>();
  return items.filter((it) => {
    if (composiciones.has(it.catalogItemId) || vistos.has(it.catalogItemId)) return false;
    vistos.add(it.catalogItemId);
    return true;
  });
}

// ─── Los textos ─────────────────────────────────────────────────────────────────────────────────

const UNIDAD: Readonly<Record<NutrienteDelRango, string>> = { energyKcal: 'kcal', proteinG: 'g', carbohydrateG: 'g', fatG: 'g' };
const INICIAL: Readonly<Record<NutrienteDelRango, string>> = { energyKcal: '', proteinG: 'P', carbohydrateG: 'C', fatG: 'G' };

export const COPY_RANGOS = {
  pestana: 'Rangos y totales',
  estimacion: 'Estimación del editor, con la composición de cada alimento del catálogo. Al guardar no cambia nada, y la persona no la ve.',
  sinDato: 'Sin dato',
  tituloDelDia: (dia: string) => `El día · ${dia}`,
  tituloDeLasComidas: 'Por comida',
  comida: 'Comida',
  opciones: 'Opciones',
  nutriente: { energyKcal: 'kcal', proteinG: 'Proteínas (g)', carbohydrateG: 'Carbohidratos (g)', fatG: 'Grasas (g)' } as Readonly<Record<NutrienteDelRango, string>>,
  comoSeLee: 'Cada comida va de la opción que menos aporta a la que más. El día suma lo menos y lo más de cada comida: dos opciones de una misma comida nunca se suman.',
  leyendo: (n: number) => (n === 1 ? 'Leyendo la composición de 1 alimento…' : `Leyendo la composición de ${n} alimentos…`),
  sinDiaTipo: 'Elegí un día tipo para ver sus rangos.',
  elDia: 'El día',
  yMas: (n: number) => `y ${n} más`,
} as const;

const numeroDe = (exacto: string, n: NutrienteDelRango): string => nutrienteParaMostrar({ value: exacto }, n) ?? COPY_RANGOS.sinDato;

/** «Banana sin cantidad», «Leche en unidades: sin estimación», «Opción 2: sin alimentos». */
export function queFaltaEnPalabras(f: QueFalta): string {
  const quien = f.nombre;
  const texto: Readonly<Record<PorQueFalta, string>> = {
    SIN_CANTIDAD: `${quien} sin cantidad`,
    SIN_COMPOSICION: `${quien}: no se pudo leer su composición`,
    SIN_DATO_DEL_NUTRIENTE: `${quien}: la fuente no trae ese dato`,
    EN_UNIDADES: `${quien} en unidades: sin estimación`,
    OTRA_UNIDAD: `${quien}: la unidad no tiene equivalencia con su composición`,
    LEYENDO: `${quien}: leyendo su composición`,
    RECETA_SIN_GUARDAR: `${quien ? `${quien}: ` : ''}la receta se calcula cuando se guarda el plan`,
    SIN_ALIMENTOS: 'sin alimentos',
    SIN_OPCIONES: 'sin opciones',
    SIN_COMIDAS: 'sin comidas',
  };
  return f.donde ? `${f.donde}: ${texto[f.motivo]}` : texto[f.motivo];
}

/** «Sin dato: Almuerzo · Opción 2: Arroz sin cantidad; …». Hasta tres, y cuántos más. */
export function sinDatoEnPalabras(faltan: readonly QueFalta[]): string {
  const primeros = faltan.slice(0, 3).map(queFaltaEnPalabras);
  const resto = faltan.length - primeros.length;
  return `${COPY_RANGOS.sinDato}: ${primeros.join('; ')}${resto > 0 ? `; y ${resto} más` : ''}`;
}

/** La celda de la tabla: «de 420 a 610», «500» si es uno solo, o «Sin dato». Sin la unidad, que va en la columna. */
export function rangoEnUnaCelda(r: Rango, n: NutrienteDelRango): string {
  if (r.tipo === 'sin-dato') return COPY_RANGOS.sinDato;
  const min = numeroDe(r.min, n);
  const max = numeroDe(r.max, n);
  return min === max ? min : `de ${min} a ${max}`;
}

/** DJ-4: «El día va de 1.850 a 2.420 kcal según lo que elija», o por qué no hay. */
export function rangoDelDiaEnPalabras(r: Rango): string {
  if (r.tipo === 'sin-dato') return sinDatoEnPalabras(r.faltan);
  const min = numeroDe(r.min, 'energyKcal');
  const max = numeroDe(r.max, 'energyKcal');
  return min === max ? `El día suma ${min} kcal con cualquiera de sus opciones` : `El día va de ${min} a ${max} kcal según lo que elija`;
}

/** ED-31: «703 kcal · P 45 g · C 97 g · G 15 g»; lo que falta dice «Sin dato» en su lugar. */
export function totalEnUnaLinea(t: TotalDeLaOpcion): string {
  return NUTRIENTES_DEL_RANGO.map((n) => {
    const v = t[n];
    const valor = v.exacto === null ? COPY_RANGOS.sinDato : `${numeroDe(v.exacto, n)} ${UNIDAD[n]}`;
    return INICIAL[n] ? `${INICIAL[n]} ${valor}` : valor;
  }).join(' · ');
}

/** Lo que impide algún total de la opción, una vez cada cosa. */
export const faltantesDeLaOpcion = (t: TotalDeLaOpcion): readonly QueFalta[] => sinRepetir(NUTRIENTES_DEL_RANGO.flatMap((n) => t[n].faltan));
