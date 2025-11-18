import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // ✅ Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          response_type: "code",
          scope: "openid email profile",
        },
      },
    }),

    // ✅ GitHub OAuth
    Github({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: { scope: "read:user user:email" },
      },
    }),

    // ✅ Credentials Provider (custom backend login)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const backendUrl =
          process.env.BACKEND_API_URL || "http://localhost:5000/api";

        try {
          console.log("[NextAuth] Credentials login -> backend /auth/login");

          const response = await fetch(`${backendUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
          });

          if (!response.ok) {
            console.error(
              "[NextAuth] Credentials login failed",
              response.status,
              await response.text()
            );
            return null;
          }

          const user = await response.json();
          return user || null;
        } catch (error) {
          console.error("Authorization Error:", error);
          return null;
        }
      },
    }),
  ],

  session: { strategy: "jwt" },

  pages: { signIn: "/login" }, // custom login page

  callbacks: {
    async signIn({ account, profile, user }) {
      const backendUrl =
        process.env.BACKEND_API_URL || "http://localhost:5000/api";

      // 🔹 Handle Google + GitHub users
      if (account?.provider === "github" || account?.provider === "google") {
        try {
          let email = (profile as any)?.email || user?.email;

          // GitHub sometimes doesn’t return email → fetch manually
          if (
            !email &&
            account.provider === "github" &&
            (account as any).access_token
          ) {
            try {
              const resp = await fetch("https://api.github.com/user/emails", {
                headers: {
                  Authorization: `Bearer ${(account as any).access_token}`,
                },
              });
              if (resp.ok) {
                const emails = (await resp.json()) as Array<{
                  email: string;
                  primary: boolean;
                  verified: boolean;
                }>;
                const primary =
                  emails.find((e) => e.primary && e.verified) || emails[0];
                email = primary?.email || email;
              }
            } catch (e) {
              console.error("[NextAuth] failed to fetch GitHub emails", e);
            }
          }

          console.log("[NextAuth] callbacks.signIn -> upsert OAuth user", {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            email,
          });

          const resp = await fetch(`${backendUrl}/auth/oauth/upsert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              name: (profile as any)?.name || user?.name,
              provider: account.provider,
              providerId: account.providerAccountId,
            }),
          });

          if (!resp.ok) {
            console.error(
              "[NextAuth] oauth upsert failed",
              resp.status,
              await resp.text()
            );
          }
        } catch (e) {
          console.error("OAuth upsert failed", e);
        }
      }

      return true;
    },
  },
});
