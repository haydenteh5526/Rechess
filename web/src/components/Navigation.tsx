"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Crown, BarChart3, Puzzle, LogIn, LogOut } from "lucide-react";

export function Navigation() {
  const { user, signIn, signOut } = useAuth();
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
      pathname === href ? "bg-white/10 text-text" : "text-muted hover:text-text"
    }`;

  return (
    <nav className="flex items-center justify-between px-4 h-12 bg-[#302e2b] border-b border-white/5 shrink-0">
      <div className="flex items-center gap-1">
        <Link href="/" className="flex items-center gap-2 px-3 py-1.5 text-lg font-bold text-accent">
          <Crown size={20} /> Rechess
        </Link>
        <Link href="/review" className={linkClass("/review")}>
          <BarChart3 size={15} /> Review
        </Link>
        <Link href="/analysis" className={linkClass("/analysis")}>
          <Puzzle size={15} /> Analysis
        </Link>
      </div>
      <div>
        {user ? (
          <button onClick={() => signOut()} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted hover:text-text transition-colors">
            <LogOut size={14} /> Sign Out
          </button>
        ) : (
          <button onClick={() => signIn()} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-accent hover:text-text transition-colors">
            <LogIn size={14} /> Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
