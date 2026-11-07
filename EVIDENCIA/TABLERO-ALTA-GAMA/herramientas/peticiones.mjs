// TEST-TAG-032 · el guardián de las peticiones al abrir cada página (WP-TABLERO-ALTA-GAMA §6 y TA-30).
//
// Las capturas cuentan las peticiones a la API desde que se abre una página hasta que la API queda quieta (ninguna en
// curso y ninguna nueva durante `QUIETUD_MS`). La cuenta es exacta: con la cohorte y el mismo código da siempre lo mismo
// (la ficha ya no se lee dos veces cuando la cobertura llega antes que el marco, TA-30). Por eso no hay margen: una
// parte que suma o quita una lectura la declara en esta tabla, en el mismo commit, y ese es el aviso. Una página que no
// está en la tabla también falla: toda página capturada dice cuántas peticiones espera.
//
// Sin dependencias: lo usan `capturas.mjs` en la CI y `scripts/guardian-de-peticiones.test.mjs` en `npm test`.

/** Cuánto tiempo sin peticiones a la API, y sin ninguna en curso, da la página por abierta. */
export const QUIETUD_MS = 1500;
/** Cuánto se espera, como mucho, a que la API quede quieta: después, la cuenta se anota como «sin asentar». */
export const ESPERA_MAXIMA_MS = 30_000;

/**
 * Las peticiones a la API al abrir cada página, por profesional y página (`capturas.mjs`, PAGINAS). Cada número dice de
 * dónde sale: el encabezado (la cuenta y las novedades) y lo que lee la página.
 *
 * Una página cuya cuenta depende de cuántos indicadores muestra va como `{ fijas, porIndicador: true }`: lo esperado es
 * `fijas` más los indicadores que la página mostró (`indicadores`, que anotan las capturas), porque cada indicador
 * mostrado lee su serie y uno sin datos en el período no se pone ni se lee (TB-25). La cuenta sigue siendo exacta.
 */
export const PETICIONES_AL_ABRIR = {
  // El Espacio: la cuenta, las novedades, los pendientes (API-CAR-01), los vínculos, las solicitudes enviadas y, desde
  // TB-06, las invitaciones sin usar, para «Esperan respuesta».
  'sofia-paz/espacio': 6,
  // TB-12: el Espacio y el primer cuadro del cajón: el resumen de la persona y, con una revisión registrada, lo nuevo
  // desde ella (dos lecturas como mucho, solo del cuadro actual).
  'sofia-paz/cajon': 8,
  // El Resumen: la cuenta, las novedades, el resumen por área y los vínculos (el marco), la cobertura de las tres áreas,
  // la línea de tiempo, los indicadores guardados y sus cuatro series, el objetivo vigente, las solicitudes respondidas
  // (TB-49) y la composición de la última toma (TB-24).
  'sofia-paz/resumen': 18,
  'sofia-paz/resumen-federico': 18,
  'sofia-paz/analizar': 11,
  // «Analizar» con Calorías elegida en pantalla: lo de «Analizar» más la serie de Calorías (medido en la corrida de cfc8855).
  'sofia-paz/analizar-calorias': 12,
  'sofia-paz/nutricion': 7,
  'sofia-paz/antropometria': 4,
  // La composición de un año: las cuatro lecturas de 92 días de API-ANT-06 (TA-24) y las del marco.
  'sofia-paz/antropometria-composicion': 7,
  'sofia-paz/analizar-composicion': 5,
  'sofia-paz/resumen-hector': 18,
  // TB-15: la revisión nueva de Nutrición: la cuenta, las novedades, lo que lee el marco del área y lo que lee la revisión
  // nueva (medido en la corrida de 05f398b, su primera).
  'sofia-paz/revision-nueva': 6,
  'martin-acosta/espacio': 6,
  'martin-acosta/cajon': 8,
  // El Resumen de Martín Acosta: 12 fijas y la serie de cada indicador que se muestra. Cuántos se muestran depende de la
  // cohorte el día de la corrida: el ejercicio principal de Diego en los 90 días fue Dominadas el 2026-11-06 (sin carga:
  // dos indicadores, 14 peticiones) y Curl de bíceps el 2026-11-07 (tres, 15).
  'martin-acosta/resumen': { fijas: 12, porIndicador: true },
  'martin-acosta/entrenamiento': 8,
  // TB-48: el editor de Entrenamiento con el borrador de Camila Ortiz, y «Mis ejercicios» (la cuenta, las novedades,
  // los ejercicios propios y su ficha visual); con las zonas abiertas, lo mismo: la ficha ya estaba leída. Páginas
  // nuevas en las capturas, no lecturas nuevas: se cuentan desde su primera corrida.
  'martin-acosta/plan-camila': 9,
  'martin-acosta/mis-ejercicios': 4,
  'martin-acosta/mis-ejercicios-zonas': 4,
};

/**
 * Compara lo medido con la tabla. Devuelve una frase por diferencia, vacía si todo coincide: una página de más o de
 * menos, una que no asentó o una cuenta distinta (para arriba o para abajo).
 */
export function diferenciasDePeticiones(paginas, esperadas = PETICIONES_AL_ABRIR) {
  const diferencias = [];
  const medidas = new Set();
  for (const p of paginas) {
    const clave = `${p.profesional}/${p.pagina}`;
    medidas.add(clave);
    if (!(clave in esperadas)) {
      diferencias.push(`${clave}: ${p.peticionesAlAbrir} peticiones, y la página no está en la tabla`);
      continue;
    }
    const esperada = peticionesEsperadas(esperadas[clave], p);
    if (p.asentada === false) diferencias.push(`${clave}: la API no quedó quieta en ${ESPERA_MAXIMA_MS / 1000} s (se contaron ${p.peticionesAlAbrir})`);
    else if (esperada === null) diferencias.push(`${clave}: la tabla la cuenta por indicador, y la página no anotó cuántos mostró`);
    else if (p.peticionesAlAbrir !== esperada) {
      const cambio = p.peticionesAlAbrir > esperada ? 'suben' : 'bajan';
      diferencias.push(`${clave}: ${cambio} de ${esperada} a ${p.peticionesAlAbrir} sin aviso`);
    }
  }
  for (const clave of Object.keys(esperadas)) if (!medidas.has(clave)) diferencias.push(`${clave}: está en la tabla y no se midió`);
  return diferencias;
}

/** Lo esperado de una página: el número de la tabla o, por indicador, las fijas más los que mostró; `null` sin la cuenta. */
export function peticionesEsperadas(entrada, pagina) {
  if (typeof entrada === 'number') return entrada;
  if (!Number.isInteger(pagina.indicadores)) return null;
  return entrada.fijas + (entrada.porIndicador ? pagina.indicadores : 0);
}

/**
 * Espera a que la API quede quieta: ninguna petición en curso y ninguna nueva durante `quietud` milisegundos.
 * `estado()` devuelve { enCurso, ultima } (la hora de la última petición que empezó o terminó).
 */
export async function esperarLaQuietud(estado, { quietud = QUIETUD_MS, maximo = ESPERA_MAXIMA_MS, ahora = () => Date.now(), pausa = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const inicio = ahora();
  for (;;) {
    const { enCurso, ultima } = estado();
    if (enCurso === 0 && ahora() - ultima >= quietud) return true;
    if (ahora() - inicio >= maximo) return false;
    await pausa(Math.min(250, quietud));
  }
}
