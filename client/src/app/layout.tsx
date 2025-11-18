import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { auth } from "../auth";
// Load Google Fonts
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

// Page metadata
export const metadata: Metadata = {
  title: "Nexus Code",
  description: "A collaborative code editor",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ Fetch the session on the server
  const session = await auth();

  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${geistMono.variable} font-sans min-h-screen flex flex-col`}
      >
        {/* ✅ Provide the session to client components */}
        <SessionProvider session={session}>
          {/* ✅ Navbar gets live session state from useSession */}
          <main className="flex-grow">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
