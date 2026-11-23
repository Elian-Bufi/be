'use client';

/**
 * DL-196 parte B (E13 y E20) · la silueta como mapa: cada zona pintada con un nivel (las series por semana de una fase, o
 * cuántos días la trabaja una estructura), las zonas a cuidar rayadas encima y, si se pide, las zonas que se tocan para
 * elegir (el filtro del catálogo por músculo). Usa las capas de Dirección de `public/zonas/` (por ahora, la masculina).
 *
 * - **El puntero ubica la zona de verdad:** cada máscara se lee una vez en un lienzo y se mira su transparencia en el
 *   punto, así que «Pectoral: 12 series por semana (de 3 ejercicios)» sale solo sobre el pectoral. El texto va en un globo
 *   encima del dibujo (RP-19: nada se corre).
 * - **El teclado y el lector usan la lista:** el dibujo es decorativo (`aria-hidden`); quien llama pone al lado la tabla o
 *   los botones de cada zona, y `resaltada` marca en el dibujo la que tiene el foco.
 * - Los niveles son tokens (`--calor-1` a `--calor-4`) sobre el maniquí, que es el mismo en los dos temas.
 */
import { COPY_FIGURA_DE_ZONAS, vistasDeZona, ZONAS_MUSCULARES } from '@be/domain';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';

export interface ZonaDelCalor {
  readonly zoneId: string;
  /** 0 (sin pintar) a 4. */
  readonly nivel: number;
  /** Lo que dice el globo al pasar el puntero. */
  readonly texto: string;
}

const VISTAS = [
  { vista: 'ANTERIOR', archivo: 'front', rotulo: COPY_FIGURA_DE_ZONAS.deFrente },
  { vista: 'POSTERIOR', archivo: 'back', rotulo: COPY_FIGURA_DE_ZONAS.deEspalda },
] as const;

/** Las máscaras ya leídas, por archivo: se leen una vez por página. */
const MASCARAS = new Map<string, Promise<ImageData | null>>();

function leerMascara(url: string): Promise<ImageData | null> {
  const ya = MASCARAS.get(url);
  if (ya) return ya;
  const promesa = new Promise<ImageData | null>((resolver) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      try {
        const lienzo = document.createElement('canvas');
        lienzo.width = img.naturalWidth;
        lienzo.height = img.naturalHeight;
        const ctx = lienzo.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolver(null);
        ctx.drawImage(img, 0, 0);
        resolver(ctx.getImageData(0, 0, lienzo.width, lienzo.height));
      } catch {
        resolver(null);
      }
    };
    img.onerror = () => resolver(null);
    img.src = url;
  });
  MASCARAS.set(url, promesa);
  return promesa;
}

const urlDe = (archivo: string, zona: string) => `/zonas/be-mask-m-${archivo}-${zona}.png`;

