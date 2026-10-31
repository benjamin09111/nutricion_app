# Guía Maestra: Servicio de Agentes de IA con OpenRouter

Oct 22, 2026 · @Benjamin

## Introducción

Esta guía define cómo construir `agent-services`: un servicio interno de agentes de IA para un SaaS multi-tenant, con OpenRouter como única puerta de acceso a los modelos. Reemplaza a la guía anterior, que estaba atada a Gemini y Google ADK, y corrige sus errores (ver el anexo al final).

El objetivo es tener agentes reales, no simples llamadas al LLM: cada agente cumple una tarea concreta, usa herramientas, mantiene estado de sesión, recuerda al usuario y opera dentro de un presupuesto de pasos, tokens y dinero. Al mismo tiempo, el modelo de cada agente es configurable, para probar distintos modelos en OpenRouter y quedarse con el que mejor funcione según evals medibles.

La guía distingue dos niveles:

- **Núcleo:** lo que todo agente en producción necesita desde el día uno. Secciones 1 a 12.
- **Opcional:** capacidades avanzadas (ejecución durable, MCP, A2A, jerarquía de tres niveles) que se activan solo cuando un caso de uso real las justifica. Sección 13.

Va dirigida a desarrolladores, tanto humanos como agentes de código, que implementen o mantengan el servicio. Los ejemplos de código usan Python 3.12, FastAPI y PydanticAI; las APIs de librerías cambian rápido, así que verifica firmas exactas contra la documentación oficial antes de copiar.

## 1. Principios de diseño

Seis reglas guían todas las decisiones de esta guía. Cuando dudes, vuelve aquí.

1. **Workflow antes que agente.** Si los pasos de una tarea se conocen de antemano, constrúyela como un flujo determinista donde algunos pasos llaman a un LLM. Usa un agente autónomo (bucle con herramientas) solo cuando el camino depende de lo que encuentre en el trayecto. Los workflows son más baratos, predecibles y fáciles de evaluar.
2. **Un agente, una tarea.** Cada agente se describe en una frase, tiene entre 2 y 5 herramientas y devuelve una salida estructurada validada con Pydantic. Si necesitas una frase con "y además", son dos agentes.
3. **El modelo es configuración, no código.** Ningún archivo `.py` contiene un ID de modelo. Cada agente lo lee de su `config.yaml`, y cambiar de modelo en OpenRouter no requiere tocar lógica.
4. **Evals desde el primer agente.** Sin un conjunto de casos de prueba no puedes saber si un cambio de modelo o de prompt mejoró o empeoró al agente. Las evals son el mecanismo que hace útil a OpenRouter.
5. **Todo agente tiene límites.** Máximo de pasos, de tokens, de tiempo y de costo por ejecución, con valores por defecto seguros. Un agente sin límites es una factura sin techo.
6. **Complejidad bajo demanda.** Jerarquías, protocolos de interoperabilidad y ejecución durable se agregan cuando un caso de uso concreto falla sin ellos, no antes.

> **Qué hace que algo sea un agente.** Un agente es un bucle: el modelo razona, decide llamar a una herramienta, observa el resultado y repite hasta terminar o agotar su presupuesto. Le suman utilidad real el contexto (sesión, memoria, documentos), las salidas tipadas y los límites. Una llamada única al LLM con un prompt no es un agente, aunque a veces es exactamente lo que necesitas.
