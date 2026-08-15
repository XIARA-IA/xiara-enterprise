$fecha = Get-Date -Format "yyyy-MM-dd_HH-mm"
$salida = "docs\v6\inventario_$fecha.md"

$index = "public\index.html"
if (!(Test-Path $index)) {
  $index = "index.html"
}

$html = Get-Content $index -Raw

$funciones = [regex]::Matches($html, "function\s+([A-Za-z0-9_]+)\s*\(") | ForEach-Object { $_.Groups[1].Value } | Sort-Object
$constantes = [regex]::Matches($html, "\b(const|let|var)\s+([A-Za-z0-9_]+)") | ForEach-Object { $_.Groups[2].Value } | Sort-Object
$ids = [regex]::Matches($html, "id=""([^""]+)""") | ForEach-Object { $_.Groups[1].Value } | Sort-Object
$onclicks = [regex]::Matches($html, "onclick=""([^""]+)""") | ForEach-Object { $_.Groups[1].Value } | Sort-Object

$duplicadas = $funciones | Group-Object | Where-Object { $_.Count -gt 1 } | Sort-Object Count -Descending

@"
# Inventario Técnico XIARA V6

Fecha: $fecha  
Archivo analizado: $index

## Resumen

- Funciones detectadas: $($funciones.Count)
- Variables/constantes detectadas: $($constantes.Count)
- IDs HTML detectados: $($ids.Count)
- Eventos onclick detectados: $($onclicks.Count)
- Funciones duplicadas: $($duplicadas.Count)

## Funciones duplicadas

$($duplicadas | ForEach-Object { "- $($_.Name): $($_.Count) veces" } | Out-String)

## Funciones detectadas

$($funciones | ForEach-Object { "- $_" } | Out-String)

## Variables / constantes detectadas

$($constantes | ForEach-Object { "- $_" } | Out-String)

## IDs HTML detectados

$($ids | ForEach-Object { "- $_" } | Out-String)

## Eventos onclick detectados

$($onclicks | ForEach-Object { "- $_" } | Out-String)
"@ | Set-Content $salida -Encoding UTF8

Write-Host "Inventario creado en: $salida"