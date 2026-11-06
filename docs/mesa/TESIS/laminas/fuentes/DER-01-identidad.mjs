// DER · Identidad, acceso y sesión (M-01 del 06, sesiones del 07 §43-bis y el cierre de cuenta). Filas y relaciones:
// datos/esquema.json. Reglas que Prisma no expresa: migraciones de identidad y sesiones (unicidad del correo normalizado,
// una sola credencial local por método, sesión revocable y reanudación encadenada).
import { dibujarVistaDer, metaDer } from './_der-comun.mjs';

export const meta = metaDer('DER-01', {
  alcance: 'Quién es cada persona en BE, cómo entra y cómo termina su cuenta. Toda otra vista apunta a Identidad.',
  fuente: 'secciones M-01, Sesiones e Historia',
  ancho: 750,
  alto: 456,
});

export function dibujar(L) {
  dibujarVistaDer(
    L,
    'DER-01',
    {
      area: { x: 8, y: 8, w: 734, h: 400 },
      grilla: {
        PerfilPropio: [0, 0],
        VersionDePerfilPropio: [0, 1],
        RegistroDeSupresion: [0, 2],
        ControlDeSesion: [1, 0],
        Identidad: [1, 1],
        SolicitudDeCierreDeCuenta: [1, 2],
        MetodoDeAcceso: [2, 0],
        Sesion: [2, 1],
        ReanudacionDeSesion: [2, 2],
        CredencialLocal: [3, 0],
      },
      maximo: 4,
      separacionFilas: 42,
      enfasis: ['Identidad'],
    },
    {
      notas: { columna: 3, desdeFila: 1, limite: 414 },
      propias: [{ titulo: 'La base lo garantiza', texto: 'El par (tipo, referencia) de un acceso es único en todo el sistema, también con cuentas cerradas. Un correo es de una sola identidad y hay a lo sumo un acceso con Google por identidad (DL-138). Cada reanudación tiene a lo sumo una sucesora (DL-147). El registro de supresiones solo agrega filas.' }],
      leyenda: { x: 8, y: 422, w: 734 },
    },
  );
}
