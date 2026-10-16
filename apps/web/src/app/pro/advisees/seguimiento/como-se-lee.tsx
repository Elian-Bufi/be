'use client';

/**
 * «Cómo se lee esta vista» (WP-ESCRITORIO-AMABLE, C-04): una sola ayuda por vista, que se abre desde el marco de la
 * ficha. Junta lo que antes había que deducir o encontrar repartido: qué es cada marca, qué se dibuja y qué no, y qué
 * no dice la pantalla. No reemplaza lo que depende de los datos que se están mirando («Cómo se calcula», la cobertura,
 * los límites de cada pregunta): eso sigue en su lugar.
 *
 * Es un diálogo: se abre a pedido, toma el foco, Escape lo cierra y el foco vuelve al botón. Cada vista suma la suya
 * con su parte del paquete; la que todavía no la tiene no muestra el botón. El botón y el diálogo son una pieza común
 * (`components/ayuda-de-vista.tsx`), que también usan las pestañas de área: acá va lo que dice cada vista de la ficha.
 */
import { FUENTE_DE_LA_REGLA, VISTAS_DE_LA_LINEA, type ReglaDelResumen } from '@be/domain';
import type { ReactNode } from 'react';
import { AyudaDeVista, RenglonDeAyuda as Renglon } from '../../../../components/ayuda-de-vista';
import { Icono } from '../../../../components/icono';
import type { VistaDelSeguimiento } from './estado';
import { Marca } from './marca';

function DeAnalizar() {
  return (
    <>
      <p className="nota">Hasta tres métricas en el mismo tiempo, para ver qué pasó y cuándo. Que dos cosas coincidan en el tiempo no indica que una cause la otra.</p>
      <ul className="como-se-lee__lista">
        <Renglon muestra={<Icono nombre="pregunta" tamano={20} />}>
          <strong>Dos formas de entrar.</strong> Una pregunta ya trae sus gráficos armados; o elegís vos las métricas, de cualquier área. Si cambiás una métrica a mano, la pregunta se deja.
        </Renglon>
        <Renglon muestra={<Marca indice={0} />}>
          <strong>Un punto es un registro:</strong> un día, una sesión o una toma (lo dice el encabezado de cada gráfico). La línea une solo puntos que se pueden comparar: se corta donde no hubo registros y donde cambió el
          protocolo, el método o la unidad.
        </Renglon>
        <Renglon muestra={<Marca indice={0} hueco />}>
          <strong>Hueco:</strong> un subtotal (falta algún dato), o un día o una semana sin completar. El día en curso va suelto, para que la mañana no se lea como una caída.
        </Renglon>
        <Renglon muestra={<Marca indice={0} clase="REPORTED" />}>
          <strong>Contorno cortado:</strong> lo informó la persona, no se midió.
        </Renglon>
        <Renglon muestra={<Marca indice={0} clase="DERIVED" />}>
          <strong>Con un punto adentro:</strong> lo calculó un método. La lectura dice si es un índice, una suma o una estimación.
        </Renglon>
        <Renglon muestra={<Marca indice={0} plan />}>
          <strong>Línea discontinua:</strong> lo planificado en la misma unidad; hoy, el objetivo de calorías. Va junto a lo registrado para ubicarlo: no se resta ni se califica.
        </Renglon>
        <Renglon muestra={<span className="muestra-de-hueco" />}>
          <strong>Gris:</strong> días sin registros. No son ceros.
        </Renglon>
        <Renglon muestra={<Icono nombre="etapa" tamano={20} />}>
          <strong>Las franjas</strong> son las etapas del plan: desde que se activó una versión hasta que se activó la siguiente.
        </Renglon>
        <Renglon muestra={<Icono nombre="calendario" tamano={20} />}>
          <strong>La fecha elegida:</strong> tocá un punto, usá «Fecha anterior» y «Fecha siguiente», o las flechas del teclado con un gráfico enfocado. Sus valores están en «Lectura», con el origen de cada uno. Arrastrar
          sobre un gráfico acerca ese intervalo.
        </Renglon>
        <Renglon muestra={<Icono nombre="juntas" tamano={20} />}>
          <strong>«Juntas»</strong> pone las métricas en un solo gráfico y pide que tengan la misma unidad. <strong>«Cambio relativo»</strong> muestra cuánto cambió cada una frente a una referencia que se elige y queda a
          la vista.
        </Renglon>
        <Renglon muestra={<Icono nombre="menu" tamano={20} />}>
          <strong>Lo demás está a un clic:</strong> en «Más acciones», las vistas guardadas, la descarga, las capas y la comparación de dos períodos; al pie de los gráficos, la tabla de datos, el resumen en texto, los hitos de
          planificación (activaciones, objetivos y revisiones: las tomas no, porque en un gráfico ya son puntos) y cómo se calcula cada métrica.
        </Renglon>
      </ul>
    </>
  );
}

