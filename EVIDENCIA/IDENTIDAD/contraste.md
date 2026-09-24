# Contraste de los tokens (RNF-ACC-001; WCAG 2.2, 1.4.3 y 1.4.11)

Generado el 2026-09-24 desde `apps/web/src/app/tokens.css`, `apps/mobile/src/tema.ts` y los pares que verifica `scripts/contraste.test.cjs` (dentro de `npm test`). Mínimo 4,5:1 para texto; 3:1 para bordes de controles, foco y los puntos de la figura antropométrica.

### Website · tema claro (espacio profesional y cuenta)

| Uso | Frente | Fondo | Relación | Mínimo | |
|---|---|---|---|---|---|
| texto de la página | `texto` #0b1b2e | `fondo` #f4f7fb | **16,15:1** | 4,50:1 | Cumple |
| texto en tarjetas, avisos y filas destacadas | `texto` #0b1b2e | `fondo-suave` #eef3fa | **15,56:1** | 4,50:1 | Cumple |
| texto en secciones | `texto` #0b1b2e | `superficie` #ffffff | **17,35:1** | 4,50:1 | Cumple |
| ayudas, notas y datos secundarios | `tenue` #475569 | `fondo` #f4f7fb | **7,05:1** | 4,50:1 | Cumple |
| ayudas dentro de tarjetas | `tenue` #475569 | `fondo-suave` #eef3fa | **6,80:1** | 4,50:1 | Cumple |
| ayudas dentro de secciones | `tenue` #475569 | `superficie` #ffffff | **7,58:1** | 4,50:1 | Cumple |
| enlaces | `enlace` #17459a | `fondo` #f4f7fb | **8,30:1** | 4,50:1 | Cumple |
| enlaces dentro de tarjetas | `enlace` #17459a | `fondo-suave` #eef3fa | **8,00:1** | 4,50:1 | Cumple |
| botón primario | `boton-texto` #ffffff | `boton-fondo` #1f5bc4 | **6,27:1** | 4,50:1 | Cumple |
| botón primario al pasar el puntero | `boton-texto` #ffffff | `boton-fondo-activo` #17459a | **8,92:1** | 4,50:1 | Cumple |
| botón secundario | `boton-secundario-texto` #17459a | `fondo` #f4f7fb | **8,30:1** | 4,50:1 | Cumple |
| botón secundario dentro de una sección | `boton-secundario-texto` #17459a | `superficie` #ffffff | **8,92:1** | 4,50:1 | Cumple |
| mensaje de error junto al campo | `error` #b42318 | `fondo` #f4f7fb | **6,12:1** | 4,50:1 | Cumple |
| título de un aviso de error | `error` #b42318 | `error-fondo` #fef3f2 | **6,05:1** | 4,50:1 | Cumple |
| cuerpo de un aviso de error | `texto` #0b1b2e | `error-fondo` #fef3f2 | **15,96:1** | 4,50:1 | Cumple |
| botón de una acción destructiva | `peligro-texto` #ffffff | `peligro-fondo` #b42318 | **6,57:1** | 4,50:1 | Cumple |
| título de un aviso de éxito | `exito` #067647 | `exito-fondo` #ecfdf3 | **5,40:1** | 4,50:1 | Cumple |
| cuerpo de un aviso de éxito | `texto` #0b1b2e | `exito-fondo` #ecfdf3 | **16,45:1** | 4,50:1 | Cumple |
| marca y navegación del encabezado | `encabezado-texto` #f2f7fc | `encabezado-fondo` #04213f | **15,05:1** | 4,50:1 | Cumple |
| marca y navegación, del otro lado del degradé del encabezado | `encabezado-texto` #f2f7fc | `encabezado-fondo-2` #0a2e52 | **12,77:1** | 4,50:1 | Cumple |
| aviso de ambiente de prueba en el encabezado | `encabezado-tenue` #a9c1da | `encabezado-fondo` #04213f | **8,75:1** | 4,50:1 | Cumple |
| aviso de ambiente de prueba, del otro lado del degradé | `encabezado-tenue` #a9c1da | `encabezado-fondo-2` #0a2e52 | **7,43:1** | 4,50:1 | Cumple |
| borde de campos y casillas (1.4.11) | `borde-control` #6b7a90 | `fondo` #f4f7fb | **4,06:1** | 3,00:1 | Cumple |
| borde de campos dentro de tarjetas | `borde-control` #6b7a90 | `fondo-suave` #eef3fa | **3,91:1** | 3,00:1 | Cumple |
| borde de campos dentro de secciones | `borde-control` #6b7a90 | `superficie` #ffffff | **4,36:1** | 3,00:1 | Cumple |
| contorno del botón secundario | `boton-secundario-borde` #1f5bc4 | `fondo` #f4f7fb | **5,83:1** | 3,00:1 | Cumple |
| borde de un campo con error | `error` #b42318 | `superficie` #ffffff | **6,57:1** | 3,00:1 | Cumple |
| anillo de foco | `foco` #b45309 | `fondo` #f4f7fb | **4,67:1** | 3,00:1 | Cumple |
| anillo de foco dentro de tarjetas | `foco` #b45309 | `fondo-suave` #eef3fa | **4,50:1** | 3,00:1 | Cumple |
| anillo de foco dentro de secciones | `foco` #b45309 | `superficie` #ffffff | **5,02:1** | 3,00:1 | Cumple |
| anillo de foco en el encabezado | `encabezado-foco` #fbbf24 | `encabezado-fondo` #04213f | **9,72:1** | 3,00:1 | Cumple |
| anillo de foco en el encabezado, del otro lado del degradé | `encabezado-foco` #fbbf24 | `encabezado-fondo-2` #0a2e52 | **8,25:1** | 3,00:1 | Cumple |
| contorno de la silueta sobre su tarjeta | `figura-trazo` #2e8fff | `superficie` #ffffff | **3,24:1** | 3,00:1 | Cumple |
| punto de toma sobre la figura | `punto` #17459a | `figura-relleno` #eaf3ff | **7,97:1** | 3,00:1 | Cumple |
| punto de toma sobre su halo | `punto` #17459a | `punto-halo` #c4f0ff | **7,33:1** | 3,00:1 | Cumple |
| anillo de perímetro que sale de la figura | `punto` #17459a | `superficie` #ffffff | **8,92:1** | 3,00:1 | Cumple |

