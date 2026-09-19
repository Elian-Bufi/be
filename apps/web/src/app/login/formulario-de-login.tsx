'use client';

/**
 * PROTO-10-ACC-05 — login neutral, sin recuperación (fuera de alcance). Un único mensaje para todo fallo de
 * credenciales o de estado de cuenta (10-B02:198-225). Después del login se aterriza en Cuenta (DL-025).
 */
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Aviso, Campo, ResumenDeErrores } from '../../components/formulario';
import { api } from '../../lib/api';
import { avisoDe, COPY, destinoSeguro } from '../../lib/copy';
import { useSesion } from '../../lib/sesion';

type Estado = { tipo: 'editando' } | { tipo: 'enviando' } | { tipo: 'error'; mensaje: string };

export function FormularioDeLogin() {
  const parametros = useSearchParams();
  const aviso = avisoDe(parametros.get('aviso'));
  const router = useRouter();
  const { guardar } = useSesion();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errores, setErrores] = useState<{ correo?: string; contrasena?: string }>({});
  const [estado, setEstado] = useState<Estado>({ tipo: 'editando' });

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (estado.tipo === 'enviando') return;
    const encontrados: typeof errores = {};
    if (!correo.trim()) encontrados.correo = 'Ingresá tu correo electrónico.';
    if (!contrasena) encontrados.contrasena = 'Ingresá tu contraseña.';
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setEstado({ tipo: 'enviando' });
    const r = await api.iniciarSesion(correo, contrasena);
    if (r.ok) {
      setContrasena('');
      guardar(r.datos.data.session.accessToken, r.datos.data.session.expiresAt);
      router.push(destinoSeguro(parametros.get('volver')));
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

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      {aviso && estado.tipo === 'editando' && lista.length === 0 ? (
        <Aviso tipo="info" enfocar>
          <p>{aviso}</p>
        </Aviso>
      ) : null}
      <ResumenDeErrores titulo={COPY.resumenDeErrores(lista.length)} errores={lista} />
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
  );
}
