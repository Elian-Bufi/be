'use client';

/**
 * ED-75 · La tarjeta de fuerza en el detalle del ejercicio (WP-EDITORES-PROFESIONAL §5.8; V3 E-03; maqueta 14). Va
 * bajo «Lo registrado», aparte de lo que indica el plan y nunca mezclada con la prescripción: lee lo registrado y lo
 * observado (ED-74 y ED-72), nunca el plan (TEST-EDP-065). Solo en los ejercicios de la lista de la v1.
 *
 * Qué serie muestra (ratificado el 12/11): la regla por sesión con el interruptor apagado, sobre la última sesión con
 * series que entran; si esa sesión solo tiene orientativas, la de mayor carga de ellas, como «estimación orientativa»
 * (`valorDeLaTarjeta`). Sin estimación, lo que hace falta en palabras, con la regla del RIR.
 */
import { COPY_FUERZA, estimacionALaVista, rotuloDeLaEstimacion, type PuntoDeFuerza } from '@be/domain';
import { BloqueDeEstado, Cargando } from '../../../../components/estados';
import { Enlace } from '../../../../components/enlace';
import { Icono } from '../../../../components/icono';
import { ICONO_DE_FALLA } from '../../../../lib/fallas';
import { useNombres } from '../../../../lib/nombres-ocultos';
import { diaDelPunto, estimacionDelPunto, haciaLaEvolucion, loQueHaceFalta, laSerie, quienLaEscribio, valorDeLaTarjeta } from './fuerza';
import type { LecturaDeFuerza } from './lectura-de-fuerza';

export const COPY_TARJETA_DE_FUERZA = {
  loRegistrado: 'Lo registrado',
  // La lectura es la del último año, recortada al inicio del acompañamiento (`lectura-de-fuerza`).
  enElUltimoAnio: 'en el último año',
  orientativaDeSesion: 'Orientativa: esa sesión no tuvo series de hasta 10 repeticiones equivalentes.',
  orientativaObservada: 'Orientativa: la serie observada tiene de más de 10 a 12 repeticiones equivalentes.',
  comoSeCalculo: 'Cómo se calculó',
  verEvolucion: 'Ver evolución',
  registrar: 'Registrar una serie observada',
  soloVos: (persona: string) => `Solo lo ves vos. ${persona} no ve estimaciones, y ninguna dispara un aviso.`,
  deOtros: 'Hay registros con otro profesional que no ves.',
  noSePudo: 'No pudimos leer lo registrado de este ejercicio.',
} as const;

export function TarjetaDeFuerza({
  lectura,
  nombre,
  persona,
  asesoradoId,
  exerciseId,
  recargar,
  onComoSeCalculo,
  onRegistrar,
}: {
  lectura: LecturaDeFuerza;
  /** El nombre del catálogo, el de la lista de la v1. */
  nombre: string;
  /** El nombre de la persona, como la ve este profesional. */
  persona: string;
  asesoradoId: string;
  exerciseId: string;
  recargar: () => void;
  onComoSeCalculo: (p: PuntoDeFuerza) => void;
  onRegistrar: () => void;
}) {
  const C = COPY_TARJETA_DE_FUERZA;
  const nombres = useNombres();
  const titulo = (
    <p className="tarjeta-de-fuerza__titulo">
      <Icono nombre="estimado" tamano={18} />
      <strong>
        {COPY_FUERZA.titulo} · {nombre}
      </strong>
    </p>
  );
  const registrar = (
    <button type="button" className="boton boton--enlace" data-registrar-observada onClick={onRegistrar}>
      {C.registrar}
    </button>
  );
  let cuerpo;
  if (lectura.tipo === 'cargando') cuerpo = <Cargando />;
  else if (lectura.tipo === 'no-disponible') cuerpo = null;
  else if (lectura.tipo === 'error')
    cuerpo = (
      <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[lectura.motivo]} onReintentar={recargar} deQue="lo registrado">
        {C.noSePudo}
      </BloqueDeEstado>
    );
  else {
    const p = valorDeLaTarjeta(lectura.apagado?.puntos ?? [], lectura.encendido?.puntos ?? []);
    if (!p) {
      const falta = loQueHaceFalta(lectura.encendido?.noEntraron ?? []);
      cuerpo = (
        <div className="tarjeta-de-fuerza__vacia" data-sin-estimacion>
          <p>
            <strong>{COPY_FUERZA.sinEstimacion}</strong>
          </p>
          {falta.motivos ? <p>{falta.motivos}</p> : null}
          <p className="nota" data-regla-del-rir>
            {falta.regla}
          </p>
          <p>{registrar}</p>
        </div>
      );
    } else {
      const e = estimacionDelPunto(p, exerciseId);
      cuerpo = (
        <div data-con-estimacion>
          <p className="tarjeta-de-fuerza__valor">
            <span className="tarjeta-de-fuerza__numero" data-valor>
              {estimacionALaVista(e)}
            </span>
            <span className="nota">
              {diaDelPunto(p)} · {rotuloDeLaEstimacion(e.banda)}
            </span>
          </p>
          <p>
            {laSerie(p)} · {quienLaEscribio(p, nombres.deQuien(p.writtenBy, asesoradoId))}
          </p>
          {e.banda === 'ORIENTATIVA' ? <p className="nota">{p.source === 'OBSERVED' ? C.orientativaObservada : C.orientativaDeSesion}</p> : null}
          <p className="tarjeta-de-fuerza__acciones">
            <button type="button" className="boton boton--enlace" data-como-se-calculo-abrir onClick={() => onComoSeCalculo(p)}>
              {C.comoSeCalculo}
            </button>
            {/* Un valor orientativo está en la evolución con «Incluir las de más de 10 a 12» encendido. */}
            <Enlace href={haciaLaEvolucion(asesoradoId, exerciseId, e.unidad, e.banda === 'ORIENTATIVA')}>{C.verEvolucion}</Enlace>
            {registrar}
          </p>
        </div>
      );
    }
  }
  if (cuerpo === null) return null;
  return (
    <section className="tarjeta-de-fuerza" aria-label={`${COPY_FUERZA.titulo} · ${nombre}`} data-tarjeta-de-fuerza>
      <p className="tarjeta-de-fuerza__encabezado">
        <span className="ejercicio-del-plan__subtitulo">{C.loRegistrado}</span>
        <span className="nota">{C.enElUltimoAnio}</span>
      </p>
      <div className="tarjeta-de-fuerza__caja">
        {titulo}
        {cuerpo}
      </div>
      {lectura.tipo === 'lista' && lectura.deOtros ? <p className="nota">{C.deOtros}</p> : null}
      <p className="nota">{C.soloVos(persona)}</p>
    </section>
  );
}
