import { readFile } from "node:fs/promises";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  IdentityCatalogDuplicateKeyError,
  decodeSignedAuthProjectionText,
} from "../src/contracts/decode.ts";
import { selectInitialController } from "../src/contracts/controller-placement.ts";

const root = new URL("../", import.meta.url);
const schema = JSON.parse(
  await readFile(new URL("src/contracts/schemas/identity-ui-release-v1.schema.json", root)),
);
const release = JSON.parse(
  await readFile(new URL("catalog/identity-ui-release.development.json", root)),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addFormat("uint16", {
  type: "number",
  validate: (value) => Number.isInteger(value) && value >= 0 && value <= 65_535,
});
ajv.addFormat("uint32", {
  type: "number",
  validate: (value) => Number.isInteger(value) && value >= 0 && value <= 4_294_967_295,
});
const validate = ajv.compile(schema);
if (!validate(release)) {
  console.error(ajv.errorsText(validate.errors, { separator: "\n" }));
  process.exitCode = 1;
}

const withUnknownField = structuredClone(release);
withUnknownField.unknown = true;
if (validate(withUnknownField)) {
  throw new Error("runtime schema accepted an unknown release field");
}

for (const duplicate of [
  '{"schemaVersion":1,"schemaVersion":1}',
  '{"payload":{"realmId":"a","\\u0072ealmId":"b"}}',
]) {
  try {
    decodeSignedAuthProjectionText(duplicate);
    throw new Error("strict catalog decoder accepted a duplicate JSON member");
  } catch (error) {
    if (!(error instanceof IdentityCatalogDuplicateKeyError)) {
      throw error;
    }
  }
}

const overlyNested = `${"[".repeat(65)}null${"]".repeat(65)}`;
try {
  decodeSignedAuthProjectionText(overlyNested);
  throw new Error("strict catalog decoder accepted excessive JSON nesting");
} catch (error) {
  if (!(error instanceof SyntaxError)) {
    throw error;
  }
}

const placementVectors = JSON.parse(
  await readFile(new URL("catalog/controller-placement-v1.vectors.json", root)),
);
for (const vector of placementVectors.vectors) {
  const selected = await selectInitialController(
    vector.browserInitializationId,
    vector.realmCatalogDigest,
    vector.eligibleRegionIds.map((regionId) => ({
      regionId,
      placementEligible: true,
    })),
  );
  if (selected !== vector.expectedRegionId) {
    throw new Error(`controller placement drifted for ${vector.browserInitializationId}`);
  }
}

await selectInitialController(
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB",
  "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE",
  [{ regionId: "only", placementEligible: true }],
).then(
  () => {
    throw new Error("placement accepted a non-canonical base64url value");
  },
  () => undefined,
);
