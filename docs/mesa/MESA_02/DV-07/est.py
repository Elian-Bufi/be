# -*- coding: utf-8 -*-
exec(open('engine.py').read())
LEGS=[("rel","Transición declarada en la lista blanca"),("rect","Estado del conjunto cerrado")]
def fest(W,H,fig,tit,sub,body,notes):
    lg=legend(40,H-40-(22+len(LEGS)*21),660,LEGS,notes)
    return svg(W,H,f"Figura {fig} — {tit}",sub,body+lg)
# ═══ E1 · Estado operativo de cuenta (§5.7) ═══
b=[];P={}
b.append(initial_dot(150,300))
s,P['OP']=state(360,300,"OPERATIVA"); b.append(s)
s,P['SU']=state(760,300,"SUSPENDIDA"); b.append(s)
s,P['CE']=state(1160,300,"CERRADA",kind="final"); b.append(s)
E=[f'<path d="M158 300L{360-76-9} 300" stroke="{C["blue"]}" stroke-width="1.7" fill="none" marker-end="url(#ab)"/>',
   T(255,288,"registro exitoso",10,C["green"],600),
   trans(P['OP'],P['SU'],"SuspenderCuenta","fundamento válido según política 08","CuentaSuspendida",-52),
   trans(P['SU'],P['OP'],"RestablecerCuenta","cesó o fue resuelta la condición","CuentaRestablecida",52),
   trans(P['OP'],P['CE'],"CerrarCuenta","titular con sesión válida ∧ confirmación explícita","CuentaCerrada",150)]
b.append(f'<rect x="620" y="540" width="700" height="74" rx="9" fill="{C["amberSoft"]}" stroke="{C["amber"]}" stroke-width="1.3" stroke-dasharray="5 3"/>')
b.append(T(640,564,"Transiciones NO declaradas — prohibidas",11.5,C["amber"],700,"start"))
b.append(T(640,584,"SUSPENDIDA → CERRADA: UC-P27 exige titular con sesión válida; 04/05 no aprobaron",10.5,C["grey"],500,"start"))
b.append(T(640,600,"recorrido alternativo de cierre desde suspensión. CERRADA no tiene salida bajo M-01.",10.5,C["grey"],500,"start"))
open('source/DV-07_E1_CUENTA.svg','w').write(fest(1420,790,"DV-07.E1","Máquina — Estado operativo de cuenta (T-06-02)",
 "Tres estados, tres transiciones. Toda transición no declarada está prohibida.",
 "".join(E)+"".join(b),
 ["Nombre de transición en azul · [guarda] en gris · / evento emitido en verde.",
  "Estado inicial tras registro exitoso: OPERATIVA. Estado terminal bajo M-01: CERRADA.",
  "`CERRADA` no bloquea por sí misma: la autorización se evalúa por separado en cada operación.","",
  "Derivado de BE-LEG-06 v0.1.1 §5.7 · lista blanca literal · sin cambio semántico"]))
print("E1 ok")

# ═══ E2 · Verificación profesional por alcance (§6.8) ═══
b=[];P={};E=[]
b.append(initial_dot(130,340))
for k,(x,lab,kind) in {'PE':(340,"PENDIENTE","normal"),'VE':(760,"VERIFICADO","normal"),
                       'RE':(1180,"RECHAZADO","final"),'SU':(1180,"SUSPENDIDO","normal")}.items():
    y=340 if k!='SU' else 560
    s,P[k]=state(x,y,lab,kind); b.append(s)
E=[f'<path d="M138 340L{340-76-9} 340" stroke="{C["blue"]}" stroke-width="1.7" fill="none" marker-end="url(#ab)"/>',
   T(238,328,"PresentarAlcance",10,C["blue"],700),
   selftrans(P['PE'],"RegistrarObservacion","versión exacta revisada + fundamento"),
   selftrans(P['PE'],"PresentarSubsanacion","subsanación admitida","bottom"),
   trans(P['RE'],P['PE'],"VolverAPresentar","nueva presentación admitida","",190),
   trans(P['PE'],P['VE'],"VerificarAlcance","evidencia suficiente ∧ resolutor habilitado","AlcanceVerificado",-56),
   trans(P['PE'],P['RE'],"RechazarAlcance","fundamento de rechazo","AlcanceRechazado",-118),
   trans(P['VE'],P['SU'],"SuspenderAlcance","causal según política","AlcanceSuspendido",-70),
   trans(P['SU'],P['VE'],"RehabilitarAlcance","cesó la causal","AlcanceRehabilitado",70)]
b.append(f'<rect x="300" y="560" width="430" height="92" rx="9" fill="{C["amberSoft"]}" stroke="{C["amber"]}" stroke-width="1.3" stroke-dasharray="5 3"/>')
b.append(T(320,584,"La observación NO es un quinto estado",11.5,C["amber"],700,"start"))
b.append(T(320,604,"Es un hecho trazable registrado dentro de PENDIENTE;",10.5,C["grey"],500,"start"))
b.append(T(320,620,"la subsanación no cambia de estado, agrega evidencia.",10.5,C["grey"],500,"start"))
b.append(T(320,638,"Mínimo de DEC-005 vía DEC-042: los cuatro estados.",10.5,C["grey"],500,"start"))
open('source/DV-07_E2_VERIFICACION.svg','w').write(fest(1480,830,"DV-07.E2","Máquina — Verificación profesional por alcance (T-06-11)",
 "Opera por alcance, no globalmente: un profesional puede estar VERIFICADO en nutrición y PENDIENTE en entrenamiento.",
 "".join(E)+"".join(b),
 ["Nombre de transición en azul · [guarda] en gris · / evento emitido en verde.",
  "`INV-06-01`: verificar ≠ habilitar ≠ autorizar. La verificación no concede acceso por sí sola.",
  "Suspender un alcance no suspende los demás: no hay transversalidad automática.","",
  "Derivado de BE-LEG-06 v0.1.1 §6.8 · lista blanca literal · sin cambio semántico"]))
print("E2 ok")
