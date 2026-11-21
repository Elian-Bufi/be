'use client';

/**
 * El marco de una pestaña de área (WP-ESCRITORIO-AREAS, parte 0; F-01). Nutrición, Entrenamiento, Antropometría e
 * Información armaban cada una su encabezado: una miga, el título y las secciones. Ahora comparten esta pieza, que es el
 * marco de la ficha llevado a un área: una franja de lado a lado, pegada a la barra de marca, con lo que no cambia al
 * pasar de una sección a otra.
 *
 * RP-01 (WP-RECORRIDO-PLAN-PULIDO, DL-188): **la cabecera, en una sola franja** —la vuelta, el área, la persona, el
 * acceso y las acciones— y, debajo, las secciones.
 * - **El camino de vuelta, siempre, como un botón fantasma con su flecha:** «Ficha de {nombre}» si se llegó desde la
 *   ficha (`volver`, validado) o desde un enlace guardado; «Espacio profesional» si se llegó desde «Tu semana», «Te toca a
 *   vos» o el cajón (`origen=espacio`, WP-TABLERO-ALTA-GAMA TB-07): /pro vuelve con su lugar. El lector de pantalla oye
 *   «Volver a…». Otra pestaña de área puede pedir su propio camino (`vuelta`). Reemplaza a la miga: la barra de marca ya
 *   vuelve al Espacio profesional.
 * - **De quién es.** El título es el área; al lado, la referencia de la persona, que sale de sus vínculos. Sin alias
 *   (DL-040).
 * - **El acceso actual de esa área, en un solo chip** que no se parte en ningún zoom: «Nutrición: Activo · con acceso».
 *   El detalle (qué quiere decir, si falta algo) va en la pista del chip. Si una lectura o una escritura del área
 *   responde «no disponible», el marco vuelve a preguntar (los vínculos y lo que el resumen deja leer) y no sigue
 *   diciendo «Activo» sobre un contenido que ya no se puede ver. Nunca dice quién retiró el acceso ni por qué.
 * - **Sin «Actualizar» ni «Consultado a las» (decisión de Dirección): revalidar al recuperar el foco.** Al volver a la
 *   pestaña del navegador, el marco lee en silencio el acceso y el resumen del área y los compara con lo que había
 *   (`datos-nuevos.ts`). Si cambió algo que no escribió quien mira, aparece un aviso chico, «Hay datos nuevos · Ver»
 *   (`role="status"`). «Ver» vuelve a montar la sección (sus lecturas salen otra vez) y la pestaña queda la misma. Si hay
 *   algo escrito sin guardar, pasa antes por la guardia de la salida (`useAntesDeSalir`): un borrador con autoguardado se
 *   guarda primero; lo que no se puede guardar pregunta, y «Seguir editando» no pisa nada.
 * - **Las secciones,** con su ícono, y la ayuda corta de la que se está mirando («Cómo se lee esta vista», DL-146): lo
 *   que no se deduce mirando. La ayuda entera está en la Guía del espacio profesional.
 * Los estados (sin sesión, cargando, falla, sin espacio profesional, «no disponible») conservan el título y el camino de
 * vuelta.
 * - **«Contexto de <nombre>»** (WP-CONTEXTO-DE-LA-PERSONA, DL-179): el botón y el panel del contexto de la persona, en las
 *   tres áreas y en todas sus secciones (CTX-D01). Se abre con el botón o con Alt + C; al costado desde 1680 px, como cajón
 *   debajo (CTX-D03). Al cerrarse, el foco vuelve al botón. El marco pone el proveedor de citas: lo que se escribe en la
 *   sección (la evaluación, el objetivo) recibe lo que se cita desde el panel (CTX-D12).
 */
