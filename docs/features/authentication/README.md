# Shared Identity Frontend

Metamorph Auth is the realm common identity browser application. It renders a
catalog-admitted product presentation while Metamorph SaaS owns credentials,
sessions, tenants, audit, and the sole common RBAC evaluator.

The frontend implements authorization entry, account choice, email/password
sign-in, signup and verification, organization/individual continuation,
profile name/handle/color/picture, recovery, destination finalization, and
single-account/browser-wide logout. Product backends implement none of this
protocol. CSI-13 defines the trusted product boundary, and CSI-15 exposes the
SaaS routes through regional product API hosts and cuts over Octamorph.

Security invariants are catalog-pinned origins and navigation, protected
fragment scrubbing before parsing, exact browser/tab recovery state, no
credential persistence or logging, strict bounded/versioned response decoding,
same-attempt response-loss recovery, required idempotency, bounded partial
multi-home reads, and authoritative logout completion before local cleanup.

Presentation follows system mode. Polymorph owns the fade choreography and
two-pixel transition progress; internal transitions move focus to their new
heading. Signup controls are prefetched, translations are module-owned, and
profile image editing plus color selection use Polymorph. Theme pairings are
admitted then generated into static first-party CSS. CSI-12 adds CSP-safe
standalone runtime validators, short-lived exact recovery receipts, a scoped
WCAG 2.2 AA identity contrast gate, responsive overflow checks, collision-safe
translation bundles, and localized document/toast chrome.

Generated DTOs and schemas come from `../metamorph-saas`; never edit them here.
See [status](status.md) for current evidence and deferred work.

The checked-in UI release and generated browser trust are build inputs, not
runtime suggestions. Octamorph's build verifies its generated product trust
against the admitted deployment catalog and this exact UI release. A release or
catalog change that is not regenerated therefore fails the product build.
