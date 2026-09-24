'use client';

/**
 * La figura de la toma antropométrica (docs/paquetes/WP-IDENTIDAD-VISUAL.md, tramo D; DL-073, opción A).
 * - Una silueta **dibujada para BE**: ni una imagen de terceros ni las del compositor, cuyo origen no está documentado.
 * - Los puntos son los de las métricas que declara el protocolo (`puntosDeLaFigura`, en @be/domain): un pliegue es un
 *   punto; un perímetro, un anillo. Se distinguen por la forma, no por el color (B10-10 §11: PRIMARY/SECONDARY).
 * - **Ubicación, nunca calificación**: el punto no conoce el valor. Lleno si tiene dato, vacío si no, siempre del mismo
 *   color; el que se está cargando lleva un halo. Ningún rango, ningún semáforo (RF-048; INV-06-06).
 * - La lista de al lado es la tabla equivalente obligatoria (B10-10 §11) y el camino del teclado y del lector de
 *   pantalla. Tocar un punto es un atajo al campo de la lista, no la única forma de llegar (B10-10 §7).
 */
import type { PuntoDeLaFigura, VistaDeLaFigura } from '@be/domain';

/**
 * La silueta, media figura espejada y suavizada: 200 × 440, con el eje de simetría en x = 100. Cada vista suma abajo
 * una franja para su rótulo, así no pisa los pies.
 */
const CONTORNO = [
  'M100,8 C103.7,8.0 108.0,8.3 111,10 C114.0,11.7 116.5,14.7 118,18 C119.5,21.3 119.8,25.7 120,30',
  'C120.2,34.3 119.8,39.8 119,44 C118.2,48.2 116.7,52.0 115,55 C113.3,58.0 110.2,59.5 109,62',
  'C107.8,64.5 108.0,67.3 108,70 C108.0,72.7 106.7,75.8 109,78 C111.3,80.2 117.5,81.5 122,83',
  'C126.5,84.5 132.2,85.3 136,87 C139.8,88.7 142.3,90.2 145,93 C147.7,95.8 150.0,98.8 152,104',
  'C154.0,109.2 155.3,116.7 157,124 C158.7,131.3 160.3,140.0 162,148 C163.7,156.0 165.2,164.0 167,172',
  'C168.8,180.0 171.0,188.0 173,196 C175.0,204.0 177.3,213.3 179,220 C180.7,226.7 181.5,231.0 183,236',
  'C184.5,241.0 187.2,245.3 188,250 C188.8,254.7 189.0,260.5 188,264 C187.0,267.5 184.0,270.7 182,271',
  'C180.0,271.3 177.5,269.2 176,266 C174.5,262.8 174.3,257.0 173,252 C171.7,247.0 170.2,243.0 168,236',
  'C165.8,229.0 162.7,218.7 160,210 C157.3,201.3 154.3,192.3 152,184 C149.7,175.7 147.8,167.7 146,160',
  'C144.2,152.3 142.8,145.0 141,138 C139.2,131.0 136.7,118.7 135,118 C133.3,117.3 132.0,127.7 131,134',
  'C130.0,140.3 129.7,148.7 129,156 C128.3,163.3 127.5,172.0 127,178 C126.5,184.0 125.7,186.7 126,192',
  'C126.3,197.3 127.7,204.0 129,210 C130.3,216.0 133.0,222.0 134,228 C135.0,234.0 135.2,238.7 135,246',
  'C134.8,253.3 133.8,263.0 133,272 C132.2,281.0 131.2,291.0 130,300 C128.8,309.0 126.5,318.3 126,326',
  'C125.5,333.7 126.7,338.7 127,346 C127.3,353.3 128.5,361.7 128,370 C127.5,378.3 125.2,388.7 124,396',
  'C122.8,403.3 120.5,409.3 121,414 C121.5,418.7 126.5,421.3 127,424 C127.5,426.7 127.2,429.0 124,430',
  'C120.8,431.0 111.0,431.7 108,430 C105.0,428.3 106.3,425.0 106,420 C105.7,415.0 106.0,408.0 106,400',
  'C106.0,392.0 105.8,380.7 106,372 C106.2,363.3 106.7,355.7 107,348 C107.3,340.3 108.2,334.7 108,326',
  'C107.8,317.3 106.7,305.7 106,296 C105.3,286.3 105.0,274.7 104,268 C103.0,261.3 101.3,256.0 100,256',
  'C98.7,256.0 97.0,261.3 96,268 C95.0,274.7 94.7,286.3 94,296 C93.3,305.7 92.2,317.3 92,326',
  'C91.8,334.7 92.7,340.3 93,348 C93.3,355.7 93.8,363.3 94,372 C94.2,380.7 94.0,392.0 94,400',
  'C94.0,408.0 94.3,415.0 94,420 C93.7,425.0 95.0,428.3 92,430 C89.0,431.7 79.2,431.0 76,430',
  'C72.8,429.0 72.5,426.7 73,424 C73.5,421.3 78.5,418.7 79,414 C79.5,409.3 77.2,403.3 76,396',
  'C74.8,388.7 72.5,378.3 72,370 C71.5,361.7 72.7,353.3 73,346 C73.3,338.7 74.5,333.7 74,326',
  'C73.5,318.3 71.2,309.0 70,300 C68.8,291.0 67.8,281.0 67,272 C66.2,263.0 65.2,253.3 65,246',
  'C64.8,238.7 65.0,234.0 66,228 C67.0,222.0 69.7,216.0 71,210 C72.3,204.0 73.7,197.3 74,192',
  'C74.3,186.7 73.5,184.0 73,178 C72.5,172.0 71.7,163.3 71,156 C70.3,148.7 70.0,140.3 69,134',
  'C68.0,127.7 66.7,117.3 65,118 C63.3,118.7 60.8,131.0 59,138 C57.2,145.0 55.8,152.3 54,160',
  'C52.2,167.7 50.3,175.7 48,184 C45.7,192.3 42.7,201.3 40,210 C37.3,218.7 34.2,229.0 32,236',
  'C29.8,243.0 28.3,247.0 27,252 C25.7,257.0 25.5,262.8 24,266 C22.5,269.2 20.0,271.3 18,271',
  'C16.0,270.7 13.0,267.5 12,264 C11.0,260.5 11.2,254.7 12,250 C12.8,245.3 15.5,241.0 17,236',
  'C18.5,231.0 19.3,226.7 21,220 C22.7,213.3 25.0,204.0 27,196 C29.0,188.0 31.2,180.0 33,172',
  'C34.8,164.0 36.3,156.0 38,148 C39.7,140.0 41.3,131.3 43,124 C44.7,116.7 46.0,109.2 48,104',
  'C50.0,98.8 52.3,95.8 55,93 C57.7,90.2 60.2,88.7 64,87 C67.8,85.3 73.5,84.5 78,83 C82.5,81.5 88.7,80.2 91,78',
  'C93.3,75.8 92.0,72.7 92,70 C92.0,67.3 92.2,64.5 91,62 C89.8,59.5 86.7,58.0 85,55 C83.3,52.0 81.8,48.2 81,44',
  'C80.2,39.8 79.8,34.3 80,30 C80.2,25.7 80.5,21.3 82,18 C83.5,14.7 86.0,11.7 89,10 C92.0,8.3 96.3,8.0 100,8Z',
].join(' ');

