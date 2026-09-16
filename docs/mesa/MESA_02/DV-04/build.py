# -*- coding: utf-8 -*-
import json,os
exec(open('engine.py').read())
TRANSV={"UC-I02","UC-I03","UC-I11"}
SHORT=json.load(open('short.json')) if os.path.exists('short.json') else {}
INV=json.load(open('/home/claude/demo/inv2.json'))
ACTN={'ACT_ASES':'Asesorado','ACT_PRO':'Profesional','ACT_ADM':'Administrador','ACT_SYS':'Sistema BE'}

def build_seq(f,fig,tit,sub,seq,sat,acts_pos,W=1600,H=820,x0=300,dx=None):
    d=INV[f]; body=[];pos={}
    dx = dx or (W-x0-160)//max(1,len(seq)-1)
    YC=int(H*0.43)
    for i,u in enumerate(seq):
        s,p=node(x0+i*dx,YC,u,SHORT[u],"main"); body.append(s); pos[u]=p
    for u,(i,side,off) in sat.items():
        kind = "ext" if u.startswith("UC-E") else "inc"
        y = YC-172 if side=="up" else YC+172
        s,p=node(x0+i*dx+off,y,u,SHORT[u],kind); body.append(s); pos[u]=p
    edges=[]
    for a,b in zip(seq,seq[1:]): edges.append(e_seq(pos[a],pos[b]))
    omitted=0
    for a,b in d['inc']:
        if b in TRANSV: omitted+=1; continue
        if a in pos and b in pos: edges.append(e_inc(pos[a],pos[b]))
    for a,b in d['ext']:
        if a in pos and b in pos: edges.append(e_ext(pos[a],pos[b]))
    A=[]
    for an,(ax,ay,lane,targets) in acts_pos.items():
        A.append(actor(ax,ay,ACTN[an]))
        for t in targets:
            if t in pos: edges.insert(0,e_act(ax,ay,pos[t],lane))
    items=[("seq","Secuencia del circuito — orden del proceso, no relación UML"),
           ("inc","«include» hacia el caso incluido")]
    if d['ext']: items.append(("ext","«extend» — extiende el caso base"))
    items += [("main","Caso principal — lo ejecuta un actor"),("incn","Caso incluido — lo invoca otro caso")]
    if d['ext']: items.append(("extn","Caso de extensión"))
    notes=[]
    if omitted: notes.append(f"Los casos principales incluyen además {', '.join(sorted(TRANSV))}.")
    notes += ["No se dibujan para preservar legibilidad: están en DV-04_RELACIONES_UML.csv.",
              "Nombres canónicos completos en DV-04_UC_INDICE.md.","",
              "Derivado de BE-LEG-05 v0.15 · sin cambio semántico · estado: BASELINE"]
    lg=legend(40,H-40-(22+len(items)*21),600,items,notes)
    open('source/'+f.replace('.puml','.svg'),'w').write(svg(W,H,f"Figura {fig} — {tit}",sub,"".join(edges)+"".join(body)+"".join(A)+lg))
    return len(seq)+len(sat), len(edges), omitted
