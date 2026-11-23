/**
 * Lo que un cliente declara que sabe mostrar (cabecera `X-BE-Capabilities`), y para qué lo usa la API.
 *
 * **DL-196 (punto 5; Dirección, 19/11 y 23/11): ya no hay compatibilidad con APK viejas.** Todos usan la última (0.32).
 * Por eso salió todo lo que trababa o retenía por la versión de la app: un plan con objetivos distintos por serie o con
 * series de calentamiento **se activa** aunque su titular nunca haya declarado nada (API-TRN-12 ya no responde 409
 * CLIENT_CAPABILITY_REQUIRED) y **se entrega** a cualquier pedido, con o sin la cabecera («Hoy», el período, el detalle,
 * abrir el borrador). Salieron con eso `planExigeObjetivosPorSerie`, `prescripcionExigeObjetivosPorSerie`,
 * `planTieneCalentamiento` y los textos de la activación bloqueada. La tabla `capacidad_de_cliente_declarada` queda en
 * desuso: la API ya no la escribe ni la lee.
 *
 * **En Entrenamiento queda el moldeo de la forma**, no una traba: a quien no declara una capacidad, la API le saca en el
 * borde los campos que su esquema estricto rechazaría, y recibe lo de antes. La APK 0.32 y el website las declaran todas:
 * - `training-set-kinds-1`: `setKind` explícito en las series (`sin-tipo-de-serie.interceptor.ts`);
 * - `training-session-groups-1`: los bloques de la sesión (`SinBloquesDeLaSesionInterceptor`);
 * - `training-effort-notation-1`: `effortNotation`;
 * - `training-set-targets-1` ya no decide nada en el servidor; sigue en la lista porque la APK 0.32 la declara.
 * `forms-format-3` y `pending-steps-texts-1` no son de Entrenamiento (formularios de formato 3 y pasos de los textos
 * vigentes) y siguen como estaban.
 */

/** La cabecera con la que un cliente declara lo que sabe mostrar: capacidades separadas por comas. */
export const HEADER_DE_CAPACIDADES = 'X-BE-Capabilities';

/**
 * El cliente muestra el objetivo de cada serie (API-SER-02). DL-196: ya no decide nada en el servidor (decidía activar y
 * entregar los planes con objetivos por serie); queda porque la APK 0.32 y el website la declaran.
 */
export const CAPACIDAD_OBJETIVOS_POR_SERIE = 'training-set-targets-1';

/**
 * DL-165 (WP-FORMULARIOS-RONDA-2, FR-08) · el cliente lee y dibuja las versiones de formulario de formato 3: el subcampo
 * de varias opciones en un renglón y lo demás que suma la ronda 2 (`loQueUsaDelFormato3`). Sin la capacidad (la APK 0.20
 * y las anteriores), una versión de formato 3 y sus solicitudes son, para ese pedido, el 404 de lo inexistente, y FRI-02
 * no las lista. La declaran la APK nueva y el website, que se despliega con la API.
 */
export const CAPACIDAD_FORMULARIOS_FORMATO_3 = 'forms-format-3';

/**
 * UF-05 de WP-USO-FINAL (DL-169; UF-D4) · el cliente sabe mostrar, en «Antes de seguir», la versión nueva de los términos y
 * de la información de privacidad (los pasos ACCEPT_TERMS y ACKNOWLEDGE_PRIVACY de API-ACC-07) y aceptarla con
 * API-ACC-08. API-ACC-07 no le pide esos pasos a un cliente que no la declara: la APK 0.24 pediría actualizar ante un paso
 * que no conoce (UF-T12). La declaran el website, que se despliega con la API, y la APK nueva.
 */
export const CAPACIDAD_TEXTOS_VIGENTES = 'pending-steps-texts-1';

