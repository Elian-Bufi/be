'use client';

/**
 * La cinta del tiempo en pantalla (GR-23; WP-GRAFICOS fase 2, DL-174): una banda fina sobre el eje de fechas común, con
 * una fila por área (y una para las notas). Las versiones de los planes van como barras; las tomas, las revisiones, las
 * sesiones con cambios, las sustituciones y las notas, como íconos de la familia de BE. Lo que cae junto se agrupa en un
 * círculo con la cantidad. Elegir una barra o un grupo elige su tramo en todos los gráficos de la página (el cursor
 * compartido); elegir un hecho, su fecha.
 *
 * Accesibilidad: el contenedor es un grupo con nombre que recibe el foco (flechas, Inicio, Fin y Escape); el SVG no se
 * lee. La lectura de lo elegido es una región viva cortés, la lista dice cada hecho con palabras y la leyenda explica cada
 * forma. El color nunca es lo único: cada hecho tiene su ícono y cada fila, el de su área.
 *
 * El dibujo solo está en `dibujo-de-la-cinta.tsx`: lo usan esta cinta y los carriles de eventos de `PanelesAlineados`.
 */
import type { Alcance, EjecucionDeEntrenamiento, VigenciaDePlan } from '@be/domain';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Icono } from '../../../../components/icono';
import { LETRA_MINIMA } from '../seguimiento/geometria';
import {
  ALTO_DE_LA_FILA_DE_LA_CINTA,
  COPY_DE_LA_CINTA,
  cursorDelEvento,
  elegibleEn,
  elegiblesDeLaCinta,
  eventosDeLaCinta,
  eventosEnElPeriodo,
  geometriaDeLaCinta,
  ICONO_DEL_HECHO,
  loQueRigeEnLaFecha,
  moverEnLaCinta,
  resumenDeLaCinta,
  SENTIDO_DEL_HECHO,
  textoDelEvento,
  type ElegibleDeLaCinta,
  type EventoDeLaCinta,
  type GeometriaDeLaCinta,
} from './cinta-del-tiempo';
import { useCursorDeFechas } from './cursor-de-fechas';
import { DibujoDeLaCinta } from './dibujo-de-la-cinta';
import { escalaDeFechas, textoDeLaMarca, type PeriodoDelGrafico } from './eje-de-fechas';
import { EstadoDelGraficoEnPantalla } from './estado-del-grafico';
import { leerLaCinta, type LecturaDeLaCinta, type ParametrosDeLectura } from './lecturas';
import { ALTO_DEL_EJE_DE_FECHAS, MARGEN_DERECHO, MARGEN_IZQUIERDO, useAnchoDelGrafico } from './medidas-del-grafico';
import type { DensidadDelGrafico } from './paneles-alineados';

/** La leyenda de la cinta: solo las formas que aparecen. */
function LeyendaDeLaCinta({ g }: { g: GeometriaDeLaCinta }) {
  const tipos = [...new Set(g.filas.flatMap((f) => f.hechos.flatMap((h) => h.hechos.map((e) => e.tipo))))];
  const conBarras = g.filas.some((f) => f.barras.length > 0);
  const conGrupos = g.filas.some((f) => f.hechos.some((h) => h.hechos.length > 1));
  return (
    <ul className="grafico-base__leyenda" aria-label={COPY_DE_LA_CINTA.leyenda}>
      {conBarras ? (
        <li>
          <span className="grafico-base__glifo">
            <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden="true">
              <rect x={1} y={7} width={16} height={4} rx={1} fill="var(--grafico-indicado)" />
            </svg>
            {COPY_DE_LA_CINTA.barra}
          </span>
        </li>
      ) : null}
      {tipos.flatMap((t) => {
        if (t === 'VERSION_DE_PLAN' || t === 'HABITO') return [];
        return [
          <li key={t}>
            <span className="grafico-base__glifo">
              <Icono nombre={ICONO_DEL_HECHO[t]} tamano={15} />
              {SENTIDO_DEL_HECHO[t]}
            </span>
          </li>,
        ];
      })}
      {conGrupos ? (
        <li>
          <span className="grafico-base__glifo">
            <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden="true">
              <circle cx={9} cy={9} r={7.5} fill="none" stroke="var(--texto)" strokeWidth={1.5} />
            </svg>
            {COPY_DE_LA_CINTA.grupo}
          </span>
        </li>
      ) : null}
    </ul>
  );
}

export interface PropsDeLaCinta {
  readonly periodo: PeriodoDelGrafico;
  readonly eventos: readonly EventoDeLaCinta[];
  readonly titulo?: string;
  /** `COMPACTA` en el panel de la estación. */
  readonly densidad?: DensidadDelGrafico;
  /** Fija arriba al desplazar («Patrones»). */
  readonly fija?: boolean;
  /** Si la lectura llegó al tope de páginas: cuántos hechos se leyeron (los más recientes). */
  readonly leidaHastaElTope?: number | null;
}

