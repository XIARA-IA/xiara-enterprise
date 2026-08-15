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
