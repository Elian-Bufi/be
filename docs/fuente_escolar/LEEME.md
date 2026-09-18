# fuente_escolar — documento de la escuela (no versionado)

## Qué es

`Entregables.pdf`: el documento de **requisitos de entrega** del trabajo final de la carrera de Analista de Sistemas de la Escuela Da Vinci (versión 2025.05). Enumera los 14 entregables obligatorios que se cruzan en `docs/mesa/MESA_01`. Los puntos 12 (URL de la APK y de su código) y 13 (URL del website hosteado y de su código) son los que cubre WP-01.

## Por qué no está en el repositorio

Por decisión de Dirección del **2026-09-18**, al publicar el repositorio:

1. **No es material de BE:** es un documento de la institución, y el proyecto no lo redistribuye.
2. **Sus metadatos contienen datos personales de un tercero** (el nombre de quien redactó el documento), y el texto incluye una dirección de correo institucional. BE publica solo datos sintéticos o de su autor.

El archivo se retiró de **todo el historial**, no solo del último commit. En el mismo acto, el email personal del autor de los commits se reemplazó por la dirección `noreply` de GitHub. El detalle está en `DECISIONES_TECNICAS.md`, sección «Publicación del repositorio».

## Dónde está

Se conserva **solo en la copia local de Dirección**, fuera de Git:

```text
_docs_origen/BE_DOCS_PARA_PROYECTO/BE_DOCS/fuente_escolar/Entregables.pdf
```

`_docs_origen/` está en `.gitignore`, y `docs/fuente_escolar/*.pdf` también, para que nadie lo vuelva a agregar por error.

## Cómo se verifica sin publicarlo

El archivo sigue listado en `docs/MANIFEST.sha256`, porque el manifiesto es el de la entrega de Dirección y no se reemite:

```text
cd77a245c683b00a7eceab03bfccc64943e5741905613fa92b903183b49800a8  ./fuente_escolar/Entregables.pdf
```

Quien tenga el PDF original puede comprobar con ese hash que es exactamente la versión que usó el proyecto. La CI (`scripts/verificar-legajo.sh`) verifica byte a byte **todas las demás entradas** del manifiesto y excluye solo las rutas listadas en `docs/MANIFEST_NO_PUBLICADOS.txt`. Si alguna de ellas aparece versionada, la CI falla.
