// DFD de nivel 1 (Yourdon y DeMarco), primera parte: lo que pone en marcha el seguimiento. Procesos 1 a 3 del nivel 1
// (acceso, vínculo y consentimiento, catálogos), con sus almacenes. Los procesos 4 a 6 están en D-02 y el 7 y el 8 en D-03; la numeración
// es una sola para todo el nivel. Cada almacén corresponde a vistas del DER (tabla del anexo D).
import { flujoDeDatos, LEYENDA_DFD } from './_dfd-comun.mjs';

export const meta = {
  id: 'D-01',
  titulo: 'DFD de nivel 1 · acceso, vínculo y catálogos',
  alcance: 'Procesos 1 a 3 del nivel 1: entrar, vincularse y consentir, y mantener los catálogos; con sus almacenes.',
  fuente: 'apps/api/src (sesion, acceso-google, vinculo, consentimiento, nutricion/catalogo, entrenamiento, integraciones)',
  estado: 'implementado',
  ancho: 750,
  alto: 456,
};

export function dibujar(L) {
  // Procesos en una fila; el profesional arriba, el asesorado abajo a la izquierda, los sistemas a los costados.
  L.proceso({ id: 'p1', cx: 210, cy: 215, r: 46, numero: 1, nombre: 'Gestionar el acceso' });
  L.proceso({ id: 'p2', cx: 390, cy: 215, r: 46, numero: 2, nombre: 'Vincular y consentir' });
  L.proceso({ id: 'p3', cx: 570, cy: 215, r: 46, numero: 3, nombre: 'Mantener los catálogos' });
  L.caja({ id: 'pro', x: 300, y: 12, w: 170, tipo: 'persona', titulo: 'Profesional', tecnologia: 'website' });
  L.caja({ id: 'ase', x: 16, y: 340, w: 130, tipo: 'persona', titulo: 'Asesorado', tecnologia: 'APK' });
  L.caja({ id: 'goo', x: 16, y: 196, w: 96, tipo: 'externo', titulo: 'Google', tecnologia: 'identidad' });
  L.caja({ id: 'cat', x: 600, y: 330, w: 144, tipo: 'externo', titulo: 'Open Food Facts y wger', tecnologia: 'catálogos abiertos' });
  L.almacen({ id: 'd1', x: 40, y: 104, w: 156, codigo: 'D1', nombre: 'Identidades y sesiones' });
  L.almacen({ id: 'd3', x: 196, y: 362, w: 196, codigo: 'D3', nombre: 'Vínculos y consentimientos' });
  L.almacen({ id: 'd7', x: 408, y: 362, w: 168, codigo: 'D7', nombre: 'Seguimiento y novedades' });
  L.almacen({ id: 'd4', x: 604, y: 104, w: 120, codigo: 'D4', nombre: 'Catálogos' });

  flujoDeDatos(L, 'pro', 'p1', 'credenciales', { desplazamiento: 7 });
  flujoDeDatos(L, 'p1', 'pro', 'sesión', { desplazamiento: 7 });
  flujoDeDatos(L, 'ase', 'p1', 'credenciales', { desplazamiento: 7, pos: 0.7, lado: 'der', manual: true });
  flujoDeDatos(L, 'p1', 'ase', 'sesión', { desplazamiento: 7, pos: 0.5, lado: 'izq', manual: true });
  flujoDeDatos(L, 'goo', 'p1', ['claves', 'públicas']);
  flujoDeDatos(L, 'p1', 'd1', ['identidad', 'y sesión'], { doble: true });
  flujoDeDatos(L, 'pro', 'p2', 'invitación', { desplazamiento: 7 });
  flujoDeDatos(L, 'p2', 'pro', ['enlace', 'y código'], { desplazamiento: 7 });
  flujoDeDatos(L, 'ase', 'p2', ['aceptación y', 'consentimientos']);
  flujoDeDatos(L, 'p2', 'd3', ['vínculo, alcance', 'y consentimiento'], { doble: true });
  flujoDeDatos(L, 'p2', 'd7', 'novedad');
  flujoDeDatos(L, 'pro', 'p3', ['alimento, receta o', 'ejercicio propio']);
  flujoDeDatos(L, 'p3', 'cat', ['código de barras', 'o número'], { desplazamiento: 7 });
  flujoDeDatos(L, 'cat', 'p3', ['datos del producto', 'o del ejercicio'], { desplazamiento: 7 });
  flujoDeDatos(L, 'p3', 'd4', ['elemento y', 'su versión'], { doble: true });

  L.nota({
    x: 16,
    y: 12,
    w: 250,
    titulo: 'Transversal',
    texto: 'Cada proceso escribe su historia y su auditoría en D8 en la misma transacción; no se dibuja para no repetirlo.',
  });
  L.leyenda({ x: 0, y: 422, w: 750, columnas: 5, titulo: null, items: LEYENDA_DFD });
}
