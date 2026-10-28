<#
.SYNOPSIS
Lanzador del AAB de BE para Google Play: comprueba, instala, construye y verifica, en ese orden, y se detiene ante el
primer fallo. WP-GOOGLE-PLAY-PRUEBAS-INTERNAS (2026-10-28, noche).

.DESCRIPTION
Pensado para correrlo con la PC lo más libre posible (sin Claude ni Chrome), desde el árbol de la rama de versión:

  Iniciar:    powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\bufim\BE-aab\scripts\aab\lanzar-aab.ps1
  Consultar:  powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\bufim\BE-aab\scripts\aab\lanzar-aab.ps1 -Consultar
  Solo comprobar (sin instalar ni construir):  ... -SoloComprobar

Qué hace, en orden, y se detiene en el primer paso que falla (sin reintentos, sin seguir con un artefacto anterior):
  1. Comprobaciones: Node 22 (el de fnm), npm, git; rama de versión, commit igual al publicado, árbol limpio;
     herramientas (JDK de Android Studio, build-tools 36, NDK, bundletool, tar, curl); los archivos de datos y del
     respaldo (solo si existen: nunca los lee); memoria y disco libres. Si algo falta: BLOQUEADO.
  2. npm ci (el procedimiento documentado; un árbol espejado no sirve).
  3. node scripts/aab/construir-aab.mjs (prebuild + :app:bundleRelease, un worker, firma desde el respaldo solo por el
     entorno del proceso hijo). Comprueba que el artefacto sea nuevo y de este commit.
  4. node scripts/aab/verificar-aab.mjs contra el esperado.json de esta construcción (con --respaldo, para que busque
     los valores literales de las contraseñas dentro del bundle sin escribirlos).
  5. Revisa el registro con el mismo detector de credenciales del verificador.

Deja todo en C:\Users\bufim\BE-artefactos\aab\registros\<fecha-hora>\ (lanzador.log, estado.json, verificacion.md y
.json, construccion.json, esperado.json), y un puntero en registros\ultimo.json. El registro no tiene credenciales:
el lanzador no lee ninguna; los scripts que las usan no las imprimen. Resultado final en una sola línea:
TERMINADO (código 0), FALLÓ en <paso> (1) o BLOQUEADO por <motivo> (2).

