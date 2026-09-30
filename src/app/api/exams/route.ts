// Sınav Sonuçları API Route Handler
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Sınav sonuçları
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

    const results = await prisma.examResult.findMany({
      where: { studentId },
      orderBy: { examDate: "asc" },
    });
    return NextResponse.json(results);
  } catch (error) {
    console.error("Sınav sonuçları hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST - Sınav sonucu ekle
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await request.json();
    const netScore = body.correctCount - body.wrongCount / 4;

    const result = await prisma.examResult.create({
      data: {
        studentId: body.studentId,
        examName: body.examName,
        examDate: new Date(body.examDate),
        correctCount: body.correctCount,
        wrongCount: body.wrongCount,
        netScore,
        details: body.details || undefined,
      },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Sınav sonucu hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
