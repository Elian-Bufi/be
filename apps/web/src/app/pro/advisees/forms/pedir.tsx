'use client';

/**
 * «Pedir información» (API-FRM-01, 02 y 03; WP-ESCRITORIO-AREAS, parte 4; maqueta 27). Un cajón que se abre sobre
 * «Solicitudes», que sigue a la vista por detrás, con los tres pasos a la vez: qué formulario, qué preguntas, y para qué y
 * en qué área. Es la única escritura de Información y no se deshace —una solicitud enviada no se cancela ni se edita—:
 * por eso lo que hay que saber antes de enviar queda fijo, junto al botón.
 *
 * **Al elegir un formulario vienen todas sus preguntas marcadas,** y el profesional desmarca las que no necesita
 * (decisión de Dirección del 2026-10-12; F-05 de WP-ESCRITORIO-AREAS, DL-131). La minimización sigue siendo del
 * profesional, no del catálogo: la cuenta de las elegidas está a la vista, ninguna viene como requerida, y la API sigue
 * evaluando la pertinencia de cada pregunta al crear la solicitud (FRM-03): marcarlas todas no amplía lo que se puede
 * pedir. No viene ningún formulario elegido: esa primera decisión es del profesional.
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
 * `volver=entrenamiento`), el cajón precarga el formulario ratificado, sus preguntas, las requeridas y el área, y al enviar
 * vuelve a Entrenamiento. Es una propuesta editable, no una excepción a la minimización: se puede desmarcar antes de
 * enviar.
 */
import { ALCANCES, CONTEXTO_DE_ENTRENAMIENTO, COPY, COPY_FORMULARIOS as F, COPY_SOLICITUDES as C, COPY_VINCULO, ETIQUETA_DE_ALCANCE, respondeCon, type Alcance, type Plantilla, type VersionDePlantilla } from '@be/domain';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Cajon } from '../../../../components/cajon';
import { ErrorConReintento } from '../../../../components/estados';
import { Aviso, Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api, type Resultado } from '../../../../lib/api';
import { dejarAvisoPara } from '../../../../lib/aviso-al-llegar';
import { esIncierto, mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useAvisarSinAcceso, useCambiosSinGuardar, usePersonaDelArea } from '../marco-del-area';
import { EstadoDeLectura, useFormularios } from './formularios';

/** A dónde se vuelve cuando el pedido salió de la evaluación de entrenamiento. Ahí lo espera `training/resumen.tsx`. */
const RUTA_DE_ENTRENAMIENTO = '/pro/advisees/training';

/** Los rechazos de FRM-03 que dependen de lo elegido: se dicen, en vez de «el servicio no está disponible». */
const RECHAZO_DE_SOLICITUD: Readonly<Record<string, string>> = {
  FORM_TEMPLATE_NOT_SELECTABLE: F.plantillaNoSeleccionable,
  FORM_REQUEST_NOT_ALLOWED: F.campoNoPertinente,
  FORM_REQUEST_INVALID: F.solicitudInvalida,
};

