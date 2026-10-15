'use client';

/**
 * «Medidas en la figura» de la carga de una toma (WP-ESCRITORIO-AREAS, parte 9; maqueta 23): la figura de Dirección con
 * cada campo unido a su sitio por una guía. Reemplaza a la silueta dibujada para BE (`figura.tsx`, DL-073), que tenía los
 * puntos de un lado y la lista del otro.
 * - **Dónde va cada cosa** lo dice `composicion-de-la-carga.ts`, con las cuentas de la lámina: los sitios no se mueven.
 * - **Con dato o sin dato, por la forma:** el anillo de un perímetro con dato tiene la mitad de adelante llena; sin dato,
 *   entero, punteado y fino. El punto de un pliegue con dato es un aro lleno con su centro; sin dato, un aro punteado y
 *   vacío. El color es siempre el mismo: la figura **ubica, nunca califica** (no recibe ningún valor; RF-048).
 * - **Posterior:** el sitio está en la cara de atrás y la figura está de frente. El sitio y su guía van en gris, la guía
 *   punteada, y el campo lo dice con la palabra «posterior».
 * - **Los campos son el camino del teclado y del lector de pantalla:** el dibujo va oculto para el lector, y tocar un
 *   sitio es un atajo a su campo. El nombre que se ve es el corto («Tricipital»); el que oye el lector, el completo.
 * - **Con menos de 832 px de ancho** las tarjetas pisarían los brazos de la figura: los campos van en lista, por
 *   tarjeta, sin la figura (decisión de la parte 9; el profesional trabaja en escritorio).
 */
import { COPY_ANTROPOMETRIA as C, NOMBRE_DE_METRICA, nombreCortoDeMetrica, type MetricaDelProtocolo, type SexoDeLaLamina } from '@be/domain';
import { useLayoutEffect, useRef, useState } from 'react';
import { arcoDelAnillo, componerLaCarga, ESCENA_DE_LA_CARGA, trazoDeLaGuia, type FamiliaDeLaCarga, type SitioEnLaEscena } from './composicion-de-la-carga';

/** Lo que la figura necesita de cada campo: la métrica, lo escrito, si tiene dato y su error. Nunca el valor como número. */
export interface CampoDeLaCarga {
  readonly metrica: MetricaDelProtocolo;
  readonly valor: string;
  readonly unidad: string;
  readonly conDato: boolean;
  readonly error: string | null;
}

export const idDelValor = (clave: string) => `ant-valor-${clave}`;

/**
 * El nombre corto de una medición del protocolo: el del catálogo de BE sin la palabra de su familia («Tricipital»); si BE
 * no la conoce, el que declara el protocolo.
 */
export const nombreCortoDelCampo = (m: MetricaDelProtocolo): string => (NOMBRE_DE_METRICA[m.clave] ? nombreCortoDeMetrica(m.clave, m.familia) : m.nombre);

/**
 * Un campo de medición, en una fila: el nombre corto (y «posterior», si lo es), el valor y su unidad, y el error debajo.
 * La usan la figura y «Fuera de la figura».
 */
