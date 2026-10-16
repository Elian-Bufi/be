'use client';

/**
 * El menú de la cuenta, en la esquina del encabezado (WP-ESCRITORIO-AMABLE; pedido de Dirección del 2026-10-10): un solo
 * botón que abre las opciones de la persona. Reemplaza al selector de apariencia suelto, que en una tablet de pie
 * obligaba al encabezado a ocupar un renglón más, y es el lugar donde van a vivir las opciones de configuración.
 *
 * - **Con sesión:** el botón dice «Cuenta» y abre «Datos de la cuenta», la apariencia y «Cerrar sesión».
 * - **Sin sesión** (portada, ingreso, registro, legales): el botón dice «Apariencia» y abre solo la apariencia.
 *
 * La apariencia es «Azul noche» (predeterminada) o «Claro». La preferencia se guarda en este navegador, no en la cuenta;
 * si no se puede guardar, vale solo por esta visita, y se dice. Elegir un tema no cambia nada más que la apariencia.
 *
 * Es un botón que despliega un panel (`aria-expanded`), no un menú de aplicación: adentro hay un enlace, dos opciones y
 * un botón, que se recorren con Tab como cualquier otro control. Escape lo cierra y devuelve el foco al botón; tocar
 * fuera también lo cierra, y también salir de él con el teclado: abierto, tapa lo que tiene debajo, y el foco no puede
 * quedar detrás de un panel (WCAG 2.2, 2.4.11).
 */
import { CODIGOS_DE_SESION_NO_VALIDA } from '@be/domain';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { api } from '../lib/api';
import { aplicarTema, leerTema, NOMBRE_DEL_TEMA, sePuedeGuardar, TEMA_PREDETERMINADO, TEMAS, temaValido, type Tema } from '../lib/apariencia';
import { COPY } from '../lib/copy';
import { useSesion } from '../lib/sesion';
import { Icono } from './icono';

export function MenuDeCuenta() {
  const id = useId();
  const ruta = usePathname();
  const { sesion } = useSesion();
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(false);
  // Antes de montar no se sabe la preferencia: nace con el predeterminado y se alinea al montar, sin tocar el atributo
  // que el script de inicio ya puso (así no hay salto ni diferencia de hidratación en el resto).
  const [tema, setTema] = useState<Tema>(TEMA_PREDETERMINADO);
  const [guardable, setGuardable] = useState(true);
  const [cerrando, setCerrando] = useState(false);
  const [problema, setProblema] = useState<string | null>(null);

  useEffect(() => {
    // Al montar, el atributo de la página, la opción marcada y la apariencia efectiva quedan iguales: la preferencia
    // vigente (guardada, o la ya aplicada en esta visita si el almacenamiento no responde).
    const vigente = leerTema();
    setTema(vigente);
    if (document.documentElement.dataset.tema !== vigente) document.documentElement.dataset.tema = vigente;
    setGuardable(sePuedeGuardar());
  }, []);

  // Al cambiar de página, el panel se cierra.
  useEffect(() => {
    setAbierto(false);
    setProblema(null);
  }, [ruta]);

  // Abierto, se cierra con Escape (el foco vuelve al botón) o al tocar fuera de él.
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

  /**
   * Cierra esta sesión, igual que el botón de «Cuenta». Con la sesión cerrada (o si la API dice que ya no valía), va a
   * «Iniciar sesión» con una carga completa de la página: la sesión vive en memoria, así no queda nada de la visita.
   */
  async function cerrarSesion() {
    if (!token || cerrando) return;
    setCerrando(true);
    setProblema(null);
    const r = await api.finalizarSesion(token);
    if (r.ok || (r.tipo === 'API' && CODIGOS_DE_SESION_NO_VALIDA.has(r.codigo))) {
      window.location.assign('/login?aviso=sesion-cerrada');
      return;
    }
    setCerrando(false);
    setProblema(r.tipo === 'RED' ? COPY.resultadoIncierto : COPY.noDisponible);
  }

  const conSesion = token !== null;
  return (
    <div
      ref={raiz}
      className="menu-de-cuenta"
      onBlur={(e) => {
        // El foco pasó a otro lugar de la página (no a otra ventana, que no trae destino): el panel se cierra.
        if (e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) setAbierto(false);
      }}
    >
      <button ref={boton} type="button" className="menu-de-cuenta__boton" aria-expanded={abierto} aria-controls={`${id}-panel`} onClick={() => setAbierto(!abierto)}>
        {/* El lugar del retrato: hoy un dibujo; cuando BE tenga imagen de perfil, va acá. */}
        <span className="menu-de-cuenta__retrato">
          <Icono nombre={conSesion ? 'persona' : tema} />
        </span>
        <span className="menu-de-cuenta__palabra">{conSesion ? 'Cuenta' : 'Apariencia'}</span>
        <Icono nombre={abierto ? 'arriba' : 'abajo'} tamano={18} />
      </button>
      {abierto ? (
        <div id={`${id}-panel`} className="menu-de-cuenta__panel">
          {conSesion && !ruta.startsWith('/account') ? (
            <Link href="/account" className="menu-de-cuenta__opcion">
              <Icono nombre="persona" />
              <span>
                Datos de la cuenta
                <span className="nota">Estado, privacidad y seguridad</span>
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
          {conSesion ? (
            <button type="button" className="menu-de-cuenta__opcion" onClick={cerrarSesion} disabled={cerrando}>
              <Icono nombre="salir" />
              {cerrando ? 'Cerrando sesión…' : COPY.cerrarSesion}
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
