'use client';

/**
 * «Pedir información» (API-FRM-01, 02 y 03; WP-ESCRITORIO-AREAS, parte 4; maqueta 27). Un cajón que se abre sobre
 * «Solicitudes», que sigue a la vista por detrás, con los tres pasos a la vez: qué formulario, qué preguntas, y para qué y
 * en qué área. Es la única escritura de Información y no se deshace —una solicitud enviada no se cancela ni se edita—:
 * por eso lo que hay que saber antes de enviar queda fijo, junto al botón.
 *
 * **Al elegir un formulario vienen todas sus preguntas marcadas,** y el profesional desmarca las que no necesita
 * (decisión de Dirección del 2026-10-12; F-05 de WP-ESCRITORIO-AREAS, DL-131). La minimización sigue siendo del
 * profesional, no del catálogo: la cuenta de las elegidas está a la vista, como requeridas vienen solo las que la
 * plantilla sugiere (`requiredByDefault`, DL-164) y se pueden cambiar, y la API sigue evaluando la pertinencia de cada
 * pregunta al crear la solicitud (FRM-03): marcarlas todas no amplía lo que se puede pedir. No viene ningún formulario
 * elegido: esa primera decisión es del profesional.
 *
 * WP-FORMULARIOS-DE-INICIO (DL-164): las preguntas se leen con API-FRI-01, que sirve cualquier versión en formato V2
 * (las de P0 traducidas), así los formularios de inicio con tipos nuevos se piden como los demás. Cada pregunta dice con
 * qué se responde y un resumen de sus opciones; las condicionales dicen cuándo aparecen. Si la versión usa tipos nuevos,
 * se avisa que la persona necesita la app nueva y que mientras tanto se puede cargar con ella desde la ficha. El flujo
 * de creación (FRM-03) no cambia.
 *
 * Lo que la pantalla no hace, a propósito: **no promete el dato.** El aviso dice que pedir no amplía el acceso y que
 * hasta que la persona responda no hay nada nuevo (05:15098-15099). Tampoco dice que a la persona le llega un aviso: BE
 * no manda ninguno; la solicitud la ve al abrir «Información» en su teléfono.
 *
 * **El área.** Un formulario con área propia se pide solo en esa (FRM-03; UC-P32, precondición 7): queda fijada, con su
 * candado. Con uno sin área propia no viene ninguna elegida, y se ofrecen las tres: la pantalla no adivina cuál está
 * autorizada. Si no lo está, la API responde el mismo «no disponible» neutral que ante un asesorado inexistente; eso es lo
 * que se muestra, y el marco vuelve a preguntar el acceso.
 *
 * **Lo escrito no se pierde por cerrar.** El cajón conserva el pedido a medio armar mientras dure la visita; «Actualizar»
 * avisa antes de descartarlo. Lo que falta para enviar se dice en su lugar al tocar «Enviar solicitud», y un rechazo de la
 * API se dice arriba, con el foco, sin tocar lo elegido. Cambiar algo después de un resultado incierto es otro intento:
 * no reusa la clave del anterior.
 *
 * PF-02 (DL-100): si el profesional llega desde la evaluación de entrenamiento (`plantilla=FRM-ENTRENAMIENTO` y
 * `volver=entrenamiento`, o `volver=entrenamiento-plan` desde el Plan), el cajón precarga «Antes de entrenar», el «para
 * qué» y el área, y al enviar vuelve a Entrenamiento. Desde DL-165 D-29 (Dirección, 2026-11-06: «Que venga completo») las
 * preguntas vienen como al elegirlo en «Más»: todas pedidas y, requeridas, las que sugiere la plantilla. Antes venían
 * solo las seis de DL-100, sin la tabla «¿Qué días y en qué momento podés?», y el tope de los días (D-5) no actuaba. Es
 * una propuesta editable, no una excepción a la minimización: se puede desmarcar antes de enviar.
 *
 * WP-FORMULARIOS-RONDA-2 (FR-02): lo mismo desde el Resumen de Nutrición (`plantilla=FRM-NUTRICION-INICIO` y
 * `volver=nutricion`), con las preguntas como al elegirlo en «Más», y al enviar se vuelve a Nutrición. Y al elegir un
 * formulario de inicio, venga de donde venga, se sugiere su «para qué» si el profesional no escribió uno
 * (`propositoAlElegir`): lo que escribió no se pisa.
 *
 * **ED-40 (WP-EDITORES-PROFESIONAL), compacto:** con más de una parte, las partes vienen plegadas, cada una con su cuenta
 * («12 de 12 pedidas · 3 obligatorias · 1 que se suma si corresponde»), «Pedir todas» y «Ninguna»; «Ver todas» las abre.
 * Plegar no cambia lo que se envía. Junto al botón, fijo: «Vas a pedir 49 preguntas (19 obligatorias) para Nutrición.
 * Pedir no amplía tu acceso.», la línea de lo que le llega a la persona y, si el mismo formulario tiene un pedido sin
 * responder, el aviso (se puede enviar igual). La cuenta y los textos, en `partes-del-pedido.ts`.
 *
 * WP-FORMULARIOS-RONDA-2, ronda 2.1 (DL-165 D-15 nueva; D-22): los hábitos son un formulario aparte, «Tus hábitos». Al
 * elegir uno de área que no los trae, el cajón ofrece **«Sumar «Tus hábitos»»**, marcado o no según lo que este profesional
 * ya ve de la persona (API-HBT-07; `sumar-habitos.ts`). Con la casilla marcada se envían las dos solicitudes en un paso:
 * primero la de área y después la de hábitos, cada una con su clave. Si una falla, se dice cuál.
 */
