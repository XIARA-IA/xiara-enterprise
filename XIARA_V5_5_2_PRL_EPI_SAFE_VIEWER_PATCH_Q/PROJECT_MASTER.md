# XIARA IA AUDITORIA V5.5.0 STORAGE ENTERPRISE HOTFIX C

- Corrige definitivamente `ReferenceError: db is not defined` en firma digital y módulos `type=module`.
- Expone la base principal como `window.db` tras cargar la base protegida.
- Reescribe el almacén de firma para usar `window.db` y no variable libre `db`.
- Mantiene V5.5.0 Storage Enterprise, diseño y módulos existentes.

# XIARA IA AUDITORIA — PROJECT_MASTER

Autor intelectual: Ezequiel Sebastián Ruiz. Todos los derechos reservados.

## Versión base
- Base recibida: V5.4.8 STABLE / transición V6 Enterprise.
- Nueva versión generada: V5.4.9 SAFE STORAGE PATCH.

## Regla de continuidad
No reiniciar, no simplificar, no borrar módulos existentes, no cambiar identidad visual. Todo cambio debe ser incremental y compatible.

## Objetivo inmediato
Eliminar el error `QuotaExceededError` causado por datos pesados en `localStorage`.

## Política de almacenamiento
- localStorage: metadatos, sesión, configuración ligera y copia compacta.
- IndexedDB: archivos locales temporales o pesados cuando Storage no esté disponible.
- Firebase Storage: PDF, DOCX, XLSX, JPG, PNG, firmas y documentos reales.
- Firestore: datos estructurados, expedientes, empleados, alertas, roles, logs.

## Próximos pasos
1. Probar carga de app.
2. Probar subida de PDF/JPG en expedientes legales y RRHH.
3. Revisar consola: no debe aparecer QuotaExceededError.
4. Separar módulos por archivos JS sin romper index.


## CONTINUIDAD ACTUAL - V5.5.0 STORAGE ENTERPRISE

La versión publicada V5.4.9 SAFE STORAGE PATCH HOTFIX A cargó correctamente sin errores críticos. La nueva rama V5.5.0 añade Storage Enterprise: panel de control de localStorage, limpieza de cachés antiguas y migración progresiva a IndexedDB para datos pesados. No se cambia diseño ni se eliminan módulos.


### Continuidad V5.5.1 PATCH M
Base limpia: V5.5.0 STORAGE ENTERPRISE HOTFIX C.
Se descartan D-L. El módulo de firma personal vieja se evita en la pantalla funcional. El área pasa a trabajar con dos imágenes estables: sello empresa y firma empresa.
Diagnóstico: xiaraFirmaEmpresaDiagnosticoM().


### Estado actual añadido
Versión de prueba: V5.5.1 SELLO/FIRMA EMPRESA PERSISTENCE PATCH N. Corrige persistencia de sello/firma empresa al recargar usando almacenamiento local ligero separado y compresión de imágenes.


## Continuidad V5.5.2 PATCH Q
Base estable: PATCH N. No usar PATCH O/P. PATCH Q corrige visor PRL/EPI con modal seguro independiente y firma/sello separados.
