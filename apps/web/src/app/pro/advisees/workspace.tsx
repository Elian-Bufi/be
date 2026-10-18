'use client';

/**
 * Website `/pro/advisees?id=…` — la ficha del asesorado (10-B01:746 como query por el export estático; DL-041):
 * - Encabezado con cada vínculo por alcance y su estado mínimo (10-B04 §28-§29; H10-04-04). El profesional ve
 *   «Acceso no disponible» sin la causa: nunca `B2=true` ni `PDP=DENY`.
 * - «Resumen» (API-DSH-03 mínimo, DL-031): cada lectura pasa por el PDP, sin caché (T-PDP-1). Los dominios no disponibles
 *   no se listan: se avisa la vista parcial, sin «Datos ocultos: …» (10-B04 §41).
 * - 404 = no hay nada que mostrar: el mismo texto neutral para inexistente, ajeno, revocado o finalizado
 *   (UC-I02 E05; 10-B10:407). Es el estado que se ve cuando el asesorado revoca: el corte no espera a la sesión.
 * «Actualizar» vuelve a preguntar a la API y muestra la hora de la última consulta.
 *
 * WP-DASHBOARD-PROFESIONAL: la ficha tiene tres vistas —Resumen, Línea de tiempo y Analizar— con el mismo período,
 * todo en la URL (`vista=`, `p=` o `desde`/`hasta`, y el estado de cada vista).
 *
 * WP-DASHBOARD-COMPRENSION (encargo del 2026-10-09):
 * - **Ficha del asesorado:** el nombre visible es el título; la identidad técnica ocupa una línea.
 * - **Acceso actual (§3.A):** el estado por área sale de los vínculos y de lo que el resumen deja leer: si el PDP ya no
 *   deja leer un área, el encabezado no la muestra «Activo». Cuando una lectura dice «no disponible» para un área que el
 *   encabezado mostraba activa, se vuelve a preguntar el acceso sin vaciar la pantalla, y las lecturas de la ficha se
 *   repiten con el acceso nuevo. Una falla de red no es una revocación (solo avisan las respuestas explícitas). Al volver
 *   a la pestaña del navegador después de un rato, el acceso se vuelve a preguntar: un evento, no un sondeo. Nunca se
 *   dice quién retiró el acceso ni por qué.
 *
 * WP-ESCRITORIO-AMABLE (parte 1): **el marco de la ficha.** Lo que no cambia al pasar de una vista a otra va en una
 * franja de lado a lado, pegada a la barra de marca, en tres renglones: quién es, con «Pedir información» y «Actualizar»
 * con la hora; el acceso actual; y las tres vistas con el período. Siempre se sabe dónde se está sin desplazarse. La miga se retiró: la barra
 * de marca ya vuelve al Espacio profesional.
 *
 * WP-NOTAS-DE-COORDINACION (DL-140): «Nota de coordinación», al lado de «Pedir información», abre el diálogo para escribirle
 * a los otros profesionales que acompañan a la persona (UC-E07: se coordina desde el tablero). El diálogo es uno para toda la
 * ficha: lo abren también el Resumen y el detalle de una nota propia, para corregirla.
 */
import { COPY_NOTAS_DE_COORDINACION, COPY_VINCULO, referenciaCorta, referenciaNeutral, todasLasPaginas, type DominioDeAnalisis, type Vinculo } from '@be/domain';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Cargando, ErrorConReintento } from '../../../components/estados';
import { Aviso } from '../../../components/formulario';
import { Icono } from '../../../components/icono';
import { api } from '../../../lib/api';
import { horaDelDia } from '../../../lib/formato';
import { SinEspacioProfesional, useEspacioProfesional } from '../espacio-profesional';
import { AccesoPorArea, CLAVE_DEL_DOMINIO, DOMINIO_DEL_ALCANCE, estadoDelArea, type LecturaPorArea } from './acceso-por-area';
import { DialogoDeNota } from './nota-de-coordinacion';
import { PestanasDelSeguimiento, SelectorDePeriodo } from './seguimiento/barra';
import { motivoDeFalla, ProveedorDelSeguimiento, type PanelDelResumen, type PedidoDeNota } from './seguimiento/contexto';
import { conRetorno, leerPeriodo, leerVista, periodoEnInstantes, valorDeRetorno } from './seguimiento/estado';
import { LineaDeTiempo } from './seguimiento/linea-de-tiempo';
import { ResumenDelSeguimiento } from './seguimiento/resumen';

const Analizar = dynamic(() => import('./seguimiento/analizar').then((m) => m.Analizar), { ssr: false, loading: () => <Cargando /> });

type Encabezado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; vinculos: readonly Vinculo[] };