/**
 * DL-178 · el cliente distingue las series de calentamiento: las muestra como «Calentamiento», las registra con
 * `setKind: WARM_UP` y no las cuenta. Solo a quien la declara le salen las series con `setKind` explícito; a quien no, con
 * la forma de siempre (su esquema estricto rechazaría el campo). DL-196: un plan con calentamiento se activa y se entrega
 * siempre; la capacidad solo decide la forma. La declaran el website, que se despliega con la API, y la APK nueva.
 */
export const CAPACIDAD_TIPOS_DE_SERIE = 'training-set-kinds-1';

/**
 * DL-181 (WP-ENTRENAMIENTO-PLANIFICACION, ENP-D06) · el cliente sabe mostrar los bloques de la sesión: lee `exerciseGroups`
 * de cada sesión y `exerciseGroupId` de cada ejercicio y agrupa los ejercicios bajo su bloque. Solo a quien la declara le
 * salen las dos claves; a quien no, `SinBloquesDeLaSesionInterceptor` se las saca en el borde (su esquema estricto las
 * rechazaría) y recibe lo de antes: los mismos ejercicios en el mismo orden. Nada se retiene ni se bloquea: el registro
 * sigue siendo por ejercicio y nada se cuenta distinto. La declaran el website, que se despliega con la API, y la APK nueva.
 */
export const CAPACIDAD_BLOQUES_DE_LA_SESION = 'training-session-groups-1';

/**
 * DL-192 (WP-RPE-Y-MAXIMO-ESTIMADO, RPE-D08) · el cliente sabe preguntar y mostrar el esfuerzo en la notación del plan (RIR
 * o RPE): lee `effortNotation` de la versión (API-TRN-09) y de la sesión para registrar (API-SER-02), y sigue mandando el
 * RIR, que es el valor de las dos. Solo a quien la declara le sale el campo; a quien no, la forma de siempre (su esquema
 * estricto lo rechazaría). Nada se retiene ni se bloquea: una APK que pregunta en RIR guarda lo mismo que una que pregunta
 * en RPE. La declara la APK 0.32 (DL-194).
 */
export const CAPACIDAD_NOTACION_DEL_ESFUERZO = 'training-effort-notation-1';

export const CAPACIDADES_CONOCIDAS = [
  CAPACIDAD_OBJETIVOS_POR_SERIE,
  CAPACIDAD_FORMULARIOS_FORMATO_3,
  CAPACIDAD_TEXTOS_VIGENTES,
  CAPACIDAD_TIPOS_DE_SERIE,
  CAPACIDAD_BLOQUES_DE_LA_SESION,
  CAPACIDAD_NOTACION_DEL_ESFUERZO,
] as const;
export type CapacidadDeCliente = (typeof CAPACIDADES_CONOCIDAS)[number];

/** Un valor de cabecera más largo que esto no se lee: ninguna lista válida lo necesita. */
const LARGO_MAXIMO_DE_LA_CABECERA = 256;

/**
 * Las capacidades que declara un pedido. Sin cabecera, vacía. Lo desconocido se ignora: un cliente futuro puede declarar
 * más de lo que esta API sabe, y eso no le da nada que no pidió.
 */
export function capacidadesDeclaradas(valor: string | readonly string[] | null | undefined): ReadonlySet<CapacidadDeCliente> {
  const texto = Array.isArray(valor) ? valor.join(',') : (valor as string | null | undefined);
  if (typeof texto !== 'string' || texto.length === 0 || texto.length > LARGO_MAXIMO_DE_LA_CABECERA) return new Set();
  const conocidas = new Set<string>(CAPACIDADES_CONOCIDAS);
  return new Set(
    texto
      .split(',')
      .map((c) => c.trim())
      .filter((c): c is CapacidadDeCliente => conocidas.has(c)),
  );
}

/** El valor de la cabecera para un cliente que declara estas capacidades. */
export const valorDeCapacidades = (capacidades: readonly CapacidadDeCliente[]): string => [...new Set(capacidades)].join(',');
