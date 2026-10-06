'use client';

/**
 * Los objetivos por serie en el website del profesional (DL-122): el campo con herencia del editor y la tabla «Así lo ve
 * tu asesorado». La tabla resuelve con `objetivosEfectivos`, la misma función que usa la API para responderle al
 * teléfono: lo que se ve acá es lo que recibe la APK.
 */
import {
  COPY_ENTRENAMIENTO_POR_SERIE,
  ETIQUETA_DE_BASE_DE_CARGA,
  ETIQUETA_DE_BASE_DE_REPETICIONES,
  esCriterioRir,
  leerNumero,
  objetivosEfectivos,
  textoDeCarga,
  textoDeRepeticiones,
  textoDeRir,
  textoDeSegundos,
  type BaseDeCarga,
  type BaseDeRepeticiones,
  type ObjetivoEfectivoDeSerie,
  type OrigenDelObjetivo,
  type PrescripcionConObjetivos,
  type PrescripcionParaResolver,
} from '@be/domain';
import { useEffect, useState } from 'react';
import { numeroEnCampo } from '../../../../lib/formato';

/**
 * Un objetivo de una serie con sus tres estados (DL-122):
 * - el campo vacío hereda de la prescripción, y lo heredado se ve como texto de ayuda;
 * - un número lo sobrescribe en esta serie;
 * - «Sin objetivo en esta serie» lo quita, aunque la prescripción lo tenga.
 * Lo que no se entiende se propaga como NaN: el guardado lo rechaza y señala el ejercicio, en vez de guardar otra cosa.
 */
export function CampoHeredable({
  id,
  etiqueta,
  valor,
  heredado,
  entero = false,
  onCambiar,
}: {
  id: string;
  etiqueta: string;
  /** `undefined`: hereda; `null`: sin objetivo; un número: propio de la serie. */
  valor: number | null | undefined;
  /** Lo que heredaría, ya escrito para la persona («16 kg»); `null` si la prescripción no tiene ese objetivo. */
  heredado: string | null;
  entero?: boolean;
  onCambiar: (v: number | null | undefined) => void;
}) {
  const externo = typeof valor === 'number' && !Number.isNaN(valor) ? numeroEnCampo(valor) : '';
  const [texto, setTexto] = useState(externo);
  useEffect(() => {
    // Si el valor cambia desde afuera (al guardar o al quitar la serie), el texto se resincroniza. Lo que todavía no es
    // un número («1,» a mitad de camino) se deja como está: el guardado lo señala si queda así.
    setTexto((t) => (typeof valor === 'number' && Number.isNaN(valor) ? t : leerNumero(t) === (typeof valor === 'number' ? valor : null) ? t : externo));
  }, [externo, valor]);
  const sinObjetivo = valor === null;
  const ayuda = sinObjetivo ? 'Esta serie no tiene este objetivo.' : heredado ? `Vacío: hereda ${heredado} de la prescripción.` : 'Vacío: sin objetivo, porque la prescripción no lo tiene.';
  return (
    <div className="campo campo--heredable">
      <label htmlFor={id}>{etiqueta}</label>
      <p id={`${id}-ayuda`} className="campo__ayuda">
        {ayuda}
      </p>
      <input
        id={id}
        inputMode={entero ? 'numeric' : 'decimal'}
        value={sinObjetivo ? '' : texto}
        placeholder={sinObjetivo ? COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo : (heredado ?? '')}
        disabled={sinObjetivo}
        aria-describedby={`${id}-ayuda`}
        onChange={(e) => {
          setTexto(e.target.value);
          const t = e.target.value.trim();
          if (t === '') return onCambiar(undefined);
          const n = leerNumero(t);
          onCambiar(n === null || (entero && !Number.isInteger(n)) ? Number.NaN : n);
        }}
      />
      <label className="campo__casilla">
        <input type="checkbox" checked={sinObjetivo} onChange={(e) => onCambiar(e.target.checked ? null : undefined)} /> Sin objetivo en esta serie
      </label>
    </div>
  );
}

const DE_LA_PRESCRIPCION = 'de la prescripción';

/** Un valor del objetivo efectivo, con su origen dicho en palabras si lo hereda. */
function Valor({ texto, origen }: { texto: string | null; origen?: OrigenDelObjetivo }) {
  if (texto === null) return <span className="nota">{COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo}</span>;
  return (
    <>
      {texto}
      {origen === 'PRESCRIPTION' ? <span className="nota"> · {DE_LA_PRESCRIPCION}</span> : null}
    </>
  );
}

