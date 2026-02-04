---
name: web-portal-design
description: Guidelines for designing and architecting Web Portals, Management Apps (SaaS), Admin Dashboards, and Back-office tools. Use this skill when the user asks about UI/UX for admins, dashboard layouts, data handling tables, or B2B application design patterns.
---

# Web Portal & Management App Patterns

This skill defines the standards for creating professional, high-density, manageable web portals and admin interfaces.

## 1. Core Layout Architecture

### The Shell
Management apps need a stable "Shell" that persists across navigation.
- **Sidebar**: Primary navigation. Categories grouped by domain. Collapsible for more screen real estate.
- **Top Bar**: Global context (Search, Notifications, User Profile, Org Switcher).
- **Breadcrumbs**: Critical for deep hierarchies so users know where they are.

### Information Density
- **Portals != Marketing Sites**: Portals are tools. Admin users prioritize **efficiency** and **data density** over whitespace.
- Use smaller font sizes (e.g., 13px/14px for data), tighter padding `py-2`, and standard tabular layouts.

## 2. Typical Components & Patterns

### Data Tables (The Core)
- **Advanced Filters**: Do not rely on simple search. Provide faceted filters (Date Range, Status, Categories).
- **Sticky Headers**: Essential for long lists.
- **Bulk Actions**: Allow selecting rows to Delete, Approve, or Move multiple items.
- **Pagination vs Infinite Scroll**: Prefer proper Pagination for management (easier to find specific records) over infinite scroll.

### Forms & Input
- **Modals vs Drawers (Slide-overs)**:
  - **Modals**: For quick confirmations or short forms.
  - **Drawers**: For complex editing (Side Sheets) where context of the page behind is needed.
  - **New Pages**: For massive creation flows (Wizards).
- **Validation**: Real-time inline validation. Submit buttons disabled or showing error only on attempt to click.

### Status Indicators
Use standard color semantics for status "chips" or "badges":
- **Green/Emerald**: Active, Success, Paid.
- **Gray/Slate**: Draft, Inactive, Archived.
- **Yellow/Amber**: Pending, Warning, Processing.
- **Red/Rose**: Error, Failed, Deleted, Overdue.

## 3. Feedback & Interaction

### Optimistic UI
- Determine "Success" immediately in the UI while the API loads in the background (e.g., Toggling a 'Like' or 'Active' switch). Revert if API fails.

### Toasts / Notifications
- Using **non-blocking** toast notifications for success states (e.g., "User saved successfully") in a corner.
- Use **blocking** alerts/modals only for destructive actions ("Are you sure you want to delete?").

## 4. Scalability & Manageability

### Role-Based Access Control (RBAC) UI
- If a user doesn't have permission, **hide the button**, don't just disable it (unless upgrading is a goal).
- Show "Empty States" with helpful actions ("No Users found. Create your first User"), not just a blank white box.

### Responsive Design for Admins
- While desktop is primary for heavy admins, **Tablets** must be supported.
- On Mobile: Hide complex tables, show "Card View" or simplified list. Hide the Sidebar into a Hamburger menu.

## 5. Visual Consistency (Atomic Design)

- **Typography**: Use standard weights. Bold for headers, Regular for body, Medium for interactive elements.
- **Colors**: Use a rigorous palette. Don't pick random hexes.
- **Shadows**: Use subtle shadows for depth (Cards, Dropdowns) to separate layers on flat backgrounds.
