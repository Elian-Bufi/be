'use client';

/**
 * Lo que dibuja cada tarjeta del Resumen además de sus hechos (WP-TABLERO-ALTA-GAMA TB-10; propuesta, R-3, R-4, R-5 y
 * R-8). Las cuentas salen de `piezas-del-area.ts`, sin React; acá solo se dibujan.
 * - `CifrasDesdeLaRevision`: lo nuevo desde la última revisión, en cifras en fila, con las palabras del dominio debajo.
 * - `RegistrosDelPeriodo`: la barra partida de Nutrición.
 * - `SesionesPorEjercicio`: las barras horizontales de Entrenamiento, sin pista.
 * - `PrimerPlanEnMiniatura`: los pasos de un área sin plan.
 * Las barras son decorativas: lo que dicen está escrito al lado (WCAG 1.1.1). Ninguna cambia de color por su valor.
 */
import { COPY_PRIMER_PLAN, numero, type ParteDeObservacion } from '@be/domain';
import Link from 'next/link';
import { useId, type ReactNode } from 'react';
import { Icono } from '../../../../components/icono';
import { DOS_COMPARTIMENTOS, laUltimaToma, pesosDeLasTomas, textoDeLaParticion, textoDeLasDiferencias, unDecimal } from './composicion';
import { LineaDeLosPesos, type LecturaDeLaComposicion } from './composicion-en-pantalla';
import { losRegistrosDelPeriodo, pasosDelPrimerPlan, sesionesPorEjercicio, textoDeLasComidas, textoDeLosRectificados } from './piezas-del-area';
import type { Disponibles } from './series';

/**
 * Lo nuevo desde la última revisión, en cifras: hasta tres, en fila, cada una con su texto debajo y entera como enlace a
 * la línea de tiempo filtrada. Sin nada nuevo, va la frase del dominio y ninguna cifra en cero.
 */
