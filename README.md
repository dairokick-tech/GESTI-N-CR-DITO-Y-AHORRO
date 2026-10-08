# CREDICONTAFI PRO

Versión operativa para GitHub Pages.

## Flujo principal
Cliente → Solicitud → Evaluación → Aprobación → Crédito individual o grupal → Cronograma → Pagos → Cobranza → Cuenta de ahorro automática → Historial.

## Módulos
- Dashboard
- Clientes
- Solicitudes
- Productos de crédito y ahorro
- Evaluación de negocio y capacidad de pago
- Créditos individuales
- Créditos grupales (cada integrante obtiene su crédito vinculado)
- Ahorros automáticos por crédito
- Pagos y comprobantes QR
- Cobranza y WhatsApp
- Morosidad
- Expedientes
- Juntas y fondos
- Inversiones
- Documentos
- Reportes e historial
- Configuración
- Portal Cliente

## Regla de ahorro automático
Al aprobar/aperturar un crédito se crea una cuenta de ahorro vinculada al cliente y al crédito. En un crédito grupal se crea una cuenta de ahorro para cada integrante.

## Publicación
Sube todos estos archivos a la raíz de GitHub Pages:
- index.html
- app.js
- styles.css
- logo-credicontafi.svg
- online-config.js
- supabase-schema.sql (solo para ejecutar en Supabase; no es necesario que sea público)

## Supabase
La configuración usa el Project URL y la clave pública configurada en `online-config.js`. Nunca colocar una service_role key en el navegador.

Antes de usar información financiera real, se recomienda migrar el almacenamiento JSON a tablas normalizadas, Supabase Auth y RLS por usuario/rol.
