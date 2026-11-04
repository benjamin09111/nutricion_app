1. Identidad visual de NutriNet

Primary Purple
#8B5CF6

Deep Indigo
#6D28D9

Pear Green
#94B83D

Green Hover
#789B28

Lavender Soft
#F3EDFF

Warm Ivory
#FFFEF8

Dark Navy
#18213B

Muted Text
#77819A

Border
#E8EAF1

Regla de uso: el púrpura representa navegación, IA, automatización e interacción; el verde pera representa acciones clínicas positivas, progreso y confirmaciones. El verde no debe utilizarse para todos los botones ni el púrpura para todos los contenedores.

Distribución visual aproximada: 80% superficies neutras, 15% púrpura/lavanda y 5% verde. 2. Tipografía
Recomiendo Inter, disponible en Google Fonts. Es moderna, extremadamente legible y adecuada para dashboards con tablas y muchos datos.
Inter · Bold 700 · 28px
Dashboard

Inter · Semibold 600 · 18px
Pacientes recientes

Inter · Regular 400 · 14px

Revisa los controles clínicos y las pautas nutricionales de tus pacientes.

Inter · Bold 700 · 32px
86%
Adherencia promedio
Elemento Tamaño Peso Line-height
Título de página 24 px 700 32 px
Título del hero 28 px 700 36 px
Título de tarjeta 16 px 600 24 px
KPI principal 32 px 700 38 px
Texto normal 14 px 400 22 px
Navegación 13 px 500 20 px
Etiquetas y metadatos 12 px 500 18 px
Badges 11–12 px 600 16 px

Usa font-variant-numeric: tabular-nums en estadísticas, precios, cronómetros y porcentajes. 3. Espaciado y estructura
La diferencia entre un dashboard que parece generado automáticamente y uno diseñado profesionalmente suele estar en la consistencia de su sistema de espaciado.
Escala base de 4 píxeles
4px

8px

12px

16px

24px

32px

Elemento Medida
Sidebar 248 px
Header 64 px de alto
Padding del contenido 24–32 px
Gap entre secciones 20–24 px
Gap entre tarjetas 16 px
Padding interno de cards 20–24 px
Hero 220–240 px de alto
Tarjetas KPI 112–128 px de alto
Altura de botones 40–44 px
Filas de tablas 56–64 px
Inputs 40 px de alto

El contenido central debería tener un max-width de aproximadamente 1600 px, adaptándose al espacio disponible. 4. Bordes, sombras y superficies
Componente Radio Sombra
Tarjetas principales 16 px Muy sutil
Hero 20 px Muy sutil
Botones 10 px Ninguna o mínima
Inputs 10 px Ninguna
Badges 999 px Ninguna
Dropdowns 12 px Media

.card {
background: #FFFFFF;
border: 1px solid #E8EAF1;
border-radius: 16px;
box-shadow: 0 2px 8px rgba(24, 33, 59, 0.035);
}

.card:hover {
border-color: #D8CCF5;
transition: border-color 180ms ease;
}

.hero {
background: linear-gradient(
110deg,
#FCFAFF 0%,
#F4EDFF 58%,
#E5D5FF 100%
);
border: 1px solid #E8DDFB;
border-radius: 20px;
}

Evita sombras fuertes, efecto glassmorphism excesivo, gradientes en todas las tarjetas y demasiados elementos flotantes. Son detalles que suelen restar credibilidad a un software clínico. 5. Componentes y estados
Botones
Crear pauta

Ver pacientes

Ver detalles

Estados de seguimiento
Activo

Pendiente

Urgente

IA asistida

Para los íconos, recomiendo lucide-react, con tamaño de 18–20 px y grosor de línea 1.75. Mantén el mismo estilo en toda la plataforma.