/** Las filas de la tabla tal como las resolvió la API (API-SER-01): el objetivo que recibe el teléfono, sin recalcularlo. */
export function filasDeLaRespuesta(p: PrescripcionConObjetivos): ObjetivoEfectivoDeSerie[] {
  return p.sets.map((s) => ({ setIndex: s.setIndex, ...s.target, origin: s.targetOrigin }));
}

/**
 * «Así lo ve tu asesorado»: el objetivo efectivo de cada serie. En el editor se resuelve con `objetivosEfectivos`, como
 * lo resuelve la API para el teléfono (`deLaPrescripcion`); en la versión activa se muestra lo que respondió la API.
 */
export function TablaDeObjetivos({
  filas,
  conRir,
  bases,
  titulo = 'Así lo ve tu asesorado',
}: {
  filas: readonly ObjetivoEfectivoDeSerie[];
  /** Si se muestra la columna del RIR: con criterio RIR, o si alguna serie tiene uno. */
  conRir: boolean;
  bases?: { readonly loadBasis?: BaseDeCarga | null; readonly repetitionBasis?: BaseDeRepeticiones | null };
  titulo?: string;
}) {
  if (filas.length === 0) return null;
  return (
    <div className="desplazable-x">
      <table className="tabla tabla--objetivos">
        <caption>
          {titulo}
          {bases?.loadBasis ? <span className="nota"> · carga: {ETIQUETA_DE_BASE_DE_CARGA[bases.loadBasis]}</span> : null}
          {bases?.repetitionBasis ? <span className="nota"> · repeticiones: {ETIQUETA_DE_BASE_DE_REPETICIONES[bases.repetitionBasis]}</span> : null}
        </caption>
        <thead>
          <tr>
            <th scope="col">{COPY_ENTRENAMIENTO_POR_SERIE.columnaSerie}</th>
            <th scope="col">Carga</th>
            <th scope="col">{COPY_ENTRENAMIENTO_POR_SERIE.columnaRepeticiones}</th>
            {conRir ? <th scope="col">{COPY_ENTRENAMIENTO_POR_SERIE.columnaRir}</th> : null}
            <th scope="col">{COPY_ENTRENAMIENTO_POR_SERIE.descansoRecomendado}</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.setIndex}>
              <th scope="row">{f.setIndex}</th>
              <td>
                <Valor texto={textoDeCarga(f.suggestedLoad)} origen={f.origin.suggestedLoad} />
              </td>
              <td>
                <Valor texto={textoDeRepeticiones(f.repetitions)} />
              </td>
              {conRir ? (
                <td>
                  <Valor texto={textoDeRir(f.rir)} origen={f.origin.rir} />
                </td>
              ) : null}
              <td>
                <Valor texto={textoDeSegundos(f.restSeconds)} origen={f.origin.restSeconds} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** La tabla del editor: lo que todavía no se guardó, resuelto como lo hará la API. */
export function TablaDeLaPrescripcion({ prescripcion, bases }: { prescripcion: PrescripcionParaResolver; bases?: { readonly loadBasis?: BaseDeCarga | null; readonly repetitionBasis?: BaseDeRepeticiones | null } }) {
  const filas = objetivosEfectivos(prescripcion);
  return <TablaDeObjetivos filas={filas} conRir={esCriterioRir(prescripcion.intensity) || filas.some((f) => f.rir !== null)} bases={bases} />;
}

/** Si alguna serie del plan declara un objetivo propio: la APK 0.13.2 no lo ve (DL-122). */
export const tieneObjetivosPorSerie = (sets: readonly { readonly rir?: unknown; readonly suggestedLoad?: unknown; readonly restSeconds?: unknown }[]): boolean =>
  sets.some((s) => s.rir !== undefined || s.suggestedLoad !== undefined || s.restSeconds !== undefined);

/** El aviso de compatibilidad del editor, literal en un solo lugar. */
export const AVISO_DE_LA_APK_ANTERIOR =
  'La APK 0.13.2 muestra solo los valores generales de cada ejercicio. Los objetivos propios de cada serie se ven en la versión nueva de la app; antes de usarlos con una persona, confirmá que la tenga instalada.';
