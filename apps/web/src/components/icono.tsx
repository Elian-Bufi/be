/**
 * Un ícono de la familia de BE en el website. Toma el color del texto que lo acompaña: no tiene color propio y es el
 * mismo en Claro y en Azul noche.
 * - Casi siempre va con un texto que dice lo mismo: es decorativo y el lector de pantalla no lo recorre.
 * - Si va solo (un botón que es solo el ícono), `etiqueta` le da nombre con lo que hace, no con lo que se ve:
 *   «Quitar Pollo», no «cruz».
 * Tamaños de la guía: 24 en títulos de área, 20 en filas y botones, 18 en pestañas y enlaces, 15 dentro de una etiqueta.
 */
import { GROSOR_DE_ICONO, ICONOS, LIENZO_DE_ICONO, type FormaDeIcono, type NombreDeIcono } from '@be/domain';

export type TamanoDeIcono = 15 | 18 | 20 | 24;

function Forma({ f }: { f: FormaDeIcono }) {
  switch (f.forma) {
    case 'trazo':
      return <path d={f.d} strokeDasharray={f.guiones} />;
    case 'circulo':
      // Los puntos son los únicos llenos de la familia: van enteros y sin trazo.
      return f.lleno ? <circle cx={f.cx} cy={f.cy} r={f.r} fill="currentColor" stroke="none" /> : <circle cx={f.cx} cy={f.cy} r={f.r} strokeDasharray={f.guiones} />;
    case 'rectangulo':
      return <rect x={f.x} y={f.y} width={f.ancho} height={f.alto} rx={f.radio} />;
    case 'elipse':
      return <ellipse cx={f.cx} cy={f.cy} rx={f.rx} ry={f.ry} transform={f.giro} />;
    case 'grupo':
      return (
        <g transform={f.giro}>
          {f.formas.map((hija, i) => (
            <Forma key={i} f={hija} />
          ))}
        </g>
      );
  }
}

export function Icono({ nombre, tamano = 20, etiqueta }: { nombre: NombreDeIcono; tamano?: TamanoDeIcono; etiqueta?: string }) {
  const paraElLector = etiqueta ? ({ role: 'img', 'aria-label': etiqueta } as const) : ({ 'aria-hidden': true } as const);
  return (
    <svg
      className="icono"
      width={tamano}
      height={tamano}
      viewBox={`0 0 ${LIENZO_DE_ICONO} ${LIENZO_DE_ICONO}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={GROSOR_DE_ICONO}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...paraElLector}
    >
      {ICONOS[nombre].formas.map((f, i) => (
        <Forma key={i} f={f} />
      ))}
    </svg>
  );
}
