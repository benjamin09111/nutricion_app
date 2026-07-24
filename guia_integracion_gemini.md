# Guía de Integración Oficial: Gemini API para Generación de Dietas Estructuradas

Esta guía técnica está diseñada para que tu agente de software o desarrollador implemente la integración con la API de Gemini utilizando la versión más reciente del SDK oficial (`google-genai`), siguiendo las directrices de la documentación de Google para obtener respuestas estrictamente formateadas en JSON (Structured Outputs).

---

## 1. Requisitos e Instalación

Instala el SDK oficial de Google GenAI y la librería para manejo de variables de entorno:

```bash
pip install google-genai pydantic
```

---

## 2. Configuración de la Clave API

El SDK detecta automáticamente la variable de entorno `GEMINI_API_KEY`. Configúrala en tu entorno de desarrollo o archivo `.env`:

```bash
export GEMINI_API_KEY="tu_clave_api_aquí"
```

---

## 3. Definición del Esquema de Salida (Pydantic)

Para garantizar la máxima eficiencia, bajo costo y evitar que el modelo invente ingredientes prohibidos, se utiliza **Structured Outputs**. Definimos la estructura exacta que la aplicación necesita recibir utilizando `Pydantic`:

```python
from pydantic import BaseModel, Field
from typing import List

class Ingrediente(BaseModel):
    nombre: str = Field(description="Nombre del ingrediente permitido")
    cantidad: str = Field(description="Cantidad exacta con su unidad de medida (ej. 150g, 2 unidades)")

class Receta(BaseModel):
    nombre_plato: str = Field(description="Nombre de la receta")
    ingredientes: List[Ingrediente] = Field(description="Lista detallada de ingredientes obligatorios")
    instrucciones: List[str] = Field(description="Pasos cronológicos para la preparación")

class MenuDia(BaseModel):
    desayuno: Receta
    almuerzo: Receta
    cena: Receta
    calorias_totales_estimadas: int = Field(description="Suma aproximada de calorías del día")
```

---

## 4. Implementación del Código de Llamada

Este script implementa la llamada utilizando el modelo ultra-económico `gemini-2.5-flash`, pasando las reglas fijas en las instrucciones del sistema (`system_instruction`) y forzando el formato JSON mediante el esquema definido:

```python
import os
from google import genai
from google.genai import types

def generar_dieta_paciente():
    # Inicializa el cliente oficial (detecta automáticamente GEMINI_API_KEY)
    client = genai.Client()

    # INSTRUCCIONES DEL SISTEMA: Fijan el rol y garantizan seguridad
    system_instruction = (
        "Eres un software automatizado de nutrición clínica. Tu única tarea es generar "
        "menús diarios estructurados basándote ESTRICTAMENTE en el perfil del paciente "
        "y la lista de alimentos permitidos provista. Está terminantemente prohibido "
        "utilizar ingredientes o alimentos que no estén explícitamente autorizados "
        "en la lista del usuario."
    )

    # DATOS DINÁMICOS DEL USUARIO (Se envían en el prompt)
    prompt_usuario = """
    CONTEXTO DEL PACIENTE:
    - Diagnóstico: Diabético Tipo 2, Hipertenso.
    - Objetivo calórico: 1800 kcal diarias.

    ALIMENTOS PERMITIDOS (RESTRICCIÓN ESTRICTA):
    - Proteínas: Pollo, pavo, claras de huevo, merluza.
    - Carbohidratos: Quinoa, avena integral, arroz integral.
    - Grasas saludables: Aceite de oliva, aguacate (palta).
    - Verduras: Espinacas, brócoli, pepino, calabacín.

    Genera el menú completo para 1 día utilizando únicamente los elementos anteriores.
    """

    try:
        # Ejecución de la llamada según SDK 2026
        response = client.models.generate_content(
            model='gemini-2.5-flash',  # Modelo óptimo en costos y velocidad
            contents=prompt_usuario,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=MenuDia,  # Fuerza el cumplimiento del esquema Pydantic
                temperature=0.1,          # Temperatura baja para evitar alucinaciones
            ),
        )

        # La respuesta obtenida ya es un string JSON perfectamente estructurado
        print("Respuesta estructurada recibida con éxito:")
        print(response.text)
        return response.text

    except Exception as e:
        print(f"Error al conectar con Gemini API: {e}")
        return None

if __name__ == "__main__":
    generar_dieta_paciente()
```

---

## 5. Directrices Clave para el Agente Lector

1. **Cumplimiento de Esquema Nativo:** Al pasar `response_schema=MenuDia`, Gemini API no deforma el JSON ni añade texto conversacional innecesario como "Aquí tienes tu receta:". La salida será directamente un objeto JSON parseable.
2. **Eficiencia en Costos:** Al poner las restricciones pesadas dentro de `system_instruction`, la infraestructura de Google optimiza la caché de contexto, disminuyendo la latencia en llamadas repetitivas.
3. **Manejo de Errores:** Asegurar siempre el bloque `try/except` para prever posibles caídas de red o límites de cuota alcanzados en la capa *Free Tier*.