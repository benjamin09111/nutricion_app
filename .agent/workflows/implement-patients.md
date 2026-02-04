---
description: Implement the Patients Module (Pacientes) with History and Management.
---

# Implement Patients Module

1.  **Backend: Create Patient Entity**
    - [ ] Update `schema.prisma` to include `Patient` model:
        - `id`, `name`, `email`, `birthDate`, `gender`, `contactInfo`.
        - Relations: `nutritionist` (User), `diets` (Diet[]), `history` (Log[]).
    - [ ] Create `PatientsModule` in backend.

2.  **Backend: Patient Logic**
    - [ ] Implement CRUD for Patients.
    - [ ] Implement `History` tracking: Every time a Diet/Resource is sent, log it.

3.  **Frontend: Patient List**
    - [ ] Create `/dashboard/pacientes` page.
    - [ ] List of patients with search/filter.
    - [ ] "Add Patient" modal.

4.  **Frontend: Patient Detail**
    - [ ] Create `/dashboard/pacientes/[id]` page.
    - [ ] **Overview Tab**: Personal info, stats.
    - [ ] **History Tab**: Timeline of interactions (Diet created, Shopping list sent, etc.).
    - [ ] **Notes Tab**: Private notes for the nutritionist.
