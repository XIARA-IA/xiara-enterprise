$fecha = Get-Date -Format "yyyy-MM-dd_HH-mm"
$origen = "C:\XIARA_ENTERPRISE"
$destino = "C:\XIARA_BACKUPS\backup_$fecha"

New-Item -ItemType Directory -Force -Path $destino | Out-Null
Copy-Item "$origen\*" $destino -Recurse -Force

Write-Host "Backup creado en: $destino"