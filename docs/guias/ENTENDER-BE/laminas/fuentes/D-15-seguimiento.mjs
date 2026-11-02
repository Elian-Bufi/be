// Cuaderno de datos · vista simplificada del área: Procesos y revisiones. Tablas elegidas por ser las centrales del área; las
// relaciones las dibuja el compositor desde datos/esquema.json (ninguna se agrega ni se omite entre estas tablas).
import { dibujarVista, metaVista } from './_cuaderno-der.mjs';

export const meta = metaVista("D-15", "Procesos y revisiones", "Un proceso operativo por profesional, persona y área; sus revisiones y los hechos del proceso, que las aplican.", "sección WP-04 (proceso operativo) y WP-NOTAS-DE-COORDINACION");

export function dibujar(L) {
  dibujarVista(L, {
    vista: ["RevisionNutricional","AplicacionDeRevision","ProcesoOperativo","EventoDeProceso","RevisionDeEntrenamiento","NotaDeCoordinacion"],
    grilla: {"RevisionNutricional":[0,0],"AplicacionDeRevision":[0,1],"ProcesoOperativo":[1,0],"EventoDeProceso":[1,1],"RevisionDeEntrenamiento":[2,0],"NotaDeCoordinacion":[2,1]},
    enfasis: ["ProcesoOperativo"],
  });
}
