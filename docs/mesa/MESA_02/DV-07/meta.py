# -*- coding: utf-8 -*-
exec(open('engine.py').read())
b=[];P={}
N={'ENT':(320,250,"Entidad de dominio","T-06-N01"),'ATR':(320,470,"Atributo conceptual","T-06-N03"),
   'IDF':(320,640,"Identificador","T-06-N04"),'REL':(620,150,"Relación","T-06-N02"),
   'MAQ':(640,330,"Máquina de estados","T-06-N07"),'EST':(640,500,"Estado técnico","T-06-N05"),
   'TRN':(940,330,"Transición","T-06-N06"),'EVE':(1240,330,"Evento de dominio","T-06-N08"),
   'INV':(620,650,"Invariante","T-06-N09"),'TAX':(940,500,"Taxonomía cerrada","T-06-N10"),
   'ESP':(940,150,"Especialización","T-06-N11"),'CAL':(1240,500,"Regla de cálculo","T-06-N12"),
   'PRY':(1240,650,"Proyección","T-06-N13"),'FUE':(940,650,"Fuente de verdad","T-06-N19"),
   'UNI':(320,150,"Criterio de unicidad","T-06-N14"),'EQU':(1520,150,"Criterio de equivalencia","T-06-N15"),
   'AMB':(1520,330,"Ámbito","T-06-N16"),'PER':(1520,500,"Persistencia conceptual","T-06-N17"),
   'AUT':(1520,650,"Autoría","T-06-N18")}
for k,(x,y,lab,tid) in N.items():
    w=226; h=52
    s,p=box(x,y,w,h,lab,tid,[],"ver" if k in('UNI','EQU','AMB','PER','AUT') else "ent")
    b.append(s); P[k]=(x,y,w/2,h/2)
LNK=[('ENT','ATR','1','1..N',"tiene"),('ENT','IDF','1','1',"se identifica por"),('ENT','REL','','',"participa en"),
     ('ENT','MAQ','1','0..1',"puede tener"),('MAQ','EST','1','2..N',"declara"),('MAQ','TRN','1','1..N',"declara"),
     ('TRN','EVE','1','0..1',"emite"),('TRN','EST','','',"origen → destino"),('ENT','INV','','',"sujeta a"),
     ('EST','TAX','','',"pertenece a"),('ENT','ESP','','',"admite"),('CAL','FUE','','',"produce dato de"),
     ('PRY','FUE','','',"deriva de, nunca la reemplaza"),('ENT','FUE','','',"es"),('ENT','UNI','','',"aplica"),
     ('REL','EQU','','',"usa"),('MAQ','AMB','','',"opera en"),('ENT','PER','','',"declara"),('ENT','AUT','','',"conserva")]
E=[]
for a,bb,ca,cb,lab in LNK:
    st="dash" if lab in("deriva de, nunca la reemplaza","produce dato de") else "solid"
    E.append(rel(P[a],P[bb],ca,cb,lab,st))
notes=["Cada clase de las vistas DV-07.1 a DV-07.8 instancia uno o varios de estos constructos.",
 "`T-06-N12` Regla de cálculo es la única definición transversal de cálculo reproducible (`INV-06-211`).",
 "`T-06-N13` Proyección deriva de la fuente de verdad y nunca la reemplaza (`CONV-06-09`).",
 "Toda transición no declarada en la máquina está prohibida: no hay transiciones implícitas.","",
 "Derivado de BE-LEG-06 v0.1.1 B-00 §3 · sin cambio semántico"]
LEGM=[("rect","Constructo estructural"),("rectv","Constructo de gobierno"),("rel","Relación entre constructos")]
lg=legend(40,760-40-(22+len(LEGM)*21),660,LEGM,notes)
open('source/DV-07_C0_METAMODELO.svg','w').write(svg(1760,900,
 "Figura DV-07.0 — Metamodelo del dominio: los diecinueve constructos raíz (B-00)",
 "Las categorías con que el Documento 06 construye todo lo demás, y cómo se relacionan entre sí.",
 "".join(E)+"".join(b)+legend(40,760,660,LEGM,notes)))
print("metamodelo:",len(P),"constructos,",len(LNK),"relaciones")
