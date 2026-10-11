'use client';

/**
 * «Cómo se lee esta vista» (WP-ESCRITORIO-AMABLE, C-04): una sola ayuda por vista, que se abre desde el marco de la
 * ficha. Junta lo que antes había que deducir o encontrar repartido: qué es cada marca, qué se dibuja y qué no, y qué
 * no dice la pantalla. No reemplaza lo que depende de los datos que se están mirando («Cómo se calcula», la cobertura,
 * los límites de cada pregunta): eso sigue en su lugar.
 *
 * Es un diálogo: se abre a pedido, toma el foco, Escape lo cierra y el foco vuelve al botón. Cada vista suma la suya
 * con su parte del paquete; la que todavía no la tiene no muestra el botón.
 */
import { FUENTE_DE_LA_REGLA, type ReglaDelResumen } from '@be/domain';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icono } from '../../../../components/icono';
import type { VistaDelSeguimiento } from './estado';
import { Marca } from './marca';

/** Una explicación con su muestra al costado: lo que se ve en la pantalla, al lado de lo que significa. */
function Renglon({ muestra, children }: { muestra: ReactNode; children: ReactNode }) {
  return (
    <li>
      <span className="como-se-lee__muestra" aria-hidden="true">
        {muestra}
      </span>
      <p>{children}</p>
    </li>
  );
}

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
          <strong>Lo demás está a un clic:</strong> en «Más acciones», las vistas guardadas, la descarga, las capas y la comparación de dos períodos; al pie de los gráficos, la tabla de datos, el resumen en texto, los hitos y
          cómo se calcula cada métrica.
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
        <Renglon muestra={<Icono nombre="cargado-otro-dia" tamano={20} />}>
          <strong>«Desde la revisión»</strong> separa lo que ocurrió después, lo que se cargó después sobre días anteriores y lo que se corrigió después, con los instantes de registro de cada dato. Cada área tiene su
          propia revisión; sin revisiones, lo nuevo se mira en el período elegido. Abrir la ficha no registra una revisión ni una nota.
        </Renglon>
        <Renglon muestra={<Icono nombre="derecha" tamano={20} />}>
          <strong>Cada renglón abre su evidencia:</strong> las revisiones, la planificación, la línea de tiempo con solo lo nuevo, o la información disponible para revisar.
        </Renglon>
        <Renglon muestra={<Icono nombre="lista" tamano={20} />}>
          <strong>La cobertura</strong> es del registro, no adherencia: qué hay y qué falta, sin calificar. Con una revisión registrada queda plegada en la tarjeta, porque cada indicador ya dice la suya.
        </Renglon>
        <Renglon muestra={<Icono nombre="revision" tamano={20} />}>
          <strong>«Preparar la revisión»</strong> abre el formulario con el período desde la última revisión. No registra nada hasta que lo confirmes. El botón va lleno en una sola tarjeta: la del área con la próxima
          revisión acordada más cercana. Esa fecha la fijaste vos: BE no decide qué es urgente.
        </Renglon>
        <Renglon muestra={<Icono nombre="analizar" tamano={20} />}>
          <strong>Un indicador</strong> es un número del período con su regla: la media de los días con valor, la mediana de las sesiones o la última toma del tramo comparable. Debajo, cuántos días, sesiones o tomas lo
          sostienen. No hay verde ni rojo, ni distancia a un objetivo.
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

/** El título y el contenido de la ayuda de cada vista. Sin entrada, la vista todavía no tiene la suya. */
const AYUDA: Readonly<Partial<Record<VistaDelSeguimiento, { readonly titulo: string; readonly contenido: () => ReactNode }>>> = {
  resumen: { titulo: 'Cómo se lee el Resumen', contenido: DeResumen },
  analizar: { titulo: 'Cómo se lee Analizar', contenido: DeAnalizar },
};

export function ComoSeLeeEstaVista({ vista }: { vista: VistaDelSeguimiento }) {
  const id = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const ayuda = AYUDA[vista];
  // Se abre por el principio: el foco va al título. Si fuera al primer control (el botón «Cerrar», al final), una ayuda
  // más alta que la ventana se abriría mostrando su último renglón.
  const abrir = () => {
    dialogo.current?.showModal();
    titulo.current?.focus();
    if (dialogo.current) dialogo.current.scrollTop = 0;
  };
  // La ayuda es de la vista que se mira: si la vista cambia con el diálogo abierto (Atrás del navegador), se cierra.
  useEffect(() => {
    if (dialogo.current?.open) dialogo.current.close();
  }, [vista]);
  if (!ayuda) return null;
  const Contenido = ayuda.contenido;
  return (
    <>
      <button type="button" className="boton boton--enlace como-se-lee__boton" aria-haspopup="dialog" onClick={abrir}>
        <Icono nombre="ayuda" tamano={18} />
        <span className="como-se-lee__palabras">Cómo se lee esta vista</span>
      </button>
      <dialog ref={dialogo} className="dialogo como-se-lee" aria-labelledby={`${id}-titulo`}>
        <h2 id={`${id}-titulo`} ref={titulo} tabIndex={-1}>
          {ayuda.titulo}
        </h2>
        <Contenido />
        <div className="acciones">
          <button type="button" className="boton boton--secundario" onClick={() => dialogo.current?.close()}>
            Cerrar
          </button>
        </div>
      </dialog>
    </>
  );
}
