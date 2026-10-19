'use client';

/**
 * «Cómo se lee esta vista», para Antropometría · Lámina (WP-ESCRITORIO-AREAS; F-14): lo que antes estaba plegado al pie
 * de la lámina («Cómo se lee»), en el mismo lugar que la ayuda de las otras secciones. Los textos son los del dominio;
 * los que dependían de la hoja o del modo elegidos se dicen con su caso.
 */
import { COPY_ANTROPOMETRIA as C } from '@be/domain';
import { AyudaDeVista, RenglonDeAyuda as Renglon } from '../../../../components/ayuda-de-vista';
import { Icono } from '../../../../components/icono';

export function AyudaDeLaLamina() {
  return (
    <AyudaDeVista titulo="Cómo se lee la Lámina" deQue="antropometria-lamina">
      <p className="nota">{C.explicacionDeLamina}</p>
      <ul className="como-se-lee__lista">
        <Renglon esencial muestra={<Icono nombre="perimetro" tamano={20} />}>
          <strong>Circunferencias y Pliegues.</strong> {C.explicacionDeFigura}
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="analizar" tamano={20} />}>
          <strong>Serie.</strong> {C.laminaExplicacionDeResta} {C.laminaSerieSinEntero}
        </Renglon>
        <Renglon muestra={<Icono nombre="imagen" tamano={20} />}>
          <strong>El tema.</strong> {C.laminaTemaPropio}
        </Renglon>
      </ul>
    </AyudaDeVista>
  );
}
