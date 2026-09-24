import Link from 'next/link';

const version = process.env.BE_VERSION ?? 'no declarada';
const commit = process.env.BE_COMMIT ? process.env.BE_COMMIT.slice(0, 7) : null;
const construidoEn = process.env.BE_CONSTRUIDO_EN ?? null;

/**
 * Pie de la cara pública: los textos legales, el aviso de datos sintéticos (08 §33) y la identidad del build, que es
 * la evidencia de publicación de WP-01 (07 §34): qué versión y qué commit se están viendo.
 */
export function Pie() {
  return (
    <footer className="pie">
      <div className="pie__contenido">
        <nav aria-label="Textos legales">
          <ul>
            <li>
              <Link href="/legal/terminos">Términos y condiciones</Link>
            </li>
            <li>
              <Link href="/legal/privacidad">Política de privacidad</Link>
            </li>
          </ul>
        </nav>
        <p>Ambiente de prueba: usá solo datos sintéticos. No ingreses datos reales de personas.</p>
        <p className="identidad">
          <span className="visualmente-oculto">Identidad del build: </span>web {version} · commit {commit ?? 'no declarado'} · build {construidoEn ?? 'no declarado'}
        </p>
      </div>
    </footer>
  );
}
