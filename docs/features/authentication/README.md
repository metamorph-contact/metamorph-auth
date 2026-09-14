# Shared Identity Frontend

Metamorph Auth is the realm common identity browser application. It renders a
catalog-admitted product presentation while Metamorph SaaS owns credentials,
sessions, tenants, audit, and the sole common RBAC evaluator.

The frontend implements authorization entry, account choice, email/password
sign-in, signup and verification, organization/individual continuation,
profile name/handle/color/picture, recovery, destination finalization, and
single-account/browser-wide logout. Product backends implement none of this
protocol. CSI-13 defines the trusted product boundary, CSI-15 exposes the SaaS
routes through regional product API hosts and cuts over Octamorph, and CSI-16
closes the focused post-cutover security/engineering review.

Security invariants are catalog-pinned origins and navigation, protected
fragment scrubbing before parsing, exact browser/tab recovery state, no
credential persistence or logging, strict bounded/versioned response decoding,
same-attempt response-loss recovery without retaining passwords, required
idempotency, bounded partial multi-home reads, and authoritative logout
completion before local cleanup. Every endpoint uses the single current
`ProtocolErrorV1` contract; pre-cutover retained error names and client methods
are not accepted.

Presentation follows system mode. Polymorph owns the fade choreography and
two-pixel transition progress; internal transitions move focus to their new
heading. Signup controls are prefetched, translations are module-owned, and
profile image editing plus color selection use Polymorph. Theme pairings are
admitted then generated into static first-party CSS. CSI-12 adds CSP-safe
standalone runtime validators, short-lived exact recovery receipts, a scoped
WCAG 2.2 AA identity contrast gate, responsive overflow checks, collision-safe
translation bundles, and localized document/toast chrome.
CSI-16 additionally scrubs and conceals the complete identity document before
BFCache suspension and retains only the bounded non-authorizing receipt needed
to recover destination completion after refresh.

Generated DTOs and schemas come from `../metamorph-saas`; never edit them here.
The [central first-party browser contract](../../../../metamorph-saas/docs/features/authentication/contracts/central-first-party-browser-v1.md)
is the durable protocol boundary; CSI packet records are historical
development rationale, not a competing wire contract.
See [status](status.md) for current evidence and deferred work.

Plan 01 adds a development-only enterprise-method preview at
`/{locale}/_preview/enterprise-security/SCR-IDN-001`. It consumes a generated
request/response boundary and deterministic, non-secret fixtures in a lazy
module; its feature-owned translation namespace loads with that module. The
existing CSI sign-in and recovery routes remain the only production identity
behavior. Enterprise method availability is not inferred from the fixture,
and the future live adapter fails closed until its owning feature plan wires
the guarded API.

The checked-in UI release and generated browser trust are build inputs, not
runtime suggestions. Octamorph's build verifies its generated product trust
against the admitted deployment catalog and this exact UI release. A release or
catalog change that is not regenerated therefore fails the product build.
