# XIARA IA AUDITORIA V2 CLOUD READY

Esta versión es una base funcional preparada para Firebase.

## Incluye
- index.html con app completa.
- firebase-config.js para pegar configuración Firebase.
- Firestore listo.
- Storage listo.
- Hosting listo.
- Modo demo local si Firebase no está configurado.
- Multiempresa / multi-tenant por empresa_id.
- Usuarios y roles.
- 7 módulos:
  1. Notificaciones Oficiales
  2. Expedientes Laborales
  3. Fiscalización Financiera
  4. Compliance & Riesgo
  5. Recursos Humanos
  6. Control Documental
  7. Socios & Gobierno

## Para poner online
1. Crear proyecto en Firebase.
2. Activar Authentication > Email/Password.
3. Activar Firestore Database.
4. Activar Storage.
5. Crear app web en Firebase.
6. Copiar config en firebase-config.js.
7. Instalar Firebase CLI:
   npm install -g firebase-tools
8. Ejecutar:
   firebase login
   firebase use --add
   firebase deploy

## Importante
Las reglas incluidas son base de desarrollo. Para producción hay que endurecerlas con:
- usuarios/{uid}
- custom claims
- validación estricta de empresa_id
- permisos por rol
