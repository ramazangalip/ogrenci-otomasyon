"use server";

// ─── Ders CRUD Server Actions ───
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { lessonSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

async function requireTeacher() {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    throw new Error("Yetkisiz erişim");
  }
  return session;
}

// Bugünün derslerini getir
export async function getTodayLessons() {
  await requireTeacher();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.lesson.findMany({
    where: {
      date: { gte: today, lt: tomorrow },
    },
    include: {
      student: { include: { parent: { select: { phone: true, name: true } } } },
      group: { include: { students: { include: { student: true } } } },
      attendances: true,
    },
    orderBy: { startTime: "asc" },
  });
}

// Tarih aralığına göre dersleri getir (takvim için)
export async function getLessons(startDate: Date, endDate: Date) {
  await requireTeacher();

  return prisma.lesson.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    include: {
      student: { select: { id: true, name: true } },
      group: { select: { id: true, name: true } },
      attendances: true,
    },
    orderBy: { date: "asc" },
  });
}

// Ders oluştur
export async function createLesson(formData: FormData) {
  await requireTeacher();

  const data = {
    title: formData.get("title") as string,
    type: formData.get("type") as "INDIVIDUAL" | "GROUP",
    date: new Date(formData.get("date") as string),
    startTime: formData.get("startTime") as string,
    endTime: formData.get("endTime") as string,
    status: "SCHEDULED" as const,
    groupId: (formData.get("groupId") as string) || null,
    studentId: (formData.get("studentId") as string) || null,
    notePublic: (formData.get("notePublic") as string) || null,
    notePrivate: (formData.get("notePrivate") as string) || null,
    isRecurring: formData.get("isRecurring") === "true",
    recurRule: (formData.get("recurRule") as string) || null,
  };

  const validated = lessonSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Geçersiz veri" };
  }

  const lesson = await prisma.lesson.create({
    data: {
      title: validated.data.title,
      type: validated.data.type,
      date: validated.data.date,
      startTime: validated.data.startTime,
      endTime: validated.data.endTime,
      status: validated.data.status,
      groupId: validated.data.groupId ?? null,
      studentId: validated.data.studentId ?? null,
      notePublic: validated.data.notePublic ?? null,
      notePrivate: validated.data.notePrivate ?? null,
      isRecurring: validated.data.isRecurring,
      recurRule: validated.data.recurRule ?? null,
    },
  });

  // Tekrarlayan ders ise gelecek 4 haftayı oluştur
  if (validated.data.isRecurring && validated.data.recurRule) {
    const recurLessons = [];
    for (let i = 1; i <= 4; i++) {
      const nextDate = new Date(validated.data.date);
      nextDate.setDate(nextDate.getDate() + 7 * i);
      recurLessons.push({
        title: validated.data.title,
        type: validated.data.type,
        date: nextDate,
        startTime: validated.data.startTime,
        endTime: validated.data.endTime,
        status: "SCHEDULED" as const,
        groupId: validated.data.groupId ?? null,
        studentId: validated.data.studentId ?? null,
        isRecurring: true,
        recurRule: validated.data.recurRule ?? null,
      });
    }
    await prisma.lesson.createMany({ data: recurLessons });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/takvim");
  return { success: true, lesson };
}

// Ders güncelle
export async function updateLesson(id: string, formData: FormData) {
  await requireTeacher();

  const updateData: Record<string, unknown> = {};

  const title = formData.get("title");
  if (title) updateData.title = title;

  const status = formData.get("status");
  if (status) updateData.status = status;

  const notePublic = formData.get("notePublic");
  if (notePublic !== null) updateData.notePublic = notePublic;

  const notePrivate = formData.get("notePrivate");
  if (notePrivate !== null) updateData.notePrivate = notePrivate;

  const date = formData.get("date");
  if (date) updateData.date = new Date(date as string);

  const startTime = formData.get("startTime");
  if (startTime) updateData.startTime = startTime;

  const endTime = formData.get("endTime");
  if (endTime) updateData.endTime = endTime;

  const lesson = await prisma.lesson.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/takvim");
  return { success: true, lesson };
}

// Ders sil
export async function deleteLesson(id: string) {
  await requireTeacher();
  await prisma.lesson.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/admin/takvim");
  return { success: true };
}

// Ders durumunu güncelle (tek tıkla)
export async function updateLessonStatus(
  id: string,
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "POSTPONED"
) {
  await requireTeacher();

  const lesson = await prisma.lesson.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/takvim");
  return { success: true, lesson };
}
