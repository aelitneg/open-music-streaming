# /docs skill

Creates a new document from the appropriate template and places it in `docs/drafts/`.

## Usage

`/docs <type> [title]`

- `type` — the document type (e.g. `decision`)
- `title` — optional short title; used to name the file

## Supported types

### decision

Template: `docs/decisions/0000-decision-template.md`
Output: `docs/drafts/NNNN-<slugified-title>.md`

The output filename number (`NNNN`) is determined by finding the highest existing number across all files in `docs/decisions/` and `docs/drafts/`, then incrementing by one. Start at `0001` if none exist yet (excluding the template `0000`).

If no title is provided, name the file `NNNN-untitled.md`.

## Steps

1. Identify the doc type from the argument. If the type is not recognised, list the supported types and stop.
2. Determine the next sequence number as described above.
3. Slugify the title: lowercase, replace spaces with hyphens, strip non-alphanumeric characters (keep hyphens).
4. Read the template file for the chosen type.
5. Write the new file to `docs/drafts/` with the correct name.
6. Report the full path of the created file to the user.

Do not open or edit the file after creating it — just report the path.
