"use client";

import { useState, useEffect } from "react";
import { FolderOpen, Plus, X, Users, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Group {
  id: string;
  name: string;
  capacity: number;
  level: string | null;
  students: { student: { id: string; name: string } }[];
  _count: { students: number; lessons: number };
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/groups").then((r) => r.json()),
      fetch("/api/students").then((r) => r.json()),
    ])
      .then(([g, s]) => {
        setGroups(g);
        setStudents(s.map((st: { id: string; name: string }) => ({ id: st.id, name: st.name })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          capacity: Number(form.get("capacity")) || 10,
          level: form.get("level") || null,
          studentIds: selectedStudents,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setSelectedStudents([]);
        const g = await fetch("/api/groups").then((r) => r.json());
        setGroups(g);
      }
    } catch (e) {
      console.error("Kayıt hatası:", e);
    } finally {
      setSaving(false);
    }
  }

  async function deleteGroup(id: string) {
    if (!confirm("Bu grubu silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/groups/${id}`, { method: "DELETE" });
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } catch (e) {
      console.error("Silme hatası:", e);
    }
  }

  function toggleStudent(id: string) {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-7 h-7 text-indigo-400" />
            Gruplar
          </h1>
          <p className="text-sm text-slate-400 mt-1">{groups.length} grup oluşturulmuş</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Yeni Grup
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Henüz grup oluşturulmamış</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Card key={group.id} className="group hover:border-indigo-500/30 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">{group.name}</h3>
                    {group.level && (
                      <Badge variant="secondary" className="mt-1">{group.level}</Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400" onClick={() => deleteGroup(group.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {group._count.students}/{group.capacity}
                  </span>
                  <span>{group._count.lessons} ders</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.students.map((gs) => (
                    <Badge key={gs.student.id} variant="default" className="text-[10px]">
                      {gs.student.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md glass animate-fade-in max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Yeni Grup Oluştur</CardTitle>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Grup Adı *</label>
                  <Input name="name" required placeholder="8. Sınıf Matematik" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Kapasite</label>
                    <Input name="capacity" type="number" defaultValue={10} min={1} />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Seviye</label>
                    <Input name="level" placeholder="İleri" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Öğrenci Seçin</label>
                  <div className="max-h-40 overflow-y-auto space-y-1 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                    {students.map((s) => (
                      <label
                        key={s.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                          selectedStudents.includes(s.id)
                            ? "bg-indigo-500/20 border border-indigo-500/30"
                            : "hover:bg-slate-700/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(s.id)}
                          onChange={() => toggleStudent(s.id)}
                          className="rounded"
                        />
                        <span className="text-sm text-slate-200">{s.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>İptal</Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Oluştur
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
