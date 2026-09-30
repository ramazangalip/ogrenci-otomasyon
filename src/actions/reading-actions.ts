"use server";

// ─── Kitap Okuma Takibi Server Actions ───
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { readingLogSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

// Okuma kaydı ekle
export async function createReadingLog(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    throw new Error("Yetkisiz erişim");
  }

  const data = {
    studentId: formData.get("studentId") as string,
    bookTitle: formData.get("bookTitle") as string,
    pageCount: Number(formData.get("pageCount")),
    logDate: formData.get("logDate")
      ? new Date(formData.get("logDate") as string)
      : new Date(),
  };

  const validated = readingLogSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Geçersiz veri" };
  }

  const log = await prisma.readingLog.create({ data: validated.data });

  revalidatePath(`/admin/ogrenciler/${data.studentId}`);
  return { success: true, log };
}

// Öğrencinin okuma kayıtlarını getir
export async function getReadingLogs(studentId: string) {
  const session = await auth();
  if (!session) throw new Error("Yetkisiz erişim");

  // Veli ise sadece kendi çocuğunu görebilir
  if (session.user.role === "PARENT") {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { parentId: true },
    });
    if (student?.parentId !== session.user.id) {
      throw new Error("Yetkisiz erişim");
    }
  }

  return prisma.readingLog.findMany({
    where: { studentId },
    orderBy: { logDate: "desc" },
  });
}

// Aylık okuma istatistikleri (grafik için)
export async function getReadingStats(studentId: string) {
  const session = await auth();
  if (!session) throw new Error("Yetkisiz erişim");

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const logs = await prisma.readingLog.findMany({
    where: {
      studentId,
      logDate: { gte: sixMonthsAgo },
    },
    orderBy: { logDate: "asc" },
  });

  // Aylık gruplama
  const monthlyData: Record<string, number> = {};
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

  logs.forEach((log: { logDate: Date; pageCount: number }) => {
    const date = new Date(log.logDate);
    const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
    monthlyData[key] = (monthlyData[key] || 0) + log.pageCount;
  });

  return Object.entries(monthlyData).map(([month, pages]) => ({
    month,
    pages,
  }));
}

// Okuma kaydı sil
export async function deleteReadingLog(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    throw new Error("Yetkisiz erişim");
  }

  await prisma.readingLog.delete({ where: { id } });
  revalidatePath("/admin");
  return { success: true };
}
