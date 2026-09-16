# -*- coding: utf-8 -*-
exec(open('engine.py').read())
RECON="ESTADO: CONCEPTUAL — A RECONCILIAR CON REPOSITORIO (B-11 · H-07-DOM-01)"
LEGC=[("rect","Clase del dominio"),("rectv","Clase versionada — patrón M-06"),
      ("rectx","Clase de otra área — referenciada"),("rel","Asociación con multiplicidad")]
def frameC(W,H,fig,tit,sub,body,notes,recon=True):
    lg=legend(40,H-40-(22+len(LEGC)*21),660,LEGC,notes)
    return svg(W,H,f"Figura {fig} — {tit}",sub,body+lg+(badge(40,H-22,RECON) if recon else ""))
def vista(fn,fig,tit,sub,items,links,W,H,notes):
    b=[];P={}
    for k,v in items.items():
        s,p=cls(*v); b.append(s); P[k]=p
    e=[assoc(P[a],P[bb],ma,mb,lb,kd) for a,bb,ma,mb,lb,kd in links]
    open(f'source/{fn}.svg','w').write(frameC(W,H,fig,tit,sub,"".join(e)+"".join(b),notes))
    return len(P),len(e)
R=[]
# ═══ C1 · Identidad (M-01) ═══
R.append(vista("DV-07_C1_IDENTIDAD","DV-07.1","Clases — Identidad y ciclo de cuenta (M-01)",
 "Las operaciones son exactamente las transiciones de la máquina DV-07.E1, con su guarda.",
 {'IDE':(320,300,270,"Identidad BE","T-06-01",["- identidadId: identificador","- estadoCuenta: EstadoCuenta","- autoríaCreación: ref actor","- ocurrencia: fecha-hora","- registro: fecha-hora","- procedencia: origen"],
   ["+ suspenderCuenta() [fundamento válido según 08]","+ restablecerCuenta() [cesó la condición]","+ cerrarCuenta() [sesión válida ∧ confirmación]"],
   "{inv: INV-06-01 · identidad ≠ perfil ≠ vínculo}"),
  'EST':(700,180,205,"EstadoCuenta","T-06-02",["OPERATIVA","SUSPENDIDA","CERRADA"],[],None,"enum"),
  'PER':(700,440,235,"Perfil propio","T-06-04",["- perfilId: identificador","- versiónEfectiva: ref Versión","- historia: 0..N Versión"],["+ emitirVersión()"],None,"ver"),
  'ACC':(1050,180,235,"Método de acceso","T-06-03",["- métodoId: identificador","- tipo: local | federado","- proveedor: ref externa"],["+ asociar() [no crea identidad paralela]","+ desasociar()"],"{inv: REG-06-19}"),
  'INC':(1050,440,235,"Incidencia administrativa","T-06-06",["- incidenciaId: identificador","- categoría: descriptor","- estado: EstadoIncidencia"],["+ iniciarSeguimiento()","+ resolver() [resolución fundada]"],None),
  'CIE':(320,560,270,"Cierre de cuenta","T-06-05",["- cierreId: identificador","- confirmación: acto explícito"],[],"{inv: no destructivo}")},
 [('IDE','EST','','','',"dep"),('IDE','PER','1','1','',"comp"),('IDE','ACC','1','0..N','',"assoc"),
  ('IDE','INC','1','0..N','',"assoc"),('IDE','CIE','1','0..1','',"comp")],
 1560,860,["Atributos idénticos a DV-06.1 · visibilidad UML: `-` privado, `+` operación pública del dominio.",
  "Cada operación lleva [guarda] de la lista blanca de §5.7.4. Sin guarda, la operación mentiría por omisión.",
  "Máquina completa en DV-07.E1.","",
  "Derivado de BE-LEG-06 v0.1.1 §5 · sin cambio semántico"]))
