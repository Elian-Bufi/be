'use client';

/**
 * ED-73 · «Cómo se calculó» (WP-EDITORES-PROFESIONAL §5.8; V3 F-02; maqueta 16). Se abre desde cualquier valor: la
 * tarjeta del ejercicio, un punto de la evolución o el cuadro de la carga. Dentro de otro cuadro, en el mismo, con
 * «Atrás» (ED-10). Dice qué es, los datos y quién los escribió, la cuenta con sus números, la banda y el método con la
 * regla del RIR, qué no significa y, en esa sesión, qué series no entraron y por qué.
 *
 * La cuenta sale de las entradas del punto, no de un valor guardado: con una versión nueva del método, sigue dando lo
 * mismo (RM-18).
 */
import { COPY_FUERZA, estimacionALaVista, estimacionConLaDecima, laCuentaDeLaEstimacion, type PuntoDeFuerza } from '@be/domain';
import { Enlace } from '../../../../components/enlace';
import { useNombres } from '../../../../lib/nombres-ocultos';
import { estimacionDelPunto, haciaLaSesion, loQueNoEntroEnLaSesion, type SerieQueNoEntro } from './fuerza';

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** «viernes 18 de diciembre»: la fecha civil tal como vino, sin pasar por una zona (RM-15). */
export function fechaLarga(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number);
  const dia = new Date(Date.UTC(a!, m! - 1, d!, 12)).getUTCDay();
  return `${DIAS[dia]} ${d} de ${MESES[m! - 1]}`;
}

export const COPY_COMO_SE_CALCULO = {
  titulo: 'Cómo se calculó',
  dato: 'Dato',
  valor: 'Valor',
  quien: 'Quién lo escribió',
  carga: 'Carga',
  repeticiones: 'Repeticiones',
  rir: 'RIR',
  fecha: 'Fecha',
  verLaSesion: 'Ver la sesión',
  aLaVista: 'A la vista, al medio kilo:',
  aLaVistaLb: 'A la vista, a la libra:',
  bandaYMetodo: 'La banda y el método',
  queNoSignifica: 'Qué no significa',
  enEsaSesion: 'En esa sesión',
  todasEntraron: 'Ninguna otra serie del ejercicio quedó afuera.',
  laQueSeToma: 'es la que se toma.',
  regla: 'La regla por sesión: si entra más de una serie, se toma la de mayor carga, nunca la de mayor estimación. Por eso puede no ser el valor más alto de la sesión.',
  version: 'Con una versión nueva del método, esta cuenta sigue dando lo mismo.',
} as const;

/** El contenido del cuadro: lo usan el detalle del ejercicio (en el mismo cuadro) y «Analizar» (en el suyo). */
export function ComoSeCalculo({ punto: p, nombre, asesoradoId, noEntraron }: { punto: PuntoDeFuerza; nombre: string; asesoradoId: string; noEntraron: readonly SerieQueNoEntro[] }) {
  const e = estimacionDelPunto(p, '');
  const C = COPY_COMO_SE_CALCULO;
  const autor = useNombres().deQuien(p.writtenBy, asesoradoId);
  const quien = p.source === 'OBSERVED' ? `${autor}, que la observó` : `${autor}, en la app`;
  const sesion = haciaLaSesion(asesoradoId, p);
  const fuera = loQueNoEntroEnLaSesion(p, noEntraron);
  const banda = COPY_FUERZA.banda[e.banda];
  return (
    <div className="como-se-calculo" data-como-se-calculo>
      <p className="como-se-calculo__subtitulo nota">
        {nombre} · {fechaLarga(p.date)}
      </p>
      <p className="como-se-calculo__que-es">{COPY_FUERZA.queEs}</p>
      <table className="tabla como-se-calculo__datos">
        <caption className="visualmente-oculto">Los datos de la serie y quién los escribió</caption>
        <thead>
          <tr>
            <th scope="col">{C.dato}</th>
            <th scope="col">{C.valor}</th>
            <th scope="col">{C.quien}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{C.carga}</th>
            <td>
              <strong>
                {String(e.carga).replace('.', ',')} {e.unidad}
              </strong>
            </td>
            <td>{quien}</td>
          </tr>
          <tr>
            <th scope="row">{C.repeticiones}</th>
            <td>
              <strong>{e.repeticiones}</strong>
            </td>
            <td>{quien}</td>
          </tr>
          <tr>
            <th scope="row">{C.rir}</th>
            <td>
              <strong>{String(e.rir).replace('.', ',')}</strong>
            </td>
            <td>{quien}</td>
          </tr>
          <tr>
            <th scope="row">{C.fecha}</th>
            <td colSpan={2}>
              {fechaLarga(p.date)}, la fecha de {p.source === 'OBSERVED' ? 'la observación' : 'la sesión'}
              {sesion ? (
                <>
                  {' · '}
                  <Enlace href={sesion}>{C.verLaSesion}</Enlace>
                </>
              ) : null}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="como-se-calculo__cuenta" data-cuenta>
        <p>
          <strong>{laCuentaDeLaEstimacion(e)}</strong>
        </p>
        <p className="nota">
          {e.unidad === 'kg' ? C.aLaVista : C.aLaVistaLb} {estimacionALaVista(e)}.
        </p>
      </div>
      <div className="como-se-calculo__par">
        <div className="como-se-calculo__caja">
          <h3>{C.bandaYMetodo}</h3>
          <p>
            {banda[0]!.toUpperCase()}
            {banda.slice(1)}. {COPY_FUERZA.metodo}, la especificación de BE en su versión 1.
          </p>
          <p className="nota" data-regla-del-rir>
            {COPY_FUERZA.reglaDelRir}
          </p>
        </div>
        <div className="como-se-calculo__caja">
          <h3>{C.queNoSignifica}</h3>
          <p>{COPY_FUERZA.queNoSignifica(estimacionConLaDecima(e))}</p>
        </div>
      </div>
      {p.origin.type === 'TRAINING_EXECUTION' ? (
        <div className="como-se-calculo__sesion">
          <h3>{C.enEsaSesion}</h3>
          <p>
            <strong>
              Serie {p.origin.setIndex} · {String(e.carga).replace('.', ',')} {e.unidad} × {e.repeticiones} · RIR {String(e.rir).replace('.', ',')}: {C.laQueSeToma}
            </strong>
          </p>
          <p className="nota" data-regla-por-sesion>
            {C.regla}
          </p>
          {fuera.length === 0 ? (
            <p className="nota">{C.todasEntraron}</p>
          ) : (
            <ul className="como-se-calculo__fuera" data-no-entraron>
              {fuera.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="nota">La observó {autor}: BE la guardó con la fecha, el autor y el método, y no se edita.</p>
      )}
      <p className="nota como-se-calculo__version">{C.version}</p>
    </div>
  );
}
