import type { NextAuthOptions, User } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * NextAuth config.
 *
 * Providers:
 *   1. Email + password (credentials) — original signup flow.
 *   2. Google OAuth — added so moms can skip the password step.
 *
 * Account linking note: `allowDangerousEmailAccountLinking: true` lets a
 * credentials user later sign in with Google (same email) and have it
 * merged onto the existing User. This is "dangerous" in NextAuth's naming
 * because in principle an unverified OAuth provider could let an attacker
 * claim someone's account. Google verifies emails before issuing tokens,
 * so the practical risk is the same as any password reset flow. We accept
 * it for the better UX. Don't add this flag to OAuth providers we don't
 * trust.
 */
export const authOptions: NextAuthOptions = {
  // PrismaAdapter's exported type drifts slightly between major versions
  // of next-auth and @auth/prisma-adapter; this cast keeps both happy.
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Google OAuth — only enabled if the env vars are set. This lets dev
    // environments without Google credentials still boot the credentials
    // provider without crashing.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Email & password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      // `user` is only populated on initial sign-in. For OAuth flows the
      // PrismaAdapter has already created/linked the User row by this point,
      // so `user.id` is the DB id we need to stash on the token.
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        session.user.id = token.uid as string;
      }
      return session;
    },
  },
};
