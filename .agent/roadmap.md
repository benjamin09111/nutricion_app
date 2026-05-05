# Roadmap de Desarrollo NutriNet

Estado basado en el codigo actual. 

Leyenda:
- `[x]` = ya existe en codigo y soporta el flujo principal.
- `[-]` = existe parcialmente o esta distribuido entre varios modulos.
- `[ ]` = sigue en roadmap.

## Fase 1: Core y Datos
- `[x]` **Modulo 10: Catalogo Maestro de Alimentos**
  - Base de datos de ingredientes/alimentos, marcas, categorias, tags y preferencias.
  - Filtros por nutricionista, favoritos, ocultos y precios de mercado.
- `[x]` **Modulo 5: CRM Nutricional (Pacientes)**
  - Perfiles de pacientes, antropometria, filtros y examenes.
  - Historial clinico y relacion con consultas.
- `[-]` **Modulo 4: Tabla de Composicion Quimica**
  - Los macros ya viven en ingredientes y se usan en recetas y validaciones.
  - Falta una capa dedicada unica para calculo quimico centralizado.

## Fase 2: Motor de Generacion
- `[-]` **Modulo 1: Generador de Dietas (Constraints & AI)**
  - Existe validacion de alimentos contra restricciones.
  - Existe apoyo AI para recetas y compatibilidad, pero no un generador unico completo.
- `[ ]` **Modulo 7: Optimizador de Horarios**
  - Sigue como vision.
  - No hay motor dedicado de ventanas horarias.

## Fase 3: Experiencia y Salida
- `[-]` **Modulo 2: Lista de Supermercado**
  - El flujo existe como parte de projects/creations y del frontend de carrito.
  - Falta consolidacion de backend y contratos propios.
- `[-]` **Modulo 6: Generador de Platos**
  - Existe soporte en `recipes` y en la UI de `platos`.
  - Falta formalizarlo como motor independiente.
- `[-]` **Modulo 8: Guias Visuales**
  - Resources, deliverable y exportacion visual ya existen de forma parcial.
  - Falta un pipeline documental unico para el PDF final.
- `[x]` **Modulo 3: Priorizacion (Favoritos)**
  - Favoritos y ocultos ya existen como preferencias sobre alimentos/ingredientes.
  - Se usan en listados y en la logica de recomendacion.
- `[x]` **Modulo Portal del Paciente: Engagement & Seguimiento**
  - Diario personal (estilo feed/tweets) para registro de comidas y actividad.
  - Canal de consultas directo con el nutricionista.
  - Acceso a planes entregados y documentos compartidos.
  - Login independiente por Email + Código de Acceso (Acceso Universal).
  - Navegación simplificada en 4 pilares fundamentales.

## Fase 4: Engagement y Futuro
- `[ ]` **Modulo 11: Asistente 24/7 (WhatsApp)**
  - Chatbot y push siguen en roadmap.
- `[ ]` **Modulo 9: E-commerce Connector**
  - Integraciones externas con supermercados siguen fuera del core actual.

## Nota de sincronizacion

- Si un modulo cambia de estado en codigo, actualiza este archivo en la misma tarea.
- Si el cambio afecta flujos de negocio, actualiza tambien `.agent/modules/` y `.agent/workflows/`.
