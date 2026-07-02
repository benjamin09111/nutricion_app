# Plan de implementación — Rediseño visual ficha de paciente
**Stack:** Next.js + Tailwind CSS
**Alcance:** SOLO presentación (JSX/markup/clases Tailwind). Cero cambios en lógica de negocio.

---

## Regla de oro (leer antes de empezar)

> No modificar: handlers (`onChange`, `onSubmit`), validaciones, llamadas a API/backend, nombres de campos/`name`/`id`, estructura del objeto de estado del formulario, ni los cálculos automáticos (IMC, GET, macros).
> Sí modificar: el JSX que envuelve esos campos, las clases de Tailwind, el agrupamiento visual, y la navegación entre secciones (que es puramente de UI).

Si un campo existente usa `<input {...register("peso")} />` o similar, ese binding se mantiene intacto — solo cambia el `className` y el contenedor alrededor.

Antes de tocar código, el agente debe:
1. Localizar el componente/página actual del formulario (probablemente `PatientForm.tsx` o similar).
2. Listar todos los campos existentes y sus handlers/bindings para no perder ninguno al reestructurar.
3. Confirmar que los cálculos automáticos (IMC, GET, clasificación, macros) ya existen como valores derivados (state/hooks) — no se recalculan, solo se re-posicionan visualmente.

---

## Arquitectura de componentes a crear

Crear carpeta `components/patient-form/` con estos componentes nuevos, todos **presentacionales** (reciben props, no tienen lógica de negocio):

| Componente | Responsabilidad |
|---|---|
| `WizardStepper.tsx` | Barra superior con los 5 pasos y su estado (completado/activo/pendiente) |
| `SidebarQuickNav.tsx` | Acceso Rápido Lateral — lista de secciones con estado activo, permite saltar directamente a cualquier sección |
| `FormStepCard.tsx` | Card contenedora blanca para el contenido de cada paso |
| `CalculatedMetricsPanel.tsx` | Bloque con fondo de color distinto para IMC/GET/clasificación (valores calculados, solo lectura) |
| `MacroGrid.tsx` | Grilla de 4 tarjetas para calorías/proteína/carbos/grasas |
| `CollapsibleSection.tsx` | Sección plegable reutilizable (para "Pliegues cutáneos" y cualquier bloque opcional) |
| `FormNavigationFooter.tsx` | Botones "Volver" / "Continuar" |

Estos componentes **envuelven** los campos existentes — no los reemplazan ni reimplementan.

---

## Paso 0 — Tokens de diseño en Tailwind

Antes de construir componentes, agregar/confirmar en `tailwind.config.js` (o usar utilidades existentes si ya hay un design system):

```js
// extend.colors (ajustar a la paleta de marca real si ya existe una)
accent: { 50: '#E6F1FB', 600: '#185FA5', 800: '#0C447C' },
success:{ 50: '#EAF3DE', 600: '#3B6D11', 800: '#27500A' },
neutral:{ border: '#E5E5E0', mutedText: '#888780' }
```

Convenciones a usar en TODOS los componentes nuevos (consistentes con el mockup aprobado):
- Cards: `bg-white border border-neutral-200 rounded-xl p-5`
- Bloque de valores calculados: `bg-accent-50 rounded-lg p-4` con badge `bg-success-50 text-success-800 text-xs rounded px-2 py-0.5`
- Tipografía: labels `text-sm text-gray-600`, valores grandes `text-2xl font-medium`
- Sin sombras decorativas, sin gradientes — bordes finos de 1px
- Radios: `rounded-lg` (8px) para controles, `rounded-xl` (12px) para cards

Crear este criterio como comentario en un archivo `components/patient-form/design-tokens.md` para que el resto del equipo lo reutilice.

---

## Paso 1 — `FormStepCard` y `FormNavigationFooter` (base reutilizable)

Estos dos componentes los usan todos los pasos, así que van primero.

```tsx
// FormStepCard.tsx
export function FormStepCard({ icon, title, description, children }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 max-w-2xl">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h3 className="text-base font-medium">{title}</h3>
      </div>
      {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
      {children}
    </div>
  );
}
```

