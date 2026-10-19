'use client';

/**
 * «Invitar a una persona» (WP-INVITACION; DEUDA_LEGAJO DL-136), en un diálogo que se abre desde el encabezado del Espacio
 * profesional, al lado de «Solicitar vínculo».
 * - El profesional elige el área y crea la invitación (API-INV-01). El enlace, el QR y el código se muestran **solo en
 *   esa respuesta**: la API no los guarda, así que después no se pueden volver a ver.
 * - Se comparte por WhatsApp (un enlace `wa.me` con el mensaje armado; no usa ninguna API de WhatsApp), con el menú de
 *   compartir del sistema si el navegador lo tiene, o copiando el enlace o el mensaje.
 * - El QR se dibuja en el navegador, porque el enlace lleva el token.
 * - Abajo, sus invitaciones con su estado (API-INV-02); las pendientes se pueden anular (API-INV-03).
 * - Mismo patrón de diálogo que «Solicitar vínculo» (GUIA I.3): `<dialog>` modal, el foco adentro, Escape cierra salvo
 *   mientras se crea.
 */
import {
  ALCANCES,
  COPY,
  COPY_INVITACION,
  COPY_VINCULO,
  ETIQUETA_DE_ALCANCE,
  enlaceDeInvitacion,
  type Alcance,
  type Invitacion,
  type InvitacionCreadaResponse,
} from '@be/domain';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Aviso } from '../../components/formulario';
import { CodigoQr } from '../../components/codigo-qr';
import { api, type Resultado } from '../../lib/api';
import { esIncierto, useClaveDeIntento } from '../../lib/intento';

type Creada = InvitacionCreadaResponse['data'] & { readonly enlace: string };
type Estado =
  | { tipo: 'eligiendo' }
  | { tipo: 'creando' }
  | { tipo: 'error'; texto: string; incierto: boolean }
  | { tipo: 'lista'; invitacion: Creada };
type Lista = { tipo: 'cargando' } | { tipo: 'listo'; items: Invitacion[] } | { tipo: 'error' };

/** La fecha de vencimiento como la lee una persona: «23 de octubre», en la zona del MVP. */
const fechaDeVencimiento = (iso: string): string =>
  new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(iso));

