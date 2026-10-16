'use client';

/**
 * Lo que comparten las pestañas de área cuando se llega desde la ficha (WP-DASHBOARD-COMPRENSION, eje 5):
 * - **Retorno:** `volver` trae la configuración de la ficha (vista, período, métricas, pregunta…) como identificadores; se
 *   reconstruye con los mismos lectores de la ficha y nunca sale de `/pro/advisees` del mismo asesorado
 *   (`retornoALaFicha`). Se conserva al cambiar de sección dentro del área.
 * - **Preparar la revisión:** con `preparar=1`, la vista Revisiones abre el formulario con el período desde la última
 *   revisión (o el que propone la API, si no hay), dicho como preparado por BE. Ver no es revisar: nada se registra hasta
 *   «Registrar revisión», y la evidencia, la interpretación y el resultado los elige el profesional.
 */
import { fechaCivil } from '@be/domain';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Aviso } from '../../../components/formulario';
import { diaCivil } from '../../../lib/formato';
import { hoyEn, restarDias, retornoALaFicha } from './seguimiento/estado';
import type { Periodo } from './periodo';

const ZONA = 'America/Argentina/Buenos_Aires';
/** Lo que abarca un contexto de revisión: hasta 92 días inclusivos. */
const DIAS_DE_UNA_REVISION = 92;

/** El retorno a la ficha (validado) y el valor crudo para conservarlo en los enlaces de la pestaña. */
export function useRetornoALaFicha(id: string): { readonly href: string | null; readonly valor: string | null } {
  const parametros = useSearchParams();
  const valor = parametros.get('volver');
  const href = retornoALaFicha(valor, id);
  return { href, valor: href ? valor : null };
}

/** Agrega `volver` a un enlace de la pestaña, si se llegó desde la ficha. */
export const conVolver = (href: string, valor: string | null): string => (valor ? `${href}&volver=${encodeURIComponent(valor)}` : href);

export function EnlaceDeRetorno({ href }: { href: string | null }) {
  if (!href) return null;
  return (
    <p className="retorno-a-la-ficha">
      <Link href={href}>Volver a la ficha, donde estabas</Link>
    </p>
  );
}

export const usePreparar = (): boolean => useSearchParams().get('preparar') === '1';

/**
 * El período que BE propone para preparar una revisión: desde el día de la última (si hay), hasta hoy, con el máximo de
 * 92 días que admite el contexto de revisión. Sin revisiones, `null`: queda el período que propone la API.
 */
export function periodoPreparado(revisiones: readonly { readonly recordedAt: string }[]): { readonly periodo: Periodo; readonly desdeLaRevision: string } | null {
  if (revisiones.length === 0) return null;
  const ultima = [...revisiones].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0] as { recordedAt: string };
  const hoy = hoyEn();
  const minimo = restarDias(hoy, DIAS_DE_UNA_REVISION - 1);
  const desde = fechaCivil(ultima.recordedAt, ZONA);
  return { periodo: { periodStart: desde < minimo ? minimo : desde, periodEnd: hoy }, desdeLaRevision: ultima.recordedAt };
}

/** Lo que BE preparó, dicho como tal: el período y quién decide lo demás. */
export function AvisoDePreparacion({ desdeLaRevision, periodo }: { desdeLaRevision: string | null; periodo: Periodo | null }) {
  return (
    <Aviso tipo="info">
      <p>
        <strong>Preparado por BE para esta revisión:</strong>{' '}
        {desdeLaRevision && periodo?.periodStart
          ? `el período va del ${diaCivil(periodo.periodStart)} (la última revisión fue el ${diaCivil(fechaCivil(desdeLaRevision, ZONA))}) a hoy.`
          : 'todavía no hay revisiones registradas: el período es el que propone BE, y lo podés cambiar.'}{' '}
        La evidencia, la interpretación y el resultado los elegís vos. Nada se registra hasta que elijas «Registrar revisión».
      </p>
    </Aviso>
  );
}