/** Cada hecho de una tarjeta del Resumen, nombrado en pocas palabras: al lado va de dónde sale (lo dice el dominio). */
const HECHO_DE_LA_REGLA: Readonly<Record<ReglaDelResumen, string>> = {
  REVISION_SIN_APLICAR: 'Una revisión registrada, sin aplicar',
  PROXIMA_REVISION: 'La próxima revisión acordada',
  BORRADOR_SIN_ACTIVAR: 'Un plan en borrador',
  PLAN_ACTIVADO_DESPUES_DEL_CORTE: 'Un plan activado después de la revisión',
  OBJETIVO_NUEVO_DESPUES_DEL_CORTE: 'Un objetivo nuevo después de la revisión',
  CAMBIO_DE_COMPARABILIDAD: 'Un cambio de protocolo, método o unidad',
  NOVEDADES_DESDE_EL_CORTE: 'Lo nuevo desde la revisión',
  ULTIMA_TOMA: 'Las tomas',
  COBERTURA_NUTRICIONAL: 'La cobertura de Nutrición',
  COBERTURA_DE_ENTRENAMIENTO: 'La cobertura de Entrenamiento',
  PARTE_NO_DISPONIBLE: '«No pudimos completar esta parte»',
};

function DeResumen() {
  return (
    <>
      <p className="nota">Lo pendiente con esta persona, por área, y hasta cuatro indicadores del período. Describe lo registrado: no califica ni dice si alcanza.</p>
      <ul className="como-se-lee__lista">
        <Renglon muestra={<Icono nombre="resumen" tamano={20} />}>
          <strong>Una tarjeta por área,</strong> de arriba abajo: con qué se trabaja (el objetivo y el plan vigente, o las tomas), lo pendiente, lo nuevo desde su última revisión y la acción. Un área sin acceso no tiene
          tarjeta.
        </Renglon>
        <Renglon muestra={<Icono nombre="calorias" tamano={20} />}>
          <strong>El objetivo de Nutrición:</strong> las calorías son el requerimiento energético estimado del objetivo vigente; los carbohidratos, las grasas y las proteínas, los que declaraste en ese objetivo. Es lo
          indicado por día: no se compara con lo registrado.
        </Renglon>
        <Renglon muestra={<Icono nombre="reloj" tamano={20} />}>
          <strong>Lo pendiente va primero,</strong> con su ícono y en negrita: una revisión sin aplicar, la próxima revisión acordada cuando falta una semana o menos (o ya pasó) y un borrador sin activar. Después, los
          cambios de planificación o de comparabilidad, lo nuevo y, al final, la cobertura. Son reglas fijas, sin inteligencia artificial y sin calificar.
        </Renglon>
        <Renglon muestra={<Icono nombre="borrador" tamano={20} />}>
          <strong>Registrar no es aplicar.</strong> Una revisión registrada todavía no cambia nada: el plan o el objetivo que resulten de ella rigen cuando la aplicás. Un plan en borrador tampoco rige hasta que lo
          actives.
        </Renglon>
        <Renglon muestra={<Icono nombre="cargado-otro-dia" tamano={20} />}>
          <strong>«Desde la revisión»</strong> separa lo que ocurrió después, lo que se cargó después sobre días anteriores y lo que se corrigió después, con los instantes de registro de cada dato. Cada área tiene su
          propia revisión; sin revisiones, lo nuevo se mira en el período elegido. Abrir la ficha no registra una revisión ni una nota.
        </Renglon>
        <Renglon muestra={<Icono nombre="derecha" tamano={20} />}>
          <strong>Cada renglón abre su evidencia:</strong> las revisiones, la planificación, la línea de tiempo con solo lo nuevo, o la información disponible para revisar.
        </Renglon>
        <Renglon muestra={<Icono nombre="lista" tamano={20} />}>
          <strong>La cobertura</strong> es del registro: qué hay y qué falta, sin calificar. Con una revisión registrada queda plegada en la tarjeta, porque cada indicador ya dice la suya.
        </Renglon>
        <Renglon muestra={<Icono nombre="revision" tamano={20} />}>
          <strong>«Preparar la revisión»</strong> abre el formulario con el período desde la última revisión. No registra nada hasta que lo confirmes. El botón va lleno en una sola tarjeta: la del área con la próxima
          revisión acordada más cercana. Esa fecha la fijaste vos: BE no decide qué es urgente.
        </Renglon>
        <Renglon muestra={<Icono nombre="analizar" tamano={20} />}>
          <strong>Un indicador</strong> es un número del período con su regla: la media de los días con valor, la mediana de las sesiones o la última toma del tramo comparable. Debajo, cuántos días, sesiones o tomas lo
          sostienen y lo que cambia cómo se lee: cuántos de esos días son subtotales (falta algún dato) y que hoy, en curso, no entra en la media. La cobertura entera de cada uno está en «Analizar». No hay verde ni rojo,
          ni distancia a un objetivo.
        </Renglon>
        <Renglon muestra={<Marca indice={0} />}>
          <strong>El gráfico chico</strong> tiene un punto por día, sesión o toma. La línea se corta donde no hubo registros y donde cambió el protocolo, el método o la unidad. El nombre del indicador abre el gráfico
          grande en «Analizar», con cada valor.
        </Renglon>
        <Renglon muestra={<Marca indice={0} hueco />}>
          <strong>Hueco:</strong> un subtotal (falta algún dato) o el día en curso, que va suelto y no entra en la media.
        </Renglon>
        <Renglon muestra={<span className="muestra-de-hueco" />}>
          <strong>Gris:</strong> días sin registros. No son ceros.
        </Renglon>
        <Renglon muestra={<span className="muestra-de-inicio" />}>
          <strong>Línea punteada:</strong> desde cuándo rige el primer plan del período. Antes de ese día no había un plan de este seguimiento en el que registrar.
        </Renglon>
        <Renglon muestra={<Icono nombre="calendario" tamano={20} />}>
          <strong>Las fechas sin año</strong> son de este año; el período, con su año, está arriba. «Elegir indicadores» cambia los cuatro: se guardan en tu cuenta y valen para todos tus asesorados.
        </Renglon>
      </ul>
      {/* Antes iba en cada renglón de la lista («Sale de…»): ahora se dice una vez por regla, y se abre si hace falta. */}
      <details className="como-se-lee__fuentes">
        <summary>De dónde sale cada hecho ({Object.keys(HECHO_DE_LA_REGLA).length})</summary>
        <dl>
          {(Object.keys(HECHO_DE_LA_REGLA) as ReglaDelResumen[]).map((regla) => (
            <div key={regla} data-regla={regla}>
              <dt>{HECHO_DE_LA_REGLA[regla]}</dt>
              <dd>Sale de {FUENTE_DE_LA_REGLA[regla]}.</dd>
            </div>
          ))}
        </dl>
      </details>
    </>
  );
}

