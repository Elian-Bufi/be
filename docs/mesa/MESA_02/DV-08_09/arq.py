# -*- coding: utf-8 -*-
exec(open('engine.py').read())
ROT="ARQUITECTURA OBJETIVO SEGÚN BE-LEG-07 — DESPLIEGUE NO VERIFICADO"
LEG4=[("rect","Contenedor o sistema BE"),("rectx","Sistema externo"),("rel","Relación con protocolo")]
def f4(W,H,fig,tit,sub,body,notes):
    return svg(W,H,f"Figura {fig} — {tit}",sub,body+legend(40,H-40-(22+len(LEG4)*21),680,LEG4,notes)+badge(40,H-22,ROT))
# ═══ DV-08.1 · Contexto (C4 nivel 1) ═══
b=[];P={}
def put(k,*a,**kw):
    s,p=c4(*a,**kw); b.append(s); P[k]=p
put('ASE',230,240,215,96,"Asesorado","persona","gestiona su proceso|y registra su ejecución","person")
put('PRO',230,470,215,96,"Profesional","persona","planifica, evalúa|y revisa","person")
put('ADM',230,690,215,96,"Administrador BE","persona","resuelve verificaciones|e incidencias","person")
put('BE',760,465,300,132,"BE — Plataforma integrada\nde inteligencia en salud","Sistema","Website + API + APK|trazabilidad y control|de acceso por finalidad","sys")
put('OFF',1290,180,235,92,"Open Food Facts","externo","catálogo nutricional","ext")
put('WGR',1290,360,235,92,"wger","externo","catálogo de ejercicios","ext")
put('IDP',1290,540,235,92,"Identidad federada","externo","acceso con proveedor","ext")
put('PUSH',1290,720,235,92,"Servicio de push","externo","notificación no sensible","ext")
E=[rel4(P['ASE'],P['BE'],"usa desde APK","HTTPS/REST",-40),
   rel4(P['PRO'],P['BE'],"usa desde Website","HTTPS/REST",0),
   rel4(P['ADM'],P['BE'],"administra","HTTPS/REST",40),
   rel4(P['BE'],P['OFF'],"importa con fallback","HTTPS",-30),
   rel4(P['BE'],P['WGR'],"importa con fallback","HTTPS",0),
   rel4(P['BE'],P['IDP'],"delega autenticación","OIDC",0),
   rel4(P['BE'],P['PUSH'],"envía aviso no sensible","HTTPS",30)]
open('source/DV-08_1_CONTEXTO.svg','w').write(f4(1620,900,"DV-08.1","C4 nivel 1 — Contexto del sistema",
 "Quién usa BE y con qué sistemas externos se integra. Cada integración declara fallback observable.",
 "".join(E)+"".join(b),
 ["`RF-059`: la caída de un tercero no bloquea el núcleo; el fallback es observable, nunca silencioso.",
  "`ASR-10`: capa de puertos y adaptadores con timeout, fallback y procedencia conservada.",
  "Las integraciones están especificadas; su contrato vive en `BE-LEG-09`.","",
  "Derivado de BE-LEG-07 v0.1.11 §16 y §23 · sin cambio semántico"]))
print("DV-08.1 ok")

# ═══ DV-08.2 · Contenedores (C4 nivel 2) ═══
b=[];P={}
def put2(k,*a,**kw):
    s,p=c4(*a,**kw); b.append(s); P[k]=p
b.append(boundary(430,140,1290,760,"BE — límite del sistema"))
put2('ASE',200,250,190,88,"Asesorado","persona","","person")
put2('PRO',200,470,190,88,"Profesional","persona","","person")
put2('ADM',200,660,190,88,"Administrador","persona","","person")
put2('APK',600,250,230,104,"APK","Expo / React Native","superficie del asesorado|distribución directa, sin stores")
put2('WEB',600,540,230,104,"Website","Next.js","superficie profesional|y administrativa")
put2('API',950,390,260,140,"API BE","NestJS · monolito modular","REST /api/v1|PDP único (ASR-06)|frontera transaccional")
put2('DB',950,660,230,92,"PostgreSQL","Prisma","append-only para hechos|emitidos (ASR-05)","db")
put2('EXT',1420,250,215,92,"Servicios externos","OFF · wger · IdP · Push","adaptadores con fallback","ext")
put2('HOST',1420,560,215,104,"Render (Frankfurt)","PaaS · AWS-ready","artefacto ligado a commit|migraciones como fase","ext")
E=[rel4(P['ASE'],P['APK'],"usa",""),rel4(P['PRO'],P['WEB'],"usa",""),rel4(P['ADM'],P['WEB'],"usa","",30),
   rel4(P['APK'],P['API'],"consume","HTTPS/REST",-20),rel4(P['WEB'],P['API'],"consume","HTTPS/REST",20),
   rel4(P['API'],P['DB'],"lee y escribe en transacción","SQL vía Prisma",0),
   rel4(P['API'],P['EXT'],"importa / delega","HTTPS",0),
   rel4(P['API'],P['HOST'],"se despliega en","contenedor",0)]