# ═══ C2 · Vínculo y consentimiento (M-03) ═══
R.append(vista("DV-07_C2_VINCULO","DV-07.2","Clases — Vínculo, consentimiento y autorización (M-03)",
 "Cuatro dimensiones separadas. Ninguna operación de una concede lo que corresponde a otra.",
 {'SOL':(300,290,265,"Solicitud de vínculo","T-06-16",["- solicitudId: identificador","- alcance: ref Alcance","- finalidad: token","- estado: EstadoSolicitud","- antecedente: ref Solicitud"],
   ["+ aceptar() [confirmación ∧ reevaluación]","+ rechazar() [confirmación explícita]","+ caducar() [condición temporal]","+ invalidar() [elegibilidad incompatible]"],"{inv: REG-06-44 · una sola PENDIENTE}"),
  'VIN':(690,290,255,"Vínculo — componente","T-06-15",["- vínculoId: identificador","- alcance: ref Alcance","- estado: EstadoVínculo","- motivo: texto"],
   ["+ pausar() [decisión + motivo]","+ reanudar() [decisión explícita]","+ finalizar() [decisión explícita]"],"{inv: opera por alcance, no global}"),
  'CON':(690,600,255,"Consentimiento","T-06-17",["- consentimientoId: identificador","- versión: ref Versión","- finalidad: token","- otorgadoEn: fecha-hora"],
   ["+ aceptarNuevaVersión() [sucesora explícita]","+ revocar() [versión + evento]"],"{inv: revocar ≠ finalizar vínculo}","ver"),
  'AUT':(1090,440,265,"Autorización contextual","T-06-19",["- identidad · verificación","- habilitación · vínculo","- consentimiento · alcance","- finalidad"],
   ["+ evaluar() [las 7 dimensiones, por operación]"],"{inv: INV-06-10 · nunca presumida}"),
  'ALC':(1090,180,215,"Alcance","T-06-45",["- alcanceId: identificador","- especialidad: ref, opcional","- capacidad: ref, opcional"],[],None)},
 [('SOL','VIN','1','0..1','',"assoc"),('VIN','CON','1','0..N','',"assoc"),
  ('VIN','AUT','','','insumo',"dep"),('CON','AUT','','','insumo',"dep"),('VIN','ALC','1','1','',"assoc")],
 1600,900,["Guardas de §7.3.2, §7.5.2 y §7.7.5. Máquinas completas en DV-07.E3, E4 y E5.",
  "`7.5-05`: revocar consentimiento no finaliza el vínculo; finalizar el vínculo no borra la evidencia.",
  "La autorización se evalúa por operación con las siete dimensiones de `RF-021`.","",
  "Derivado de BE-LEG-06 v0.1.1 §7 · sin cambio semántico"]))
print("C1-C2 ok")

# ═══ C3 · Verificación profesional (M-02) ═══
R.append(vista("DV-07_C3_VERIFICACION","DV-07.3","Clases — Perfil profesional, verificación y capacidad (M-02 · M-05)",
 "La verificación opera por alcance: una instancia por especialidad o capacidad, con su propia máquina.",
 {'PRO':(290,300,250,"Perfil profesional","T-06-04",["- perfilProId: identificador","- versiónEfectiva: ref Versión","- historia: 0..N Versión"],["+ emitirVersión()"],None,"ver"),
  'ESP':(620,180,215,"Especialidad","T-06-09",["- especialidadId: identificador","- alcance: ref Alcance","- denominación: token"],[],None),
  'CAP':(620,470,215,"Capacidad antropométrica","T-06-10",["- capacidadId: identificador","- alcance: ref Alcance"],[],"{inv: DEC-044 · no es 3.ª especialidad}"),
  'VER':(970,180,265,"Verificación por alcance","T-06-11",["- verificaciónId: identificador","- alcance: ref Alcance","- estado: EstadoVerificación","- evidencia: ref Versión"],
   ["+ registrarObservación() [versión revisada + fundamento]","+ presentarSubsanación() [subsanación admitida]","+ verificar() [resolución favorable]","+ rechazar() [resolución desfavorable]","+ suspender() [resolución + motivo]","+ rehabilitar() [resolución explícita]"],"{inv: verificar ≠ habilitar ≠ autorizar}"),
  'EV':(1330,180,195,"EstadoVerificación","T-06-11",["PENDIENTE","VERIFICADO","RECHAZADO","SUSPENDIDO"],[],None,"enum"),
  'HAB':(970,490,265,"Habilitación","T-06-13",["- habilitaciónId: identificador","- alcance: ref Alcance"],[],None),
  'CFG':(1330,490,215,"Capacidad configurada","T-06-14",["- banda: cantidad, opcional","- modoEfectivo: token"],[],"{inv: sin banda ⇒ SIN_LIMITE}")},
 [('PRO','ESP','1','0..N','',"comp"),('PRO','CAP','1','0..1','',"assoc"),('ESP','VER','1','1','',"assoc"),
  ('VER','EV','','','',"dep"),('VER','HAB','','','habilita',"dep"),('HAB','CFG','1','0..1','',"comp")],
 1620,880,["Las seis operaciones son las seis transiciones de §6.8.2. Máquina completa en DV-07.E2.",
  "`DEC-005` vía `DEC-042` fija el mínimo de cuatro estados; la observación no agrega un quinto.",
  "`DEC-044`: la capacidad antropométrica es transversal, nunca una tercera especialidad.","",
  "Derivado de BE-LEG-06 v0.1.1 §6 y §9 · sin cambio semántico"]))
