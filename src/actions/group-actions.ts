"use server";

// ─── Grup CRUD Server Actions ───
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { groupSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

async function requireTeacher() {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    throw new Error("Yetkisiz erişim");
  }
  return session;
}

// Tüm grupları getir
export async function getGroups() {
  await requireTeacher();
  return prisma.group.findMany({
    include: {
      students: { include: { student: true } },
      _count: { select: { students: true, lessons: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Tek grup detayı
export async function getGroup(id: string) {
  await requireTeacher();
  return prisma.group.findUnique({
    where: { id },
    include: {
      students: { include: { student: true } },
      lessons: { orderBy: { date: "desc" }, take: 10 },
    },
  });
}

// Grup oluştur
export async function createGroup(formData: FormData) {
  await requireTeacher();

  const data = {
    name: formData.get("name") as string,
    capacity: Number(formData.get("capacity")) || 10,
    level: (formData.get("level") as string) || undefined,
    studentIds: formData.get("studentIds")
      ? (formData.get("studentIds") as string).split(",").filter(Boolean)
      : [],
  };

  const validated = groupSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Geçersiz veri" };
  }

  const group = await prisma.group.create({
    data: {
      name: validated.data.name,
      capacity: validated.data.capacity,
      level: validated.data.level,
      students: {
        create: validated.data.studentIds.map((studentId) => ({
          studentId,
        })),
      },
    },
  });

  revalidatePath("/admin/gruplar");
  return { success: true, group };
}

// Gruba öğrenci ekle
export async function addStudentToGroup(groupId: string, studentId: string) {
  await requireTeacher();

  await prisma.groupStudent.create({
    data: { groupId, studentId },
  });

  revalidatePath("/admin/gruplar");
  return { success: true };
}

// Gruptan öğrenci çıkar
export async function removeStudentFromGroup(groupId: string, studentId: string) {
  await requireTeacher();

  await prisma.groupStudent.delete({
    where: { groupId_studentId: { groupId, studentId } },
  });

  revalidatePath("/admin/gruplar");
  return { success: true };
}

// Grup sil
export async function deleteGroup(id: string) {
  await requireTeacher();
  await prisma.group.delete({ where: { id } });
  revalidatePath("/admin/gruplar");
  return { success: true };
}
