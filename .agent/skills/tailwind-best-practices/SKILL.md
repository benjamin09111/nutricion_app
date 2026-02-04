---
name: tailwind-best-practices
description: Guide for Tailwind CSS best practices, reusability, maintainability, and design system implementation. Use this skill when the user asks for CSS advice, UI styling, refactoring Tailwind classes, or creating reusable UI components.
---

# Tailwind CSS Best Practices

This skill outlines how to use Tailwind CSS efficiently to create manageable, atomic, and scalable user interfaces.

## 1. Structure & Reusability

### Component Abstraction (React/Vue/Etc)
**Don't rely mainly on `@apply`.**
- **Preferred**: Extract repeating button/card patterns into strict UI Components (e.g., `<Button variant="primary" />`).
- **Why**: Keeps HTML clean and ensures "Source of Truth" for design tokens is in the component code.
- **When to use `@apply`**: Only for global base styles (headings, standard link styles) or strictly internal utility clashes that can't be computed.

### Utility Grouping (Readability)
Group classes logically (e.g., layout -> spacing -> sizing -> typography -> visual).
```jsx
// Bad (Random order)
<div className="text-white p-4 flex rounded bg-blue-500 m-2 font-bold invalid-order">...</div>

// Good (Logical order: Layout, Box Model, Visual, Typography)
<div className="flex m-2 p-4 rounded bg-blue-500 text-white font-bold">...</div>
```
*Tip: Use tools like `prettier-plugin-tailwindcss` to enforce unnecessary ordering debates.*

## 2. Configuration & Theming (Standardization)

### Single Source of Truth
- **`tailwind.config.js`**: Define all your colors, spacing, and breakpoints here.
- **Don't hardcode magic values**:
  - ❌ `text-[#1da1f2]`
  - ✅ `text-brand-twitter` (configured in theme)

### Theme Extension
Use `extend` to preserve default values while adding yours.
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          900: '#0c4a6e',
        }
      }
    }
  }
}
```

## 3. Avoid "Arbitrary Value" Abuse

- **Avoid**: `w-[357px]`, `top-[13px]`, `bg-[#123456]`.
- **Why**: breaks consistency (rhythm), unreadable, hard to bulk-update.
- **Fix**: If a value is used more than twice, add it to the theme config.

## 4. Responsive Design

- **Mobile First**: Default properties are mobile-first. Use `md:`, `lg:` only for overrides on larger screens.
  - ❌ `class="w-1/2 sm:w-full"` (Logic inverted)
  - ✅ `class="w-full sm:w-1/2"` (Mobile first)

## 5. Optimization

- **JIT (Just-in-Time)**: Always enabled in modern Tailwind (v3+). It generates only the CSS you use.
- **Dynamic Classes**: DO NOT construct class names dynamically.
  - ❌ `className={"bg-" + color + "-500"}` (PurgeCSS/JIT cannot see this!)
  - ✅ `className={clsx(color === 'red' && 'bg-red-500', color === 'blue' && 'bg-blue-500')}` or map objects.

## 6. Atomic & Readable

- **clsx / tailwind-merge**: Use these libraries to combine class strings conditionally and handle overriding conflicts properly without bloated code.

```javascript
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```
