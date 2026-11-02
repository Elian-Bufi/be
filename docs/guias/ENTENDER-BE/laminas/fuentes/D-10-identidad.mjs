// Cuaderno de datos · vista simplificada del área: Identidad, sesiones y Administración. Tablas elegidas por ser las centrales del área; las
// relaciones las dibuja el compositor desde datos/esquema.json (ninguna se agrega ni se omite entre estas tablas).
import { dibujarVista, metaVista } from './_cuaderno-der.mjs';

export const meta = metaVista("D-10", "Identidad, sesiones y Administración", "La identidad en el centro: sus sesiones, su segundo factor, su rol administrativo y la verificación y habilitación por área de un profesional.", "secciones M-01, Sesiones, WP-03 (M-02) y WP-ADMINISTRACION");

export function dibujar(L) {
  dibujarVista(L, {
    vista: ["VerificacionProfesional","Habilitacion","Identidad","RolAdministrativo","Sesion","FactorTotp"],
    grilla: {"VerificacionProfesional":[0,0],"Habilitacion":[0,1],"Identidad":[1,0],"RolAdministrativo":[1,1],"Sesion":[2,0],"FactorTotp":[2,1]},
    enfasis: ["Identidad"],
  });
}
