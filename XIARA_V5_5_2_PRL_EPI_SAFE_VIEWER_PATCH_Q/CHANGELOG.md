# XIARA IA AUDITORIA V5.5.0 STORAGE ENTERPRISE HOTFIX C

- Corrige definitivamente `ReferenceError: db is not defined` en firma digital y módulos `type=module`.
- Expone la base principal como `window.db` tras cargar la base protegida.
- Reescribe el almacén de firma para usar `window.db` y no variable libre `db`.
- Mantiene V5.5.0 Storage Enterprise, diseño y módulos existentes.

# XIARA IA AUDITORIA - CHANGELOG

## V5.5.0 STORAGE ENTERPRISE - 2026-07-01

- Se mantiene la versión estable V5.4.9 HOTFIX A como base funcional publicada.
- Se añade panel **Storage Enterprise V5.5.0** dentro de Configuración.
- Se añade medición de peso de `localStorage` y claves XIARA.
- Se añade botón para migrar datos pesados a IndexedDB.
- Se añade limpieza segura de cachés antiguas `xiara_v34_estable_cache` y backups automáticos viejos.
- Se añade migración automática controlada cada 30 segundos para `dataUrl` y base64 muy pesados.
- Se actualiza `localSave()` a versión `5.5.0-storage-enterprise`.
- Se conserva diseño, módulos, navegación, Firebase, firmas y funcionamiento existente.
- Se agrega `favicon.ico` para eliminar el 404 de navegador.

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


## V5.5.0 STORAGE ENTERPRISE HOTFIX B

- Corrige `Uncaught ReferenceError: db is not defined` en `firmaStoreFix()`.
- Mantiene diseño, módulos y lógica visual sin cambios.
- Usa una referencia segura `baseDb` compatible con `db` interno o `window.db`.
- Continúa la migración Storage Enterprise sin volver a localStorage pesado.


## V5.5.1 SELLO/FIRMA EMPRESA CLEAN PATCH M
- Recuperación desde V5.5.0 STORAGE ENTERPRISE HOTFIX C.
- Descarta los parches D/E/F/G/H/I/J/K/L por inestabilidad.
- Renombra el área funcional a "Sello y firma empresa".
- Mantiene el sistema de sello que funcionaba.
- Crea carga de "Firma empresa" clonada del flujo simple de sello mediante imagen, sin canvas ni firma personal vieja.
- Guarda firma/sello en la empresa activa y compatibilidad con PRL/EPI/documentos.
- Añade diagnóstico: xiaraFirmaEmpresaDiagnosticoM().


## V5.5.1 SELLO/FIRMA EMPRESA PERSISTENCE PATCH N
- Corrige que sello empresa y firma empresa desaparecieran al recargar.
- Añade almacenamiento local ligero separado: `xiara_v551_sello_firma_empresa_assets_v1`.
- Comprime imágenes antes de guardar para evitar `QuotaExceededError`.
- Restaura sello/firma automáticamente al abrir XIARA.
- Mantiene compatibilidad con PRL/EPI/documentos (`firmaEmpresaDataUrl`, `firmaDataUrl`, `selloOficialDataUrl`, `selloDataUrl`).
- Añade diagnóstico `xiaraFirmaEmpresaDiagnosticoN()` y conserva alias `xiaraFirmaEmpresaDiagnosticoM()`.


## V5.5.2 PRL/EPI SAFE VIEWER PATCH Q
- Base: PATCH N estable.
- Corrige apertura PRL/EPI sin depender de modal() ni h().
- Separa firma empresa y sello empresa en bloques distintos.
- Añade xiaraPRLDiagnosticoQ().
