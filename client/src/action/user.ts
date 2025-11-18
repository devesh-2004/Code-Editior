// "use server";
// import { signIn } from "@/auth";
// import { redirect } from "next/navigation";

// const BACKEND_API_URL =
//   process.env.BACKEND_API_URL || "http://localhost:5000/api";

// export async function login(formData: FormData) {
//   const email = formData.get("email") as string;
//   const password = formData.get("password") as string;

//   // Delegate to NextAuth credentials provider configured in src/auth.ts
//   await signIn("credentials", {
//     redirect: true,
//     callbackUrl: "/",
//     email,
//     password,
//   });
// }

// export async function register(formData: FormData) {
//   const name = formData.get("name") as string;
//   const email = formData.get("email") as string;
//   const password = formData.get("password") as string;

//   if (!name || !email || !password) {
//     throw new Error("Please fill all the fields");
//   }

//   const res = await fetch(`${BACKEND_API_URL}/auth/signup`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ name, email, password }),
//   });

//   if (!res.ok) {
//     const body = await res.json().catch(() => ({}));
//     throw new Error(body.error || "Signup failed");
//   }

//   // Redirect to login upon successful signup
//   redirect("/login");
// }