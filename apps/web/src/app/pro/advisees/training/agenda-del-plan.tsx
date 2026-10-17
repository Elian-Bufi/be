'use client';

/**
 * WP-AGENDA-DE-ENTRENAMIENTO (DL-137): los días de entrenamiento de la versión en preparación.
 * - **Cada sesión guardada elige sus días de la semana,** y la agenda empieza en una fecha: BE arma con eso las fechas
 *   exactas. Una sesión nueva todavía no tiene identificador: sus días se eligen después de guardar.
 * - **Las dos semanas que siguen se ven como calendario.** Una fecha suelta se puede pasar a otro día («Mover») y volver
 *   a su día; mover otra vez una fecha ya movida cambia su destino.
 * - **Lo que no se puede guardar no entra:** un movimiento que choca o que cae antes del inicio se explica acá, con las
 *   palabras de la agenda, y no se aplica. Al sacar un día, los movimientos que dejan de tener sentido se van con él.
 * La agenda viaja con «Guardar cambios», como el resto del borrador (API-TRN-10), y se lee en API-SER-01.
 */
import {
  COPY_AGENDA_DE_ENTRENAMIENTO as A,
  DIA_ABREVIADO,
  DIAS_DE_LA_SEMANA,
  NOMBRE_DEL_DIA,
  PROBLEMA_DE_AGENDA,
  diaDeLaSemana,
  fechaDeLaAgenda,
  fechasPrevistas,
  problemasDeAgenda,
  type AgendaDeEntrenamiento,
  type DiaDeLaSemana,
} from '@be/domain';
import { useState } from 'react';
import { Aviso, Campo } from '../../../../components/formulario';

/** Una sesión del plan, en su orden: con su identificador si ya se guardó. */
export interface SesionDeLaAgenda {
  readonly sessionId: string | null;
  /** «A · Tren inferior (Fuerza: progresión)»: con el bloque, si hay más de uno, y el microciclo, si lo hay. */
  readonly nombre: string;
  /** «A · Tren inferior»: el de la sesión, para el calendario. */
  readonly corto: string;
}

/** Lo mínimo de un bloque para nombrar sus sesiones: sirve para el borrador que se edita y para una versión que se lee. */
interface BloqueConSesiones {
  readonly label: string;
  readonly sessions?: readonly { readonly sessionId?: string; readonly label: string }[] | null;
  readonly microcycles?: readonly { readonly label: string; readonly sessions: readonly { readonly sessionId?: string; readonly label: string }[] }[] | null;
}

const nombre = (label: string, queEs: string, n: number): string => label.trim() || `${queEs} ${n + 1}`;

/**
 * Todas las sesiones del plan, en orden, para la agenda: con su identificador si ya se guardaron, y un nombre que no se
 * confunde (el bloque, si hay más de uno, y el microciclo, si el bloque los usa).
 */
export function sesionesParaLaAgenda(bloques: readonly BloqueConSesiones[]): SesionDeLaAgenda[] {
  const una = (sessionId: string | undefined, corto: string, contexto: readonly string[]): SesionDeLaAgenda => ({
    sessionId: sessionId ?? null,
    corto,
    nombre: contexto.length > 0 ? `${corto} (${contexto.join(', ')})` : corto,
  });
  return bloques.flatMap((b, bi) => {
    const delBloque = bloques.length > 1 ? [nombre(b.label, 'Bloque', bi)] : [];
    const directas = (b.sessions ?? []).map((s, si) => una(s.sessionId, nombre(s.label, 'Sesión', si), delBloque));
    const enMicrociclos = (b.microcycles ?? []).flatMap((m, mi) => m.sessions.map((s, si) => una(s.sessionId, nombre(s.label, 'Sesión', si), [...delBloque, nombre(m.label, 'Microciclo', mi)])));
    return [...directas, ...enMicrociclos];
  });
}

const DIA = 86_400_000;
const sumarDias = (fecha: string, dias: number): string => new Date(new Date(`${fecha}T00:00:00.000Z`).getTime() + dias * DIA).toISOString().slice(0, 10);
/** El lunes de la semana de una fecha: el calendario empieza siempre en lunes. */
const lunesDe = (fecha: string): string => sumarDias(fecha, -DIAS_DE_LA_SEMANA.indexOf(diaDeLaSemana(fecha)));
const numeroDelDia = (fecha: string): number => Number(fecha.slice(8, 10));
const mesCorto = (fecha: string): string => new Intl.DateTimeFormat('es-AR', { month: 'short', timeZone: 'UTC' }).format(new Date(`${fecha}T12:00:00Z`)).replace('.', '');

