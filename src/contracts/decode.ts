import type { ValidateFunction } from "ajv";

import {
  browserKeySet as generatedKeySetValidator,
  catalogProjection as generatedProjectionValidator,
} from "./runtime-validators.generated.ts";
import type { SignedAuthProjectionV1 } from "./generated/SignedAuthProjectionV1";
import type { SignedBrowserVerificationKeySetV1 } from "./generated/SignedBrowserVerificationKeySetV1";

const projectionValidator = generatedProjectionValidator as ValidateFunction<SignedAuthProjectionV1>;
const keySetValidator = generatedKeySetValidator as ValidateFunction<SignedBrowserVerificationKeySetV1>;
const MAX_PROJECTION_BYTES = 256 * 1024;
const MAX_KEY_SET_BYTES = 128 * 1024;

export class IdentityCatalogDecodeError extends Error {
  constructor(kind: "auth projection" | "browser verification key set", validator: ValidateFunction) {
    const details = validator.errors?.slice(0, 8).map((error) =>
      `${error.instancePath || "/"} ${error.message ?? "is invalid"}`,
    ).join("; ");
    super(`Invalid ${kind}${details === undefined ? "" : `: ${details}`}`);
    this.name = "IdentityCatalogDecodeError";
  }
}

export class IdentityCatalogDuplicateKeyError extends Error {
  constructor(key: string) {
    super(`Identity catalog JSON contains duplicate member ${JSON.stringify(key)}`);
    this.name = "IdentityCatalogDuplicateKeyError";
  }
}

function decodeSignedAuthProjection(
  input: unknown,
): SignedAuthProjectionV1 {
  if (!projectionValidator(input)) {
    throw new IdentityCatalogDecodeError("auth projection", projectionValidator);
  }
  return input;
}

function decodeSignedBrowserVerificationKeySet(
  input: unknown,
): SignedBrowserVerificationKeySetV1 {
  if (!keySetValidator(input)) {
    throw new IdentityCatalogDecodeError(
      "browser verification key set",
      keySetValidator,
    );
  }
  return input;
}

export function decodeSignedAuthProjectionText(
  text: string,
): SignedAuthProjectionV1 {
  return decodeBoundedJson(text, MAX_PROJECTION_BYTES, decodeSignedAuthProjection);
}

export function decodeSignedBrowserVerificationKeySetText(
  text: string,
): SignedBrowserVerificationKeySetV1 {
  return decodeBoundedJson(
    text,
    MAX_KEY_SET_BYTES,
    decodeSignedBrowserVerificationKeySet,
  );
}

function decodeBoundedJson<T>(
  text: string,
  maxBytes: number,
  decode: (input: unknown) => T,
): T {
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new Error("Identity catalog response exceeds its byte limit");
  }
  rejectDuplicateObjectKeys(text);
  return decode(JSON.parse(text) as unknown);
}

/** Shared strict JSON ingress for generated protocol schemas. */
export function decodeBoundedJsonText(text: string, maxBytes: number): unknown {
  return decodeBoundedJson(text, maxBytes, (value) => value);
}

function rejectDuplicateObjectKeys(text: string): void {
  const maxDepth = 64;
  let index = 0;

  function skipWhitespace(): void {
    while (
      index < text.length &&
      (text[index] === " " ||
        text[index] === "\t" ||
        text[index] === "\r" ||
        text[index] === "\n")
    ) {
      index += 1;
    }
  }

  function scanString(): string {
    const start = index;
    if (text[index] !== '"') {
      throw new SyntaxError("Expected a JSON string");
    }
    index += 1;
    while (index < text.length) {
      const character = text[index];
      if (character === '"') {
        index += 1;
        const decoded = JSON.parse(text.slice(start, index)) as unknown;
        if (typeof decoded !== "string") {
          throw new SyntaxError("Expected a JSON string");
        }
        return decoded;
      }
      if (character === "\\") {
        index += 2;
      } else {
        index += 1;
      }
    }
    throw new SyntaxError("Unterminated JSON string");
  }

  function scanPrimitive(): void {
    const start = index;
    while (
      index < text.length &&
      ![",", "]", "}", " ", "\t", "\r", "\n"].includes(text[index] ?? "")
    ) {
      index += 1;
    }
    if (index === start) {
      throw new SyntaxError("Expected a JSON value");
    }
  }

  function scanArray(depth: number): void {
    if (depth > maxDepth) {
      throw new SyntaxError("Identity catalog JSON exceeds its nesting limit");
    }
    index += 1;
    skipWhitespace();
    if (text[index] === "]") {
      index += 1;
      return;
    }
    while (index < text.length) {
      scanValue(depth);
      skipWhitespace();
      if (text[index] === "]") {
        index += 1;
        return;
      }
      if (text[index] !== ",") {
        throw new SyntaxError("Expected a JSON array delimiter");
      }
      index += 1;
      skipWhitespace();
    }
    throw new SyntaxError("Unterminated JSON array");
  }

  function scanObject(depth: number): void {
    if (depth > maxDepth) {
      throw new SyntaxError("Identity catalog JSON exceeds its nesting limit");
    }
    index += 1;
    const keys = new Set<string>();
    skipWhitespace();
    if (text[index] === "}") {
      index += 1;
      return;
    }
    while (index < text.length) {
      const key = scanString();
      if (keys.has(key)) {
        throw new IdentityCatalogDuplicateKeyError(key);
      }
      keys.add(key);
      skipWhitespace();
      if (text[index] !== ":") {
        throw new SyntaxError("Expected a JSON member separator");
      }
      index += 1;
      scanValue(depth);
      skipWhitespace();
      if (text[index] === "}") {
        index += 1;
        return;
      }
      if (text[index] !== ",") {
        throw new SyntaxError("Expected a JSON object delimiter");
      }
      index += 1;
      skipWhitespace();
    }
    throw new SyntaxError("Unterminated JSON object");
  }

  function scanValue(depth: number): void {
    skipWhitespace();
    if (text[index] === "{") {
      scanObject(depth + 1);
    } else if (text[index] === "[") {
      scanArray(depth + 1);
    } else if (text[index] === '"') {
      scanString();
    } else {
      scanPrimitive();
    }
  }

  scanValue(0);
  skipWhitespace();
  if (index !== text.length) {
    throw new SyntaxError("Trailing JSON data");
  }
}
