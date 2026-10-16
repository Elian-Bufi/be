// Las comidas de los planes de la cohorte: preparaciones de todos los días en la Argentina, con alimentos del catálogo
// de BE. Las cantidades son de partida: `planNutricional` las escala a la energía del objetivo de cada etapa.

const D = 'Desayuno';
const A = 'Almuerzo';
const M = 'Merienda';
const C = 'Cena';

/** Cuatro comidas, para quien ordena su alimentación y baja de peso (Diego). */
export const habitual = (variante = 0) => [
  {
    rotulo: 'Día habitual',
    comidas: [
      [D, [
        ['Café con leche y tostadas con queso', [['cafe', 150, 'RAW'], ['leche', 150, 'RAW'], ['panIntegral', 60, 'AS_PURCHASED'], ['quesoFresco', 30, 'AS_PURCHASED']]],
        ['Yogur con avena y banana', [['yogur', 200, 'AS_PURCHASED'], ['avena', 40, 'RAW'], ['banana', 100, 'RAW']]],
      ]],
      [A, [
        ['Pollo con arroz y ensalada', [['pollo', 150, 'COOKED'], ['arroz', 150, 'COOKED'], ['lechuga', 60, 'RAW'], ['tomate', 100, 'RAW'], ['aceite', 10, 'RAW']]],
        ['Carne con puré de zapallo', [['carne', 150, 'COOKED'], ['zapallo', 250, 'COOKED'], ['aceite', 5, 'RAW']]],
        ...(variante >= 1 ? [['Lentejas guisadas', [['lentejas', 220, 'COOKED'], ['cebolla', 50, 'COOKED'], ['zanahoria', 80, 'COOKED'], ['aceite', 10, 'RAW']]]] : []),
      ]],
      [M, [
        ['Té con tostadas y ricota', [['te', 200, 'RAW'], ['panIntegral', 50, 'AS_PURCHASED'], ['ricota', 50, 'AS_PURCHASED']]],
        ['Fruta y nueces', [['manzana', 150, 'RAW'], ['nueces', 15, 'RAW']]],
      ]],
      [C, [
        ['Merluza con papa y brócoli', [['merluza', 180, 'COOKED'], ['papa', 200, 'COOKED'], ['brocoli', 150, 'COOKED'], ['aceite', 10, 'RAW']]],
        ['Tortilla de espinaca', [['huevo', 150, 'COOKED'], ['espinaca', 150, 'COOKED'], ['papa', 150, 'COOKED'], ['aceite', 10, 'RAW']]],
        ...(variante >= 2 ? [['Fideos con tuco y carne', [['fideos', 200, 'COOKED'], ['tomate', 120, 'COOKED'], ['carne', 100, 'COOKED'], ['aceite', 5, 'RAW']]]] : []),
      ]],
    ],
  },
];

/** Cinco comidas y dos días tipo, para un deportista con entrenamientos y partidos (Federico). */
export const deportista = (descanso = 0.86) => {
  const comidas = (dia) => [
    [D, [
      ['Avena con leche, banana y maní', [['avena', 80, 'RAW'], ['leche', 300, 'RAW'], ['banana', 120, 'RAW'], ['mani', 20, 'AS_PURCHASED']]],
      ['Huevos con pan y jugo', [['huevo', 150, 'COOKED'], ['panFrances', 100, 'AS_PURCHASED'], ['jugo', 250, 'RAW']]],
    ]],
    [A, [
      ['Carne con arroz y ensalada', [['carne', 220, 'COOKED'], ['arroz', 250, 'COOKED'], ['lechuga', 60, 'RAW'], ['tomate', 120, 'RAW'], ['aceite', 10, 'RAW']]],
      ['Pollo con fideos', [['pollo', 220, 'COOKED'], ['fideos', 300, 'COOKED'], ['tomate', 100, 'COOKED'], ['aceite', 10, 'RAW']]],
    ]],
    [dia === 'entreno' ? 'Antes de entrenar' : M, [
      ['Banana con pan y miel', [['banana', 120, 'RAW'], ['panFrances', 80, 'AS_PURCHASED'], ['miel', 20, 'AS_PURCHASED']]],
      ['Yogur con avena', [['yogur', 250, 'AS_PURCHASED'], ['avena', 50, 'RAW']]],
    ]],
    [C, [
      ['Salmón con papas', [['salmon', 200, 'COOKED'], ['papa', 350, 'COOKED'], ['aceite', 10, 'RAW']]],
      ['Pollo con batata y brócoli', [['pollo', 220, 'COOKED'], ['batata', 350, 'COOKED'], ['brocoli', 150, 'COOKED'], ['aceite', 10, 'RAW']]],
    ]],
    ['Colación', [['Yogur con almendras', [['yogur', 200, 'AS_PURCHASED'], ['almendras', 30, 'RAW']]]]],
  ];
  return [
    { rotulo: 'Día de entrenamiento o partido', comidas: comidas('entreno') },
    { rotulo: 'Día de descanso', factor: descanso, comidas: comidas('descanso') },
  ];
};

