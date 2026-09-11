import type { AuthProjectionV1 } from "./generated/AuthProjectionV1";
import type { BrowserVerificationKeySetV1 } from "./generated/BrowserVerificationKeySetV1";
import type { CatalogRootPinV1 } from "./generated/CatalogRootPinV1";
import type { EcP256PublicJwkV1 } from "./generated/EcP256PublicJwkV1";
import type { SignedAuthProjectionV1 } from "./generated/SignedAuthProjectionV1";
import type { SignedBrowserVerificationKeySetV1 } from "./generated/SignedBrowserVerificationKeySetV1";
import {
  CATALOG_ROOT_PINS,
  IDENTITY_REALM_ID,
  IDENTITY_UI_RELEASE_DIGEST,
  IDENTITY_UI_RELEASE_ID,
} from "./generated/release-trust.ts";

const PROJECTION_SIGNATURE_DOMAIN = "metamorph.auth-projection-signature.v1\0";
const KEYSET_SIGNATURE_DOMAIN = "metamorph.browser-key-set-signature.v1\0";
const PROJECTION_DIGEST_DOMAIN = "metamorph.auth-projection.v1\0";
const KEYSET_DIGEST_DOMAIN = "metamorph.browser-key-set.v1\0";
const P256_HALF_ORDER =
  0x7fffffffffffffffffffffffffffffffde737d56d38bcf4279dce5617e3192a8n;

export interface CatalogVerificationExpectation {
  readonly catalogVersion: string;
  readonly realmCatalogDigest: string;
  readonly authProjectionId: string;
  readonly productId: string;
  readonly now: Date;
}

export type DeepReadonly<T> = T extends string | number | boolean | null
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

export interface VerifiedCatalogPair {
  readonly projection: DeepReadonly<AuthProjectionV1>;
  readonly keySet: DeepReadonly<BrowserVerificationKeySetV1>;
}

const TRUSTED_CATALOG_ROOT_PINS = deepFreeze(
  structuredClone(CATALOG_ROOT_PINS),
);

export async function verifyCatalogPair(
  signedProjection: SignedAuthProjectionV1,
  signedKeySet: SignedBrowserVerificationKeySetV1,
  expectation: CatalogVerificationExpectation,
): Promise<VerifiedCatalogPair> {
  // Callers retain their input objects. Snapshot all mutable data before the
  // first await so mutation cannot change what is verified or returned.
  const projectionEnvelope = structuredClone(signedProjection);
  const keySetEnvelope = structuredClone(signedKeySet);
  const trustedExpectation = {
    catalogVersion: expectation.catalogVersion,
    realmCatalogDigest: expectation.realmCatalogDigest,
    authProjectionId: expectation.authProjectionId,
    productId: expectation.productId,
    nowMilliseconds: expectation.now.getTime(),
  };
  const projection = projectionEnvelope.payload;
  const keySet = keySetEnvelope.payload;
  if (
    projectionEnvelope.schemaVersion !== 1 ||
    keySetEnvelope.schemaVersion !== 1 ||
    projection.schemaVersion !== 1 ||
    keySet.schemaVersion !== 1 ||
    projection.realmId !== IDENTITY_REALM_ID ||
    keySet.realmId !== IDENTITY_REALM_ID ||
    projection.catalogVersion !== trustedExpectation.catalogVersion ||
    keySet.catalogVersion !== trustedExpectation.catalogVersion ||
    projection.realmCatalogDigest !== trustedExpectation.realmCatalogDigest ||
    keySet.realmCatalogDigest !== trustedExpectation.realmCatalogDigest ||
    projection.authProjectionId !== trustedExpectation.authProjectionId ||
    projection.productId !== trustedExpectation.productId ||
    projection.identityUiReleaseId !== IDENTITY_UI_RELEASE_ID ||
    projection.identityUiReleaseDigest !== IDENTITY_UI_RELEASE_DIGEST ||
    keySet.realmCatalogDigest !== projection.realmCatalogDigest ||
    keySet.keySetDigest !== projection.verificationKeySetDigest
  ) {
    throw new Error("Signed identity catalogs do not match their trusted context");
  }
  assertLive(
    projection.publishedAt,
    projection.expiresAt,
    trustedExpectation.nowMilliseconds,
  );
  assertLive(
    keySet.publishedAt,
    keySet.expiresAt,
    trustedExpectation.nowMilliseconds,
  );
  if (
    (await digestWithoutField(
      PROJECTION_DIGEST_DOMAIN,
      projection,
      "projectionDigest",
    )) !== projection.projectionDigest ||
    (await digestWithoutField(KEYSET_DIGEST_DOMAIN, keySet, "keySetDigest")) !==
      keySet.keySetDigest
  ) {
    throw new Error("Signed identity catalog digest mismatch");
  }
  const pins = new Map<string, CatalogRootPinV1>();
  for (const pin of TRUSTED_CATALOG_ROOT_PINS) {
    if (pins.has(pin.keyId)) {
      throw new Error("Duplicate catalog root pin");
    }
    assertCanonicalJwk(pin.publicJwk);
    pins.set(pin.keyId, pin);
  }
  await verifyRootSignature(
    PROJECTION_SIGNATURE_DOMAIN,
    projection,
    projectionEnvelope.proof,
    pins,
    projection.publishedAt,
    projection.expiresAt,
    trustedExpectation.nowMilliseconds,
  );
  await verifyRootSignature(
    KEYSET_SIGNATURE_DOMAIN,
    keySet,
    keySetEnvelope.proof,
    pins,
    keySet.publishedAt,
    keySet.expiresAt,
    trustedExpectation.nowMilliseconds,
  );
  const identities = new Set<string>();
  for (const key of keySet.keys) {
    const identity = `${key.issuerId}\0${key.purpose}\0${key.keyId}`;
    const notBefore = Date.parse(key.notBefore);
    const verifyUntil = Date.parse(key.verifyUntil);
    if (
      identities.has(identity) ||
      !Number.isFinite(notBefore) ||
      !Number.isFinite(verifyUntil) ||
      notBefore > verifyUntil ||
      (key.purpose === "productSaasReceipt") !== (key.productId !== null) ||
      (key.productId !== null && key.productId !== trustedExpectation.productId)
    ) {
      throw new Error("Invalid browser verification key set semantics");
    }
    identities.add(identity);
    assertCanonicalJwk(key.publicJwk);
  }
  return deepFreeze({ projection, keySet });
}

