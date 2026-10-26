// Lo esperado de la comparación de Nutrición (DL-158), calculado APARTE: este módulo no usa `calcularNutrientes`,
// `sumaExacta`, `indicadoDeLosDias` ni ninguna otra función del producto. Solo recibe los datos de entrada (las cantidades
// de datos.mjs y la composición cada 100 g que quedó congelada en la instantánea del plan) y hace sus propias cuentas.
//
// Aritmética decimal propia: enteros grandes escalados por 10^9. Las composiciones tienen a lo sumo unos pocos decimales y
// los gramos son enteros, así que «gramos × valor ÷ 100» es exacto a esa escala; si una división no fuera exacta, el
// módulo se detiene en vez de redondear en silencio.
//
// Las reglas que aplica, escritas a mano desde WP-NUTRICION-COMPARACION §2 y §3 (no desde el código):
// - una opción: la suma, por ítem, de gramos ÷ 100 × valor cada 100 g;
// - el día tiene indicado solo si cada comida del día tipo tiene una sola opción: la suma de esas opciones;
//   si alguna tiene más de una, no hay indicado y se nombran las comidas con cuántas opciones;
// - por comida registrada: lo indicado de la opción elegida; una comida diferente no tiene;
// - lo registrado del día: la suma de lo que tiene cantidades. «Comí lo del plan» son las cantidades de la opción;
//   «no lo comí» aporta cero; un registro sin cantidades o una comida diferente no aportan número, y el día queda como
//   subtotal (no completo);
// - para mostrar: las kcal enteras y los gramos con un decimal, la mitad hacia arriba.
const ESCALA = 10n ** 9n;
const DECIMALES_DE_LA_ESCALA = 9;

/** Un decimal escrito («28.17», 12.35, «130») como entero escalado. */
export function aEscala(valor) {
  const texto = String(valor).trim();
  const m = /^(-)?(\d+)(?:\.(\d+))?$/.exec(texto);
  if (!m) throw new Error(`no es un decimal simple: ${texto}`);
  const decimales = m[3] ?? '';
  if (decimales.length > DECIMALES_DE_LA_ESCALA) throw new Error(`demasiados decimales: ${texto}`);
  const n = BigInt(m[2] + decimales.padEnd(DECIMALES_DE_LA_ESCALA, '0'));
  return m[1] ? -n : n;
}

/** El entero escalado como decimal exacto, sin ceros de más («1572», «108.8», «0.45»). */
export function exacto(x) {
  const negativo = x < 0n;
  const a = (negativo ? -x : x).toString().padStart(DECIMALES_DE_LA_ESCALA + 1, '0');
  const entero = a.slice(0, -DECIMALES_DE_LA_ESCALA);
  const frac = a.slice(-DECIMALES_DE_LA_ESCALA).replace(/0+$/, '');
  return `${negativo ? '-' : ''}${entero}${frac ? `.${frac}` : ''}`;
}

/** Redondeo de la pantalla: la mitad se aleja del cero, con `decimales` fijos. */
export function paraMostrar(x, decimales) {
  const paso = 10n ** BigInt(DECIMALES_DE_LA_ESCALA - decimales);
  const negativo = x < 0n;
  const a = negativo ? -x : x;
  const q = (a + paso / 2n) / paso;
  const s = q.toString().padStart(decimales + 1, '0');
  const texto = decimales === 0 ? s : `${s.slice(0, -decimales)}.${s.slice(-decimales)}`;
  return `${negativo ? '-' : ''}${texto}`;
}

/** gramos ÷ 100 × valor cada 100 g, exacto. */
function aporte(gramos, valorCada100) {
  const p = aEscala(valorCada100) * BigInt(gramos);
  if (p % 100n !== 0n) throw new Error(`división no exacta: ${gramos} g × ${valorCada100}`);
  return p / 100n;
}

/**
 * Lo indicado de una opción: [[alimento, gramos], …] con la composición de cada alimento ({ energyKcal, proteinG, … }
 * cada 100 g). `null` si a un ítem le falta el dato.
 */
export function deLaOpcion(items, composicion, nutriente) {
  let total = 0n;
  for (const [alimento, gramos] of items) {
    const v = composicion[alimento]?.[nutriente];
    if (v === null || v === undefined) return null;
    total += aporte(gramos, v);
  }
  return total;
}

/** El indicado del día de un plan de un solo día tipo, o por qué no hay. */
export function delDia(plan, composicion, nutriente) {
  const conVarias = plan.filter(([, opciones]) => opciones.length !== 1).map(([comida, opciones]) => ({ meal: comida, options: opciones.length }));
  if (conVarias.length > 0) return { state: 'UNDETERMINED', reason: 'SEVERAL_OPTIONS', mealsWithSeveralOptions: conVarias };
  let total = 0n;
  for (const [, [[, items]]] of plan) {
    const v = deLaOpcion(items, composicion, nutriente);
    if (v === null) return { state: 'UNDETERMINED', reason: 'NUTRIENT_DATA_MISSING', mealsWithSeveralOptions: [] };
    total += v;
  }
  return { state: 'DETERMINED', value: total };
}

/** Lo registrado de una comida: el número, o `null` si no tiene (sin cantidades, o una comida diferente). */
export function registradoDeLaComida(plan, comida, registro, composicion, nutriente) {
  if (registro.diferente || registro.sinCantidades) return null;
  const [, items] = plan.find(([c]) => c === comida)[1][registro.opcion];
  if (registro.porciones) return deLaOpcion(items, composicion, nutriente);
  let total = 0n;
  items.forEach(([alimento], i) => {
    const gramos = registro.gramos[i];
    if (gramos === null) return; // «no lo comí»: cero, porque se declaró
    total += aporte(gramos, composicion[alimento][nutriente]);
  });
  return total;
}

/** Lo indicado de la comida registrada: el de su opción, o `null` para una comida diferente. */
export function indicadoDeLaComida(plan, comida, registro, composicion, nutriente) {
  if (registro.diferente) return null;
  const [, items] = plan.find(([c]) => c === comida)[1][registro.opcion];
  return deLaOpcion(items, composicion, nutriente);
}

/** Cada día con registros: la suma de lo conocido y si quedó completo o es un subtotal. */
export function registradoDelDia(plan, dia, composicion, nutriente) {
  let total = 0n;
  let completo = true;
  for (const [comida] of plan) {
    const r = dia.comidas[comida];
    if (!r) {
      completo = false;
      continue;
    }
    const v = registradoDeLaComida(plan, comida, r, composicion, nutriente);
    if (v === null) completo = false;
    else total += v;
  }
  return { total, completo };
}
