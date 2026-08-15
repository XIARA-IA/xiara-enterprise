\# PROTOCOLO PRODUCCIÓN XIARA



\## Versión estable actual

v5.4.8-enterprise-stable



\## URL producción

https://xiara-ia-auditoria.web.app



\## Regla principal

No modificar producción mientras la empresa carga datos sin probar antes en rama v6-enterprise.



\## Antes de cualquier cambio

1\. Crear backup local:

powershell -ExecutionPolicy Bypass -File scripts\\backup-xiara.ps1



2\. Verificar rama:

git branch



3\. Trabajar solo en:

v6-enterprise



\## Flujo seguro

v6-enterprise → prueba local → deploy → validación → main



\## Restaurar versión estable

git checkout main

git reset --hard v5.4.8-enterprise-stable

firebase deploy



\## Carga real de datos

Permitido cargar:

\- Empleados

\- Nóminas PDF

\- Documentos PRL

\- Vacaciones

\- Firmas

\- Sello

\- Accidentes

\- Bajas

\- Informes



\## Prohibido durante carga real

\- Reemplazar index.html sin backup

\- Hacer deploy directo sin prueba

\- Trabajar directo en main

