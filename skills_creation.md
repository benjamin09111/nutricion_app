Habilidades del agente
Defina el comportamiento reutilizable mediante definiciones de SKILL.md

Las habilidades del agente permiten a OpenCode descubrir instrucciones reutilizables de su repositorio o directorio de inicio. Las habilidades se cargan bajo demanda a través de la herramienta nativa skill: los agentes ven las habilidades disponibles y pueden cargar el contenido completo cuando sea necesario.

Colocar archivos
Cree una carpeta por nombre de habilidad y coloque un SKILL.md dentro de ella. OpenCode busca estas ubicaciones:

Configuración del proyecto: .opencode/skills/<name>/SKILL.md

Entender el descubrimiento
Para las rutas locales del proyecto, OpenCode sube desde su directorio de trabajo actual hasta llegar al árbol de trabajo de git. Carga cualquier skills/*/SKILL.md coincidente en .opencode/ y cualquier .claude/skills/*/SKILL.md o .agents/skills/*/SKILL.md coincidente a lo largo del camino.

Las definiciones globales también se cargan desde ~/.config/opencode/skills/*/SKILL.md, ~/.claude/skills/*/SKILL.md y ~/.agents/skills/*/SKILL.md.

Escribir la introducción
Cada SKILL.md debe comenzar con el frontmatter de YAML. Sólo se reconocen estos campos:

name (obligatorio)
description (obligatorio)
license (opcional)
compatibility (opcional)
metadata (opcional, mapa de cadena a cadena)
Los campos desconocidos se ignoran.

Validar nombres
name debe:

Tener entre 1 y 64 caracteres.
Ser alfanuméricos en minúsculas con separadores de guión simple
No comienza ni termina con -
No contener -- consecutivos
Coincide con el nombre del directorio que contiene SKILL.md
expresión regular equivalente:

^[a-z0-9]+(-[a-z0-9]+)*$

Seguir las reglas de longitud
description debe tener entre 1 y 1024 caracteres. Manténgalo lo suficientemente específico para que el agente elija correctamente.

Usar un ejemplo
Crea .opencode/skills/git-release/SKILL.md así:

---
name: git-release
description: Create consistent releases and changelogs
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
  workflow: github
---

## What I do

- Draft release notes from merged PRs
- Propose a version bump
- Provide a copy-pasteable `gh release create` command

## When to use me

Use this when you are preparing a tagged release.
Ask clarifying questions if the target versioning scheme is unclear.

usa esto para crear más skills, adaptandose para la pagina que tenemos ahora.