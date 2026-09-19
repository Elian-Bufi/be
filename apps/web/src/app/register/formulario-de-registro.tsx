'use client';

/**
 * PROTO-10-ACC-01 — crear cuenta. A1 y A2 son dos actos separados: cada uno con etiqueta propia, vínculo a su versión
 * y casilla propia, nunca premarcada (10-B02:128-155). A3 NO forma parte del registro (10-B02:137-141).
 * PROTO-10-ACC-02 — después del alta no hay auto-login (10-B02:170-194).
 */
import {
  MENSAJE_DE_CAMPO,
  VERSION_VIGENTE,
  identificadorLocalValido,
  normalizarIdentificadorLocal,
  problemaDeCredencialLocal,
} from '@be/domain';
import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import { Aviso, Campo, ResumenDeErrores } from '../../components/formulario';
import { api, nuevaClaveDeIdempotencia } from '../../lib/api';
import { COPY } from '../../lib/copy';

type Campos = 'correo' | 'contrasena' | 'a1' | 'a2';
type Errores = Partial<Record<Campos, string>>;
type Estado =
  | { tipo: 'editando' }
  | { tipo: 'enviando' }
  | { tipo: 'creada' }
  | { tipo: 'no-disponible' }
  | { tipo: 'incierto' }
  | { tipo: 'error'; mensaje: string };

function validar(correo: string, contrasena: string, a1: boolean, a2: boolean): Errores {
  const errores: Errores = {};
  if (!identificadorLocalValido(normalizarIdentificadorLocal(correo))) errores.correo = MENSAJE_DE_CAMPO.INVALID_LOCAL_IDENTIFIER;
  const problema = problemaDeCredencialLocal(contrasena);
  if (problema) errores.contrasena = MENSAJE_DE_CAMPO[problema];
  if (!a1) errores.a1 = MENSAJE_DE_CAMPO.A1_REQUERIDO;
  if (!a2) errores.a2 = MENSAJE_DE_CAMPO.A2_REQUERIDO;
  return errores;
}

