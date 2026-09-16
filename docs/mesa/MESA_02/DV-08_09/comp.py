# -*- coding: utf-8 -*-
exec(open('engine.py').read())
ROT="COMPONENTES OBJETIVO SEGÚN BE-LEG-07 — CÓDIGO NO VERIFICADO"
LEGC=[("rect","Componente de dominio"),("rectv","Componente transversal"),("rectx","Adaptador externo"),("rel","Dependencia declarada")]
def fc(W,H,fig,tit,sub,body,notes):
    return svg(W,H,f"Figura {fig} — {tit}",sub,body+legend(40,H-40-(22+len(LEGC)*21),690,LEGC,notes)+badge(40,H-22,ROT))
b=[];P={}
def cp(k,x,y,w,h,name,fam,area,kind="cont"):
    s,p=c4(x,y,w,h,name,fam,area,kind); b.append(s); P[k]=p
b.append(boundary(300,150,1800,720,"API BE (NestJS) — un solo despliegue"))
# fila transversal superior
cp('EDGE',480,225,230,96,"Borde HTTP","guards · pipes · filter","correlación · rate limit","sys")
cp('PDP',790,225,230,96,"PDP — autorización","7 dimensiones","por operación, sin caché","sys")
cp('AUDIT',1100,225,230,96,"Auditoría de acceso","interceptor + servicio","bloqueante, en transacción","sys")
cp('EMIS',1380,225,220,96,"Emisión de eventos","servicio núcleo","evento + detalle en la misma tx","sys")
# fila de dominio
cp('ID',430,420,205,92,"Identidad y acceso","ACC","M-01")
cp('VER',680,420,205,92,"Verificación","PRO","M-02")
cp('VIN',930,420,205,92,"Vínculos y consent.","REL · CON · FRM","M-03")
cp('CAP',1180,420,205,92,"Habilitación y capacidad","PRO","M-05")
cp('PROC',1400,420,195,92,"Procesos operativos","—","M-04")
cp('NUT',430,580,205,92,"Nutrición","NUT · INT-NUT","M-07")
cp('ENT',680,580,205,92,"Entrenamiento","TRN · INT-TRN","M-08")
cp('ANT',930,580,205,92,"Antropometría","ANT","M-09")
cp('REV',1180,580,205,92,"Revisión y continuidad","—","M-10")
cp('READ',1400,580,195,92,"Proyecciones","DSH · PRJ · CRD","M-11")
# fuera del boundary
cp('MOT',1680,420,195,96,"Motores de cálculo","MTH · CAL","puros, sin estado","sys")
cp('ANA',1680,580,195,96,"Analítica TVCC-30","ANA-P1","M-12 · on-read","sys")
cp('ADAPT',1680,225,195,96,"Puertos y adaptadores","OFF · wger · IdP · Push","timeout · fallback · procedencia","ext")
cp('TEMP',150,420,190,96,"Motor temporal","servicio","ventanas · gracia · caducidad","sys")
cp('DB',150,600,190,92,"PostgreSQL","Prisma","","db")
DEP=[('EDGE','PDP',"invoca por request protegida"),('PDP','DB',"consulta contexto vigente"),
     ('NUT','EMIS',"emite en tx"),('ENT','EMIS',"emite en tx"),('ANT','EMIS',"emite en tx"),
     ('REV','EMIS',"emite en tx"),('PROC','EMIS',"emite en tx"),('EMIS','DB',""),
     ('READ','DB',"solo lectura"),('NUT','MOT',"calcula"),('ENT','MOT',"calcula"),('ANT','MOT',"calcula"),
     ('NUT','ADAPT',"importa con fallback"),('ENT','ADAPT',"importa con fallback"),
     ('CAP','TEMP',"ventanas / gracia"),('AUDIT','DB',"escribe en tx")]
E=[rel4(P[a],P[b_],t,"") for a,b_,t in DEP]
open('source/DV-09_1_COMPONENTES.svg','w').write(fc(1980,900,"DV-09.1","C4 nivel 3 — Componentes del backend",
 "Dieciocho componentes en un solo despliegue. Cada uno declara la familia API que expone y el área de dominio que gobierna.",
 "".join(E)+"".join(b),
 ["Cross-cutting en azul suave: borde HTTP, PDP (`ASR-06`), auditoría (`ASR-07`), emisión (`ASR-01`), motor temporal (`ASR-14`).",
  "Frontera transaccional = límite del componente de emisión: mutar agregados y publicar eventos ocurre en una sola transacción Prisma.",
  "Proyecciones acceden a la base solo en lectura: son derivadas y no tienen autoridad de escritura (`CONV-06-09`).",
  "Los motores de cálculo son puros y sin estado: módulo compartido único, deterministas.","",
  "Derivado de BE-LEG-07 v0.1.11 §18 · sin cambio semántico"]))
print("DV-09.1:",len(P),"componentes,",len(DEP),"dependencias")
