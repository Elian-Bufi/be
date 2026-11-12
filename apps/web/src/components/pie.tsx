import { AVISOS_DE_PRUEBA, COPY_AYUDA } from '@be/domain';
import Link from 'next/link';
import { AVISOS_DE_PRUEBA_VISIBLES } from '../lib/ambiente';

const version = process.env.BE_VERSION ?? 'no declarada';
const commit = process.env.BE_COMMIT ? process.env.BE_COMMIT.slice(0, 7) : null;
const construidoEn = process.env.BE_CONSTRUIDO_EN ?? null;

/**
 * Pie de la cara pública: los textos legales, «Ayuda y contacto» (UF-07), el aviso de prueba (08 §33) y la identidad del
 * build, que es la evidencia
 * de publicación de WP-01 (07 §34): qué versión y qué commit se están viendo. El aviso de prueba sale del ambiente
 * (WP-USO-FINAL UF-08): en producción no aparece, y en `test` se puede apagar con el interruptor.
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
            <li>
              <Link href="/legal/fuentes">Fuentes del catálogo</Link>
            </li>
          </ul>
        </nav>
        {/* UF-07 (DL-169): el canal de ayuda y contacto, a un toque desde cualquier página pública. */}
        <p className="pie__ayuda">
          <Link href="/help">{COPY_AYUDA.enlace}</Link>
        </p>
        {AVISOS_DE_PRUEBA_VISIBLES ? <p>{AVISOS_DE_PRUEBA.general}</p> : null}
        <p className="identidad">
          <span className="visualmente-oculto">Identidad del build: </span>web {version} · commit {commit ?? 'no declarado'} · build {construidoEn ?? 'no declarado'}
        </p>
      </div>
    </footer>
  );
}