### Website · tema oscuro (landing, acceso, registro y legales)

| Uso | Frente | Fondo | Relación | Mínimo | |
|---|---|---|---|---|---|
| texto de la página | `texto` #f2f7fc | `fondo` #04213f | **15,05:1** | 4,50:1 | Cumple |
| texto en tarjetas, avisos y filas destacadas | `texto` #f2f7fc | `fondo-suave` #07284a | **13,81:1** | 4,50:1 | Cumple |
| texto en secciones | `texto` #f2f7fc | `superficie` #0a2e52 | **12,77:1** | 4,50:1 | Cumple |
| ayudas, notas y datos secundarios | `tenue` #a9c1da | `fondo` #04213f | **8,75:1** | 4,50:1 | Cumple |
| ayudas dentro de tarjetas | `tenue` #a9c1da | `fondo-suave` #07284a | **8,03:1** | 4,50:1 | Cumple |
| ayudas dentro de secciones | `tenue` #a9c1da | `superficie` #0a2e52 | **7,43:1** | 4,50:1 | Cumple |
| enlaces | `enlace` #5ee0fb | `fondo` #04213f | **10,45:1** | 4,50:1 | Cumple |
| enlaces dentro de tarjetas | `enlace` #5ee0fb | `fondo-suave` #07284a | **9,59:1** | 4,50:1 | Cumple |
| botón primario | `boton-texto` #04213f | `boton-fondo` #5ee0fb | **10,45:1** | 4,50:1 | Cumple |
| botón primario al pasar el puntero | `boton-texto` #04213f | `boton-fondo-activo` #a5f0ff | **12,75:1** | 4,50:1 | Cumple |
| botón secundario | `boton-secundario-texto` #5ee0fb | `fondo` #04213f | **10,45:1** | 4,50:1 | Cumple |
| botón secundario dentro de una sección | `boton-secundario-texto` #5ee0fb | `superficie` #0a2e52 | **8,87:1** | 4,50:1 | Cumple |
| mensaje de error junto al campo | `error` #ff9b8f | `fondo` #04213f | **7,99:1** | 4,50:1 | Cumple |
| título de un aviso de error | `error` #ff9b8f | `error-fondo` #3b1a25 | **7,60:1** | 4,50:1 | Cumple |
| cuerpo de un aviso de error | `texto` #f2f7fc | `error-fondo` #3b1a25 | **14,32:1** | 4,50:1 | Cumple |
| botón de una acción destructiva | `peligro-texto` #04213f | `peligro-fondo` #ff9b8f | **7,99:1** | 4,50:1 | Cumple |
| título de un aviso de éxito | `exito` #6ee7b7 | `exito-fondo` #0b3a3a | **8,20:1** | 4,50:1 | Cumple |
| cuerpo de un aviso de éxito | `texto` #f2f7fc | `exito-fondo` #0b3a3a | **11,59:1** | 4,50:1 | Cumple |
| marca y navegación del encabezado | `encabezado-texto` #f2f7fc | `encabezado-fondo` #04213f | **15,05:1** | 4,50:1 | Cumple |
| marca y navegación, del otro lado del degradé del encabezado | `encabezado-texto` #f2f7fc | `encabezado-fondo-2` #0a2e52 | **12,77:1** | 4,50:1 | Cumple |
| aviso de ambiente de prueba en el encabezado | `encabezado-tenue` #a9c1da | `encabezado-fondo` #04213f | **8,75:1** | 4,50:1 | Cumple |
| aviso de ambiente de prueba, del otro lado del degradé | `encabezado-tenue` #a9c1da | `encabezado-fondo-2` #0a2e52 | **7,43:1** | 4,50:1 | Cumple |
| borde de campos y casillas (1.4.11) | `borde-control` #7fa3c8 | `fondo` #04213f | **6,16:1** | 3,00:1 | Cumple |
| borde de campos dentro de tarjetas | `borde-control` #7fa3c8 | `fondo-suave` #07284a | **5,65:1** | 3,00:1 | Cumple |
| borde de campos dentro de secciones | `borde-control` #7fa3c8 | `superficie` #0a2e52 | **5,23:1** | 3,00:1 | Cumple |
| contorno del botón secundario | `boton-secundario-borde` #5ee0fb | `fondo` #04213f | **10,45:1** | 3,00:1 | Cumple |
| borde de un campo con error | `error` #ff9b8f | `superficie` #0a2e52 | **6,78:1** | 3,00:1 | Cumple |
| anillo de foco | `foco` #fbbf24 | `fondo` #04213f | **9,72:1** | 3,00:1 | Cumple |
| anillo de foco dentro de tarjetas | `foco` #fbbf24 | `fondo-suave` #07284a | **8,91:1** | 3,00:1 | Cumple |
| anillo de foco dentro de secciones | `foco` #fbbf24 | `superficie` #0a2e52 | **8,25:1** | 3,00:1 | Cumple |
| anillo de foco en el encabezado | `encabezado-foco` #fbbf24 | `encabezado-fondo` #04213f | **9,72:1** | 3,00:1 | Cumple |
| anillo de foco en el encabezado, del otro lado del degradé | `encabezado-foco` #fbbf24 | `encabezado-fondo-2` #0a2e52 | **8,25:1** | 3,00:1 | Cumple |

