// Las 50 recetas nuevas (encargo nocturno de Dirección del 2026-10-28): lo común a todas las familias.
//
// Esta carpeta es la FUENTE escrita a mano. Cada ingrediente se cita por su número de USDA FoodData Central (FDC) y el
// estado en que se pesa; `armar.mjs` lo resuelve contra los datos del catálogo del repositorio (identidad, versión,
// nombre, preparación y composición) y escribe `manifiesto.json`. Nada de la composición se escribe a mano.
//
// Reglas de la formulación (§6 y §9 del encargo):
// - todo en gramos, contra composiciones cada 100 g: no se convierten mililitros ni medidas caseras;
// - lo crudo se pesa crudo y lo cocido, cocido, con el alimento del catálogo de ese estado;
// - la masa, el pan, el rebozado, el huevo, el aceite, el queso, el azúcar y los aderezos van en la lista, con su cantidad;
// - si una coincidencia es ambigua (más de un alimento posible), el ingrediente lleva su decisión escrita;
// - los pasos no usan ingredientes que no estén en la lista (el agua de hervir y descartar no se cuenta: no aporta).

export const PAQUETE = {
  id: 'recetas-ampliacion-2026-10-28',
  version: 1,
  nombre: 'Ampliación de las recetas de ejemplo: 50 recetas nuevas de cocina familiar argentina',
  encargo: 'Encargo nocturno de Dirección del 2026-10-28 («50 recetas nuevas, fotografías y cierre técnico»), §6 a §12',
  commitDeReferencia: 'e4512cb',
};

/** Las siete familias del encargo (§7), con cuántas recetas nuevas tiene cada una. */
export const FAMILIAS = {
  MASAS: { nombre: 'Tartas, empanadas, pizzas y masas saladas', nuevas: 12 },
  PASTAS: { nombre: 'Pastas y polenta', nuevas: 8 },
  SANDWICHES: { nombre: 'Hamburguesas, sándwiches y milanesa', nuevas: 6 },
  HORNO: { nombre: 'Platos de horno y sartén', nuevas: 8 },
  OLLAS: { nombre: 'Ollas, legumbres y arroz', nuevas: 6 },
  FRIOS: { nombre: 'Ensaladas completas y platos fríos', nuevas: 4 },
  DULCES: { nombre: 'Desayunos, meriendas y preparaciones dulces', nuevas: 6 },
};

/** Un ingrediente de la fuente: la parte de la receta, el FDC, los gramos, el estado y lo que dice la receta. */
export const i = (parte, fdc, gramos, estado, buscado, decision = null, nota = null) => ({ parte, fdc, gramos, estado, buscado, decision, nota });

