'use client';

/**
 * DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2, ET2-11; ET1-D14) · cambiar la clasificación de un ejercicio propio: el grupo
 * muscular, el equipamiento, el patrón y las articulaciones, en un cuadro (los cuadros configuran). Guardar suma la
 * clasificación siguiente de su historia (API-EJE-06): la anterior no cambia. Con la versión que se vio: si cambió en otra
 * pestaña, el 409 lo dice.
 */
import {
  ARTICULACIONES,
  CLASIFICACION_VACIA,
  EQUIPAMIENTOS,
  GRUPOS_MUSCULARES,
  NOMBRE_DE_LAS_ARTICULACIONES,
  NOMBRE_DEL_EQUIPAMIENTO,
  NOMBRE_DEL_GRUPO_MUSCULAR,
  NOMBRE_DEL_PATRON,
  PATRONES_DE_MOVIMIENTO,
  type Articulaciones,
  type ClasificacionDeEjercicio,
  type EjercicioPropio,
  type Equipamiento,
  type GrupoMuscular,
  type PatronDeMovimiento,
  type Resultado,
} from '@be/domain';
import { useEffect, useId, useState } from 'react';
import { CuadroEnfocado } from '../../../components/cuadro-enfocado';
import { api } from '../../../lib/api';
import { mensajeDeFallo, useClaveDeIntento } from '../../../lib/intento';

export const COPY_CLASIFICACION_DEL_PROPIO = {
  cambiar: 'Cambiar la clasificación',
  clasificar: 'Clasificar',
  titulo: 'Clasificación del ejercicio',
  queEs: 'La usan los filtros de «Agregar ejercicios» para encontrarlo. No cambia ningún plan.',
  guardar: 'Guardar la clasificación',
  guardada: (nombre: string) => `Se guardó la clasificación de «${nombre}».`,
  sinIndicar: 'Sin indicar',
  grupo: 'Grupo muscular',
  equipamiento: 'Equipamiento',
  equipamientoAyuda: 'Elegí todo lo que se usa: el principal y los apoyos (el banco, la colchoneta).',
  patron: 'Patrón',
  articulaciones: 'Articulaciones',
  cambio: 'La clasificación cambió en otra pestaña: cerrá el cuadro y volvé a abrirlo.',
  ayuda:
    'El grupo muscular es el principal que trabaja; el equipamiento, con qué se hace; el patrón, el tipo de movimiento; y las articulaciones, si mueve una (monoarticular) o varias (multiarticular). Ejemplo: «Remo con mancuerna a una mano» → Espalda · Mancuernas y Banco · Tracción · Multiarticular.',
} as const;

export function CuadroDeLaClasificacion({
  abierto,
  token,
  ejercicio,
  sesionPerdida,
  onCerrar,
  onGuardada,
}: {
  abierto: boolean;
  token: string;
  ejercicio: EjercicioPropio;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  onCerrar: () => void;
  onGuardada: (e: EjercicioPropio) => void;
}) {
  const T = COPY_CLASIFICACION_DEL_PROPIO;
  const id = useId();
  const intento = useClaveDeIntento();
  const inicial = ejercicio.classification ?? CLASIFICACION_VACIA;
  const [c, setC] = useState<ClasificacionDeEjercicio>(inicial);
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  useEffect(() => {
    if (!abierto) return;
    setC(ejercicio.classification ?? CLASIFICACION_VACIA);
    setFalla(null);
    // Solo al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);
  const cambio = JSON.stringify(c) !== JSON.stringify(inicial);
  const guardar = async () => {
    setEnviando(true);
    setFalla(null);
    const r = await api.cambiarClasificacionDeEjercicio(token, ejercicio.exerciseId, { expectedClassificationVersion: ejercicio.classificationVersion ?? 0, classification: c }, intento.actual(JSON.stringify(c)));
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFalla(r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT' ? T.cambio : mensajeDeFallo(r));
    onGuardada({ ...ejercicio, classification: r.datos.data.classification, classificationVersion: r.datos.data.classificationVersion });
  };
  const elegir = <K extends string>(clave: string, rotulo: string, valores: readonly K[], nombres: Readonly<Record<K, string>>, valor: K | null, alElegir: (v: K | null) => void) => (
    <div className="campo">
      <label htmlFor={`${id}-${clave}`}>{rotulo}</label>
      <select id={`${id}-${clave}`} value={valor ?? ''} onChange={(e) => alElegir((e.target.value || null) as K | null)} data-clasificacion-del-propio={clave}>
        <option value="">{T.sinIndicar}</option>
        {valores.map((v) => (
          <option key={v} value={v}>
            {nombres[v]}
          </option>
        ))}
      </select>
    </div>
  );
  return (
    <CuadroEnfocado
      abierto={abierto}
      forma="dialogo"
      ancho
      titulo={T.titulo}
      sobretitulo={ejercicio.name}
      conCambios={cambio}
      ocupado={enviando}
      ayuda={{ nombre: `Qué es la ${T.titulo.toLowerCase()}`, contenido: <p className="ayuda-del-editor__ejemplo">{T.ayuda}</p> }}
      principal={{ texto: T.guardar, alTocar: () => void guardar(), apagado: cambio ? null : 'No cambiaste nada.', enviando, textoEnviando: 'Guardando…' }}
      onCerrar={onCerrar}
    >
      <div className="clasificacion-del-propio" data-cuadro-clasificacion-del-propio>
        <p className="nota">{T.queEs}</p>
        <div className="clasificacion-del-propio__selectores">
          {elegir<GrupoMuscular>('grupo', T.grupo, GRUPOS_MUSCULARES, NOMBRE_DEL_GRUPO_MUSCULAR, c.muscleGroup, (v) => setC({ ...c, muscleGroup: v }))}
          {elegir<PatronDeMovimiento>('patron', T.patron, PATRONES_DE_MOVIMIENTO, NOMBRE_DEL_PATRON, c.movementPattern, (v) => setC({ ...c, movementPattern: v }))}
          {elegir<Articulaciones>('articulaciones', T.articulaciones, ARTICULACIONES, NOMBRE_DE_LAS_ARTICULACIONES, c.joints, (v) => setC({ ...c, joints: v }))}
        </div>
        <fieldset className="clasificacion-del-propio__equipamiento">
          <legend>{T.equipamiento}</legend>
          <p className="nota">{T.equipamientoAyuda}</p>
          <div className="clasificacion-del-propio__casillas">
            {EQUIPAMIENTOS.map((q: Equipamiento) => (
              <label key={q} className="casilla-con-explicacion">
                <input
                  type="checkbox"
                  checked={c.equipment.includes(q)}
                  onChange={(e) => setC({ ...c, equipment: e.target.checked ? [...c.equipment, q] : c.equipment.filter((x) => x !== q) })}
                  data-equipamiento-del-propio={q}
                />
                <span>{NOMBRE_DEL_EQUIPAMIENTO[q]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {falla ? (
          <p className="campo__error" role="alert">
            {falla}
          </p>
        ) : null}
      </div>
    </CuadroEnfocado>
  );
}
