'use client';

/**
 * Website `/pro` — espacio profesional:
 * - «Pendientes» (API-CAR-01; PF-07, DL-107): a quién mirar hoy, con hechos fechados y sin juicios (`pendientes.tsx`).
 * - «Tus asesorados» (REL-05), un directorio para entrar a la ficha de cada persona, con el estado mínimo de 10-B04
 *   §28-§29 (`asesorados.tsx`).
 * - «Solicitar vínculo» (REL-01), a un clic (`solicitar-vinculo.tsx`), y «Solicitudes enviadas» (REL-02), una sección
 *   con filtros por estado y por persona al pie del Espacio (`solicitudes-enviadas.tsx`, ED-41).
 * Solo cuentas con la capacidad PROFESSIONAL_WORKSPACE que informa la API entran a este espacio (criterio 11A n.º 1);
 * la capacidad no autoriza nada: cada operación la decide la API.
 *
 * WP-ESCRITORIO-AMABLE, parte 5 (la pantalla 13 de las maquetas):
 * - **Primero lo que hay que hacer y, al lado, a quién abrir.** Dos tarjetas: los pendientes y el directorio. El
 *   formulario y la lista de solicitudes, que antes ocupaban dos tarjetas más, se abren cuando hacen falta.
 * - **Las tres listas se leen enteras** (`lista-completa.ts`, con `todasLasPaginas` del dominio): así se pueden contar y
 *   se puede buscar en ellas. La de
 *   pendientes es la única lectura protegida de la página: una al entrar, y ninguna al elegir una vista.
 * - **«Hoy» es la fecha con que la API clasificó las revisiones** (`today`), no la del navegador: sin esa lectura, no
 *   se dice.
 * - **`/pro` no lleva parámetros:** la vista elegida, los filtros y la búsqueda son de la visita (el retorno del inicio
 *   de sesión admite `/pro` a secas).
 *
 * WP-TABLERO-ALTA-GAMA TB-06 y TB-11 (DL-163 D-3 y D-4; TA-16):
 * - **El encabezado:** el saludo («Buen día, Sofía»), con el nombre con que la ven las personas, de los vínculos ya
 *   leídos (TA-10), o a secas; y las tres cifras (`cifras-del-espacio.tsx`). El filtro de «Te toca a vos» vive acá: lo
 *   eligen las cifras y «Más filtros».
 * - **La mesa:** «Te toca a vos» por persona (`te-toca-a-vos.tsx`), y al lado «Esperan respuesta»
 *   (`esperan-respuesta.tsx`) encima de «Tus asesorados». La única lectura nueva es la de las invitaciones sin usar
 *   (API-INV-02), para «Esperan respuesta»; las solicitudes ya se leían.
 * - **Por persona o por pendiente** se recuerda en el navegador (§5 del paquete), sin datos de personas.
 *
 * WP-TABLERO-ALTA-GAMA TB-07 (con el cajón apagado o prendido; TA-46): al abrir una ficha de «Tu semana», un verbo de
 * «Te toca a vos» o una salida del cajón, se guarda el lugar (el filtro, el modo, el período y lo que se abrió, solo
 * identificadores, `lugar-del-espacio.ts`). Al volver, se lee antes que la cartera, y el foco vuelve a lo que se abrió
 * o, si ya no está, a lo que seguía. Si se salió por el cajón, se abre el cajón.
 */
