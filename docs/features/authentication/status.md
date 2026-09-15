# Shared Identity Frontend Status

## Plan 07 E — 2026-09-15

Owned typed social entry/start consumers are implemented. Current advisory
provider choices render without requiring email; exact command custody, safe
typed errors, expiry/suspension teardown and guarded post-fade navigation are
implemented. Rust-owned 13-operation schemas/types/routes and identical
standalone validators regenerate. Native callbacks remain server GET/303
continuations into the existing canonical signup/admission/account chooser;
there is no social password evidence or browser OAuth token/code handling.
Provider/transport doubles and focused existing protocol checks pass, not actual
configured-provider/CSI qualification. Final reviews/checks and real supplier/
human handoffs are recorded in the SaaS Plan 07 execution/EA-07I ledger.
Final E evidence: 37 focused checks, TypeScript, Rust-owned 2,037-artifact drift,
derived validator checks and quick production asset admission pass. Initial JS
is 288,838 gzip bytes under the unchanged 330 KiB budget. All three final readonly
reviews are CLEAN, including the retained exact-attempt post-fade deadline fix.

- Date: 2026-09-15
- State: CSI-17 development slice accepted by the human; CSI-18 documentation
  reset implemented, long-running tests deferred
- Repository: Development-in-progress
- Contracts: Mutable
- Plan 05: U-label email domains now use the same A-label wire key as ASCII
  domains; signup has a localized verified-owner conflict. Octamorph now owns live Plan 05 admin UI routes; actual admin owner composition and live SSO remain open (see the SaaS Plan 05 integrator ledger).
- Plan 05 main reconciliation: source manifests are regenerated after SaaS
  main `c816115`, Auth `f11441b` and Octamorph `e7db528`. A-label normalization
  and the verified-owner conflict coexist with the route-move receipt consumer;
  enterprise wire shapes and preview/live gates are unchanged.
- Plan 05 catalog supplier: signed development publication advances to
  `central-development-20` for the backend-owned federation callback and realm
  current/overlap locator supplier contract. Browser projection/schema ownership
  is unchanged; this publication does not activate enterprise UI, SSO or a domain
  namespace switch. Coordinated consumers and shared global admission remain
  open in the SaaS Plan 05 ledger.
- Human testing: Development slice accepted 2026-09-13; long-running tests deferred
- Runtime composition: Implemented for the loopback development graph
- Octamorph cutover: Implemented; development slice accepted by the human
- Plan 01: `EA-01A`–`EA-01L` development-only previews implemented across all
  57 screens; the recipient inbox now consumes authorization-owned generated
  DTOs and typed fixtures. Human preview exercise is pending. Its production
  route remains gated on `VER-OWN-001` guarded handlers.
- Plan 02 Packet G: the generated CSI-07 account-selection request and protocol
  client accept the optional source-P `productRouteMoveReceipt`. A focused
  client test verifies exact forwarding. Generic sign-in still omits the field
  because it preserves the product region selected before start; no product
  operation currently requests P→P′ relocation.

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

The subsequent product completion correction removes the obsolete browser
activation request/result DTO exports from the generated CSI-09 snapshot.
Metamorph Auth does not call the product return-completion endpoint; its own
presentation and identity flows are unchanged.

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

Plan 01 packet I expands the lazy development preview to `SCR-IDN-001` and
`SCR-IDN-011`–`SCR-IDN-017`. It uses a flow-scoped generated method DTO,
generated target-admission data, and the existing CSI account/signup/email/
organization/recovery/finalization response shapes. All twelve scenario states
are deterministic. Preview selection has no credential, session, or return
effect. The production build excludes the preview path and fixture marker;
the enterprise live adapter still fails closed. Focused type, fixture/router,
CSI continuity, generated-contract, and production-bundle checks pass. The
human has not yet exercised these previews; live enterprise methods remain for
the later wiring plans.

Packet J adds separate lazy development previews for passkey, TOTP, recovery
code, first-login/step-up, and factor-recovery status. Typed generated
challenges and progress never become a verified credential or action proof in
the fixture. Manual TOTP setup is first-display only and scrubbed on pagehide;
code entry clears before dispatch. Ready, unavailable, replay/expiry, hold,
approval, repudiation, and regional/provider states have focused fixture and
route checks. Production still excludes every enterprise preview module.

Packet K adds a third lazy development preview for SAML/OIDC, SSO-only and
emergency entry, JIT profile completion, and human SCIM activation. It never
follows a provider URL or consumes a callback proof; the preview guard scrubs
unexpected fragments. The typed fixture distinguishes identity verification
from target access. Focused type, fixture/router/fragment, generated-contract,
and production-exclusion checks pass. Packet L later consumed the separate
authorization recipient DTO/fixture pack published by `AUTH-RI-A`.