export function FormularioDeRegistro() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [a1, setA1] = useState(false);
  const [a2, setA2] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [estado, setEstado] = useState<Estado>({ tipo: 'editando' });
  // Una key por intento lógico: se conserva en los reintentos y se renueva si cambian los datos (10-B10:430-438).
  const clave = useRef<string>(nuevaClaveDeIdempotencia());
  const renovarClave = () => {
    clave.current = nuevaClaveDeIdempotencia();
  };

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (estado.tipo === 'enviando') return; // sin doble envío (10-B04:1071-1113)
    const encontrados = validar(correo, contrasena, a1, a2);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setEstado({ tipo: 'enviando' });
    const r = await api.registrar({ correo, contrasena }, clave.current);
    if (r.ok) {
      setContrasena('');
      setEstado({ tipo: 'creada' });
      return;
    }
    if (r.tipo === 'RED') return setEstado({ tipo: 'incierto' });
    switch (r.codigo) {
      case 'REGISTRATION_NOT_AVAILABLE':
        renovarClave();
        return setEstado({ tipo: 'no-disponible' });
      case 'INVALID_REQUEST': {
        const deLaApi: Errores = {};
        for (const issue of r.issues) {
          if (issue.path === 'identity.localIdentifier') deLaApi.correo = MENSAJE_DE_CAMPO[issue.code] ?? MENSAJE_DE_CAMPO.INVALID_LOCAL_IDENTIFIER;
          if (issue.path === 'identity.localCredential') deLaApi.contrasena = MENSAJE_DE_CAMPO[issue.code] ?? MENSAJE_DE_CAMPO.CREDENCIAL_DEMASIADO_CORTA;
        }
        renovarClave();
        setErrores(deLaApi);
        return setEstado({ tipo: 'editando' });
      }
      case 'TERMS_VERSION_NOT_ACCEPTABLE':
      case 'PRIVACY_VERSION_NOT_ACCEPTABLE':
        return setEstado({ tipo: 'error', mensaje: COPY.versionDesactualizada });
      case 'RATE_LIMITED':
        return setEstado({ tipo: 'error', mensaje: COPY.demasiadosIntentos });
      default:
        return setEstado({ tipo: 'error', mensaje: COPY.noDisponible });
    }
  }

  if (estado.tipo === 'creada') {
    return (
      <Aviso tipo="exito" enfocar>
        <p className="aviso__titulo">{COPY.cuentaCreada}</p>
        <p>
          <Link className="boton boton--primario" href="/login">
            {COPY.iniciarSesion}
          </Link>
        </p>
      </Aviso>
    );
  }

  const listaDeErrores = (Object.entries(errores) as [Campos, string][]).map(([campo, texto]) => ({ id: campo === 'a1' || campo === 'a2' ? `acto-${campo}` : campo, texto }));
  const enviando = estado.tipo === 'enviando';
  // Otros datos = otro intento lógico: key nueva (con la misma key la API respondería IDEMPOTENCY_KEY_REUSED).
  const cambiar = <T,>(setter: (v: T) => void) => (valor: T) => {
    setter(valor);
    renovarClave();
  };

  return (
    <form className="formulario" onSubmit={enviar} noValidate aria-describedby="registro-aviso">
      <ResumenDeErrores titulo={COPY.resumenDeErrores(listaDeErrores.length)} errores={listaDeErrores} />

      {estado.tipo === 'no-disponible' ? (
        <Aviso tipo="error" enfocar>
          <p className="aviso__titulo">{COPY.registroNoDisponible}</p>
          <p>
            {COPY.registroNoDisponibleAyuda} <Link href="/login">{COPY.iniciarSesion}</Link>
          </p>
        </Aviso>
      ) : null}
      {estado.tipo === 'incierto' ? (
        <Aviso tipo="error" enfocar>
          <p>{COPY.resultadoIncierto}</p>
        </Aviso>
      ) : null}
      {estado.tipo === 'error' ? (
        <Aviso tipo="error" enfocar>
          <p>{estado.mensaje}</p>
        </Aviso>
      ) : null}

      <p id="registro-aviso" className="nota">
        Ambiente de prueba: usá un correo inventado (por ejemplo, terminado en <code>@example.invalid</code>) y una contraseña que no uses en otro lado.
      </p>

      <Campo
        id="correo"
        etiqueta="Correo electrónico"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        value={correo}
        onChange={(e) => cambiar(setCorreo)(e.target.value)}
        error={errores.correo}
      />
      <Campo
        id="contrasena"
        etiqueta="Contraseña"
        ayuda="Al menos 12 caracteres."
        type="password"
        autoComplete="new-password"
        required
        value={contrasena}
        onChange={(e) => cambiar(setContrasena)(e.target.value)}
        error={errores.contrasena}
      />

      <fieldset className="actos">
        <legend>Antes de crear la cuenta</legend>
        <p className="campo__ayuda">Son dos confirmaciones distintas, cada una con su propio texto y su propia versión.</p>

        <div className={`acto${errores.a1 ? ' campo--error' : ''}`}>
          <input
            id="acto-a1"
            type="checkbox"
            checked={a1}
            onChange={(e) => cambiar(setA1)(e.target.checked)}
            aria-invalid={errores.a1 ? true : undefined}
            aria-describedby={`acto-a1-version${errores.a1 ? ' acto-a1-error' : ''}`}
          />
          <label htmlFor="acto-a1">
            <strong>{COPY.a1Titulo}</strong> — {COPY.a1Texto}
          </label>
          <p id="acto-a1-version" className="acto__version">
            <Link href="/legal/terminos" target="_blank" rel="noopener">
              Leer los términos de uso
            </Link>{' '}
            · versión <code>{VERSION_VIGENTE.TERMINOS.id}</code>
          </p>
          {errores.a1 ? (
            <p id="acto-a1-error" className="campo__error">
              <span aria-hidden="true">⚠ </span>
              {errores.a1}
            </p>
          ) : null}
        </div>

        <div className={`acto${errores.a2 ? ' campo--error' : ''}`}>
          <input
            id="acto-a2"
            type="checkbox"
            checked={a2}
            onChange={(e) => cambiar(setA2)(e.target.checked)}
            aria-invalid={errores.a2 ? true : undefined}
            aria-describedby={`acto-a2-version${errores.a2 ? ' acto-a2-error' : ''}`}
          />
          <label htmlFor="acto-a2">
            <strong>{COPY.a2Titulo}</strong> — {COPY.a2Texto}
          </label>
          <p id="acto-a2-version" className="acto__version">
            <Link href="/legal/privacidad" target="_blank" rel="noopener">
              Leer la información de privacidad
            </Link>{' '}
            · versión <code>{VERSION_VIGENTE.PRIVACIDAD_INFO.id}</code>
          </p>
          {errores.a2 ? (
            <p id="acto-a2-error" className="campo__error">
              <span aria-hidden="true">⚠ </span>
              {errores.a2}
            </p>
          ) : null}
        </div>

        <p className="nota">
          Crear la cuenta no autoriza el tratamiento de datos de salud. Esa autorización es un paso aparte, que podés dar o no más adelante.
        </p>
      </fieldset>

      <button className="boton boton--primario" type="submit" disabled={enviando} aria-busy={enviando}>
        {enviando ? 'Creando cuenta…' : estado.tipo === 'incierto' ? COPY.reintentar : 'Crear cuenta'}
      </button>
      <p>
        ¿Ya tenés cuenta? <Link href="/login">{COPY.iniciarSesion}</Link>
      </p>
    </form>
  );
}
