# Shared Identity Frontend Status

- Date: 2026-09-13
- State: CSI-17 implemented and independently reviewed; human acceptance pending
- Repository: Development-in-progress
- Contracts: Mutable
- Human testing: Pending operator acceptance
- Runtime composition: Implemented for the loopback development graph
- Octamorph cutover: Implemented; human testing pending CSI-17

Implemented source includes catalog verification/boundaries, exact fragment
handling, browser-head and per-tab recovery stores, typed protocol clients,
React/TanStack routes, localized product presentation, system theme/motion,
signup profile editing, destination completion, and recoverable logout.

The AC-1 identity-catalog publication now includes the signed
`agentApiNamespace` field in its generated TypeScript, strict JSON Schema, and
standalone validator. Metamorph Auth adds no agent route, UI, or product
authorization grant.

CSI-15 binds the UI release to the current signed deployment catalog, exposes
the common UI through the composed SaaS runtime, and moves Octamorph product
login/add-account/session/logout to the SaaS-owned regional product-auth
surface. Product backends no longer implement start, callback, completion,
attachment, or session-management protocol. The UI persists and validates
short-lived recovery state before URL fragment removal, validates logout
results against the exact account/head target, and completes authoritative
logout before local browser cleanup.

CSI-16 keeps the non-authorizing start recovery receipt for its bounded window
so refresh after account establishment can still resume destination completion.
Password-recovery submission clears the new password from React state before
dispatch and requires re-entry for an exact-attempt retry. BFCache `pagehide`
scrubs all form values and local image URLs and conceals rendered PII. Picture-
upload response-loss copy no longer claims the upload definitely failed. The
client now accepts only the current backend-owned `ProtocolErrorV1` endpoint/
status/recovery/detail matrix, including the distinct non-retryable product
account-container limit; the removed retained-workflow error vocabulary is not
a second contract.

CSI-17 adds bounded, catalog-pinned relay recovery; explicit expired-link
restart UX; stable idempotent profile-picture upload attempts; synchronous
guards against duplicate form dispatch; and dynamically published locale
catalogs. Product and identity catalog version identifiers remain independent;
their signed region/origin bindings must agree. Catalog responses require JSON
MIME in addition to byte/UTF-8 bounds.

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
[`CSI-17 packet record`](../../../../metamorph-saas/docs/features/authentication/work/csi-17-operator-test-loop.md).
No broad browser matrix, release security qualification, or production runtime
claim is made yet.
