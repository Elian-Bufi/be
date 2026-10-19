'use client';

/**
 * Los conceptos frecuentes de una evaluación (DL-146; análisis del 2026-10-18: el formulario arrancaba con «Concepto» y
 * «Valor» en blanco). Son atajos para escribir: tocar uno lo pone en el primer dato vacío, con su unidad, y lleva al
 * valor. No agregan contenido clínico ni deciden nada: el concepto sigue siendo texto libre (DL-048, opción A) y la
 * fuente la declara el profesional. Los que ya están en la evaluación no se ofrecen de nuevo.
 */
import type { ConceptoFrecuente } from '@be/domain';

export function ConceptosFrecuentes({ conceptos, usados, etiqueta, onElegir }: { conceptos: readonly ConceptoFrecuente[]; usados: readonly string[]; etiqueta: string; onElegir: (c: ConceptoFrecuente) => void }) {
  const ya = new Set(usados.map((u) => u.trim().toLowerCase()));
  const quedan = conceptos.filter((c) => !ya.has(c.concepto.toLowerCase()));
  if (quedan.length === 0) return null;
  return (
    <div className="conceptos-frecuentes" role="group" aria-label={etiqueta}>
      <span className="nota">{etiqueta}:</span>
      {quedan.map((c) => (
        <button key={c.concepto} type="button" className="concepto-frecuente" onClick={() => onElegir(c)}>
          {c.concepto}
        </button>
      ))}
    </div>
  );
}

/** El índice del dato donde va un concepto elegido: el primero sin concepto ni valor, o uno nuevo al final. */
export function lugarDelConcepto(datos: readonly { readonly concepto: string; readonly valor: string }[]): number {
  const i = datos.findIndex((d) => !d.concepto.trim() && !d.valor.trim());
  return i >= 0 ? i : datos.length;
}