# ═══ C4 · Versionado (M-06) ═══
R.append(vista("DV-07_C4_VERSIONADO","DV-07.4","Clases — Patrón común de versionado (M-06)",
 "El patrón que todas las áreas instancian sin redefinirlo.",
 {'VER':(340,310,270,"Versión","T-06-20",["- versiónId: identificador","- objetoVersionado: ref entidad","- ámbito: delimita sucesión","- predecesora: ref Versión 0..1","- autoría: ref actor","- contenidoEmitido: inmutable"],
   ["+ emitir()","+ suceder() [mismo ámbito ∧ máx. una predecesora]"],"{inv: INV-06-04 · no se reescribe}"),
  'SNP':(720,180,245,"Instantánea reproducible","T-06-21",["- instantáneaId: identificador","- versión: ref Versión (1)","- contenidoCongelado"],["+ reconstruir()"],"{inv: exactamente una Versión}"),
  'COR':(720,470,245,"Corrección trazable","T-06-22",["- correcciónId: identificador","- original: ref raíz","- correcciónPrevia: ref, opcional","- motivo: texto"],
   ["+ corregir() [no reasigna autoría del original]"],"{inv: aditiva, nunca destructiva}"),
  'PRO':(1080,180,225,"Procedencia","T-06-23",["- actor · fuente","- proveedor · contexto"],[],None,"ver"),
  'TMP':(1080,470,225,"Doble temporalidad","T-06-24",["- ocurrencia: fecha-hora","- registro: fecha-hora"],[],"{inv: el desconocido no se inventa}","ver")},
 [('VER','SNP','1','0..1','',"comp"),('VER','COR','1','0..N','',"assoc"),
  ('VER','PRO','','','',"dep"),('COR','TMP','','','',"dep")],
 1500,840,["Guardas de §4.5 y §4.7. La máquina de Versión de plan está en DV-07.E7.",
  "`REG-06-16`: la vista efectiva se determina por relación de corrección, nunca por «última fecha».",
  "Ninguna vertical redefine este patrón: lo instancia.","",
  "Derivado de BE-LEG-06 v0.1.1 §4 · sin cambio semántico"]))
# ═══ C5 · Antropometría (M-09) ═══
R.append(vista("DV-07_C5_ANTROPOMETRIA","DV-07.5","Clases — Antropometría: medición, cálculo y anulación (M-09)",
 "Medición directa y cálculo derivado nunca se confunden. Anular es condición local, no borrado.",
 {'EVA':(300,300,250,"Evaluación antropométrica","T-06-33",["- evaluaciónId: identificador","- protocolo: ref protocolo","- estado: EstadoEvaluación"],
   ["+ guardarBorrador() [autorización vigente]","+ registrar() [validaciones aplicables]","+ retomar() [profesional autorizado]"],"{inv: borrador no alimenta evolución}"),
  'EE':(300,590,195,"EstadoEvaluación","T-06-78",["EN_PREPARACION","REGISTRADA"],[],None,"enum"),
  'MED':(680,180,245,"Medición directa","T-06-33",["- mediciónId: identificador","- valor: cantidad","- unidadOriginal: token","- condición: CondiciónMedición"],
   ["+ corregir() [UC-I12 · preserva original]","+ anular() [VIGENTE ∧ autorizado ∧ motivo]"],"{inv: anulada ≠ borrada}"),
  'CM':(680,470,195,"CondiciónMedición","T-06-79",["VIGENTE","ANULADA"],[],None,"enum"),
  'CAL':(1030,180,245,"Cálculo derivado","T-06-34",["- cálculoId: identificador","- métodoVersión: ref Método","- inputsSnapshot: refs","- contexto: PREPARACION|REGISTRADA"],
   ["+ ejecutar() [inputs completos ∧ admisibles]","+ recalcular() [nueva corrida, sin overwrite]"],"{inv: sin promedio ni ganador automático}"),
  'EVO':(1030,490,245,"Evolución","T-06-35",["- comparabilidad: token","- huecos: SIN_DATO explícito"],[],"{inv: INV-06-176 · SIN_DATO ≠ 0}"),
  'MTH':(1370,180,205,"Método versionado","T-06-72",["- métodoId · versión","- inputsRequeridos"],[],None,"ext")},
 [('EVA','EE','','','',"dep"),('EVA','MED','1','1..N','',"comp"),('MED','CM','','','',"dep"),
  ('EVA','CAL','1','0..N','',"comp"),('CAL','MTH','','','instancia',"dep"),('MED','EVO','','','alimenta',"dep")],
 1640,900,["Guardas de §13 y §20.5–20.6. `RF-050` exige corregir o anular: ambas ramas presentes.",
  "`REG-06-159`: anular un input reevalúa dependencias sin reescribir históricos.",
  "No existe operación de reversión: `ANULADA → VIGENTE` no está en ninguna lista blanca.","",
  "Derivado de BE-LEG-06 v0.1.1 §13 y §20 · sin cambio semántico"]))
