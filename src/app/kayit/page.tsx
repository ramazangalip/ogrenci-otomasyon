"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  User,
  Mail,
  Lock,
  Phone,
  Loader2,
  Eye,
  EyeOff,
  HeartHandshake,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  School,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentGrade, setStudentGrade] = useState("");
  const [studentSchool, setStudentSchool] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Şifreniz en az 6 karakter olmalıdır.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Girdiğiniz şifreler birbiriyle eşleşmiyor.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          studentName: studentName.trim() || undefined,
          studentGrade: studentGrade.trim() || undefined,
          studentSchool: studentSchool.trim() || undefined,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Kayıt oluşturulurken bir hata meydana geldi.");
        setLoading(false);
        return;
      }

      setSuccess("Hesabınız başarıyla oluşturuldu! Giriş yapılıyor...");

      // Otomatik giriş yap ve veli paneline yönlendir
      const loginRes = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        // Otomatik giriş başarısızsa giriş sayfasına yönlendir
        setTimeout(() => {
          window.location.href = "/giris";
        }, 1200);
      } else {
        setTimeout(() => {
          window.location.href = "/veli";
        }, 1000);
      }
    } catch {
      setError("Sunucuya bağlanırken bir hata oluştu. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-8 overflow-x-hidden">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center p-2 shadow-lg shadow-emerald-500/10">
              <Image
                src="/gemini-svg.svg"
                alt="DersTakip Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              DersTakip
            </span>
          </Link>
          <p className="text-slate-400 text-sm">
            Veli Portalı & Öğrenci Takip Sistemi
          </p>
        </div>

        {/* Register Card */}
        <Card className="glass border-emerald-500/20 shadow-2xl shadow-emerald-500/5">
          <CardHeader className="text-center pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2 text-emerald-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <CardTitle className="text-xl text-white">Veli Hesabı Oluştur</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Öğrencinizin ders ve gelişim sürecini takip etmek için ücretsiz kaydolun
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* Ad Soyad */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Ad Soyad *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="text"
                    placeholder="Adınız ve Soyadınız"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>

              {/* E-posta */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  E-posta Adresi *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="email"
                    placeholder="ornek@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>

              {/* Telefon */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Telefon Numarası (WhatsApp İletişimi İçin)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>

              {/* Öğrenci Bilgileri (İsteğe Bağlı) */}
              <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-400">
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-xs font-semibold">Öğrencinizin Bilgileri (Öğretmen Paneline Bağlanır)</span>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">
                    Öğrencinin Adı Soyadı
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <Input
                      type="text"
                      placeholder="Örn: Ali Yılmaz"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="pl-9 text-xs h-9 bg-slate-900/60"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-300">
                      Sınıf / Düzey
                    </label>
                    <Input
                      type="text"
                      placeholder="Örn: 8. Sınıf"
                      value={studentGrade}
                      onChange={(e) => setStudentGrade(e.target.value)}
                      className="text-xs h-9 bg-slate-900/60"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-300">
                      Okul Adı
                    </label>
                    <Input
                      type="text"
                      placeholder="Örn: Atatürk O.O."
                      value={studentSchool}
                      onChange={(e) => setStudentSchool(e.target.value)}
                      className="text-xs h-9 bg-slate-900/60"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  * Öğrenci adını girdiğinizde öğretmeniniz öğrencinizi doğrudan görebilir.
                </p>
              </div>

              {/* Şifre */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Şifre * (En az 6 karakter)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Şifre Tekrar */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Şifre Tekrar *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium mt-2"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Kayıt Yapılıyor...
                  </>
                ) : (
                  <>
                    Veli Olarak Kayıt Ol
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>

              <div className="text-center pt-2 border-t border-slate-800 text-xs text-slate-400">
                Zaten bir hesabınız var mı?{" "}
                <Link
                  href="/giris"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
                >
                  Giriş Yapın
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
