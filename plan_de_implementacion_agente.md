# Plan de Implementación — Agente de Resolución de Bugs y Mejoras
**Proyecto:** Plataforma web nutricional clínica  
**Fecha:** 29/06/2026  
**Autor del informe:** Luciano Zambrano  
**Ejecutor:** Agente LLM

---

## Instrucciones de Operación para el Agente

Antes de comenzar cualquier tarea, sigue estos principios:

1. **Lee el código antes de escribirlo.** Abre y examina los archivos relevantes antes de modificarlos.
2. **Una tarea a la vez.** Completa y verifica cada tarea antes de pasar a la siguiente.
3. **No supongas rutas.** Usa búsqueda en el repositorio (`find`, `grep`, búsqueda semántica) para localizar los archivos correctos.
4. **Criterio de éxito explícito.** Cada tarea tiene una condición de "hecho". No marques una tarea como completa hasta que la hayas verificado.
5. **Orden de prioridad:** CRÍTICO → CLÍNICO → UI/UX. Los bugs críticos primero porque bloquean el uso del sistema.
6. **Commit atómico por tarea.** Cada tarea termina con un commit descriptivo.

---

## BLOQUE 1 — BUGS CRÍTICOS (Sección 3 del informe)
> Estas fallas bloquean el flujo principal. Resolverlas primero.

---

### TAREA 1.1 — Depurar endpoint de guardado de Pautas

**Contexto:** Al intentar guardar una pauta de alimentación, el sistema retorna un error visible para el usuario. El flujo está completamente bloqueado.

**Pasos:**

1. Localiza el controlador del backend responsable de guardar pautas. Busca términos como `pauta`, `save`, `create`, `alimentacion` en el directorio de rutas/controllers.
2. Abre el controlador y examina la función de guardado (POST/PUT).
3. Identifica qué payload espera el endpoint. Compara con lo que el frontend está enviando.
   - Abre el componente/servicio del frontend que dispara el guardado de pautas.
   - Inspecciona el objeto que se construye antes de la llamada `fetch`/`axios`.
4. Busca discrepancias: campos faltantes, tipos de datos incorrectos (string en lugar de number, null en lugar de array vacío, etc.), o campos con nombres distintos entre frontend y backend.
5. Corrige la discrepancia en el lugar más apropiado (preferir corregir el frontend si el backend tiene el contrato correcto, o viceversa).
6. Agrega manejo de error visible para el usuario en el frontend: si el guardado falla, mostrar un mensaje de error claro (no un toast vacío ni silencio).
7. Prueba el flujo completo de guardado.

**Criterio de éxito:** El botón "Guardar" de una pauta completa el proceso sin errores y los datos persisten en la base de datos.

---

### TAREA 1.2 — Depurar endpoint de guardado de Recetas ("Siguiente")

**Contexto:** Al hacer clic en "Siguiente" dentro del flujo de creación de recetas, el sistema retorna un `Internal Server Error`. El flujo está completamente bloqueado.

**Pasos:**

1. Localiza el controlador del backend responsable del paso "Siguiente" en recetas. Busca `receta`, `recipe`, `step`, `next`, `create` en controllers/routes.
2. Revisa los logs del servidor para el error específico (stack trace). Si tienes acceso, filtra por el endpoint que dispara el botón "Siguiente".
3. Identifica la causa raíz: puede ser validación fallida, relación de base de datos no satisfecha, campo obligatorio no enviado, o error en una query.
4. Abre el componente de frontend del flujo de recetas. Localiza el manejador del botón "Siguiente" y examina qué datos se envían.
5. Corrige el error en el backend (o el payload en el frontend según corresponda).
6. Asegúrate de que el mismo fix aplica a todos los pasos del flujo multi-step de recetas (no solo el primero que falla).
7. Añade manejo de errores visible en el frontend para este flujo.

**Criterio de éxito:** El flujo completo de creación de recetas (todos los pasos hasta el final) funciona sin errores.

---

### TAREA 1.3 — Corregir persistencia de "Nuevo Alimento" (antes "Nuevo Ingrediente")

