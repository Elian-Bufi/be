'use client';

/**
 * RP-07 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · Una cantidad de kcal o de un macro, con su ícono antes del número: «[rayo]
 * 2.500 kcal», «[ícono] 112 g P». Lo que se ve va oculto para el lector de pantalla, que lee la palabra completa («112
 * gramos de proteínas»). Los textos, en `abreviaturas-de-macros.ts`. Una sola pieza para el objetivo del día, las comidas,
 * los rangos y «Rangos y totales».
 */
import { Icono } from '../../../../components/icono';
import { cantidadAbreviada, cantidadEnPalabras, ICONO_DEL_MACRO, type MacroConIcono } from './abreviaturas-de-macros';

export function CantidadDelMacro({ macro, cifra }: { macro: MacroConIcono; cifra: string }) {
  return (
    <span className="cantidad-del-macro" data-macro={macro}>
      <Icono nombre={ICONO_DEL_MACRO[macro]} tamano={15} />
      <span aria-hidden="true">{cantidadAbreviada(macro, cifra)}</span>
      <span className="visualmente-oculto">{cantidadEnPalabras(macro, cifra)}</span>
    </span>
  );
}