export function FiguraDeCalor({
  zonas,
  aCuidar = [],
  resaltada = null,
  elegibles = false,
  elegidas = [],
  onTocar,
  chica = false,
  rotulo,
}: {
  zonas: readonly ZonaDelCalor[];
  /** Las zonas a cuidar: van rayadas encima, con su color propio. */
  aCuidar?: readonly string[];
  /** La zona que tiene el foco en la lista de al lado: se marca en el dibujo. */
  resaltada?: string | null;
  /** Las 17 zonas se pueden tocar (para elegir), tengan nivel o no. */
  elegibles?: boolean;
  elegidas?: readonly string[];
  onTocar?: (zoneId: string) => void;
  chica?: boolean;
  /** Para qué es la figura (va en un `data-` para las pruebas). */
  rotulo: string;
}) {
  const [globo, setGlobo] = useState<{ readonly texto: string; readonly x: number; readonly y: number; readonly zona: string } | null>(null);
  const datos = useRef(new Map<string, ImageData | null>());
  const conNivel = new Map(zonas.map((z) => [z.zoneId, z]));
  const candidatas = (vista: 'ANTERIOR' | 'POSTERIOR') =>
    (elegibles ? ZONAS_MUSCULARES.map((z) => z.zoneId as string) : zonas.filter((z) => z.nivel > 0).map((z) => z.zoneId)).filter((z) => vistasDeZona(z).includes(vista));

  // Las máscaras que se pueden señalar, leídas una vez (el puntero las mira sin esperar).
  const clave = VISTAS.map((v) => candidatas(v.vista).join(',')).join('|');
  useEffect(() => {
    let vivo = true;
    for (const v of VISTAS) {
      for (const z of candidatas(v.vista)) {
        const url = urlDe(v.archivo, z);
        if (datos.current.has(url)) continue;
        void leerMascara(url).then((d) => {
          if (vivo) datos.current.set(url, d);
        });
      }
    }
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  const zonaEn = (archivo: string, vista: 'ANTERIOR' | 'POSTERIOR', fx: number, fy: number): string | null => {
    // De la última pintada a la primera: la de arriba gana.
    for (const z of [...candidatas(vista)].reverse()) {
      const d = datos.current.get(urlDe(archivo, z));
      if (!d) continue;
      const px = Math.min(d.width - 1, Math.max(0, Math.floor(fx * d.width)));
      const py = Math.min(d.height - 1, Math.max(0, Math.floor(fy * d.height)));
      if ((d.data[(py * d.width + px) * 4 + 3] ?? 0) > 96) return z;
    }
    return null;
  };

  const alMover = (e: PointerEvent<HTMLDivElement>, archivo: string, vista: 'ANTERIOR' | 'POSTERIOR') => {
    const r = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    const z = zonaEn(archivo, vista, fx, fy);
    if (!z) return setGlobo(null);
    const caja = e.currentTarget.closest('.figura-de-calor__vistas')?.getBoundingClientRect();
    const texto = conNivel.get(z)?.texto ?? ZONAS_MUSCULARES.find((x) => x.zoneId === z)?.name ?? z;
    setGlobo({ texto, zona: z, x: e.clientX - (caja?.left ?? r.left), y: e.clientY - (caja?.top ?? r.top) });
  };

  const alTocar = (e: PointerEvent<HTMLDivElement>, archivo: string, vista: 'ANTERIOR' | 'POSTERIOR') => {
    if (!onTocar) return;
    const r = e.currentTarget.getBoundingClientRect();
    const z = zonaEn(archivo, vista, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    if (z) onTocar(z);
  };

  return (
    <div className={`figura-de-calor${chica ? ' figura-de-calor--chica' : ''}${onTocar ? ' figura-de-calor--elegible' : ''}`} data-figura-de-calor={rotulo} aria-hidden="true">
      <div className="figura-de-calor__vistas">
        {VISTAS.map((v) => (
          <div key={v.vista} className="figura-de-calor__vista">
            <div
              className="figura-de-calor__lienzo"
              onPointerMove={(e) => alMover(e, v.archivo, v.vista)}
              onPointerLeave={() => setGlobo(null)}
              onPointerUp={(e) => alTocar(e, v.archivo, v.vista)}
              data-senalada={globo?.zona ?? undefined}
            >
              <img className="figura-de-calor__cuerpo" src={`/zonas/be-body-m-${v.archivo}.webp`} alt="" width={320} height={944} decoding="async" />
              {zonas
                .filter((z) => z.nivel > 0 && vistasDeZona(z.zoneId).includes(v.vista))
                .map((z) => (
                  <span key={z.zoneId} className={`figura-de-calor__zona figura-de-calor__zona--${Math.min(4, z.nivel)}`} style={{ '--mascara': `url(${urlDe(v.archivo, z.zoneId)})` } as CSSProperties} />
                ))}
              {elegidas
                .filter((z) => vistasDeZona(z).includes(v.vista))
                .map((z) => (
                  <span key={`e-${z}`} className="figura-de-calor__zona figura-de-calor__zona--elegida" style={{ '--mascara': `url(${urlDe(v.archivo, z)})` } as CSSProperties} />
                ))}
              {aCuidar
                .filter((z) => vistasDeZona(z).includes(v.vista))
                .map((z) => (
                  <span key={`c-${z}`} className="figura-de-calor__zona figura-de-calor__zona--a-cuidar" style={{ '--mascara': `url(${urlDe(v.archivo, z)})` } as CSSProperties} data-a-cuidar={z} />
                ))}
              {[resaltada, globo?.zona]
                .filter((z): z is string => !!z && vistasDeZona(z).includes(v.vista))
                .slice(0, 1)
                .map((z) => (
                  <span key={`r-${z}`} className="figura-de-calor__zona figura-de-calor__zona--resaltada" style={{ '--mascara': `url(${urlDe(v.archivo, z)})` } as CSSProperties} />
                ))}
            </div>
            <span className="figura-de-calor__rotulo">{v.rotulo}</span>
          </div>
        ))}
        {globo ? (
          <span className="figura-de-calor__globo" style={{ left: globo.x, top: globo.y } as CSSProperties} data-globo>
            {globo.texto}
          </span>
        ) : null}
      </div>
    </div>
  );
}
