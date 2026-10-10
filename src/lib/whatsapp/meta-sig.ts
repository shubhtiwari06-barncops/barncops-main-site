import { createHmac, timingSafeEqual } from "node:crypto";

/** Timing-safe string compare. Different lengths are a miss, never a throw. */
export function safeEqualStr(a: string, b: string): boolean {
  const left = Buffer.from(String(a ?? ""), "utf8");
  const right = Buffer.from(String(b ?? ""), "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Meta X-Hub-Signature-256: HMAC-SHA256 of the RAW body with META_APP_SECRET.
 * Header form: "sha256=<hex>". Missing secret, missing header, bad length, or
 * mismatch → false. Fail closed. Never log the body.
 */
export function verifyMetaSignature(
  raw: Buffer | string,
  header: string | null | undefined,
  secret: string | undefined,
): boolean {
  if (!secret) return false;
  const h = String(header || "").trim();
  if (!h.toLowerCase().startsWith("sha256=")) return false;
  const given = h.slice(7);
  const body = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  if (given.length !== expected.length) return false;
  return safeEqualStr(given.toLowerCase(), expected);
}

export function verifyHubToken(token: string | null, expected: string | undefined): boolean {
  if (!token || !expected) return false;
  return safeEqualStr(token, expected);
}

export function signMetaBody(raw: Buffer | string, secret: string): string {
  const body = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  return "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
}
