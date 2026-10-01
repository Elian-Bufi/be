import { tipoDeValorCorrecto } from './lectura-formularios';

describe('tipoDeValorCorrecto — cada valor con el tipo que declara la plantilla', () => {
  it('TEXT, NUMBER y BOOLEAN aceptan su tipo y nada más', () => {
    expect(tipoDeValorCorrecto('TEXT', 'algo')).toBe(true);
    expect(tipoDeValorCorrecto('TEXT', '   ')).toBe(false);
    expect(tipoDeValorCorrecto('NUMBER', 3)).toBe(true);
    expect(tipoDeValorCorrecto('NUMBER', Number.NaN)).toBe(false);
    expect(tipoDeValorCorrecto('BOOLEAN', false)).toBe(true);
    expect(tipoDeValorCorrecto('BOOLEAN', 'sí')).toBe(false);
  });

  it('un tipo que el servidor no conoce se rechaza, no se valida como sí/no', () => {
    const desconocido = 'SINGLE_CHOICE' as unknown as Parameters<typeof tipoDeValorCorrecto>[0];
    expect(tipoDeValorCorrecto(desconocido, true)).toBe(false);
    expect(tipoDeValorCorrecto(desconocido, 'opcion_a')).toBe(false);
  });
});