import { ALCANCES, COPY, COPY_FORMULARIOS as F, COPY_FORMULARIOS_V2 as V, COPY_HABITOS, COPY_SOLICITUDES as C, COPY_VINCULO, descripcionDeLaPlantilla, ETIQUETA_DE_ALCANCE, todasLasPaginas, type Alcance, type Plantilla, type SolicitudDeFormulario, type VersionDePlantillaV2 } from '@be/domain';
import { Enlace } from '../../../../components/enlace';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Cajon } from '../../../../components/cajon';
import { ErrorConReintento } from '../../../../components/estados';
import { Aviso, Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api, type Resultado } from '../../../../lib/api';
import { dejarAvisoPara } from '../../../../lib/aviso-al-llegar';
import { diaSinElAnioEnCurso } from '../../../../lib/formato';
import { esIncierto, mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useAvisarSinAcceso, useCambiosSinGuardar, usePersonaDelArea } from '../marco-del-area';
import { condicionEnPalabras, marcadoPorOmision, noVienePedida, origenDelPedido, PRECARGA_DEL_ORIGEN, propositoAlElegir, respondeConV2, vueltaDelOrigen } from './formulario-de-inicio';
import { EstadoDeLectura, useFormularios } from './formularios';
import { avisoDelPendiente, COPY_BUSCADOR_DE_PREGUNTAS as B, COPY_PARTES, cuentaDeLaParte, cuentaEnPalabras, filasALaVista, loQueLeLlega, ninguna, pedidoPendiente, pedirTodas, preguntasQueCoinciden, resultadoDeLaBusqueda, resumenDelPedido } from './partes-del-pedido';
import { habitosParaSumar, marcadaPorOmision, mensajeDelEnvio, motivoDeLaSugerencia, pedidoDeHabitos, sugerenciaDelCajon, type DesenlaceDeEnvio, type LecturaDeLoQueSabe } from './sumar-habitos';

const H = COPY_HABITOS.web;

/** Los rechazos de FRM-03 que dependen de lo elegido: se dicen, en vez de «el servicio no está disponible». */
const RECHAZO_DE_SOLICITUD: Readonly<Record<string, string>> = {
  FORM_TEMPLATE_NOT_SELECTABLE: F.plantillaNoSeleccionable,
  FORM_REQUEST_NOT_ALLOWED: F.campoNoPertinente,
  FORM_REQUEST_INVALID: F.solicitudInvalida,
};

/** La versión del formulario elegido: de ahí salen sus preguntas. */
type Lectura = { readonly tipo: 'cargando' } | { readonly tipo: 'lista'; readonly version: VersionDePlantillaV2 } | { readonly tipo: 'fallo' };
type Envio = { readonly tipo: 'editando' } | { readonly tipo: 'enviando' } | { readonly tipo: 'error'; readonly texto: string; readonly incierto: boolean };
/** Lo que falta para enviar, por paso. */
type Faltas = { readonly formulario?: string; readonly preguntas?: string; readonly proposito?: string; readonly area?: string };