const VISTAS: readonly { vista: VistaDeLaFigura; titulo: string }[] = [
  { vista: 'FRENTE', titulo: 'De frente' },
  { vista: 'ESPALDA', titulo: 'De espalda' },
];

export function Figura({ puntos, activa, onElegir }: { puntos: readonly PuntoDeLaFigura[]; activa: string | null; onElegir: (clave: string) => void }) {
  return (
    <figure className="figura">
      <div className="figura__vistas">
        {VISTAS.map(({ vista, titulo }) => {
          const deLaVista = puntos.filter((p) => p.vista === vista);
          return (
            <svg key={vista} className="figura__vista" viewBox="0 0 200 460" role="img" aria-label={`${titulo}: ${deLaVista.length} puntos de toma`}>
              <path d={CONTORNO} className="figura__cuerpo" />
              {deLaVista.map((p) => {
                const clases = `figura__sitio${p.cargado ? ' figura__sitio--cargado' : ''}${p.clave === activa ? ' figura__sitio--activo' : ''}`;
                return (
                  <g key={p.clave} className={clases} onClick={() => onElegir(p.clave)}>
                    <title>{`${p.nombre}: ${p.cargado ? 'cargado' : 'sin cargar'}`}</title>
                    {p.forma === 'ANILLO' ? (
                      <>
                        <ellipse className="figura__halo" cx={p.x} cy={p.y} rx={(p.radio ?? 10) + 5} ry={((p.radio ?? 10) + 5) * 0.34} />
                        <ellipse className="figura__anillo" cx={p.x} cy={p.y} rx={p.radio ?? 10} ry={(p.radio ?? 10) * 0.3} />
                      </>
                    ) : (
                      <>
                        <circle className="figura__halo" cx={p.x} cy={p.y} r={9} />
                        <circle className="figura__punto" cx={p.x} cy={p.y} r={4.5} />
                      </>
                    )}
                  </g>
                );
              })}
              <text className="figura__rotulo" x="100" y="455" textAnchor="middle">
                {titulo}
              </text>
            </svg>
          );
        })}
      </div>
      <figcaption className="figura__leyenda">
        <span>
          <svg viewBox="0 0 20 20" aria-hidden="true" className="figura__muestra">
            <circle className="figura__punto" cx="10" cy="10" r="4.5" />
          </svg>
          Pliegue
        </span>
        <span>
          <svg viewBox="0 0 20 20" aria-hidden="true" className="figura__muestra">
            <ellipse className="figura__anillo" cx="10" cy="10" rx="8" ry="3" />
          </svg>
          Perímetro
        </span>
        <span>Lleno: ya tiene dato. Vacío: todavía no.</span>
        <span>La figura ubica el sitio de toma; no califica el valor.</span>
      </figcaption>
    </figure>
  );
}
