import Link from "next/link";
import { AuthForm } from "@/app/login/AuthForm";
export default function RegisterPage() { return <main className="page-shell"><div className="form-card"><span className="eyebrow">MULAI PERJALANANMU</span><h1 className="page-title" style={{ fontSize: 30 }}>Buat akun JobPrep</h1><AuthForm mode="register" /><p className="muted" style={{ textAlign: "center", fontSize: 13 }}>Sudah punya akun? <Link href="/login" style={{ color: "var(--blue)", fontWeight: 700 }}>Masuk</Link></p></div></main>; }
