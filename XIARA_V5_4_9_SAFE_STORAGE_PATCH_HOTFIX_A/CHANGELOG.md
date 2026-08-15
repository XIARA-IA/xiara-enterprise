# CHANGELOG XIARA IA AUDITORIA

## V5.4.9 SAFE STORAGE PATCH — 2026-07-01
- Se añade parche global `xiara-safe-storage-patch-v549` para interceptar escrituras excesivas en `localStorage`.
- Se compactan datos pesados antes de guardar para evitar `QuotaExceededError`.
- `localSave()` ahora guarda copia ligera del estado en lugar de intentar persistir documentos pesados.
- `safeLocalSave()` usa `xiaraSlimForLocalStorage()` y `xiaraLocalSetSafe()`.
- Subida legal desde tarjetas usa `IndexedDB` (`blobKey`) para archivos reales y miniatura para imágenes.
- Descarga legal permite recuperar archivo desde `blobKey` de IndexedDB si no hay URL de Storage.
- Se mantiene diseño, módulos, navegación y Firebase.

## Pendiente
- Hacer la misma política de IndexedDB/Storage para Agenda, firmas antiguas y documentos PRL que aún pueden guardar dataUrl.
- Unificar versión visible V5.4.8/V5.4.9/V6 en un único VERSION.txt.

## V5.4.9 SAFE STORAGE PATCH REAL - 2026-07-01
- Cambiada clave principal de localStorage de `xiara_v34_estable_cache` a `xiara_v5_4_9_safe_storage_cache`.
- Se elimina escritura en `xiara_v34_estable_cache_backup_auto` y `xiara_v34_estable_cache_backup_prev`.
- `localSave()` ahora guarda copia ligera y, si supera tamaño seguro, copia ultra ligera o solo metadatos.
- `safeLocalSave()` delega en `localSave()` para evitar dobles guardados pesados.
- Se limpian automáticamente claves antiguas `xiara_v34_estable_cache*` y `xiara_manual_backup_*`.
- Se conserva lectura/migración puntual desde cache antiguo si existe, pero no se vuelve a escribir en esas claves.
- No se cambia diseño, módulos ni navegación.


## V5.4.9 SAFE STORAGE PATCH HOTFIX A
- Corrige `Uncaught SyntaxError: Unexpected end of input` causado por etiquetas `<script>` dentro del HTML de impresión de nómina.
- Mantiene el parche Safe Storage sin rediseñar módulos.
- Añade carpeta `/js` en raíz para evitar 404 de `js/core/xiara-core.js` y `js/modules/firma/firma.js` cuando Firebase sirve desde `public: "."`.
- No elimina funciones existentes ni cambia identidad visual.
