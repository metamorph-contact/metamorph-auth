import { readFile } from "node:fs/promises";

import {
  decodeSignedAuthProjectionText,
  decodeSignedBrowserVerificationKeySetText,
} from "../src/contracts/decode.ts";
import {
  CATALOG_ROOT_PINS,
  IDENTITY_REALM_ID,
  IDENTITY_UI_RELEASE_DIGEST,
  IDENTITY_UI_RELEASE_ID,
} from "../src/contracts/generated/release-trust.ts";
import { verifyCatalogPair } from "../src/contracts/verify.ts";

const fixture = JSON.parse(await readFile(process.argv[2], "utf8"));
const expectation = {
  ...fixture.expectation,
  now: new Date(fixture.expectation.now),
};
if (fixture.projection.payload.realmId !== IDENTITY_REALM_ID) {
  throw new Error("Rust fixture does not match the build-bound identity realm");
}

const verifiedFixture = await verifyCatalogPair(
  decodeSignedAuthProjectionText(JSON.stringify(fixture.projection)),
  decodeSignedBrowserVerificationKeySetText(JSON.stringify(fixture.keySet)),
  expectation,
);
assertDeeplyFrozen(verifiedFixture);

const mutableProjection = decodeSignedAuthProjectionText(
  JSON.stringify(fixture.projection),
);
const mutableKeySet = decodeSignedBrowserVerificationKeySetText(
  JSON.stringify(fixture.keySet),
);
const mutableExpectation = {
  ...expectation,
  now: new Date(expectation.now),
};
const expectedProductOrigin = mutableProjection.payload.productUiOrigin;
const pendingVerification = verifyCatalogPair(
  mutableProjection,
  mutableKeySet,
  mutableExpectation,
);
mutableProjection.payload.productUiOrigin = "http://mutated.invalid";
mutableKeySet.payload.keys[0].emergencyDenied = true;
mutableExpectation.now.setTime(Number.NaN);
const originalRootDenial = CATALOG_ROOT_PINS[0].emergencyDenied;
CATALOG_ROOT_PINS[0].emergencyDenied = true;
let stableVerification;
try {
  stableVerification = await pendingVerification;
} finally {
  CATALOG_ROOT_PINS[0].emergencyDenied = originalRootDenial;
}
if (stableVerification.projection.productUiOrigin !== expectedProductOrigin) {
  throw new Error("browser verifier returned data mutated across an await boundary");
}
assertDeeplyFrozen(stableVerification);
try {
  stableVerification.projection.productUiOrigin = "http://mutated.invalid";
  throw new Error("verified catalog result remained mutable");
} catch (error) {
  if (!(error instanceof TypeError)) {
    throw error;
  }
}

async function mustReject(name, change) {
  const candidate = structuredClone(fixture);
  change(candidate);
  let rejected = false;
  try {
    await verifyCatalogPair(
      decodeSignedAuthProjectionText(JSON.stringify(candidate.projection)),
      decodeSignedBrowserVerificationKeySetText(JSON.stringify(candidate.keySet)),
      {
        ...candidate.expectation,
        now: new Date(candidate.expectation.now),
      },
    );
  } catch {
    rejected = true;
  }
  if (!rejected) {
    throw new Error(`browser verifier accepted ${name}`);
  }
}

await mustReject("a tampered presentation", (value) => {
  value.projection.payload.presentation.productNameMessageKey = "tampered.name";
});
await mustReject("an unknown signed projection field", (value) => {
  value.projection.payload.unexpected = true;
});
await mustReject("an unpinned kid", (value) => {
  value.projection.proof.keyId = "untrusted-root";
});
await mustReject("the wrong protected catalog digest", (value) => {
  value.expectation.realmCatalogDigest = "A".repeat(43);
});
await mustReject("the wrong identity UI release", (value) => {
  value.projection.payload.identityUiReleaseId = "wrong-release";
});
await mustReject("an expired artifact", (value) => {
  value.expectation.now = value.projection.payload.expiresAt;
});
await mustReject("an invalid verifier clock", (value) => {
  value.expectation.now = "not-a-time";
});
await mustReject("a malformed receipt-key lifecycle", (value) => {
  value.keySet.payload.keys[0].notBefore = "not-a-time";
});
await mustReject("a high-S signature", (value) => {
  const order =
    0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;
  const raw = decodeBase64Url(value.projection.proof.signature);
  const s = raw
    .slice(32)
    .reduce((result, byte) => (result << 8n) | BigInt(byte), 0n);
  let high = order - s;
  for (let index = 63; index >= 32; index -= 1) {
    raw[index] = Number(high & 0xffn);
    high >>= 8n;
  }
  value.projection.proof.signature = encodeBase64Url(raw);
});

await verifyCatalogPair(
  decodeSignedAuthProjectionText(JSON.stringify(fixture.projection)),
  decodeSignedBrowserVerificationKeySetText(JSON.stringify(fixture.keySet)),
  {
    ...expectation,
    realmId: "attacker-realm",
    identityUiReleaseId: "attacker-release",
    identityUiReleaseDigest: "A".repeat(43),
    rootPins: [
      {
        ...CATALOG_ROOT_PINS[0],
        publicJwk: fixture.keySet.payload.keys[0].publicJwk,
      },
    ],
  },
);

if (
  fixture.projection.payload.identityUiReleaseId !== IDENTITY_UI_RELEASE_ID ||
  fixture.projection.payload.identityUiReleaseDigest !== IDENTITY_UI_RELEASE_DIGEST
) {
  throw new Error("Rust fixture does not match build-bound identity UI release trust");
}

function decodeBase64Url(value) {
  const binary = atob(
    value.replaceAll("-", "+").replaceAll("_", "/") +
      "=".repeat((4 - (value.length % 4)) % 4),
  );
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeBase64Url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function assertDeeplyFrozen(value) {
  if (value !== null && typeof value === "object") {
    if (!Object.isFrozen(value)) {
      throw new Error("verified catalog result is not recursively frozen");
    }
    for (const child of Object.values(value)) {
      assertDeeplyFrozen(child);
    }
  }
}
