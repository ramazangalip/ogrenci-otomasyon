"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardCheck, Check, X, AlertCircle, Loader2, Calendar, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Lesson {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  student: { id: string; name: string } | null;
  group: { id: string; name: string; students: { student: { id: string; name: string } }[] } | null;
  attendances: { studentId: string; status: string }[];
}

export default function AttendancePage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, Record<string, string>>>({});
  const [savingLesson, setSavingLesson] = useState<string | null>(null);

  const fetchTodayLessons = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      const res = await fetch(
        `/api/lessons?start=${today.toISOString()}&end=${tomorrow.toISOString()}`
      );
      if (res.ok) {
        const data = await res.json();
        setLessons(data);

        // Mevcut yoklamaları yükle
        const map: Record<string, Record<string, string>> = {};
        data.forEach((l: Lesson) => {
          map[l.id] = {};
          l.attendances.forEach((a) => {
            map[l.id][a.studentId] = a.status;
          });
        });
        setAttendanceMap(map);
      }
    } catch (e) {
      console.error("Dersler yüklenemedi:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    fetch(`/api/lessons?start=${today.toISOString()}&end=${tomorrow.toISOString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && Array.isArray(data)) {
          setLessons(data);
          const map: Record<string, Record<string, string>> = {};
          data.forEach((l: Lesson) => {
            map[l.id] = {};
            l.attendances.forEach((a) => {
              map[l.id][a.studentId] = a.status;
            });
          });
          setAttendanceMap(map);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error("Dersler yüklenemedi:", e);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

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
      fetchTodayLessons();
    } catch (e) {
      console.error("Yoklama kayıt hatası:", e);
    } finally {
      setSavingLesson(null);
    }
  }

  const statusIcons = {
    ATTENDED: { icon: Check, color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" },
    ABSENT: { icon: X, color: "text-red-400 bg-red-500/20 border-red-500/30" },
    EXCUSED: { icon: AlertCircle, color: "text-amber-400 bg-amber-500/20 border-amber-500/30" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClipboardCheck className="w-7 h-7 text-indigo-400" />
          Yoklama
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Bugünün dersleri için yoklama alın
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Bugün için planlanmış ders bulunmuyor</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => {
            const students = getStudentsForLesson(lesson);
            const allSet = students.every((s) => attendanceMap[lesson.id]?.[s.id]);

            return (
              <Card key={lesson.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{lesson.title}</CardTitle>
                      <p className="text-xs text-slate-400 mt-1">
                        {lesson.startTime} - {lesson.endTime}
                        {lesson.group && (
                          <span className="ml-2">
                            <Users className="w-3 h-3 inline" /> {lesson.group.name}
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge
                      variant={
                        lesson.status === "COMPLETED" ? "success" : "default"
                      }
                    >
                      {lesson.status === "COMPLETED" ? "Yoklama Alındı" : "Bekliyor"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {students.map((student) => {
                      const currentStatus = attendanceMap[lesson.id]?.[student.id];
                      return (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-700/30"
                        >
                          <span className="text-sm text-white font-medium">
                            {student.name}
                          </span>
                          <div className="flex gap-2">
                            {(["ATTENDED", "ABSENT", "EXCUSED"] as const).map(
                              (status) => {
                                const config = statusIcons[status];
                                const Icon = config.icon;
                                const isSelected = currentStatus === status;
                                return (
                                  <button
                                    key={status}
                                    onClick={() =>
                                      setAttendance(lesson.id, student.id, status)
                                    }
                                    className={`p-2 rounded-lg border transition-all ${
                                      isSelected
                                        ? config.color + " scale-110"
                                        : "border-slate-700 text-slate-500 hover:border-slate-600"
                                    }`}
                                    title={
                                      status === "ATTENDED"
                                        ? "Geldi"
                                        : status === "ABSENT"
                                        ? "Gelmedi"
                                        : "Mazeretli"
                                    }
                                  >
                                    <Icon className="w-4 h-4" />
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {students.length > 0 && (
                    <Button
                      className="w-full mt-4"
                      disabled={!allSet || savingLesson === lesson.id}
                      onClick={() => saveAttendance(lesson.id)}
                    >
                      {savingLesson === lesson.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Yoklamayı Kaydet
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
