# Metamorph Auth

This repository owns the common identity frontend. CSI-11 and CSI-12 built and
reviewed the application; CSI-15 now composes its catalog-admitted release with
the SaaS-owned regional authentication surfaces and cuts Octamorph over to that
protocol. The React/TanStack application, catalog-bound regional client,
browser recovery state, translations, controlled themes/assets, signup and
recovery flows, destination finalization, and logout UI are implemented. See the
[`authentication feature`](docs/features/authentication/README.md).

Repository documentation and update rules are defined in
[`docs/README.md`](docs/README.md). The repository remains
development-in-progress until the human operator explicitly changes that
status.

Do not hand-edit `src/contracts/generated` or `src/contracts/schemas`; regenerate
catalog artifacts through the `identity_catalog export-contracts` command and
the current CSI snapshots through `identity_controller_contracts
export-contracts`; CSI-06 remains immutable historical output. Then run `npm
run check:contracts`. `generated/release-trust.ts` is the build-bound UI
release/root trust input; never replace its values with fields from a
downloaded projection or caller input. Packet `EA-00J` enterprise design
contracts are generated into `src/contracts/generated/enterprise-security-v1`;
run `npm run check:ea00j` for the pinned manifest, fixture/schema rejection,
and TypeScript checks. They do not replace the current CSI runtime client.
Plan 02 Packet G refreshes that current CSI client with the optional
source-P-signed product-route-move receipt; generic account selection omits it
unless an explicit product relocation supplies the proof.
Browser code must use the bounded text decoders, which reject duplicate member
names before strict schema validation,
then call `verifyCatalogPair` with only the protected transaction's catalog
version/digest, projection, product, and current clock. Theme changes must pass
the same `@polymorph/theme` admission used by the catalog authoring/check CLI.
Verification snapshots caller data and build trust before asynchronous crypto,
then returns recursively frozen, deeply read-only catalog values; consumers
must not clone them into mutable trusted state.
Presentation changes require a new immutable UI release and identity catalog
version. Product content may select only cataloged message, asset, theme, and
layout IDs; it cannot add HTML, CSS, script, or remote URLs. Immutable images
load from the cataloged same-site asset origin through anonymous CORS. Every
HTML/React renderer must set `crossOrigin="anonymous"`; the browser sends the
common-UI `Origin`, omits credentials, and requires the listener to return that
exact allowed origin without credential permission.