/**
 * La agenda sin las sesiones que ya no están en el plan (se sacaron sin guardar todavía) y sin los movimientos que dejan
 * de tener sentido: los que la validación rechazaría. Es lo que se ve y lo que se guarda.
 */
export function agendaVigente(agenda: AgendaDeEntrenamiento | null, sesiones: readonly SesionDeLaAgenda[]): AgendaDeEntrenamiento | null {
  if (!agenda) return null;
  const ids = new Set(sesiones.flatMap((s) => (s.sessionId ? [s.sessionId] : [])));
  let limpia: AgendaDeEntrenamiento = {
    startDate: agenda.startDate,
    sessions: agenda.sessions.filter((s) => ids.has(s.sessionId)),
    moves: agenda.moves.filter((m) => ids.has(m.sessionId)),
  };
  // Un movimiento que la validación rechaza se cae; se repite porque sacar uno puede arreglar otro.
  for (let vuelta = 0; vuelta < 5; vuelta++) {
    const malos = new Set(problemasDeAgenda(limpia, ids).flatMap((p) => /^agenda\.moves\[(\d+)\]/.exec(p.path)?.[1] ?? []).map(Number));
    if (malos.size === 0) break;
    limpia = { ...limpia, moves: limpia.moves.filter((_, n) => !malos.has(n)) };
  }
  return limpia;
}

/** «Lunes y jueves: Torso», una por sesión con días, en el orden del plan. */
export function lineasDeLaAgenda(agenda: AgendaDeEntrenamiento, sesiones: readonly SesionDeLaAgenda[]): string[] {
  return sesiones.flatMap((s) => {
    const dias = agenda.sessions.find((x) => x.sessionId === s.sessionId)?.weekdays ?? [];
    return dias.length > 0 ? [`${A.diasDeLaSesion(dias)}: ${s.nombre}`] : [];
  });
}

/** «Lunes y jueves: Torso; Miércoles: Piernas. Desde el lunes 19 de octubre.», o que todavía no hay días. */
export function resumenDeLaAgenda(agenda: AgendaDeEntrenamiento, sesiones: readonly SesionDeLaAgenda[]): string {
  const lineas = lineasDeLaAgenda(agenda, sesiones);
  return lineas.length > 0 ? A.resumen(lineas, agenda.startDate) : A.ningunaSesionConDias;
}

