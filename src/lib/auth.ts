import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "./mongodb";
import User from "@/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/drive.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;

      // Sauvegarder/mettre à jour l'utilisateur en DB
      try {
        await connectDB();
        await User.findOneAndUpdate(
          { email: session.user?.email },
          {
            email: session.user?.email,
            name: session.user?.name,
            image: session.user?.image,
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
          },
          { upsert: true, returnDocument: "after" }
        );
      } catch (err) {
        console.error("Erreur sauvegarde user:", err);
      }

      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
  }
}
