'use client';

/**
 * DL-181 (WP-ENTRENAMIENTO-PLANIFICACION) · Un bloque de la sesión en el editor del plan de entrenamiento: su nombre, cómo
 * se hacen sus ejercicios («Seguido» o «En vueltas»), en uno «En vueltas» las vueltas y el descanso al terminar cada una,
 * con la indicación tal como la ve la persona, sus ejercicios adentro y «Agregar ejercicios a Torso» al pie.
 * - **Cómo se hacen** es un par de opciones a la vista (un grupo de radios): no se esconde en un menú.
 * - **Las vueltas** van de 1 a 20 en una lista: no hay forma de escribir algo que no se entienda. Al cambiarlas, el editor
 *   iguala las series efectivas de cada ejercicio (ENP-D05) y lo dice con «Deshacer».
 * - **El descanso** se escribe como en las series («01:30», o en segundos); vacío, sin indicar. Lo que no se entiende queda
 *   marcado y no deja guardar.
 * - Lo de vez en cuando (el nombre, subir, bajar, quitar) va en su «⋯».
 */
import { COPY_BLOQUES_DE_LA_SESION as B, indicacionDeVueltas, leerDescanso, nombreDelBloqueDeLaSesion, textoDeSegundos, type BloqueDeLaSesionEntrada, type TipoDeBloque } from '@be/domain';
import { useEffect, useState, type ReactNode } from 'react';
import { CampoDeNombre } from '../../../../components/campo-de-nombre';
import { Icono } from '../../../../components/icono';
import { MenuDeAcciones } from '../../../../components/menu-de-acciones';

const VUELTAS = Array.from({ length: 20 }, (_, n) => n + 1);

/** Lo escrito en el descanso: vacío es «sin indicar»; lo que no se entiende viaja como NaN y no deja guardar. */
const leerElDescanso = (t: string): number | null => (t.trim() === '' ? null : (leerDescanso(t) ?? Number.NaN));
const escribirElDescanso = (s: number | null | undefined): string => (typeof s === 'number' && !Number.isNaN(s) ? (textoDeSegundos(s) ?? '') : '');

