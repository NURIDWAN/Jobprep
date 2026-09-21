"use client";
import Link from "next/link";
import { Menu, Search, UserRound, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return <div className="mobile-nav-wrap">
    <div className="pro-mobile-actions">
      <Link href="/jobs" aria-label="Cari lowongan"><Search size={18} /></Link>
      <ThemeToggle />
      <button type="button" className="mobile-menu-button" aria-label={open ? "Tutup menu" : "Buka menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
    </div>
    {open && <nav className="mobile-menu" aria-label="Menu mobile">
      <Link href="/jobs" onClick={() => setOpen(false)}>Cari lowongan</Link>
      <Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
      <Link href="/recruiter" onClick={() => setOpen(false)}>Recruiter</Link>
      <Link href="/login" onClick={() => setOpen(false)}><UserRound size={16} /> Masuk</Link>
    </nav>}
  </div>;
}