No publica, no integra, no despliega, no genera claves ni cambia configuraciones remotas.
#>
[CmdletBinding()]
param(
  [switch]$Consultar,
  [switch]$SoloComprobar,
  [string]$Rama = 'aab/candidata-0.18.0-2',
  [int]$MinimoMb = 3000,
  [int]$MinimoDiscoGb = 10,
  [string]$Salida = 'C:\Users\bufim\BE-artefactos\aab',
  [string]$Respaldo = 'C:\Users\bufim\be-firma-respaldo',
  [string]$Datos = 'C:\Users\bufim\BE-datos-locales',
  [string]$Node22 = 'C:\Users\bufim\AppData\Roaming\fnm\node-versions\v22.23.2\installation',
  [string]$JavaHome = 'C:\Program Files\Android\Android Studio\jbr',
  [string]$AndroidHome = "$env:LOCALAPPDATA\Android\Sdk",
  [string]$Bundletool = 'C:\Users\bufim\BE-herramientas\bundletool'
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Utf8SinBom = New-Object System.Text.UTF8Encoding($false)

$Raiz = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Registros = Join-Path $Salida 'registros'
$Puntero = Join-Path $Registros 'ultimo.json'

# ─── consultar el último lanzamiento ─────────────────────────────────────────────────────────────

if ($Consultar) {
  if (-not (Test-Path $Puntero)) {
    Write-Host "No hay lanzamientos registrados en $Registros."
    exit 3
  }
  $ultimo = Get-Content $Puntero -Raw -Encoding UTF8 | ConvertFrom-Json
  $carpeta = $ultimo.registro
  $estadoArchivo = Join-Path $carpeta 'estado.json'
  if (-not (Test-Path $estadoArchivo)) {
    Write-Host "El último lanzamiento ($carpeta) no dejó estado.json."
    exit 3
  }
  $e = Get-Content $estadoArchivo -Raw -Encoding UTF8 | ConvertFrom-Json
  $vivo = $false
  if ($e.estado -eq 'en-curso' -and $e.pid) { $vivo = $null -ne (Get-Process -Id $e.pid -ErrorAction SilentlyContinue) }
  Write-Host ''
  Write-Host "Último lanzamiento: $carpeta"
  Write-Host ("Inicio: {0}   Fin: {1}   Rama: {2}   Commit: {3}" -f $e.inicio, $e.fin, $e.rama, $e.commit)
  switch ($e.estado) {
    'terminado' { Write-Host "RESULTADO: TERMINADO. El AAB está verificado: $($e.artefacto)" -ForegroundColor Green }
    'comprobado' { Write-Host 'RESULTADO: COMPROBACIONES OK (fue un -SoloComprobar; no se instaló ni se construyó nada).' -ForegroundColor Green }
    'fallo' { Write-Host ("RESULTADO: FALLÓ en el paso «{0}»: {1}" -f $e.paso, $e.motivo) -ForegroundColor Red }
    'bloqueado' { Write-Host ("RESULTADO: BLOQUEADO por {0}" -f $e.motivo) -ForegroundColor Yellow }
    'en-curso' {
      if ($vivo) { Write-Host ("EN CURSO: paso «{0}» (proceso {1} vivo)" -f $e.paso, $e.pid) -ForegroundColor Cyan }
      else { Write-Host ("INTERRUMPIDO: quedó en el paso «{0}» y el proceso {1} ya no existe (se cerró la ventana, se apagó la PC o lo mató el sistema). No terminó." -f $e.paso, $e.pid) -ForegroundColor Red }
    }
    default { Write-Host "Estado desconocido: $($e.estado)" }
  }
  if ($e.verificacion -and $e.verificacion.archivo -and (Test-Path $e.verificacion.archivo)) {
    $linea = Get-Content $e.verificacion.archivo -Encoding UTF8 | Where-Object { $_ -like '*Todo bien*' } | Select-Object -First 1
    if ($linea) { Write-Host "Verificación: $linea" }
    Write-Host "Detalle: $($e.verificacion.archivo)"
  }
  if ($e.registroRevisado -and $e.registroRevisado.hallazgos -gt 0) { Write-Host "ATENCIÓN: el detector de credenciales marcó $($e.registroRevisado.hallazgos) hallazgo(s) en el registro: revisalo antes de compartirlo." -ForegroundColor Yellow }
  $log = Join-Path $carpeta 'lanzador.log'
  if (Test-Path $log) {
    Write-Host ''
    Write-Host "Últimas líneas de $log :"
    Get-Content $log -Tail 25 -Encoding UTF8 | ForEach-Object { Write-Host "  $_" }
  }
  switch ($e.estado) { 'terminado' { exit 0 } 'comprobado' { exit 0 } 'fallo' { exit 1 } 'bloqueado' { exit 2 } default { exit 3 } }
}

# ─── registro ────────────────────────────────────────────────────────────────────────────────────

$Inicio = Get-Date
$Carpeta = Join-Path $Registros ($Inicio.ToString('yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Force $Carpeta | Out-Null
$Log = Join-Path $Carpeta 'lanzador.log'
$EstadoArchivo = Join-Path $Carpeta 'estado.json'
$script:Estado = [ordered]@{
  estado = 'en-curso'; paso = 'comprobaciones'; motivo = $null
  inicio = $Inicio.ToString('o'); fin = $null; minutos = $null; pid = $PID
  rama = $null; commit = $null; version = $null; versionCode = $null
  memoriaLibreMbAlEmpezar = $null; artefacto = $null; sha256 = $null
  verificacion = $null; registroRevisado = $null; registro = $Carpeta; soloComprobar = [bool]$SoloComprobar
}

function Registrar([string]$Linea) {
  Write-Host $Linea
  [System.IO.File]::AppendAllText($Log, $Linea + "`r`n", $Utf8SinBom)
}
function Anotar([string]$Texto) { Registrar ("[{0}] {1}" -f (Get-Date).ToString('HH:mm:ss'), $Texto) }
function Guardar-Estado {
  $script:Estado.minutos = [math]::Round(((Get-Date) - $Inicio).TotalMinutes, 1)
  [System.IO.File]::WriteAllText($EstadoArchivo, (($script:Estado | ConvertTo-Json -Depth 6) + "`n"), $Utf8SinBom)
  [System.IO.File]::WriteAllText($Puntero, ((@{ registro = $Carpeta; estado = $script:Estado.estado; inicio = $script:Estado.inicio } | ConvertTo-Json) + "`n"), $Utf8SinBom)
}
function Paso([string]$Nombre) { $script:Estado.paso = $Nombre; Guardar-Estado; Anotar "== $Nombre ==" }
function Terminar([string]$EstadoFinal, [string]$Motivo, [int]$Codigo) {
  $script:Estado.estado = $EstadoFinal
  $script:Estado.motivo = $Motivo
  $script:Estado.fin = (Get-Date).ToString('o')
  Guardar-Estado
  Registrar ''
  switch ($EstadoFinal) {
    'terminado' { Registrar "RESULTADO: TERMINADO en $($script:Estado.minutos) min. $Motivo" }
    'comprobado' { Registrar "RESULTADO: COMPROBACIONES OK en $($script:Estado.minutos) min. $Motivo" }
    'fallo' { Registrar ("RESULTADO: FALLÓ en el paso «{0}» ({1} min): {2}" -f $script:Estado.paso, $script:Estado.minutos, $Motivo) }
    'bloqueado' { Registrar ("RESULTADO: BLOQUEADO por {0}" -f $Motivo) }
  }
  Registrar "Registro: $Carpeta"
  Registrar "Consultar: powershell -NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Consultar -Salida `"$Salida`""
  exit $Codigo
}
function Bloqueado([string]$Motivo) { Terminar 'bloqueado' $Motivo 2 }
function Fallo([string]$Motivo) { Terminar 'fallo' $Motivo 1 }

function Correr([string]$Nombre, [string]$Linea, [string]$Donde) {
  # Un solo proceso hijo por paso, con stdout y stderr unidos por cmd.exe; sin reintentos.
  Anotar "   en $Donde"
  Anotar "   > $Linea"
  $t0 = Get-Date
  Push-Location $Donde
  try {
    $global:LASTEXITCODE = 0
    cmd.exe /c "$Linea 2>&1" | ForEach-Object { Registrar $_ }
    $codigo = $LASTEXITCODE
  } finally { Pop-Location }
  Anotar ("   {0}: código {1}, {2} min" -f $Nombre, $codigo, [math]::Round(((Get-Date) - $t0).TotalMinutes, 1))
  return $codigo
}
function MemoriaLibreMb { $os = Get-CimInstance Win32_OperatingSystem; return [int][math]::Round($os.FreePhysicalMemory / 1KB) }
function Nativo([string]$Linea) {
  # Un comando nativo corto, con stderr unido por cmd.exe: en PowerShell 5.1, un stderr redirigido con
  # ErrorActionPreference = Stop se vuelve un error terminante, y acá queremos leer el código de salida.
  $global:LASTEXITCODE = 0
  $salida = @(cmd.exe /c "$Linea 2>&1")
  return (($salida | ForEach-Object { [string]$_ }) -join "`r`n")
}

Guardar-Estado
try {
  Anotar "Lanzador del AAB de BE · $($Inicio.ToString('yyyy-MM-dd HH:mm:ss')) · $Raiz"
  if ($SoloComprobar) { Anotar 'Modo -SoloComprobar: solo las comprobaciones; no instala ni construye.' }

  # ─── 1. comprobaciones ──────────────────────────────────────────────────────────────────────
  Paso 'comprobaciones'
  if (-not (Test-Path (Join-Path $Node22 'node.exe'))) { Bloqueado "no está Node 22 en $Node22 (fnm)" }
  $env:PATH = "$Node22;" + (Join-Path $JavaHome 'bin') + ";$env:PATH"
  $env:JAVA_HOME = $JavaHome
  $env:ANDROID_HOME = $AndroidHome
  $env:ANDROID_SDK_ROOT = $AndroidHome
  $nodeVersion = (Nativo 'node --version').Trim()
  if (-not $nodeVersion -or -not $nodeVersion.StartsWith('v22.')) { Bloqueado "node --version dio «$nodeVersion»; hace falta la 22 (.nvmrc: $(Get-Content (Join-Path $Raiz '.nvmrc') -ErrorAction SilentlyContinue))" }
  $npmVersion = (Nativo 'npm --version').Trim()
  if ($LASTEXITCODE -ne 0 -or -not $npmVersion) { Bloqueado "npm no responde: $npmVersion" }
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Bloqueado 'git no está en el PATH' }
  Anotar "node $nodeVersion · npm $npmVersion · git $((& git --version) -replace 'git version ','')"

  $ramaActual = (& git -C $Raiz rev-parse --abbrev-ref HEAD).Trim()
  $script:Estado.rama = $ramaActual
  $script:Estado.commit = (& git -C $Raiz rev-parse HEAD).Trim()
  if ($ramaActual -ne $Rama) { Bloqueado "la rama es «$ramaActual» y tiene que ser «$Rama» (git checkout $Rama)" }
  $sucio = (& git -C $Raiz status --porcelain)
  if ($sucio) { Bloqueado ("hay cambios sin confirmar en el árbol; el commit no describiría lo construido:`r`n" + ($sucio -join "`r`n")) }
  $commit = (& git -C $Raiz rev-parse HEAD).Trim()
  $fetch = Nativo "git -C ""$Raiz"" fetch --quiet origin $Rama"
  if ($LASTEXITCODE -ne 0) { Bloqueado "no pude traer origin/$Rama (¿sin red?); npm ci también necesita red. git dijo: $fetch" }
  $publicado = (Nativo "git -C ""$Raiz"" rev-parse origin/$Rama").Trim()
  if ($LASTEXITCODE -ne 0) { Bloqueado "no existe origin/${Rama}: $publicado" }
  if ($publicado -ne $commit) { Bloqueado "el commit local $($commit.Substring(0,7)) no es el publicado en origin/$Rama ($($publicado.Substring(0,7))): git pull --ff-only, o publicá la rama" }
  $script:Estado.rama = $Rama
  $script:Estado.commit = $commit
  $config = Get-Content (Join-Path $Raiz 'apps\mobile\app.config.ts') -Raw -Encoding UTF8
  $version = [regex]::Match($config, "const VERSION = '([^']+)'").Groups[1].Value
  $versionCode = [regex]::Match($config, 'versionCode: (\d+)').Groups[1].Value
  if (-not $version -or -not $versionCode) { Bloqueado 'no pude leer VERSION y versionCode de apps/mobile/app.config.ts' }
  $script:Estado.version = $version
  $script:Estado.versionCode = [int]$versionCode
  Anotar "rama $Rama · commit $($commit.Substring(0,7)) (igual al publicado) · árbol limpio · versión $version · versionCode $versionCode"

  $herramientas = @(
    @('java', (Join-Path $JavaHome 'bin\java.exe')), @('keytool', (Join-Path $JavaHome 'bin\keytool.exe')), @('jarsigner', (Join-Path $JavaHome 'bin\jarsigner.exe')),
    @('aapt2', (Join-Path $AndroidHome 'build-tools\36.0.0\aapt2.exe')), @('zipalign', (Join-Path $AndroidHome 'build-tools\36.0.0\zipalign.exe')),
    @('platform android-36', (Join-Path $AndroidHome 'platforms\android-36')), @('NDK', (Join-Path $AndroidHome 'ndk')),
    @('tar', "$env:SystemRoot\System32\tar.exe"), @('curl', "$env:SystemRoot\System32\curl.exe")
  )
  foreach ($h in $herramientas) { if (-not (Test-Path $h[1])) { Bloqueado "falta $($h[0]): $($h[1])" } }
  $jar = Get-ChildItem $Bundletool -Filter 'bundletool-all-*.jar' -ErrorAction SilentlyContinue | Sort-Object Name | Select-Object -Last 1
  if (-not $jar) { Bloqueado "no hay bundletool-all-*.jar en $Bundletool" }
  $env:BUNDLETOOL = $jar.FullName
  Anotar "herramientas: JDK $JavaHome · SDK $AndroidHome · $($jar.Name) · tar · curl"

  # Los archivos privados solo se comprueban por existencia: este lanzador nunca los lee.
  $privados = @(
    @('google-services.json', (Join-Path $Datos 'firebase\google-services.json')), @('client-ids.env', (Join-Path $Datos 'google\client-ids.env')),
    @('credentials.json del respaldo', (Join-Path $Respaldo 'credentials.json')), @('keystore del respaldo', (Join-Path $Respaldo 'credentials\android\keystore.jks'))
  )
  foreach ($p in $privados) { if (-not (Test-Path $p[1])) { Bloqueado "falta $($p[0]) (no se lee, solo se comprueba que exista): $($p[1])" } }
  Anotar 'datos locales y respaldo: presentes (sin leerlos)'

  $libre = MemoriaLibreMb
  $total = [int][math]::Round((Get-CimInstance Win32_OperatingSystem).TotalVisibleMemorySize / 1KB)
  $script:Estado.memoriaLibreMbAlEmpezar = $libre
  $disco = [math]::Round((Get-PSDrive ($Raiz.Substring(0,1))).Free / 1GB, 1)
  $grandes = Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 6 | ForEach-Object { "{0} {1} MB" -f $_.Name, [math]::Round($_.WorkingSet64 / 1MB) }
  Anotar "memoria libre $libre MB de $total · disco libre $disco GB · procesos más grandes: $($grandes -join ', ')"
  $claude = @(Get-Process -Name 'claude' -ErrorAction SilentlyContinue)
  if ($claude.Count -gt 0) { Anotar "ATENCIÓN: hay $($claude.Count) proceso(s) de Claude abiertos (unos $([math]::Round(($claude | Measure-Object WorkingSet64 -Sum).Sum / 1MB)) MB): conviene cerrarlos antes." }
  if ($disco -lt $MinimoDiscoGb) { Bloqueado "disco libre $disco GB, menos que los $MinimoDiscoGb GB mínimos (node_modules y el proyecto Android pesan varios GB)" }
  if ($libre -lt $MinimoMb) { Bloqueado "memoria libre $libre MB, menos que los $MinimoMb MB mínimos del lanzador (Gradle usa hasta 2,5 GB más Kotlin y Metro; con ~700 MB el npm ci ya se cortó). Cerrá Claude, Chrome y lo demás, y volvé a lanzar; o -MinimoMb para cambiar el umbral bajo tu responsabilidad" }
  if ($libre -lt 4000) { Anotar "aviso: $libre MB libres alcanza el mínimo del lanzador, pero es justo; si Gradle se cae por memoria, el registro lo va a decir" }

  # Nunca se verifica un artefacto anterior: si ya hay uno para esta versión y commit, se aparta antes de construir.
  $carpetaVersion = Join-Path $Salida $version
  $nombreArtefacto = "be-$version-$($commit.Substring(0,7)).aab"
  $rutaArtefacto = Join-Path $carpetaVersion $nombreArtefacto
  if (-not $SoloComprobar -and (Test-Path $rutaArtefacto)) {
    $previos = Join-Path $carpetaVersion 'previos'
    New-Item -ItemType Directory -Force $previos | Out-Null
    $marca = $Inicio.ToString('yyyyMMdd-HHmmss')
    foreach ($n in @($nombreArtefacto, "$nombreArtefacto.sha256", 'construccion.json', 'esperado.json')) {
      $r = Join-Path $carpetaVersion $n
      if (Test-Path $r) { Move-Item $r (Join-Path $previos "$marca-$n") }
    }
    Anotar "había un artefacto anterior para este commit: apartado en $previos (no se verifica ni se reutiliza)"
  }

  if ($SoloComprobar) { Terminar 'comprobado' "Listo para lanzar sin -SoloComprobar (memoria libre $libre MB)." 0 }

  # ─── 2. npm ci ──────────────────────────────────────────────────────────────────────────────
  Paso 'npm ci'
  Anotar "memoria libre antes: $(MemoriaLibreMb) MB"
  $codigo = Correr 'npm ci' 'npm ci --no-audit --no-fund' $Raiz
  if ($codigo -ne 0) { Fallo "npm ci terminó con código $codigo (si fue por memoria, suele cortarse en el preinstall de Prisma con 0xC0000142)" }
  if (-not (Test-Path (Join-Path $Raiz 'node_modules\.bin\expo.cmd'))) { Fallo 'npm ci terminó bien pero no dejó node_modules\.bin\expo.cmd' }

  # ─── 3. construcción ────────────────────────────────────────────────────────────────────────
  Paso 'construccion'
  Anotar "memoria libre antes: $(MemoriaLibreMb) MB"
  $codigo = Correr 'construir-aab.mjs' "node scripts\aab\construir-aab.mjs --salida `"$Salida`" --respaldo `"$Respaldo`" --datos `"$Datos`"" $Raiz
  if ($codigo -ne 0) { Fallo "construir-aab.mjs terminó con código $codigo; el detalle está arriba en el registro (prebuild, build:domain o Gradle)" }
  $construccionArchivo = Join-Path $carpetaVersion 'construccion.json'
  $esperadoArchivo = Join-Path $carpetaVersion 'esperado.json'
  if (-not (Test-Path $construccionArchivo) -or -not (Test-Path $esperadoArchivo)) { Fallo "la construcción no dejó construccion.json y esperado.json en $carpetaVersion" }
  $construccion = Get-Content $construccionArchivo -Raw -Encoding UTF8 | ConvertFrom-Json
  if ($construccion.commit -ne $commit) { Fallo "construccion.json dice el commit $($construccion.commit) y este lanzamiento es ${commit}: no es el artefacto de esta corrida" }
  if ([datetime]::Parse($construccion.construidoEn).ToUniversalTime() -lt $Inicio.ToUniversalTime()) { Fallo "construccion.json es anterior a este lanzamiento ($($construccion.construidoEn)): no se verifica un artefacto viejo" }
  if (-not (Test-Path $construccion.artefacto)) { Fallo "no existe el artefacto que declara construccion.json: $($construccion.artefacto)" }
  $hash = (Get-FileHash $construccion.artefacto -Algorithm SHA256).Hash.ToLower()
  if ($hash -ne $construccion.sha256) { Fallo "el SHA-256 del artefacto ($hash) no coincide con construccion.json ($($construccion.sha256))" }
  $script:Estado.artefacto = $construccion.artefacto
  $script:Estado.sha256 = $hash
  Copy-Item $construccionArchivo (Join-Path $Carpeta 'construccion.json')
  Copy-Item $esperadoArchivo (Join-Path $Carpeta 'esperado.json')
  Anotar "artefacto nuevo de este commit: $($construccion.artefacto) ($($construccion.bytes) bytes, sha256 $($hash.Substring(0,16))…)"

  # ─── 4. verificación ────────────────────────────────────────────────────────────────────────
  Paso 'verificacion'
  $codigo = Correr 'verificar-aab.mjs' "node scripts\aab\verificar-aab.mjs `"$($construccion.artefacto)`" --esperado `"$esperadoArchivo`" --salida `"$Carpeta`" --respaldo `"$Respaldo`"" $Raiz
  $verificacionMd = Join-Path $Carpeta 'verificacion.md'
  $script:Estado.verificacion = @{ codigo = $codigo; todoBien = ($codigo -eq 0); archivo = $verificacionMd }
  Guardar-Estado

  # ─── 5. el registro, sin credenciales ───────────────────────────────────────────────────────
  Paso 'revision-del-registro'
  $codigoRevision = Correr 'revisar-registro.mjs' "node scripts\aab\revisar-registro.mjs `"$Carpeta`"" $Raiz
  $script:Estado.registroRevisado = @{ codigo = $codigoRevision; hallazgos = $(if ($codigoRevision -eq 0) { 0 } else { 1 }) }
  if ($codigoRevision -ne 0) { Anotar 'ATENCIÓN: el detector marcó algo en el registro; revisalo antes de compartirlo (ver arriba, nombres de archivo y tipo de marcador, nunca el contenido)' }

  if ($codigo -eq 0) { Terminar 'terminado' "El AAB pasó todas las comprobaciones obligatorias: $($construccion.artefacto). Verificación en $verificacionMd." 0 }
  if ($codigo -eq 1) { $script:Estado.paso = 'verificacion'; Fallo "el AAB se construyó pero NO pasó la verificación: ver $verificacionMd (fallaron o quedaron pendientes las comprobaciones que dice ahí). El artefacto queda en $($construccion.artefacto), sin usar" }
  $script:Estado.paso = 'verificacion'
  Fallo "verificar-aab.mjs no pudo correr (código $codigo): ver el registro; suele ser una herramienta o el esperado.json"
} catch {
  $mensaje = $_.Exception.Message
  if ($script:Estado.estado -eq 'en-curso') {
    Anotar "error inesperado en el paso «$($script:Estado.paso)»: $mensaje"
    Anotar ($_.ScriptStackTrace)
    Fallo "error inesperado: $mensaje"
  }
  throw
}
