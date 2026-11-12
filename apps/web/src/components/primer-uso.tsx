'use client';

/**
 * ED-17 (WP-EDITORES-PROFESIONAL) · Una ayuda de primer uso, de tres renglones, que se cierra y se recuerda en el
 * navegador. Es una preferencia de la pantalla, no un dato de salud: si el navegador no deja guardar (una ventana
 * privada, datos bloqueados), la ayuda se cierra igual y vuelve a aparecer la próxima vez. Lo que hace falta para
 * decidir no va acá: va a la vista (DL-166 PV-4).
 */
import { useEffect, useState } from 'react';
import { Icono } from './icono';

const leer = (clave: string): boolean => {
  try {
    return window.localStorage.getItem(clave) === 'cerrada';
  } catch {
    return false;
  }
};

export function PrimerUso({ clave, titulo, renglones, cerrar, dondeEsta }: { clave: string; titulo: string; renglones: readonly string[]; cerrar: string; dondeEsta: string }) {
  // Hasta leer el navegador no se dibuja: así no aparece un instante y se va.
  const [cerrada, setCerrada] = useState(true);
  useEffect(() => setCerrada(leer(clave)), [clave]);
  if (cerrada) return null;
  return (
    <aside className="primer-uso" aria-label={titulo} data-primer-uso={clave}>
      <Icono nombre="ayuda" tamano={18} />
      <div>
        <p className="primer-uso__titulo">{titulo}</p>
        <ul>
          {renglones.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="nota">{dondeEsta}</p>
      </div>
      <button
        type="button"
        className="boton boton--quieto boton--compacto"
        onClick={() => {
          setCerrada(true);
          try {
            window.localStorage.setItem(clave, 'cerrada');
          } catch {
            // Sin almacenamiento, se cierra solo por ahora.
          }
        }}
      >
        {cerrar}
      </button>
    </aside>
  );
}
