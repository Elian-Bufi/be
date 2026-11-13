'use client';

/**
 * «¿Cuándo la revisás?» (WP-TABLERO-ALTA-GAMA TB-15; DL-163 D-6): la fecha de la próxima revisión, con opciones para
 * tocar, en el paso 3 de la revisión de Nutrición y de Entrenamiento («Lo que decidís») y en el cuadro de activar un
 * plan. El modelo y los textos están en `lib/cuando-la-revisas.ts`.
 * - Es un grupo de botones de radio con su pregunta como leyenda: «En 1 semana · miércoles 11 nov», «En 2 semanas»,
 *   «En 4 semanas», «Elegir una fecha» (que abre el campo de la fecha) y, si se puede, «Sin fecha por ahora».
 * - Nada viene elegido. Al elegir, el efecto se escribe debajo, en el acto que fija la fecha.
 * - El ciclo que se acordó la última vez va como dato, nunca como opción elegida.
 */
import { useId } from 'react';
import { CampoDeFecha } from '../../../components/campo-de-fecha';
import { diaDelAnioEnCurso, nombreDelDiaDeLaSemana } from '../../../lib/formato';
import { claveDeLaEleccion, COPY_CUANDO, fechaQueResulta, opcionesDeLaPregunta, type EleccionDeLaProxima, type MomentoDeLaPregunta } from '../../../lib/cuando-la-revisas';
import { ErrorDelCampo } from './revision-en-preparacion';

export function CuandoLaRevisas({
  id,
  hoy,
  momento,
  conSinFecha,
  primerPlan = false,
  eleccion,
  alElegir,
  ciclo = null,
  error = null,
  aviso = null,
}: {
  /** El del grupo: el resumen de errores lleva el foco acá. */
  id: string;
  /** La fecha civil de hoy, desde la que se cuentan las semanas. */
  hoy: string;
  momento: MomentoDeLaPregunta;
  /** «Sin fecha por ahora» no se ofrece con «Reprogramar revisión» (REG-06-145). */
  conSinFecha: boolean;
  /** Al activar el primer plan del área: sin fecha, no hay ninguna revisión acordada. */
  primerPlan?: boolean;
  eleccion: EleccionDeLaProxima;
  alElegir: (e: EleccionDeLaProxima) => void;
  /** «a las 4 semanas»: lo que se acordó la última vez, como dato. */
  ciclo?: string | null;
  error?: string | null;
  /** Lo que falta para seguir, sin marcarlo como error (el cuadro de activar espera a que se elija). */
  aviso?: string | null;
}) {
  const nombre = useId();
  const enPalabras = (f: string) => `${nombreDelDiaDeLaSemana(f)} ${diaDelAnioEnCurso(f, hoy)}`;
  const opciones = opcionesDeLaPregunta(hoy, conSinFecha, enPalabras);
  const elegida = claveDeLaEleccion(eleccion);
  const fecha = fechaQueResulta(eleccion, hoy);
  const efecto = fecha === null ? COPY_CUANDO.efectoSinFecha(momento, primerPlan) : fecha ? COPY_CUANDO.efecto(momento, enPalabras(fecha)) : null;
  const describe = [ciclo ? `${id}-ciclo` : null, error ? `${id}-error` : null, aviso && !error ? `${id}-aviso` : null].filter(Boolean).join(' ') || undefined;

  return (
    <fieldset className={`cuando-la-revisas${error ? ' campo--error' : ''}`} id={id} tabIndex={-1} aria-invalid={error ? true : undefined} aria-describedby={describe} data-cuando-la-revisas={elegida ?? 'nada'}>
      <legend className="cuando-la-revisas__pregunta">{COPY_CUANDO.pregunta}</legend>
      {ciclo ? (
        <p id={`${id}-ciclo`} className="campo__ayuda">
          {COPY_CUANDO.cicloAntes(ciclo)}
        </p>
      ) : null}
      <ErrorDelCampo id={id} texto={error} />
      <div className="cuando-la-revisas__opciones">
        {opciones.map((o) => (
          <label key={o.clave} className="cuando-la-revisas__opcion">
            <input
              type="radio"
              name={nombre}
              value={o.clave}
              checked={elegida === o.clave}
              // «Elegir una fecha» conserva la que ya estaba escrita.
              onChange={() => alElegir(o.clave === 'fecha' && eleccion.tipo === 'FECHA' ? eleccion : o.eleccion)}
            />
            <span>{o.texto}</span>
          </label>
        ))}
      </div>
      {eleccion.tipo === 'FECHA' ? (
        <CampoDeFecha
          id={`${id}-fecha`}
          etiqueta={COPY_CUANDO.laFecha}
          value={eleccion.fecha}
          hoy={hoy}
          ayuda={eleccion.yaEstaba ? COPY_CUANDO.yaEstaba : undefined}
          onChange={(fecha) => alElegir({ tipo: 'FECHA', fecha })}
        />
      ) : null}
      {efecto ? (
        <p className="cuando-la-revisas__efecto" data-efecto={fecha === null ? 'sin-fecha' : 'fecha'}>
          {efecto}
        </p>
      ) : aviso && !error ? (
        <p id={`${id}-aviso`} className="campo__ayuda">
          {aviso}
        </p>
      ) : null}
    </fieldset>
  );
}
