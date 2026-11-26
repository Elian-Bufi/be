'use client';

/**
 * DL-199 (WP-EDITOR-ENTRENAMIENTO-TANDA-3, ET3-10 a ET3-12) · la sugerencia de progresión en el panel del ejercicio:
 * «+2,5 kg la próxima», con el motivo, «Aplicar» y «Descartar». Sale de la misma lectura de «La vez pasada» (API-TRN-21):
 * no lee nada aparte. **Nunca cambia nada sola** (ET3-D10): «Aplicar» escribe por el cambio de siempre del editor (y así
 * se deshace como cualquier otro); «Descartar» se recuerda en esta pestaña por el ejercicio y la vez de la que salió, y
 * con otra vez registrada vuelve a evaluarse. Sin colores de juicio: el renglón es neutro, como un dato.
 * RP-19: sin sugerencia no ocupa lugar; con ella, va arriba de «La vez pasada» y no cambia de alto al aplicar (el texto
 * de lo hecho reemplaza a los botones en el mismo renglón).
 */
import { claveDeLaSugerencia, COPY_SUGERENCIA_DE_PROGRESION, sugerenciaDeProgresion, type NotacionDelEsfuerzo, type PrescripcionParaLaSugerencia, type SugerenciaDeProgresion, type VezPasada } from '@be/domain';
import { useState } from 'react';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';
import { Icono } from '../../../../components/icono';
import { numeroEnCampo } from '../../../../lib/formato';

const T = COPY_SUGERENCIA_DE_PROGRESION;
const CLAVE_DE_LO_DESCARTADO = 'be:sugerencias-descartadas';

/** Lo descartado en esta pestaña (sessionStorage; si no hay, en memoria). */
const enMemoria = new Set<string>();
function descartadas(): Set<string> {
  try {
    const guardadas = JSON.parse(window.sessionStorage.getItem(CLAVE_DE_LO_DESCARTADO) ?? '[]') as unknown;
    return new Set([...enMemoria, ...(Array.isArray(guardadas) ? guardadas.filter((x): x is string => typeof x === 'string') : [])]);
  } catch {
    return new Set(enMemoria);
  }
}
function descartar(clave: string): void {
  enMemoria.add(clave);
  try {
    window.sessionStorage.setItem(CLAVE_DE_LO_DESCARTADO, JSON.stringify([...descartadas()].slice(-200)));
  } catch {
    // Sin sessionStorage (modo privado estricto): queda en memoria mientras dure la página.
  }
}

export function SugerenciaDeProgresionEnElPanel({
  veces,
  exerciseId,
  prescripcion,
  nombre,
  notacion,
  conProgresionDeLaFase,
  onAplicar,
}: {
  /** La lectura de «La vez pasada»; `null` mientras se lee o si falló (entonces no se dice nada). */
  veces: readonly VezPasada[] | null;
  exerciseId: string;
  prescripcion: PrescripcionParaLaSugerencia;
  nombre: string;
  notacion: NotacionDelEsfuerzo;
  conProgresionDeLaFase: boolean;
  onAplicar: (s: SugerenciaDeProgresion) => void;
}) {
  const [hecho, setHecho] = useState<{ readonly clave: string; readonly texto: string } | null>(null);
  const [, setVuelta] = useState(0);
  const s = veces ? sugerenciaDeProgresion({ prescripcion, veces, nombre, notacion, conProgresionDeLaFase }) : null;
  const clave = s ? claveDeLaSugerencia(exerciseId, s) : null;
  // Lo hecho se sigue diciendo en su lugar hasta que se cambia de ejercicio (el panel se vuelve a montar).
  if (hecho && (!clave || hecho.clave === clave)) {
    return (
      <section className="sugerencia-de-progresion sugerencia-de-progresion--hecha" aria-label={T.titulo} data-sugerencia-de-progresion="hecha">
        <p className="nota" role="status">
          <Icono nombre="info" tamano={15} /> {hecho.texto}
        </p>
      </section>
    );
  }
  if (!s || !clave || descartadas().has(clave)) return null;
  return (
    <section className="sugerencia-de-progresion con-ayuda-en-la-esquina" aria-label={`${T.titulo}: ${s.titulo}`} data-sugerencia-de-progresion={s.hasta.value}>
      <p className="sugerencia-de-progresion__sobretitulo">{T.titulo}</p>
      <p className="sugerencia-de-progresion__titulo">
        <Icono nombre="sube" tamano={18} />
        {s.titulo}
        <span className="nota sugerencia-de-progresion__hasta">
          {numeroEnCampo(s.desde.value)} → {numeroEnCampo(s.hasta.value)} {s.hasta.unit}
        </span>
      </p>
      <p className="nota sugerencia-de-progresion__motivo">{s.motivo}</p>
      <div className="sugerencia-de-progresion__acciones">
        <button
          type="button"
          className="boton boton--quieto boton--compacto"
          onClick={() => {
            onAplicar(s);
            setHecho({ clave, texto: T.aplicada(`${numeroEnCampo(s.hasta.value)} ${s.hasta.unit}`) });
          }}
          data-aplicar-sugerencia
        >
          {T.aplicar}
        </button>
        <button
          type="button"
          className="boton boton--discreto boton--compacto"
          onClick={() => {
            descartar(clave);
            setHecho({ clave, texto: T.descartada });
            setVuelta((v) => v + 1);
          }}
          data-descartar-sugerencia
        >
          {T.descartar}
        </button>
      </div>
      <ExplicacionAPedido nombre="Qué es la sugerencia de progresión" como="div" lugar="esquina">
        <p>{T.queEs}</p>
        <p>{T.ejemplo}</p>
        <p>{T.nuncaSolo}</p>
      </ExplicacionAPedido>
    </section>
  );
}
