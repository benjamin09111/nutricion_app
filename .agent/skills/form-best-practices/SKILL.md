---
name: form-best-practices
description: Guide for creating robust, secure, and user-friendly forms. Covers validation, UX patterns, input constraints, and accessibility. Use this skill when building forms in React/Next.js.
---

# Form Best Practices

This skill outlines the standards for creating high-quality data entry interfaces.

## 1. Validation Strategy

### Schema-Based Validation
- **Tool**: Use **Zod** (recommended) or Yup.
- **Integration**: Use `react-hook-form` with `@hookform/resolvers/zod`.
- **Why**: Centralizes validation logic, type-safe, separate from UI.

### Validation Layers
1. **Browser Native**: Use `type="email"`, `type="number"`, `required` for basic, instant feedback.
2. **Client-Side Script**: Real-time complex validation (password strength, matching fields) via Zod.
3. **Server-Side**: The FINAL source of truth. Never trust client validation alone.

## 2. Input UX & Constraints

### Type Integrity
- **Numbers**: Use `type="number"` or properly masked inputs. Prevent non-numeric chars via `onKeyDown`.
- **Dates**: Use standard Date Pickers, not free text.
- **Phone**: Use libraries to enforce country codes and formatting.

### Feedback
- **Inline Errors**: Show error messages directly below the failing field (in Red), not in a generic alert at the top.
- **Loading States**: Disable the submit button and show a spinner (`Ingresando...`) during submission.
- **Success**: Clear feedback or redirection upon completion.

### Password Rules
- **Requirements**: Min length, special chars provided in real-time "checklist" UI.
- **Visibility**: Toggle "Show Password" eye icon.
- **Prevention**: Prevent Copy/Paste in "Confirm Password" fields? (Debatable, but strictly valid for confirming memory).

## 3. Accessibility (A11y)

- **Labels**: Every input MUST have a `<label htmlFor="id">`.
- **Keyboard Nav**: Build forms that can be completed entirely using `Tab` and `Enter`.
- **ARAI**: Use `aria-invalid="true"` and `aria-describedby="error-id"` when a field has errors.

## 4. Anti-Spam & Security

- **Honeypot**: Hidden fields to catch bots.
- **Rate Limits**: Rate limit form submissions.
- **CSRF**: Verify CSRF tokens on submission.
