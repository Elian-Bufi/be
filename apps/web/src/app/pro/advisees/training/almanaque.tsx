'use client';

/**
 * DL-196 (WP-EDITOR-ENTRENAMIENTO, EE-04; E7 de Dirección) · el almanaque del plan: un mes como un calendario de pared,
 * de lunes a domingo. Lo arma el dominio (`mesDelAlmanaque`):
 * - **cada semana, del color de su fase** (el renglón entero), con la fase nombrada en la leyenda;
 * - **los días de sesión, con un círculo y su letra** (la de la sesión en su fase: A, B, C);
 * - **flechas para cambiar de mes;**
 * - **tocar un día lleva a esa sesión** (su fase y su sesión quedan elegidas en el editor).
 *
 * Accesible: una tabla con su título, los días como celdas con su fecha entera y, en los de sesión, un botón que dice qué
 * sesión es y de qué fase. Las flechas ← y → pasan de un día de sesión al siguiente; Tab sigue el orden de la página.
 */
import { DIAS_DE_LA_SEMANA, mesDelAlmanaque, otroMes, type AgendaDeEntrenamiento, type FaseEnElCalendario, type MesDelAlmanaque, type VentanasDeLasSesiones } from '@be/domain';
import { useId, useRef, type KeyboardEvent } from 'react';
import { Icono } from '../../../../components/icono';
import { diaConSuSemana } from '../../../../lib/formato';
import { DIA_CORTO, DIA_LARGO } from '../estacion/estacion';
import { colorDeLaFase } from './fases-del-plan';

export const COPY_ALMANAQUE = {
  titulo: 'Almanaque',
  anterior: 'Mes anterior',
  siguiente: 'Mes siguiente',
  // DL-199 (ET3, E5): una sola indicación, con dónde se hace; qué muestra el almanaque se ve cuando tiene fechas.
  sinFechas: 'Sin fechas todavía: elegí el inicio en «Configurar plan».',
  hoy: 'hoy',
  delDia: (fecha: string, sesiones: readonly string[], fase: string | null) =>
    `${diaConSuSemana(fecha)}: ${sesiones.join(' y ')}${fase ? `, ${fase}` : ''}. Ir a la sesión.`,
} as const;

