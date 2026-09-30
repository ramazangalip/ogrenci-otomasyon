// Profil Yönetimi API Route (Öğretmen ve Veli için İsim, E-posta, Telefon ve Şifre Güncelleme)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { compare, hash } from "bcryptjs";
import { profileUpdateSchema } from "@/lib/validations";

// GET - Mevcut kullanıcının profil bilgilerini getir
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Oturum açılmamış" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profil bilgisi getirme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PUT / PATCH - Profil ve şifre bilgilerini güncelle
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 401 });
    }

    const body = await request.json();
    const validated = profileUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || "Geçersiz veri" },
        { status: 400 }
      );
    }

    const { name, email, phone, currentPassword, newPassword } = validated.data;
    const userId = session.user.id;

    // Kullanıcıyı veritabanından şifresiyle çekelim
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    // E-posta değiştiyse, başka birinde var mı kontrol et
    const targetEmail = email.toLowerCase().trim();
    if (targetEmail !== currentUser.email.toLowerCase()) {
      const emailExists = await prisma.user.findUnique({
        where: { email: targetEmail },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: "Bu e-posta adresi başka bir hesap tarafından kullanılıyor" },
          { status: 400 }
        );
      }
    }

    // Şifre değişikliği talebi var mı?
    let updatedPasswordHash: string | undefined = undefined;
    if (newPassword && newPassword.trim().length > 0) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Şifrenizi değiştirmek için lütfen mevcut şifrenizi girin" },
          { status: 400 }
        );
      }

      // Mevcut şifreyi kontrol et
      const isMatch = await compare(currentPassword, currentUser.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Mevcut şifreniz hatalı. Lütfen kontrol edip tekrar deneyin." },
          { status: 400 }
        );
      }

      updatedPasswordHash = await hash(newPassword, 12);
    }

    // Güncelleme işlemi
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        email: targetEmail,
        phone: phone?.trim() || null,
        ...(updatedPasswordHash ? { passwordHash: updatedPasswordHash } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profil bilgileriniz başarıyla güncellendi",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profil güncelleme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu" }, { status: 500 });
  }
}
