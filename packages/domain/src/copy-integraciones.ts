/**
 * Copy de la importación controlada (WP-08; B10-05 §18-§20; B10-06 §19-§22). Lo que el profesional lee mientras trae
 * un elemento de un proveedor externo, lo revisa y decide.
 *
 * Reglas que el texto sostiene:
 * - nada dice «Importado» antes de resolver (B10-05 §19): lo consultado es un **candidato**;
 * - la caída del proveedor no bloquea: se ofrece el catálogo BE y la carga manual (B10-05 §20; UC-I08);
 * - lo que el proveedor no trajo se dice que no vino, nunca se muestra como cero (B10-10 §1);
 * - los músculos de wger son dato del proveedor, no zonas BE (09v12:397-401);
 * - una importación no se presenta como dato verificado por BE (RF-060).
 */
export const COPY_INTEGRACIONES = {
  importarDesdeOpenFoodFacts: 'Importar desde Open Food Facts',
  importarDesdeWger: 'Importar desde wger',
  codigoDeBarras: 'Código de barras del producto',
  ayudaCodigoDeBarras: 'Los números que figuran debajo de las barras del envase: 8, 12, 13 o 14 dígitos.',
  numeroDeWger: 'Número del ejercicio en wger',
  ayudaNumeroDeWger: 'Figura en la dirección de cada ejercicio en wger.de, por ejemplo «/exercise/56/».',
  consultar: 'Consultar',
  candidatoTitulo: 'Candidato para revisar',
  candidatoAviso:
    'Esto es lo que respondió el proveedor. Todavía no está en el catálogo BE: revisalo, corregí o completá lo que haga falta, y decidí si lo incorporás.',
  datoDelProveedor: 'Dato del proveedor',
  noVinoDelProveedor: 'no vino del proveedor',
  corregido: 'Corregido',
  fundamento: 'Fundamento de la decisión (opcional)',
  importarABe: 'Importar a BE',
  rechazar: 'Rechazar',
  rechazado: 'Rechazado. No se agregó nada al catálogo BE.',
  faltaCompletar: 'Faltan datos para incorporarlo. Completá los campos marcados o rechazalo.',
  proveedorCaidoAlimento: 'No pudimos consultar el proveedor. Podés seguir usando el catálogo BE o cargar un alimento manualmente.',
  proveedorCaidoEjercicio: 'No pudimos consultar wger. Podés seguir usando el catálogo BE o cargar el ejercicio manualmente.',
  noEncontradoAlimento: 'Open Food Facts no tiene un producto con ese código de barras.',
  noEncontradoEjercicio: 'wger no tiene un ejercicio con ese número.',
  noResoluble: 'Este candidato ya no se puede resolver: ya se resolvió o venció. Si lo incorporaste, buscalo en el catálogo BE; si no, consultá el proveedor de nuevo.',
  resultadoIncierto:
    'No pudimos confirmar si se resolvió. No lo cambies ni lo vuelvas a consultar: reintentá la misma decisión, o buscalo en el catálogo BE antes de importarlo de nuevo.',
  reintentar: 'Reintentar la misma decisión',
  base: 'Base de la composición',
  elegiLaBase: 'Elegí la base',
  cada100g: 'Cada 100 g',
  cada100ml: 'Cada 100 ml',
  baseNoDeclarada: 'no la declara sin ambigüedad: elegila según la etiqueta del envase',
  faltaLaBase: 'Falta la base: elegí si la composición es cada 100 g o cada 100 ml.',
  nombreLargo: 'El nombre puede tener hasta 120 caracteres: acortalo antes de incorporarlo.',
  musculosDelProveedor: 'Músculos según wger (dato del proveedor; no se copian como zonas BE)',
  materialDelProveedor: 'Material según wger',
  categoriaDelProveedor: 'Categoría según wger',
  nombreEnIngles: 'wger no tiene este ejercicio en español: el nombre está en inglés, y podés corregirlo antes de incorporarlo.',
  fuente: 'Fuente',
  licencia: 'Licencia',
  recibido: 'Recibido el',
  vence: 'Si no lo resolvés, vence el',
  importadoDe: 'Importado de',
  noVerificadoPorBe: 'Dato de un proveedor externo, revisado por un profesional: no es un dato verificado por BE.',
} as const;

/**
 * Lo que el copy de la importación no puede decir. «importado» antes de resolver es la falla de B10-05 §19; los demás
 * presentarían al proveedor como autoridad, o a BE como garante del dato (RF-060).
 */
const TERMINOS_PROHIBIDOS = ['verificado por be', 'dato oficial', 'certificado', 'garantizado', 'aprobado por be', '100 % confiable'];

export function terminosProhibidosDeIntegracionesEn(texto: string): string[] {
  const t = texto.toLowerCase();
  // «no es un dato verificado por BE» es exactamente lo que hay que decir: la negación explícita no es la afirmación.
  return TERMINOS_PROHIBIDOS.filter((p) => t.includes(p) && !t.includes(`no es un dato ${p}`));
}