/** Lo que el resumen deja leer, área por área. Sin resumen todavía, vale el estado de cada vínculo. */
const lecturaSegun = (panel: PanelDelResumen): LecturaPorArea => (panel.tipo === 'listo' ? (dominio) => panel.datos.domains[CLAVE_DEL_DOMINIO[dominio]].available : null);

/** Cada cuánto, como mucho, se vuelve a preguntar el acceso por un aviso de «no disponible». */
const ESPERA_ENTRE_REVALIDACIONES_MS = 5_000;
/** Al volver a la pestaña del navegador, se vuelve a preguntar si pasó más que esto. */
const VOLVER_A_PREGUNTAR_AL_VOLVER_MS = 60_000;

export function Workspace() {
  const parametros = useSearchParams();
  const id = parametros.get('id') ?? '';
  const vista = leerVista(parametros.get('vista'));
  const claveDelPeriodo = `${parametros.get('p') ?? ''}|${parametros.get('desde') ?? ''}|${parametros.get('hasta') ?? ''}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const periodo = useMemo(() => leerPeriodo(new URLSearchParams(parametros.toString())), [claveDelPeriodo]);
  const { token, sesionPerdida, yo, cargarYo } = useEspacioProfesional(`/pro/advisees?id=${id}`);
  const [panel, setPanel] = useState<PanelDelResumen>({ tipo: 'cargando' });
  const [encabezado, setEncabezado] = useState<Encabezado>({ tipo: 'cargando' });
  const [consultadoEn, setConsultadoEn] = useState<Date | null>(null);
  // Sube cuando cambia lo que se puede leer, y cuando se pide «Actualizar»: las lecturas de la ficha se repiten.
  const [versionDeAcceso, setVersionDeAcceso] = useState(0);
  const generacion = useRef(0);
  const ultimaConsulta = useRef(0);
  const yoId = yo.tipo === 'listo' ? yo.id : null;
  // DL-140: el diálogo de la nota de coordinación es uno solo para toda la ficha; `null`, cerrado.
  const [nota, setNota] = useState<PedidoDeNota | null>(null);
  const abrirNota = useCallback((pedido: PedidoDeNota) => setNota(pedido), []);
  const cerrarNota = useCallback(() => setNota(null), []);
  // Una nota enviada aparece en la línea de tiempo y en el Resumen: se repiten las lecturas de la vista abierta.
  const notaEnviada = useCallback(() => setVersionDeAcceso((v) => v + 1), []);

  const leer = useCallback(
    async (silencioso: boolean) => {
      if (!token || !yoId) return;
      const esta = ++generacion.current;
      if (!silencioso) {
        setPanel({ tipo: 'cargando' });
        setEncabezado({ tipo: 'cargando' });
      }
      const [respuesta, lista] = await Promise.all([
        id ? api.consultarDashboard(token, id, periodoEnInstantes(periodo)) : Promise.resolve(null),
        // Todos los vínculos, no los primeros 20: la lista trae los de todos los estados y de los dos roles de la cuenta.
        todasLasPaginas((filtro) => api.consultarVinculos(token, { cursor: filtro.cursor })),
      ]);
      if (esta !== generacion.current) return;
      if ((respuesta && sesionPerdida(respuesta)) || sesionPerdida(lista)) return;
      ultimaConsulta.current = Date.now();
      setConsultadoEn(new Date());
      const nuevo: PanelDelResumen =
        !respuesta || (!respuesta.ok && respuesta.tipo === 'API' && respuesta.codigo === 'RESOURCE_NOT_FOUND')
          ? { tipo: 'no-disponible' }
          : respuesta.ok
            ? { tipo: 'listo', datos: respuesta.datos.data }
            : { tipo: 'error', motivo: motivoDeFalla(respuesta) };
      setPanel((anterior) => {
        // Si cambió lo que se puede leer, se repiten las lecturas de la ficha (sin esperar a que alguien recargue).
        if (silencioso && huellaDeAcceso(anterior) !== huellaDeAcceso(nuevo)) setVersionDeAcceso((v) => v + 1);
        return nuevo;
      });
      setEncabezado(lista.ok ? { tipo: 'listo', vinculos: lista.datos.data.filter((v) => v.professional.identityId === yoId && v.advisee.identityId === id) } : { tipo: 'error' });
    },
    [token, yoId, id, sesionPerdida, periodo],
  );
  const consultar = useCallback(() => void leer(false), [leer]);
  // «Actualizar» vuelve a preguntar todo lo que la ficha muestra: el acceso y el resumen por área (`consultar`) y,
  // subiendo la versión, las lecturas de la vista abierta. Antes se repetían solo las que se desmontaban mientras el
  // resumen cargaba: la cobertura del período y lo que hay disponible quedaban con los datos de la consulta anterior,
  // debajo de una hora nueva.
  const actualizar = useCallback(() => {
    setVersionDeAcceso((v) => v + 1);
    consultar();
  }, [consultar]);

  useEffect(() => {
    consultar();
  }, [consultar]);

  // Las áreas que el encabezado muestra activas: un aviso de «no disponible» de otra área no repite nada.
  const activas = useMemo(() => dominiosActivos(encabezado, panel), [encabezado, panel]);
  const activasRef = useRef(activas);
  activasRef.current = activas;
  const programada = useRef<number | null>(null);
  const avisarSinAcceso = useCallback(
    (dominio: DominioDeAnalisis | null) => {
      if (dominio !== null && !activasRef.current.has(dominio)) return;
      if (programada.current !== null) return;
      const espera = Math.max(0, ESPERA_ENTRE_REVALIDACIONES_MS - (Date.now() - ultimaConsulta.current));
      programada.current = window.setTimeout(() => {
        programada.current = null;
        void leer(true);
      }, espera);
    },
    [leer],
  );
  useEffect(() => () => {
    if (programada.current !== null) window.clearTimeout(programada.current);
  }, []);
  useEffect(() => {
    const alVolver = () => {
      if (document.visibilityState === 'visible' && Date.now() - ultimaConsulta.current > VOLVER_A_PREGUNTAR_AL_VOLVER_MS) void leer(true);
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => document.removeEventListener('visibilitychange', alVolver);
  }, [leer]);

  if (!token) return <p className="nota ficha__cuerpo">Redirigiendo a Iniciar sesión…</p>;
  if (yo.tipo === 'cargando') return <div className="ficha__cuerpo"><Cargando /></div>;
  if (yo.tipo === 'error') return <div className="ficha__cuerpo"><ErrorConReintento onReintentar={cargarYo} /></div>;
  if (yo.tipo === 'sin-espacio') return <div className="ficha__cuerpo"><SinEspacioProfesional /></div>;

  const nombre = panel.tipo === 'listo' ? panel.datos.advisee.displayName : encabezado.tipo === 'listo' && encabezado.vinculos[0] ? encabezado.vinculos[0].advisee.displayName : null;
  const disponible = panel.tipo !== 'no-disponible';

  /**
   * El marco (B10-01): quién es, el acceso actual por área y cuándo se consultó; nada de ficha clínica. Con la ficha
   * disponible suma «Pedir información» y, debajo, las tres vistas y el período, que necesitan el contexto de la ficha.
   */
  const marco = (vistas: ReactNode) => (
    <header className="marco-de-la-ficha" aria-labelledby="titulo-asesorado">
      <div className="marco-de-la-ficha__ancho">
        <div className="marco-de-la-ficha__persona">
          <div className="marco-de-la-ficha__nombre">
            <h1 id="titulo-asesorado">{nombre ?? 'Asesorado'}</h1>
            {/* Con un nombre visible (DL-040, 2026-10-15), la referencia va al lado, chica, como en la maqueta 01: distingue a
                dos personas que se llaman igual. Sin nombre, el título ya es la referencia. */}
            {nombre && !nombre.endsWith(referenciaCorta(id)) ? <span className="marco-de-la-ficha__referencia">{referenciaNeutral(id)}</span> : null}
          </div>
          {disponible ? (
            // Vuelve a esta misma vista de la ficha al enviar o al salir sin enviar (retorno validado).
            <Link className="boton boton--quieto boton--compacto" href={conRetorno(`/pro/advisees/forms?id=${encodeURIComponent(id)}&vista=pedir`, valorDeRetorno(new URLSearchParams(parametros.toString())))}>
              <Icono nombre="solicitar" tamano={18} />
              Pedir información
            </Link>
          ) : null}
          {/* DL-140 (UC-E07: «se coordina desde el tablero»): una nota para los otros profesionales de la persona. */}
          {disponible ? (
            <button type="button" className="boton boton--quieto boton--compacto" onClick={() => abrirNota({})}>
              <Icono nombre="texto" tamano={18} />
              {COPY_NOTAS_DE_COORDINACION.escribirCorto}
            </button>
          ) : null}
          {/* «Actualizar» vuelve a preguntar todo lo de la ficha, no solo el acceso: va con la hora, a la derecha. */}
          <div className="ficha__consulta">
            <button type="button" className="boton boton--quieto boton--compacto" onClick={actualizar} disabled={panel.tipo === 'cargando'}>
              <Icono nombre="actualizar" tamano={18} />
              Actualizar
            </button>
            {consultadoEn ? <span className="nota">Consultado a las {horaDelDia(consultadoEn)}</span> : null}
          </div>
        </div>
        <div className="marco-de-la-ficha__estado">
          <div className="ficha__acceso">
            <p className="ficha__acceso-titulo">
              <Icono nombre="acceso" tamano={18} />
              <strong>Acceso actual</strong>
            </p>
            {encabezado.tipo === 'cargando' ? <Cargando /> : null}
            {encabezado.tipo === 'error' ? <ErrorConReintento onReintentar={consultar} /> : null}
            {encabezado.tipo === 'listo' && encabezado.vinculos.length > 0 ? <AccesoPorArea vinculos={encabezado.vinculos} sePuedeLeer={lecturaSegun(panel)} /> : null}
          </div>
          {/* Un aviso único, sin listar qué falta ni por qué (B10-08 §8.4; 10-B04 §41). */}
          {/* «Vista parcial» cuando falta un área del profesional (pausada o sin acceso), no por las áreas en las que no
              trabaja con esta persona (DL-145): esas no son una parte que le falte. */}
          {panel.tipo === 'listo' && panel.datos.partialView && encabezado.tipo === 'listo' && encabezado.vinculos.some((v) => v.relationshipState !== 'FINALIZADO' && v.accessMode !== 'CONTEXTUAL') ? (
            <p className="nota marco-de-la-ficha__aviso">
              <Icono nombre="oculto" tamano={18} />
              {COPY_VINCULO.vistaParcial}
            </p>
          ) : null}
        </div>
        {vistas}
      </div>
    </header>
  );

  if (!disponible) {
    // Con un vínculo vigente a la vista (el encabezado ya lo muestra), «no encontramos un recurso» confundía: se dice que
    // por ahora no hay acceso, sin decir por qué (UC-I02 E05). Sin vínculo vigente, el texto neutral de siempre.
    const conVinculoVigente = encabezado.tipo === 'listo' && encabezado.vinculos.some((v) => v.relationshipState === 'ACEPTADO');
    return (
      <div className="ficha">
        {marco(null)}
        <div className="ficha__cuerpo">
          <Aviso tipo="info">
            <p>{conVinculoVigente ? COPY_VINCULO.sinAccesoPorAhora : COPY_VINCULO.recursoNoDisponible}</p>
            <p>
              <Link href="/pro">{COPY_VINCULO.volver}</Link>
            </p>
          </Aviso>
        </div>
      </div>
    );
  }

  return (
    <div className="ficha">
      <ProveedorDelSeguimiento
        token={token}
        asesoradoId={id}
        nombreDelAsesorado={nombre}
        sesionPerdida={sesionPerdida}
        avisarSinAcceso={avisarSinAcceso}
        panel={panel}
        recargarPanel={consultar}
        versionDeAcceso={versionDeAcceso}
        yoId={yo.id}
        abrirNota={abrirNota}
      >
        {marco(
          <div className="marco-de-la-ficha__vistas">
            <PestanasDelSeguimiento actual={vista} />
            <div className="marco-de-la-ficha__derecha">
              <SelectorDePeriodo />
            </div>
          </div>,
        )}
        <div className="ficha__cuerpo secciones">
          {vista === 'resumen' ? <ResumenDelSeguimiento /> : null}
          {vista === 'linea' ? <LineaDeTiempo /> : null}
          {vista === 'analizar' ? <Analizar /> : null}
        </div>
        <DialogoDeNota pedido={nota} token={token} asesoradoId={id} nombreDelAsesorado={nombre} sesionPerdida={sesionPerdida} onCerrar={cerrarNota} onEnviada={notaEnviada} />
      </ProveedorDelSeguimiento>
    </div>
  );
}

/** Las áreas que el encabezado muestra activas (vínculo activo y lectura permitida). */
function dominiosActivos(encabezado: Encabezado, panel: PanelDelResumen): ReadonlySet<DominioDeAnalisis> {
  if (encabezado.tipo !== 'listo') return new Set(Object.values(DOMINIO_DEL_ALCANCE));
  const sePuedeLeer = lecturaSegun(panel);
  return new Set(
    encabezado.vinculos.flatMap((v) => {
      const dominio = DOMINIO_DEL_ALCANCE[v.scope.code];
      return dominio && estadoDelArea(v, sePuedeLeer).estado === COPY_VINCULO.accesoContextual ? [dominio] : [];
    }),
  );
}

/** Qué se puede leer, en una cadena: si cambia, cambió el acceso. */
function huellaDeAcceso(p: PanelDelResumen): string {
  if (p.tipo !== 'listo') return p.tipo;
  const d = p.datos.domains;
  return `${d.nutrition.available}|${d.training.available}|${d.anthropometry.available}`;
}
