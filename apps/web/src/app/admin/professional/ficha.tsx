'use client';

/**
 * UC-ADM-01 a 05 · la ficha de un profesional para Administración (API-ADM-11): su identidad profesional, la situación de
 * cada área con lo que admite hoy, y el historial. Información mínima (D-5): nada de fichas de asesorados, registros,
 * fotos ni datos de salud; de las personas vinculadas, solo cuántas.
 * - **Acciones según el estado:** cada área ofrece solo las decisiones que su estado admite (`availableDecisions`, del
 *   mismo dominio que decide la API). Un área sin presentar o rechazada lo dice, sin botones que no existen.
 * - **Verificación y habilitación, por separado:** la ficha dice las dos y, en una frase, si el profesional puede operar el
 *   área. Habilitar para operar en BE no es certificar una matrícula, y la pantalla lo dice.
 * - **Volver a la lista** la deja como estaba (búsqueda, filtros, página y posición).
 */
import {
  COPY_ADMINISTRACION,
  ETIQUETA_DE_ALCANCE,
  estadoDeHabilitacionEnPalabras,
  estadoDeVerificacionEnPalabras,
  operacionEnPalabras,
  type Alcance,
  type AreaDeLaFicha,
  type DecisionAdministrativa,
  type FichaDeProfesionalResponse,
  type NombreDeIcono,
} from '@be/domain';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AvisoFlotante } from '../../../components/ayuda';
import { BloqueDeEstado, Cargando, EstadoVacio } from '../../../components/estados';
import { Icono } from '../../../components/icono';
import { apiAdministrativa } from '../../../lib/api-administrativa';
import { ICONO_DE_FALLA, motivoDeFalla, razonDeFalla, type MotivoDeFalla } from '../../../lib/fallas';
import { dia, horaDelDia } from '../../../lib/formato';
import { useAdministracion } from '../../../lib/sesion-administrativa';
import { Situacion } from '../situacion';
import { DECISIONES_DE_PELIGRO, DialogoDeDecision } from './decision';
import { HistorialAdministrativo } from './historial';

const F = COPY_ADMINISTRACION.ficha;
const ICONO_DEL_AREA: Readonly<Record<Alcance, NombreDeIcono>> = { NUTRICION: 'nutricion', ENTRENAMIENTO: 'entrenamiento', ANTROPOMETRIA: 'antropometria' };

type Ficha = FichaDeProfesionalResponse['data'];
type Estado =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'no-encontrado' }
  | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla }
  | { readonly tipo: 'listo'; readonly ficha: Ficha; readonly consultadaEn: Date; readonly actualizando: boolean; readonly fallaAlActualizar: MotivoDeFalla | null };

function TarjetaDelArea({ area, onDecidir }: { area: AreaDeLaFicha; onDecidir: (d: DecisionAdministrativa) => void }) {
  const id = useId();
  const estado = { verificacion: area.verification.state, habilitacion: area.enablement.state };
  const sinAcciones = area.availableDecisions.length === 0;
  const porque = (F.sinAccionesPorque as Readonly<Record<string, string>>)[area.situation] ?? F.sinAcciones;
  return (
    <article className="area-de-la-ficha" aria-labelledby={`${id}-titulo`} data-area={area.scope}>
      <h3 id={`${id}-titulo`} className="area-de-la-ficha__titulo">
        <Icono nombre={ICONO_DEL_AREA[area.scope]} tamano={24} />
        {ETIQUETA_DE_ALCANCE[area.scope]}
      </h3>
      <p className="area-de-la-ficha__situacion">
        <Situacion situacion={area.situation} />
      </p>
      <p>{operacionEnPalabras(area.scope, estado)}</p>
      <dl className="datos datos--del-area">
        <div>
          <dt>{F.verificacion}</dt>
          <dd>
            {estadoDeVerificacionEnPalabras(area.verification.state)}
            {area.verification.since ? <span className="nota"> · {F.desdeElDia(dia(area.verification.since))}</span> : null}
          </dd>
        </div>
        <div>
          <dt>{F.habilitacion}</dt>
          <dd>
            {estadoDeHabilitacionEnPalabras(area.enablement.state)}
            {area.enablement.since ? <span className="nota"> · {F.desdeElDia(dia(area.enablement.since))}</span> : null}
          </dd>
        </div>
      </dl>
      <p className="nota">{F.personas(area.linkedPeople.active, area.linkedPeople.paused)}</p>
      {area.lastObservation ? (
        <div className="panel area-de-la-ficha__observacion">
          <p className="nota">{F.ultimaObservacion(dia(area.lastObservation.at))}</p>
          {area.lastObservation.messageToProfessional ? <p>«{area.lastObservation.messageToProfessional}»</p> : null}
        </div>
      ) : null}
      <div className="area-de-la-ficha__acciones">
        {sinAcciones ? (
          <p className="nota">{porque}</p>
        ) : (
          area.availableDecisions.map((d) => (
            <button key={d} type="button" className={`boton boton--compacto ${DECISIONES_DE_PELIGRO.has(d) ? 'boton--peligro-secundario' : 'boton--secundario'}`} onClick={() => onDecidir(d)}>
              {COPY_ADMINISTRACION.nombreDeLaDecision[d]}
              <span className="visualmente-oculto"> {ETIQUETA_DE_ALCANCE[area.scope]}</span>
            </button>
          ))
        )}
      </div>
    </article>
  );
}

