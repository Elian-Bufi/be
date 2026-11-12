/**
 * ED-07 · Lo que cambia frente a la vigente, para «Antes de activar» (WP-EDITORES-PROFESIONAL; V3 V-02).
 *
 * Los contadores («2 modificados · 1 agregado · 0 quitados») y la lista salen de la diferencia entre las dos estructuras,
 * nunca de un texto: cada renglón es una parte que se agregó, se quitó o cambió. Las partes se reconocen por su
 * identificador, que la versión nueva conserva de la vigente (REG-06-111); una parte sin identificador es nueva. Nada
 * califica: se dice qué cambió, no si está bien (TEST-PRJ-009).
 *
 * Sin React ni red.
 */
/**
 * Los identificadores que el servidor pone a cada parte de un plan. Es la misma lista que la de `es-lo-que-mande.ts` (una
 * prueba lo cuida): este módulo no importa a sus vecinos, para que la prueba lo cargue solo.
 */
export const IDENTIFICADORES_DE_LAS_PARTES: readonly string[] = ['blockId', 'microcycleId', 'sessionId', 'prescriptionId', 'dayTypeId', 'mealId', 'optionId', 'itemId'];

export interface CambiosFrenteALaVigente {
  readonly modificados: number;
  readonly agregados: number;
  readonly quitados: number;
  /** Un renglón por cambio, en orden: lo agregado, lo quitado y lo modificado. */
  readonly lista: readonly string[];
}

const uno = (n: number, singular: string, plural: string): string => `${n} ${n === 1 ? singular : plural}`;

/** «2 modificados · 1 agregado · 0 quitados». */
export function textoDeLosContadores(c: CambiosFrenteALaVigente): string {
  return [uno(c.modificados, 'modificado', 'modificados'), uno(c.agregados, 'agregado', 'agregados'), uno(c.quitados, 'quitado', 'quitados')].join(' · ');
}

// ─── El contenido de una parte, sin lo que no cambia lo indicado ────────────────────────────────────────────────

const vacio = (v: unknown): boolean => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

function contenido(x: unknown): unknown {
  if (Array.isArray(x)) return x.map(contenido);
  if (x === null || typeof x !== 'object') return x;
  const salida: Record<string, unknown> = {};
  for (const k of Object.keys(x).sort()) {
    const v = (x as Record<string, unknown>)[k];
    if (!IDENTIFICADORES_DE_LAS_PARTES.includes(k) && !vacio(v)) salida[k] = contenido(v);
  }
  return salida;
}

const igual = (a: unknown, b: unknown): boolean => JSON.stringify(contenido(a)) === JSON.stringify(contenido(b));

/** Un acumulador de cambios: cada renglón cuenta en su clase. */
function cambios() {
  const agregados: string[] = [];
  const quitados: string[] = [];
  const modificados: string[] = [];
  return {
    agregado: (t: string) => agregados.push(`+ ${t}`),
    quitado: (t: string) => quitados.push(`− ${t}`),
    modificado: (t: string) => modificados.push(t),
    resultado: (): CambiosFrenteALaVigente => ({ modificados: modificados.length, agregados: agregados.length, quitados: quitados.length, lista: [...agregados, ...quitados, ...modificados] }),
  };
}

/** Las partes de una lista, por su identificador: las que no lo tienen quedan aparte (son nuevas). */
function porIdentificador<T>(partes: readonly T[], id: (p: T) => string | undefined): Map<string, T> {
  const m = new Map<string, T>();
  for (const p of partes) {
    const clave = id(p);
    if (clave) m.set(clave, p);
  }
  return m;
}

/** Compara dos listas de partes: lo agregado, lo quitado y, de lo que está en las dos, lo que cambió (`alComparar`). */
function compararListas<T>(antes: readonly T[], ahora: readonly T[], id: (p: T) => string | undefined, al: { agregado(p: T): void; quitado(p: T): void; comparar(antes: T, ahora: T): void }): void {
  const deAntes = porIdentificador(antes, id);
  const deAhora = porIdentificador(ahora, id);
  for (const p of ahora) {
    const clave = id(p);
    const previa = clave ? deAntes.get(clave) : undefined;
    if (previa) al.comparar(previa, p);
    else al.agregado(p);
  }
  for (const p of antes) {
    const clave = id(p);
    if (!clave || !deAhora.has(clave)) al.quitado(p);
  }
}

