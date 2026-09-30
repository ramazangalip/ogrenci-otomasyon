"use server";

// ─── Öğrenci CRUD Server Actions ───
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { studentSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

// Yetki kontrolü yardımcısı
async function requireTeacher() {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    throw new Error("Yetkisiz erişim");
  }
  return session;
}

// Tüm öğrencileri getir
export async function getStudents() {
  await requireTeacher();
  return prisma.student.findMany({
    include: {
      parent: { select: { id: true, name: true, phone: true, email: true } },
      _count: { select: { attendances: true, payments: true, lessons: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Tek öğrenci detayı
export async function getStudent(id: string) {
  const session = await auth();
  if (!session) throw new Error("Yetkisiz erişim");

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true, phone: true, email: true } },
      lessons: { orderBy: { date: "desc" }, take: 10 },
      attendances: { include: { lesson: true }, orderBy: { createdAt: "desc" }, take: 20 },
      readingLogs: { orderBy: { logDate: "desc" } },
      examResults: { orderBy: { examDate: "desc" } },
      payments: { orderBy: { paymentDate: "desc" } },
      groups: { include: { group: true } },
    },
  });

  if (!student) throw new Error("Öğrenci bulunamadı");

  // Veli ise sadece kendi çocuklarını görebilir
  if (session.user.role === "PARENT" && student.parentId !== session.user.id) {
    throw new Error("Bu öğrenciye erişim yetkiniz yok");
  }

  return student;
}

// Öğrenci oluştur
export async function createStudent(formData: FormData) {
  await requireTeacher();

  const data = {
    name: formData.get("name") as string,
    grade: (formData.get("grade") as string) || undefined,
    school: (formData.get("school") as string) || undefined,
    parentId: (formData.get("parentId") as string) || undefined,
    monthlyFee: Number(formData.get("monthlyFee")) || 0,
    tags: formData.get("tags")
      ? (formData.get("tags") as string).split(",").map((t) => t.trim()).filter(Boolean)
      : [],
  };

  const validated = studentSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Geçersiz veri" };
  }

  const student = await prisma.student.create({
    data: validated.data,
  });

  revalidatePath("/admin/ogrenciler");
  return { success: true, student };
}

// Öğrenci güncelle
export async function updateStudent(id: string, formData: FormData) {
  await requireTeacher();

  const data = {
    name: formData.get("name") as string,
    grade: (formData.get("grade") as string) || undefined,
    school: (formData.get("school") as string) || undefined,
    parentId: (formData.get("parentId") as string) || undefined,
    monthlyFee: Number(formData.get("monthlyFee")) || 0,
    tags: formData.get("tags")
      ? (formData.get("tags") as string).split(",").map((t) => t.trim()).filter(Boolean)
      : [],
  };

  const validated = studentSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Geçersiz veri" };
  }

  const student = await prisma.student.update({
    where: { id },
    data: validated.data,
  });

  revalidatePath("/admin/ogrenciler");
  revalidatePath(`/admin/ogrenciler/${id}`);
  return { success: true, student };
}

// Öğrenci sil
export async function deleteStudent(id: string) {
  await requireTeacher();

  await prisma.student.delete({ where: { id } });

  revalidatePath("/admin/ogrenciler");
  return { success: true };
}

// Velinin çocuklarını getir
export async function getParentStudents() {
  const session = await auth();
  if (!session || session.user.role !== "PARENT") {
    throw new Error("Yetkisiz erişim");
  }

  return prisma.student.findMany({
    where: { parentId: session.user.id },
    include: {
      lessons: {
        orderBy: { date: "desc" },
        take: 5,
        where: { notePublic: { not: null } },
      },
      attendances: { include: { lesson: true }, orderBy: { createdAt: "desc" }, take: 10 },
      readingLogs: { orderBy: { logDate: "desc" }, take: 10 },
      examResults: { orderBy: { examDate: "desc" }, take: 5 },
      payments: { orderBy: { paymentDate: "desc" }, take: 10 },
    },
  });
}

// Veli listesi (öğrenciye veli atamak için)
export async function getParents() {
  await requireTeacher();
  return prisma.user.findMany({
    where: { role: "PARENT" },
    select: { id: true, name: true, phone: true, email: true },
    orderBy: { name: "asc" },
  });
}
