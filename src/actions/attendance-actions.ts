"use server";

// ─── Yoklama Server Actions ───
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireTeacher() {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    throw new Error("Yetkisiz erişim");
  }
  return session;
}

// Yoklama kaydet (tek öğrenci)
export async function saveAttendance(
  lessonId: string,
  studentId: string,
  status: "ATTENDED" | "ABSENT" | "EXCUSED"
) {
  await requireTeacher();

  const attendance = await prisma.attendance.upsert({
    where: {
      lessonId_studentId: { lessonId, studentId },
    },
    create: { lessonId, studentId, status },
    update: { status },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/yoklama");
  return { success: true, attendance };
}

// Toplu yoklama kaydet
export async function saveBulkAttendance(
  lessonId: string,
  attendances: { studentId: string; status: "ATTENDED" | "ABSENT" | "EXCUSED" }[]
) {
  await requireTeacher();

  const results = await Promise.all(
    attendances.map((a) =>
      prisma.attendance.upsert({
        where: {
          lessonId_studentId: { lessonId, studentId: a.studentId },
        },
        create: { lessonId, studentId: a.studentId, status: a.status },
        update: { status: a.status },
      })
    )
  );

  // Dersi tamamlandı olarak işaretle
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { status: "COMPLETED" },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/yoklama");
  return { success: true, results };
}

// Öğrencinin devamsızlık oranını hesapla
export async function getStudentAttendanceRate(studentId: string) {
  const session = await auth();
  if (!session) throw new Error("Yetkisiz erişim");

  const total = await prisma.attendance.count({
    where: { studentId },
  });

  const attended = await prisma.attendance.count({
    where: { studentId, status: "ATTENDED" },
  });

  return {
    total,
    attended,
    absent: total - attended,
    rate: total > 0 ? Math.round((attended / total) * 100) : 100,
  };
}