export function FichaDelProfesional() {
  const parametros = useSearchParams();
  const profesionalId = parametros.get('id') ?? '';
  const { sesion, revisar } = useAdministracion();
  const token = sesion?.token ?? null;
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [vuelta, setVuelta] = useState(0);
  const [refrescoDelHistorial, setRefrescoDelHistorial] = useState(0);
  const [decidiendo, setDecidiendo] = useState<{ readonly alcance: Alcance; readonly decision: DecisionAdministrativa } | null>(null);
  const [registrada, setRegistrada] = useState<string | null>(null);
  const pedido = useRef(0);
  const titulo = useRef<HTMLHeadingElement>(null);

  /**
   * Lee la ficha; con una ficha a la vista, la conserva mientras tanto y, si falla, la sigue mostrando con el aviso.
   * Devuelve si la lectura llegó: después de un conflicto, el diálogo solo dice «cómo está ahora» si es cierto.
   */
  const leer = useCallback(async (): Promise<boolean> => {
    if (!token) return false;
    const n = ++pedido.current;
    if (!profesionalId) {
      setEstado({ tipo: 'no-encontrado' });
      return false;
    }
    setEstado((e) => (e.tipo === 'listo' ? { ...e, actualizando: true, fallaAlActualizar: null } : { tipo: 'cargando' }));
    const r = await apiAdministrativa.fichaDeProfesional(token, profesionalId);
    if (n !== pedido.current) return false;
    if (revisar(r)) return false;
    if (r.ok) {
      setEstado({ tipo: 'listo', ficha: r.datos.data, consultadaEn: new Date(), actualizando: false, fallaAlActualizar: null });
      return true;
    }
    if (r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') {
      setEstado({ tipo: 'no-encontrado' });
      return false;
    }
    const motivo = motivoDeFalla(r);
    setEstado((e) => (e.tipo === 'listo' ? { ...e, actualizando: false, fallaAlActualizar: motivo } : { tipo: 'error', motivo }));
    return false;
  }, [token, profesionalId, revisar]);

  useEffect(() => {
    void leer();
  }, [leer, vuelta]);

  // Al llegar a la ficha, el foco va al nombre: el lector de pantalla dice de quién es.
  const nombre = estado.tipo === 'listo' ? estado.ficha.professional.displayName : null;
  useEffect(() => {
    if (nombre) titulo.current?.focus();
  }, [nombre]);

  const volver = (
    <p className="volver-a-la-lista">
      <Link href="/admin">
        <Icono nombre="volver" tamano={18} />
        {F.volver}
      </Link>
    </p>
  );

  if (estado.tipo === 'cargando') {
    return (
      <>
        {volver}
        <Cargando />
      </>
    );
  }
  if (estado.tipo === 'no-encontrado') {
    return (
      <>
        {volver}
        <h1>{COPY_ADMINISTRACION.lista.profesional}</h1>
        <EstadoVacio titulo={F.noDisponible} icono="candado" />
      </>
    );
  }
  if (estado.tipo === 'error') {
    return (
      <>
        {volver}
        <h1>{COPY_ADMINISTRACION.lista.profesional}</h1>
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[estado.motivo]} titulo={`No pudimos cargar ${F.noLeida}`} onReintentar={() => setVuelta((n) => n + 1)} deQue={F.noLeida} rol="alert">
          {razonDeFalla(estado.motivo)}
        </BloqueDeEstado>
      </>
    );
  }

  const { professional: p, scopes } = estado.ficha;
  const areaEnDecision = decidiendo ? scopes.find((s) => s.scope === decidiendo.alcance) ?? null : null;
  return (
    <div className="ficha-administrativa">
      {volver}
      <div className="ficha-administrativa__cabecera">
        <div>
          <h1 ref={titulo} tabIndex={-1}>
            {p.displayName}
          </h1>
          <p className="metadatos">
            {F.tipoDePerfil[p.profileType]}
            {' · '}
            {p.email ?? COPY_ADMINISTRACION.lista.sinCorreo}
            {p.profileSince ? ` · ${F.desde} el ${dia(p.profileSince)}` : ''}
            {p.accountState !== 'OPERATIVA' ? ` · ${COPY_ADMINISTRACION.cuentaEnPalabras[p.accountState]}` : ''}
          </p>
        </div>
        <div className="ficha-administrativa__actualizar">
          <button type="button" className="boton boton--secundario boton--compacto" onClick={() => void leer()} disabled={estado.actualizando} aria-busy={estado.actualizando}>
            <Icono nombre="actualizar" tamano={18} />
            {F.actualizar}
          </button>
          <span className="nota" aria-live="polite">
            {F.consultadaA(horaDelDia(estado.consultadaEn))}
          </span>
        </div>
      </div>
      {estado.fallaAlActualizar ? (
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[estado.fallaAlActualizar]} titulo={`No pudimos actualizar ${F.noLeida}`} onReintentar={() => void leer()} deQue={F.noLeida} rol="alert">
          {razonDeFalla(estado.fallaAlActualizar)}
        </BloqueDeEstado>
      ) : null}
      <p className="nota nota--con-icono">
        <Icono nombre="info" tamano={18} />
        {COPY_ADMINISTRACION.noCertifica}
      </p>

      <section className="seccion" aria-labelledby="areas-de-la-ficha">
        <h2 id="areas-de-la-ficha">{F.areas}</h2>
        <div className="areas-de-la-ficha">
          {scopes.map((a) => (
            <TarjetaDelArea key={a.scope} area={a} onDecidir={(decision) => setDecidiendo({ alcance: a.scope, decision })} />
          ))}
        </div>
      </section>

      <HistorialAdministrativo profesionalId={p.professionalId} refresco={refrescoDelHistorial} />

      {decidiendo && areaEnDecision ? (
        <DialogoDeDecision
          profesionalId={p.professionalId}
          profesional={p.displayName}
          area={areaEnDecision}
          decision={decidiendo.decision}
          onCerrar={() => setDecidiendo(null)}
          onReleer={async () => {
            // Después de un conflicto, la ficha y el historial se vuelven a leer: lo que cambió también está en la historia.
            const llego = await leer();
            setRefrescoDelHistorial((n) => n + 1);
            return llego;
          }}
          onRegistrada={(r, texto) => {
            // El área como quedó, sin esperar otra lectura; el historial se vuelve a leer con el hecho nuevo.
            setEstado((e) => (e.tipo === 'listo' ? { ...e, ficha: { ...e.ficha, scopes: e.ficha.scopes.map((s) => (s.scope === r.scope.scope ? r.scope : s)) }, consultadaEn: new Date() } : e));
            setDecidiendo(null);
            setRefrescoDelHistorial((n) => n + 1);
            setRegistrada(texto);
          }}
        />
      ) : null}
      {registrada ? (
        <AvisoFlotante onCerrar={() => setRegistrada(null)}>
          <p>{registrada}</p>
        </AvisoFlotante>
      ) : null}
    </div>
  );
}
