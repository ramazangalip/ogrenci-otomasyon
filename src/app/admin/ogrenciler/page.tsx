"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  X,
  GraduationCap,
  MessageCircle,
  Loader2,
  UserPlus,
  Lock,
  CheckCircle2,
  AlertCircle,
  Building,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, generateWhatsAppLink, whatsAppTemplates } from "@/lib/utils";

interface ParentItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  students?: { id: string; name: string }[];
  _count?: { students: number };
}

interface Student {
  id: string;
  name: string;
  grade: string | null;
  school: string | null;
  monthlyFee: number;
  balance: number;
  tags: string[];
  parent: { id: string; name: string; phone: string | null; email: string } | null;
  _count: { attendances: number; payments: number; lessons: number };
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<ParentItem[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showNewParentForm, setShowNewParentForm] = useState(false);
  const [showParentListModal, setShowParentListModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingParent, setSavingParent] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [selectedParentId, setSelectedParentId] = useState("");

  // New parent inline form states
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentPassword, setParentPassword] = useState("123456");
  const [parentError, setParentError] = useState("");
  const [parentSuccess, setParentSuccess] = useState("");

  useEffect(() => {
    fetchStudents();
    fetchParents();
  }, []);

  async function fetchStudents() {
    try {
      const res = await fetch("/api/students");
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (e) {
      console.error("Öğrenciler yüklenemedi:", e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchParents() {
    try {
      const res = await fetch("/api/parents");
      if (res.ok) {
        const data = await res.json();
        setParents(data);
      }
    } catch (e) {
      console.error("Veliler yüklenemedi:", e);
    }
  }

  async function handleCreateParent(e: React.FormEvent) {
    e.preventDefault();
    setParentError("");
    setParentSuccess("");
    setSavingParent(true);

    try {
      const res = await fetch("/api/parents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parentName,
          email: parentEmail,
          phone: parentPhone || undefined,
          password: parentPassword || "123456",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setParentError(data.error || "Veli oluşturulurken hata oluştu");
      } else {
        setParentSuccess("Veli hesabı başarıyla oluşturuldu!");
        // Add to parents list and select
        setParents((prev) => [data, ...prev]);
        setSelectedParentId(data.id);
        setParentName("");
        setParentEmail("");
        setParentPhone("");
        setParentPassword("123456");
        setTimeout(() => {
          setShowNewParentForm(false);
          setParentSuccess("");
        }, 1200);
      }
    } catch (err) {
      setParentError("Sunucu hatası oluştu");
    } finally {
      setSavingParent(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    formData.set("tags", tagsInput);
    if (selectedParentId) {
      formData.set("parentId", selectedParentId);
    } else {
      formData.delete("parentId");
    }

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setShowForm(false);
        setTagsInput("");
        setSelectedParentId("");
        setShowNewParentForm(false);
        fetchStudents();
      }
    } catch (e) {
      console.error("Kayıt hatası:", e);
    } finally {
      setSaving(false);
    }
  }

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.school?.toLowerCase().includes(search.toLowerCase()) ||
      s.grade?.toLowerCase().includes(search.toLowerCase()) ||
      s.parent?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-400" />
            Öğrenciler & Veliler
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {students.length} öğrenci, {parents.length} kayıtlı veli
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowParentListModal(true)}
            className="border-slate-700 hover:border-slate-600"
          >
            <Users className="w-4 h-4 mr-1.5 text-emerald-400" />
            Velileri Yönet ({parents.length})
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-500">
            <Plus className="w-4 h-4 mr-1.5" />
            Yeni Öğrenci Ekle
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          placeholder="Öğrenci, veli, okul veya sınıf ara..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Add Student Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-xl glass animate-fade-in my-8 max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10 pb-4 border-b border-slate-800">
              <div>
                <CardTitle className="text-lg">Yeni Öğrenci Ekle</CardTitle>
                <CardDescription>Öğrenci ve veli eşleştirmesini yapın</CardDescription>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setShowNewParentForm(false);
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-slate-300 mb-1 block">
                      Öğrenci Adı Soyadı *
                    </label>
                    <Input name="name" required placeholder="Örn: Ali Yılmaz" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">
                      Sınıf / Düzey
                    </label>
                    <Input name="grade" placeholder="Örn: 8. Sınıf / LGS" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">
                      Okul
                    </label>
                    <Input name="school" placeholder="Örn: Atatürk Ortaokulu" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-sm font-medium text-slate-300 mb-1 block">
                      Aylık Ders Ücreti (₺)
                    </label>
                    <Input
                      name="monthlyFee"
                      type="number"
                      placeholder="0"
                      min={0}
                    />
                  </div>

                  {/* Parent Selection & Quick Add */}
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-slate-300">
                        Öğrencinin Velisi
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowNewParentForm(!showNewParentForm)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {showNewParentForm ? "Listeden Seç" : "+ Yeni Veli Tanımla"}
                      </button>
                    </div>

                    {!showNewParentForm ? (
                      <select
                        value={selectedParentId}
                        onChange={(e) => setSelectedParentId(e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      >
                        <option value="">-- Veli Seçilmedi (Daha sonra eklenebilir) --</option>
                        {parents.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.email}{p.phone ? ` - ${p.phone}` : ""})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-800/60 border border-indigo-500/30 space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                            <UserPlus className="w-3.5 h-3.5" />
                            Hızlı Veli Hesabı Oluştur
                          </span>
                        </div>

                        {parentSuccess && (
                          <div className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {parentSuccess}
                          </div>
                        )}
                        {parentError && (
                          <div className="text-xs text-red-400 flex items-center gap-1.5 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {parentError}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <Input
                              placeholder="Veli Adı Soyadı *"
                              value={parentName}
                              onChange={(e) => setParentName(e.target.value)}
                              className="text-xs h-9"
                            />
                          </div>
                          <div>
                            <Input
                              type="email"
                              placeholder="Veli E-posta *"
                              value={parentEmail}
                              onChange={(e) => setParentEmail(e.target.value)}
                              className="text-xs h-9"
                            />
                          </div>
                          <div>
                            <Input
                              placeholder="Telefon (05XX XXX XX XX)"
                              value={parentPhone}
                              onChange={(e) => setParentPhone(e.target.value)}
                              className="text-xs h-9"
                            />
                          </div>
                          <div>
                            <Input
                              placeholder="Giriş Şifresi (Varsayılan: 123456)"
                              value={parentPassword}
                              onChange={(e) => setParentPassword(e.target.value)}
                              className="text-xs h-9"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleCreateParent}
                            disabled={savingParent || !parentName || !parentEmail}
                            className="bg-emerald-600 hover:bg-emerald-500 text-xs h-8"
                          >
                            {savingParent ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                            ) : (
                              <Plus className="w-3.5 h-3.5 mr-1" />
                            )}
                            Veliyi Kaydet ve Seç
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">
                    Konular / Etiketler
                  </label>
                  <Textarea
                    placeholder="Öğrencinin güçlü veya zayıf konuları: Matematik Geometri, Paragraf Güçlü, Fizik Takip"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setShowNewParentForm(false);
                    }}
                  >
                    İptal
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-500">
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    ) : (
                      <Plus className="w-4 h-4 mr-1.5" />
                    )}
                    Öğrenciyi Kaydet
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Parent Management Modal */}
      {showParentListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl glass animate-fade-in my-8 max-h-[90vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  Kayıtlı Veliler Portalı
                </CardTitle>
                <CardDescription>
                  Sistemdeki tüm veli hesapları ({parents.length} veli)
                </CardDescription>
              </div>
              <button
                onClick={() => {
                  setShowParentListModal(false);
                  setShowNewParentForm(false);
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-4 overflow-y-auto flex-1 space-y-4">
              {/* Quick Add Parent Banner */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    Yeni Veli Hesabı Tanımla
                  </span>
                </div>

                {parentSuccess && (
                  <div className="text-xs text-emerald-400 mb-2 flex items-center gap-1 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {parentSuccess}
                  </div>
                )}
                {parentError && (
                  <div className="text-xs text-red-400 mb-2 flex items-center gap-1 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {parentError}
                  </div>
                )}

                <form onSubmit={handleCreateParent} className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      placeholder="Ad Soyad *"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      required
                    />
                    <Input
                      type="email"
                      placeholder="E-posta Adresi *"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Telefon (05XX XXX XX XX)"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                    />
                    <Input
                      placeholder="Giriş Şifresi (Varsayılan: 123456)"
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={savingParent}
                      className="bg-emerald-600 hover:bg-emerald-500"
                    >
                      {savingParent ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      ) : (
                        <Plus className="w-4 h-4 mr-1.5" />
                      )}
                      Veli Hesabı Oluştur
                    </Button>
                  </div>
                </form>
              </div>

              {/* Parents List */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Mevcut Veli Hesapları
                </h3>
                {parents.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">
                    Henüz kayıtlı veli bulunmuyor.
                  </p>
                ) : (
                  parents.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/40 flex items-center justify-between gap-3 hover:border-slate-600 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{p.name}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {p.students?.length || p._count?.students || 0} Öğrenci
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {p.email}
                          </span>
                          {p.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {p.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.phone && (
                          <a
                            href={generateWhatsAppLink(
                              p.phone,
                              "Merhaba, DersTakip sistemi üzerinden bilgilendirme mesajıdır."
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="whatsapp" size="icon" className="h-8 w-8">
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        <a href={`mailto:${p.email}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Mail className="w-4 h-4" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <GraduationCap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">
            {search ? "Arama sonucu bulunamadı" : "Henüz öğrenci eklenmemiş"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((student) => (
            <Card
              key={student.id}
              className="group hover:border-indigo-500/30 transition-all"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {student.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {student.grade && `${student.grade}`}
                      {student.grade && student.school && " • "}
                      {student.school && student.school}
                    </p>
                  </div>
                  {student.balance < 0 && (
                    <Badge variant="destructive">
                      {formatCurrency(Math.abs(student.balance))} borç
                    </Badge>
                  )}
                </div>

                {/* Tags */}
                {student.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {student.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                  <span>{student._count.lessons} ders</span>
                  <span>{student._count.attendances} yoklama</span>
                  <span>{formatCurrency(student.monthlyFee)}/ay</span>
                </div>

                {/* Parent Info & Actions */}
                {student.parent ? (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-700/30">
                    <div className="text-xs text-slate-400">
                      <div className="flex items-center gap-1 text-slate-300 font-medium">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        {student.parent.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {student.parent.phone || student.parent.email}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {student.parent.phone && (
                        <>
                          <a href={`tel:${student.parent.phone}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Phone className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                          <a
                            href={generateWhatsAppLink(
                              student.parent.phone,
                              whatsAppTemplates.odemeHatirlatma(
                                student.name,
                                formatCurrency(student.monthlyFee)
                              )
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="whatsapp" size="icon" className="h-7 w-7">
                              <MessageCircle className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        </>
                      )}
                      <a href={`mailto:${student.parent.email}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Mail className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-700/30 text-xs text-slate-500 italic">
                    Veli atanmamış
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
