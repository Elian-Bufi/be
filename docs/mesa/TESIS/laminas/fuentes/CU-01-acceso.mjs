// Casos de uso de acceso y cuenta (UML). Fuente: 05 v0.15 §12 (UC-P25 a UC-P27, UC-E05, UC-E06, UC-E09) y su índice
// (E05, E06 y E09 extienden UC-P26; UC-I11 lo incluyen UC-P25 y UC-P26, declarado en la nota). Composición a mano: el
// asesorado y el profesional a cada lado de la columna central, para que sus asociaciones no se crucen.
import { tipoDeCaso, ROTULO } from '../motor/casos.mjs';
import { leyendaDeCasos } from './_leyenda-casos.mjs';

export const meta = {
  id: 'CU-01',
  titulo: 'Casos de uso · Acceso y cuenta',
  alcance: 'Registro, sesión y cierre de la cuenta, y las extensiones de la sesión: Google, métodos de acceso y recuperación.',
  fuente: '05 v0.15 §12 y su índice de relaciones · datos/estado.json',
  estado: 'implementado con pendientes',
  ancho: 728,
  alto: 448,
};

export function dibujar(L) {
  L.marco({ id: 'limite', x: 122, y: 6, w: 484, h: 388, titulo: 'BE', subtitulo: 'límite del sistema' });
  const caso = (uc, cx, cy, w = 160) => {
    const { tipo, estado } = tipoDeCaso(uc);
    L.casoDeUso({ id: uc, cx, cy, w, idTexto: uc, titulo: ROTULO[uc], tipo });
    if (estado === 'parcial' || estado === 'pendiente' || estado === 'fuera') L.etiquetaDeEstado(uc, estado === 'fuera' ? 'fuera de alcance' : estado, 'pendiente');
  };
  caso('UC-P25', 364, 72);
  caso('UC-P27', 364, 156);
  caso('UC-P26', 364, 242);
  caso('UC-E05', 210, 344, 144);
  caso('UC-E06', 364, 344, 144);
  caso('UC-E09', 518, 344, 144);

  L.actor({ id: 'as', cx: 58, y: 132, nombre: 'Asesorado' });
  L.actor({ id: 'pr', cx: 670, y: 132, nombre: 'Profesional' });
  L.actor({ id: 'google', cx: 58, y: 300, nombre: 'Google', tipo: 'externo' });

  for (const uc of ['UC-P25', 'UC-P27', 'UC-P26']) {
    L.relacion({ de: 'as', a: uc, extremoA: 'o' });
    L.relacion({ de: 'pr', a: uc, extremoA: 'e' });
  }
  L.relacion({ de: 'google', a: 'UC-E05', extremoA: 'o' });
  // «extend»: de la extensión hacia el caso base, que recibe las tres flechas por abajo.
  L.relacion({ de: 'UC-E05', a: 'UC-P26', estilo: 'discontinuo', fin: 'flecha', palabra: 'extend', angDe: 300, angA: 128 });
  L.relacion({ de: 'UC-E06', a: 'UC-P26', estilo: 'discontinuo', fin: 'flecha', palabra: 'extend', angDe: 270, angA: 90 });
  L.relacion({ de: 'UC-E09', a: 'UC-P26', estilo: 'discontinuo', fin: 'flecha', palabra: 'extend', angDe: 240, angA: 52 });

  leyendaDeCasos(L, { y: 400, extend: true, estados: true, columnas: 2, nota: 'UC-P25 y UC-P26 incluyen UC-I11 y UC-I03' });
}
