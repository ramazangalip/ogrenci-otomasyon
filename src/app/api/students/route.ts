// Öğrenci API Route Handler
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { studentSchema } from "@/lib/validations";

// GET - Tüm öğrencileri listele
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    if (session.user.role === "TEACHER") {
      const students = await prisma.student.findMany({
        include: {
          parent: { select: { id: true, name: true, phone: true, email: true } },
          _count: { select: { attendances: true, payments: true, lessons: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(students);
    }

    // PARENT - sadece kendi çocukları
    const students = await prisma.student.findMany({
      where: { parentId: session.user.id },
      include: {
        _count: { select: { attendances: true, payments: true, lessons: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(students);
  } catch (error) {
    console.error("Öğrenci listesi hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST - Yeni öğrenci oluştur
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const formData = await request.formData();
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
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || "Geçersiz veri" },
        { status: 400 }
      );
    }

    const student = await prisma.student.create({ data: validated.data });
    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error("Öğrenci oluşturma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
