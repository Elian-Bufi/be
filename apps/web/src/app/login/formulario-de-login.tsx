'use client';

/**
 * PROTO-10-ACC-05 — login neutral, sin recuperación (fuera de alcance). Un único mensaje para todo fallo de
 * credenciales o de estado de cuenta (10-B02:198-225). Después del login, el profesional aterriza en su espacio y el resto
 * en Cuenta (DL-025; pedido de Dirección del 2026-10-17), salvo que haya un retorno pedido.
 * DL-138: «Continuar con Google» arriba del formulario, si el build tiene el client ID. La sesión que abre Google se guarda
 * igual que la del login y lleva al mismo destino.
 * DL-147: si al abrir la entrada se reanuda una sesión (una recarga, otra pestaña), sigue directo al destino pedido o al
 * inicio, sin pedir la contraseña. Mientras se pregunta, el formulario dice «Recuperando tu sesión…».
 */
import type { IniciarSesionResponse } from '@be/domain';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AccesoConGoogle } from '../../components/acceso-con-google';
import { Aviso, Campo, ResumenDeErrores } from '../../components/formulario';
import { api } from '../../lib/api';
import { avisoDe, COPY, destinoSeguro } from '../../lib/copy';
import { buscarInicioPropio } from '../../lib/inicio';
import { useSesion } from '../../lib/sesion';

type Estado = { tipo: 'editando' } | { tipo: 'enviando' } | { tipo: 'error'; mensaje: string };

export function FormularioDeLogin() {
  const parametros = useSearchParams();
  const aviso = avisoDe(parametros.get('aviso'));
  const router = useRouter();
  const { guardar, sesion, restaurando } = useSesion();
  // La sesión que abre este formulario navega desde `entrar`; la que se reanuda al cargar, desde el efecto de abajo.
  const entroAca = useRef(false);
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errores, setErrores] = useState<{ correo?: string; contrasena?: string }>({});
  const [estado, setEstado] = useState<Estado>({ tipo: 'editando' });
  const [intento, setIntento] = useState(0);

  /**
   * La sesión de API-ACC-02 o de Google (API-GOO-01 a 03): se guarda igual y lleva al mismo destino. Con un retorno
   * pedido, vuelve ahí; si no, al inicio de la cuenta: el profesional, a su espacio, y el resto, a Cuenta.
   */
  function entrar(respuesta: IniciarSesionResponse) {
    const token = respuesta.data.session.accessToken;
    entroAca.current = true;
    guardar(respuesta);
    const volver = parametros.get('volver');
    if (volver) {
      router.push(destinoSeguro(volver));
      return;
    }
    void buscarInicioPropio(token).then((destino) => router.push(destino));
  }

  const tokenReanudado = sesion?.token ?? null;
  useEffect(() => {
    if (restaurando || !tokenReanudado || entroAca.current) return;
    const volver = parametros.get('volver');
    if (volver) router.replace(destinoSeguro(volver));
    else void buscarInicioPropio(tokenReanudado).then((destino) => router.replace(destino));
  }, [restaurando, tokenReanudado, parametros, router]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (estado.tipo === 'enviando') return;
    const encontrados: typeof errores = {};
    if (!correo.trim()) encontrados.correo = 'Ingresá tu correo electrónico.';
    if (!contrasena) encontrados.contrasena = 'Ingresá tu contraseña.';
    setErrores(encontrados);
    setIntento((n) => n + 1);
    if (Object.keys(encontrados).length > 0) return;

    setEstado({ tipo: 'enviando' });
    const r = await api.iniciarSesion(correo, contrasena);
    if (r.ok) {
      setContrasena('');
      entrar(r.datos);
      return;
    }
    if (r.tipo === 'RED') return setEstado({ tipo: 'error', mensaje: COPY.resultadoIncierto });
    if (r.codigo === 'INVALID_CREDENTIALS') return setEstado({ tipo: 'error', mensaje: COPY.loginFallido });
    if (r.codigo === 'RATE_LIMITED') return setEstado({ tipo: 'error', mensaje: COPY.demasiadosIntentos });
    if (r.codigo === 'INVALID_REQUEST' || r.codigo === 'UNKNOWN_FIELD') return setEstado({ tipo: 'error', mensaje: COPY.loginFallido });
    return setEstado({ tipo: 'error', mensaje: COPY.noDisponible });
  }

  const lista = Object.entries(errores).map(([id, texto]) => ({ id, texto: texto as string }));
  const enviando = estado.tipo === 'enviando';

  // Sin parpadeo: mientras se pregunta por la sesión, o mientras se va con la que se reanudó, no se dibuja el formulario.
  if (restaurando || (tokenReanudado && !entroAca.current)) {
    return (
      <p className="nota" aria-live="polite">
        {restaurando ? 'Recuperando tu sesión…' : 'Ya iniciaste sesión: te llevamos…'}
      </p>
    );
  }

  return (
    <AccesoConGoogle alEntrar={entrar}>
      <form className="formulario" onSubmit={enviar} noValidate>
        {aviso && estado.tipo === 'editando' && lista.length === 0 ? (
          <Aviso tipo="info" enfocar>
            <p>{aviso}</p>
          </Aviso>
        ) : null}
        <ResumenDeErrores titulo={COPY.resumenDeErrores(lista.length)} errores={lista} intento={intento} />
        {estado.tipo === 'error' ? (
          <Aviso tipo="error" enfocar>
            <p>{estado.mensaje}</p>
          </Aviso>
        ) : null}

        <Campo
          id="correo"
          etiqueta="Correo electrónico"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          error={errores.correo}
        />
        <Campo
          id="contrasena"
          etiqueta="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          error={errores.contrasena}
        />
        <button className="boton boton--primario" type="submit" disabled={enviando} aria-busy={enviando}>
          {enviando ? 'Iniciando sesión…' : COPY.iniciarSesion}
        </button>
        <p>
          ¿No tenés cuenta? <Link href="/register">Crear cuenta</Link>
        </p>
      </form>
    </AccesoConGoogle>
  );
}
