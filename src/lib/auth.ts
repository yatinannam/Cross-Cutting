import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export async function isSignedIn() {
  if (typeof window === "undefined") return false;

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) return false;

  return Boolean(data.session);
}

export async function getAccessToken() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) return null;
  return data.session.access_token;
}

export async function getCurrentUser() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;

  return data.user;
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signUp(email: string, password: string, fullName: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signOut();
}
