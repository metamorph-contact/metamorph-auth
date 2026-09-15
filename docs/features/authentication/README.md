# Shared Identity Frontend

Plan 08D mounts `EmergencyEntryGate` in common identity credentials only for
an actual admitted emergency-purpose `EmergencyEntryContext` matched to current
flow, tenant and cataloged identity home. It verifies fresh UV passkey or local
password+TOTP and reason, preserves exact uncertain command retries and shows
absolute window/review obligations. Private readiness pins stay server-side.
Expiry, flow/account changes, pagehide/BFCache clear proof/retry memory. Actual
CSI controller completion through registered callback/fences and the next
immutable identity UI catalog release remain SaaS EA-08I-02/05; the activation
DTO is not a grant. Request attempt/continuation correlation is distinct from
the server activation ID; actual critical-delivery state/incident/retry is shown.
The lightweight gate avoids loading emergency assets for ordinary sign-in. Seven focused identity tests and TypeScript/schema checks pass.


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
