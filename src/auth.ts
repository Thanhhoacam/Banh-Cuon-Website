import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import Google from "next-auth/providers/google";

type UserRole = "customer" | "staff" | "admin";

type JWTWithRole = JWT & { role?: UserRole };

type SessionWithRole = Session & {
  user?: Session["user"] & { role?: UserRole };
};

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }): Promise<JWTWithRole> {
      const jwtToken = token as JWTWithRole;
      if (account) {
        jwtToken.role = jwtToken.role ?? "customer";
      }
      return jwtToken;
    },
    async session({ session, token }): Promise<SessionWithRole> {
      const jwtToken = token as JWTWithRole;
      const s = session as SessionWithRole;
      if (s.user) {
        s.user.role = jwtToken.role ?? "customer";
      }
      return s;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