/** Si las partes que están en las dos listas cambiaron de orden. */
function cambioElOrden<T>(antes: readonly T[], ahora: readonly T[], id: (p: T) => string | undefined): boolean {
  const deAhora = new Set(ahora.map(id).filter((x): x is string => !!x));
  const enAmbas = new Set(antes.map(id).filter((x): x is string => !!x && deAhora.has(x)));
  const orden = (lista: readonly T[]) => lista.map(id).filter((x): x is string => !!x && enAmbas.has(x));
  return orden(antes).join('|') !== orden(ahora).join('|');
}

// ─── Entrenamiento ───────────────────────────────────────────────────────────────────────────────────────────

export interface PrescripcionParaComparar {
  readonly prescriptionId?: string;
  readonly exerciseVersionId: string;
}

export interface SesionParaComparar<P extends PrescripcionParaComparar> {
  readonly sessionId?: string;
  readonly label: string;
  readonly instructions?: string | null;
  readonly prescriptions: readonly P[];
}

export interface BloqueParaComparar<P extends PrescripcionParaComparar> {
  readonly blockId?: string;
  readonly label: string;
  readonly purpose?: string | null;
  readonly microcycles?: readonly { readonly microcycleId?: string; readonly label: string; readonly purpose?: string | null; readonly sessions: readonly SesionParaComparar<P>[] }[];
  readonly sessions?: readonly SesionParaComparar<P>[];
}

const sesionesDe = <P extends PrescripcionParaComparar>(bloques: readonly BloqueParaComparar<P>[]): SesionParaComparar<P>[] =>
  bloques.flatMap((b) => [...(b.sessions ?? []), ...(b.microcycles ?? []).flatMap((m) => m.sessions)]);

/**
 * Lo que cambia en Entrenamiento: los bloques (nombre, propósito y semanas), las sesiones (nombre, indicaciones y el orden
 * de sus ejercicios), cada ejercicio (lo indicado, con su renglón de antes y de ahora) y los días de entrenamiento.
 */
export function compararEntrenamiento<P extends PrescripcionParaComparar>(
  vigente: readonly BloqueParaComparar<P>[],
  borrador: readonly BloqueParaComparar<P>[],
  como: {
    /** El nombre del ejercicio, del catálogo. */
    readonly nombreDelEjercicio: (exerciseVersionId: string) => string;
    /** El renglón de lo indicado («4 × 6–8 rep. · 122,5 kg · RIR 2»). */
    readonly renglon: (p: P) => string;
    /** Los días de entrenamiento de cada versión (DL-137), si los tiene. */
    readonly agendas?: { readonly vigente: unknown; readonly borrador: unknown };
  },
): CambiosFrenteALaVigente {
  const c = cambios();
  const nombreDeSesion = (s: SesionParaComparar<P>) => s.label.trim() || 'Sesión sin nombre';
  const nombreDeBloque = (b: BloqueParaComparar<P>) => b.label.trim() || 'Bloque sin nombre';
  compararListas(vigente, borrador, (b) => b.blockId, {
    agregado: (b) => c.agregado(`bloque ${nombreDeBloque(b)}`),
    quitado: (b) => c.quitado(`bloque ${nombreDeBloque(b)}`),
    comparar: (antes, ahora) => {
      if (antes.label.trim() !== ahora.label.trim()) c.modificado(`Bloque: ${nombreDeBloque(antes)} → ${nombreDeBloque(ahora)}`);
      if ((antes.purpose ?? '') !== (ahora.purpose ?? '')) c.modificado(`Bloque ${nombreDeBloque(ahora)}: cambió el propósito`);
      const semanasAntes = antes.microcycles?.length ?? 0;
      const semanasAhora = ahora.microcycles?.length ?? 0;
      if (semanasAntes !== semanasAhora) c.modificado(`Bloque ${nombreDeBloque(ahora)}: de ${uno(semanasAntes, 'semana', 'semanas')} a ${semanasAhora}`);
    },
  });
  compararListas(sesionesDe(vigente), sesionesDe(borrador), (s) => s.sessionId, {
    agregado: (s) => c.agregado(nombreDeSesion(s)),
    quitado: (s) => c.quitado(nombreDeSesion(s)),
    comparar: (antes, ahora) => {
      if (antes.label.trim() !== ahora.label.trim()) c.modificado(`Sesión: ${nombreDeSesion(antes)} → ${nombreDeSesion(ahora)}`);
      if ((antes.instructions ?? '') !== (ahora.instructions ?? '')) c.modificado(`${nombreDeSesion(ahora)}: cambiaron las indicaciones`);
      const id = (p: P) => p.prescriptionId;
      compararListas(antes.prescriptions, ahora.prescriptions, id, {
        agregado: (p) => c.agregado(`${como.nombreDelEjercicio(p.exerciseVersionId)} en ${nombreDeSesion(ahora)}`),
        quitado: (p) => c.quitado(`${como.nombreDelEjercicio(p.exerciseVersionId)} de ${nombreDeSesion(ahora)}`),
        comparar: (pa, pb) => {
          if (igual(pa, pb)) return;
          const [ra, rb] = [como.renglon(pa), como.renglon(pb)];
          c.modificado(`${como.nombreDelEjercicio(pb.exerciseVersionId)}: ${ra === rb ? 'cambió lo indicado' : `${ra} → ${rb}`}`);
        },
      });
      if (cambioElOrden(antes.prescriptions, ahora.prescriptions, id)) c.modificado(`${nombreDeSesion(ahora)}: cambió el orden de los ejercicios`);
    },
  });
  if (como.agendas && !igualConIdentificadores(como.agendas.vigente, como.agendas.borrador)) c.modificado('Días de entrenamiento: cambiaron');
  return c.resultado();
}

