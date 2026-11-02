'use client';

/**
 * El detalle visual de un ejercicio (WP-CATALOGO-VISUAL, etapa 2; DL-081 y DL-162): su imagen y la figura de sus zonas
 * musculares, lado a lado en el escritorio y una debajo de la otra cuando no entran. Lo usan «Mis ejercicios» y el
 * buscador del catálogo del editor del plan.
 * - **Viene de la ficha visual** (API-EJE-05): la imagen con su texto alternativo, su autoría y si se generó con IA, y las
 *   zonas vigentes con su rol.
 * - **Sin zonas, se dice de quién depende:** las de un ejercicio propio las carga su profesional; las del catálogo de
 *   todos, BE (REG-06-135). No es un error ni una falta de la persona.
 */
import { COPY_FIGURA_DE_ZONAS as C, type FichaVisualDeEjercicio } from '@be/domain';
import { Cargando } from '../../../components/estados';
import { FiguraDeZonas } from '../../../components/figura-de-zonas';
import { Aviso } from '../../../components/formulario';
import type { Resultado } from '../../../lib/api';
import { useFichasVisuales } from '../../../lib/fichas-visuales';
import { ImagenGuardadaDeEjercicio } from './imagen-de-ejercicio';

export function DetalleVisualDeEjercicio({ token, ficha, nombre, sesionPerdida }: { token: string; ficha: FichaVisualDeEjercicio; nombre: string; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const imagen = ficha.image;
  const autoria = imagen ? [imagen.provenance === 'AI_GENERATED' ? C.generadaConIa : null, imagen.authorship.trim() || null].filter(Boolean).join(' · ') : '';
  return (
    <div className="detalle-visual" data-detalle-visual={ficha.exerciseId}>
      {imagen ? (
        <figure className="detalle-visual__imagen">
          <ImagenGuardadaDeEjercicio token={token} medioId={imagen.mediaId} nombre={nombre} textoAlternativo={imagen.altText} sesionPerdida={sesionPerdida} />
          {autoria ? <figcaption className="nota">{autoria}</figcaption> : null}
        </figure>
      ) : null}
      <section className="detalle-visual__zonas" aria-label={C.titulo}>
        <p className="detalle-visual__titulo">{C.titulo}</p>
        <FiguraDeZonas zonas={ficha.muscleZones} sinZonas={ficha.provenance === 'PROFESSIONAL_MANUAL' ? C.sinZonasPropio : C.sinZonasDelCatalogo} nota={C.queMuestra} />
      </section>
    </div>
  );
}

/** El detalle de un ejercicio que todavía no se leyó (el del catálogo): pide su ficha y la muestra. */
export function DetalleVisualPorLeer({ token, exerciseId, nombre, sesionPerdida }: { token: string; exerciseId: string; nombre: string; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const { lectura, releer } = useFichasVisuales(token, [exerciseId], sesionPerdida);
  if (lectura.tipo === 'cargando') return <Cargando />;
  if (lectura.tipo === 'sin-area') return null;
  if (lectura.tipo === 'falla') {
    return (
      <Aviso tipo="error">
        <p>
          {C.noSePudieronLeer} {lectura.motivo}
        </p>
        <button type="button" className="boton boton--secundario" onClick={releer}>
          Reintentar
        </button>
      </Aviso>
    );
  }
  const ficha = lectura.fichas.get(exerciseId.toLowerCase());
  return ficha ? <DetalleVisualDeEjercicio token={token} ficha={ficha} nombre={nombre} sesionPerdida={sesionPerdida} /> : null;
}
