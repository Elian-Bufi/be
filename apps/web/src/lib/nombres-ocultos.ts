'use client';

/**
 * «Ocultar nombres» (WP-TABLERO-ALTA-GAMA TB-05; DL-163 D-2): para mostrar la pantalla (una clase, una reunión, el
 * tribunal), cada persona se ve por su referencia neutral y sin iniciales, en todas las rutas /pro/**: el Espacio, la
 * ficha (el marco, las notas, las novedades) y lo que se sume después (el cajón, «Siguiente pendiente»). El título de la
 * pestaña nunca lleva un nombre: queda en el historial del navegador.
 *
 * - Se elige en el menú de la cuenta y se recuerda en este navegador, sin datos de personas: una sola marca. Si el
 *   navegador no guarda, vale por esta visita, y se dice.
 * - Cambia en el momento, en todas las pestañas abiertas (el evento `storage`), sin volver a leer nada de la API.
 * - Fuera de /pro no rige: la persona, en su cuenta, ve a sus profesionales como siempre.
 * - Los nombres llegan siempre de la API, después de montar: la primera pintura con datos ya sabe si van ocultos.
 */
import { usePathname } from 'next/navigation';
import { useMemo, useSyncExternalStore } from 'react';
import { nombreQueSeVe, rolDe, textoSinNombres, type Actor, type RolDeQuien } from './retrato';

const CLAVE = 'be.nombres-ocultos';
let ocultos: boolean | null = null;
const oyentes = new Set<() => void>();

function leer(): boolean {
  if (ocultos === null) {
    try {
      ocultos = window.localStorage.getItem(CLAVE) === '1';
    } catch {
      ocultos = false;
    }
  }
  return ocultos;
}

/** Antes de montar (la página exportada) no se sabe: nace sin ocultar, y todavía no hay ningún nombre que mostrar. */
const enElServidor = (): boolean => false;

function suscribir(avisar: () => void): () => void {
  oyentes.add(avisar);
  const deOtraPestana = (e: StorageEvent) => {
    if (e.key !== CLAVE) return;
    ocultos = e.newValue === '1';
    avisar();
  };
  window.addEventListener('storage', deOtraPestana);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener('storage', deOtraPestana);
  };
}

/** Prende o apaga «Ocultar nombres». Devuelve si quedó guardado en el navegador (si no, vale por esta visita). */
export function ponerNombresOcultos(valor: boolean): boolean {
  ocultos = valor;
  let guardado = true;
  try {
    if (valor) window.localStorage.setItem(CLAVE, '1');
    else window.localStorage.removeItem(CLAVE);
  } catch {
    guardado = false;
  }
  for (const avisar of oyentes) avisar();
  return guardado;
}

/** Si los nombres van ocultos en esta pantalla: solo en /pro/**. */
export function useNombresOcultos(): boolean {
  const ruta = usePathname() ?? '';
  const elegido = useSyncExternalStore(suscribir, leer, enElServidor);
  return elegido && (ruta === '/pro' || ruta.startsWith('/pro/'));
}

/** Lo que el elegido sin el filtro de la ruta: para el interruptor del menú. */
export function useNombresOcultosElegido(): boolean {
  return useSyncExternalStore(suscribir, leer, enElServidor);
}

export interface Nombres {
  readonly ocultos: boolean;
  /** Una persona que el profesional acompaña (la fila de un pendiente, el directorio, el marco de la ficha). */
  readonly delAsesorado: (a: Actor) => string;
  /** Un profesional (quien escribió una nota, los destinatarios de una nota de coordinación). */
  readonly delProfesional: (a: Actor) => string;
  /** Quien registró algo en la ficha de `asesoradoId`: la persona o uno de sus profesionales. */
  readonly deQuien: (a: Actor, asesoradoId: string) => string;
  /** Un texto que arma la API con esos nombres adentro. */
  readonly enElTexto: (texto: string, conocidos: readonly { readonly actor: Actor; readonly rol: RolDeQuien }[]) => string;
}

/** Los nombres de la pantalla, según «Ocultar nombres». Toda lectura de `displayName` en /pro pasa por acá. */
export function useNombres(): Nombres {
  const ocultos = useNombresOcultos();
  return useMemo(
    () => ({
      ocultos,
      delAsesorado: (a) => nombreQueSeVe(a, ocultos, 'asesorado'),
      delProfesional: (a) => nombreQueSeVe(a, ocultos, 'profesional'),
      deQuien: (a, asesoradoId) => nombreQueSeVe(a, ocultos, rolDe(a, asesoradoId)),
      enElTexto: (texto, conocidos) => textoSinNombres(texto, conocidos, ocultos),
    }),
    [ocultos],
  );
}
