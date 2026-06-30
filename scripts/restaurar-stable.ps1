Write-Host "Restaurando XIARA a versión estable v5.4.8-enterprise-stable..."

git checkout main
git reset --hard v5.4.8-enterprise-stable

firebase deploy

Write-Host "XIARA restaurado y publicado en producción."