import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Search, UserRound } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = { title: "JobPrep — Siap Hadapi Interview", description: "Portal lowongan dengan latihan interview AI yang relevan." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id" suppressHydrationWarning><body><ThemeProvider><header className="pro-header"><Link href="/" className="pro-brand"><span className="pro-brand-icon">✦</span><span>jobprep<span className="pro-brand-dot">.</span></span></Link><nav className="pro-nav"><Link href="/jobs">Cari lowongan</Link><Link href="/dashboard">Dashboard</Link><Link href="/recruiter">Recruiter</Link><Link href="/login" className="pro-login"><UserRound size={15} /> Masuk</Link><ThemeToggle /></nav><div className="pro-mobile-actions"><Search size={18} /><Bell size={18} /><ThemeToggle /></div></header>{children}<footer className="pro-footer"><div><span className="pro-brand">jobprep<span className="pro-brand-dot">.</span></span><p>Temukan peluang. Latih jawabanmu. Tumbuh lebih siap.</p></div><div><b>Untuk kandidat</b><Link href="/jobs">Cari lowongan</Link><Link href="/interview/nexa-product">Latihan interview</Link></div><div><b>Untuk recruiter</b><Link href="/admin">Dashboard recruiter</Link><Link href="/admin/jobs">Kelola lowongan</Link></div><div><b>JobPrep</b><Link href="/login">Masuk</Link><Link href="/register">Daftar gratis</Link></div></footer></ThemeProvider></body></html>; }