/** Los días de entrenamiento nombran sesiones por su identificador: se comparan con ellos. */
function igualConIdentificadores(a: unknown, b: unknown): boolean {
  const forma = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(forma);
    if (x === null || typeof x !== 'object') return x;
    return Object.fromEntries(
      Object.keys(x)
        .sort()
        .filter((k) => !vacio((x as Record<string, unknown>)[k]))
        .map((k) => [k, forma((x as Record<string, unknown>)[k])]),
    );
  };
  return JSON.stringify(forma(a ?? null)) === JSON.stringify(forma(b ?? null));
}

// ─── Nutrición ──────────────────────────────────────────────────────────────────────────────────────────────

export interface OpcionParaComparar {
  readonly optionId?: string;
  readonly label?: string | null;
}

export interface ComidaParaComparar<O extends OpcionParaComparar> {
  readonly mealId?: string;
  readonly label: string;
  readonly prescriptionMode?: string;
  readonly options: readonly O[];
}

export interface DiaParaComparar<O extends OpcionParaComparar> {
  readonly dayTypeId?: string;
  readonly label: string;
  readonly meals: readonly ComidaParaComparar<O>[];
}

/** Lo que cambia en Nutrición: los días tipo, sus comidas y las opciones de cada comida (lo que lleva cada una). */
export function compararNutricion<O extends OpcionParaComparar>(vigente: readonly DiaParaComparar<O>[], borrador: readonly DiaParaComparar<O>[]): CambiosFrenteALaVigente {
  const c = cambios();
  const nombreDeDia = (d: DiaParaComparar<O>) => d.label.trim() || 'Día tipo sin nombre';
  const nombreDeComida = (m: ComidaParaComparar<O>) => m.label.trim() || 'Comida sin nombre';
  const nombreDeOpcion = (o: O, n: number) => o.label?.trim() || `opción ${n + 1}`;
  compararListas(vigente, borrador, (d) => d.dayTypeId, {
    agregado: (d) => c.agregado(nombreDeDia(d)),
    quitado: (d) => c.quitado(nombreDeDia(d)),
    comparar: (da, db) => {
      if (da.label.trim() !== db.label.trim()) c.modificado(`Día tipo: ${nombreDeDia(da)} → ${nombreDeDia(db)}`);
      compararListas(da.meals, db.meals, (m) => m.mealId, {
        agregado: (m) => c.agregado(`${nombreDeComida(m)} (${nombreDeDia(db)})`),
        quitado: (m) => c.quitado(`${nombreDeComida(m)} (${nombreDeDia(db)})`),
        comparar: (ma, mb) => {
          if (ma.label.trim() !== mb.label.trim()) c.modificado(`Comida: ${nombreDeComida(ma)} → ${nombreDeComida(mb)} (${nombreDeDia(db)})`);
          if ((ma.prescriptionMode ?? '') !== (mb.prescriptionMode ?? '')) c.modificado(`${nombreDeComida(mb)} (${nombreDeDia(db)}): cambió cómo se indica`);
          compararListas(ma.options, mb.options, (o) => o.optionId, {
            agregado: (o) => c.agregado(`${nombreDeComida(mb)} · ${nombreDeOpcion(o, mb.options.indexOf(o))} (${nombreDeDia(db)})`),
            quitado: (o) => c.quitado(`${nombreDeComida(mb)} · ${nombreDeOpcion(o, ma.options.indexOf(o))} (${nombreDeDia(db)})`),
            comparar: (oa, ob) => {
              if (!igual(oa, ob)) c.modificado(`${nombreDeComida(mb)} · ${nombreDeOpcion(ob, mb.options.indexOf(ob))} (${nombreDeDia(db)}): cambió lo que lleva`);
            },
          });
        },
      });
    },
  });
  return c.resultado();
}
