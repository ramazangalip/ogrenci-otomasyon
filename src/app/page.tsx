import Link from "next/link";
import Image from "next/image";
import {
  GraduationCap,
  BookOpen,
  Users,
  ChartLine,
  ArrowRight,
  Shield,
  Bell,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PwaInstallSection } from "@/components/pwa-installer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Hero Section */}
      <header className="relative overflow-hidden w-full max-w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-transparent pointer-events-none" />

        <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 lg:px-12 py-5 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center p-1.5 shadow-lg shadow-indigo-500/10">
              <Image
                src="/gemini-svg.svg"
                alt="DersTakip Logo"
                width={28}
                height={28}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              DersTakip
            </span>
          </div>
          <Link href="/giris">
            <Button variant="outline" size="sm">
              Giriş Yap
            </Button>
          </Link>
        </nav>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-16 lg:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-8 animate-fade-in">
            <Shield className="w-4 h-4" />
            <span>Güvenli & Modern Eğitim Platformu</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold mb-6 animate-fade-in-delay-1 leading-tight">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Öğrenci Takip ve
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Veli Bilgilendirme Sistemi
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-10 animate-fade-in-delay-2">
            Birebir ve grup özel ders veren öğretmenler için geliştirilmiş,
            ders yönetimi, yoklama, sınav takibi ve veli iletişimini tek
            platformda birleştiren dijital çözüm.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-3 px-4">
            <Link href="/giris" className="w-full sm:w-auto">
              <Button size="lg" className="group w-full sm:w-auto">
                Hemen Başla
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/giris" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Veli Girişi
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="relative py-16 lg:py-32 px-4 sm:px-6 lg:px-12 max-w-full overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Neden EduTrack?
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Eğitim sürecinizi dijitalleştirin, veli iletişimini güçlendirin,
              öğrenci gelişimini detaylı takip edin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: BookOpen,
                title: "Ders Yönetimi",
                desc: "Takvim, yoklama, ders notları ve tekrarlayan ders planlaması",
                color: "from-indigo-500 to-blue-600",
                glow: "stat-glow-indigo",
              },
              {
                icon: Users,
                title: "Veli Paneli",
                desc: "Veliler çocuklarının gelişimini anlık takip edebilir",
                color: "from-emerald-500 to-teal-600",
                glow: "stat-glow-emerald",
              },
              {
                icon: ChartLine,
                title: "Gelişim Analizi",
                desc: "Deneme sınavı netleri, okuma takibi ve detaylı grafikler",
                color: "from-amber-500 to-orange-600",
                glow: "stat-glow-amber",
              },
              {
                icon: Bell,
                title: "Anlık Bildirimler",
                desc: "WhatsApp ve Web Push ile sıfır maliyetli veli iletişimi",
                color: "from-rose-500 to-pink-600",
                glow: "stat-glow-rose",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`glass rounded-2xl p-6 ${feature.glow} animate-fade-in`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PWA Section */}
      <PwaInstallSection />

      {/* Footer */}
      <footer className="mt-auto py-8 px-6 text-center border-t border-slate-800/50">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} DersTakip Akademi - Öğrenci Takip ve Veli
          Bilgilendirme Sistemi. Tüm hakları saklıdır.
        </p>
      </footer>
    </div>
  );
}
