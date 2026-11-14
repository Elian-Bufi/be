// DER · Antropometría y cálculos (B-10 del 06 §13 y §20). Filas y relaciones: datos/esquema.json. Reglas: la medición
// directa y el resultado derivado se distinguen; una corrida nueva no sobrescribe la anterior (REG-06-205); la referencia
// profesional no muta la corrida (REG-06-207); corregir y anular agregan filas.
import { dibujarVistaDer, metaDer } from './_der-comun.mjs';

export const meta = metaDer('DER-11', {
  alcance: 'Protocolos y métodos versionados, la toma con sus mediciones, los cálculos reproducibles y su corrección sin borrar.',
  fuente: 'sección B-10 · Antropometría',
});

export function dibujar(L) {
  dibujarVistaDer(
    L,
    'DER-11',
    {
      area: { x: 24, y: 24, w: 718, h: 388 },
      grilla: {
        EspecificacionAntropometrica: [0, 0],
        RetiroDeEspecificacion: [0, 1],
        CorreccionDeMedicion: [0, 2],
        VersionDeEspecificacionAntropometrica: [1, 0],
        MedicionAntropometrica: [1, 1],
        AnulacionDeMedicion: [1, 2],
        EvaluacionAntropometrica: [2, 0],
        EjecucionDeCalculo: [2, 1],
        EntradaDeCalculo: [2, 2],
        EventoDeAntropometria: [3, 0],
        ReferenciaDeCalculo: [3, 1],
      },
      maximo: 3,
      separacionFilas: 22,
      enfasis: ['MedicionAntropometrica', 'EjecucionDeCalculo'],
    },
    {
      notas: { columna: 3, desdeFila: 2, limite: 414 },
      propias: [
        {
          titulo: 'Reproducible',
          texto: 'Cada corrida cita la versión exacta del método y sus entradas; una corrida nueva no reemplaza a la anterior.',
        },
      ],
      leyenda: { x: 8, y: 422, w: 734 },
    },
  );
}
