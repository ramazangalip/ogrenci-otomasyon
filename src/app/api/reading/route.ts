// Okuma & Sınav API Route Handler
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Okuma kayıtları
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "studentId gerekli" }, { status: 400 });
    }

    // Veli kontrolü
    if (session.user.role === "PARENT") {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { parentId: true },
      });
      if (student?.parentId !== session.user.id) {
        return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
      }
    }

    const logs = await prisma.readingLog.findMany({
      where: { studentId },
      orderBy: { logDate: "desc" },
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Okuma kayıtları hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST - Okuma kaydı ekle
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await request.json();
    const log = await prisma.readingLog.create({
      data: {
        studentId: body.studentId,
        bookTitle: body.bookTitle,
        pageCount: body.pageCount,
        logDate: body.logDate ? new Date(body.logDate) : new Date(),
      },
    });
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Okuma kaydı hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
