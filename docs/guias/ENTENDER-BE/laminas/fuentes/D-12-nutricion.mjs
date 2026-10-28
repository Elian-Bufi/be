// Cuaderno de datos · vista simplificada del área: Nutrición: objetivo, plan, instantánea y registro. Tablas elegidas por ser las centrales del área; las
// relaciones las dibuja el compositor desde datos/esquema.json (ninguna se agrega ni se omite entre estas tablas).
import { dibujarVista, metaVista } from './_cuaderno-der.mjs';

export const meta = metaVista("D-12", "Nutrición: objetivo, plan, instantánea y registro", "El plan cambia por versiones; al activar una, la instantánea congela la composición; cada comida registrada cita la versión que regía.", "secciones WP-04 (circuito nutricional) y WP-NUTRICION-RECETAS");

export function dibujar(L) {
  dibujarVista(L, {
    vista: ["VersionDeObjetivoNutricional","ObjetivoNutricional","VersionDePlanNutricional","PlanNutricional","InstantaneaDePlanNutricional","IngestaNutricional"],
    grilla: {"VersionDeObjetivoNutricional":[0,0],"ObjetivoNutricional":[0,1],"VersionDePlanNutricional":[1,0],"PlanNutricional":[1,1],"InstantaneaDePlanNutricional":[2,0],"IngestaNutricional":[2,1]},
    enfasis: ["VersionDePlanNutricional"],
  });
}
