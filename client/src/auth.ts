import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
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

          const data = await response.json();
          // Backend returns { message, user: { id, name, email } }
          const u = (data && (data.user || data)) as {
            id?: string | number;
            name?: string | null;
            email?: string | null;
          } | null;
          if (!u) return null;
          return {
            id: u.id != null ? String(u.id) : "",
            name: u.name ?? null,
            email: u.email ?? null,
          };
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let email = (profile as any)?.email || user?.email;

          // GitHub sometimes doesn’t return email → fetch manually
          if (
            !email &&
            account.provider === "github" &&
            (account as { access_token?: string }).access_token
          ) {
            try {
              const resp = await fetch("https://api.github.com/user/emails", {
                headers: {
                  Authorization: `Bearer ${(account as { access_token?: string }).access_token}`,
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
              name: (profile as { name?: string })?.name || user?.name,
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

// app/api/auth/[...nextauth]/route.ts
// import NextAuth from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import GithubProvider from "next-auth/providers/github";
// import GoogleProvider from "next-auth/providers/google";
// import type { NextAuthConfig } from "next-auth";

// const BACKEND =
//   (process.env.NEXT_PUBLIC_BACKEND_API_URL &&
//     process.env.NEXT_PUBLIC_BACKEND_API_URL.replace(/\/$/, "")) ||
//   (process.env.BACKEND_API_URL &&
//     process.env.BACKEND_API_URL.replace(/\/$/, "")) ||
//   "http://localhost:5000/api";

// const GITHUB_ID = process.env.GITHUB_ID;
// const GITHUB_SECRET = process.env.GITHUB_SECRET;

// const GOOGLE_CLIENT_ID =
//   process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID;
// const GOOGLE_CLIENT_SECRET =
//   process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET;

// if (!process.env.NEXTAUTH_SECRET) {
//   console.warn(
//     "NEXTAUTH_SECRET is not set — set it in your .env for production"
//   );
// }

// export const authOptions: NextAuthConfig = {
//   secret: process.env.NEXTAUTH_SECRET,
//   session: { strategy: "jwt" },
//   pages: {
//     signIn: "/login",
//   },
//   providers: [
//     // Credentials provider delegates to your backend login endpoint
//     CredentialsProvider({
//       name: "Credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials, _req) {
//         if (!credentials?.email || !credentials?.password) {
//           return null;
//         }

//         try {
//           const res = await fetch(`${BACKEND}/auth/login`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               email: credentials.email,
//               password: credentials.password,
//             }),
//           });

//           if (!res.ok) {
//             const errText = await res.text().catch(() => "");
//             console.warn(
//               "[NextAuth][Credentials] backend login failed:",
//               res.status,
//               errText
//             );
//             return null;
//           }

//           const data = await res.json().catch(() => null);
//           // Backend expected to return { user: { id, name, email } } or { id, name, email }
//           const user = data?.user ?? data;
//           if (!user) return null;

//           // Return a user object that will be encoded into the JWT
//           return {
//             id: String(user.id || user._id),
//             name: user.name ?? null,
//             email: user.email ?? null,
//           } as any;
//         } catch (err) {
//           console.error("[NextAuth][Credentials] authorize error:", err);
//           return null;
//         }
//       },
//     }),

//     // GitHub provider
//     ...(GITHUB_ID && GITHUB_SECRET
//       ? [
//           GithubProvider({
//             clientId: GITHUB_ID,
//             clientSecret: GITHUB_SECRET,
//             authorization: { params: { scope: "read:user user:email" } },
//           }),
//         ]
//       : []),

//     // Google provider
//     ...(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
//       ? [
//           GoogleProvider({
//             clientId: GOOGLE_CLIENT_ID,
//             clientSecret: GOOGLE_CLIENT_SECRET,
//             authorization: {
//               params: {
//                 prompt: "consent",
//                 access_type: "offline",
//                 response_type: "code",
//                 scope: "openid email profile",
//               },
//             },
//           }),
//         ]
//       : []),
//   ],

//   callbacks: {
//     // Persist user info to the JWT
//     async jwt({ token, user, account, profile }) {
//       // When first signing in, `user` will be populated (from authorize or provider)
//       if (user) {
//         token.user = user;
//       }

//       // Keep token.user as-is for subsequent requests
//       return token;
//     },

//     // Expose user on session
//     async session({ session, token }) {
//       if (token && (token as any).user) {
//         session.user = (token as any).user as any;
//       }
//       return session;
//     },

//     // Called after sign in (for OAuth providers). We upsert user into backend DB
//     async signIn({ account, profile, user }) {
//       // Only handle OAuth providers (github, google)
//       if (!account) return true;

//       try {
//         const provider = account.provider;
//         // Determine email (profile may have it)
//         let email = (profile as any)?.email || (user as any)?.email || null;

//         // GitHub: sometimes email is not available in profile => fetch emails endpoint
//         if (!email && provider === "github" && (account as any).access_token) {
//           try {
//             const emailsRes = await fetch(
//               "https://api.github.com/user/emails",
//               {
//                 headers: {
//                   Authorization: `Bearer ${(account as any).access_token}`,
//                   Accept: "application/vnd.github.v3+json",
//                 },
//               }
//             );
//             if (emailsRes.ok) {
//               const emails = (await emailsRes.json()) as Array<{
//                 email: string;
//                 primary?: boolean;
//                 verified?: boolean;
//               }>;
//               const primary =
//                 emails.find((e) => e.primary && e.verified) || emails[0];
//               email = primary?.email || email;
//             } else {
//               console.warn(
//                 "[NextAuth] failed to fetch github emails",
//                 await emailsRes.text().catch(() => "")
//               );
//             }
//           } catch (e) {
//             console.warn("[NextAuth] error fetching github emails", e);
//           }
//         }

//         // Build upsert payload
//         const payload = {
//           email: email || null,
//           name: (profile as any)?.name || (user as any)?.name || null,
//           provider,
//           providerId: account.providerAccountId,
//         };

//         // Call backend upsert endpoint
//         const resp = await fetch(`${BACKEND}/auth/oauth/upsert`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         });

//         if (!resp.ok) {
//           const txt = await resp.text().catch(() => "");
//           console.warn(
//             "[NextAuth] backend oauth upsert failed",
//             resp.status,
//             txt
//           );
//         } else {
//           // Optionally consume returned user if needed
//           // const body = await resp.json().catch(() => null);
//         }
//       } catch (err) {
//         console.error("[NextAuth] signIn callback error:", err);
//       }

//       // Allow sign in
//       return true;
//     },
//   },
// };
// // Export NextAuth helpers for App Router usage
// export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
