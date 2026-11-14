'use client';

/**
 * El detalle del ejercicio en la estación (WP-EDITORES-PROFESIONAL §5.8; maquetas 14 a 18): un cuadro enfocado al
 * costado, con «Lo que indica el plan» arriba y «Lo registrado» abajo, nunca mezclados. Solo para los ejercicios de la
 * lista de la v1 (RM-16). Los pasos se abren en el mismo cuadro, con «Atrás» (ED-10):
 * - la tarjeta de fuerza (ED-75), que lee lo registrado y lo observado;
 * - «Cómo se calculó» (ED-73);
 * - «Registrar una serie observada» (ED-72);
 * - «Calcular la carga desde la estimación» (ED-76), que escribe en el borrador solo con su principal: en la fila
 *   general o, si se abrió desde las series elegidas de la planilla, en esas series (EDT-56);
 * - «Corregir o anular la serie observada» (ED-72, API-FZA-03), desde «Cómo se calculó» de una observación propia.
 *
 * WP-GRAFICOS GR-01 (DL-174, fase 1): debajo de «Lo que indica el plan», «La vez pasada» (las últimas tres sesiones del
 * ejercicio, serie por serie, de `training/la-vez-pasada.tsx`) y después la tarjeta de fuerza: lo registrado va abajo,
 * nunca mezclado con lo indicado.
 *
 * Abrirlo no cambia nada de la prescripción (TEST-EDP-065).
 */
import { useEffect, useState, type ReactNode } from 'react';
import type { PuntoDeFuerza } from '@be/domain';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { usePersonaDelArea } from '../marco-del-area';
import { useNombres } from '../../../../lib/nombres-ocultos';
import { Icono } from '../../../../components/icono';
import type { Resultado } from '../../../../lib/api';
import { CargaDesdeLaEstimacion, COPY_CARGA_DESDE_LA_ESTIMACION, textoDelPrincipal, useCargaDesdeLaEstimacion } from './carga-desde-la-estimacion';
import { ComoSeCalculo, COPY_COMO_SE_CALCULO } from './como-se-calculo';
import { BloqueDeEstado } from '../../../../components/estados';
import { ICONO_DE_FALLA } from '../../../../lib/fallas';
import { useSesion } from '../../../../lib/sesion';
import { COPY_SUCESION, estimacionesParaLaCarga, haciaLaEvolucion, lasElegidasQueQuedan, lasSeriesEnPalabras, loQueSeEscribeEnLaFilaGeneral, loQueSeEscribeEnLasSeries, puedeSucederla, type PrescripcionParaLaCarga } from './fuerza';
import { SucederSerieObservada, useSucesion } from './suceder-serie-observada';
import { useLecturaDeFuerza, type LecturaDeFuerza } from './lectura-de-fuerza';
import { COPY_SERIE_OBSERVADA, SerieObservada, useSerieObservada } from './serie-observada';
import { TarjetaDeFuerza } from './tarjeta';
import { LaVezPasada, useLaVezPasada } from '../training/la-vez-pasada';

/** `desde: 'carga'`: «Cómo se calculó» abierto desde la lista del cuadro de la carga (ED-73), que vuelve a ella con «Atrás». */
type Paso =
  | { readonly tipo: 'detalle' }
  | { readonly tipo: 'como'; readonly punto: PuntoDeFuerza; readonly desde?: 'carga' }
  | { readonly tipo: 'observar' }
  | { readonly tipo: 'carga' }
  | { readonly tipo: 'suceder'; readonly punto: PuntoDeFuerza };

/** Una serie de la prescripción, con lo único que el cuadro de la carga toca en ella. */
type SerieParaLaCarga = { readonly suggestedLoad?: { readonly value: number; readonly unit: 'kg' | 'lb' } | null };

export const COPY_DETALLE_DEL_EJERCICIO = {
  abrir: 'Detalle y fuerza estimada',
  loQueIndicaElPlan: 'Lo que indica el plan',
  persona: 'La persona',
  escrita: (carga: string) => `Se escribió ${carga} en la fila general. El borrador se guarda solo.`,
  escritaEnLasSeries: (carga: string, series: string) => `Se escribió ${carga} en ${series}. El borrador se guarda solo.`,
  noSeLeyo: 'No pudimos leer las estimaciones de este ejercicio, así que no hay de dónde calcular la carga ahora.',
  noDisponible: 'Con el acceso de ahora no podés ver los registros de Entrenamiento de esta persona.',
} as const;

