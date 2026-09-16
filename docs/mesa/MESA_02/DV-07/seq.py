# -*- coding: utf-8 -*-
exec(open('engine.py').read())
LEGQ=[("rel","Llamada / paso del flujo"),("inc","Retorno o efecto derivado")]
def fseq(W,H,fig,tit,sub,body,notes):
    return svg(W,H,f"Figura {fig} — {tit}",sub,body+legend(40,H-40-(22+len(LEGQ)*21),660,LEGQ,notes))
# ═══ S1 · Revocar consentimiento ═══
Y0,Y1=190,700
L=[("Asesorado",220,"actor"),("UX / API",520,"obj"),("PDP",820,"obj"),
   ("Consentimiento",1120,"obj"),("Vínculo",1420,"obj"),("Auditoría",1700,"obj")]
b=[];X={}
for n,x,k in L:
    s,xx=lifeline(x,Y0,Y1,n,k); b.append(s); X[n]=xx
E=[msg(X["Asesorado"],X["UX / API"],250,"revocar(consentimientoId)"),
   msg(X["UX / API"],X["PDP"],290,"evaluar(7 dimensiones)"),
   msg(X["PDP"],X["UX / API"],325,"titular autorizado","ret"),
   msg(X["UX / API"],X["Consentimiento"],370,"revocar() [versión + evento]"),
   msg(X["Consentimiento"],X["Auditoría"],410,"ConsentimientoRevocado"),
   msg(X["Consentimiento"],X["UX / API"],450,"estado = REVOCADO","ret"),
   msg(X["UX / API"],X["Asesorado"],490,"confirmación sin promesa de borrado","ret")]
b.append(frag(1060,530,1780,650,"note","efectos que NO ocurren en esta transacción"))
for i,t in enumerate(["El Vínculo NO se finaliza: conserva su estado por alcance.",
                      "El B2 NO se revoca por mutación: queda sin capacidad efectiva.",
                      "NO se borra historia dentro de la transacción (08 §13, §16, §17).",
                      "El corte es prospectivo: las operaciones siguientes fallan en el PDP."]):
    b.append(T(1080,572+i*19,t,10.5,C["grey"],500,"start"))
b.append(activ(X["UX / API"],240,500)); b.append(activ(X["Consentimiento"],360,460))
open('source/DV-07_S1_REVOCAR.svg','w').write(fseq(1860,880,"DV-07.S1",
 "Secuencia — Revocar consentimiento (UC-P08)",
 "El corte es prospectivo: revocar no borra, no finaliza el vínculo y no revoca el consentimiento profesional por mutación.",
 "".join(E)+"".join(b),
 ["La autorización se evalúa antes de cualquier efecto: precedencia PDP → schema (09 §20.2.1).",
  "`CON-08` es idempotente: `REVOCADO → REVOCADO` no produce un segundo efecto ni un error.",
  "Reotorgar exige un acto nuevo que preserva la revocación previa.","",
  "Deriva de BE-LEG-05 v0.15 UC-P08 · BE-LEG-06 §7.7 · BE-LEG-08 §13 · BE-LEG-09 CON-08"]))
# ═══ S2 · Anular medición ═══
b=[];X={}
L=[("Profesional",220,"actor"),("UX / API",520,"obj"),("PDP",800,"obj"),
   ("Medición",1080,"obj"),("Cálculo derivado",1380,"obj"),("Evolución",1680,"obj")]
for n,x,k in L:
    s,xx=lifeline(x,Y0,Y1,n,k); b.append(s); X[n]=xx
E=[msg(X["Profesional"],X["UX / API"],250,"anular(mediciónId, motivo)"),
   msg(X["UX / API"],X["PDP"],288,"evaluar(autorización por operación)"),
   msg(X["PDP"],X["UX / API"],322,"profesional autorizado","ret"),
   msg(X["UX / API"],X["Medición"],364,"anular() [VIGENTE ∧ motivo]"),
   msg(X["Medición"],X["Cálculo derivado"],404,"input anulado → reevaluar (REG-06-159)"),
   msg(X["Cálculo derivado"],X["Evolución"],444,"resultado no vigente"),
   msg(X["Evolución"],X["UX / API"],484,"serie con SIN_DATO explícito","ret"),
   msg(X["UX / API"],X["Profesional"],524,"anulada · original preservado","ret")]
b.append(frag(1020,566,1800,682,"note","garantías del legajo en este flujo"))
for i,t in enumerate(["El original NO se borra: queda con condición ANULADA y motivo (RF-050).",
                      "Si no hay inputs suficientes, NO se inventa un sucesor del cálculo.",
                      "La evolución expone SIN_DATO: nunca cero, nunca interpolación (INV-06-176).",
                      "No existe operación de reversión: ANULADA → VIGENTE no está declarada."]):
    b.append(T(1040,608+i*19,t,10.5,C["grey"],500,"start"))
b.append(activ(X["UX / API"],240,534)); b.append(activ(X["Medición"],354,414))
open('source/DV-07_S2_ANULAR.svg','w').write(fseq(1880,900,"DV-07.S2",
 "Secuencia — Anular medición antropométrica (UC-E03)",
 "Anular es condición local: preserva el original, reevalúa dependencias y expone SIN_DATO sin inventar sucesores.",
 "".join(E)+"".join(b),
 ["`REG-06-16 inciso 4`: la anulación es condición local de M-09; no redefine el patrón común B-06.",
  "`REG-06-159`: un input anulado obliga a reevaluar dependencias sin reescribir históricos.",
  "Una nueva observación válida se registra como nueva medición, no como reactivación.","",
  "Deriva de BE-LEG-05 v0.15 UC-E03 · BE-LEG-06 §13 y §20.6 · BE-LEG-09 ANT-12"]))
print("secuencias S1 y S2 ok")
