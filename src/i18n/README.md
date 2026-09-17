# Translation ownership

Authentication translations are split by capability rather than collected in
one growing file. Put shared controls, navigation, and protocol errors in
`locales/<locale>/common.json`; authentication flow copy, typed errors, and the
image editor currently own `authentication.json`, `errors.json`, and
`image-editor.json`. A feature that grows beyond a small group adds
`locales/<locale>/<feature>.json` and registers that module in `index.ts`.
Duplicate keys fail during bundle assembly rather than silently overriding
another module.

Catalog-selected product and region names remain in `catalog.json`; their keys
are admitted by the immutable identity UI release. Never construct a message
key by parsing a product or region identifier. Backend messages are diagnostic
only: the UI displays a local translation selected by the typed error code.

Every supported locale must implement the same key inventory. New routes always
include the locale path segment and must be prefetched with that segment.

Plan 09 F owns `locales/en/scim.json` for its live SCIM pages, including primary-email verification, capability expiry, exact uncertain retry, pending provisioning and owner unavailable states.
