'use client';

/**
 * Pestaña «Información» del workspace (WP-07; RF-071; API-FRM-01 a 05). Dos vistas: lo que ya se pidió y pedir algo
 * nuevo. Es transversal a los tres alcances: no cuelga de Nutrición, Entrenamiento ni Antropometría.
 *
 * Lo que la pantalla tiene que dejar claro, y por eso está escrito en el copy y no acá:
 * - pedir no concede nada (05:15098): hasta que la persona responda, no hay dato nuevo;
 * - lo respondido es **declarado por el asesorado**, no una medición ni un diagnóstico (09 §22.7);
 * - una solicitud sin responder no es un incumplimiento: se muestra como lo que es.
 *
 * Cada lectura pasa por el PDP, sin caché (08 §27.3): una solicitud que dejó de ser revelable simplemente deja de
 * listarse, y el detalle responde el mismo 404 neutral que lo inexistente (10-B10:407).
 */
import { COPY_FORMULARIOS, COPY_VINCULO, type RespuestaDeFormulario, type SolicitudDeFormulario } from '@be/domain';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { MigasDelAsesorado } from '../../../../components/migas';
import { Aviso } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { fecha } from '../../../../lib/formato';
import { SinEspacioProfesional, useEspacioProfesional } from '../../espacio-profesional';
import { VistaDePedido } from './pedir';

export const VISTAS = [
  { clave: 'solicitudes', texto: COPY_FORMULARIOS.solicitudes },
  { clave: 'pedir', texto: COPY_FORMULARIOS.pedirInformacion },
] as const;
export type Vista = (typeof VISTAS)[number]['clave'];

export interface ContextoDeFormularios {
  readonly token: string;
  readonly asesoradoId: string;
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
  readonly irA: (vista: Vista) => void;
}

const Contexto = createContext<ContextoDeFormularios | null>(null);

export function useFormularios(): ContextoDeFormularios {
  const c = useContext(Contexto);
  if (!c) throw new Error('useFormularios fuera de la pestaña Información');
  return c;
}

/** El 404 del profesional, con el mismo texto neutral de siempre (10-B10:407). */
function NoDisponible() {
  return (
    <Aviso tipo="info">
      <p>{COPY_VINCULO.recursoNoDisponible}</p>
      <p>
        <Link href="/pro">{COPY_VINCULO.volver}</Link>
      </p>
    </Aviso>
  );
}

