// Zod doğrulama şemaları - tüm form ve API girdileri için
import { z } from "zod";

// ─── Kullanıcı Şemaları ───
export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  role: z.enum(["TEACHER", "PARENT"]),
  phone: z.string().optional(),
});

// ─── Öğrenci Şemaları ───
export const studentSchema = z.object({
  name: z.string().min(2, "Öğrenci adı en az 2 karakter olmalıdır"),
  grade: z.string().optional(),
  school: z.string().optional(),
  parentId: z.string().optional(),
  monthlyFee: z.coerce.number().min(0, "Ücret negatif olamaz").default(0),
  tags: z.array(z.string()).default([]),
});

// ─── Grup Şemaları ───
export const groupSchema = z.object({
  name: z.string().min(2, "Grup adı en az 2 karakter olmalıdır"),
  capacity: z.coerce.number().int().min(1).default(10),
  level: z.string().optional(),
  studentIds: z.array(z.string()).default([]),
});

// ─── Ders Şemaları ───
export const lessonSchema = z.object({
  title: z.string().min(2, "Ders başlığı en az 2 karakter olmalıdır"),
  type: z.enum(["INDIVIDUAL", "GROUP"]),
  date: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Saat formatı: HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Saat formatı: HH:MM"),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "POSTPONED"]).default("SCHEDULED"),
  groupId: z.string().nullable().optional(),
  studentId: z.string().nullable().optional(),
  notePublic: z.string().nullable().optional(),
  notePrivate: z.string().nullable().optional(),
  isRecurring: z.boolean().default(false),
  recurRule: z.string().nullable().optional(),
});

// ─── Yoklama Şemaları ───
export const attendanceSchema = z.object({
  lessonId: z.string(),
  studentId: z.string(),
  status: z.enum(["ATTENDED", "ABSENT", "EXCUSED"]),
});

export const bulkAttendanceSchema = z.object({
  lessonId: z.string(),
  attendances: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(["ATTENDED", "ABSENT", "EXCUSED"]),
    })
  ),
});

// ─── Kitap Okuma Şemaları ───
export const readingLogSchema = z.object({
  studentId: z.string(),
  bookTitle: z.string().min(1, "Kitap adı gereklidir"),
  pageCount: z.coerce.number().int().min(1, "Sayfa sayısı en az 1 olmalıdır"),
  logDate: z.coerce.date().default(() => new Date()),
});

// ─── Sınav Sonucu Şemaları ───
export const examResultSchema = z.object({
  studentId: z.string(),
  examName: z.string().min(2, "Sınav adı en az 2 karakter olmalıdır"),
  examDate: z.coerce.date(),
  correctCount: z.coerce.number().int().min(0),
  wrongCount: z.coerce.number().int().min(0),
  netScore: z.coerce.number(),
  details: z.record(z.string(), z.number()).optional(), // { turkce: 15.5, mat: 12.0, ... }
});

// ─── Ödeme Şemaları ───
export const paymentSchema = z.object({
  studentId: z.string(),
  amount: z.coerce.number().min(0.01, "Ödeme tutarı 0'dan büyük olmalıdır"),
  paymentDate: z.coerce.date().default(() => new Date()),
  paymentMethod: z.string().optional(),
  description: z.string().optional(),
});

// ─── Push Abonelik Şemaları ───
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

// ─── Profil Güncelleme Şeması ───
export const profileUpdateSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  phone: z.string().optional().nullable(),
  currentPassword: z.string().optional().nullable(),
  newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalıdır").optional().nullable().or(z.literal("")),
});

// ─── Yeni Veli Ekleme Şeması (Öğretmen için) ───
export const parentCreateSchema = z.object({
  name: z.string().min(2, "Veli adı en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  phone: z.string().optional().nullable(),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır").default("123456"),
});

// Tip çıkarımları
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type StudentInput = z.infer<typeof studentSchema>;
export type GroupInput = z.infer<typeof groupSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type AttendanceInput = z.infer<typeof attendanceSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
export type ReadingLogInput = z.infer<typeof readingLogSchema>;
export type ExamResultInput = z.infer<typeof examResultSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ParentCreateInput = z.infer<typeof parentCreateSchema>;

