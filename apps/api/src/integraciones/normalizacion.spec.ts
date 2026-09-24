import { normalizarProducto } from './open-food-facts';
import { textoDelProveedor } from './proveedor-http';
import { normalizarEjercicio } from './wger';

/**
 * WP-08 · cómo se lleva la respuesta de cada proveedor a la forma del candidato. Sin red: la normalización es pura.
 * Lo que se fija: lo que el proveedor no trae es `null`, nunca un cero ni una conversión inventada (09v12:196).
 */
describe('Open Food Facts → candidato de alimento', () => {
  it('toma el nombre en español si está, y los cuatro nutrientes cada 100 g', () => {
    expect(
      normalizarProducto({
        product_name: 'Crackers',
        product_name_es: 'Galletitas',
        nutrition_data_per: '100g',
        nutriments: { 'energy-kcal_100g': 452, proteins_100g: 8.5, carbohydrates_100g: '66', fat_100g: 17.25 },
      }),
    ).toEqual({ name: 'Galletitas', composition: { referenceAmount: '100g', energyKcal: 452, proteinG: 8.5, carbohydrateG: 66, fatG: 17.25 } });
  });

  it('no calcula kcal desde los kJ: si no vinieron, es null', () => {
    const c = normalizarProducto({ product_name: 'X', nutriments: { energy_100g: 1891, 'energy-kj_100g': 1891 } });
    expect(c.composition.energyKcal).toBeNull();
  });

  it('lo ilegible o negativo no es un dato; un cero sí', () => {
    const c = normalizarProducto({ product_name: 'X', nutrition_data_per: '100g', nutriments: { 'energy-kcal_100g': 'mucho', proteins_100g: -2, carbohydrates_100g: 0, fat_100g: null } });
    expect(c.composition).toEqual({ referenceAmount: '100g', energyKcal: null, proteinG: null, carbohydrateG: 0, fatG: null });
  });

  it('la base se toma solo si el proveedor la declara sin ambigüedad; si no, null', () => {
    const base = (p: Record<string, unknown>) => normalizarProducto({ ...p, nutriments: {} }).composition.referenceAmount;
    expect(base({ nutrition_data_per: '100ml' })).toBe('100ml');
    expect(base({ nutrition_data_per: '100g', product_quantity_unit: 'g' })).toBe('100g');
    // Open Food Facts guarda «100g» también en muchos líquidos: con el envase en ml, cl o l, no se sabe cuál es.
    expect(base({ nutrition_data_per: '100g', product_quantity_unit: 'ML' })).toBeNull();
    expect(base({ nutrition_data_per: '100g', product_quantity_unit: 'l' })).toBeNull();
    expect(base({ product_quantity_unit: 'ml' })).toBeNull();
    expect(base({})).toBeNull();
  });

  it('un producto sin nombre tiene nombre null; los caracteres de control no llegan a la base', () => {
    expect(normalizarProducto({ nutriments: {} }).name).toBeNull();
    expect(normalizarProducto({ product_name: '  Galletitas\u0000 de\n prueba ', nutriments: {} }).name).toBe('Galletitas de prueba');
  });
});

describe('wger → candidato de ejercicio', () => {
  const base = {
    category: { name: 'Abs' },
    muscles: [{ name: 'Rectus abdominis' }],
    muscles_secondary: [{ name: 'Obliquus externus abdominis' }, { name: '' }],
    equipment: [{ name: 'Gym mat' }],
    license: { id: 1, short_name: 'CC-BY-SA 3', full_name: 'Creative Commons Attribution Share Alike 3', url: 'https://creativecommons.org/licenses/by-sa/3.0/deed.en' },
    license_author: 'autora',
  };

  it('prefiere la traducción al español, con su licencia y su autoría', () => {
    const { candidato, licencia } = normalizarEjercicio({
      ...base,
      translations: [
        { language: 2, name: 'Plank', license: 1, license_author: 'autora' },
        { language: 4, name: ' Plancha ', license: 2, license_author: 'traductora' },
      ],
    });
    expect(candidato).toEqual({ name: 'Plancha', nameLanguage: 'es', category: 'Abs', primaryMuscles: ['Rectus abdominis'], secondaryMuscles: ['Obliquus externus abdominis'], equipment: ['Gym mat'] });
    expect(licencia).toEqual({ id: 'CC-BY-SA-4.0', label: 'Creative Commons Attribution Share Alike 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/', attribution: 'traductora' });
  });

  it('sin español, el inglés; sin traducciones, nombre null y la licencia del ejercicio, con el id normalizado', () => {
    expect(normalizarEjercicio({ ...base, translations: [{ language: 1, name: 'Unterarmstütz', license: 1 }, { language: 2, name: 'Plank', license: 1 }] }).candidato).toMatchObject({ name: 'Plank', nameLanguage: 'en' });
    const sinNada = normalizarEjercicio({ ...base, translations: [] });
    expect(sinNada.candidato).toMatchObject({ name: null, nameLanguage: null });
    // La misma licencia tiene un solo id, venga del texto o del ejercicio.
    expect(sinNada.licencia).toEqual({ id: 'CC-BY-SA-3.0', label: 'Creative Commons Attribution Share Alike 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/', attribution: 'autora' });
  });

  it('una licencia que wger no informa se dice así, sin inventarla ni tomar prestado el autor del ejercicio', () => {
    expect(normalizarEjercicio({ translations: [{ language: 4, name: 'Plancha', license: 99 }] }).licencia).toEqual({ id: 'desconocida', label: 'Licencia no informada por wger', url: null, attribution: null });
    // El ejercicio tiene autora, pero el nombre elegido es de otra traducción: esa autora no es la del texto.
    expect(normalizarEjercicio({ ...base, translations: [{ language: 4, name: 'Plancha', license: 2 }] }).licencia).toEqual({
      id: 'CC-BY-SA-4.0',
      label: 'Creative Commons Attribution Share Alike 4.0',
      url: 'https://creativecommons.org/licenses/by-sa/4.0/',
      attribution: null,
    });
  });

  it('lo que no es una traducción se descarta, y los textos llegan limpios', () => {
    const { candidato } = normalizarEjercicio({ ...base, translations: [null, 7, 'x', [], { language: 4, name: '\u0000' }, { language: 4, name: ' Plancha\t lateral ' }] });
    expect(candidato).toMatchObject({ name: 'Plancha lateral', nameLanguage: 'es' });
  });
});

describe('textoDelProveedor', () => {
  it('quita los caracteres de control, normaliza espacios, recorta y dice null si no queda nada', () => {
    expect(textoDelProveedor('  a\u0000b\u0007  c ')).toBe('a b c');
    expect(textoDelProveedor('x'.repeat(300))).toHaveLength(200);
    expect(textoDelProveedor('x'.repeat(300), 120)).toHaveLength(120);
    expect(textoDelProveedor(' \u0000 ')).toBeNull();
    expect(textoDelProveedor(42)).toBeNull();
  });
});