import { COPY_INVITACION, COPY_VINCULO, numero, type FiltroDePendientes, type PendienteDeCartera } from '@be/domain';
import { Enlace } from '../../components/enlace';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AvisoFlotante } from '../../components/ayuda';
import { Cargando, ErrorConReintento } from '../../components/estados';
import { Aviso } from '../../components/formulario';
import { Icono } from '../../components/icono';
import { api, type Resultado } from '../../lib/api';
import { diaConSuSemana } from '../../lib/formato';
import { useListaCompleta } from '../../lib/lista-completa';
import { useSesionRequerida } from '../../lib/sesion-requerida';
import type { Periodo } from './advisees/periodo';
import { Asesorados } from './asesorados';
import { InvitarPersona } from './invitar-persona';
import { ENTRADAS_DEL_VINCULO } from './vinculo-en-palabras';
import { TeTocaAVos, TODO, type PaginaDeCartera } from './te-toca-a-vos';
import { SolicitarVinculo } from './solicitar-vinculo';
import { ID_DE_SOLICITUDES_ENVIADAS, SolicitudesEnviadas, solicitudesEnviadasPor } from './solicitudes-enviadas';
import { SIN_FILTRO, type FiltroDeSolicitudes } from './filtro-de-solicitudes';
import { TuSemana } from './tu-semana-en-pantalla';
import { areaUnicaDelProfesional, armarElDirectorio } from './directorio';
import { EsperandoSesion } from '../../lib/sesion';
import { anotarNombrePropio, nombrePropioEn, useNombrePropio } from '../../lib/nombre-propio';
import { useNombres } from '../../lib/nombres-ocultos';
import { CifrasDelEspacio, type Cuenta } from './cifras-del-espacio';
import { EsperanRespuesta, type ListaQueEspera } from './esperan-respuesta';
import { CAJON_DE_A_UNA, COPY_CAJON, dondeSigue, guardarLugar, leerLugar } from './cajon';
import { CajonDeAUna } from './cajon-de-a-una';
import { COPY_LUGAR, dondeVolver, guardarLugarDelEspacio, leerLugarDelEspacio, lugarDelEspacioParaGuardar, siguientesDe, type LugarDelEspacio, type OrigenEnElEspacio } from './lugar-del-espacio';
import { filtrarPendientes } from '@be/domain';
import { claveDelPendiente, colaDeLaVista, delCarril, personasPorArea, saludo as saludoDelEspacio, TIPOS_QUE_ESPERAN, TIPOS_QUE_TE_TOCAN, type ModoDeLaMesa } from './mesa';

/** Por persona o por pendiente: una preferencia del navegador, sin datos de personas. Puede no haber dónde guardarla. */
const CLAVE_DEL_MODO = 'be-mesa-modo';
function useModoDeLaMesa(): [ModoDeLaMesa, (m: ModoDeLaMesa) => void] {
  const [modo, setModo] = useState<ModoDeLaMesa>('persona');
  useEffect(() => {
    try {
      if (window.localStorage.getItem(CLAVE_DEL_MODO) === 'pendiente') setModo('pendiente');
    } catch {
      // Sin almacenamiento, por persona.
    }
  }, []);
  const elegir = useCallback((m: ModoDeLaMesa) => {
    setModo(m);
    try {
      window.localStorage.setItem(CLAVE_DEL_MODO, m);
    } catch {
      // Vale por la visita.
    }
  }, []);
  return [modo, elegir];
}

/** Una lista completa, como la espera «Esperan respuesta». */
function comoLista<T>(estado: { tipo: string; items?: readonly T[]; completa?: boolean }, filtrar: (items: readonly T[]) => readonly T[] = (x) => x): ListaQueEspera<T> {
  if (estado.tipo === 'listo' && estado.items) return { tipo: 'listo', items: filtrar(estado.items), completa: estado.completa ?? true };
  return estado.tipo === 'error' ? { tipo: 'error' } : { tipo: 'cargando' };
}
const cuentaDe = (l: ListaQueEspera<unknown>, n?: number): Cuenta => (l.tipo === 'listo' ? { n: n ?? l.items.length, completa: l.completa } : null);

type Yo = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'sin-espacio' } | { tipo: 'listo'; id: string };