/** Las decisiones que se repiten: cuando el catálogo tiene más de un alimento posible para lo que dice la receta. */
export const D = {
  harina000: 'La harina 000 es la de uso general: se usa la «Harina de trigo blanca de uso general, enriquecida» de USDA. El catálogo tiene además la leudante y la integral.',
  aceiteDeOliva: 'El aceite de oliva de USDA (DL-119), no el del catálogo de demostración, que se llama igual.',
  lechuga: 'Lechuga de hoja verde (de hojas sueltas), como en las recetas originales; el catálogo tiene cuatro lechugas.',
  lecheDescremada: 'Leche descremada fluida, para salsas, masas y ligues sin sumar grasa; el catálogo tiene leches de 0, 1, 2 y 3,25 % de grasa, y en polvo.',
  ricota: 'Ricota parcialmente descremada: menos grasa que la entera y la misma textura para ligar. El catálogo tiene las dos.',
  muzzarella: 'Muzzarella común, de leche entera; el catálogo tiene también una semidescremada de baja humedad.',
  parmesano: 'Parmesano rallado. En la Argentina el queso rallado suele ser reggianito o sardo, que el catálogo no tiene: la receta dice parmesano porque es lo que se calcula.',
  pechugaCruda: 'Pechuga de pollo sin piel ni hueso (la suprema), pesada cruda: se cocina en la receta. El catálogo tiene también la pechuga con piel y varias cocidas.',
  pechugaHervida: 'Pechuga sin piel ya hervida y desmenuzada, pesada cocida: la composición de USDA de la pechuga hervida ya cuenta lo que pierde al hervir.',
  picada95: 'La picada más magra del catálogo (95 % de carne magra y 5 % de grasa): el carnicero puede picar nalga o peceto sin grasa. El catálogo tiene picadas de 70 a 95 %.',
  huevo: 'Huevo de gallina entero, crudo, pesado sin cáscara (unos 50 g por huevo). El catálogo tiene también el huevo de codorniz y las preparaciones de huevo.',
  huevoDuro: 'Huevo duro, pesado pelado (unos 50 g por huevo). Se hierve en la receta.',
  cebolla: 'Cebolla común, cruda; el catálogo tiene también la cebolla de verdeo.',
  tomate: 'Tomate rojo maduro, crudo; el catálogo tiene también el tomate pelado en lata, el puré y el extracto.',
  tomateEnLata: 'Tomate pelado en lata, con su jugo (el que se aplasta para la salsa). El puré de tomate es otro producto, con otra composición.',
  morron: 'Morrón rojo, crudo; el catálogo tiene también el verde y el amarillo.',
  zanahoria: 'Zanahoria cruda; el catálogo tiene también la hervida.',
  calabaza: 'La calabaza de la receta es el zapallo anco (butternut), como en las recetas originales; se pesa la pulpa cruda, pelada y sin semillas. El catálogo tiene también el zapallo común y el anco ya cocido.',
  zapallitos: 'En la Argentina se usan zapallitos redondos o largos. El catálogo tiene el «Zucchini crudo» de USDA (Squash, summer, zucchini), de la misma familia de zapallitos de verano: se usa ese.',
  papaHervida: 'Se pesa la papa ya hervida y pelada, no la cruda: es la que entra en la preparación. El catálogo tiene también la papa cruda con cáscara, la hervida con piel y la de horno.',
  papaCruda: 'Papa cruda con la cáscara bien lavada: el catálogo tiene la papa cruda solo con cáscara. También tiene la hervida y la de horno, pesadas cocidas.',
  arvejas: 'Arvejas congeladas, hervidas y escurridas, pesadas cocidas. El catálogo tiene también las frescas crudas y las secas partidas.',
  arrozCrudo: 'Arroz blanco de grano largo, pesado crudo: se cocina en la receta. El catálogo tiene también el de grano medio, el integral y los cocidos.',
  fideosSecos: 'Fideos secos de trigo, pesados secos. El catálogo tiene también los fideos al huevo, los integrales hervidos y los de trigo hervidos.',
  lentejasHervidas: 'Lentejas ya hervidas y escurridas (DL-119), pesadas cocidas. Si se parte de lentejas secas, se hierven hasta que estén tiernas y se pesan cocidas.',
  garbanzosDeLata: 'Garbanzos de lata, enjuagados y escurridos: el peso es el escurrido. El catálogo tiene también los secos y los hervidos en casa.',
  panFrances: 'El catálogo no tiene pan de hamburguesa: se usa el «Pan tipo francés o de Viena» de USDA (French or Vienna bread), una masa del mismo tipo, en panes de 70 g. Con pan de hamburguesa, el cálculo cambia un poco.',
  atun: 'Atún al natural (al agua), escurrido: el peso es el del atún ya escurrido, no el de la lata. El catálogo tiene también el atún en aceite.',
  caldoDePollo: 'Caldo de pollo listo para usar (o casero, sin grasa). Su sal no cuenta en el cálculo: BE no calcula el sodio.',
  caldoDeCarne: 'Caldo de carne listo para usar (o casero, sin grasa). Su sal no cuenta en el cálculo: BE no calcula el sodio.',
  aceitunasNegras: 'Aceitunas negras, pesadas sin carozo; el catálogo tiene también las verdes.',
  aceitunasVerdes: 'Aceitunas verdes, pesadas sin carozo; el catálogo tiene también las negras.',
  vinagre: 'Vinagre de alcohol, el más común; el catálogo tiene también el de manzana.',
  yogurDescremado: 'Yogur natural descremado, sin azúcar agregada; el catálogo tiene también el entero y el griego.',
  manteca: 'Manteca sin sal; en los cinco nutrientes que calcula BE es igual a la manteca con sal.',
  ajo: 'Ajo fresco, crudo; el catálogo tiene también el ajo en polvo.',
  azucar: 'Azúcar blanca común; el catálogo tiene también la negra y la impalpable.',
  zucchini: 'Zucchini crudo, con cáscara; el catálogo tiene también el hervido.',
  espinaca: 'Espinaca fresca, pesada cruda en hojas, sin los tallos gruesos. El catálogo tiene también la espinaca hervida.',
  choclo: 'Granos de choclo amarillo crudos (desgranados o congelados), pesados crudos. El catálogo tiene también el choclo hervido y el de lata.',
  merluza: 'Filetes de merluza sin piel ni espinas, pesados crudos (el catálogo la toma del registro de whiting de USDA, como las recetas originales). Tiene también la merluza cocida.',
  batata: 'Batata pelada, pesada cruda; el catálogo tiene también la batata al horno y la hervida, pesadas cocidas.',
  zapallo: 'Zapallo anco, pesado crudo, pelado y sin semillas; el catálogo tiene también el zapallo común y el anco ya cocido.',
  canela: 'Canela molida; el catálogo no tiene canela en rama.',
  avena: 'Avena arrollada cruda de USDA, pesada seca; no la «Avena arrollada» del catálogo de demostración, que se llama casi igual. El catálogo tiene también la avena ya cocida.',
  panFrancesDeUsda: 'El «Pan tipo francés o de Viena» de USDA, no el «Pan francés» del catálogo de demostración, que se llama casi igual.',
  limon: 'Jugo de limón exprimido; el catálogo tiene también el limón entero sin cáscara. La ralladura no está en el catálogo, así que no se usa.',
};