export function PedidoDeInformacion({
  abierto,
  onCerrar,
  onReabrir,
  alEnviar,
}: {
  abierto: boolean;
  onCerrar: () => void;
  /** El envío terminó con un error y el cajón ya no estaba abierto: se vuelve a abrir, para que el error se lea. */
  onReabrir: () => void;
  /** La solicitud quedó enviada: la lista se vuelve a leer y la página lo dice. */
  alEnviar: () => void;
}) {
  const { token, asesoradoId, sesionPerdida, avisar, parametros } = useFormularios();
  const persona = usePersonaDelArea();
  const avisarSinAcceso = useAvisarSinAcceso();
  const id = useId();
  const router = useRouter();
  const intento = useClaveDeIntento();
  /** Ronda 2.1 · la clave del segundo pedido, el de «Tus hábitos»: otro intento, con su propia clave. */
  const intentoDeHabitos = useClaveDeIntento();
  const [catalogo, setCatalogo] = useState<Resultado<readonly Plantilla[]> | null>(null);
  /** Ronda 2.1 (D-22) · lo que este profesional sabe de los hábitos de la persona (API-HBT-07), para sugerir «Tus hábitos». */
  const [loQueSabe, setLoQueSabe] = useState<LecturaDeLoQueSabe | null>(null);
  /** La casilla «Sumar «Tus hábitos»», si el profesional la tocó; si no, vale lo que sugiere el dominio. */
  const [sumarElegido, setSumarElegido] = useState<boolean | null>(null);
  /** La versión vigente de «Tus hábitos» (API-FRI-01), leída la primera vez que se necesita. */
  const versionDeHabitos = useRef<VersionDePlantillaV2 | null>(null);
  const [elegido, setElegido] = useState<Plantilla | null>(null);
  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [pedidas, setPedidas] = useState<readonly string[]>([]);
  const [requeridas, setRequeridas] = useState<readonly string[]>([]);
  /** Lo elegido vino de la precarga del área de donde se llegó (DL-100; FR-02), no de una elección en el cajón. */
  const [conPrecarga, setConPrecarga] = useState(false);
  const [proposito, setProposito] = useState('');
  /** FR-02 · el «para qué» que quedó sugerido por el formulario elegido: mientras siga igual, no lo escribió el profesional. */
  const sugerencia = useRef<string | null>(null);
  const propositoActual = useRef(proposito);
  propositoActual.current = proposito;
  /** El área que eligió el profesional, para un formulario sin área propia. */
  const [area, setArea] = useState<Alcance | ''>('');
  /** Lo que la persona lee debajo de cada pregunta, a la vista. Queda a un clic: con seis preguntas, la tabla no entraba. */
  const [conAclaraciones, setConAclaraciones] = useState(false);
  const [faltas, setFaltas] = useState<Faltas>({});
  /** Sube con cada «Enviar» al que le falta algo: el foco va a lo primero que falta. */
  const [intentosConFaltas, setIntentosConFaltas] = useState(0);
  const [envio, setEnvio] = useState<Envio>({ tipo: 'editando' });
  const enviando = envio.tipo === 'enviando';
  // Lo que viene marcado al elegir un formulario, o precargado al llegar desde Entrenamiento, no es algo escrito: vuelve
  // a venir igual. Hay algo que perder recién cuando el profesional cambia una casilla, el propósito o el área.
  const [tocado, setTocado] = useState(false);
  useCambiosSinGuardar(tocado, 'el pedido de información');

  // De qué área se llegó: el Resumen de Entrenamiento, su Plan («Empezar el plan», DL-145) o el Resumen de Nutrición
  // (FR-02). Al enviar se vuelve ahí, y si la dirección pide el formulario del área, viene precargado.
  const origen = origenDelPedido(parametros.get('volver'));
  const desdeEntrenamiento = origen === 'entrenamiento' || origen === 'entrenamiento-plan';
  const precargaDelOrigen = origen ? PRECARGA_DEL_ORIGEN[origen] : null;
  const precargar = precargaDelOrigen !== null && parametros.get('plantilla') === precargaDelOrigen.plantilla;
  const vuelta = origen ? vueltaDelOrigen(origen, asesoradoId) : null;
  const cuerpo = useRef<HTMLDivElement>(null);
  const estaAbierto = useRef(abierto);
  estaAbierto.current = abierto;

  const cargar = useCallback(async () => {
    setCatalogo(null);
    const lista = await api.listarPlantillasDeFormulario(token);
    if (sesionPerdida(lista)) return;
    setCatalogo(lista.ok ? { ok: true, datos: lista.datos.data } : (lista as Resultado<never>));
  }, [token, sesionPerdida]);

  /**
   * API-HBT-07: solo lo que este profesional ya puede ver de los hábitos de la persona. El 404 de lo inexistente (hoy no la
   * acompaña con el acceso vigente) deja la casilla sin ofrecer; otra falla la deja sin marcar y sin motivo.
   */
  const cargarLoQueSabe = useCallback(async () => {
    setLoQueSabe({ tipo: 'cargando' });
    const r = await api.habitosParaElProfesional(token, asesoradoId);
    if (sesionPerdida(r)) return;
    setLoQueSabe(r.ok ? { tipo: 'listo', datos: r.datos.data } : r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? { tipo: 'sin-acceso' } : { tipo: 'fallo' });
  }, [token, asesoradoId, sesionPerdida]);

  // El catálogo se lee la primera vez que se abre el cajón: entrar a «Solicitudes» no lo pide.
  const catalogoPedido = useRef(false);
  useEffect(() => {
    if (!abierto || catalogoPedido.current) return;
    catalogoPedido.current = true;
    void cargar();
    void cargarLoQueSabe();
  }, [abierto, cargar, cargarLoQueSabe]);

  // ED-40: lo ya pedido a la persona, cada vez que se abre el cajón, para avisar si el mismo formulario sigue sin
  // respuesta. Si no se puede leer, no se avisa nada: la lista de «Solicitudes» sigue a la vista por detrás.
  const [enviadas, setEnviadas] = useState<readonly SolicitudDeFormulario[] | null>(null);
  useEffect(() => {
    if (!abierto) return;
    let vigente = true;
    void (async () => {
      const r = await todasLasPaginas((f) => api.listarSolicitudesDeFormulario(token, asesoradoId, f));
      if (!vigente || sesionPerdida(r)) return;
      setEnviadas(r.ok ? r.datos.data : null);
    })();
    return () => {
      vigente = false;
    };
  }, [abierto, token, asesoradoId, sesionPerdida]);
  // ED-40: las partes abiertas (con más de una parte, vienen plegadas).
  const [partesAbiertas, setPartesAbiertas] = useState<ReadonlySet<string>>(() => new Set());
  // ED-40: el buscador de preguntas. Mientras busca, se ven solo las que coinciden, con sus partes abiertas.
  const [busqueda, setBusqueda] = useState('');

  /** Elige un formulario y lee su versión. Si se elige otro antes de que llegue, la respuesta vieja no pisa a la nueva. */
  const lecturaEnCurso = useRef(0);
  const elegir = useCallback(
    async (p: Plantilla, precarga: boolean) => {
      const esta = ++lecturaEnCurso.current;
      intento.descartar();
      setElegido(p);
      setBusqueda('');
      setLectura({ tipo: 'cargando' });
      setConPrecarga(precarga);
      // Otro formulario: la casilla de «Tus hábitos» vuelve a lo que sugiere el dominio.
      setSumarElegido(null);
      // FR-02 · el «para qué» que sugiere el formulario, si el profesional no escribió uno: no es algo que él escribió.
      const paraQue = propositoAlElegir(propositoActual.current, sugerencia.current, p.key);
      sugerencia.current = paraQue.sugerido;
      setProposito(paraQue.proposito);
      setFaltas((f) => ({ ...f, formulario: undefined, preguntas: undefined, area: undefined, proposito: paraQue.proposito.trim() ? undefined : f.proposito }));
      // API-FRI-01 sirve cualquier versión en formato V2; FRM-02 responde 404 para las que usan tipos nuevos (DL-164 D-5).
      const v = await api.consultarDefinicionDePlantilla(token, p.templateId, p.latestVersionId);
      if (esta !== lecturaEnCurso.current || sesionPerdida(v)) return;
      if (!v.ok) return setLectura({ tipo: 'fallo' });
      setLectura({ tipo: 'lista', version: v.datos.data });
      // F-05: vienen todas marcadas y, requeridas, las que la plantilla sugiere. El profesional cambia lo que necesita.
      // Igual desde «Más» que llegando desde un área: desde Nutrición (FR-02) y, desde DL-165 D-29, desde Entrenamiento,
      // que antes precargaba solo las seis de DL-100. Lo que precarga el área es el formulario, el «para qué» y el área.
      const marcado = marcadoPorOmision(v.datos.data.sections);
      setPartesAbiertas(new Set());
      setPedidas(marcado.pedidas);
      setRequeridas(marcado.requeridas);
      if (precarga && precargaDelOrigen) setArea(precargaDelOrigen.area);
    },
    [token, sesionPerdida, intento, precargaDelOrigen],
  );

  // Al llegar desde un área, abrir una sola vez su formulario con la precarga.
  const precargado = useRef(false);
  useEffect(() => {
    if (!abierto || !precargar || !precargaDelOrigen || precargado.current || !catalogo?.ok) return;
    const plantilla = catalogo.datos.find((p) => p.key === precargaDelOrigen.plantilla);
    if (!plantilla) return;
    precargado.current = true;
    void elegir(plantilla, true);
  }, [abierto, precargar, precargaDelOrigen, catalogo, elegir]);

  // Al tocar «Enviar» con algo sin completar, el foco va a lo primero que falta, en el orden de los pasos.
  useEffect(() => {
    if (intentosConFaltas > 0) cuerpo.current?.querySelector<HTMLElement>('[data-falta], [aria-invalid="true"]')?.focus();
  }, [intentosConFaltas]);

  /** Un cambio del profesional: es algo que se puede perder, y es otro intento (no reusa la clave de uno incierto). */
  const editar = (cambio: () => void, resuelve?: keyof Faltas) => {
    cambio();
    setTocado(true);
    intento.descartar();
    if (resuelve && faltas[resuelve]) setFaltas({ ...faltas, [resuelve]: undefined });
    if (envio.tipo === 'error' && envio.incierto) setEnvio({ ...envio, incierto: false });
  };
  const alternar = (codigo: string, lista: readonly string[], set: (v: readonly string[]) => void) => editar(() => set(lista.includes(codigo) ? lista.filter((c) => c !== codigo) : [...lista, codigo]), 'preguntas');

  const version = lectura?.tipo === 'lista' ? lectura.version : null;
  const preguntas = version ? version.sections.flatMap((s) => s.fields) : [];
  // En el orden del formulario, que es el que va a ver la persona: no en el que se fueron marcando.
  const elegidas = preguntas.map((c) => c.fieldCode).filter((c) => pedidas.includes(c));
  /** El área del pedido: la del formulario, si tiene una propia; si no, la que eligió el profesional. */
  const areaDelPedido: Alcance | '' = version?.domain ?? area;

  /** Hay un formulario elegido y sus preguntas todavía no están (se están leyendo, o esa lectura falló): no se puede enviar. */
  const sinPreguntasTodavia = elegido !== null && !version;

  // Ronda 2.1 (D-22) · «Sumar «Tus hábitos»»: si se ofrece con el formulario elegido, y si viene marcada.
  const habitos = habitosParaSumar({ version, catalogo: catalogo?.ok ? catalogo.datos : null, lectura: loQueSabe });
  const sugerenciaDeHabitos = sugerenciaDelCajon(loQueSabe, new Date().toISOString());
  const conHabitos = habitos !== null && (sumarElegido ?? marcadaPorOmision(sugerenciaDeHabitos));
  const motivo = habitos ? motivoDeLaSugerencia(sugerenciaDeHabitos, (iso) => diaSinElAnioEnCurso(iso)) : null;

  /** El motivo de un rechazo de FRM-03 o de la lectura de una versión, dicho para el profesional. */
  const motivoDe = (r: Resultado<unknown>): string => (r.ok ? '' : (RECHAZO_DE_SOLICITUD[r.tipo === 'API' ? r.codigo : ''] ?? mensajeDeFallo(r, COPY_VINCULO.recursoNoDisponible)));

  /**
   * El segundo pedido, el de «Tus hábitos», en la misma área: con todas sus preguntas, requeridas las que sugiere la
   * plantilla. Un resultado incierto se reintenta una vez con la misma clave (no duplica: es idempotente).
   */
  async function enviarHabitos(p: Plantilla, areaDeLosHabitos: Alcance): Promise<DesenlaceDeEnvio> {
    if (versionDeHabitos.current?.templateVersionId !== p.latestVersionId) {
      const v = await api.consultarDefinicionDePlantilla(token, p.templateId, p.latestVersionId);
      if (!v.ok) return { ok: false, incierto: false, motivo: motivoDe(v) };
      versionDeHabitos.current = v.datos.data;
    }
    const cuerpo = pedidoDeHabitos(versionDeHabitos.current, areaDeLosHabitos);
    let r = await api.crearSolicitudDeFormulario(token, asesoradoId, cuerpo, intentoDeHabitos.actual());
    if (esIncierto(r)) r = await api.crearSolicitudDeFormulario(token, asesoradoId, cuerpo, intentoDeHabitos.actual());
    // Termina este intento, salga como salga: el próximo pedido es otro (una clave retenida no se reusa con otro cuerpo).
    intentoDeHabitos.descartar();
    // La sesión perdida sigue su camino de siempre; lo que se diga después ya no lo lee nadie.
    if (sesionPerdida(r)) return { ok: false, incierto: false, motivo: COPY_VINCULO.recursoNoDisponible };
    return r.ok ? { ok: true } : { ok: false, incierto: esIncierto(r), motivo: motivoDe(r) };
  }

  async function enviar() {
    if (enviando || sinPreguntasTodavia) return;
    const encontradas: { -readonly [K in keyof Faltas]: Faltas[K] } = {};
    if (!elegido) encontradas.formulario = C.faltaElFormulario;
    else if (elegidas.length === 0) encontradas.preguntas = F.sinCamposElegidos;
    if (proposito.trim().length === 0) encontradas.proposito = C.faltaElParaQue;
    if (version && !areaDelPedido) encontradas.area = C.faltaElArea;
    setFaltas(encontradas);
    // Con algo por completar en las preguntas, todas abiertas, y así quedan: el foco tiene que poder llegar, y la tabla no
    // se pliega bajo la casilla que se acaba de marcar cuando la falta se resuelve.
    if (encontradas.preguntas && version) {
      setPartesAbiertas(new Set(version.sections.map((s) => s.sectionCode)));
      // La búsqueda podría esconder la pregunta a la que va el foco.
      setBusqueda('');
    }
    if (Object.keys(encontradas).length > 0 || !version || !areaDelPedido) return setIntentosConFaltas((n) => n + 1);

    // Lo que estaba elegido al tocar «Enviar»: la casilla de «Tus hábitos» no cambia en el medio del envío.
    const habitosAlEnviar = conHabitos ? habitos : null;
    setEnvio({ tipo: 'enviando' });
    const r = await api.crearSolicitudDeFormulario(
      token,
      asesoradoId,
      {
        templateVersionId: version.templateVersionId,
        purpose: proposito.trim(),
        scope: areaDelPedido,
        requestedFieldCodes: elegidas,
        // Requerida ⊆ pedida: si se desmarcó una pregunta, deja de estar requerida (REG-06-212).
        requiredFieldCodes: elegidas.filter((c) => requeridas.includes(c)),
      },
      intento.actual(),
    );
    intento.registrar(r);
    if (sesionPerdida(r)) return setEnvio({ tipo: 'editando' });
    if (!r.ok) {
      // El «no disponible» de una escritura: el marco vuelve a preguntar el acceso (F-09).
      if (r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') avisarSinAcceso();
      // Con «Tus hábitos» marcado y sabiendo que no llegó, se dice que no se envió ninguna: el segundo no se manda.
      const texto = mensajeDelEnvio({ formulario: version.name, sumaHabitos: habitosAlEnviar !== null, area: { ok: false, incierto: esIncierto(r), motivo: motivoDe(r) }, habitos: null }).texto;
      setEnvio({ tipo: 'error', texto, incierto: esIncierto(r) });
      if (!estaAbierto.current) onReabrir();
      return;
    }
    // Ronda 2.1: salió la de área; ahora la de «Tus hábitos», si estaba marcada.
    const desenlaceDeHabitos = habitosAlEnviar ? await enviarHabitos(habitosAlEnviar, areaDelPedido) : null;
    const mensaje = mensajeDelEnvio({ formulario: version.name, sumaHabitos: habitosAlEnviar !== null, area: { ok: true }, habitos: desenlaceDeHabitos }).texto;
    // Enviada: el próximo pedido empieza de cero.
    lecturaEnCurso.current++;
    setElegido(null);
    setLectura(null);
    setPedidas([]);
    setRequeridas([]);
    setConPrecarga(false);
    setProposito('');
    sugerencia.current = null;
    setArea('');
    setFaltas({});
    setTocado(false);
    setSumarElegido(null);
    setEnvio({ tipo: 'editando' });
    // Lo que sabe de los hábitos cambió (hay una solicitud con la parte, pendiente): la próxima sugerencia lo tiene en cuenta.
    void cargarLoQueSabe();
    // CA-FOR-06: si el pedido salió de un área (la evaluación de Entrenamiento, su Plan o el Resumen de Nutrición), se
    // vuelve ahí para seguir trabajando. El éxito lo dice esa página al llegar: esta se abandona, y un aviso suyo no lo
    // leería nadie.
    if (vuelta) {
      dejarAvisoPara(vuelta.ruta, mensaje);
      return router.push(vuelta.href);
    }
    // DL-113: el éxito lo dice la página, no el cajón, que se cierra: un aviso adentro de un diálogo cerrado no lo lee nadie.
    // Si «Tus hábitos» no salió, lo dice el mismo aviso: la de área quedó enviada.
    avisar(mensaje);
    alEnviar();
  }

  const primeraPregunta = preguntas[0]?.fieldCode ?? null;
  // ED-40: lo que hay que saber antes de enviar, fijo junto al botón; y el pedido pendiente del mismo formulario.
  const obligatoriasElegidas = elegidas.filter((c) => requeridas.includes(c)).length;
  const resumen = version ? resumenDelPedido(elegidas.length, obligatoriasElegidas, areaDelPedido ? ETIQUETA_DE_ALCANCE[areaDelPedido] : null) : null;
  const leLlega = version ? loQueLeLlega(persona, version.name, elegidas.length, version.sections.filter((s) => s.fields.some((c) => pedidas.includes(c.fieldCode))).length) : null;
  const pendiente = elegido && enviadas ? pedidoPendiente(enviadas, elegido.templateId) : null;
  const variasPartes = (version?.sections.length ?? 0) > 1;
  const coinciden = version ? preguntasQueCoinciden(version.sections, busqueda) : null;
  const queCoinciden = coinciden ? coinciden.flat() : [];
  const parteAbierta = (codigo: string) => !variasPartes || partesAbiertas.has(codigo);
  const alternarParte = (codigo: string) =>
    setPartesAbiertas((s) => {
      const n = new Set(s);
      if (!n.delete(codigo)) n.add(codigo);
      return n;
    });
  return (
    <Cajon
      abierto={abierto}
      titulo={F.pedirInformacion}
      sobretitulo={persona}
      ocupado={enviando}
      onCerrar={onCerrar}
      pie={
        <>
          <button type="button" className="boton boton--primario" onClick={() => void enviar()} disabled={enviando || sinPreguntasTodavia} aria-busy={enviando} data-enviar>
            <Icono nombre="solicitar" tamano={18} />
            {enviando ? C.enviando : envio.tipo === 'error' && envio.incierto ? COPY.reintentar : F.enviarSolicitud}
          </button>
          {/* Antes de un acto que no se deshace, lo que hay que saber va junto al botón, siempre a la vista. */}
          {resumen ? (
            <p className="pedido__resumen" data-resumen-del-pedido aria-live="polite">
              <strong>{resumen}</strong>
            </p>
          ) : null}
          {/* ED-40 (TEST-EDP-058): un pedido pendiente del mismo formulario se dice antes de enviar; no lo impide. */}
          {pendiente ? (
            <p className="pedido__aviso" data-pedido-pendiente>
              <Icono nombre="aviso" tamano={18} />
              {avisoDelPendiente(pendiente.templateName, diaSinElAnioEnCurso(pendiente.createdAt))}
            </p>
          ) : null}
          <p className="nota pedido__antes-de-enviar">
            {leLlega ?? C.laVaAVer}
            <br />
            {C.noSeCancelaNiSeEdita}
          </p>
        </>
      }
    >
      <div ref={cuerpo} className="pedido">
        <p className="pedido__aviso">
          <Icono nombre="info" tamano={18} />
          {F.solicitarNoEsAcceder}
        </p>
        {/* Solo si de verdad hay algo precargado: con `volver=entrenamiento` y sin formulario, no hay nada elegido. */}
        {conPrecarga && vuelta ? (
          <p className="pedido__aviso" data-desde={origen}>
            <Icono nombre={desdeEntrenamiento ? 'entrenamiento' : 'nutricion'} tamano={18} />
            <span>
              {desdeEntrenamiento ? F.pedidoDesdeEntrenamiento : F.pedidoDesdeNutricion} <Enlace href={vuelta.href}>{vuelta.texto}</Enlace>
            </span>
          </p>
        ) : null}
        {envio.tipo === 'error' ? (
          <Aviso tipo="error" enfocar>
            <p>{envio.texto}</p>
          </Aviso>
        ) : null}

        <section className="paso-del-pedido" aria-labelledby={`${id}-paso-1`} data-paso="formulario">
          <div className="paso-del-pedido__cabecera">
            <TituloDelPaso id={`${id}-paso-1`} numero={1} texto={C.paso.formulario} />
            <p className="nota">{F.plantillaDemostracion}</p>
          </div>
          <EstadoDeLectura r={catalogo} onReintentar={() => void cargar()}>
            {catalogo?.ok && catalogo.datos.length === 0 ? <p>{F.sinPlantillas}</p> : null}
            {catalogo?.ok && catalogo.datos.length > 0 ? (
              <div className="formularios-del-pedido" role="radiogroup" aria-labelledby={`${id}-paso-1`} aria-describedby={faltas.formulario ? `${id}-falta-formulario` : undefined}>
                {catalogo.datos.map((p, i) => {
                  const es = elegido?.templateId === p.templateId;
                  return (
                    <div key={p.templateId} className="formulario-del-pedido" data-formulario={p.key} data-elegido={es ? 'si' : undefined}>
                      <label>
                        <input
                          type="radio"
                          name={`${id}-formulario`}
                          checked={es}
                          onChange={() => void elegir(p, false)}
                          disabled={enviando}
                          aria-describedby={es && descripcionDeLaPlantilla(p.key, p.purpose) ? `${id}-descripcion` : undefined}
                          data-falta={faltas.formulario && i === 0 ? 'si' : undefined}
                        />
                        <span className="formulario-del-pedido__nombre">{p.name}</span>
                        <span className="formulario-del-pedido__cuenta">{C.preguntas(p.fieldCount)}</span>
                      </label>
                      {/* La descripción, solo en el elegido: elegir no envía nada, y la lista se recorre de un vistazo. ED-05: la
                          del dominio, por la clave, en palabras para el profesional; nunca el propósito guardado, que lleva
                          notas del equipo. */}
                      {es && descripcionDeLaPlantilla(p.key, p.purpose) ? (
                        <p className="formulario-del-pedido__descripcion" id={`${id}-descripcion`}>
                          {/* DL-165 D-3: no se dice cuánto le lleva a la persona; ella ve «Parte 1 de 6». */}
                          {descripcionDeLaPlantilla(p.key, p.purpose)}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </EstadoDeLectura>
          {faltas.formulario ? <Falta id={`${id}-falta-formulario`} texto={faltas.formulario} /> : null}
          {/* Ronda 2.1 (D-15 nueva; D-22): «Tus hábitos» es otro formulario; se puede sumar al de área en el mismo paso. */}
          {habitos ? (
            <div className="pedido__sumar-habitos" data-sumar-habitos data-marcada={conHabitos ? 'si' : 'no'} data-motivo={sugerenciaDeHabitos?.motivo}>
              <label className="pedido__sumar-habitos-casilla">
                <input
                  type="checkbox"
                  checked={conHabitos}
                  onChange={(e) => {
                    const marcar = e.target.checked;
                    editar(() => setSumarElegido(marcar));
                  }}
                  disabled={enviando}
                  aria-describedby={`${id}-sumar-habitos-que-es${motivo ? ` ${id}-sumar-habitos-motivo` : ''}`}
                />
                <span>{H.sumarHabitos}</span>
              </label>
              <p className="nota" id={`${id}-sumar-habitos-que-es`}>
                {H.sumarHabitosQueEs}
              </p>
              {motivo ? (
                <p className="nota" id={`${id}-sumar-habitos-motivo`} data-sugerencia>
                  {motivo}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="paso-del-pedido" aria-labelledby={`${id}-paso-2`} data-paso="preguntas">
          <div className="paso-del-pedido__cabecera">
            <TituloDelPaso id={`${id}-paso-2`} numero={2} texto={C.paso.preguntas} />
            {/* La cuenta sigue a las casillas: dice cuántas se van a pedir. */}
            {version ? (
              <p className="nota">
                <span data-elegidas aria-live="polite">
                  {C.elegidas(elegidas.length, preguntas.length)} {/* DL-165 D-7: las obligatorias, contadas a la vista. */}
                  <strong data-obligatorias>{C.obligatoriasElegidas(elegidas.filter((c) => requeridas.includes(c)).length)}</strong>
                </span>
                {/* Vengan de un área o de «Más», vienen todas (DL-165 D-29: también desde Entrenamiento). */}
                {` ${C.vienenTodasElegidas}`}
              </p>
            ) : null}
          </div>
          {!elegido ? <p className="nota">{C.preguntasAlElegir}</p> : null}
          {lectura?.tipo === 'cargando' ? (
            <p className="cargando" role="status">
              {C.leyendoLasPreguntas}
            </p>
          ) : null}
          {/* Una falla de esta lectura no es «el formulario no tiene preguntas». */}
          {lectura?.tipo === 'fallo' && elegido ? <ErrorConReintento mensaje={C.preguntasNoCargaron} onReintentar={() => void elegir(elegido, conPrecarga)} /> : null}
          {version ? (
            <>
              {/* DL-164 D-5: la APK instalada no ve una versión con tipos nuevos; mientras la persona no actualice, se carga con ella. */}
              {version.usesNewTypes ? (
                <p className="pedido__aviso" data-app-nueva>
                  <Icono nombre="aviso" tamano={18} />
                  {V.web.appNueva}
                </p>
              ) : null}
              <p className="nota">
                {preguntas.some((c) => c.requiredByDefault) ? `${C.obligatoriasDelFormulario} ` : ''}
                {F.ayudaRequerido}
              </p>
              {/* Solo si alguna pregunta tiene aclaración. Va arriba de la tabla: no se mueve de lugar al abrirlas. */}
              {preguntas.some((c) => c.helpText) ? (
                <p className="nota preguntas-del-pedido__aclaraciones">
                  <button type="button" className="boton boton--enlace" aria-expanded={conAclaraciones} onClick={() => setConAclaraciones(!conAclaraciones)}>
                    {conAclaraciones ? C.ocultarAclaraciones : C.verAclaraciones}
                  </button>{' '}
                  {C.aclaracionesDeLasPreguntas}
                </p>
              ) : null}
              {/* ED-40: el buscador de preguntas, arriba de la tabla. Escape lo borra. */}
              <div className="campo preguntas-del-pedido__buscador">
                <label htmlFor={`${id}-buscar-pregunta`}>{B.etiqueta}</label>
                <input
                  id={`${id}-buscar-pregunta`}
                  type="search"
                  value={busqueda}
                  autoComplete="off"
                  aria-describedby={`${id}-buscar-pregunta-ayuda`}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && busqueda) {
                      e.preventDefault();
                      e.stopPropagation();
                      setBusqueda('');
                    }
                  }}
                />
                <span className="nota" id={`${id}-buscar-pregunta-ayuda`}>
                  {B.ayuda}
                </span>
              </div>
              {coinciden ? (
                <p className="nota preguntas-del-pedido__resultado" role="status" data-resultado-de-la-busqueda>
                  {resultadoDeLaBusqueda(queCoinciden.length, busqueda)}{' '}
                  {queCoinciden.length > 0 ? (
                    <>
                      <button type="button" className="boton boton--enlace" disabled={enviando} onClick={() => editar(() => setPedidas(pedirTodas(pedidas, queCoinciden)), 'preguntas')}>
                        {B.pedirLasQueCoinciden(queCoinciden.length)}
                      </button>{' '}
                      <button type="button" className="boton boton--enlace" disabled={enviando} onClick={() => editar(() => setPedidas(ninguna(pedidas, queCoinciden)))}>
                        {B.ningunaDeLasQueCoinciden(queCoinciden.length)}
                      </button>{' '}
                    </>
                  ) : null}
                  <button type="button" className="boton boton--enlace" onClick={() => setBusqueda('')}>
                    {B.borrar}
                  </button>
                </p>
              ) : null}
              {variasPartes && !coinciden ? (
                <p className="nota">
                  <button
                    type="button"
                    className="boton boton--enlace"
                    data-ver-todas
                    onClick={() => setPartesAbiertas(version.sections.every((s) => partesAbiertas.has(s.sectionCode)) ? new Set() : new Set(version.sections.map((s) => s.sectionCode)))}
                  >
                    {version.sections.every((s) => partesAbiertas.has(s.sectionCode)) ? COPY_PARTES.plegarTodas : COPY_PARTES.verTodas}
                  </button>
                </p>
              ) : null}
              {coinciden && queCoinciden.length === 0 ? null : (
              <table className="preguntas-del-pedido" aria-labelledby={`${id}-paso-2`} aria-describedby={faltas.preguntas ? `${id}-falta-preguntas` : undefined}>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="visualmente-oculto">{C.pedir}</span>
                    </th>
                    <th scope="col">{C.pregunta}</th>
                    <th scope="col">{C.respondeCon}</th>
                    <th scope="col">{C.requerida}</th>
                  </tr>
                </thead>
                {version.sections.map((s, i) => coinciden && coinciden[i]!.length === 0 ? null : (
                  <tbody key={s.sectionCode}>
                    {/* El título de la sección, solo si el formulario tiene más de una. ED-40: plegada, con su cuenta (las
                        obligatorias y lo que se suma si corresponde se cuentan también plegada) y «Pedir todas» o
                        «Ninguna». Plegar no cambia lo que se envía. */}
                    {/* ED-40: buscando, la parte dice cuántas de las suyas coinciden; «Pedir todas» y «Ninguna» van arriba,
                        sobre lo que coincide, para no tocar sin querer las que no se ven. */}
                    {variasPartes && coinciden ? (
                      <tr className="preguntas-del-pedido__seccion" data-parte={s.sectionCode} data-abierta="si">
                        <th colSpan={4} scope="rowgroup">
                          <span className="preguntas-del-pedido__parte">
                            <span className="preguntas-del-pedido__titulo-de-la-parte">{s.title}</span>
                            <span className="nota">
                              {coinciden[i]!.length} de {s.fields.length}
                            </span>
                          </span>
                        </th>
                      </tr>
                    ) : null}
                    {variasPartes && !coinciden ? (
                      <tr className="preguntas-del-pedido__seccion" data-parte={s.sectionCode} data-abierta={parteAbierta(s.sectionCode) ? 'si' : undefined}>
                        <th colSpan={4} scope="rowgroup">
                          <span className="preguntas-del-pedido__parte">
                            <button type="button" className="boton boton--enlace" aria-expanded={parteAbierta(s.sectionCode)} onClick={() => alternarParte(s.sectionCode)}>
                              <Icono nombre={parteAbierta(s.sectionCode) ? 'arriba' : 'abajo'} tamano={18} />
                              {s.title}
                            </button>
                            <span className="nota" data-cuenta-de-la-parte>
                              {cuentaEnPalabras(cuentaDeLaParte(s.fields, pedidas, requeridas))}
                            </span>
                            <button type="button" className="boton boton--enlace" disabled={enviando} onClick={() => editar(() => setPedidas(pedirTodas(pedidas, s.fields)), 'preguntas')}>
                              {COPY_PARTES.pedirTodas}
                              <span className="visualmente-oculto"> {COPY_PARTES.deLaParte(s.title)}</span>
                            </button>
                            <button type="button" className="boton boton--enlace" disabled={enviando} onClick={() => editar(() => setPedidas(ninguna(pedidas, s.fields)))}>
                              {COPY_PARTES.ninguna}
                              <span className="visualmente-oculto"> {COPY_PARTES.deLaParte(s.title)}</span>
                            </button>
                          </span>
                        </th>
                      </tr>
                    ) : null}
                    {(coinciden ? coinciden[i]! : filasALaVista(s.fields, parteAbierta(s.sectionCode))).map((c) => {
                      const pedida = pedidas.includes(c.fieldCode);
                      const obligatoria = pedida && requeridas.includes(c.fieldCode);
                      // DL-164 D-2: una pregunta condicional aparece solo cuando se cumple su condición; se dice con palabras.
                      const condicion = condicionEnPalabras(c, preguntas);
                      const descripcion =
                        [c.helpText && conAclaraciones ? `${id}-ayuda-${c.fieldCode}` : null, condicion ? `${id}-condicion-${c.fieldCode}` : null, noVienePedida(c) && !pedida ? `${id}-sin-pedir-${c.fieldCode}` : null]
                          .filter(Boolean)
                          .join(' ') || undefined;
                      return (
                        <tr key={c.fieldCode} data-pregunta={c.fieldCode} data-pedida={pedida ? 'si' : undefined} data-obligatoria={obligatoria ? 'si' : undefined} data-condicional={condicion ? 'si' : undefined}>
                          <td className="preguntas-del-pedido__casilla">
                            <input
                              type="checkbox"
                              id={`${id}-pedir-${c.fieldCode}`}
                              checked={pedida}
                              onChange={() => alternar(c.fieldCode, pedidas, setPedidas)}
                              disabled={enviando}
                              aria-describedby={descripcion}
                              data-falta={faltas.preguntas && c.fieldCode === primeraPregunta ? 'si' : undefined}
                            />
                          </td>
                          <th scope="row">
                            <label htmlFor={`${id}-pedir-${c.fieldCode}`}>{c.label}</label>
                            {/* DL-165 D-7: la obligatoria se lee en la fila, además de en su casilla. */}
                            {obligatoria ? (
                              <span className="etiqueta-de-dato preguntas-del-pedido__obligatoria" data-obligatoria="si" aria-hidden="true">
                                {V.obligatoria}
                              </span>
                            ) : null}
                            {/* DL-165 D-4: la que la plantilla no trae pedida (el embarazo) dice que se suma cuando corresponde. */}
                            {noVienePedida(c) && !pedida ? (
                              <span className="preguntas-del-pedido__condicion" id={`${id}-sin-pedir-${c.fieldCode}`} data-sin-pedir>
                                {C.noVienePedida}
                              </span>
                            ) : null}
                            {condicion ? (
                              <span className="preguntas-del-pedido__condicion" id={`${id}-condicion-${c.fieldCode}`}>
                                {condicion}
                              </span>
                            ) : null}
                            {/* Lo que va a leer la persona debajo de la pregunta: a veces dice el rango que se acepta. */}
                            {c.helpText && conAclaraciones ? (
                              <span className="preguntas-del-pedido__ayuda" id={`${id}-ayuda-${c.fieldCode}`}>
                                {c.helpText}
                              </span>
                            ) : null}
                          </th>
                          <td className="preguntas-del-pedido__responde" data-etiqueta={C.respondeCon}>
                            {respondeConV2(c)}
                          </td>
                          <td className="preguntas-del-pedido__requerida">
                            {/* Solo una pregunta pedida puede ser requerida. Lo que se ve marcado es lo que sale. */}
                            <label className="casilla-de-celda">
                              <input
                                type="checkbox"
                                aria-label={`${F.marcarRequerido}: ${c.label}`}
                                checked={pedida && requeridas.includes(c.fieldCode)}
                                disabled={!pedida || enviando}
                                onChange={() => alternar(c.fieldCode, requeridas, setRequeridas)}
                              />
                              <span className="casilla-de-celda__texto" aria-hidden="true">
                                {F.marcarRequerido}
                              </span>
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                ))}
              </table>
              )}
            </>
          ) : null}
          {faltas.preguntas ? <Falta id={`${id}-falta-preguntas`} texto={faltas.preguntas} /> : null}
        </section>

        <section className="paso-del-pedido" aria-labelledby={`${id}-paso-3`} data-paso="para-que">
          <div className="paso-del-pedido__cabecera">
            <TituloDelPaso id={`${id}-paso-3`} numero={3} texto={C.paso.paraQue} />
          </div>
          <div className="pedido__dos-campos">
            <Campo
              id={`${id}-proposito`}
              etiqueta={F.proposito}
              ayuda={F.ayudaProposito}
              error={faltas.proposito}
              value={proposito}
              onChange={(e) => editar(() => setProposito(e.target.value), 'proposito')}
              maxLength={300}
              autoComplete="off"
              disabled={enviando}
            />
            {version?.domain ? (
              // Un formulario con área propia se pide solo en esa: se dice, no se deja elegir otra.
              <div className="campo" data-area="fija">
                <label htmlFor={`${id}-area`}>{F.alcance}</label>
                <p id={`${id}-area-ayuda`} className="campo__ayuda">
                  {C.soloDeEstaArea(ETIQUETA_DE_ALCANCE[version.domain])}
                </p>
                <span className="campo-fijo">
                  <input id={`${id}-area`} value={ETIQUETA_DE_ALCANCE[version.domain]} readOnly aria-describedby={`${id}-area-ayuda`} />
                  <Icono nombre="candado" tamano={18} />
                </span>
              </div>
            ) : (
              <div className={`campo${faltas.area ? ' campo--error' : ''}`} data-area="a-elegir">
                <label htmlFor={`${id}-area`}>{F.alcance}</label>
                <p id={`${id}-area-ayuda`} className="campo__ayuda">
                  {version ? C.areaAElegir : C.areaSegunElFormulario}
                </p>
                <select
                  id={`${id}-area`}
                  value={area}
                  aria-invalid={faltas.area ? true : undefined}
                  aria-describedby={`${id}-area-ayuda${faltas.area ? ` ${id}-area-error` : ''}`}
                  onChange={(e) => editar(() => setArea(e.target.value as Alcance | ''), 'area')}
                  disabled={enviando}
                >
                  <option value="">{C.elegiUnArea}</option>
                  {ALCANCES.map((a) => (
                    <option key={a} value={a}>
                      {ETIQUETA_DE_ALCANCE[a]}
                    </option>
                  ))}
                </select>
                {faltas.area ? (
                  <p id={`${id}-area-error`} className="campo__error">
                    <span aria-hidden="true">⚠ </span>
                    {faltas.area}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </div>
    </Cajon>
  );
}

/** El título de un paso: su número, en un círculo, y su nombre. Se leen como una sola frase («1 Qué formulario»). */
function TituloDelPaso({ id, numero, texto }: { id: string; numero: number; texto: string }) {
  return (
    <h3 id={id}>
      <span className="paso-del-pedido__numero">{numero}</span> {texto}
    </h3>
  );
}

/** Lo que falta en un paso, dicho en su lugar, con texto y no solo con color. */
function Falta({ id, texto }: { id: string; texto: string }) {
  return (
    <p id={id} className="campo__error" role="alert">
      <span aria-hidden="true">⚠ </span>
      {texto}
    </p>
  );
}