async function verifyRootSignature(
  domain: string,
  payload: unknown,
  proof: { algorithm: string; keyId: string; signature: string },
  pins: ReadonlyMap<string, CatalogRootPinV1>,
  publishedAt: string,
  expiresAt: string,
  nowMilliseconds: number,
): Promise<void> {
  const pin = pins.get(proof.keyId);
  if (proof.algorithm !== "ES256" || pin === undefined) {
    throw new Error("Unpinned catalog signature key");
  }
  assertRootAuthorized(pin, publishedAt, expiresAt, nowMilliseconds);
  const jwk = pin.publicJwk;
  const signature = decodeBase64Url(proof.signature, 64);
  const s = signature
    .slice(32)
    .reduce((value, byte) => (value << 8n) | BigInt(byte), 0n);
  if (s === 0n || s > P256_HALF_ORDER) {
    throw new Error("Catalog signature is not canonical low-S ES256");
  }
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
  const input = concatenate(
    new TextEncoder().encode(domain),
    new TextEncoder().encode(canonicalize(payload)),
  );
  if (
    !(await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      signature,
      input,
    ))
  ) {
    throw new Error("Invalid catalog signature");
  }
}

function assertRootAuthorized(
  pin: CatalogRootPinV1,
  publishedAt: string,
  expiresAt: string,
  nowMilliseconds: number,
): void {
  const published = Date.parse(publishedAt);
  const expires = Date.parse(expiresAt);
  const notBefore = Date.parse(pin.notBefore);
  const issueUntil = Date.parse(pin.issueUntil);
  const verifyUntil = Date.parse(pin.verifyUntil);
  if (
    pin.emergencyDenied ||
    ![published, expires, notBefore, issueUntil, verifyUntil, nowMilliseconds].every(
      Number.isFinite,
    ) ||
    notBefore > published ||
    published >= issueUntil ||
    expires > verifyUntil ||
    nowMilliseconds >= verifyUntil
  ) {
    throw new Error("Catalog root is outside its authorized lifecycle");
  }
}

async function digestWithoutField(
  domain: string,
  payload: object,
  omittedField: string,
): Promise<string> {
  const value = { ...(payload as Record<string, unknown>) };
  delete value[omittedField];
  const digest = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      concatenate(
        new TextEncoder().encode(domain),
        new TextEncoder().encode(canonicalize(value)),
      ),
    ),
  );
  return encodeBase64Url(digest);
}

function assertLive(
  publishedAt: string,
  expiresAt: string,
  nowMilliseconds: number,
): void {
  const published = Date.parse(publishedAt);
  const expires = Date.parse(expiresAt);
  if (
    !Number.isFinite(published) ||
    !Number.isFinite(expires) ||
    !Number.isFinite(nowMilliseconds) ||
    published >= expires ||
    nowMilliseconds < published ||
    nowMilliseconds >= expires
  ) {
    throw new Error("Identity catalog is outside its validity interval");
  }
}

function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
}

function assertCanonicalJwk(jwk: EcP256PublicJwkV1): void {
  if (jwk.kty !== "EC" || jwk.crv !== "P-256") {
    throw new Error("Unsupported catalog key");
  }
  decodeBase64Url(jwk.x, 32);
  decodeBase64Url(jwk.y, 32);
}

function decodeBase64Url(
  value: string,
  expectedBytes: number,
): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) {
    throw new Error("Non-canonical base64url");
  }
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(
    value.replaceAll("-", "+").replaceAll("_", "/") + padding,
  );
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  if (bytes.length !== expectedBytes || encodeBase64Url(bytes) !== value) {
    throw new Error("Non-canonical base64url length or padding bits");
  }
  return bytes;
}

function encodeBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function concatenate(
  left: Uint8Array,
  right: Uint8Array,
): Uint8Array<ArrayBuffer> {
  const result = new Uint8Array(left.length + right.length);
  result.set(left);
  result.set(right, left.length);
  return result;
}

// RFC 8785 uses ECMAScript primitive serialization plus recursive UTF-16 key
// ordering. Inputs have already passed the closed JSON schemas.
function canonicalize(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("JCS rejects non-finite numbers");
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
      .join(",")}}`;
  }
  throw new Error("JCS rejects non-JSON values");
}