export function CifrasDesdeLaRevision({ partes, href, texto }: { partes: readonly ParteDeObservacion[]; href: string | null; texto: string }) {
  const cifras = partes.filter((p) => p.cifra !== null);
  const frases = partes.filter((p) => p.cifra === null);
  return (
    <div className="cifras-desde-la-revision">
      {cifras.length > 0 ? (
        <ul className="cifras-desde-la-revision__lista">
          {cifras.map((p) => (
            <li key={p.texto}>
              {href ? (
                <Link className="cifras-desde-la-revision__celda" href={href}>
                  <strong className="cifra">{p.cifra}</strong>
                  <span className="cifras-desde-la-revision__texto">{p.texto}</span>
                  <span className="visualmente-oculto"> · {texto}</span>
                </Link>
              ) : (
                <span className="cifras-desde-la-revision__celda">
                  <strong className="cifra">{p.cifra}</strong>
                  <span className="cifras-desde-la-revision__texto">{p.texto}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {frases.map((p) => (
        <p key={p.texto} className="cifras-desde-la-revision__frase">
          {p.texto}
        </p>
      ))}
    </div>
  );
}

/**
 * El envoltorio de una pieza propia. Abierta, con su título. Plegada (A13 de la propuesta: con dos o más tarjetas en
 * fila, la tarjeta no pasa su tope y los indicadores entran en la primera pantalla), el renglón que la abre lleva el
 * título y lo que se ve de un vistazo (la barra partida, o cuántos ejercicios); adentro va también lo que se plegaba
 * aparte, la cobertura del período, para que la tarjeta tenga un solo plegado.
 */
function Pieza({ titulo, plegada, aLaVista, children }: { titulo: string; plegada: boolean; aLaVista: ReactNode; children: ReactNode }) {
  const id = useId();
  if (plegada) {
    return (
      <details className="pieza-del-area pieza-del-area--plegada">
        {/* Con clase propia: los desplegables sin clase llevan la flecha y el ancho de BE (globals.css), y acá el renglón
            va de lado a lado, con la barra. */}
        <summary className="pieza-del-area__abrir">
          <Icono nombre="derecha" tamano={18} />
          <span className="pieza-del-area__titulo">{titulo}</span>
          {aLaVista}
        </summary>
        <div className="pieza-del-area__cuerpo">{children}</div>
      </details>
    );
  }
  return (
    <section className="pieza-del-area" aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`} className="pieza-del-area__titulo">
        {titulo}
      </h3>
      {aLaVista}
      {children}
    </section>
  );
}

/** La barra partida de los registros del período (Nutrición): una sola fuente y una sola ventana, la del período. */
export function RegistrosDelPeriodo({ cobertura, plegada = false, children = null }: { cobertura: Disponibles['coberturaNutricional']; plegada?: boolean; children?: ReactNode }) {
  const r = losRegistrosDelPeriodo(cobertura);
  if (!r) return null;
  const barra = (
    <span className="barra-partida" aria-hidden="true">
      {r.tramos.map((t) => (
        <span key={t.clave} className="barra-partida__tramo" data-tramo={t.clave} style={{ flexGrow: t.fraccion }} />
      ))}
    </span>
  );
  return (
    <Pieza titulo="Registros del período" plegada={plegada} aLaVista={barra}>
      <ul className="barra-partida__cuentas">
        {r.tramos.map((t) => (
          <li key={t.clave}>
            <span className="barra-partida__muestra" data-tramo={t.clave} aria-hidden="true" />
            <strong className="cifra">{t.cifra}</strong> {t.texto}
          </li>
        ))}
        {r.rectificados > 0 ? <li className="barra-partida__aparte">{textoDeLosRectificados(r.rectificados)}</li> : null}
      </ul>
      {r.comidas ? <p className="pieza-del-area__nota">{textoDeLasComidas(r.comidas)}</p> : null}
      {children}
    </Pieza>
  );
}

/** Las sesiones por ejercicio del período (Entrenamiento): barras sin pista, la cifra al final y «y N más». */
export function SesionesPorEjercicio({ ejercicios, fecha, plegada = false, children = null }: { ejercicios: Disponibles['ejercicios']; fecha: (civil: string) => string; plegada?: boolean; children?: ReactNode }) {
  const s = sesionesPorEjercicio(ejercicios);
  if (!s) return null;
  const cuantos = s.filas.length + s.mas;
  return (
    <Pieza titulo="Sesiones por ejercicio en el período" plegada={plegada} aLaVista={plegada ? <span className="tenue">{cuantos === 1 ? '1 ejercicio' : `${numero(cuantos)} ejercicios`}</span> : null}>
      <ul className="sesiones-por-ejercicio">
        {s.filas.map((e) => (
          <li key={e.clave}>
            <span className="sesiones-por-ejercicio__nombre" title={e.nombre}>
              {e.nombre}
            </span>
            <span className="sesiones-por-ejercicio__barra" aria-hidden="true">
              <span style={{ width: `${e.fraccion * 100}%` }} />
            </span>
            <span className="sesiones-por-ejercicio__cifra">
              {numero(e.sesiones)}
              <span className="visualmente-oculto">
                {' '}
                {e.sesiones === 1 ? 'sesión' : 'sesiones'}
                {e.ultima ? `, la última el ${fecha(e.ultima)}` : ''}
              </span>
            </span>
          </li>
        ))}
      </ul>
      {s.mas > 0 ? (
        <p className="pieza-del-area__nota">y {s.mas === 1 ? '1 ejercicio más' : `${numero(s.mas)} ejercicios más`}</p>
      ) : null}
      {children}
    </Pieza>
  );
}

/**
 * La composición de la última toma (Antropometría; TB-24, D-11 y TA-20): la barra horizontal del peso partido en masa
 * libre de grasa y masa grasa, con su método, y lo que cambió desde la toma anterior del mismo método. Sin una toma
 * partida, la línea de los pesos de las tomas (R-6). Sin «%» (T13). Lee API-ANT-06: la ventana de 92 días que termina en
 * la última toma.
 */
export function ComposicionDeLaUltimaToma({
  lectura,
  recargar,
  desde,
  hasta,
  fecha,
  href,
  plegada = false,
}: {
  lectura: LecturaDeLaComposicion;
  recargar: () => void;
  desde: string;
  hasta: string;
  fecha: (civil: string) => string;
  href: string;
  plegada?: boolean;
}) {
  if (lectura.tipo === 'cargando' || lectura.tipo === 'no-disponible') return null;
  if (lectura.tipo === 'error') {
    return (
      <p className="pieza-del-area__nota">
        No pudimos leer las tomas para la composición.{' '}
        <button type="button" className="boton boton--enlace" onClick={recargar}>
          Reintentar
        </button>
      </p>
    );
  }
  const ultima = laUltimaToma(lectura.tomas);
  if (ultima) {
    const p = ultima.particion;
    const barra = (
      <span className="barra-de-la-composicion" aria-hidden="true">
        <span data-parte="libre" style={{ flexGrow: p.libre }} />
        <span data-parte="grasa" style={{ flexGrow: p.grasa }} />
      </span>
    );
    return (
      <Pieza titulo="Composición de la última toma" plegada={plegada} aLaVista={barra}>
        <p className="composicion-de-la-toma__cifra">
          <strong className="cifra">{textoDeLaParticion(p)}</strong>
        </p>
        <p className="pieza-del-area__nota">
          {DOS_COMPARTIMENTOS[p.familia].nombre} · toma del {fecha(ultima.fecha)}
        </p>
        {ultima.anterior ? (
          <p className="composicion-de-la-toma__cambio">
            Desde la toma del {fecha(ultima.anterior.fecha)}: <span className="cifra">{textoDeLasDiferencias(ultima.anterior.particion, p)}</span>
          </p>
        ) : ultima.cambioDeMetodo ? (
          <p className="pieza-del-area__nota">La toma anterior se partió con otro método o protocolo: no se comparan.</p>
        ) : null}
        {ultima.despues ? (
          <p className="pieza-del-area__nota">
            Después, el {fecha(ultima.despues.fecha)}, una toma con solo el peso: {unDecimal(ultima.despues.peso)} kg.
          </p>
        ) : null}
        <p className="pieza-del-area__nota">
          <Link href={href}>Ver la composición corporal</Link>
        </p>
      </Pieza>
    );
  }
  // Sin una toma partida: la línea de los pesos de las tomas, como respaldo (R-6).
  const pesos = pesosDeLasTomas(lectura.tomas);
  if (pesos.length === 0) return null;
  const ultimo = pesos[pesos.length - 1] as (typeof pesos)[number];
  return (
    <Pieza titulo="Peso en las tomas" plegada={plegada} aLaVista={plegada ? <span className="tenue">{unDecimal(ultimo.valor)} kg</span> : null}>
      <LineaDeLosPesos pesos={pesos} desde={desde} hasta={hasta} />
      <p className="pieza-del-area__nota">
        {pesos.length === 1 ? `Una toma con peso, el ${fecha(ultimo.fecha)}: ${unDecimal(ultimo.valor)} kg.` : `${numero(pesos.length, 0)} tomas con peso; la última, el ${fecha(ultimo.fecha)}: ${unDecimal(ultimo.valor)} kg.`} Ninguna tiene un método que parta el peso
        en masa libre de grasa y masa grasa.
      </p>
    </Pieza>
  );
}

/**
 * «Empezar el plan» en miniatura (R-8; DL-145): en un área sin nada registrado, los tres pasos con el que toca abierto,
 * en lugar de «Sin datos registrados todavía». El botón lleva al Plan del área, donde están los formularios. No escribe.
 */
export function PrimerPlanEnMiniatura({ evaluacion, href }: { evaluacion: string | false | null; href: string }) {
  const pasos = pasosDelPrimerPlan(evaluacion, null);
  const ahora = pasos.find((p) => p.estado === 'ahora');
  return (
    <div className="primer-plan-en-miniatura">
      <ol className="pasos-en-miniatura">
        {pasos.map((p) => (
          <li key={p.numero} data-estado={p.estado} aria-current={p.estado === 'ahora' ? 'step' : undefined}>
            <span className="pasos-en-miniatura__circulo" aria-hidden="true">
              {p.numero}
            </span>
            <span className="pasos-en-miniatura__titulo">{p.titulo}</span>
            <span className="pasos-en-miniatura__detalle">{p.detalle}</span>
          </li>
        ))}
      </ol>
      <Link className="boton boton--secundario" href={href}>
        <Icono nombre="plan" tamano={18} />
        {COPY_PRIMER_PLAN.titulo}
        {ahora ? <span className="visualmente-oculto">: sigue {ahora.titulo}</span> : null}
      </Link>
    </div>
  );
}
