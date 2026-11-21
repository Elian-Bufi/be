'use client';

/**
 * RP-18 (DL-190) · «Qué vas a calcular», arriba de los datos de la toma: el profesional elige uno o varios métodos antes de
 * medir y la figura y la lista piden solo lo que necesitan, más peso, talla y edad. Vienen elegidos los de su última toma
 * (API-MHA-01); sin ninguno elegido se ve el protocolo entero, como antes. Elegir no esconde lo medido.
 *
 * Se elige por familia: las variantes por sexo de un método van juntas, y la ecuación se elige al calcular con la figura
 * de la toma (Hombre o Mujer). Al lado de cada método que lo necesita va dónde mide BE el sitio que las fuentes nombran
 * distinto (el suprailíaco de Jackson y Pollock, en la cresta ilíaca: D-1), para que el profesional sepa si coincide con su
 * práctica. Nada de esta pieza ordena por «mejor»: el orden es el del catálogo (REG-06-205).
 */
import { COPY_ANTROPOMETRIA as C, CONJUNTOS_DE_METODOS, NOTA_DEL_SITIO, type FamiliaDeMetodo } from '@be/domain';
import { useId, useState } from 'react';
import { conNumerosPegados } from '../../../../components/en-partes';
import { Icono } from '../../../../components/icono';

export function EleccionDeMetodos({
  familias,
  elegidas,
  deLaUltimaToma,
  leidos,
  onCambiar,
}: {
  familias: readonly FamiliaDeMetodo[];
  elegidas: ReadonlySet<string>;
  /** Si lo elegido es lo que vino de la última toma del profesional, sin tocar. */
  deLaUltimaToma: boolean;
  /** `false` si los métodos no se pudieron leer: la toma muestra el protocolo entero. */
  leidos: boolean;
  onCambiar: (elegidas: readonly string[]) => void;
}) {
  const id = useId();
  const [abierta, setAbierta] = useState(elegidas.size === 0 && leidos && familias.length > 0);
  const elegidasEnOrden = familias.filter((f) => elegidas.has(f.clave));
  const porSexo = elegidasEnOrden.filter((f) => f.porSexo);
  const notas = elegidasEnOrden.filter((f) => NOTA_DEL_SITIO[f.clave]);
  const alternar = (clave: string) => onCambiar(familias.filter((f) => (f.clave === clave ? !elegidas.has(f.clave) : elegidas.has(f.clave))).map((f) => f.clave));
  const conjuntos = CONJUNTOS_DE_METODOS.filter((c) => c.familias.every((f) => familias.some((x) => x.clave === f)));
  const alternarConjunto = (deLaFamilia: readonly string[]) => {
    const todas = deLaFamilia.every((f) => elegidas.has(f));
    onCambiar(familias.filter((f) => (deLaFamilia.includes(f.clave) ? !todas : elegidas.has(f.clave))).map((f) => f.clave));
  };
  const categorias = [...new Set(familias.map((f) => f.categoria))];

  return (
    <section className="tarjeta datos-de-la-carga eleccion-de-metodos" aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`}>Qué vas a calcular</h3>
      {!leidos ? (
        <p className="nota">No se pudieron leer los métodos: se ve todo el protocolo.</p>
      ) : elegidasEnOrden.length === 0 ? (
        <p className="nota">Elegí uno o varios métodos y la figura marca solo lo que piden, más peso, talla y edad. Sin ninguno, se ve todo el protocolo.</p>
      ) : (
        <>
          <ul className="eleccion-de-metodos__elegidos" aria-label="Métodos elegidos">
            {elegidasEnOrden.map((f) => (
              <li key={f.clave} className="etiqueta-de-dato">
                {conNumerosPegados(f.nombre)}
                <button type="button" className="boton boton--enlace eleccion-de-metodos__quitar" aria-label={`Quitar ${f.nombre}`} onClick={() => alternar(f.clave)}>
                  <Icono nombre="cerrar" tamano={18} />
                </button>
              </li>
            ))}
          </ul>
          <p className="nota">
            {deLaUltimaToma ? 'Vienen elegidos los de tu última toma. ' : ''}La figura y la lista piden lo que necesitan estos métodos, más peso, talla y edad.
          </p>
          {porSexo.length > 0 ? (
            <p className="nota">
              {porSexo.length === 1 ? `«${porSexo[0]!.nombre}» tiene una ecuación por sexo` : 'Algunos tienen una ecuación por sexo'}: al calcular se usa la de la figura de la toma ({C.figuraHombre} o {C.figuraMujer}).
            </p>
          ) : null}
          {notas.map((f) => (
            <p key={f.clave} className="nota eleccion-de-metodos__sitio">
              <strong>Dónde mide BE · {f.nombre}:</strong> {NOTA_DEL_SITIO[f.clave]}
            </p>
          ))}
        </>
      )}
      {leidos && familias.length > 0 ? (
        <button type="button" className="boton boton--secundario boton--compacto" aria-expanded={abierta} aria-controls={`${id}-lista`} onClick={() => setAbierta((x) => !x)}>
          <Icono nombre={abierta ? 'arriba' : 'abajo'} tamano={18} />
          {abierta ? 'Listo' : elegidasEnOrden.length === 0 ? 'Elegir métodos' : 'Cambiar los métodos'}
        </button>
      ) : null}
      {abierta && leidos ? (
        <div id={`${id}-lista`} className="eleccion-de-metodos__lista">
          {conjuntos.length > 0 ? (
            <fieldset className="lamina__tomas">
              <legend>De un toque</legend>
              <ul>
                {conjuntos.map((c) => (
                  <li key={c.clave}>
                    <label>
                      <input type="checkbox" checked={c.familias.every((f) => elegidas.has(f))} onChange={() => alternarConjunto(c.familias)} /> {conNumerosPegados(c.nombre)}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          ) : null}
          {categorias.map((categoria) => (
            <fieldset key={categoria ?? 'OTROS'} className="lamina__tomas">
              <legend>{categoria ? (C.categoriaDeMetodo[categoria] ?? categoria) : C.laminaOtrosCalculos}</legend>
              <ul className="eleccion-de-metodos__opciones">
                {familias
                  .filter((f) => f.categoria === categoria)
                  .map((f) => (
                    <li key={f.clave}>
                      <label>
                        <input type="checkbox" checked={elegidas.has(f.clave)} onChange={() => alternar(f.clave)} /> {conNumerosPegados(f.nombre)}
                      </label>
                      <span className="nota eleccion-de-metodos__pide">
                        {f.mediciones.length} {f.mediciones.length === 1 ? 'medida' : 'medidas'}
                        {f.porSexo ? ' · por sexo' : ''}
                      </span>
                      {NOTA_DEL_SITIO[f.clave] ? <span className="nota eleccion-de-metodos__sitio">{NOTA_DEL_SITIO[f.clave]}</span> : null}
                    </li>
                  ))}
              </ul>
            </fieldset>
          ))}
        </div>
      ) : null}
    </section>
  );
}
