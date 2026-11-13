/**
 * TEST-PG-008 (WP-PULIDO-GRANDES, PG-09, con PG-D15): la hora es la de lo confirmado; una lectura fallida no la mueve. Se
 * prueba la lógica (`hora-de-lo-que-ves.ts`) con relojes fijos y, leyendo el código, que las cuatro pantallas tienen el
 * gesto y la hora, y que tirar vuelve a pedir lo mismo que ya se lee.
 *
 * Mutación verificada: con `pedido` que devuelve `{ confirmada: ahora }` (avanzar la hora al pedir), la secuencia de la
 * falla se pone en rojo; con la hora de la pantalla tomada como la más nueva en lugar de la más vieja, también.
 *
 * Uso: cd apps/mobile && npx jest src/hora-de-lo-que-ves.test.ts --runInBand.
 */
import { describe, expect, test } from '@jest/globals';
import {
  admiteTirarParaActualizar,
  anuncioAlActualizar,
  eventoDeLaLista,
  eventoDelCiclo,
  horaDeLaPantalla,
  marcaTrasEvento,
  SIN_MARCA,
  textoDeLaHora,
  type EventoDeLectura,
  type MarcaDeLectura,
} from './hora-de-lo-que-ves';

declare const require: (modulo: string) => { readFileSync(ruta: string, codificacion: string): string; join(...partes: string[]): string };
declare const __dirname: string;
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const leer = (...partes: string[]) => readFileSync(join(__dirname, ...partes), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

/** «10:42» de unos minutos del día, sin depender de la zona del teléfono de la prueba. */
const A_LAS = (h: number, m: number) => (h * 60 + m) * 60_000;
const formatear = (ms: number) => {
  const minutos = Math.floor(ms / 60_000);
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
};
const seguir = (eventos: readonly [EventoDeLectura, number][]): MarcaDeLectura => eventos.reduce((m, [e, t]) => marcaTrasEvento(m, e, t), SIN_MARCA);

describe('TEST-PG-008 · la hora es la de lo confirmado', () => {
  test('confirmar la pone; pedir no la mueve; una falla la deja donde estaba y cambia el texto', () => {
    const confirmada = seguir([
      ['vacio', A_LAS(9, 14)],
      ['confirmado', A_LAS(9, 15)],
    ]);
    expect(confirmada).toEqual({ confirmada: A_LAS(9, 15), fallo: false });
    const pidiendo = marcaTrasEvento(confirmada, 'pedido', A_LAS(10, 42));
    expect(pidiendo).toEqual(confirmada);
    const fallida = marcaTrasEvento(pidiendo, 'fallo', A_LAS(10, 42));
    expect(fallida).toEqual({ confirmada: A_LAS(9, 15), fallo: true });
    expect(textoDeLaHora(horaDeLaPantalla([confirmada]), formatear)).toBe('Al día, 09:15');
    expect(textoDeLaHora(horaDeLaPantalla([fallida]), formatear)).toBe('Ves lo de las 09:15');
    const otraVez = marcaTrasEvento(fallida, 'confirmado', A_LAS(10, 43));
    expect(textoDeLaHora(horaDeLaPantalla([otraVez]), formatear)).toBe('Al día, 10:43');
  });

  test('la pantalla dice la más vieja de lo que muestra, y cualquier falla cambia el texto', () => {
    const vieja = { confirmada: A_LAS(9, 15), fallo: false };
    const nueva = { confirmada: A_LAS(10, 42), fallo: false };
    expect(horaDeLaPantalla([nueva, vieja])).toEqual({ hora: A_LAS(9, 15), fallo: false });
    expect(horaDeLaPantalla([nueva, { confirmada: null, fallo: true }])).toEqual({ hora: A_LAS(10, 42), fallo: true });
  });

  test('sin nada confirmado a la vista, no hay hora: la pantalla ya dice «Reintentar»', () => {
    expect(textoDeLaHora(horaDeLaPantalla([]), formatear)).toBeNull();
    expect(textoDeLaHora(horaDeLaPantalla([marcaTrasEvento(SIN_MARCA, 'perdido', A_LAS(9, 0))]), formatear)).toBeNull();
    expect(marcaTrasEvento({ confirmada: A_LAS(9, 0), fallo: false }, 'vacio', A_LAS(9, 1))).toEqual(SIN_MARCA);
  });

  test('el anuncio al terminar: «Actualizado, 10:42», o que no se pudo y de cuándo es lo que se ve', () => {
    expect(anuncioAlActualizar({ hora: A_LAS(10, 42), fallo: false }, formatear)).toBe('Actualizado, 10:42');
    expect(anuncioAlActualizar({ hora: A_LAS(9, 15), fallo: true }, formatear)).toBe('No se pudo actualizar. Ves lo de las 09:15');
    expect(anuncioAlActualizar({ hora: null, fallo: true }, formatear)).toBeNull();
  });
});

describe('TEST-PG-008 · los eventos de cada lectura', () => {
  test('el ciclo: entrar vacía, actualizar es un pedido, lo confirmado (o negado) confirma, la falla es falla', () => {
    expect(eventoDelCiclo({ tipo: 'verificando' })).toBe('vacio');
    expect(eventoDelCiclo({ tipo: 'listo', actualizando: true, sinActualizar: false })).toBe('pedido');
    expect(eventoDelCiclo({ tipo: 'listo', actualizando: false, sinActualizar: false })).toBe('confirmado');
    expect(eventoDelCiclo({ tipo: 'listo', actualizando: false, sinActualizar: true })).toBe('fallo');
    expect(eventoDelCiclo({ tipo: 'sin-confirmar' })).toBe('perdido');
    expect(eventoDelCiclo({ tipo: 'rechazado' })).toBe('confirmado');
  });

  test('la lista de Novedades: cargar es un pedido; la falla no deja nada a la vista', () => {
    expect(eventoDeLaLista('cargando')).toBe('pedido');
    expect(eventoDeLaLista('listo')).toBe('confirmado');
    expect(eventoDeLaLista('error')).toBe('perdido');
  });
});

describe('TEST-PG-008 · las cuatro pantallas (lectura del código)', () => {
  test('el gesto, solo en Inicio, Nutrición, Entrenamiento y Novedades, con el color del tema', () => {
    for (const p of ['inicio', 'hoy', 'entrenamiento', 'novedades']) expect(admiteTirarParaActualizar(p)).toBe(true);
    for (const p of ['perfil', 'sesion-de-entrenamiento', 'mi-evolucion']) expect(admiteTirarParaActualizar(p)).toBe(false);
    const app = leer('..', 'App.tsx');
    expect(app).toContain('conSesion && admiteTirarParaActualizar(ruta.nombre) ? (');
    expect(app).toContain('<RefreshControl refreshing={tirando} onRefresh={() => void alTirar()} colors={[COLOR.acento]} tintColor={COLOR.acento}');
    expect(app).toContain('AccessibilityInfo.announceForAccessibility(anuncio);');
    expect(app).not.toMatch(/setInterval\([^)]*actualizarLoQueSeVe/);
  });

  test('la hora, debajo del título de cada una', () => {
    expect(leer('pantallas', 'inicio.tsx')).toMatch(/<Titulo>\{fechaLarga\(hoy\)\}<\/Titulo>\s*(\{\}\s*)?<HoraDeLoQueVes \/>/);
    expect(leer('pantallas', 'nutricion.tsx')).toMatch(/<Titulo>\{COPY_NUTRICION\.pestana\}<\/Titulo>\s*<HoraDeLoQueVes \/>/);
    expect(leer('pantallas', 'entrenamiento.tsx')).toMatch(/<Titulo>\{COPY_ENTRENAMIENTO\.pestana\}<\/Titulo>\s*<HoraDeLoQueVes \/>/);
    expect(leer('pantallas', 'novedades.tsx')).toMatch(/<Titulo>\{COPY_NOVEDADES\.titulo\}<\/Titulo>\s*<HoraDeLoQueVes \/>/);
  });

  test('tirar vuelve a pedir las mismas lecturas, y cada una deja su marca con lo que le pasó', () => {
    const lecturas = leer('lecturas.ts');
    expect(lecturas).toContain('marcar(idDeLaMarca, eventoDelCiclo(nuevo));');
    expect(lecturas).toContain('recargas.set(idDeLaMarca, () => c.cargar());');
    expect(lecturas).toContain('olvidarLaMarca(idDeLaMarca);');
    expect(leer('pantallas', 'novedades.tsx')).toContain('useMarcaDeLectura(eventoDeLaLista(lista.estado.tipo), lista.recargar);');
  });
});
