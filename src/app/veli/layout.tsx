"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  FileBarChart,
  CreditCard,
  Bell,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/veli", label: "Ana Sayfa", icon: LayoutDashboard },
  { href: "/veli/okuma", label: "Kitap Takibi", icon: BookOpen },
  { href: "/veli/sinavlar", label: "Sınav Sonuçları", icon: FileBarChart },
  { href: "/veli/odemeler", label: "Ödemeler", icon: CreditCard },
  { href: "/veli/bildirimler", label: "Bildirimler", icon: Bell },
  { href: "/veli/profil", label: "Profilim", icon: User },
];

export default function VeliLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Top Navigation */}
      <header className="glass sticky top-0 z-50 border-b border-slate-800/50 w-full max-w-full">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/veli" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center p-1 shadow-md">
              <Image
                src="/gemini-svg.svg"
                alt="DersTakip Logo"
                width={22}
                height={22}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              DersTakip Veli
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/veli/profil"
              className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 transition-all flex items-center gap-1.5 text-xs font-medium"
              title="Profilim ve Ayarlar"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profilim</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/giris" })}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/50 transition-all hidden sm:block"
              title="Çıkış Yap"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white sm:hidden"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <nav className="sm:hidden border-t border-slate-800/50 p-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                  (link.href === "/veli" ? pathname === "/veli" : pathname.startsWith(link.href))
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/giris" })}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 w-full"
            >
              <LogOut className="w-4 h-4" />
              Çıkış Yap
            </button>
          </nav>
        )}
      </header>

      {/* Desktop Bottom Tab Bar (hidden on mobile) */}
      <nav className="hidden sm:block max-w-4xl mx-auto w-full px-4 mt-4">
        <div className="flex items-center gap-1 bg-slate-800/30 rounded-2xl p-1.5 border border-slate-700/30">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/veli"
                ? pathname === "/veli"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <link.icon className="w-4 h-4" />
                <span className="hidden lg:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-4 py-6 pb-24 sm:pb-12 overflow-x-hidden">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 w-full max-w-full glass border-t border-slate-800/50 px-1 py-1.5 z-50 overflow-hidden">
        <div className="flex items-center justify-around w-full max-w-full">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/veli"
                ? pathname === "/veli"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl text-[10px] transition-all flex-1 text-center min-w-0",
                  isActive ? "text-emerald-400 font-medium" : "text-slate-400"
                )}
              >
                <link.icon className="w-4 h-4 shrink-0" />
                <span className="truncate w-full text-[9px]">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
