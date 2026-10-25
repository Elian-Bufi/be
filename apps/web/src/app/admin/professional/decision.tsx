'use client';

/**
 * UC-ADM-02 a 05 · una decisión sobre un área (API-ADM-13), en un diálogo modal que dice profesional, área y efecto antes
 * de confirmar (GUIA-UX-UI I.3; 10-B04 §26):
 * - **El efecto sale del dominio** (`efectoDeLaDecision`, con la misma evaluación que usa la API): qué cambia, qué sigue
 *   igual y a quiénes se avisa. Lo que se promete es lo que pasa.
 * - **El fundamento interno es obligatorio**, y el texto para el profesional también en observar, rechazar, suspender y
 *   retirar. Los dos se validan acá y en la API.
 * - **Un intento, una clave de idempotencia:** el doble clic o el reintento de un resultado incierto reusan la misma, y el
 *   servidor devuelve el resultado original sin registrar dos veces. Si se edita el texto, es otro intento: la versión del
 *   área impide igual que una decisión ya registrada se repita.
 * - **Conflicto:** si el área cambió (otro administrador, el servicio interno), la API rechaza con la versión vieja; el
 *   diálogo vuelve a leer el área, dice cómo está ahora y conserva lo escrito. Confirmar de nuevo es una decisión explícita.
 * - **Segundo factor vencido** (15 minutos sin actividad): se pide el código en el mismo diálogo, sin perder lo escrito.
 */
import {
  COPY,
  COPY_ADMINISTRACION,
  DECISIONES_CON_MENSAJE_OBLIGATORIO,
  ETIQUETA_DE_ALCANCE,
  LARGO_MAXIMO_DEL_FUNDAMENTO,
  LARGO_MAXIMO_DEL_MENSAJE,
  efectoDeLaDecision,
  evaluarDecision,
  normalizarCodigoDelAutenticador,
  type AreaDeLaFicha,
  type DecisionAdministrativa,
  type DecisionRegistradaResponse,
} from '@be/domain';
import { useId, useRef, useState, type FormEvent } from 'react';
import { DialogoDeConfirmacion } from '../../../components/dialogo';
import { Aviso, Campo, ResumenDeErrores } from '../../../components/formulario';
import { apiAdministrativa } from '../../../lib/api-administrativa';
import { nuevaClaveAdministrativa, useAdministracion } from '../../../lib/sesion-administrativa';

const D = COPY_ADMINISTRACION.decision;

/** Las decisiones que quitan la posibilidad de operar, o la niegan: van con el botón de peligro. */
export const DECISIONES_DE_PELIGRO: ReadonlySet<DecisionAdministrativa> = new Set(['REJECT', 'SUSPEND', 'WITHDRAW_ENABLEMENT']);

