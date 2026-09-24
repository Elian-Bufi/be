# DEFENSA — Identidad visual y accesibilidad

> Tramo ejecutado el 2026-09-24, paso 3 del plan que Dirección eligió el 2026-09-22 («consolidar y pulir»). La definición (`docs/paquetes/WP-IDENTIDAD-VISUAL.md`) se integró a `main` antes del primer commit de código (PR #73).
>
> **Por qué existe.** Dos pedidos de Dirección —la identidad visual con criterio WCAG AA y una landing pública (2026-09-21), y la toma antropométrica sobre la figura (DL-073, 2026-09-20)— y una garantía P0 que nadie había medido: RNF-ACC-001 figuraba «NOT VERIFIED» en el 11A (11A:274).

## 1. Qué cambió

| Superficie | Antes | Ahora |
|---|---|---|
| Cara pública | Una pantalla blanca con «BE» y dos botones | Landing en tema oscuro con el isotipo, qué es BE (02 §3.2), qué hace por cada persona (02 §9), lo que no hace (02 §14) y la descarga de la APK; acceso, registro y legales en el mismo tema |
| Espacio profesional | Una columna de 40 rem para todo | Tema claro y azul, ancho de trabajo, migas de ubicación, espacio profesional en dos columnas, una tarjeta por asesorado, header contextual del workspace |
| Toma antropométrica | Filas libres de métrica, valor y unidad | La figura con los puntos del protocolo y la lista densa por familia |
| APK | Tema claro genérico | Tema oscuro de las referencias de Dirección, isotipo, ícono nuevo |
| Accesibilidad | Sin medir | Prueba automática de contraste en `npm test` y auditoría axe-core de los recorridos núcleo |

Ninguna operación, contrato ni regla de dominio cambió. El único cambio de datos es un protocolo sintético nuevo, para que la figura tenga qué ubicar.

## 2. Dónde vive cada garantía

### 2.1 El contraste se prueba, no se aprecia

Cada color vive en un solo lugar por superficie —`apps/web/src/app/tokens.css` y `apps/mobile/src/tema.ts`— y `scripts/contraste.test.cjs`, dentro de `npm test`, calcula la relación de contraste WCAG 2.2 de cada par que las pantallas usan: 4,5:1 para texto, 3:1 para bordes de control, foco y los puntos de la figura. La misma prueba falla si una hoja de estilo o un componente escribe un color fuera de los tokens, porque un color que no está en los tokens no se puede verificar.

La prueba encontró dos defectos que ya estaban en `main`: el borde de los campos (`#d1d5db` sobre blanco, 1,5:1) y el anillo de foco (`#f59e0b` sobre blanco, 2,1:1) no llegaban a los 3:1 de WCAG 1.4.11. Los dos quedaron corregidos.

### 2.2 Dos temas, una marca

Dirección pidió claro y azul para trabajar sobre la toma (2026-09-20) y mandó referencias oscuras de la landing y la APK (2026-09-21). Se respetan las dos: la cara pública y la APK son oscuras; el website con sesión, donde se trabaja con datos, es claro. El encabezado navy con el isotipo es el mismo en los dos, y la prueba de contraste verifica los dos temas por separado.

### 2.3 La figura ubica; no califica

El legajo lo permite y le pone la regla: «asset visual ≠ definición del punto/medición» (B10-07 §18). Por eso:
- la figura dibuja **las métricas que declara el protocolo** y que sabe ubicar; lo demás se carga en la lista;
- `puntosDeLaFigura` recibe **qué claves tienen dato**, no los valores: un punto no puede pintarse por rango porque no conoce el valor. Lleno o vacío, siempre del mismo color. La prueba del dominio fija que un punto solo lleva su sitio, su nombre y si tiene dato; el recorrido en el navegador verificó que un pliegue de 8,5 mm y uno de 31 mm se ven idénticos;
- la lista densa es la **tabla equivalente obligatoria** del mapa corporal (B10-10 §11) y el camino del teclado; tocar un punto es un atajo a su campo, no la única forma de llegar (B10-10 §7).

### 2.4 La accesibilidad se audita con una herramienta

`scripts/auditoria-accesibilidad.mjs` recorre con Chrome las pantallas núcleo de «acceso, vínculo y revisión» (RNF-ACC-001) —en escritorio y a 390 px— como una persona, y corre axe-core 4.13.0 con las reglas de WCAG 2.0, 2.1 y 2.2 A y AA sobre el export estático de producción. **Resultado: 42 pantallas, cero violaciones.** Un control negativo —una imagen sin texto alternativo inyectada— se detecta como crítica: la auditoría mira. Lo que axe-core no puede decidir solo (texto sobre un degradé) lo mide la prueba de contraste en los extremos y la mezcla más clara de cada degradé. «Hoy» y «registro» son pantallas de la APK, donde no hay un auditor automático equivalente: su revisión es manual. Todo está en `EVIDENCIA/IDENTIDAD/`.

## 3. Preguntas que puede hacer el tribunal

**¿No es cosmético? ¿Qué garantía agrega?**
RNF-ACC-001 es P0 y pide «contraste suficiente» y «auditoría automática». Antes de este tramo nadie lo había medido, y cuando se midió aparecieron dos defectos reales. Ahora hay una prueba que falla si alguien elige un color que no se lee, y un informe con el resultado de cada pantalla núcleo.

**¿Por qué la figura no marca en rojo un pliegue alto?**
Porque sería un juicio, y RF-048 lo prohíbe: la antropometría de BE registra y compara, no diagnostica. La figura responde «dónde se mide» y «ya lo cargaste»; «cuánto vale» está en la lista, con su unidad de origen, igual que antes.

**¿Por qué dos temas?**
Porque Dirección eligió cada uno para una superficie distinta, y los dos tienen sentido: la cara pública es la marca; el espacio profesional es un lugar de trabajo con lectura prolongada. Si Dirección quiere uno solo, cambian los tokens, no las pantallas.

## 4. Qué quedó fuera

- Los gráficos de progreso, diferidos por Dirección el 2026-09-21.
- Un selector de tema para la persona.
- La carga por CSV del compositor, que Dirección descartó.
- La figura en la APK: la toma es del profesional.
