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
 */
export const PETICIONES_AL_ABRIR = {
  // El Espacio: la cuenta, las novedades, los pendientes (API-CAR-01), los vínculos, las solicitudes enviadas y, desde
  // TB-06, las invitaciones sin usar, para «Esperan respuesta».
  'sofia-paz/espacio': 6,
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
  'martin-acosta/espacio': 6,
  'martin-acosta/resumen': 14,
  'martin-acosta/entrenamiento': 8,
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
    if (p.asentada === false) diferencias.push(`${clave}: la API no quedó quieta en ${ESPERA_MAXIMA_MS / 1000} s (se contaron ${p.peticionesAlAbrir})`);
    else if (p.peticionesAlAbrir !== esperadas[clave]) {
      const cambio = p.peticionesAlAbrir > esperadas[clave] ? 'suben' : 'bajan';
      diferencias.push(`${clave}: ${cambio} de ${esperadas[clave]} a ${p.peticionesAlAbrir} sin aviso`);
    }
  }
  for (const clave of Object.keys(esperadas)) if (!medidas.has(clave)) diferencias.push(`${clave}: está en la tabla y no se midió`);
  return diferencias;
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
