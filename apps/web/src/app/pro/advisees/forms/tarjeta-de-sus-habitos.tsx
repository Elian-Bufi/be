'use client';

/**
 * «Sus hábitos», en Información de la ficha (WP-FORMULARIOS-RONDA-2, FR-10; DL-165 D-9; §4.4 del paquete): los hábitos
 * vigentes que la persona le comparte a este profesional (API-HBT-05), «Declarado por la persona», con la fecha desde la
 * que se los comparte y cuándo se actualizaron.
 * - **Sin autorización no hay tarjeta ni rastro.** Mientras se lee no se dibuja nada; con el 404 de lo inexistente (no se
 *   los comparte, o el PDP ya no lo permite) o con cualquier otra falla, tampoco: ni un «cargando», ni un error, ni un
 *   lugar vacío. Solo la sesión perdida sigue su camino de siempre.
 * - No dice de qué formulario salieron ni el área de otro profesional (§4.4): el origen va como «en un formulario» o «en
 *   Mis hábitos». Tampoco muestra la historia, que es de la persona.
 * - Cada valor va en renglones, con las etiquetas de la parte (`lineasDeValor`): una lista, un renglón por actividad.
 */
import { COPY_HABITOS } from '@be/domain';
import { useEffect, useId, useState } from 'react';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { diaSinElAnioEnCurso } from '../../../../lib/formato';
import { lineasDeValor } from './formulario-de-inicio';
import { useFormularios } from './formularios';
import { tarjetaDeSusHabitos, type HabitosQueComparte } from './sus-habitos';

const H = COPY_HABITOS.web;

export function SusHabitos() {
  const { token, asesoradoId, sesionPerdida } = useFormularios();
  const id = useId();
  const [datos, setDatos] = useState<HabitosQueComparte | null>(null);

  useEffect(() => {
    let vigente = true;
    setDatos(null);
    void (async () => {
      const r = await api.habitosDeLaPersona(token, asesoradoId);
      if (!vigente || sesionPerdida(r)) return;
      // Lo que no es un 200 no deja rastro: el 404 es lo que ve quien no los recibe, y una falla no se distingue de él.
      setDatos(r.ok ? r.datos.data : null);
    })();
    return () => {
      vigente = false;
    };
  }, [token, asesoradoId, sesionPerdida]);

  if (!datos) return null;
  const tarjeta = tarjetaDeSusHabitos(datos, (iso) => diaSinElAnioEnCurso(iso));

  return (
    <section className="registros sus-habitos" aria-labelledby={`${id}-titulo`} data-sus-habitos>
      <div className="registros__encabezado">
        <h2 id={`${id}-titulo`}>{H.titulo}</h2>
        <p className="nota registros__bajada">{tarjeta.compartido}</p>
      </div>
      <div className="sus-habitos__procedencia">
        {/* La procedencia se dice una vez, para todas las respuestas: cada una es declarada por la persona. */}
        <span className="etiqueta-de-dato">
          <Icono nombre="reportado" tamano={15} />
          {H.declarado}
        </span>
        {tarjeta.actualizados ? <p className="nota">{tarjeta.actualizados}</p> : null}
        <p className="nota">{H.noEsMedicion}</p>
      </div>
      {tarjeta.habitos.length === 0 ? (
        <p className="nota">{H.sinHabitos}</p>
      ) : (
        <dl className="lo-declarado sus-habitos__lista">
          {tarjeta.habitos.map((h) => {
            const lineas = lineasDeValor(h.campo, h.valor);
            return (
              <div key={h.codigo} className="lo-declarado__fila" data-pregunta={h.codigo}>
                <dt>{h.pregunta}</dt>
                <dd>
                  {lineas.length > 1 ? (
                    <ul className="lo-declarado__lineas">
                      {lineas.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="lo-declarado__valor">{lineas[0] ?? ''}</span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
}
