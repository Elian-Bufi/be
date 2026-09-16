# -*- coding: utf-8 -*-
import json
exec(open('build.py').read())
R=[]
# 04.4 Nutrición
R.append(build_seq('DV-04_04_NUTRICION.puml','DV-04.4','Nutrición',
 'Circuito nutricional: cinco casos principales en secuencia, con sus casos incluidos.',
 ['UC-P09','UC-P10','UC-P11','UC-P12','UC-P13'],
 {'UC-I13':(0,'up',30),'UC-I07':(1,'up',30),'UC-I08':(1,'down',30),'UC-I04':(2,'up',30),
  'UC-I10':(2,'down',30),'UC-I05':(4,'up',30),'UC-I06':(4,'down',30)},
 {'ACT_PRO':(118,330,600,['UC-P09','UC-P10','UC-P11','UC-P13']),'ACT_ASES':(1010,666,612,['UC-P12'])},W=1600,H=900))
# 04.5 Entrenamiento
R.append(build_seq('DV-04_05_ENTRENAMIENTO.puml','DV-04.5','Entrenamiento',
 'Circuito de entrenamiento: mismo patrón que Nutrición, con corrección trazable de la ejecución.',
 ['UC-P14','UC-P15','UC-P16','UC-P17','UC-P18'],
 {'UC-I13':(0,'up',30),'UC-I12':(0,'down',30),'UC-I07':(1,'up',30),'UC-I08':(1,'down',30),
  'UC-I04':(2,'up',30),'UC-I10':(2,'down',30),'UC-E02':(3,'down',30),'UC-I05':(4,'up',30),'UC-I06':(4,'down',10)},
 {'ACT_PRO':(118,330,600,['UC-P14','UC-P15','UC-P16','UC-P18']),'ACT_ASES':(1010,666,612,['UC-P17'])},W=1700,H=900))
# 04.3 Vínculo
R.append(build_seq('DV-04_03_VINCULO_CONSENT.puml','DV-04.3','Vínculo, consentimiento y autorización',
 'Del vínculo al consentimiento: solicitud, aceptación, otorgamiento, revocación y gestión del vínculo.',
 ['UC-P04','UC-P05','UC-P07','UC-P08','UC-P06'],
 {},
 {'ACT_PRO':(118,330,520,['UC-P04','UC-P06']),'ACT_ASES':(790,600,548,['UC-P05','UC-P07','UC-P08'])},W=1500,H=760))
# 04.2 Verificación
R.append(build_seq('DV-04_02_VERIFICACION_ADMIN.puml','DV-04.2','Verificación profesional y administración',
 'Alta escalonada, resolución de la verificación y administración de habilitaciones.',
 ['UC-P01','UC-P02','UC-P03'],
 {'UC-I01':(0,'up',30),'UC-E01':(0,'down',30),'UC-I10':(2,'up',30),'UC-P28':(2,'down',30),'UC-P29':(2,'down',200)},
 {'ACT_PRO':(118,330,600,['UC-P01']),'ACT_ADM':(706,666,612,['UC-P02','UC-P03'])},W=1500,H=880))
# 04.1 Identidad
R.append(build_seq('DV-04_01_IDENTIDAD_CUENTA.puml','DV-04.1','Identidad y cuenta',
 'Ciclo de la cuenta propia: registro, sesión y cierre, con sus vías alternativas de acceso.',
 ['UC-P25','UC-P26','UC-P27'],
 {'UC-E05':(1,'up',-40),'UC-E06':(1,'up',150),'UC-E09':(1,'down',30)},
 {'ACT_ASES':(118,330,600,['UC-P25','UC-P26','UC-P27'])},W=1320,H=880))
# 04.6 Antropometría
R.append(build_seq('DV-04_06_ANTROPOMETRIA.puml','DV-04.6','Antropometría',
 'Capacidad transversal: registro y evolución; y descubrimiento limitado que deriva en solicitud de vínculo.',
 ['UC-P19','UC-P20'],
 {'UC-I09':(0,'up',30),'UC-E03':(0,'down',30),'UC-I10':(1,'up',30),'UC-I12':(1,'down',30),
  'UC-P21':(1,'up',330),'UC-P22':(1,'down',330),'UC-E04':(1,'down',560)},
 {'ACT_PRO':(118,330,600,['UC-P19','UC-P20']),'ACT_ASES':(1190,672,618,['UC-P22'])},W=1660,H=900))
