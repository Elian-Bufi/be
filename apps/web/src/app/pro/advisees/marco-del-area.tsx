'use client';

/**
 * El marco de una pestaña de área (WP-ESCRITORIO-AREAS, parte 0; F-01). Nutrición, Entrenamiento, Antropometría e
 * Información armaban cada una su encabezado: una miga, el título y las secciones. Ahora comparten esta pieza, que es el
 * marco de la ficha llevado a un área: una franja de lado a lado, pegada a la barra de marca, con lo que no cambia al
 * pasar de una sección a otra, en los mismos tres renglones.
 * - **El camino de vuelta, siempre.** «Volver a la ficha, donde estabas» si se llegó desde la ficha (`volver`, validado);
 *   «Volver a la ficha» si no (desde un pendiente o un enlace guardado). Reemplaza a la miga: la barra de marca ya vuelve
 *   al Espacio profesional.
 * - **De quién es.** El título es el área; al lado, la referencia de la persona, que sale de sus vínculos. Sin alias
 *   (DL-040).
 * - **El acceso actual de esa área,** con las palabras de BE (`estadoParaMostrar`). Si una lectura o una escritura del
 *   área responde «no disponible», el marco vuelve a preguntar (los vínculos y lo que el resumen deja leer) y no sigue
 *   diciendo «Activo» sobre un contenido que ya no se puede ver. Nunca dice quién retiró el acceso ni por qué.
 * - **«Actualizar», con la hora de la consulta.** Vuelve a leer todo lo que la sección muestra: la sección se monta de
 *   nuevo y cada una de sus lecturas sale otra vez. Si hay algo escrito sin guardar (lo avisa quien lo tiene, con
 *   `useCambiosSinGuardar`), antes pregunta: nada se pierde en silencio.
 * - **Las secciones,** con su ícono, y la ayuda de la que se está mirando, cuando la tenga.
 * Los estados (sin sesión, cargando, falla, sin espacio profesional, «no disponible») conservan el título y el camino de
 * vuelta.
 */
import { COPY, COPY_VINCULO, todasLasPaginas, type DashboardResponse, type NombreDeIcono, type Vinculo } from '@be/domain';
import Link from 'next/link';
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { DialogoDeConfirmacion } from '../../../components/dialogo';
import { BloqueDeEstado, Cargando, ErrorConReintento } from '../../../components/estados';
import { Aviso } from '../../../components/formulario';
import { Icono } from '../../../components/icono';
import { Pestanas } from '../../../components/pestanas';
import { api, type Resultado } from '../../../lib/api';
import { ICONO_DE_FALLA, motivoDeFalla, razonDeFalla } from '../../../lib/fallas';
import { horaDelDia } from '../../../lib/formato';
import { SinEspacioProfesional, type useEspacioProfesional } from '../espacio-profesional';
import { AccesoPorArea, CLAVE_DEL_DOMINIO, type LecturaPorArea } from './acceso-por-area';
import { hoyEn, periodoEnInstantes, restarDias } from './seguimiento/estado';

/** El alcance de los vínculos de un área (`scope.code`). */
export type AlcanceDelArea = 'NUTRICION' | 'ENTRENAMIENTO' | 'ANTROPOMETRIA';

/** Al volver a la pestaña del navegador, el acceso se vuelve a preguntar si pasó más que esto (como en la ficha). */
const VOLVER_A_PREGUNTAR_AL_VOLVER_MS = 60_000;
/** Para saber qué deja leer el resumen alcanza con un período corto: no se muestra nada de él. */
const DIAS_DEL_RESUMEN = 7;

interface ContextoDelMarco {
  /** Una lectura o una escritura del área respondió «no disponible»: el marco vuelve a preguntar el acceso. */
  readonly avisarSinAcceso: () => void;
  /** Anota (o retira, con `null`) algo escrito sin guardar: «Actualizar» pregunta antes de perderlo. */
  readonly anotarCambios: (clave: string, que: string | null) => void;
}

const Contexto = createContext<ContextoDelMarco | null>(null);
/**
 * La referencia de la persona, la que el marco muestra al lado del título. Va en un contexto aparte: el de arriba no
 * cambia cuando llega el nombre, y quien depende de él (`NoDisponibleEnElArea`) no vuelve a preguntar el acceso por eso.
 */
const ContextoDeLaPersona = createContext<string | null>(null);

/**
 * Avisa al marco que hay algo escrito sin guardar, con el nombre de lo que es («el plan en preparación»). Mientras lo
 * haya, «Actualizar» pregunta antes de volver a leer. Fuera de un área no hace nada.
 */
