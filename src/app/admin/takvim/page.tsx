"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  User,
  Users,
  MessageCircle,
  Loader2,
  Check,
  XCircle,
  Pause,
  GripVertical,
  CheckCircle2,
  AlertCircle,
  Move,
  LayoutGrid,
  Columns3,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { generateWhatsAppLink, whatsAppTemplates } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  type: "INDIVIDUAL" | "GROUP";
  date: string;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "POSTPONED";
  notePublic: string | null;
  notePrivate: string | null;
  student: { id: string; name: string; parent?: { phone: string | null; name: string | null } } | null;
  group: { id: string; name: string } | null;
}

const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const dayNamesFull = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const monthNames = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

// 08:00 ile 22:00 arası saat dilimleri
const HOURS = Array.from({ length: 15 }, (_, i) => {
  const h = i + 8;
  return `${h.toString().padStart(2, "0")}:00`;
});

const statusConfig = {
  SCHEDULED: { label: "Planlandı", color: "default" as const, icon: Clock },
  COMPLETED: { label: "Tamamlandı", color: "success" as const, icon: Check },
  CANCELLED: { label: "İptal", color: "destructive" as const, icon: XCircle },
  POSTPONED: { label: "Ertelendi", color: "warning" as const, icon: Pause },
};

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatMinutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"timegrid" | "columns" | "day">("timegrid");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showLessonDetail, setShowLessonDetail] = useState<Lesson | null>(null);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  // Form prefill values
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:00");

  // Drag & drop states
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ dayIndex: number; hourStr?: string } | null>(null);
  const isDraggingRef = useRef(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchLessons = useCallback(async () => {
    const start = getWeekStart(currentDate);
    const end = view !== "day"
      ? new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
      : new Date(start.getTime() + 24 * 60 * 60 * 1000);

    try {
      const res = await fetch(
        `/api/lessons?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      if (res.ok) setLessons(await res.json());
    } catch (e) {
      console.error("Dersler yüklenemedi:", e);
    } finally {
      setLoading(false);
    }
  }, [currentDate, view]);

  useEffect(() => {
    let ignore = false;
    const start = getWeekStart(currentDate);
    const end = view !== "day"
      ? new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
      : new Date(start.getTime() + 24 * 60 * 60 * 1000);

    fetch(`/api/lessons?start=${start.toISOString()}&end=${end.toISOString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          setLessons(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [currentDate, view]);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((data) => setStudents(data.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name }))))
      .catch(() => {});
  }, []);

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function navigateWeek(direction: number) {
    const d = new Date(currentDate);
    if (view === "day") {
      d.setDate(d.getDate() + direction);
    } else {
      d.setDate(d.getDate() + direction * 7);
    }
    setCurrentDate(d);
  }

  function getWeekDays(): Date[] {
    const start = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  function getLessonsForDate(date: Date): Lesson[] {
    return lessons.filter((l) => {
      const ld = new Date(l.date);
      return (
        ld.getDate() === date.getDate() &&
        ld.getMonth() === date.getMonth() &&
        ld.getFullYear() === date.getFullYear()
      );
    });
  }

  function getLessonsForDateAndHour(date: Date, hourStr: string): Lesson[] {
    const targetHour = parseInt(hourStr.split(":")[0], 10);
    return lessons.filter((l) => {
      const ld = new Date(l.date);
      const isSameDay =
        ld.getDate() === date.getDate() &&
        ld.getMonth() === date.getMonth() &&
        ld.getFullYear() === date.getFullYear();
      if (!isSameDay) return false;

      const lessonStartHour = parseInt(l.startTime.split(":")[0], 10);
      return lessonStartHour === targetHour;
    });
  }

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Open Add Lesson Modal at specific date & hour
  const openNewLessonAt = (date: Date, hourStr = "10:00") => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    setFormDate(`${yyyy}-${mm}-${dd}`);
    setFormStartTime(hourStr);
    const startMins = parseTimeToMinutes(hourStr);
    setFormEndTime(formatMinutesToTime(startMins + 60));
    setShowForm(true);
  };

  // ─── Drag & Drop Handlers ───
  const handleDragStart = (e: React.DragEvent, lesson: Lesson) => {
    isDraggingRef.current = true;
    setDraggedLessonId(lesson.id);
    e.dataTransfer.setData("text/plain", lesson.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedLessonId(null);
    setDragOverCell(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
  };

  const handleDragOverCell = (e: React.DragEvent, dayIndex: number, hourStr?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (
      dragOverCell?.dayIndex !== dayIndex ||
      dragOverCell?.hourStr !== hourStr
    ) {
      setDragOverCell({ dayIndex, hourStr });
    }
  };

  const handleDragLeaveCell = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverCell(null);
  };

  const handleDropOnCell = async (
    e: React.DragEvent,
    targetDate: Date,
    targetHourStr?: string
  ) => {
    e.preventDefault();
    setDragOverCell(null);
    const lessonId = e.dataTransfer.getData("text/plain") || draggedLessonId;
    if (!lessonId) return;

    const lessonToMove = lessons.find((l) => l.id === lessonId);
    if (!lessonToMove) return;

    const oldDate = new Date(lessonToMove.date);
    let newStartTime = lessonToMove.startTime;
    let newEndTime = lessonToMove.endTime;

    // Eğer saat dilimi üzerine bırakıldıysa saatleri güncelle
    if (targetHourStr) {
      const oldDuration =
        parseTimeToMinutes(lessonToMove.endTime) -
        parseTimeToMinutes(lessonToMove.startTime);
      const duration = oldDuration > 0 ? oldDuration : 60;
      newStartTime = targetHourStr;
      newEndTime = formatMinutesToTime(parseTimeToMinutes(targetHourStr) + duration);
    }

    const newDate = new Date(targetDate);
    newDate.setHours(12, 0, 0, 0); // Normalize time on date to avoid tz issues

    // Aynı gün ve aynı saat ise değişiklik yapma
    if (
      oldDate.getDate() === targetDate.getDate() &&
      oldDate.getMonth() === targetDate.getMonth() &&
      oldDate.getFullYear() === targetDate.getFullYear() &&
      (!targetHourStr || targetHourStr === lessonToMove.startTime)
    ) {
      setDraggedLessonId(null);
      return;
    }

    // 1. Optimistic Update
    const prevLessons = [...lessons];
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? {
              ...l,
              date: newDate.toISOString(),
              startTime: newStartTime,
              endTime: newEndTime,
            }
          : l
      )
    );

    const targetDayName = dayNamesFull[targetDate.getDay()];
    showToast(
      `"${lessonToMove.title}" dersi ${targetDayName} ${newStartTime} saatine taşındı.`
    );

    // 2. Server PATCH
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newDate.toISOString(),
          startTime: newStartTime,
          endTime: newEndTime,
        }),
      });

      if (!res.ok) throw new Error("Sunucu reddetti");
    } catch (err) {
      console.error("Ders taşıma hatası:", err);
      setLessons(prevLessons);
      showToast("Ders taşınırken bir hata oluştu, geri alındı.", "error");
    } finally {
      setDraggedLessonId(null);
    }
  };

  async function handleCreateLesson(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const body = {
      title: form.get("title"),
      type: form.get("type"),
      date: form.get("date"),
      startTime: form.get("startTime"),
      endTime: form.get("endTime"),
      studentId: form.get("studentId") || null,
      notePublic: form.get("notePublic") || null,
      notePrivate: form.get("notePrivate") || null,
      isRecurring: form.get("isRecurring") === "on",
    };

    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowForm(false);
        fetchLessons();
        showToast("Yeni ders başarıyla takvime eklendi.");
      }
    } catch (e) {
      console.error("Ders oluşturma hatası:", e);
    } finally {
      setSaving(false);
    }
  }

  async function updateLessonStatus(
    id: string,
    status: "COMPLETED" | "CANCELLED" | "POSTPONED"
  ) {
    try {
      await fetch(`/api/lessons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchLessons();
      setShowLessonDetail(null);
      showToast("Ders durumu güncellendi.");
    } catch (e) {
      console.error("Ders güncelleme hatası:", e);
    }
  }

  const weekDays = getWeekDays();

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-16 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl animate-fade-in text-sm font-medium ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-300"
              : "bg-red-950/90 border-red-500/50 text-red-300"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-indigo-400" />
            Ders Takvimi & Çizelgesi
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <span>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <span className="text-xs text-indigo-400/90 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 flex items-center gap-1">
              <Move className="w-3 h-3" /> Dersleri günler ve saatler arasında sürükleyip bırakabilirsiniz
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/50">
            <button
              onClick={() => setView("timegrid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === "timegrid"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Saat Aralıklarına Göre Haftalık Çizelge"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Saatli Çizelge</span>
            </button>
            <button
              onClick={() => setView("columns")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === "columns"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Gün Sütunları Görünümü"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sütunlar</span>
            </button>
            <button
              onClick={() => setView("day")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === "day"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Günlük Akış"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Günlük</span>
            </button>
          </div>

          <Button
            onClick={() => {
              const now = new Date();
              openNewLessonAt(now, "14:00");
            }}
            className="bg-indigo-600 hover:bg-indigo-500"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Ders Ekle
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between bg-slate-900/40 p-2 rounded-2xl border border-slate-800/80">
        <Button variant="ghost" size="icon" onClick={() => navigateWeek(-1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="border-slate-700 text-xs"
          >
            Bugün
          </Button>
          <span className="text-xs sm:text-sm font-semibold text-slate-300">
            {view === "day" ? (
              `${dayNamesFull[currentDate.getDay()]}, ${currentDate.getDate()} ${monthNames[currentDate.getMonth()]}`
            ) : (
              `${weekDays[0].getDate()} ${monthNames[weekDays[0].getMonth()]} - ${weekDays[6].getDate()} ${monthNames[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`
            )}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigateWeek(1)}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar Views */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : view === "timegrid" ? (
        /* ─── 1. Saat Aralıklarına Göre Haftalık Çizelge (Time-Grid) ─── */
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40 shadow-xl">
          <div className="min-w-[900px]">
            {/* Header: Gün Başlıkları */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-slate-800 sticky top-0 bg-slate-900/90 backdrop-blur-md z-20">
              <div className="p-3 text-center text-xs font-semibold text-slate-500 border-r border-slate-800/80 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Saat
              </div>
              {weekDays.map((date, i) => {
                const today = isToday(date);
                return (
                  <div
                    key={i}
                    className={`p-2.5 text-center border-r border-slate-800/60 last:border-r-0 ${
                      today ? "bg-indigo-500/10 text-indigo-300" : "text-slate-300"
                    }`}
                  >
                    <div className="text-xs font-medium text-slate-400">
                      {dayNames[date.getDay()]}
                    </div>
                    <div
                      className={`text-base font-bold ${
                        today ? "text-indigo-300" : "text-white"
                      }`}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grid Body: Saat Satırları ve Gün Hücreleri */}
            <div className="divide-y divide-slate-800/50">
              {HOURS.map((hourStr) => (
                <div
                  key={hourStr}
                  className="grid grid-cols-[80px_repeat(7,1fr)] min-h-[64px] group"
                >
                  {/* Sol Saat Etiketi */}
                  <div className="py-2 px-2 text-center text-xs font-mono font-medium text-slate-400 border-r border-slate-800/80 bg-slate-900/30 flex items-start justify-center">
                    {hourStr}
                  </div>

                  {/* 7 Günün Her Biri için Saat Hücresi */}
                  {weekDays.map((date, dayIndex) => {
                    const cellLessons = getLessonsForDateAndHour(date, hourStr);
                    const isCellTarget =
                      dragOverCell?.dayIndex === dayIndex &&
                      dragOverCell?.hourStr === hourStr;
                    const today = isToday(date);

                    return (
                      <div
                        key={dayIndex}
                        onDragOver={(e) => handleDragOverCell(e, dayIndex, hourStr)}
                        onDragLeave={handleDragLeaveCell}
                        onDrop={(e) => handleDropOnCell(e, date, hourStr)}
                        onClick={(e) => {
                          // Eğer boş alana tıklandıysa bu saatte ders ekleme aç
                          if (e.target === e.currentTarget && cellLessons.length === 0) {
                            openNewLessonAt(date, hourStr);
                          }
                        }}
                        className={`p-1 border-r border-slate-800/50 last:border-r-0 relative transition-all duration-100 flex flex-col gap-1 ${
                          isCellTarget
                            ? "bg-indigo-500/20 border-2 border-dashed border-indigo-400"
                            : today
                            ? "bg-slate-900/20 hover:bg-slate-800/30"
                            : "hover:bg-slate-800/20"
                        }`}
                      >
                        {/* Ders Kartları */}
                        {cellLessons.map((lesson) => {
                          const isBeingDragged = draggedLessonId === lesson.id;

                          return (
                            <div
                              key={lesson.id}
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, lesson)}
                              onDragEnd={handleDragEnd}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isDraggingRef.current) {
                                  setShowLessonDetail(lesson);
                                }
                              }}
                              className={`p-1.5 rounded-lg border text-[11px] cursor-grab active:cursor-grabbing transition-all relative group/card select-none ${
                                isBeingDragged
                                  ? "opacity-30 border-dashed border-indigo-400 scale-95"
                                  : lesson.status === "COMPLETED"
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200 hover:border-emerald-500/50"
                                  : lesson.status === "CANCELLED"
                                  ? "bg-red-500/15 border-red-500/30 text-red-300 opacity-60 hover:border-red-500/50"
                                  : lesson.status === "POSTPONED"
                                  ? "bg-amber-500/15 border-amber-500/30 text-amber-200 hover:border-amber-500/50"
                                  : "bg-indigo-600/25 border-indigo-500/35 text-indigo-100 hover:border-indigo-400 hover:shadow-md"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono font-bold text-[10px] text-white">
                                  {lesson.startTime}-{lesson.endTime}
                                </span>
                                <GripVertical className="w-3 h-3 text-slate-400 opacity-0 group-hover/card:opacity-70 shrink-0" />
                              </div>
                              <div className="font-semibold truncate mt-0.5">
                                {lesson.title}
                              </div>
                              <div className="text-[10px] text-slate-300 truncate flex items-center gap-1 mt-0.5">
                                {lesson.type === "INDIVIDUAL" ? (
                                  <User className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                                ) : (
                                  <Users className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                                )}
                                <span className="truncate">
                                  {lesson.student?.name || lesson.group?.name}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Drag target indicator */}
                        {isCellTarget && (
                          <div className="flex-1 min-h-[30px] rounded border border-dashed border-indigo-400 bg-indigo-500/25 flex items-center justify-center text-[10px] text-indigo-200 font-semibold animate-pulse">
                            {hourStr} Taşı
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : view === "columns" ? (
        /* ─── 2. Sütun Bazlı Hafta Görünümü ─── */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 select-none">
          {weekDays.map((date, dayIndex) => {
            const dayLessons = getLessonsForDate(date);
            const today = isToday(date);
            const isTarget = dragOverCell?.dayIndex === dayIndex;

            return (
              <div
                key={dayIndex}
                onDragOver={(e) => handleDragOverCell(e, dayIndex)}
                onDragLeave={handleDragLeaveCell}
                onDrop={(e) => handleDropOnCell(e, date)}
                className={`min-h-[260px] flex flex-col rounded-2xl p-2 transition-all duration-150 border ${
                  isTarget
                    ? "border-indigo-400 bg-indigo-500/15 ring-2 ring-indigo-500/30 scale-[1.01]"
                    : today
                    ? "border-indigo-500/30 bg-slate-900/40"
                    : "border-slate-800/80 bg-slate-900/20 hover:border-slate-700"
                }`}
              >
                {/* Day Header */}
                <div
                  className={`text-center py-2 px-1 rounded-xl text-sm font-medium mb-2 ${
                    today
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "bg-slate-800/40 text-slate-400"
                  }`}
                >
                  <div className="text-xs">{dayNames[date.getDay()]}</div>
                  <div className={`text-base font-bold ${today ? "text-indigo-300" : "text-white"}`}>
                    {date.getDate()}
                  </div>
                </div>

                {/* Lessons Container */}
                <div className="flex-1 space-y-1.5 flex flex-col">
                  {dayLessons.map((lesson) => {
                    const isBeingDragged = draggedLessonId === lesson.id;

                    return (
                      <div
                        key={lesson.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, lesson)}
                        onDragEnd={handleDragEnd}
                        onClick={() => {
                          if (!isDraggingRef.current) {
                            setShowLessonDetail(lesson);
                          }
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-grab active:cursor-grabbing relative group ${
                          isBeingDragged
                            ? "opacity-30 border-dashed border-indigo-400 scale-95"
                            : lesson.status === "COMPLETED"
                            ? "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40"
                            : lesson.status === "CANCELLED"
                            ? "bg-red-500/10 border-red-500/20 opacity-50 hover:border-red-500/40"
                            : lesson.status === "POSTPONED"
                            ? "bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40"
                            : "bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40"
                        }`}
                      >
                        <div className="absolute right-1.5 top-2 opacity-0 group-hover:opacity-60 transition-opacity text-slate-400">
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>
                        <div className="font-semibold text-white truncate flex items-center gap-1 font-mono">
                          <span className="text-[11px] text-indigo-300">{lesson.startTime}</span>
                          <span className="text-slate-500">-</span>
                          <span className="text-[11px] text-slate-400">{lesson.endTime}</span>
                        </div>
                        <div className="text-slate-200 font-medium truncate mt-0.5">
                          {lesson.title}
                        </div>
                        <div className="text-slate-400 text-[11px] truncate flex items-center gap-1 mt-1">
                          {lesson.type === "INDIVIDUAL" ? (
                            <User className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                          ) : (
                            <Users className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                          )}
                          <span className="truncate">{lesson.student?.name || lesson.group?.name}</span>
                        </div>
                      </div>
                    );
                  })}

                  {isTarget && draggedLessonId && (
                    <div className="flex-1 min-h-[48px] rounded-xl border-2 border-dashed border-indigo-400/80 bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-200 font-medium animate-pulse">
                      Buraya Bırakın
                    </div>
                  )}

                  {!isTarget && dayLessons.length === 0 && (
                    <div
                      onClick={() => openNewLessonAt(date, "10:00")}
                      className="flex-1 min-h-[50px] flex items-center justify-center text-[11px] text-slate-600 hover:text-indigo-400 hover:bg-slate-800/30 rounded-xl cursor-pointer transition-colors"
                    >
                      + Ders Ekle
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── 3. Günlük Saat Akışı (Day View) ─── */
        <Card className="glass border-slate-800">
          <CardHeader>
            <CardTitle>
              {dayNamesFull[currentDate.getDay()]}, {currentDate.getDate()}{" "}
              {monthNames[currentDate.getMonth()]}
            </CardTitle>
            <CardDescription>Günün saat bazlı ders akışı ve detayları</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-800/50">
              {HOURS.map((hourStr) => {
                const hourLessons = getLessonsForDateAndHour(currentDate, hourStr);
                return (
                  <div
                    key={hourStr}
                    className="py-3 flex items-start gap-4 hover:bg-slate-800/20 px-2 rounded-xl transition-colors"
                  >
                    <div className="w-16 font-mono text-xs font-semibold text-indigo-300 pt-1">
                      {hourStr}
                    </div>
                    <div className="flex-1 space-y-2">
                      {hourLessons.length === 0 ? (
                        <div
                          onClick={() => openNewLessonAt(currentDate, hourStr)}
                          className="text-xs text-slate-600 hover:text-indigo-400 cursor-pointer py-1"
                        >
                          + Bu saate ders planla
                        </div>
                      ) : (
                        hourLessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            onClick={() => setShowLessonDetail(lesson)}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/40 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-center font-mono text-xs font-bold text-white">
                                {lesson.startTime} - {lesson.endTime}
                              </div>
                              <div>
                                <div className="font-semibold text-white text-sm">
                                  {lesson.title}
                                </div>
                                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  {lesson.type === "INDIVIDUAL" ? (
                                    <User className="w-3 h-3 text-indigo-400" />
                                  ) : (
                                    <Users className="w-3 h-3 text-purple-400" />
                                  )}
                                  <span>{lesson.student?.name || lesson.group?.name}</span>
                                </div>
                              </div>
                            </div>
                            <Badge variant={statusConfig[lesson.status].color}>
                              {statusConfig[lesson.status].label}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lesson Detail Modal */}
      {showLessonDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md glass animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{showLessonDetail.title}</CardTitle>
              <button
                onClick={() => setShowLessonDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-slate-400">Tarih:</div>
                <div className="text-white font-medium">
                  {new Date(showLessonDetail.date).toLocaleDateString("tr-TR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="text-slate-400">Saat Aralığı:</div>
                <div className="text-white font-mono font-semibold">
                  {showLessonDetail.startTime} - {showLessonDetail.endTime}
                </div>
                <div className="text-slate-400">Öğrenci / Grup:</div>
                <div className="text-white font-medium">
                  {showLessonDetail.student?.name || showLessonDetail.group?.name || "—"}
                </div>
                <div className="text-slate-400">Durum:</div>
                <div>
                  <Badge variant={statusConfig[showLessonDetail.status].color}>
                    {statusConfig[showLessonDetail.status].label}
                  </Badge>
                </div>
              </div>

              {showLessonDetail.notePublic && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs text-emerald-400 font-medium mb-1">Veli Notu:</p>
                  <p className="text-sm text-slate-300">{showLessonDetail.notePublic}</p>
                </div>
              )}

              {showLessonDetail.notePrivate && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-400 font-medium mb-1">🔒 Gizli Not:</p>
                  <p className="text-sm text-slate-300">{showLessonDetail.notePrivate}</p>
                </div>
              )}

              {/* Status Actions */}
              {showLessonDetail.status === "SCHEDULED" && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => updateLessonStatus(showLessonDetail.id, "COMPLETED")}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Tamamlandı
                  </Button>
                  <Button
                    size="sm"
                    variant="warning"
                    onClick={() => updateLessonStatus(showLessonDetail.id, "POSTPONED")}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Ertele
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateLessonStatus(showLessonDetail.id, "CANCELLED")}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    İptal Et
                  </Button>
                </div>
              )}

              {/* WhatsApp Button */}
              {showLessonDetail.student?.parent?.phone && (
                <a
                  href={generateWhatsAppLink(
                    showLessonDetail.student.parent.phone,
                    showLessonDetail.status === "COMPLETED"
                      ? whatsAppTemplates.dersBitis(
                          showLessonDetail.student.name,
                          showLessonDetail.notePublic || showLessonDetail.title
                        )
                      : whatsAppTemplates.dersHatirlatma(
                          showLessonDetail.student.name,
                          showLessonDetail.startTime,
                          new Date(showLessonDetail.date).toLocaleDateString("tr-TR")
                        )
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="whatsapp" className="w-full mt-2">
                    <MessageCircle className="w-4 h-4 mr-1.5" />
                    WhatsApp&apos;tan Bildir
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Lesson Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg glass animate-fade-in max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Yeni Ders Planla</CardTitle>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateLesson} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Ders Başlığı *</label>
                  <Input name="title" required placeholder="Örn: Matematik - Trigonometri" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Tür *</label>
                    <select
                      name="type"
                      className="flex h-10 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm text-slate-200"
                      defaultValue="INDIVIDUAL"
                    >
                      <option value="INDIVIDUAL">Bireysel</option>
                      <option value="GROUP">Grup</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Tarih *</label>
                    <Input
                      name="date"
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Saat Aralığı */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Başlangıç Saati *</label>
                    <Input
                      name="startTime"
                      type="time"
                      required
                      value={formStartTime}
                      onChange={(e) => {
                        setFormStartTime(e.target.value);
                        const mins = parseTimeToMinutes(e.target.value);
                        setFormEndTime(formatMinutesToTime(mins + 60));
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Bitiş Saati *</label>
                    <Input
                      name="endTime"
                      type="time"
                      required
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Öğrenci</label>
                  <select
                    name="studentId"
                    className="flex h-10 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm text-slate-200"
                  >
                    <option value="">Seçiniz...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Veli Notu (Public)</label>
                  <Textarea name="notePublic" placeholder="Velinin göreceği ders notu..." />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">🔒 Gizli Not (Private)</label>
                  <Textarea name="notePrivate" placeholder="Sadece öğretmenin göreceği not..." />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="isRecurring" id="isRecurring" className="rounded" />
                  <label htmlFor="isRecurring" className="text-sm text-slate-300">
                    Her hafta tekrarla (4 hafta)
                  </label>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    İptal
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-500">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
                    Ders Ekle
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
