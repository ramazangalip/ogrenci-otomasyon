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
  Calendar,
  Link as LinkIcon,
  Unlink,
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
  createdAt?: string;
  students?: { id: string; name: string; grade?: string | null; school?: string | null }[];
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
  const [activeTab, setActiveTab] = useState<"students" | "parents">("students");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showNewParentForm, setShowNewParentForm] = useState(false);
  const [showParentListModal, setShowParentListModal] = useState(false);
  const [showStandaloneParentModal, setShowStandaloneParentModal] = useState(false);
  const [linkingParent, setLinkingParent] = useState<ParentItem | null>(null);
  const [selectedStudentToLink, setSelectedStudentToLink] = useState("");
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [assigningStudent, setAssigningStudent] = useState<Student | null>(null);
  const [selectedParentToAssign, setSelectedParentToAssign] = useState("");
  const [assigningLoading, setAssigningLoading] = useState(false);
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

  async function handleUnlinkStudent(parentId: string, studentId: string) {
    if (!confirm("Öğrencinin bu veli ile bağlantısını kaldırmak istediğinize emin misiniz?")) return;
    try {
      const res = await fetch("/api/parents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlink", parentId, studentId }),
      });
      if (res.ok) {
        await fetchParents();
        await fetchStudents();
      }
    } catch (e) {
      console.error("Bağlantı kaldırma hatası:", e);
    }
  }

  async function handleAssignParentToStudent(studentId: string, parentId: string | null) {
    setAssigningLoading(true);
    try {
      const res = await fetch("/api/parents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: parentId ? "link" : "unlink",
          parentId: parentId || undefined,
          studentId,
        }),
      });
      if (res.ok) {
        await fetchStudents();
        await fetchParents();
        setAssigningStudent(null);
        setSelectedParentToAssign("");
      }
    } catch (e) {
      console.error("Veli eşleştirme hatası:", e);
    } finally {
      setAssigningLoading(false);
    }
  }

  const unassignedParentsCount = parents.filter(
    (p) => !p.students || p.students.length === 0
  ).length;

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.school?.toLowerCase().includes(search.toLowerCase()) ||
      s.grade?.toLowerCase().includes(search.toLowerCase()) ||
      s.parent?.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredParents = parents.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone && p.phone.includes(search)) ||
      (p.students && p.students.some((s) => s.name.toLowerCase().includes(search.toLowerCase())))
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
            {students.length} kayıtlı öğrenci, {parents.length} kayıtlı veli
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => setShowStandaloneParentModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Yeni Veli Ekle
          </Button>
          <Button
            onClick={() => {
              setSelectedParentId("");
              setShowForm(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Yeni Öğrenci Ekle
          </Button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("students")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              activeTab === "students"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Öğrenciler</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">
              {students.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("parents")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              activeTab === "parents"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Veliler Portalı</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">
              {parents.length}
            </span>
            {unassignedParentsCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {unassignedParentsCount} Yeni / Eşleşmemiş
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder={
              activeTab === "students"
                ? "Öğrenci veya veli ara..."
                : "Veli adı, e-posta veya telefon ara..."
            }
            className="pl-9 h-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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

      {/* Standalone Yeni Veli Ekle Modal */}
      {showStandaloneParentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-lg glass animate-fade-in my-8 border-emerald-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                  Yeni Veli Kaydı Oluştur
                </CardTitle>
                <CardDescription className="text-xs">
                  Sisteme yeni veli hesabı tanımlayın. Veli bu bilgilerle sisteme giriş yapabilir.
                </CardDescription>
              </div>
              <button
                onClick={() => {
                  setShowStandaloneParentModal(false);
                  setParentError("");
                  setParentSuccess("");
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-4">
              {parentSuccess && (
                <div className="text-xs text-emerald-400 mb-3 flex items-center gap-1.5 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {parentSuccess}
                </div>
              )}
              {parentError && (
                <div className="text-xs text-red-400 mb-3 flex items-center gap-1.5 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {parentError}
                </div>
              )}

              <form
                onSubmit={async (e) => {
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
                      setParents((prev) => [data, ...prev]);
                      setParentName("");
                      setParentEmail("");
                      setParentPhone("");
                      setParentPassword("123456");
                      setTimeout(() => {
                        setShowStandaloneParentModal(false);
                        setParentSuccess("");
                      }, 1200);
                    }
                  } catch {
                    setParentError("Sunucu hatası oluştu");
                  } finally {
                    setSavingParent(false);
                  }
                }}
                className="space-y-3.5"
              >
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">
                    Veli Adı Soyadı *
                  </label>
                  <Input
                    placeholder="Örn: Ayşe Demir"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">
                    E-posta Adresi * (Giriş için kullanılacak)
                  </label>
                  <Input
                    type="email"
                    placeholder="veli@ornek.com"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">
                    Telefon Numarası (WhatsApp İletişimi İçin)
                  </label>
                  <Input
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">
                    Başlangıç Şifresi (Varsayılan: 123456)
                  </label>
                  <Input
                    placeholder="123456"
                    value={parentPassword}
                    onChange={(e) => setParentPassword(e.target.value)}
                  />
                </div>

                <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowStandaloneParentModal(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingParent || !parentName || !parentEmail}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {savingParent ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    ) : (
                      <Plus className="w-4 h-4 mr-1.5" />
                    )}
                    Veliyi Kaydet
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

      {/* Main Content: Öğrenciler Tab */}
      {activeTab === "students" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <GraduationCap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">
                {search ? "Arama kriterlerine uygun öğrenci bulunamadı" : "Henüz öğrenci eklenmemiş"}
              </p>
              <Button
                onClick={() => {
                  setSelectedParentId("");
                  setShowForm(true);
                }}
                className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                İlk Öğrenciyi Ekle
              </Button>
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
                      <div className="pt-3 border-t border-slate-700/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-400">
                            <div className="flex items-center gap-1 text-slate-200 font-medium">
                              <Users className="w-3.5 h-3.5 text-indigo-400" />
                              {student.parent.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {student.parent.phone || student.parent.email}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {student.parent.phone && (
                              <>
                                <a href={`tel:${student.parent.phone}`} title="Ara">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white">
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
                                  title="WhatsApp Mesajı"
                                >
                                  <Button variant="whatsapp" size="icon" className="h-7 w-7">
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </Button>
                                </a>
                              </>
                            )}
                            <a href={`mailto:${student.parent.email}`} title="E-posta">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white">
                                <Mail className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                          </div>
                        </div>

                        {/* Veli Değiştir ve Çıkar Eylemleri */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAssigningStudent(student);
                              setSelectedParentToAssign(student.parent?.id || "");
                            }}
                            className="text-[11px] h-6 px-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                          >
                            <LinkIcon className="w-3 h-3 mr-1" />
                            Veliyi Değiştir
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnlinkStudent(student.parent!.id, student.id)}
                            className="text-[11px] h-6 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                            title="Veliyi öğrenciden ayır"
                          >
                            <Unlink className="w-3 h-3 mr-1" />
                            Veliyi Çıkar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-slate-700/30 flex items-center justify-between text-xs">
                        <span className="text-slate-500 italic">Veli atanmamış</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAssigningStudent(student);
                            setSelectedParentToAssign("");
                          }}
                          className="text-[11px] border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 h-7 px-2.5"
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1" />
                          Veli Eşleştir
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Main Content: Veliler Tab */}
      {activeTab === "parents" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            </div>
          ) : filteredParents.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">
                {search ? "Arama kriterlerine uygun veli bulunamadı" : "Henüz veli hesabı bulunmuyor"}
              </p>
              <Button
                onClick={() => setShowStandaloneParentModal(true)}
                className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                Yeni Veli Ekle
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredParents.map((parent) => {
                const hasStudents = parent.students && parent.students.length > 0;
                return (
                  <Card
                    key={parent.id}
                    className={`group transition-all ${
                      hasStudents
                        ? "hover:border-emerald-500/30"
                        : "border-amber-500/30 bg-amber-500/[0.02]"
                    }`}
                  >
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-sm">
                              {parent.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                                {parent.name}
                              </h3>
                              {parent.createdAt && (
                                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Kayıt: {new Date(parent.createdAt).toLocaleDateString("tr-TR")}
                                </span>
                              )}
                            </div>
                          </div>

                          {hasStudents ? (
                            <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                              {parent.students?.length} Öğrenci
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse">
                              Öğrenci Yok
                            </Badge>
                          )}
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-1.5 text-xs text-slate-300 my-3 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{parent.email}</span>
                          </div>
                          {parent.phone && (
                            <div className="flex items-center gap-2 text-slate-400">
                              <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{parent.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Students Connected */}
                        <div className="my-3">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                            <span>Bağlı Öğrenciler</span>
                            <button
                              type="button"
                              onClick={() => {
                                setLinkingParent(parent);
                                setSelectedStudentToLink("");
                              }}
                              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Öğrenci Bağla
                            </button>
                          </div>

                          {hasStudents ? (
                            <div className="space-y-1.5">
                              {parent.students?.map((st) => (
                                <div
                                  key={st.id}
                                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                                    <span className="font-medium text-slate-200">{st.name}</span>
                                    {st.grade && <span className="text-[10px] text-slate-400">({st.grade})</span>}
                                  </div>
                                  <button
                                    type="button"
                                    title="Bağlantıyı Kaldır"
                                    onClick={() => handleUnlinkStudent(parent.id, st.id)}
                                    className="text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors"
                                  >
                                    <Unlink className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 text-center">
                              <p className="text-xs text-amber-300 mb-2">
                                Bu veliye henüz bir öğrenci atanmamış.
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setLinkingParent(parent);
                                  setSelectedStudentToLink("");
                                }}
                                className="text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10 h-7"
                              >
                                <LinkIcon className="w-3 h-3 mr-1" />
                                Öğrenci Bağla
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedParentId(parent.id);
                            setShowForm(true);
                          }}
                          className="text-xs text-slate-400 hover:text-white h-8 px-2"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Bu Veliye Yeni Öğrenci
                        </Button>

                        <div className="flex items-center gap-1.5">
                          {parent.phone && (
                            <>
                              <a href={`tel:${parent.phone}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                                  <Phone className="w-3.5 h-3.5" />
                                </Button>
                              </a>
                              <a
                                href={generateWhatsAppLink(
                                  parent.phone,
                                  "Merhaba, DersTakip sistemi üzerinden bilgilendirme mesajıdır."
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="whatsapp" size="icon" className="h-8 w-8">
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </Button>
                              </a>
                            </>
                          )}
                          <a href={`mailto:${parent.email}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                              <Mail className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal: Öğrenciyi Veliye Bağla */}
      {linkingParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md glass border-indigo-500/30 animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <GraduationCap className="w-5 h-5 text-indigo-400" />
                  {linkingParent.name} İçin Öğrenci Bağla
                </CardTitle>
                <CardDescription className="text-xs">
                  Mevcut bir öğrenciyi seçin veya sıfırdan yeni öğrenci tanımlayın
                </CardDescription>
              </div>
              <button
                onClick={() => setLinkingParent(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Mevcut Öğrenci Listesinden Seçin:
                </label>
                <select
                  value={selectedStudentToLink}
                  onChange={(e) => setSelectedStudentToLink(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Bir Öğrenci Seçin --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.grade ? `(${s.grade})` : ""} {s.parent ? `[Bağlı Veli: ${s.parent.name}]` : "[Velisiz]"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const pId = linkingParent.id;
                    setLinkingParent(null);
                    setSelectedParentId(pId);
                    setShowForm(true);
                  }}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Yeni Öğrenci Oluştur
                </Button>

                <Button
                  size="sm"
                  disabled={!selectedStudentToLink || linkingLoading}
                  onClick={async () => {
                    setLinkingLoading(true);
                    try {
                      const res = await fetch("/api/parents", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "link",
                          parentId: linkingParent.id,
                          studentId: selectedStudentToLink,
                        }),
                      });
                      if (res.ok) {
                        await fetchParents();
                        await fetchStudents();
                        setLinkingParent(null);
                        setSelectedStudentToLink("");
                      }
                    } finally {
                      setLinkingLoading(false);
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                >
                  {linkingLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Öğrenciyi Bağla
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal: Öğrenciye Veli Eşleştir / Değiştir / Çıkar */}
      {assigningStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md glass border-indigo-500/30 animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Veli Eşleştirme Yönetimi
                </CardTitle>
                <CardDescription className="text-xs">
                  <span className="font-semibold text-slate-200">{assigningStudent.name}</span> adlı öğrenci için veli belirleyin
                </CardDescription>
              </div>
              <button
                onClick={() => setAssigningStudent(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Mevcut Durum */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Şu Anki Bağlı Veli:</span>
                  <span className="font-semibold text-white">
                    {assigningStudent.parent ? assigningStudent.parent.name : "Hiçbir veli bağlı değil"}
                  </span>
                  {assigningStudent.parent && (
                    <span className="text-slate-400 text-[11px] block">
                      {assigningStudent.parent.phone || assigningStudent.parent.email}
                    </span>
                  )}
                </div>
                {assigningStudent.parent && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={assigningLoading}
                    onClick={() => handleAssignParentToStudent(assigningStudent.id, null)}
                    className="text-xs h-7 px-2"
                  >
                    <Unlink className="w-3.5 h-3.5 mr-1" />
                    Veliyi Çıkar
                  </Button>
                )}
              </div>

              {/* Veli Seç Dropdown */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Yeni / Farklı Veli Seçin:
                </label>
                <select
                  value={selectedParentToAssign}
                  onChange={(e) => setSelectedParentToAssign(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Veli Seçin ({parents.length} kayıtlı veli) --</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone || p.email}) - {p.students?.length || 0} Öğrenci
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentSt = assigningStudent;
                    setAssigningStudent(null);
                    setShowStandaloneParentModal(true);
                  }}
                  className="text-xs"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  + Sıfırdan Yeni Veli Ekle
                </Button>

                <Button
                  size="sm"
                  disabled={!selectedParentToAssign || selectedParentToAssign === assigningStudent.parent?.id || assigningLoading}
                  onClick={() => handleAssignParentToStudent(assigningStudent.id, selectedParentToAssign)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                >
                  {assigningLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Veliyi Eşleştir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
