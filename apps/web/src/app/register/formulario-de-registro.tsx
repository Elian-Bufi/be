'use client';

/**
 * PROTO-10-ACC-01 — crear cuenta. A1, A2 y la declaración de mayoría de edad (08 §24.7 a; DL-138) son tres actos
 * separados: cada uno con etiqueta propia, versión y casilla propia, nunca premarcada (10-B02:128-155). A3 NO forma parte
 * del registro (10-B02:137-141).
 * PROTO-10-ACC-02 — después del alta no hay auto-login (10-B02:170-194).
 * DL-138: «Continuar con Google» arriba del formulario, si el build tiene el client ID. El alta con Google sí abre la
 * sesión (la API la devuelve con la cuenta), y se guarda igual que la del login.
 */
import {
  ISSUE_DE_MAYORIA_DE_EDAD,
  MENSAJE_DE_CAMPO,
  identificadorLocalValido,
  normalizarIdentificadorLocal,
  problemaDeCredencialLocal,
  type IniciarSesionResponse,
} from '@be/domain';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { AccesoConGoogle } from '../../components/acceso-con-google';
import { ActosDelAlta, erroresDeLosActos, idDelActo, NINGUN_ACTO_MARCADO, type ActoDelAlta, type ActosMarcados } from '../../components/actos-del-alta';
import { Aviso, Campo, ResumenDeErrores } from '../../components/formulario';
import { api, nuevaClaveDeIdempotencia } from '../../lib/api';
import { COPY, destinoSeguro } from '../../lib/copy';
import { useSesion } from '../../lib/sesion';

type Campos = 'correo' | 'contrasena' | ActoDelAlta;
type Errores = Partial<Record<Campos, string>>;
type Estado =
  | { tipo: 'editando' }
  | { tipo: 'enviando' }
  | { tipo: 'creada' }
  | { tipo: 'no-disponible' }
  | { tipo: 'incierto' }
  | { tipo: 'error'; mensaje: string };

const ACTOS: ReadonlySet<Campos> = new Set<Campos>(['a1', 'a2', 'mayoria']);

function validar(correo: string, contrasena: string, actos: ActosMarcados): Errores {
  const errores: Errores = {};
  if (!identificadorLocalValido(normalizarIdentificadorLocal(correo))) errores.correo = MENSAJE_DE_CAMPO.INVALID_LOCAL_IDENTIFIER;
  const problema = problemaDeCredencialLocal(contrasena);
  if (problema) errores.contrasena = MENSAJE_DE_CAMPO[problema];
  return { ...errores, ...erroresDeLosActos(actos) };
}

export function FormularioDeRegistro() {
  const router = useRouter();
  const { guardar } = useSesion();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [actos, setActos] = useState<ActosMarcados>(NINGUN_ACTO_MARCADO);
  const [errores, setErrores] = useState<Errores>({});
  const [estado, setEstado] = useState<Estado>({ tipo: 'editando' });
  const [intento, setIntento] = useState(0);
  // Una key por intento lógico: se conserva en los reintentos y se renueva si cambian los datos (10-B10:430-438).
  const clave = useRef<string>(nuevaClaveDeIdempotencia());
  const renovarClave = () => {
    clave.current = nuevaClaveDeIdempotencia();
  };

  /** La sesión que abre Google (API-GOO-01 o 03): se guarda como la del login y lleva a Cuenta. */
  function entrarConGoogle(respuesta: IniciarSesionResponse) {
    guardar(respuesta);
    router.push(destinoSeguro(null));
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (estado.tipo === 'enviando') return; // sin doble envío (10-B04:1071-1113)
    const encontrados = validar(correo, contrasena, actos);
    setErrores(encontrados);
    setIntento((n) => n + 1);
    if (Object.keys(encontrados).length > 0) return;

    setEstado({ tipo: 'enviando' });
    const r = await api.registrar({ correo, contrasena, mayoriaDeEdad: actos.mayoria }, clave.current);
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
        setIntento((n) => n + 1);
        return setEstado({ tipo: 'editando' });
      }
      case 'VALIDATION_FAILED':
        // DL-138: la declaración de mayoría de edad sin marcar vuelve a su casilla; con otra versión, los textos cambiaron.
        renovarClave();
        if (r.issues.some((i) => i.code === ISSUE_DE_MAYORIA_DE_EDAD.REQUERIDA)) {
          setErrores({ mayoria: MENSAJE_DE_CAMPO.MAYORIA_REQUERIDA });
          setIntento((n) => n + 1);
          return setEstado({ tipo: 'editando' });
        }
        if (r.issues.some((i) => i.code === ISSUE_DE_MAYORIA_DE_EDAD.VERSION_NO_VIGENTE)) return setEstado({ tipo: 'error', mensaje: COPY.versionDesactualizada });
        return setEstado({ tipo: 'error', mensaje: COPY.noDisponible });
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

  const listaDeErrores = (Object.entries(errores) as [Campos, string][]).map(([campo, texto]) => ({ id: ACTOS.has(campo) ? idDelActo(campo as ActoDelAlta) : campo, texto }));
  const enviando = estado.tipo === 'enviando';
  // Otros datos = otro intento lógico: key nueva (con la misma key la API respondería IDEMPOTENCY_KEY_REUSED).
  const cambiar = <T,>(setter: (v: T) => void) => (valor: T) => {
    setter(valor);
    renovarClave();
  };

  return (
    <AccesoConGoogle alEntrar={entrarConGoogle}>
      <form className="formulario" onSubmit={enviar} noValidate aria-describedby="registro-aviso">
        <ResumenDeErrores titulo={COPY.resumenDeErrores(listaDeErrores.length)} errores={listaDeErrores} intento={intento} />

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

        <ActosDelAlta marcados={actos} errores={errores} alCambiar={(acto, valor) => cambiar(setActos)({ ...actos, [acto]: valor })} />

        <button className="boton boton--primario" type="submit" disabled={enviando} aria-busy={enviando}>
          {enviando ? 'Creando cuenta…' : estado.tipo === 'incierto' ? COPY.reintentar : 'Crear cuenta'}
        </button>
        <p>
          ¿Ya tenés cuenta? <Link href="/login">{COPY.iniciarSesion}</Link>
        </p>
      </form>
    </AccesoConGoogle>
  );
}
