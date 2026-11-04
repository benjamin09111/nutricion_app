Funcionalidades de la demo y del prototipo para la feria
La demo debe lograr una cosa: que una nutricionista pase de un paciente vacío a una pauta aprobada, en PDF y en el portal del paciente, en menos de 5 minutos, viendo de dónde sale cada cifra. Esa es la experiencia que impresiona al jurado y, al mismo tiempo, la que mide tu métrica principal.
Sobre el chatbot "crea un plan": sí, pero con una condición. Un chat que responde con un plan en texto se ve igual que ChatGPT y contradice tu frase central. Haz un asistente de pauta: la nutricionista escribe en lenguaje natural ("pauta 1.600 kcal, resistencia a la insulina, sin lácteos, cocina poco, vive en Antofagasta") y el sistema devuelve un borrador estructurado en porciones de intercambio, con el cuadre y la trazabilidad visibles, que ella ajusta y aprueba. La IA propone; ella decide. Mientras genera, muestra los pasos en pantalla: "Calculando requerimientos ✓ · Eligiendo porciones ✓ · Revisando alergias ✓ · Cuadrando metas ✓". En 20 segundos el jurado entiende la arquitectura sin que la expliques.
Qué es la trazabilidad, en concreto. Que cada cifra de la pauta se pueda seguir hasta su origen y que quede registro de quién decidió qué. Tiene dos capas, y la demo debe mostrar ambas:

