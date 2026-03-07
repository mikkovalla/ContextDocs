# ContextDocs

The tool that gives AI agents superpowers.

ContextDocs analyzes your project's npm dependencies, fetches high-signal docs, normalizes content, and builds compact retrieval indexes for AI agents under `.ai-docs/`.

## Requirements

- Bun (recommended runtime)

## Quick Start

Run from your project root:

```bash
bun run cli/index.ts install --non-interactive
```

Install docs for specific packages:

```bash
bun run cli/index.ts install --packages zod,daisyui --non-interactive
```

Choose source priority (`llms`, `github`, `crawl`):

```bash
bun run cli/index.ts install --packages daisyui --source-priority llms --non-interactive
```

## Correct Multiline Command Syntax

If you split commands across lines in `zsh`, the backslash must be the last character on the line:

```bash
bun run cli/index.ts install \
 --packages daisyui \
 --source-priority llms \
 --non-interactive
```

Do not write `install \ --packages ...` on one line. That can cause shell parsing errors like `command not found: --source-priority`.

## CLI Command

```bash
bun run cli/index.ts install [options]
```

Options:

- `--non-interactive`: skip prompts and process all detected npm packages (or provided `--packages`)
- `--packages <csv>`: explicit comma-separated package list
- `--source-priority <mode>`: source order preference, one of `llms`, `github`, `crawl`

## How It Works

For each target package, ContextDocs:

1. Resolves candidate documentation sources for npm packages (for example `llms.txt`, `llms-full`, GitHub docs tree, sitemap site, README).
2. Uses the detected npm package version to prefer the most compatible documentation lane when multiple sources are available.
3. Fetches docs from the best working source according to your priority.
4. Normalizes content to markdown.
5. Splits monolithic `llms-full` sources into logical `sections/*.md` files when possible.
6. Builds a compact `AGENTS_INDEX.min` with:
  - base `path`
  - `topic`
  - `headings`
  - `features` mapping (`Feature.key=>path#anchor`)
  - `path/anchor` pipe-delimited anchors
7. Writes `SOURCE_MANIFEST.json` with provenance, ranking reasons, and fetch attempts.
8. Updates the root `AGENTS.md` index block.

## Output Layout

Generated docs are written to:

```text
.ai-docs/npm/<package>/
```

Typical contents:

- `AGENTS_INDEX.min`
- `SOURCE_MANIFEST.json`
- section docs (for example `sections/06-customizing-errors.md`)

## Running Tests

```bash
bun test
```
