// Grup API Route Handler
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    const groups = await prisma.group.findMany({
      include: {
        students: { include: { student: { select: { id: true, name: true } } } },
        _count: { select: { students: true, lessons: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(groups);
  } catch (error) {
    console.error("Grup listesi hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    const body = await request.json();
    const group = await prisma.group.create({
      data: {
        name: body.name,
        capacity: body.capacity || 10,
        level: body.level || null,
        students: {
          create: (body.studentIds || []).map((studentId: string) => ({ studentId })),
        },
      },
    });
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("Grup oluşturma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
