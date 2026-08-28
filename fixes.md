plan PLUS

Donde podemos usar nuestros grupos?
y nuestrsa dietas? recetas?
-- re utilizar e IMPORTAR testing
-- testing COMPLETO de todo

pagar IA en caso de fallback si no funciona gemini en nutri

[12:04, 27/8/2026] Benjamin: Consideraciones de arquitectura con Eve Framework  
1. Jerarquía de agentes: Configura agentes especializados por carpeta (ej. ⁠/agents/patologias⁠, ⁠/agents/calculo-calorico⁠, ⁠/agents/planificador⁠) utilizando TypeScript para validar schemas mediante Zod.  
2. Asignación de modelos: Puedes delegar tareas de cálculo y formateo de tablas a modelos de alta velocidad y bajo coste (como DeepSeek V4 Flash o Gemini Flash), reservando modelos de mayor razonamiento (Gemini Pro u OpenAI) para el agente encargado del cruce de restricciones patológicas.  
3. Mecanismos de validación: Debido a la criticidad médica de las patologías alimentarias, la lógica clínica (alérgenos, interacciones fármaco-alimento) debe apoyarse en bases de datos deterministas o llamadas a herramientas (RAG/APIs de nutrición), limitando el rol del LLM a la síntesis y estructuración de la respuesta.
[12:04, 27/8/2026] Benjamin: Arquitectura recomendada para arrancar:
1. Generación con DeepSeek: Utilízalo para redactar el menú, sugerir preparaciones culinarias y redactar explicaciones nutricionales en formato JSON.  
2. Validación determinista en código: No delegues la suma de calorías ni el filtrado de alérgenos/restricciones críticas al modelo. Realiza el cálculo matemático y el chequeo de ingredientes prohibidos mediante funciones en TypeScript antes de mostrar el resultado final.