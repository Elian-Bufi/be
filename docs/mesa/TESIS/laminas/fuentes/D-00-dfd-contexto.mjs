// Diagrama de flujo de datos de contexto (nivel 0, Yourdon y DeMarco): BE como un solo proceso y las seis entidades
// externas con las que intercambia datos. Los flujos son compuestos; el nivel 1 (D-01 a D-03) los descompone, y la
// tabla de balanceo del anexo D dice dónde reaparece cada uno.
import { flujoDeDatos, LEYENDA_DFD } from './_dfd-comun.mjs';

export const meta = {
  id: 'D-00',
  titulo: 'DFD de contexto (nivel 0)',
  alcance: 'BE como un único proceso y los datos que intercambia con personas y sistemas externos.',
  fuente: 'ARQ-01 · apps/api/src (acceso-google, novedades, integraciones, analitica) · render.yaml',
  estado: 'implementado',
  ancho: 750,
  alto: 456,
};

export function dibujar(L) {
  L.proceso({ id: 'be', cx: 375, cy: 205, r: 66, numero: 0, nombre: 'BE: seguimiento profesional' });
  const ext = (id, x, y, tipo, titulo, tecnologia) => L.caja({ id, x, y, w: 150, tipo, titulo, tecnologia });
  ext('pro', 16, 52, 'persona', 'Profesional', 'website');
  ext('ase', 16, 296, 'persona', 'Asesorado', 'APK');
  ext('val', 300, 352, 'persona', 'Responsable de validación', 'comando interno');
  ext('goo', 584, 24, 'externo', 'Google', 'identidad');
  ext('exp', 584, 178, 'externo', 'Expo Push y FCM', 'avisos');
  ext('cat', 584, 318, 'externo', 'Open Food Facts y wger', 'catálogos abiertos');

  flujoDeDatos(L, 'pro', 'be', ['credenciales', 'e indicaciones'], { desplazamiento: 8 });
  flujoDeDatos(L, 'be', 'pro', ['sesión, invitación,', 'ficha y novedades'], { desplazamiento: 8 });
  flujoDeDatos(L, 'ase', 'be', ['credenciales, decisiones,', 'registros y preferencias'], { desplazamiento: 8 });
  flujoDeDatos(L, 'be', 'ase', ['sesión, plan, agenda,', 'evolución y novedades'], { desplazamiento: 8 });
  flujoDeDatos(L, 'val', 'be', ['pedido de', 'medición'], { desplazamiento: 8 });
  flujoDeDatos(L, 'be', 'val', ['resultado de', 'la TVCC-30'], { desplazamiento: 8 });
  flujoDeDatos(L, 'goo', 'be', ['claves públicas'], {});
  flujoDeDatos(L, 'be', 'exp', ['aviso sin datos', 'de salud'], { desplazamiento: 8 });
  flujoDeDatos(L, 'exp', 'be', ['resultado', 'del envío'], { desplazamiento: 8 });
  flujoDeDatos(L, 'be', 'cat', ['código de barras', 'o número'], { desplazamiento: 8 });
  flujoDeDatos(L, 'cat', 'be', ['datos del producto', 'o del ejercicio'], { desplazamiento: 8 });

  L.leyenda({ x: 0, y: 422, w: 750, columnas: 5, titulo: null, items: LEYENDA_DFD });
}
