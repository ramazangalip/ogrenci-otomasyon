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

// POST - Yeni ödeme kaydet
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await request.json();

    const payment = await prisma.payment.create({
      data: {
        studentId: body.studentId,
        amount: body.amount,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
        paymentMethod: body.paymentMethod || null,
        description: body.description || null,
      },
    });

    // Bakiyeyi güncelle
    await prisma.student.update({
      where: { id: body.studentId },
      data: { balance: { increment: body.amount } },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Ödeme kayıt hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
