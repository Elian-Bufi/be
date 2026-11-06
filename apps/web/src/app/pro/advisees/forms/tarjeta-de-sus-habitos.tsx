'use client';

/**
 * «Sus hábitos», en Información de la ficha (WP-FORMULARIOS-RONDA-2, FR-10; DL-165 D-9; §4.4 del paquete): los hábitos
 * vigentes que la persona le comparte a este profesional (API-HBT-05), «Declarado por la persona», con la fecha desde la
 * que se los comparte y cuándo se actualizaron.
 * - No dice de qué formulario salieron ni el área de otro profesional (§4.4): el origen va como «en un formulario» o «en
 *   Mis hábitos». Tampoco muestra la historia, que es de la persona.
 * - Cada valor va en renglones, con las etiquetas de la parte (`lineasDeValor`): una lista, un renglón por actividad.
 *
 * Ronda 2.1 (DL-165 D-17 nueva): **si no se los comparte** y el PDP lo deja acompañarla (API-HBT-07 responde), la tarjeta
 * lo dice sin presión («Es su decisión») y ofrece «Pedir acceso a sus hábitos» (API-HBT-06): le llega a la persona como
 * novedad importante, y lo decide ella. Con un pedido hecho, dice cuándo y desde cuándo puede volver a pedirlo (D-24); nunca
 * qué respondió la persona.
 * - **Sin acceso no hay tarjeta ni rastro.** Mientras se lee no se dibuja nada; si API-HBT-07 también da el 404 de lo
 *   inexistente (el PDP no lo deja acompañarla hoy), o falla, tampoco: ni un «cargando», ni un error, ni un lugar vacío.
 *   Solo la sesión perdida sigue su camino de siempre.
 */
import { COPY, COPY_HABITOS, type Alcance } from '@be/domain';
import { useCallback, useEffect, useId, useState } from 'react';
import { Aviso } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { diaSinElAnioEnCurso } from '../../../../lib/formato';
import { esIncierto, mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useAvisarSinAcceso } from '../marco-del-area';
import { lineasDeValor, origenDelPedido, PRECARGA_DEL_ORIGEN } from './formulario-de-inicio';
import { useFormularios } from './formularios';
import { areaDelPedidoDeAcceso, tarjetaDeSusHabitos, tarjetaSinAcceso, trasPedirAcceso, type HabitosQueComparte, type LoQueSabeDeSusHabitos } from './sus-habitos';

const H = COPY_HABITOS.web;
const fecha = (iso: string) => diaSinElAnioEnCurso(iso);

/** Lo que se leyó: los hábitos que le comparte (HBT-05), o lo que sabe de ellos sin verlos (HBT-07). */
type Lectura = { readonly tipo: 'los-ve'; readonly datos: HabitosQueComparte } | { readonly tipo: 'no-los-ve'; readonly datos: LoQueSabeDeSusHabitos };