import { COPY_PISTAS, COPY_VINCULO, COPY, todasLasPaginas, type DashboardResponse, type NombreDeIcono, type Vinculo } from '@be/domain';
import { Enlace } from '../../../components/enlace';
import { useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BloqueDeEstado, Cargando, ErrorConReintento } from '../../../components/estados';
import { Aviso } from '../../../components/formulario';
import { Icono } from '../../../components/icono';
import { Pestanas } from '../../../components/pestanas';
import { Retrato } from '../../../components/retrato';
import { useAntesDeSalir, useCambiosParaSalir, type GuardarAntesDeSalir } from '../../../components/salida-segura';
import { api, type Resultado } from '../../../lib/api';
import { ICONO_DE_FALLA, motivoDeFalla, razonDeFalla } from '../../../lib/fallas';
import { useNombres } from '../../../lib/nombres-ocultos';
import { SinEspacioProfesional, type useEspacioProfesional } from '../espacio-profesional';
import { COPY_LUGAR } from '../lugar-del-espacio';
import { CLAVE_DEL_DOMINIO, estadoDelArea, pistaDelAcceso, type LecturaPorArea } from './acceso-por-area';
import { COPY_DATOS_NUEVOS, hayDatosNuevos, huellaDelArea, VOLVER_A_LEER_AL_VOLVER_MS } from './datos-nuevos';
import { hoyEn, periodoEnInstantes, restarDias } from './seguimiento/estado';
import { Pista } from '../../../components/pista';
import { EsperandoSesion } from '../../../lib/sesion';
import { COPY_CONTEXTO } from '@be/domain';
import { ProveedorDeCitas } from './contexto/citas';
import { PanelDeContexto } from './contexto/panel';
import { esAtajoDelPanel, guardarPreferencia, leerPreferencia, modoDelPanel, type ModoDelPanel, type Pestana } from './contexto/panel-de-contexto';

/** El alcance de los vínculos de un área (`scope.code`). */
export type AlcanceDelArea = 'NUTRICION' | 'ENTRENAMIENTO' | 'ANTROPOMETRIA';

/** Para saber qué deja leer el resumen y si hay datos nuevos alcanza con un período corto: no se muestra nada de él. */
const DIAS_DEL_RESUMEN = 7;

interface ContextoDelMarco {
  /** Una lectura o una escritura del área respondió «no disponible»: el marco vuelve a preguntar el acceso. */
  readonly avisarSinAcceso: () => void;
}

const Contexto = createContext<ContextoDelMarco | null>(null);
/**
 * La referencia de la persona, la que el marco muestra al lado del título. Va en un contexto aparte: el de arriba no
 * cambia cuando llega el nombre, y quien depende de él (`NoDisponibleEnElArea`) no vuelve a preguntar el acceso por eso.
 */
const ContextoDeLaPersona = createContext<string | null>(null);

/**
 * Avisa que hay algo escrito sin guardar, con el nombre de lo que es («el plan en preparación»). Mientras lo haya, salir
 * por un enlace interno o tocar «Ver» en «Hay datos nuevos» pasan por la guardia de la salida: guardan antes, si se puede,
 * o preguntan. Fuera de un área hace lo mismo.
 */
export function useCambiosSinGuardar(hay: boolean, que: string, guardarAntes: GuardarAntesDeSalir | null = null): void {
  // ED-02 (WP-EDITORES-PROFESIONAL): un enlace interno también pasa por la guardia (guarda antes de salir o pregunta), y
  // recargar o cerrar la pestaña con algo sin guardar pide confirmar (el navegador muestra su propio aviso; bloque 3 del
  // encargo de consolidación). Lo que nunca llegó al servidor no se guarda en el navegador.
  useCambiosParaSalir(hay, que, guardarAntes);
}

/**
 * De quién es el área («Persona · d21da6»), para decirlo donde el marco queda tapado: un cajón que se abre encima.
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
        <Enlace href="/pro">{COPY_VINCULO.volver}</Enlace>
      </p>
    </Aviso>
  );
}

/**
 * El resultado de la lectura de una sección: cargando; «no disponible», neutral; o una falla, dicha con su motivo y con
 * «Reintentar» (C-43). Una falla nunca se presenta como ausencia de datos. Si la sección sabe qué lectura falló (`que`:
 * «las versiones del plan», «el objetivo vigente»), lo dicen el título y el nombre del botón; si no, «esta vista».
 */
