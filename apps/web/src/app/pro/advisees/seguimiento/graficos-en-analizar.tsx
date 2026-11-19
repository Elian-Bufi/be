'use client';

/**
 * Las preguntas de «Analizar» que responden con gráficos del registro (WP-GRAFICOS fase 2, rama D; GR-VD01 y GR-VD02, a
 * ratificar): GR-12 y GR-13 para «¿Qué registró en Nutrición, por día y por semana?», y SP-01 y SP-02 para «Ver la
 * relación». Las reglas (qué gráfico, cuándo se ofrece, qué ejercicio) están en `graficos/cruces/preguntas-con-graficos.ts`;
 * acá se leen los disponibles de la ficha y se dibuja cada gráfico con su propia pantalla, como lo hará «Patrones».
 *
 * El período es el de la ficha, que la API recorta al inicio del acompañamiento. Cada gráfico pide sus lecturas con el
 * acceso de este momento: si un permiso cambió, el gráfico no se dibuja y no deja rastro.
 */
import { useState } from 'react';
import { BloqueDeEstado, Cargando } from '../../../../components/estados';
import { Icono } from '../../../../components/icono';
import {
  contextoDelRegistro,
  ejercicioDelCruce,
  ejerciciosDeLaListaV1,
  graficosDeLaPregunta,
  porQueNoHayGraficos,
  PREGUNTAS_CON_GRAFICOS,
  type PreguntaConGraficos,
} from '../graficos/cruces/preguntas-con-graficos';
import { textoDeFalla, useSeguimiento } from './contexto';
import { hoyEn, parametrosDePregunta } from './estado';
import { accesoDeLosDisponibles } from './selector';
import { useDisponibles } from './series';

export function GraficosEnAnalizar({ tituloId, pregunta }: { tituloId: string; pregunta: PreguntaConGraficos }) {
  const { token, asesoradoId, periodo, sesionPerdida, ir } = useSeguimiento();
  const disponibles = useDisponibles();
  const [elegido, setElegido] = useState<string | null>(null);
  const P = PREGUNTAS_CON_GRAFICOS[pregunta];
  const acceso = accesoDeLosDisponibles(disponibles);
  const contexto = contextoDelRegistro(acceso, disponibles);
  const graficos = disponibles.cargando ? [] : graficosDeLaPregunta(pregunta, contexto);
  const ejercicio = ejercicioDelCruce(disponibles.ejercicios, elegido);
  const v1 = ejerciciosDeLaListaV1(disponibles.ejercicios);
  const periodoDelGrafico = { desde: periodo.desde, hasta: periodo.hasta, hoy: hoyEn(), desdeElVinculo: null };
  // GR-VD08, ratificado el 19/11: sin ningún gráfico que se ofrezca (un área sin acceso, o nada en el período), la pregunta
  // muestra su título y un estado vacío que dice por qué, en vez de volver a «Analizar» sin decir nada.
  const sinNadaQueOfrecer = !disponibles.cargando && !disponibles.falla && graficos.length === 0;
  if (disponibles.cargando) return <Cargando />;
  const vacio = sinNadaQueOfrecer ? porQueNoHayGraficos(pregunta, contexto) : null;
  return (
    <section className="seccion analizar graficos-en-analizar" aria-labelledby={tituloId}>
      <div className="pregunta-en-curso pregunta-activa">
        <h2 id={tituloId}>{P.pregunta}</h2>
        <p className="pregunta-en-curso__detalle">{P.muestra}</p>
        <div className="pregunta-en-curso__acciones">
          <button type="button" className="boton boton--secundario boton--compacto" onClick={() => ir({ ...parametrosDePregunta(null), m: null, f: null }, { agregarAlHistorial: true })}>
            <Icono nombre="pregunta" tamano={18} />
            Cambiar la pregunta
          </button>
        </div>
      </div>
      {vacio ? (
        <div data-sin-graficos>
          <BloqueDeEstado tipo="vacio" icono="informacion" titulo={vacio.titulo}>
            {vacio.texto}
          </BloqueDeEstado>
        </div>
      ) : graficos.length === 0 && disponibles.falla ? (
        // Una falla no es una ausencia: no se sabe si habría gráficos.
        <BloqueDeEstado tipo="error" icono="aviso" onReintentar={disponibles.recargar} textoDelBoton="Reintentar" rol="alert">
          {textoDeFalla(disponibles.falla, 'qué datos hay en el período')}
        </BloqueDeEstado>
      ) : (
        <div className="graficos-en-analizar__lista">
          {graficos.map((g) => (
            <article key={g.id} className="tarjeta graficos-en-analizar__grafico" data-grafico={g.id} aria-label={g.titulo}>
              {/* SP-01 pide un ejercicio de la lista de la v1: el más registrado, y los otros a elegir. */}
              {g.requiere.listaV1 && v1.length > 1 ? (
                <label className="campo campo--en-linea graficos-en-analizar__ejercicio">
                  <span>Ejercicio</span>
                  <select value={ejercicio?.exerciseKey ?? ''} onChange={(e) => setElegido(e.target.value)}>
                    {v1.map((x) => (
                      <option key={x.exerciseKey} value={x.exerciseKey}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <g.Grafico lectura={{ token, asesoradoId, sesionPerdida }} periodo={periodoDelGrafico} densidad="COMPLETA" ejercicio={g.requiere.listaV1 || g.requiere.ejercicio ? ejercicio : null} medida={null} bandas={[]} acceso={acceso} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
