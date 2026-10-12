'use client';

/**
 * «Cómo se lee esta vista», para Antropometría · Tomas (WP-ESCRITORIO-AREAS, parte 3; F-14): qué dice la lista, qué
 * valor muestra cada medición y qué no hace la pantalla. Junta las ayudas que estaban plegadas y repartidas por la
 * sección («Medido, reportado o calculado», «Cómo conviven los cálculos», «Por qué está sin efecto»). Los textos que el
 * dominio ya fija con una prueba se usan como están. El botón y el diálogo son los de la ficha (`AyudaDeVista`); va en
 * el marco del área.
 */
import { COPY_ANTROPOMETRIA as C } from '@be/domain';
import { AyudaDeVista, RenglonDeAyuda as Renglon } from '../../../../components/ayuda-de-vista';
import { Icono } from '../../../../components/icono';

export function AyudaDeTomas() {
  return (
    <AyudaDeVista titulo="Cómo se leen las Tomas" deQue="antropometria-tomas">
      <p className="nota">Las tomas registradas, con sus mediciones y sus resultados calculados. Ubica cada dato: no califica ningún valor.</p>
      <ul className="como-se-lee__lista">
        <Renglon muestra={<Icono nombre="lista" tamano={20} />}>
          <strong>Las tomas van por cuándo se tomaron,</strong> la más nueva primero, en tramos del mismo protocolo: se ve dónde cambió. Cada una dice cuántas mediciones tiene y, si las hay, cuántas con una corrección
          y cuántas anuladas.
        </Renglon>
        <Renglon muestra={<Icono nombre="borrador" tamano={20} />}>
          <strong>Una toma registrada no se edita:</strong> cada medición se corrige o se anula, y queda constancia. {C.borradorNoEsHistoria}
        </Renglon>
        <Renglon muestra={<Icono nombre="medido" tamano={20} />}>
          <strong>Medido, reportado o calculado.</strong> {C.explicacionDeClases} Si todas las mediciones de la toma son de una clase, se dice una vez, arriba; si no, cada fila dice la suya.
        </Renglon>
        <Renglon muestra={<Icono nombre="corregido" tamano={20} />}>
          <strong>El valor de cada fila es el que rige:</strong> si la medición se corrigió, el corregido. El original no se pierde: está en la historia de la medición, con el motivo y quién la corrigió.
        </Renglon>
        <Renglon muestra={<Icono nombre="anulado" tamano={20} />}>
          <strong>Anulada.</strong> {C.explicacionDeAnulacion} {C.sinReversion}
        </Renglon>
        <Renglon muestra={<Icono nombre="sin-datos" tamano={20} />}>
          <strong>Sin valor vigente.</strong> {C.cadenaNoResoluble} No se pone otro en su lugar.
        </Renglon>
        <Renglon muestra={<Icono nombre="protocolo" tamano={20} />}>
          <strong>La unidad se dice una vez por familia</strong> cuando todas sus mediciones la comparten; si no, en cada fila. BE no convierte unidades: cada valor queda en la que se tomó.
        </Renglon>
        <Renglon muestra={<Icono nombre="calculado" tamano={20} />}>
          <strong>Resultados calculados.</strong> {C.explicacionDeCoexistencia} {C.noEsDiagnostico}
        </Renglon>
        <Renglon muestra={<Icono nombre="referencia" tamano={20} />}>
          <strong>Referencia.</strong> {C.explicacionDeReferencia}
        </Renglon>
        <Renglon muestra={<Icono nombre="reloj" tamano={20} />}>
          <strong>Anteriores, sin efecto.</strong> {C.explicacionDeAnterioresSinEfecto} Están a un clic, al lado del título de los resultados.
        </Renglon>
        <Renglon muestra={<Icono nombre="derecha" tamano={20} />}>
          <strong>Cada medición y cada resultado abren su detalle</strong> en un panel: la historia de la medición, lo que cambió en los resultados cuando se corrigió, y corregir o anular; de un resultado, con qué se
          calculó. Escape lo cierra.
        </Renglon>
      </ul>
    </AyudaDeVista>
  );
}
