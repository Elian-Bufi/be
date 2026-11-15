'use client';

/**
 * Website `/pro/advisees/previous-history?id=…&area=…` · «Historia anterior» (WP-HISTORIA-ANTERIOR, DL-175): lo que pasó
 * en un área de la persona con otro profesional, antes del acompañamiento de quien lee, si la persona lo autorizó desde
 * su app. Solo lectura. Las decisiones están en `historia-anterior.ts`, con su prueba (TEST-HA-050 a 056).
 *
 * - **El marco es el de un área** (`MarcoDelArea`): la vuelta a la ficha, el acceso actual de esa área y «Actualizar».
 *   Las pestañas son las tres áreas.
 * - **Con la autorización:** el aviso fijo («Lo que sigue pasó con otro profesional, antes de tu acompañamiento. Solo
 *   lectura»), el tramo con sus vecinos y las secciones del área: las versiones de los planes con sus fechas, lo
 *   registrado por semana, las tomas con su método y las decisiones de las revisiones. Cada cosa, «De otro profesional»,
 *   sin su nombre. Si no hay nada de antes, solo eso: el aviso de «Lo que sigue…» no anuncia algo que no está.
 * - **Sin la autorización** (el 404 de API-HIA-04, sea cual sea la causa): primero lo que hace falta (acompañarla en esa
 *   área y que ella la autorice) y después dónde la autoriza ella, sin mostrar ni insinuar datos.
 * - **Nada escribe.** No hay botones que cambien algo: solo enlaces a otro tramo o a otra área.
 *
 * Usa las clases de siempre (`secciones`, `seccion`, `lista`, `insignia`, `datos`): sin colores propios, los dos temas.
 */
import { COPY_HISTORIA_ANTERIOR as C, type Alcance, type HistoriaAnteriorResponse, type TramoDeFechas } from '@be/domain';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Enlace } from '../../../../components/enlace';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { Aviso } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api, type Resultado } from '../../../../lib/api';
import { diaCivil, diaYMesCivil } from '../../../../lib/formato';
import { useEspacioProfesional } from '../../espacio-profesional';
import { MarcoDelArea } from '../marco-del-area';
import { useRetornoALaFicha } from '../retorno-y-preparacion';
import {
  AREAS_DE_LA_HISTORIA,
  decisionesEnPantalla,
  estadoDeLaLectura,
  hrefDeLaHistoriaAnterior,
  leerArea,
  leerTramo,
  navegacionDelTramo,
  seccionesDeLaHistoria,
  semanasEnPantalla,
  sinAutorizacion,
  tomasEnPantalla,
  versionesEnPantalla,
  type HistoriaAnterior,
} from './historia-anterior';

export function HistoriaAnteriorDeLaPersona() {
  const parametros = useSearchParams();
  const id = parametros.get('id') ?? '';
  const area = leerArea(parametros.get('area'));
  const tramo = leerTramo(parametros);
  const sesion = useEspacioProfesional(hrefDeLaHistoriaAnterior(id, area, tramo));
  const retorno = useRetornoALaFicha(id);
  return (
    <MarcoDelArea
      alcance={area}
      titulo={C.tituloDelArea(area)}
      etiqueta={C.areasParaLeer}
      id={id}
      sesion={sesion}
      retorno={retorno}
      vistas={AREAS_DE_LA_HISTORIA}
      vista={area}
      href={(a) => hrefDeLaHistoriaAnterior(id, a, null, retorno.valor)}
      ancho
    >
      {sesion.token ? <LecturaDeLaHistoria token={sesion.token} sesionPerdida={sesion.sesionPerdida} id={id} area={area} tramo={tramo} volver={retorno.valor} /> : null}
    </MarcoDelArea>
  );
}

/** API-HIA-04, una vez por área y por tramo. «Reintentar» la repite. */
function LecturaDeLaHistoria({
  token,
  sesionPerdida,
  id,
  area,
  tramo,
  volver,
}: {
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  id: string;
  area: Alcance;
  tramo: TramoDeFechas | null;
  volver: string | null;
}) {
  const [r, setR] = useState<Resultado<HistoriaAnteriorResponse> | null>(null);
  const [intento, setIntento] = useState(0);
  const desde = tramo?.desde ?? null;
  const hasta = tramo?.hasta ?? null;
  useEffect(() => {
    let vigente = true;
    setR(null);
    void api.historiaAnterior(token, id, area, desde && hasta ? { desde, hasta } : null).then((respuesta) => {
      if (!vigente || sesionPerdida(respuesta)) return;
      setR(respuesta);
    });
    return () => {
      vigente = false;
    };
  }, [token, id, area, desde, hasta, intento, sesionPerdida]);

  const estado = estadoDeLaLectura(r);
  if (estado.tipo === 'cargando') return <Cargando />;
  if (estado.tipo === 'error') return <ErrorConReintento onReintentar={() => setIntento((n) => n + 1)} />;
  if (estado.tipo === 'sin-autorizacion') return <ComoPedirla area={area} />;
  return <LaHistoria historia={estado.historia} id={id} area={area} volver={volver} />;
}

/** Sin la autorización: lo que hace falta y cómo pedírsela a la persona. El mismo texto para cualquier causa del 404. */
function ComoPedirla({ area }: { area: Alcance }) {
  const s = sinAutorizacion(area);
  return (
    <section className="seccion" aria-labelledby="historia-anterior-como-pedirla" data-historia-anterior="sin-autorizacion">
      <h2 id="historia-anterior-como-pedirla">{s.titulo}</h2>
      <p>{s.cuerpo}</p>
      <p className="nota">{s.donde}</p>
    </section>
  );
}

