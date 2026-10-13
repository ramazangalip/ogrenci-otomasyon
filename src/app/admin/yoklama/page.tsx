"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardCheck,
  Check,
  X,
  AlertCircle,
  Loader2,
  Calendar,
  Users,
  Plus,
  Clock,
  CheckCircle2,
  UserCheck,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Lesson {
  id: string;
  title: string;
  type?: "INDIVIDUAL" | "GROUP" | string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  student: { id: string; name: string } | null;
  group: { id: string; name: string; students: { student: { id: string; name: string } }[] } | null;
  attendances: { studentId: string; status: string }[];
}

interface StudentOption {
  id: string;
  name: string;
}

interface GroupOption {
  id: string;
  name: string;
  students: { student: { id: string; name: string } }[];
}

export default function AttendancePage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, Record<string, string>>>({});
  const [savingLesson, setSavingLesson] = useState<string | null>(null);

  // Date selection state
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });

  // Modal: Quick Lesson & Attendance
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [creating, setCreating] = useState(false);

  // New Lesson form state
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"INDIVIDUAL" | "GROUP">("INDIVIDUAL");
  const [newStudentId, setNewStudentId] = useState("");
  const [newGroupId, setNewGroupId] = useState("");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newStartTime, setNewStartTime] = useState("14:00");
  const [newEndTime, setNewEndTime] = useState("15:00");
  const [newIndividualStatus, setNewIndividualStatus] = useState<"ATTENDED" | "ABSENT" | "EXCUSED">("ATTENDED");
  const [newGroupStatusMap, setNewGroupStatusMap] = useState<Record<string, string>>({});
  const [newNote, setNewNote] = useState("");

  // Fetch lessons for the selected date
  const fetchLessonsForDate = useCallback(async (dateStr: string) => {
    setLoading(true);
    const start = new Date(`${dateStr}T00:00:00`);
    const end = new Date(`${dateStr}T23:59:59`);

    try {
      const res = await fetch(
        `/api/lessons?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      if (res.ok) {
        const data = await res.json();
        setLessons(Array.isArray(data) ? data : []);

        // Load existing attendances into map
        const map: Record<string, Record<string, string>> = {};
        if (Array.isArray(data)) {
          data.forEach((l: Lesson) => {
            map[l.id] = {};
            l.attendances.forEach((a) => {
              map[l.id][a.studentId] = a.status;
            });
          });
        }
        setAttendanceMap(map);
      }
    } catch (e) {
      console.error("Dersler yüklenemedi:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch initial student & group lists for modal
  useEffect(() => {
    Promise.all([
      fetch("/api/students").then((r) => r.json()),
      fetch("/api/groups").then((r) => r.json()),
    ])
      .then(([s, g]) => {
        setStudents(Array.isArray(s) ? s : []);
        setGroups(Array.isArray(g) ? g : []);
      })
      .catch((e) => console.error("Öğrenci/Grup listesi yüklenemedi:", e));
  }, []);

  useEffect(() => {
    fetchLessonsForDate(selectedDate);
  }, [selectedDate, fetchLessonsForDate]);

  function getStudentsForLesson(lesson: Lesson): { id: string; name: string }[] {
    if (lesson.student) return [{ id: lesson.student.id, name: lesson.student.name }];
    if (lesson.group) return lesson.group.students.map((gs) => gs.student);
    return [];
  }

  function setAttendance(lessonId: string, studentId: string, status: string) {
    setAttendanceMap((prev) => ({
      ...prev,
      [lessonId]: { ...prev[lessonId], [studentId]: status },
    }));
  }

  function markAllPresent(lessonId: string, lessonStudents: { id: string; name: string }[]) {
    const updated: Record<string, string> = {};
    lessonStudents.forEach((s) => {
      updated[s.id] = "ATTENDED";
    });
    setAttendanceMap((prev) => ({
      ...prev,
      [lessonId]: { ...prev[lessonId], ...updated },
    }));
  }

  async function saveAttendance(lessonId: string) {
    setSavingLesson(lessonId);
    const attendances = Object.entries(attendanceMap[lessonId] || {}).map(
      ([studentId, status]) => ({ studentId, status })
    );

    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, attendances }),
      });
      fetchLessonsForDate(selectedDate);
    } catch (e) {
      console.error("Yoklama kayıt hatası:", e);
    } finally {
      setSavingLesson(null);
    }
  }

  // Create new lesson & immediately record attendance
  async function handleCreateLessonWithAttendance(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      // 1. Create Lesson
      const lessonRes = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle || (newType === "INDIVIDUAL" ? "Bireysel Özel Ders" : "Grup Dersi"),
          type: newType,
          date: new Date(`${newDate}T${newStartTime}:00`).toISOString(),
          startTime: newStartTime,
          endTime: newEndTime,
          studentId: newType === "INDIVIDUAL" ? newStudentId : null,
          groupId: newType === "GROUP" ? newGroupId : null,
          status: "COMPLETED",
          notePublic: newNote || null,
        }),
      });

      if (!lessonRes.ok) throw new Error("Ders oluşturulamadı");
      const createdLesson = await lessonRes.json();

      // 2. Prepare attendances
      let attendancesToSave: { studentId: string; status: string }[] = [];
      if (newType === "INDIVIDUAL" && newStudentId) {
        attendancesToSave = [{ studentId: newStudentId, status: newIndividualStatus }];
      } else if (newType === "GROUP" && newGroupId) {
        const selectedGroup = groups.find((g) => g.id === newGroupId);
        if (selectedGroup) {
          attendancesToSave = selectedGroup.students.map((gs) => ({
            studentId: gs.student.id,
            status: newGroupStatusMap[gs.student.id] || "ATTENDED",
          }));
        }
      }

      // 3. Save attendances
      if (attendancesToSave.length > 0) {
        await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId: createdLesson.id,
            attendances: attendancesToSave,
          }),
        });
      }

      setShowCreateModal(false);
      setNewTitle("");
      setNewStudentId("");
      setNewGroupId("");
      setNewNote("");
      setSelectedDate(newDate);
      await fetchLessonsForDate(newDate);
    } catch (err) {
      console.error("Yoklama oluşturma hatası:", err);
    } finally {
      setCreating(false);
    }
  }

  const statusIcons = {
    ATTENDED: { icon: Check, color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" },
    ABSENT: { icon: X, color: "text-red-400 bg-red-500/20 border-red-500/30" },
    EXCUSED: { icon: AlertCircle, color: "text-amber-400 bg-amber-500/20 border-amber-500/30" },
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-indigo-400" />
            Yoklama Yönetimi
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Derslerin yoklamasını alın veya yeni bir ders yoklaması işleyin
          </p>
        </div>
        <Button
          onClick={() => {
            setNewDate(selectedDate);
            setShowCreateModal(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          + Yeni Ders & Yoklama Ekle
        </Button>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={selectedDate === todayStr ? "default" : "outline"}
            onClick={() => setSelectedDate(todayStr)}
            className="text-xs h-8"
          >
            Bugün
          </Button>
          <Button
            size="sm"
            variant={selectedDate === yesterdayStr ? "default" : "outline"}
            onClick={() => setSelectedDate(yesterdayStr)}
            className="text-xs h-8"
          >
            Dün
          </Button>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <Calendar className="w-4 h-4 text-slate-400" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="h-8 text-xs w-36 bg-slate-800/80 border-slate-700"
            />
          </div>
        </div>

        <div className="text-xs text-slate-400">
          <span className="font-semibold text-slate-200">
            {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("tr-TR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          {" "}• {lessons.length} ders listelendi
        </div>
      </div>

      {/* Main Lessons List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl p-6 bg-slate-900/20">
          <Calendar className="w-14 h-14 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200 mb-1">
            Bu tarih için kayıtlı ders bulunmuyor
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Takvimde planlanmamış olsa bile hemen yoklama almak için yeni bir ders oluşturabilirsiniz.
          </p>
          <Button
            onClick={() => {
              setNewDate(selectedDate);
              setShowCreateModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Bu Gün İçin Ders & Yoklama Ekle
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => {
            const lessonStudents = getStudentsForLesson(lesson);
            const allSet = lessonStudents.every((s) => attendanceMap[lesson.id]?.[s.id]);
            const isCompleted = lesson.status === "COMPLETED";

            return (
              <Card key={lesson.id} className="border-slate-800 hover:border-slate-700 transition-all">
                <CardHeader className="pb-3 border-b border-slate-800/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base text-white">{lesson.title}</CardTitle>
                        <Badge variant={lesson.type === "INDIVIDUAL" ? "default" : "secondary"} className="text-[10px]">
                          {lesson.type === "INDIVIDUAL" ? "Bireysel" : "Grup"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {lesson.startTime} - {lesson.endTime}
                        </span>
                        {lesson.group && (
                          <span className="flex items-center gap-1 font-medium text-slate-300">
                            <Users className="w-3 h-3 text-indigo-400" />
                            {lesson.group.name} ({lessonStudents.length} öğrenci)
                          </span>
                        )}
                        {lesson.student && (
                          <span className="text-slate-300">
                            Öğrenci: {lesson.student.name}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {lessonStudents.length > 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAllPresent(lesson.id, lessonStudents)}
                          className="text-[11px] h-7 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1" />
                          Tümünü Geldi İşaretle
                        </Button>
                      )}

                      <Badge variant={isCompleted ? "success" : "warning"} className="text-xs">
                        {isCompleted ? "Yoklama Alındı" : "Bekliyor"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {lessonStudents.map((student) => {
                      const currentStatus = attendanceMap[lesson.id]?.[student.id];
                      return (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 gap-3"
                        >
                          <span className="text-sm text-white font-medium">
                            {student.name}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {(["ATTENDED", "ABSENT", "EXCUSED"] as const).map((status) => {
                              const config = statusIcons[status];
                              const Icon = config.icon;
                              const isSelected = currentStatus === status;
                              const label =
                                status === "ATTENDED"
                                  ? "Geldi"
                                  : status === "ABSENT"
                                  ? "Gelmedi"
                                  : "İzinli";

                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => setAttendance(lesson.id, student.id, status)}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                    isSelected
                                      ? config.color + " shadow-md"
                                      : "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                                  }`}
                                  title={label}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                  <span>{label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {lessonStudents.length > 0 && (
                    <div className="flex justify-end pt-3 mt-3 border-t border-slate-800/60">
                      <Button
                        size="sm"
                        disabled={savingLesson === lesson.id}
                        onClick={() => saveAttendance(lesson.id)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8"
                      >
                        {savingLesson === lesson.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        ) : (
                          <Check className="w-4 h-4 mr-1.5" />
                        )}
                        Yoklamayı Kaydet
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Yeni Ders & Yoklama Ekle */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-lg glass animate-fade-in my-8 border-indigo-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-indigo-400" />
                  Yeni Ders & Yoklama Ekle
                </CardTitle>
                <CardDescription className="text-xs">
                  Dersi oluşturun ve yoklamasını doğrudan kaydedin
                </CardDescription>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleCreateLessonWithAttendance} className="space-y-4">
                {/* Ders Türü Seçimi */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setNewType("INDIVIDUAL")}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                      newType === "INDIVIDUAL"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Bireysel Ders
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType("GROUP")}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                      newType === "GROUP"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Grup Dersi
                  </button>
                </div>

                {/* Ders Başlığı */}
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">
                    Ders Konusu / Başlığı *
                  </label>
                  <Input
                    placeholder="Örn: Matematik - Fonksiyonlar"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Öğrenci veya Grup Seçimi */}
                {newType === "INDIVIDUAL" ? (
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1 block">
                      Öğrenci Seçin *
                    </label>
                    <select
                      value={newStudentId}
                      onChange={(e) => setNewStudentId(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Bir Öğrenci Seçin --</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1 block">
                      Grup Seçin *
                    </label>
                    <select
                      value={newGroupId}
                      onChange={(e) => {
                        const gId = e.target.value;
                        setNewGroupId(gId);
                        const selGroup = groups.find((g) => g.id === gId);
                        if (selGroup) {
                          const initialMap: Record<string, string> = {};
                          selGroup.students.forEach((gs) => {
                            initialMap[gs.student.id] = "ATTENDED";
                          });
                          setNewGroupStatusMap(initialMap);
                        }
                      }}
                      required
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Bir Grup Seçin --</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.students.length} öğrenci)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Tarih ve Saatler */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-3 sm:col-span-1">
                    <label className="text-xs font-medium text-slate-300 mb-1 block">
                      Tarih *
                    </label>
                    <Input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1 block">
                      Başlangıç
                    </label>
                    <Input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1 block">
                      Bitiş
                    </label>
                    <Input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Yoklama Durumu */}
                {newType === "INDIVIDUAL" && newStudentId && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <label className="text-xs font-medium text-slate-300 mb-2 block">
                      Yoklama Durumu:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["ATTENDED", "ABSENT", "EXCUSED"] as const).map((status) => {
                        const isSel = newIndividualStatus === status;
                        const label =
                          status === "ATTENDED"
                            ? "Geldi ✅"
                            : status === "ABSENT"
                            ? "Gelmedi ❌"
                            : "İzinli ⚠️";
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setNewIndividualStatus(status)}
                            className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                              isSel
                                ? "bg-indigo-600 border-indigo-500 text-white"
                                : "bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {newType === "GROUP" && newGroupId && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <label className="text-xs font-medium text-slate-300 block">
                      Öğrenci Yoklamaları:
                    </label>
                    {groups
                      .find((g) => g.id === newGroupId)
                      ?.students.map((gs) => {
                        const curStatus = newGroupStatusMap[gs.student.id] || "ATTENDED";
                        return (
                          <div
                            key={gs.student.id}
                            className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40 last:border-0"
                          >
                            <span className="text-slate-200">{gs.student.name}</span>
                            <div className="flex gap-1">
                              {(["ATTENDED", "ABSENT", "EXCUSED"] as const).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() =>
                                    setNewGroupStatusMap((prev) => ({
                                      ...prev,
                                      [gs.student.id]: st,
                                    }))
                                  }
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                    curStatus === st
                                      ? "bg-indigo-600 border-indigo-500 text-white"
                                      : "border-slate-700 bg-slate-800/50 text-slate-400"
                                  }`}
                                >
                                  {st === "ATTENDED" ? "Geldi" : st === "ABSENT" ? "Gelmedi" : "İzinli"}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* İsteğe Bağlı Not */}
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">
                    Ders Notu (İsteğe Bağlı)
                  </label>
                  <Input
                    placeholder="Örn: Konu tekrarı yapıldı, ödev verildi"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                </div>

                <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating || !newTitle || (newType === "INDIVIDUAL" ? !newStudentId : !newGroupId)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    {creating ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    ) : (
                      <Check className="w-4 h-4 mr-1.5" />
                    )}
                    Kaydet ve Yoklamayı Tamamla
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
