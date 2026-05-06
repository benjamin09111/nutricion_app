# NutriNet — Manual de Fórmulas Nutricionales

> Documentación clínica de referencia. Todas las fórmulas implementadas en `frontend/src/lib/nutrition-formulas.ts` siguen estándares internacionales validados (OMS, FAO, Mifflin-St Jeor, Harris-Benedict).

---

## 1. IMC — Índice de Masa Corporal

**Fórmula:**  
`IMC = Peso (kg) / [Talla (m)]²`

**Ejemplo:** Paciente de 70 kg, 1.65 m → `70 / (1.65 × 1.65) = 25.7 kg/m²`

### Clasificación OMS (adultos)

| IMC (kg/m²) | Clasificación | Color |
|-------------|---------------|-------|
| < 18.5 | Bajo peso | Azul |
| 18.5 – 24.9 | Normal | Verde |
| 25.0 – 29.9 | Sobrepeso | Amarillo |
| 30.0 – 34.9 | Obesidad I | Naranja |
| 35.0 – 39.9 | Obesidad II | Rojo |
| ≥ 40.0 | Obesidad III | Rojo oscuro |

**Peso ideal teórico:** Calculado para IMC = 22 (punto medio del rango normal).  
`Peso ideal = 22 × [Talla (m)]²`

### Nota pediátrica
Para pacientes < 18 años, no se usa IMC de adulto. Se deben usar las curvas de crecimiento OMS 2006/2007 con percentiles y Z-scores. La app detecta automáticamente si el paciente es pediátrico y lo indica.

---

## 2. TMB — Tasa Metabólica Basal

Energía que el cuerpo gasta en reposo absoluto para mantener funciones vitales.

### Fórmulas disponibles

#### Mifflin-St Jeor (1990) — **Recomendada por defecto**
Gold standard actual. Más precisa en adultos.

| Sexo | Ecuación |
|------|----------|
| Masculino | `TMB = (10 × kg) + (6.25 × cm) − (5 × edad) + 5` |
| Femenino | `TMB = (10 × kg) + (6.25 × cm) − (5 × edad) − 161` |

#### Harris-Benedict (1919)
Clásica. Puede sobreestimar en obesidad.

| Sexo | Ecuación |
|------|----------|
| Masculino | `TMB = 66.5 + (13.75 × kg) + (5.003 × cm) − (6.775 × edad)` |
| Femenino | `TMB = 655.1 + (9.563 × kg) + (1.850 × cm) − (4.676 × edad)` |

#### OMS/FAO (2004)
Estándar internacional con rangos por edad.

| Sexo | Edad | Ecuación |
|------|------|----------|
| Masculino | 18–30 | `TMB = (15.3 × kg) + 679` |
| Masculino | 30–60 | `TMB = (11.6 × kg) + 879` |
| Masculino | > 60 | `TMB = (13.5 × kg) + 487` |
| Femenino | 18–30 | `TMB = (14.7 × kg) + 496` |
| Femenino | 30–60 | `TMB = (8.7 × kg) + 829` |
| Femenino | > 60 | `TMB = (10.5 × kg) + 596` |

---

## 3. GET — Gasto Energético Total

**Fórmula:**  
`GET = TMB × Factor de Actividad`

### Factores de actividad (FAO/OMS)

| Nivel | Factor | Ejemplo |
|-------|--------|---------|
| Sedentario | × 1.2 | Trabajo de oficina, sin ejercicio |
| Ligero | × 1.375 | Ejercicio 1–3 días/semana |
| Moderado | × 1.55 | Ejercicio 3–5 días/semana |
| Activo | × 1.725 | Ejercicio 6–7 días/semana |
| Muy activo | × 1.9 | Atleta o trabajo físico pesado |

### Ajustes fisiológicos

| Condición | Ajuste |
|-----------|--------|
| Embarazo 2º trimestre | GET + 340 kcal/día |
| Embarazo 3º trimestre | GET + 450 kcal/día |
| Lactancia exclusiva | GET + 500 kcal/día |
| Lactancia parcial | GET + 300 kcal/día |
| Ganancia de peso (0.5 kg/sem) | GET + 500 kcal/día |
| Pérdida de peso (0.5 kg/sem) | GET − 500 kcal/día |
| Adulto mayor (> 65) | GET × 0.9 |
| Paciente crítico | GET × 1.2 a 1.5 |

---

## 4. Distribución de Macronutrientes

Una vez calculado el GET, los macronutrientes se distribuyen según porcentajes ajustables:

| Macronutriente | % del GET | kcal/g | Fórmula |
|----------------|-----------|--------|---------|
| Carbohidratos | 45–65% (default 55%) | 4 | `g CHO = (GET × %) / 4` |
| Proteínas | 10–35% (default 20%) | 4 | `g Prot = (GET × %) / 4` |
| Grasas | 20–35% (default 25%) | 9 | `g Grasas = (GET × %) / 9` |

