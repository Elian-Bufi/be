import type { VersionDeTexto } from '@be/domain';
import Link from 'next/link';

/**
 * Texto versionado (08 §12.2): muestra id, vigencia y hash de la versión exacta que el registro acepta.
 * Navegable con encabezados; sin scroll forzado para habilitar nada (10-B10:503-512).
 */
export function TextoVersionado({ version }: { version: VersionDeTexto }) {
  const [titulo, ...parrafos] = version.texto.split('\n\n');
  return (
    <article className="texto-legal" aria-labelledby="texto-titulo">
      <h1 id="texto-titulo">{titulo}</h1>
      <dl className="datos datos--compactos">
        <div>
          <dt>Versión</dt>
          <dd>
            <code>{version.id}</code>
          </dd>
        </div>
        <div>
          <dt>Vigente desde</dt>
          <dd>{version.vigenteDesde.slice(0, 10)}</dd>
        </div>
        <div>
          <dt>Huella SHA-256</dt>
          <dd>
            <code className="huella">{version.hash}</code>
          </dd>
        </div>
      </dl>
      {parrafos.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <p>
        <Link href="/register">Volver a Crear cuenta</Link>
      </p>
    </article>
  );
}