export function useCambiosSinGuardar(hay: boolean, que: string): void {
  const marco = useContext(Contexto);
  const clave = useId();
  useEffect(() => {
    if (!marco || !hay) return;
    marco.anotarCambios(clave, que);
    return () => marco.anotarCambios(clave, null);
  }, [marco, hay, que, clave]);
}

/**
 * De quién es el área («Asesorado · d21da6»), para decirlo donde el marco queda tapado: un cajón que se abre encima.
 * `null` mientras el marco no la leyó, o fuera de un área.
 */
export function usePersonaDelArea(): string | null {
  return useContext(ContextoDeLaPersona);
}

/**
 * Para una escritura que respondió «no disponible» y no retira la sección entera (Información es de tres áreas, y el
 * pedido va a una sola): el marco vuelve a preguntar el acceso, como con cualquier «no disponible» (F-09). Fuera de un
 * área no hace nada.
 */
export function useAvisarSinAcceso(): () => void {
  const marco = useContext(Contexto);
  return useCallback(() => marco?.avisarSinAcceso(), [marco]);
}

/**
 * El «no disponible» del profesional, con el texto neutral de siempre (10-B10:407): el mismo para lo inexistente, lo
 * ajeno, lo de otro alcance y lo revocado. Al mostrarse, le avisa al marco para que vuelva a preguntar el acceso.
 */
export function NoDisponibleEnElArea() {
  const marco = useContext(Contexto);
  useEffect(() => {
    marco?.avisarSinAcceso();
  }, [marco]);
  return (
    <Aviso tipo="info">
      <p>{COPY_VINCULO.recursoNoDisponible}</p>
      <p>
        <Link href="/pro">{COPY_VINCULO.volver}</Link>
      </p>
    </Aviso>
  );
}

/**
 * El resultado de la lectura de una sección: cargando; «no disponible», neutral; o una falla, dicha con su motivo y con
 * «Reintentar» (C-43). Una falla nunca se presenta como ausencia de datos.
 */
export function EstadoDeLecturaDelArea({ r, onReintentar, children }: { r: Resultado<unknown> | null; onReintentar: () => void; children: ReactNode }) {
  if (!r) return <Cargando />;
  if (!r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') return <NoDisponibleEnElArea />;
  if (!r.ok) {
    const motivo = motivoDeFalla(r);
    return (
      <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[motivo]} titulo={COPY.errorDeVista.replace(/\.$/, '')} onReintentar={onReintentar}>
        {razonDeFalla(motivo)}
      </BloqueDeEstado>
    );
  }
  return <>{children}</>;
}

type Acceso = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; vinculos: readonly Vinculo[] };
/** Lo que el resumen deja leer: sin preguntar todavía, área por área, o nada (el asesorado entero no está disponible). */
type LecturaDelResumen = null | 'nada' | DashboardResponse['data']['domains'];