for f,(n,e,o) in zip(['04.4','04.5','04.3','04.2','04.1','04.6'],R): print(f,'nodos',n,'aristas',e,'transv_omit',o)

# ── vistas sin secuencia natural: layout por agrupación ──
def build_grid(f,fig,tit,sub,groups,acts,W,H):
    d=INV[f]; body=[];pos={};edges=[]
    YT=150; colw=(W-200)//max(1,len(groups))
    for gi,(gname,items) in enumerate(groups):
        cx=140+gi*colw+colw//2
        body.append(T(cx,YT-34,gname,12.5,C["grey"],700))
        body.append(f'<line x1="{cx-colw//2+30}" y1="{YT-24}" x2="{cx+colw//2-30}" y2="{YT-24}" stroke="{C["line"]}"/>')
        for i,u in enumerate(items):
            kind="ext" if u.startswith("UC-E") else ("main" if u.startswith("UC-P") else "inc")
            s,p=node(cx,YT+40+i*106,u,SHORT[u],kind); body.append(s); pos[u]=p
    om=0
    for a,b in d['inc']:
        if b in TRANSV: om+=1; continue
        if a in pos and b in pos: edges.append(e_inc(pos[a],pos[b]))
    for a,b in d['ext']:
        if a in pos and b in pos: edges.append(e_ext(pos[a],pos[b]))
    A=[]
    for an,(ax,ay,lane,tg) in acts.items():
        A.append(actor(ax,ay,ACTN[an]))
        for t in tg:
            if t in pos: edges.insert(0,e_act(ax,ay,pos[t],lane))
    items=[("inc","«include» hacia el caso incluido")]
    if d['ext']: items.append(("ext","«extend» — extiende el caso base"))
    items+=[("main","Caso principal — lo ejecuta un actor"),("incn","Caso incluido — lo invoca otro caso")]
    if d['ext']: items.append(("extn","Caso de extensión"))
    notes=["Vista sin secuencia natural: los casos se agrupan por materia.",
           "Los casos principales incluyen además UC-I02, UC-I03, UC-I11." if om else "",
           "Relaciones completas en DV-04_RELACIONES_UML.csv.",
           "Nombres canónicos completos en DV-04_UC_INDICE.md.","",
           "Derivado de BE-LEG-05 v0.15 · sin cambio semántico · estado: BASELINE"]
    lg=legend(40,H-40-(22+len(items)*21),600,items,[n for n in notes])
    open('source/'+f.replace('.puml','.svg'),'w').write(svg(W,H,f"Figura {fig} — {tit}",sub,"".join(edges)+"".join(body)+"".join(A)+lg))
    return len(pos),len(edges),om

print(build_grid('DV-04_07_CARTERA_DASHBOARD.puml','DV-04.7','Cartera, dashboard y coordinación',
 'Superficies de consulta del profesional y del asesorado, más coordinación y novedades.',
 [("Cartera y revisión",["UC-P23"]),("Dashboard y línea temporal",["UC-P24","UC-E07"]),
  ("Solicitudes de información",["UC-P32","UC-P33"]),("Novedades",["UC-P30","UC-E08"]),("Progreso propio",["UC-P31"])],
 {'ACT_PRO':(90,300,690,['UC-P23','UC-P24','UC-P32']),'ACT_ASES':(90,470,700,['UC-P31','UC-P33'])},1560,840))

print(build_grid('DV-04_08_INCLUIDOS_SOPORTE.puml','DV-04.8','Casos incluidos transversales y soporte analítico',
 'Catorce casos invocados por otros casos: no los ejecuta un actor directamente.',
 [("Autorización e historia",["UC-I02","UC-I03","UC-I01"]),("Planes y versiones",["UC-I04","UC-I12"]),
  ("Revisión y continuidad",["UC-I05","UC-I06"]),("Integraciones",["UC-I07","UC-I08"]),
  ("Capacidad y cálculo",["UC-I09","UC-I10","UC-I13"]),("Superficie y analítica",["UC-I11","UC-S01"])],
 {},1560,700))