const NOMBRE_DEL_MES = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const nombreDelMes = (mes: MesDelAlmanaque): string => {
  const t = NOMBRE_DEL_MES.format(new Date(`${mes}-15T12:00:00Z`));
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Una sesión del plan, para el almanaque: su nombre, su letra en la fase y la fase a la que pertenece. */
export interface SesionDelAlmanaque {
  readonly nombre: string;
  readonly letra: string;
  readonly fase: number;
}

export function Almanaque({
  mes,
  onMes,
  fases,
  nombresDeLasFases,
  agenda,
  ventanas,
  sesiones,
  hoy,
  onIrALaSesion,
  meses = 1,
}: {
  mes: MesDelAlmanaque;
  onMes: (m: MesDelAlmanaque) => void;
  fases: readonly (FaseEnElCalendario | null)[];
  nombresDeLasFases: readonly string[];
  agenda: AgendaDeEntrenamiento | null;
  ventanas: VentanasDeLasSesiones;
  /** Las sesiones por su identificador. */
  sesiones: ReadonlyMap<string, SesionDelAlmanaque>;
  hoy: string;
  onIrALaSesion: (sessionId: string) => void;
  /** Cuántos meses seguidos (en «Abrir grande», tres). */
  meses?: number;
}) {
  const id = useId();
  const tabla = useRef<HTMLDivElement>(null);
  const conFechas = fases.some((f) => f !== null);
  // ← y →: de un día de sesión al anterior o al siguiente, también de un mes al otro cuando hay varios.
  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const botones = [...(tabla.current?.querySelectorAll<HTMLButtonElement>('[data-dia-del-almanaque]') ?? [])];
    const n = botones.indexOf(document.activeElement as HTMLButtonElement);
    if (n < 0) return;
    const destino = botones[n + (e.key === 'ArrowRight' ? 1 : -1)];
    if (!destino) return;
    e.preventDefault();
    destino.focus();
  };
  return (
    <div className="almanaque" data-almanaque data-recorrido="editor-entrenamiento-almanaque">
      <div className="almanaque__mes">
        <button type="button" className="boton boton--quieto boton--compacto almanaque__flecha" aria-label={COPY_ALMANAQUE.anterior} onClick={() => onMes(otroMes(mes, -1))} data-mes-anterior>
          <Icono nombre="izquierda" tamano={18} />
        </button>
        <p className="almanaque__nombre" aria-live="polite" id={`${id}-mes`}>
          {meses > 1 ? `${nombreDelMes(mes)} – ${nombreDelMes(otroMes(mes, meses - 1))}` : nombreDelMes(mes)}
        </p>
        <button type="button" className="boton boton--quieto boton--compacto almanaque__flecha" aria-label={COPY_ALMANAQUE.siguiente} onClick={() => onMes(otroMes(mes, 1))} data-mes-siguiente>
          <Icono nombre="derecha" tamano={18} />
        </button>
      </div>
      {!conFechas ? (
        <p className="nota almanaque__sin-fechas" data-almanaque-sin-fechas>
          {COPY_ALMANAQUE.sinFechas}
        </p>
      ) : null}
      <div ref={tabla} className={meses > 1 ? 'almanaque__meses almanaque__meses--varios' : 'almanaque__meses'} onKeyDown={alTeclear}>
        {Array.from({ length: meses }, (_, m) => otroMes(mes, m)).map((esteMes) => (
          <table key={esteMes} className="almanaque__tabla" aria-label={nombreDelMes(esteMes)} data-mes-del-almanaque={esteMes}>
            {meses > 1 ? <caption className="almanaque__titulo-del-mes">{nombreDelMes(esteMes)}</caption> : null}
            <thead>
              <tr>
                {DIAS_DE_LA_SEMANA.map((d) => (
                  <th key={d} scope="col" abbr={DIA_LARGO[d]}>
                    {DIA_CORTO[d]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mesDelAlmanaque(esteMes, fases, agenda, ventanas, hoy).map((semana) => (
                <tr
                  key={semana.dias[0]!.fecha}
                  className="almanaque__semana"
                  data-fase={semana.fase === null ? undefined : colorDeLaFase(semana.fase)}
                  title={semana.fase === null ? undefined : nombresDeLasFases[semana.fase]}
                >
                  {semana.dias.map((d) => {
                    const deSesion = d.sesiones.flatMap((s) => {
                      const x = sesiones.get(s);
                      return x ? [x] : [];
                    });
                    const fase = d.fase === null ? null : (nombresDeLasFases[d.fase] ?? null);
                    const numero = Number(d.fecha.slice(8));
                    return (
                      <td key={d.fecha} className="almanaque__dia" data-del-mes={d.delMes ? '' : undefined} data-hoy={d.hoy ? '' : undefined} aria-current={d.hoy ? 'date' : undefined}>
                        {deSesion.length > 0 ? (
                          <button
                            type="button"
                            className="almanaque__sesion"
                            data-dia-del-almanaque={d.fecha}
                            aria-label={COPY_ALMANAQUE.delDia(d.fecha, deSesion.map((s) => s.nombre), fase)}
                            onClick={() => onIrALaSesion(d.sesiones[0]!)}
                          >
                            <span className="almanaque__numero">{numero}</span>
                            <span className="almanaque__letras" aria-hidden="true">
                              {deSesion.map((s) => s.letra).join('')}
                            </span>
                          </button>
                        ) : (
                          <span className="almanaque__numero">
                            <span aria-hidden="true">{numero}</span>
                            <span className="visualmente-oculto">{diaConSuSemana(d.fecha)}</span>
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
      {conFechas ? (
        <ul className="almanaque__leyenda" aria-label="Fases">
          {fases.map((f, n) =>
            f ? (
              <li key={f.blockId} data-fase={colorDeLaFase(n)}>
                <span className="almanaque__muestra" aria-hidden="true" />
                {nombresDeLasFases[n]}
              </li>
            ) : null,
          )}
        </ul>
      ) : null}
    </div>
  );
}