function LaHistoria({ historia: h, id, area, volver }: { historia: HistoriaAnterior; id: string; area: Alcance; volver: string | null }) {
  const nav = navegacionDelTramo(h, diaCivil);
  return (
    <div className="secciones" data-historia-anterior="lista">
      {/* El aviso fijo que pidió Dirección: siempre arriba cuando hay algo de antes, tenga o no datos el tramo. Sin nada de
          antes, solo eso (el «Lo que sigue…» anunciaría algo que no está). */}
      {h.extent === null ? null : (
        <Aviso tipo="info">
          <p>
            <strong>{C.aviso}</strong>
          </p>
        </Aviso>
      )}
      {h.extent === null ? (
        <p className="nota">{C.sinHistoria}</p>
      ) : (
        <nav aria-label={C.tramosParaLeer} className="seccion seccion--compacta">
          <p>
            <Icono nombre="linea-de-tiempo" tamano={18} /> <strong>{nav.tramo}</strong>
          </p>
          {nav.extension ? <p className="nota">{nav.extension}</p> : null}
          {nav.anterior || nav.siguiente ? (
            <p>
              {nav.anterior ? (
                <Enlace href={hrefDeLaHistoriaAnterior(id, area, nav.anterior, volver)} replace>
                  <Icono nombre="volver" tamano={18} /> {C.tramoAnterior}
                </Enlace>
              ) : null}
              {nav.anterior && nav.siguiente ? ' · ' : null}
              {nav.siguiente ? (
                <Enlace href={hrefDeLaHistoriaAnterior(id, area, nav.siguiente, volver)} replace>
                  {C.tramoSiguiente} <Icono nombre="derecha" tamano={18} />
                </Enlace>
              ) : null}
            </p>
          ) : null}
        </nav>
      )}
      {h.extent === null
        ? null
        : seccionesDeLaHistoria(h).map((s) => (
            <section key={s.parte} className="seccion" aria-labelledby={`historia-anterior-${s.parte}`}>
              <h2 id={`historia-anterior-${s.parte}`}>{s.titulo}</h2>
              {s.cuantas === 0 ? <p className="nota">{s.vacio}</p> : null}
              {s.cuantas > 0 && s.parte === 'PLANS' ? <Versiones historia={h} /> : null}
              {s.cuantas > 0 && s.parte === 'RECORDS' ? <Registros historia={h} /> : null}
              {s.cuantas > 0 && s.parte === 'MEASUREMENTS' ? <Tomas historia={h} /> : null}
              {s.cuantas > 0 && s.parte === 'DECISIONS' ? <Decisiones historia={h} /> : null}
            </section>
          ))}
    </div>
  );
}

/** «De otro profesional»: la marca de cada cosa, sin nombre. */
function DeOtro({ texto }: { texto: string }) {
  return <span className="insignia insignia--no">{texto}</span>;
}

function Versiones({ historia }: { historia: HistoriaAnterior }) {
  return (
    <ul className="lista">
      {versionesEnPantalla(historia, diaCivil).map((v) => (
        <li key={v.id} className="lista__item">
          <p className="lista__titulo">
            {v.titulo} <DeOtro texto={v.autor} />
          </p>
          <p>{v.vigencia}</p>
          {v.corte ? <p className="nota">{v.corte}</p> : null}
          {v.contenido.length > 0 ? (
            <ul className="lista-compacta">
              {v.contenido.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function Registros({ historia }: { historia: HistoriaAnterior }) {
  return (
    <>
      {semanasEnPantalla(historia, diaCivil, diaYMesCivil).map((s) => (
        <div key={s.clave}>
          <h3>{s.titulo}</h3>
          {s.cuenta ? <p className="nota">{s.cuenta}</p> : null}
          <ul className="lista">
            {s.registros.map((r) => (
              <li key={r.id} className="lista__item">
                <p>
                  <strong>{r.fecha}</strong> · {r.texto}
                </p>
                <p>
                  <DeOtro texto={r.autor} />
                  {r.marcas.map((m) => (
                    <span key={m}>
                      {' '}
                      <span className="insignia insignia--no">{m}</span>
                    </span>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

function Tomas({ historia }: { historia: HistoriaAnterior }) {
  return (
    <ul className="lista">
      {tomasEnPantalla(historia, diaCivil).map((t) => (
        <li key={t.id} className="lista__item">
          <p className="lista__titulo">
            {t.titulo} <DeOtro texto={t.autor} />
          </p>
          {t.protocolos.map((p) => (
            <p key={p} className="nota">
              {p}
            </p>
          ))}
          <ul className="lista-compacta">
            {t.mediciones.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
          {t.calculos.length > 0 ? (
            <>
              <p className="nota">
                <Icono nombre="calculado" tamano={18} /> {C.calculado}
              </p>
              <ul className="lista-compacta">
                {t.calculos.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function Decisiones({ historia }: { historia: HistoriaAnterior }) {
  return (
    <ul className="lista">
      {decisionesEnPantalla(historia, diaCivil).map((d) => (
        <li key={d.id} className="lista__item">
          <p className="lista__titulo">
            {d.titulo} <DeOtro texto={d.autor} />
          </p>
          <p className="nota">{d.periodo}</p>
          <dl className="datos">
            <div>
              <dt>{C.resultado}</dt>
              <dd>{d.resultado}</dd>
            </div>
            <div>
              <dt>{C.fundamento}</dt>
              <dd>{d.fundamento}</dd>
            </div>
            <div>
              <dt>{C.proximaAccion}</dt>
              <dd>{d.proximaAccion}</dd>
            </div>
          </dl>
          {d.proximaRevision ? <p className="nota">{d.proximaRevision}</p> : null}
        </li>
      ))}
    </ul>
  );
}