**Contexto:** Al añadir un nuevo alimento desde la comunidad, el sistema muestra notificación de éxito, pero el registro no se guarda realmente en la base de datos.

**Pasos:**

1. Busca el componente/vista de "Nuevo ingrediente" o "Nuevo alimento" en el frontend.
2. Examina la llamada al backend que se ejecuta al confirmar el nuevo alimento.
   - ¿Se ejecuta correctamente? ¿Recibe un status 200/201 o hay un error silenciado?
   - ¿Se está esperando (`await`) la promesa correctamente?
3. Revisa el controlador del backend correspondiente:
   - ¿El registro se inserta en la tabla correcta?
   - ¿Hay alguna transacción que hace rollback silenciosamente?
   - ¿Se está retornando éxito antes de confirmar la escritura?
4. Corrige el bug de persistencia. Opciones comunes: falta de `await`, transacción no confirmada (`commit` faltante), inserción en tabla incorrecta, o ID de usuario/contexto incorrecto.
5. **Renombrar en UI:** Cambia todas las instancias del texto "Nuevo ingrediente" a **"Nuevo Alimento"** en el frontend (labels, botones, títulos de modales, placeholders).
6. Verifica que después de guardar, el nuevo alimento aparece inmediatamente en la lista sin necesidad de recargar la página.

**Criterio de éxito:** Al agregar un nuevo alimento, este persiste en la base de datos y aparece en la lista.

---

### TAREA 1.4 — Corregir pantalla en blanco en Fichas Clínicas

**Contexto:** El módulo `/dashboard/fichas-clinicas` (o ruta equivalente) muestra una pantalla en blanco al cargar.

**Pasos:**

1. Abre la consola del navegador en la ruta de fichas clínicas y captura el error exacto (puede ser un error de JavaScript, un 404, un 401, o un error de renderizado).
2. Localiza el componente principal de Fichas Clínicas en el frontend.
3. Examina el `useEffect` o lógica de carga inicial:
   - ¿El fetch del backend retorna datos o un error?
   - ¿Hay un estado de `loading` que nunca se resuelve a `false`?
   - ¿Hay un error no capturado en el renderizado (ej. acceso a propiedad de `undefined`)?
4. Revisa el controlador del backend de fichas clínicas:
   - ¿El endpoint existe y está funcionando?
   - ¿Retorna los datos en el formato que el frontend espera?
5. Corrige el error. Si hay un crash de renderizado, añade un `try/catch` o un guard (`if (!data) return null`) apropiado.
6. Añade un estado de error visible: si la carga falla, mostrar un mensaje informativo en lugar de pantalla en blanco.

**Criterio de éxito:** La ruta de Fichas Clínicas carga y muestra contenido (o un mensaje de error descriptivo si no hay datos).

---

### TAREA 1.5 — Corregir filtros y contador de alimentos en `/dashboard/alimentos/grupos`

**Contexto:** En esta vista, el botón de filtros no reacciona al clic y el contador "Ya seleccionados" permanece en (0) aunque el usuario interactúe con la lista.

**Pasos:**

1. Localiza el componente de la vista `/dashboard/alimentos/grupos`.
2. **Problema del botón de filtros:**
   - Busca el handler del botón de filtros (`onClick`, `onPress`, etc.).
   - Verifica que el handler esté correctamente vinculado al botón (no hay un `undefined` o función vacía).
   - Si usa un estado global (Zustand, Context, Redux), verifica que el selector y el dispatcher estén correctamente conectados.
   - Corrige el handler para que abra/aplique los filtros correctamente.
3. **Problema del contador "Ya seleccionados (0)":**
   - Localiza el estado que controla el carrito/selección de alimentos.
   - Verifica que al hacer clic en un alimento de la lista, el estado de selección se actualice.
   - Si el estado es global (Zustand/Context), verifica que el componente de la lista y el componente del contador estén suscritos al mismo estado (mismo store, mismo selector).
   - Corrige la desconexión entre la acción de selección y el estado reactivo.
4. Verifica que al seleccionar alimentos, el contador se incremente en tiempo real y los filtros funcionen.