print("C3-C5 ok")

# ═══ C6 · Nutrición (M-07) ═══
R.append(vista("DV-07_C6_NUTRICION","DV-07.6","Clases — Circuito nutricional (M-07)",
 "Composición estricta del plan. La ingesta registrada contrasta, nunca sobrescribe lo prescripto.",
 {'PLN':(280,300,225,"Plan nutricional","T-06-28",["- planId: identificador","- objetivo: ref Objetivo","- versiónActivada: ref Versión"],
   ["+ crearBorrador()","+ activarVersión() [contenido completo ∧ autorizado]"],"{inv: activar emite instantánea}","ver"),
  'DIA':(570,300,190,"Día tipo","T-06-47",["- díaTipoId: identificador","- denominación: texto"],[],"{inv: sin fecha fija}"),
  'COM':(820,300,190,"Comida","T-06-48",["- comidaId: identificador","- momento: descriptor"],[],None),
  'OPC':(1070,300,190,"Opción","T-06-49",["- opciónId: identificador","- orden: entero"],[],"{inv: 1..N equivalentes}"),
  'ITM':(1340,300,215,"Ítem prescripto","T-06-50",["- cantidad · unidad","- estadoPreparación: token","- alimento: ref Catálogo"],[],"{inv: estado de preparación obligatorio}"),
  'ING':(820,560,245,"Ingesta registrada","T-06-30",["- modalidad: opción|ítems|libre","- textoDescriptivo: si libre","- procedencia: origen"],
   ["+ registrar()","+ estructurar() [profesional autorizado · UC-I12]"],"{inv: DEC-014 · sin puntaje de adherencia}"),
  'CAT':(280,560,225,"Elemento de catálogo","T-06-31",["- elementoId: identificador","- composición: ref versionada","- procedencia: origen"],[],"{inv: REG-06-101}")},
 [('PLN','DIA','1','1..N','',"comp"),('DIA','COM','1','1..N','',"comp"),('COM','OPC','1','1..N','',"comp"),
  ('OPC','ITM','1','1..N','',"comp"),('ITM','CAT','0..N','1','',"dep"),('ING','COM','0..N','1','contrasta',"dep")],
 1620,860,["Jerarquía y modalidades por `DEC-046 §4.1`–`§4.4`. Máquina de Versión de plan en DV-07.E7.",
  "`REG-06-101`: corregir el catálogo no reescribe una versión ya activada.",
  "`INV-06-133`: BE no calcula requerimientos por fórmula propia; el objetivo es decisión profesional.","",
  "Derivado de BE-LEG-06 v0.1.1 §10 · sin cambio semántico"]))