### Recomendación de proteínas por peso corporal

| Nivel | g/kg/día |
|-------|----------|
| Sedentario | 0.8 – 1.0 |
| Deportista recreativo | 1.2 – 1.6 |
| Deportista de élite | 1.6 – 2.2 |
| Paciente crítico | 1.2 – 2.0 |
| Adulto mayor | 1.0 – 1.2 |

---

## 5. Porciones de Intercambio (Sistema Chileno)

Basado en el sistema de equivalentes estándar. 1 porción de cada categoría aporta:

| Categoría | Cantidad | CHO | Prot | Grasas | kcal |
|-----------|----------|-----|------|--------|------|
| Cereales y Tubérculos | ½ taza cocida | 15g | 2g | 0g | 70 |
| Legumbres | ½ taza cocida | 15g | 7g | 0g | 90 |
| Verduras Grupo A (libre) | 1 taza cruda | 5g | 2g | 0g | 25 |
| Verduras Grupo B | ½ taza cocida | 10g | 2g | 0g | 50 |
| Frutas | 1 unidad mediana | 15g | 0g | 0g | 60 |
| Lácteos descremados | 1 taza (200ml) | 12g | 8g | 0g | 80 |
| Lácteos enteros | 1 taza (200ml) | 12g | 8g | 8g | 150 |
| Carnes magras | 90g cocido | 0g | 21g | 3g | 110 |
| Carnes semigrasas | 90g cocido | 0g | 21g | 8g | 155 |
| Grasas saludables | 1 cda aceite | 0g | 0g | 5g | 45 |
| Azúcares y extras | 1 cda azúcar | 15g | 0g | 0g | 60 |

### Cálculo de porciones desde el GET

```
GET = 2000 kcal
CHO 55% = 1100 kcal → 275g CHO
Prot 20% = 400 kcal → 100g Prot
Grasas 25% = 500 kcal → 56g Grasas

→ Sugerencia: 8 cereales + 3 frutas + 2 verduras B + 3 carnes magras + 2 lácteos + 5 grasas
```

---

## 6. R24H — Recordatorio de 24 Horas

Método para evaluar la ingesta real del paciente en las últimas 24 horas.

### Procedimiento
1. El nutri selecciona alimentos del catálogo que el paciente consumió
2. Para cada alimento, indica la cantidad (g, ml, taza, cda, unidad)
3. El sistema calcula automáticamente:
   - Macros totales consumidos (CHO, Prot, Grasas)
   - Calorías totales
   - % de adecuación vs GET: `(consumido / GET) × 100`

### Interpretación
- Adecuación 90–110%: ingesta adecuada
- Adecuación < 75%: déficit significativo
- Adecuación > 125%: exceso

---

## 7. Fórmulas Pediátricas — OMS 2006/2007

Para pacientes pediátricos (< 18 años), se usan las curvas de crecimiento de la OMS:

### Indicadores
- **Peso/Edad** (0–10 años): indicador de desnutrición aguda
- **Talla/Edad** (0–10 años): indicador de desnutrición crónica
- **IMC/Edad** (5–19 años): indicador de estado nutricional

### Clasificación por percentiles

| Percentil | Z-score | Clasificación |
|-----------|---------|---------------|
| < p3 | Z < −2 | Bajo peso / Desnutrición |
| p3 – p15 | Z −2 a −1 | Riesgo de bajo peso |
| p15 – p85 | Z −1 a +1 | Normal / Eutrófico |
| p85 – p97 | Z +1 a +2 | Sobrepeso |
| > p97 | Z > +2 | Obesidad |

---

## 8. Referencias

- Mifflin MD, St Jeor ST, et al. *A new predictive equation for resting energy expenditure in healthy individuals.* Am J Clin Nutr. 1990;51(2):241-247.
- Harris JA, Benedict FG. *A Biometric Study of Human Basal Metabolism.* Proc Natl Acad Sci USA. 1918;4(12):370-373.
- FAO/WHO/UNU. *Human energy requirements.* Report of a Joint FAO/WHO/UNU Expert Consultation. Rome, 2004.
- WHO. *Growth reference data for 5-19 years.* 2007.
- WHO. *Child growth standards.* 2006.
- INTA, Universidad de Chile. *Tabla de Composición de Alimentos.* 2018.

---

*Este documento es parte de NutriNet v1. Las fórmulas se implementan en `frontend/src/lib/nutrition-formulas.ts`. Para verificar un cálculo, abra la calculadora en Dashboard → Herramientas → Cálculos.*