/** Carga la cuenta y confirma que la API le informa el espacio profesional. Compartido con el workspace. */
export function useEspacioProfesional(volver: string) {
  const sesion = useSesionRequerida(volver);
  const { token, sesionPerdida } = sesion;
  const [yo, setYo] = useState<Yo>({ tipo: 'cargando' });
  const cargarYo = useCallback(async () => {
    if (!token) return;
    setYo({ tipo: 'cargando' });
    const r = await api.consultarCuenta(token);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setYo({ tipo: 'error' });
    setYo(r.datos.data.actorCapabilities.includes('PROFESSIONAL_WORKSPACE') ? { tipo: 'listo', id: r.datos.data.identityId } : { tipo: 'sin-espacio' });
  }, [token, sesionPerdida]);
  useEffect(() => {
    void cargarYo();
  }, [cargarYo]);
  return { ...sesion, yo, cargarYo };
}

export function SinEspacioProfesional() {
  return (
    <Aviso tipo="info">
      <p>{COPY_VINCULO.recursoNoDisponible}</p>
      <p>
        <Enlace href="/account">Ir a tu cuenta</Enlace>
      </p>
    </Aviso>
  );
}

/** De a cuántos se lee y cuántas páginas de una vez: 200 pendientes (de a 50) y 200 vínculos o solicitudes (de a 20). */
const DE_LA_CARTERA = { limite: 50, paginas: 4 } as const;
/** Los vínculos y las solicitudes llegan de a 20: su lectura no admite otro tamaño de página. */
const DE_UNA_LISTA = { limite: 20, paginas: 10 } as const;

/** El título de la página está en todos sus estados: sin sesión, cargando, con una falla o sin espacio profesional. */
function Pagina({ children, alLado }: { children: ReactNode; alLado?: ReactNode }) {
  return (
    <div className="espacio-profesional">
      <div className="espacio-profesional__encabezado">
        <h1>Espacio profesional</h1>
        {alLado}
      </div>
      {children}
    </div>
  );
}

