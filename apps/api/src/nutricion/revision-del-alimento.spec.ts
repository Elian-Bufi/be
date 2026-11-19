import { mismaComposicion, revisionDelAlimento, type FilaDeAlimentoCargado } from './revision-del-alimento';

/** Una fila sintética de un alimento cargado a mano, en su versión vigente `v2`. */
function fila(cambios: Partial<FilaDeAlimentoCargado> = {}): FilaDeAlimentoCargado {
  return {
    elementoId: 'e1',
    versionId: 'v2',
    nombre: 'Barrita casera',
    composicion: { referenceAmount: '100g', energyKcal: 410, proteinG: 9, carbohydrateG: 62, fatG: 14 },
    disponible: true,
    cantidadDeVersiones: 2,
    grupoDeAlimento: 'CEREALES',
    autorId: 'p1',
    autorNombre: 'Lic. Prueba',
    creado: new Date('2026-11-19T10:00:00.000Z'),
    actualizado: new Date('2026-11-19T11:00:00.000Z'),
    resultado: null,
    versionRevisadaId: null,
    fuente: null,
    equivalenteId: null,
    equivalenteNombre: null,
    decidido: null,
    ...cambios,
  };
}

describe('NUA-D07 · lo que decidió Administración, para la versión vigente', () => {
  const decidido = new Date('2026-11-19T12:00:00.000Z');

  it('una certificación vale para la versión que revisó', () => {
    expect(revisionDelAlimento(fila({ resultado: 'CERTIFICADO', versionRevisadaId: 'v2', fuente: 'Rótulo', decidido }))).toEqual({
      state: 'CERTIFIED',
      certification: { source: 'Rótulo', certifiedAt: decidido.toISOString() },
      equivalent: null,
    });
  });

  it('si su autor lo corrigió después, la versión nueva vuelve a «sin revisar»', () => {
    expect(revisionDelAlimento(fila({ resultado: 'CERTIFICADO', versionRevisadaId: 'v1', fuente: 'Rótulo', decidido })).state).toBe('PENDING');
  });

  it('un equivalente vale para el alimento, aunque se haya corregido', () => {
    expect(revisionDelAlimento(fila({ resultado: 'EQUIVALENTE', versionRevisadaId: 'v1', equivalenteId: 'oficial', equivalenteNombre: 'Arroz blanco', decidido }))).toEqual({
      state: 'EQUIVALENT',
      certification: null,
      equivalent: { catalogItemId: 'oficial', name: 'Arroz blanco' },
    });
  });

  it('lo quitado, o nada decidido, es «sin revisar»', () => {
    expect(revisionDelAlimento(fila({ resultado: 'QUITADA', versionRevisadaId: 'v2', decidido })).state).toBe('PENDING');
    expect(revisionDelAlimento(fila()).state).toBe('PENDING');
  });
});

describe('NUA-D01 · cuándo una corrección cambia algo', () => {
  const base = fila().composicion;

  it('los mismos valores no emiten una versión; cualquier valor distinto, sí', () => {
    expect(mismaComposicion(base, { ...base })).toBe(true);
    expect(mismaComposicion(base, { ...base, fatG: 15 })).toBe(false);
    expect(mismaComposicion(base, { ...base, referenceAmount: '100ml' })).toBe(false);
  });

  it('la fibra: sin dato (ausente o null) es lo mismo; un valor, no', () => {
    expect(mismaComposicion(base, { ...base, fiberG: null })).toBe(true);
    expect(mismaComposicion(base, { ...base, fiberG: 3 })).toBe(false);
    expect(mismaComposicion({ ...base, fiberG: 3 }, { ...base, fiberG: 3 })).toBe(true);
  });
});
