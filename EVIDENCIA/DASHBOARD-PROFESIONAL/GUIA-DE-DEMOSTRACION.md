# Guion de demostración para Dirección · Entorno profesional

**Duración:** unos 10 minutos. **Dónde:** en una computadora (el entorno profesional es de escritorio), con la web y la
API locales de la rama `wp-dashboard-profesional`. **No está desplegado:** este paquete no tiene merge ni despliegue.
**Datos:** solo sintéticos (`DATOS-SINTETICOS.md`); ninguna persona real.

## Antes de empezar (una vez)

```bash
cd EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas      # Node 22 en el PATH; PostgreSQL 16 local en :55442
./entorno.sh compilar-api && ./entorno.sh compilar-web
./datos/regenerar.sh                                 # arma los datos de hoy y deja la API en :3001
./entorno.sh web                                     # la web en http://localhost:3000
```

El correo del profesional sintético está en `herramientas/trabajo/estado.json` (`proCorreo`; esa carpeta no se sube) y la
contraseña es la credencial sintética de las pruebas (`CREDENCIAL_SINTETICA` en `test/integration/soporte-api.ts`).
Al terminar: `./entorno.sh parar-web` y `./entorno.sh parar-api`.

## El recorrido

1. **Entrar como profesional.** `http://localhost:3000/login` → Espacio profesional → en «Tus asesorados», el asesorado
   A. Se reconoce por su seudónimo, «Asesorado · » seguido de los últimos seis caracteres de `aseId` en `estado.json`
   (B y C son la vista parcial y el conjunto de volumen).
2. **Resumen: ¿qué necesito revisar?**
   - Arriba, cuatro indicadores: energía (media de los días con valor, **sin contar hoy**, que sigue en curso), registros,
     peso (con la primera toma **comparable**: el cambio de protocolo no se cruza) y series de un ejercicio.
   - «Qué se registró en el período»: días con registro sobre días del período, registros sin cantidades, anulados y
     rectificados. Es cobertura, no adherencia: no hay porcentajes ni colores de juicio.
   - «Lo último que pasó», con las cargas tardías marcadas.
3. **Línea de tiempo: ¿qué pasó y cuándo?**
   - Filtrar: chip **Nutrición** y tipo **Comida registrada**. Los filtros quedan en la dirección de la página; la
     búsqueda no (puede nombrar algo de salud).
   - Buscar «cena»: recorre todo el período, no solo lo cargado.
   - El día de ayer: la merienda **anulada** sigue en la historia; el almuerzo **rectificado** es una sola entrada.
   - «Abrir registro»: se abre a la derecha, con la lista a la vista. Esc lo cierra y la lista queda donde estaba.
4. **Analizar: tres métricas.**
   - En «Empezar por una pregunta»: **¿Cómo evoluciona el peso junto con la alimentación registrada?** Tres paneles
     (kcal, g y kg), cada uno con su unidad, la misma fecha elegida y la lectura fija a la derecha.
   - Con el gráfico enfocado, las flechas cambian la fecha. En un día sin toma, el peso dice «Sin dato en esta fecha» y
     el más cercano, «No es simultáneo»: nada se interpola.
   - Hoy aparece **hueco**: es un día en curso. Los huecos de semanas anteriores son subtotales (falta algún dato).
   - El peso de fines de agosto queda **suelto**: es otro protocolo. La línea se corta y no se calcula una diferencia a
     través del corte, aunque parezca un salto.
   - «Superpuestas» está deshabilitado y dice por qué (unidades distintas). Proteínas con carbohidratos sí se superponen.
   - **Abrir el origen de un dato:** en la lectura, «Ver el origen de este dato» abre el registro de comida que sostiene
     ese punto.
5. **Comparar períodos.** «¿Qué cambió entre dos etapas?» llena dos rangos. La tabla dice el criterio, cuántas
   observaciones, la duración y la diferencia, con la aclaración «coincidencia temporal; no indica causa».
6. **Guardar la vista** en «Vistas guardadas» y volver a abrirla: se guarda la configuración, nunca los datos, y al
   abrirla los permisos se vuelven a validar.
7. **Permisos (opcional).** El asesorado B muestra un solo aviso de vista parcial y no ofrece Entrenamiento. El otro
   profesional sintético (`terceroCorreo`) no ve nada de A.

## Lo que hay que tener presente al interpretar

- **Registrado no es consumido ni prescripto:** un día con una comida sin cantidades es un subtotal, nunca la ingesta del
  día. Una semana con menos registros tiene menos cobertura, no necesariamente menos consumo.
- **Coincidir en el tiempo no es causar:** ver el peso y la energía juntos no prueba que una cosa explique la otra.
- **Los cambios de método cortan la comparación:** un protocolo distinto no es un cambio del cuerpo.
- **El peso no es grasa ni músculo,** y la carga de un ejercicio no es fuerza máxima ni gasto energético.
- **Lo que no se ve no se cuenta:** con vista parcial, faltan datos de otras áreas o de otros profesionales, y se avisa.