export function BloqueDelEditor({
  id,
  posicion,
  bloque,
  ejercicios,
  sePuedeSubir,
  sePuedeBajar,
  renombrando,
  onRenombrar,
  onTerminarDeRenombrar,
  onCambiarNombre,
  onCambiarTipo,
  onCambiarVueltas,
  onCambiarDescanso,
  onSubir,
  onBajar,
  onQuitar,
  onAgregarEjercicios,
  children,
}: {
  /** El prefijo de sus identificadores: `b0-s1-g0`. El título lleva `${id}-titulo` (ahí va el foco al ir a un problema). */
  id: string;
  posicion: number;
  bloque: BloqueDeLaSesionEntrada;
  /** Cuántos ejercicios tiene. */
  ejercicios: number;
  sePuedeSubir: boolean;
  sePuedeBajar: boolean;
  renombrando: boolean;
  onRenombrar: () => void;
  onTerminarDeRenombrar: () => void;
  onCambiarNombre: (v: string) => void;
  onCambiarTipo: (t: TipoDeBloque) => void;
  onCambiarVueltas: (n: number) => void;
  onCambiarDescanso: (s: number | null) => void;
  onSubir: () => void;
  onBajar: () => void;
  onQuitar: () => void;
  onAgregarEjercicios: () => void;
  children: ReactNode;
}) {
  const nombre = nombreDelBloqueDeLaSesion(bloque, posicion);
  const enVueltas = bloque.kind === 'ROUNDS';
  // El descanso guarda el texto tal como se escribe y propaga lo interpretado; si cambia desde afuera, se resincroniza.
  const [descanso, setDescanso] = useState(escribirElDescanso(bloque.restAfterRoundSeconds));
  const valorDelDescanso = bloque.restAfterRoundSeconds;
  useEffect(() => {
    setDescanso((t) => (Object.is(leerElDescanso(t), valorDelDescanso ?? null) ? t : escribirElDescanso(valorDelDescanso)));
  }, [valorDelDescanso]);
  const descansoMal = typeof valorDelDescanso === 'number' && Number.isNaN(valorDelDescanso);
  return (
    <section className="bloque-del-editor" data-bloque={posicion + 1} data-tipo={bloque.kind} aria-labelledby={`${id}-titulo`}>
      <div className="bloque-del-editor__cabecera">
        <h3 id={`${id}-titulo`} className="bloque-del-editor__titulo" tabIndex={-1}>
          <span className="bloque-del-editor__rotulo">{B.bloque}</span> {nombre}
        </h3>
        <fieldset className="segmentos bloque-del-editor__tipo">
          <legend className="visualmente-oculto">{`${B.tipoDelBloque}: ${nombre}`}</legend>
          <div className="segmentos__fila">
            {(['SEQUENTIAL', 'ROUNDS'] as const).map((t) => (
              <label key={t} className="segmento">
                <input type="radio" name={`${id}-tipo`} checked={bloque.kind === t} onChange={() => onCambiarTipo(t)} data-tipo-del-bloque={t} />
                {B.tipo[t]}
              </label>
            ))}
          </div>
        </fieldset>
        {enVueltas ? (
          <>
            <label className="bloque-del-editor__campo">
              <span>{B.vueltas}</span>
              <select value={bloque.rounds ?? ''} onChange={(e) => onCambiarVueltas(Number(e.target.value))} data-vueltas>
                {VUELTAS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="bloque-del-editor__campo">
              <span>{B.descansoAlTerminarLaVuelta}</span>
              <input
                id={`${id}-descanso`}
                className="celda-de-serie"
                inputMode="numeric"
                autoComplete="off"
                placeholder="01:30"
                value={descanso}
                aria-invalid={descansoMal || undefined}
                aria-describedby={`${id}-descanso-ayuda`}
                onChange={(e) => {
                  setDescanso(e.target.value);
                  onCambiarDescanso(leerElDescanso(e.target.value));
                }}
                onBlur={() => setDescanso(escribirElDescanso(valorDelDescanso) || (descansoMal ? descanso : ''))}
                data-descanso-del-bloque
              />
              <span id={`${id}-descanso-ayuda`} className={descansoMal ? 'campo__error' : 'visualmente-oculto'}>
                {descansoMal ? 'No se entiende: va como 01:30, o en segundos enteros.' : B.descansoAyuda}
              </span>
            </label>
          </>
        ) : null}
        <MenuDeAcciones
          id={`${id}-menu`}
          rotulo={`más acciones del bloque ${nombre}`}
          acciones={[
            { clave: 'nombre', texto: B.cambiarNombre, alElegir: onRenombrar },
            { clave: 'subir', texto: B.subirBloque, alElegir: onSubir, noSePuede: sePuedeSubir ? null : 'Ya está arriba.' },
            { clave: 'bajar', texto: B.bajarBloque, alElegir: onBajar, noSePuede: sePuedeBajar ? null : 'Ya está abajo.' },
            { clave: 'quitar', texto: B.quitarBloque, detalle: B.quitarBloqueDetalle, alElegir: onQuitar },
          ]}
        />
      </div>
      {renombrando || bloque.label.trim() === '' ? (
        <CampoDeNombre id={`${id}-nombre`} etiqueta={B.nombreDelBloque} valor={bloque.label} maximo={120} enfocar={renombrando} despues={`${id}-menu`} alEmpezar={onRenombrar} alCambiar={onCambiarNombre} alTerminar={onTerminarDeRenombrar} />
      ) : null}
      {/* Lo que ve la persona, en una línea: así se lee en la app. */}
      {enVueltas && ejercicios > 0 ? (
        <p className="bloque-del-editor__indicacion" data-indicacion-del-bloque>
          <Icono nombre="ordenar" tamano={15} />
          {indicacionDeVueltas({ ...bloque, restAfterRoundSeconds: descansoMal ? null : bloque.restAfterRoundSeconds }, ejercicios)}
        </p>
      ) : null}
      {ejercicios === 0 ? <p className="nota">{B.sinEjercicios}</p> : enVueltas && ejercicios < 2 ? <p className="nota">{B.enVueltasPideDos}</p> : null}
      <div className="bloque-del-editor__ejercicios">{children}</div>
      <div className="bloque-del-editor__pie">
        <button type="button" className="boton boton--quieto boton--compacto" onClick={onAgregarEjercicios} data-agregar-al-bloque={posicion + 1}>
          <Icono nombre="mas" tamano={18} />
          {B.agregarEjerciciosAlBloque(nombre)}
        </button>
      </div>
    </section>
  );
}
