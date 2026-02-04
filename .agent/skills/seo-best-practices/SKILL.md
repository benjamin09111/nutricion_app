---
name: seo-best-practices
description: Comprehensive guide for implementing SEO best practices, semantic HTML, and accessibility standards in web applications.
---

# SEO Best Practices & Semantic Integrity

This skill provides guidelines and actionable steps to ensure the application is optimized for search engines (Google), accessibility, and semantic correctness.

## 1. Context Awareness

Before applying SEO changes, always:
- **Identify the Page Type**: Is it a landing page, a dashboard (private), or a public resource?
- **Understand the User Intent**: For this project (NutriSaaS), keywords focus on "Software para nutricionistas", "Gestión de pacientes", "Automatización de dietas".
- **Check Project Structure**: Use `list_dir` to see where the page resides (e.g., `src/app/(public)` vs `src/app/(authenticated)`). **Private dashboards do not need aggressive indexing, but semantic HTML is still required for accessibility.**

## 2. Semantic HTML (The Google Standard)

Google prioritizes pages that use correct HTML5 tags to describe content structure.
**NEVER use a `<div>` when a more specific tag exists.**

### Structural Tags
- `<header>`: Site navigation, logo, page title.
- `<main>`: The primary content of the page. **Everything important goes here. Only one per page.**
- `<nav>`: Main navigation links.
- `<footer>`: Copyright, valid links, secondary contact info.
- `<section>`: Thematic grouping of content, usually with a heading.
- `<article>`: Self-contained composition (posts, cards, product descriptions).
- `<aside>`: Content tangentially related to the main content (sidebars, callouts).

### Content Tags
- `<h1>`: **Exactly one per page.** Describes the main topic.
- `<h2>` - `<h6>`: Logical hierarchy. Never skip levels (e.g., `h1` -> `h3`).
- `<p>`: Paragraphs.
- `<ul>`/`<ol>` + `<li>`: Lists.
- `<button>` vs `<a>`:
  - Use `<button>` for actions (toggle, submit, open modal).
  - Use `<a>` for navigation (changing URL).

## 3. Next.js Metadata API

For Next.js 13+ (App Router), use the `Metadata` object in `layout.tsx` or `page.tsx`.

### Essential Metadata
```typescript
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | NutriSaaS',
    default: 'NutriSaaS - Software para Nutricionistas',
  },
  description: 'Gestiona tus pacientes, automatiza dietas y ahorra tiempo con el software líder para nutricionistas en Chile y LATAM.',
  keywords: ['nutricionista', 'software', 'dietas', 'gestión pacientes', 'saas salud'],
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: 'https://nutrisaas.com',
    siteName: 'NutriSaaS',
    // ...
  }
};
```

## 4. Image Optimization

- Always usage `<Image />` from `next/image`.
- **Mandatory**: `alt` text describing the image functionality or content.
- Use `priority` for above-the-fold images (LCP optimization).

## 5. Structured Data (JSON-LD)

For public pages (Landing, Blog, Pricing), inject JSON-LD to help Google understand the content entity (Product, Organization, FAQ).

```tsx
<script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "NutriSaaS",
    "applicationCategory": "HealthApplication",
    // ...
  })}
</script>
```

## 6. Audit Checklist

Before finishing a task:
1. [ ] Is the `<h1>` unique and descriptive?
2. [ ] Are `<div>` soups replaced with `<section>`, `<article>`, etc?
3. [ ] Do all interactive elements have accessible names (via `aria-label` or text)?
4. [ ] Is the page title and description set?
5. [ ] Are images utilizing `alt` tags?