**Criterio de éxito:** El botón de filtros reacciona y filtra la lista. El contador "Ya seleccionados" refleja correctamente la cantidad de alimentos seleccionados.

---

## BLOQUE 2 — PRECISIÓN CLÍNICA Y REGLAS DE NEGOCIO (Sección 2 del informe)
> Correcciones de lógica de dominio que afectan la validez clínica de la plataforma.

---

### TAREA 2.1 — Reestructurar Anamnesis y Datos del Paciente

**Contexto:** El formulario de anamnesis tiene campos mal categorizados, campos faltantes, y no calcula la edad automáticamente.

**Pasos:**

1. Localiza el componente/formulario de creación o edición de paciente.
2. **Renombrar sección:** Cambia el título "Identidad" (o equivalente) por **"Datos del Paciente"**.
3. **Mover Fecha de Nacimiento:** El campo `fecha_nacimiento` está dentro de la sección "Antropometría". Muévelo a la sección "Datos del Paciente".
4. **Cálculo automático de edad:**
   - Cuando el usuario ingrese o seleccione la fecha de nacimiento, calcula la edad en años automáticamente.
   - Muestra la edad calculada como campo de solo lectura junto a la fecha de nacimiento.
   - Fórmula: `edad = hoy.año - nacimiento.año`, ajustando si aún no ha pasado el cumpleaños este año.
5. **Añadir campos faltantes (generales):**
   - Ocupación (text input)
   - Horario laboral (text input o select: mañana/tarde/noche/rotativo)
   - Consumo de fármacos/medicamentos (textarea o lista dinámica)
   - Consumo de drogas/suplementos (textarea)
   - Patologías diagnosticadas (textarea o lista dinámica con buscador)
6. **Añadir campos para pacientes de sexo femenino (condicionales):**
   - Implementa lógica condicional: si el sexo del paciente es "Femenino", mostrar un bloque adicional con:
     - ¿Está embarazada? (checkbox/toggle)
     - Si está embarazada: semanas de gestación (número)
     - Si está embarazada: peso pre-gestacional (número, kg)
7. **Añadir sección de Anamnesis Nutricional:**
   - Crea una nueva sección colapsable llamada "Anamnesis Nutricional" que contenga:
     - Frecuencia de consumo de grupos de alimentos
     - Recordatorio de 24 horas (textarea o tabla dinámica con tiempo, alimento, cantidad)
8. Implementa las secciones como componentes desplegables/acordeón para no sobrecargar la vista.
9. Actualiza el modelo del backend (si aplica) para incluir los nuevos campos.

**Criterio de éxito:** El formulario del paciente muestra todos los campos listados, la edad se calcula automáticamente, los campos femeninos aparecen solo cuando corresponde, y los datos se guardan correctamente.

---

### TAREA 2.2 — Corregir Cálculos Antropométricos e IMC

**Contexto:** El concepto de "Peso ideal" es incorrecto (muestra el rango de normopeso). El IMC no discrimina edad ni sexo, y faltan campos de pliegues y curvas MINSAL para niños.

**Pasos:**

1. Localiza el módulo/servicio de cálculos antropométricos (puede estar en frontend como utilidad, o en el backend como servicio).
2. **Corregir "Peso Ideal":**
   - Elimina o corrige la etiqueta "Peso ideal" que actualmente muestra el rango de normopeso.
   - Implementa el cálculo correcto de peso ideal según las siguientes fórmulas validadas:
     - **Hombres adultos:** `Peso ideal = 22.5 × (talla en metros)²`
     - **Mujeres adultas:** `Peso ideal = 21.5 × (talla en metros)²`
     - **Adulto mayor (>65 años):** Ajustar con IMC objetivo entre 23-28 (según guías vigentes).
     - **Niños y adolescentes:** Peso ideal es el percentil 50 de las curvas MINSAL para su edad y sexo (ver punto 4).
   - Muestra el resultado como un rango (ej. "68 – 72 kg") no un valor único.
3. **Corregir etiqueta de "Normopeso":**
   - El rango de IMC 18.5–24.9 corresponde a "Normopeso" (o "Peso normal"). Verifica que la etiqueta en la UI sea correcta y no "Peso Ideal".
