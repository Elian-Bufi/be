// DFD de nivel 1 (Yourdon y DeMarco), segunda parte: el ciclo de seguimiento. Procesos 4 a 6 del nivel 1 (planificar,
// registrar, revisar y analizar), con sus almacenes. La numeración es una sola para todo el nivel (D-01 a D-03).
import { flujoDeDatos, LEYENDA_DFD } from './_dfd-comun.mjs';

export const meta = {
  id: 'D-02',
  titulo: 'DFD de nivel 1 · planificar, registrar y revisar',
  alcance: 'Procesos 4 a 6 del nivel 1: el plan, los registros del asesorado y del profesional, y la revisión; con sus almacenes.',
  fuente: 'apps/api/src (nutricion, entrenamiento, antropometria, formularios, proceso, coordinacion, dashboard, analisis)',
  estado: 'implementado',
  ancho: 750,
  alto: 456,
};

export function dibujar(L) {
  L.proceso({ id: 'p4', cx: 100, cy: 215, r: 44, numero: 4, nombre: 'Planificar' });
  L.proceso({ id: 'p5', cx: 375, cy: 215, r: 44, numero: 5, nombre: 'Registrar' });
  L.proceso({ id: 'p6', cx: 650, cy: 215, r: 44, numero: 6, nombre: 'Revisar y analizar' });
  L.caja({ id: 'pro', x: 300, y: 58, w: 150, tipo: 'persona', titulo: 'Profesional', tecnologia: 'website' });
  L.caja({ id: 'ase', x: 310, y: 318, w: 130, tipo: 'persona', titulo: 'Asesorado', tecnologia: 'APK' });
  L.almacen({ id: 'd2', x: 282, y: 8, w: 186, codigo: 'D2', nombre: 'Profesionales y procesos' });
  L.almacen({ id: 'd7', x: 288, y: 384, w: 176, codigo: 'D7', nombre: 'Seguimiento y novedades' });
  L.almacen({ id: 'd4', x: 16, y: 62, w: 104, codigo: 'D4', nombre: 'Catálogos' });
  L.almacen({ id: 'd5', x: 172, y: 200, w: 146, codigo: 'D5', nombre: 'Planes y objetivos' });
  L.almacen({ id: 'd6', x: 437, y: 200, w: 150, codigo: 'D6', nombre: 'Registros y revisiones' });

  // 4 · Planificar
  flujoDeDatos(L, 'pro', 'p4', ['evaluación,', 'objetivo y plan']);
  flujoDeDatos(L, 'd4', 'p4', ['alimentos, recetas', 'y ejercicios']);
  // Sin nombre: el flujo lleva registros completos del almacén (convención de Yourdon).
  L.relacion({ de: 'p4', a: 'd5', fin: 'flecha', inicio: 'flecha' });
  L.relacion({ de: 'p4', a: 'd2', fin: 'flecha', extremoA: 'o', etiqueta: 'proceso abierto' });
  L.relacion({ de: 'p4', a: 'd7', fin: 'flecha', extremoA: 'o', etiqueta: 'novedad' });
  flujoDeDatos(L, 'p4', 'ase', ['plan y', 'agenda']);
  // 5 · Registrar
  flujoDeDatos(L, 'ase', 'p5', ['comidas, sesiones', 'y respuestas']);
  flujoDeDatos(L, 'pro', 'p5', ['tomas y pedidos', 'de información']);
  L.relacion({ de: 'd5', a: 'p5', fin: 'flecha' });
  L.relacion({ de: 'p5', a: 'd6', fin: 'flecha' });
  // 6 · Revisar y analizar
  L.relacion({ de: 'p6', a: 'd6', fin: 'flecha', inicio: 'flecha' });
  flujoDeDatos(L, 'pro', 'p6', ['revisión y notas', 'de coordinación'], { desplazamiento: 7 });
  flujoDeDatos(L, 'p6', 'pro', ['ficha y', 'cartera'], { desplazamiento: 7 });
  flujoDeDatos(L, 'p6', 'ase', 'evolución');
  L.relacion({ de: 'p6', a: 'd2', fin: 'flecha', extremoA: 'e', rotulo: { texto: ['continuidad', 'o cierre'] }, etiqueta: 'continuidad' });
  L.relacion({ de: 'p6', a: 'd7', fin: 'flecha', extremoA: 'e', etiqueta: 'novedad y nota' });

  L.leyenda({ x: 0, y: 422, w: 750, columnas: 5, titulo: null, items: LEYENDA_DFD });
}
