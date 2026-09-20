"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"job_seeker" | "recruiter">("job_seeker");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setMessage("");
    const supabase = createClient();
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { name, role } } });
    setLoading(false);
    if (result.error) { setMessage(result.error.message); return; }
    setMessage(mode === "login" ? "Berhasil masuk. Muat ulang dashboard untuk melanjutkan." : "Akun dibuat. Cek email untuk konfirmasi sebelum masuk.");
  }

  return <form onSubmit={submit}>
    {mode === "register" && <><label className="field">Nama lengkap<input required value={name} onChange={(e) => setName(e.target.value)} /></label><label className="field">Saya adalah<select value={role} onChange={(e) => setRole(e.target.value as typeof role)}><option value="job_seeker">Job seeker</option><option value="recruiter">Recruiter</option></select></label></>}
    <label className="field">Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" /></label>
    <label className="field">Password<input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" /></label>
    <button className="button button-primary" style={{ width: "100%" }} disabled={loading}>{loading ? "Memproses..." : mode === "login" ? "Masuk" : "Buat akun"}</button>
    {message && <p className="muted" role="status" style={{ marginTop: 14, fontSize: 13 }}>{message}</p>}
  </form>;
}
