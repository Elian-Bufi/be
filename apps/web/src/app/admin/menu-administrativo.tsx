'use client';

/**
 * El menú de la cuenta administrativa, en la esquina de la barra: el mismo patrón que `MenuDeCuenta` (un botón que abre
 * un panel; Escape, tocar fuera o salir con el teclado lo cierran), con lo de Administración:
 * - **Con sesión:** quién está en la consola, «Seguridad de tu acceso» (con el segundo factor vigente), la apariencia y
 *   «Cerrar sesión».
 * - **Sin sesión:** solo la apariencia.
 * La apariencia es la del website: se guarda en este navegador y no cambia nada más que los colores.
 */
import { CODIGOS_DE_SESION_ADMINISTRATIVA_NO_VALIDA, COPY, COPY_ADMINISTRACION } from '@be/domain';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Icono } from '../../components/icono';
import { aplicarTema, leerTema, NOMBRE_DEL_TEMA, sePuedeGuardar, TEMA_PREDETERMINADO, TEMAS, temaValido, type Tema } from '../../lib/apariencia';
import { apiAdministrativa } from '../../lib/api-administrativa';
import { useAdministracion } from '../../lib/sesion-administrativa';

const C = COPY_ADMINISTRACION.consola;

export function MenuAdministrativo() {
  const id = useId();
  const ruta = usePathname();
  const router = useRouter();
  const { sesion, olvidar } = useAdministracion();
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [tema, setTema] = useState<Tema>(TEMA_PREDETERMINADO);
  const [guardable, setGuardable] = useState(true);
  const [cerrando, setCerrando] = useState(false);
  const [problema, setProblema] = useState<string | null>(null);

  useEffect(() => {
    const vigente = leerTema();
    setTema(vigente);
    if (document.documentElement.dataset.tema !== vigente) document.documentElement.dataset.tema = vigente;
    setGuardable(sePuedeGuardar());
  }, []);

  useEffect(() => {
    setAbierto(false);
    setProblema(null);
  }, [ruta]);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setAbierto(false);
      boton.current?.focus();
    };
    const alTocar = (e: PointerEvent) => {
      if (raiz.current && e.target instanceof Node && !raiz.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('keydown', alTeclear);
    document.addEventListener('pointerdown', alTocar);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.removeEventListener('pointerdown', alTocar);
    };
  }, [abierto]);

  const token = sesion?.token ?? null;
  const vigente = sesion?.segundoFactor.state === 'VERIFIED';

  /** Cierra la sesión en la API (que borra la cookie de reanudación) y la olvida en esta pestaña y en las demás. */
  async function cerrarSesion() {
    if (!token || cerrando) return;
    setCerrando(true);
    setProblema(null);
    const r = await apiAdministrativa.cerrarSesion(token);
    if (r.ok || (r.tipo === 'API' && CODIGOS_DE_SESION_ADMINISTRATIVA_NO_VALIDA.has(r.codigo))) {
      olvidar('cerrada');
      setCerrando(false);
      router.replace('/admin');
      return;
    }
    setCerrando(false);
    setProblema(r.tipo === 'RED' ? COPY.resultadoIncierto : COPY.noDisponible);
  }

  return (
    <div
      ref={raiz}
      className="menu-de-cuenta"
      onBlur={(e) => {
        if (e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) setAbierto(false);
      }}
    >
      <button ref={boton} type="button" className="menu-de-cuenta__boton" aria-expanded={abierto} aria-controls={`${id}-panel`} onClick={() => setAbierto(!abierto)}>
        <span className="menu-de-cuenta__retrato">
          <Icono nombre={sesion ? 'persona' : tema} />
        </span>
        <span className="menu-de-cuenta__palabra">{sesion ? 'Cuenta' : 'Apariencia'}</span>
        <Icono nombre={abierto ? 'arriba' : 'abajo'} tamano={18} />
      </button>
      {abierto ? (
        <div id={`${id}-panel`} className="menu-de-cuenta__panel">
          {sesion ? (
            <p className="menu-de-cuenta__quien">
              {sesion.administrador.nombre}
              <span className="nota">{C.nombre}</span>
            </p>
          ) : null}
          {vigente && ruta !== '/admin/security' ? (
            <Link href="/admin/security" className="menu-de-cuenta__opcion">
              <Icono nombre="candado" />
              <span>
                {C.opcionSeguridad}
                <span className="nota">{C.opcionSeguridadNota}</span>
              </span>
            </Link>
          ) : null}
          <fieldset className="menu-de-cuenta__apariencia">
            <legend>Apariencia</legend>
            {TEMAS.map((t) => (
              <label key={t} className="menu-de-cuenta__tema">
                <input
                  type="radio"
                  name={`${id}-apariencia`}
                  value={t}
                  checked={tema === t}
                  onChange={() => {
                    const elegido = temaValido(t);
                    setTema(elegido);
                    aplicarTema(elegido);
                  }}
                />
                <Icono nombre={t} />
                {NOMBRE_DEL_TEMA[t]}
              </label>
            ))}
            <p className="nota">{guardable ? 'Se guarda en este navegador, no en tu cuenta.' : 'Este navegador no guarda preferencias: vale por esta visita.'}</p>
          </fieldset>
          {sesion ? (
            <button type="button" className="menu-de-cuenta__opcion" onClick={cerrarSesion} disabled={cerrando}>
              <Icono nombre="salir" />
              {cerrando ? COPY_ADMINISTRACION.sesion.cerrando : COPY_ADMINISTRACION.sesion.cerrar}
            </button>
          ) : null}
          {problema ? (
            <p className="campo__error" role="alert">
              {problema}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