export function SusHabitos() {
  const { token, asesoradoId, sesionPerdida, parametros } = useFormularios();
  const id = useId();
  const [lectura, setLectura] = useState<Lectura | null>(null);
  /** Sube para volver a leer, después de pedir acceso o de un rechazo que cambia lo que hay que mostrar. */
  const [tanda, setTanda] = useState(0);
  const releer = useCallback(() => setTanda((n) => n + 1), []);
  // El área de donde llegó (el Resumen de Nutrición o de Entrenamiento): de ahí sale un pedido de acceso.
  const origen = origenDelPedido(parametros.get('volver'));
  const desde: Alcance | null = origen ? PRECARGA_DEL_ORIGEN[origen].area : null;

  // Al cambiar de persona, nada de la anterior queda a la vista mientras se lee.
  useEffect(() => setLectura(null), [asesoradoId]);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const r = await api.habitosDeLaPersona(token, asesoradoId);
      if (!vigente || sesionPerdida(r)) return;
      if (r.ok) return setLectura({ tipo: 'los-ve', datos: r.datos.data });
      // Lo que no es un 200 no deja rastro por sí solo: el 404 es lo que ve quien no los recibe, y una falla no se distingue
      // de él. Si el PDP lo deja acompañarla (HBT-07 responde), se ofrece pedirle acceso; si no, nada.
      const sabe = await api.habitosParaElProfesional(token, asesoradoId);
      if (!vigente || sesionPerdida(sabe)) return;
      setLectura(sabe.ok ? { tipo: 'no-los-ve', datos: sabe.datos.data } : null);
    })();
    return () => {
      vigente = false;
    };
  }, [token, asesoradoId, sesionPerdida, tanda]);

  if (!lectura) return null;
  if (lectura.tipo === 'no-los-ve') return <PedirAcceso id={id} datos={lectura.datos} desde={desde} releer={releer} />;
  const tarjeta = tarjetaDeSusHabitos(lectura.datos, fecha);

  return (
    <section className="registros sus-habitos" aria-labelledby={`${id}-titulo`} data-sus-habitos>
      <div className="registros__encabezado">
        <h2 id={`${id}-titulo`}>{H.titulo}</h2>
        <p className="nota registros__bajada">{tarjeta.compartido}</p>
      </div>
      <div className="sus-habitos__procedencia">
        {/* La procedencia se dice una vez, para todas las respuestas: cada una es declarada por la persona. */}
        <span className="etiqueta-de-dato">
          <Icono nombre="reportado" tamano={15} />
          {H.declarado}
        </span>
        {tarjeta.actualizados ? <p className="nota">{tarjeta.actualizados}</p> : null}
        <p className="nota">{H.noEsMedicion}</p>
      </div>
      {tarjeta.habitos.length === 0 ? (
        <p className="nota">{H.sinHabitos}</p>
      ) : (
        <dl className="lo-declarado sus-habitos__lista">
          {tarjeta.habitos.map((h) => {
            const lineas = lineasDeValor(h.campo, h.valor);
            return (
              <div key={h.codigo} className="lo-declarado__fila" data-pregunta={h.codigo}>
                <dt>{h.pregunta}</dt>
                <dd>
                  {lineas.length > 1 ? (
                    <ul className="lo-declarado__lineas">
                      {lineas.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="lo-declarado__valor">{lineas[0] ?? ''}</span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
}

/**
 * La tarjeta cuando la persona no le comparte sus hábitos: lo dice, con su último pedido y, si puede, «Pedir acceso a sus
 * hábitos». El pedido sale del área de donde llegó el profesional si es una de las suyas; si no, de la primera, y con más
 * de una se dice cuál (el «para qué» que lee la persona depende del área). Un resultado incierto conserva la clave: el
 * reintento no hace un segundo pedido.
 */
function PedirAcceso({ id, datos, desde, releer }: { id: string; datos: LoQueSabeDeSusHabitos; desde: Alcance | null; releer: () => void }) {
  const { token, asesoradoId, sesionPerdida } = useFormularios();
  const avisarSinAcceso = useAvisarSinAcceso();
  const intento = useClaveDeIntento();
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ readonly tipo: 'exito' | 'info' | 'error'; readonly texto: string; readonly incierto: boolean } | null>(null);
  const tarjeta = tarjetaSinAcceso(datos, fecha);
  if (!tarjeta) return null;
  const { area, aviso: desdeQueArea } = areaDelPedidoDeAcceso(datos.scopes, desde);

  async function pedir() {
    if (enviando) return;
    setEnviando(true);
    setAviso(null);
    const r = await api.pedirAccesoAHabitos(token, asesoradoId, { scope: area }, intento.actual());
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    switch (trasPedirAcceso(r)) {
      case 'enviado':
        setAviso({ tipo: 'exito', texto: H.pedidoEnviado, incierto: false });
        return releer();
      case 'ya-los-comparte':
        setAviso({ tipo: 'info', texto: H.yaLosComparte, incierto: false });
        return releer();
      // Pidió hace menos de 7 días (otra pestaña, otro dispositivo): al volver a leer, la tarjeta dice desde cuándo.
      case 'muy-pronto':
        return releer();
      // El «no disponible» de una escritura: el marco vuelve a preguntar el acceso (F-09).
      case 'sin-acceso':
        avisarSinAcceso();
        return releer();
      default:
        setAviso({ tipo: 'error', texto: mensajeDeFallo(r), incierto: esIncierto(r) });
    }
  }

  return (
    <section className="registros sus-habitos" aria-labelledby={`${id}-titulo`} data-sus-habitos="sin-acceso">
      <div className="registros__encabezado">
        <h2 id={`${id}-titulo`}>{H.titulo}</h2>
      </div>
      {aviso ? (
        <Aviso tipo={aviso.tipo}>
          <p data-pedido-de-acceso-aviso>{aviso.texto}</p>
        </Aviso>
      ) : null}
      <div data-pedido-de-acceso-estado>
        {tarjeta.lineas.map((l) => (
          <p key={l} className="nota">
            {l}
          </p>
        ))}
      </div>
      {tarjeta.boton ? (
        <div className="sus-habitos__pedir">
          <p className="nota">{tarjeta.queLeLlega}</p>
          {desdeQueArea ? <p className="nota">{desdeQueArea}</p> : null}
          <button type="button" className="boton boton--secundario" onClick={() => void pedir()} disabled={enviando} aria-busy={enviando} data-pedir-acceso>
            <Icono nombre="solicitar" tamano={18} />
            {enviando ? H.pidiendo : aviso?.incierto ? COPY.reintentar : tarjeta.boton}
          </button>
        </div>
      ) : null}
    </section>
  );
}
