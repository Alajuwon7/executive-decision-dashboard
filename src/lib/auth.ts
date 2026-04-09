import { createClient } from "@/lib/supabase/client";

export interface AppUser {
  email: string;
  name: string;
  initials: string;
}

export async function login(email: string, password: string): Promise<AppUser> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  const userEmail = data.user.email ?? email;
  return makeAppUser(userEmail);
}

export async function signUp(email: string, password: string): Promise<AppUser> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;

  const userEmail = data.user?.email ?? email;
  return makeAppUser(userEmail);
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function getUser(): Promise<AppUser | null> {
  if (typeof window === "undefined") return null;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  return makeAppUser(user.email);
}

function makeAppUser(email: string): AppUser {
  const name = email
    .split("@")[0]
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return { email, name, initials };
}
