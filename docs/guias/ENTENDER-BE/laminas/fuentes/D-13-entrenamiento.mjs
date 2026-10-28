// Cuaderno de datos · vista simplificada del área: Entrenamiento: objetivo, plan, instantánea y ejecución. Tablas elegidas por ser las centrales del área; las
// relaciones las dibuja el compositor desde datos/esquema.json (ninguna se agrega ni se omite entre estas tablas).
import { dibujarVista, metaVista } from './_cuaderno-der.mjs';

export const meta = metaVista("D-13", "Entrenamiento: objetivo, plan, instantánea y ejecución", "La misma forma que Nutrición: versiones del plan, una instantánea al activar y ejecuciones que citan la versión.", "sección WP-06 (circuito de entrenamiento)");

export function dibujar(L) {
  dibujarVista(L, {
    vista: ["VersionDeObjetivoDeEntrenamiento","ObjetivoDeEntrenamiento","VersionDePlanDeEntrenamiento","PlanDeEntrenamiento","InstantaneaDePlanDeEntrenamiento","EjecucionDeEntrenamiento"],
    grilla: {"VersionDeObjetivoDeEntrenamiento":[0,0],"ObjetivoDeEntrenamiento":[0,1],"VersionDePlanDeEntrenamiento":[1,0],"PlanDeEntrenamiento":[1,1],"InstantaneaDePlanDeEntrenamiento":[2,0],"EjecucionDeEntrenamiento":[2,1]},
    enfasis: ["VersionDePlanDeEntrenamiento"],
  });
}
