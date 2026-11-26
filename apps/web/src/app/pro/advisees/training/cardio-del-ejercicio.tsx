'use client';

/**
 * DL-199 (WP-EDITOR-ENTRENAMIENTO-TANDA-3, ET3-13 a ET3-15) · un ejercicio de cardio en el editor: la duración, la
 * distancia (opcional) y la intensidad, en lugar de la planilla de series. Lo que se escribe va a los parámetros de BE
 * (`cardio-de-la-prescripcion.ts`, ET3-D13) con el cambio de siempre del editor, así que se guarda, se copia y se deshace
 * como cualquier otro cambio.
 * - Un número que no se entiende o fuera de los límites no se guarda: queda en el campo, marcado, y el motivo va en el
 *   renglón reservado de abajo (RP-19: nada se corre de lugar).
 * - La ayuda, con su ejemplo, en el «?» de la esquina.
 */
import {
  cardioDe,
  CARDIO_SIN_INDICAR,
  conElCardio,
  COPY_CARDIO,
  LIMITES_DE_LA_DISTANCIA,
  LIMITES_DE_LA_DURACION,
  type CardioDeLaPrescripcion,
  type IntensidadDelCardio,
  type UnidadDeDistancia,
} from '@be/domain';
import { useState } from 'react';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';
import { numeroEnCampo } from '../../../../lib/formato';
import type { PrescripcionE } from './ejercicio-del-editor';

const C = COPY_CARDIO;

/** «30», «2,5», «2.5»: un número positivo; `null` vacío; `NaN` si no se entiende. */
function leerNumero(t: string): number | null {
  const s = t.trim().replace(',', '.');
  if (s === '') return null;
  return /^\d+(?:\.\d+)?$/.test(s) ? Number(s) : Number.NaN;
}

type TipoDeIntensidad = 'NINGUNA' | IntensidadDelCardio['tipo'];

