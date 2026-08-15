Write-Host "XIARA Deploy Seguro"

Write-Host "1. Creando backup..."
powershell -ExecutionPolicy Bypass -File scripts\backup-xiara.ps1

Write-Host "2. Estado Git:"
git status

Write-Host "3. Rama actual:"
git branch --show-current

$confirmar = Read-Host "Escribe PUBLICAR para hacer deploy"

if ($confirmar -eq "PUBLICAR") {
    firebase deploy
    Write-Host "Deploy finalizado."
} else {
    Write-Host "Deploy cancelado."
}