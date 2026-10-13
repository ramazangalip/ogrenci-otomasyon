// Ödeme API Route Handler
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Ödemeleri listele
export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    if (session.user.role === "TEACHER") {
      const payments = await prisma.payment.findMany({
        include: { student: { select: { id: true, name: true } } },
        orderBy: { paymentDate: "desc" },
        take: 100,
      });
      return NextResponse.json(payments);
    }

    // Veli - kendi çocuklarının ödemeleri
    const childIds = await prisma.student.findMany({
      where: { parentId: session.user.id },
      select: { id: true },
    });
    const payments = await prisma.payment.findMany({
      where: { studentId: { in: childIds.map((c: { id: string }) => c.id) } },
      include: { student: { select: { id: true, name: true } } },
      orderBy: { paymentDate: "desc" },
    });
    return NextResponse.json(payments);
  } catch (error) {
    console.error("Ödeme listesi hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST - Yeni ödeme (Tahsilat) veya Borç / Gecikmiş Ödeme Tahakkuku kaydet
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await request.json();
    const type = body.type || "PAYMENT"; // "PAYMENT" (Tahsilat) veya "CHARGE" (Borç / Gecikmiş Ödeme)
    const amount = Number(body.amount);

    if (!body.studentId || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Lütfen geçerli bir öğrenci ve tutar girin" }, { status: 400 });
    }

    // 1. Borç / Gecikmiş Ödeme Ekleme (Bakiyeyi eksiye düşürür)
    if (type === "CHARGE") {
      const updatedStudent = await prisma.student.update({
        where: { id: body.studentId },
        data: { balance: { decrement: amount } },
        select: { id: true, name: true, balance: true },
      });

      return NextResponse.json(
        {
          success: true,
          type: "CHARGE",
          message: "Gecikmiş ödeme / borç kaydı başarıyla eklendi",
          student: updatedStudent,
        },
        { status: 201 }
      );
    }

    // 2. Tahsilat / Ödeme Alma (Bakiyeyi artırır ve ödeme geçmişine kaydeder)
    const payment = await prisma.payment.create({
      data: {
        studentId: body.studentId,
        amount,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
        paymentMethod: body.paymentMethod || "Nakit",
        description: body.description || null,
      },
      include: {
        student: { select: { id: true, name: true } },
      },
    });

    // Bakiyeyi artır (borcu kapatır)
    const updatedStudent = await prisma.student.update({
      where: { id: body.studentId },
      data: { balance: { increment: amount } },
      select: { id: true, name: true, balance: true },
    });

    return NextResponse.json({ ...payment, studentBalance: updatedStudent.balance }, { status: 201 });
  } catch (error) {
    console.error("Ödeme işlem hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
