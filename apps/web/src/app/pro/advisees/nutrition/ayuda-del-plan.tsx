'use client';

/**
 * «Cómo se lee esta vista», para Nutrición · Plan (WP-ESCRITORIO-AREAS, parte 5): qué es la versión activa, cómo se lee
 * un día tipo y qué quiere decir cada cosa que la pantalla escribe. El botón y el diálogo son los de la ficha
 * (`AyudaDeVista`); va en el marco del área.
 */
import { COPY_DEL_PLAN } from '@be/domain';
import { AyudaDeVista, RenglonDeAyuda as Renglon } from '../../../../components/ayuda-de-vista';
import { Icono } from '../../../../components/icono';

export function AyudaDelPlan() {
  return (
    <AyudaDeVista titulo="Cómo se lee el Plan" deQue="nutricion-plan">
      <p className="nota">La planificación de comidas, tal como la ve el asesorado. Dice lo indicado: no lo que comió, ni si alcanza.</p>
      <ul className="como-se-lee__lista">
        <Renglon esencial muestra={<Icono nombre="candado" tamano={20} />}>
          <strong>El plan activo es de solo lectura.</strong> Se muestra desde su instantánea: lo que se guardó al activarlo, que es lo que ve el asesorado. No se edita: para cambiarlo se crea una versión nueva, y la activa
          sigue igual hasta que actives la otra.
        </Renglon>
        <Renglon muestra={<Icono nombre="plan" tamano={20} />}>
          <strong>El número de una versión es su orden de activación:</strong> la primera que se activó es la 1. Una versión en preparación todavía no tiene número.
        </Renglon>
        <Renglon muestra={<Icono nombre="calendario" tamano={20} />}>
          <strong>Se lee de a un día tipo.</strong> Si el plan tiene más de uno, se elige cuál mirar; si tiene uno solo, la pantalla dice su nombre.
        </Renglon>
        <Renglon muestra={<Icono nombre="comida" tamano={20} />}>
          <strong>Cada comida es un renglón que se abre en el lugar.</strong> Plegada dice cuántas opciones tiene y cómo se llaman; «{COPY_DEL_PLAN.abrirTodas}» muestra el día entero.
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="opciones" tamano={20} />}>
          <strong>De las opciones de una comida se elige una.</strong> Van lado a lado y en el orden del plan. No son equivalencias nutricionales: cada una es una comida distinta, y ninguna es la principal.
        </Renglon>
        <Renglon muestra={<Icono nombre="alimento" tamano={20} />}>
          <strong>Cada ítem dice lo indicado:</strong> la cantidad, la unidad y el estado de preparación («120 g · cocido»). «{COPY_DEL_PLAN.sinCantidad}» es eso: el plan no la dice. No es un cero.
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="receta" tamano={20} />}>
          <strong>Una opción que nació de una receta</strong> dice de cuál y de qué versión. Lleva los ingredientes de una porción, congelados al activar: si después cambiás la receta, esta versión del plan no cambia.
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="objetivo" tamano={20} />}>
          <strong>El objetivo del día</strong> son las calorías y los macros del objetivo con el que se armó esta versión. Es lo indicado para el día, no una suma de las comidas ni lo consumido. Si hoy rige un objetivo más
          nuevo, la pantalla lo dice.
        </Renglon>
        <Renglon muestra={<Icono nombre="reloj" tamano={20} />}>
          <strong>El historial</strong> lista las versiones que se activaron, de la más nueva a la más vieja. Las anteriores se conservan: no se borran ni se pisan. La huella identifica la instantánea que estás leyendo: si
          en dos lecturas es la misma, el contenido es exactamente el mismo.
        </Renglon>
        <Renglon muestra={<Icono nombre="borrador" tamano={20} />}>
          <strong>Con una versión en preparación,</strong> arriba se elige cuál mirar. El asesorado no ve la que está en preparación, y guardar no la activa. Pasar a la activa no pierde lo que escribiste sin guardar.
        </Renglon>
        <Renglon muestra={<Icono nombre="actualizar" tamano={20} />}>
          <strong>Lo que elegís queda en la dirección de la página</strong> (la versión, el día tipo y las comidas abiertas): «Actualizar» y volver atrás lo conservan.
        </Renglon>
      </ul>
    </AyudaDeVista>
  );
}
