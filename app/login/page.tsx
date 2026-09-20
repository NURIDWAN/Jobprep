import Link from "next/link";
import { AuthForm } from "./AuthForm";
export default function LoginPage() { return <main className="page-shell"><div className="form-card"><span className="eyebrow">SELAMAT DATANG KEMBALI</span><h1 className="page-title" style={{ fontSize: 30 }}>Masuk ke JobPrep</h1><AuthForm mode="login" /><p className="muted" style={{ textAlign: "center", fontSize: 13 }}>Belum punya akun? <Link href="/register" style={{ color: "var(--blue)", fontWeight: 700 }}>Daftar gratis</Link></p></div></main>; }
