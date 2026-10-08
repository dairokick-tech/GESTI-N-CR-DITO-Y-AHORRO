# CREDICONTAFI · actualización Créditos Grupales

Esta actualización es **aditiva**: no elimina ni borra clientes, créditos, pagos, solicitudes, historial ni otros registros existentes.

## Qué se agregó
- Módulo visible **Créditos Grupales** en el menú administrador.
- Creación de grupos.
- Código, nombre, zona, garantía, frecuencia y estado.
- Registro de integrantes existentes.
- Crédito individual vinculado a cada integrante del grupo.
- Cronograma individual por integrante.
- Cuenta de ahorro automática vinculada a cada crédito grupal.
- Historial de operaciones.
- Datos nuevos guardados dentro de la estructura existente de CREDICONTAFI.

## Subida a GitHub Pages
Sube y reemplaza únicamente los archivos de este paquete en la raíz del repositorio. No elimines tablas ni datos de Supabase.

## Importante
La base online existente se mantiene. El sistema agrega `groupCredits` y `savingsAccounts` al estado existente cuando sean necesarios; no ejecuta DROP, DELETE ni reemplaza registros anteriores.