4. **Integrar Curvas de Crecimiento MINSAL para población infantil (< 18 años):**
   - Para pacientes menores de 18 años, el sistema debe usar las tablas de referencia MINSAL (percentiles de IMC/Edad, Talla/Edad, Peso/Edad).
   - Integra los datos tabulares de las curvas MINSAL como constantes en el código (tablas de percentiles por edad y sexo).
   - El cálculo de IMC para niños debe retornar el percentil correspondiente, no solo el valor numérico.
   - Muestra la categoría según percentil: Bajo peso (<p10), Normal (p10-p85), Sobrepeso (p85-p95), Obesidad (>p95).
5. **Añadir campos opcionales de pliegues:**
   - Añade una sección colapsable "Pliegues cutáneos" con campos opcionales para:
     - Pliegue tricipital (mm)
     - Pliegue bicipital (mm)
     - Pliegue subescapular (mm)
     - Pliegue suprailíaco (mm)
   - Peso (kg) y Talla (cm) deben permanecer como campos obligatorios.
6. Mantén los campos de peso y talla como obligatorios y el resto como opcionales.

**Criterio de éxito:** El sistema muestra "Peso Ideal" con el valor calculado correctamente, "Normopeso" con el rango de IMC, aplica curvas MINSAL para menores de 18 años, y los campos de pliegues son opcionales y se guardan.

---

### TAREA 2.3 — Corregir Configuración de Dietas, Base de Datos y Macros

**Contexto:** La terminología en PDFs no es clínica, la base de datos tiene nombre incorrecto, el cálculo de déficit no es dinámico, y los macros no aceptan entrada en g/kg.

**Pasos:**

1. **Renombrar base de datos "Oficiales App":**
   - Busca en el código y en la UI donde aparece el texto "Oficiales App".
   - Cámbialo por **"INTA 2018"** en todos los lugares (labels, selects, tooltips, PDFs generados).
2. **Añadir nueva base de datos "Jury-G. Urteaga-C. 1999":**
   - Crea una nueva pestaña/opción en el selector de base de datos de alimentos llamada **"Porciones de Intercambio (Jury-G. Urteaga-C. 1999)"**.
   - Si los datos de esta base no están en el sistema, deja la estructura preparada con un placeholder y documenta en comentario lo que se debe cargar.
3. **Renombrar "Tiempo de alimentación":**
   - En la configuración de la dieta y en los PDFs generados, cambia los títulos genéricos de tiempos (ej. "Comida 1", "Tiempo 1") por **"Tiempo de alimentación"**.
   - Bajo cada tiempo de alimentación, muestra el total de calorías y la distribución de macronutrientes de ese tiempo.
4. **Habilitar inputs de macros en g/kg con sincronización bidireccional:**
   - En la pantalla de configuración de macros de la dieta, añade inputs numéricos para ingresar cada macronutriente en **g/kg de peso corporal**.
   - Lógica de sincronización:
     - Cuando el usuario ingresa un valor en g/kg → calcular los gramos totales (`g/kg × peso del paciente`) y actualizar la barra de porcentaje automáticamente.
     - Cuando el usuario modifica el porcentaje o los gramos totales → recalcular el g/kg y actualizar el input correspondiente.
   - Los tres modos (%, g totales, g/kg) deben estar siempre sincronizados.
5. **Habilitar cálculo automático de déficit calórico:**
   - En la sección de configuración de la dieta, añade un campo o toggle para "Déficit calórico".
   - El sistema debe calcular dinámicamente: `Calorías objetivo = GET (Gasto Energético Total) - Déficit seleccionado`.
   - El déficit puede ser un valor fijo en kcal o un porcentaje del GET.
   - Cuando el usuario cambia el GET o el déficit, las calorías objetivo deben actualizarse en tiempo real.

**Criterio de éxito:** La base de datos aparece como "INTA 2018", existe la opción de Jury-G, los macros son editables en g/kg con sincronización bidireccional, y el déficit se calcula dinámicamente.

---

## BLOQUE 3 — UI/UX Y EXPERIENCIA DE USUARIO (Sección 4 del informe)
> Mejoras de interfaz que impactan el flujo de trabajo diario del profesional.

