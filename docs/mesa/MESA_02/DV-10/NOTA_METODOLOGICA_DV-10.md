# Nota metodológica del Gantt (DV-10)

> Para el tribunal. Cada cifra sale del repositorio al corte del 2026-10-02 (commit `c61b8f5`); el detalle y la forma de verificarla están en `DV-10_GANTT.md` §10.

## Por qué se especificó todo antes de construir

Las razones están escritas antes del primer commit:
- **Lo exige el legajo.** El 00 fija el orden: los documentos 00 a 12 primero, y después la implementación (00 §6.1). Además prohíbe tocar modelos persistentes, autorización, consentimiento o retención antes de G3, y pantallas antes de G4 (00 §8.1 y §8.2). BE trata datos de salud: esas reglas tenían que existir antes del primer modelo.
- **El 02 puso esos riesgos primero.** Código previo incompatible (RSK-002), modelo de datos inestable (RSK-004) y autorización defectuosa (RSK-005).
- **El intake lo confirmó.** El código anterior tenía 0 coincidencias exactas de schema con el 06 y 21 conflictos estructurales, y Dirección decidió construir de cero contra la especificación (ACTA-DIR-034 §11).
- **Es un proyecto individual con agentes.** Quien escribe el código no es quien fijó lo que debe hacer. El legajo es el contrato que leen el productor y el revisor (ACTA-DIR-034 §6), y `scripts/verificar-legajo.sh` lo verifica byte a byte en cada push.

## Qué se obtuvo

- **Una trazabilidad cerrada y contada antes del código.** 69 RF activos, 38 RNF, 56 casos de uso y 122 operaciones P0 del contrato, más las 209 unidades que el 06 declara cubiertas.
- **Dos errores encontrados al leer un documento contra otro, antes de programar.** Faltaban las operaciones del consentimiento A3 (ACTA-DIR-028) y la trazabilidad de RF-069 tenía un falso negativo (ACTA-DIR-031).
- **Paquetes que arrancan sabiendo qué hacer.** De WP-02 a WP-07, cada uno entró a git primero con su definición por IDs y después con el código. Los seis entraron entre el 2026-09-18 a las 20:05 y el 2026-09-22 a las 19:49: identidad, vínculo y consentimiento, nutrición, antropometría, entrenamiento e información pertinente.
- **Los desacuerdos quedaron escritos, no resueltos en silencio.** `docs/DEUDA_LEGAJO.md` registra 114 tensiones entre el legajo y la realidad, cada una con sus opciones.

## Qué costó

- **Calendario.** El 02 apuntaba a terminar todo el roadmap el 2026-08-27 (02 §18.2). La documentación cerró el 2026-09-09 (ACTA-DIR-033.2) y la construcción empezó el 2026-09-16. Si se toma la fecha que declara el 00 (2026-07-18), la documentación duró 53 días contra las 5 a 6 semanas presupuestadas (00 §7.4). Esa fecha de inicio no tiene acta en el repositorio.
- **Rigidez.** El legajo protegido no se edita desde el repositorio. 16 deudas decididas esperan su reemisión (`docs/QUE-FALTA.md` §4).
- **Alcance.** Al corte faltan 22 de las 122 operaciones P0 (`docs/QUE-FALTA.md` §2). Entre ellas, el alta y la verificación de profesionales con rol administrador. Dirección eligió consolidar el 2026-09-22.
- **Un desvío de proceso, declarado.** WP-01 se ejecutó antes de firmar el gate (DL-001), y ACTA-DIR-034 lo ratificó.

## Cómo se usó el tiempo

- **Especificación.** Las 15 actas del repositorio caen entre el 2026-09-06 y el 2026-09-09; 10 de ellas, el 7. Fechan aprobaciones, no redacción. Las anteriores (001 a 020) no están en el repositorio.
- **Pausa.** Del 10 al 15/09 no hay actas ni commits.
- **Construcción.** Fueron 17 días con commits todos los días, del 2026-09-16 al 2026-10-02: 440 commits, 129 PR integrados y 19 releases de la APK. Los días de más actividad fueron el 20/09 (60 commits, WP-05), el 30/09 (55) y el 19/09 (54, WP-03 y WP-04).
- **Reparto del tiempo de construcción.**
  - Los seis paquetes centrales tomaron unos cuatro días.
  - Desde el 22/09, el tiempo fue a consolidar, a la identidad visual y a cerrar la entrega.
  - También fue a WP-08 y a las mejoras que pidió Dirección (DL-096, el Plan Funcional Profesional y DL-111 a DL-113).
- **Qué no mide.** Los commits miden actividad, no horas: no hay registro de horas ni de sesiones.
