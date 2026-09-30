// Ders güncelleme/silme API Route Handler
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PATCH - Ders güncelle
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (body.date) {
      body.date = new Date(body.date);
    }

    const lesson = await prisma.lesson.update({
      where: { id },
      data: body,
      include: {
        student: { select: { id: true, name: true, parent: { select: { phone: true, name: true } } } },
        group: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Ders güncelleme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE - Ders sil
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.lesson.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ders silme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
