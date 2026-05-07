# Skill: Professional Form Handling

NutriNet uses a robust form system to ensure data integrity and a premium user experience.

## 1. Core Technologies
- **Library**: `react-hook-form` (RHF).
- **Validation**: `zod` for schema definition.
- **Resolver**: `@hookform/resolvers/zod`.

## 2. Organization
- **Schemas**: Store all validation schemas in `frontend/src/lib/schemas/`.
- **No Duplication**: Reuse schemas between different forms (e.g., Patient Creation and Patient Edit).
- **RUT Validation**: Chile-specific RUT validation must use the utilities in `frontend/src/lib/rut-utils.ts`.

## 3. UX Standards
- **Loading States**: Always disable submit buttons and show a loading indicator during `isSubmitting`.
- **Feedback**: Use `sonner` to show clear "Success" or "Error" messages upon submission.
- **Accessibility**: Ensure all inputs have associated `<label>` elements and follow semantic HTML.

## 4. Implementation Example
```tsx
const form = useForm<z.infer<typeof patientSchema>>({
  resolver: zodResolver(patientSchema),
  defaultValues: { ... }
});

const onSubmit = async (data: z.infer<typeof patientSchema>) => {
  try {
    await api.patients.create(data);
    toast.success("Paciente creado con éxito");
  } catch (error) {
    toast.error("Error al crear el paciente");
  }
};
```

---
*Last updated: 2024-05-07*
