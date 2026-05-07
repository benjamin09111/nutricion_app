# NutriNet Safety Rules (Compressed)

## Forbidden (Unless explicit)
- Large refactors.
- Renaming core DB/File structures.
- Changing Public/Internal API contracts.

## Anti-Hacker Checklist
- **Validation**: Strict server-side DTOs/Zod. Validate all formats (RUT, Email).
- **Leakage**: No internal IDs or PII in public API responses. Use DTO filtering.
- **IDOR**: Mandatory ownership check for every resource access.
- **Authority**: Business logic/calculations in Backend ONLY.

## Production Data Safety
- **Non-Destructive Seeds**: NEVER perform seeds that wipe data. Use `upsert` or "create if not exists". Protect beta user data.
- **Wipe Prevention**: Forbidden to use `deleteMany()`, `drop`, or `truncate` on core clinical tables (Patients, Consultations, Creations).

## Healthcare Data Integrity
- **Mandatory Encryption**: Minimum standard is encryption at rest (DB) and transit (TLS).
- **PII Protection**: Strict handling of patient/nutritionist data. No logging of PII.
- **Audit Trails**: Maintain integrity of who accessed/modified health records.

