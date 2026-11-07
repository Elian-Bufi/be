'use client';

/**
 * El tramo del ciclo de revisión de un área (WP-TABLERO-ALTA-GAMA TB-10; DL-163 D-1; A10 de la propuesta): una pista
 * fina a lo ancho de la tarjeta, con lo transcurrido en neutro, hoy en `--ahora` y la fecha acordada marcada. Si venció,
 * la pista sigue en discontinua neutra y la cuenta se escribe. Sin fecha acordada no hay pista: queda el hecho.
 *
 * Es una barra de progreso para el lector de pantalla, con la frase en palabras (`aria-valuetext`, TEST-TAG-002). Las
 * puntas y las marcas son decorativas: la frase ya las dice. La fecha acordada abre las revisiones del área. Todo sale de
 * `tramoDelCiclo` (`lib/reloj.ts`), que solo lee fechas del profesional (TEST-TAG-001).
 */
import { NOMBRE_DEL_AREA, type ResumenDeEntrenamiento, type ResumenDeNutricion } from '@be/domain';
import Link from 'next/link';
import { Icono } from '../../../../components/icono';
import { nombreDelDiaDeLaSemana } from '../../../../lib/formato';
import { textosDelTramo, tramoDelCiclo } from '../../../../lib/reloj';

export function TramoDelCiclo({
  area,
  resumen,
  hoy,
  fecha,
  revisiones,
}: {
  area: 'NUTRICION' | 'ENTRENAMIENTO';
  resumen: ResumenDeNutricion | ResumenDeEntrenamiento;
  hoy: string;
  fecha: (civil: string) => string;
  /** A dónde se abren las revisiones del área. */
  revisiones: string;
}) {
  const tramo = tramoDelCiclo(resumen, hoy);
  if (!tramo) return null;
  // Con la revisión de la fecha acordada registrada y sin aplicar, el pendiente de la tarjeta ya lo dice.
  if (tramo.tipo === 'REVISADA' && !tramo.revision.aplicada) return null;
  const t = textosDelTramo(tramo, { fecha, diaDeLaSemana: nombreDelDiaDeLaSemana }, hoy);
  const titulo = (
    <p className="tramo__titulo">
      <Icono nombre="reloj" tamano={18} />
      <span>
        {tramo.tipo === 'RELOJ' ? (
          <Link href={revisiones}>
            {t.titulo}
            <span className="visualmente-oculto"> · ver las revisiones de {NOMBRE_DEL_AREA[area]}</span>
          </Link>
        ) : (
          <strong>{t.titulo}</strong>
        )}
        {t.detalle ? <span className="tenue"> · {t.detalle}</span> : null}
      </span>
    </p>
  );
  if (tramo.tipo !== 'RELOJ') return <div className="tramo tramo--sin-barra">{titulo}</div>;
  const a = tramo.avance;
  const vencido = a.tipo === 'VENCIDO';
  // Las posiciones, en porcentajes del ancho: lo transcurrido va hasta hoy, o hasta la fecha acordada si venció.
  const hasta = (vencido ? a.posicionDeLaAcordada : a.posicionDeHoy) * 100;
  const acordada = a.posicionDeLaAcordada * 100;
  return (
    <div className="tramo" data-tramo={a.tipo}>
      {titulo}
      <div
        className="tramo__pista"
        role="progressbar"
        aria-label={`Ciclo de revisión de ${NOMBRE_DEL_AREA[area]}`}
        aria-valuemin={0}
        aria-valuemax={Math.max(1, a.total)}
        aria-valuenow={vencido ? Math.max(1, a.total) : a.transcurridos}
        aria-valuetext={t.enPalabras ?? t.titulo}
      >
        <span className="tramo__transcurrido" style={{ width: `${hasta}%` }} />
        {vencido ? <span className="tramo__vencido" style={{ left: `${acordada}%` }} /> : null}
        <span className="tramo__acordada" style={{ left: `${acordada}%` }} />
        <span className="tramo__hoy" style={{ left: `${a.posicionDeHoy * 100}%` }} />
      </div>
      <p className="tramo__puntas" aria-hidden="true">
        <span>{t.inicio}</span>
        <span>{t.fin}</span>
      </p>
    </div>
  );
}
