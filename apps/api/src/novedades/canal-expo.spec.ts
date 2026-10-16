import { leerTickets } from './canal-expo';
import { mismoSecreto } from './tareas.controller';

describe('WP-NOVEDADES-Y-AVISOS · el canal de Expo y la ruta interna (DL-133)', () => {
  it('lee los tickets de Expo en orden: ok con su id, error con su código; otra forma es «sin respuesta»', () => {
    const texto = JSON.stringify({ data: [{ status: 'ok', id: 'XXXX' }, { status: 'error', message: 'x', details: { error: 'DeviceNotRegistered' } }, { status: 'error' }] });
    expect(leerTickets(texto, 3)).toEqual([
      { estado: 'ENVIADO', ticket: 'XXXX' },
      { estado: 'RECHAZADO', detalle: 'DeviceNotRegistered' },
      { estado: 'RECHAZADO', detalle: 'error' },
    ]);
    // Otra cantidad de tickets, otro JSON o texto que no es JSON: no se puede saber qué pasó con cada uno.
    expect(leerTickets(texto, 2)).toBeNull();
    expect(leerTickets(JSON.stringify({ errors: [{ code: 'PUSH_TOO_MANY_EXPERIENCE_IDS' }] }), 1)).toBeNull();
    expect(leerTickets('<html>', 1)).toBeNull();
  });

  it('el secreto de la tarea se compara entero: otro, más corto o más largo, no pasa', () => {
    const esperado = 'Bearer secreto-sintetico-de-32-caracteres-como-minimo';
    expect(mismoSecreto(esperado, esperado)).toBe(true);
    expect(mismoSecreto(esperado.slice(0, -1), esperado)).toBe(false);
    expect(mismoSecreto(`${esperado}x`, esperado)).toBe(false);
    expect(mismoSecreto('Bearer otro', esperado)).toBe(false);
  });
});
