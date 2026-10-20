'use client';

/**
 * «Solicitar vínculo» (REL-01), en un diálogo que se abre desde el encabezado del Espacio profesional
 * (WP-ESCRITORIO-AMABLE, parte 5): el formulario es el de siempre, a un clic.
 * - El asesorado se identifica por su identificador BE (DL-035) y la finalidad es la del alcance (DL-039).
 * - Cualquier rechazo semántico se muestra con el mismo mensaje neutral: la pantalla no revela si el identificador
 *   existe ni por qué no es elegible (09v7:151-157; RF-015).
 * - Una clave de idempotencia por intento; cambiar un dato es otro intento.
 * - `<dialog>` nativo en modo modal (GUIA I.3): retiene el foco, que entra por el primer campo, y lo devuelve al botón
 *   que lo abrió. Escape equivale a «Volver», salvo mientras se envía.
 * - Al enviarse, el diálogo se cierra y la página dice qué pasó: un aviso que queda adentro de un diálogo cerrado no lo
 *   lee nadie.
 */
import { ALCANCES, COPY, COPY_INVITACION, COPY_VINCULO, ETIQUETA_DE_ALCANCE, ETIQUETA_DE_FINALIDAD, FINALIDAD_DE_ALCANCE, type Alcance } from '@be/domain';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Aviso, Campo } from '../../components/formulario';
import { api, type Resultado } from '../../lib/api';
import { esIncierto, useClaveDeIntento } from '../../lib/intento';

type Envio = { tipo: 'editando' } | { tipo: 'enviando' } | { tipo: 'error'; texto: string; incierto: boolean };

export function SolicitarVinculo({
  abierto,
  areaSugerida = null,
  token,
  sesionPerdida,
  onCerrar,
  alEnviar,
}: {
  abierto: boolean;
  /** El área en la que trabaja el profesional, si es una sola (DL-146): viene elegida. */
  areaSugerida?: Alcance | null;
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  onCerrar: () => void;
  /** La solicitud quedó hecha: con qué texto se dice y si ya había una igual pendiente. */
  alEnviar: (resultado: { texto: string; deduplicada: boolean }) => void;
}) {
  const id = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const intento = useClaveDeIntento();
  const [asesorado, setAsesorado] = useState('');
  const [alcance, setAlcance] = useState<Alcance | ''>('');
  const [errores, setErrores] = useState<{ asesorado?: string; alcance?: string }>({});
  const [envio, setEnvio] = useState<Envio>({ tipo: 'editando' });
  const enviando = envio.tipo === 'enviando';

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) {
      d.showModal();
      if (areaSugerida) setAlcance((elegida) => elegida || areaSugerida);
    }
    if (!abierto && d.open) d.close();
  }, [abierto, areaSugerida]);

  // Cambiar los datos es otro intento lógico: la key de un intento incierto no se reusa con datos distintos.
  function editar(cambio: () => void) {
    cambio();
    intento.descartar();
    if (envio.tipo !== 'enviando') setEnvio({ tipo: 'editando' });
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    const encontrados: typeof errores = {};
    if (!asesorado.trim()) encontrados.asesorado = 'Ingresá el identificador BE del asesorado.';
    if (!alcance) encontrados.alcance = 'Elegí un área.';
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0 || !alcance) return;

    setEnvio({ tipo: 'enviando' });
    const r = await api.solicitarVinculo(token, { asesoradoId: asesorado.trim(), alcance }, intento.actual());
    intento.registrar(r);
    if (r.ok) {
      const deduplicada = 'deduplicated' in r.datos.data;
      setEnvio({ tipo: 'editando' });
      if (!deduplicada) setAsesorado('');
      alEnviar({ texto: deduplicada ? COPY_VINCULO.solicitudYaPendiente : COPY_VINCULO.solicitudEnviada, deduplicada });
      return;
    }
    if (sesionPerdida(r)) return;
    if (esIncierto(r)) return setEnvio({ tipo: 'error', texto: COPY.resultadoIncierto, incierto: true });
    if (r.tipo === 'API' && r.codigo === 'RESOURCE_CONFLICT') {
      return setEnvio({ tipo: 'error', texto: 'Ya tenés un vínculo vigente con esta persona para ese alcance.', incierto: false });
    }
    // 404, 422 y validación: el mismo mensaje, sin revelar existencia ni elegibilidad (09v7:151-157; RF-015).
    const neutral = r.tipo === 'API' && r.status >= 400 && r.status < 500;
    setEnvio({ tipo: 'error', texto: neutral ? COPY_VINCULO.solicitudNoDisponible : COPY.noDisponible, incierto: false });
  }

  const finalidad = alcance ? ETIQUETA_DE_FINALIDAD[FINALIDAD_DE_ALCANCE[alcance]] : '—';

  return (
    <dialog
      ref={dialogo}
      className="dialogo dialogo--formulario"
      aria-labelledby={`${id}-titulo`}
      onCancel={(e) => {
        // Escape no corta un envío en curso: el resultado tiene que poder leerse.
        if (enviando) e.preventDefault();
      }}
      onClose={onCerrar}
    >
      <h2 id={`${id}-titulo`}>{COPY_VINCULO.solicitarVinculo}</h2>
      <form className="formulario" onSubmit={enviar} noValidate>
        {envio.tipo === 'error' ? (
          <Aviso tipo="error" enfocar>
            <p>{envio.texto}</p>
          </Aviso>
        ) : null}
        <Campo
          id={`${id}-asesorado`}
          etiqueta={COPY_VINCULO.identificadorDelAsesorado}
          ayuda={COPY_VINCULO.ayudaIdentificador}
          error={errores.asesorado}
          value={asesorado}
          onChange={(e) => editar(() => setAsesorado(e.target.value))}
          autoComplete="off"
          spellCheck={false}
        />
        <div className={`campo${errores.alcance ? ' campo--error' : ''}`}>
          <label htmlFor={`${id}-alcance`}>Área</label>
          <select
            id={`${id}-alcance`}
            value={alcance}
            aria-invalid={errores.alcance ? true : undefined}
            aria-describedby={[errores.alcance ? `${id}-alcance-error` : null, areaSugerida && alcance === areaSugerida ? `${id}-alcance-sugerida` : null].filter(Boolean).join(' ') || undefined}
            onChange={(e) => editar(() => setAlcance(e.target.value as Alcance | ''))}
          >
            <option value="">Elegí un área</option>
            {ALCANCES.map((a) => (
              <option key={a} value={a}>
                {ETIQUETA_DE_ALCANCE[a]}
              </option>
            ))}
          </select>
          {areaSugerida && alcance === areaSugerida ? (
            <p id={`${id}-alcance-sugerida`} className="campo__ayuda">
              {COPY_INVITACION.areaSugerida}
            </p>
          ) : null}
          {errores.alcance ? (
            <p id={`${id}-alcance-error`} className="campo__error">
              <span aria-hidden="true">⚠ </span>
              {errores.alcance}
            </p>
          ) : null}
        </div>
        {alcance ? (
          <p>
            <strong>{COPY_VINCULO.finalidad}:</strong> {finalidad}
          </p>
        ) : null}
        <p className="nota">El asesorado decide si acepta el vínculo y, por separado, si autoriza el acceso.</p>
        <div className="acciones">
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={enviando}>
            Volver
          </button>
          <button type="submit" className="boton boton--primario" disabled={enviando} aria-busy={enviando}>
            {enviando ? COPY_VINCULO.enviando : envio.tipo === 'error' && envio.incierto ? COPY.reintentar : COPY_VINCULO.solicitarVinculo}
          </button>
        </div>
      </form>
    </dialog>
  );
}
