import Link from 'next/link';
import { Suspense } from 'react';
import { AvisoDeLlegada } from '../components/aviso-de-llegada';
import { Wordmark } from './wordmark';

const version = process.env.BE_VERSION ?? 'no declarada';
const commit = process.env.BE_COMMIT ? process.env.BE_COMMIT.slice(0, 7) : null;
const construidoEn = process.env.BE_CONSTRUIDO_EN ?? null;

export default function Inicio() {
  return (
    <main className="pantalla">
      <Wordmark />
      <h1>Plataforma integrada de inteligencia en salud</h1>
      <Suspense fallback={null}>
        <AvisoDeLlegada />
      </Suspense>
      <nav className="acciones" aria-label="Acceso">
        <Link className="boton boton--primario" href="/register">
          Crear cuenta
        </Link>
        <Link className="boton boton--secundario" href="/login">
          Iniciar sesión
        </Link>
      </nav>
      <p className="nota">Ambiente de prueba: usá solo datos sintéticos. No ingreses datos reales de personas.</p>
      <p className="identidad" aria-label="Identidad del build">
        web {version} · commit {commit ?? 'no declarado'} · build {construidoEn ?? 'no declarado'}
      </p>
    </main>
  );
}