export function EstadoDeLectura({ r, onReintentar, children }: { r: Resultado<unknown> | null; onReintentar: () => void; children: ReactNode }) {
  if (!r) return <Cargando />;
  if (!r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') return <NoDisponible />;
  if (!r.ok) return <ErrorConReintento onReintentar={onReintentar} />;
  return <>{children}</>;
}

export function Formularios() {
  const parametros = useSearchParams();
  const id = parametros.get('id') ?? '';
  const vistaPedida = parametros.get('vista');
  const vista: Vista = VISTAS.some((v) => v.clave === vistaPedida) ? (vistaPedida as Vista) : 'solicitudes';
  const ruta = usePathname();
  const router = useRouter();
  const { token, sesionPerdida, yo, cargarYo } = useEspacioProfesional(`/pro/advisees/forms?id=${id}`);

  const irA = useCallback((v: Vista) => router.replace(`${ruta}?id=${encodeURIComponent(id)}&vista=${v}`), [router, ruta, id]);
  const contexto = useMemo(() => (token ? { token, asesoradoId: id, sesionPerdida, irA } : null), [token, id, sesionPerdida, irA]);

  if (!token || !contexto) return <p className="nota">Redirigiendo a Iniciar sesión…</p>;
  if (yo.tipo === 'cargando') return <Cargando />;
  if (yo.tipo === 'error') return <ErrorConReintento onReintentar={cargarYo} />;
  if (yo.tipo === 'sin-espacio') return <SinEspacioProfesional />;

  return (
    <Contexto.Provider value={contexto}>
      <MigasDelAsesorado id={id} pestana={COPY_FORMULARIOS.pestana} />
      <h1>{COPY_FORMULARIOS.pestana}</h1>
      <nav className="pestanas" aria-label="Secciones de Información">
        <ul>
          {VISTAS.map((v) => (
            <li key={v.clave}>
              <Link href={`${ruta}?id=${encodeURIComponent(id)}&vista=${v.clave}`} aria-current={v.clave === vista ? 'page' : undefined} replace>
                {v.texto}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {vista === 'solicitudes' ? <VistaDeSolicitudes /> : null}
      {vista === 'pedir' ? <VistaDePedido /> : null}
    </Contexto.Provider>
  );
}

// ─── Vista «Solicitudes» (API-FRM-04 y 05) ──────────────────────────────────────────────────────

function VistaDeSolicitudes() {
  const { token, asesoradoId, sesionPerdida } = useFormularios();
  const [r, setR] = useState<Resultado<readonly SolicitudDeFormulario[]> | null>(null);
  const [abiertaId, setAbiertaId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setR(null);
    const lista = await api.listarSolicitudesDeFormulario(token, asesoradoId);
    if (sesionPerdida(lista)) return;
    setR(lista.ok ? { ok: true, datos: lista.datos.data } : (lista as Resultado<never>));
  }, [token, asesoradoId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <EstadoDeLectura r={r} onReintentar={cargar}>
      {r?.ok ? (
        <div className="secciones">
          <section className="seccion" aria-labelledby="titulo-solicitudes">
            <h2 id="titulo-solicitudes">{COPY_FORMULARIOS.solicitudes}</h2>
            {r.datos.length === 0 ? <p>{COPY_FORMULARIOS.sinSolicitudes}</p> : null}
            <ol className="historial">
              {r.datos.map((s) => (
                <li key={s.formRequestId}>
                  <p>
                    <strong>{s.templateName}</strong> <span className="insignia">{s.status === 'RESPONDED' ? COPY_FORMULARIOS.respondida : COPY_FORMULARIOS.pendiente}</span>
                  </p>
                  <p className="nota">
                    {COPY_FORMULARIOS.pedidoEl} {fecha(s.createdAt)} · {s.purpose}
                  </p>
                  <button type="button" className="boton boton--secundario" onClick={() => setAbiertaId(abiertaId === s.formRequestId ? null : s.formRequestId)}>
                    {abiertaId === s.formRequestId ? 'Cerrar' : 'Ver detalle'}
                  </button>
                  {abiertaId === s.formRequestId ? <Detalle solicitudId={s.formRequestId} /> : null}
                </li>
              ))}
            </ol>
          </section>
        </div>
      ) : null}
    </EstadoDeLectura>
  );
}

type DatosDeDetalle = { request: SolicitudDeFormulario; response: RespuestaDeFormulario | null; etiquetas: ReadonlyMap<string, string> };

function Detalle({ solicitudId }: { solicitudId: string }) {
  const { token, sesionPerdida } = useFormularios();
  const [r, setR] = useState<Resultado<DatosDeDetalle> | null>(null);

  const cargar = useCallback(async () => {
    setR(null);
    const detalle = await api.consultarSolicitudDeFormulario(token, solicitudId);
    if (sesionPerdida(detalle)) return;
    if (!detalle.ok) return setR(detalle as Resultado<never>);
    // La plantilla trae las etiquetas legibles: la pantalla nunca muestra códigos (10-B04:387-393).
    const { templateId, templateVersionId } = detalle.datos.data.request;
    const plantilla = await api.consultarVersionDePlantilla(token, templateId, templateVersionId);
    if (sesionPerdida(plantilla)) return;
    const etiquetas = new Map(plantilla.ok ? plantilla.datos.data.sections.flatMap((s) => s.fields).map((c) => [c.fieldCode, c.label]) : []);
    setR({ ok: true, datos: { ...detalle.datos.data, etiquetas } });
  }, [token, solicitudId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <EstadoDeLectura r={r} onReintentar={cargar}>
      {r?.ok ? (
        <div className="detalle">
          <p className="nota">
            {COPY_FORMULARIOS.campos}: {r.datos.request.requestedFieldCodes.map((c) => r.datos.etiquetas.get(c) ?? c).join(' · ')}
          </p>
          {r.datos.response ? <Respuesta respuesta={r.datos.response} etiquetas={r.datos.etiquetas} /> : <p>{COPY_FORMULARIOS.sinRespuestaTodavia}</p>}
        </div>
      ) : null}
    </EstadoDeLectura>
  );
}

/**
 * La respuesta, con su historia completa: el original queda a la vista aunque haya correcciones, y la vigente se
 * marca por relación, nunca por fecha (REG-06-16).
 */
function Respuesta({ respuesta, etiquetas }: { respuesta: RespuestaDeFormulario; etiquetas: ReadonlyMap<string, string> }) {
  const vigenteId = respuesta.effectiveView.kind === 'RECTIFIED' ? respuesta.effectiveView.rectificationId : null;
  return (
    <div className="secciones">
      <Aviso tipo="info">
        <p>{COPY_FORMULARIOS.noEsMedicion}</p>
      </Aviso>
      <section className="seccion">
        <h3>
          {COPY_FORMULARIOS.respuestaOriginal} {vigenteId === null ? <span className="insignia">{COPY_FORMULARIOS.vigente}</span> : null}
        </h3>
        <p className="nota">
          {COPY_FORMULARIOS.respondidoEl} {fecha(respuesta.submittedAt)}
        </p>
        <Campos answers={respuesta.original.answers} etiquetas={etiquetas} />
      </section>
      {respuesta.rectifications.map((c) => (
        <section className="seccion" key={c.rectificationId}>
          <h3>
            {COPY_FORMULARIOS.correccion} {c.rectificationId === vigenteId ? <span className="insignia">{COPY_FORMULARIOS.vigente}</span> : null}
          </h3>
          <p className="nota">
            {fecha(c.recordedAt)} · {c.reason}
          </p>
          <Campos answers={c.answers} etiquetas={etiquetas} />
        </section>
      ))}
    </div>
  );
}

function Campos({ answers, etiquetas }: { answers: RespuestaDeFormulario['original']['answers']; etiquetas: ReadonlyMap<string, string> }) {
  return (
    <dl className="datos">
      {answers.map((a) => (
        <div key={a.fieldCode}>
          <dt>{etiquetas.get(a.fieldCode) ?? a.fieldCode}</dt>
          <dd>
            {typeof a.value === 'boolean' ? (a.value ? 'Sí' : 'No') : String(a.value)}
            {a.unit ? ` ${a.unit}` : ''} <span className="insignia">{COPY_FORMULARIOS.declaradoPorLaPersona}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
