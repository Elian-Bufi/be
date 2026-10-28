<#
.SYNOPSIS
Lanzador del AAB de BE para Google Play: comprueba, instala, construye y verifica, en ese orden, y se detiene ante el
primer fallo. WP-GOOGLE-PLAY-PRUEBAS-INTERNAS (2026-10-28, noche; corregido el 29/10: la revisión del registro
siempre corre y decide, junto con la verificación, si hubo éxito).

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
  5. Revisión del registro con el mismo detector de credenciales del verificador (scripts/aab/revisar-registro.mjs).
     Corre SIEMPRE al cerrar, también cuando el lanzamiento queda bloqueado o falla antes: todo registro termina
     revisado salvo que el proceso muera. Distingue «limpio», «con hallazgos» (el detector marcó algo) y «error»
     (el revisor no pudo correr): solo «limpio» permite el éxito.

TERMINADO (código 0) exige las dos cosas: la verificación del AAB en «todo bien» y la revisión del registro limpia.
Si el AAB está bien pero el registro tiene hallazgos o la revisión falló: FALLÓ en «revision-del-registro» (1).
Los demás fallos: FALLÓ en <paso> (1). Lo que impide arrancar: BLOQUEADO por <motivo> (2).

Deja todo en C:\Users\bufim\BE-artefactos\aab\registros\<fecha-hora>\ (lanzador.log, estado.json, verificacion.md y
.json, construccion.json, esperado.json), y un puntero en registros\ultimo.json. El lanzador no lee ninguna
credencial y los scripts que las usan no las imprimen. -Consultar muestra el estado y, SOLO si el registro quedó
revisado y limpio, sus últimas líneas; si está marcado, sin revisar (en curso, interrumpido) o la revisión falló, no
lo imprime y dice por qué.

-Simular "verificacion=<0|1|2>,revisor=<limpio|hallazgo|error>": para probar el comportamiento del lanzador sin
instalar ni construir nada (omite npm ci y la construcción, finge el código del verificador y provoca el resultado
pedido en la revisión, que corre de verdad; tolera un árbol sucio o no publicado, porque no describe ningún
artefacto). Queda marcado como SIMULACIÓN en el registro y en -Consultar.

