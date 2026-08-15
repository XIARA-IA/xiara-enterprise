XIARA V5.5.2 PRL OPEN + LAYOUT PATCH V

Este paquete fuerza que Firebase Hosting sirva el index.html de esta misma carpeta.
También incluye public/index.html por compatibilidad, pero firebase.json usa public: ".".

Prueba local recomendada:
cd C:\XIARA_ENTERPRISE\XIARA_V5_5_2_PRL_OPEN_LAYOUT_PATCH_V
firebase serve --only hosting --port 5055
Abrir http://localhost:5055

Consola esperada:
XIARA V5.5.2 PRL OPEN + LAYOUT PATCH V cargado

Diagnóstico:
xiaraPRLDiagnosticoV()
También funciona alias:
xiaraPRLDiagnosticoU()