export function EspacioProfesional() {
  const { token, sesionPerdida, yo, cargarYo } = useEspacioProfesional('/pro');
  const id = yo.tipo === 'listo' ? yo.id : null;
  const [periodo, setPeriodo] = useState<Periodo>({});
  // TB-07: el lugar del Espacio, si se vuelve de algo que se abrió desde acá. Se lee una vez, al entrar y antes de leer la
  // cartera, porque el período del último registro va a la API: así no hay una lectura de más.
  const [lugarLeido, setLugarLeido] = useState(false);
  const vueltaAlEspacio = useRef<LugarDelEspacio | null>(null);

  // Los pendientes: la cartera entera, de a 50. A la API va solo el período; la vista y los filtros se resuelven acá.
  const cartera = useListaCompleta(
    useMemo(
      () =>
        token && id && lugarLeido
          ? (filtro: { cursor?: string; limit: string }): Promise<Resultado<PaginaDeCartera>> =>
              api.consultarCartera(token, { ...periodo, ...filtro }).then((r) => {
                if (!r.ok) return r;
                const { items, ...meta } = r.datos.data;
                return { ...r, datos: { data: items, page: r.datos.page, meta } };
              })
          : null,
      [token, id, periodo, lugarLeido],
    ),
    sesionPerdida,
    DE_LA_CARTERA,
  );
  const vinculos = useListaCompleta(
    useMemo(() => (token && id ? (filtro: { cursor?: string }) => api.consultarVinculos(token, { cursor: filtro.cursor }) : null), [token, id]),
    sesionPerdida,
    DE_UNA_LISTA,
  );
  const enviadas = useListaCompleta(
    useMemo(() => (token && id ? (filtro: { cursor?: string }) => api.consultarSolicitudes(token, { cursor: filtro.cursor }) : null), [token, id]),
    sesionPerdida,
    DE_UNA_LISTA,
  );
  // TB-06: las invitaciones sin usar, para «Esperan respuesta». Es la única lectura nueva del Espacio.
  const invitaciones = useListaCompleta(
    useMemo(() => (token && id ? (filtro: { cursor?: string }) => api.consultarInvitaciones(token, { state: 'PENDING', limit: '20', cursor: filtro.cursor }) : null), [token, id]),
    sesionPerdida,
    DE_UNA_LISTA,
  );
  const [filtro, setFiltro] = useState<FiltroDePendientes>(TODO);
  const [modo, setModo] = useModoDeLaMesa();
  useEffect(() => {
    const lugar = leerLugarDelEspacio(Date.now());
    guardarLugarDelEspacio(null);
    if (lugar) {
      vueltaAlEspacio.current = lugar;
      setFiltro(lugar.filtro);
      setModo(lugar.modo);
      setPeriodo(lugar.periodo);
    }
    setLugarLeido(true);
    // Solo al entrar: el lugar se usa una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const nombres = useNombres();
  const nombrePropio = useNombrePropio();
  // TB-12: la cola del cajón es la vista elegida de «Te toca a vos», en su orden. Detrás de su interruptor.
  const carteraLeida = cartera.estado.tipo === 'listo' ? cartera.estado.items : null;
  const cola = useMemo(() => (carteraLeida ? colaDeLaVista(filtrarPendientes(delCarril(carteraLeida, TIPOS_QUE_TE_TOCAN), filtro), modo) : []), [carteraLeida, filtro, modo]);
  const [cajon, setCajon] = useState<{ abierto: boolean; inicio: number | null }>({ abierto: false, inicio: 0 });
  const retomado = useRef(false);
  // TB-15: si desde el cajón se aplicó una revisión, la cartera cambió: se vuelve a leer al cerrarlo, no con él abierto
  // (la cola del cajón no se mueve mientras se recorre).
  const releerAlCerrar = useRef(false);
  const seAbrioElCajon = useRef(false);
  useEffect(() => {
    // Al volver de una salida del cajón, sigue con el siguiente que todavía esté en la cola; el lugar se usa una vez.
    if (!CAJON_DE_A_UNA || retomado.current || !carteraLeida) return;
    retomado.current = true;
    const lugar = leerLugar(Date.now());
    guardarLugar(null);
    if (lugar) setCajon({ abierto: true, inicio: dondeSigue(lugar, cola.map(claveDelPendiente)) });
    seAbrioElCajon.current = Boolean(lugar);
  }, [carteraLeida, cola]);
  // TB-07: con la cartera leída, el foco vuelve a lo que se abrió o a lo que seguía. Si se abrió el cajón, manda el cajón.
  const devuelto = useRef(false);
  useEffect(() => {
    const lugar = vueltaAlEspacio.current;
    if (devuelto.current || !carteraLeida || !lugar) return;
    devuelto.current = true;
    vueltaAlEspacio.current = null;
    if (seAbrioElCajon.current) return;
    window.requestAnimationFrame(() => {
      const buscar = (clave: string): HTMLElement | null =>
        (lugar.origen === 'semana' ? document.querySelector<HTMLElement>(`[data-ficha="${clave}"]`) : null) ?? document.querySelector<HTMLElement>(`[data-pendiente="${clave}"]`);
      const donde = dondeVolver(lugar, (c) => buscar(c) !== null);
      const destino = donde ? buscar(donde.clave) : document.getElementById('te-toca-a-vos');
      destino?.scrollIntoView({ block: 'center' });
      destino?.focus({ preventScroll: true });
      if (!donde?.laMisma) setAviso(donde ? COPY_LUGAR.yaNoEsta : COPY_LUGAR.yaNoEstaNada);
    });
  }, [carteraLeida]);
  const conCajon = CAJON_DE_A_UNA && cola.length > 0;

  const [formulario, setFormulario] = useState(false);
  // WP-INVITACION (DL-136): invitar por enlace, QR o código es el camino principal; el identificador queda como alternativa.
  const [invitar, setInvitar] = useState(false);
  // ED-41: «Solicitudes enviadas» es una sección; los botones llevan a ella, con un filtro si hace falta.
  const [avisoDeSolicitudes, setAvisoDeSolicitudes] = useState<string | null>(null);
  const [filtroDeSolicitudes, setFiltroDeSolicitudes] = useState<FiltroDeSolicitudes>(SIN_FILTRO);
  const irASolicitudes = useCallback((filtro: FiltroDeSolicitudes | null, avisoNuevo: string | null) => {
    if (filtro) setFiltroDeSolicitudes(filtro);
    setAvisoDeSolicitudes(avisoNuevo);
    window.requestAnimationFrame(() => {
      const seccion = document.getElementById(ID_DE_SOLICITUDES_ENVIADAS);
      seccion?.scrollIntoView({ block: 'start' });
      seccion?.focus({ preventScroll: true });
    });
  }, []);
  const [aviso, setAviso] = useState<string | null>(null);
  // TB-05: el nombre con que las personas ven a la cuenta, para su monograma en el menú. Sale de los vínculos ya leídos.
  const vinculosLeidos = vinculos.estado.tipo === 'listo' ? vinculos.estado.items : null;
  useEffect(() => {
    if (vinculosLeidos && id) anotarNombrePropio(nombrePropioEn(vinculosLeidos, id));
  }, [vinculosLeidos, id]);

  if (!token) {
    return (
      <Pagina>
        <EsperandoSesion />
      </Pagina>
    );
  }
  if (yo.tipo !== 'listo') {
    return (
      <Pagina>
        {yo.tipo === 'cargando' ? <Cargando /> : null}
        {yo.tipo === 'error' ? <ErrorConReintento onReintentar={cargarYo} /> : null}
        {yo.tipo === 'sin-espacio' ? <SinEspacioProfesional /> : null}
      </Pagina>
    );
  }

  const actualizar = () => {
    void cartera.recargar();
    void vinculos.recargar();
    void enviadas.recargar();
    void invitaciones.recargar();
  };
  const propias = enviadas.estado.tipo === 'listo' ? solicitudesEnviadasPor(enviadas.estado.items, yo.id) : null;
  // DL-146: si trabajás en una sola área, invitar y solicitar la traen elegida.
  const areaSugerida = vinculos.estado.tipo === 'listo' ? areaUnicaDelProfesional(vinculos.estado.items, yo.id) : null;
  const sinResponder = propias ? propias.filter((s) => s.state === 'PENDIENTE').length : 0;
  const hoy = cartera.estado.tipo === 'listo' ? cartera.estado.primera.meta.today : null;
  const zona = cartera.estado.tipo === 'listo' ? cartera.estado.primera.meta.timeZone : 'America/Argentina/Buenos_Aires';
  const leida = cartera.estado.tipo === 'listo' ? cartera.estado : null;
  // TB-06: las cifras. Cada una sale de su lista leída; sin lectura, no hay número.
  const formularios = leida ? delCarril(leida.items, TIPOS_QUE_ESPERAN) : null;
  const solicitudesQueEsperan = comoLista(enviadas.estado, (items) => solicitudesEnviadasPor(items, yo.id).filter((s) => s.state === 'PENDIENTE'));
  const invitacionesQueEsperan = comoLista(invitaciones.estado, (items) => items.filter((i) => i.state === 'PENDING'));
  const cuentaDeFormularios: Cuenta = formularios && leida ? { n: formularios.length, completa: leida.completa } : null;
  const cuentaDeSolicitudes = cuentaDe(solicitudesQueEsperan);
  const cuentaDeInvitaciones = cuentaDe(invitacionesQueEsperan);
  const totalQueEspera: Cuenta =
    cuentaDeFormularios && cuentaDeSolicitudes && cuentaDeInvitaciones
      ? { n: cuentaDeFormularios.n + cuentaDeSolicitudes.n + cuentaDeInvitaciones.n, completa: cuentaDeFormularios.completa && cuentaDeSolicitudes.completa && cuentaDeInvitaciones.completa }
      : null;
  const directorio = vinculos.estado.tipo === 'listo' ? armarElDirectorio(vinculos.estado.items, yo.id, nombres.delAsesorado) : null;
  const elSaludo = saludoDelEspacio(new Date().getHours(), nombrePropio, nombres.ocultos);
  /** TB-07: al abrir algo desde el Espacio, el lugar para volver, con lo que seguía en la vista: solo identificadores. */
  const guardarDondeEstabas = (origen: OrigenEnElEspacio, p: Pick<PendienteDeCartera, 'kind' | 'domain' | 'advisee'>) => {
    const fila = claveDelPendiente(p);
    guardarLugarDelEspacio(lugarDelEspacioParaGuardar({ origen, fila, siguientes: siguientesDe(cola.map(claveDelPendiente), fila), filtro, modo, periodo }, Date.now()));
  };

  return (
    <Pagina
      alLado={
        <>
          {hoy ? <p className="espacio-profesional__hoy">Hoy, {diaConSuSemana(hoy)}</p> : null}
          <button type="button" className={`boton ${conCajon ? 'boton--secundario' : 'boton--primario'} espacio-profesional__invitar`} aria-haspopup="dialog" onClick={() => setInvitar(true)}>
            <Icono nombre="persona" tamano={20} />
            {/* ED-41: dos caminos distintos, dichos en el botón. */}
            <span className="boton__con-subtitulo">
              {ENTRADAS_DEL_VINCULO.invitar.titulo}
              <span className="boton__subtitulo">{ENTRADAS_DEL_VINCULO.invitar.subtitulo}</span>
            </span>
          </button>
          <button type="button" className="boton boton--secundario espacio-profesional__solicitar" aria-haspopup="dialog" onClick={() => setFormulario(true)}>
            <Icono nombre="solicitud" tamano={20} />
            <span className="boton__con-subtitulo">
              {ENTRADAS_DEL_VINCULO.pedir.titulo}
              <span className="boton__subtitulo">{ENTRADAS_DEL_VINCULO.pedir.subtitulo}</span>
            </span>
          </button>
        </>
      }
    >
      {/* TB-06: el saludo y las tres cifras, que filtran «Te toca a vos» o llevan a su sección. */}
      <CifrasDelEspacio
        saludo={elSaludo}
        teTocan={leida ? delCarril(leida.items, TIPOS_QUE_TE_TOCAN) : null}
        completa={leida?.completa ?? true}
        filtro={filtro}
        onFiltro={setFiltro}
        esperan={{ total: totalQueEspera, formularios: cuentaDeFormularios, solicitudes: cuentaDeSolicitudes, invitaciones: cuentaDeInvitaciones }}
        personas={{ total: directorio && vinculos.estado.tipo === 'listo' ? { n: directorio.length, completa: vinculos.estado.completa } : null, porArea: directorio ? personasPorArea(directorio) : [] }}
      />
      {/* TB-07: las revisiones que acordaste, de hoy a siete días. Sale de la cartera ya leída: ninguna lectura nueva. */}
      <TuSemana cartera={cartera.estado} alAbrir={(f) => guardarDondeEstabas('semana', f)} />
      {/* TB-11: lo que te toca, por persona; al lado, lo que espera a la persona y a quién abrir. */}
      <div className="espacio-profesional__cuerpo">
        {/* Cada lista con su «Reintentar», que vuelve a leer solo esa; «Actualizar» lee todas. */}
        <TeTocaAVos
          cartera={cartera.estado}
          periodo={periodo}
          onPeriodo={setPeriodo}
          filtro={filtro}
          onFiltro={setFiltro}
          modo={modo}
          onModo={setModo}
          onActualizar={actualizar}
          onReintentar={() => void cartera.recargar()}
          onVerMas={() => void cartera.verMas()}
          alAbrir={(p) => guardarDondeEstabas('mesa', p)}
          alComienzo={
            conCajon ? (
              <button type="button" className="boton boton--primario cajon__empezar" aria-haspopup="dialog" onClick={() => setCajon({ abierto: true, inicio: 0 })}>
                <Icono nombre="derecha" tamano={20} />
                {COPY_CAJON.empezar}
              </button>
            ) : null
          }
        />
        <div className="espacio-profesional__costado">
        <EsperanRespuesta
          cartera={cartera.estado}
          solicitudes={solicitudesQueEsperan}
          invitaciones={invitacionesQueEsperan}
          hoy={hoy ?? ''}
          zona={zona}
          onVerSolicitudes={() => irASolicitudes({ estado: 'PENDIENTE', persona: null }, null)}
          onVerInvitaciones={() => setInvitar(true)}
        />
        <Asesorados vinculos={vinculos.estado} profesionalId={yo.id} onReintentar={() => void vinculos.recargar()} onVerMas={() => void vinculos.verMas()}>
          <button type="button" className="boton boton--enlace directorio__solicitudes" onClick={() => irASolicitudes(null, null)}>
            <Icono nombre="solicitar" tamano={18} />
            Solicitudes enviadas{propias ? ` (${numero(propias.length)}${enviadas.estado.tipo === 'listo' && !enviadas.estado.completa ? '+' : ''})` : ''}
          </button>
          {/* «Pendiente» es la palabra de BE para una solicitud que el asesorado todavía no respondió (10-B04). */}
          {sinResponder > 0 ? (
            <span className="directorio__sin-responder nota">
              {numero(sinResponder)} {sinResponder === 1 ? 'pendiente de respuesta' : 'pendientes de respuesta'}
            </span>
          ) : null}
        </Asesorados>
        </div>
      </div>
      {/* ED-41: a todo el ancho, debajo de la mesa: es el historial de lo enviado, con sus filtros. */}
      <SolicitudesEnviadas
        aviso={avisoDeSolicitudes}
        solicitudes={enviadas.estado}
        profesionalId={yo.id}
        filtro={filtroDeSolicitudes}
        onFiltro={setFiltroDeSolicitudes}
        onCerrarAviso={() => setAvisoDeSolicitudes(null)}
        onReintentar={() => void enviadas.recargar()}
        onVerMas={() => void enviadas.verMas()}
      />

      {CAJON_DE_A_UNA ? (
        <CajonDeAUna
          abierto={cajon.abierto}
          cola={cola}
          inicio={cajon.inicio}
          token={token}
          sesionPerdida={sesionPerdida}
          hoy={hoy ?? ''}
          zona={zona}
          onCerrar={() => {
            setCajon((c) => ({ ...c, abierto: false }));
            if (releerAlCerrar.current) {
              releerAlCerrar.current = false;
              void cartera.recargar();
            }
          }}
          onAplicada={() => {
            releerAlCerrar.current = true;
          }}
          onSalir={(p) => guardarDondeEstabas('cajon', p)}
        />
      ) : null}
      <InvitarPersona
        abierto={invitar}
        areaSugerida={areaSugerida}
        token={token}
        sesionPerdida={sesionPerdida}
        onCerrar={() => {
          setInvitar(false);
          // Lo creado o anulado en el cuadro cambia «Esperan respuesta».
          void invitaciones.recargar();
        }}
        onConElIdentificador={() => {
          setInvitar(false);
          setFormulario(true);
        }}
      />
      <SolicitarVinculo
        abierto={formulario}
        areaSugerida={areaSugerida}
        token={token}
        sesionPerdida={sesionPerdida}
        onCerrar={() => setFormulario(false)}
        alEnviar={({ texto, deduplicada }) => {
          setFormulario(false);
          void enviadas.recargar();
          // «Te mostramos esa»: si ya había una igual pendiente, se abre la lista, que lo dice arriba.
          if (deduplicada) irASolicitudes({ estado: 'PENDIENTE', persona: null }, texto);
          else setAviso(texto);
        }}
      />
      {aviso ? (
        <AvisoFlotante onCerrar={() => setAviso(null)}>
          <p>{aviso}</p>
        </AvisoFlotante>
      ) : null}
    </Pagina>
  );
}
