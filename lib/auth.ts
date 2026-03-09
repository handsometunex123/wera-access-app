import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Session, SessionStrategy } from "next-auth";
import type { JWT } from "next-auth/jwt";
// Note: sendEmail and randomUUID usage was commented out; removed unused imports to satisfy linter

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        sessionToken: { label: "Session Token", type: "text", optional: true },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        // Enforce single-device login for residents
        // if (user.role === "MAIN_RESIDENT" || user.role === "DEPENDANT") {
        //   const sessionToken = credentials.sessionToken || randomUUID(); // Generate if not provided

        //   // Check if the login is from a new device
        //   if (user.sessionToken && user.sessionToken !== sessionToken) {
        //     const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit code

        //     // Send email notification with the verification code
        //     await sendEmail({
        //       to: user.email,
        //       subject: "New Login Attempt Detected",
        //       text: `A login attempt was made from a new device. Please use the following code to verify your login: ${verificationCode}`,
        //     });

        //     // Store the verification code in the database
        //     await prisma.user.update({
        //       where: { id: user.id },
        //       data: { verificationCode },
        //     });

        //     return null; // Prevent login until the code is verified
        //   }

        //   // Update session token and log out from other devices
        //   await prisma.user.update({
        //     where: { id: user.id },
        //     data: { sessionToken, verificationCode: null },
        //   });
        //   return { id: user.id, email: user.email, role: user.role, sessionToken };
        // }

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT; user?: unknown }) {
      if (token && session.user) {
        session.user.id = token.id as string; // Ensure `id` is added to session.user
        session.user.role = token.role as string; // Ensure `role` is added to session.user
        if (token.sessionToken) {
          session.user.sessionToken = token.sessionToken as string;
        }
      }
      return session;
    },
    async jwt({ token, user }: {
      token: JWT;
      user?: unknown;
    }) {
      if (user && typeof user === "object" && user !== null) {
        const u = user as { id?: string; role?: string; sessionToken?: string };
        if (u.id) token.id = u.id;
        if (u.role) token.role = u.role;
        if (u.sessionToken) token.sessionToken = u.sessionToken;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth",
  },
};
