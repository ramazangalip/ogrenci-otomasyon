"use client";

import { useState, useEffect } from "react";
import { CreditCard, Plus, X, Loader2, TrendingUp, AlertTriangle, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  useEffect(() => {
    Promise.all([
      fetch("/api/payments").then((r) => r.json()),
      fetch("/api/students").then((r) => r.json()),
    ])
      .then(([p, s]) => {
        setPayments(p);
        setStudents(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: form.get("studentId"),
          amount: Number(form.get("amount")),
          paymentDate: form.get("paymentDate") || new Date().toISOString(),
          paymentMethod: form.get("paymentMethod") || null,
          description: form.get("description") || null,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        const [p, s] = await Promise.all([
          fetch("/api/payments").then((r) => r.json()),
          fetch("/api/students").then((r) => r.json()),
        ]);
        setPayments(p);
        setStudents(s);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-400" />
            Ödeme & Kasa Takibi
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Öğrenci ödemelerini ve kasa durumunu yönetin
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Ödeme Ekle
        </Button>
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
                <p className="text-xs text-slate-400 uppercase tracking-wider">Bu Ay Toplam</p>
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
                <p className="text-xs text-slate-400 uppercase tracking-wider">Gecikmiş Ödeme</p>
                <p className="text-2xl font-bold text-white">{overdueStudents.length} öğrenci</p>
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
                <p className="text-xs text-slate-400 uppercase tracking-wider">İşlem Sayısı</p>
                <p className="text-2xl font-bold text-white">{payments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue */}
      {overdueStudents.length > 0 && (
        <Card className="border-amber-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-300">
              <AlertTriangle className="w-5 h-5" />
              Gecikmiş Ödemeler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueStudents.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-amber-500/10"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{s.name}</p>
                    <p className="text-xs text-slate-400">Aylık: {formatCurrency(s.monthlyFee)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{formatCurrency(Math.abs(s.balance))} borç</Badge>
                    {s.parent?.phone && (
                      <a
                        href={generateWhatsAppLink(
                          s.parent.phone,
                          whatsAppTemplates.odemeHatirlatma(s.name, formatCurrency(Math.abs(s.balance)))
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
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
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ödeme Geçmişi</CardTitle>
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
                  <tr>
                    <th>Öğrenci</th>
                    <th>Tutar</th>
                    <th>Yöntem</th>
                    <th>Tarih</th>
                    <th>Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="text-white font-medium">{p.student.name}</td>
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

      {/* Add Payment Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md glass animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Ödeme Kaydet</CardTitle>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Öğrenci *</label>
                  <select name="studentId" required className="flex h-10 w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-200">
                    <option value="">Seçiniz...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Tutar (₺) *</label>
                  <Input name="amount" type="number" required min={0.01} step="0.01" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Ödeme Yöntemi</label>
                  <select name="paymentMethod" className="flex h-10 w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-200">
                    <option value="">Seçiniz...</option>
                    <option value="Nakit">Nakit</option>
                    <option value="Havale/EFT">Havale/EFT</option>
                    <option value="Kredi Kartı">Kredi Kartı</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Tarih</label>
                  <Input name="paymentDate" type="date" />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Açıklama</label>
                  <Input name="description" placeholder="Eylül ayı ücreti" />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>İptal</Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Kaydet
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
