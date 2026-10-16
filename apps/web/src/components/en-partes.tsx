/**
 * Textos que no tienen que partirse en cualquier lado cuando la columna es angosta (guía, II.8): un dato hecho de partes
 * separadas por « · », una frase que cuenta algo, o un nombre con un número adentro. El texto que se lee es siempre el
 * mismo; lo que cambia es dónde puede cortarse el renglón.
 */
import { Fragment } from 'react';

/** El espacio que no se parte, escrito con su código: en la fuente no se distingue de un espacio común. */
const PEGADO = ' ';

/**
 * Una frase hecha de partes separadas por « · » («3 series sin registrar · 1 serie con diferencias»), en una fila. Las
 * partes son largas y en una lista angosta no entran en un renglón: el texto corre como cualquier otro, pero el número
 * no se separa de lo que cuenta («1» arriba y «serie con diferencias» abajo) y el separador queda al final del renglón
 * de arriba, nunca al principio del de abajo.
 */
export function FraseEnPartes({ texto }: { texto: string }) {
  return (
    <>
      {texto
        .split(' · ')
        .map((parte) => parte.replace(/^(\d+) /, `$1${PEGADO}`))
        .join(`${PEGADO}· `)}
    </>
  );
}

/**
 * Un dato hecho de partes cortas separadas por « · » («77,5 kg · 6 rep. · RIR 1»; «30 mediciones · 1 corregida · 1
 * anulada»). Si no entra en un renglón, baja una parte entera, con el separador al final del renglón de arriba: no
 * queda «RIR» en un renglón y su número en el otro. Una parte más ancha que su columna se parte adentro, como cualquier
 * texto.
 */
export function EnPartes({ texto }: { texto: string }) {
  const partes = texto.split(' · ');
  if (partes.length === 1) return <>{texto}</>;
  return (
    <>
      {partes.map((parte, i) => (
        <Fragment key={i}>
          <span className="parte-de-dato">{i < partes.length - 1 ? `${parte} ·` : parte}</span>
          {i < partes.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  );
}

/**
 * Un nombre o un renglón que trae números adentro («Jackson, Pollock y Ward, 7 pliegues, mujeres · Siri»; «Precisión
 * declarada: 1 decimal»; «30 mediciones · 1 corregida»): el número no se separa de la palabra que cuenta, y el separador
 * « · » queda al final del renglón de arriba.
 */
export const conNumerosPegados = (texto: string): string => texto.replace(/(\d) (?=\p{L})/gu, `$1${PEGADO}`).replace(/ · /g, `${PEGADO}· `);
