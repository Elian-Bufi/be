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

/** El título y el contenido de la ayuda de cada vista. Sin entrada, la vista todavía no tiene la suya. */
const AYUDA: Readonly<Partial<Record<VistaDelSeguimiento, { readonly titulo: string; readonly contenido: () => ReactNode }>>> = {
  analizar: { titulo: 'Cómo se lee Analizar', contenido: DeAnalizar },
};

export function ComoSeLeeEstaVista({ vista }: { vista: VistaDelSeguimiento }) {
  const id = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const ayuda = AYUDA[vista];
  // La ayuda es de la vista que se mira: si la vista cambia con el diálogo abierto (Atrás del navegador), se cierra.
  useEffect(() => {
    if (dialogo.current?.open) dialogo.current.close();
  }, [vista]);
  if (!ayuda) return null;
  const Contenido = ayuda.contenido;
  return (
    <>
      <button type="button" className="boton boton--enlace como-se-lee__boton" aria-haspopup="dialog" onClick={() => dialogo.current?.showModal()}>
        <Icono nombre="ayuda" tamano={18} />
        <span className="como-se-lee__palabras">Cómo se lee esta vista</span>
      </button>
      <dialog ref={dialogo} className="dialogo como-se-lee" aria-labelledby={`${id}-titulo`}>
        <h2 id={`${id}-titulo`}>{ayuda.titulo}</h2>
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
