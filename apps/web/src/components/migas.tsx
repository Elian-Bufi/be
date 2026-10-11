import Link from 'next/link';

/**
 * Dónde está la persona dentro del espacio profesional: «Espacio profesional › Mis recetas» (B10-01, header contextual;
 * B10-10 §9: el contexto se conserva en todas las superficies). El último paso es la página actual: no es un enlace y
 * lleva `aria-current`. La usan las páginas de la biblioteca. La ficha y las pestañas de área no llevan miga: su marco
 * dice dónde se está y cómo se vuelve (WP-ESCRITORIO-AMABLE, parte 1; WP-ESCRITORIO-AREAS, parte 0).
 */
export function Migas({ pasos }: { pasos: readonly { texto: string; href?: string }[] }) {
  return (
    <nav aria-label="Ubicación" className="migas">
      <ol>
        {pasos.map((p, i) => (
          <li key={`${i}-${p.texto}`}>
            {p.href && i < pasos.length - 1 ? <Link href={p.href}>{p.texto}</Link> : <span aria-current="page">{p.texto}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
