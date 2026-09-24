import Link from 'next/link';

/**
 * Dónde está la persona dentro del espacio profesional: «Espacio profesional › Asesorado › Nutrición» (B10-01, header
 * contextual; B10-10 §9: el contexto se conserva en todas las superficies). El último paso es la página actual: no es un
 * enlace y lleva `aria-current`.
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

/** Las migas de una pestaña del workspace: el espacio profesional, el asesorado y la pestaña. */
export function MigasDelAsesorado({ id, pestana }: { id: string; pestana: string }) {
  return <Migas pasos={[{ texto: 'Espacio profesional', href: '/pro' }, { texto: 'Asesorado', href: `/pro/advisees?id=${encodeURIComponent(id)}` }, { texto: pestana }]} />;
}