---

### TAREA 3.1 — Configurar Menú Lateral Colapsado por Defecto

**Contexto:** El menú lateral aparece expandido por defecto, generando sobrecarga cognitiva, especialmente en pantallas pequeñas (13"/14").

**Pasos:**

1. Localiza el componente del menú lateral (sidebar) y su estado de visibilidad (abierto/cerrado).
2. Cambia el valor inicial del estado de `open: true` a **`open: false`** (colapsado por defecto).
3. Persiste la preferencia del usuario: cuando el usuario expanda o colapse el menú, guarda su preferencia en `localStorage` y úsala como valor inicial en la próxima carga.
   ```javascript
   // Ejemplo de lógica
   const savedState = localStorage.getItem('sidebar_open');
   const initialState = savedState !== null ? JSON.parse(savedState) : false;
   ```
4. Asegúrate de que el ícono de toggle del menú sea visible y accesible cuando el menú está colapsado.

**Criterio de éxito:** Al cargar la aplicación por primera vez, el menú lateral aparece colapsado. La preferencia del usuario persiste entre sesiones.

---

### TAREA 3.2 — Corregir Layout en Resoluciones de Laptop (13"/14")

**Contexto:** En `/dashboard/pacientes`, la pestaña "Actividad" colapsa en pantallas pequeñas y el campo de búsqueda ocupa demasiado ancho.

**Pasos:**

