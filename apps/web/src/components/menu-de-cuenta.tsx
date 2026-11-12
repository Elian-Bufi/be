'use client';

/**
 * El menú de la cuenta, en la esquina del encabezado (WP-ESCRITORIO-AMABLE; pedido de Dirección del 2026-10-10): un solo
 * botón que abre las opciones de la persona. Reemplaza al selector de apariencia suelto, que en una tablet de pie
 * obligaba al encabezado a ocupar un renglón más, y es el lugar donde van a vivir las opciones de configuración.
 *
 * - **Con sesión:** el botón dice «Cuenta» y abre «Datos de la cuenta», la apariencia y «Cerrar sesión».
 * - **Sin sesión** (portada, ingreso, registro, legales): el botón dice «Apariencia» y abre solo la apariencia.
 *
 * WP-TABLERO-ALTA-GAMA TB-05 (DL-163 D-2): en el espacio profesional, el círculo del botón lleva el monograma de la
 * cuenta, con el nombre con que la ven las personas, y el panel suma «Ocultar nombres», para mostrar la pantalla. Con
 * los nombres ocultos, el círculo lleva el ícono que lo avisa, en todas las páginas de /pro.
 *
 * La apariencia es «Azul noche» (predeterminada) o «Claro». La preferencia se guarda en este navegador, no en la cuenta;
 * si no se puede guardar, vale solo por esta visita, y se dice. Elegir un tema no cambia nada más que la apariencia.
 *
 * Es un botón que despliega un panel (`aria-expanded`), no un menú de aplicación: adentro hay un enlace, dos opciones y
 * un botón, que se recorren con Tab como cualquier otro control. Escape lo cierra y devuelve el foco al botón; tocar
 * fuera también lo cierra, y también salir de él con el teclado: abierto, tapa lo que tiene debajo, y el foco no puede
 * quedar detrás de un panel (WCAG 2.2, 2.4.11).
 */
import { Enlace } from './enlace';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { aplicarTema, leerTema, NOMBRE_DEL_TEMA, sePuedeGuardar, TEMA_PREDETERMINADO, TEMAS, temaValido, type Tema } from '../lib/apariencia';
import { COPY } from '../lib/copy';
import { CERRANDO_SESION, useCerrarSesion } from '../lib/cerrar-sesion';
import { useNombrePropio } from '../lib/nombre-propio';
import { ponerNombresOcultos, useNombresOcultosElegido } from '../lib/nombres-ocultos';
import { useSesion } from '../lib/sesion';
import { Icono } from './icono';
import { Retrato } from './retrato';

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
  // Cerrar la sesión es lo mismo acá y en «Antes de seguir» (`useCerrarSesion`).
  const { cerrar: cerrarSesion, cerrando, problema, olvidarProblema } = useCerrarSesion();
  const nombrePropio = useNombrePropio();
  const ocultos = useNombresOcultosElegido();
  const [ocultosGuardados, setOcultosGuardados] = useState(true);

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
    olvidarProblema();
  }, [ruta, olvidarProblema]);

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
  const conSesion = token !== null;
  const enElEspacio = conSesion && (ruta === '/pro' || ruta.startsWith('/pro/'));
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
        {/* El lugar del retrato: en el espacio profesional, el monograma de la cuenta (TB-05) o, con los nombres ocultos, el
            ícono que lo avisa; fuera de él, un dibujo. La foto del profesional llega en la etapa B (TB-23). */}
        <span className="menu-de-cuenta__retrato">
          {enElEspacio && ocultos ? <Icono nombre="oculto" /> : enElEspacio && nombrePropio ? <Retrato nombre={nombrePropio} tamano="medio" /> : <Icono nombre={conSesion ? 'persona' : tema} />}
        </span>
        <span className="menu-de-cuenta__palabra">
          {conSesion ? 'Cuenta' : 'Apariencia'}
          {enElEspacio && ocultos ? <span className="visualmente-oculto">, con los nombres ocultos</span> : null}
        </span>
        <Icono nombre={abierto ? 'arriba' : 'abajo'} tamano={18} />
      </button>
      {abierto ? (
        <div id={`${id}-panel`} className="menu-de-cuenta__panel">
          {conSesion && !ruta.startsWith('/account') ? (
            <Enlace href="/account" className="menu-de-cuenta__opcion">
              <Icono nombre="persona" />
              <span>
                Datos de la cuenta
                <span className="nota">Estado, privacidad y seguridad</span>
              </span>
            </Enlace>
          ) : null}
          {/* La guía (DL-145): las ayudas de las pantallas, juntas. Solo en el espacio profesional, que es de lo que habla. */}
          {conSesion && ruta.startsWith('/pro') && ruta !== '/pro/guia' ? (
            <Enlace href="/pro/guia" className="menu-de-cuenta__opcion">
              <Icono nombre="ayuda" />
              <span>
                Guía del espacio profesional
                <span className="nota">Cómo se lee cada pantalla</span>
              </span>
            </Enlace>
          ) : null}
          {/* UF-11 (DL-169): el segundo factor del profesional, en el espacio profesional. */}
          {conSesion && ruta.startsWith('/pro') && ruta !== '/pro/security' ? (
            <Enlace href="/pro/security" className="menu-de-cuenta__opcion">
              <Icono nombre="persona" />
              <span>
                Seguridad de tu acceso
                <span className="nota">Tu segundo factor y sus códigos</span>
              </span>
            </Enlace>
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
          {/* TB-05: para mostrar la pantalla. Rige en todo el espacio profesional y cambia en el momento. */}
          {enElEspacio ? (
            <div className="menu-de-cuenta__ocultar">
              <label>
                <input type="checkbox" checked={ocultos} onChange={(e) => setOcultosGuardados(ponerNombresOcultos(e.target.checked))} aria-describedby={`${id}-ocultar`} />
                <Icono nombre="oculto" />
                Ocultar nombres
              </label>
              <p id={`${id}-ocultar`} className="nota">
                Para mostrar la pantalla: cada persona se ve por su referencia, sin iniciales. {guardable && ocultosGuardados ? 'Se guarda en este navegador.' : 'Vale por esta visita.'}
              </p>
            </div>
          ) : null}
          {conSesion ? (
            <button type="button" className="menu-de-cuenta__opcion" onClick={() => void cerrarSesion()} disabled={cerrando}>
              <Icono nombre="salir" />
              {cerrando ? CERRANDO_SESION : COPY.cerrarSesion}
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
