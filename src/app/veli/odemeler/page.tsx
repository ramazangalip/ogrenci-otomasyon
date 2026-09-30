import { CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function VeliOdemelerPage() {
  const session = await auth();

  if (!session || session.user.role !== "PARENT") {
    redirect("/giris");
  }

  const students = await prisma.student.findMany({
    where: { parentId: session.user.id },
    select: { id: true, balance: true },
  });

  const totalDebt = students.reduce(
    (sum, s) => sum + (s.balance < 0 ? Math.abs(s.balance) : 0),
    0
  );

  const payments = await prisma.payment.findMany({
    where: { studentId: { in: students.map((s) => s.id) } },
    include: { student: { select: { id: true, name: true } } },
    orderBy: { paymentDate: "desc" },
  });

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            Ödeme Geçmişi ve Makbuzlar
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Yapılan tahsilat dökümü ve güncel borç durumu
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-slate-900/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Toplam Ödenen
                </p>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-slate-800 ${totalDebt > 0 ? "border-rose-500/30 bg-rose-950/10" : "bg-slate-900/60"}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Güncel Borç
                </p>
                <p className={`text-2xl font-extrabold mt-1 ${totalDebt > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {totalDebt > 0 ? formatCurrency(totalDebt) : "0 ₺ (Yok)"}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${totalDebt > 0 ? "bg-rose-500/20" : "bg-emerald-500/20"}`}>
                <CreditCard className={`w-5 h-5 ${totalDebt > 0 ? "text-rose-400" : "text-emerald-400"}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  İşlem Sayısı
                </p>
                <p className="text-2xl font-extrabold text-white mt-1">
                  {payments.length} adet
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History List */}
      <Card className="border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Geçmiş Ödemeler</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              Henüz kayıtlı bir ödeme bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between gap-4 hover:border-slate-600/50 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">
                        {payment.description || "Ders Ücreti Ödemesi"}
                      </p>
                      {payment.paymentMethod && (
                        <Badge variant="secondary" className="text-[10px]">
                          {payment.paymentMethod}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {new Date(payment.paymentDate).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      {payment.student?.name && ` • ${payment.student.name}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-emerald-400">
                      +{formatCurrency(payment.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