### APK · tema oscuro

| Uso | Frente | Fondo | Relación | Mínimo | |
|---|---|---|---|---|---|
| texto de la pantalla | `texto` #f2f7fc | `fondo` #04213f | **15,05:1** | 4,50:1 | Cumple |
| texto en tarjetas y secciones | `texto` #f2f7fc | `superficie` #0a2e52 | **12,77:1** | 4,50:1 | Cumple |
| ayudas y notas | `tenue` #a9c1da | `fondo` #04213f | **8,75:1** | 4,50:1 | Cumple |
| ayudas dentro de tarjetas | `tenue` #a9c1da | `superficie` #0a2e52 | **7,43:1** | 4,50:1 | Cumple |
| enlaces y botón secundario | `acento` #5ee0fb | `fondo` #04213f | **10,45:1** | 4,50:1 | Cumple |
| botón secundario dentro de una tarjeta | `acento` #5ee0fb | `superficie` #0a2e52 | **8,87:1** | 4,50:1 | Cumple |
| botón primario y casilla marcada | `botonTexto` #04213f | `botonFondo` #5ee0fb | **10,45:1** | 4,50:1 | Cumple |
| botón de una acción destructiva | `peligroTexto` #04213f | `peligroFondo` #ff9b8f | **7,99:1** | 4,50:1 | Cumple |
| mensaje de error junto al campo | `error` #ff9b8f | `fondo` #04213f | **7,99:1** | 4,50:1 | Cumple |
| mensaje de error dentro de una tarjeta | `error` #ff9b8f | `superficie` #0a2e52 | **6,78:1** | 4,50:1 | Cumple |
| título de un aviso de error | `error` #ff9b8f | `errorFondo` #3b1a25 | **7,60:1** | 4,50:1 | Cumple |
| cuerpo de un aviso de error | `texto` #f2f7fc | `errorFondo` #3b1a25 | **14,32:1** | 4,50:1 | Cumple |
| título de un aviso de éxito | `exito` #6ee7b7 | `exitoFondo` #0b3a3a | **8,20:1** | 4,50:1 | Cumple |
| cuerpo de un aviso de éxito | `texto` #f2f7fc | `exitoFondo` #0b3a3a | **11,59:1** | 4,50:1 | Cumple |
| borde de campos y casillas (1.4.11) | `bordeControl` #7fa3c8 | `fondo` #04213f | **6,16:1** | 3,00:1 | Cumple |
| borde de campos dentro de tarjetas | `bordeControl` #7fa3c8 | `superficie` #0a2e52 | **5,23:1** | 3,00:1 | Cumple |
| borde de casillas y opciones elegidas | `acento` #5ee0fb | `fondo` #04213f | **10,45:1** | 3,00:1 | Cumple |

### Los dos defectos que la prueba encontró en `main`

| Uso | Antes | Relación | Ahora | Relación |
|---|---|---|---|---|
| Borde de los campos | `#d1d5db` sobre blanco | 1,47:1 | `#6b7a90` | 4,36:1 |
| Anillo de foco | `#f59e0b` sobre blanco | 2,15:1 | `#b45309` | 5,02:1 |