export function CintaDelTiempo({ periodo, eventos, titulo = COPY_DE_LA_CINTA.titulo, densidad = 'COMPLETA', fija = false, leidaHastaElTope = null }: PropsDeLaCinta) {
  const [ref, ancho] = useAnchoDelGrafico();
  const cursor = useCursorDeFechas();
  const idDelResumen = useId();
  const idDeLaLista = useId();
  const escala = useMemo(() => escalaDeFechas(periodo, { izquierda: MARGEN_IZQUIERDO, derecha: ancho - MARGEN_DERECHO }), [periodo, ancho]);
  const g = useMemo(() => geometriaDeLaCinta(eventos, escala), [eventos, escala]);
  const elegibles = useMemo(() => elegiblesDeLaCinta(g), [g]);
  const visibles = useMemo(() => eventosEnElPeriodo(eventos, escala.desde, escala.hasta), [eventos, escala]);
  const [clave, setClave] = useState<string | null>(null);
  const [conLista, setConLista] = useState(false);
  const indice = clave === null ? -1 : elegibles.findIndex((e) => e.clave === clave);
  const candidato = indice >= 0 ? (elegibles[indice] as ElegibleDeLaCinta) : null;
  // Si otro gráfico de la página movió el cursor a otra fecha, lo elegido en la cinta deja de estarlo.
  const elegido = candidato !== null && cursor.fecha === candidato.evento.desde ? candidato : null;

  const elegir = (i: number) => {
    const e = elegibles[i];
    if (!e) return;
    setClave(e.clave);
    cursor.fijar(cursorDelEvento(e.evento, escala.hasta));
  };
  const soltar = () => {
    setClave(null);
    cursor.fijar({ fecha: null, tramo: null });
  };
  const alTeclear = (ev: KeyboardEvent<HTMLDivElement>) => {
    if ((ev.key === 'Enter' || ev.key === ' ') && elegido) {
      ev.preventDefault();
      elegir(indice);
      return;
    }
    const nuevo = moverEnLaCinta(elegibles.length, elegido ? indice : null, ev.key);
    if (nuevo === null) return;
    ev.preventDefault();
    if (nuevo < 0) soltar();
    else elegir(nuevo);
  };
  const alTocar = (ev: MouseEvent<HTMLDivElement>) => {
    const caja = ev.currentTarget.getBoundingClientRect();
    const escalaX = (escala.derecha + MARGEN_DERECHO) / Math.max(1, caja.width);
    const x = (ev.clientX - caja.left) * escalaX;
    const i = elegibleEn(elegibles, g, x, ev.clientY - caja.top);
    if (i !== null) elegir(i);
    else {
      setClave(null);
      cursor.elegir(escala.fechaDeX(x));
    }
  };

  const total = g.alto + ALTO_DEL_EJE_DE_FECHAS;
  const fecha = cursor.fecha;
  const enLaFecha = !elegido && fecha !== null ? loQueRigeEnLaFecha(visibles, fecha) : [];
  const clases = ['grafico-base', 'grafico-cinta', `grafico-base--${densidad.toLowerCase()}`, fija ? 'grafico-cinta--fija' : null].filter(Boolean).join(' ');

  return (
    <div className={clases}>
      <h3 className="grafico-base__titulo">{titulo}</h3>
      {/* Lo que se mide está siempre: si la cinta empieza vacía, el ancho igual se sigue midiendo. */}
      <div ref={ref} className="grafico-cinta__medida">
        {g.filas.length === 0 ? <p className="nota">{COPY_DE_LA_CINTA.sinHechos}</p> : null}
      </div>
      {g.filas.length === 0 ? null : (
        <>
          <div
            className="grafico-base__area grafico-cinta__area"
            tabIndex={0}
            role="group"
            aria-roledescription="cinta del tiempo"
            aria-label={`${titulo}. ${COPY_DE_LA_CINTA.comoSeUsa}`}
            aria-describedby={idDelResumen}
            onKeyDown={alTeclear}
            onClick={alTocar}
          >
            <svg width="100%" height={total} viewBox={`0 0 ${escala.derecha + MARGEN_DERECHO} ${total}`} aria-hidden="true" className="grafico-base__svg">
              {escala.marcas.map((m) => (
                <line key={m.fecha} x1={m.x} x2={m.x} y1={0} y2={g.alto} stroke="var(--borde)" strokeWidth={1} opacity={0.4} />
              ))}
              {cursor.tramo ? (
                <rect x={escala.x(cursor.tramo.desde) - escala.porDia / 2} y={0} width={escala.x(cursor.tramo.hasta) - escala.x(cursor.tramo.desde) + escala.porDia} height={g.alto} fill="var(--grafico-cursor)" opacity={0.08} />
              ) : null}
              <DibujoDeLaCinta g={g} escala={escala} elegido={elegido} />
              {fecha !== null && fecha >= escala.desde && fecha <= escala.hasta ? <line x1={escala.x(fecha)} x2={escala.x(fecha)} y1={0} y2={g.alto} stroke="var(--grafico-cursor)" strokeWidth={1.5} /> : null}
              {escala.marcas.map((m) => (
                <text key={`t${m.fecha}`} x={m.x} y={total - 6} textAnchor="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
                  {m.texto}
                </text>
              ))}
            </svg>
          </div>
          <p id={idDelResumen} className="visualmente-oculto">
            {resumenDeLaCinta(visibles)}
          </p>
          <div className="grafico-base__lectura" aria-live="polite">
            {elegido ? <p className="grafico-base__lectura-fecha">{textoDelEvento(elegido.evento)}</p> : null}
          </div>
          {!elegido ? (
            <p className="nota">
              {fecha !== null && enLaFecha.length > 0 ? `${textoDeLaMarca(fecha)}: ${enLaFecha.join('; ')}.` : COPY_DE_LA_CINTA.lecturaSinElegir}
            </p>
          ) : null}
          <LeyendaDeLaCinta g={g} />
          {leidaHastaElTope !== null ? <p className="nota grafico-base__nota">{COPY_DE_LA_CINTA.leidaHastaElTope(leidaHastaElTope)}</p> : null}
          <div className="grafico-base__tabla">
            <button type="button" className="boton boton--enlace" aria-expanded={conLista} aria-controls={idDeLaLista} onClick={() => setConLista((a) => !a)}>
              {conLista ? COPY_DE_LA_CINTA.ocultarLaLista : COPY_DE_LA_CINTA.verLaLista}
            </button>
            <ul id={idDeLaLista} className="grafico-cinta__lista" hidden={!conLista}>
              {conLista ? visibles.map((e) => <li key={e.clave}>{textoDelEvento(e)}</li>) : null}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export interface PropsDeLaCintaLeida extends Omit<PropsDeLaCinta, 'eventos' | 'leidaHastaElTope'> {
  /** Las lecturas van a la API con el acceso de este momento: no se guarda nada en el navegador. */
  readonly lectura: Omit<ParametrosDeLectura, 'periodo'>;
  /** Lo que el PDP dejó leer con esta persona hoy (los alcances de `leerDisponibles`). */
  readonly alcances: readonly Alcance[];
  /** Las vigencias de los planes propios del período (las de `leerDisponibles`): las barras. */
  readonly vigencias: readonly VigenciaDePlan[];
  /** Las sesiones de API-TRN-21, si ya se leyeron: de ahí salen las sustituciones. */
  readonly ejecuciones?: readonly EjecucionDeEntrenamiento[];
  /** Otras fuentes de la cinta (las notas de la tanda B). */
  readonly otras?: readonly EventoDeLaCinta[];
  /** En el cuadro del ejercicio: solo lo de ese ejercicio. */
  readonly exerciseKey?: string | null;
}

/** La cinta con su lectura de API-DSH-04: cargando con alto fijo, una falla con «Reintentar» y sin acceso, nada. */
export function CintaDelTiempoLeida({ lectura, alcances, vigencias, ejecuciones, otras, exerciseKey = null, ...cinta }: PropsDeLaCintaLeida) {
  const [estado, setEstado] = useState<LecturaDeLaCinta | null>(null);
  const [vuelta, setVuelta] = useState(0);
  const sesionPerdida = useRef(lectura.sesionPerdida);
  sesionPerdida.current = lectura.sesionPerdida;
  const { token, asesoradoId } = lectura;
  const { desde, hasta, hoy, desdeElVinculo } = cinta.periodo;
  const deLosAlcances = [...alcances].sort().join(',');
  useEffect(() => {
    let vigente = true;
    setEstado(null);
    const permitidos = deLosAlcances === '' ? [] : (deLosAlcances.split(',') as Alcance[]);
    void leerLaCinta({ token, asesoradoId, periodo: { desde, hasta, hoy, desdeElVinculo }, sesionPerdida: (r) => sesionPerdida.current(r) }, permitidos).then((r) => {
      if (vigente && r !== null) setEstado(r);
    });
    return () => {
      vigente = false;
    };
  }, [token, asesoradoId, desde, hasta, hoy, desdeElVinculo, deLosAlcances, vuelta]);
  const eventos = useMemo(
    () => (estado?.tipo === 'lista' ? eventosDeLaCinta({ alcances, entradas: estado.entradas, vigencias, ejecuciones, otras, exerciseKey }) : []),
    [estado, alcances, vigencias, ejecuciones, otras, exerciseKey],
  );
  if (estado === null) return <EstadoDelGraficoEnPantalla estado={{ tipo: 'CARGANDO' }} alto={2 * ALTO_DE_LA_FILA_DE_LA_CINTA + ALTO_DEL_EJE_DE_FECHAS} />;
  if (estado.tipo === 'sin-acceso') return <EstadoDelGraficoEnPantalla estado={{ tipo: 'SIN_ACCESO' }} />;
  if (estado.tipo === 'error') return <EstadoDelGraficoEnPantalla estado={{ tipo: 'ERROR', motivo: estado.motivo }} onReintentar={() => setVuelta((v) => v + 1)} />;
  return <CintaDelTiempo {...cinta} eventos={eventos} leidaHastaElTope={estado.truncada ? estado.entradas.length : null} />;
}