1. Abre la vista `/dashboard/pacientes` en el inspector de elementos del navegador, simulando resolución 1280×800 (13" estándar).
2. **Corregir colapso de pestaña "Actividad":**
   - Localiza el componente de pestañas (tabs) de la vista de pacientes.
   - Si las pestañas se desbordan o colapsan, implementa scroll horizontal en el contenedor de tabs, o usa un componente de tabs responsivo.
   - Asegúrate de que todas las pestañas sean accesibles en pantallas de 1280px sin desbordamiento.
3. **Reducir ancho del campo de búsqueda:**
   - Localiza el input de búsqueda en la cabecera de la vista de pacientes.
   - Aplica un `max-width` razonable (ej. `max-width: 320px` o `max-width: 40%`).
   - Asegúrate de que el espacio liberado sea aprovechado por la tabla de datos.
4. **Reordenar jerarquía de botones en la cabecera:**
   - Mueve el botón **"+ Nuevo Paciente"** a la derecha de la cabecera (posición primaria).
   - Ubica el acceso a "Seguimientos" en un nivel secundario (debajo o como botón de menor jerarquía visual).
5. Verifica el layout en 1280×800, 1366×768, y 1440×900.

**Criterio de éxito:** En resoluciones de laptop de 13"/14", todas las pestañas son visibles, el buscador no domina el ancho, y el botón "+ Nuevo Paciente" está a la derecha.

---

### TAREA 3.3 — Corregir Modal de "Selección Inteligente" (overflow y cierre)

**Contexto:** El modal de "Selección Inteligente" excede el alto de la pantalla (viewport), impidiendo cerrarlo sin reducir el zoom. No responde a la tecla Escape.

**Pasos:**

1. Localiza el componente del modal "Selección Inteligente".
2. **Corregir overflow del modal:**
   - Añade al contenedor del modal las siguientes propiedades CSS:
     ```css
     max-height: 90vh;
     overflow-y: auto;
     ```
   - Asegúrate de que el botón de cierre (X) esté fijo en la parte superior del modal (posición `sticky` o `fixed` dentro del modal), no dentro del contenido scrolleable.
3. **Implementar cierre con tecla Escape:**
   - Añade un event listener para la tecla `Escape` que cierre el modal.
   - Aplica este comportamiento a **todos los modales de la aplicación**, no solo este.
   - Ejemplo:
     ```javascript
     useEffect(() => {
       const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
       document.addEventListener('keydown', handleEsc);
       return () => document.removeEventListener('keydown', handleEsc);
     }, []);
     ```
4. Verifica que el modal sea usable en viewport de 768px de alto (tablet) y 900px (laptop).

**Criterio de éxito:** El modal de Selección Inteligente no excede el alto de la pantalla, tiene scroll interno, y se cierra con la tecla Escape.

---

### TAREA 3.4 — Corregir Tabla de Recetas (evento de clic y alineación de macros)

**Contexto:** Al hacer clic en cualquier punto de una fila en la tabla de recetas, se abre el detalle. El evento debe restringirse solo al botón "Abrir". Además, la previsualización de macros tiene errores de alineación.

**Pasos:**

1. Localiza el componente de la tabla de recetas.
2. **Restringir evento onClick de la fila:**
   - Elimina el handler `onClick` del elemento `<tr>` o del contenedor de fila.
   - Asegúrate de que el evento de apertura esté únicamente en el botón o ícono designado como "Abrir" / "Ver detalle".
   - Si hay un handler en la fila por propagación de eventos, usa `e.stopPropagation()` en los elementos interactivos (checkboxes, botones de acción) para evitar aperturas accidentales.
3. **Corregir alineación de macros en la previsualización:**
   - Abre la previsualización de macros en la tabla de recetas.
   - Identifica los elementos que están desalineados (puede ser un problema de `flexbox`, `grid`, o `text-align`).
   - Aplica la corrección de CSS apropiada para que los valores de proteínas, carbohidratos y grasas estén alineados de forma consistente.
4. Verifica que la tabla funcione correctamente en distintos anchos de pantalla.

**Criterio de éxito:** Hacer clic en una fila de receta no abre el detalle. Solo el botón "Abrir" lo hace. Los macros en la previsualización están alineados.

---

### TAREA 3.5 — Corregir Índice Rápido Obstructivo en Entregables

**Contexto:** El índice rápido del entregable (pauta) obstruye la vista central. Esto es especialmente problemático en tablets usadas en operativos o atención a domicilio.

**Pasos:**

1. Localiza el componente del índice rápido (tabla de contenidos flotante) en la vista de entregables.
2. Implementa una de las siguientes soluciones (elige la más apropiada al diseño actual):
   - **Opción A (recomendada):** Añade un botón toggle para mostrar/ocultar el índice. Por defecto, colapsado en pantallas ≤ 1024px (tablet).
   - **Opción B:** Convierte el índice en un panel deslizable (drawer) que se abre desde el borde de la pantalla.
3. Usa media queries o detección de viewport para que en tablets (≤ 1024px) el índice empiece colapsado automáticamente.
4. Asegúrate de que el índice no use `position: fixed` de forma que tape contenido sin posibilidad de ocultarlo.

**Criterio de éxito:** En un dispositivo tablet (1024px o menos), el índice rápido no obstruye el contenido principal. El usuario puede mostrarlo u ocultarlo manualmente.

---

## BLOQUE 4 — OPTIMIZACIÓN DEL PDF GENERADO (Sección 4.3 del informe)

---

### TAREA 4.1 — Reestructurar Renderizado del PDF de Pauta de Alimentación

**Contexto:** Los PDFs generados tienen grandes espacios en blanco, las opciones alternativas de un mismo tiempo de comida no están claramente identificadas, y la redacción de alimentos no cumple estándares clínicos.

**Pasos:**

1. Localiza el módulo/servicio de generación de PDFs (puede ser `pdfmake`, `jsPDF`, `puppeteer`, `react-pdf`, o un servicio backend).
2. **Eliminar espacios en blanco excesivos:**
   - Revisa el template del PDF. Los espacios en blanco suelen ocurrir cuando se asigna altura fija a contenedores independientemente del contenido.
   - Cambia alturas fijas por alturas dinámicas (`auto` o basadas en contenido).
3. **Implementar layout de columnas para opciones alternativas:**
   - Cuando un tiempo de alimentación tiene más de una opción, renderizarlas en columnas:
     - Opción 1 a la izquierda | Opción 2 a la derecha (layout de 2 columnas).
     - Si hay 3 o más opciones, usar 2 columnas con salto de página si es necesario.
   - Encabezar cada columna claramente con "**Opción 1**", "**Opción 2**", etc.
4. **Estandarizar redacción de alimentos:**
   - Todos los alimentos deben incluir cantidad y unidad. El formato correcto es:
     - `[cantidad] [unidad] de [alimento]` → ej. "2 unidades de huevo", "100 g de pollo a la plancha", "200 ml de leche descremada"
   - Elimina el patrón `"1 de huevo"` implementando validación: si un alimento no tiene unidad asignada, usar "unidad(es)" como fallback, pero marcar el alimento como incompleto para que el profesional lo revise.
   - En la sección `/dashboard/dieta` del entregable personalizado, especificar que el aporte nutricional es **por 100 g / 100 ml** del alimento.
5. Verifica que el PDF generado sea legible e imprimible en tamaño carta (Letter / A4).

**Criterio de éxito:** El PDF generado no tiene espacios en blanco excesivos, las opciones alternativas están en columnas claramente identificadas, y todos los alimentos tienen cantidad y unidad.

---

## Resumen de Tareas por Prioridad

| # | Tarea | Prioridad | Estimación |
|---|-------|-----------|------------|
| 1.1 | Endpoint guardado de Pautas | 🔴 CRÍTICO | Alta complejidad |
| 1.2 | Endpoint guardado de Recetas | 🔴 CRÍTICO | Alta complejidad |
| 1.3 | Persistencia "Nuevo Alimento" + rename | 🔴 CRÍTICO | Media complejidad |
| 1.4 | Pantalla en blanco Fichas Clínicas | 🔴 CRÍTICO | Media complejidad |
| 1.5 | Filtros y contador alimentos | 🔴 CRÍTICO | Media complejidad |
| 2.1 | Reestructurar Anamnesis | 🟠 CLÍNICO | Alta complejidad |
| 2.2 | Cálculos IMC y Peso Ideal | 🟠 CLÍNICO | Alta complejidad |
| 2.3 | Configuración de Dietas y Macros | 🟠 CLÍNICO | Alta complejidad |
| 3.1 | Menú lateral colapsado | 🟡 UI/UX | Baja complejidad |
| 3.2 | Layout en laptops 13"/14" | 🟡 UI/UX | Media complejidad |
| 3.3 | Modal overflow + tecla Escape | 🟡 UI/UX | Baja complejidad |
| 3.4 | Tabla de recetas onClick + macros | 🟡 UI/UX | Baja complejidad |
| 3.5 | Índice rápido en tablets | 🟡 UI/UX | Baja complejidad |
| 4.1 | PDF columnas, espacios y redacción | 🟡 UI/UX | Alta complejidad |

---

## Protocolo de Verificación Final

Después de completar todas las tareas, ejecuta este checklist:

- [ ] Los endpoints de guardado (pautas y recetas) funcionan sin errores.
- [ ] Un nuevo alimento creado persiste en la base de datos tras recargar la página.
- [ ] Fichas Clínicas carga contenido correctamente.
- [ ] Los filtros de alimentos funcionan y el contador se actualiza.
- [ ] La anamnesis incluye todos los campos clínicos requeridos.
- [ ] Para pacientes mujeres, aparecen campos de gestación.
- [ ] La edad se calcula automáticamente desde la fecha de nacimiento.
- [ ] El "Peso Ideal" usa las fórmulas correctas por sexo y edad.
- [ ] Para menores de 18 años, el sistema usa curvas MINSAL.
- [ ] La base de datos de alimentos aparece como "INTA 2018".
- [ ] Los macros son editables en g/kg con sincronización bidireccional.
- [ ] El déficit calórico se calcula dinámicamente.
- [ ] El menú lateral comienza colapsado y persiste la preferencia.
- [ ] En 1280px, el layout de pacientes no colapsa y el buscador no es desproporcionado.
- [ ] El modal de Selección Inteligente no desborda el viewport y cierra con Escape.
- [ ] La tabla de recetas solo abre el detalle desde el botón "Abrir".
- [ ] El índice rápido no obstruye el contenido en tablets.
- [ ] El PDF generado usa columnas para opciones alternativas.
- [ ] Los alimentos en el PDF siempre incluyen cantidad y unidad.

---

*Fin del plan de implementación. Versión 1.0 — 29/06/2026.*
