'use client';

/**
 * «Cómo se lee esta vista», para Información · Solicitudes (WP-ESCRITORIO-AREAS, parte 4; F-14): qué dice cada renglón,
 * qué quiere decir cada estado y qué no hace la pantalla. Los textos que el dominio ya fija con una prueba se usan como
 * están. El botón y el diálogo son los de la ficha (`AyudaDeVista`); va en el marco del área.
 */
import { COPY_FORMULARIOS as F, COPY_SOLICITUDES as C } from '@be/domain';
import { AyudaDeVista, RenglonDeAyuda as Renglon } from '../../../../components/ayuda-de-vista';
import { Icono } from '../../../../components/icono';

export function AyudaDeSolicitudes() {
  return (
    <AyudaDeVista titulo="Cómo se leen las Solicitudes" deQue="informacion-solicitudes">
      <p className="nota">{C.bajada} Ubica cada dato: no califica ninguna respuesta.</p>
      <ul className="como-se-lee__lista">
        <Renglon muestra={<Icono nombre="lista" tamano={20} />}>
          <strong>Las solicitudes van de la más nueva a la más vieja.</strong> Cada una dice cuándo la pediste, en qué área, cuántas preguntas tiene y para qué. Tocá una para ver su detalle.
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="reloj" tamano={20} />}>
          <strong>{F.pendiente}.</strong> La persona todavía no respondió, y puede no hacerlo: no responder también es una opción. No se cuentan días ni se marca como una falta.
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="reportado" tamano={20} />}>
          <strong>{F.declaradoPorLaPersona}.</strong> {F.noEsMedicion} Se dice una vez, para todas las respuestas de la solicitud.
        </Renglon>
        <Renglon muestra={<Icono nombre="tilde" tamano={20} />}>
          <strong>{C.requerida}.</strong> {C.siRespondeLasRequeridas} La solicitud entera sí puede quedar sin responder.
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="corregido" tamano={20} />}>
          <strong>{C.respuestaQueRige}.</strong> Si la persona corrigió su respuesta, rige la corrección: la fila dice «{C.corregida}» y qué había antes. La respuesta original se conserva, en la historia, con el motivo que escribió.
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="texto" tamano={20} />}>
          <strong>{C.sinResponder}, en una pregunta.</strong> La persona respondió la solicitud y dejó esa pregunta sin contestar. Es un hueco: no se muestra vacío ni con un cero.
        </Renglon>
        <Renglon muestra={<Icono nombre="solicitar" tamano={20} />}>
          <strong>{F.pedirInformacion}.</strong> {F.solicitarNoEsAcceder} Una solicitud no se cancela ni se edita: se puede pedir otra.
        </Renglon>
        <Renglon muestra={<Icono nombre="informacion" tamano={20} />}>
          <strong>Qué solicitudes ves.</strong> Las de las áreas a las que tenés acceso hoy. Si el acceso a un área cambia, sus solicitudes dejan de listarse.
        </Renglon>
      </ul>
    </AyudaDeVista>
  );
}