```tsx
// FormNavigationFooter.tsx
export function FormNavigationFooter({ onBack, onNext, nextDisabled, isFirstStep }) {
  return (
    <div className="flex justify-between mt-4 max-w-2xl">
      {!isFirstStep ? (
        <button onClick={onBack} className="border border-neutral-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-50">
          Volver
        </button>
      ) : <span />}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="bg-gray-900 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-40"
      >
        Continuar
      </button>
    </div>
  );
}
```

`onBack`, `onNext` y `nextDisabled` se conectan a la lógica de validación **ya existente** — el componente no decide cuándo está habilitado, solo recibe el booleano.

---

## Paso 2 — `WizardStepper`

Barra horizontal con los 5 pasos: Identificación, Antropometría, Objetivos, Anamnesis general, Anamnesis nutricional.

Props: `steps: string[]`, `currentStep: number`, `completedSteps: number[]`.

Estados visuales:
- Completado: círculo gris claro con ícono check
- Activo: círculo con borde `border-accent-600`, fondo `bg-accent-50`, texto `text-accent-600`
- Pendiente: círculo con borde gris, texto `text-gray-400`

No controla el avance — solo refleja el `currentStep` que ya maneja el estado del formulario (probablemente ya existe como variable de control de paso, o hay que crearla como estado de UI puro, sin afectar el submit final).

---

## Paso 3 — `SidebarQuickNav` (Acceso Rápido Lateral)

Sidebar fijo a la izquierda, visible en desktop (oculto o colapsable en mobile), que lista **todas** las secciones — no solo los 5 pasos del wizard, sino también subsecciones como "Pliegues cutáneos" — para saltar directo sin recorrer el wizard linealmente. Útil al editar un paciente ya existente.

