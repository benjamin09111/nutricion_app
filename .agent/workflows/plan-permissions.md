---
description: Protocolo de Gestión de Permisos por Funcionalidad (SaaS Scalability)
---

# Protocolo de Gestión de Permisos por Plan (FBAC)

Para asegurar que la aplicación sea escalable y profesional, **NUNCA** uses validaciones de tipo `if (user.role === 'ADMIN')` o `if (user.plan === 'PRO')` dispersas por el código. En su lugar, usa el sistema de **Feature-Based Access Control (FBAC)**.

## 1. Definición de Funcionalidades (Source of Truth)
Las funcionalidades se definen en el campo `features` (JSON) de la tabla `MembershipPlan`. 
Ejemplo de estructura JSON en la DB:
```json
{
  "ai_diet_generation": true,
  "max_patients": 50,
  "advanced_analytics": false,
  "custom_branding": true
}
```

## 2. Verificación en el Backend (NestJS)
Usa el `PermissionsService` para validar el acceso.

### Uso en Servicios:
```typescript
constructor(private permissions: PermissionsService) {}

async generateDiet(accountId: string) {
  // ESCALABLE: Verificamos si la funcionalidad está activa para su plan
  await this.permissions.ensureAccess(accountId, 'ai_diet_generation');
  
  // Lógica del servicio...
}
```

### Límites Numéricos:
```typescript
const limit = await this.permissions.getFeatureLimit(accountId, 'max_patients');
const currentCount = await this.getCurrentPatientCount(accountId);

if (currentCount >= limit) {
  throw new ForbiddenException('Has alcanzado el límite de pacientes de tu plan.');
}
```

## 3. Verificación en el Frontend (React/Next.js)
Implementaremos un hook `usePermissions` o similar que consuma el perfil del usuario (el cual debe incluir sus features habilitadas).

### Patrón Recomendado:
```tsx
const { hasFeature } = usePermissions();

return (
  <div>
    {hasFeature('advanced_analytics') ? (
      <Charts />
    ) : (
      <UpsellCard feature="Analíticas Avanzadas" />
    )}
  </div>
);
```

## 4. Reglas de Oro
1.  **Admisión de Admins**: El `PermissionsService` siempre devuelve `true` para los roles `ADMIN_MASTER` y `ADMIN_GENERAL` por defecto. No necesitas programarlo manualmente cada vez.
2.  **Modificación de Planes**: Si quieres dar una nueva función a un plan, **solo cambia el JSON en la base de datos**. No toques el código.
3.  **Nuevas Funciones**: Para añadir una función nueva (ej. "soporte_whatsapp"):
    -   Añádela al JSON de los planes en la DB.
    -   Usa `permissions.ensureAccess(id, 'soporte_whatsapp')` donde sea necesario.

---
*Este flujo asegura que podamos tener 100 planes distintos con mezclas de funciones sin que el código se vuelva un espagueti de IFs.*
