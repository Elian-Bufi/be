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
import { useId } from 'react';
import { Icono } from '../../../../components/icono';
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

/** La barra partida de los registros del período (Nutrición): una sola fuente y una sola ventana, la del período. */
export function RegistrosDelPeriodo({ cobertura }: { cobertura: Disponibles['coberturaNutricional'] }) {
  const id = useId();
  const r = losRegistrosDelPeriodo(cobertura);
  if (!r) return null;
  return (
    <section className="pieza-del-area" aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`} className="pieza-del-area__titulo">
        Registros del período
      </h3>
      <div className="barra-partida" aria-hidden="true">
        {r.tramos.map((t) => (
          <span key={t.clave} className="barra-partida__tramo" data-tramo={t.clave} style={{ flexGrow: t.fraccion }} />
        ))}
      </div>
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
    </section>
  );
}

/** Las sesiones por ejercicio del período (Entrenamiento): barras sin pista, la cifra al final y «y N más». */
export function SesionesPorEjercicio({ ejercicios, fecha }: { ejercicios: Disponibles['ejercicios']; fecha: (civil: string) => string }) {
  const id = useId();
  const s = sesionesPorEjercicio(ejercicios);
  if (!s) return null;
  return (
    <section className="pieza-del-area" aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`} className="pieza-del-area__titulo">
        Sesiones por ejercicio en el período
      </h3>
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
    </section>
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
