"use server";

// ─── Kimlik Doğrulama Server Actions ───
import { signIn, signOut } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { loginSchema, registerSchema } from "@/lib/validations";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validated = loginSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Geçersiz veri" };
  }

  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
  } catch {
    return { error: "E-posta veya şifre hatalı" };
  }

  // Kullanıcının rolüne göre yönlendir
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: { role: true },
  });

  if (user?.role === "TEACHER") {
    redirect("/admin");
  } else {
    redirect("/veli");
  }
}

export async function registerAction(formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as "TEACHER" | "PARENT",
    phone: (formData.get("phone") as string) || undefined,
  };

  const validated = registerSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Geçersiz veri" };
  }

  // E-posta kontrolü
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    return { error: "Bu e-posta adresi zaten kayıtlı" };
  }

  const passwordHash = await hash(data.password, 12);

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      phone: data.phone,
    },
  });

  return { success: true };
}

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/giris");
}
