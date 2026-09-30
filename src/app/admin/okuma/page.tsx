"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  X,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ReadingLog {
  id: string;
  bookTitle: string;
  pageCount: number;
  logDate: string;
}

export default function ReadingPage() {
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [logs, setLogs] = useState<ReadingLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((data) =>
        setStudents(data.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })))
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    let ignore = false;
    if (selectedStudent) {
      fetch(`/api/reading?studentId=${selectedStudent}`)
        .then((r) => r.json())
        .then((data) => {
          if (!ignore) {
            setLogs(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!ignore) setLoading(false);
        });
    } else {
      setLogs([]);
      setLoading(false);
    }
    return () => {
      ignore = true;
    };
  }, [selectedStudent]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent,
          bookTitle: form.get("bookTitle"),
          pageCount: Number(form.get("pageCount")),
          logDate: form.get("logDate") || new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        // Refetch
        const r = await fetch(`/api/reading?studentId=${selectedStudent}`);
        setLogs(await r.json());
      }
    } catch (e) {
      console.error("Kayıt hatası:", e);
    } finally {
      setSaving(false);
    }
  }

  // Aylık gruplama (grafik verisi)
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const chartData = (() => {
    const monthly: Record<string, number> = {};
    logs.forEach((log) => {
      const d = new Date(log.logDate);
      const key = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      monthly[key] = (monthly[key] || 0) + log.pageCount;
    });
    return Object.entries(monthly).map(([month, pages]) => ({ month, pages }));
  })();

  const totalPages = logs.reduce((sum, l) => sum + l.pageCount, 0);
  const uniqueBooks = new Set(logs.map((l) => l.bookTitle)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-400" />
            Kitap Okuma Takibi
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Öğrencilerin okuma alışkanlıklarını takip edin
          </p>
        </div>
      </div>

      {/* Student Selector */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 max-w-xs">
          <label className="text-sm text-slate-300 mb-1 block">Öğrenci Seçin</label>
          <select
            className="flex h-10 w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-200"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="">Seçiniz...</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        {selectedStudent && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Okuma Ekle
          </Button>
        )}
      </div>

      {selectedStudent && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="stat-glow-indigo">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Toplam Sayfa</p>
                  <p className="text-2xl font-bold text-white">{totalPages}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="stat-glow-emerald">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Kitap Sayısı</p>
                  <p className="text-2xl font-bold text-white">{uniqueBooks}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aylık Okuma Eğrisi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
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
                        stroke="#6366f1"
                        strokeWidth={3}
                        dot={{ fill: "#6366f1", r: 5 }}
                        activeDot={{ r: 7, fill: "#818cf8" }}
                        name="Sayfa"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Log Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Okuma Kayıtları</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                </div>
              ) : logs.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Henüz okuma kaydı yok</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full data-table">
                    <thead>
                      <tr>
                        <th>Kitap</th>
                        <th>Sayfa</th>
                        <th>Tarih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td className="text-white">{log.bookTitle}</td>
                          <td>{log.pageCount} sayfa</td>
                          <td>{new Date(log.logDate).toLocaleDateString("tr-TR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Reading Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md glass animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Okuma Kaydı Ekle</CardTitle>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Kitap Adı *</label>
                  <Input name="bookTitle" required placeholder="Kitap adı" />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Okunan Sayfa Sayısı *</label>
                  <Input name="pageCount" type="number" required min={1} placeholder="0" />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Tarih</label>
                  <Input name="logDate" type="date" />
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
