# CREDICONTAFI V11 - Flujo jerárquico de crédito

1. Cliente: expediente y datos base.
2. Producto: condiciones financieras.
3. Evaluación de negocio: análisis y resultado PREAPROBADO/NO PROCEDE.
4. Solicitud: una evaluación PREAPROBADA crea solo una solicitud PENDIENTE DE APROBACIÓN.
5. Aprobación: un usuario con función de aprobador autoriza y recién entonces se crea el crédito en estado APROBADO.
6. Desembolso: usuario autorizado cambia APROBADO a VIGENTE.
7. Pagos: solo sobre créditos VIGENTES.
8. Documentos: contrato y cronograma definitivos desde el crédito.
9. Anulación: conserva expediente, motivo, fecha y usuario.

La evaluación está organizada por expediente: identificación, actividad, rentabilidad, situación financiera, solicitud/capacidad de pago, sustento documental, indicadores, alertas y decisión.