export function MarcoDelArea<C extends string>({
  alcance,
  titulo,
  etiqueta,
  id,
  sesion,
  retorno,
  vuelta = null,
  vistas,
  vista,
  href,
  retirado = false,
  onActualizar,
  ayuda = null,
  ancho = false,
  children,
}: {
  /** El alcance del área, o `null` si la pestaña es de las tres (Información). */
  alcance: AlcanceDelArea | null;
  titulo: string;
  /** El nombre de la navegación de secciones, para el lector de pantalla: «Secciones de Nutrición». */
  etiqueta: string;
  /** El asesorado. */
  id: string;
  sesion: ReturnType<typeof useEspacioProfesional>;
  /** El retorno a la ficha, validado (`useRetornoALaFicha`). */
  retorno: { readonly href: string | null };
  /** Otro camino de vuelta que el de la ficha, cuando se llegó desde otra pestaña de área. */
  vuelta?: { readonly href: string; readonly texto: string } | null;
  vistas: readonly { readonly clave: C; readonly texto: string; readonly icono?: NombreDeIcono }[];
  vista: C;
  href: (clave: C) => string;
  /** Una escritura recibió el «no disponible»: el contenido del área se retira entero. */
  retirado?: boolean;
  /** Lo que el área tiene que hacer además cuando se pide «Actualizar» (dejar de dar el contenido por retirado). */
  onActualizar?: () => void;
  /** La ayuda de la sección que se mira («Cómo se lee esta vista»), si ya la tiene. */
  ayuda?: ReactNode;
  /** La sección usa todo el ancho del marco. Las que todavía no se recompusieron conservan el suyo. */
  ancho?: boolean;
  children: ReactNode;
}) {
  const { token, sesionPerdida, yo, cargarYo } = sesion;
  const yoId = yo.tipo === 'listo' ? yo.id : null;
  const [acceso, setAcceso] = useState<Acceso>({ tipo: 'cargando' });
  const [resumen, setResumen] = useState<LecturaDelResumen>(null);
  const [consultadoEn, setConsultadoEn] = useState<Date | null>(null);
  // Sube con «Actualizar»: la sección se monta de nuevo y sus lecturas salen otra vez.
  const [version, setVersion] = useState(0);
  const [porConfirmar, setPorConfirmar] = useState<readonly string[] | null>(null);
  const generacion = useRef(0);
  const ultimaConsulta = useRef(0);
  const sePreguntoElResumen = useRef(false);
  const preguntandoElResumen = useRef(false);
  const sinGuardar = useRef(new Map<string, string>());

  const leer = useCallback(
    async (silencioso: boolean, conResumen: boolean) => {
      if (!token || !yoId) return;
      const esta = ++generacion.current;
      if (!silencioso) setAcceso({ tipo: 'cargando' });
      if (conResumen) sePreguntoElResumen.current = true;
      preguntandoElResumen.current = conResumen;
      const hoy = hoyEn();
      const [lista, panel] = await Promise.all([
        // Todos los vínculos, no los primeros 20: la lista trae los de todos los estados y de los dos roles de la cuenta.
        todasLasPaginas((filtro) => api.consultarVinculos(token, { cursor: filtro.cursor })),
        conResumen && id ? api.consultarDashboard(token, id, periodoEnInstantes({ preset: null, desde: restarDias(hoy, DIAS_DEL_RESUMEN - 1), hasta: hoy })) : Promise.resolve(null),
      ]);
      if (esta !== generacion.current) return;
      preguntandoElResumen.current = false;
      if (sesionPerdida(lista) || (panel && sesionPerdida(panel))) return;
      ultimaConsulta.current = Date.now();
      setConsultadoEn(new Date());
      setAcceso(lista.ok ? { tipo: 'listo', vinculos: lista.datos.data.filter((v) => v.professional.identityId === yoId && v.advisee.identityId === id) } : { tipo: 'error' });
      // Una falla de red no es una revocación: solo cambia lo que una respuesta dice de forma explícita.
      if (panel?.ok) setResumen(panel.datos.data.domains);
      else if (panel && panel.tipo === 'API' && panel.codigo === 'RESOURCE_NOT_FOUND') setResumen('nada');
    },
    [token, yoId, id, sesionPerdida],
  );

  useEffect(() => {
    void leer(false, false);
  }, [leer]);

  // Al volver a la pestaña del navegador después de un rato, el acceso se vuelve a preguntar: un evento, no un sondeo.
  useEffect(() => {
    const alVolver = () => {
      if (document.visibilityState === 'visible' && Date.now() - ultimaConsulta.current > VOLVER_A_PREGUNTAR_AL_VOLVER_MS) void leer(true, sePreguntoElResumen.current);
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => document.removeEventListener('visibilitychange', alVolver);
  }, [leer]);

  const actualizarYa = useCallback(() => {
    setPorConfirmar(null);
    sinGuardar.current.clear();
    onActualizar?.();
    setVersion((v) => v + 1);
    void leer(false, sePreguntoElResumen.current);
  }, [leer, onActualizar]);
  const actualizar = () => {
    const pendientes = [...new Set(sinGuardar.current.values())];
    if (pendientes.length > 0) setPorConfirmar(pendientes);
    else actualizarYa();
  };

  const contexto = useMemo<ContextoDelMarco>(
    () => ({
      // Varias lecturas de la misma sección pueden decir «no disponible» a la vez: se pregunta una sola vez.
      avisarSinAcceso: () => {
        if (!preguntandoElResumen.current) void leer(true, true);
      },
      anotarCambios: (clave, que) => {
        if (que === null) sinGuardar.current.delete(clave);
        else sinGuardar.current.set(clave, que);
      },
    }),
    [leer],
  );

  const listo = !!token && yo.tipo === 'listo';
  const vinculos = acceso.tipo === 'listo' ? acceso.vinculos : [];
  const nombre = vinculos[0]?.advisee.displayName ?? null;
  const sePuedeLeer: LecturaPorArea = resumen === null ? null : resumen === 'nada' ? () => false : (dominio) => resumen[CLAVE_DEL_DOMINIO[dominio]].available;
  const delArea = alcance ? vinculos.filter((v) => v.scope.code === alcance) : vinculos;
  const camino = vuelta ?? (retorno.href ? { href: retorno.href, texto: 'Volver a la ficha, donde estabas' } : { href: `/pro/advisees?id=${encodeURIComponent(id)}`, texto: 'Volver a la ficha' });

  return (
    <div className="ficha">
      <header className="marco-de-la-ficha marco-del-area" aria-labelledby="titulo-del-area">
        <div className="marco-de-la-ficha__ancho">
          <div className="marco-de-la-ficha__persona">
            <p className="retorno-a-la-ficha">
              <Link href={camino.href}>
                <Icono nombre="volver" tamano={18} />
                {camino.texto}
              </Link>
            </p>
            <h1 id="titulo-del-area">{titulo}</h1>
            {listo && nombre ? <p className="marco-del-area__persona">{nombre}</p> : null}
            {listo ? (
              <div className="ficha__consulta">
                <button type="button" className="boton boton--quieto boton--compacto" onClick={actualizar} disabled={acceso.tipo === 'cargando'}>
                  <Icono nombre="actualizar" tamano={18} />
                  Actualizar
                </button>
                {consultadoEn ? <span className="nota">Consultado a las {horaDelDia(consultadoEn)}</span> : null}
              </div>
            ) : null}
          </div>
          {listo ? (
            <div className="marco-de-la-ficha__estado">
              <div className="ficha__acceso">
                <p className="ficha__acceso-titulo">
                  <Icono nombre="acceso" tamano={18} />
                  <strong>Acceso actual</strong>
                </p>
                {acceso.tipo === 'cargando' ? <Cargando /> : null}
                {acceso.tipo === 'error' ? <ErrorConReintento onReintentar={() => void leer(false, sePreguntoElResumen.current)} /> : null}
                {acceso.tipo === 'listo' && delArea.length > 0 ? <AccesoPorArea vinculos={delArea} sePuedeLeer={sePuedeLeer} /> : null}
                {/* Sin un vínculo de esta área no hay acceso que decir: el mismo texto para lo ajeno y para lo inexistente. */}
                {acceso.tipo === 'listo' && delArea.length === 0 ? (
                  <p className="ficha__acceso-areas">
                    {alcance ? <><strong>{titulo}</strong>: </> : null}
                    <span className="insignia">{COPY_VINCULO.accesoNoDisponible}</span>
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
          {listo && !retirado ? (
            <div className="marco-de-la-ficha__vistas">
              <Pestanas etiqueta={etiqueta} vistas={vistas} actual={vista} href={href} />
              {ayuda ? <div className="marco-de-la-ficha__derecha">{ayuda}</div> : null}
            </div>
          ) : null}
        </div>
      </header>
      <div className="ficha__cuerpo">
        <div className={ancho ? 'seccion-del-area seccion-del-area--ancha' : 'seccion-del-area'} key={version}>
          <Contexto.Provider value={contexto}>
            <ContextoDeLaPersona.Provider value={nombre}>
              {!token ? <p className="nota">Redirigiendo a Iniciar sesión…</p> : null}
              {token && yo.tipo === 'cargando' ? <Cargando /> : null}
              {token && yo.tipo === 'error' ? <ErrorConReintento onReintentar={cargarYo} /> : null}
              {token && yo.tipo === 'sin-espacio' ? <SinEspacioProfesional /> : null}
              {listo ? retirado ? <NoDisponibleEnElArea /> : children : null}
            </ContextoDeLaPersona.Provider>
          </Contexto.Provider>
        </div>
      </div>
      <DialogoDeConfirmacion
        abierto={porConfirmar !== null}
        titulo="Tenés cambios sin guardar"
        textoVolver="Seguir editando"
        textoConfirmar="Actualizar y descartar"
        textoEnviando="Actualizando…"
        enviando={false}
        onVolver={() => setPorConfirmar(null)}
        onConfirmar={actualizarYa}
      >
        <p>
          «Actualizar» vuelve a leer todo lo que muestra esta sección. Si seguís, se pierde lo que escribiste y no guardaste
          {porConfirmar && porConfirmar.length > 0 ? ` en ${enumerar(porConfirmar)}` : ''}.
        </p>
      </DialogoDeConfirmacion>
    </div>
  );
}

const enumerar = (nombres: readonly string[]): string => (nombres.length <= 1 ? (nombres[0] ?? '') : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`);