export function EstadoDeLecturaDelArea({ r, onReintentar, que = null, children }: { r: Resultado<unknown> | null; onReintentar: () => void; que?: string | null; children: ReactNode }) {
  if (!r) return <Cargando />;
  if (!r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') return <NoDisponibleEnElArea />;
  if (!r.ok) {
    const motivo = motivoDeFalla(r);
    return (
      <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[motivo]} titulo={que ? `No pudimos cargar ${que}` : COPY.errorDeVista.replace(/\.$/, '')} onReintentar={onReintentar} deQue={que ?? undefined}>
        {razonDeFalla(motivo)}
      </BloqueDeEstado>
    );
  }
  return <>{children}</>;
}

type Acceso = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; vinculos: readonly Vinculo[] };
/** Lo que el resumen deja leer: sin preguntar todavía, área por área, o nada (el asesorado entero no está disponible). */
type LecturaDelResumen = null | 'nada' | DashboardResponse['data']['domains'];
/** Qué hace una lectura con la huella: la toma como punto de partida, la compara con él, o no la toca. */
type ConLaHuella = 'base' | 'comparar' | null;

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
  ancho = false,
  ayuda = null,
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
  vistas: readonly { readonly clave: C; readonly texto: string; readonly icono?: NombreDeIcono; readonly pista?: string }[];
  vista: C;
  href: (clave: C) => string;
  /** Una escritura recibió el «no disponible»: el contenido del área se retira entero. */
  retirado?: boolean;
  /** Lo que el área tiene que hacer además cuando se ven los datos nuevos (dejar de dar el contenido por retirado). */
  onActualizar?: () => void;
  /** La sección usa todo el ancho del marco. Las que todavía no se recompusieron conservan el suyo. */
  ancho?: boolean;
  /** La ayuda corta de la sección que se mira («Cómo se lee esta vista», DL-146), si la tiene. */
  ayuda?: ReactNode;
  children: ReactNode;
}) {
  const { token, sesionPerdida, yo, cargarYo } = sesion;
  const yoId = yo.tipo === 'listo' ? yo.id : null;
  const [acceso, setAcceso] = useState<Acceso>({ tipo: 'cargando' });
  const [resumen, setResumen] = useState<LecturaDelResumen>(null);
  // Sube con «Ver» en «Hay datos nuevos»: la sección se monta de nuevo y sus lecturas salen otra vez.
  const [version, setVersion] = useState(0);
  const [hayNuevos, setHayNuevos] = useState(false);
  const generacion = useRef(0);
  const ultimaConsulta = useRef(0);
  const preguntandoElResumen = useRef(false);
  // La huella de lo que se ve (RP-01): la de la primera lectura o la del último «Ver».
  const huellaVista = useRef<string | null>(null);
  const antesDeSalir = useAntesDeSalir();

  const leer = useCallback(
    async (silencioso: boolean, conLaHuella: ConLaHuella) => {
      if (!token || !yoId) return;
      const esta = ++generacion.current;
      if (!silencioso) setAcceso({ tipo: 'cargando' });
      preguntandoElResumen.current = true;
      const hoy = hoyEn();
      const [lista, panel] = await Promise.all([
        // Todos los vínculos, no los primeros 20: la lista trae los de todos los estados y de los dos roles de la cuenta.
        todasLasPaginas((filtro) => api.consultarVinculos(token, { cursor: filtro.cursor })),
        id ? api.consultarDashboard(token, id, periodoEnInstantes({ preset: null, desde: restarDias(hoy, DIAS_DEL_RESUMEN - 1), hasta: hoy })) : Promise.resolve(null),
      ]);
      if (esta !== generacion.current) return;
      preguntandoElResumen.current = false;
      if (sesionPerdida(lista) || (panel && sesionPerdida(panel))) return;
      ultimaConsulta.current = Date.now();
      const vinculos = lista.ok ? lista.datos.data.filter((v) => v.professional.identityId === yoId && v.advisee.identityId === id) : null;
      setAcceso(vinculos ? { tipo: 'listo', vinculos } : { tipo: 'error' });
      // Una falla de red no es una revocación: solo cambia lo que una respuesta dice de forma explícita.
      const dominios = panel?.ok ? panel.datos.data.domains : null;
      if (dominios) setResumen(dominios);
      else if (panel && !panel.ok && panel.tipo === 'API' && panel.codigo === 'RESOURCE_NOT_FOUND') setResumen('nada');
      // RP-01: la huella, con lo que se leyó (si se leyó todo); una falla no se compara.
      if (!conLaHuella || !vinculos || !dominios) return;
      const sePuede: LecturaPorArea = (d) => dominios[CLAVE_DEL_DOMINIO[d]].available;
      const delArea = alcance ? vinculos.filter((v) => v.scope.code === alcance) : vinculos;
      const huella = huellaDelArea(alcance, delArea.map((v) => `${v.scope.code}:${JSON.stringify(estadoDelArea(v, sePuede))}`), dominios, yoId);
      if (conLaHuella === 'base' || huellaVista.current === null) huellaVista.current = huella;
      else if (hayDatosNuevos(huellaVista.current, huella)) setHayNuevos(true);
    },
    [token, yoId, id, alcance, sesionPerdida],
  );

  useEffect(() => {
    void leer(false, 'base');
  }, [leer]);

  // RP-01: al volver a la pestaña del navegador, se vuelve a leer en silencio: un evento, no un sondeo.
  useEffect(() => {
    const alVolver = () => {
      if (document.visibilityState === 'visible' && Date.now() - ultimaConsulta.current > VOLVER_A_LEER_AL_VOLVER_MS) void leer(true, 'comparar');
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => document.removeEventListener('visibilitychange', alVolver);
  }, [leer]);

  // «Ver»: la sección se vuelve a montar con lo de ahora, en la misma pestaña. Con algo sin guardar, pasa por la guardia.
  const verLoNuevo = useCallback(() => {
    antesDeSalir(() => {
      setHayNuevos(false);
      onActualizar?.();
      setVersion((v) => v + 1);
      void leer(true, 'base');
    });
  }, [antesDeSalir, leer, onActualizar]);

  const contexto = useMemo<ContextoDelMarco>(
    () => ({
      // Varias lecturas de la misma sección pueden decir «no disponible» a la vez: se pregunta una sola vez.
      avisarSinAcceso: () => {
        if (!preguntandoElResumen.current) void leer(true, null);
      },
    }),
    [leer],
  );
  const { delAsesorado } = useNombres();
  // ─── El panel del contexto (DL-179) ───────────────────────────────────────────────────────────
  // Información es de las tres áreas: ahí no hay un «Lo importante» de un área, y el panel no se ofrece.
  const conContexto = alcance !== null;
  const areaDelPanel = alcance ?? 'NUTRICION';
  const [panel, setPanel] = useState<{ abierto: boolean; pestana: Pestana }>({ abierto: false, pestana: 'importante' });
  const [modo, setModo] = useState<ModoDelPanel>('cajon');
  const botonDelPanel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // CTX-D18: lo que se recuerda es solo si estaba abierto y la pestaña, por área. Se lee después de montar.
    let almacen: Storage | null = null;
    try {
      almacen = window.localStorage;
    } catch {
      almacen = null;
    }
    setPanel(leerPreferencia(almacen, areaDelPanel));
    const medir = () => setModo(modoDelPanel(window.innerWidth));
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [areaDelPanel]);
  const cambiarPanel = useCallback(
    (cambio: Partial<{ abierto: boolean; pestana: Pestana }>) => {
      setPanel((p) => {
        const nuevo = { ...p, ...cambio };
        let almacen: Storage | null = null;
        try {
          almacen = window.localStorage;
        } catch {
          almacen = null;
        }
        guardarPreferencia(almacen, areaDelPanel, nuevo);
        return nuevo;
      });
    },
    [areaDelPanel],
  );
  // Revisión del PR: el foco vuelve a donde estaba al abrir (el campo de la evaluación, si se abrió con Alt + C mientras se
  // escribía) o, si eso ya no está, al botón. Y el panel toma el foco solo cuando lo abre la persona: reabierto por lo que se
  // recuerda (CTX-D18), al cargar la página, no se lo saca al editor.
  const focoAlAbrir = useRef<HTMLElement | null>(null);
  const [enfocarElPanel, setEnfocarElPanel] = useState(false);
  const abrirPanel = useCallback(() => {
    const activo = document.activeElement;
    focoAlAbrir.current = activo instanceof HTMLElement && activo !== document.body ? activo : null;
    setEnfocarElPanel(true);
    cambiarPanel({ abierto: true });
  }, [cambiarPanel]);
  const cerrarPanel = useCallback(() => {
    cambiarPanel({ abierto: false });
    const volver = focoAlAbrir.current;
    focoAlAbrir.current = null;
    window.setTimeout(() => (volver?.isConnected ? volver : botonDelPanel.current)?.focus(), 0);
  }, [cambiarPanel]);
  const panelAbierto = panel.abierto;
  useEffect(() => {
    // CTX-D04: Alt + C abre y cierra, también desde un campo.
    if (!conContexto) return;
    const alTeclear = (e: globalThis.KeyboardEvent) => {
      if (!esAtajoDelPanel(e)) return;
      e.preventDefault();
      if (panelAbierto) cerrarPanel();
      else abrirPanel();
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [conContexto, panelAbierto, cerrarPanel, abrirPanel]);
  // ED-02: el camino de vuelta pasa por la guardia de la salida (es un `Enlace`).
  // TB-07: se llegó desde el Espacio (una ficha de «Tu semana», un verbo de «Te toca a vos» o el cajón).
  const desdeElEspacio = useSearchParams().get('origen') === 'espacio';

  const listo = !!token && yo.tipo === 'listo';
  const vinculos = acceso.tipo === 'listo' ? acceso.vinculos : [];
  // TB-05: con «Ocultar nombres», la referencia neutral, y el monograma con el ícono.
  const nombre = vinculos[0] ? delAsesorado(vinculos[0].advisee) : null;
  const sePuedeLeer: LecturaPorArea = resumen === null ? null : resumen === 'nada' ? () => false : (dominio) => resumen[CLAVE_DEL_DOMINIO[dominio]].available;
  const delArea = alcance ? vinculos.filter((v) => v.scope.code === alcance) : vinculos;
  // RP-01: el camino de vuelta dice adónde va («Espacio profesional», «Ficha de Ana»); el lector oye «Volver a…».
  const fichaDe = nombre ? `Ficha de ${nombre}` : 'Ficha de la persona';
  const camino: { readonly href: string; readonly texto: string; readonly antes: string } = vuelta
    ? { href: vuelta.href, ...partirLaVuelta(vuelta.texto) }
    : retorno.href
      ? { href: retorno.href, texto: fichaDe, antes: 'Volver a la ' }
      : desdeElEspacio
        ? { href: '/pro', texto: COPY_LUGAR.volver, antes: 'Volver al ' }
        : { href: `/pro/advisees?id=${encodeURIComponent(id)}`, texto: fichaDe, antes: 'Volver a la ' };

  const conPanel = conContexto && listo && !!token && panel.abierto;
  return (
    <ProveedorDeCitas>
    <div className={conPanel && modo === 'costado' ? 'ficha ficha--con-contexto' : 'ficha'}>
      <div className="ficha__principal">
      <header className="marco-de-la-ficha marco-del-area" aria-labelledby="titulo-del-area">
        <div className="marco-de-la-ficha__ancho">
          <div className="marco-del-area__franja">
            <p className="retorno-a-la-ficha">
              <Enlace className="boton boton--fantasma boton--compacto marco-del-area__volver" href={camino.href}>
                <Icono nombre="volver" tamano={18} />
                <span className="visualmente-oculto">{camino.antes}</span>
                {camino.texto}
              </Enlace>
            </p>
            <h1 id="titulo-del-area">{titulo}</h1>
            {listo && nombre ? (
              <p className="marco-del-area__persona con-retrato">
                <Retrato nombre={nombre} />
                <span>{nombre}</span>
              </p>
            ) : null}
            {listo ? (
              <div className="marco-del-area__acceso" data-acceso-del-area>
                {acceso.tipo === 'cargando' ? <span className="nota">Leyendo el acceso…</span> : null}
                {acceso.tipo === 'error' ? (
                  <span className="chip-del-acceso chip-del-acceso--falla">
                    <Icono nombre="acceso" tamano={15} />
                    {COPY_VOLVER.accesoNoSeLeyo}{' '}
                    <button type="button" className="boton boton--enlace" onClick={() => void leer(false, 'base')}>
                      Reintentar<span className="visualmente-oculto"> la lectura del acceso</span>
                    </button>
                  </span>
                ) : null}
                {acceso.tipo === 'listo' ? <ChipsDelAcceso titulo={titulo} alcance={alcance} vinculos={delArea} sePuedeLeer={sePuedeLeer} /> : null}
              </div>
            ) : null}
            {listo ? (
              <div className="marco-del-area__acciones">
                {/* RP-01: la región está siempre; el aviso aparece adentro, y el lector de pantalla lo anuncia. */}
                <span className="marco-del-area__nuevos" role="status">
                  {hayNuevos ? (
                    <span className="aviso-de-datos-nuevos" data-datos-nuevos>
                      <Icono nombre="actualizar" tamano={15} />
                      {COPY_DATOS_NUEVOS.hay} ·{' '}
                      <button type="button" className="boton boton--enlace" onClick={verLoNuevo} title={COPY_DATOS_NUEVOS.verDetalle}>
                        {COPY_DATOS_NUEVOS.ver}
                      </button>
                    </span>
                  ) : null}
                </span>
                {conContexto ? (
                <button
                  ref={botonDelPanel}
                  type="button"
                  className={panel.abierto ? 'boton boton--compacto boton-del-contexto boton-del-contexto--abierto' : 'boton boton--compacto boton-del-contexto'}
                  aria-expanded={panel.abierto}
                  aria-keyshortcuts="Alt+C"
                  title={`${COPY_CONTEXTO.boton(nombre)} (${COPY_CONTEXTO.atajo})`}
                  onClick={() => (panel.abierto ? cerrarPanel() : abrirPanel())}
                >
                  <Icono nombre="persona" tamano={18} />
                  {COPY_CONTEXTO.boton(nombre)}
                  <kbd className="boton-del-contexto__atajo" aria-hidden="true">
                    {COPY_CONTEXTO.atajo}
                  </kbd>
                </button>
                ) : null}
              </div>
            ) : null}
          </div>
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
              {!token ? <EsperandoSesion /> : null}
              {token && yo.tipo === 'cargando' ? <Cargando /> : null}
              {token && yo.tipo === 'error' ? <ErrorConReintento onReintentar={cargarYo} /> : null}
              {token && yo.tipo === 'sin-espacio' ? <SinEspacioProfesional /> : null}
              {listo ? retirado ? <NoDisponibleEnElArea /> : children : null}
            </ContextoDeLaPersona.Provider>
          </Contexto.Provider>
        </div>
      </div>
      </div>
      {conPanel ? (
        <PanelDeContexto
          area={areaDelPanel}
          asesoradoId={id}
          token={token}
          nombre={nombre}
          modo={modo}
          pestana={panel.pestana}
          onPestana={(p) => cambiarPanel({ pestana: p })}
          onCerrar={cerrarPanel}
          enfocarAlAbrir={enfocarElPanel}
          sesionPerdida={sesionPerdida}
          actualizacion={version}
        />
      ) : null}
    </div>
    </ProveedorDeCitas>
  );
}

/** «Volver a Nutrición» como botón: «Nutrición» a la vista y «Volver a » para el lector de pantalla. */
const partirLaVuelta = (t: string): { readonly texto: string; readonly antes: string } => {
  const m = /^(Volver (?:a la |al |a ))(.+)$/.exec(t);
  return m ? { antes: m[1]!, texto: m[2]!.charAt(0).toUpperCase() + m[2]!.slice(1) } : { antes: '', texto: t };
};

const COPY_VOLVER = {
  accesoNoSeLeyo: 'No pudimos leer el acceso.',
} as const;

/**
 * RP-01: el acceso del área en un chip que no se parte: «Nutrición: Activo · con acceso». En Información (las tres áreas),
 * uno solo si todas están igual; si no, uno por área. El detalle y qué quiere decir van en la pista del chip.
 */
function ChipsDelAcceso({ titulo, alcance, vinculos, sePuedeLeer }: { titulo: string; alcance: AlcanceDelArea | null; vinculos: readonly Vinculo[]; sePuedeLeer: LecturaPorArea }) {
  // Sin un vínculo de esta área no hay acceso que decir: el mismo texto para lo ajeno y para lo inexistente.
  if (vinculos.length === 0) {
    return <Chip texto={`${alcance ? `${titulo}: ` : ''}${COPY_VINCULO.accesoNoDisponible}`} pista={COPY_PISTAS.acceso.noDisponible} />;
  }
  const orden = ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'];
  const filas = [...vinculos].sort((a, b) => orden.indexOf(a.scope.code) - orden.indexOf(b.scope.code)).map((v) => ({ v, e: estadoDelArea(v, sePuedeLeer) }));
  const primero = filas[0]!;
  const iguales = filas.every((f) => f.e.estado === primero.e.estado && f.e.detalle === primero.e.detalle);
  const grupos = iguales ? [{ nombres: filas.map((f) => f.v.scope.label), e: primero.e }] : filas.map((f) => ({ nombres: [f.v.scope.label], e: f.e }));
  return (
    <>
      {grupos.map((g) => {
        const nombres = g.nombres.length <= 1 ? (g.nombres[0] ?? '') : `${g.nombres.slice(0, -1).join(', ')} y ${g.nombres[g.nombres.length - 1]}`;
        const pista = [g.e.detalle, pistaDelAcceso(g.e)].filter(Boolean).join(' ');
        return <Chip key={nombres} texto={`${nombres}: ${estadoEnElChip(g.e)}`} pista={pista || null} />;
      })}
    </>
  );
}

/**
 * Revisión del PR: el chip no se parte, pero tampoco puede callar que el acceso no rige. Con el detalle en la pista,
 * «Nutrición: Vínculo activo» se leía como un acceso vigente cuando la persona todavía no autorizó o el acceso no está
 * disponible (antes, el detalle iba a la vista). El chip suma lo que falta, corto; el detalle entero sigue en la pista.
 */
export const estadoEnElChip = (e: { readonly estado: string; readonly detalle: string | null }): string =>
  e.estado === COPY_VINCULO.vinculoActivoAccesoPendiente && e.detalle
    ? `${e.estado} · ${e.detalle === COPY_VINCULO.accesoPendienteDelAsesorado ? 'acceso pendiente' : COPY_VINCULO.accesoNoDisponible.toLowerCase()}`
    : e.estado;

/**
 * Con pista, el chip recibe el foco (`tabIndex`): la pista aparece al llegarle con el teclado (DL-146) y el lector de
 * pantalla la lee como su descripción. Sin el foco, el detalle quedaba solo para el mouse.
 */
function Chip({ texto, pista }: { texto: string; pista: string | null }) {
  const chip = (
    <span className="chip-del-acceso" data-chip-del-acceso tabIndex={pista ? 0 : undefined}>
      <Icono nombre="acceso" tamano={15} />
      <span className="visualmente-oculto">Acceso actual: </span>
      {texto}
    </span>
  );
  return pista ? <Pista texto={`Acceso actual · ${texto}. ${pista}`}>{chip}</Pista> : chip;
}
