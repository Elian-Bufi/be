// Cuaderno de datos · vista simplificada del área: Vínculos, consentimientos y decisiones de acceso. Tablas elegidas por ser las centrales del área; las
// relaciones las dibuja el compositor desde datos/esquema.json (ninguna se agrega ni se omite entre estas tablas).
import { dibujarVista, metaVista } from './_cuaderno-der.mjs';

export const meta = metaVista("D-11", "Vínculos, consentimientos y decisiones de acceso", "Un vínculo entre dos identidades se abre por área (alcance); cada alcance tiene su autorización, versionada; el PDP guarda cada decisión.", "sección WP-03 (M-03 y PDP)");

export function dibujar(L) {
  dibujarVista(L, {
    vista: ["Vinculo","SolicitudDeVinculo","AlcanceDeVinculo","DecisionDeAcceso","Consentimiento","VersionDeConsentimiento"],
    grilla: {"Vinculo":[0,0],"SolicitudDeVinculo":[0,1],"AlcanceDeVinculo":[1,0],"DecisionDeAcceso":[1,1],"Consentimiento":[2,0],"VersionDeConsentimiento":[2,1]},
    enfasis: ["AlcanceDeVinculo"],
  });
}
