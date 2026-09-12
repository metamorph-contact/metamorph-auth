# Shared Identity Frontend Status

- Date: 2026-09-12
- State: CSI-15 Octamorph cutover implemented and agent-reviewed
- Repository: Development-in-progress
- Contracts: Mutable
- Human testing: Pending CSI-17
- Runtime composition: Implemented for the loopback development graph
- Octamorph cutover: Implemented; human testing pending CSI-17

Implemented source includes catalog verification/boundaries, exact fragment
handling, browser-head and per-tab recovery stores, typed protocol clients,
React/TanStack routes, localized product presentation, system theme/motion,
signup profile editing, destination completion, and recoverable logout.

CSI-15 binds the UI release to the current signed deployment catalog, exposes
the common UI through the composed SaaS runtime, and moves Octamorph product
login/add-account/session/logout to the SaaS-owned regional product-auth
surface. Product backends no longer implement start, callback, completion,
attachment, or session-management protocol. The UI persists and validates
short-lived recovery state before URL fragment removal, validates logout
results against the exact account/head target, and completes authoritative
logout before local browser cleanup.

CSI-11's three protocol/frontend reviewers and CSI-12's three visual/motion,
accessibility, and internationalization/browser-concurrency reviewers are
complete. Valid CSI-12 findings were addressed holistically: standalone CSP-
safe schema validators, exact short-lived recovery receipts, immutable retries,
early BFCache scrubbing, UTF-8 bounds, mobile/reset corrections, transition
progress, accessible focus/errors/account actions, confirmed profile crops,
localized toast chrome, collision-safe module translations and a scoped WCAG
2.2 AA identity contrast gate. The final pass also closes dispatched-response
ambiguity, signup organization/password reconciliation, account-home outage
visibility, bidi isolation, and profile-image decode/focus recovery.

Focused development checks are recorded in the SaaS
[`CSI-12 packet record`](../../../../metamorph-saas/docs/features/authentication/work/csi-12-identity-ui-review.md).
No broad browser matrix, release security qualification, or production runtime
claim is made yet.
