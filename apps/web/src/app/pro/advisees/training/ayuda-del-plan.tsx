'use client';

/**
 * «Cómo se lee esta vista», para Entrenamiento · Plan (WP-ESCRITORIO-AREAS, parte 6): qué es la versión activa, cómo se
 * elige lo que se mira y qué quiere decir cada cosa que la pantalla escribe. El botón y el diálogo son los de la ficha
 * (`AyudaDeVista`); va en el marco del área.
 */
import { COPY_DEL_PLAN_DE_ENTRENAMIENTO as C, COPY_ENTRENAMIENTO_POR_SERIE } from '@be/domain';
import { AyudaDeVista, RenglonDeAyuda as Renglon } from '../../../../components/ayuda-de-vista';
import { EnPartes } from '../../../../components/en-partes';
import { Icono } from '../../../../components/icono';

export function AyudaDelPlanDeEntrenamiento() {
  return (
    <AyudaDeVista titulo="Cómo se lee el Plan" deQue="entrenamiento-plan">
      <p className="nota">La planificación de entrenamiento, tal como la recibe el asesorado. Dice lo indicado: no lo que hizo, ni cómo le fue.</p>
      <ul className="como-se-lee__lista">
        <Renglon muestra={<Icono nombre="candado" tamano={20} />}>
          <strong>El plan activo es de solo lectura.</strong> Se muestra desde su instantánea: lo que se guardó al activarlo, que es lo que ve el asesorado. No se edita: para cambiarlo se crea una versión nueva, y la activa
          sigue igual hasta que actives la otra.
        </Renglon>
        <Renglon muestra={<Icono nombre="plan" tamano={20} />}>
          <strong>El número de una versión es su orden de activación:</strong> la primera que se activó es la 1. Una versión en preparación todavía no tiene número.
        </Renglon>
        <Renglon muestra={<Icono nombre="calendario" tamano={20} />}>
          <strong>Se mira una sesión por vez.</strong> Se eligen el bloque, el microciclo —si el bloque los usa— y la sesión. Con una sola cosa para elegir, la pantalla dice su nombre; con muchas, las ofrece en una lista.
        </Renglon>
        <Renglon muestra={<Icono nombre="reloj" tamano={20} />}>
          <strong>«{C.sinDiaAsignado}»</strong> El plan no fija qué día va cada sesión: el teléfono las muestra todas y la persona elige cuál hace.
        </Renglon>
        <Renglon muestra={<Icono nombre="entrenamiento" tamano={20} />}>
          <strong>Cada ejercicio es un renglón que se abre en el lugar.</strong> Plegado dice lo que piden sus series («<EnPartes texto="4 × 8–10 rep. · 47,5 kg · RIR 2 · descanso 02:00" />»). Si algo cambia de una serie a otra, no lo resume: dice
          «carga y RIR por serie», y el detalle está al abrirlo.
        </Renglon>
        <Renglon muestra={<Icono nombre="series" tamano={20} />}>
          <strong>«{C.loQueRecibe}»</strong> es el objetivo de cada serie como lo resolvió BE: el propio de la serie o, si no tiene, el general del ejercicio. Es lo que la persona ve en el teléfono al registrar.
          «{COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo}» es eso: esa serie no tiene ese objetivo. No es un cero.
        </Renglon>
        <Renglon muestra={<Icono nombre="carga" tamano={20} />}>
          <strong>La carga sugerida no es el criterio de intensidad.</strong> Es una referencia que acompaña al criterio (RIR o % RM). Un ejercicio sin criterio de intensidad es válido, y la pantalla lo dice.
        </Renglon>
        <Renglon muestra={<Icono nombre="descanso" tamano={20} />}>
          <strong>El descanso recomendado</strong> es lo que le sugerís descansar después de esa serie. La nota de una serie se lee en su fila.
        </Renglon>
        <Renglon muestra={<Icono nombre="info" tamano={20} />}>
          <strong>«{C.loGeneral}»</strong> es lo que vale para todas sus series: la intensidad con su criterio, cómo se cuenta la carga y qué cuentan las repeticiones —si lo declaraste—, tus parámetros y tus notas.
        </Renglon>
        <Renglon muestra={<Icono nombre="revision" tamano={20} />}>
          <strong>El historial</strong> lista las versiones que se activaron, de la más nueva a la más vieja. Las anteriores se conservan: no se borran ni se pisan. La huella identifica la instantánea que estás leyendo: si
          en dos lecturas es la misma, el contenido es exactamente el mismo.
        </Renglon>
        <Renglon muestra={<Icono nombre="borrador" tamano={20} />}>
          <strong>Con una versión en preparación,</strong> arriba se elige cuál mirar. El asesorado no ve la que está en preparación, y guardar no la activa. Pasar a la activa no pierde lo que escribiste sin guardar.
        </Renglon>
        <Renglon muestra={<Icono nombre="actualizar" tamano={20} />}>
          <strong>Lo que elegís queda en la dirección de la página</strong> (la versión, el bloque, la sesión y los ejercicios abiertos): «Actualizar» y volver atrás lo conservan.
        </Renglon>
      </ul>
    </AyudaDeVista>
  );
}
