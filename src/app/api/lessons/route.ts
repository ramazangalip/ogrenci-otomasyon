// Ders API Route Handler
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Dersleri tarih aralığına göre getir
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const where: Record<string, unknown> = {};
    if (start && end) {
      where.date = { gte: new Date(start), lte: new Date(end) };
    }

    // Veli ise sadece kendi çocuklarının derslerini görsün
    if (session.user.role === "PARENT") {
      const childIds = await prisma.student.findMany({
        where: { parentId: session.user.id },
        select: { id: true },
      });
      where.studentId = { in: childIds.map((c: { id: string }) => c.id) };
    }

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, parent: { select: { phone: true, name: true } } } },
        group: { select: { id: true, name: true, students: { include: { student: { select: { id: true, name: true } } } } } },
        attendances: true,
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error("Ders listesi hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST - Yeni ders oluştur
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await request.json();

    const lesson = await prisma.lesson.create({
      data: {
        title: body.title,
        type: body.type,
        date: new Date(body.date),
        startTime: body.startTime,
        endTime: body.endTime,
        status: body.status || "SCHEDULED",
        groupId: body.groupId || null,
        studentId: body.studentId || null,
        notePublic: body.notePublic || null,
        notePrivate: body.notePrivate || null,
        isRecurring: body.isRecurring || false,
        recurRule: body.recurRule || null,
      },
    });

    // Tekrarlayan ders ise gelecek 4 haftayı otomatik oluştur
    if (body.isRecurring) {
      const recurLessons = [];
      for (let i = 1; i <= 4; i++) {
        const nextDate = new Date(body.date);
        nextDate.setDate(nextDate.getDate() + 7 * i);
        recurLessons.push({
          title: body.title,
          type: body.type,
          date: nextDate,
          startTime: body.startTime,
          endTime: body.endTime,
          status: "SCHEDULED" as const,
          groupId: body.groupId || null,
          studentId: body.studentId || null,
          isRecurring: true,
          recurRule: body.recurRule || null,
        });
      }
      await prisma.lesson.createMany({ data: recurLessons });
    }

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error("Ders oluşturma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
