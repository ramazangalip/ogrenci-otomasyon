import {
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  Calendar,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function VeliDashboard() {
  const session = await auth();

  if (!session || session.user.role !== "PARENT") {
    redirect("/giris");
  }

  const students = await prisma.student.findMany({
    where: { parentId: session.user.id },
    include: {
      lessons: {
        orderBy: { date: "desc" },
        take: 5,
        where: { notePublic: { not: null } },
      },
      attendances: {
        include: { lesson: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      readingLogs: { orderBy: { logDate: "desc" }, take: 10 },
      examResults: { orderBy: { examDate: "desc" }, take: 5 },
      payments: { orderBy: { paymentDate: "desc" }, take: 10 },
    },
    orderBy: { createdAt: "desc" },
  });

  if (students.length === 0) {
    return (
      <div className="text-center py-20">
        <GraduationCap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-1">Kayıtlı Öğrenci Bulunamadı</h3>
        <p className="text-slate-400 text-sm">
          Hesabınıza henüz atanmış bir öğrenci bulunmamaktadır. Lütfen öğretmeninizle iletişime geçin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {students.map((student) => {
        const attended = student.attendances.filter(
          (a) => a.status === "ATTENDED"
        ).length;
        const totalAttendance = student.attendances.length;
        const attendanceRate =
          totalAttendance > 0 ? Math.round((attended / totalAttendance) * 100) : 100;

        const totalPages = student.readingLogs.reduce(
          (sum, l) => sum + l.pageCount,
          0
        );

        const lastExam = student.examResults[0];

        const debtAmount = student.balance < 0 ? Math.abs(student.balance) : 0;

        return (
          <div key={student.id} className="space-y-4">
            {/* Student Header */}
            <Card className="border-emerald-500/20 bg-gradient-to-r from-slate-900/90 to-emerald-950/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-emerald-500/20">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{student.name}</h2>
                    <p className="text-sm text-slate-400">
                      {student.grade && `${student.grade}`}
                      {student.grade && student.school && " • "}
                      {student.school}
                    </p>
                    {student.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {student.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-slate-800 hover:border-emerald-500/30 transition-all">
                <CardContent className="p-4 text-center">
                  <ClipboardCheck className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-400">Devam Oranı</p>
                  <p className="text-lg font-bold text-white">%{attendanceRate}</p>
                </CardContent>
              </Card>
              <Card className="border-slate-800 hover:border-indigo-500/30 transition-all">
                <CardContent className="p-4 text-center">
                  <BookOpen className="w-6 h-6 text-indigo-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-400">Okunan Kitap</p>
                  <p className="text-lg font-bold text-white">{totalPages} sayfa</p>
                </CardContent>
              </Card>
              <Card className="border-slate-800 hover:border-amber-500/30 transition-all">
                <CardContent className="p-4 text-center">
                  <FileText className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-400">Son Sınav Neti</p>
                  <p className="text-lg font-bold text-white">
                    {lastExam ? lastExam.netScore.toFixed(1) : "—"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-800 hover:border-rose-500/30 transition-all">
                <CardContent className="p-4 text-center">
                  <CreditCard className={`w-6 h-6 mx-auto mb-1 ${debtAmount > 0 ? "text-rose-400" : "text-emerald-400"}`} />
                  <p className="text-xs text-slate-400">Borç Durumu</p>
                  <p
                    className={`text-lg font-bold ${
                      debtAmount > 0 ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {debtAmount > 0 ? `${formatCurrency(debtAmount)} Borç` : "0 ₺ (Borç Yok)"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Lessons with Notes */}
            <Card className="border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  Son Dersler & Öğretmen Notları
                </CardTitle>
              </CardHeader>
              <CardContent>
                {student.lessons.length === 0 ? (
                  <p className="text-center text-slate-400 py-6 text-sm">
                    Henüz veli notu eklenmiş ders bulunmuyor
                  </p>
                ) : (
                  <div className="space-y-3">
                    {student.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/40"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-white">
                            {lesson.title}
                          </p>
                          <span className="text-xs text-slate-400">
                            {new Date(lesson.date).toLocaleDateString("tr-TR")} • {lesson.startTime}
                          </span>
                        </div>
                        {lesson.notePublic && (
                          <div className="mt-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
                            💬 <span className="font-medium">Öğretmen Notu:</span> {lesson.notePublic}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
