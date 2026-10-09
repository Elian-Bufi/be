# Medición breve de memoria para la demostración de #154: las mismas métricas antes y después de cambiar de proceso de
# Claude Code (docs/paquetes/REANUDACION-COMPRENSION.md). Solo lee: no detiene ni cambia nada.
# Uso, en PowerShell: & 'C:\Users\bufim\BE-Best-entrenamiento\EVIDENCIA\DASHBOARD-COMPRENSION\demostracion\medir-memoria.ps1'
$memoria = Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory
'Medición: {0:yyyy-MM-dd HH:mm}' -f (Get-Date)
'RAM disponible: {0:N0} MB' -f $memoria.AvailableMBytes
'Memoria comprometida: {0:N2} GB de un límite de {1:N2} GB ({2:N0} %)' -f ($memoria.CommittedBytes / 1GB), ($memoria.CommitLimit / 1GB), (100 * $memoria.CommittedBytes / $memoria.CommitLimit)
'claude.exe (residente: lo que ocupa ahora en la RAM; privada: lo reservado solo para el proceso, en la RAM o en el archivo de paginación):'
$claude = @(Get-Process -Name claude -ErrorAction SilentlyContinue)
if ($claude.Count -eq 0) { '  ninguno' }
foreach ($p in $claude) {
  '  PID {0}, desde {1:dd/MM HH:mm}: residente {2:N0} MB · privada {3:N0} MB' -f $p.Id, $p.StartTime, ($p.WorkingSet64 / 1MB), ($p.PrivateMemorySize64 / 1MB)
}
'Servicios de la demostración:'
foreach ($s in @(@('Web', 3000), @('API', 3001), @('PostgreSQL', 55442))) {
  $escucha = Get-NetTCPConnection -LocalPort $s[1] -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $escucha) { '  {0} :{1}: apagado' -f $s[0], $s[1]; continue }
  $ids = @([int]$escucha.OwningProcess)
  if ($s[0] -eq 'PostgreSQL') {
    # El servidor, sus procesos auxiliares (creados después que él: Windows reutiliza los PID) y el lanzador de Node.
    $servidor = Get-CimInstance Win32_Process -Filter "ProcessId=$($escucha.OwningProcess)"
    $ids += @(Get-CimInstance Win32_Process -Filter "ParentProcessId=$($servidor.ProcessId)" |
      Where-Object { $_.CreationDate -ge $servidor.CreationDate } | ForEach-Object { [int]$_.ProcessId })
    $lanzador = Get-Process -Id $servidor.ParentProcessId -ErrorAction SilentlyContinue
    if ($lanzador -and $lanzador.ProcessName -eq 'node') { $ids += $lanzador.Id }
  }
  $procesos = @($ids | ForEach-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue })
  '  {0} :{1}: encendido · {2} proceso(s), escucha el PID {3} · residente {4:N0} MB · privada {5:N0} MB' -f $s[0], $s[1],
    $procesos.Count, $escucha.OwningProcess, (($procesos | Measure-Object WorkingSet64 -Sum).Sum / 1MB),
    (($procesos | Measure-Object PrivateMemorySize64 -Sum).Sum / 1MB)
}
$otra = Get-NetTCPConnection -LocalPort 55432 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
'Fuera de la demostración: PostgreSQL :55432 (otra sesión) {0}' -f $(if ($otra) { 'encendido' } else { 'apagado' })
