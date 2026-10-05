import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { UserRole } from "@/types/domain";
import { isOneOf, USER_ROLES } from "@/types/domain";
import { connectDB } from "@/lib/db";
import { normalizeEmail } from "@/lib/otp";
import { UserModel } from "@/models";
import { loginSchema } from "@/validations/schemas";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/** Hardcoded test accounts until real password auth is wired. */
export const TEST_USERS = [
  {
    email: "partner@nestverify.test",
    password: "partner123",
    name: "Partner Desk",
    role: "PARTNER" as const,
  },
  {
    email: "admin@nestverify.test",
    password: "admin123",
    name: "Admin Desk",
    role: "ADMIN" as const,
  },
  {
    email: "test@nestverify.test",
    password: "test123",
    name: "Test Buyer",
    role: "BUYER" as const,
  },
] as const;

async function userByEmail(email: string): Promise<AuthUser | null> {
  await connectDB();
  const user = await UserModel().findOne({ email: normalizeEmail(email) }).lean();
  if (!user) return null;
  const id = String(user._id);
  if (!isOneOf(user.role, USER_ROLES)) return null;
  return { id, email: user.email, name: user.name, role: user.role };
}

async function ensureUser(input: { email: string; name: string; role: UserRole }): Promise<AuthUser> {
  await connectDB();
  const normalized = normalizeEmail(input.email);
  const existing = await UserModel().findOne({ email: normalized });
  if (existing) {
    if (existing.role !== input.role || existing.name !== input.name) {
      existing.role = input.role;
      existing.name = input.name;
      await existing.save();
    }
    if (!isOneOf(existing.role, USER_ROLES)) {
      throw new Error("Account role is invalid.");
    }
    return { id: String(existing._id), email: existing.email, name: existing.name, role: existing.role };
  }
  const created = await UserModel().create({
    email: normalized,
    name: input.name,
    role: input.role,
    phone: "",
    image: "",
  });
  return { id: String(created._id), email: created.email, name: created.name, role: created.role };
}

async function upsertBuyer(email: string, name: string | null | undefined): Promise<AuthUser> {
  return ensureUser({
    email,
    name: name?.trim() || email.split("@")[0] || "Buyer",
    role: "BUYER",
  });
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    id: "credentials",
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) return null;
      const match = TEST_USERS.find(
        (user) => user.email === parsed.data.email && user.password === parsed.data.password,
      );
      if (!match) return null;
      return ensureUser({ email: match.email, name: match.name, role: match.role });
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await upsertBuyer(user.email, user.name);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const record = await userByEmail(user.email);
        if (record) {
          token.id = record.id;
          token.role = record.role;
          token.name = record.name;
          token.email = record.email;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.role = isOneOf(token.role, USER_ROLES) ? token.role : "BUYER";
        if (typeof token.name === "string") session.user.name = token.name;
        if (typeof token.email === "string") session.user.email = token.email;
      }
      return session;
    },
  },
};

export function googleAuthEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
