# Shared Identity Frontend

Plan 10 owned packets A–E are development-complete on `codex/plan10`. The
[development handoff](../../../../metamorph-saas/docs/features/authentication/work/enterprise-authentication/10-conditional-network-access-handoff.md) records all coverage rows, actual routes,
targeted checks and readonly reviews. Final handoff audit is complete and both readonly reviewers are CLEAN. External
common proof/session/facts/effects, producer and transport installation, the
first protected product handler and human live evidence remain in EA-10I.
Earlier increment records below preserve their then-current testing state.

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

Plan 02 Packet G adds the optional source-P product-route-move receipt to the
generated CSI-07 account-selection request and typed client. The normal caller
omits it; only a future explicit product-flow relocation may supply the proof.
Profile and admin session/device pages are product-owned and live in
Octamorph, so this identity frontend has no corresponding fixture to replace.

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

Plan 01 provides development-only core identity previews at
`/{locale}/_preview/enterprise-security/{screenId}` for `SCR-IDN-001` and
`SCR-IDN-011`–`SCR-IDN-017`. The lazy feature module uses generated enterprise
method/admission DTOs and existing CSI response types with deterministic,
non-secret fixture states. Its own translation namespace loads with the
module. Existing CSI sign-in, signup, verification, recovery, and finalization
routes remain the production behavior. Preview selections have no live effect;
enterprise live adapters fail closed until their owning plans wire the guarded
APIs.

Packet J's passkey, authenticator-code, recovery-code, step-up, and recovery-
status previews use a second development-only lazy module. Its browser
credential adapter is inert in preview, and its fixtures cannot issue a
credential result or action proof.

Packet K's SAML/OIDC, emergency, JIT profile, and SCIM activation previews use
a third development-only lazy module. Its JIT sample carries the generated
profile-completion request shape, including handle, first name, avatar fallback,
and a null privacy handoff in the original inspection scenarios. G's interactive
ready preview exercises the real profile form/transport with an explicitly DEV-only
privacy receipt and never invokes an actual profile publisher.
Packet L's recipient inbox uses a fourth
lazy module and the separately generated authorization recipient contract. It
shows pinned offers, redacted claim-required teasers, queued decisions, local
skip, and read-only completion without contacting a live invitation handler.
Its development preview route is `/{locale}/_preview/enterprise-security/SCR-IDN-009`;
production registration waits for the guarded authorization owner gate.

The checked-in UI release and generated browser trust are build inputs, not
runtime suggestions. Octamorph's build verifies its generated product trust
against the admitted deployment catalog and this exact UI release. A release or
catalog change that is not regenerated therefore fails the product build.


EA-10E rollout reconciliation (2026-09-15) consumes the common backend's mutable
shared whole-policy lifecycle; the unused conditional preview/apply/rollback
aliases and their thin DTOs are removed. The generated pin is 1,982 artifacts,
`21ff8e36f67e39d527af7e104ca931fd6a7311334537692b86bf1b640991563a`.
Independent strict schema checks and TypeScript pass. Both readonly reviews are CLEAN after the placement correction.
Conditional editing/simulation, source administration and rollout are implemented
in Octamorph with required actual proof/producer composition; identity continuation
presentation and final coverage/handoff remain owned E work. No live integration
qualification is claimed.


EA-10E identity continuation presentation (2026-09-15) regenerates the exact
server-derived action/account/product/resource context, nonce creation time and
separate full registered-ceremony digest. The sole shared export has 1,986
artifacts at `8c02809f8596178bb7a5f839560873b0e79a75aebc9cdeb83129ce671b4f3559`.
Auth registers the locale/catalog/nonce route and owns immutable selected-account,
expiry/abandonment/BFCache and one-attempt collection/return orchestration. Actual
common CSI proof/method/callback/repair integration is required through
`ConditionalIdentityOwnerContext`; missing owner is unavailable. No fixture
ceremony or action permit is used. The exact original product/resource scope is
retained for fresh destination CSI, one RBAC decision and conditional gates.
All 14 focused identity checks and both readonly reviews are CLEAN after the
committed-mount BFCache recovery fix. Final coverage/handoff audit is complete; both readonly reviewers are CLEAN.
Actual owner and first product-handler/live qualification remain in SaaS's
EA-10I integrator ledger.
## Plan06G browser composition — 2026-09-15

Owned scoped method discovery/SAML confirmation/JIT contact/profile and per-offer
recipient decision/status journeys are implemented. Rust-generated twelve-
operation types/routes/schemas and identical standalone validators bind exact
callback/challenge/provisional metadata. Actual CSI establishment recovery,
current factor/link/privacy/contact and guarded recipient suppliers remain
mandatory; no ready progress or DEV receipt issues an account or target access.
Cancellation, scope exit, page suspension and expiry erase private custody; actual
CSI durable cancellation must also fence in-flight publication. Same original
request/privacy receipt recovers ambiguous responses; definite denials permit new
commands. Live callback origin/region comes from the verified catalog.

37 focused Auth checks and both TypeScript builds pass. Production bundle admits
about 287 KiB gzip under its original 330 KiB limit, with inline fragment/CSP,
no-eval and DEV fixture exclusion checks. Browser exercises are synthetic protocol
receipts, not actual IdP/CSI/cross-process qualification. The SaaS Plan06G handoff
and EA-06I ledger own actual supplier installation and human testing. All readonly bug/security/performance final reviews are clear.

EA-06I remains in progress. Its live method/start adapter uses current CSI/CSRF
admission. SP callback return scrubs advisory identifiers, bootstraps the same
cookie-bound CSI flow and resumes with the independent issuer return cookie.
Actual JIT challenge/provisional/privacy metadata drives the profile form;
optional consent remains optional. Account continuation recovers H's existing
protected CSI outcome. Recipient, controlled-factor/link, privacy presentation
publication and fresh unsolicited SAML owners still need composition. Generated
artifacts, targeted checks and the packet's readonly reviews are pending; the
earlier Plan06G check counts do not qualify this new integration.

EA-06I now supplies unsolicited SAML entry through the exact signed catalog
product entry registration. The product creates the normal P cookie/start;
C returns opaque original handoff metadata in its current bootstrap. G prepares
the actual H operation, shows the verified provider after redemption, and
requires explicit confirmation before the retained JIT/sign-in journey. A
native advisory flow reference supports reload with the current C cookie;
assertion, CSRF and CSI authorization custody is never stored in browser
storage. Independent Original I expiry and source admission remain mandatory.
Configured startup and targeted behavioral verification remain pending.
