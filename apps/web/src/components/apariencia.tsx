'use client';

/**
 * El selector de apariencia del encabezado: «Azul noche» (predeterminado) o «Claro». Con nombre accesible y estado
 * seleccionado; dice que la preferencia se guarda en este navegador, y si no se puede guardar, que vale solo por esta
 * visita. Elegir un tema no cambia nada más que la apariencia.
 */
import { useEffect, useId, useState } from 'react';
import { aplicarTema, leerTema, NOMBRE_DEL_TEMA, sePuedeGuardar, TEMA_PREDETERMINADO, TEMAS, temaValido, type Tema } from '../lib/apariencia';
import { Icono } from './icono';

export function SelectorDeApariencia() {
  const id = useId();
  // Antes de montar no se sabe la preferencia: el `<select>` nace con el predeterminado y se alinea al montar, sin
  // tocar el atributo que el script de inicio ya puso (así no hay salto ni diferencia de hidratación en el resto).
  const [tema, setTema] = useState<Tema>(TEMA_PREDETERMINADO);
  const [guardable, setGuardable] = useState(true);
  useEffect(() => {
    // Al montar, el atributo de la página, el selector y la apariencia efectiva quedan iguales: la preferencia vigente
    // (guardada, o la ya aplicada en esta visita si el almacenamiento no responde).
    const vigente = leerTema();
    setTema(vigente);
    if (document.documentElement.dataset.tema !== vigente) document.documentElement.dataset.tema = vigente;
    setGuardable(sePuedeGuardar());
  }, []);
  return (
    <div className="apariencia">
      <label htmlFor={id}>
        {/* El dibujo acompaña a la palabra: el sol en Claro y la luna en Azul noche. */}
        <Icono nombre={tema} tamano={18} />
        Apariencia
      </label>
      <select
        id={id}
        value={tema}
        aria-describedby={`${id}-ayuda`}
        onChange={(e) => {
          const elegido = temaValido(e.target.value);
          setTema(elegido);
          aplicarTema(elegido);
        }}
      >
        {TEMAS.map((t) => (
          <option key={t} value={t}>
            {NOMBRE_DEL_TEMA[t]}
          </option>
        ))}
      </select>
      <span id={`${id}-ayuda`} className="visualmente-oculto">
        {guardable ? 'Se guarda en este navegador, no en tu cuenta.' : 'Este navegador no guarda preferencias: vale por esta visita.'}
      </span>
    </div>
  );
}