export function CardioDelEjercicio({ id, nombre, prescripcion: p, onCambiar }: { id: string; nombre: string; prescripcion: PrescripcionE; onCambiar: (c: Partial<PrescripcionE>) => void }) {
  const cardio = cardioDe(p) ?? CARDIO_SIN_INDICAR;
  const escribir = (c: CardioDeLaPrescripcion) => onCambiar(conElCardio(p, c));
  const [duracionEscrita, setDuracionEscrita] = useState<string | null>(null);
  const [distanciaEscrita, setDistanciaEscrita] = useState<string | null>(null);
  const [tipo, setTipo] = useState<TipoDeIntensidad>(cardio.intensidad?.tipo ?? 'NINGUNA');
  const [esfuerzoEscrito, setEsfuerzoEscrito] = useState<string | null>(null);
  const [textoEscrito, setTextoEscrito] = useState<string | null>(null);

  const duracion = duracionEscrita === null ? cardio.duracionMinutos : leerNumero(duracionEscrita);
  const duracionMal = duracion !== null && (!Number.isFinite(duracion) || duracion < LIMITES_DE_LA_DURACION.min || duracion > LIMITES_DE_LA_DURACION.max);
  const [unidadElegida, setUnidadElegida] = useState<UnidadDeDistancia>(cardio.distancia?.unidad ?? 'km');
  const unidad: UnidadDeDistancia = cardio.distancia?.unidad ?? unidadElegida;
  const distancia = distanciaEscrita === null ? (cardio.distancia?.valor ?? null) : leerNumero(distanciaEscrita);
  const distanciaMal = distancia !== null && (!Number.isFinite(distancia) || distancia <= 0 || distancia > LIMITES_DE_LA_DISTANCIA[unidad]);
  const esfuerzo = esfuerzoEscrito === null ? (cardio.intensidad?.tipo === 'ESFUERZO' ? cardio.intensidad.valor : null) : leerNumero(esfuerzoEscrito);
  const esfuerzoMal = tipo === 'ESFUERZO' && esfuerzo !== null && (!Number.isFinite(esfuerzo) || esfuerzo > 10);
  const motivo = duracionMal ? C.problema.DURACION_FUERA_DE_RANGO : distanciaMal ? C.problema.DISTANCIA_FUERA_DE_RANGO : esfuerzoMal ? C.problema.ESFUERZO_FUERA_DE_RANGO : '';

  const conIntensidad = (i: IntensidadDelCardio | null) => escribir({ ...cardio, intensidad: i });

  return (
    <section className="cardio-del-ejercicio con-ayuda-en-la-esquina" aria-labelledby={`${id}-cardio`} data-cardio-del-ejercicio>
      <h4 id={`${id}-cardio`} className="ejercicio-del-plan__subtitulo">
        {C.titulo}
      </h4>
      <ExplicacionAPedido nombre="Cómo se planifica un ejercicio de cardio" como="div" lugar="esquina">
        <p>Un ejercicio de cardio se planifica con cuánto dura, la distancia si importa y una intensidad, en lugar de series, repeticiones y carga.</p>
        <p>La intensidad puede ser una zona de frecuencia cardíaca (de 1 a 5), el esfuerzo percibido de 0 a 10 o unas palabras tuyas.</p>
        <p>Ejemplo: ciclismo, 30 min, 12 km, zona 2. La persona ve «Duración: 30 min», «Distancia: 12 km» e «Intensidad: Zona 2», y lo tilda al terminar.</p>
      </ExplicacionAPedido>
      <div className="cardio-del-ejercicio__campos">
        <div className="campo cardio-del-ejercicio__campo">
          <label htmlFor={`${id}-duracion`}>{C.duracion}</label>
          <span className="datos-del-plan__con-unidad">
            <input
              id={`${id}-duracion`}
              inputMode="decimal"
              value={duracionEscrita ?? numeroEnCampo(cardio.duracionMinutos)}
              placeholder={C.sinIndicar}
              aria-describedby={`${id}-duracion-unidad ${id}-cardio-motivo`}
              aria-invalid={duracionMal || undefined}
              onChange={(e) => {
                setDuracionEscrita(e.target.value);
                const n = leerNumero(e.target.value);
                if (n === null) escribir({ ...cardio, duracionMinutos: null });
                else if (Number.isFinite(n) && n >= LIMITES_DE_LA_DURACION.min && n <= LIMITES_DE_LA_DURACION.max) escribir({ ...cardio, duracionMinutos: n });
              }}
              onBlur={() => {
                if (!duracionMal) setDuracionEscrita(null);
              }}
              data-campo="duracion-del-cardio"
            />
            <span id={`${id}-duracion-unidad`} className="nota">
              {C.minutos}
            </span>
          </span>
        </div>
        <div className="campo cardio-del-ejercicio__campo">
          <label htmlFor={`${id}-distancia`}>
            {C.distancia} <span className="nota">{C.opcional}</span>
          </label>
          <span className="datos-del-plan__con-unidad">
            <input
              id={`${id}-distancia`}
              inputMode="decimal"
              value={distanciaEscrita ?? numeroEnCampo(cardio.distancia?.valor)}
              placeholder={C.sinIndicar}
              aria-describedby={`${id}-cardio-motivo`}
              aria-invalid={distanciaMal || undefined}
              onChange={(e) => {
                setDistanciaEscrita(e.target.value);
                const n = leerNumero(e.target.value);
                if (n === null) escribir({ ...cardio, distancia: null });
                else if (Number.isFinite(n) && n > 0 && n <= LIMITES_DE_LA_DISTANCIA[unidad]) escribir({ ...cardio, distancia: { valor: n, unidad } });
              }}
              onBlur={() => {
                if (!distanciaMal) setDistanciaEscrita(null);
              }}
              data-campo="distancia-del-cardio"
            />
            <select
              aria-label={`Unidad de la distancia de ${nombre}`}
              value={unidad}
              onChange={(e) => {
                const u = e.target.value as UnidadDeDistancia;
                setUnidadElegida(u);
                if (cardio.distancia) escribir({ ...cardio, distancia: { valor: cardio.distancia.valor, unidad: u } });
              }}
              data-campo="unidad-de-la-distancia"
            >
              <option value="km">km</option>
              <option value="m">m</option>
            </select>
          </span>
        </div>
        <div className="campo cardio-del-ejercicio__campo">
          <label htmlFor={`${id}-intensidad`}>{C.intensidad}</label>
          <select
            id={`${id}-intensidad`}
            value={tipo}
            onChange={(e) => {
              const t = e.target.value as TipoDeIntensidad;
              setTipo(t);
              setEsfuerzoEscrito(null);
              setTextoEscrito(null);
              // Un tipo nuevo empieza sin valor, salvo la zona, que se elige en el desplegable de al lado (la 2, la más usada).
              conIntensidad(t === 'ZONA' ? { tipo: 'ZONA', zona: 2 } : null);
            }}
            data-campo="tipo-de-intensidad-del-cardio"
          >
            <option value="NINGUNA">{C.sinIndicar}</option>
            <option value="ZONA">{C.zona}</option>
            <option value="ESFUERZO">{C.esfuerzo}</option>
            <option value="TEXTO">{C.texto}</option>
          </select>
        </div>
        {/* El lugar del valor de la intensidad está siempre: elegir el tipo no corre lo de al lado (RP-19). */}
        <div className="campo cardio-del-ejercicio__campo" data-valor-de-la-intensidad={tipo}>
          {tipo === 'ZONA' ? (
            <>
              <label htmlFor={`${id}-zona`}>{C.queZona}</label>
              <select id={`${id}-zona`} value={cardio.intensidad?.tipo === 'ZONA' ? String(cardio.intensidad.zona) : '2'} onChange={(e) => conIntensidad({ tipo: 'ZONA', zona: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })} data-campo="zona-del-cardio">
                {[1, 2, 3, 4, 5].map((z) => (
                  <option key={z} value={z}>{`Zona ${z}`}</option>
                ))}
              </select>
            </>
          ) : tipo === 'ESFUERZO' ? (
            <>
              <label htmlFor={`${id}-esfuerzo`}>{C.cuantoEsfuerzo}</label>
              <span className="datos-del-plan__con-unidad">
                <input
                  id={`${id}-esfuerzo`}
                  inputMode="decimal"
                  value={esfuerzoEscrito ?? numeroEnCampo(esfuerzo)}
                  placeholder={C.sinIndicar}
                  aria-describedby={`${id}-esfuerzo-de ${id}-cardio-motivo`}
                  aria-invalid={esfuerzoMal || undefined}
                  onChange={(e) => {
                    setEsfuerzoEscrito(e.target.value);
                    const n = leerNumero(e.target.value);
                    if (n === null) conIntensidad(null);
                    else if (Number.isFinite(n) && n <= 10) conIntensidad({ tipo: 'ESFUERZO', valor: n });
                  }}
                  onBlur={() => {
                    if (!esfuerzoMal) setEsfuerzoEscrito(null);
                  }}
                  data-campo="esfuerzo-del-cardio"
                />
                <span id={`${id}-esfuerzo-de`} className="nota">
                  de 10
                </span>
              </span>
            </>
          ) : tipo === 'TEXTO' ? (
            <>
              <label htmlFor={`${id}-texto`}>{C.enPalabras}</label>
              <input
                id={`${id}-texto`}
                maxLength={60}
                value={textoEscrito ?? (cardio.intensidad?.tipo === 'TEXTO' ? cardio.intensidad.texto : '')}
                placeholder={C.ejemploEnPalabras}
                onChange={(e) => {
                  setTextoEscrito(e.target.value);
                  conIntensidad(e.target.value.trim() === '' ? null : { tipo: 'TEXTO', texto: e.target.value });
                }}
                onBlur={() => setTextoEscrito(null)}
                data-campo="texto-del-cardio"
              />
            </>
          ) : null}
        </div>
      </div>
      <p id={`${id}-cardio-motivo`} className="cardio-del-ejercicio__motivo" role="status" data-motivo-del-cardio={motivo ? '' : undefined}>
        {motivo}
      </p>
    </section>
  );
}