open('source/DV-08_2_CONTENEDORES.svg','w').write(f4(1700,900,"DV-08.2","C4 nivel 2 — Contenedores",
 "Monolito modular: un solo despliegue de API con fronteras internas, sin microservicios.",
 "".join(E)+"".join(b),
 ["El PDP es punto único de decisión dentro de la API: idéntico para Website y APK (`ASR-06`).",
  "`CAND-07-A`: se conserva el monolito modular; la modularidad es interna, no de despliegue.",
  "`Q-008`: Render-first con AWS-ready declarado; el proveedor no condiciona el diseño.","",
  "Derivado de BE-LEG-07 v0.1.11 §17 y §32 · sin cambio semántico"]))

# ═══ DV-08.3 · Despliegue y ambientes ═══
b=[];P={}
def put3(k,*a,**kw):
    s,p=c4(*a,**kw); b.append(s); P[k]=p
put3('DEV',330,270,265,120,"Desarrollo","local / branch dedicada","datos sintéticos|guard anti-producción|en suite unitaria")
put3('TEST',830,270,265,120,"Test / Demo","Render Frankfurt","datos sintéticos únicamente|usuarios demo por rol|URL pública para la mesa")
put3('PROD',1330,270,265,140,"Producción","Render Frankfurt · AWS-ready","datos reales|requiere Ready-for-Real-Data|no habilitado","ext")
put3('G1',580,520,190,84,"Gate T-01/T-03","ambientes","config y secretos|separados")
put3('G2',1080,520,215,104,"Gate RfRD","VJR-1…9 · WORM","evaluación jurídica|backups gobernados|journal de auditoría")
E=[rel4(P['DEV'],P['TEST'],"promueve artefacto","commit SHA",0),
   rel4(P['TEST'],P['PROD'],"promueve","tras gate",0),
   rel4(P['G1'],P['TEST'],"habilita","",0),
   rel4(P['G2'],P['PROD'],"habilita","",0)]
b.append(f'<rect x="300" y="650" width="1300" height="104" rx="9" fill="{C["amberSoft"]}" stroke="{C["amber"]}" stroke-width="1.3" stroke-dasharray="5 3"/>')
b.append(T(322,676,"07 §26-bis — tres ambientes, tres regímenes de datos",11.5,C["amber"],700,"start"))
for i,t in enumerate(["Desarrollo y Test/Demo operan **exclusivamente** con datos sintéticos generados: no se admiten datos reales ni anonimizados de personas.",
  "La demo académica se ejecuta en Test/Demo y **no activa** los gates de Ready-for-Real-Data: esos gates protegen datos reales, que la demo no usa.",
  "Ningún ambiente está desplegado al momento de esta figura: la topología es objetivo, no estado verificado."]):
    b.append(T(322,698+i*17,t.replace('**',''),10.5,C["grey"],500,"start"))
open('source/DV-08_3_DESPLIEGUE.svg','w').write(f4(1700,900,"DV-08.3","Ambientes y régimen de datos",
 "Tres ambientes con datos y credenciales propios. Cada promoción atraviesa un gate distinto.",
 "".join(E)+"".join(b),
 ["`ASR-08` / `RNF-SEC-004` P0: ambientes separados con datos, configuración y credenciales propios.",
  "`ASR-09`: artefacto inmutable ligado a commit SHA; migraciones como fase explícita; rollback definido.",
  "El gate de Ready-for-Real-Data es independiente del gate de implementación.","",
  "Derivado de BE-LEG-07 v0.1.11 §26, §26-bis y §32 · sin cambio semántico"]))
print("DV-08.2 y 08.3 ok")
