# -*- coding: utf-8 -*-
exec(open('engine.py').read())
LEGS=[("rel","Transición declarada en la lista blanca"),("rect","Estado del conjunto cerrado")]
NOTE=lambda src:["Nombre de transición en azul · [guarda] en gris · / evento emitido en verde.",
  "Toda transición no declarada está prohibida.","",
  f"Derivado de BE-LEG-06 v0.1.1 {src} · lista blanca literal · sin cambio semántico"]
def maq(fn,fig,tit,sub,estados,ini,trs,selfs,proh,W,H,notes,dot=None):
    b=[];P={};E=[]
    for k,(x,y,lab,kind) in estados.items():
        s,P[k]=state(x,y,lab,kind); b.append(s)
    if ini:
        dx,dy,tgt,lbl=ini
        b.append(initial_dot(dx,dy))
        tx,ty,tw,th=P[tgt]
        E.append(f'<path d="M{dx+8} {dy}L{tx-tw-9:.0f} {ty:.0f}" stroke="{C["blue"]}" stroke-width="1.7" fill="none" marker-end="url(#ab)"/>')
        E.append(T((dx+tx-tw)/2,dy-12,lbl,10,C["blue"],700))
    for a,b_,n,g,ev,cv in trs: E.append(trans(P[a],P[b_],n,g,ev,cv))
    for k,n,g,side in selfs: E.append(selftrans(P[k],n,g,side))
    if proh:
        x,y,w,h,ttl,ls=proh
        b.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="9" fill="{C["amberSoft"]}" stroke="{C["amber"]}" stroke-width="1.3" stroke-dasharray="5 3"/>')
        b.append(T(x+20,y+24,ttl,11.5,C["amber"],700,"start"))
        for i,l in enumerate(ls): b.append(T(x+20,y+44+i*16,l,10.5,C["grey"],500,"start"))
    lg=legend(40,H-40-(22+len(LEGS)*21),660,LEGS,notes)
    open(f'source/{fn}.svg','w').write(svg(W,H,f"Figura {fig} — {tit}",sub,"".join(E)+"".join(b)+lg))
    return len(P),len(trs)+len(selfs)
R=[]
# E3 · Solicitud de vínculo (§7.3)
R.append(maq("DV-07_E3_SOLICITUD","DV-07.E3","Máquina — Solicitud de vínculo (T-06-16)",
 "Cinco estados terminales salvo PENDIENTE. La solicitud es atómica por alcance.",
 {'PE':(400,330,"PENDIENTE","normal"),'AC':(880,190,"ACEPTADA","final"),'RE':(880,330,"RECHAZADA","final"),
  'CA':(880,470,"CADUCADA","final"),'IN':(880,610,"INVALIDADA","final")},
 (160,330,'PE',"CrearSolicitud"),
 [('PE','AC',"AceptarSolicitud","confirmación explícita ∧ reevaluación","",-40),
  ('PE','RE',"RechazarSolicitud","confirmación explícita","",0),
  ('PE','CA',"CaducarSolicitud","condición temporal según política 08","",30),
  ('PE','IN',"InvalidarSolicitud","elegibilidad o contenido ya incompatibles","",60)],
 [],(330,690,760,86,"REG-06-44 — Solicitud equivalente pendiente única",
  ["Coinciden profesional, destinatario resoluble, alcance y finalidad:","solo una puede estar PENDIENTE. Invalidar requiere nueva solicitud."]),
 1420,900,NOTE("§7.3")))
# E4 · Vínculo por alcance (§7.5)
R.append(maq("DV-07_E4_VINCULO","DV-07.E4","Máquina — Vínculo por alcance (T-06-15)",
 "Opera por alcance: un estado global ocultaría divergencias entre especialidades.",
 {'AC':(400,320,"ACEPTADO","normal"),'PA':(840,320,"PAUSADO","normal"),'FI':(1220,320,"FINALIZADO","final")},
 (170,320,'AC',"AceptarAlcanceDeVinculo"),
 [('AC','PA',"PausarAlcance","decisión + motivo","",-56),
  ('PA','AC',"ReanudarAlcance","decisión explícita","",56),
  ('PA','FI',"FinalizarAlcance","decisión explícita","",0),
  ('AC','FI',"FinalizarAlcance","decisión explícita","",150)],
 [],(340,560,860,104,"Asimetría declarada — 7.5-05",
  ["Revocar un consentimiento NO finaliza el vínculo.","Finalizar el vínculo NO elimina la evidencia histórica del consentimiento.",
   "Pausar bloquea operaciones incompatibles; no borra ni finaliza."]),
 1480,830,NOTE("§7.5")))
# E5 · Consentimiento (§7.7)
R.append(maq("DV-07_E5_CONSENTIMIENTO","DV-07.E5","Máquina — Consentimiento (T-06-17)",
 "Versionado: aceptar una nueva versión no crea un consentimiento distinto; revocar no borra la evidencia.",
 {'VI':(440,320,"VIGENTE","normal"),'RV':(940,320,"REVOCADO","normal")},
 (200,320,'VI',"OtorgarConsentimiento"),
 [('VI','RV',"RevocarConsentimiento","versión + evento de revocación","ConsentimientoRevocado",-56),
  ('RV','VI',"OtorgarNuevamente","nueva decisión explícita cuando 08 lo permita","",56)],
 [('VI',"AceptarNuevaVersion","versión sucesora explícita","top")],
 (300,540,900,104,"Corte prospectivo",
  ["La revocación corta hacia adelante: no borra historia dentro de la transacción,","no finaliza vínculos automáticamente, y el B2 queda sin capacidad efectiva",
   "mientras el A3 no satisfaga el PDP (08 §56)."]),
 1380,810,NOTE("§7.7")))