/** Cuatro comidas con proteínas repartidas y una colación, para una persona mayor (Norma). */
export const mayor = (variante = 0) => [
  {
    rotulo: 'Día habitual',
    comidas: [
      [D, [
        ['Café con leche, pan y queso', [['cafe', 100, 'RAW'], ['leche', 200, 'RAW'], ['panIntegral', 40, 'AS_PURCHASED'], ['quesoFresco', 30, 'AS_PURCHASED']]],
        ...(variante >= 1 ? [['Huevo revuelto con tostadas', [['huevo', 100, 'COOKED'], ['panIntegral', 40, 'AS_PURCHASED'], ['te', 200, 'RAW']]]] : []),
      ]],
      [A, [
        ['Merluza con puré de zapallo', [['merluza', 150, 'COOKED'], ['zapallo', 200, 'COOKED'], ['papa', 100, 'COOKED'], ['aceite', 10, 'RAW']]],
        ['Pollo con arroz y espinaca', [['pollo', 130, 'COOKED'], ['arroz', 120, 'COOKED'], ['espinaca', 100, 'COOKED'], ['aceite', 5, 'RAW']]],
        ['Carne con ensalada de tomate', [['carne', 120, 'COOKED'], ['tomate', 150, 'RAW'], ['lechuga', 50, 'RAW'], ['papa', 120, 'COOKED'], ['aceite', 10, 'RAW']]],
      ]],
      [M, [
        ['Yogur con banana', [['yogur', 200, 'AS_PURCHASED'], ['banana', 100, 'RAW']]],
        ['Té con tostadas y ricota', [['te', 200, 'RAW'], ['panIntegral', 40, 'AS_PURCHASED'], ['ricota', 50, 'AS_PURCHASED']]],
      ]],
      [C, [
        ['Tortilla de espinaca', [['huevo', 100, 'COOKED'], ['espinaca', 150, 'COOKED'], ['aceite', 5, 'RAW']]],
        ['Sopa de lentejas', [['lentejas', 150, 'COOKED'], ['zanahoria', 80, 'COOKED'], ['cebolla', 40, 'COOKED'], ['quesoFresco', 20, 'AS_PURCHASED']]],
      ]],
      ['Colación', [['Leche con frutillas', [['leche', 200, 'RAW'], ['frutillas', 100, 'RAW']]]]],
    ],
  },
];

