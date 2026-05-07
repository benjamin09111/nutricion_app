# Skill: Database & Persistence Standards

NutriNet uses Prisma with PostgreSQL, following a service-oriented pattern for data access.

## 1. Service-as-Repository Pattern
- **Logic Layer**: All database interactions must happen within **NestJS Services** (`backend/src/modules/<domain>/<name>.service.ts`).
- **Isolation**: **Controllers** must never call `this.prisma.model.find()` directly. They must rely on service methods.
- **Dependency Injection**: Always inject the `PrismaService` into the constructor.

## 2. Prisma Best Practices
- **Fluent Queries**: Use Prisma's strongly typed API. Avoid raw SQL unless strictly necessary for complex analytical queries.
- **Include & Select**: Be explicit with `.select()` or `.include()` to avoid "Over-fetching" large JSONB fields or deep relations when they are not needed.
- **Transactions**: Use `this.prisma.$transaction([...])` for atomic operations involving multiple tables to prevent data inconsistency.

## 3. Handling Hybrid Data (Relational + JSONB)
- **JSONB Querying**: When querying JSONB fields (like `Creation.content`), use Prisma's JSON operators carefully.
- **Validation**: Validate the structure of JSON data before saving using DTOs and `class-validator` in the service layer.

## 4. Performance & Safety
- **No N+1**: Use efficient inclusions or separate batch queries when dealing with large lists.
- **Soft Deletes**: Where applicable, use status flags instead of hard deleting records to preserve historical clinical data.
- **Security**: Always filter queries by the authenticated `nutritionistId` to ensure data isolation.

## 5. Implementation Example (Service)
```typescript
@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string, nutritionistId: string) {
    return this.prisma.patient.findFirstOrThrow({
      where: { id, nutritionistId },
      include: { consultations: true }
    });
  }
}
```

---
*Last updated: 2024-05-07*