Packet L adds a fourth development-only lazy preview for the recipient inbox.
It uses closed generated authorization DTOs for controller bootstrap,
identity-home list/detail, accept/reject, and operation status, with synthetic
typed fixtures. The teaser omits tenant, inviter, target, and invitation ID;
the simulated emailed token stays in memory and never appears in a URL or
rendered text. The emailed-link preview gives no full offer detail until a
confirmed decision; tokenless detail is denied. Pinned decisions, token-required
claims, pending receipts,
completed/rejected history, local skip, stale and uncertain states have focused
fixture/router checks. The production build excludes the preview and fixture
marker. No live recipient endpoint or grant path is registered; that remains
`AUTH-RI-B`–`AUTH-RI-E`/`VER-OWN-001` in authorization.

Plan 03 raises the common password client's raw UTF-8 admission bound to
16 KiB for signup, recovery and sign-in, matching the identity-home verifier.
The rendered sign-in, signup and recovery controls use that same byte boundary,
and all three generated request schemas publish it explicitly.
Only those three password endpoints permit up to 128 KiB of JSON-escaped
request framing; other requests retain the 64-KiB client limit. Focused client,
HTTP and TypeScript checks pass. Live factor/profile clients remain gated on
their identity-home ceremonies and action-proof/session integration.

Plan 03 packet E adds a typed browser WebAuthn evidence adapter for identity
assertion and registration. It maps the closed ES256/RS256/EdDSA profile,
resident-key and user-verification options, rejects noncanonical or expired
challenge input, passes the browser abort signal, and returns only credential
evidence for identity-home verification. Focused adapter, fixture, and type
checks pass. The adapter does not issue a session. The Plan 01 ceremony preview
remains a development-only fixture. EA-00J now generates the 42 Plan 03
request/response schemas, typed maps and exact EA-00H route metadata for both
browser consumers. This client uses precompiled validators under the production
CSP, validates its serialized request, UTF-8 field bounds and canonical
idempotency binding, omits browser credentials, and checks bounded,
duplicate-free responses against the exact per-route schema, status, media,
failure-profile and canonical `Retry-After` contract. Anonymous recovery start
uses a closed transport-failure allowlist so account-specific method or state
errors cannot cross the public entry boundary. The focused
decoder/request suite and TypeScript check pass. Account-session/evidence composition and binding the
staged client to the catalog-selected live identity transport remain deferred
to the Plan 03 integrator after their Plan 02/00/04/11
owners supply the required gates. The staged identity-home verifier now accepts
ES256, bounded RS256 and Ed25519; a live owner must still negotiate the
effective-policy algorithm and attestation profile before issuing options.
No passkey or factor-recovery route is live.

Plan 02 Packet G refreshes the mutable CSI-07 browser snapshot for the optional
product-route-move receipt and forwards it only when a caller supplies the
source-P proof. This is the browser consumer for Packet B's explicit
relocation branch. Ordinary account selection passes no receipt and therefore
cannot turn identity-home navigation into a product-region move. Metamorph
Auth owns no profile/admin session-device screen rows; those live routes are in
Octamorph.

Main reconciliation includes Plan 02G account-selection receipt forwarding. Plan 03 still owns action-specific proof issuance for the live session/device consumer and production factor/profile ceremony composition; the consumer receipt and staged browser evidence do not produce a proof.

Plan 04 main reconciliation preserves its generated tenant-policy workspace
and simulation types alongside Packet G's optional source-P route receipt.
Forced frontend typecheck, four focused identity protocol tests, the CSI-07
snapshot check and all 1,795 declared enterprise artifact checks pass;
this adds no identity-owned profile/admin session screen or authentication
authority. The existing live-method and operator handoff gaps remain.


## Plan 04 current-main reconciliation (2026-09-15)

Plan 03 main is merged into `codex/plan04` with Plan 02G account-selection
receipt forwarding and Plan 04's policy/simulation types preserved. The combined
Rust owner regenerates the enterprise pack. No generated/schema file is edited
by hand. Plan 04 now supplies compiled active/pending policy to Plan 03's
factor/strong-action/password-replacement cores; this does not install a public
identity ceremony or non-password CSI issuer. The existing feature brief and
identity presentation/credential ownership remain accurate. Actual protected
proof admission, live factor/profile/recovery composition and external notice/
private/session-owner effects remain recorded in SaaS EA-04I. No database,
expensive or human integration qualification is claimed.

EA-04I final combined-owner validation: 20 focused request/response/passkey
tests, TypeScript check, generated validator and contract consumer checks,
and the combined 1,969-artifact Rust export drift check pass. Both read-only
integration reviewers returned CLEAN after fixes, before commit. This change
regenerates contracts and preserves main's typed boundaries; the owning
presentation intent remains accurate. Live producer gates and human browser
and Tauri testing remain deferred; no database tests ran.

## Plan 04 main landing (2026-09-15)

The reviewed combined Rust-owned contract and typed identity boundary reconciliation
landed on development main at `86941ee`. This landing preserves the
recorded cheap-check and CLEAN read-only review results; no additional feature
behavior changed during the merge. Remaining external owner capabilities and
live adapter installation stay deferred in the SaaS EA-04I integrator packet.
Main landing does not establish full live Plan 04 completion or human acceptance.
No database or expensive qualification ran for this merge.

