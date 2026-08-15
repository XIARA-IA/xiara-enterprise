$fecha = Get-Date -Format "yyyy-MM-dd_HH-mm"
$index = "public\index.html"
if (!(Test-Path $index)) { $index = "index.html" }

$html = Get-Content $index -Raw
$salida = "docs\v6\auditoria_codigo_$fecha.md"

$funciones = [regex]::Matches($html, "function\s+([A-Za-z0-9_]+)\s*\(") | ForEach-Object { $_.Groups[1].Value }
$ids = [regex]::Matches($html, "id=""([^""]+)""") | ForEach-Object { $_.Groups[1].Value }
$scripts = [regex]::Matches($html, "<script[^>]*src=""([^""]+)""") | ForEach-Object { $_.Groups[1].Value }
$styles = [regex]::Matches($html, "<style[^>]*id=""([^""]+)""") | ForEach-Object { $_.Groups[1].Value }

$funcDup = $funciones | Group-Object | Where-Object { $_.Count -gt 1 } | Sort-Object Count -Descending
$idDup = $ids | Group-Object | Where-Object { $_.Count -gt 1 } | Sort-Object Count -Descending
$scriptDup = $scripts | Group-Object | Where-Object { $_.Count -gt 1 } | Sort-Object Count -Descending
$styleDup = $styles | Group-Object | Where-Object { $_.Count -gt 1 } | Sort-Object Count -Descending

$lineas = ($html -split "`n").Count
$tamanoKB = [math]::Round((Get-Item $index).Length / 1KB, 2)

@"
# Auditoría Técnica XIARA V6

Fecha: $fecha  
Archivo: $index  
Tamaño: $tamanoKB KB  
Líneas aproximadas: $lineas  

## Resumen

- Funciones: $($funciones.Count)
- IDs HTML: $($ids.Count)
- Librerías script externas: $($scripts.Count)
- Bloques CSS con id: $($styles.Count)
- Funciones duplicadas: $($funcDup.Count)
- IDs duplicados: $($idDup.Count)
- Scripts duplicados: $($scriptDup.Count)
- CSS duplicados: $($styleDup.Count)

## Funciones duplicadas

$($funcDup | ForEach-Object { "- $($_.Name): $($_.Count) veces" } | Out-String)

## IDs duplicados

$($idDup | ForEach-Object { "- $($_.Name): $($_.Count) veces" } | Out-String)

## Scripts duplicados

$($scriptDup | ForEach-Object { "- $($_.Name): $($_.Count) veces" } | Out-String)

## CSS duplicados

$($styleDup | ForEach-Object { "- $($_.Name): $($_.Count) veces" } | Out-String)

## Recomendación técnica

1. Separar primero Firma Digital.
2. Luego PRL / Salud Laboral.
3. Después Documentos y RRHH.
4. Mantener Login para el final.
5. No publicar a producción hasta probar en rama v6-enterprise.
"@ | Set-Content $salida -Encoding UTF8

Write-Host "Auditoría creada en: $salida"