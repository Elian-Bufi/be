import { describe, expect, test } from '@jest/globals';
import { crearAlmacenDeLaFila, type FilaConDatos } from './almacen-de-la-fila';

/**
 * La fila fija no puede cambiar de identidad si sus datos no cambiaron: con `useSyncExternalStore`, eso dibuja App.tsx
 * otra vez, la sesión vuelve a publicar y la app se cierra («Maximum update depth exceeded», 0.23.0-candidata.1).
 */
describe('el almacén de la fila fija', () => {
  const acciones = { current: {} };
  const fila = (texto: string, ocupado = false): FilaConDatos => ({ datos: { medio: { texto } }, ocupado, acciones });

  test('publicar los mismos datos en cada dibujo no cambia la instantánea ni avisa', () => {
    const almacen = crearAlmacenDeLaFila<FilaConDatos>();
    let avisos = 0;
    almacen.suscribir(() => avisos++);
    almacen.fijar(fila('Empezar serie 1'));
    const primera = almacen.actual();
    for (let i = 0; i < 50; i++) almacen.fijar(fila('Empezar serie 1'));
    expect(almacen.actual()).toBe(primera);
    expect(avisos).toBe(1);
  });

  test('si cambian los datos, cambia la instantánea y avisa una vez', () => {
    const almacen = crearAlmacenDeLaFila<FilaConDatos>();
    let avisos = 0;
    almacen.suscribir(() => avisos++);
    almacen.fijar(fila('Empezar serie 1'));
    almacen.fijar(fila('Terminar serie 1'));
    expect(almacen.actual()?.datos).toEqual({ medio: { texto: 'Terminar serie 1' } });
    almacen.fijar(fila('Terminar serie 1', true));
    expect(almacen.actual()?.ocupado).toBe(true);
    expect(avisos).toBe(3);
  });

  test('retirar la fila avisa una sola vez; retirarla de nuevo no', () => {
    const almacen = crearAlmacenDeLaFila<FilaConDatos>();
    let avisos = 0;
    almacen.suscribir(() => avisos++);
    almacen.fijar(fila('Empezar serie 1'));
    almacen.fijar(null);
    almacen.fijar(null);
    expect(almacen.actual()).toBeNull();
    expect(avisos).toBe(2);
  });

  test('otra referencia de acciones (otra sesión) reemplaza la fila aunque los textos coincidan', () => {
    const almacen = crearAlmacenDeLaFila<FilaConDatos>();
    almacen.fijar(fila('Empezar serie 1'));
    const otra: FilaConDatos = { datos: { medio: { texto: 'Empezar serie 1' } }, ocupado: false, acciones: { current: {} } };
    almacen.fijar(otra);
    expect(almacen.actual()).toBe(otra);
  });
});
