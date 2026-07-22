---
name: form-validation
description: Playbook para validaciones en frontend con react-hook-form + zod y DTOs en backend con class-validator.
---
# Form and DTO Validation Playbook

Use this playbook whenever you are creating or modifying forms on the React/Next.js frontend or DTOs on the NestJS backend.

## Frontend: React Hook Form + Zod
We use Zod schemas to define validation rules, and `@hookform/resolvers/zod` to bind them to `react-hook-form`.

### Example
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const patientSchema = z.object({
  fullName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Formato de correo inválido"),
  age: z.number().min(0, "La edad no puede ser negativa").optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

export function PatientForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
  });
  
  // Render form...
}
```

## Backend: NestJS DTO + Class Validator
We use `class-validator` and `class-transformer` on input DTOs to enforce type safety and constraints at the API boundaries.

### Example
```typescript
import { IsString, IsEmail, IsNumber, IsOptional, Min, MinLength } from "class-validator";

export class CreatePatientDto {
  @IsString()
  @MinLength(3, { message: "El nombre debe tener al menos 3 caracteres" })
  fullName: string;

  @IsEmail({}, { message: "Formato de correo inválido" })
  email: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  age?: number;
}
```
