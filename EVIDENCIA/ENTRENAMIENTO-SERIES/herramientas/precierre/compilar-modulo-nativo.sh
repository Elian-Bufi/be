#!/usr/bin/env bash
# Verificación de compilación del módulo nativo del reloj (precierre del 2026-10-06, §3), sin Gradle y sin construir
# una APK: compila apps/mobile/modules/reloj-del-sistema con el compilador de Kotlin que dejó Gradle en su caché, contra
# android.jar y contra las clases de expo-modules-core de la misma versión que usa la app.
#
# Qué prueba: que el Kotlin del módulo compila contra la API real de Android (android-36) y de expo-modules-core
# 57.0.18 (Module, ModuleDefinition, Function, appContext). Qué no prueba: que Gradle lo enlace en la APK (eso lo resuelve
# `npx expo-modules-autolinking resolve -p android`, que lo lista) ni su comportamiento en un teléfono.
#
# Uso (Git Bash en Windows, con Java en el PATH):
#   bash EVIDENCIA/ENTRENAMIENTO-SERIES/herramientas/precierre/compilar-modulo-nativo.sh <clases de expo-modules-core> [salida]
# <clases de expo-modules-core>: un classes.jar compilado de expo-modules-core 57.0.18, por ejemplo el de una compilación
# anterior de la APK: node_modules/expo-modules-core/android/build/intermediates/compile_library_classes_jar/release/
# bundleLibCompileToJarRelease/classes.jar.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/../../../.." && pwd)"
CLASES_DE_EXPO="${1:?falta el classes.jar de expo-modules-core}"
SALIDA="${2:-$(mktemp -d)}"
CACHE="${GRADLE_USER_HOME:-$HOME/.gradle}/caches/modules-2/files-2.1"
SDK="${ANDROID_HOME:-$HOME/AppData/Local/Android/Sdk}"
jar() { find "$CACHE/$1/$2" -name "$3-$2.jar" | head -1; }
ruta() { if command -v cygpath >/dev/null; then cygpath -w "$1"; else echo "$1"; fi; }
SEP=';'; command -v cygpath >/dev/null || SEP=':'

COMPILADOR=""
for par in "org.jetbrains.kotlin/kotlin-compiler-embeddable 2.1.20 kotlin-compiler-embeddable" "org.jetbrains.kotlin/kotlin-stdlib 2.1.20 kotlin-stdlib" \
  "org.jetbrains.kotlin/kotlin-script-runtime 2.1.20 kotlin-script-runtime" "org.jetbrains.kotlin/kotlin-reflect 1.6.10 kotlin-reflect" \
  "org.jetbrains.kotlin/kotlin-daemon-embeddable 2.1.20 kotlin-daemon-embeddable" "org.jetbrains.intellij.deps/trove4j 1.0.20200330 trove4j" \
  "org.jetbrains.kotlinx/kotlinx-coroutines-core-jvm 1.8.0 kotlinx-coroutines-core-jvm" "org.jetbrains/annotations 13.0 annotations"; do
  # shellcheck disable=SC2086
  j=$(jar $par)
  [ -f "$j" ] || { echo "Falta en la caché de Gradle: $par" >&2; exit 2; }
  COMPILADOR="${COMPILADOR:+$COMPILADOR$SEP}$(ruta "$j")"
done
STDLIB=$(ruta "$(jar org.jetbrains.kotlin/kotlin-stdlib 2.1.20 kotlin-stdlib)")
ANDROID_JAR=$(ruta "$SDK/platforms/android-36/android.jar")
FUENTE="$RAIZ/apps/mobile/modules/reloj-del-sistema/android/src/main/java/expo/modules/relojdelsistema/RelojDelSistemaModule.kt"

mkdir -p "$SALIDA"
java -Xmx1g -cp "$COMPILADOR" org.jetbrains.kotlin.cli.jvm.K2JVMCompiler -no-stdlib -no-reflect -jvm-target 17 \
  -classpath "$ANDROID_JAR$SEP$(ruta "$CLASES_DE_EXPO")$SEP$STDLIB" -d "$(ruta "$SALIDA")" "$(ruta "$FUENTE")"
echo "Compiló. Clases:"
(cd "$SALIDA" && find . -name '*.class' | sort)
