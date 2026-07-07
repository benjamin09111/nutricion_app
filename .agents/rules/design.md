# Reglas de Diseno Visual

## Responsive Design
- **TODO componente nuevo debe ser responsive (mobile-first)**
- Usar breakpoints Tailwind: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)
- Disenar primero para mobile, luego expandir con breakpoints
- Evitar anchos fijos. Preferir `max-w-*`, `w-full`, grids flexibles

## Tema y Colores
- **Solo Light Mode**. No implementar dark mode a menos que se pida explicitamente
- **Paleta principal**:
  - Indigo: acciones primarias, links, enfasis
  - Green/Emerald: exito, confirmacion, acciones positivas
  - Ivory/Slate-50: fondos principales
  - Slate-900: texto principal
  - Slate-500: texto secundario, descripciones
  - Slate-100/200: bordes y separadores

## Interactividad
- Todo elemento clickeable debe tener `cursor-pointer`
- Botones: hover state visible (ej: `hover:bg-indigo-600`)
- Tarjetas: hover con sombra o borde (ej: `hover:shadow-md hover:border-emerald-200`)
- Transiciones: `transition-all duration-300` en elementos interactivos
- Estados disabled: `opacity-50 cursor-not-allowed`

## Componentes UI

### Modales
- Usar **siempre** `<ConfirmationModal>` del proyecto
- No usar modales nativos (alert, confirm, prompt)
- No cerrar con backdrop click ni ESC

### Estructura Semantica
- `<main>` para contenido principal
- `<section>` para secciones dentro de una pagina
- `<nav>` para navegacion
- `<header>`, `<footer>` donde corresponda
- Evitar `<div>` soup — cada div deberia tener un proposito

### Iconos
- Exclusivamente `lucide-react`
- Tamano consistente: `h-4 w-4` para inline, `h-5 w-5` para botones, `h-6 w-6` para titulos

### Tipografia
- Font: system default (Tailwind)
- Headings: `tracking-tight`
- Texto principal: `text-slate-900`
- Texto secundario: `text-slate-500`
- Codigo/valores: `font-mono`

## Patrones Visuales del Proyecto

### Layout del Dashboard
- Sidebar fijo a la izquierda
- Contenido con padding: `p-6` o `px-4 py-6`
- Maximo ancho de contenido: `max-w-6xl` o `max-w-7xl` con `mx-auto`

### Tarjetas (Cards)
- Borde: `border-slate-200`
- Sombra: `shadow-sm` por defecto, `shadow-md` en hover
- Padding: `p-6`
- Bordes redondeados: `rounded-xl` o `rounded-2xl`

### Badges y Etiquetas
- Badge de estado: colores suaves (ej: `bg-emerald-50 text-emerald-700`)
- Badge "Proximamente": `border-emerald-200 text-emerald-700 bg-emerald-50`

### Botones
- Primario: `bg-indigo-600 hover:bg-indigo-700 text-white`
- Secundario: `border-slate-200 hover:bg-slate-50 text-slate-700`
- Peligro: `bg-red-600 hover:bg-red-700 text-white`
- Tamano: `px-4 py-2` default, `px-3 py-1.5` small

## Lo que NO hacer
- No usar colores fuera de la paleta definida
- No crear componentes sin responsive
- No usar modales nativos del navegador
- No usar iconos que no sean de lucide-react
- No hardcodear breakpoints magicos — usar los de Tailwind