/** La masa casera de tarta (una tartera de 26 cm, solo abajo): harina, aceite, agua y sal. La comparten R017 a R020. */
export const masaDeTarta = () => [
  i('Masa', '168936', 200, 'AS_PURCHASED', 'harina 000', D.harina000),
  i('Masa', '171025', 45, 'AS_PURCHASED', 'aceite de girasol'),
  i('Masa', '173647', 100, 'AS_PURCHASED', 'agua potable de red'),
  i('Masa', '173468', 3, 'AS_PURCHASED', 'sal fina'),
];
export const PASOS_DE_LA_MASA_DE_TARTA = [
  'Masa: mezclar la harina con la sal (3 g), sumar el aceite (45 g) y el agua, y unir sin amasar de más. Tapar y dejar descansar 15 minutos.',
  'Estirar la masa con palo de amasar y forrar una tartera de 26 cm (con papel manteca si se pega). Pinchar el fondo con un tenedor.',
];

/** La masa casera de empanadas para horno (12 tapas de 13 cm, de unos 42 g, como las comerciales): harina, aceite, agua y sal. La comparten R021 a R024. */
export const masaDeEmpanadas = (agua = 150) => [
  i('Masa', '168936', 300, 'AS_PURCHASED', 'harina 000', D.harina000),
  i('Masa', '171025', 45, 'AS_PURCHASED', 'aceite de girasol'),
  i('Masa', '173647', agua, 'AS_PURCHASED', 'agua potable de red'),
  i('Masa', '173468', 4, 'AS_PURCHASED', 'sal fina'),
];
export const PASO_DE_LA_MASA_DE_EMPANADAS =
  'Masa: mezclar la harina con la sal (4 g), sumar el aceite (45 g) y el agua tibia de a poco, y amasar 5 minutos, hasta que quede lisa. Tapar y dejar descansar 30 minutos.';
export const PASO_DE_ARMAR_EMPANADAS =
  'Estirar la masa fina y cortar 12 discos de unos 13 cm. Poner en cada uno una cucharada colmada de relleno frío, cerrar con repulgue (o apretando el borde con un tenedor) y acomodar en una placa con papel manteca.';

/**
 * Lo que orienta la selección (§6 del encargo): las Guías Alimentarias para la Población Argentina y los recetarios
 * públicos que cita el encargo, consultados por Dirección el 2026-10-28. Son orientación general (variedad, cocina casera,
 * legumbres), no la validación nutricional de ninguna receta. Ninguna receta se copió: las instrucciones son propias.
 */
export const REFERENCIAS = {
  gapa: 'Ministerio de Salud de la Nación: gráfica y recomendaciones de alimentación saludable (GAPA), https://www.argentina.gob.ar/node/92458 · orientación general',
  legumbres: 'Prestación Alimentar: recetas con legumbres, cereales, pan, papa y pastas, https://www.argentina.gob.ar/capital-humano/prestacion-alimentar/recetas-con-legumbres-cereales-pan-papa-y-pastas · orientación general',
  mercadoCentral: 'Mercado Central de Buenos Aires: tarta, empanadas de lentejas y hamburguesas de legumbres, https://mercadocentral.gob.ar/paginas/receta-tarta-de-perejil-y-puerro-apio-empanadas-de-lentejas-hamburguesas-de-legumbres-m%C3%B3nica · referencia culinaria, no fuente de la composición',
};
export const PROCEDENCIA_COMUN =
  'Formulación propia de BE para este encargo (2026-10-28): cocina casera argentina, con cantidades y estados definidos para calcularla con el catálogo de BE (USDA FoodData Central · SR Legacy). No se cocinó ni se pesó: el cálculo es una estimación a partir del catálogo.';
