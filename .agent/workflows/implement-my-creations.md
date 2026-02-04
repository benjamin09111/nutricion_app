---
description: Implement the My Creations Module (Dashboard of generated artifacts).
---

# Implement My Creations Module

1.  **Backend: Artifact Repository**
    - [ ] Ensure all generated deliverables (PDFs or finalized JSONs) are stored with metadata (PatientId, Date, Type).
    - [ ] Endpoint `GET /creations`: List all with filters.

2.  **Frontend: Creations Dashboard**
    - [ ] `/dashboard/creaciones` (formerly Entregable/Calendario).
    - [ ] Grid View of recent plans.
    - [ ] **Actions**:
        - Preview.
        - Redownload.
        - Share (Re-send email/whatsapp).
        - "Clone" (Start new draft based on this one).

3.  **Import System**
    - [ ] "Import External": Button to upload a PDF or JSON to bypass previous steps? (As requested: "subir un PDF propio").
    - [ ] Logic to parse/store external files in the same list.
