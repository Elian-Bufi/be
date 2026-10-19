'use client';

/**
 * «Cómo se lee esta vista», para Nutrición · Registros (WP-ESCRITORIO-AREAS, parte 1; F-14): qué es cada fila, qué
 * quiere decir cada modo de registro y qué no dice la pantalla. Reemplaza al «Cómo se lee» que había plegado en la
 * sección. El botón y el diálogo son los de la ficha (`AyudaDeVista`); va en el marco del área.
 */
import { VISTAS_DE_REGISTROS } from '@be/domain';
import { AyudaDeVista, RenglonDeAyuda as Renglon, SoloEnLaGuia } from '../../../../components/ayuda-de-vista';
import { Icono } from '../../../../components/icono';

export function AyudaDeRegistros() {
  return (
    <AyudaDeVista titulo="Cómo se leen los Registros" deQue="nutricion-registros">
      <p className="nota">Lo indicado y lo registrado, día por día. Describe lo registrado: no califica ni dice si alcanza.</p>
      <ul className="como-se-lee__lista">
        <Renglon muestra={<Icono nombre="calendario" tamano={20} />}>
          <strong>El día es la unidad.</strong> Los días van del más nuevo al más viejo. Cada uno se dice en un renglón («3 de 4 comidas registradas») y se abre en el lugar. Arrancan abiertos los que tienen una comida
          diferente o algo distinto de lo indicado: plegar no esconde.
        </Renglon>
        <Renglon muestra={<Icono nombre="comida" tamano={20} />}>
          <strong>Cada comida del plan es una fila,</strong> en el orden del plan: la opción que registró la persona, cómo informó las cantidades y la diferencia observada. «N de M comidas registradas» es una cuenta: no
          dice si alcanza.
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="sin-datos" tamano={20} />}>
          <strong>«Sin registro»</strong> es eso: no hay dato de esa comida. No es un cero, y no se interpreta. Un día sin ningún registro dice «Sin registro», no «0 de 4».
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="plan" tamano={20} />}>
          <strong>Porciones del plan:</strong> la persona confirmó las cantidades indicadas. No hay diferencia que comprobar: son las del plan.
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="a-mano" tamano={20} />}>
          <strong>Cantidades informadas:</strong> la persona escribió lo que comió de cada ingrediente. BE lo compara con la opción indicada, ingrediente por ingrediente, y dice si coincide. Las restas que se pueden hacer van
          al lado («Pollo +30 g»). Una diferencia es un dato, no una calificación.
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="sin-confirmar" tamano={20} />}>
          <strong>Sin confirmar:</strong> registró la opción y no confirmó las cantidades. Sigue sin confirmar: no se completa con las porciones del plan.
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="desvio" tamano={20} />}>
          <strong>Comida diferente:</strong> registró algo que no es una opción del plan. Va en la comida donde lo registró y no la marca como registrada; si no la registró en ninguna, va en un renglón propio del día.
          Queda fuera de lo indicado: no se compara.
        </Renglon>
        <Renglon muestra={<Icono nombre="ver" tamano={20} />}>
          <strong>Las vistas</strong> son filtros con nombre. El número es la cantidad de comidas que trae cada una; elegir una no le pide nada nuevo a BE. Volver a tocarla deja «Todas las comidas».
        </Renglon>
        <Renglon muestra={<Icono nombre="derecha" tamano={20} />}>
          <strong>Cada fila abre su registro,</strong> tal como lo hizo la persona: lo indicado y lo registrado por ingrediente, la estimación de lo consumido, las fotos y cuándo lo cargó. En una ventana ancha se abre al
          costado; en una angosta, encima. Escape lo cierra. A una comida diferente le podés sumar tu estimación: el registro original no se toca.
        </Renglon>
        <Renglon muestra={<Icono nombre="lista" tamano={20} />}>
          <strong>Lo que no se puede contar:</strong> un día sin plan vigente, o de un plan con más de un día tipo y sin registros que digan cuál era, no tiene comidas del plan que mostrar. Sus comidas no entran en ninguna
          cantidad, y la pantalla dice cuántos días son.
        </Renglon>
        <Renglon muestra={<Icono nombre="anulado" tamano={20} />}>
          <strong>Los registros que la persona deshizo</strong> no están acá: quedan en la línea de tiempo de la ficha, con su etiqueta.
        </Renglon>
        <Renglon muestra={<Icono nombre="calendario" tamano={20} />}>
          <strong>El período</strong> admite hasta 92 días. Si no elegís ninguno, BE propone los últimos siete y lo dice arriba. El período, la vista y el registro abierto quedan en la dirección de la página: «Actualizar»
          y volver atrás los conservan.
        </Renglon>
      </ul>
      <SoloEnLaGuia>
      <details className="como-se-lee__fuentes">
        <summary>Qué trae cada vista ({VISTAS_DE_REGISTROS.length})</summary>
        <dl>
          {VISTAS_DE_REGISTROS.map((v) => (
            <div key={v.clave} data-vista={v.clave}>
              <dt>{v.nombre}</dt>
              <dd>{v.queTrae}</dd>
            </div>
          ))}
        </dl>
      </details>
      </SoloEnLaGuia>
    </AyudaDeVista>
  );
}
