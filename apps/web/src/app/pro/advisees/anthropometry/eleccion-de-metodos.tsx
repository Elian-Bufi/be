'use client';

/**
 * «Qué vas a calcular», arriba de los datos de la toma (RP-18, DL-190; DL-200, AR-06): el profesional elige el método
 * antes de medir y la figura y la lista piden exactamente lo que necesita, más peso, talla y edad.
 *
 * Desde DL-200 se elige **el método entero**, no cada resultado: «Jackson y Pollock, 7 pliegues» pide sus 7 pliegues, la
 * edad y el peso, y da la suma, la densidad, el % de grasa (con Siri y Brožek), la masa grasa y la libre de grasa. Cada
 * método dice, antes de medir, qué pide y qué va a dar. El fraccionamiento en cuatro componentes (Rocha y Würch) se suma
 * con un toque y pide la talla y dos diámetros más. Nada se tilda: cada método es un botón que se elige o se quita.
 *
 * Vienen elegidos los de la última toma del profesional (API-MHA-01); sin ninguno, se ve el protocolo entero. Al lado de
 * cada método que lo necesita va dónde mide BE el sitio que las fuentes nombran distinto (el suprailíaco de Jackson y
 * Pollock, en la cresta ilíaca: D-1). El orden es el del catálogo, nunca por «mejor» (REG-06-205).
 */
import {
  COPY_ANTROPOMETRIA as C,
  loQuePideEnPalabras,
  loQueVaADar,
  medicionesDelPrograma,
  NOTA_DEL_SITIO,
  TITULO_DE_LA_CATEGORIA,
  type CategoriaDePrograma,
  type ProgramaDeResultado,
  type SexoDeLaCadena,
} from '@be/domain';
import { useId, useState } from 'react';
import { conNumerosPegados } from '../../../../components/en-partes';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';
import { Icono } from '../../../../components/icono';

/** La nota de dónde mide BE un sitio, por método (las de DL-190 estaban por familia de métrica). */
const NOTA_DEL_METODO: Readonly<Record<string, string | undefined>> = {
  'jackson-pollock-7': NOTA_DEL_SITIO['grasa-jackson-pollock-7'],
  'jackson-pollock-3': NOTA_DEL_SITIO['suma-7-pliegues-jackson-pollock'],
  'lee-perimetros': NOTA_DEL_SITIO['masa-muscular-esqueletica-lee'],
  'kerr-5c': [NOTA_DEL_SITIO['masa-muscular-kerr'], NOTA_DEL_SITIO['masa-residual-kerr']].filter(Boolean).join(' '),
};