# ═══ C7 · Entrenamiento (M-08) ═══
R.append(vista("DV-07_C7_ENTRENAMIENTO","DV-07.7","Clases — Circuito de entrenamiento (M-08)",
 "Prescripción y ejecución real son clases distintas: una es lo indicado, otra lo efectivamente hecho.",
 {'PLN':(270,300,215,"Plan de entrenamiento","T-06-28",["- planId: identificador","- versiónActivada: ref Versión"],["+ activarVersión()"],None,"ver"),
  'BLQ':(535,300,180,"Bloque","T-06-32",["- propósito: texto libre"],[],"{inv: mesociclo}"),
  'MIC':(770,300,180,"Microciclo","T-06-32",["- propósito: texto libre"],[],"{inv: opcional}"),
  'SES':(1005,300,180,"Sesión","T-06-32",["- posición: entero"],[],None),
  'PRS':(1290,300,225,"Prescripción","T-06-29",["- series · repeticiones","- criterioIntensidad: token","- valorIntensidad: cantidad"],[],"{inv: PORCENTAJE_RM o RIR}"),
  'EJE':(1290,570,225,"Ejecución real","T-06-32",["- cargaUtilizada: cantidad","- ejercicioSustituido: ref","- condición: token","- granularidad: serie|sesión"],
   ["+ crearBorrador()","+ guardarBorrador()","+ confirmar() [captura completa ∧ autorizado]"],"{inv: borrador ≠ evidencia}"),
  'ZON':(770,570,215,"Zona muscular","T-06-67",["- zonaId: identificador","- vistas: anterior|posterior|ambas"],[],"{inv: 17 zonas · indep. del sexo}")},
 [('PLN','BLQ','1','1..N','',"comp"),('BLQ','MIC','1','0..N','',"comp"),('MIC','SES','1','1..N','',"comp"),
  ('SES','PRS','1','1..N','',"comp"),('PRS','EJE','1','0..1','',"assoc"),('PRS','ZON','','','vía ejercicio',"dep")],
 1620,860,["Jerarquía por `DEC-046 §4.6`. Máquina de Ejecución real en DV-07.E8.",
  "`DEC-046 §4.7`: exactamente dos criterios de intensidad; el esfuerzo percibido no es criterio de prescripción.",
  "`DEC-047 §4.1`: la Zona muscular es entidad de dominio con rol declarado por ejercicio.","",
  "Derivado de BE-LEG-06 v0.1.1 §11 y §20 · sin cambio semántico"]))
# ═══ C8 · Revisión y analítica (M-10·M-11·M-12) ═══
R.append(vista("DV-07_C8_REVISION","DV-07.8","Clases — Revisión, proyecciones y analítica (M-10 · M-11 · M-12)",
 "La revisión válida produce resultado y consecuencia; la proyección deriva sin autoridad de escritura.",
 {'REV':(300,300,255,"Revisión profesional válida","T-06-37",["- revisiónId: identificador","- períodoEvaluado: rango","- fundamento: texto","- resultado: ResultadoRevisión"],
   ["+ registrar() [evidencia ∧ dominio ∧ período]"],"{inv: DEC-014 · no diagnóstica}"),
  'RES':(660,170,215,"ResultadoRevisión","T-06-38",["MANTENER","AJUSTAR","SUSTITUIR","FINALIZAR","REPROGRAMAR_REVISION","CAMBIAR_OBJETIVO"],[],None,"enum"),
  'ACC':(660,450,215,"Próxima acción","T-06-39",["- acciónId: identificador","- fundamento: texto"],["+ aplicar() [consecuencia aplicable]"],"{inv: REG-06-75 · aplicar ≠ decidir}"),
  'CIC':(1000,450,225,"Ciclo cerrado trazable","T-06-40",["- cicloId: identificador","- eventoAplicado: ref evento"],[],"{inv: condición, no estado}"),
  'PRY':(1000,170,225,"Proyección","T-06-42",["- fuentesDeclaradas: refs","- estadoDato: token"],["+ derivar()"],"{inv: CONV-06-09 · no es fuente de verdad}"),
  'TVC':(1340,450,205,"TVCC-30","T-06-44",["- N: ciclos con continuidad","- D: universo evaluable"],[],None,"ext")},
 [('REV','RES','','','',"dep"),('REV','ACC','1','0..1','',"comp"),('ACC','CIC','','','habilita',"dep"),
  ('CIC','TVC','0..N','1','insumo',"dep"),('REV','PRY','','','fuente',"dep")],
 1600,840,["Taxonomía cerrada de seis tokens, literal del 06. Máquina del Proceso en DV-07.E6.",
  "`REG-06-75`: el ciclo se cierra al aplicar la consecuencia, no al decidirla.",
  "`CONV-06-09`: la proyección deriva y nunca tiene autoridad de escritura.","",
  "Derivado de BE-LEG-06 v0.1.1 §12, §14 y §15 · sin cambio semántico"]))
for i,(n,e) in enumerate(R,1): print(f"  C{i}: {n} clases, {e} asociaciones")
