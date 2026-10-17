/**
 * WP-CATALOGO-BASE (DL-141, D-2): cómo se muestra un ítem del catálogo que el buscador encontró por un nombre
 * alternativo. Va el nombre principal y, entre paréntesis, el que coincidió: «Press de banca (bench press)», «Palta
 * (aguacate)». El plan y la persona siguen viendo el principal: el alternativo solo aclara por qué apareció.
 */

/**
 * El nombre alternativo como aclaración, en minúscula como cualquier palabra dentro de una frase: «Bench press» →
 * «bench press», «Aguacate» → «aguacate». Una sigla queda como está («TRX»): solo baja la inicial de un nombre que sigue
 * en minúscula.
 */
export function nombreAlternativoComoAclaracion(nombre: string): string {
  return /^\p{Lu}\p{Ll}/u.test(nombre) ? `${nombre.charAt(0).toLocaleLowerCase('es')}${nombre.slice(1)}` : nombre;
}

/** «Press de banca (bench press)»; si coincidió el nombre principal, el nombre tal cual. */
export function nombreConAlternativo(nombre: string, alternativo: string | null | undefined): string {
  return alternativo ? `${nombre} (${nombreAlternativoComoAclaracion(alternativo)})` : nombre;
}
