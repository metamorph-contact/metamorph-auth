import type { AuthProjectionRegionV1 } from "./generated/AuthProjectionRegionV1";
import type { BrowserInitializationId } from "./generated/BrowserInitializationId";
import type { CatalogId } from "./generated/CatalogId";
import type { Digest32 } from "./generated/Digest32";

const PLACEMENT_DOMAIN = new TextEncoder().encode(
  "metamorph/controller-placement/v1",
);

function decodeBase64Url32(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]{43}$/.test(value)) {
    throw new Error("Expected canonical 32-byte base64url value");
  }
  const standard = `${value.replaceAll("-", "+").replaceAll("_", "/")}=`;
  const binary = atob(standard);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const canonical = btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
  if (bytes.length !== 32 || canonical !== value) {
    throw new Error("Expected canonical 32-byte base64url value");
  }
  return bytes;
}

export async function selectInitialController(
  browserInitializationId: BrowserInitializationId,
  realmCatalogDigest: Digest32,
  regions: readonly AuthProjectionRegionV1[],
): Promise<CatalogId> {
  const candidates = regions
    .filter((region) => region.placementEligible)
    .map((region) => region.regionId)
    // CatalogId is closed ASCII. Relational comparison therefore matches the
    // Rust byte ordering and is independent of browser locale/ICU behavior.
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  if (candidates.length === 0 || new Set(candidates).size !== candidates.length) {
    throw new Error("Controller placement requires unique eligible regions");
  }
  const input = new Uint8Array(PLACEMENT_DOMAIN.length + 1 + 32 + 1 + 32);
  let offset = 0;
  input.set(PLACEMENT_DOMAIN, offset);
  offset += PLACEMENT_DOMAIN.length + 1;
  input.set(decodeBase64Url32(browserInitializationId), offset);
  offset += 33;
  input.set(decodeBase64Url32(realmCatalogDigest), offset);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", input));
  const index = hash.reduce(
    (remainder, byte) => (remainder * 256 + byte) % candidates.length,
    0,
  );
  return candidates[index];
}
