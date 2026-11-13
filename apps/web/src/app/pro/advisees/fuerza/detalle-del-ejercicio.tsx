'use client';

/**
 * El detalle del ejercicio en la estación (WP-EDITORES-PROFESIONAL §5.8; maquetas 14 a 18): un cuadro enfocado al
 * costado, con «Lo que indica el plan» arriba y «Lo registrado» abajo, nunca mezclados. Solo para los ejercicios de la
 * lista de la v1 (RM-16). Los pasos se abren en el mismo cuadro, con «Atrás» (ED-10):
 * - la tarjeta de fuerza (ED-75), que lee lo registrado y lo observado;
 * - «Cómo se calculó» (ED-73);
 * - «Registrar una serie observada» (ED-72);
 * - «Calcular la carga desde la estimación» (ED-76), que escribe en el borrador solo con su principal.
 *
 * Abrirlo no cambia nada de la prescripción (TEST-EDP-065).
 */
import { useState, type ReactNode } from 'react';
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
import { estimacionesParaLaCarga, haciaLaEvolucion, loQueSeEscribeEnLaFilaGeneral, type PrescripcionParaLaCarga } from './fuerza';
import { useLecturaDeFuerza, type LecturaDeFuerza } from './lectura-de-fuerza';
import { COPY_SERIE_OBSERVADA, SerieObservada, useSerieObservada } from './serie-observada';
import { TarjetaDeFuerza } from './tarjeta';

/** `desde: 'carga'`: «Cómo se calculó» abierto desde la lista del cuadro de la carga (ED-73), que vuelve a ella con «Atrás». */
type Paso = { readonly tipo: 'detalle' } | { readonly tipo: 'como'; readonly punto: PuntoDeFuerza; readonly desde?: 'carga' } | { readonly tipo: 'observar' } | { readonly tipo: 'carga' };

export const COPY_DETALLE_DEL_EJERCICIO = {
  abrir: 'Detalle y fuerza estimada',
  loQueIndicaElPlan: 'Lo que indica el plan',
  persona: 'La persona',
  escrita: (carga: string) => `Se escribió ${carga} en la fila general. El borrador se guarda solo.`,
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
}) {
  const [paso, setPaso] = useState<Paso>({ tipo: 'detalle' });
  const [aviso, setAviso] = useState<string | null>(null);
  const { lectura, recargar } = useLecturaDeFuerza(token, asesoradoId, abierto ? exerciseId : undefined, { sesionPerdida });
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
  const carga = useCargaDesdeLaEstimacion(prescripcion, unidad);
  const volver =
    paso.tipo === 'como' && paso.desde === 'carga'
      ? { texto: `Atrás: ${COPY_CARGA_DESDE_LA_ESTIMACION.titulo}`, alTocar: () => setPaso({ tipo: 'carga' }) }
      : { texto: `Atrás: ${nombre}`, alTocar: () => setPaso({ tipo: 'detalle' }) };
  const cerrar = () => {
    setPaso({ tipo: 'detalle' });
    setAviso(null);
    observar.reiniciar();
    carga.reiniciar();
    onCerrar();
  };
  const abrir = (p: Paso) => {
    setAviso(null);
    // ED-D20: cada vez que se entra al cálculo de la carga, ninguna estimación elegida y el % RM de la prescripción de ahora.
    if (p.tipo === 'carga') carga.reiniciar();
    setPaso(p);
  };

  let titulo = nombre;
  let cuerpo: ReactNode;
  let principal = null;
  let conCambios = false;
  let pie: ReactNode = null;
  if (paso.tipo === 'como') {
    titulo = COPY_COMO_SE_CALCULO.titulo;
    const deDonde = paso.desde === 'carga' ? deLaUnidad : lectura;
    const linea = deDonde.tipo === 'lista' ? ((deDonde.apagado?.puntos.includes(paso.punto) ? deDonde.apagado : deDonde.encendido) ?? null) : null;
    cuerpo = <ComoSeCalculo punto={paso.punto} nombre={nombre} asesoradoId={asesoradoId} noEntraron={linea?.noEntraron ?? []} />;
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
      texto: textoDelPrincipal(carga, nombre),
      apagado: carga.apagado,
      alTocar: () => {
        const r = carga.resultado;
        if (!r) return;
        onEscribir(loQueSeEscribeEnLaFilaGeneral(prescripcion, { value: r.carga, unit: r.unidad }, r.porcentaje, r.punto.date));
        setAviso(COPY_DETALLE_DEL_EJERCICIO.escrita(`${String(r.carga).replace('.', ',')} ${r.unidad}`));
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
      ocupado={observar.enviando}
      principal={principal}
      pie={pie}
      className="detalle-con-fuerza"
      onCerrar={cerrar}
    >
      {cuerpo}
    </CuadroEnfocado>
  );
}
