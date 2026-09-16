# -*- coding: utf-8 -*-
exec(open('engine.py').read())
import json,csv,re
RECON="ESTADO: CONCEPTUAL — A RECONCILIAR CON REPOSITORIO (B-11 · H-07-DOM-01)"
LEG=[("rect","Entidad propietaria del área"),("rectv","Entidad versionada — patrón M-06"),
     ("rectx","Entidad de otra área — referenciada"),("rel","Relación con cardinalidad")]
REL=[]   # registro para el CSV: origen,destino,card_o,card_d,tipo,regla,texto
def ent(x,y,w,name,tid,attrs,pk=None,kind="ent",note=None):
    """attrs: lista de (nombre, tipo conceptual, marca PK/FK)"""
    rows=[]
    for a,t,mk in attrs:
        m={'PK':'ᴾᴷ ','FK':'ᶠᵏ ','':''}[mk]
        rows.append(f"{m}{a} ({t})")
    return box(x,y,w,44+len(rows)*15,name,tid,rows,kind,note)
def R(a,b,ca,cb,tipo,regla,texto,label=""):
    REL.append([a[0],b[0],ca,cb,tipo,regla,texto])
    return rel(a[1],b[1],ca,cb,label or "", "dash" if tipo in("dependencia","referencia") else "solid")
def frame(W,H,fig,tit,sub,body,notes,recon=True):
    lg=legend(40,H-40-(22+len(LEG)*21),640,LEG,notes)
    return svg(W,H,f"Figura {fig} — {tit}",sub,body+lg+(badge(40,H-22,RECON) if recon else ""))
