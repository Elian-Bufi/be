import type { Metadata } from 'next';
import Link from 'next/link';
import { Encabezado } from '../components/encabezado';
import { Icono } from '../components/icono';
import { Pie } from '../components/pie';
import { COPY_NO_ENCONTRADA as C } from '../lib/no-encontrada';

/**
 * PG-07 de WP-PULIDO-GRANDES (DL-173): la página «no encontrada», con la voz de BE. Antes, una dirección que no existe
 * mostraba la página de Next, en inglés y sin salida. Ahora dice qué pasó en castellano, nombra el caso más común (un
 * enlace de invitación viejo o mal copiado) y ofrece dos salidas: el inicio y entrar.
 *
 * - El export estático la convierte en `404.html`, y el host la sirve con código 404 a cualquier dirección inventada.
 * - No busca la invitación ni adivina el código, no redirige sola y no registra la dirección pedida: solo informa.
 * - No la indexan los buscadores. Sin la campana: quien llega acá no siempre tiene la sesión abierta.
 * Los textos viven en `lib/no-encontrada.ts`, que fija la prueba del website (TEST-PG-006).
 */
export const metadata: Metadata = { title: 'Esta página no existe · BE', robots: { index: false, follow: false } };

export default function NoEncontrada() {
  return (
    <div className="cara-publica">
      <Encabezado campana={false} />
      <main id="contenido" className="contenido no-encontrada" data-no-encontrada>
        <span className="no-encontrada__icono" aria-hidden="true">
          <Icono nombre="buscar" tamano={24} />
        </span>
        <h1>{C.titulo}</h1>
        <p className="bajada">{C.bajada}</p>
        <nav className="acciones" aria-label="Salidas">
          <Link className="boton boton--primario" href="/">
            {C.alInicio}
          </Link>
          <Link className="boton boton--secundario" href="/login">
            {C.entrar}
          </Link>
        </nav>
      </main>
      <Pie />
    </div>
  );
}
