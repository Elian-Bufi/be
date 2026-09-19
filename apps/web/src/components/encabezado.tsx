import Link from 'next/link';

/** Encabezado común: marca y aviso permanente de ambiente de prueba con datos sintéticos (08 §33). */
export function Encabezado() {
  return (
    <header className="encabezado">
      <Link href="/" className="encabezado__marca" aria-label="BE, ir al inicio">
        BE
      </Link>
      <p className="encabezado__ambiente">Ambiente de prueba · solo datos sintéticos</p>
    </header>
  );
}
