'use client';

/**
 * RP-21 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · «Rangos y totales», el panel al costado del editor de Nutrición. Dirección
 * (22/11): «ponele más amor, que se vea mejor, agregale íconos a los macros». Antes: el día en negrita grande al final
 * con «Sin dato», una grilla de 2 × 2 sin íconos por comida, «Sin dato» cuatro veces en cada comida vacía y la lista de
 * lo que falta repetida al pie.
 *
 * - **Arriba, el día:** lo que va según la opción que se elija en cada comida, con el ícono de cada cantidad y, si el día
 *   tiene rango indicado, su tramo frente a ese rango (RP-D44).
 * - **Después, cada comida:** su nombre y cuántas opciones tiene, lo que aportan de la que menos a la que más (las que
 *   tienen el dato), y la franja compacta frente a su rango indicado (la de RP-20). RP-23: con la misma regla que la
 *   comida, la banda y el promedio, y el punto de cada opción tildada, en su color.
 * - **Lo que no suma se dice una vez y en chico:** una comida o una opción sin alimentos va en el renglón de su comida; lo
 *   demás que falta (una cantidad, una composición), en una sola nota al pie.
 * - Todo sale del borrador en pantalla (`rangosDelDia`, en cada render): se mueve con cada tecla. Lo calcula el editor; no
 *   viaja al guardar y la persona no lo ve.
 * - **Lo largo, detrás de un «?»** (pedido de Dirección para todo el recorrido): cómo se lee una franja, cómo se suma el
 *   día, de dónde salen las kcal del rango, con qué porción va una receta y que es una estimación del editor.
 * - **Sin saltos:** el bloque del día tiene siempre su renglón de ayuda y sus cuatro renglones; sin dato, «—» y el porqué
 *   en el renglón de ayuda. Así no se achica cada vez que una cantidad queda vacía mientras se escribe.
 */
import type { Rango } from '@be/domain';
import { useId } from 'react';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';
import { Icono } from '../../../../components/icono';
import { FranjasDeLaComida, TramosDelDia } from './franjas-de-la-comida';
import { armarFranjas, COPY_FRANJAS, enLasBarrasEnPalabras, loQueFaltaEnElDia, tramosDelDia } from './franjas-por-comida';
import { COPY_RANGOS, queFaltaEnPalabras, type RangosDelDia } from './rangos';

