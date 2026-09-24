# Tramo de identidad visual y accesibilidad — definición

> **Estado:** **CERRADO** el 2026-09-24. Definición en `main` antes del código (PR #73); tramos A, B, C y E en el PR #74; D y F, con la versión 0.9.0, en el PR de cierre. Defensa en `DEFENSA/IDENTIDAD.md`, evidencia en `EVIDENCIA/IDENTIDAD/`. El tramo E se integró con A, B y C —no aparte, como decía §9— porque la prueba de contraste cubre las dos superficies y no podía quedar a medias.
> **Autorización.** Es el paso 3 del plan que Dirección eligió el 2026-09-22 («consolidar y pulir»: cerrar WP-07, consolidar, **identidad visual y landing pública**, cierre de entrega), y ejecuta dos decisiones que Dirección ya tomó:
> - **2026-09-21 — identidad visual.** La paleta la elige el ejecutor «con criterio de accesibilidad (WCAG AA)», inspirada en las referencias que mandó Dirección (tema oscuro, degradé azul, isotipo nuevo); se suma una **landing pública**; y «habrá que pulir cada apartado profesional bastante y bien».
> - **2026-09-20 — toma antropométrica (DL-073, opción A).** La carga sobre la figura entra en «un paquete de refinamiento de UI posterior al circuito funcional», con tema **claro y azul**.
>
> **Qué es y qué no es.** No agrega operaciones, RF ni reglas de dominio. Cambia cómo se ve y cómo se usa lo que ya existe, y **mide** una garantía P0 que hasta hoy nadie midió: RNF-ACC-001 figura «NOT VERIFIED» en el 11A (11A:274).

---

## 1. OBJECTIVE

Que BE se vea como un producto y no como un prototipo, sin perder nada de lo que garantiza: una identidad coherente en el website y la APK, una cara pública que explique qué es BE, la toma antropométrica sobre la figura que pidió Dirección, y la accesibilidad de los recorridos núcleo **verificada con una herramienta**.

| Tramo | Qué cambia | Fuente |
|---|---|---|
| **A. Sistema visual y contraste** | Tokens en un solo lugar por superficie, con una prueba automática de contraste | RNF-ACC-001; B10-10 §7, §12, §14 |
| **B. Cara pública** | Encabezado con el isotipo, landing, acceso y legales en tema oscuro | B10-02 §3; 02 §3.2 y §9; 08 §33 |
| **C. Espacio profesional** | Tema claro y azul, ancho de trabajo para datos, pulido sección por sección | B10-10 §9 («PRO desktop»); Dirección 2026-09-21 |
| **D. Toma antropométrica sobre la figura** | Silueta con los puntos de toma del protocolo, y la lista densa como tabla equivalente | DL-073; B10-07 §15, §16, §18; B10-10 §11 |
| **E. APK** | Tema oscuro y el isotipo como ícono | RNF-ACC-001; B10-10 §7 (APK), §14 |
| **F. Auditoría** | axe-core sobre los recorridos núcleo del website, revisión manual de la APK | RNF-ACC-001; TEST-RNF-ACC-001 |

## 2. IDs

| Fuente | ID | Qué exige |
|---|---|---|
| 04 | **RNF-ACC-001** (P0) | «Auditoría automática y revisión manual de acceso, vínculo, Hoy, registro y revisión; navegación por teclado cuando aplique, foco visible, etiquetas, contraste suficiente, estados no dependientes solo del color, objetivos táctiles adecuados y cero defectos críticos de accesibilidad abiertos» (04:896) |
| 04 | RNF-ACC-002 (P0) | Textos comprensibles, sin diagnóstico ni causalidad no sustentada (04:904) |
| 04 | RNF-ACC-003 (P0) | Website y APK operables en su superficie «sin contenido crítico cortado» (04:913) |
| 10 | B10-10 §1, §7, §8, §9, §11, §12, §13, §14 | Invariantes («color ≠ único canal»), foco y teclado, formularios, responsive, visualizaciones, color y semántica, zoom, targets táctiles |
| 10 | B10-02 §3 | `PUBLIC → Crear cuenta` / `→ Iniciar sesión`: el primer estado de la jornada |
| 10 | B10-07 §15, §16, §18 | Captura por familias de medición; «lista densa… foco al siguiente campo»; «asset visual ≠ definición del punto/medición» |
| 02 | §3.2, §9 | Declaración central y propuesta de valor: el contenido de la landing |
| 11A | TEST-RNF-ACC-001, 002, 003 | Hoy «NOT VERIFIED» (11A:274-276) |
| DEUDA | DL-073 | Decidida A; la condición que hereda: **ubicación, nunca calificación** |

## 3. Tramo A — sistema visual y contraste

**Decisión: dos temas, uno por superficie, con la misma marca.** Dirección dio dos señales que parecen opuestas y no lo son: el 2026-09-20 eligió **claro y azul** para trabajar sobre la toma antropométrica, y el 2026-09-21 mandó referencias **oscuras** de la landing y de la APK («Hoy», progreso). Hablan de superficies distintas:

| Superficie | Tema | Por qué |
|---|---|---|
| Landing, acceso, registro y legales | **Oscuro** (navy `#04213F`, cian `#5EE0FB`) | Las referencias del 2026-09-21: la cara pública |
| APK del asesorado | **Oscuro** | Las referencias del 2026-09-21 son pantallas de la APK |
| Website con sesión: espacio profesional y cuenta | **Claro y azul** | La elección del 2026-09-20 para trabajar con datos: lectura prolongada y densidad alta (B10-10 §9) |

La marca es la misma en las tres: el isotipo, la tipografía, el azul y el cian, y un encabezado navy común. Si Dirección prefiere un solo tema, es un cambio de tokens, no de pantallas.

**La paleta se verifica, no se aprecia.** B10-10 §7 deja los «valores exactos de tamaño/tokens» al «sistema visual/prototipo», y RNF-ACC-001 exige contraste suficiente con WCAG 2.2 AA como marco. Cada color vive en un solo lugar por superficie (`apps/web/src/app/tokens.css` y `apps/mobile/src/tema.ts`) y una **prueba automática** (`scripts/contraste.test.cjs`, dentro de `npm test`) lee esos archivos, calcula la relación de contraste de cada par que se usa y falla si baja de **4,5:1** para texto o de **3:1** para bordes de controles y foco (WCAG 1.4.3 y 1.4.11).

La prueba hace visibles dos defectos que ya existían: el borde de los campos (`#d1d5db` sobre blanco, 1,5:1) y el anillo de foco (`#f59e0b` sobre blanco, 2,1:1) no llegan a 3:1. Se separa el borde **decorativo** (divisores, tarjetas: sin requisito) del borde **de control** (campos, casillas: 3:1).

## 4. Tramo B — cara pública

**El encabezado.** Isotipo, «BE» y el aviso de ambiente de prueba (08 §33) sobre navy, igual en las dos superficies del website: así el tema claro y el oscuro son el mismo producto.

**La landing** es el estado `PUBLIC` de B10-02 §3, y lleva a «Crear cuenta» y a «Iniciar sesión» con los rótulos de la referencia de Dirección («Comenzar», «Ya tengo una cuenta»). Su contenido sale del 02, no se inventa:
- el nombre del proyecto —«Plataforma integrada de inteligencia en salud», el de las portadas del legajo— y la bajada «Better Everyday» del compositor de Dirección;
- la declaración central (02 §3.2), dicha en llano;
- qué hace BE por el profesional (02 §9.1) y por el asesorado (02 §9.2);
- los tres dominios del MVP y la regla de que cada uno lo dirige su profesional;
- sin promesas de resultados de salud (RNF-ACC-002) y con el aviso de datos sintéticos (08 §33);
- la descarga de la APK, y la identidad del build (versión, commit, fecha) al pie, que es evidencia de WP-01.

**Acceso, registro y legales** pasan al tema oscuro con el mismo encabezado. Los formularios no cambian de comportamiento.

## 5. Tramo C — espacio profesional

B10-10 §9 («PRO desktop»): navegación superior, **densidad alta permitida**, tablas para listas complejas, detalle contextual. Hoy el contenido vive en una columna de 40 rem y el workspace en 64 rem. Se hace:
- un ancho de trabajo para el workspace del asesorado y los editores de plan;
- un encabezado de contexto del asesorado y pestañas legibles;
- tablas, tarjetas y formularios con la misma escala tipográfica y el mismo ritmo;
- una pasada **por sección** —cartera, resumen, nutrición, entrenamiento, antropometría, formularios, cuenta—, como pidió Dirección, con captura de verificación de cada una antes y después.

Nada de esto cambia qué se muestra ni qué se puede hacer.

## 6. Tramo D — la toma antropométrica sobre la figura (DL-073)

**Lo que dice el legajo y lo resuelve.** B10-07 §18 lo admite y le pone la regla: «La UX puede utilizar ilustraciones, maniquíes, marcadores o referencias visuales para facilitar la toma» y «asset visual ≠ definición del punto/medición: la identificación de la medición pertenece al protocolo/catálogo». Y la API de especificaciones existe para que «website y APK no tengan contenido técnico hardcodeado» (09v11:336).

**Decisión.**
- La figura muestra **los puntos de las métricas que declara el protocolo elegido**, y nada más. Lo que la pantalla sabe es *dónde se dibuja* cada métrica conocida; *qué* se mide lo dice el protocolo. Una métrica del protocolo sin posición en la figura se carga igual, en la lista.
- El protocolo sintético de hoy declara solo peso y talla. Se agrega un **segundo protocolo sintético de demostración** con pliegues y perímetros, rotulado como el primero: «no es un catálogo científico» (REG-06-157). Es contenido de catálogo, no una regla: se agrega por migración con identificador determinista, como el resto del catálogo.
- La silueta es **dibujada para BE** en SVG. Las imágenes del compositor no se usan: su origen y su licencia no están documentados.
- **Ubicación, nunca calificación.** Todos los puntos se dibujan igual; lo único que cambia es si ya tienen valor, y eso se dice con forma y texto («cargado»), nunca con color. Ningún punto se pinta por rango.
- **Tabla equivalente obligatoria** (B10-10 §11): la lista densa de B10-07 §16, agrupada por familia, con teclado numérico y foco al campo siguiente. Es también el camino del teclado y del lector de pantalla: elegir un punto en la figura lleva el foco a su campo en la lista.
- Los contratos ANT de WP-05 **no cambian**: la figura cambia cómo se escribe el valor, no qué se manda. La frontera de registro, el protocolo, la unidad de origen y el momento de la toma siguen igual.
- La prueba de cero juicio se extiende a la figura (condición heredada de DL-073): una prueba verifica que ningún punto recibe un color distinto según su valor.

## 7. Tramo E — APK

Tema oscuro con los tokens de la prueba de contraste, el isotipo como ícono adaptativo sobre navy, y la barra de estado clara. Los targets siguen en 48 dp (B10-10 §14). Nada cambia de comportamiento. La APK se construye **una vez**, al final del tramo, con el árbol limpio.

## 8. Tramo F — auditoría de accesibilidad

RNF-ACC-001 pide auditoría automática y revisión manual de «acceso, vínculo, Hoy, registro y revisión».

- **Website** (acceso, vínculo y revisión): `scripts/auditoria-accesibilidad.mjs` recorre con un navegador real las pantallas núcleo —landing, acceso, registro, cuenta, vínculos, consentimiento, espacio profesional, workspace del asesorado y las pestañas de los tres dominios— con cuentas sintéticas, y corre **axe-core** (reglas WCAG 2.0, 2.1 y 2.2, niveles A y AA) en cada una. **Criterio de cierre: cero violaciones críticas o serias.** Lo moderado o menor se lista con su decisión.
- **APK** (Hoy, registro, acceso, vínculo): no hay un auditor automático equivalente para React Native. La revisión es manual con una lista fija —nombre accesible, rol, estado, target de 48 dp, error asociado al campo— y el contraste de los tokens sí lo verifica la prueba del tramo A.

## 9. Orden y cierre

1. Esta definición → `main`.
2. Tramos A, B y C en una rama; D en otra; E en otra. Se integran en orden A+B+C, D, E.
3. F al final, sobre lo integrado: lo que encuentre se arregla antes de cerrar.
4. Versión 0.9.0 en las tres aplicaciones, despliegue a `test`, URLs verificadas, y la APK.
5. `DEFENSA/IDENTIDAD.md`, `EVIDENCIA/IDENTIDAD/` (la prueba de contraste, el informe de axe-core, la revisión de la APK), DL-073 a CERRADA, y la nota de MESA.
6. Capturas: al final de la entrega, con las demás, por decisión de Dirección del 2026-09-22.

## 10. OUT OF SCOPE

- Gráficos de progreso: Dirección los difirió el 2026-09-21, y cuando vuelvan tienen que respetar INV-06-176/177 (sin interpolar huecos).
- Un selector de tema claro/oscuro para la persona.
- La carga de mediciones por CSV del compositor: Dirección la descartó («era una prueba»); si vuelve, pasa por la procedencia `CONTROLLED_IMPORT` (DL-062).
- La figura en la APK: la toma antropométrica es del profesional, en el website.
