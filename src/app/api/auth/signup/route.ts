import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { consume, SIGNUP_LIMIT } from "@/lib/rate-limit";

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(60).optional(),
});

// Extract a stable-ish client identifier for rate limiting.
// Falls back to "anon" if no header is present (local dev / odd proxies).
function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return `signup:${fwd.split(",")[0]!.trim()}`;
  const real = req.headers.get("x-real-ip");
  if (real) return `signup:${real}`;
  return "signup:anon";
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit before doing any work — we don't want spammers hammering bcrypt.
    const limit = consume(clientKey(req), SIGNUP_LIMIT);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many signups from this address. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSec) },
        }
      );
    }

    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { email, password, name } = parsed.data;
    const normalized = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalized },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: normalized, name: name ?? null, passwordHash },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error("signup error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
