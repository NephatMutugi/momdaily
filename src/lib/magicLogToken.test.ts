import { describe, it, expect, beforeAll } from "vitest";
import { signMagicLogToken, verifyMagicLogToken } from "./magicLogToken";

// Vitest unit tests are isolated from .env loading, so seed the secret here.
beforeAll(() => {
  process.env.NEXTAUTH_SECRET =
    "test-secret-do-not-use-in-production-test-secret-do-not-use-in-production";
});

describe("magicLogToken", () => {
  it("round-trips a valid payload", async () => {
    const token = await signMagicLogToken({
      userId: "user-1",
      habitId: "habit-a",
      value: true,
    });
    const result = await verifyMagicLogToken(token);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload).toEqual({
        userId: "user-1",
        habitId: "habit-a",
        value: true,
      });
    }
  });

  it("rejects a tampered token", async () => {
    const token = await signMagicLogToken({
      userId: "user-1",
      habitId: "habit-a",
      value: true,
    });
    // Flip a character in the payload section (middle segment).
    const parts = token.split(".");
    const tampered = [parts[0], parts[1]!.slice(0, -2) + "AA", parts[2]].join(
      "."
    );
    const result = await verifyMagicLogToken(tampered);
    expect(result.ok).toBe(false);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signMagicLogToken({
      userId: "user-1",
      habitId: "habit-a",
      value: true,
    });
    const originalSecret = process.env.NEXTAUTH_SECRET;
    process.env.NEXTAUTH_SECRET = "a-totally-different-secret-for-this-test";
    try {
      const result = await verifyMagicLogToken(token);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("invalid");
    } finally {
      process.env.NEXTAUTH_SECRET = originalSecret;
    }
  });

  it("rejects garbage input", async () => {
    const result = await verifyMagicLogToken("not-a-real-token");
    expect(result.ok).toBe(false);
  });
});
