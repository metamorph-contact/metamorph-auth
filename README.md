# Metamorph SaaS identity UI

This repository owns the common identity frontend. CSI-05 installs its catalog
contracts, immutable presentation inventory, translations, and approved assets.
CSI-06 adds generated identity-controller request/response contracts and JSON
schemas under the `csi06` directories. React pages and application scaffolding
belong to CSI-11.

Do not hand-edit `src/contracts/generated` or `src/contracts/schemas`; regenerate
catalog artifacts through the `identity_catalog export-contracts` command and
CSI-06 artifacts through `identity_controller_contracts export-contracts`, then
run `npm run check:contracts`. `generated/release-trust.ts` is the build-
bound UI release/root trust input; never replace its values with fields from a
downloaded projection or caller input. Browser code must use the bounded text
decoders, which reject duplicate member names before strict schema validation,
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
