/**
 * DL-197 (F19, ET1-08) · los «?» del editor de Entrenamiento: cada uno con una **definición** y un **ejemplo resuelto**, y
 * los de los cuadros, paso a paso. Solo se ven si se tocan (el «?» en la esquina). Describen; no indican qué hacer con la
 * persona ni califican nada.
 */
import type { ReactNode } from 'react';

export interface AyudaConEjemplo {
  readonly nombre: string;
  readonly definicion: string;
  readonly pasos?: readonly string[];
  readonly ejemplo: string;
}

export const AYUDAS_DEL_EDITOR = {
  plan: {
    nombre: 'Cómo se configura el plan',
    definicion: 'El plan tiene un inicio y una duración en semanas: el fin sale de los dos. La intensidad del plan es la forma de indicar el esfuerzo que toma cada ejercicio nuevo.',
    pasos: [
      'Elegí el inicio: con él, cada fase y cada sesión tienen sus fechas.',
      'Escribí la duración en semanas o la fecha de fin: lo otro se calcula.',
      'Elegí la intensidad del plan. Cada ejercicio la hereda; uno puede tener otra, en su «Más opciones».',
      'El objetivo y las anotaciones son tuyos: las anotaciones no las ve la persona.',
    ],
    ejemplo: 'Ejemplo: inicio el lunes 30 de noviembre y 12 semanas: el plan termina el domingo 21 de febrero. Con intensidad RIR, un press de banca nuevo entra con el RIR como criterio y escribís «2» en la fila «Común».',
  },
  fase: {
    nombre: 'Qué es una fase',
    definicion: 'Una fase es un tramo del plan con un mismo objetivo y las mismas sesiones cada semana. Las fases van una detrás de la otra, desde el inicio del plan, y cada una dura las semanas que le pongas.',
    ejemplo: 'Ejemplo: en un plan de 12 semanas, «Base» de 4 semanas (semanas 1 a 4) y «Fuerza» de 8 (semanas 5 a 12). Si las fases sumaran 14, las 2 de más quedan rayadas y el plan no se activa hasta ajustarlo.',
  },
  editarFase: {
    nombre: 'Cómo se edita una fase',
    definicion: 'El nombre y las semanas de la fase. Al cambiar la duración, se ajustan las fechas de las fases siguientes: siguen una detrás de la otra.',
    pasos: ['Cambiá el nombre si querés: es el que ve la persona.', 'Escribí cuántas semanas dura.', 'El objetivo lo ve la persona; las anotaciones, solo vos.', '«Guardar fase» lo aplica al plan.'],
    ejemplo: 'Ejemplo: «Base» pasa de 4 a 6 semanas: «Fuerza», que empezaba en la semana 5, ahora empieza en la 7, y sus fechas se corren dos semanas.',
  },
  semanaTipo: {
    nombre: 'Qué es la semana tipo',
    definicion: 'La semana tipo es qué sesión va cada día. Se repite igual todas las semanas de la fase: cada sesión se hace los días marcados.',
    pasos: ['Cada fila es una sesión, con su letra (A, B, C…) y su nombre, que podés cambiar ahí mismo.', 'Tocá un día para prender o apagar esa sesión ese día: el círculo se prende con su letra.', 'Con el teclado, las flechas se mueven por la tabla y la barra espaciadora prende o apaga.'],
    ejemplo: 'Ejemplo: A «Torso» el lunes y el jueves, B «Piernas» el martes y el viernes: en una fase de 4 semanas, la persona tiene 16 sesiones con fecha, 8 de cada una.',
  },
  intensidad: {
    nombre: 'Qué es la intensidad del plan',
    definicion: 'Cómo se indica qué tan exigente es cada serie. RIR: las repeticiones en reserva. RPE: el esfuerzo percibido, de 6 a 10 (equivale a RIR: RPE 8 = 2 en reserva). % RM: una parte de la carga máxima para una repetición. «Solo carga y repeticiones»: sin criterio de intensidad.',
    ejemplo: 'Ejemplo: 4 × 8 con 60 kg y RIR 2 quiere decir que en cada serie quedan 2 repeticiones más posibles; en RPE se escribe «RPE 8», y es lo mismo. En % RM, con un 1RM de 100 kg, 75 % RM son 75 kg.',
  },
  aproximaciones: {
    nombre: 'Qué son las aproximaciones',
    definicion: 'Las series de aproximación van antes de las efectivas, con menos carga, para llegar a la carga de trabajo. Se registran y no entran en ninguna cuenta ni gráfico. No llevan RIR y tienen su propio descanso, corto.',
    pasos: ['Elegí cuántas: BE propone los porcentajes de la carga de trabajo y las repeticiones, que bajan.', 'El redondeo es de a 1, 2,5, 5 o 10: el de su implemento por omisión, más fino con cargas chicas.', 'Ninguna repite la carga de la anterior ni llega a la de trabajo: si no entran, quedan menos y se dice.'],
    ejemplo: 'Ejemplo: con 30 kg de trabajo y 3 aproximaciones de a 1 kg: 8 × 12, 5 × 18 y 3 × 24 kg (el 40, el 60 y el 80 % de la carga de trabajo).',
  },
  progresion: {
    nombre: 'Qué es una progresión',
    definicion: 'Una regla que cambia la carga, las repeticiones o las series de una semana a la otra dentro de la fase. No crea series nuevas: se lee encima de lo que escribiste.',
    ejemplo: 'Ejemplo: lineal de +2,5 kg por semana desde 60 kg: semana 1, 60; semana 2, 62,5; semana 3, 65; con descarga en la semana 4 al 60 % de la carga de trabajo, esa semana va con 39 kg (redondeado al paso).',
  },
  presets: {
    nombre: 'Qué es un preset',
    definicion:
      'Un preset es algo armado que se reutiliza y se ajusta después. Los de BE son un punto de partida, sin ejercicios ni cargas; los tuyos son los que guardaste. Los de series se leen en la intensidad del plan, o en la del ejercicio si tiene otra.',
    pasos: ['Tocá un preset para ver qué trae, al costado.', '«Usar» lo aplica. Si pisa algo, primero muestra qué cambia; Ctrl+Z lo deshace.'],
    ejemplo:
      'Ejemplo: «Hipertrofia» en un plan en RPE escribe 4 × 8-12 con RPE 8 y 90 s de descanso. En un plan en % RM escribe 70 % RM: con un 1RM de 100 kg y el redondeo de 2,5, la carga queda en 70 kg.',
  },
  cargaParaRepeticiones: {
    nombre: 'Qué es la carga para N repeticiones',
    definicion: 'La carga que corresponde a un número de repeticiones y un RIR, calculada desde el último máximo estimado de la persona (Epley v1). Es orientativa: no reemplaza mirar cómo se mueve.',
    ejemplo: 'Ejemplo: con un máximo estimado de 100 kg, para 8 repeticiones con RIR 2: 100 × 30 ÷ (30 + 8 + 2) = 75 kg, redondeado hacia abajo al paso de la barra.',
  },
} as const satisfies Readonly<Record<string, AyudaConEjemplo>>;

/** El contenido de un «?»: la definición, los pasos (si tiene) y el ejemplo resuelto. */
export function ContenidoDeLaAyuda({ ayuda, extra }: { ayuda: AyudaConEjemplo; extra?: ReactNode }) {
  return (
    <>
      <p>{ayuda.definicion}</p>
      {ayuda.pasos ? (
        <ol className="ayuda-con-ejemplo__pasos">
          {ayuda.pasos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      ) : null}
      {extra}
      <p className="ayuda-con-ejemplo__ejemplo" data-ejemplo-resuelto>
        {ayuda.ejemplo}
      </p>
    </>
  );
}
