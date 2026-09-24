'use client';

/**
 * El período de lo que se mira (B10-06 §41, §43-§44). Vive **fuera** del estado de lectura: si un período no se puede
 * leer, el formulario sigue ahí para corregirlo, en vez de quedar atrapado en «Reintentar» (B10-10:376). Lo que la API
 * rechazaría se avisa antes, junto al campo.
 *
 * Compartido por los tres dominios (DL-091 punto 2): entrenamiento, nutrición y antropometría eligen el período con
 * este mismo formulario y la misma validación previa, en vez de dos campos sueltos sin validar por pantalla.
 */
import { useState, type FormEvent } from 'react';
import { Campo } from '../../../components/formulario';

export interface Periodo {
  readonly periodStart?: string;
  readonly periodEnd?: string;
}

/** Lo mismo que exigen las API de revisión y evolución (API-TRN-21, API-NUT-17, API-ANT-06): hasta 92 días inclusivos. */
const DIAS_MAXIMOS = 92;
const hoyLocal = (): string => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
const dias = (desde: string, hasta: string): number => (new Date(`${hasta}T12:00:00Z`).getTime() - new Date(`${desde}T12:00:00Z`).getTime()) / 86_400_000;

export function FiltroDePeriodo({ id, onAplicar, diasMaximos = DIAS_MAXIMOS }: { id: string; onAplicar: (p: Periodo) => void; diasMaximos?: number }) {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [error, setError] = useState<{ campo: 'desde' | 'hasta'; texto: string } | null>(null);

  function aplicar(e: FormEvent) {
    e.preventDefault();
    const fin = hasta || hoyLocal();
    if (desde && desde > fin) return setError({ campo: 'desde', texto: '«Desde» no puede ser posterior a «Hasta».' });
    if (desde && dias(desde, fin) >= diasMaximos) return setError({ campo: 'desde', texto: `El período puede abarcar hasta ${diasMaximos} días.` });
    setError(null);
    onAplicar({ ...(desde ? { periodStart: desde } : {}), ...(hasta ? { periodEnd: hasta } : {}) });
  }

  return (
    <form className="fila-de-dato" onSubmit={aplicar} noValidate>
      <Campo id={`${id}-desde`} etiqueta="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} error={error?.campo === 'desde' ? error.texto : null} />
      <Campo id={`${id}-hasta`} etiqueta="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} error={error?.campo === 'hasta' ? error.texto : null} />
      <button type="submit" className="boton boton--secundario">
        Ver período
      </button>
    </form>
  );
}