1. Por qué este número (trazabilidad clínica). Al tocar "Desayuno: 2 porciones de cereales", la plataforma muestra: requerimiento calculado con [fórmula] a partir del peso, la talla, la edad y la actividad registrados en la ficha → distribución de la nutricionista para ese tiempo de comida → equivalencia en la tabla de porciones de intercambio → alimento elegido. Nada es una caja negra.
2. Quién decidió (trazabilidad de responsabilidad). Un historial por pauta: "La IA propuso marraqueta · la nutricionista la cambió por avena · aprobó y firmó el 12/11 a las 18:40". Sirve como respaldo profesional, para auditoría y para la Ley 21.719.
   Por qué diferencia: ChatGPT da un plan sin decir de dónde salen los números, y el software de plantillas no explica nada ni distingue qué hizo la máquina y qué hizo la profesional. NutriNet hace las dos cosas. Por eso tu frase funciona: la IA calcula (y lo muestra), el nutricionista decide (y queda registrado).
   Cómo cubre la demo el feedback de tu profesor
   Comentario del profesor
   Dónde aparece en la demo
   Diferenciación = trazabilidad
   Clic en cada cifra + pestaña Historial (P1)
   "El profesional pone criterio"
   El asistente entrega borrador; nada sale sin "Aprobar y firmar" (P1)
   Datos confidenciales
   Panel "Qué vio la IA" sin nombre ni RUT + banner de datos ficticios (P1)
   Antofagasta no es Chiloé
   Selector de región y pacientes ficticios de 3 regiones (P1)
   Usabilidad y curva de aprendizaje
   Cronómetro + pregunta "¿qué tan fácil fue?" al terminar
   Costos para un inversionista
   La demo registra tokens por pauta: sale tu costo real
   De quién es el problema
   Todo el recorrido es de la nutricionista; el portal muestra al paciente como afectado
   Equipo junior
   Pacientes ficticios validados por tu asesora clínica, nombrada en la demo
   "Nutri" suena liviano
   Descriptor serio en la pantalla de entrada
   Modelo de negocio y "match"
   El match queda fuera a propósito; "Socia fundadora" con precio valida disposición a pagar
   Funcionalidades, por prioridad
   P1 = imprescindible antes de la final · P2 = diferenciador que conviene tener · P3 = solo si sobra tiempo.
   Prioridad
   Funcionalidad
   Qué se ve en la demo
   Por qué impresiona
   Qué valida
   P1
   Modo demo sin login
   Pantalla de entrada con el descriptor "NutriNet · Plataforma clínica para nutricionistas", "Probar el reto de 5 minutos" y 3 pacientes ficticios precargados
   Cero fricción: en 5 segundos está usando el producto
   Tasa de quienes entran y empiezan
   P1
   Reto con cronómetro
   Cronómetro visible desde "empezar" hasta "aprobar"
   Convierte la promesa en algo que la persona vive
   Tiempo por pauta (tu métrica clave)
   P1
   Ficha clínica express
   Peso, talla, edad, actividad, patologías y alergias → IMC, gasto energético (fórmula a elección), distribución de macronutrientes; gráfico de progreso con datos de ejemplo
   La nutricionista reconoce su flujo de trabajo real
   Si los cálculos coinciden con los suyos
   P1
   Asistente de pauta
   Barra de texto con sugerencias en botones ("baja 200 kcal", "cena sin cocinar", "más proteína en desayuno") y borrador por tiempo de comida
   El efecto "wow" de la IA, sin perder control profesional
   Cuántas cifras corrige; qué pide más
   P1
   Trazabilidad con un clic
   Clic en cualquier cifra → "1 porción de cereales = ½ marraqueta · fuente: tabla de porciones de intercambio · fórmula usada", más una pestaña Historial: qué propuso la IA, qué cambió la nutricionista y cuándo aprobó
   Es tu diferenciador central; ningún chatbot lo hace
   Confianza (pregunta en la encuesta)
   P1
   Cuadre en vivo
   Barras meta vs pauta (kcal, proteínas, lípidos, carbohidratos) con desviación en % y semáforo
   Se ve la precisión; responde a "¿y si la IA se equivoca?"
   Desviación calórica final
   P1
   Intercambio con un clic
   Cambiar un alimento por equivalentes del mismo grupo sin descuadrar
   Es justo el trabajo manual que hoy hacen en Excel
   Uso de la función (evento)
   P1
   Bloqueos de seguridad
   Si la ficha dice "sin lácteos", el yogur aparece bloqueado con el motivo
   Responde la pregunta de responsabilidad clínica antes de que la hagan
   Confianza clínica
   P1
   Aprobar y firmar → PDF
   Botón "Aprobar" genera PDF profesional con nombre/logo de la nutricionista, recetas y lista de supermercado
   Entregable tangible que se pueden llevar
   Tasa de pautas aprobadas y descargadas
   P1
   Vista del portal del paciente
   Vista de celular: pauta del día, recetas, lista de compras con check, registro de peso
   Muestra el lado del paciente y el abandono
   Interés en el seguimiento (encuesta)
   P1
   "Quiero ser socia fundadora"
   Botón fijo y al final del reto (ver abajo)
   Convierte interés en compromiso medible
   Cartas de intención o preventas
   P1
   "Qué vio la IA"
   Panel que muestra lo enviado al modelo: edad, meta, restricciones, sin nombre ni RUT
   Responde la pregunta de datos de salud en una imagen
   Confianza en seguridad
   P1
   Selector de región
   Antofagasta / Santiago / Chiloé cambia sugerencias por disponibilidad local (versión preliminar, con pocos alimentos curados)
   Es la idea de tu profesor y nadie más la tiene
   Interés por región (encuesta)
   P2
   Plantillas reutilizables
   "Guardar como plantilla" y aplicarla a otro paciente, reajustando a sus kcal
   Ahorro de tiempo que se multiplica
   Uso de plantillas
   P2
   Panel de adherencia
   Lista de pacientes ficticios con semáforo: "Sin registros hace 12 días → riesgo de abandono"
   Conecta el producto con el 86% del pitch
   Interés en alertas (encuesta)
   P2
   Contador de tiempo ahorrado
   Al terminar: "Tardaste 4:12. Tú estimaste 90 min con tu método actual"
   Cierre emocional del reto
   Diferencia antes/después por usuaria
   P3
   Lista de compras con costo estimado
   Total aproximado por semana
   Muy atractivo, pero requiere datos de precios confiables
   Disposición a pagar más
   P3
   Recetas con foto
   Recetas chilenas simples asociadas a la pauta
   Estética para la feria
   Agrado (encuesta)
   No incluir en la demo: login, agenda, boletas, match paciente-nutricionista, pagos, chat libre con pacientes, bot de WhatsApp autónomo ni datos reales de pacientes. Todo eso suma tiempo de desarrollo, riesgo legal o preguntas que no puedes responder aún.
   Pacientes ficticios precargados (el caso estándar va primero):
