/**
 * DL-180 (NUA-04) · lo que la consola decide sin React sobre un alimento cargado a mano: lo decidido, en una línea, y lo que
 * falta para guardar la decisión elegida. La pantalla está en `alimentos-para-revisar.tsx`.
 */
import { COPY_REVISION_DE_ALIMENTOS as C, type AlimentoParaRevisar, type AlimentoVerificado, type DecidirSobreAlimentoRequest } from '@be/domain';

/** Lo decidido sobre la versión vigente, en una línea. */
export function decididoEnPalabras(a: Pick<AlimentoParaRevisar, 'review'>): string {
  const r = a.review;
  if (r.state === 'CERTIFIED' && r.certification) return `${C.estado.CERTIFIED} · ${r.certification.source}`;
  if (r.state === 'EQUIVALENT' && r.equivalent) return `${C.estado.EQUIVALENT} · «${r.equivalent.name}»`;
  return C.estado.PENDING;
}

/** Lo que falta para guardar la decisión elegida (`null`: se puede). */
export function faltaParaDecidir(decision: DecidirSobreAlimentoRequest['decision'], fuente: string, equivalente: AlimentoVerificado | null): string | null {
  if (decision === 'CERTIFY' && fuente.trim() === '') return C.faltaLaFuente;
  if (decision === 'EQUIVALENT' && !equivalente) return C.faltaElEquivalente;
  return null;
}