export function RangosYTotales({
  rangos,
  nombreDelDia,
  rangoDelDia,
  comidas,
  leyendo,
  conRecetas,
}: {
  rangos: RangosDelDia;
  nombreDelDia: string;
  /** El rango indicado del día tipo, si hay. */
  rangoDelDia: Rango | null;
  /** Por comida, en el orden de `rangos.comidas`: su rango indicado y la identidad de cada opción (para no saltar). */
  comidas: readonly { readonly rango: Rango | null; readonly claves: readonly string[]; readonly enLasBarras: ReadonlySet<string> }[];
  /** Cuántas composiciones se están leyendo todavía. */
  leyendo: number;
  /** Si alguna opción del día es de receta: se dice con qué porción se cuenta. */
  conRecetas: boolean;
}) {
  const id = useId();
  // Lo que se está leyendo lo dice su propia nota («Leyendo la composición de…»): no se repite en lo que falta.
  const falta = loQueFaltaEnElDia(rangos.comidas);
  const otros = falta.otros.filter((f) => f.motivo !== 'LEYENDO');
  const diaConDato = rangos.comidas.length > 0 && (['energyKcal', 'proteinG', 'carbohydrateG', 'fatG'] as const).some((n) => rangos.dia[n].tipo === 'rango');
  return (
    <div className="rangos-y-totales">
      <section className="rangos-y-totales__dia" aria-labelledby={`${id}-dia`} data-rango-del-dia>
        {/* El «?» va al lado del título y no adentro: el título nombra la sección (como en el «Reparto por comida»). */}
        <div className="rangos-y-totales__encabezado">
          <h3 id={`${id}-dia`} className="rangos-y-totales__titulo">
            <Icono nombre="calendario" tamano={18} />
            {COPY_RANGOS.elDia}
            <span className="rangos-y-totales__del-dia"> · {nombreDelDia}</span>
          </h3>
          <ExplicacionAPedido nombre={COPY_FRANJAS.comoSeLeeElPanel} como="div">
            <p>{COPY_FRANJAS.comoSeLeeLaFranja}</p>
            <p>{COPY_RANGOS.comoSeLee}</p>
            <p>{COPY_FRANJAS.kcalDeLosGramos}</p>
            {conRecetas ? <p>{COPY_FRANJAS.recetasGuardadas}</p> : null}
            <p>{COPY_RANGOS.estimacion}</p>
          </ExplicacionAPedido>
        </div>
        {rangos.comidas.length === 0 ? (
          <p className="nota">{COPY_RANGOS_Y_TOTALES.sinComidas}</p>
        ) : (
          <>
            {/* Un renglón, siempre: cómo se lee el día o, si no se puede sumar, por qué (lo que falta va abajo). */}
            <p className="nota rangos-y-totales__ayuda" data-dia-sin-dato={diaConDato ? undefined : ''}>
              {diaConDato ? COPY_FRANJAS.segunLoQueElija : leyendo > 0 ? COPY_RANGOS_Y_TOTALES.diaLeyendo : COPY_RANGOS_Y_TOTALES.diaSinDato}
            </p>
            <TramosDelDia tramos={tramosDelDia(rangos.dia, rangoDelDia)} />
          </>
        )}
      </section>
      {rangos.comidas.length > 0 ? (
        <ul className="rangos-y-totales__comidas" aria-label={COPY_RANGOS.tituloDeLasComidas} data-rangos-por-comida>
          {rangos.comidas.map((c, j) => {
            const claves = comidas[j]?.claves ?? [];
            const paraLaFranja = c.opciones.map((o, k) => ({ clave: claves[k] ?? String(k), nombre: o.nombre, total: o.total, lugar: k }));
            const f = armarFranjas(comidas[j]?.rango ?? null, paraLaFranja);
            const elegidas = comidas[j]?.enLasBarras ?? SIN_ELEGIDAS;
            const vacias = c.opciones.filter((o) => o.total.energyKcal.faltan.some((x) => x.motivo === 'SIN_ALIMENTOS')).length;
            return (
              <li key={j} className="total-de-la-comida" data-comida-del-panel={j + 1}>
                <p className="total-de-la-comida__nombre">
                  <strong>{c.nombre}</strong>
                  <span className="nota">
                    {' '}
                    · {c.opciones.length === 0 ? COPY_FRANJAS.sinOpciones : COPY_FRANJAS.opciones(c.opciones.length)}
                    {c.opciones.length > 0 && f.sinAlimentos ? ` · ${COPY_RANGOS_Y_TOTALES.sinAlimentos}` : vacias > 0 ? ` · ${COPY_RANGOS_Y_TOTALES.vacias(vacias)}` : ''}
                  </span>
                </p>
                {c.opciones.length > 0 && !f.sinAlimentos ? <FranjasDeLaComida franjas={f} comida={c.nombre} variante="panel" elegidas={elegidas} enLasBarras={enLasBarrasEnPalabras(paraLaFranja, elegidas)} /> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {otros.length > 0 ? (
        <p className="nota rangos-y-totales__falta" data-huecos>
          {COPY_RANGOS_Y_TOTALES.paraSumar} {otros.slice(0, 3).map(queFaltaEnPalabras).join('; ')}
          {otros.length > 3 ? `; ${COPY_RANGOS.yMas(otros.length - 3)}` : ''}.
        </p>
      ) : null}
      {leyendo > 0 ? (
        <p className="nota" role="status">
          {COPY_RANGOS.leyendo(leyendo)}
        </p>
      ) : null}
    </div>
  );
}

/** RP-23: una comida sin nada tildado (por defecto): la banda y el promedio. */
const SIN_ELEGIDAS: ReadonlySet<string> = new Set();

export const COPY_RANGOS_Y_TOTALES = {
  sinComidas: 'Este día tipo todavía no tiene comidas.',
  /** Cortos: van en el renglón de ayuda del día, que no se parte (el bloque del día no cambia de alto). */
  diaSinDato: 'Todavía no se suma: abajo dice qué falta.',
  diaLeyendo: 'Se suma al terminar de leer los alimentos.',
  sinAlimentos: 'sin alimentos',
  vacias: (n: number) => (n === 1 ? '1 sin alimentos' : `${n} sin alimentos`),
  paraSumar: 'Para sumar falta:',
} as const;
