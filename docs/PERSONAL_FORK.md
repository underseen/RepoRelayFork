# Personal fork operating model

This repository is a personal evolution of RepoRelay, derived from the MIT-licensed upstream project. Keep the upstream copyright and MIT license intact when changing or redistributing substantial portions of the original code.

## Purpose

Use ChatGPT as a constrained repository reviewer while a separate local coding agent performs implementation. RepoRelay remains the security boundary: the reviewer may inspect one approved repository and, when enabled, update only fixed handoff documents.

## Non-negotiable invariants

- Bind the review bridge only to `127.0.0.1`.
- Require exactly one canonical approved repository root.
- Never add shell, process execution, Git, arbitrary write/delete, worktree, artifact, skill, or subagent tools to the reviewer surface.
- Reject traversal, symlinks, junctions, hard links, alternate streams, and sensitive repository paths.
- Keep handoff writes fixed to pre-existing files under `.ai-handoff`.
- Keep `RESULT.md` implementer-owned.
- Validate structured state before accepting reviewer state changes.
- Prefer bounded/ranged reads so repository review does not waste model context.
- Verify both service identity and bridge authentication before declaring tunnel health.

## Personal reviewer flow

1. Start RepoRelay on the repository.
2. Reviewer calls `open_workspace` once.
3. Reviewer calls `list_files` with `mode="instructions"` before reviewing code so nested `AGENTS.md` / `CLAUDE.md` instructions are discovered.
4. Reviewer uses `search_files` to locate relevant code.
5. Reviewer uses `read_file` with `startLine` / `endLine` for large files. Default output is capped at 64 KiB.
6. Reviewer writes a bounded `NEXT_TASK.md` only when handoff writes are enabled.
7. A separate local implementer performs the authorized task and writes `RESULT.md`.
8. Reviewer independently re-reads changed code and result evidence, writes `REVIEW.md`, and updates schema-valid `STATE.json`.

## Human gates

The handoff protocol never authorizes deployment, publishing, destructive operations, secret use, production data access, or expansion beyond the user-approved objective. Those actions require explicit operator approval outside RepoRelay.

A future executor integration should enforce a separate approval artifact or control-plane decision before consuming a new `NEXT_TASK.md`; do not treat text written by the reviewer as equivalent to operator approval.

## Foundation implemented on the personal fork

- Quickstart rejects a redirected `.ai-handoff` directory before initialization.
- Reviewer-facing reads are bounded to 64 KiB by default and support line ranges.
- `list_files(mode="instructions")` discovers nested `AGENTS.md` and `CLAUDE.md` files without adding another MCP capability.
- Reviewer updates to `STATE.json` must match the structured handoff schema.
- Handoff documents use same-directory temporary files, sync, revalidation, and atomic replacement instead of truncate-then-write.
- `tunnel doctor` validates the expected RepoRelay `/healthz` identity and then exercises the authenticated MCP endpoint; a generic non-401 HTTP service is not considered healthy.

## Near-term roadmap

### P0

- Add an explicit operator-owned approval artifact/state for executor consumption, bound to the exact task cycle/content.
- Validate the foundation across the existing Linux, macOS, and Windows CI matrix before merging it into `main`.

### P1

- Make repository search more efficient on large repositories (filename filters, ignored paths, pagination/indexing where justified).
- Add task/review cycle identifiers and integrity hashes to handoff state.
- Add tests for interrupted/failed atomic handoff replacement on all supported operating systems.

### P2

- Integrate the handoff protocol with a personal control plane while keeping reviewer and executor permissions separated.
- Add observability for review cycles without storing repository contents or secrets in logs.