## Plan 05 merge integration (2026-09-15, in progress)

The `codex/plan05` branch incorporates Plans 02–04 and regenerates the
shared provider rotation contracts with an optional first primary binding and
explicit new-material expiry. TypeScript, runtime/Plan 03 validator checks and
the 21 focused protocol/presentation tests pass. Existing Auth behavior remains
accurate; Plan 05 administration belongs to Octamorph and the SaaS owner. This
integration passed the final read-only contract, database and security reviews.

Plan 05's typed live client work corrects the shared identifier/claim-value
schema to include the control/bidi restriction already enforced by Rust.
The owning pack regenerates this consumer manifest. Existing Auth presentation,
wire types and Plan 03 validator behavior remain accurate; no identity UI or
authority is added by this schema correction.

The regenerated consumer manifest and unchanged Plan 03 validators pass their
checks. All three Plan 05 read-only re-reviewers returned CLEAN after fixes.

The catalog20 supplier publication passes the owning exporter drift check,
exact signed-publication verification/check and frontend TypeScript. All three
readonly supplier reviewers returned CLEAN; the SaaS integrator remains open.

Plan 05 proof-epoch consumer update (2026-09-15): regenerated enterprise
contracts expose current proof state and stored `proofRouteEpoch` on domain cards/challenge summaries
separately from verified discovery authority. Shared identity presentation does
not use that field or perform domain administration. Octamorph owns the live
admin controls. The operator deferred browser/Yugabyte execution for this
development merge and will run end-to-end verification separately; remaining
producer/deployment work stays in SaaS EA-05I.

Final development handoff verification: Rust compile (including test targets),
TypeScript in both consumers, frontend lint/format, generated contract/validator
drift checks and all three read-only reviews pass for this cut. Targeted Clippy
completed with warnings; no browser or Yugabyte execution was performed.
The operator owns end-to-end verification and the EA-05I residual ledger remains
open.

## Plan 06 C contract consumption — 2026-09-15

Rust-owned enterprise schemas, TypeScript and manifests regenerate for explicit
SAML handoff confirmation: `confirm_federation`, revision-bound
`SamlHandoffContinue`, and the separate classified flow-CSRF/idempotent JSON
callback continuation binding. Targeted typechecking and generated contract fixtures/drift pass. Five affected federation fixture tests pass; the SAML handoff fixture
now returns confirmation. This changes the mutable contract pack, not live browser/CSI admission. Plan 06 G owns browser
composition; actual owner gates and human testing remain in the SaaS EA-06I
ledger. Existing route/fixture and production fail-closed documentation remains
accurate.

## Plan 06 D server admission boundary — 2026-09-15

SaaS now owns immutable enterprise-subject links and sealed JIT profile commands
with separate canonical identity-home staging. Provider email never authorizes
linking or primary email; actual pre-account/global/privacy/media and CSI
strong-action suppliers remain mandatory EA-06I gates. This client has no new
live JIT/session adapter. The existing generated profile/challenge/privacy DTOs
remain accurate and unchanged; Plan 06 G owns their browser composition.

## Plan 06 E server authority boundary — 2026-09-15

SaaS E adds provider reservations/logout floors and non-effective H candidates.
Real CSI non-password session publication and all-issuer H/P proof composition
remain mandatory integrator gates; cached provider receipts grant no access.
Existing generated profile/confirmation/continuation DTOs and fixtures remain
accurate: E adds internal authenticated owner types and no public wire/UI change.
The coordinated EA-02H generated dependency/receipt amendment is still open in
SaaS EA-06I-08. Plan 06 F/G own later assurance/browser composition.

## Plan 06 F server assurance boundary — 2026-09-15

SaaS F owns admitted provider-test/receipt gates, explicit assurance mapping,
action-bound reauthentication and authenticated logout. Actual admin test launch,
current CSI/action publisher and distinct catalog logout registrations remain
mandatory integrator gates. No client or public session route is enabled.
Existing generated provider/profile/continuation/strong-action DTOs remain
accurate and unchanged; Plan 06 G owns browser composition and human handoff.

F's 45 unit/four focused Yugabyte/five import checks and all readonly delta
reviews pass; canonical focused schema was recreated and removed. Final source,
original callback, local-proof and action deadlines hold; unsatisfied provider
reauthentication contributes no fallback assurance. Public/generated contracts
remain accurate. Human and actual configured-provider/CSI qualification remain
open in the SaaS integrator ledger.

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

## Plan06 main reconciliation — 2026-09-15

Imported main's EA-02H authority-freshness key/vector/deadline contracts and
regenerated the combined Rust-owned manifest. Plan06 federation journeys remain
bound to current CSI owner admission; a regional lease does not grant a session.
The existing README and transport documentation remain accurate.
