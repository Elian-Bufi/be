'use client';

/**
 * La seguridad del acceso del profesional (WP-USO-FINAL UF-11; DL-169; 08 §25): cuántos códigos de recuperación quedan,
 * reemplazar el autenticador (API-MFA-04 y 05) y generar códigos nuevos (API-MFA-06). Las dos cosas piden una entrada
 * reciente (los 10 minutos que siguen a entrar): es la re-autenticación de 08 §25, igual con contraseña que con Google.
 * Si ya pasó, se dice: hay que volver a entrar. Llega acá con el segundo factor verificado (la compuerta de `/pro`).
 */
import { COPY, COPY_SEGUNDO_FACTOR_DEL_PROFESIONAL, type SegundoFactorDeLaSesionResponse } from '@be/domain';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { PasoDeConfiguracion } from '../../../components/segundo-factor-del-profesional';
import { Cargando, ErrorConReintento } from '../../../components/estados';
import { Aviso } from '../../../components/formulario';
import { api } from '../../../lib/api';
import { horaDelDia } from '../../../lib/formato';
import { alEnviarUnCodigo } from '../../../lib/segundo-factor-del-profesional';
import { useSesionRequerida } from '../../../lib/sesion-requerida';

const C = COPY_SEGUNDO_FACTOR_DEL_PROFESIONAL;

type Datos = SegundoFactorDeLaSesionResponse['data'];

export function SeguridadDelProfesional() {
  const ruta = usePathname();
  const { token, sesionPerdida } = useSesionRequerida(ruta);
  const [datos, setDatos] = useState<Datos | null>(null);
  const [falla, setFalla] = useState(false);
  const [vuelta, setVuelta] = useState(0);
  const [modo, setModo] = useState<'ver' | 'reemplazar'>('ver');
  const [codigos, setCodigos] = useState<readonly string[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  /** «Generar códigos nuevos» invalida los guardados: se confirma antes de llamar a API-MFA-06. */
  const [confirmando, setConfirmando] = useState(false);
  const releer = useCallback((nuevoAviso: string | null = null) => {
    setAviso(nuevoAviso);
    setModo('ver');
    setVuelta((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!token) return;
    let vigente = true;
    setFalla(false);
    void api.segundoFactorDeLaSesion(token).then((r) => {
      if (!vigente) return;
      if (r.ok) return setDatos(r.datos.data);
      if (!sesionPerdida(r)) setFalla(true);
    });
    return () => {
      vigente = false;
    };
  }, [token, vuelta, sesionPerdida]);

  async function generarCodigos() {
    if (!token || enviando) return;
    setAviso(null);
    setEnviando(true);
    const r = await api.codigosDeRecuperacionNuevosDeLaSesion(token);
    setEnviando(false);
    if (r.ok) return setCodigos(r.datos.data.recoveryCodes);
    const que = alEnviarUnCodigo(r);
    if (que.tipo === 'sesion') return void sesionPerdida(r);
    if (que.tipo === 'releer') return releer(que.aviso ?? C.seguridad.noReciente);
    setAviso(que.tipo === 'aviso' ? que.mensaje : COPY.noDisponible);
  }

  if (!token) return <Cargando />;
  if (falla) return <ErrorConReintento onReintentar={() => releer()} />;
  if (!datos) return <Cargando />;

  if (codigos) {
    return (
      <section className="panel">
        <h2>{C.codigos.titulo}</h2>
        <p>{C.codigos.ayuda}</p>
        <ol className="codigos-de-recuperacion">
          {codigos.map((c) => (
            <li key={c}>
              <code>{c}</code>
            </li>
          ))}
        </ol>
        <div className="acciones">
          <button
            type="button"
            className="boton boton--primario"
            onClick={() => {
              setCodigos(null);
              releer();
            }}
          >
            {C.codigos.listo}
          </button>
        </div>
      </section>
    );
  }

  if (modo === 'reemplazar') {
    return <PasoDeConfiguracion token={token} plazo={null} avisoInicial={null} reemplazo alTerminar={(a) => releer(a ?? null)} alCancelar={() => setModo('ver')} alPerderLaSesion={sesionPerdida} />;
  }

  const reciente = datos.recentSignInUntil;
  return (
    <section className="panel">
      <p className="bajada">{C.seguridad.queEs}</p>
      {aviso ? (
        <Aviso tipo="info" enfocar>
          <p>{aviso}</p>
        </Aviso>
      ) : null}
      {datos.recoveryCodesRemaining !== null ? <p>{C.seguridad.restantes(datos.recoveryCodesRemaining)}</p> : null}
      <p className="nota">{reciente ? C.seguridad.reciente(horaDelDia(new Date(reciente))) : C.seguridad.noReciente}</p>
      <div className="acciones">
        <button type="button" className="boton boton--secundario" onClick={() => setModo('reemplazar')} disabled={!reciente || enviando}>
          {C.configuracion.reemplazar}
        </button>
        <button type="button" className="boton boton--secundario" onClick={() => setConfirmando(true)} disabled={!reciente || enviando || confirmando}>
          {C.codigos.regenerar}
        </button>
      </div>
      {confirmando ? (
        <Aviso tipo="info" enfocar>
          <p>{C.codigos.confirmar}</p>
          <div className="acciones">
            <button
              type="button"
              className="boton boton--peligro"
              onClick={() => {
                setConfirmando(false);
                void generarCodigos();
              }}
              disabled={enviando}
            >
              {C.codigos.siGenerar}
            </button>
            <button type="button" className="boton boton--secundario" onClick={() => setConfirmando(false)}>
              {C.codigos.noGenerar}
            </button>
          </div>
        </Aviso>
      ) : null}
      <p className="nota">{C.codigos.regenerarAyuda}</p>
    </section>
  );
}
