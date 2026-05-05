## Targeted file edit

You are editing existing code in this repository.

User request: $ARGUMENTS

### Behavior

- Apply **only** the minimal changes necessary to satisfy the request.
- Do **not** refactor or "clean up" unrelated code.
- Preserve existing code style, imports, and formatting.
- Prefer **surgical patches** over large rewrites.

### Output format

- If the user is in Cursor:
  - Prefer showing **only the modified snippets** or a concise description of the change.
  - Avoid pasting entire files unless the user explicitly asks.
- Keep any explanation **short and to the point**.