export function InvitarPersona({
  abierto,
  areaSugerida = null,
  token,
  sesionPerdida,
  onCerrar,
  onConElIdentificador,
}: {
  abierto: boolean;
  /** El área en la que trabaja el profesional, si es una sola (DL-146): viene elegida. */
  areaSugerida?: Alcance | null;
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  onCerrar: () => void;
  /** «¿Ya tenés su identificador?»: abre «Solicitar vínculo», el camino de siempre. */
  onConElIdentificador: () => void;
}) {
  const id = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const intento = useClaveDeIntento();
  const [alcance, setAlcance] = useState<Alcance | ''>('');
  const [errorDeArea, setErrorDeArea] = useState<string | undefined>();
  const [estado, setEstado] = useState<Estado>({ tipo: 'eligiendo' });
  const [lista, setLista] = useState<Lista>({ tipo: 'cargando' });
  const [copiado, setCopiado] = useState<'enlace' | 'mensaje' | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  // El menú de compartir del sistema existe en el teléfono y en algunos navegadores: se sabe recién en el cliente.
  const [puedeCompartir, setPuedeCompartir] = useState(false);
  useEffect(() => setPuedeCompartir(typeof navigator.share === 'function'), []);
  const creando = estado.tipo === 'creando';

  const cargar = useCallback(async () => {
    setLista({ tipo: 'cargando' });
    const r = await api.consultarInvitaciones(token, { limit: '10' });
    if (r.ok) setLista({ tipo: 'listo', items: r.datos.data });
    else if (!sesionPerdida(r)) setLista({ tipo: 'error' });
  }, [token, sesionPerdida]);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) {
      d.showModal();
      void cargar();
      if (areaSugerida) setAlcance((elegida) => elegida || areaSugerida);
    }
    if (!abierto && d.open) d.close();
  }, [abierto, cargar, areaSugerida]);

  async function crear(evento: FormEvent) {
    evento.preventDefault();
    if (creando) return;
    if (!alcance) {
      setErrorDeArea(COPY_INVITACION.elegirArea);
      return;
    }
    setErrorDeArea(undefined);
    setAviso(null);
    setEstado({ tipo: 'creando' });
    const r = await api.crearInvitacion(token, alcance, intento.actual());
    intento.registrar(r);
    if (r.ok) {
      setEstado({ tipo: 'lista', invitacion: { ...r.datos.data, enlace: enlaceDeInvitacion(window.location.origin, r.datos.data.token) } });
      void cargar();
      return;
    }
    if (sesionPerdida(r)) return;
    if (esIncierto(r)) return setEstado({ tipo: 'error', texto: COPY.resultadoIncierto, incierto: true });
    setEstado({ tipo: 'error', texto: r.tipo === 'API' && r.codigo === 'SCOPE_NOT_AVAILABLE' ? COPY_VINCULO.solicitudNoDisponible : COPY.noDisponible, incierto: false });
  }

  async function copiar(que: 'enlace' | 'mensaje', texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(que);
    } catch {
      setCopiado(null);
    }
  }

  async function anular(invitacion: Invitacion) {
    const r = await api.anularInvitacion(token, invitacion.invitationId, `web-anular-${invitacion.invitationId}`);
    if (r.ok) setAviso(COPY_INVITACION.anulada);
    else if (sesionPerdida(r)) return;
    else setAviso(COPY.noDisponible);
    void cargar();
  }

  function otra() {
    intento.descartar();
    setCopiado(null);
    setEstado({ tipo: 'eligiendo' });
  }

  const creada = estado.tipo === 'lista' ? estado.invitacion : null;
  const area = creada ? creada.scope.label : '';
  const vence = creada ? fechaDeVencimiento(creada.expiresAt) : '';
  const mensaje = creada ? COPY_INVITACION.mensaje(area, creada.enlace, creada.code, vence) : '';

  return (
    <dialog
      ref={dialogo}
      className="dialogo dialogo--formulario invitar"
      aria-labelledby={`${id}-titulo`}
      onCancel={(e) => {
        if (creando) e.preventDefault();
      }}
      onClose={onCerrar}
    >
      <h2 id={`${id}-titulo`}>{COPY_INVITACION.invitar}</h2>
      {aviso ? (
        <Aviso tipo="info">
          <p>{aviso}</p>
        </Aviso>
      ) : null}

      {creada ? (
        <section className="invitar__lista" aria-labelledby={`${id}-lista`}>
          <h3 id={`${id}-lista`}>{COPY_INVITACION.lista}</h3>
          <p className="nota">
            {area} · {COPY_INVITACION.vence(vence)} {COPY_INVITACION.soloAhora}
          </p>
          <div className="invitar__compartir">
            <a className="boton boton--primario" href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noopener noreferrer">
              {COPY_INVITACION.compartirPorWhatsApp}
            </a>
            {puedeCompartir ? (
              <button type="button" className="boton boton--secundario" onClick={() => void navigator.share({ text: mensaje }).catch(() => undefined)}>
                {COPY_INVITACION.compartir}
              </button>
            ) : null}
            <button type="button" className="boton boton--secundario" onClick={() => void copiar('mensaje', mensaje)}>
              {copiado === 'mensaje' ? COPY_INVITACION.copiado : COPY_INVITACION.copiarMensaje}
            </button>
          </div>
          <div className="invitar__datos">
            <figure className="invitar__qr">
              <CodigoQr texto={creada.enlace} etiqueta={`${COPY_INVITACION.qr}: ${COPY_INVITACION.qrAyuda}`} />
              <figcaption className="nota">{COPY_INVITACION.qrAyuda}</figcaption>
            </figure>
            <div>
              <p>
                <strong>{COPY_INVITACION.codigo}:</strong> <span className="invitar__codigo">{creada.code}</span>
              </p>
              <p className="nota">{COPY_INVITACION.codigoAyuda}</p>
              <p>
                <strong>{COPY_INVITACION.enlace}:</strong>
              </p>
              <p className="invitar__enlace">{creada.enlace}</p>
              <button type="button" className="boton boton--enlace" onClick={() => void copiar('enlace', creada.enlace)}>
                {copiado === 'enlace' ? COPY_INVITACION.copiado : COPY_INVITACION.copiarEnlace}
              </button>
            </div>
          </div>
          <div className="acciones">
            <button type="button" className="boton boton--secundario" onClick={otra}>
              {COPY_INVITACION.otraInvitacion}
            </button>
            <button type="button" className="boton boton--primario" onClick={onCerrar}>
              Listo
            </button>
          </div>
        </section>
      ) : (
        <form className="formulario" onSubmit={crear} noValidate>
          <p>{COPY_INVITACION.ayuda}</p>
          {estado.tipo === 'error' ? (
            <Aviso tipo="error" enfocar>
              <p>{estado.texto}</p>
            </Aviso>
          ) : null}
          <div className={`campo${errorDeArea ? ' campo--error' : ''}`}>
            <label htmlFor={`${id}-area`}>{COPY_INVITACION.area}</label>
            <select
              id={`${id}-area`}
              value={alcance}
              aria-invalid={errorDeArea ? true : undefined}
              aria-describedby={[errorDeArea ? `${id}-area-error` : null, areaSugerida && alcance === areaSugerida ? `${id}-area-sugerida` : null].filter(Boolean).join(' ') || undefined}
              onChange={(e) => {
                setAlcance(e.target.value as Alcance | '');
                intento.descartar();
                if (!creando) setEstado({ tipo: 'eligiendo' });
              }}
            >
              <option value="">{COPY_INVITACION.elegirArea}</option>
              {ALCANCES.map((a) => (
                <option key={a} value={a}>
                  {ETIQUETA_DE_ALCANCE[a]}
                </option>
              ))}
            </select>
            {areaSugerida && alcance === areaSugerida ? (
              <p id={`${id}-area-sugerida`} className="campo__ayuda">
                {COPY_INVITACION.areaSugerida}
              </p>
            ) : null}
            {errorDeArea ? (
              <p id={`${id}-area-error`} className="campo__error">
                <span aria-hidden="true">⚠ </span>
                {errorDeArea}
              </p>
            ) : null}
          </div>
          <p className="nota">
            <button type="button" className="boton boton--enlace" onClick={onConElIdentificador}>
              {COPY_INVITACION.conElIdentificador}
            </button>
          </p>
          <div className="acciones">
            <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={creando}>
              Volver
            </button>
            <button type="submit" className="boton boton--primario" disabled={creando} aria-busy={creando}>
              {creando ? COPY_INVITACION.creando : estado.tipo === 'error' && estado.incierto ? COPY.reintentar : COPY_INVITACION.crear}
            </button>
          </div>
        </form>
      )}

      <section className="invitar__historial" aria-labelledby={`${id}-historial`}>
        <h3 id={`${id}-historial`}>{COPY_INVITACION.tusInvitaciones}</h3>
        {lista.tipo === 'cargando' ? <p className="nota">Cargando…</p> : null}
        {lista.tipo === 'error' ? <p className="nota">{COPY.noDisponible}</p> : null}
        {lista.tipo === 'listo' && lista.items.length === 0 ? <p className="nota">{COPY_INVITACION.sinInvitaciones}</p> : null}
        {lista.tipo === 'listo' && lista.items.length > 0 ? (
          <ul className="invitar__items">
            {lista.items.map((i) => (
              <li key={i.invitationId}>
                <span>
                  {i.scope.label} · {COPY_INVITACION.estado[i.state]} · {COPY_INVITACION.vence(fechaDeVencimiento(i.expiresAt))}
                </span>
                {i.state === 'PENDING' ? (
                  <button type="button" className="boton boton--enlace" onClick={() => void anular(i)}>
                    {COPY_INVITACION.anular}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </dialog>
  );
}
