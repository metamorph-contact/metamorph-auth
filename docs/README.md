# Documentation System

This directory is the durable source for Metamorph Auth intent, frontend
architecture, feature behavior, decisions, and implementation state. Chat
transcripts and implementation plans are not canonical documentation.

## Structure

```text
docs/
  README.md
  architecture/
  decisions/
  features/
    <feature>/
      README.md
      status.md
      decisions/
      contracts/
      work/
```

A feature starts with a canonical `README.md` and a reality-based `status.md`.
Create decision records only for material choices. Keep generated API and schema
artifacts in their established source directories and link to them; do not copy
them into documentation.

## Document Roles

- `features/<feature>/README.md` explains intent, user-visible behavior, scope,
  invariants, ownership, security, accessibility, localization, failure
  behavior, and relevant implementation locations.
- `features/<feature>/status.md` records what is actually implemented, what the
  human has tested, focused agent checks, known gaps, and next work.
- `architecture/` describes current cross-cutting frontend design.
- `decisions/` and feature decision folders retain the rationale and
  consequences of material choices. Supersede decisions explicitly instead of
  rewriting history.
- Temporary plans may live under `features/<feature>/work/`, but product
  behavior must remain understandable without them.

## Ownership Boundaries

Metamorph Auth owns the common identity browser application, translations,
controlled presentation runtime, and approved immutable assets. The backend
identity protocol, regional persistence, authentication authority, and common
authorization/RBAC evaluator remain in `../metamorph-saas`.

Rust-generated TypeScript and JSON schemas under `src/contracts/generated` and
`src/contracts/schemas` are canonical generated artifacts. Change their Rust
sources in Metamorph SaaS, regenerate them, and update affected documentation
in both repositories as one holistic contract change.

## Update Discipline

1. Define feature intent, boundaries, and unresolved choices before coding.
2. Update status whenever implementation or known gaps materially change.
3. Record accepted material choices while their rationale is current.
4. After human testing and fixes, update both intended behavior and tested
   reality where needed.
5. Review documentation impact for every feature change or fix. If no update is
   required, explicitly state that the canonical documentation remains accurate.
6. Keep contracts mutable unless the human operator explicitly freezes them,
   and account for all cascading changes when revising one.
7. Treat every repository as development-in-progress until the human operator
   explicitly changes that status. Do not imply release qualification from a
   design review or focused development check.

Only quick, targeted checks are expected during development unless the human
operator explicitly requests broader qualification.
