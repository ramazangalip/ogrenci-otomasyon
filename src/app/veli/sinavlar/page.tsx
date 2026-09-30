import { FileBarChart, Award, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function VeliSinavlarPage() {
  const session = await auth();

  if (!session || session.user.role !== "PARENT") {
    redirect("/giris");
  }

  const childIds = await prisma.student.findMany({
    where: { parentId: session.user.id },
    select: { id: true },
  });

  const exams = await prisma.examResult.findMany({
    where: { studentId: { in: childIds.map((c) => c.id) } },
    include: { student: { select: { name: true } } },
    orderBy: { examDate: "desc" },
  });

  const avgNet =
    exams.length > 0
      ? (exams.reduce((sum, e) => sum + e.netScore, 0) / exams.length).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-emerald-400" />
            Sınav Sonuçları ve Net Gelişimi
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Öğrencinizin deneme ve sınav performans karnesi
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="border-slate-800 bg-slate-900/60">
          <CardContent className="p-4 text-center">
            <Award className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
            <p className="text-xs text-slate-400">Toplam Sınav</p>
            <p className="text-2xl font-bold text-white">{exams.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/60">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-amber-400 mx-auto mb-1" />
            <p className="text-xs text-slate-400">Ortalama Net</p>
            <p className="text-2xl font-bold text-white">{avgNet}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/60 col-span-2 sm:col-span-1">
          <CardContent className="p-4 text-center">
            <FileBarChart className="w-6 h-6 text-indigo-400 mx-auto mb-1" />
            <p className="text-xs text-slate-400">Son Sınav Neti</p>
            <p className="text-2xl font-bold text-white">
              {exams[0] ? exams[0].netScore.toFixed(1) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Exam List */}
      <Card className="border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Sınav Dökümü</CardTitle>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Henüz girilmiş bir sınav sonucu bulunmamaktadır.
            </div>
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <h3 className="font-semibold text-white">{exam.examName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(exam.examDate).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      • {exam.student.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      {exam.correctCount} Doğru
                    </Badge>
                    <Badge variant="secondary" className="bg-rose-500/10 text-rose-400 border-rose-500/20">
                      {exam.wrongCount} Yanlış
                    </Badge>
                    <Badge variant="default" className="bg-emerald-600 text-white font-bold px-3">
                      {exam.netScore.toFixed(1)} Net
                    </Badge>
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
