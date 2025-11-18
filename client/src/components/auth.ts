"use client";

import { supabase } from "../lib/supabaseClient";

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) console.error(error);
  return data;
}
