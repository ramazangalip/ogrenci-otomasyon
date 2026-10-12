// Veli Kendi Kendine Kayıt Olma API Rotası
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Rolü her zaman PARENT olarak ayarlıyoruz
    const dataToValidate = {
      name: body.name,
      email: body.email,
      password: body.password,
      role: "PARENT",
      phone: body.phone || undefined,
      studentName: body.studentName || undefined,
      studentGrade: body.studentGrade || undefined,
      studentSchool: body.studentSchool || undefined,
    };

    const validated = registerSchema.safeParse(dataToValidate);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || "Lütfen tüm zorunlu alanları doldurun" },
        { status: 400 }
      );
    }

    const { name, email, password, phone, studentName, studentGrade, studentSchool } = validated.data;
    const cleanEmail = email.toLowerCase().trim();

    // E-posta mükerrerlik kontrolü
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten sisteme kayıtlıdır. Lütfen giriş yapın." },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: phone?.trim() || null,
        passwordHash,
        role: "PARENT",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Eğer öğrenci adı belirtilmişse öğrenci kaydını da otomatik oluşturup veliye bağlıyoruz
    let createdStudent = null;
    if (studentName && studentName.trim().length > 0) {
      createdStudent = await prisma.student.create({
        data: {
          name: studentName.trim(),
          grade: studentGrade?.trim() || null,
          school: studentSchool?.trim() || null,
          parentId: newUser.id,
          monthlyFee: 0,
          balance: 0,
          tags: [],
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Veli kaydınız başarıyla oluşturuldu.",
        user: newUser,
        student: createdStudent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Veli kayıt olma hatası:", error);
    return NextResponse.json(
      { error: "Kayıt işlemi sırasında bir sunucu hatası oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
