import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireRole(role: "admin" | "recruiter" | "job_seeker") {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) redirect("/login?reason=configuration");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?reason=${role}`);
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== role) redirect("/dashboard");
  return user;
}
