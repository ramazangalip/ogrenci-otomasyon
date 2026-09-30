"use client";

import { useState, useEffect } from "react";
import { FileBarChart, Plus, X, Loader2, TrendingUp, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface ExamResult {
  id: string;
  examName: string;
  examDate: string;
  correctCount: number;
  wrongCount: number;
  netScore: number;
  details: Record<string, number> | null;
}

export default function ExamsPage() {
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((data) => setStudents(data.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let ignore = false;
    if (selectedStudent) {
      fetch(`/api/exams?studentId=${selectedStudent}`)
        .then((r) => r.json())
        .then((data) => {
          if (!ignore) {
            setResults(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!ignore) setLoading(false);
        });
    } else {
      setResults([]);
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

    const correctCount = Number(form.get("correctCount"));
    const wrongCount = Number(form.get("wrongCount"));

    // Ders bazlı detaylar
    const details: Record<string, number> = {};
    const detailFields = ["turkce", "mat", "fen", "sosyal", "ingilizce"];
    detailFields.forEach((f) => {
      const val = form.get(f);
      if (val && Number(val) > 0) details[f] = Number(val);
    });

    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent,
          examName: form.get("examName"),
          examDate: form.get("examDate"),
          correctCount,
          wrongCount,
          details: Object.keys(details).length > 0 ? details : undefined,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        const r = await fetch(`/api/exams?studentId=${selectedStudent}`);
        setResults(await r.json());
      }
    } catch (e) {
      console.error("Kayıt hatası:", e);
    } finally {
      setSaving(false);
    }
  }

  const chartData = results.map((r) => ({
    name: r.examName,
    net: r.netScore,
    dogru: r.correctCount,
    yanlis: r.wrongCount,
  }));

  const avgNet = results.length > 0
    ? (results.reduce((sum, r) => sum + r.netScore, 0) / results.length).toFixed(1)
    : "0";

  const lastResult = results[results.length - 1];
  const prevResult = results[results.length - 2];
  const trend = lastResult && prevResult
    ? lastResult.netScore - prevResult.netScore
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileBarChart className="w-7 h-7 text-indigo-400" />
          Deneme Sınavı & Net Analizi
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Öğrenci performansını takip edin
        </p>
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
            Sınav Ekle
          </Button>
        )}
      </div>

      {selectedStudent && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="stat-glow-indigo">
              <CardContent className="p-5 text-center">
                <Target className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400 uppercase">Ort. Net</p>
                <p className="text-2xl font-bold text-white">{avgNet}</p>
              </CardContent>
            </Card>
            <Card className="stat-glow-emerald">
              <CardContent className="p-5 text-center">
                <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400 uppercase">Trend</p>
                <p className={`text-2xl font-bold ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {trend >= 0 ? "+" : ""}{trend.toFixed(1)}
                </p>
              </CardContent>
            </Card>
            <Card className="stat-glow-amber">
              <CardContent className="p-5 text-center">
                <FileBarChart className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400 uppercase">Sınav Sayısı</p>
                <p className="text-2xl font-bold text-white">{results.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Net Gelişim Grafiği</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e2132",
                          border: "1px solid rgba(100,116,139,0.3)",
                          borderRadius: "12px",
                          color: "#f1f5f9",
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} name="Net" />
                      <Line type="monotone" dataKey="dogru" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Doğru" />
                      <Line type="monotone" dataKey="yanlis" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} name="Yanlış" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sınav Sonuçları</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                </div>
              ) : results.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Henüz sınav sonucu yok</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full data-table">
                    <thead>
                      <tr>
                        <th>Sınav</th>
                        <th>Tarih</th>
                        <th>Doğru</th>
                        <th>Yanlış</th>
                        <th>Net</th>
                        <th>Detay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => (
                        <tr key={r.id}>
                          <td className="text-white font-medium">{r.examName}</td>
                          <td>{new Date(r.examDate).toLocaleDateString("tr-TR")}</td>
                          <td className="text-emerald-400">{r.correctCount}</td>
                          <td className="text-red-400">{r.wrongCount}</td>
                          <td>
                            <Badge variant={r.netScore >= 0 ? "success" : "destructive"}>
                              {r.netScore.toFixed(2)}
                            </Badge>
                          </td>
                          <td>
                            {r.details && typeof r.details === "object" && (
                              <div className="flex gap-1 flex-wrap">
                                {Object.entries(r.details as Record<string, number>).map(([k, v]) => (
                                  <Badge key={k} variant="secondary" className="text-[10px]">
                                    {k}: {v}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </td>
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

      {/* Add Exam Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg glass animate-fade-in max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sınav Sonucu Ekle</CardTitle>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Sınav Adı *</label>
                  <Input name="examName" required placeholder="TYT Deneme 1" />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Sınav Tarihi *</label>
                  <Input name="examDate" type="date" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Toplam Doğru *</label>
                    <Input name="correctCount" type="number" required min={0} />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Toplam Yanlış *</label>
                    <Input name="wrongCount" type="number" required min={0} />
                  </div>
                </div>
                <div className="border-t border-slate-700/50 pt-4">
                  <p className="text-sm text-slate-400 mb-3">Ders Bazlı Netler (opsiyonel)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "turkce", label: "Türkçe" },
                      { key: "mat", label: "Matematik" },
                      { key: "fen", label: "Fen" },
                      { key: "sosyal", label: "Sosyal" },
                      { key: "ingilizce", label: "İngilizce" },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="text-xs text-slate-400 mb-1 block">{f.label}</label>
                        <Input name={f.key} type="number" step="0.25" min={0} placeholder="0" />
                      </div>
                    ))}
                  </div>
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
