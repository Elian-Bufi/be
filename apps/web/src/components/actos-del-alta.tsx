'use client';

/**
 * Las casillas de toda alta del website, con correo o con Google (PROTO-10-ACC-01; DL-138): A1, A2 y la declaración de
 * mayoría de edad (08 §24.7 a). Tres actos separados: cada uno con su etiqueta, su versión y su casilla, nunca premarcada
 * (10-B02:128-155). A3 no forma parte del alta (10-B02:137-141).
 * La casilla de mayoría de edad lleva como texto la versión vigente, literal: lo que se ve es lo que se declara. No tiene
 * «Leer…»: el texto entero está en la etiqueta.
 */
import { COPY, MENSAJE_DE_CAMPO, VERSION_VIGENTE } from '@be/domain';
import Link from 'next/link';

export type ActoDelAlta = 'a1' | 'a2' | 'mayoria';
export type ActosMarcados = Readonly<Record<ActoDelAlta, boolean>>;
export type ErroresDeLosActos = Partial<Record<ActoDelAlta, string>>;

export const NINGUN_ACTO_MARCADO: ActosMarcados = { a1: false, a2: false, mayoria: false };

/** El id de la casilla de un acto. El prefijo separa el alta con Google del alta con correo. */
export const idDelActo = (acto: ActoDelAlta, prefijo = '') => `${prefijo}acto-${acto}`;

/** Sin las tres marcadas no hay alta: cada una falta con su propio mensaje. */
export function erroresDeLosActos(actos: ActosMarcados): ErroresDeLosActos {
  const errores: ErroresDeLosActos = {};
  if (!actos.a1) errores.a1 = MENSAJE_DE_CAMPO.A1_REQUERIDO;
  if (!actos.a2) errores.a2 = MENSAJE_DE_CAMPO.A2_REQUERIDO;
  if (!actos.mayoria) errores.mayoria = MENSAJE_DE_CAMPO.MAYORIA_REQUERIDA;
  return errores;
}

function Acto({
  id,
  marcado,
  alCambiar,
  titulo,
  texto,
  version,
  lectura,
  error,
}: {
  id: string;
  marcado: boolean;
  alCambiar: (valor: boolean) => void;
  titulo: string;
  texto: string;
  version: string;
  lectura?: { href: string; texto: string };
  error?: string;
}) {
  return (
    <div className={`acto${error ? ' campo--error' : ''}`}>
      <input
        id={id}
        type="checkbox"
        checked={marcado}
        onChange={(e) => alCambiar(e.target.checked)}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-version${error ? ` ${id}-error` : ''}`}
      />
      <label htmlFor={id}>
        <strong>{titulo}</strong> — {texto}
      </label>
      <p id={`${id}-version`} className="acto__version">
        {lectura ? (
          <>
            <Link href={lectura.href} target="_blank" rel="noopener">
              {lectura.texto}
            </Link>{' '}
            · versión <code>{version}</code>
          </>
        ) : (
          <>
            versión <code>{version}</code>
          </>
        )}
      </p>
      {error ? (
        <p id={`${id}-error`} className="campo__error">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ActosDelAlta({
  marcados,
  errores,
  alCambiar,
  prefijo = '',
}: {
  marcados: ActosMarcados;
  errores: ErroresDeLosActos;
  alCambiar: (acto: ActoDelAlta, valor: boolean) => void;
  prefijo?: string;
}) {
  return (
    <fieldset className="actos">
      <legend>Antes de crear la cuenta</legend>
      <p className="campo__ayuda">Son tres confirmaciones distintas, cada una con su propio texto y su propia versión.</p>
      <Acto
        id={idDelActo('a1', prefijo)}
        marcado={marcados.a1}
        alCambiar={(v) => alCambiar('a1', v)}
        titulo={COPY.a1Titulo}
        texto={COPY.a1Texto}
        version={VERSION_VIGENTE.TERMINOS.id}
        lectura={{ href: '/legal/terminos', texto: 'Leer los términos de uso' }}
        error={errores.a1}
      />
      <Acto
        id={idDelActo('a2', prefijo)}
        marcado={marcados.a2}
        alCambiar={(v) => alCambiar('a2', v)}
        titulo={COPY.a2Titulo}
        texto={COPY.a2Texto}
        version={VERSION_VIGENTE.PRIVACIDAD_INFO.id}
        lectura={{ href: '/legal/privacidad', texto: 'Leer la información de privacidad' }}
        error={errores.a2}
      />
      <Acto
        id={idDelActo('mayoria', prefijo)}
        marcado={marcados.mayoria}
        alCambiar={(v) => alCambiar('mayoria', v)}
        titulo={COPY.mayoriaTitulo}
        texto={VERSION_VIGENTE.MAYORIA_DE_EDAD.texto}
        version={VERSION_VIGENTE.MAYORIA_DE_EDAD.id}
        error={errores.mayoria}
      />
      <p className="nota">
        Crear la cuenta no autoriza el tratamiento de datos de salud. Esa autorización es un paso aparte, que podés dar o no más adelante.
      </p>
    </fieldset>
  );
}
