"use client";

import { useState } from "react";
import { Bell, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VeliBildirimlerPage() {
  const [permission, setPermission] = useState<string>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("Tarayıcınız bildirim desteği sunmuyor.");
      return;
    }

    setLoading(true);
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === "granted") {
        setSubscribed(true);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-400" />
            Bildirim Ayarları ve Tercihleri
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Ders hatırlatmaları, sınav sonuçları ve devamsızlık bildirimleri
          </p>
        </div>
      </div>

      <Card className="border-emerald-500/20">
        <CardHeader>
          <CardTitle className="text-base text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Web Push Bildirimleri (Ücretsiz & Anlık)
          </CardTitle>
          <CardDescription>
            Öğretmen ders başlattığında, yoklama alındığında veya yeni bir sınav sonucu
            girildiğinde cihazınıza anında anlık bildirim gelsin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">Tarayıcı Bildirim İzni</p>
              <p className="text-xs text-slate-400">
                Durum:{" "}
                <span
                  className={
                    permission === "granted" || subscribed
                      ? "text-emerald-400 font-semibold"
                      : "text-amber-400 font-semibold"
                  }
                >
                  {permission === "granted" || subscribed ? "Etkin / İzin Verildi" : "İzin Bekleniyor"}
                </span>
              </p>
            </div>
            {permission === "granted" || subscribed ? (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
                Aktif
              </div>
            ) : (
              <Button
                size="sm"
                onClick={requestPermission}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {loading ? "İsteniyor..." : "Bildirimleri Aç"}
              </Button>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Bildirim Alınacak Durumlar
            </h4>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Öğrenci derse katıldığında veya gelmediğinde (Yoklama)</li>
              <li>Yeni bir deneme / sınav sonucu açıklandığında</li>
              <li>Öğretmen ders sonrası veli notu eklediğinde</li>
              <li>Ders saatinde güncelleme veya erteleme olduğunda</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
