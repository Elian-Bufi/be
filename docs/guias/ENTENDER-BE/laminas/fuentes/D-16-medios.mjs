// Cuaderno de datos · vista simplificada del área: Medios, auditoría e idempotencia. Tablas elegidas por ser las centrales del área; las
// relaciones las dibuja el compositor desde datos/esquema.json (ninguna se agrega ni se omite entre estas tablas).
import { dibujarVista, metaVista } from './_cuaderno-der.mjs';

export const meta = metaVista("D-16", "Medios, auditoría e idempotencia", "Una foto es un medio privado, con su contenido aparte; la auditoría y la idempotencia son tablas de la plataforma, sin relaciones de negocio.", "secciones Historia y WP-NUTRICION-RECETAS");

export function dibujar(L) {
  dibujarVista(L, {
    vista: ["EvidenciaVisualDeIngesta","RegistroDeAuditoria","Medio","ContenidoDeMedio","AsociacionDeImagenDeReceta","RegistroDeIdempotencia"],
    grilla: {"EvidenciaVisualDeIngesta":[0,0],"RegistroDeAuditoria":[0,1],"Medio":[1,0],"ContenidoDeMedio":[1,1],"AsociacionDeImagenDeReceta":[2,0],"RegistroDeIdempotencia":[2,1]},
    enfasis: ["Medio"],
  });
}
