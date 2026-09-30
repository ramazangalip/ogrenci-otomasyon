"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Smartphone,
  CheckCircle2,
  Share2,
  PlusSquare,
  Sparkles,
  X,
  ExternalLink,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Service worker kaydı
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker registered"))
        .catch((err) => console.log("Service Worker registration failed:", err));
    }

    // Uygulama daha önce yüklendi mi (standalone mod) kontrolü
    if (
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true)
    ) {
      setIsInstalled(true);
    }

    // iOS cihaz tespiti
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIosDevice);
    }

    // PWA Kurulum İstemi (Chrome / Edge / Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallSuccess(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) {
      setInstallSuccess(true);
      return;
    }

    // Doğrudan browser promptu tetiklenebiliyorsa
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          setIsInstalled(true);
          setInstallSuccess(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Yükleme hatası:", err);
        setShowGuideModal(true);
      }
    } else {
      // iOS veya otomatik prompt desteklemeyen tarayıcılar için rehber penceresi
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <section className="relative py-16 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto glass rounded-3xl p-8 lg:p-12 text-center relative overflow-hidden border border-indigo-500/30 shadow-2xl shadow-indigo-500/10">
          {/* Arka plan ışık efekti */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/25 animate-bounce-slow">
            <Smartphone className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Mobil Uygulama Gibi Kullanın
          </h2>
          <p className="text-slate-300 mb-8 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
            PWA teknolojisi sayesinde telefonunuza veya bilgisayarınıza tek tıkla yükleyin.
            Uygulama mağazalarına gerek kalmadan ana ekranınızdan anında ve tam ekran erişin.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={handleInstallClick}
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-semibold shadow-lg shadow-indigo-500/25 px-8 py-6 text-base rounded-2xl group transition-all hover:scale-105"
            >
              {isInstalled ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-300" />
                  Uygulama Zaten Yüklü
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2 group-hover:translate-y-0.5 transition-transform" />
                  Uygulamayı Cihazına İndir / Yükle
                </>
              )}
            </Button>
          </div>

          {installSuccess && (
            <div className="mt-4 inline-flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>DersTakip uygulaması cihazınıza başarıyla yüklendi!</span>
            </div>
          )}
        </div>
      </section>

      {/* Kurulum Rehberi Modal (iOS / Masaüstü Rehberi) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md glass border border-slate-700/60 rounded-3xl p-6 relative shadow-2xl animate-scale-up">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Uygulamayı Yükleme Rehberi</h3>
                <p className="text-xs text-slate-400">Ana ekrana eklemek için aşağıdaki adımları izleyin</p>
              </div>
            </div>

            {isIOS ? (
              /* iOS Safari Rehberi */
              <div className="space-y-4 text-left">
                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                      Safari Paylaş Butonuna Basın
                      <Share2 className="w-4 h-4 text-indigo-400" />
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Safari tarayıcısının altındaki Paylaş (Kare ve yukarı ok) simgesine dokunun.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                      &quot;Ana Ekrana Ekle&quot; Seçin
                      <PlusSquare className="w-4 h-4 text-emerald-400" />
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Açılan menüde aşağı kaydırarak <strong>&quot;Ana Ekrana Ekle&quot;</strong> seçeneğine dokunun.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Masaüstü / Android Rehberi */
              <div className="space-y-4 text-left">
                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                      Tarayıcı Yükleme Butonu
                      <Laptop className="w-4 h-4 text-indigo-400" />
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Chrome veya Edge tarayıcınızın adres çubuğunun sağ tarafındaki <strong>&quot;Uygulamayı Yükle&quot;</strong> (veya ⊕) simgesine tıklayın.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                      Menü Üzerinden Yükleme
                      <ExternalLink className="w-4 h-4 text-emerald-400" />
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tarayıcı sağ üst menüsünden (&vellip;) <strong>&quot;Kaydet ve Paylaş / Uygulamayı Yükle&quot;</strong> seçeneğini kullanabilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 rounded-xl"
              onClick={() => setShowGuideModal(false)}
            >
              Anladım
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