/** La versión del formulario elegido: de ahí salen sus preguntas. */
type Lectura = { readonly tipo: 'cargando' } | { readonly tipo: 'lista'; readonly version: VersionDePlantilla } | { readonly tipo: 'fallo' };
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
  const [catalogo, setCatalogo] = useState<Resultado<readonly Plantilla[]> | null>(null);
  const [elegido, setElegido] = useState<Plantilla | null>(null);
  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [pedidas, setPedidas] = useState<readonly string[]>([]);
  const [requeridas, setRequeridas] = useState<readonly string[]>([]);
  /** Lo elegido vino de la precarga ratificada de Entrenamiento (DL-100), no de «todas marcadas». */
  const [conPrecarga, setConPrecarga] = useState(false);
  const [proposito, setProposito] = useState('');
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

  const desdeEntrenamiento = parametros.get('volver') === 'entrenamiento';
  const precargar = desdeEntrenamiento && parametros.get('plantilla') === CONTEXTO_DE_ENTRENAMIENTO.clavePlantilla;
  const rutaDeEntrenamiento = `${RUTA_DE_ENTRENAMIENTO}?id=${encodeURIComponent(asesoradoId)}`;
  const cuerpo = useRef<HTMLDivElement>(null);
  const estaAbierto = useRef(abierto);
  estaAbierto.current = abierto;

  const cargar = useCallback(async () => {
    setCatalogo(null);
    const lista = await api.listarPlantillasDeFormulario(token);
    if (sesionPerdida(lista)) return;
    setCatalogo(lista.ok ? { ok: true, datos: lista.datos.data } : (lista as Resultado<never>));
  }, [token, sesionPerdida]);

  // El catálogo se lee la primera vez que se abre el cajón: entrar a «Solicitudes» no lo pide.
  const catalogoPedido = useRef(false);
  useEffect(() => {
    if (!abierto || catalogoPedido.current) return;
    catalogoPedido.current = true;
    void cargar();
  }, [abierto, cargar]);

  /** Elige un formulario y lee su versión. Si se elige otro antes de que llegue, la respuesta vieja no pisa a la nueva. */
  const lecturaEnCurso = useRef(0);
  const elegir = useCallback(
    async (p: Plantilla, precarga: boolean) => {
      const esta = ++lecturaEnCurso.current;
      intento.descartar();
      setElegido(p);
      setLectura({ tipo: 'cargando' });
      setConPrecarga(precarga);
      setFaltas((f) => ({ ...f, formulario: undefined, preguntas: undefined, area: undefined }));
      const v = await api.consultarVersionDePlantilla(token, p.templateId, p.latestVersionId);
      if (esta !== lecturaEnCurso.current || sesionPerdida(v)) return;
      if (!v.ok) return setLectura({ tipo: 'fallo' });
      const preguntas = v.datos.data.sections.flatMap((s) => s.fields.map((c) => c.fieldCode));
      setLectura({ tipo: 'lista', version: v.datos.data });
      if (!precarga) {
        // F-05: vienen todas marcadas, y ninguna como requerida. El profesional desmarca lo que no necesita.
        setPedidas(preguntas);
        setRequeridas([]);
        return;
      }
      // DL-100: solo lo que la versión elegida realmente tiene; si el catálogo cambiara, no se pide una pregunta inexistente.
      setPedidas(CONTEXTO_DE_ENTRENAMIENTO.campos.filter((c) => preguntas.includes(c)));
      setRequeridas(CONTEXTO_DE_ENTRENAMIENTO.requeridos.filter((c) => preguntas.includes(c)));
      setProposito(F.propositoDeContextoDeEntrenamiento);
      setArea('ENTRENAMIENTO');
    },
    [token, sesionPerdida, intento],
  );

  // Al llegar desde Entrenamiento, abrir una sola vez el formulario ratificado con su precarga.
  const precargado = useRef(false);
  useEffect(() => {
    if (!abierto || !precargar || precargado.current || !catalogo?.ok) return;
    const plantilla = catalogo.datos.find((p) => p.key === CONTEXTO_DE_ENTRENAMIENTO.clavePlantilla);
    if (!plantilla) return;
    precargado.current = true;
    void elegir(plantilla, true);
  }, [abierto, precargar, catalogo, elegir]);

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

  async function enviar() {
    if (enviando || sinPreguntasTodavia) return;
    const encontradas: { -readonly [K in keyof Faltas]: Faltas[K] } = {};
    if (!elegido) encontradas.formulario = C.faltaElFormulario;
    else if (elegidas.length === 0) encontradas.preguntas = F.sinCamposElegidos;
    if (proposito.trim().length === 0) encontradas.proposito = C.faltaElParaQue;
    if (version && !areaDelPedido) encontradas.area = C.faltaElArea;
    setFaltas(encontradas);
    if (Object.keys(encontradas).length > 0 || !version || !areaDelPedido) return setIntentosConFaltas((n) => n + 1);

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
      setEnvio({ tipo: 'error', texto: RECHAZO_DE_SOLICITUD[r.tipo === 'API' ? r.codigo : ''] ?? mensajeDeFallo(r, COPY_VINCULO.recursoNoDisponible), incierto: esIncierto(r) });
      if (!estaAbierto.current) onReabrir();
      return;
    }
    // Enviada: el próximo pedido empieza de cero.
    lecturaEnCurso.current++;
    setElegido(null);
    setLectura(null);
    setPedidas([]);
    setRequeridas([]);
    setConPrecarga(false);
    setProposito('');
    setArea('');
    setFaltas({});
    setTocado(false);
    setEnvio({ tipo: 'editando' });
    // CA-FOR-06: si el pedido salió de la evaluación, se vuelve a ella para seguir trabajando. El éxito lo dice
    // Entrenamiento al llegar: esta página se abandona, y un aviso suyo no lo leería nadie.
    if (desdeEntrenamiento) {
      dejarAvisoPara(RUTA_DE_ENTRENAMIENTO, F.solicitudEnviada);
      return router.push(rutaDeEntrenamiento);
    }
    // DL-113: el éxito lo dice la página, no el cajón, que se cierra: un aviso adentro de un diálogo cerrado no lo lee nadie.
    avisar(F.solicitudEnviada);
    alEnviar();
  }

  const primeraPregunta = preguntas[0]?.fieldCode ?? null;
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
          <p className="nota pedido__antes-de-enviar">
            {C.laVaAVer}
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
        {conPrecarga ? (
          <p className="pedido__aviso" data-desde-entrenamiento>
            <Icono nombre="entrenamiento" tamano={18} />
            <span>
              {F.pedidoDesdeEntrenamiento} <Link href={rutaDeEntrenamiento}>{F.volverAEntrenamiento}</Link>
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
                          aria-describedby={es ? `${id}-descripcion` : undefined}
                          data-falta={faltas.formulario && i === 0 ? 'si' : undefined}
                        />
                        <span className="formulario-del-pedido__nombre">{p.name}</span>
                        <span className="formulario-del-pedido__cuenta">{C.preguntas(p.fieldCount)}</span>
                      </label>
                      {/* La descripción, solo en el elegido: elegir no envía nada, y la lista se recorre de un vistazo. */}
                      {es ? (
                        <p className="formulario-del-pedido__descripcion" id={`${id}-descripcion`}>
                          {p.purpose}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </EstadoDeLectura>
          {faltas.formulario ? <Falta id={`${id}-falta-formulario`} texto={faltas.formulario} /> : null}
        </section>

        <section className="paso-del-pedido" aria-labelledby={`${id}-paso-2`} data-paso="preguntas">
          <div className="paso-del-pedido__cabecera">
            <TituloDelPaso id={`${id}-paso-2`} numero={2} texto={C.paso.preguntas} />
            {/* La cuenta sigue a las casillas: dice cuántas se van a pedir. */}
            {version ? (
              <p className="nota">
                <span data-elegidas aria-live="polite">
                  {C.elegidas(elegidas.length, preguntas.length)}
                </span>
                {conPrecarga ? null : ` ${C.vienenTodasElegidas}`}
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
              <p className="nota">{F.ayudaRequerido}</p>
              {/* Solo si alguna pregunta tiene aclaración. Va arriba de la tabla: no se mueve de lugar al abrirlas. */}
              {preguntas.some((c) => c.helpText) ? (
                <p className="nota preguntas-del-pedido__aclaraciones">
                  <button type="button" className="boton boton--enlace" aria-expanded={conAclaraciones} onClick={() => setConAclaraciones(!conAclaraciones)}>
                    {conAclaraciones ? C.ocultarAclaraciones : C.verAclaraciones}
                  </button>{' '}
                  {C.aclaracionesDeLasPreguntas}
                </p>
              ) : null}
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
                {version.sections.map((s) => (
                  <tbody key={s.sectionCode}>
                    {/* El título de la sección, solo si el formulario tiene más de una. */}
                    {version.sections.length > 1 ? (
                      <tr className="preguntas-del-pedido__seccion">
                        <th colSpan={4} scope="rowgroup">
                          {s.title}
                        </th>
                      </tr>
                    ) : null}
                    {s.fields.map((c) => {
                      const pedida = pedidas.includes(c.fieldCode);
                      return (
                        <tr key={c.fieldCode} data-pregunta={c.fieldCode} data-pedida={pedida ? 'si' : undefined}>
                          <td className="preguntas-del-pedido__casilla">
                            <input
                              type="checkbox"
                              id={`${id}-pedir-${c.fieldCode}`}
                              checked={pedida}
                              onChange={() => alternar(c.fieldCode, pedidas, setPedidas)}
                              disabled={enviando}
                              aria-describedby={c.helpText && conAclaraciones ? `${id}-ayuda-${c.fieldCode}` : undefined}
                              data-falta={faltas.preguntas && c.fieldCode === primeraPregunta ? 'si' : undefined}
                            />
                          </td>
                          <th scope="row">
                            <label htmlFor={`${id}-pedir-${c.fieldCode}`}>{c.label}</label>
                            {/* Lo que va a leer la persona debajo de la pregunta: a veces dice el rango que se acepta. */}
                            {c.helpText && conAclaraciones ? (
                              <span className="preguntas-del-pedido__ayuda" id={`${id}-ayuda-${c.fieldCode}`}>
                                {c.helpText}
                              </span>
                            ) : null}
                          </th>
                          <td className="preguntas-del-pedido__responde" data-etiqueta={C.respondeCon}>
                            {respondeCon(c)}
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
