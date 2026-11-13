'use client';

/**
 * ED-14 (WP-EDITORES-PROFESIONAL, §2.1) · El armazón del asistente, común a las dos áreas: los siete pasos a la vista
 * (el sugerido, marcado; cualquiera se elige), «Paso N de 7», el título de la decisión y, abajo, «Atrás», «Seguir en la
 * estación» y una sola acción principal.
 *
 * El asistente es una vista de la página, una tarjeta por paso, y no un `<dialog>`: así el buscador de ejercicios y la
 * galería de presets se abren como cuadros enfocados sin apilar un cuadro sobre otro (§2.3; EDT-11).
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { Aviso } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { COPY_ASISTENTE as C, COPY_LO_ARMADO, PASOS_DEL_ASISTENTE, type PasoDelAsistente } from './paso-que-sigue';

export function ArmazonDelAsistente({
  paso,
  sugerido,
  titulo,
  children,
  onElegirPaso,
  onAtras,
  onEstacion,
  onSalir = null,
  principal,
  noAvanzo,
  onReintentar,
  armado = null,
  pasos = PASOS_DEL_ASISTENTE,
}: {
  paso: PasoDelAsistente;
  /** El paso que se deduce del borrador; `null` sin borrador (paso 1). */
  sugerido: PasoDelAsistente | null;
  titulo: string;
  children: ReactNode;
  /** Elegir un paso del indicador; `null` mientras no hay borrador (los pasos 2 a 7 necesitan uno). */
  onElegirPaso: ((n: PasoDelAsistente) => void) | null;
  onAtras: (() => void) | null;
  onEstacion: (() => void) | null;
  /** Sin borrador (paso 1): salir del asistente sin crear nada, de vuelta a la vista del plan. */
  onSalir?: (() => void) | null;
  /** La única acción principal del paso («Siguiente: …» o «Revisar y activar…»). */
  principal: { readonly texto: string; readonly onClick: () => void; readonly ocupado?: string | null };
  /** «Siguiente» no pudo guardar: el paso queda abierto, con lo escrito y «Reintentar». */
  noAvanzo: boolean;
  onReintentar: () => void;
  /** ED-14: «Lo que llevás armado», en pocas líneas (`loQueLlevasArmado`); `null` sin borrador. */
  armado?: readonly string[] | null;
  /** Los nombres de los siete pasos: los de Entrenamiento, salvo que el área diga otros (ED-30, Nutrición). */
  pasos?: readonly string[];
}) {
  const tituloRef = useRef<HTMLHeadingElement>(null);
  // El foco entra al título de cada paso: dice qué se decide.
  useEffect(() => {
    tituloRef.current?.focus();
  }, [paso]);
  return (
    <section className="asistente" aria-labelledby="titulo-del-paso" data-asistente={paso}>
      <nav aria-label={C.pasos}>
        <ol className="asistente__pasos">
          {pasos.map((nombre, n) => {
            const numero = (n + 1) as PasoDelAsistente;
            return (
              <li key={nombre} data-hecho={numero < paso ? '' : undefined}>
                <button type="button" className="asistente__paso" aria-current={numero === paso ? 'step' : undefined} disabled={!onElegirPaso && numero !== paso} onClick={() => onElegirPaso?.(numero)}>
                  <span className="asistente__numero">{numero}</span>
                  {nombre}
                  {numero === sugerido && numero !== paso ? <span className="nota"> · {C.sugerido}</span> : null}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="asistente__con-lo-armado">
      <div className="asistente__cuadro">
        <p className="nota asistente__cuenta">{C.pasoNDe7(paso)}</p>
        <h3 id="titulo-del-paso" ref={tituloRef} tabIndex={-1}>
          {titulo}
        </h3>
        {children}
        {noAvanzo ? (
          <Aviso tipo="error" enfocar>
            <p>{C.noAvanzo}</p>
            <button type="button" className="boton boton--secundario" onClick={onReintentar}>
              Reintentar
            </button>
          </Aviso>
        ) : null}
        <div className="asistente__pie">
          {onAtras ? (
            <button type="button" className="boton boton--quieto" onClick={onAtras} data-asistente-atras>
              <Icono nombre="volver" tamano={18} />
              {C.atras}
            </button>
          ) : null}
          {onEstacion ? (
            <button type="button" className="boton boton--enlace" onClick={onEstacion} data-seguir-en-la-estacion>
              {C.seguirEnLaEstacion}
            </button>
          ) : null}
          {onSalir ? (
            <button type="button" className="boton boton--enlace" onClick={onSalir} data-salir-del-asistente>
              {C.salirDelAsistente}
            </button>
          ) : null}
          {/* Un solo botón principal por cuadro (§2.3). Mientras viaja un guardado, dice por qué espera. */}
          <button
            type="button"
            className="boton boton--primario asistente__siguiente"
            data-asistente-principal
            aria-disabled={principal.ocupado ? true : undefined}
            onClick={() => {
              if (!principal.ocupado) principal.onClick();
            }}
          >
            {principal.ocupado ?? principal.texto}
          </button>
        </div>
      </div>
      {armado ? (
        <aside className="asistente__armado" aria-labelledby="titulo-lo-armado" data-lo-armado>
          <h3 id="titulo-lo-armado">{COPY_LO_ARMADO.titulo}</h3>
          <ul className="estacion__lista-del-panel">
            {armado.map((linea, n) => (
              <li key={n}>{linea}</li>
            ))}
          </ul>
          <p className="nota">{COPY_LO_ARMADO.queEs}</p>
        </aside>
      ) : null}
      </div>
    </section>
  );
}
