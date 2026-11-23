# Cómo BE se vuelve una empresa legal en Argentina

*Qué exige la ley argentina a una plataforma que trata datos de salud, cómo se inscribe ante la AAIP, cómo se pasa de proyecto a empresa, cómo se protege el software y cómo lo resuelven las empresas del rubro, con un plan en cuatro etapas.*

> Esto no es asesoramiento legal ni contable: es el mapa para llegar a la reunión con el abogado y el contador sabiendo qué preguntar.

**Autor:** Elián Bufi  
**Carrera:** Analista de Sistemas, Escuela Da Vinci  
**Fecha:** 19 de noviembre de 2026

> **Resumen.** BE ya hace mucho de lo que la ley pide (consentimiento por área con evidencia, «Quién ve qué», borrado, servidores en la Unión Europea), pero todavía no tiene responsable legal, ni textos validados, ni base inscripta ante la AAIP, y su código está en un repositorio público, con su licencia de todos los derechos reservados. Este documento ordena qué hacer primero, quién lo hace y con qué fuentes.

**Fecha:** 19 de noviembre de 2026

# Antes de leer

*Un aviso, cómo está armado y la fecha de lo consultado.*

> **Aviso importante.** **Este documento no es asesoramiento legal ni contable.** Es una investigación ordenada para que Elián llegue a las reuniones con un abogado y un contador matriculados sabiendo qué preguntar. Toda decisión se confirma con ellos. Donde la norma es dudosa o no encontré la fuente, lo digo; no completé con suposiciones.

### Cómo está armado

- **La fecha de lo consultado es el 19 de noviembre de 2026.** Los montos (monotributo, tasas de la IGJ, aranceles del INPI y de la DNDA, comisiones) cambian seguido: se indican como referencia y se confirman el día del trámite.
- Cada afirmación lleva su fuente. Las fuentes primarias son las normas y las páginas oficiales (argentina.gob.ar, el Boletín Oficial, ARCA, el INPI, la DNDA). Cuando la única fuente es un estudio jurídico o un medio, lo marco como **[secundaria]**. Cuando no pude confirmar algo, lo marco como **[a confirmar]**.
- Lo que digo sobre BE sale de su repositorio (rama principal al 19/11/2026), leído sin modificarlo: el esquema de datos, los textos en borrador de `packages/domain/src/textos-sin-publicar.ts`, `render.yaml` y el legajo de decisiones (`docs/DEUDA_LEGAJO.md`).
- Uso los nombres de la ley: **responsable** (quien decide para qué y cómo se tratan los datos), **encargado** (quien los trata por cuenta de otro), **titular** (la persona a quien se refieren los datos) y **derechos ARCO** (acceso, rectificación, cancelación o supresión y oposición).

# En una página

*Dónde está BE, qué hay que hacer y en qué orden, y cuánto cuesta a grandes rasgos.*

**Dónde estamos.** BE ya está construido como la ley de datos personales lo pediría: el consentimiento se da por área y queda guardado con su versión, la persona ve «Quién ve qué» y lo puede retirar, puede pedir el borrado, y los servidores están en Frankfurt (Alemania, Unión Europea), un destino que la Argentina reconoce como adecuado. **Lo que falta es lo legal alrededor del sistema:** nadie figura todavía como responsable de los datos, los textos legales son de demostración, la base no está inscripta ante la AAIP y el código está en un repositorio público, con su licencia de todos los derechos reservados desde el 19/11.

- **Gratis** inscribir la base: ante la AAIP, por TAD, y no vence
- **$100.000** multa por infracción: tope de la escala muy grave, que se multiplica hasta ×500 si se acumulan
- **$49.500** monotributo por mes, aproximado: categoría A de servicios, desde agosto de 2026
- **$37.400** marca por clase, aproximado: en el INPI, a mayo de 2026; harían falta 3 o 4 clases

*Fuente: Res. AAIP 126/2024; registro de bases de la AAIP; ARCA, cuadro de monotributo desde el 1/8/2026; Res. INPI 75/2026. Montos a confirmar el día del trámite.*

### Qué hacer, en este orden

1. **1. Cerrar el código** (Elián): Pasar el repositorio a privado, o declararle una licencia, antes de seguir mostrándolo.
2. **2. Tener un responsable** (Elián + contador): Alta en ARCA (monotributo) para que «BE» tenga una persona con CUIT detrás.
3. **3. Validar los textos** (Abogado): Términos, privacidad, consentimiento de salud y compartir: los borradores ya existen con sus huecos marcados.
4. **4. Inscribir la base** (Elián): Responsable y base ante la AAIP, por TAD. Gratis.
5. **5. Marca y obra** (Elián + abogado): Búsqueda en el INPI, marca mixta en 9, 42, 44 y 41; depósito del software en la DNDA.
6. **6. Cobrar en regla** (Contador): Factura C, Mercado Pago o Google Play, botón de arrepentimiento y de baja.
7. **7. Pasar a SAS** (Abogado + contador): Cuando haya socios, inversores o facturación que supere el monotributo; ceder el software a la sociedad.
8. **8. Vender a empresas** (Abogado): Contrato SaaS, contrato de encargado (art. 25) y SLA por cliente.

*Figura 1: Los ocho pasos, de lo más urgente a lo que espera a los primeros clientes.*

### Cuánto cuesta, a grandes rasgos