function DeLinea() {
  return (
    <>
      <p className="nota">Qué pasó y cuándo: cada hecho una vez, en el día en que ocurrió. Describe lo registrado: no califica ni dice si alcanza.</p>
      <ul className="como-se-lee__lista">
        <Renglon muestra={<Icono nombre="calendario" tamano={20} />}>
          <strong>El día es la unidad.</strong> Los días van del más nuevo al más viejo. Dentro de cada día, primero los hitos, después las sesiones y al final las comidas; cada clase, en el orden en que ocurrió.
        </Renglon>
        <Renglon muestra={<Icono nombre="hito" tamano={20} />}>
          <strong>Un hito</strong> lleva una barra a la izquierda, de todo el alto de su renglón: un plan activado, un objetivo, una revisión, una toma antropométrica o un seguimiento que se abre o se cierra. Es todo lo
          que no se registra todos los días.
        </Renglon>
        <Renglon muestra={<Icono nombre="nutricion" tamano={20} />}>
          <strong>«Comidas»</strong> junta las comidas del día en un renglón, que dice cuántas son y cuántas tienen algo distinto de lo de siempre. Se abre en el lugar, del desayuno a la cena. Una sola comida va en su propio
          renglón.
        </Renglon>
        <Renglon muestra={<Icono nombre="sin-confirmar" tamano={20} />}>
          <strong>Las etiquetas</strong> dicen cómo se registró un hecho o qué le pasó después: sin confirmar, distinta de lo indicado, comida diferente, sesión con cambios, no realizada o resumida, rectificado, corregido,
          anulado y cargado otro día. Son datos, no calificaciones. «Falta algún nutriente» depende del alimento: se ve en el detalle y se filtra en «Más filtros».
        </Renglon>
        <Renglon muestra={<Icono nombre="cargado-otro-dia" tamano={20} />}>
          <strong>Cargado otro día:</strong> el hecho está en el día en que ocurrió, no en el que se cargó. Una corrección no es un registro nuevo y no lo mueve; un registro anulado sigue en la historia, con su etiqueta.
        </Renglon>
        <Renglon muestra={<Icono nombre="lista" tamano={20} />}>
          <strong>Cada día va en su tarjeta.</strong> Llena, si tiene una sesión, un hito o alguna etiqueta; <strong>sin fondo,</strong> si tiene solo sus comidas, sin nada distinto de lo de siempre. Es para ubicar qué
          mirar: no dice nada más del día.
        </Renglon>
        <Renglon muestra={<span className="muestra-de-hueco" />}>
          <strong>Gris:</strong> días sin hechos registrados entre dos días de la lista. No son ceros: BE no tiene hechos de esos días en las áreas que podés ver. Se dicen solo cuando mirás «Todo».
        </Renglon>
        <Renglon muestra={<Icono nombre="ver" tamano={20} />}>
          <strong>Las vistas</strong> son filtros con nombre. El número es la cantidad de hechos del período que trae cada una. Elegir una reemplaza lo que estaba elegido; volver a tocarla deja «Todo».
        </Renglon>
        <Renglon muestra={<Icono nombre="buscar" tamano={20} />}>
          <strong>Buscar</strong> recorre todo el período, no solo los días a la vista: el nombre de cada hecho y sus datos, sin distinguir mayúsculas ni acentos (por ejemplo, «cena» o «sentadilla»). Si un hecho coincide
          en un dato que su renglón no muestra, el renglón lo dice debajo. Lo que escribís no queda en la dirección de la página.
        </Renglon>
        <Renglon muestra={<Icono nombre="filtros" tamano={20} />}>
          <strong>«Más filtros»</strong> combina área, tipo de hecho, ejercicio, estado, calidad del dato y lo cargado otro día. Con un filtro que recorta dentro del día (una calidad, un estado, la búsqueda, lo nuevo
          desde una revisión), cada hecho va en su renglón, sin agrupar.
        </Renglon>
        <Renglon muestra={<Icono nombre="derecha" tamano={20} />}>
          <strong>Cada renglón abre su detalle:</strong> cuándo ocurrió, cuándo se cargó y quién, qué le pasó después y el registro completo, con el camino a su pestaña. En una ventana ancha se abre al costado y acompaña
          mientras recorrés la lista; en una angosta, encima. Escape lo cierra.
        </Renglon>
        <Renglon muestra={<Icono nombre="abajo" tamano={20} />}>
          <strong>«Ver días anteriores»</strong> trae más días. Se muestran días enteros: un día aparece cuando están todos sus hechos.
        </Renglon>
      </ul>
      <details className="como-se-lee__fuentes">
        <summary>Qué trae cada vista ({VISTAS_DE_LA_LINEA.length + 1})</summary>
        <dl>
          {VISTAS_DE_LA_LINEA.map((v) => (
            <div key={v.clave} data-vista={v.clave}>
              <dt>{v.nombre}</dt>
              <dd>{v.queTrae}</dd>
            </div>
          ))}
          <div data-vista="LO_NUEVO">
            <dt>Lo nuevo desde la revisión</dt>
            <dd>
              Desde la última revisión registrada de un área: lo que ocurrió después, lo que se cargó después sobre días anteriores y lo que se corrigió después. Mira hasta un año hacia atrás, como la cuenta del Resumen.
              Sin una revisión registrada, no está.
            </dd>
          </div>
        </dl>
      </details>
    </>
  );
}

/** El título y el contenido de la ayuda de cada vista. Sin entrada, la vista todavía no tiene la suya. */
const AYUDA: Readonly<Partial<Record<VistaDelSeguimiento, { readonly titulo: string; readonly contenido: () => ReactNode }>>> = {
  resumen: { titulo: 'Cómo se lee el Resumen', contenido: DeResumen },
  linea: { titulo: 'Cómo se lee la Línea de tiempo', contenido: DeLinea },
  analizar: { titulo: 'Cómo se lee Analizar', contenido: DeAnalizar },
};

export function ComoSeLeeEstaVista({ vista }: { vista: VistaDelSeguimiento }) {
  const ayuda = AYUDA[vista];
  if (!ayuda) return null;
  const Contenido = ayuda.contenido;
  return (
    <AyudaDeVista titulo={ayuda.titulo} deQue={vista}>
      <Contenido />
    </AyudaDeVista>
  );
}
