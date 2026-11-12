/**
 * Los textos de la sesión en curso de WP-APP-VUELTA-DE-ROSCA (DL-166, AV-10 a AV-14) y el desglose de «Tu historial»
 * (AV-07): el descanso automático con su barra, el engranaje, el aviso al llegar al recomendado y la fila fija. Son de Entrenamiento, y
 * `scripts/copy-pantallas.test.cjs` los revisa con su lista. Los textos no dicen porcentajes (T13): la barra llega al descanso recomendado por el
 * entrenador (PV-7): ubica dónde va el descanso, no califica a la persona.
 */
import { numero } from '@be/domain';
import { enumerar } from './textos-por-toma';

const cuantos = (n: number, uno: string, varios: string): string => `${numero(n)} ${n === 1 ? uno : varios}`;

export const TEXTOS_DEL_DESCANSO = {
  /**
   * El desglose de «Tu historial» (AV2-12, con AV2-D2): «Últimos 30 días: 2 realizadas (1 con desvío) y 1 no realizada.».
   * `realizadas` cuenta también las con desvío; las partes que valen cero no se escriben, y lo hecho no se suma con lo
   * no hecho.
   */
  desglose30Dias: (realizadas: number, conDesvio: number, noRealizadas: number) => {
    const partes = [
      realizadas > 0 ? `${cuantos(realizadas, 'realizada', 'realizadas')}${conDesvio > 0 ? ` (${numero(conDesvio)} con desvío)` : ''}` : null,
      noRealizadas > 0 ? cuantos(noRealizadas, 'no realizada', 'no realizadas') : null,
    ].filter((p): p is string => p !== null);
    return partes.length === 0 ? 'Últimos 30 días: sin sesiones registradas.' : `Últimos 30 días: ${enumerar(partes)}.`;
  },
  // ─── La sesión: el descanso, el engranaje y la fila fija (AV-10 a AV-14) ───────────────────
  descansoTrasLaSerie: (n: number) => `Descanso · tras la serie ${numero(n)}`,
  deRecomendado: (recomendado: string) => `de ${recomendado} recomendado`,
  alTerminarSeguisCon: (n: number) => `Al terminar, seguís con la serie ${numero(n)}`,
  descansoIniciado: (recomendado: string | null) => (recomendado ? `Descanso iniciado, recomendado ${recomendado}` : 'Descanso iniciado'),
  llegasteA: (recomendado: string) => `Llegaste a ${recomendado}`,
  barraParaLeer: (segundos: number, recomendado: number) => `${numero(segundos)} segundos de ${numero(recomendado)}`,
  ajustesDelDescanso: 'Ajustes del descanso',
  cerrarLosAjustes: 'Cerrar los ajustes del descanso',
  comoFunciona: 'Cómo funciona el descanso',
  comoFuncionaTexto:
    'Al guardar una serie empieza el descanso. La barra se llena hasta el recomendado de tu entrenador; llegar al recomendado no corta nada.',
  comoFuncionaManual: 'Con «Lo inicio yo», el descanso empieza cuando tocás «Iniciar descanso».',
  empezarElDescanso: 'Empezar el descanso',
  alGuardarLaSerie: 'Al guardar la serie',
  loInicioYo: 'Lo inicio yo',
  vibrarAlLlegar: 'Vibrar al llegar al recomendado',
  tambienBloqueado: 'También con el teléfono bloqueado.',
  ajustesEnEsteTelefono: 'Estos ajustes quedan en este teléfono.',
  paraVibrarBloqueado: 'Con el teléfono bloqueado, BE vibra con un aviso. Para eso falta tu permiso de avisos.',
  permitirAvisos: 'Permitir avisos',
  ahoraNo: 'Ahora no',
  vibraSoloConLaAppAbierta: 'Vibra solo con la app abierta. Podés dar el permiso de avisos en Perfil, en «Avisos».',
  avisoDelDescanso: 'Tu descanso llegó al recomendado',
  canalDelDescanso: 'El descanso',
  pausar: 'Pausar',
  reanudar: 'Reanudar',
  empezarSerie: (n: number) => `Empezar serie ${numero(n)}`,
  terminarSerie: (n: number) => `Terminar serie ${numero(n)}`,
  registrarSerie: (n: number) => `Registrar serie ${numero(n)}`,
  siguienteEjercicio: 'Siguiente ejercicio',
  enPausaNoSeMide: 'En pausa no se mide nada: reanudá para seguir.',
  accionesDeLaSesion: 'Acciones de la sesión',
} as const;
