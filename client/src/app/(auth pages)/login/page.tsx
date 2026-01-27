

"use client";
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Github } from "lucide-react";
import Navbar from "../../../components/Navbar";

const SocialAuthPage: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/code-page");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen w-screen justify-center items-center bg-black text-white">
        Loading Session...
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex h-screen w-screen justify-center items-center bg-black">
        <div className="w-full max-w-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl text-center p-8">
            <h1 className="text-3xl font-bold mb-1 text-white">Nexus Code</h1>
            <p className="text-gray-400 mb-6">Sign in to collaborate</p>

            <div className="flex flex-col gap-3 w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  signIn("google", {
                    callbackUrl: "/code-page",
                  })
                }
                className="flex items-center justify-center gap-3 px-6 py-3 w-full text-white rounded-lg font-semibold shadow-md bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="w-5 h-5" />
                Continue with Google
              </motion.button>

            
            </div>

            <div className="flex items-center w-full my-6">
              <div className="flex-grow border-t border-gray-700"></div>
              <div className="flex-grow border-t border-gray-700"></div>
              <p className="text-gray-500 text-sm">Click on any of the options above to sign in</p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default SocialAuthPage;
 