3. Valentina, 34 años, Antofagasta: IMC 31, resistencia a la insulina, sin lácteos, cocina poco. Es el caso estándar de la validación.
4. Don Luis, 62 años, Chiloé: diabetes tipo 2 e hipertensión. Muestra bloqueos y la diferencia regional.
5. Martín, 19 años, Santiago: estudiante deportista, aumento de masa muscular. Muestra que no es solo para obesidad.
   Valida estos casos con tu asesora clínica antes de publicarlos.
   El botón "me interesa", mejor diseñado. Un clic de "me interesa" mide curiosidad, no demanda. Usa dos niveles:
   • Nivel 1, al terminar el reto (40 segundos): 4 preguntas: "¿Cuánto tardas hoy en una pauta así?", "¿Qué tan decepcionada estarías si no pudieras usar NutriNet?" (muy / algo / nada), "¿Qué tan fácil fue usarla, de 1 a 7?" y "¿Qué le falta?".
   • Nivel 2, "Quiero ser socia fundadora": nombre, correo, región, tipo de práctica (privada, online, clínica, pública, estudiante), pacientes por mes, herramienta actual y "¿a qué precio mensual te parecería caro?". Casilla de consentimiento para contactarla. Al enviar: "Te reservamos precio fundador de $[X] por 12 meses".
   Reporta ambos por separado en el pitch: "[N] completaron el reto, [M] se inscribieron como socias fundadoras".
   Eventos que debe registrar la demo: inicio del reto, ficha completa, pauta generada (segundos de generación y tokens usados, para calcular tu costo real por pauta), cada edición e intercambio, clics en trazabilidad, bloqueos mostrados, pauta aprobada (con tiempo total), PDF descargado, portal abierto, encuesta enviada, socia fundadora inscrita. Agrega un identificador anónimo por sesión y el origen (feria, Instagram, universidad) en el enlace.
   Recorrido de 5 minutos para la feria y para el video del pitch:
6. 0:00 — "Probar el reto" → elige a Valentina; arranca el cronómetro.
7. 0:30 — Revisa la ficha: el gasto energético y los macros ya están calculados.
8. 1:00 — Escribe en el asistente; aparecen los pasos y el borrador en menos de 60 segundos.
9. 2:00 — Clic en una cifra para ver la fuente; cambia la marraqueta por avena; el cuadre sigue en verde. Intenta agregar yogur: aparece bloqueado.
10. 3:30 — "Aprobar y firmar" → PDF con recetas y lista de compras.
11. 4:00 — Vista del portal en celular; panel de adherencia con la alerta de abandono.
12. 4:30 — Pantalla final: tiempo total, encuesta y "Quiero ser socia fundadora".
    Para el video de 15 a 20 segundos del pitch, graba solo los pasos 3, 4 y 5 acelerados.
    Montaje en la feria: notebook con la demo abierta en el reto, tablet o celular con el portal del paciente, un QR grande "Haz el reto de 5 minutos" para nutricionistas que pasen, y una tarjeta que diga "La IA calcula. El nutricionista decide." Si hay voto del público, el reto con cronómetro (y un ranking de tiempos del día) atrae gente al stand.
    Cómo construirlo rápido sin perder la tesis técnica: pide al modelo de IA que responda en un formato estructurado (por ejemplo, JSON) eligiendo solo identificadores de alimentos y porciones de tu base; el cálculo de totales lo hace tu código; si la desviación supera 5%, tu código ajusta porciones o vuelve a pedir. Así el asistente es rápido de construir y defendible ante el jurado. Usa un banner fijo: "Demo con datos ficticios. No ingreses datos reales de pacientes".
