import { Wordmark } from './wordmark';

const commit = process.env.BE_COMMIT ? process.env.BE_COMMIT.slice(0, 7) : null;
const construidoEn = process.env.BE_CONSTRUIDO_EN ?? null;

export default function Inicio() {
  return (
    <main className="pantalla">
      <Wordmark />
      <h1>BE — en construcción</h1>
      <p className="bajada">Plataforma integrada de inteligencia en salud</p>
      <p className="identidad" aria-label="Identidad del build">
        web 0.1.0 · commit {commit ?? 'no declarado'} · build {construidoEn ?? 'no declarado'}
      </p>
    </main>
  );
}