/** Sin azúcar agregada, con legumbres, verduras e integrales, para cuidar la glucemia (Héctor). */
export const glucemia = (variante = 0) => [
  {
    rotulo: 'Día habitual',
    comidas: [
      [D, [
        ['Café con leche y pan integral con queso', [['cafe', 150, 'RAW'], ['leche', 150, 'RAW'], ['panIntegral', 50, 'AS_PURCHASED'], ['quesoFresco', 30, 'AS_PURCHASED']]],
        ['Yogur con frutillas y nueces', [['yogur', 200, 'AS_PURCHASED'], ['frutillas', 100, 'RAW'], ['nueces', 15, 'RAW']]],
      ]],
      [A, [
        ['Pollo con arroz integral y ensalada', [['pollo', 150, 'COOKED'], ['arrozIntegral', 120, 'COOKED'], ['lechuga', 60, 'RAW'], ['tomate', 120, 'RAW'], ['aceite', 10, 'RAW']]],
        ['Garbanzos con verduras', [['garbanzos', 200, 'COOKED'], ['zanahoria', 80, 'COOKED'], ['espinaca', 100, 'COOKED'], ['aceite', 10, 'RAW']]],
        ['Merluza con brócoli y papa', [['merluza', 180, 'COOKED'], ['brocoli', 200, 'COOKED'], ['papa', 120, 'COOKED'], ['aceite', 10, 'RAW']]],
      ]],
      [M, [
        ['Té con manzana y almendras', [['te', 200, 'RAW'], ['manzana', 150, 'RAW'], ['almendras', 15, 'RAW']]],
        ...(variante >= 1 ? [['Pan integral con ricota y tomate', [['panIntegral', 40, 'AS_PURCHASED'], ['ricota', 40, 'AS_PURCHASED'], ['tomate', 80, 'RAW']]]] : []),
      ]],
      [C, [
        ['Carne con ensalada y batata', [['carne', 140, 'COOKED'], ['lechuga', 60, 'RAW'], ['tomate', 100, 'RAW'], ['batata', 120, 'COOKED'], ['aceite', 10, 'RAW']]],
        ['Tortilla de verduras', [['huevo', 150, 'COOKED'], ['zapallo', 150, 'COOKED'], ['cebolla', 50, 'COOKED'], ['aceite', 10, 'RAW']]],
      ]],
      ...(variante >= 2 ? [['Colación', [['Yogur natural', [['yogur', 150, 'AS_PURCHASED']]]]]] : []),
    ],
  },
];

/** Cinco comidas para ganar peso, prácticas para quien viaja y estudia (Agustina). */
export const ganancia = () => [
  {
    rotulo: 'Día habitual',
    comidas: [
      [D, [
        ['Avena con leche, banana y maní', [['avena', 70, 'RAW'], ['leche', 250, 'RAW'], ['banana', 100, 'RAW'], ['mani', 20, 'AS_PURCHASED']]],
        ['Tostadas con palta y huevo', [['panFrances', 80, 'AS_PURCHASED'], ['palta', 60, 'RAW'], ['huevo', 100, 'COOKED']]],
      ]],
      [A, [
        ['Fideos con carne', [['fideos', 300, 'COOKED'], ['carne', 130, 'COOKED'], ['tomate', 100, 'COOKED'], ['aceite', 10, 'RAW']]],
        ['Arroz con pollo y palta', [['arroz', 250, 'COOKED'], ['pollo', 150, 'COOKED'], ['palta', 50, 'RAW']]],
      ]],
      [M, [
        ['Yogur con avena y miel', [['yogur', 200, 'AS_PURCHASED'], ['avena', 40, 'RAW'], ['miel', 15, 'AS_PURCHASED']]],
        ['Sándwich de queso y jugo', [['panIntegral', 80, 'AS_PURCHASED'], ['quesoFresco', 40, 'AS_PURCHASED'], ['jugo', 200, 'RAW']]],
      ]],
      [C, [
        ['Pollo con batata', [['pollo', 150, 'COOKED'], ['batata', 300, 'COOKED'], ['aceite', 10, 'RAW']]],
        ['Tortilla de papa', [['papa', 250, 'COOKED'], ['huevo', 150, 'COOKED'], ['aceite', 10, 'RAW']]],
      ]],
      ['Antes de dormir', [['Leche con almendras', [['leche', 250, 'RAW'], ['almendras', 25, 'RAW']]]]],
    ],
  },
];

/** Las comidas fuera del plan, como las describe la persona en «Comí algo diferente». */
export const DIFERENTES = {
  [D]: [['Medialunas con café con leche', 'Dos medialunas'], ['Factura en la oficina', 'Una'], ['Tostado de jamón y queso', 'Uno']],
  [A]: [['Milanesa con puré en el trabajo', 'Un plato'], ['Empanadas', 'Tres'], ['Hamburguesa con papas', 'Una, con papas chicas'], ['Ensalada del bar', 'Un plato grande']],
  [M]: [['Alfajor', 'Uno'], ['Mate con bizcochitos', 'Un puñado'], ['Torta de cumpleaños', 'Una porción']],
  [C]: [['Asado familiar', 'Un plato'], ['Pizza con amigos', 'Tres porciones'], ['Sushi', 'Doce piezas'], ['Empanadas', 'Cuatro'], ['Pastas en lo de mi vieja', 'Un plato'], ['Choripán en la cancha', 'Uno']],
};
