import { CON_MARCA, SIN_MARCA, sinMarcas } from './busqueda';

describe('búsqueda por nombre sin tildes ni mayúsculas', () => {
  it('cada letra marcada tiene su letra sin marca, en el mismo orden', () => {
    expect([...CON_MARCA].length).toBe([...SIN_MARCA].length);
    expect(new Set([...CON_MARCA]).size).toBe([...CON_MARCA].length);
  });

  it('«Sandía» y «sandia», «PIÑA» y «pina», «Elevación» y «elevacion» se igualan; el resto no cambia', () => {
    expect(sinMarcas('Sandía')).toBe('sandia');
    expect(sinMarcas('PIÑA')).toBe('pina');
    expect(sinMarcas('Elevación de talones')).toBe('elevacion de talones');
    expect(sinMarcas('Pingüino')).toBe('pinguino');
    expect(sinMarcas('100% avena_integral')).toBe('100% avena_integral');
  });
});