export function EleccionDeMetodos({
  programas,
  elegidos,
  conFraccionamiento,
  sexo,
  deLaUltimaToma,
  leidos,
  onCambiar,
}: {
  programas: readonly ProgramaDeResultado[];
  elegidos: readonly string[];
  conFraccionamiento: boolean;
  /** El de la figura de la toma: con él se sabe qué pliegues pide un método por sexo (JP3). */
  sexo: SexoDeLaCadena;
  /** Si lo elegido es lo que vino de la última toma del profesional, sin tocar. */
  deLaUltimaToma: boolean;
  /** `false` si los métodos no se pudieron leer: la toma muestra el protocolo entero. */
  leidos: boolean;
  onCambiar: (elegidos: readonly string[], conFraccionamiento: boolean) => void;
}) {
  const id = useId();
  const [abierta, setAbierta] = useState(elegidos.length === 0 && leidos);
  const enOrden = programas.filter((p) => elegidos.includes(p.clave));
  const fraccionables = enOrden.filter((p) => p.conFraccionamiento);
  const alternar = (clave: string) =>
    onCambiar(
      programas.filter((p) => (p.clave === clave ? !elegidos.includes(p.clave) : elegidos.includes(p.clave))).map((p) => p.clave),
      conFraccionamiento,
    );
  const categorias = [...new Set(programas.map((p) => p.categoria))] as CategoriaDePrograma[];
  const porSexo = enOrden.filter((p) => p.porSexo);

  return (
    <section className="tarjeta datos-de-la-carga eleccion-de-metodos con-ayuda-en-la-esquina" aria-labelledby={`${id}-titulo`} data-eleccion-de-metodos>
      <h3 id={`${id}-titulo`}>Qué vas a calcular</h3>
      <ExplicacionAPedido nombre="Cómo se elige qué calcular" como="div" lugar="esquina">
        <p>Elegí el método y la figura pide exactamente lo que necesita, más peso, talla y edad. BE calcula todo lo que el método da, en orden: lo medido, la ecuación, la conversión y las masas.</p>
        <p>
          Un ejemplo resuelto: con «Jackson y Pollock, 7 pliegues», un hombre de 30 años y 77 kg cuyos pliegues suman 82 mm tiene una densidad de 1,0714 g/cm³, un % de grasa del 12,0 % del peso corporal
          con Siri (12,4 % con Brožek), 9,3 kg de masa grasa y 67,7 kg de masa libre de grasa.
        </p>
        <p>Al registrar la toma, BE guarda en la historia los resultados que tienen su método en el catálogo.</p>
      </ExplicacionAPedido>
      {!leidos ? (
        <p className="nota">No se pudieron leer los métodos: se ve todo el protocolo.</p>
      ) : enOrden.length === 0 ? (
        <p className="nota">Elegí uno o varios métodos y la figura marca solo lo que piden, más peso, talla y edad. Sin ninguno, se ve todo el protocolo.</p>
      ) : (
        <>
          <ul className="eleccion-de-metodos__elegidos" aria-label="Métodos elegidos">
            {enOrden.map((p) => {
              const pide = medicionesDelPrograma(p.clave, sexo, conFraccionamiento);
              const da = loQueVaADar(p.clave, conFraccionamiento);
              return (
                <li key={p.clave} className="metodo-elegido" data-metodo-elegido={p.clave}>
                  <div className="metodo-elegido__cabecera">
                    <span className="metodo-elegido__nombre">{conNumerosPegados(p.nombre)}</span>
                    <button type="button" className="boton boton--quieto boton--compacto metodo-elegido__quitar" aria-label={`Quitar ${p.nombre}`} onClick={() => alternar(p.clave)}>
                      <Icono nombre="cerrar" tamano={18} />
                    </button>
                  </div>
                  <p className="metodo-elegido__pide">
                    <span className="metodo-elegido__rotulo">Pide</span> {loQuePideEnPalabras(pide)}
                  </p>
                  <p className="metodo-elegido__da">
                    <span className="metodo-elegido__rotulo">Vas a obtener</span> {da.join(' · ')}
                  </p>
                  {NOTA_DEL_METODO[p.clave] ? (
                    <p className="nota eleccion-de-metodos__sitio">
                      <strong>Dónde mide BE:</strong> {NOTA_DEL_METODO[p.clave]}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {fraccionables.length > 0 ? (
            <button
              type="button"
              className={`boton boton--compacto eleccion-de-metodos__fraccionamiento ${conFraccionamiento ? 'boton--secundario' : 'boton--quieto'}`}
              aria-pressed={conFraccionamiento}
              onClick={() => onCambiar(elegidos, !conFraccionamiento)}
              data-fraccionamiento
            >
              <Icono nombre={conFraccionamiento ? 'tilde' : 'mas'} tamano={18} />
              {conFraccionamiento ? 'Con el fraccionamiento en cuatro componentes' : 'Sumar el fraccionamiento en cuatro componentes'}
              <span className="eleccion-de-metodos__fraccionamiento-pide">{conFraccionamiento ? 'talla y 2 diámetros' : '+ talla y 2 diámetros'}</span>
            </button>
          ) : null}
          {deLaUltimaToma || porSexo.length > 0 ? (
            <p className="nota">
              {deLaUltimaToma ? 'Vienen elegidos los de tu última toma. ' : ''}
              {porSexo.length > 0
                ? `${porSexo.length === 1 ? `«${porSexo[0]!.nombre}» tiene una ecuación por sexo` : 'Algunos tienen una ecuación por sexo'}: se usa la de la figura de la toma (${sexo === 'MUJER' ? C.figuraMujer : C.figuraHombre}).`
                : ''}
            </p>
          ) : null}
        </>
      )}
      {leidos ? (
        <button type="button" className="boton boton--secundario boton--compacto" aria-expanded={abierta} aria-controls={`${id}-lista`} onClick={() => setAbierta((x) => !x)}>
          <Icono nombre={abierta ? 'arriba' : 'abajo'} tamano={18} />
          {abierta ? 'Listo' : enOrden.length === 0 ? 'Elegir métodos' : 'Cambiar los métodos'}
        </button>
      ) : null}
      {abierta && leidos ? (
        <div id={`${id}-lista`} className="eleccion-de-metodos__lista">
          {categorias.map((categoria) => (
            <section key={categoria} className="eleccion-de-metodos__categoria" aria-label={TITULO_DE_LA_CATEGORIA[categoria]}>
              <h4>{TITULO_DE_LA_CATEGORIA[categoria]}</h4>
              <ul className="eleccion-de-metodos__opciones">
                {programas
                  .filter((p) => p.categoria === categoria)
                  .map((p) => {
                    const elegido = elegidos.includes(p.clave);
                    return (
                      <li key={p.clave}>
                        <button type="button" className="opcion-de-metodo" aria-pressed={elegido} onClick={() => alternar(p.clave)} data-opcion-de-metodo={p.clave}>
                          <span className="opcion-de-metodo__marca" aria-hidden="true">
                            <Icono nombre={elegido ? 'tilde' : 'mas'} tamano={18} />
                          </span>
                          <span className="opcion-de-metodo__texto">
                            <span className="opcion-de-metodo__nombre">{conNumerosPegados(p.nombre)}</span>
                            <span className="opcion-de-metodo__da">{p.da}</span>
                          </span>
                          <span className="opcion-de-metodo__pide">{loQuePideEnPalabras(medicionesDelPrograma(p.clave, sexo))}</span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </section>
  );
}
