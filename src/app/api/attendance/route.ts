// Yoklama API Route Handler
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST - Yoklama kaydet / güncelle
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, attendances } = body;

    // Toplu yoklama kaydet
    const results = await Promise.all(
      attendances.map((a: { studentId: string; status: string }) =>
        prisma.attendance.upsert({
          where: {
            lessonId_studentId: { lessonId, studentId: a.studentId },
          },
          create: { lessonId, studentId: a.studentId, status: a.status as "ATTENDED" | "ABSENT" | "EXCUSED" },
          update: { status: a.status as "ATTENDED" | "ABSENT" | "EXCUSED" },
        })
      )
    );

    // Dersi tamamlandı olarak işaretle
    await prisma.lesson.update({
      where: { id: lessonId },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Yoklama kayıt hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
