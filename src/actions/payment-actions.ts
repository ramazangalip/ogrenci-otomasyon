"use server";

// ─── Ödeme CRUD Server Actions ───
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { paymentSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

async function requireTeacher() {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    throw new Error("Yetkisiz erişim");
  }
  return session;
}

// Ödeme kaydet
export async function createPayment(formData: FormData) {
  await requireTeacher();

  const data = {
    studentId: formData.get("studentId") as string,
    amount: Number(formData.get("amount")),
    paymentDate: formData.get("paymentDate")
      ? new Date(formData.get("paymentDate") as string)
      : new Date(),
    paymentMethod: (formData.get("paymentMethod") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
  };

  const validated = paymentSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Geçersiz veri" };
  }

  // Ödemeyi kaydet
  const payment = await prisma.payment.create({
    data: validated.data,
  });

  // Öğrenci bakiyesini güncelle
  await prisma.student.update({
    where: { id: data.studentId },
    data: { balance: { increment: data.amount } },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/odemeler");
  revalidatePath(`/admin/ogrenciler/${data.studentId}`);
  return { success: true, payment };
}

// Gecikmiş ödemeleri getir (bakiyesi negatif olanlar)
export async function getOverduePayments() {
  await requireTeacher();

  return prisma.student.findMany({
    where: { balance: { lt: 0 } },
    select: {
      id: true,
      name: true,
      balance: true,
      monthlyFee: true,
      parent: { select: { name: true, phone: true } },
    },
    orderBy: { balance: "asc" },
  });
}

// Aylık tahsilat toplamı
export async function getMonthlyRevenue(year?: number, month?: number) {
  await requireTeacher();

  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth();

  const startOfMonth = new Date(targetYear, targetMonth, 1);
  const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  const result = await prisma.payment.aggregate({
    where: {
      paymentDate: { gte: startOfMonth, lte: endOfMonth },
    },
    _sum: { amount: true },
    _count: true,
  });

  return {
    total: result._sum.amount ?? 0,
    count: result._count,
    month: targetMonth,
    year: targetYear,
  };
}

// Tüm ödemeleri getir
export async function getPayments() {
  await requireTeacher();

  return prisma.payment.findMany({
    include: {
      student: { select: { id: true, name: true } },
    },
    orderBy: { paymentDate: "desc" },
    take: 50,
  });
}

// Ödeme sil
export async function deletePayment(id: string) {
  await requireTeacher();

  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) return { error: "Ödeme bulunamadı" };

  // Bakiyeyi geri al
  await prisma.student.update({
    where: { id: payment.studentId },
    data: { balance: { decrement: payment.amount } },
  });

  await prisma.payment.delete({ where: { id } });

  revalidatePath("/admin");
  revalidatePath("/admin/odemeler");
  return { success: true };
}
