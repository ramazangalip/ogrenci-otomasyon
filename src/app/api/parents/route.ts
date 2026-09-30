// Veli API Route Handler (Öğretmen için Veli Yönetimi)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hash } from "bcryptjs";
import { parentCreateSchema } from "@/lib/validations";

// GET - Tüm velileri listele
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const parents = await prisma.user.findMany({
      where: { role: "PARENT" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        students: {
          select: {
            id: true,
            name: true,
            grade: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(parents);
  } catch (error) {
    console.error("Veli listesi getirme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST - Yeni veli oluştur
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 401 });
    }

    const body = await request.json();
    const validated = parentCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || "Geçersiz veri" },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = validated.data;

    // E-posta mükerrerlik kontrolü
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu e-posta adresine sahip bir kullanıcı zaten mevcut" },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password || "123456", 12);

    const newParent = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        passwordHash,
        role: "PARENT",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newParent, { status: 201 });
  } catch (error) {
    console.error("Veli oluşturma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