No publica, no integra, no despliega, no genera claves ni cambia configuraciones remotas.
#>
[CmdletBinding()]
param(
  [switch]$Consultar,
  [switch]$SoloComprobar,
  [string]$Simular = '',
  [string]$Rama = 'aab/candidata-0.18.0-2',
  [int]$MinimoMb = 2500,
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

function Propiedad($Objeto, [string]$Nombre) {
  # Lee una propiedad de un objeto venido de JSON sin que StrictMode se queje si no existe.
  if ($null -eq $Objeto) { return $null }
  $p = $Objeto.PSObject.Properties[$Nombre]
  if ($null -eq $p) { return $null }
  return $p.Value
}

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
  $simulacion = Propiedad $e 'simulacion'
  Write-Host ''
  Write-Host "Último lanzamiento: $carpeta"
  if ($simulacion) { Write-Host "SIMULACIÓN (-Simular): no se instaló ni se construyó nada; verificador fingido en código $($simulacion.verificacion), revisor forzado a «$($simulacion.revisor)»." -ForegroundColor Magenta }
  Write-Host ("Inicio: {0}   Fin: {1}   Rama: {2}   Commit: {3}" -f $e.inicio, $e.fin, $e.rama, $e.commit)
  switch ($e.estado) {
    'terminado' { Write-Host "RESULTADO: TERMINADO. El AAB está verificado y el registro revisado y limpio: $($e.artefacto)" -ForegroundColor Green }
    'comprobado' { Write-Host 'RESULTADO: COMPROBACIONES OK (fue un -SoloComprobar; no se instaló ni se construyó nada).' -ForegroundColor Green }
    'fallo' { Write-Host ("RESULTADO: FALLÓ en el paso «{0}»: {1}" -f $e.paso, $e.motivo) -ForegroundColor Red }
    'bloqueado' { Write-Host ("RESULTADO: BLOQUEADO por {0}" -f $e.motivo) -ForegroundColor Yellow }
    'en-curso' {
      if ($vivo) { Write-Host ("EN CURSO: paso «{0}» (proceso {1} vivo)" -f $e.paso, $e.pid) -ForegroundColor Cyan }
      else { Write-Host ("INTERRUMPIDO: quedó en el paso «{0}» y el proceso {1} ya no existe (se cerró la ventana, se apagó la PC o lo mató el sistema). No terminó." -f $e.paso, $e.pid) -ForegroundColor Red }
    }
    default { Write-Host "Estado desconocido: $($e.estado)" }
  }
  $verificacion = Propiedad $e 'verificacion'
  if ($verificacion -and (Propiedad $verificacion 'archivo') -and (Test-Path $verificacion.archivo)) {
    $linea = Get-Content $verificacion.archivo -Encoding UTF8 | Where-Object { $_ -like '*Todo bien*' } | Select-Object -First 1
    if ($linea) { Write-Host "Verificación del AAB: $linea" }
    Write-Host "Detalle: $($verificacion.archivo)"
  }
  $rev = Propiedad $e 'registroRevisado'
  $mostrarRegistro = $false
  $porQue = ''
  if ($null -eq $rev) {
    if ($vivo) { $porQue = 'todavía no fue revisado (la corrida está en curso)' }
    else { $porQue = 'no fue revisado: la corrida no llegó a cerrar (interrumpida o cortada)' }
    Write-Host 'Revisión del registro: sin hacer.' -ForegroundColor Yellow
  } elseif ($rev.estado -eq 'limpio') {
    $mostrarRegistro = $true
    Write-Host "Revisión del registro: limpia ($($rev.archivos) archivo(s), 0 hallazgos)."
  } elseif ($rev.estado -eq 'con-hallazgos') {
    $porQue = "el detector de credenciales marcó $($rev.hallazgos) hallazgo(s)"
    Write-Host "Revisión del registro: CON HALLAZGOS ($($rev.hallazgos)). Revisalo a mano antes de compartirlo." -ForegroundColor Yellow
  } else {
    $porQue = "la revisión no pudo correr ($($rev.detalle))"
    Write-Host "Revisión del registro: ERROR del revisor ($($rev.detalle))." -ForegroundColor Yellow
  }
  $log = Join-Path $carpeta 'lanzador.log'
  if ($mostrarRegistro -and (Test-Path $log)) {
    Write-Host ''
    Write-Host "Últimas líneas de $log :"
    Get-Content $log -Tail 25 -Encoding UTF8 | ForEach-Object { Write-Host "  $_" }
  } elseif (Test-Path $log) {
    Write-Host ''
    Write-Host "Registro no mostrado: $porQue. Está en $log; revisalo a mano antes de compartirlo." -ForegroundColor Yellow
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
  verificacion = $null; registroRevisado = $null; registro = $Carpeta; soloComprobar = [bool]$SoloComprobar; simulacion = $null
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
function Nativo([string]$Linea) {
  # Un comando nativo corto, con stderr unido por cmd.exe: en PowerShell 5.1, un stderr redirigido con
  # ErrorActionPreference = Stop se vuelve un error terminante, y acá queremos leer el código de salida.
  $global:LASTEXITCODE = 0
  $salida = @(cmd.exe /c "$Linea 2>&1")
  return (($salida | ForEach-Object { [string]$_ }) -join "`r`n")
}
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

function Revisar-Registro([switch]$ProvocarError) {
  # El detector de credenciales del verificador sobre la carpeta del registro. Devuelve y guarda
  # { estado: limpio | con-hallazgos | error; hallazgos; archivos; codigo; detalle }. Nunca imprime contenido: el
  # revisor solo nombra archivos y tipos de marcador. Las líneas que el lanzador escribe después (el resultado) son
  # propias y no pasan por el revisor.
  Anotar '== revision-del-registro =='
  $revisor = Join-Path $Raiz 'scripts\aab\revisar-registro.mjs'
  $objetivo = $Carpeta
  if ($ProvocarError) { $objetivo = Join-Path $Carpeta 'no-existe-a-proposito' }
  $r = [ordered]@{ estado = 'error'; hallazgos = $null; archivos = $null; codigo = $null; detalle = $null }
  try {
    if (-not (Test-Path $revisor)) { throw "no existe $revisor" }
    $salida = Nativo "node ""$revisor"" ""$objetivo"""
    $codigo = $LASTEXITCODE
    $r.codigo = $codigo
    $lineas = @($salida -split "`r`n" | Where-Object { $_ })
    $resumen = $lineas | Where-Object { $_ -like 'registro revisado:*' } | Select-Object -First 1
    if ($resumen) {
      $m = [regex]::Match($resumen, '(\d+) archivo\(s\), (\d+) bytes, (\d+) hallazgo\(s\)')
      if ($m.Success) { $r.archivos = [int]$m.Groups[1].Value; $r.hallazgos = [int]$m.Groups[3].Value }
    }
    if ($codigo -eq 0 -and $resumen -and $r.hallazgos -eq 0) { $r.estado = 'limpio' }
    elseif ($codigo -eq 1 -and $resumen) { $r.estado = 'con-hallazgos'; if ($null -eq $r.hallazgos) { $r.hallazgos = @($lineas | Where-Object { $_ -like '- *' }).Count } }
    else { $r.estado = 'error'; $r.detalle = ("código {0}: {1}" -f $codigo, (($lineas -join ' | ')).Substring(0, [math]::Min(300, ($lineas -join ' | ').Length))) }
    foreach ($l in $lineas) { Anotar "   $l" }
  } catch {
    $r.estado = 'error'
    $r.detalle = $_.Exception.Message
    Anotar "   el revisor no pudo correr: $($r.detalle)"
  }
  $script:Estado.registroRevisado = $r
  switch ($r.estado) {
    'limpio' { Anotar "   revisión del registro: limpia ($($r.archivos) archivo(s))" }
    'con-hallazgos' { Anotar "   ATENCIÓN: el detector marcó $($r.hallazgos) hallazgo(s) en el registro; revisalo antes de compartirlo (arriba dice archivo y tipo de marcador, nunca el contenido)" }
    default { Anotar "   ATENCIÓN: la revisión del registro no pudo hacerse ($($r.detalle)); el registro queda SIN revisar" }
  }
  Guardar-Estado
  return $r
}

function Terminar([string]$EstadoFinal, [string]$Motivo, [int]$Codigo) {
  # Todo cierre revisa el registro (si no se revisó ya en el flujo normal) y ningún éxito sobrevive a una revisión
  # que no sea limpia.
  if ($null -eq $script:Estado.registroRevisado) { $null = Revisar-Registro }
  $rev = $script:Estado.registroRevisado
  if ($Codigo -eq 0 -and $rev.estado -ne 'limpio') {
    $EstadoFinal = 'fallo'
    $Codigo = 1
    $script:Estado.paso = 'revision-del-registro'
    if ($rev.estado -eq 'con-hallazgos') { $Motivo = "el registro tiene $($rev.hallazgos) hallazgo(s) del detector de credenciales (revisalo antes de compartirlo). Lo demás había salido bien: $Motivo" }
    else { $Motivo = "la revisión del registro no pudo hacerse ($($rev.detalle)) y sin revisión no hay éxito. Lo demás había salido bien: $Motivo" }
  }
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

Guardar-Estado
try {
  Anotar "Lanzador del AAB de BE · $($Inicio.ToString('yyyy-MM-dd HH:mm:ss')) · $Raiz"
  if ($SoloComprobar) { Anotar 'Modo -SoloComprobar: solo las comprobaciones; no instala ni construye.' }
  $sim = $null
  if ($Simular) {
    $sim = @{}
    foreach ($par in ($Simular -split ',')) {
      $kv = $par.Trim() -split '=', 2
      if ($kv.Count -eq 2) { $sim[$kv[0].Trim()] = $kv[1].Trim() }
    }
    if (-not $sim.ContainsKey('verificacion') -or -not $sim.ContainsKey('revisor') -or @('0', '1', '2') -notcontains $sim.verificacion -or @('limpio', 'hallazgo', 'error') -notcontains $sim.revisor) {
      Bloqueado "simulación inválida «$Simular»: la forma es verificacion=<0|1|2>,revisor=<limpio|hallazgo|error>"
    }
    $script:Estado.simulacion = @{ verificacion = [int]$sim.verificacion; revisor = $sim.revisor }
    Guardar-Estado
    Anotar "SIMULACIÓN (-Simular): no se instala ni se construye nada; verificador fingido en código $($sim.verificacion); revisor forzado a «$($sim.revisor)». Este registro no describe ningún artefacto."
  }

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
  if ($sucio -and $sim) { Anotar "   SIMULACIÓN: se tolera el árbol con cambios sin confirmar (no se construye nada): $(@($sucio).Count) archivo(s)" }
  elseif ($sucio) { Bloqueado ("hay cambios sin confirmar en el árbol; el commit no describiría lo construido:`r`n" + ($sucio -join "`r`n")) }
  $commit = (& git -C $Raiz rev-parse HEAD).Trim()
  $fetch = Nativo "git -C ""$Raiz"" fetch --quiet origin $Rama"
  if ($LASTEXITCODE -ne 0) { Bloqueado "no pude traer origin/$Rama (¿sin red?); npm ci también necesita red. git dijo: $fetch" }
  $publicado = (Nativo "git -C ""$Raiz"" rev-parse origin/$Rama").Trim()
  if ($LASTEXITCODE -ne 0) { Bloqueado "no existe origin/${Rama}: $publicado" }
  if ($publicado -ne $commit -and $sim) { Anotar "   SIMULACIÓN: se tolera que el commit local $($commit.Substring(0,7)) no sea el publicado ($($publicado.Substring(0,7)))" }
  elseif ($publicado -ne $commit) { Bloqueado "el commit local $($commit.Substring(0,7)) no es el publicado en origin/$Rama ($($publicado.Substring(0,7))): git pull --ff-only, o publicá la rama" }
  $config = Get-Content (Join-Path $Raiz 'apps\mobile\app.config.ts') -Raw -Encoding UTF8
  $version = [regex]::Match($config, "const VERSION = '([^']+)'").Groups[1].Value
  $versionCode = [regex]::Match($config, 'versionCode: (\d+)').Groups[1].Value
  if (-not $version -or -not $versionCode) { Bloqueado 'no pude leer VERSION y versionCode de apps/mobile/app.config.ts' }
  $script:Estado.version = $version
  $script:Estado.versionCode = [int]$versionCode
  $estadoDelArbol = 'igual al publicado · árbol limpio'
  if ($sim -and ($sucio -or $publicado -ne $commit)) { $estadoDelArbol = 'SIMULACIÓN sobre un árbol que no es exactamente el publicado' }
  Anotar "rama $Rama · commit $($commit.Substring(0,7)) ($estadoDelArbol) · versión $version · versionCode $versionCode"

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
  if ($libre -lt $MinimoMb) { Bloqueado "memoria libre $libre MB, menos que los $MinimoMb MB mínimos del lanzador (Gradle tiene un tope de 2,5 GB de heap y además corren Kotlin y Metro; con ~700 MB el npm ci ya se cortó). Reiniciá la PC o cerrá Claude, Chrome y lo demás, y volvé a lanzar; o -MinimoMb para cambiar el umbral bajo tu responsabilidad" }
  if ($libre -lt 3500) { Anotar "aviso: $libre MB libres alcanza el mínimo del lanzador, pero es justo (las APK anteriores se construyeron en esta PC con todo cerrado); si Gradle se cae por memoria, el registro lo va a decir" }

  # Nunca se verifica un artefacto anterior: si ya hay uno para esta versión y commit, se aparta antes de construir.
  $carpetaVersion = Join-Path $Salida $version
  $nombreArtefacto = "be-$version-$($commit.Substring(0,7)).aab"
  $rutaArtefacto = Join-Path $carpetaVersion $nombreArtefacto
  if (-not $SoloComprobar -and -not $sim -and (Test-Path $rutaArtefacto)) {
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

  $verificacionMd = Join-Path $Carpeta 'verificacion.md'
  if ($sim) {
    # ─── 2 a 4, simulados: nada se instala ni se construye ──────────────────────────────────
    Paso 'npm ci'
    Anotar '   SIMULACIÓN: npm ci omitido'
    Paso 'construccion'
    Anotar '   SIMULACIÓN: construcción omitida; no hay artefacto'
    $script:Estado.artefacto = '(simulado: sin artefacto)'
    Paso 'verificacion'
    $codigo = [int]$sim.verificacion
    $todoBienTexto = 'NO'
    if ($codigo -eq 0) { $todoBienTexto = 'sí' }
    [System.IO.File]::WriteAllText($verificacionMd, "# Verificación SIMULADA (-Simular)`r`n`r`nNo hubo artefacto. **Todo bien: $todoBienTexto.** (código fingido $codigo)`r`n", $Utf8SinBom)
    Anotar "   SIMULACIÓN: verificar-aab.mjs fingido con código $codigo"
    $script:Estado.verificacion = @{ codigo = $codigo; todoBien = ($codigo -eq 0); archivo = $verificacionMd; simulada = $true }
    Guardar-Estado
    if ($sim.revisor -eq 'hallazgo') {
      # Un secreto sintético (de nadie) en el registro, para que el revisor real lo marque.
      [System.IO.File]::WriteAllText((Join-Path $Carpeta 'simulacion-hallazgo.txt'), "-----BEGIN RSA PRIVATE KEY-----`r`nSINTETICO-DE-LA-SIMULACION`r`n-----END RSA PRIVATE KEY-----`r`n", $Utf8SinBom)
      Anotar '   SIMULACIÓN: se dejó un secreto sintético en el registro para que la revisión lo marque'
    }
    $revision = Revisar-Registro -ProvocarError:($sim.revisor -eq 'error')
    $artefactoTexto = 'simulación, sin artefacto'
  } else {
    # ─── 2. npm ci ──────────────────────────────────────────────────────────────────────────
    Paso 'npm ci'
    Anotar "memoria libre antes: $(MemoriaLibreMb) MB"
    $codigo = Correr 'npm ci' 'npm ci --no-audit --no-fund' $Raiz
    if ($codigo -ne 0) { Fallo "npm ci terminó con código $codigo (si fue por memoria, suele cortarse en el preinstall de Prisma con 0xC0000142)" }
    if (-not (Test-Path (Join-Path $Raiz 'node_modules\.bin\expo.cmd'))) { Fallo 'npm ci terminó bien pero no dejó node_modules\.bin\expo.cmd' }

    # ─── 3. construcción ────────────────────────────────────────────────────────────────────
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

    # ─── 4. verificación ────────────────────────────────────────────────────────────────────
    Paso 'verificacion'
    $codigo = Correr 'verificar-aab.mjs' "node scripts\aab\verificar-aab.mjs `"$($construccion.artefacto)`" --esperado `"$esperadoArchivo`" --salida `"$Carpeta`" --respaldo `"$Respaldo`"" $Raiz
    $script:Estado.verificacion = @{ codigo = $codigo; todoBien = ($codigo -eq 0); archivo = $verificacionMd }
    Guardar-Estado

    # ─── 5. el registro, sin credenciales ───────────────────────────────────────────────────
    $revision = Revisar-Registro
    $artefactoTexto = $construccion.artefacto
  }

  # ─── el veredicto: éxito solo con la verificación en «todo bien» Y la revisión limpia ─────────
  if ($codigo -eq 0 -and $revision.estado -eq 'limpio') { Terminar 'terminado' "El AAB pasó todas las comprobaciones obligatorias y el registro está revisado y limpio: $artefactoTexto. Verificación en $verificacionMd." 0 }
  if ($codigo -eq 0) {
    $script:Estado.paso = 'revision-del-registro'
    if ($revision.estado -eq 'con-hallazgos') { Fallo "el AAB pasó la verificación ($artefactoTexto), pero el registro tiene $($revision.hallazgos) hallazgo(s) del detector de credenciales: revisalo antes de compartirlo. Sin registro limpio no hay éxito" }
    Fallo "el AAB pasó la verificación ($artefactoTexto), pero la revisión del registro no pudo hacerse ($($revision.detalle)): el registro queda sin revisar, y sin revisión no hay éxito"
  }
  $script:Estado.paso = 'verificacion'
  $revisionTexto = "registro revisado: $($revision.estado)"
  if ($revision.estado -eq 'con-hallazgos') { $revisionTexto = "registro CON $($revision.hallazgos) hallazgo(s): revisalo antes de compartirlo" }
  if ($revision.estado -eq 'error') { $revisionTexto = "registro SIN revisar (el revisor falló: $($revision.detalle))" }
  if ($codigo -eq 1) { Fallo "el AAB se construyó pero NO pasó la verificación: ver $verificacionMd (fallaron o quedaron pendientes las comprobaciones que dice ahí). El artefacto queda en $artefactoTexto, sin usar. $revisionTexto" }
  Fallo "verificar-aab.mjs no pudo correr (código $codigo): ver el registro; suele ser una herramienta o el esperado.json. $revisionTexto"
} catch {
  $mensaje = $_.Exception.Message
  if ($script:Estado.estado -eq 'en-curso') {
    Anotar "error inesperado en el paso «$($script:Estado.paso)»: $mensaje"
    Anotar ($_.ScriptStackTrace)
    Fallo "error inesperado: $mensaje"
  }
  throw
}
