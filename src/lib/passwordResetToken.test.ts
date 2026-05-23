/**
 * Unit tests for the pure token helpers (no DB).
 *
 * createResetTokenForUser / verifyResetToken / markTokenUsed all hit the DB
 * and are covered by integration / e2e tests in a real Postgres environment.
 * Here we exercise the deterministic primitives.
 */

import { describe, it, expect } from "vitest";
import { generateResetToken, hashToken, RESET_TOKEN_TTL_MS } from "./passwordResetToken";

describe("generateResetToken", () => {
  it("returns a base64url plaintext and a 64-char sha256 hex hash", () => {
    const t = generateResetToken();
    // base64url of 32 bytes = 43 chars, no padding.
    expect(t.plaintext).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(t.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces a different plaintext every call (entropy sanity)", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    const c = generateResetToken();
    expect(a.plaintext).not.toBe(b.plaintext);
    expect(b.plaintext).not.toBe(c.plaintext);
    expect(a.plaintext).not.toBe(c.plaintext);
  });

  it("hash equals hashToken(plaintext) — round-trip works", () => {
    const t = generateResetToken();
    expect(hashToken(t.plaintext)).toBe(t.hash);
  });
});

describe("hashToken", () => {
  it("is deterministic — same input maps to same hash", () => {
    expect(hashToken("hello")).toBe(hashToken("hello"));
  });

  it("differs for one-character changes (avalanche)", () => {
    const a = hashToken("password-reset-token-aaaa");
    const b = hashToken("password-reset-token-aaab");
    expect(a).not.toBe(b);
    // Avalanche: changing one byte should change ~half the hash bits.
    let differing = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) differing++;
    expect(differing).toBeGreaterThan(20); // out of 64 hex chars
  });

  it("returns 64 hex chars", () => {
    expect(hashToken("")).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken("x")).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("RESET_TOKEN_TTL_MS", () => {
  it("is 60 minutes (matches DEPLOY.md + email copy)", () => {
    expect(RESET_TOKEN_TTL_MS).toBe(60 * 60 * 1000);
  });
});