print("E3-E5 ok")

# E6 · Proceso operativo (§8.5)
R.append(maq("DV-07_E6_PROCESO","DV-07.E6","Máquina — Proceso operativo (T-06-25)",
 "Dos estados. La continuidad no cambia de estado: lo mantiene ABIERTO y emite el evento.",
 {'AB':(470,330,"ABIERTO","normal"),'CE':(1030,330,"CERRADO","final")},
 (220,330,'AB',"AbrirProceso"),
 [('AB','CE',"CerrarPorRevision","revisión M-10 válida ∧ cierre explícito","ContinuidadOCierreAplicado",-72),
  ('AB','CE',"CerrarPorFinalizacionVinculo","mismo profesional ∧ asesorado ∧ alcance","",0),
  ('AB','CE',"CerrarPorCierreCuenta","identidad correspondiente","",72)],
 [('AB',"AplicarContinuidad","revisión M-10 válida ∧ consecuencia aplicable","top")],
 (330,560,940,122,"REG-06-75 / REG-06-77 — decidir ≠ aplicar",
  ["El evento ContinuidadOCierreAplicado se emite tras aplicar la consecuencia, nunca al decidirla.",
   "Si la consecuencia no puede aplicarse, no se emite el evento ni se declara éxito.",
   "Un proceso ABIERTO ocupa capacidad configurada (REG-06-84); CERRADO la libera.",
   "AbrirProceso exige REG-06-64/65 y admisión de B-05."]),
 1500,850,NOTE("§8.5")))
# E7 · Versión de plan (§10.7)
R.append(maq("DV-07_E7_VERSION_PLAN","DV-07.E7","Máquina — Versión de plan (T-06-20 instanciado)",
 "Común a nutrición y entrenamiento: el borrador es editable, lo activado es inmutable.",
 {'BO':(470,330,"BORRADOR","normal"),'AC':(1010,330,"ACTIVADA","final")},
 (220,330,'BO',"CrearBorrador"),
 [('BO','AC',"ActivarVersion","contenido completo ∧ profesional autorizado","VersionActivada",0)],
 [('BO',"GuardarBorrador","conserva condición no activa","top")],
 (330,520,960,122,"INV-06-04 — lo emitido no se reescribe",
  ["ActivarVersion vuelve inmutable esa Versión y actualiza la relación efectiva.",
   "No existe transición ACTIVADA → BORRADOR: corregir se hace emitiendo una nueva Versión",
   "que sucede a la anterior, nunca reabriendo la activada.",
   "Al activar se emite la Instantánea reproducible (T-06-21) de lo indicado."]),
 1440,810,NOTE("§10.7 y §11.7")))
# E8 · Ejecución real de entrenamiento (§11.9)
R.append(maq("DV-07_E8_EJECUCION","DV-07.E8","Máquina — Registro de ejecución real (T-06-32)",
 "Permite captura incompleta sin convertirla en evidencia: solo lo confirmado es elegible para proyecciones.",
 {'BO':(470,330,"BORRADOR","normal"),'RE':(1010,330,"REGISTRADA","final")},
 (220,330,'BO',"CrearBorradorEjecucion"),
 [('BO','RE',"ConfirmarEjecucion","captura completa ∧ actor autorizado","EjecucionRegistrada",0)],
 [('BO',"GuardarBorradorEjecucion","no aparece como Ejecución real confirmada","top")],
 (330,520,960,104,"Borrador ≠ evidencia",
  ["El borrador no alimenta proyecciones ni contrasta con la prescripción.",
   "Confirmar vuelve inmutable el original y lo hace elegible como evidencia.",
   "Corregir después se hace con UC-I12 (corrección trazable), sin reabrir el registro."]),
 1440,790,NOTE("§11.9")))
# E9 · Incidencia administrativa (§5.10)
R.append(maq("DV-07_E9_INCIDENCIA","DV-07.E9","Máquina — Incidencia administrativa (T-06-06)",
 "Ciclo propio que no modifica los dominios: para actuar, invoca el caso de uso propietario.",
 {'AB':(420,330,"ABIERTA","normal"),'SE':(860,330,"EN_SEGUIMIENTO","normal"),'RE':(1300,330,"RESUELTA","final")},
 (190,330,'AB',"AbrirIncidencia"),
 [('AB','SE',"IniciarSeguimiento","actor administrativo habilitado","SeguimientoIniciado",-50),
  ('SE','RE',"ResolverIncidencia","resolución fundada","IncidenciaResuelta",-50),
  ('AB','RE',"ResolverIncidencia","resolución directa fundada","IncidenciaResuelta",110)],
 [],(340,560,940,104,"No crea un estado nuevo por cada hecho",
  ["Mientras está EN_SEGUIMIENTO pueden agregarse hechos SeguimientoDeIncidenciaRegistrado",
   "sin crear estados adicionales: el seguimiento es evidencia, no máquina paralela.",
   "La incidencia nunca modifica un dominio por sí misma: invoca el caso propietario."]),
 1560,830,NOTE("§5.10")))
for i,(n,t) in enumerate(R,1): print(f"  E{i}: {n} estados, {t} transiciones")
