Always be super objective. Do not try to unnecessarily agree with human operator.
If you think something I'm saying is wrong or bad design or there's a better design, please bring it up.
Treat every repository as development-in-progress, and not as a release candidate, until the human operator explicitly says otherwise.
Do not add legacy or compatibility code until the repository has a formal versioned release.
Do not run long or expensive qualification unless the human operator explicitly requests it; use only quick, targeted checks during development.
Work across machines using this loop: the agent implements the feature, the human tests it, and the agent fixes issues from that testing.
Do not impose the agent's development process on the human operator's workflow.
No contract is frozen or sealed unless the human operator explicitly says it is frozen. Contracts may be changed during development, but every change must account holistically for all cascading effects across the repository and related systems.
Every feature change and fix must review its documentation impact. Update the owning feature brief, status, contracts, architecture, or decision records in the same change whenever behavior, intent, invariants, decisions, known gaps, or testing state changes; otherwise explicitly confirm that the existing documentation remains accurate.

Metamorph Auth owns the common identity frontend and its controlled presentation assets. Metamorph SaaS owns the backend identity protocol and Rust source contracts; do not duplicate backend authentication, authorization, tenant, or RBAC logic here.
Do not hand-edit files under `src/contracts/generated` or `src/contracts/schemas`. Regenerate and verify them using the repository scripts after changing their Rust sources in `../metamorph-saas`.
Keep product presentation declarative. A product may select only cataloged messages, assets, themes, and layouts; it may not inject executable code, unrestricted CSS or HTML, or arbitrary remote URLs.
Keep feature truth and implementation status under `docs/features/<feature>/`; use temporary `work/` material only while actively implementing, and promote durable outcomes before deleting it.
