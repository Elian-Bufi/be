'use client';

/**
 * «Cómo se lee esta vista», para las Revisiones de Nutrición y de Entrenamiento (WP-ESCRITORIO-AREAS, parte 10): qué es
 * la lista, de dónde sale el período, qué quiere decir marcar y qué pasa (y qué no) al registrar. Es una sola para las
 * dos áreas; cambian los registros (comidas o sesiones), la frase de BE sobre ver y revisar, y lo que Entrenamiento dice
 * de una progresión. El botón y el diálogo son los de la ficha (`AyudaDeVista`); va en el marco del área.
 */
import { COPY_ENTRENAMIENTO, COPY_NUTRICION } from '@be/domain';
import { AyudaDeVista, RenglonDeAyuda as Renglon } from '../../../components/ayuda-de-vista';
import { Icono } from '../../../components/icono';

export function AyudaDeRevisiones({ area }: { area: 'NUTRICION' | 'ENTRENAMIENTO' }) {
  const nutricion = area === 'NUTRICION';
  const registros = nutricion ? 'comidas' : 'sesiones';
  return (
    <AyudaDeVista titulo="Cómo se leen las Revisiones" deQue={nutricion ? 'nutricion-revisiones' : 'entrenamiento-revisiones'}>
      <p className="nota">{nutricion ? COPY_NUTRICION.verNoEsRevisar : COPY_ENTRENAMIENTO.contextoNoEsRevision}</p>
      <ul className="como-se-lee__lista">
        <Renglon muestra={<Icono nombre="revision" tamano={20} />}>
          <strong>La lista</strong> tiene las revisiones registradas, de la más nueva a la más vieja, cada una con su resultado. «Nueva revisión» abre otra pantalla; «Cancelar» vuelve a la lista sin registrar nada.
        </Renglon>
        <Renglon muestra={<Icono nombre="calendario" tamano={20} />}>
          <strong>El período</strong> lo prepara BE desde tu última revisión hasta hoy, y lo dice al lado. Lo podés cambiar, hasta 92 días: lo que escribiste no se pierde, y de lo marcado se quita solo lo que quedó
          afuera.
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="tilde" tamano={20} />}>
          <strong>Lo que miraste:</strong> nada viene marcado. Marcar un día marca cada una de sus {registros}; «Ver» las muestra para marcarlas una por una. Marcar es tu declaración de lo que examinaste: BE no
          lo elige.
        </Renglon>
        <Renglon muestra={<Icono nombre="sin-datos" tamano={20} />}>
          {nutricion ? (
            <>
              <strong>Los días sin registros</strong> también están, sin casilla: no hay nada que marcar, y no son un cero.
            </>
          ) : (
            <>
              <strong>Van los días con sesiones.</strong> Debajo se dice cuántos días del período no tienen registro: de esos días no hay dato.
            </>
          )}
        </Renglon>
        <Renglon muestra={<Icono nombre="texto" tamano={20} />}>
          <strong>Lo que observaste</strong> describe lo observado. No es un diagnóstico.
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="objetivo" tamano={20} />}>
          <strong>Lo que decidís:</strong> BE no sugiere un resultado. El elegido dice qué pasa al aplicarlo; «Qué hace cada resultado» los muestra todos.
          {nutricion ? null : ` ${COPY_ENTRENAMIENTO.progresionComoAjuste}`}
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="aplicar" tamano={20} />}>
          <strong>Registrar no cambia el plan.</strong> La barra de abajo queda a la vista mientras escribís. Aplicar es otro paso, desde la lista: la revisión queda registrada aunque todavía no se aplique.
        </Renglon>
      </ul>
    </AyudaDeVista>
  );
}
