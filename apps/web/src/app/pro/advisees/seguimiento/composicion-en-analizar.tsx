'use client';

/**
 * «¿De qué está hecho el cambio de peso?», la pregunta de la composición en «Analizar» (WP-TABLERO-ALTA-GAMA TB-24;
 * DL-163 D-11). Responde con la pieza de la composición corporal, la misma de la pestaña Antropometría, en el período de
 * la ficha (hasta un año), y ofrece abrir el peso y las dos masas «Juntas», con el resto de «Analizar».
 *
 * TA-25: la pregunta vive en el website y no se guarda como vista. Su identificador no entra en `ID_DE_PREGUNTAS`, que
 * valida la API al guardar una vista (API-VAN): sumarlo cambiaría lo que la API acepta, y esta parte no toca la API.
 * No tiene nada que elegir (ni área, ni versión, ni ejercicio): el período es el de la ficha y el método se elige en la
 * pieza.
 */
import { useSeguimiento } from './contexto';
import { DOS_COMPARTIMENTOS } from './composicion';
import { LecturaDeLaPieza, useLecturaDeLaComposicion } from './composicion-en-pantalla';
import { codificarReferencia, hoyEn, parametrosDePregunta } from './estado';
import { Icono } from '../../../../components/icono';

/** El identificador de la pregunta en la dirección (`pregunta=`). No es uno de `ID_DE_PREGUNTAS` (TA-25). */
export const PREGUNTA_DE_LA_COMPOSICION = 'composicion-del-peso';

export const LA_PREGUNTA_DE_LA_COMPOSICION = {
  pregunta: '¿De qué está hecho el cambio de peso?',
  muestra: 'El peso de cada toma, partido en masa libre de grasa y masa grasa cuando el método lo parte, y cuánto cambió cada parte.',
  limite: 'El peso no distingue grasa de músculo, y las masas son una estimación de su método: un cambio de método corta la comparación.',
} as const;

/** Las tres métricas para verlas «Juntas» en «Analizar»: el peso y las dos masas del método de dos compartimentos. */
const juntas = (familia: keyof typeof DOS_COMPARTIMENTOS): string =>
  ['peso', DOS_COMPARTIMENTOS[familia].libre, DOS_COMPARTIMENTOS[familia].grasa].map((c) => codificarReferencia({ metricId: `antropometria.${c}`, exerciseKey: null, setIndex: null, unit: null })).join(',');

export function ComposicionEnAnalizar({ tituloId }: { tituloId: string }) {
  const { token, asesoradoId, periodo, sesionPerdida, ir } = useSeguimiento();
  const hoy = hoyEn();
  const { lectura, recargar } = useLecturaDeLaComposicion(token, asesoradoId, periodo.desde, periodo.hasta, sesionPerdida);
  const familias = lectura.tipo === 'lista' ? (['DURNIN_WOMERSLEY', 'FAULKNER'] as const).filter((f) => lectura.tomas.some((t) => t.datos.has(DOS_COMPARTIMENTOS[f].grasa))) : [];
  return (
    <section className="seccion analizar" aria-labelledby={tituloId}>
      <div className="pregunta-en-curso pregunta-activa">
        <h2 id={tituloId}>{LA_PREGUNTA_DE_LA_COMPOSICION.pregunta}</h2>
        <p className="pregunta-en-curso__detalle">{LA_PREGUNTA_DE_LA_COMPOSICION.muestra}</p>
        <div className="pregunta-en-curso__acciones">
          <button type="button" className="boton boton--secundario boton--compacto" onClick={() => ir({ ...parametrosDePregunta(null), m: null, f: null }, { agregarAlHistorial: true })}>
            <Icono nombre="pregunta" tamano={18} />
            Cambiar la pregunta
          </button>
          {familias[0] ? (
            <button type="button" className="boton boton--quieto boton--compacto" onClick={() => ir({ ...parametrosDePregunta(null), m: juntas(familias[0] as keyof typeof DOS_COMPARTIMENTOS), modo: 'S', f: null }, { agregarAlHistorial: true })}>
              <Icono nombre="juntas" tamano={18} />
              Ver peso y masas «Juntas»
            </button>
          ) : null}
        </div>
      </div>
      <LecturaDeLaPieza lectura={lectura} recargar={recargar} desde={periodo.desde} hasta={periodo.hasta} hoy={hoy} />
      <p className="nota pregunta-en-curso__limite">{LA_PREGUNTA_DE_LA_COMPOSICION.limite}</p>
    </section>
  );
}
