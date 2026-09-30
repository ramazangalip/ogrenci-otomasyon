"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ReadingLogItem {
  id: string;
  studentId: string;
  bookTitle: string;
  pageCount: number;
  logDate: Date | string;
}

interface StudentItem {
  id: string;
  name: string;
}

export default function ReadingClient({
  students,
  initialLogs,
}: {
  students: StudentItem[];
  initialLogs: ReadingLogItem[];
}) {
  const [selectedStudent, setSelectedStudent] = useState(
    students[0]?.id || ""
  );

  const filteredLogs = initialLogs.filter(
    (log) => !selectedStudent || log.studentId === selectedStudent
  );

  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const chartData = (() => {
    const monthly: Record<string, number> = {};
    filteredLogs.forEach((log) => {
      const d = new Date(log.logDate);
      const key = `${months[d.getMonth()]}`;
      monthly[key] = (monthly[key] || 0) + log.pageCount;
    });
    return Object.entries(monthly).map(([month, pages]) => ({ month, pages }));
  })();

  const totalPages = filteredLogs.reduce((sum, l) => sum + l.pageCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            Kitap Okuma Takibi
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Öğrencinizin düzenli kitap okuma alışkanlığı ve sayfa istatistikleri
          </p>
        </div>

        {students.length > 1 && (
          <select
            className="flex h-10 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm text-slate-200"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Total Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-slate-800 bg-slate-900/60">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Toplam Okunan Sayfa</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-1">
              {totalPages} sayfa
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/60">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Okunan Kitap Sayısı</p>
            <p className="text-3xl font-extrabold text-white mt-1">
              {filteredLogs.length} adet
            </p>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 1 && (
        <Card className="border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-200">Aylık Okuma Eğrisi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e2132",
                      border: "1px solid rgba(100,116,139,0.3)",
                      borderRadius: "12px",
                      color: "#f1f5f9",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pages"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", r: 5 }}
                    name="Sayfa"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Okuma Kayıtları</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">
              Henüz okuma kaydı bulunmuyor.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/40"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{log.bookTitle}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(log.logDate).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">
                    +{log.pageCount} sayfa
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