```tsx
// SidebarQuickNav.tsx
export function SidebarQuickNav({ sections, activeSection, onSelect }) {
  return (
    <nav className="w-56 shrink-0 border-r border-neutral-200 pr-4 hidden lg:block">
      <p className="text-xs font-medium text-gray-500 uppercase mb-2">Acceso rápido</p>
      <ul className="space-y-1">
        {sections.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => onSelect(s.id)}
              className={`w-full text-left text-sm rounded-lg px-3 py-2 transition-colors ${
                activeSection === s.id
                  ? 'bg-accent-50 text-accent-800 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

`onSelect` dispara el mismo cambio de paso/sección que ya use el wizard internamente — no crear una ruta de navegación paralela ni duplicar estado.

Layout de la página pasa a ser dos columnas: `flex gap-8` → `SidebarQuickNav` + contenido del paso actual.

---

## Paso 4 — `CollapsibleSection` (para Pliegues cutáneos y otros opcionales)

Componente genérico reutilizable para cualquier bloque marcado "(opcional)":

```tsx
// CollapsibleSection.tsx
export function CollapsibleSection({ title, optional = true, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-neutral-200 rounded-lg mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
      >
        <span>{title} {optional && <span className="text-gray-400 font-normal">(opcional)</span>}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 border-t border-neutral-200 pt-3">{children}</div>}
    </div>
  );
}
```

---

## Paso 5 — `CalculatedMetricsPanel` y `MacroGrid`

Estos envuelven los valores ya calculados (IMC, GET, clasificación, macros) que hoy probablemente se muestran en texto plano. Solo se mueve el JSX, no el cálculo.

```tsx
// CalculatedMetricsPanel.tsx — recibe los valores ya calculados como props
<div className="bg-accent-50 rounded-lg p-4">
  <p className="text-xs text-accent-700 font-medium mb-2 flex items-center gap-1">
    <CalculatorIcon className="w-3.5 h-3.5" /> Calculado automáticamente
  </p>
  <div className="grid grid-cols-2 gap-3">
    <MetricCard label="IMC" value={imc} badge={clasificacionIMC} badgeTone="success" />
    <MetricCard label="GET" value={`${get} kcal/día`} note={clasificacionGET} />
  </div>
  <p className="text-xs text-gray-500 mt-2">Rango saludable: {pesoMin}–{pesoMax} kg · IMC 18.5-25</p>
</div>
```

`MacroGrid` recibe el array `[{label, value, unit}]` ya calculado y lo renderiza en 4 tarjetas (`grid grid-cols-4 gap-2`), igual que en el mockup.

---

## Paso 6 — Ensamblar Paso 2 del wizard: Antropometría (el más denso)

Orden visual dentro de `FormStepCard`:
1. Inputs de Peso y Altura (existentes, sin tocar)
2. `CalculatedMetricsPanel` (IMC, GET)
3. `MacroGrid` (objetivos diarios)
4. `CollapsibleSection title="Pliegues cutáneos"` con los campos existentes de pliegues cutáneos adentro, cerrado por defecto (`defaultOpen={false}`)

```tsx
<FormStepCard icon={<RulerIcon />} title="Antropometría" description="Estos valores alimentan los cálculos automáticos.">
  <div className="grid grid-cols-2 gap-3 mb-5">
    {/* inputs existentes de peso/altura, sin modificar bindings */}
  </div>
  <CalculatedMetricsPanel {...metricsProps} />
  <MacroGrid macros={macrosCalculados} />
  <CollapsibleSection title="Pliegues cutáneos">
    {/* campos existentes de pliegues cutáneos, sin modificar */}
  </CollapsibleSection>
</FormStepCard>
```

---

## Paso 7 — Ensamblar los pasos restantes

Repetir el mismo patrón (`FormStepCard` + campos existentes reordenados, sin lógica nueva) para:

- **Paso 1 — Identificación:** nombre, email, fecha nacimiento (+ edad calculada como texto auxiliar `text-sm text-gray-500`, no editable), teléfono, RUT, sexo
- **Paso 3 — Objetivos y restricciones:** foco nutricional, metas fitness, nivel de actividad (como segmented control en vez de radio buttons simples), restricciones
- **Paso 4 — Anamnesis general:** ocupación, horario laboral, fármacos, drogas/suplementos, patologías → considerar `CollapsibleSection` para "drogas/suplementos" si se quiere bajar la densidad visual
- **Paso 5 — Anamnesis nutricional:** frecuencia de consumo por grupo de alimentos, recordatorio de 24h

---

## Paso 8 — Página contenedora (layout final)

```tsx
// PatientFormPage.tsx
<div className="flex gap-8 max-w-6xl mx-auto py-6">
  <SidebarQuickNav sections={allSections} activeSection={currentStep} onSelect={goToStep} />
  <div className="flex-1">
    <WizardStepper steps={stepLabels} currentStep={currentStep} completedSteps={completed} />
    {renderCurrentStepCard()}
    <FormNavigationFooter onBack={goBack} onNext={goNext} nextDisabled={!isStepValid} isFirstStep={currentStep === 0} />
  </div>
</div>
```

`goToStep`, `goBack`, `goNext`, `isStepValid` deben ser los mismos que ya controlan el formulario — si no existen como estado de paso, crearlos como estado de UI puro (`useState`) sin tocar el estado del formulario en sí.

---

## Paso 9 — Responsive

- Mobile (`<lg`): ocultar `SidebarQuickNav` (o convertir en menú desplegable con botón "Secciones"), `WizardStepper` muestra solo el paso activo + contador ("Paso 2 de 5") en vez de los 5 círculos.
- `MacroGrid` pasa de 4 a 2 columnas en mobile (`grid-cols-2 sm:grid-cols-4`).

---

## Paso 10 — QA antes de dar por terminado

Checklist que el agente debe verificar al final:
- [ ] Todos los campos del formulario original siguen presentes, con el mismo `name`/`id`/binding
- [ ] El submit final envía exactamente el mismo payload que antes del rediseño
- [ ] Los cálculos (IMC, GET, macros, clasificación) muestran los mismos valores que antes, solo en otra posición visual
- [ ] Pliegues cutáneos sigue siendo opcional y no bloquea el avance del wizard si va vacío
- [ ] El botón "Volver" no pierde los datos ya ingresados en pasos anteriores
- [ ] El Acceso Rápido Lateral permite saltar a cualquier sección sin perder datos de las demás
- [ ] Sin gradientes/sombras decorativas, bordes de 1px, paleta consistente con el resto de la app
- [ ] Probado en mobile y desktop

---

## Resumen del orden de ejecución

1. Tokens Tailwind
2. `FormStepCard` + `FormNavigationFooter`
3. `WizardStepper`
4. `SidebarQuickNav`
5. `CollapsibleSection`
6. `CalculatedMetricsPanel` + `MacroGrid`
7. Ensamblar Paso 2 (Antropometría + Pliegues cutáneos)
8. Ensamblar Pasos 1, 3, 4, 5
9. Página contenedora con layout de dos columnas
10. Responsive
11. QA checklist
