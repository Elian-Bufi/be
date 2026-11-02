/**
 * La figura de las zonas musculares (WP-CATALOGO-VISUAL, etapa 2; DL-081): el cuerpo de frente y de espalda, lado a lado,
 * con las zonas de un ejercicio o de una sesión pintadas encima.
 * - **Las capas son las de Dirección** (set «BE-TRAIN · capas musculares», modelo masculino): el cuerpo y una máscara por
 *   zona y vista en la misma grilla, en `public/zonas/` (`be-body-m-{front|back}.webp` y
 *   `be-mask-m-{front|back}-{zona}.png`, achicados con `EVIDENCIA/CATALOGO-VISUAL/herramientas/figura-del-website.cjs`).
 *   La máscara cita la zona, nunca al revés (REG-06-138): el color lo pone el tema con `mask-image`, en Claro y en Azul
 *   noche, sobre la escena de la figura de antropometría.
 * - **Principal, llena; secundaria, rayada** con el mismo azul: se distinguen por la forma además del color, y el color
 *   no es un peso (B10-06 §21). Una zona se dibuja solo en las vistas que declara (deltoides y antebrazo, en las dos).
 * - **La lista en texto acompaña siempre a la figura** y hace de leyenda: cada rol con su muestra y sus zonas. El dibujo
 *   es decorativo para el lector de pantalla (`aria-hidden`): lo que dice está en la lista.
 * - Nada se calcula con la figura: el área pintada no es una medida de nada (REG-06-139; B10-06 §59).
 * Las reglas (el orden, la capa profunda, cómo se juntan las de una sesión) son del dominio (`zonas-musculares.ts`).
 */
import { COPY_FIGURA_DE_ZONAS as C, enumerarZonas, ordenarZonasDeEjercicio, vistasDeZona, zonasEnTexto } from '@be/domain';
import type { CSSProperties } from 'react';

export interface ZonaDeLaFigura {
  readonly zoneId: string;
  readonly role: 'PRIMARY' | 'SECONDARY';
}

const VISTAS = [
  { vista: 'ANTERIOR', archivo: 'front', rotulo: C.deFrente },
  { vista: 'POSTERIOR', archivo: 'back', rotulo: C.deEspalda },
] as const;

export function FiguraDeZonas({
  zonas,
  sinZonas,
  chica = false,
  nota = null,
}: {
  zonas: readonly ZonaDeLaFigura[];
  /** Lo que se dice cuando no hay ninguna zona: la figura vacía no se dibuja. */
  sinZonas: string;
  /** La de la columna del costado o de una fila: las dos vistas más angostas y la lista debajo. */
  chica?: boolean;
  /** Una aclaración debajo de la lista (por ejemplo, cómo se juntan las de una sesión). */
  nota?: string | null;
}) {
  const ordenadas = ordenarZonasDeEjercicio(zonas.map((z) => ({ zoneId: z.zoneId, role: z.role })));
  const { principales, secundarias } = zonasEnTexto(ordenadas);
  if (principales.length === 0 && secundarias.length === 0) {
    return (
      <p className="nota figura-de-zonas__vacia" data-figura-de-zonas="sin-zonas">
        {sinZonas}
      </p>
    );
  }
  return (
    <figure className={`figura-de-zonas${chica ? ' figura-de-zonas--chica' : ''}`} data-figura-de-zonas={ordenadas.map((z) => `${z.zoneId}:${z.role}`).join(' ')}>
      <div className="figura-de-zonas__vistas" aria-hidden="true">
        {VISTAS.map((v) => (
          <div key={v.vista} className="figura-de-zonas__vista">
            <div className="figura-de-zonas__lienzo">
              <img className="figura-de-zonas__cuerpo" src={`/zonas/be-body-m-${v.archivo}.webp`} alt="" width={320} height={944} decoding="async" />
              {ordenadas
                .filter((z) => vistasDeZona(z.zoneId).includes(v.vista))
                .map((z) => (
                  <span
                    key={z.zoneId}
                    className={`figura-de-zonas__zona figura-de-zonas__zona--${z.role === 'PRIMARY' ? 'principal' : 'secundaria'}`}
                    style={{ '--mascara': `url(/zonas/be-mask-m-${v.archivo}-${z.zoneId}.png)` } as CSSProperties}
                  />
                ))}
            </div>
            <span className="figura-de-zonas__rotulo">{v.rotulo}</span>
          </div>
        ))}
      </div>
      <figcaption className="figura-de-zonas__texto">
        <dl className="figura-de-zonas__lista">
          {principales.length > 0 ? (
            <div>
              <dt>
                <span className="muestra muestra--zona-principal" aria-hidden="true" />
                {C.principales}
              </dt>
              <dd>{enumerarZonas(principales)}</dd>
            </div>
          ) : null}
          {secundarias.length > 0 ? (
            <div>
              <dt>
                <span className="muestra muestra--zona-secundaria" aria-hidden="true" />
                {C.secundarias}
              </dt>
              <dd>{enumerarZonas(secundarias)}</dd>
            </div>
          ) : null}
        </dl>
        {nota ? <p className="nota">{nota}</p> : null}
      </figcaption>
    </figure>
  );
}
