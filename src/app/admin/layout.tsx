"use client";

import Image from "next/image";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  BookOpen,
  FileBarChart,
  CreditCard,
  FolderOpen,
  LogOut,
  Menu,
  X,
  ChevronRight,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/ogrenciler", label: "Öğrenciler", icon: Users },
  { href: "/admin/gruplar", label: "Gruplar", icon: FolderOpen },
  { href: "/admin/takvim", label: "Ders Takvimi", icon: Calendar },
  { href: "/admin/yoklama", label: "Yoklama", icon: ClipboardCheck },
  { href: "/admin/okuma", label: "Kitap Takibi", icon: BookOpen },
  { href: "/admin/sinavlar", label: "Sınav & Net", icon: FileBarChart },
  { href: "/admin/odemeler", label: "Ödemeler", icon: CreditCard },
  { href: "/admin/profil", label: "Profilim & Ayarlar", icon: UserCog },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "sidebar fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800/50">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center p-1.5 shadow-md">
              <Image
                src="/gemini-svg.svg"
                alt="DersTakip Logo"
                width={28}
                height={28}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-base font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                DersTakip
              </span>
              <p className="text-[10px] text-slate-500 -mt-0.5 font-medium">Öğretmen Paneli</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "sidebar-item flex items-center gap-3 text-sm text-slate-400",
                  isActive && "active"
                )}
              >
                <link.icon className="w-4.5 h-4.5 shrink-0" />
                <span className="flex-1">{link.label}</span>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User & Logout */}
        <div className="px-3 py-4 border-t border-slate-800/50">
          <button
            onClick={() => signOut({ callbackUrl: "/giris" })}
            className="sidebar-item flex items-center gap-3 text-sm text-slate-400 hover:text-red-400 w-full"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 w-full max-w-full">
        {/* Top Bar */}
        <header className="glass flex items-center justify-between px-4 lg:px-6 py-3 border-b border-slate-800/50 w-full max-w-full shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 lg:flex-none">
            <h2 className="text-sm font-medium text-slate-300">
              {sidebarLinks.find((l) =>
                l.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(l.href)
              )?.label ?? "Yönetim Paneli"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/profil"
              className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm hover:ring-2 hover:ring-indigo-400/50 transition-all"
              title="Profilim ve Ayarlar"
            >
              Ö
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6 w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
