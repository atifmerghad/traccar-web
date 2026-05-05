## Claude configuration for this repo

This repository is used inside Cursor with Claude. The goals are:

- Keep **token usage as low as possible**
- Keep **edits tightly scoped** to what the user asked
- Prefer **small, precise patches** over refactors

### Interaction preferences

- Be **very concise** in explanations; avoid repeating the prompt or restating unchanged code.
- When the user asks for a change, **assume they want you to do it**, not just describe it.
- **Only touch files and lines explicitly related to the request.**
- Prefer **minimal diffs**; do not reformat or reorder imports unless required.
- Do **not** introduce new dependencies unless the user asks or it is clearly necessary.

### Tool usage

- Avoid file reads/searches if the answer is clearly contained in the user message.
- When you must read, **limit scope** to the specific files likely involved.
- Run linters/tests only when:
  - You changed logic in a way that could break behavior, or
  - The user explicitly asked you to keep things green.

### UI and React conventions

- React 19 with MUI v7 and `tss-react/mui` for styling.
- Use `makeStyles` for reusable styles; use `sx` only for small, local overrides.
- Follow existing patterns in `src/ui/` and `src/common/components/` for layout and theme usage
  (dark/light mode via MUI theme).

These defaults can be overridden by per-command instructions in `.claude/commands/*.md`.

