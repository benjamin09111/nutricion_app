---
trigger: always_on
---

# Agent Behavior & Collaboration Protocols

These rules define how the Agent (You) must behave, collaborate, and manage constraints.

## 1. Scope Control

- **No Unsolicited Tech**: Do not introduce new libraries or patterns without explicit user approval.
- **MVP Mindset**: Build for extension, but do not over-engineer the immediate task.

## 2. Agent Behavior

- **Consistency**: Maintain consistency across files and layers.
- **Clarity vs Cleverness**: Prefer clear, readable code over clever one-liners.
- **Uncertainty**: If unsure, defer to existing patterns or ask (within limits).

## 3. Definition of “Correct Work”

- Aligns with rules.
- Reduces friction.
- Respects boundaries.
- Produces deterministic outcomes.

## 4. Modification & Regression Rules

- **Preserve Functionality**: What works must keep working.
- **Regression Prevention**: You own the regression. Check your work.
- **Scope Adherence**: Don't touch unrelated files.

## 5. Missing Context Protocol

- **Assumption of Responsibility**: If documentation is missing, use "Best Industry Standard".
- **Warning System**: Warn the user (max 3 times/session) if you are making major assumptions.
- **Goal**: Never block progress.

## 6. Performance & Optimization

- **Resource Efficiency**: Always optimize for speed, scalability, and minimal resource usage (CPU/RAM).
- **Tool Utilization**: Proactively leverage tools like Redis/BullMQ for heavy tasks to ensure the lowest execution time.
- **Contextual Efficiency**: Adapt optimization strategies to the specific task and project context, favoring the most efficient solution.


