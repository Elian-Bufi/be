// Cuaderno de datos · vista simplificada del área: Antropometría: evaluación, medición, protocolo y cálculo. Tablas elegidas por ser las centrales del área; las
// relaciones las dibuja el compositor desde datos/esquema.json (ninguna se agrega ni se omite entre estas tablas).
import { dibujarVista, metaVista } from './_cuaderno-der.mjs';

export const meta = metaVista("D-14", "Antropometría: evaluación, medición, protocolo y cálculo", "Una evaluación agrupa mediciones hechas con la versión de un protocolo; los cálculos citan las mediciones que usaron.", "sección B-10 (antropometría)");

export function dibujar(L) {
  dibujarVista(L, {
    vista: ["EvaluacionAntropometrica","EjecucionDeCalculo","MedicionAntropometrica","VersionDeEspecificacionAntropometrica","CorreccionDeMedicion","EspecificacionAntropometrica"],
    grilla: {"EvaluacionAntropometrica":[0,0],"EjecucionDeCalculo":[0,1],"MedicionAntropometrica":[1,0],"VersionDeEspecificacionAntropometrica":[1,1],"CorreccionDeMedicion":[2,0],"EspecificacionAntropometrica":[2,1]},
    enfasis: ["MedicionAntropometrica"],
  });
}
