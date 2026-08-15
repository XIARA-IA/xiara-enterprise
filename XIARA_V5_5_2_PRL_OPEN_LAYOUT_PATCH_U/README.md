# XIARA V5.5.2 PRL OPEN + LAYOUT PATCH U

Base limpia: V5.5.1 PATCH N.

Correcciones:
- El parche se inserta al final real del HTML, no dentro de cadenas internas.
- Corrige apertura de documentos PRL / Salud laboral guardados.
- Reemplaza xiaraOpenPRLSaved sin depender de h() ni modal().
- Añade xiaraPRLDiagnosticoU().
- Fuerza layout separado para sello empresa y firma empresa.

Prueba local:
1. firebase serve
2. http://localhost:5000
3. Consola: xiaraPRLDiagnosticoU()
