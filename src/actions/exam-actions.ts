"use server";

// ─── Deneme Sınavı Sonuçları Server Actions ───
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { examResultSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

// Sınav sonucu ekle
export async function createExamResult(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    throw new Error("Yetkisiz erişim");
  }

  const correctCount = Number(formData.get("correctCount"));
  const wrongCount = Number(formData.get("wrongCount"));

  // Net hesapla: doğru - (yanlış / 4)
  const netScore = correctCount - wrongCount / 4;

  // Ders bazlı detaylar
  let details: Record<string, number> | undefined;
  const detailsStr = formData.get("details") as string;
  if (detailsStr) {
    try {
      details = JSON.parse(detailsStr);
    } catch {
      details = undefined;
    }
  }

  const data = {
    studentId: formData.get("studentId") as string,
    examName: formData.get("examName") as string,
    examDate: new Date(formData.get("examDate") as string),
    correctCount,
    wrongCount,
    netScore,
    details,
  };

  const validated = examResultSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Geçersiz veri" };
  }

  const result = await prisma.examResult.create({
    data: {
      studentId: validated.data.studentId,
      examName: validated.data.examName,
      examDate: validated.data.examDate,
      correctCount: validated.data.correctCount,
      wrongCount: validated.data.wrongCount,
      netScore: validated.data.netScore,
      details: validated.data.details ?? undefined,
    },
  });

  revalidatePath(`/admin/ogrenciler/${data.studentId}`);
  return { success: true, result };
}

// Öğrencinin sınav sonuçlarını getir
export async function getExamResults(studentId: string) {
  const session = await auth();
  if (!session) throw new Error("Yetkisiz erişim");

  // Veli kontrolü
  if (session.user.role === "PARENT") {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { parentId: true },
    });
    if (student?.parentId !== session.user.id) {
      throw new Error("Yetkisiz erişim");
    }
  }

  return prisma.examResult.findMany({
    where: { studentId },
    orderBy: { examDate: "desc" },
  });
}

// Net gelişim grafiği verisi
export async function getExamProgressData(studentId: string) {
  const session = await auth();
  if (!session) throw new Error("Yetkisiz erişim");

  const results = await prisma.examResult.findMany({
    where: { studentId },
    orderBy: { examDate: "asc" },
    select: {
      examName: true,
      examDate: true,
      netScore: true,
      correctCount: true,
      wrongCount: true,
      details: true,
    },
  });

  return results.map((r: { examName: string; examDate: Date; netScore: number; correctCount: number; wrongCount: number; details: unknown }) => ({
    name: r.examName,
    date: r.examDate,
    net: r.netScore,
    correct: r.correctCount,
    wrong: r.wrongCount,
    details: r.details,
  }));
}

// Sınav sonucu sil
export async function deleteExamResult(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    throw new Error("Yetkisiz erişim");
  }

  await prisma.examResult.delete({ where: { id } });
  revalidatePath("/admin");
  return { success: true };
}