export function CampoDeMedicion({
  campo,
  posterior = false,
  activa,
  onActiva,
  onEscribir,
}: {
  campo: CampoDeLaCarga;
  posterior?: boolean;
  activa: boolean;
  onActiva: (clave: string | null) => void;
  onEscribir: (clave: string, cambio: { valor?: string; unidad?: string }) => void;
}) {
  const { metrica: m } = campo;
  const id = idDelValor(m.clave);
  const describe = [m.unidades.length === 1 ? `${id}-unidad` : null, campo.error ? `${id}-error` : null].filter(Boolean).join(' ');
  return (
    <div className={`medicion-de-la-carga${activa ? ' medicion-de-la-carga--activa' : ''}`} data-fila={m.clave}>
      <label htmlFor={id} className="medicion-de-la-carga__nombre">
        {nombreCortoDelCampo(m)}
        {posterior ? <span className="medicion-de-la-carga__posterior">{C.laminaPosterior}</span> : null}
      </label>
      <input
        id={id}
        className="medicion-de-la-carga__valor"
        inputMode="decimal"
        autoComplete="off"
        maxLength={12}
        // El nombre completo («Pliegue tricipital»): el corto solo se entiende al lado de la figura y de su familia.
        aria-label={posterior ? `${m.nombre}, ${C.laminaPosterior}` : m.nombre}
        aria-describedby={describe || undefined}
        aria-invalid={campo.error ? true : undefined}
        value={campo.valor}
        onFocus={() => onActiva(m.clave)}
        onBlur={() => onActiva(null)}
        onChange={(e) => onEscribir(m.clave, { valor: e.target.value })}
      />
      {m.unidades.length > 1 ? (
        <select className="medicion-de-la-carga__unidades" aria-label={`Unidad de ${m.nombre}`} value={campo.unidad} onChange={(e) => onEscribir(m.clave, { unidad: e.target.value })}>
          {m.unidades.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      ) : (
        <span id={`${id}-unidad`} className="medicion-de-la-carga__unidad">
          {m.unidades[0]}
        </span>
      )}
      {campo.error ? (
        <p id={`${id}-error`} className="campo__error medicion-de-la-carga__error">
          <span aria-hidden="true">⚠ </span>
          {campo.error}
        </p>
      ) : null}
    </div>
  );
}

/** El dibujo de un sitio: la forma dice si tiene dato; el halo, que su campo tiene el foco. */
function DibujoDelSitio({ s, conDato, activo }: { s: SitioEnLaEscena; conDato: boolean; activo: boolean }) {
  if (s.forma === 'ANILLO') {
    return (
      <>
        {activo ? <ellipse className="sitio-de-la-carga__halo" cx={s.cx} cy={s.cy} rx={s.rx + 5} ry={s.ry + 5} /> : null}
        {conDato ? (
          <>
            {/* La mitad de atrás la tapa el cuerpo: va punteada. La de adelante, llena. */}
            <path className="sitio-de-la-carga__atras" d={arcoDelAnillo(s, 'TRASERA')} />
            <path className="sitio-de-la-carga__adelante" d={arcoDelAnillo(s, 'DELANTERA')} />
          </>
        ) : (
          <ellipse className="sitio-de-la-carga__sin-dato" cx={s.cx} cy={s.cy} rx={s.rx} ry={Math.max(s.ry, 2.2)} />
        )}
        <ellipse className="sitio-de-la-carga__toque" cx={s.cx} cy={s.cy} rx={s.rx + 4} ry={Math.max(s.ry, 2.2) + 8} />
      </>
    );
  }
  return (
    <>
      {activo ? <circle className="sitio-de-la-carga__halo" cx={s.cx} cy={s.cy} r={s.rx + 6} /> : null}
      <circle className={conDato ? 'sitio-de-la-carga__aro' : 'sitio-de-la-carga__aro sitio-de-la-carga__aro--sin-dato'} cx={s.cx} cy={s.cy} r={s.rx} />
      {conDato ? <circle className="sitio-de-la-carga__centro" cx={s.cx} cy={s.cy} r={3} /> : null}
      <circle className="sitio-de-la-carga__toque" cx={s.cx} cy={s.cy} r={14} />
    </>
  );
}

/** Las muestras de la leyenda: las mismas formas que la figura. */
function Muestra({ forma, conDato, posterior = false }: { forma: 'ANILLO' | 'PUNTO'; conDato: boolean; posterior?: boolean }) {
  const s: SitioEnLaEscena =
    forma === 'ANILLO' ? { clave: 'muestra', forma, cx: 17, cy: 8, rx: 14, ry: 4.2, posterior } : { clave: 'muestra', forma, cx: 11, cy: 11, rx: 7.5, ry: 7.5, posterior };
  return (
    <svg className={`sitio-de-la-carga${posterior ? ' sitio-de-la-carga--posterior' : ''}`} width={forma === 'ANILLO' ? 34 : 22} height={forma === 'ANILLO' ? 16 : 22} aria-hidden="true">
      <DibujoDelSitio s={s} conDato={conDato} activo={false} />
    </svg>
  );
}

const PARES_CASI_COINCIDENTES = [
  ['pliegue-triceps', 'pliegue-biceps'],
  ['pliegue-cresta-iliaca', 'pliegue-supraespinal'],
] as const;

export function FiguraDeLaCarga({
  sexo,
  familia,
  claves,
  campos,
  activa,
  onActiva,
  onEscribir,
}: {
  sexo: SexoDeLaLamina;
  familia: FamiliaDeLaCarga;
  /** Las del protocolo, en su orden. */
  claves: readonly string[];
  campos: ReadonlyMap<string, CampoDeLaCarga>;
  activa: string | null;
  onActiva: (clave: string | null) => void;
  onEscribir: (clave: string, cambio: { valor?: string; unidad?: string }) => void;
}) {
  const escena = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(0);
  const [altos, setAltos] = useState<Readonly<Record<string, number>>>({});
  const [pie, setPie] = useState(0);
  const enLista = ancho < ESCENA_DE_LA_CARGA.anchoMinimo;
  // En lista, la composición da solo las tarjetas y su orden: se calcula al ancho de la maqueta.
  const comp = componerLaCarga({ sexo, familia, claves, ancho: enLista ? 880 : ancho, altosDeFilas: altos, pie });

  // Lo que se mide antes de pintar: el ancho de la escena, el alto de las filas que crecieron (un error abajo) y el de la
  // leyenda. Con cada cambio se vuelve a componer; los valores iguales no vuelven a dibujar.
  useLayoutEffect(() => {
    const el = escena.current;
    if (!el) return;
    const medir = () => {
      setAncho(Math.round(el.clientWidth));
      const crecidas: Record<string, number> = {};
      el.querySelectorAll<HTMLElement>('[data-fila]').forEach((f) => {
        if (f.offsetHeight > ESCENA_DE_LA_CARGA.fila) crecidas[f.dataset.fila!] = f.offsetHeight;
      });
      setAltos((antes) => (JSON.stringify(antes) === JSON.stringify(crecidas) ? antes : crecidas));
      const leyenda = el.querySelector<HTMLElement>('.leyenda-de-la-carga');
      const nuevoPie = leyenda && !enLista ? leyenda.offsetHeight + ESCENA_DE_LA_CARGA.margen : 0;
      setPie((antes) => (antes === nuevoPie ? antes : nuevoPie));
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  });

  const elegir = (clave: string) => document.getElementById(idDelValor(clave))?.focus();
  const conDato = (clave: string) => campos.get(clave)?.conDato ?? false;
  const presentes = new Set(comp.sitios.map((s) => s.clave));
  const pares = familia === 'PLIEGUES' ? PARES_CASI_COINCIDENTES.filter(([a, b]) => presentes.has(a) && presentes.has(b)) : [];
  // Un sitio posterior se dibuja primero: si otro casi coincide con él de frente, queda arriba el de adelante.
  const sitios = [...comp.sitios].sort((a, b) => Number(b.posterior) - Number(a.posterior));

  return (
    <div
      ref={escena}
      className={`escena-de-la-carga${enLista ? ' escena-de-la-carga--en-lista' : ''}`}
      style={enLista ? undefined : { height: comp.alto }}
      data-familia={familia}
      data-figura={sexo}
    >
      {enLista ? null : (
        <>
          <img className="escena-de-la-carga__figura" src={`/figura/${comp.archivo}`} alt="" style={{ left: comp.imagen.x, top: comp.imagen.y, width: comp.imagen.ancho, height: comp.imagen.alto }} />
          <svg className="escena-de-la-carga__trazos" viewBox={`0 0 ${comp.ancho} ${comp.alto}`} width={comp.ancho} height={comp.alto} aria-hidden="true">
            {comp.guias.map((g) => (
              <g key={g.clave} className={`guia-de-la-carga${g.posterior ? ' guia-de-la-carga--posterior' : ''}${activa === g.clave ? ' guia-de-la-carga--activa' : ''}`} data-guia={g.clave}>
                <path d={trazoDeLaGuia(g)} />
                <circle cx={g.desde.x} cy={g.desde.y} r={3.2} />
              </g>
            ))}
            {sitios.map((s) => (
              <g
                key={s.clave}
                className={`sitio-de-la-carga${s.posterior ? ' sitio-de-la-carga--posterior' : ''}`}
                data-sitio={s.clave}
                data-con-dato={conDato(s.clave) ? 'si' : 'no'}
                onClick={() => elegir(s.clave)}
              >
                <title>{campos.get(s.clave)?.metrica.nombre ?? s.clave}</title>
                <DibujoDelSitio s={s} conDato={conDato(s.clave)} activo={activa === s.clave} />
              </g>
            ))}
          </svg>
        </>
      )}
      {comp.tarjetas.map((t) => (
        <div
          key={t.filas[0]!.clave}
          className={`tarjeta-de-la-carga tarjeta-de-la-carga--${t.lado === 'IZQUIERDA' ? 'izquierda' : 'derecha'}`}
          style={enLista ? undefined : { top: t.arriba, ...(t.lado === 'IZQUIERDA' ? { left: 0 } : { right: 0 }) }}
        >
          {t.filas.map((f) => {
            const campo = campos.get(f.clave);
            if (!campo) return null;
            const sitio = comp.sitios.find((s) => s.clave === f.clave);
            return <CampoDeMedicion key={f.clave} campo={campo} posterior={sitio?.posterior ?? false} activa={activa === f.clave} onActiva={onActiva} onEscribir={onEscribir} />;
          })}
        </div>
      ))}
      {enLista ? null : (
        <div className="leyenda-de-la-carga">
          <p className="leyenda-de-la-carga__formas">
            <span>
              <Muestra forma={familia === 'PERIMETROS' ? 'ANILLO' : 'PUNTO'} conDato />
              Con dato
            </span>
            <span>
              <Muestra forma={familia === 'PERIMETROS' ? 'ANILLO' : 'PUNTO'} conDato={false} />
              Sin dato
            </span>
            {comp.sitios.some((s) => s.posterior) ? (
              <span>
                <Muestra forma="PUNTO" conDato posterior />
                Posterior: en la cara de atrás
              </span>
            ) : null}
          </p>
          {pares.length > 0 ? (
            <p>
              {pares.length === 2 ? 'Dos pares están' : 'Dos sitios están'} a la misma altura y de frente casi coinciden:{' '}
              {pares.map(([a, b]) => `${nombreCortoDeMetrica(a, 'PLIEGUES').toLocaleLowerCase('es-AR')} y ${nombreCortoDeMetrica(b, 'PLIEGUES').toLocaleLowerCase('es-AR')}`).join('; ')}.
            </p>
          ) : null}
          <p>La figura ubica el sitio de toma; no califica el valor.</p>
        </div>
      )}
    </div>
  );
}
