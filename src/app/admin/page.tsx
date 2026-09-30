import {
  Calendar,
  Users,
  CreditCard,
  TrendingUp,
  Clock,
  AlertTriangle,
  Plus,
  MessageCircle,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import prisma from "@/lib/prisma";
import Link from "next/link";

async function getDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

  const [
    todayLessons,
    totalStudents,
    overdueStudents,
    monthlyRevenue,
    recentPayments,
  ] = await Promise.all([
    prisma.lesson.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      include: {
        student: { select: { name: true, parent: { select: { phone: true } } } },
        group: { select: { name: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.student.count(),
    prisma.student.findMany({
      where: { balance: { lt: 0 } },
      select: { id: true, name: true, balance: true, monthlyFee: true },
      orderBy: { balance: "asc" },
      take: 5,
    }),
    prisma.payment.aggregate({
      where: { paymentDate: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.findMany({
      include: { student: { select: { name: true } } },
      orderBy: { paymentDate: "desc" },
      take: 5,
    }),
  ]);

  return {
    todayLessons,
    totalStudents,
    overdueStudents,
    monthlyTotal: monthlyRevenue._sum.amount ?? 0,
    monthlyCount: monthlyRevenue._count,
    recentPayments,
  };
}

export default async function AdminDashboard() {
  let data;
  try {
    data = await getDashboardData();
  } catch {
    // DB bağlantısı yoksa demo veri göster
    data = {
      todayLessons: [],
      totalStudents: 0,
      overdueStudents: [],
      monthlyTotal: 0,
      monthlyCount: 0,
      recentPayments: [],
    };
  }

  const statusColors: Record<string, "default" | "success" | "destructive" | "warning"> = {
    SCHEDULED: "default",
    COMPLETED: "success",
    CANCELLED: "destructive",
    POSTPONED: "warning",
  };

  const statusLabels: Record<string, string> = {
    SCHEDULED: "Planlandı",
    COMPLETED: "Tamamlandı",
    CANCELLED: "İptal",
    POSTPONED: "Ertelendi",
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-glow-indigo animate-fade-in">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Bugünün Dersleri
                </p>
                <p className="text-3xl font-bold text-white mt-1">
                  {data.todayLessons.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-glow-emerald animate-fade-in-delay-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Toplam Öğrenci
                </p>
                <p className="text-3xl font-bold text-white mt-1">
                  {data.totalStudents}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-glow-amber animate-fade-in-delay-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Aylık Tahsilat
                </p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatCurrency(data.monthlyTotal)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-glow-rose animate-fade-in-delay-3">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Gecikmiş Ödemeler
                </p>
                <p className="text-3xl font-bold text-white mt-1">
                  {data.overdueStudents.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/takvim">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Hızlı Ders Ekle
          </Button>
        </Link>
        <Link href="/admin/yoklama">
          <Button variant="secondary" size="sm">
            <Clock className="w-4 h-4" />
            Yoklama Al
          </Button>
        </Link>
        <Link href="/admin/okuma">
          <Button variant="secondary" size="sm">
            <BookOpen className="w-4 h-4" />
            Okuma Kaydı
          </Button>
        </Link>
        <Link href="/admin/sinavlar">
          <Button variant="secondary" size="sm">
            <TrendingUp className="w-4 h-4" />
            Sınav Ekle
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Bugünün Programı
              </CardTitle>
              <Link href="/admin/takvim">
                <Button variant="ghost" size="sm">
                  Tümü <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.todayLessons.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">
                  Bugün için planlanmış ders bulunmuyor
                </p>
                <Link href="/admin/takvim">
                  <Button size="sm" className="mt-3">
                    <Plus className="w-4 h-4" />
                    Ders Ekle
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.todayLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-all"
                  >
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold text-white">
                        {lesson.startTime}
                      </p>
                      <p className="text-xs text-slate-500">
                        {lesson.endTime}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {lesson.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {lesson.student?.name || lesson.group?.name || "—"}
                      </p>
                    </div>
                    <Badge variant={statusColors[lesson.status]}>
                      {statusLabels[lesson.status]}
                    </Badge>
                    {lesson.student?.parent?.phone && (
                      <a
                        href={`https://wa.me/90${lesson.student.parent.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                          `Merhaba, ${lesson.student.name}'nin dersi bugün saat ${lesson.startTime}'de başlayacaktır.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="whatsapp" size="icon" className="h-8 w-8">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Payments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Gecikmiş Ödemeler
              </CardTitle>
              <Link href="/admin/odemeler">
                <Button variant="ghost" size="sm">
                  Tümü <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.overdueStudents.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">
                  Tüm ödemeler güncel! 🎉
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.overdueStudents.map((student) => (
                  <Link
                    key={student.id}
                    href={`/admin/ogrenciler/${student.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-amber-500/30 transition-all group"
                  >
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-amber-300 transition-colors">
                        {student.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        Aylık: {formatCurrency(student.monthlyFee)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">
                        {formatCurrency(Math.abs(student.balance))} borç
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