/** El nombre de la persona como la ve este profesional (DL-169): el del área o, si no llegó, el que traen sus series. */
function nombreDeLaPersona(delArea: string | null, l: LecturaDeFuerza, delAsesorado: (a: PuntoDeFuerza['writtenBy']) => string): string {
  if (delArea) return delArea;
  if (l.tipo !== 'lista') return COPY_DETALLE_DEL_EJERCICIO.persona;
  const p = [...(l.encendido?.puntos ?? []), ...(l.apagado?.puntos ?? [])].find((x) => x.source === 'PERSON');
  return p ? delAsesorado(p.writtenBy) : COPY_DETALLE_DEL_EJERCICIO.persona;
}

export function DetalleDelEjercicio({
  abierto,
  onCerrar,
  token,
  asesoradoId,
  sesionPerdida,
  exerciseId,
  nombre,
  unidad,
  prescripcion,
  loQueIndica,
  onEscribir,
  series = null,
  sets = [],
  onEscribirEnLasSeries,
}: {
  abierto: boolean;
  onCerrar: () => void;
  token: string;
  asesoradoId: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  /** El ejercicio del catálogo, de la lista de la v1. */
  exerciseId: string;
  nombre: string;
  /** La unidad de la prescripción: la del cuadro de la carga (sin convertir, RM-39). */
  unidad: 'kg' | 'lb';
  prescripcion: PrescripcionParaLaCarga;
  /** «5 × 5 · 75 % RM · sin carga · 3:00»: la prescripción en una línea, como se lee plegada. */
  loQueIndica: ReactNode;
  /** Escribe en el borrador lo que confirmó el profesional (ED-76). */
  onEscribir: (cambio: ReturnType<typeof loQueSeEscribeEnLaFilaGeneral>) => void;
  /**
   * ED-76 desde la planilla (EDT-56): las series elegidas (desde 0). Con ellas, el cuadro abre directo en el cálculo de la
   * carga y escribe solo en esas series; `null`, en la fila general.
   */
  series?: readonly number[] | null;
  /** Las series de la prescripción de ahora, para escribir en las elegidas. */
  sets?: readonly SerieParaLaCarga[];
  /** Escribe la carga en las series elegidas: recibe todas las series, con la carga propia en las elegidas. */
  onEscribirEnLasSeries?: (cambio: { sets: SerieParaLaCarga[] }) => void;
}) {
  const [paso, setPaso] = useState<Paso>({ tipo: 'detalle' });
  const yo = useSesion().sesion?.identidadId ?? null;
  // Desde las series elegidas, el cuadro se abre en el cálculo de la carga, que arranca de nuevo (ED-D20) y escribe en
  // ellas. Si el profesional vuelve al detalle y entra al cálculo desde su botón, ese escribe en la fila general.
  const [enLasSeries, setEnLasSeries] = useState(false);
  const desdeLasSeries = enLasSeries && series !== null && series.length > 0;
  const [aviso, setAviso] = useState<string | null>(null);
  const { lectura, recargar } = useLecturaDeFuerza(token, asesoradoId, abierto ? exerciseId : undefined, { sesionPerdida });
  // GR-01: las últimas veces del ejercicio, leídas al abrir el cuadro.
  const { lectura: vezPasada, recargar: recargarLaVezPasada } = useLaVezPasada(token, asesoradoId, abierto ? exerciseId : undefined, sesionPerdida);
  // La lectura del cuadro de la carga sigue viva mientras se mira «Cómo se calculó» de una de sus estimaciones: al volver
  // no se lee de nuevo y lo elegido sigue ahí.
  const enLaCarga = paso.tipo === 'carga' || (paso.tipo === 'como' && paso.desde === 'carga');
  const { lectura: deLaUnidad, recargar: recargarLaUnidad } = useLecturaDeFuerza(token, asesoradoId, abierto && enLaCarga ? exerciseId : undefined, { unidad, sesionPerdida });
  const nombres = useNombres();
  const persona = nombreDeLaPersona(usePersonaDelArea(), lectura, nombres.delAsesorado);
  const hoy = lectura.tipo === 'lista' ? lectura.hoy : new Date().toISOString().slice(0, 10);
  const observar = useSerieObservada({
    token,
    asesoradoId,
    exerciseId,
    hoy,
    zona: lectura.tipo === 'lista' ? lectura.zona : 'America/Argentina/Buenos_Aires',
    unidad,
    sesionPerdida,
    alGuardar: () => {
      recargar();
      setAviso(COPY_SERIE_OBSERVADA.guardada);
      setPaso({ tipo: 'detalle' });
    },
  });
  const carga = useCargaDesdeLaEstimacion(prescripcion, unidad, desdeLasSeries);
  useEffect(() => {
    if (!abierto || !series || series.length === 0) return;
    setEnLasSeries(true);
    carga.reiniciar();
    setAviso(null);
    setPaso({ tipo: 'carga' });
    // Solo al abrir: cambiar las elegidas con el cuadro abierto no lo mueve de paso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);
  const sucesion = useSucesion({
    token,
    asesoradoId,
    exerciseId,
    observationId: paso.tipo === 'suceder' && paso.punto.origin.type === 'STRENGTH_OBSERVATION' ? paso.punto.origin.id : null,
    hoy,
    sesionPerdida,
    alGuardar: (accion) => {
      recargar();
      setAviso(accion === 'anular' ? COPY_SUCESION.anulada : COPY_SUCESION.corregida);
      setPaso({ tipo: 'detalle' });
    },
  });
  const volver =
    paso.tipo === 'como' && paso.desde === 'carga'
      ? { texto: `Atrás: ${COPY_CARGA_DESDE_LA_ESTIMACION.titulo}`, alTocar: () => setPaso({ tipo: 'carga' }) }
      : paso.tipo === 'suceder'
        ? { texto: `Atrás: ${COPY_COMO_SE_CALCULO.titulo}`, alTocar: () => setPaso({ tipo: 'como', punto: paso.punto }) }
        : { texto: `Atrás: ${nombre}`, alTocar: () => setPaso({ tipo: 'detalle' }) };
  const cerrar = () => {
    setPaso({ tipo: 'detalle' });
    setAviso(null);
    observar.reiniciar();
    carga.reiniciar();
    setEnLasSeries(false);
    onCerrar();
  };
  const abrir = (p: Paso) => {
    setAviso(null);
    // ED-D20: cada vez que se entra al cálculo de la carga, ninguna estimación elegida y el % RM de la prescripción de ahora.
    if (p.tipo === 'carga') {
      carga.reiniciar();
      setEnLasSeries(false);
    }
    setPaso(p);
  };

  // Las elegidas que siguen existiendo: una serie quitada con el cuadro abierto no se escribe.
  const elegidas = desdeLasSeries ? lasElegidasQueQuedan(series ?? [], sets.length) : [];
  let titulo = nombre;
  let cuerpo: ReactNode;
  let principal = null;
  let conCambios = false;
  let pie: ReactNode = null;
  if (paso.tipo === 'como') {
    titulo = COPY_COMO_SE_CALCULO.titulo;
    const deDonde = paso.desde === 'carga' ? deLaUnidad : lectura;
    const linea = deDonde.tipo === 'lista' ? ((deDonde.apagado?.puntos.includes(paso.punto) ? deDonde.apagado : deDonde.encendido) ?? null) : null;
    const punto = paso.punto;
    cuerpo = (
      <ComoSeCalculo
        punto={punto}
        nombre={nombre}
        asesoradoId={asesoradoId}
        noEntraron={linea?.noEntraron ?? []}
        // ED-72: solo quien la observó la corrige o la anula, y desde el detalle (no desde el cálculo de la carga).
        onSuceder={paso.desde !== 'carga' && puedeSucederla(punto, yo) ? () => abrir({ tipo: 'suceder', punto }) : null}
      />
    );
  } else if (paso.tipo === 'suceder') {
    titulo = COPY_SUCESION.titulo;
    cuerpo = <SucederSerieObservada hoy={hoy} estado={sucesion} />;
    conCambios = sucesion.conCambios;
    principal = {
      texto: sucesion.accion === 'anular' ? COPY_SUCESION.anularla : COPY_SUCESION.guardarCorreccion,
      alTocar: () => void sucesion.enviar(),
      apagado: sucesion.apagado,
      enviando: sucesion.enviando,
      textoEnviando: COPY_SUCESION.guardando,
    };
  } else if (paso.tipo === 'observar') {
    titulo = COPY_SERIE_OBSERVADA.titulo;
    cuerpo = <SerieObservada persona={persona} hoy={hoy} formulario={observar} />;
    conCambios = observar.conCambios;
    principal = { texto: COPY_SERIE_OBSERVADA.guardar, alTocar: () => void observar.guardar(), apagado: observar.apagado, enviando: observar.enviando, textoEnviando: COPY_SERIE_OBSERVADA.guardando };
  } else if (paso.tipo === 'carga') {
    titulo = COPY_CARGA_DESDE_LA_ESTIMACION.titulo;
    conCambios = carga.conCambios;
    cuerpo =
      deLaUnidad.tipo === 'lista' ? (
        <CargaDesdeLaEstimacion
          // La regla de la tarjeta (ED-75): por sesión, la del interruptor apagado; la orientativa, si la sesión no tiene otra.
          puntos={estimacionesParaLaCarga(deLaUnidad.apagado?.unidad === unidad ? deLaUnidad.apagado.puntos : [], deLaUnidad.encendido?.unidad === unidad ? deLaUnidad.encendido.puntos : [])}
          hoy={deLaUnidad.hoy}
          criterio={prescripcion.intensity?.criterion ?? null}
          haciaLaEvolucion={haciaLaEvolucion(asesoradoId, exerciseId, unidad)}
          asesoradoId={asesoradoId}
          estado={carga}
          series={desdeLasSeries ? elegidas : null}
          onComoSeCalculo={(p) => setPaso({ tipo: 'como', punto: p, desde: 'carga' })}
        />
      ) : deLaUnidad.tipo === 'cargando' ? (
        <p className="cargando" role="status">
          Cargando…
        </p>
      ) : deLaUnidad.tipo === 'error' ? (
        // Una lectura que falló no es un ejercicio sin estimaciones: se dice y se reintenta, como en la tarjeta.
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[deLaUnidad.motivo]} onReintentar={recargarLaUnidad} deQue="las estimaciones del ejercicio">
          {COPY_DETALLE_DEL_EJERCICIO.noSeLeyo}
        </BloqueDeEstado>
      ) : (
        <p data-no-disponible>{COPY_DETALLE_DEL_EJERCICIO.noDisponible}</p>
      );
    principal = {
      texto: textoDelPrincipal(carga, nombre, desdeLasSeries ? elegidas : null),
      apagado: carga.apagado ?? (desdeLasSeries && elegidas.length === 0 ? COPY_CARGA_DESDE_LA_ESTIMACION.sinSeries : null),
      alTocar: () => {
        const r = carga.resultado;
        if (!r) return;
        const texto = `${String(r.carga).replace('.', ',')} ${r.unidad}`;
        if (desdeLasSeries) {
          if (elegidas.length === 0 || !onEscribirEnLasSeries) return;
          onEscribirEnLasSeries(loQueSeEscribeEnLasSeries(sets, elegidas, { value: r.carga, unit: r.unidad }));
          setAviso(COPY_DETALLE_DEL_EJERCICIO.escritaEnLasSeries(texto, lasSeriesEnPalabras(elegidas)));
        } else {
          onEscribir(loQueSeEscribeEnLaFilaGeneral(prescripcion, { value: r.carga, unit: r.unidad }, r.porcentaje, r.punto.date));
          setAviso(COPY_DETALLE_DEL_EJERCICIO.escrita(texto));
        }
        setPaso({ tipo: 'detalle' });
      },
    };
  } else {
    cuerpo = (
      <div className="detalle-del-ejercicio">
        {aviso ? (
          <p className="detalle-del-ejercicio__aviso" role="status" data-aviso-del-detalle>
            <Icono nombre="tilde" tamano={18} />
            {aviso}
          </p>
        ) : null}
        <section className="detalle-del-ejercicio__plan" aria-label={COPY_DETALLE_DEL_EJERCICIO.loQueIndicaElPlan}>
          <p className="ejercicio-del-plan__subtitulo">{COPY_DETALLE_DEL_EJERCICIO.loQueIndicaElPlan}</p>
          <div className="detalle-del-ejercicio__indica">{loQueIndica}</div>
          <p className="detalle-del-ejercicio__calcular">
            <button type="button" className="boton boton--secundario" data-calcular-la-carga onClick={() => abrir({ tipo: 'carga' })}>
              <Icono nombre="calculado" tamano={18} />
              {COPY_CARGA_DESDE_LA_ESTIMACION.abrir}
            </button>
            <span className="nota">{COPY_CARGA_DESDE_LA_ESTIMACION.nadaSeEscribe}</span>
          </p>
        </section>
        <LaVezPasada lectura={vezPasada} recargar={recargarLaVezPasada} nombre={nombre} />
        <TarjetaDeFuerza
          lectura={lectura}
          nombre={nombre}
          persona={persona}
          asesoradoId={asesoradoId}
          exerciseId={exerciseId}
          recargar={recargar}
          onComoSeCalculo={(p) => abrir({ tipo: 'como', punto: p })}
          onRegistrar={() => {
            // La fecha de entrada es la de hoy de la lectura: si no hay nada escrito, el cuadro arranca de nuevo con ella.
            if (!observar.conCambios) observar.reiniciar();
            abrir({ tipo: 'observar' });
          }}
        />
      </div>
    );
    pie = null;
  }
  return (
    <CuadroEnfocado
      abierto={abierto}
      forma="panel"
      titulo={titulo}
      sobretitulo={paso.tipo === 'detalle' ? null : nombre}
      atras={paso.tipo === 'detalle' ? null : volver}
      paso={paso.tipo}
      conCambios={conCambios}
      ocupado={observar.enviando || sucesion.enviando}
      principal={principal}
      pie={pie}
      className="detalle-con-fuerza"
      onCerrar={cerrar}
    >
      {cuerpo}
    </CuadroEnfocado>
  );
}