- **Lo fijo:** AAIP gratis; monotributo desde unos $49.500 por mes ([ARCA](https://www.arca.gob.ar/monotributo/categorias.asp)); honorarios del contador y del abogado, a convenir.
- **Lo de una vez:** marca, unos $150.000 por cuatro clases **[secundaria]**; DNDA, arancel bajo **[a confirmar]**; SAS en CABA, unos $180.000 a $190.000 de tasa más honorarios **[a confirmar]**.
- **Por cobro:** Mercado Pago, de 1,49 % a 6,99 % más IVA; Google Play, 15 % de las suscripciones.

> **Los tres riesgos mayores de hoy.** 1. **Datos de salud reales sin responsable, sin textos validados y sin base inscripta:** leve por no inscribir; muy grave si el consentimiento no vale (Res. AAIP 126/2024).
> 2. **El código público:** con la licencia de todos los derechos reservados, pero sin secreto comercial y copiable de hecho.
> 3. **Todo depende de una persona:** dominio, cuentas y llave de firma de la APK, sin titular empresa ni respaldo documentado.

# 1. Los requisitos legales de BE

*Qué pide cada norma, a quién obliga, qué ya cumple BE y qué falta, con su prioridad.*

> **La idea clave.** BE cumple **en el producto** buena parte de lo que pide la ley; lo que falta está **fuera del código**: un responsable con nombre y CUIT, textos validados, la base inscripta y los contratos con los proveedores.

## 1.1 La tabla de requisitos

Prioridad: **Alta** = antes de sumar a una sola persona más fuera del círculo de prueba; **Media** = antes de cobrar o de abrir a desconocidos; **Baja** = antes de vender a empresas o cuando crezca.

**Tabla 1.** Los requisitos legales de BE, lo que ya cumple y lo que falta.

| Requisito | Norma | A quién obliga | Qué ya cumple BE | Qué falta | Prioridad |
| --- | --- | --- | --- | --- | --- |
| Un responsable identificado | Ley 25.326, arts. 2, 6 y 21 | Al responsable de la base | Los textos en borrador tienen el lugar marcado | Que Elián (con CUIT) o la SAS figure como responsable, con domicilio | Alta |
| Consentimiento expreso para datos de salud | Ley 25.326, arts. 5 y 7; Dec. 1558/2001, art. 5 | Al responsable | Consentimiento por área y finalidad, con cada versión guardada como evidencia inmutable, revocable | Texto validado por un abogado; separar el consentimiento de salud de la aceptación de los términos | Alta |
| Informar antes de recolectar | Ley 25.326, art. 6 | Al responsable | Textos versionados con su hash; «Quién ve qué» | Completar responsable, finalidades, plazos, transferencia y la leyenda de la AAIP | Alta |
| Inscribir la base | Ley 25.326, art. 21; Dec. 1558/2001, art. 1 | Toda base privada que excede el uso personal | — | Inscribir al responsable y a la base por TAD | Alta |
| Seguridad y confidencialidad | Ley 25.326, arts. 9 y 10; Res. AAIP 47/2018 | Al responsable y al encargado | Segundo factor para Administración, auditoría de accesos, contraseñas con hash, servidores con acceso restringido | Política de seguridad escrita, plan de incidentes, respaldo cifrado probado, segundo factor para profesionales | Alta |
| Derechos ARCO en plazo | Ley 25.326, arts. 14 a 16 | Al responsable | Descarga de los datos, borrado de cuenta, pantalla de derechos en Administración | Un canal publicado, el procedimiento y los plazos (10 días corridos para acceso; 5 hábiles para rectificar o suprimir) | Alta |
| Transferencia internacional | Ley 25.326, art. 12; Disp. 60/2016; Res. AAIP 198/2023 | Al responsable | Render en Frankfurt (UE, país adecuado) | Revisar a Google (EE. UU.), Expo (EE. UU.) y cualquier soporte desde EE. UU.; firmar o aceptar los DPA | Alta |
| Contrato con cada encargado | Ley 25.326, art. 25; Dec. 1558/2001, art. 25 | Al responsable y al encargado | — | Aceptar o firmar los DPA de Render, Brevo y Google; guardarlos | Alta |
| Edad mínima | Código Civil y Comercial, art. 26; Ley 25.326 | Al responsable | Declaración de 18 años o más al crear la cuenta | Mantenerla; decidir si se verifica | Media |
| Historia clínica | Ley 26.529, arts. 12 a 18; Ley 27.706 | A profesionales de la salud y establecimientos | BE no se presenta como historia clínica | Decir en los términos que BE no es historia clínica y que el profesional lleva la suya | Media |
| Producto médico | ANMAT, Disp. 9688/2019, art. 26 | Al fabricante de software con finalidad médica | BE no diagnostica ni trata | Cuidar cada frase de la publicidad y de la tienda | Media |
| Consumidor | Ley 24.240, arts. 10 ter, 34 y 37; Disp. SSDCyLC 954/2025 | A quien vende a consumidores a distancia | — | Botón de arrepentimiento y botón de baja visibles, sin cláusulas abusivas, jurisdicción del consumidor | Media (al cobrar) |
| Políticas de Google Play | Política de salud, Seguridad de los datos, eliminación de cuentas | Al desarrollador | Eliminación de cuenta en la app | Declaración de apps de salud, formulario de Seguridad de los datos, enlace web para borrar, descargo médico en la ficha | Media |
| Facturar y tributar | Monotributo o régimen general; Ingresos Brutos | A quien cobra | — | Alta en ARCA y en Ingresos Brutos | Media (al cobrar) |
| Marca | Ley 22.362 | A quien quiere la exclusividad | — | Búsqueda y solicitud en el INPI | Media |
| Software y licencias | Ley 11.723 y 25.036; licencias de terceros | Al titular y a quien usa obras ajenas | Procedencia y licencia de cada dato externo (Open Food Facts, wger, USDA) registradas | Licencia o repositorio privado; página de atribuciones completa; cesiones | Alta |
| Contrato de encargado con clientes B2B | Ley 25.326, art. 25 | A BE como encargado | — | Modelo de contrato y anexo de seguridad | Baja (al vender a empresas) |

### Lo que BE ya hace bien, y por qué importa

- **El consentimiento deja evidencia.** Cada decisión de la persona emite una «versión de consentimiento» inmutable, encadenada a la anterior (`VersionDeConsentimiento` en el esquema). Es exactamente lo que se necesita para probar el consentimiento si alguien lo discute, porque la Ley 25.506 le da validez a la firma electrónica pero pone la prueba a cargo de quien la invoca ([Ley 25.506](https://www.argentina.gob.ar/normativa/nacional/ley-25506-70749/actualizacion)).
- **La persona decide qué ve cada profesional**, por área, y lo puede retirar en «Quién ve qué». Eso es control real, no una casilla.
- **Los servidores están en la Unión Europea** (`render.yaml`: región `frankfurt`). Alemania está en la lista de países adecuados de la AAIP, así que el alojamiento principal no necesita cláusulas especiales ([AAIP, transferencias internacionales](https://www.argentina.gob.ar/aaip/datospersonales/transferencias-internacionales)).
- **Los textos ya están escritos en borrador** para el uso real (diez textos, DL-169), con lo que solo puede decidir un abogado marcado como «[A COMPLETAR]»: el responsable, el mecanismo de la transferencia, la jurisdicción y los plazos de conservación. Mientras tengan esas marcas, el sistema no deja publicarlos.
- **Administración no ve datos de salud** y entra con segundo factor.

# 2. La ley de datos personales

*La Ley 25.326 y su decreto, aplicados a una plataforma con datos de salud.*

> **La idea clave.** Para la ley argentina, los datos de salud son **sensibles**: nadie puede ser obligado a darlos, y tratarlos sin un consentimiento válido es una infracción **muy grave**.

## 2.1 La ley vigente y lo que viene

La norma vigente es la **Ley 25.326 de Protección de los Datos Personales** (2000) con su **Decreto reglamentario 1558/2001** ([Ley 25.326](https://www.argentina.gob.ar/normativa/nacional/ley-25326-64790/texto); [Decreto 1558/2001](https://www.argentina.gob.ar/normativa/nacional/decreto-1558-2001-70368/texto)). La autoridad de control es la **Agencia de Acceso a la Información Pública (AAIP)**.

**Hay reformas en el Congreso, pero ninguna está vigente.** Al 19/11/2026 encontré, por lo menos:

- el proyecto **3397-D-2026** (diputado Agustín Rossi, ingresado el 16/7/2026), que reproduce en lo sustancial el proyecto que elaboró la AAIP en 2023 y derogaría las Leyes 25.326 y 26.343 **[secundaria]** ([LexLatin](https://lexlatin.com/entrevistas/ley-datos-personales-argentina-nuevo-proyecto-ley-estandar-rgpd); [Beccar Varela](https://beccarvarela.com/novedades/nuevo-proyecto-de-ley-de-proteccion-de-datos-personales/); texto de la AAIP de 2023: [proyecto](https://www.argentina.gob.ar/sites/default/files/2018/10/proyecto_leypdp2023.pdf));
- el proyecto **1751-D-2026** (diputado Martín Yeza), de 72 artículos, con obligaciones según el riesgo y reglas sobre inteligencia artificial **[secundaria; la fecha de ingreso difiere entre fuentes]** ([sitio del proyecto](https://leydedatospersonales.tech/); [Posturas](https://posturas.com.ar/reforma-ley-datos-personales-argentina-congreso/)).

Los dos se parecen al reglamento europeo (RGPD): suman bases legales distintas del consentimiento, privacidad desde el diseño, evaluaciones de impacto para datos de salud y **aviso obligatorio de brechas**. **Conviene construir ya con ese estándar**, porque BE va a convivir con la ley nueva si se aprueba; anteriores proyectos perdieron estado parlamentario sin tratarse, así que no hay fecha.

## 2.2 Los datos de salud son sensibles

- **La definición.** El art. 2 incluye entre los datos sensibles la «información referente a la salud». Las medidas corporales, la composición corporal, los planes de alimentación, las restricciones y las fotos de comida o de progreso entran, razonablemente, en esa categoría. **Recomiendo tratar todo lo de las tres áreas como sensible**, también el entrenamiento: separarlo no aporta y suma riesgo.
- **Nadie puede ser obligado a darlos** (art. 7, inc. 1). En la práctica: BE no puede condicionar el uso de otras funciones a que la persona cargue un dato de salud que no hace falta para esa función.
- **La base legal: el consentimiento expreso.** El art. 5 exige un consentimiento «libre, expreso e informado», que «deberá constar por escrito, o por otro medio que permita se le equipare». El decreto agrega que la AAIP fija los requisitos para darlo por medios no escritos que aseguren «autoría e integridad», y que se puede revocar en cualquier momento sin efecto retroactivo ([Decreto 1558/2001, art. 5](https://www.argentina.gob.ar/normativa/nacional/decreto-1558-2001-70368/texto)).

> **Un punto dudoso que tiene que mirar el abogado.** El art. 7, inc. 2, dice que los datos sensibles «sólo pueden ser recolectados y objeto de tratamiento cuando medien razones de interés general autorizadas por ley», y el art. 7 figura **sin reglamentar**. Leído al pie de la letra, no menciona el consentimiento. La práctica general (y la propia Res. AAIP 126/2024, que castiga «tratar datos sensibles **sin consentimiento**») trata el consentimiento expreso como base válida, y así trabajan las apps de salud del país. No encontré un dictamen de la AAIP que lo diga con todas las letras: **es la primera pregunta para el abogado.**

- **El art. 8 no alcanza a BE como plataforma.** Permite a los establecimientos sanitarios y a los «profesionales vinculados a las ciencias de la salud» tratar datos de salud de sus pacientes con secreto profesional. Le sirve a un nutricionista matriculado frente a su paciente, pero no a BE ni a un entrenador, que no es profesional de la salud **[inferencia; a confirmar]**. Por eso BE se apoya en el consentimiento de la persona.
- **La finalidad.** Los datos no se pueden usar para fines distintos o incompatibles con los que motivaron su obtención (art. 4, inc. 3). Cada finalidad nueva (estadísticas, investigación, entrenar modelos, publicidad) necesita su propio consentimiento o anonimización real.

## 2.3 Lo que hay que informar

El art. 6 obliga a informar, antes de recolectar, la finalidad y los destinatarios, la existencia de la base y su responsable, si las respuestas son obligatorias, las consecuencias de dar o no los datos y cómo ejercer los derechos. La AAIP además exige incluir una leyenda sobre su rol: que es el órgano de control y que atiende denuncias y reclamos La fija hoy el art. 3 de la **Res. AAIP 14/2018**, que derogó la Disposición DNPDP 10/2008 ([Boletín Oficial, 9/3/2018](https://www.boletinoficial.gob.ar/detalleAviso/primera/179914/20180309)): «LA AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales».

## 2.4 Los derechos de la persona y sus plazos

**Tabla 2.** Los derechos de la persona, en qué plazo se responden y qué tiene BE hoy.

| Derecho | Plazo | Qué dice la norma | En BE hoy |
| --- | --- | --- | --- |
| Acceso | **10 días corridos** desde la intimación fehaciente; gratis cada 6 meses | Ley 25.326, art. 14; Dec. 1558/2001, art. 14: conocer qué datos hay, su fuente, su finalidad y destino, y si la base está inscripta | «Tus datos» y la descarga, en la app y en la web |
| Rectificación, actualización | **5 días hábiles** desde el reclamo | Art. 16 | La persona edita lo suyo; lo del profesional, con versiones |
| Supresión | **5 días hábiles** | Art. 16; no procede si perjudica a terceros o hay obligación legal de conservar | Borrado de cuenta y pantalla de derechos de Administración |
| Confidencialidad | — | Arts. 10 y 16 | Permisos por área, Administración sin acceso a salud |
| Revocar el consentimiento | En cualquier momento, sin efecto retroactivo | Dec. 1558/2001, art. 5 | Retiro por área en «Quién ve qué» |
| Habeas data | Acción judicial si no se responde | Arts. 33 y siguientes | — |

Fuente de los plazos: [Ley 25.326](https://www.argentina.gob.ar/normativa/nacional/ley-25326-64790/texto). Un sitio del rubro (Recetín) promete «hasta 10 días hábiles» para todo: es más largo de lo que permite el art. 16 para rectificar o suprimir. **BE debería prometer los plazos de la ley.**

## 2.5 La seguridad

- **La obligación** está en el art. 9: medidas técnicas y organizativas que eviten la adulteración, la pérdida, la consulta o el tratamiento no autorizado, y que permitan detectar desviaciones. El art. 10 suma el deber de secreto, que sigue después de terminada la relación.
- **La guía práctica es la Res. AAIP 47/2018**, de «medidas de seguridad recomendadas», en medios informatizados (Anexo I) y no informatizados (Anexo II). Derogó las medidas obligatorias de 2006 y 2008 y las reemplazó por recomendaciones; la AAIP la invoca cuando investiga ([Res. 47/2018](https://www.argentina.gob.ar/normativa/nacional/resolución-47-2018-312662/texto); [Boletín Oficial, 25/7/2018](https://www.boletinoficial.gob.ar/detalleAviso/primera/188654/20180725)). No encontré una norma posterior que la reemplace **[a confirmar con la AAIP]**.
- **Lo que pide en la práctica:** inventario de bases, control de acceso por roles, registro de accesos, copias de respaldo probadas, gestión de incidentes con su procedimiento (incluye un aviso a la AAIP a `incidente.seguridad@aaip.gob.ar`), gestión de cambios, destrucción segura y revisión periódica.
- **Aviso de brechas.** Hoy **no hay una obligación legal general** de notificar brechas en la Ley 25.326; la Res. 47/2018 lo recomienda y los proyectos de reforma lo harían obligatorio. **Recomiendo tener el procedimiento escrito ya.**

## 2.6 La transferencia internacional: el punto clave

El art. 12 **prohíbe** transferir datos personales a países que no den un nivel adecuado de protección, salvo excepciones. El decreto aclara que el nivel adecuado puede venir de la ley del país, de autorregulación o de **cláusulas contractuales**, y que no rige la prohibición si **el titular consintió expresamente** la transferencia ([Decreto 1558/2001, art. 12](https://www.argentina.gob.ar/normativa/nacional/decreto-1558-2001-70368/texto)).

**Los países adecuados** (Disp. DNPDP 60/2016 y Res. AAIP 34/2019): los Estados de la Unión Europea y del Espacio Económico Europeo, el Reino Unido, Suiza, Guernsey, Jersey, la Isla de Man, las Islas Feroe, Andorra, Nueva Zelanda, Uruguay, Canadá (solo el sector privado) e Israel (solo datos con tratamiento automatizado). **Estados Unidos no está** ([AAIP](https://www.argentina.gob.ar/aaip/datospersonales/transferencias-internacionales)).

**Los mecanismos para un país no adecuado:**

- las **cláusulas contractuales modelo** de la Disp. 60/2016 (cesión y prestación de servicios) o las de la **Res. AAIP 198/2023**, que adoptó las de la Red Iberoamericana de Protección de Datos (responsable a responsable y responsable a encargado). Las de 2016 siguen vigentes ([Boletín Oficial, Res. 198/2023](https://www.boletinoficial.gob.ar/detalleAviso/primera/296189/20231018));
- un **contrato distinto** de los modelos, que hay que presentar a la AAIP dentro de los 30 días corridos de firmado;
- las **normas corporativas vinculantes** (Res. AAIP 159/2018), para grupos de empresas;
- el **consentimiento expreso** del titular.

Usar las cláusulas modelo tal cual **no exige presentarlas** ante la AAIP.

**Tabla 3.** A dónde van hoy los datos de BE y qué mecanismo corresponde.

| Proveedor | Qué recibe | País | Situación |
| --- | --- | --- | --- |
| Render (API, base, sitio) | Todo | Alemania (Frankfurt), empresa de EE. UU. | País adecuado. Igual conviene aceptar su DPA ([render.com/dpa](https://render.com/dpa)), porque el soporte o los subencargados pueden estar en EE. UU. **[no pude leer el texto del DPA: a confirmar]** |
| Brevo (correo, apagado en `main`) | Nombre y correo; nunca datos de salud | Francia (UE) | País adecuado; DPA de Brevo **[a revisar]** |
| Google (acceso con Google, Play) | Identidad de la cuenta | EE. UU. | No adecuado: cláusulas de Google o consentimiento expreso al elegir «Continuar con Google» |
| Expo (avisos al teléfono, `exp.host`) | El token del teléfono y el texto del aviso | EE. UU. | No adecuado: cuidar que el aviso **no lleve datos de salud** y cubrirlo con cláusulas o consentimiento |

La recomendación: **declarar todos los destinos en la política de privacidad y en la inscripción ante la AAIP**, quedarse con el alojamiento en la UE, y cubrir a EE. UU. con las cláusulas modelo o los acuerdos del proveedor, más el consentimiento expreso como respaldo (no como única base).

## 2.7 El Convenio 108 y el 108+

La Argentina aprobó el **Convenio 108** del Consejo de Europa por la **Ley 27.483**, y su protocolo modernizador (**108+**) por la **Ley 27.699**, publicada el 30/11/2022 **[secundaria]** ([Marval](https://www.marval.com/Publicacion/argentina-aprueba-y-se-convierte-en-parte-del-convenio-108-14369?lang=es)). El 108+ entra en vigor cuando lo ratifiquen 38 Estados, y las fuentes no coinciden sobre la fecha del depósito argentino **[a confirmar en la Oficina de Tratados del Consejo de Europa, CETS 223]**. Para BE importa por dos razones: la AAIP lo usa para interpretar la ley vigente (proporcionalidad, seguridad, aviso de brechas), y anticipa lo que va a traer la reforma.

# 3. La AAIP en profundidad

*El registro de bases paso a paso, las sanciones, las guías y quién es responsable de qué.*

> **La idea clave.** Inscribir la base es **gratis, en línea y no vence**. Lo único que no se puede corregir después es **el nombre de la base y su finalidad**: hay que pensarlos antes de confirmar.

## 3.1 Quién tiene que inscribirse

El art. 21 de la ley obliga a inscribir los archivos privados «destinados a proporcionar informes», y el decreto los define como los que **exceden el uso exclusivamente personal** ([Decreto 1558/2001, arts. 1 y 21](https://www.argentina.gob.ar/normativa/nacional/decreto-1558-2001-70368/texto)). Una plataforma con miles de personas, o con diez, excede el uso personal: **BE tiene que inscribirse**. La AAIP lo confirma en la ficha del trámite: las bases privadas «deben estar inscriptas» y no hacerlo puede acarrear sanciones ([registrar bases privadas](https://www.argentina.gob.ar/registrar-bases-de-datos-personales-privadas)).

- **Costo:** gratis. **Vencimiento:** no vence; si cambia lo declarado, se modifica. (Recetín dice en sus términos que su inscripción tiene «renovación anual»: hoy la AAIP dice lo contrario.)
- **Vía:** solo por Trámites a Distancia (TAD), según la Res. AAIP 132/2018.
- **Persona humana o jurídica:** puede inscribirse Elián con su CUIT; cuando exista la SAS, se inscribe la sociedad (con su clave fiscal o un apoderado en TAD) y se da de baja o se modifica lo anterior ([AAIP, trámites](https://www.argentina.gob.ar/aaip/datospersonales/tramites)).

## 3.2 El paso a paso

1. **1. Clave fiscal** (Elián): Clave fiscal de ARCA nivel 2 o superior, y entrar a TAD (tramitesadistancia.gob.ar).
2. **2. El responsable** (Elián): Trámite «Inscripción del Responsable al Registro Nacional de Bases de Datos»: responsable privado, datos del representante, declaración jurada. Una sociedad adjunta su estatuto.
3. **3. El número** (Sistema): TAD asigna el número de responsable (queda en «Notificaciones»).
4. **4. La base** (Elián): Trámite «Inscripción de Bases de Datos Privadas»: CUIT, número de responsable, nombre de fantasía y el formulario de la base.
5. **5. La constancia** (Sistema): Si se aprueba, llega por correo la constancia con el número de registro y se puede descargar el certificado con QR. Si hay observaciones, la AAIP escribe.

*Figura 2: La inscripción ante la AAIP en cinco pasos (instructivos de la AAIP para responsables y bases privadas).*

Fuentes: [instructivo del responsable privado](https://www.argentina.gob.ar/sites/default/files/instructivo_tad_inscripcionymodificacionresponsable_basesprivadas_3.pdf) e [instructivo de bases privadas](https://www.argentina.gob.ar/sites/default/files/instructivo_tad_inscripcionymodificacion_basesprivadas_3.pdf). Consultas: `registrobasesdedatos@aaip.gob.ar`.

### Qué se declara, campo por campo, con una propuesta para BE

**Tabla 4.** El formulario de la base y una propuesta de respuesta para BE (a validar con el abogado).

| Campo | Qué pide la AAIP | Propuesta para BE |
| --- | --- | --- |
| Nombre de la base | En mayúsculas, sin abreviaturas, acentos ni puntos. **No se puede modificar** | «USUARIOS Y SEGUIMIENTO DE SALUD Y ENTRENAMIENTO» (una sola base) o dos: cuentas y salud |
| Finalidades | De una lista; **no se pueden modificar** | Prestación del servicio; salud; seguimiento de la actividad física y la alimentación. No sumar publicidad si no se hará |
| Naturaleza de los datos | Si hay datos sensibles o antecedentes penales | **Sí, datos sensibles (salud)** |
| Tipo de datos | De una lista, u «Otros» | Identificatorios, de contacto, de salud, de hábitos, imágenes (fotos de comidas) |
| Forma de recolección | Del titular, por cesión privada o pública | Directamente del titular; y del profesional que la persona autoriza |
| Destino (cesiones) | A quién se comunican y por qué | A los profesionales que la persona elige, por área |
| Actualización y periodicidad | Cómo y cada cuánto | Por el titular y el profesional, en forma continua |
| Conservación | Un plazo determinado o determinable; **«indeterminado» es un error** | Mientras la cuenta esté activa; borrado a pedido; respaldos hasta N días; plazos legales aparte |
| Seguridad | Medidas físicas y lógicas; roles con acceso | Cifrado en tránsito, control de acceso por rol, segundo factor de Administración, auditoría, respaldos |
| Transferencia internacional | Países | Alemania; EE. UU. (Google y Expo) |
| Modo de interrelacionar | El dato que identifica el registro | Correo electrónico / identificador de cuenta |
| Derechos ARCO | Medio, domicilio, requisitos y procedimiento | La pantalla «Tus datos», un correo de privacidad y los plazos de los arts. 14 y 16 |

## 3.3 Las sanciones

La escala vigente es la **Res. AAIP 126/2024**, en vigor desde el 1/6/2024, que derogó la Disp. 7/2005 y las Res. 12/2018, 243/2019, 240/2022 y 244/2022 ([Res. 126/2024, texto actualizado](https://www.argentina.gob.ar/normativa/nacional/norma-399750/actualizacion)).

**Tabla 5.** Las infracciones y sanciones de la Res. AAIP 126/2024, con los ejemplos que tocan a BE.

| Gravedad | Ejemplos que tocan a BE | Sanción |
| --- | --- | --- |
| Leve | Tratar datos **sin inscribir la base**; no informar las medidas de seguridad cuando la AAIP lo pide | Hasta 2 apercibimientos y/o multa de $1.000 a $80.000 |
| Grave | Tratar datos sin una base legal adecuada; **no atender los derechos ARCO en tiempo y forma**; no cumplir la confidencialidad y la seguridad | Hasta 4 apercibimientos, suspensión de 1 a 30 días y/o multa de $80.001 a $90.000 |
| Muy grave | **Tratar datos sensibles sin consentimiento**; no cuidar la seguridad de datos sensibles; **transferir a un país no adecuado** sin los requisitos; ceder datos en forma ilegítima | Hasta 6 apercibimientos, suspensión de 31 a 365 días, **clausura o cancelación de la base** y/o multa de $90.001 a $100.000 |

- **Las multas parecen chicas, pero se acumulan:** si en un mismo acto hay varias multas por la misma conducta, el tope es el máximo de la escala multiplicado por 500 (hasta $50.000.000 en las muy graves).
- **Agravantes:** la categoría de los datos (los de salud), el volumen, los menores, el beneficio económico, la reincidencia (3 años). **Atenuantes:** reconocer, corregir y colaborar ante un incidente.
- **Pago voluntario:** 50 % de descuento dentro de los 20 días hábiles.
- **Lo que más pesa no es la multa:** es la **suspensión o la cancelación de la base**, que para un SaaS equivale a cerrar, y la publicidad del caso.

**Casos reales.** La AAIP sancionó a grandes empresas por incidentes de seguridad; el caso más citado es el de Cencosud, en el que pidió las medidas del art. 9 y de la Res. 47/2018 **[secundaria]** ([abogados.com.ar, multa por data breach](https://abogados.com.ar/index.php/multa-por-data-breach-en-argentina/29132); [IAPP, últimas sanciones](https://www.iapp.org/news/a/ultimas-sanciones-de-la-autoridad-de-proteccion-de-datos-personales-en-argentina)). No encontré un caso público contra una app de fitness argentina.

## 3.4 Las guías de la AAIP

- **Guía de Evaluación de Impacto en la Protección de Datos**, hecha con la autoridad de Uruguay (2020 **[la fecha varía entre fuentes]**) ([AAIP](https://www.argentina.gob.ar/noticias/argentina-y-uruguay-lanzan-la-guia-evaluacion-de-impacto-en-la-proteccion-de-datos)). **Recomiendo hacer la evaluación de impacto de BE con esta guía**: es la herramienta para demostrar diligencia con datos sensibles.
- **Guía para entidades públicas y privadas sobre inteligencia artificial** (2025), con privacidad desde el diseño y por defecto, evaluación desde el inicio y datos de salud como categoría sensible ([guía de IA, PDF](https://www.argentina.gob.ar/sites/default/files/guia_ai-final-2025.pdf)). Aplica si BE suma funciones con IA.
- **No encontré una guía específica de la AAIP para datos de salud** ni una de privacidad desde el diseño para software. Si existe, no está publicada en las páginas consultadas **[a confirmar con la AAIP]**.

## 3.5 Los roles: ¿quién es responsable cuando un profesional usa BE?

Es la pregunta más importante del capítulo, porque define los contratos.

**Tabla 6.** Quién es responsable de qué, en el modelo actual de BE y en el modelo de empresa.

| Situación | Rol de BE | Rol del profesional o del cliente |
| --- | --- | --- |
| La persona crea su cuenta y registra lo suyo (hoy) | **Responsable** | — |
| La persona comparte un área con un profesional | **Responsable** de la plataforma; la comunicación al profesional es una **cesión** consentida (art. 11) | El profesional es **responsable** de lo que hace con esos datos en su práctica (y, si es de la salud, con secreto profesional) |
| El profesional carga notas, planes y tomas | Responsable del sistema; **a definir** si también encargado del profesional | Responsable de su contenido profesional |
| Un gimnasio o clínica contrata BE para sus socios (B2B) | **Encargado** (art. 25) | **Responsable**: decide para qué y cómo |

El modelo de hoy es **mixto**: la persona es usuaria directa de BE (como en Strava o MyFitnessPal) y elige a sus profesionales. Trainerize y TrueCoach, en cambio, se definen como **encargados** del entrenador o del gimnasio, que es el responsable y el que tiene que obtener y probar el consentimiento (ver «Cómo lo hacen otras empresas»). **Recomiendo** dejar escrito en los términos para profesionales que:

1. BE es responsable de la cuenta de la persona y de la plataforma;
2. cada profesional es responsable de su uso de los datos que la persona le comparte, con deber de secreto, solo para atenderla, y no puede sacarlos de BE para otros fines;
3. cuando una empresa contrata BE para su gente, BE pasa a ser encargado y firma el contrato del art. 25.

La Ley 25.326 no tiene la figura de los «corresponsables» del RGPD; cómo encuadrar el tramo profesional es **la segunda pregunta para el abogado**.

**El contrato del art. 25.** Quien trata datos por cuenta de otro no puede usarlos con otro fin ni cederlos, y al terminar los destruye (art. 25). El decreto exige que el contrato incluya los **niveles de seguridad**, la **confidencialidad**, que el encargado actúe **solo según las instrucciones** del responsable y que cumpla el art. 9 ([Decreto 1558/2001, art. 25](https://www.argentina.gob.ar/normativa/nacional/decreto-1558-2001-70368/texto)). BE lo necesita en dos direcciones: **con sus proveedores** (Render, Brevo, Google, Expo), donde BE es el responsable, y **con sus clientes empresa**, donde BE es el encargado.

# 4. Otras normas que tocan a BE

*Salud, ANMAT, consumidor, firma, tiendas y ejercicio profesional.*

> **La idea clave.** BE es una herramienta de seguimiento, **no una historia clínica ni un producto médico**. Para que siga siéndolo, eso se dice en los términos y se cuida en cada frase de la publicidad.

## 4.1 Derechos del paciente e historia clínica (Leyes 26.529 y 27.706)

- **La Ley 26.529** define la historia clínica como «el documento obligatorio cronológico, foliado y completo» de toda actuación de profesionales y auxiliares de la salud sobre el paciente (art. 12). Si es informatizada, tiene que garantizar integridad, autenticidad, inalterabilidad, perdurabilidad y recuperabilidad (art. 13). El paciente es su titular y tiene derecho a una copia en 48 horas (art. 14). Los establecimientos y profesionales son sus depositarios por **diez años** desde la última actuación (art. 18) ([Ley 26.529](https://www.argentina.gob.ar/normativa/nacional/ley-26529-160432/texto)).
- **La Ley 27.706** creó el Programa Federal Único de Informatización y Digitalización de las Historias Clínicas; su reglamentación (Dec. 393/2023) pone la custodia en los establecimientos y la verificación de la matrícula en la REFEPS ([Ley 27.706](https://www.argentina.gob.ar/normativa/nacional/ley-27706-380710/texto); [Decreto 393/2023](https://www.argentina.gob.ar/normativa/nacional/decreto-393-2023-387475/texto)).

**¿BE cae ahí?** Hoy, no como sistema: BE no es un establecimiento, y el entrenador y el antropometrista no son profesionales de la salud. **El riesgo está en el nutricionista**: si usa BE como su único registro de la atención, sus notas podrían ser historia clínica y él tendría que conservarlas diez años, algo que BE no garantiza si la persona borra su cuenta. **Propuesta:** decir en los términos que BE no es un sistema de historia clínica, que el profesional de la salud lleva la suya según su ley, y ofrecerle la descarga de lo que carga. Si algún día BE se vende a clínicas como historia clínica, entra de lleno en estas leyes **[decisión de producto a consultar con el abogado]**.

## 4.2 ANMAT: el software como producto médico

La Disp. ANMAT 9688/2019 (art. 26) obliga a inscribir el software autónomo que encuadre en la definición de producto médico de la Disp. 2318/2002, y excluye los programas para usos administrativos generales ([Disp. 9688/2019](https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-9688-2019-332646/actualizacion)). La pregunta es la **finalidad declarada**: un software destinado al diagnóstico, la prevención, el seguimiento o el tratamiento de una enfermedad es producto médico.

- **Queda afuera, razonablemente:** registrar comidas, sesiones y medidas; planificar entrenamientos y alimentación de personas sanas; mostrar evolución sin interpretarla clínicamente.
- **Lo haría entrar:** decir que BE detecta, previene o trata una enfermedad (obesidad, diabetes, trastornos alimentarios), calcular dosis, alertas clínicas automáticas, o un «diagnóstico» de composición corporal con fines médicos.
- **La norma no tiene una exclusión expresa para «bienestar»** como la de otros países **[no la encontré]**: el cuidado está en las palabras de la tienda, el sitio y la publicidad.

## 4.3 Defensa del consumidor (Ley 24.240)

Aplica en cuanto BE cobre a personas (consumidores). Lo que importa ([Ley 24.240, texto actualizado](https://www.argentina.gob.ar/normativa/nacional/ley-24240-638/actualizacion)):

- **Revocación:** en la venta a distancia, la persona puede arrepentirse dentro de los **10 días corridos**, sin costo y sin decir por qué (art. 34).
- **Baja:** por el mismo medio por el que se contrató, sin cargo de preaviso (arts. 10 ter y 10 quáter).
- **Cláusulas abusivas:** se tienen por no escritas las que desnaturalizan las obligaciones, limitan la responsabilidad del proveedor o restringen los derechos del consumidor (art. 37).
- **Jurisdicción:** en los contratos de consumo a distancia, el juez competente es el del domicilio del consumidor y la prórroga de jurisdicción no vale (Código Civil y Comercial, art. 1109) **[secundaria]**. Una cláusula «tribunales de CABA» para personas de otra provincia no sirve.
- **Los botones.** La **Disposición SSDCyLC 954/2025** (Boletín Oficial del 4/9/2025) **derogó las Res. 316/2018 y 424/2020** y hoy exige un enlace «BOTÓN DE ARREPENTIMIENTO» y otro «BOTÓN DE BAJA DE SERVICIO», a simple vista, en el primer acceso y **sin registración previa**, y un código de la solicitud dentro de las **24 horas** ([Boletín Oficial, Disp. 954/2025](https://www.boletinoficial.gob.ar/detalleAviso/primera/330827/20250904)). Va en la web y en la app cuando BE venda suscripciones.

## 4.4 Firma digital y Registro No Llame

- **Ley 25.506.** Aceptar los términos y dar el consentimiento con un toque es **firma electrónica** (art. 5): vale, pero si alguien la desconoce, quien la invoca tiene que probarla. La firma **digital** (con certificado) equivale a la manuscrita, pero no hace falta para una app ([Ley 25.506](https://www.argentina.gob.ar/normativa/nacional/ley-25506-70749/actualizacion)). La evidencia que guarda BE (cuenta, fecha y hora, versión y hash del texto) es lo que hace fuerte esa prueba. La versión actualizada de la ley no registra cambios del DNU 70/2023. El análisis completo, con la reglamentación vigente, está en «La firma digital y el consentimiento electrónico».
- **Ley 26.951 (No Llame).** Alcanza la publicidad por **teléfono** (llamadas y mensajes). No alcanza el correo ni los avisos de la app ([Ley 26.951](https://www.argentina.gob.ar/normativa/nacional/norma-233066/texto)). Si BE algún día llama o manda SMS promocionales, consulta el registro.

## 4.5 Las tiendas

**Google Play**

- **Declaración de apps de salud:** obligatoria para todas las apps desde el 31/8/2024, en Política > Contenido de la app. BE entra en «Salud y bienestar»: actividad y ejercicio, nutrición y control de peso ([Google Play, declaración](https://support.google.com/googleplay/android-developer/answer/14738291?hl=es-419)).
- **Política de salud:** política de privacidad en una URL pública (no PDF), que explique los datos de salud; **descargo en la descripción** de que no es un dispositivo médico y no diagnostica ni trata; recordar que se consulte a un profesional; solo los datos de salud necesarios; prohibidas las afirmaciones de salud engañosas ([Google Play, política de salud](https://support.google.com/googleplay/android-developer/answer/16679511?hl=es-419)).
- **Seguridad de los datos y borrado:** el formulario de la ficha, la eliminación de la cuenta **dentro de la app** y un **enlace web** para pedirla sin instalarla ([Google Play, eliminación de cuentas](https://support.google.com/googleplay/android-developer/answer/13327111?hl=es-419)).
- **Cobros:** las suscripciones a contenido o servicios digitales dentro de la app usan la facturación de Google Play (15 % para suscripciones); los servicios físicos, como un gimnasio, no ([tarifas](https://support.google.com/googleplay/android-developer/answer/112622); [política de pagos](https://support.google.com/googleplay/android-developer/answer/9858738)).

**Apple (para cuando haya iOS)**

- 1.4.1: rigor extra para apps médicas y recordar consultar a un médico; 5.1.1 (v): **borrado de cuenta dentro de la app**; 5.1.2: permiso explícito para compartir datos, **incluidos terceros de IA**; 5.1.3: los datos de salud **no se usan para publicidad** y **no se guardan en iCloud**; 3.1.3 (d): los servicios **uno a uno en tiempo real** (por ejemplo, entrenamiento personal) pueden cobrarse fuera de la compra dentro de la app ([App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)).

## 4.6 El ejercicio profesional

- **BE no reemplaza a un profesional matriculado** y no ejerce la nutrición, la medicina ni el entrenamiento: provee la herramienta. Los términos tienen que decir que el plan y las indicaciones son del profesional, que BE no revisa su contenido clínico, y que la persona consulte a un médico antes de empezar un plan de ejercicio o de alimentación.
- **Nutricionistas:** la Ley 24.301 regula el ejercicio de la licenciatura en nutrición, y su art. 1 la limita a la Capital Federal; las provincias tienen sus colegios y leyes ([Ley 24.301](https://www.argentina.gob.ar/normativa/nacional/norma-697/texto)). La ley dice que el ejercicio es personal y prohíbe prestar la firma o el nombre profesional: BE no debe dejar que un no matriculado aparezca como «nutricionista».
- **Entrenadores y antropometristas:** no encontré una ley nacional que los regule; algunas provincias tienen normas para profesores de educación física **[a confirmar por provincia]**.
- **Verificar la matrícula:** la REFEPS es un repositorio de consulta pública de las matrículas de más de 79 profesiones de la salud ([Res. MSAL 1648/2022](https://www.argentina.gob.ar/normativa/nacional/norma-370489/texto)). Hoy Administración habilita a cada profesional con un fundamento; conviene que ese fundamento incluya la consulta a la REFEPS o al colegio.

# 5. De proyecto a empresa

*Las figuras, la marca, el software y los impuestos.*

> **La idea clave.** **Empezar como monotributista alcanza** para facturar las primeras suscripciones y para inscribir la base. La SAS llega cuando hay socios, inversores o una facturación que no entra en el monotributo, y en ese momento **el software se cede a la sociedad**.

## 5.1 Las figuras

**Tabla 7.** Las figuras posibles para BE y cuándo conviene cada una.

| Figura | Qué es | Ventajas | Cuándo |
| --- | --- | --- | --- |
| Monotributo (persona humana) | Elián factura a su nombre; un pago mensual unifica impuesto, jubilación y obra social | Barato y rápido; factura C en el país y E al exterior | **Ya**, para cobrar las primeras suscripciones |
| SAS (Ley 27.349) | Sociedad por acciones simplificada; puede tener un solo socio | Responsabilidad limitada; acciones con clases; constitución simple | Al sumar socios, inversores o clientes empresa que exijan una sociedad |
| SRL | Sociedad de responsabilidad limitada, por cuotas | Socios fijos, sin capital mínimo legal | Socios estables sin inversores; poco usada en tecnología |
| SA | Sociedad anónima | La forma clásica para rondas grandes | Con inversores institucionales; más controles y costos |

**Monotributo.** El cuadro de ARCA vigente desde el 1/8/2026 llega para servicios hasta la categoría **K** (tope anual de unos $126,6 millones). La categoría A (tope de unos $12 millones por año) paga unos $49.500 por mes, impuesto, jubilación y obra social incluidos ([ARCA, categorías](https://www.arca.gob.ar/monotributo/categorias.asp)). Se factura con **factura C** en el país y **factura E** al exterior ([ARCA, exportación de servicios](https://arca.gob.ar/monotributo/exportacion-servicios/)). Si las facturas E suman al tope del monotributo hay criterios distintos **[a confirmar con el contador]**.

**SAS.** El capital mínimo es de dos salarios mínimos, vitales y móviles (art. 40 de la Ley 27.349). En CABA, la **Res. General IGJ 11/2026** (Boletín Oficial del 22/9/2026) simplificó la constitución: sin dictamen de precalificación, objeto amplio, sede electrónica complementaria y aportes chicos acreditados por declaración jurada **[secundaria]** ([Colegio de Escribanos, RG 11/2026](https://www.colegio-escribanos.org.ar/2026/09/24/igj-resolucion-general-11-26/)). En la Provincia de Buenos Aires, la DPPJ las constituye con formularios digitales desde 2024 ([DPPJ, SAS](https://www.gba.gob.ar/dppj/sociedades_por_acciones_simplificadas_sas)). Hay un proyecto del Poder Ejecutivo para reemplazar la Ley General de Sociedades que integraría las SAS al régimen general **[secundaria; sin sanción confirmada]**.

**Con inversores.** La SAS admite clases de acciones y suele alcanzar al principio. Muchos fondos del exterior piden una sociedad en Delaware que controle a la argentina; es una decisión para cuando haya una ronda concreta **[criterio general, a confirmar con el abogado]**.

## 5.2 La marca «BE»

- **El trámite:** en línea en el INPI, con clave fiscal; la vigencia es de **10 años renovables**, y hay que presentar una declaración jurada de uso entre el 5.º y el 6.º año ([INPI, registrar una marca](https://www.argentina.gob.ar/inpi/marcas/registrar-una-marca); [Ley 22.362](https://www.argentina.gob.ar/normativa/nacional/ley-22362-18803/actualizacion)). Los terceros pueden oponerse dentro de los 30 días de la publicación.
- **El costo:** la Res. INPI 75/2026 creó la UMAPI, que se ajusta por IPC; una clase cuesta 100 UMAPI, unos $37.400 a mayo de 2026 **[valor de noviembre a confirmar]** ([Res. INPI 75/2026](https://www.argentina.gob.ar/normativa/nacional/norma-424092/texto)).
- **Las clases de Niza:9** (la app descargable), **42** (el software como servicio), **44** (servicios de salud y nutrición) y **41** (entrenamiento físico y educación).
- **¿«BE» sola se puede registrar?** La ley admite letras, pero dos letras son un signo **débil**, y «be» es una palabra común del inglés: lo más probable es que ya existan marcas con «BE» en las clases 9 y 42. Desde la Res. INPI 583/2025 el INPI ya no frena de oficio por parecido con marcas anteriores: lo deja para la oposición de terceros **[secundaria]**. Eso facilita conseguir el registro, pero no protegerlo.

> **Recomendación para la marca.** Hacer primero la **búsqueda de antecedentes** en las cuatro clases. Pedir la marca **mixta** (el logo con la palabra) y una **denominativa más distintiva** («BE» con una palabra propia). Si la búsqueda muestra conflictos fuertes, conviene decidirlo **antes** de invertir en dominio, tienda y material.

## 5.3 El software y los impuestos

- **El software** se protege por derecho de autor desde que existe; registrarlo en la DNDA da prueba de fecha y autoría. Está desarrollado en «El software, el copyright y lo legal entre el software y la empresa».
- **Monotributo o régimen general.** Con la SAS, el régimen general es obligatorio: **IVA del 21 %**, Ganancias y registros contables.
- **Ingresos Brutos.** Es provincial: en CABA, una fuente da 3 % para software y SaaS hasta cierto nivel de facturación y 5 % por encima **[a confirmar]**; en la Provincia de Buenos Aires, a confirmar. Si se vende en varias provincias, puede corresponder el Convenio Multilateral.
- **Exportar servicios.** Lo que BE cobre a clientes del exterior se factura con factura E y en general sin IVA. La **Comunicación BCRA A 8417** (9/4/2026) liberó a las personas humanas de liquidar en el país los cobros por exportación de servicios, pero no a las personas jurídicas **[secundaria]** ([BCRA, A 8417](https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8417.pdf)). Es un argumento para cobrar del exterior como persona humana mientras se pueda **[a confirmar con el contador]**.
- **Economía del Conocimiento (Leyes 27.506 y 27.570).** Solo para **personas jurídicas**: una SAS que facture al menos el 70 % en actividades promovidas (el software lo es) y cumpla dos de tres requisitos (mejora continua o calidad, inversión en capacitación o I+D, exportaciones). Las microempresas de menos de 3 años solo acreditan la actividad al inscribirse. Beneficios: estabilidad fiscal, bono de crédito fiscal sobre contribuciones patronales y **60 % menos de Ganancias** para micro y pequeñas empresas. Rige hasta el 31/12/2029 ([Ley 27.570](https://www.argentina.gob.ar/normativa/nacional/norma-343520/texto)). **Para BE, recién con la SAS**; conviene documentar desde ahora las actividades de I+D y calidad.

## 5.4 Cobrar

- **Mercado Pago, suscripciones:** débito automático con comisiones de 6,99 % + IVA (al instante) a 1,49 % + IVA (a 35 días), según la acreditación ([Mercado Pago, suscripciones](https://www.mercadopago.com.ar/herramientas-para-vender/suscripciones)).
- **Google Play:** si la suscripción se vende dentro de la app Android, es obligatoria la facturación de Google, con el 15 %. La alternativa habitual: **cobrar a los profesionales en la web** (fuera de la app) y que la app de la persona sea gratuita, lo que hay que validar con la letra de la política.
- **Stripe no está disponible para cuentas argentinas** (en la región solo figuran Brasil y México) ([Stripe](https://stripe.com/global)). Para cobrar del exterior: PayPal, Payoneer, dLocal o un *merchant of record* como Paddle o Lemon Squeezy, que vende en su nombre y le paga a BE como proveedor **[no verificados en esta sesión]**.
- **Facturación electrónica:** obligatoria para monotributistas y responsables inscriptos; cada cobro con su factura.

# 6. El software, el copyright y lo legal entre el software y la empresa

*Qué protege la ley, de quién es el código, qué pasa con el repositorio público, las licencias de terceros, las cesiones, los secretos, las cuentas y los contratos con proveedores.*

> **La idea clave.** El código de BE está protegido desde que se escribió, y desde el 19/11 declara su licencia (todos los derechos reservados, Ley 11.723), pero **está a la vista de todos**: cerrarlo y documentar la autoría humana es más urgente que registrarlo.

## 6.1 Qué protege la Ley 11.723

- **El software es obra.** La Ley 25.036 (1998) modificó la Ley 11.723 para incluir expresamente los **programas de computación fuente y objeto**, las **compilaciones de datos** y su documentación, y agregó que la explotación del software incluye los contratos de licencia (art. 55 bis) ([Ley 25.036](https://www.argentina.gob.ar/normativa/nacional/norma-54178/texto); Ley 11.723 consolidada en [WIPO Lex](https://www.wipo.int/wipolex/es/legislation/details/85) **[versión consolidada no oficial]**).
- **Qué entra:** el **código** (fuente y objeto), la **documentación** y los manuales, el **diseño** en lo que tenga de expresión original (las pantallas, los íconos propios, los textos de la interfaz) y la **base de datos** como compilación (su selección y organización, no los datos sueltos). Las ideas, los métodos y las funciones en sí **no** se protegen: otro puede hacer «una app de seguimiento con tres áreas» con su propio código.
- **No hace falta registrar** para tener el derecho: nace con la creación. El registro sirve como **prueba** de autoría y fecha.
- **Los plazos.** En general, la vida del autor más 70 años (art. 5). Cuando el titular es una persona jurídica, el plazo puede computarse distinto **[a confirmar con el abogado]**.

## 6.2 El registro en la DNDA

- **Software inédito (no publicado):** depósito en custodia, **opcional**. Se inicia por TAD, se completa la ficha con los autores y su porcentaje, y se entrega una copia **en cualquier soporte** (pendrive, DVD) dentro de un **sobre cerrado y firmado** en la sede (Moreno 1230, CABA), por correo o en receptorías. Arancel publicado: **$1.400[parece desactualizado; a confirmar]**. La custodia dura **3 años**, renovable dentro de los 30 días del vencimiento; si no se renueva, **la obra se destruye** (Decreto 972/2024) ([DNDA, software inédito](https://www.argentina.gob.ar/registrar-la-autoria-de-un-software-inedito)).
- **Software publicado:** trámite «Obra publicada – Software» por TAD, con un pago al Fondo Cooperador DNDA-CESSI y una tasa al Fondo Nacional de las Artes; el instructivo de 2018 daba $3.800, hoy desactualizado ([instructivo DNDA](https://argentina.gob.ar/sites/default/files/2018/03/instructivo_op_software_final.pdf)).
- **¿Código completo o extractos?** La página de la DNDA solo pide «copia de la obra»; no dice si se admiten extractos **[a confirmar con la DNDA]**. La práctica habitual es depositar **una versión identificada (con su hash) del código y la documentación**, y conservar el repositorio completo con su historial como prueba adicional. **Recomiendo** depositar como inédito la versión de la entrega de la tesis (con el hash del commit) y renovar cuando cambie mucho.

## 6.3 La titularidad, cuando el código se hizo con asistencia de IA

**El estado del derecho.**

- **Estados Unidos.** El informe de la Copyright Office sobre IA, Parte 2 (29/1/2025), concluye que los **prompts por sí solos no hacen autor**, pero que el uso de la IA **como herramienta** no impide la protección: se protegen las partes de expresión humana y la selección, el ordenamiento y la modificación creativa de lo generado, caso por caso ([Copyright Office, IA](https://www.copyright.gov/ai/); resumen en [Hogan Lovells](https://www.hoganlovells.com/en/publications/us-copyright-office-issues-report-on-copyrightability-of-ai-assisted-and-generated-works) **[secundaria]**). En *Thaler v. Perlmutter* la Cámara del Distrito de Columbia confirmó en 2025 que hace falta un autor humano, y la **Corte Suprema rechazó revisar el caso el 2/3/2026** ([Mayer Brown](https://www.mayerbrown.com/zh-hans/insights/publications/2026/03/supreme-court-denies-review-in-ai-authorship-case) **[secundaria]**).
- **Argentina.** La Ley 11.723 protege obras de **autores**, y la doctrina entiende que el autor es una persona humana. **No encontré** una norma, un fallo ni una resolución de la DNDA sobre obras hechas con asistencia de IA **[vacío normativo; a confirmar]**. Lo razonable es aplicar el mismo criterio que EE. UU.: lo que Elián decidió, eligió, ordenó, corrigió y escribió es suyo.

**Qué dicen los proveedores de IA.**

- **Anthropic (Claude), términos para consumidores, vigentes desde el 8/10/2025:** la persona conserva sus derechos sobre lo que envía, y «we assign to you all of our right, title, and interest—if any—in Outputs», sujeto a cumplir los términos ([Anthropic, Consumer Terms](https://www.anthropic.com/legal/consumer-terms)). Ese «si los hubiera» es clave: Anthropic cede lo que tenga, pero no garantiza que lo generado sea protegible.
- **OpenAI:** sus términos dicen que, en lo que permita la ley, el usuario es dueño del *output* y OpenAI le cede sus derechos «if any» ([OpenAI, Terms of Use](https://openai.com/policies/row-terms-of-use/) **[la página no se dejó leer; texto confirmado por buscador]**).

**Cómo documentar la autoría humana: BE ya tiene la mejor prueba.** El legajo de decisiones de Dirección (las DL de `docs/DEUDA_LEGAJO.md`, con fecha, opciones, la elegida y su porqué), las actas, los paquetes de trabajo (WP), los requisitos y casos de uso escritos antes del código, y el historial de commits con las revisiones muestran que **Elián definió qué se construía, eligió entre alternativas, rechazó propuestas y aprobó cada integración**. Recomiendo:

1. **Congelar** esa evidencia: un archivo comprimido del repositorio con su historial, con el hash anotado, depositado junto con el software en la DNDA o certificado ante escribano.
2. **Escribir una declaración de autoría** de una o dos páginas: qué decidió Elián, qué herramientas usó (incluida la IA como asistente) y cómo revisó lo generado.
3. Seguir registrando las decisiones en el legajo como hasta ahora.

## 6.4 El repositorio público

**Lo verifiqué el 19/11/2026:** `github.com/Elian-Bufi/be` es **público**. Ese mismo día se sumó el archivo `LICENSE`: «Todos los derechos reservados», con la Ley 11.723 de Propiedad Intelectual.

- **Qué implica.** Con la licencia declarada rigen **todos los derechos reservados**: nadie puede copiar, modificar ni distribuir el código legalmente. Pero **de hecho** cualquiera lo puede leer, clonar y copiar, y probar una copia ilegal cuesta. Además, al estar a la vista se **pierde el secreto comercial** sobre el código, el esquema de datos, el legajo y las decisiones de producto (la Ley 24.766 exige «medidas razonables» para mantener algo secreto) ([Ley 24.766](https://www.argentina.gob.ar/normativa/nacional/41094/texto)). Los términos de GitHub permiten a otros usuarios **ver y hacer fork** de un repositorio público dentro de GitHub.
- **Otro riesgo:** el historial público puede incluir datos que no deberían estar a la vista (nombres de prueba, configuraciones, capturas). Conviene una revisión antes de cualquier decisión.

**Tabla 8.** Las opciones para el repositorio.

| Opción | Qué logra | Qué pierde |
| --- | --- | --- |
| **Privado** (recomendada) | Recupera el control y el secreto hacia adelante; los tutores entran como colaboradores de solo lectura | Lo ya clonado sigue afuera; la tesis necesita dar acceso explícito |
| Público con licencia propietaria | Deja escrito «todos los derechos reservados» y las condiciones de uso | Sigue sin secreto; poco útil frente a lo privado |
| Público con licencia abierta (MIT, Apache, AGPL) | Comunidad, transparencia | **Cualquiera puede usar el código comercialmente** (con AGPL, compartiendo los cambios); difícil vender licencias o marca blanca después |

**Recomendación:** pasarlo a **privado ahora**, sumar un archivo `LICENSE` con «Todos los derechos reservados» y el titular, y decidir una licencia abierta solo si algún día se quiere un modelo de código abierto. **Antes de ser empresa**, el repositorio, la organización de GitHub y sus permisos tienen que quedar a nombre de la sociedad.

## 6.5 Las licencias de terceros que usa BE

Revisé el repositorio en modo lectura (`package-lock.json`, `docs/`, `EVIDENCIA/` y `apps/`).

**Tabla 9.** Las obras de terceros en BE, su licencia y lo que obligan.

| Qué | Licencia | Qué obliga | Situación en BE |
| --- | --- | --- | --- |
| Datos de Open Food Facts | **ODbL 1.0** | Atribución; si se usa públicamente una **base derivada**, ofrecerla con la misma licencia (*share-alike*) | Cada ítem guarda su proveedor, su licencia («Colaboradores de Open Food Facts») y su fecha. **Riesgo:** si se mezclan esos datos con el catálogo propio, la base mezclada podría quedar bajo ODbL: mantenerlos separados e identificados |
| Ejercicios de wger (nombres y traducciones) | **CC BY-SA 3.0 / 4.0** (o CC0, según la entrada) | Atribución con el autor; las obras derivadas (traducciones) con la misma licencia | El catálogo base importa 186 ejercicios con su licencia y autoría. Las 383 imágenes de wger **no se usan** (las de BE son propias o generadas). Falta mostrar la procedencia donde se usa (DL-099, abierta) |
| USDA FoodData Central, SR Legacy | **CC0 1.0** (dominio público) | Nada; la cita es buena práctica | Registrado como CC0 con «USDA Agricultural Research Service» |
| Dependencias npm (más de 1.150 paquetes) | 911 MIT, 66 ISC, 60 Apache-2.0, 35 BSD-3, 27 BlueOak, otras permisivas | Conservar los avisos de copyright y licencia en lo que se distribuye (la APK y el sitio) | **Ninguna GPL obligatoria.** node-forge es «BSD-3 o GPL-2.0» (se elige BSD) |
| sharp / libvips | **LGPL-3.0** (binario opcional por plataforma) | Permitir reemplazar la biblioteca; se usa como biblioteca dinámica en el servidor | Riesgo bajo: corre en el servidor, no se distribuye |
| lightningcss, axe-core | **MPL-2.0** | Compartir solo los cambios a esos archivos | Herramientas de construcción y de prueba; no se modifican |
| Letras Inter y Poppins | **SIL Open Font License 1.1** | Incluir la licencia; no vender la letra sola | Autoalojadas en el sitio con `LICENCIA-INTER.txt` y `LICENCIA-POPPINS.txt`; verificar lo mismo en la APK |
| Íconos y figura de antropometría | Propios | — | Diseño propio (BE-maquetas); la figura no usa imágenes de origen dudoso |
| Imágenes de ejercicios y de recetas generadas con IA | Sin licencia externa | Ninguna; pero **pueden no estar protegidas** por derecho de autor | No se declaran CC0; otros podrían copiarlas |

**Lo que falta:** una **página de atribuciones** completa en la web y en la app (BE ya tiene `/legal/fuentes`, que hay que completar con las dependencias y las letras), el aviso de licencias de terceros en la APK, y mostrar la procedencia en cada lugar donde aparece un dato externo. **Riesgo copyleft:** bajo para el software; **medio para los datos** (ODbL y CC BY-SA son *share-alike*). Licencias: [ODbL](https://opendatacommons.org/licenses/odbl/1-0/), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.es), [SIL OFL](https://openfontlicense.org/) **[enlaces de referencia de cada licencia]**.

## 6.6 La cesión de derechos

- **Empleados.** La Ley 11.723 (art. 4, inc. d, según la Ley 25.036) da la titularidad del software al empleador cuando lo hacen dependientes contratados para eso, en sus funciones, **salvo pacto en contrario**. Igual conviene escribirlo en el contrato.
- **Freelancers y colaboradores.** Esa regla **no** los alcanza: sin una **cesión escrita**, el autor es el freelancer. Todo colaborador firma antes de empezar un contrato con **cesión de derechos patrimoniales** sobre lo que haga para BE, confidencialidad y la obligación de no usar código ajeno incompatible.
- **Socios futuros.** El pacto de socios incluye que lo que aporten sea de la sociedad, y qué pasa si alguien se va (*vesting*).
- **Lo que hizo Elián antes de la SAS.** Hoy el software es de Elián, como persona. Al crear la sociedad se hace un **aporte** del software al capital (valuado) o una **cesión** por contrato (onerosa o gratuita), inscribible en la DNDA ([DNDA, contratos sobre software](https://papelea.com/ar/ministerio-de-justicia/inscribir-un-contrato-sobre-software-obra-multimedia-pagina-web-o-videojuego) **[secundaria]**). Sin eso, la sociedad usaría un software que no es suyo, y un inversor lo va a pedir en su revisión.

## 6.7 El secreto comercial y la confidencialidad

La **Ley 24.766** protege la información que es secreta, tiene valor comercial por serlo y fue objeto de **medidas razonables** para mantenerla secreta; obliga a reservarla a quien accede por su trabajo o una relación de negocios ([Ley 24.766](https://www.argentina.gob.ar/normativa/nacional/41094/texto)). Para BE: el código (si se cierra), el esquema, el legajo, los planes de producto y los precios. Las medidas razonables son el repositorio privado, los accesos por persona y los **acuerdos de confidencialidad (NDA)** con colaboradores, con inversores (aunque muchos fondos no los firman: se comparte con criterio) y con clientes empresa antes de mostrarles algo no público.

## 6.8 El dominio y las cuentas

Hoy todo depende de Elián. Antes de cobrar, y sí o sí antes de la SAS, cada activo tiene que tener un titular claro y un plan de traspaso.

**Tabla 10.** Los activos digitales de BE y cómo pasarlos a la empresa.

| Activo | Qué hacer | Cómo se traspasa |
| --- | --- | --- |
| Dominio | Registrarlo a nombre de Elián con datos que se puedan cambiar; con la SAS, a nombre de la sociedad. Un `.com.ar` se gestiona en NIC Argentina con clave fiscal **[a confirmar el trámite de transferencia]** | Transferencia de titularidad en el registrador |
| Cuenta de desarrollador de Google Play | Hoy es personal; Google pide verificar la identidad y, para organizaciones, un número D-U-N-S | Transferencia de apps entre cuentas desde Play Console |
| Cuenta de Apple Developer | Cuando haya iOS, abrirla como organización (requiere D-U-N-S) | Transferencia de apps en App Store Connect |
| Render, Brevo, GitHub | Cuentas de equipo u organización, con correo de la empresa | Cambiar el propietario o mover los servicios a la organización |
| **La llave de firma de la APK (keystore)** | **Es el activo más delicado**: sin ella no se publican actualizaciones de la misma app. Respaldo cifrado en dos lugares, la contraseña en un gestor, y acceso de una segunda persona de confianza | Con Play App Signing, Google guarda la llave de la app y la del desarrollador se puede reemplazar; confirmar si está activado |
| Correos y dominios de correo | Un correo de privacidad y otro de soporte, de la empresa, no personales | — |

## 6.9 Los contratos con los proveedores

BE es **responsable** frente a sus proveedores, que son **encargados**: Render (alojamiento y base), Brevo (correo), Google (acceso, Play, Firebase si se usa) y Expo (avisos). El art. 25 pide un contrato con cada uno.

- **Render** publica un **Data Processing Addendum** ([render.com/dpa](https://render.com/dpa)); hay que leerlo, ver si se acepta con los términos o se firma aparte, y guardar la constancia **[no pude leer el texto]**.
- **Brevo** tiene su acuerdo de tratamiento dentro de sus condiciones **[a revisar]**; correo sin datos de salud, como ya decidió Dirección.
- **Google** ofrece sus términos de tratamiento de datos para sus servicios a empresas **[a revisar según el servicio]**.
- **Expo** (avisos al teléfono): revisar su política y cuidar que los avisos no contengan datos de salud.

Lo que tiene que tener cada contrato: finalidad limitada, instrucciones, confidencialidad, medidas de seguridad, lista de subencargados, aviso de incidentes, devolución y borrado al terminar, y el mecanismo de transferencia si sale de un país adecuado.

# 7. Distribuir y customizar

*Vender BE a gimnasios, clínicas y equipos, con su marca o con la de BE.*

> **La idea clave.** Cuando una empresa contrata BE para su gente, **la empresa pasa a ser la responsable de los datos y BE, su encargado**. Eso cambia los contratos, la política de privacidad y quién atiende los pedidos de las personas.

## 7.1 Los modelos

- **B2C (hoy):** la persona y el profesional usan BE directamente; BE es responsable.
- **B2B por puestos:** un gimnasio, una clínica o un equipo paga por sus profesionales y sus socios; BE sigue con su marca. La empresa es responsable de los datos de su gente; BE, encargado.
- **Marca blanca:** la empresa ofrece BE con su nombre y sus colores. Además de lo anterior, la tienda: o BE publica la app de la empresa en su cuenta (y la empresa figura en la ficha) o la empresa la publica en la suya. Trainerize lo hace así y lo dice en su política.
- **Customizar el servicio** (configuración, áreas, textos, integraciones) se maneja por contrato; **customizar el producto** (código a medida) exige definir de quién es lo desarrollado: la recomendación es que **todo el código siga siendo de BE** y el cliente reciba una licencia.

## 7.2 Los contratos

**Tabla 11.** Los contratos para vender a empresas y lo que no puede faltar.

| Contrato | Lo que no puede faltar |
| --- | --- |
| Contrato SaaS o de licencia | Objeto y alcance; licencia de uso no exclusiva e intransferible (el software sigue siendo de BE, art. 55 bis de la Ley 11.723); precio y ajuste; plazo y renovación; propiedad de los datos (del cliente y de sus titulares); propiedad de las personalizaciones; responsabilidad con límite (permitido entre empresas); confidencialidad; terminación y **devolución de los datos en un formato útil**; ley y jurisdicción (entre empresas se puede pactar) |
| Contrato de encargado del tratamiento (art. 25) | Que BE trate los datos **solo según las instrucciones** del cliente y para el servicio; deber de secreto del equipo; medidas de seguridad (anexo); subencargados autorizados y su lista; aviso de incidentes en un plazo; ayuda para responder los derechos ARCO; transferencias internacionales y su mecanismo; borrado o devolución al terminar; auditoría razonable |
| Acuerdo de nivel de servicio (SLA) | Disponibilidad comprometida (por ejemplo, 99,5 % mensual), ventanas de mantenimiento, tiempos de respuesta por severidad, respaldo y recuperación (cada cuánto y en cuánto tiempo), créditos de servicio si no se cumple. Hoy Render en planes básicos no garantiza un SLA alto: **no prometer lo que el proveedor no da** |
| Anexo de seguridad | Las medidas concretas (Res. AAIP 47/2018 como base): cifrado, accesos, segundo factor, registro, respaldos, pruebas |

## 7.3 Qué cambia en la privacidad cuando el cliente es responsable

- **Dos políticas:** la de BE para su propia relación (las cuentas de los profesionales que contratan, la facturación, el sitio) y la del cliente para sus socios o pacientes. BE puede darle un modelo.
- **El consentimiento lo obtiene y lo prueba el cliente** (como en Trainerize y TrueCoach), pero **BE puede seguir guardando la evidencia** con su sistema de versiones, a nombre del cliente: es una ventaja comercial.
- **Los pedidos de las personas** van al cliente; BE lo ayuda con las herramientas que ya tiene (descarga, borrado).
- **La inscripción ante la AAIP:** el cliente inscribe su base como responsable; BE declara su base propia y figura como encargado en la del cliente **[a confirmar con el abogado cómo declarar al encargado]**.
- **Separar los datos por cliente** (cada empresa ve solo los suyos) y poder **devolverlos y borrarlos** al terminar el contrato es requisito del art. 25 y conviene diseñarlo antes del primer cliente.

# 8. Cómo lo hacen otras empresas

*Lo que dicen los términos y las políticas de privacidad de nueve empresas del rubro.*

> **La idea clave.** Ninguna de las grandes nombra a la Argentina. La que mejor resuelve el rol frente a los profesionales es la que **lo dice con todas las letras**: el profesional es responsable y la plataforma, encargada.

Leí las páginas vigentes el 19/11/2026. Las citas en inglés vienen de lecturas automáticas: hay que cotejarlas con la página antes de copiarlas a un documento propio. No encontré políticas públicas de Deportnet, Fitco, SportClub ni Megatlon.

## 8.1 Las empresas y sus documentos

- **MyFitnessPal:** [privacidad](https://www.myfitnesspal.com/privacy-policy) y [términos](https://www.myfitnesspal.com/terms-of-service), del 18/3/2025.
- **Cronometer:** [privacidad](https://cronometer.com/privacy/) (23/6/2025) y [términos](https://cronometer.com/terms/) (12/2/2025).
- **Trainerize (ABC Fitness):** [privacidad](https://www.trainerize.com/privacy/) (11/3/2026), [términos para profesionales](https://www.trainerize.com/businessTerms/) (1/8/2026), [términos para clientes](https://www.trainerize.com/endUserTerms/) (20/9/2023) y un [DPA publicado](http://abcfitness.com/wp-content/uploads/Trainerize-Data-Processing-Addendum-2025-07-11.pdf) (no lo pude leer).
- **TrueCoach (Xplor):** [términos de Xplor](https://xplor.com/?p=1062) (febrero de 2026) y [aviso de privacidad](https://xplor.com/privacy-notice/) (marzo de 2026).
- **Strava:** [privacidad](https://www.strava.com/legal/privacy) (1/1/2026) y [términos](https://www.strava.com/legal/terms) (28/9/2026).
- **Fitia** (Perú, Fitia Inc.): [privacidad](https://www.fitia.app/privacy-policy/) y [términos](https://www.fitia.app/terms-of-service/), sin fecha.
- **Wellhub Argentina** (ex Gympass): [privacidad](https://wellhub.com/es-ar/privacy/) (19/12/2023).
- **Recetín** (enfocada en la Argentina): [términos y privacidad](https://www.recetin.net/terms/) (1/5/2026). No pude verificar la razón social.
- **Almendra** (software para nutricionistas, Delaware): [privacidad](https://almendra.io/en/privacy) (19/10/2026) y su [guía sobre la ley argentina](https://almendra.io/en/guides/proteccion-datos-nutricionistas-argentina).

## 8.2 La tabla comparativa

**Tabla 12.** Cómo resuelven nueve empresas los puntos clave de sus políticas y términos.

| Empresa | Qué datos | Base y consentimiento | Venta o publicidad | Transferencia | Retención y borrado | Menores | Jurisdicción | Descargo médico | Rol frente a profesionales |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MyFitnessPal | Peso, medidas, medicación, fotos de progreso; sin ubicación precisa | Consentimiento (UE), sin «explícito» | «No vende», pero cookies que pueden ser «venta»; publicidad dirigida | EE. UU.; marco UE-EE. UU. | «Lo necesario»; borrado irrecuperable | 18 | Nueva York, arbitraje | Fuerte: no crea relación médico-paciente | No aplica |
| Cronometer | Peso, antropometría, condiciones, fotos | Consentimiento; HIPAA donde aplica | No vende; publicidad en el plan gratis | EE. UU.; consentimiento | Inactivas a 36 meses; respaldo «razonable» | 13 (16 con padres) | Columbia Británica, arbitraje | Sí | El profesional es «solely responsible»; el cliente consiente al aceptar la invitación y solo él cierra su cuenta |
| Trainerize | FC, % de grasa, presión, peso, fotos, GPS opcional | Lo obtiene el profesional, también el explícito | No vende; la salud fuera de la publicidad | Varios países; cláusulas tipo y DPA | La fija el cliente; puede borrar al cancelar | 13/16; mayoría de edad | Washington, Columbia Británica, Inglaterra | Fuerte, también para el profesional | **Encargado**: «the customer determines the purposes and means»; contrato entre profesional y cliente |
| TrueCoach (Xplor) | Métricas, nutrición, fotos, GPS | Genérica; la garantiza el coach | Opt-out; respeta GPC | EE. UU.; «contracts» | Sin acceso al terminar; puede borrar | No fija | Nueva York | Sí: no es prestador de salud | **Encargado**: el coach informa, obtiene y **prueba** el consentimiento |
| Strava | FC, HRV, peso, **GPS obligatorio** | Consentimiento | Salud nunca a publicidad; «Do Not Share» | EE. UU.; cláusulas tipo | **45 días** tras la baja | 13 | California; Irlanda en la UE | Fuerte | No aplica |
| Fitia | Peso, medidas, condiciones, fotos | «Expreso» por cargar el dato | No vende sensibles; usa IA de terceros | Consentimiento (Social) | Borrado sin plazo | 15 con padres | Delaware o domicilio | Muy completo, con IA | No aplica |
| Wellhub AR | Ubicación, ingresos, HealthKit | Genérica | Comparte con el empleador; cookies | Cláusulas tipo UE | «Lo necesario» | 16 | No dice | No | Los gimnasios son terceros |
| Recetín | Plan, alergias | Explícito; **cita la Ley 25.326 y la AAIP** | Nunca | Art. 12 de la Ley 25.326 | A pedido; ARCO en 10 días hábiles | 16 | No dice | No | Solo ese profesional ve el plan; desvincular desde Ajustes |
| Almendra | Historia clínica, medidas, fotos | RGPD art. 9.2.h | No vende; Facebook y Google Ads | EE. UU., sin mecanismo | Borra al terminar | No fija | RGPD, Delaware, HIPAA | No visto | **El nutricionista es responsable y la plataforma, encargada** |

## 8.3 Las lecciones para BE

1. **Declarar los roles por escrito**, como Almendra, Trainerize y Xplor, y publicar un **contrato de encargado descargable**, como Trainerize.
2. **Obligaciones concretas del profesional:** informar, usar los datos solo para atender, guardar secreto y no crear ni cerrar cuentas ajenas («solely within the Client's control», Cronometer).
3. **Consentimiento al vincularse, revocable**, con un lugar claro para desvincularse (Recetín). BE ya lo tiene, por área.
4. **Un compromiso explícito de no vender** datos y de **no usar datos de salud para publicidad**, separado de las cookies (Strava, Trainerize).
5. **Plazos numéricos de borrado** (los 45 días de Strava) y qué sobrevive (respaldos, obligaciones legales, datos anonimizados).
6. **Datos agregados acotados:** sin datos identificables para entrenar modelos de terceros (Trainerize).
7. **Descargo médico en dos capas:** uno general y otro para cálculos y estimaciones (Fitia lo hace para su IA), más la obligación del profesional de revisar antes de recomendar.
8. **Un bloque argentino propio:** Ley 25.326, la inscripción ante la AAIP, la leyenda de la AAIP y los plazos de la ley.
9. **Centro de privacidad y exportación** (MyFitnessPal, Strava).
10. **Nombrar el mecanismo de la transferencia y los países**, no solo «consentís».

### Lo que BE hace mejor

- **Consentimiento por área y por profesional, con evidencia inmutable de cada versión.** Ninguna de las nueve lo describe con ese nivel: la mayoría lo deja «a cargo del profesional».
- **La persona controla qué ve cada uno y lo retira sola**, sin pedírselo al profesional.
- **Servidores en la Unión Europea**, mientras casi todas mandan los datos a EE. UU.
- **Sin publicidad ni venta de datos** por diseño, y Administración sin acceso a la salud.
- **Edad mínima de 18**, la más prudente de la tabla junto con MyFitnessPal.

### Lo que casi todas omiten (y BE puede resolver)

Qué pasa con los datos de la persona **cuando el profesional se va**; la **devolución** de los datos al terminar con un profesional o un cliente; las fotos de progreso o de antropometría como dato sensible; y los plazos concretos de retención.

# 9. El plan de acción en etapas

*Cuatro etapas, cada una con sus tareas, quién las hace y los documentos.*

> **La idea clave.** La etapa de hoy no es «sin reglas» por ser una tesis: **ya hay datos de salud de personas reales** (los conocidos y los casos reales de Elián como profesional). Lo mínimo de la primera etapa se hace ahora.

## 9.1 Etapa 1 · Hoy: la tesis y la prueba con conocidos

**Tabla 13.** Etapa 1: tareas, responsables y documentos.

| Tarea | Quién | Documento |
| --- | --- | --- |
| Pasar el repositorio a privado y agregar un `LICENSE` «todos los derechos reservados» | Elián | — |
| Revisar el historial público por datos sensibles o secretos | Elián | — |
| Darse de alta en el monotributo (si no lo está) para tener CUIT como responsable | Elián + contador | Constancia de inscripción |
| Consentimiento escrito y específico de cada conocido y de cada caso real, con su retiro y el borrado al terminar la prueba | Elián | **Consentimiento de prueba** (una página) |
| Congelar la evidencia de autoría (repositorio con historial y hash) y escribir la declaración de autoría | Elián | Declaración de autoría |
| Depositar el software como inédito en la DNDA | Elián | Formulario DNDA |
| Respaldar la keystore en dos lugares cifrados | Elián | Inventario de activos |
| Hacer la búsqueda de antecedentes de la marca | Elián o gestor | Informe de búsqueda |

## 9.2 Etapa 2 · Antes de abrir a desconocidos

**Tabla 14.** Etapa 2: tareas, responsables y documentos.

| Tarea | Quién | Documento |
| --- | --- | --- |
| Validar los diez textos en borrador y completar los «[A COMPLETAR]» | Abogado | **Términos**, **política de privacidad**, **consentimiento de datos de salud**, textos de compartir |
| Inscribir al responsable y la base ante la AAIP | Elián | Constancia y certificado con QR |
| Hacer la evaluación de impacto con la guía AAIP-URCDP | Elián (+ abogado) | Evaluación de impacto |
| Escribir la política de seguridad y el plan de incidentes | Elián | Política de seguridad; plan de incidentes |
| Aceptar y archivar los DPA de Render, Brevo, Google y Expo | Elián | Carpeta de contratos |
| Publicar el canal de derechos y el procedimiento (plazos de la ley) | Elián | Procedimiento ARCO |
| Segundo factor para profesionales (revisar la decisión del 18/11 cuando haya correo) | Elián | — |
| Completar la página de atribuciones y la procedencia de los datos externos | Elián | Página de fuentes y licencias |
| Declaración de apps de salud, Seguridad de los datos y enlace web de borrado en Play | Elián | — |
| Pedir la marca en el INPI (mixta + denominativa) | Elián o gestor | Solicitud |

## 9.3 Etapa 3 · Al empezar a cobrar

**Tabla 15.** Etapa 3: tareas, responsables y documentos.

| Tarea | Quién | Documento |
| --- | --- | --- |
| Elegir la categoría, Ingresos Brutos y la facturación electrónica | Contador | — |
| Elegir cómo se cobra (web con Mercado Pago, o Google Play) | Elián + contador | — |
| Botón de arrepentimiento y botón de baja (Disp. 954/2025) | Elián | — |
| Términos de suscripción: precio, renovación, ajuste, baja, sin cláusulas abusivas, jurisdicción del consumidor | Abogado | **Condiciones de suscripción** |
| Términos para profesionales: roles, deber de secreto, no reemplaza al profesional, historia clínica | Abogado | **Términos para profesionales** |
| Atención al cliente con horarios y un canal (la Disp. 954/2025 pide al menos 8 h de lunes a viernes para las bajas) | Elián | — |
| Seguro de responsabilidad civil profesional y ciberseguro: cotizar | Elián + productor de seguros | Póliza |

## 9.4 Etapa 4 · Al vender a otras empresas

**Tabla 16.** Etapa 4: tareas, responsables y documentos.

| Tarea | Quién | Documento |
| --- | --- | --- |
| Constituir la SAS y ceder o aportar el software, la marca, el dominio y las cuentas | Abogado + contador | Estatuto; **contrato de cesión de software**; actas |
| Inscribir la SAS como responsable ante la AAIP y migrar la base | Elián | Modificación en TAD |
| Contrato SaaS, contrato de encargado (art. 25), SLA y anexo de seguridad | Abogado | **Contrato SaaS**, **contrato de encargado**, **SLA** |
| Separación de datos por cliente; devolución y borrado al terminar | Elián | — |
| NDA con clientes e inversores; pacto de socios con cesión de derechos | Abogado | NDA; pacto de socios |
| Evaluar la inscripción en Economía del Conocimiento | Contador | — |

# 10. Borradores de los textos clave

*Esqueletos con los puntos que no pueden faltar, para que un abogado los complete.*

> **La idea clave.** BE ya tiene los textos escritos en borrador en el código, sin publicar. Estos esqueletos sirven para **revisar que no falte nada** antes de llevarlos al abogado.

## 10.1 Términos y condiciones de uso

1. **Quién presta el servicio:** nombre o razón social, CUIT, domicilio, correo de contacto.
2. **Qué es BE y qué no es:** una herramienta para registrar, planificar y seguir el entrenamiento, la alimentación y las medidas corporales; **no presta servicios de salud, no diagnostica ni trata**, no es historia clínica ni producto médico.
3. **Quién puede usarlo:** mayores de 18; cuenta personal e intransferible; datos veraces.
4. **Los roles:** la persona, el profesional y Administración; el profesional actúa con su propia responsabilidad profesional; BE no revisa el contenido clínico de los planes.
5. **El descargo médico:** consultar a un médico antes de empezar un plan; los cálculos y estimaciones son orientativos y pueden tener errores; ante un síntoma, dejar de entrenar y consultar.
6. **El uso permitido y el prohibido:** sin datos de terceros sin permiso, sin ingeniería inversa, sin contenido ilícito.
7. **La propiedad intelectual:** el software, la marca y el diseño son de BE; el contenido de la persona y del profesional es de ellos, con una licencia a BE solo para prestar el servicio.
8. **Los datos de terceros:** Open Food Facts, wger y USDA, con su licencia y atribución.
9. **El precio, la renovación, el arrepentimiento (10 días) y la baja**, cuando haya cobro.
10. **La disponibilidad:** el servicio puede interrumpirse por mantenimiento; sin promesas que el proveedor no dé.
11. **La responsabilidad:** dentro de lo que permite la Ley 24.240; sin cláusulas que la excluyan del todo frente a consumidores.
12. **La baja y el cierre de la cuenta:** qué se borra, qué se conserva y por cuánto.
13. **Los cambios a los términos:** aviso previo, nueva aceptación cuando cambie lo esencial (BE ya lo hace por versión).
14. **La ley aplicable y la jurisdicción:** ley argentina; tribunales del domicilio del consumidor.

## 10.2 Política de privacidad

1. **El responsable** y su contacto; el **número de inscripción** ante la AAIP.
2. **Qué datos** se tratan, por área (cuenta, salud, entrenamiento, alimentación, medidas, fotos, uso técnico).
3. **Para qué** (finalidades) y **con qué base:** consentimiento expreso para los datos de salud, revocable.
4. **Quién los ve:** el profesional que la persona elige, por área; Administración sin acceso a la salud; los encargados (Render, Brevo, Google, Expo) con su función.
5. **Lo que no se hace:** no se venden, no se usan para publicidad, no se ceden sin consentimiento.
6. **Dónde están:** Alemania (Render, Frankfurt) y los destinos en EE. UU., con el **mecanismo** de cada uno.
7. **Cuánto se guardan:** plazos concretos; respaldos; qué se conserva por obligación legal.
8. **La seguridad:** las medidas principales, en lenguaje claro.
9. **Los derechos:** acceso (10 días corridos), rectificación y supresión (5 días hábiles), retiro del consentimiento, portabilidad (descarga); cómo pedirlos.
10. **La leyenda de la AAIP** sobre su rol de control y el canal de denuncias.
11. **Menores:** no se admiten.
12. **Cambios a la política:** con fecha de vigencia y aviso.

## 10.3 Consentimiento para datos de salud (separado de los términos)

1. Qué datos de salud se van a tratar y para qué, **por área**.
2. Que darlos es **voluntario** y qué funciones no se pueden usar sin ellos.
3. Con quién se comparten (el profesional elegido) y que se puede **retirar** en «Quién ve qué».
4. La transferencia internacional y su mecanismo.
5. La casilla de aceptación **sin marcar**, con la versión y la fecha guardadas.

El texto completo para las personas que hoy usan BE, con estos cinco puntos, una versión para WhatsApp y otra en papel, está en el documento aparte «Consentimiento de BE» (19/11/2026).

## 10.4 Contrato de encargado del tratamiento (para clientes empresa)

1. Partes, objeto y **finalidad única**: prestar BE al cliente.
2. **Instrucciones** del cliente; BE no decide fines.
3. **Confidencialidad** del personal.
4. **Medidas de seguridad** (anexo, con la Res. 47/2018 como base).
5. **Subencargados** autorizados y aviso de cambios.
6. **Incidentes:** aviso al cliente en un plazo (por ejemplo, 48 o 72 horas).
7. **Derechos de los titulares:** BE ayuda con sus herramientas.
8. **Transferencias:** países y mecanismo.
9. **Fin del contrato:** devolución en un formato útil y borrado certificado.
10. **Auditoría** razonable y responsabilidad.

# 11. La firma digital y el consentimiento electrónico

*Qué distingue a la firma digital de la electrónica, cómo se obtiene, si el consentimiento de salud la necesita y para qué sí le conviene a BE.*

> **La idea clave.** El consentimiento de las personas **no necesita firma digital**: alcanza un consentimiento electrónico con buena evidencia, como el que BE ya guarda. La firma digital sirve **para los contratos y los actos de la empresa**, y conviene sacarla **gratis, en la PFDR, antes de constituir la SAS**.

## 11.1 Firma digital y firma electrónica: qué dice la ley

La **Ley 25.506** reconoce las dos y les da efectos distintos ([texto actualizado](https://www.argentina.gob.ar/normativa/nacional/ley-25506-70749/actualizacion)):

**Tabla 17.** La firma digital y la firma electrónica en la Ley 25.506.

|   | Firma digital | Firma electrónica |
| --- | --- | --- |
| Qué es | Un procedimiento matemático con información que solo controla el firmante, verificable por terceros, que identifica al firmante y detecta cualquier cambio posterior (art. 2) | Cualquier conjunto de datos electrónicos asociados a otros, usado como medio de identificación, que no reúne todos los requisitos de la digital (art. 5) |
| Requisito | Un certificado vigente emitido o reconocido por un **certificador licenciado** (art. 9) | Ninguno en particular: un toque en «Acepto», un PIN, un trazo en una pantalla, un servicio privado |
| Equivale a la firma manuscrita | **Sí** (art. 3) y, según el decreto, también a la firma certificada (Decreto 182/2019, Anexo, art. 2) | No por sí sola |
| Autoría e integridad | **Se presumen**, salvo prueba en contrario (arts. 7 y 8) | No se presumen |
| Si alguien la desconoce | Tiene que probar que no es suya | **Quien la invoca tiene que probar que vale** (art. 5) |
| Ejemplo en BE | Un contrato con un gimnasio firmado en la PFDR | El «Aceptar y compartir» de la app, con su constancia |

- **El documento digital cumple la exigencia de escritura** (art. 6). Un texto aceptado en la app es un escrito, aunque no tenga firma digital.
- **La Ley 27.446 (2018) derogó el art. 4**, que excluía de la ley los actos de familia, las disposiciones por causa de muerte y los actos personalísimos. La versión actualizada de la ley **no registra cambios del DNU 70/2023**; sí cambió la reglamentación, con el Decreto 743/2024 («Cómo se obtiene una firma digital hoy»).

## 11.2 Lo que agrega el Código Civil y Comercial

- **Art. 286, la expresión escrita:** puede hacerse «por instrumentos públicos, o por instrumentos particulares firmados o no firmados», en cualquier soporte, siempre que el texto sea inteligible aunque su lectura exija medios técnicos ([CCyC en InfoLEG](https://servicios.infoleg.gob.ar/infolegInternet/anexos/235000-239999/235975/norma.htm)).
- **Art. 287:** un instrumento particular firmado es un «instrumento privado»; los no firmados incluyen los registros visuales o auditivos y cualquier registro de información.
- **Art. 288, la firma:** «La firma prueba la autoría de la declaración de voluntad expresada en el texto al cual corresponde». **En los instrumentos electrónicos, el requisito de la firma queda satisfecho con una firma digital.** Es la regla que hace pesar a la firma digital: **cuando una norma exige «firma»**, la firma electrónica simple no alcanza.
- **Art. 319, el valor probatorio:** el de los instrumentos particulares lo aprecia el juez, ponderando, entre otras pautas, la congruencia con los hechos, la precisión del texto, los usos y prácticas, las relaciones precedentes y **la confiabilidad de los soportes y de los procedimientos técnicos**. Es el artículo que le da valor a la constancia de BE.
- **Art. 1106, contratos de consumo:** cuando una norma exige que el contrato conste por escrito, la exigencia se cumple si el contrato con el consumidor o usuario tiene un **soporte electrónico** u otra tecnología similar. Los términos de BE aceptados en la app cumplen la forma escrita.

## 11.3 Cómo se obtiene una firma digital hoy

**Tabla 18.** Las tres formas de tener firma digital en la Argentina, a noviembre de 2026.

| Forma | Cómo funciona | Requisitos | Costo |
| --- | --- | --- | --- |
| **Plataforma de Firma Digital Remota (PFDR)**, AC Modernización-PFDR | El certificado queda en la plataforma; se firma en el firmador web (firmar.gob.ar) con contraseña y un código de un solo uso (OTP) del celular. **Solo firma archivos PDF**. Solo personas humanas | DNI, CUIL o CUIT, un correo propio y un celular con una app de OTP; turno y presentación ante una Autoridad de Registro, con toma de datos biométricos; unos 30 minutos | **Gratis**: la autoridad certificante no cobra la emisión, la renovación ni la revocación; una AR privada puede cobrar su gestión |
| **Con token**, AC ONTI | El certificado queda en un dispositivo criptográfico (token USB) | Turno ante una Autoridad de Registro y el token homologado, que compra la persona | Certificado sin cargo; el token, a precio de mercado **[a confirmar]** |
| **Certificadores licenciados privados** | Certificados en token o remotos, también para personas jurídicas y aplicaciones | Los de cada certificador | Arancel de cada uno **[a pedir presupuesto]** |

- **Los certificadores con licencia vigente**, según el listado oficial: AC ONTI y AC Modernización-PFDR (públicos), y Encode, Lakaut, Box Custodia de Archivos y Digilogix (privados). La licencia de AC ONTI figura hasta el 12/11/2026 **[a confirmar su renovación]** ([certificadores licenciados](https://www.argentina.gob.ar/firmadigital/certificadoreslicenciados)).
- **La validación remota ya está en la norma.** El **Decreto 743/2024** (Boletín Oficial del 20/8/2024) cambió el Decreto 182/2019: la verificación de identidad «puede o no hacerse de manera presencial», con biometría y validación en tiempo real contra el RENAPER, y la presencia física ya no es «condición ineludible» (Anexo, arts. 21, inc. 2, y 27) ([Decreto 743/2024](https://biblioteca.afip.gob.ar/dcp/DEC_C_000743_2024_08_19)). **Pero la página oficial de la PFDR todavía pide turno y presentación personal** ([solicitar firma remota](https://www.argentina.gob.ar/servicio/solicitar-firma-digital-remota-sin-token)): hoy hay que ir a una AR **[a confirmar si ya hay un canal remoto]**.
- **Para Elián, la PFDR es la opción**: gratis, sin token y con la misma validez que la firma con token. Firma PDF, que es el formato de los contratos.

## 11.4 ¿El consentimiento de salud necesita firma digital?

**No, según la norma y su lectura más razonable[a confirmar con el abogado]**. El razonamiento:

1. **Lo que pide la Ley 25.326 no es una firma: es una forma.** El art. 5 exige que el consentimiento conste «por escrito, o por otro medio que permita se le equipare, de acuerdo a las circunstancias». El art. 7 no agrega una forma especial para los datos sensibles.
2. **El decreto pide autoría e integridad, no firma digital.** El art. 5 del Decreto 1558/2001 encarga a la autoridad de control fijar los requisitos para un consentimiento «por un medio distinto a la forma escrita», que debe «asegurar la autoría e integridad de la declaración» ([Decreto 1558/2001](https://www.argentina.gob.ar/normativa/nacional/decreto-1558-2001-70368/texto)). No encontré una norma de la AAIP que exija firma digital para eso.
3. **La AAIP pide acreditar al titular.** La Res. AAIP 4/2019 dice que, «cualquiera sea la modalidad del consentimiento que se adopte», el responsable debe acreditar que quien lo prestó «sea efectivamente el titular», con «mecanismos de validación de identidad eficaces» ([Res. AAIP 4/2019](https://argentina.gob.ar/normativa/318874_res4AAIP_pdf/archivo)).
4. **Un texto aceptado en la app ya es «escrito».** Es un documento digital (Ley 25.506, art. 6) en un soporte inteligible (CCyC, art. 286), y su valor lo aprecia el juez según la confiabilidad de los procedimientos (CCyC, art. 319).
5. **Exigir firma digital a cada persona sería desproporcionado** y dejaría afuera a casi todos: hoy la tiene una minoría, y la PFDR pide turno presencial. Ninguna de las apps de salud comparadas la pide («Cómo lo hacen otras empresas»).

**Lo que hace fuerte la prueba es la constancia.** BE ya guarda, por cada acto y cada versión de consentimiento, en registros que no se pueden modificar y encadenados entre sí:

**Tabla 19.** La constancia que guarda BE frente a lo que tiene que probar.

| Lo que hay que probar | Lo que guarda BE | Lo que falta |
| --- | --- | --- |
| Qué texto se aceptó (integridad) | La versión del texto mostrado, igual a la aceptada, y su **huella SHA-256** | Publicar las versiones validadas por el abogado |
| Cuándo | Fecha y hora del acto y de su registro | — |
| Quién (autoría) | La cuenta, el actor y la autoría; el ingreso con Google, verificado por Google | **Validar el correo de las cuentas con contraseña** (espera al correo de BE) |
| Desde dónde | La **dirección IP real** (DL-030, opción B) y el dispositivo | — |
| Que no se alteró | Registros solo de agregado; cada versión apunta a la anterior; revocar emite una versión nueva | Respaldos probados y su conservación por escrito |

- **El punto débil es la identidad, no la firma:** una cuenta creada con un correo que nadie verificó prueba poco sobre quién la usa. Con el correo de BE activo, **verificar el correo al crear la cuenta** cierra ese hueco y responde a la Res. 4/2019.
- **Mientras dure la prueba**, el consentimiento por WhatsApp o en papel del documento «Consentimiento de BE» suma una segunda prueba: la respuesta desde el número conocido de la persona, o su firma manuscrita.

## 11.5 Para qué sí le conviene la firma digital a BE

**Tabla 20.** Dónde la firma digital es necesaria, conveniente o innecesaria para BE.

| Caso | ¿Hace falta? | Por qué | Cuándo |
| --- | --- | --- | --- |
| Consentimiento y términos de las personas | **No** | Alcanza el escrito electrónico con constancia («¿El consentimiento de salud necesita firma digital?») | — |
| Términos para profesionales | **No** | Contrato por adhesión aceptado en la app, con la misma constancia | — |
| **Constituir la SAS** | **Muy conveniente** | La Ley 27.349 permite constituirla «por medios digitales con firma digital» (art. 35); si no, la firma de los socios se certifica ante escribano, banco o el registro | Etapa 3, antes de constituirla |
| **Registros de la SAS** (actas, acciones, diario) | **Sí, en la práctica** | Se individualizan por medios electrónicos ante el registro (Ley 27.349, art. 58) | Desde la constitución |
| **Ceder el software a la SAS** | **Conveniente** | Da autoría, integridad y fecha cierta a una cesión que vale mucho | Al constituir la SAS |
| **Contratos con clientes empresa (SaaS)** | **Conveniente** | Una firma electrónica vale, pero ante un desconocimiento BE tendría que probarla; con firma digital, la autoría se presume | Etapa 4 |
| **Contrato de encargado (art. 25)** | **Conveniente** | La ley no pide una forma; si no se usan las cláusulas modelo, el contrato se presenta a la AAIP dentro de los 30 días, y conviene que esté firmado digitalmente | Etapa 4 |
| Inscribir la base en la AAIP por TAD | **No** | TAD se usa con clave fiscal de ARCA, nivel 2 o más | Etapa 1 |
| Aceptar los DPA de Render, Google y Expo | **No** | Se aceptan en línea con sus condiciones | Etapa 2 |

## 11.6 Los servicios privados de firma electrónica

- **DocuSign, Adobe Acrobat Sign y equivalentes** producen, en la Argentina, una **firma electrónica** (art. 5), salvo que usen un certificado de un certificador licenciado argentino. Valen, pero si alguien la desconoce, quien la invoca tiene que probarla. Su ventaja es el **registro de auditoría** (correo, IP, fechas, huella del documento), que ayuda mucho a esa prueba.
- **Los certificadores licenciados privados** (Encode, Lakaut, Box Custodia, Digilogix) ofrecen además **firma digital** con certificado propio, también para personas jurídicas, con costo **[a pedir presupuesto]**.
- **No sirven para el consentimiento de las personas:** sacan el acto de BE, cobran por firma y, si guardan el documento en EE. UU., suman una transferencia internacional de datos de salud. La constancia propia de BE es mejor para esto.
- **Sí pueden servir para contratos B2B** cuando el cliente los pide, siempre que el contrato **no lleve datos de salud**.

## 11.7 La recomendación

> **Lo que recomiendo.** 1. **Ahora:** ninguna firma digital para las personas. El consentimiento electrónico de BE y, durante la prueba, el de WhatsApp o papel.
> 2. **Etapa 2, antes de abrir a desconocidos:** verificar el correo al crear la cuenta, publicar los textos validados y dejar por escrito la conservación de la constancia.
> 3. **Etapa 3, antes de constituir la SAS:** que Elián (y cada socio) saque la **firma digital remota en la PFDR**, gratis, para constituir la SAS por medios digitales, firmar sus actas y la cesión del software.
> 4. **Etapa 4, al vender a empresas:** firmar con firma digital el contrato SaaS y el de encargado del art. 25; un servicio privado solo si el cliente lo exige.

# 12. Las preguntas para el contador y para el abogado

*Para llevar escritas a la primera reunión.*

## 12.1 Para el contador

1. ¿Monotributo ya o SAS directamente? ¿Con qué facturación conviene el salto, contando IVA, Ganancias e Ingresos Brutos?
2. ¿Las facturas E de exportación suman al tope del monotributo? ¿Puedo llegar a la categoría K con servicios?
3. ¿Qué código de actividad e Ingresos Brutos me corresponden (CABA o Provincia de Buenos Aires; Convenio Multilateral si vendo en varias provincias) y qué alícuota tiene el SaaS en 2026?
4. Con la Comunicación BCRA A 8417, ¿me conviene cobrar del exterior como persona humana y no como SAS?
5. Si vendo por un *merchant of record* (Paddle o Lemon Squeezy), ¿cómo facturo y qué pasa con las ventas a argentinos?
6. ¿Cómo facturo lo que cobra Google Play (con su 15 %) y lo que cobra Mercado Pago: por el bruto o por el neto, y en qué fecha?
7. ¿Qué retenciones y percepciones me aplica Mercado Pago y cómo se recuperan?
8. ¿Cuándo y cómo entro en Economía del Conocimiento como microempresa, y qué tengo que documentar desde ahora?
9. ¿Me conviene inscribirme en el Registro MiPyME ya?
10. ¿Cuánto cuesta por mes llevar una SAS frente al monotributo?
11. ¿Cómo se valúa el software si lo aporto al capital de la SAS, y qué impuestos genera una cesión?

## 12.2 Para el abogado

1. **El art. 7 de la Ley 25.326:** ¿el consentimiento expreso es base suficiente para tratar datos de salud en una app privada? ¿Hay un criterio de la AAIP que lo diga?
2. **Los roles:** ¿cómo encuadramos el tramo en que la persona comparte con su profesional (cesión, responsables independientes, encargado)? ¿Qué escribimos en los términos para profesionales?
3. ¿Las notas de un nutricionista en BE son historia clínica según la Ley 26.529? ¿Cómo lo resolvemos en los términos?
4. **La transferencia internacional:** con Render en Frankfurt, ¿alcanza? ¿Cómo cubrimos Google y Expo (EE. UU.): cláusulas de la Res. 198/2023, consentimiento expreso o ambos?
5. **La inscripción en la AAIP:** ¿una base o dos? ¿Qué nombre y qué finalidades, sabiendo que no se pueden cambiar?
6. Los **datos de los conocidos** que ya están en el entorno de prueba: ¿qué consentimiento hace falta y cómo regularizamos lo anterior?
7. **La edad mínima:** ¿alcanza la declaración de 18 años?
8. **Consumidor:** ¿cómo implementamos el botón de arrepentimiento y el de baja (Disp. 954/2025) en una app con suscripción, y qué cláusulas de responsabilidad son válidas?
9. **La marca:** ¿«BE» sola es defendible? ¿Mixta, denominativa con una palabra más, y en qué clases?
10. **El software:** ¿cómo depositamos en la DNDA (completo o extractos)? ¿Cómo documentamos la autoría con asistencia de IA? ¿Aporte o cesión a la SAS?
11. **La SAS:** ¿IGJ con la RG 11/2026 o DPPJ? ¿Cuánto cuesta y cuánto tarda de punta a punta?
12. **B2B:** ¿cómo redactamos el contrato SaaS, el de encargado y el SLA? ¿Qué límite de responsabilidad es razonable?
13. **La firma:** ¿alcanza el consentimiento electrónico de BE (versión, huella, fecha, cuenta e IP) como «medio equiparable» al escrito para datos de salud, o la AAIP espera algo más? ¿Alcanza una respuesta por WhatsApp durante la prueba? («La firma digital y el consentimiento electrónico»)

# 13. Lo que falta analizar

*Lo que un fundador sin experiencia suele pasar por alto, cada uno con su prioridad.*

> **La idea clave.** Ninguno de estos temas frena la tesis, pero **varios frenan un negocio**: el seguro, el plan de incidentes y la continuidad conviene resolverlos antes del primer cliente que pague.

**El seguro de responsabilidad civil y el ciberseguro · Prioridad media (al cobrar).** Una plataforma que muestra planes de entrenamiento y alimentación puede recibir un reclamo por una lesión o un daño atribuido a un plan, aunque el plan lo haga el profesional. Un seguro de responsabilidad civil profesional o de producto tecnológico, y un ciberseguro que cubra el costo de responder a una brecha (forense, avisos, defensa), cuestan menos que un solo reclamo. Hay que cotizarlos con un productor de seguros y verificar que los profesionales tengan su propia póliza de mala praxis.

**El plan ante incidentes y el aviso de brechas · Prioridad alta.** Hoy la ley no obliga a notificar, pero la Res. 47/2018 lo recomienda (con el correo de la AAIP), los proyectos de reforma lo harían obligatorio, y una brecha de datos de salud sin plan es lo que convierte un incidente en una sanción muy grave. El plan dice quién decide, cómo se contiene, cómo se registra, cuándo se avisa a las personas, a la AAIP y a los clientes empresa, y se prueba una vez por año.

**Los menores de edad · Prioridad media.** BE exige declarar 18 años o más, lo que es prudente. Pero un entrenador de equipos juveniles o un nutricionista pediátrico va a querer usarlo con menores. Si algún día se admite, hace falta el consentimiento de los representantes (Código Civil y Comercial, arts. 26 y siguientes), datos mínimos y la Res. 126/2024 agrava las infracciones con menores. Hasta entonces, el texto y el flujo tienen que dejarlo claro, y el profesional no puede cargar a un menor por su cuenta.

**La accesibilidad web · Prioridad baja (sube con el Estado).** La Ley 26.653 obliga al Estado y a las empresas privadas concesionarias o contratistas del Estado, no a toda empresa ([Ley 26.653](https://www.argentina.gob.ar/normativa/nacional/175694/texto)). Si BE vende a un organismo público, a una universidad o a un hospital público, pasa a ser obligatoria. BE ya mide el contraste y usa axe-core en las pruebas: falta TalkBack en la app, pendiente desde octubre.

**La verificación de la matrícula · Prioridad media.** Un «nutricionista» sin matrícula que use BE expone a la persona y a BE (la Ley 24.301 prohíbe prestar el nombre profesional). Administración ya habilita con un fundamento: conviene que el procedimiento escrito incluya la consulta a la REFEPS o al colegio, la fecha y una nueva verificación periódica, y que los términos digan que el profesional declara bajo su responsabilidad estar habilitado.

**La publicidad con declaraciones de salud · Prioridad media.** Una frase como «BE te ayuda a combatir la obesidad» puede convertirla en un producto médico (ANMAT), violar la política de Google Play y ser publicidad engañosa (Ley 24.240 y Ley 22.802 de Lealtad Comercial **[no verificada en esta sesión]**). Conviene una lista de frases permitidas y prohibidas para la tienda, el sitio y las redes, y revisar con ella cada pieza.

**La continuidad y el «bus factor» · Prioridad alta.** Todo está en una persona: el código, las cuentas, la keystore, el conocimiento. Si Elián no puede trabajar un mes, BE se detiene, y si se pierde la keystore no se puede actualizar la app. Hace falta un inventario de activos con dónde está cada credencial (sin escribirlas), un respaldo de la keystore en dos lugares cifrados, una persona de confianza con acceso de emergencia, el manual de operación (ya existe buena parte en el legajo) y respaldos de la base probados con una restauración.

**Los costos fijos y el modelo de negocio · Prioridad alta (antes de cobrar).** Render pago desde el 16/10, el dominio, las cuentas de las tiendas, el correo, el contador, el abogado, el seguro y el monotributo son costos fijos que existen con cero clientes. Conviene una planilla con el costo mensual, el precio por profesional y por persona, y cuántos clientes hacen falta para cubrirlo, y decidir quién paga (el profesional, la persona o la empresa).

**La atención al cliente · Prioridad media.** La Disp. 954/2025 pide atender las bajas al menos 8 horas de lunes a viernes y dar un código de la solicitud en 24 horas; los pedidos ARCO tienen plazos de 5 y 10 días. Hace falta un canal (correo y formulario), respuestas modelo, un registro de cada pedido y alguien que lo mire todos los días hábiles.

**iOS · Prioridad baja (sin presupuesto).** Sin iOS, BE deja afuera a una parte de las personas. Sumarlo implica la cuenta de Apple como organización, las pautas de Apple (borrado en la app, datos de salud fuera de la publicidad y de iCloud, permiso explícito para terceros de IA) y, si se cobra dentro de la app, las reglas de compras de Apple (con la excepción de los servicios uno a uno). Conviene diseñar los textos legales pensando ya en las dos tiendas.

**Las funciones con inteligencia artificial · Prioridad media (si se suman).** Si BE usa un proveedor de IA con datos de las personas, es un encargado más (y probablemente en EE. UU.), Apple exige permiso explícito, y la guía de la AAIP pide evaluar el impacto antes. Fitia muestra cómo describirlo en la política.

**La conservación de los datos y la portabilidad · Prioridad media.** Decidir los plazos concretos (cuentas inactivas, respaldos, registros de auditoría) es lo que hoy está marcado «[A COMPLETAR]» en los textos y lo que pide el formulario de la AAIP. Sin plazos, la base no se puede inscribir bien.

# 14. Las fuentes

*Consultadas el 19 de noviembre de 2026. Las marcadas [secundaria] son estudios o medios.*

> **Datos personales y AAIP.** - Ley 25.326 de Protección de los Datos Personales: https://www.argentina.gob.ar/normativa/nacional/ley-25326-64790/texto
> - Decreto 1558/2001: https://www.argentina.gob.ar/normativa/nacional/decreto-1558-2001-70368/texto
> - Res. AAIP 47/2018, medidas de seguridad recomendadas: https://www.argentina.gob.ar/normativa/nacional/resolución-47-2018-312662/texto · Boletín Oficial: https://www.boletinoficial.gob.ar/detalleAviso/primera/188654/20180725
> - Res. AAIP 126/2024, infracciones y sanciones: https://www.argentina.gob.ar/normativa/nacional/norma-399750/actualizacion
> - AAIP, transferencias internacionales (Disp. 60/2016, Res. 34/2019, 159/2018 y 198/2023): https://www.argentina.gob.ar/aaip/datospersonales/transferencias-internacionales
> - Res. AAIP 198/2023, Boletín Oficial: https://www.boletinoficial.gob.ar/detalleAviso/primera/296189/20231018
> - AAIP, trámites del Registro: https://www.argentina.gob.ar/aaip/datospersonales/tramites · Registrar bases privadas: https://www.argentina.gob.ar/registrar-bases-de-datos-personales-privadas
> - Instructivos de TAD: https://www.argentina.gob.ar/sites/default/files/instructivo_tad_inscripcionymodificacionresponsable_basesprivadas_3.pdf · https://www.argentina.gob.ar/sites/default/files/instructivo_tad_inscripcionymodificacion_basesprivadas_3.pdf
> - Guía de evaluación de impacto (AAIP y URCDP): https://www.argentina.gob.ar/noticias/argentina-y-uruguay-lanzan-la-guia-evaluacion-de-impacto-en-la-proteccion-de-datos
> - Guía de la AAIP sobre IA (2025): https://www.argentina.gob.ar/sites/default/files/guia_ai-final-2025.pdf
> - Proyecto de ley de la AAIP (2023): https://www.argentina.gob.ar/sites/default/files/2018/10/proyecto_leypdp2023.pdf
> - Proyectos 2026 [secundaria]: https://lexlatin.com/entrevistas/ley-datos-personales-argentina-nuevo-proyecto-ley-estandar-rgpd · https://beccarvarela.com/novedades/nuevo-proyecto-de-ley-de-proteccion-de-datos-personales/ · https://leydedatospersonales.tech/ · https://posturas.com.ar/reforma-ley-datos-personales-argentina-congreso/
> - Convenio 108+ (Ley 27.699) [secundaria]: https://www.marval.com/Publicacion/argentina-aprueba-y-se-convierte-en-parte-del-convenio-108-14369?lang=es
> - Sanciones y casos [secundaria]: https://abogados.com.ar/index.php/multa-por-data-breach-en-argentina/29132 · https://www.iapp.org/news/a/ultimas-sanciones-de-la-autoridad-de-proteccion-de-datos-personales-en-argentina

> **Salud, consumidor, firma y tiendas.** - Ley 26.529, derechos del paciente: https://www.argentina.gob.ar/normativa/nacional/ley-26529-160432/texto
> - Ley 27.706, historia clínica electrónica: https://www.argentina.gob.ar/normativa/nacional/ley-27706-380710/texto · Decreto 393/2023: https://www.argentina.gob.ar/normativa/nacional/decreto-393-2023-387475/texto
> - ANMAT, Disp. 9688/2019: https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-9688-2019-332646/actualizacion
> - Ley 24.301, nutricionistas: https://www.argentina.gob.ar/normativa/nacional/norma-697/texto
> - REFEPS, Res. MSAL 1648/2022: https://www.argentina.gob.ar/normativa/nacional/norma-370489/texto
> - Ley 24.240, defensa del consumidor: https://www.argentina.gob.ar/normativa/nacional/ley-24240-638/actualizacion
> - Disp. SSDCyLC 954/2025, botones: https://www.boletinoficial.gob.ar/detalleAviso/primera/330827/20250904
> - Ley 25.506, firma digital: https://www.argentina.gob.ar/normativa/nacional/ley-25506-70749/actualizacion
> - Decreto 182/2019, reglamentario de la firma digital: https://www.argentina.gob.ar/normativa/nacional/320735/texto · Decreto 743/2024, que lo modifica: https://biblioteca.afip.gob.ar/dcp/DEC_C_000743_2024_08_19
> - Firma digital remota (PFDR): https://www.argentina.gob.ar/jefatura/innovacion-ciencia-y-tecnologia/innovacion/firma-digital/pfdr · Solicitarla: https://www.argentina.gob.ar/servicio/solicitar-firma-digital-remota-sin-token · Certificadores licenciados: https://www.argentina.gob.ar/firmadigital/certificadoreslicenciados
> - Código Civil y Comercial (arts. 286 a 288, 319 y 1106): https://servicios.infoleg.gob.ar/infolegInternet/anexos/235000-239999/235975/norma.htm
> - Ley 27.349, SAS (arts. 35 y 58): https://www.argentina.gob.ar/normativa/nacional/ley-27349-273567/texto
> - Res. AAIP 14/2018, leyenda del órgano de control: https://www.boletinoficial.gob.ar/detalleAviso/primera/179914/20180309 · Res. AAIP 4/2019, criterios orientadores: https://argentina.gob.ar/normativa/318874_res4AAIP_pdf/archivo
> - Ley 26.951, No Llame: https://www.argentina.gob.ar/normativa/nacional/norma-233066/texto
> - Ley 26.653, accesibilidad web: https://www.argentina.gob.ar/normativa/nacional/175694/texto
> - Google Play: https://support.google.com/googleplay/android-developer/answer/14738291 · https://support.google.com/googleplay/android-developer/answer/16679511 · https://support.google.com/googleplay/android-developer/answer/13327111 · https://support.google.com/googleplay/android-developer/answer/112622 · https://support.google.com/googleplay/android-developer/answer/9858738
> - Apple, App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/

> **Empresa, marca, software e impuestos.** - ARCA, monotributo: https://www.arca.gob.ar/monotributo/categorias.asp · Exportación de servicios: https://arca.gob.ar/monotributo/exportacion-servicios/
> - IGJ, RG 11/2026 [secundaria]: https://www.colegio-escribanos.org.ar/2026/09/24/igj-resolucion-general-11-26/
> - DPPJ, SAS: https://www.gba.gob.ar/dppj/sociedades_por_acciones_simplificadas_sas
> - INPI, registrar una marca: https://www.argentina.gob.ar/inpi/marcas/registrar-una-marca · Res. INPI 75/2026: https://www.argentina.gob.ar/normativa/nacional/norma-424092/texto · Ley 22.362: https://www.argentina.gob.ar/normativa/nacional/ley-22362-18803/actualizacion
> - Ley 25.036, software: https://www.argentina.gob.ar/normativa/nacional/norma-54178/texto · Ley 11.723 (WIPO Lex): https://www.wipo.int/wipolex/es/legislation/details/85
> - DNDA, software inédito: https://www.argentina.gob.ar/registrar-la-autoria-de-un-software-inedito · Instructivo de software publicado: https://argentina.gob.ar/sites/default/files/2018/03/instructivo_op_software_final.pdf
> - Ley 24.766, confidencialidad: https://www.argentina.gob.ar/normativa/nacional/41094/texto
> - Ley 27.570, Economía del Conocimiento: https://www.argentina.gob.ar/normativa/nacional/norma-343520/texto
> - BCRA, Comunicación A 8417: https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8417.pdf
> - Mercado Pago, suscripciones: https://www.mercadopago.com.ar/herramientas-para-vender/suscripciones · Stripe, países: https://stripe.com/global
> - Copyright Office, IA: https://www.copyright.gov/ai/ · Thaler v. Perlmutter [secundaria]: https://www.mayerbrown.com/zh-hans/insights/publications/2026/03/supreme-court-denies-review-in-ai-authorship-case
> - Anthropic, Consumer Terms: https://www.anthropic.com/legal/consumer-terms · OpenAI, Terms of Use: https://openai.com/policies/row-terms-of-use/
> - Render, DPA: https://render.com/dpa
> - Licencias: ODbL https://opendatacommons.org/licenses/odbl/1-0/ · CC BY-SA 4.0 https://creativecommons.org/licenses/by-sa/4.0/deed.es · SIL OFL https://openfontlicense.org/

> **Empresas comparadas.** - MyFitnessPal: https://www.myfitnesspal.com/privacy-policy · https://www.myfitnesspal.com/terms-of-service
> - Cronometer: https://cronometer.com/privacy/ · https://cronometer.com/terms/
> - Trainerize: https://www.trainerize.com/privacy/ · https://www.trainerize.com/businessTerms/ · https://www.trainerize.com/endUserTerms/
> - TrueCoach (Xplor): https://xplor.com/?p=1062 · https://xplor.com/privacy-notice/
> - Strava: https://www.strava.com/legal/privacy · https://www.strava.com/legal/terms
> - Fitia: https://www.fitia.app/privacy-policy/ · https://www.fitia.app/terms-of-service/
> - Wellhub Argentina: https://wellhub.com/es-ar/privacy/
> - Recetín: https://www.recetin.net/terms/
> - Almendra: https://almendra.io/en/privacy · https://almendra.io/en/guides/proteccion-datos-nutricionistas-argentina

> **El repositorio de BE (solo lectura, 19/11/2026).** - `render.yaml` (región `frankfurt`), `package-lock.json` (licencias), `prisma/schema.prisma` (consentimiento y auditoría), `packages/domain/src/textos-sin-publicar.ts` (los diez textos en borrador), `apps/web/src/letra/` (licencias de las letras), `docs/DEUDA_LEGAJO.md` (DL-028, DL-099, DL-123, DL-169) y `EVIDENCIA/MATERIAL-VISUAL/` (imágenes de wger).
> - GitHub: visibilidad y licencia del repositorio consultadas con `gh repo view`.