export function AgendaDelPlan({
  agenda,
  sesiones,
  hoy,
  abierta,
  onAbrir,
  onCerrar,
  onCambiar,
}: {
  /** La agenda vigente (`agendaVigente`), o `null` si la versión no tiene. */
  agenda: AgendaDeEntrenamiento | null;
  sesiones: readonly SesionDeLaAgenda[];
  /** La fecha local de hoy: el calendario no mira para atrás. */
  hoy: string;
  abierta: boolean;
  onAbrir: () => void;
  onCerrar: () => void;
  onCambiar: (agenda: AgendaDeEntrenamiento | null) => void;
}) {
  const [moviendo, setMoviendo] = useState<{ readonly sessionId: string; readonly desde: string; readonly hacia: string } | null>(null);
  const [problema, setProblema] = useState<string | null>(null);
  const ids = new Set(sesiones.flatMap((s) => (s.sessionId ? [s.sessionId] : [])));
  const nombreDe = (sessionId: string): string => sesiones.find((s) => s.sessionId === sessionId)?.nombre ?? A.sesion;
  const cortoDe = (sessionId: string): string => sesiones.find((s) => s.sessionId === sessionId)?.corto ?? A.sesion;

  const abrir = () => {
    if (!agenda) onCambiar({ startDate: hoy, sessions: [], moves: [] });
    onAbrir();
  };

  if (!abierta || !agenda) {
    return (
      <section className="agenda-del-plan" aria-labelledby="titulo-agenda" data-agenda={agenda ? 'con-dias' : 'sin-dias'}>
        <div className="agenda-del-plan__cabecera">
          <h3 id="titulo-agenda">{A.titulo}</h3>
          <button type="button" className="boton boton--quieto boton--compacto" data-abrir-agenda onClick={abrir}>
            {agenda ? A.cambiarDias : A.ponerDias}
          </button>
        </div>
        {agenda && lineasDeLaAgenda(agenda, sesiones).length > 0 ? (
          <ul className="agenda-del-plan__resumen" data-resumen-de-la-agenda>
            {lineasDeLaAgenda(agenda, sesiones).map((l) => (
              <li key={l}>{l}</li>
            ))}
            <li className="nota">{A.desdeLa(agenda.startDate)}</li>
          </ul>
        ) : (
          <p className="nota" data-resumen-de-la-agenda>
            {agenda ? A.ningunaSesionConDias : A.sinAgenda}
          </p>
        )}
      </section>
    );
  }

  /** Cambia los días de una sesión; los movimientos que ya no tienen sentido se van con el día. */
  const alternarDia = (sessionId: string, dia: DiaDeLaSemana) => {
    const actuales = agenda.sessions.find((s) => s.sessionId === sessionId)?.weekdays ?? [];
    const nuevos = actuales.includes(dia) ? actuales.filter((d) => d !== dia) : [...actuales, dia];
    // En el orden de las sesiones del plan y de la semana: así se ven igual en todos lados.
    const sessions = sesiones.flatMap((s) => {
      if (!s.sessionId) return [];
      const weekdays = s.sessionId === sessionId ? DIAS_DE_LA_SEMANA.filter((d) => nuevos.includes(d)) : (agenda.sessions.find((x) => x.sessionId === s.sessionId)?.weekdays ?? []);
      return weekdays.length > 0 ? [{ sessionId: s.sessionId, weekdays }] : [];
    });
    setProblema(null);
    onCambiar(agendaVigente({ ...agenda, sessions }, sesiones));
  };

  const cambiarInicio = (fecha: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return;
    setProblema(null);
    onCambiar(agendaVigente({ ...agenda, startDate: fecha }, sesiones));
  };

  /** Pasa una fecha a otra. Si ya estaba movida, cambia su destino; si vuelve a su día, deja de estar movida. */
  const mover = () => {
    if (!moviendo || !/^\d{4}-\d{2}-\d{2}$/.test(moviendo.hacia)) return;
    const previo = agenda.moves.find((m) => m.sessionId === moviendo.sessionId && m.to === moviendo.desde);
    const origen = previo ? previo.from : moviendo.desde;
    const resto = agenda.moves.filter((m) => m !== previo);
    const moves = origen === moviendo.hacia ? resto : [...resto, { sessionId: moviendo.sessionId, from: origen, to: moviendo.hacia }];
    const nueva = { ...agenda, moves };
    const problemas = problemasDeAgenda(nueva, ids);
    if (problemas.length > 0) return setProblema(problemas.map((p) => PROBLEMA_DE_AGENDA[p.code]).join('; '));
    setProblema(null);
    setMoviendo(null);
    onCambiar(nueva);
  };

  const deshacer = (sessionId: string, hacia: string) => {
    setProblema(null);
    onCambiar({ ...agenda, moves: agenda.moves.filter((m) => !(m.sessionId === sessionId && m.to === hacia)) });
  };

  // Dos semanas, de lunes a domingo, desde la semana de hoy o la del inicio, la que venga después.
  const desde = lunesDe(agenda.startDate > hoy ? agenda.startDate : hoy);
  const dias = Array.from({ length: 14 }, (_, n) => sumarDias(desde, n));
  const previstas = fechasPrevistas(agenda, desde, dias[dias.length - 1]!);

  return (
    <section className="agenda-del-plan agenda-del-plan--abierta" aria-labelledby="titulo-agenda" data-agenda="editando">
      <div className="agenda-del-plan__cabecera">
        <h3 id="titulo-agenda">{A.titulo}</h3>
        <button type="button" className="boton boton--secundario boton--compacto" data-cerrar-agenda onClick={onCerrar}>
          {A.ocultar}
        </button>
      </div>
      <div className="agenda-del-plan__inicio">
        <Campo id="agenda-desde" etiqueta={A.desde} ayuda={A.desdeAyuda} type="date" value={agenda.startDate} onChange={(e) => cambiarInicio(e.target.value)} />
      </div>

      <table className="agenda-del-plan__semana">
        <caption className="visualmente-oculto">{A.titulo}</caption>
        <thead>
          <tr>
            <th scope="col">{A.sesion}</th>
            {DIAS_DE_LA_SEMANA.map((d) => (
              <th key={d} scope="col">
                <abbr title={NOMBRE_DEL_DIA[d]}>{DIA_ABREVIADO[d]}</abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sesiones.map((s, n) => {
            const elegidos = s.sessionId ? (agenda.sessions.find((x) => x.sessionId === s.sessionId)?.weekdays ?? []) : [];
            return (
              <tr key={s.sessionId ?? `nueva-${n}`} data-sesion-de-la-agenda={n + 1}>
                <th scope="row">{s.nombre}</th>
                {s.sessionId ? (
                  DIAS_DE_LA_SEMANA.map((d) => (
                    <td key={d}>
                      <button
                        type="button"
                        className="chip agenda-del-plan__dia"
                        aria-pressed={elegidos.includes(d)}
                        aria-label={`${s.nombre}, ${NOMBRE_DEL_DIA[d]}`}
                        onClick={() => alternarDia(s.sessionId as string, d)}
                      >
                        {DIA_ABREVIADO[d]}
                      </button>
                    </td>
                  ))
                ) : (
                  <td colSpan={7} className="nota">
                    {A.sesionNueva}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      <h4 className="agenda-del-plan__subtitulo">{A.proximasDosSemanas}</h4>
      {previstas.length === 0 ? <p className="nota">{A.sinFechasEnEstasSemanas}</p> : null}
      <ol className="agenda-del-plan__calendario" aria-label={A.proximasDosSemanas}>
        {dias.map((fecha, n) => {
          const delDia = previstas.filter((p) => p.date === fecha);
          const pasado = fecha < hoy || fecha < agenda.startDate;
          return (
            <li key={fecha} className="agenda-del-plan__fecha" data-pasado={pasado || undefined} data-hoy={fecha === hoy || undefined}>
              <span className="agenda-del-plan__numero">
                <span className="visualmente-oculto">{fechaDeLaAgenda(fecha)}</span>
                <span aria-hidden="true">
                  {DIA_ABREVIADO[diaDeLaSemana(fecha)]} {numeroDelDia(fecha)}
                  {n === 0 || numeroDelDia(fecha) === 1 ? ` ${mesCorto(fecha)}` : ''}
                </span>
              </span>
              <ul className="agenda-del-plan__sesiones">
                {delDia.map((p) => {
                  const movida = agenda.moves.find((m) => m.sessionId === p.sessionId && m.to === fecha);
                  return (
                    <li key={p.sessionId} className="agenda-del-plan__sesion" data-movida={movida ? true : undefined}>
                      <span title={nombreDe(p.sessionId)}>{cortoDe(p.sessionId)}</span>
                      {movida ? <span className="nota">{A.movidaDesde(movida.from)}</span> : null}
                      {!pasado ? (
                        <span className="agenda-del-plan__acciones">
                          <button type="button" className="boton boton--enlace" onClick={() => setMoviendo({ sessionId: p.sessionId, desde: fecha, hacia: sumarDias(fecha, 1) })}>
                            {A.mover}
                            <span className="visualmente-oculto">
                              {' '}
                              {nombreDe(p.sessionId)}, {fechaDeLaAgenda(fecha)}
                            </span>
                          </button>
                          {movida ? (
                            <button type="button" className="boton boton--enlace" onClick={() => deshacer(p.sessionId, fecha)}>
                              {A.deshacerMovimiento}
                            </button>
                          ) : null}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>

      {moviendo ? (
        <div className="agenda-del-plan__mover" role="group" aria-label={`${A.mover} ${nombreDe(moviendo.sessionId)}, ${fechaDeLaAgenda(moviendo.desde)}`}>
          <p>
            <strong>{nombreDe(moviendo.sessionId)}</strong>, {fechaDeLaAgenda(moviendo.desde)}
          </p>
          <Campo id="agenda-mover-a" etiqueta={A.moverA} type="date" value={moviendo.hacia} min={agenda.startDate} onChange={(e) => setMoviendo({ ...moviendo, hacia: e.target.value })} />
          <div className="acciones">
            <button type="button" className="boton boton--secundario boton--compacto" onClick={() => (setMoviendo(null), setProblema(null))}>
              {A.moverCancelar}
            </button>
            <button type="button" className="boton boton--primario boton--compacto" onClick={mover}>
              {A.moverConfirmar}
            </button>
          </div>
        </div>
      ) : null}
      {problema ? (
        <Aviso tipo="error" enfocar>
          <p>{problema}</p>
        </Aviso>
      ) : null}

      <p className="nota agenda-del-plan__avisos">{A.avisos}</p>
      <p className="nota">
        <button type="button" className="boton boton--enlace" data-quitar-agenda onClick={() => (onCambiar(null), onCerrar())}>
          {A.quitarDias}
        </button>{' '}
        {A.quitarDiasAyuda}
      </p>
    </section>
  );
}
