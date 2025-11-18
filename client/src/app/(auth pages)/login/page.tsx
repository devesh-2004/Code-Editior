"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Github, User, Lock } from "lucide-react";
import Navbar from "../../../components/Navbar";

// --- Constants ---
const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000/api";

const AuthPage = () => {
  const { status } = useSession();
  const router = useRouter();

  // Flip state: false = Login (Front), true = Signup (Back)
  const [isFlipped, setIsFlipped] = useState(false);

  // Message state (shared for both forms)
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // Loading states
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  // Refs to measure dynamic heights of front/back
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  // State to store active height
  const [cardHeight, setCardHeight] = useState<number>(600);

  // Measure height whenever flip changes
  useEffect(() => {
    const target = isFlipped ? backRef.current : frontRef.current;
    if (target) setCardHeight(target.scrollHeight);
  }, [isFlipped, loginLoading, signupLoading, authMessage]);

  // --- LOGIN HANDLER ---
  const handleLoginSubmit: React.FormEventHandler<HTMLFormElement> = async (
    e
  ) => {
    e.preventDefault();
    setAuthMessage(null);
    setLoginLoading(true);

    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") || "");
    const password = String(new FormData(form).get("password") || "");

    if (!email || !password) {
      setAuthMessage("Please enter email and password.");
      setLoginLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setAuthMessage(result.error);
      } else {
        setAuthMessage("✅ Successfully logged in. Redirecting...");
      }
    } catch {
      setAuthMessage("Network error during login.");
    } finally {
      setLoginLoading(false);
    }
  };

  // --- SIGNUP HANDLER ---
  const handleSignupSubmit: React.FormEventHandler<HTMLFormElement> = async (
    e
  ) => {
    e.preventDefault();
    setAuthMessage(null);
    setSignupLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    if (!name || !email || !password) {
      setAuthMessage("Please fill all the fields.");
      setSignupLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        credentials: "include",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Signup failed. Please try again.");
      }

      setAuthMessage("✅ Account created successfully! Please log in.");
      setIsFlipped(false);
    } catch (err: any) {
      setAuthMessage(err.message || "Signup failed.");
    } finally {
      setSignupLoading(false);
    }
  };

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
      {/* Perspective wrapper */}
      <div className="[perspective:1000px] w-full max-w-sm flex items-center justify-center">
        {/* Card container with dynamic height */}
        <motion.div
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0, height: cardHeight }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="relative w-full [transform-style:preserve-3d]"
        >
          {/* ---------------- FRONT FACE: LOGIN ---------------- */}
          <div
            ref={frontRef}
            className="absolute inset-0 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl 
                       text-center flex flex-col items-center p-8 [backface-visibility:hidden]"
          >
            <h1 className="text-3xl font-bold mb-1 text-white">Nexus Code</h1>
            <p className="text-gray-400 mb-6">Sign in to collaborate</p>

            {/* Login messages */}
            {authMessage && !isFlipped && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-sm mb-4 p-2 rounded w-full ${
                  authMessage.startsWith("✅")
                    ? "bg-green-900 text-green-400"
                    : "bg-red-900 text-red-400"
                }`}
              >
                {authMessage}
              </motion.p>
            )}

            {/* Social logins */}
            <div className="flex flex-col gap-3 w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => signIn("google", { callbackUrl: "/code-page" })}
                className="flex items-center justify-center gap-3 px-6 py-3 w-full text-white rounded-lg font-semibold shadow-md bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="w-5 h-5" />
                Sign in with Google
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => signIn("github", { callbackUrl: "/code-page" })}
                className="flex items-center justify-center gap-3 px-6 py-3 w-full text-gray-300 rounded-lg font-semibold shadow-md border border-gray-600 hover:bg-gray-800"
              >
                <Github className="w-5 h-5" />
                Sign in with GitHub
              </motion.button>
            </div>

            {/* Divider */}
            <div className="flex items-center w-full my-4">
              <div className="flex-grow border-t border-gray-700"></div>
              <span className="mx-4 text-gray-500 text-sm">OR</span>
              <div className="flex-grow border-t border-gray-700"></div>
            </div>

            {/* Manual login form */}
            <form
              onSubmit={handleLoginSubmit}
              className="flex flex-col gap-3 w-full"
            >
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500"
                  placeholder="Email Address"
                  required
                  disabled={loginLoading}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  name="password"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500"
                  placeholder="Password"
                  required
                  disabled={loginLoading}
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loginLoading}
                className="w-full py-3 text-lg font-bold bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loginLoading ? "Logging in..." : "Login with Email"}
              </motion.button>
            </form>

            {/* Flip to signup */}
            <p className="text-sm text-gray-500 mt-6">
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setIsFlipped(true);
                  setAuthMessage(null);
                }}
                className="text-blue-500 hover:text-blue-400"
              >
                Sign up
              </button>
            </p>
          </div>

          {/* ---------------- BACK FACE: SIGNUP ---------------- */}
          <div
            ref={backRef}
            className="absolute inset-0 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl 
                       text-center flex flex-col items-center p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]"
          >
            <h2 className="text-3xl font-bold mb-1 text-white">
              Create Account
            </h2>
            <p className="text-gray-400 mb-6 text-sm">
              Register with your email
            </p>

            {/* Signup messages */}
            {authMessage && isFlipped && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-sm mb-4 p-2 rounded w-full ${
                  authMessage.startsWith("✅")
                    ? "bg-green-900 text-green-400"
                    : "bg-red-900 text-red-400"
                }`}
              >
                {authMessage}
              </motion.p>
            )}

            {/* Social signup */}
            <div className="flex flex-col gap-3 w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => signIn("google", { callbackUrl: "/code-page" })}
                className="flex items-center justify-center gap-3 px-6 py-3 w-full text-white rounded-lg font-semibold shadow-md bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="w-5 h-5" />
                Sign up with Google
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => signIn("github", { callbackUrl: "/code-page" })}
                className="flex items-center justify-center gap-3 px-6 py-3 w-full text-gray-300 rounded-lg font-semibold shadow-md border border-gray-600 hover:bg-gray-800"
              >
                <Github className="w-5 h-5" />
                Sign up with GitHub
              </motion.button>
            </div>

            {/* Divider */}
            <div className="flex items-center w-full my-4">
              <div className="flex-grow border-t border-gray-700"></div>
              <span className="mx-4 text-gray-500 text-sm">OR</span>
              <div className="flex-grow border-t border-gray-700"></div>
            </div>

            {/* Signup form */}
            <form
              onSubmit={handleSignupSubmit}
              className="flex flex-col gap-3 w-full"
            >
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  name="name"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500"
                  placeholder="Name"
                  required
                  disabled={signupLoading}
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500"
                  placeholder="Email"
                  required
                  disabled={signupLoading}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  name="password"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500"
                  placeholder="Password"
                  required
                  disabled={signupLoading}
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={signupLoading}
                className="w-full py-3 mt-2 text-lg font-bold bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50"
              >
                {signupLoading ? "Signing up..." : "Sign Up"}
              </motion.button>
            </form>

            {/* Flip back to login */}
            <p className="mt-6 text-sm text-gray-400">
              Already have an account?{" "}
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setAuthMessage(null);
                }}
                className="text-blue-500 hover:underline"
              >
                Login
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
    </>
  );
};

export default AuthPage;