function CampoDeTexto({
  id,
  etiqueta,
  ayuda,
  valor,
  tope,
  error,
  onCambio,
}: {
  id: string;
  etiqueta: string;
  ayuda: string;
  valor: string;
  tope: number;
  error: string | null;
  onCambio: (v: string) => void;
}) {
  const descripcion = [`${id}-ayuda`, `${id}-largo`, error ? `${id}-error` : null].filter(Boolean).join(' ');
  return (
    <div className={`campo${error ? ' campo--error' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      <p id={`${id}-ayuda`} className="campo__ayuda">
        {ayuda}
      </p>
      <textarea id={id} rows={3} maxLength={tope} value={valor} aria-invalid={error ? true : undefined} aria-describedby={descripcion} onChange={(e) => onCambio(e.target.value)} />
      <p id={`${id}-largo`} className="nota campo__largo">
        {D.caracteres(valor.length, tope)}
      </p>
      {error ? (
        <p id={`${id}-error`} className="campo__error">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function DialogoDeDecision({
  profesionalId,
  profesional,
  area,
  decision,
  onCerrar,
  onRegistrada,
  onReleer,
}: {
  profesionalId: string;
  profesional: string;
  /** El área como está ahora: después de un conflicto, la que se volvió a leer. */
  area: AreaDeLaFicha;
  decision: DecisionAdministrativa;
  onCerrar: () => void;
  onRegistrada: (r: DecisionRegistradaResponse['data'], texto: string) => void;
  /** Vuelve a leer la ficha (después de un conflicto); el área nueva llega por `area`. Dice si la lectura llegó. */
  onReleer: () => Promise<boolean>;
}) {
  const id = useId();
  const { sesion, segundoFactor, olvidar, revisar } = useAdministracion();
  const [fundamento, setFundamento] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [errores, setErrores] = useState<{ id: string; texto: string }[]>([]);
  const [intento, setIntento] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  /** Después de un conflicto: si el área se volvió a leer (y lo que se ve es cómo está ahora) o no. */
  const [conflicto, setConflicto] = useState<'releida' | 'sin-releer' | null>(null);
  const [reverificar, setReverificar] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [errorDelCodigo, setErrorDelCodigo] = useState<string | null>(null);
  const [codigoConfirmado, setCodigoConfirmado] = useState(false);
  const clave = useRef<string | null>(null);
  const restantes = useRef<number | null>(null);

  const antes = { verificacion: area.verification.state, habilitacion: area.enablement.state };
  const evaluacion = evaluarDecision(antes, decision, 'x', 'x');
  const mensajeObligatorio = DECISIONES_CON_MENSAJE_OBLIGATORIO.has(decision);
  const efecto = evaluacion.permitida
    ? efectoDeLaDecision({ decision, alcance: area.scope, profesional, antes, evaluacion, personas: area.linkedPeople, mensajeObligatorio })
    : null;
  const nombre = COPY_ADMINISTRACION.nombreDeLaDecision[decision];
  const idFundamento = `${id}-fundamento`;
  const idMensaje = `${id}-mensaje`;
  const porCampo = Object.fromEntries(errores.map((e) => [e.id, e.texto]));

  /** Editar lo escrito es otro intento: la clave anterior se descarta. */
  function editar(set: (v: string) => void) {
    return (v: string) => {
      clave.current = null;
      set(v);
    };
  }

  async function confirmar() {
    if (enviando || !sesion || !efecto) return;
    const encontrados: { id: string; texto: string }[] = [];
    if (!fundamento.trim()) encontrados.push({ id: idFundamento, texto: D.faltaFundamento });
    if (mensajeObligatorio && !mensaje.trim()) encontrados.push({ id: idMensaje, texto: D.faltaMensaje });
    setErrores(encontrados);
    setIntento((n) => n + 1);
    if (encontrados.length > 0) return;
    setEnviando(true);
    setFalla(null);
    setCodigoConfirmado(false);
    clave.current ??= nuevaClaveAdministrativa();
    const r = await apiAdministrativa.decidir(
      sesion.token,
      profesionalId,
      area.scope,
      { expectedVersion: area.version, decision, rationale: fundamento, ...(mensaje.trim() ? { messageToProfessional: mensaje.trim() } : {}) },
      clave.current,
    );
    setEnviando(false);
    if (r.ok) {
      clave.current = null;
      const avisados = D.avisados(r.datos.data.notified.professional, r.datos.data.notified.linkedPeople);
      onRegistrada(r.datos.data, `${D.registrada(nombre)}${avisados ? ` ${avisados}` : ''}`);
      return;
    }
    // Sin respuesta (o una que no se reconoce): no se sabe si se registró. El reintento usa la misma clave.
    if (r.tipo === 'RED' || r.codigo === 'RESPUESTA_NO_RECONOCIDA') {
      setFalla(COPY.resultadoIncierto);
      return;
    }
    clave.current = null;
    if (r.codigo === 'MFA_REQUIRED') {
      setReverificar(true);
      return;
    }
    if (revisar(r)) return;
    switch (r.codigo) {
      case 'VERSION_CONFLICT':
      case 'INVALID_STATE_TRANSITION':
      case 'IDEMPOTENCY_KEY_REUSED':
        setConflicto((await onReleer()) ? 'releida' : 'sin-releer');
        return;
      case 'RATIONALE_REQUIRED':
        setErrores([{ id: idFundamento, texto: D.faltaFundamento }]);
        setIntento((n) => n + 1);
        return;
      case 'VALIDATION_FAILED':
        if (r.issues.some((i) => i.code === 'MESSAGE_TO_PROFESSIONAL_REQUIRED')) {
          setErrores([{ id: idMensaje, texto: D.faltaMensaje }]);
          setIntento((n) => n + 1);
          return;
        }
        setFalla(COPY.noDisponible);
        return;
      case 'RESOURCE_NOT_FOUND':
        setFalla(COPY_ADMINISTRACION.ficha.noDisponible);
        return;
      case 'RATE_LIMITED':
        setFalla(COPY.demasiadosIntentos);
        return;
      default:
        setFalla(COPY.noDisponible);
    }
  }

  async function confirmarCodigo(e: FormEvent) {
    e.preventDefault();
    if (enviando || !sesion) return;
    if (!normalizarCodigoDelAutenticador(codigo)) {
      setErrorDelCodigo(COPY_ADMINISTRACION.segundoFactor.formaInvalida);
      return;
    }
    setErrorDelCodigo(null);
    setEnviando(true);
    const r = await apiAdministrativa.verificarCodigo(sesion.token, codigo);
    setEnviando(false);
    setCodigo('');
    if (r.ok) {
      segundoFactor(r.datos.data.secondFactor);
      setReverificar(false);
      setCodigoConfirmado(true);
      return;
    }
    if (r.tipo === 'API' && r.codigo === 'SECOND_FACTOR_INVALID') {
      restantes.current = r.intentosRestantes ?? null;
      setErrorDelCodigo(COPY_ADMINISTRACION.segundoFactor.invalido(r.intentosRestantes ?? 0));
      return;
    }
    if (r.tipo === 'API' && r.codigo === 'SESSION_REVOKED') {
      olvidar(restantes.current === 1 ? 'intentos' : null);
      return;
    }
    if (revisar(r)) return;
    setErrorDelCodigo(r.tipo === 'RED' ? COPY.resultadoIncierto : COPY.noDisponible);
  }

  const nombreDelArea = ETIQUETA_DE_ALCANCE[area.scope];
  return (
    <DialogoDeConfirmacion
      abierto
      titulo={efecto?.titulo ?? `${nombre} · ${nombreDelArea} de ${profesional}`}
      textoVolver={efecto ? D.cancelar : D.cerrar}
      textoConfirmar={efecto?.confirmar ?? nombre}
      textoEnviando={D.registrando}
      peligro={DECISIONES_DE_PELIGRO.has(decision)}
      enviando={enviando}
      error={falla}
      confirmarDeshabilitado={!efecto || reverificar || conflicto === 'sin-releer'}
      onVolver={onCerrar}
      onConfirmar={() => void confirmar()}
    >
      {conflicto ? (
        <Aviso tipo="info" enfocar>
          <p className="aviso__titulo">{D.conflictoTitulo}</p>
          <p>{D.conflicto}</p>
          {conflicto === 'releida' ? (
            <>
              <p>{D.ahora(COPY_ADMINISTRACION.situacion[area.situation])}</p>
              <p>{efecto ? D.sigueDisponible : D.noPermitida}</p>
            </>
          ) : (
            <p>{D.sinReleer}</p>
          )}
        </Aviso>
      ) : null}
      {codigoConfirmado ? (
        <Aviso tipo="info" enfocar>
          <p>{D.codigoConfirmado}</p>
        </Aviso>
      ) : null}
      {efecto ? (
        <div className="efecto-de-la-decision">
          <h3>{D.queCambia}</h3>
          <ul>
            {efecto.cambia.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <h3>{D.queSigueIgual}</h3>
          <ul>
            {efecto.sigueIgual.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <h3>{D.aQuienSeAvisa}</h3>
          <ul>
            {efecto.avisos.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <ResumenDeErrores titulo={COPY.resumenDeErrores(errores.length)} errores={errores} intento={intento} />
      <CampoDeTexto
        id={idFundamento}
        etiqueta={D.fundamento}
        ayuda={D.fundamentoAyuda}
        valor={fundamento}
        tope={LARGO_MAXIMO_DEL_FUNDAMENTO}
        error={porCampo[idFundamento] ?? null}
        onCambio={editar(setFundamento)}
      />
      <CampoDeTexto
        id={idMensaje}
        etiqueta={mensajeObligatorio ? D.mensaje : D.mensajeOpcional}
        ayuda={D.mensajeAyuda}
        valor={mensaje}
        tope={LARGO_MAXIMO_DEL_MENSAJE}
        error={porCampo[idMensaje] ?? null}
        onCambio={editar(setMensaje)}
      />
      {reverificar ? (
        <form className="panel" onSubmit={confirmarCodigo} noValidate>
          <Aviso tipo="info" enfocar>
            <p>{D.reverificar}</p>
          </Aviso>
          <Campo
            id={`${id}-codigo`}
            etiqueta={COPY_ADMINISTRACION.segundoFactor.campo}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            className="campo-de-codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            error={errorDelCodigo}
          />
          <button type="submit" className="boton boton--secundario" disabled={enviando} aria-busy={enviando}>
            {enviando ? COPY_ADMINISTRACION.segundoFactor.confirmando : COPY_ADMINISTRACION.segundoFactor.confirmar}
          </button>
        </form>
      ) : null}
    </DialogoDeConfirmacion>
  );
}
