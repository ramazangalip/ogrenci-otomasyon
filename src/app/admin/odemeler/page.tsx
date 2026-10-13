"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  X,
  Loader2,
  TrendingUp,
  AlertTriangle,
  MessageCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, generateWhatsAppLink, whatsAppTemplates } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string | null;
  description: string | null;
  student: { id: string; name: string };
}

interface StudentDebt {
  id: string;
  name: string;
  balance: number;
  monthlyFee: number;
  parent?: { phone: string | null; name: string } | null;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<StudentDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form type: "PAYMENT" = Tahsilat (Ödeme Alındı), "CHARGE" = Borçlandırma (Gecikmiş / Beklenen Ödeme)
  const [formType, setFormType] = useState<"PAYMENT" | "CHARGE">("PAYMENT");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [presetAmount, setPresetAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Nakit");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [p, s] = await Promise.all([
        fetch("/api/payments").then((r) => r.json()),
        fetch("/api/students").then((r) => r.json()),
      ]);
      setPayments(Array.isArray(p) ? p : []);
      setStudents(Array.isArray(s) ? s : []);
    } catch (e) {
      console.error("Veriler yüklenemedi:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          studentId: selectedStudentId,
          amount: Number(presetAmount),
          paymentDate: paymentDate || new Date().toISOString(),
          paymentMethod: formType === "PAYMENT" ? paymentMethod : null,
          description: description || null,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setSelectedStudentId("");
        setPresetAmount("");
        setDescription("");
        await fetchData();
      }
    } catch (e) {
      console.error("Kayıt hatası:", e);
    } finally {
      setSaving(false);
    }
  }

  const totalRevenue = payments
    .filter((p) => {
      const d = new Date(p.paymentDate);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const overdueStudents = students.filter((s) => s.balance < 0);
  const totalOverdueDebt = overdueStudents.reduce((sum, s) => sum + Math.abs(s.balance), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-400" />
            Ödeme & Kasa Takibi
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tahsilatları, öğrenci borçlarını ve gecikmiş ödemeleri yönetin
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => {
              setFormType("CHARGE");
              setSelectedStudentId("");
              setPresetAmount("");
              setDescription("");
              setPaymentDate(new Date().toISOString().split("T")[0]);
              setShowForm(true);
            }}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm"
          >
            <AlertTriangle className="w-4 h-4 mr-1.5" />
            Borç / Gecikmiş Ödeme Ekle
          </Button>
          <Button
            onClick={() => {
              setFormType("PAYMENT");
              setSelectedStudentId("");
              setPresetAmount("");
              setDescription("");
              setPaymentDate(new Date().toISOString().split("T")[0]);
              setShowForm(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tahsilat Ekle (Ödeme Alındı)
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="stat-glow-emerald">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Bu Ay Tahsilat</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-glow-amber">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Gecikmiş Toplam Borç</p>
                <p className="text-2xl font-bold text-amber-300">
                  {formatCurrency(totalOverdueDebt)}{" "}
                  <span className="text-xs font-normal text-slate-400">({overdueStudents.length} öğrenci)</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-glow-indigo">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Tahsilat İşlem Sayısı</p>
                <p className="text-2xl font-bold text-white">{payments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Section */}
      <Card className="border-amber-500/30 bg-amber-500/[0.02]">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-amber-300">
              <AlertTriangle className="w-5 h-5" />
              Gecikmiş Ödemeler & Borç Takibi
            </CardTitle>
            <CardDescription className="text-xs">
              Öğrencilerin vadesi geçmiş veya ödenmemiş ders borçları
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setFormType("CHARGE");
              setSelectedStudentId("");
              setPresetAmount("");
              setDescription("");
              setShowForm(true);
            }}
            className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs h-8"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            + Yeni Borç / Gecikme Ekle
          </Button>
        </CardHeader>
        <CardContent>
          {overdueStudents.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">
                Şu anda gecikmiş ödemesi olan öğrenci bulunmuyor.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Öğrenciye geçmiş tarihli veya yeni bir ders borcu tahakkuk ettirmek için yukarıdaki butonu kullanabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {overdueStudents.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-amber-500/20 gap-3 hover:border-amber-500/40 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{s.name}</p>
                      {s.parent && (
                        <span className="text-xs text-slate-400">
                          (Veli: {s.parent.name})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      {s.monthlyFee > 0 && <span>Aylık Ücret: {formatCurrency(s.monthlyFee)}</span>}
                      {s.parent?.phone && <span>Tel: {s.parent.phone}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Badge variant="destructive" className="text-xs px-2.5 py-1">
                      {formatCurrency(Math.abs(s.balance))} borç
                    </Badge>

                    {/* Hızlı Tahsil Et Butonu */}
                    <Button
                      size="sm"
                      onClick={() => {
                        setFormType("PAYMENT");
                        setSelectedStudentId(s.id);
                        setPresetAmount(String(Math.abs(s.balance)));
                        setDescription(`${s.name} - Borç Kapatma`);
                        setShowForm(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                      Tahsil Et
                    </Button>

                    {/* Borç Ekle Butonu */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setFormType("CHARGE");
                        setSelectedStudentId(s.id);
                        setPresetAmount("");
                        setDescription("");
                        setShowForm(true);
                      }}
                      className="border-slate-700 text-slate-300 hover:text-white text-xs h-8"
                    >
                      + Borç Ekle
                    </Button>

                    {/* WhatsApp Butonu */}
                    {s.parent?.phone && (
                      <a
                        href={generateWhatsAppLink(
                          s.parent.phone,
                          whatsAppTemplates.odemeHatirlatma(s.name, formatCurrency(Math.abs(s.balance)))
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="WhatsApp Hatırlatma Mesajı Gönder"
                      >
                        <Button variant="whatsapp" size="icon" className="h-8 w-8">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tahsilat Geçmişi</CardTitle>
          <CardDescription className="text-xs">Sisteme kaydedilen başarılı ödemeler</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Henüz ödeme kaydı yok</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400">
                    <th className="text-left py-2.5">Öğrenci</th>
                    <th className="text-left py-2.5">Tutar</th>
                    <th className="text-left py-2.5">Yöntem</th>
                    <th className="text-left py-2.5">Tarih</th>
                    <th className="text-left py-2.5">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="text-white font-medium py-3">{p.student.name}</td>
                      <td>
                        <Badge variant="success">{formatCurrency(p.amount)}</Badge>
                      </td>
                      <td>{p.paymentMethod || "—"}</td>
                      <td>{new Date(p.paymentDate).toLocaleDateString("tr-TR")}</td>
                      <td className="text-slate-400">{p.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment / Charge Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-md glass animate-fade-in my-8 border-slate-700/60">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <CardTitle className="text-base text-white">
                  {formType === "PAYMENT" ? "Tahsilat Kaydet (Ödeme Alındı)" : "Borç / Gecikmiş Ödeme Ekle"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {formType === "PAYMENT"
                    ? "Öğrencinin yaptığı ödemeyi işleyin (borcu kapatır)"
                    : "Öğrenciye ödenmemiş ders ücreti tahakkuk ettirin (Gecikmiş ödemelere düşer)"}
                </CardDescription>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 mb-4">
                <button
                  type="button"
                  onClick={() => setFormType("PAYMENT")}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    formType === "PAYMENT"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Tahsilat (Ödeme Alındı)
                </button>
                <button
                  type="button"
                  onClick={() => setFormType("CHARGE")}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    formType === "CHARGE"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Borç / Gecikmiş Ekle
                </button>
              </div>

              {formType === "CHARGE" ? (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Bu tutar öğrencinin bakiyesini borçlandıracak ve <strong>Gecikmiş Ödemeler</strong> listesine yansıyacaktır.
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Bu tutar öğrencinin borcunu kapatacak ve <strong>Tahsilat Geçmişi</strong> listesine işlenecektir.
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">Öğrenci *</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedStudentId(id);
                      if (formType === "PAYMENT") {
                        const st = students.find((s) => s.id === id);
                        if (st && st.balance < 0) {
                          setPresetAmount(String(Math.abs(st.balance)));
                        }
                      }
                    }}
                    required
                    className="flex h-10 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Öğrenci Seçiniz...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.balance < 0 ? `(${formatCurrency(Math.abs(s.balance))} Borçlu)` : s.balance > 0 ? `(${formatCurrency(s.balance)} Artıda)` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">
                    {formType === "PAYMENT" ? "Tahsil Edilen Tutar (₺) *" : "Borç / Ücret Tutarı (₺) *"}
                  </label>
                  <Input
                    type="number"
                    required
                    min={0.01}
                    step="0.01"
                    placeholder="0.00"
                    value={presetAmount}
                    onChange={(e) => setPresetAmount(e.target.value)}
                  />
                </div>

                {formType === "PAYMENT" && (
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1 block">Ödeme Yöntemi</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Nakit">Nakit</option>
                      <option value="Havale/EFT">Havale/EFT</option>
                      <option value="Kredi Kartı">Kredi Kartı</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">
                    {formType === "PAYMENT" ? "Ödeme Tarihi" : "Vade / Gecikme Tarihi (Geçmiş veya Güncel)"}
                  </label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">Açıklama</label>
                  <Input
                    placeholder={
                      formType === "PAYMENT"
                        ? "Örn: Ekim ayı ders ücreti tahsilatı"
                        : "Örn: Gecikmiş 4 saatlik özel ders, Eylül ücreti"
                    }
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-800">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving || !selectedStudentId || !presetAmount}
                    className={
                      formType === "PAYMENT"
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                        : "bg-amber-600 hover:bg-amber-500 text-white"
                    }
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    ) : (
                      <Plus className="w-4 h-4 mr-1.5" />
                    )}
                    {formType === "PAYMENT" ? "Tahsilatı Kaydet" : "Borcu Kaydet"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
