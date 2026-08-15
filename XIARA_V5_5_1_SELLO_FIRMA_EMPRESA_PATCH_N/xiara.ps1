Clear-Host
Write-Host "========================================="
Write-Host "        XIARA ENTERPRISE CONSOLE"
Write-Host "========================================="
Write-Host "1. Crear backup"
Write-Host "2. Restaurar version estable"
Write-Host "3. Inventario tecnico"
Write-Host "4. Auditoria de codigo"
Write-Host "5. Probar local Firebase"
Write-Host "6. Deploy seguro"
Write-Host "7. Estado Git"
Write-Host "8. Salir"
Write-Host "========================================="

$opcion = Read-Host "Elige una opcion"

switch ($opcion) {
    "1" { powershell -ExecutionPolicy Bypass -File scripts\backup-xiara.ps1 }
    "2" { powershell -ExecutionPolicy Bypass -File scripts\restaurar-stable.ps1 }
    "3" { powershell -ExecutionPolicy Bypass -File scripts\inventario-xiara.ps1 }
    "4" { powershell -ExecutionPolicy Bypass -File scripts\auditoria-codigo-xiara.ps1 }
    "5" { firebase serve }
    "6" { powershell -ExecutionPolicy Bypass -File scripts\deploy-seguro.ps1 }
    "7" { git status; git branch }
    "8" { Write-Host "Saliendo..." }
    default { Write-Host "Opcion no valida." }
}