'use client';

/**
 * RP-07 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · Una cantidad de kcal o de un macro, con su ícono antes del número: «[rayo]
 * 2.500 kcal», «[ícono] 112 g P». Lo que se ve va oculto para el lector de pantalla, que lee la palabra completa («112
 * gramos de proteínas»). Los textos, en `abreviaturas-de-macros.ts`. Una sola pieza para el objetivo del día, las comidas,
 * los rangos y «Rangos y totales».
 */
import { MACROS_DEL_RANGO, type Rango } from '@be/domain';
import { Icono } from '../../../../components/icono';
import { ABREVIATURA_DEL_MACRO, cantidadAbreviada, cantidadEnPalabras, cifraDeLosLimites, ICONO_DEL_MACRO, MACRO_DEL_NUTRIENTE, type MacroConIcono } from './abreviaturas-de-macros';
import { NUTRIENTES_DEL_RANGO, type NutrienteDelRango } from './rangos';

export function CantidadDelMacro({ macro, cifra }: { macro: MacroConIcono; cifra: string }) {
  return (
    <span className="cantidad-del-macro" data-macro={macro}>
      <Icono nombre={ICONO_DEL_MACRO[macro]} tamano={15} />
      <span aria-hidden="true">{cantidadAbreviada(macro, cifra)}</span>
      <span className="visualmente-oculto">{cantidadEnPalabras(macro, cifra)}</span>
    </span>
  );
}

/**
 * Un rango indicado de una comida o de un día tipo, macro por macro con su ícono: «[ícono] 125 a 156 g P · [ícono] desde
 * 250 g C». Lo que no tiene límite no aparece, como en el renglón de siempre.
 */
export function RangoIndicadoConIconos({ rango }: { rango: Rango }) {
  const partes = MACROS_DEL_RANGO.flatMap((m) => {
    const v = rango[m];
    return v ? [{ m, cifra: cifraDeLosLimites(v.grams.min, v.grams.max) }] : [];
  });
  return (
    <span className="cantidades-con-iconos">
      {partes.map((p, i) => (
        <span key={p.m}>
          {i > 0 ? <span aria-hidden="true"> · </span> : null}
          <CantidadDelMacro macro={p.m} cifra={p.cifra} />
        </span>
      ))}
    </span>
  );
}

/** Las kcal y los tres macros de un total o de lo que aporta una comida, cada uno con su ícono; lo que falta, «Sin dato». */
export function NutrientesConIconos({ cifras, sinDato }: { cifras: Readonly<Record<NutrienteDelRango, string | null>>; sinDato: string }) {
  return (
    <span className="cantidades-con-iconos">
      {NUTRIENTES_DEL_RANGO.map((n, i) => {
        const cifra = cifras[n];
        return (
          <span key={n}>
            {i > 0 ? <span aria-hidden="true"> · </span> : null}
            {cifra === null ? (
              <span className="cantidad-del-macro" data-macro={MACRO_DEL_NUTRIENTE[n]}>
                <Icono nombre={ICONO_DEL_MACRO[MACRO_DEL_NUTRIENTE[n]]} tamano={15} />
                <span aria-hidden="true">{`${ABREVIATURA_DEL_MACRO[MACRO_DEL_NUTRIENTE[n]].replace(/^g /, '')} ${sinDato}`}</span>
                <span className="visualmente-oculto">{`${cantidadEnPalabras(MACRO_DEL_NUTRIENTE[n], '').trim()}: ${sinDato.toLowerCase()}`}</span>
              </span>
            ) : (
              <CantidadDelMacro macro={MACRO_DEL_NUTRIENTE[n]} cifra={cifra} />
            )}
          </span>
        );
      })}
    </span>
  );
}

/** El rótulo de una columna o una fila de kcal o de un macro, con su ícono: «[ícono] Proteínas (g)». */
export function RotuloConIcono({ macro, texto }: { macro: MacroConIcono; texto: string }) {
  return (
    <span className="cantidad-del-macro">
      <Icono nombre={ICONO_DEL_MACRO[macro]} tamano={15} />
      {texto}
    </span>
  );
}
