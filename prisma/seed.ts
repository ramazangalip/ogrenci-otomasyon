import { PrismaClient, Role, LessonType, LessonStatus, AttendanceStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Veritabanı tohumlanıyor (Seeding)...");

  // Mevcut verileri temizle
  await prisma.pushSubscription.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.examResult.deleteMany();
  await prisma.readingLog.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.groupStudent.deleteMany();
  await prisma.group.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash("123456", 12);

  // 1. Öğretmen (Admin) Oluştur
  await prisma.user.create({
    data: {
      email: "ogretmen@edutrack.com",
      passwordHash,
      role: Role.TEACHER,
      name: "Ahmet Öğretmen",
      phone: "5551234567",
    },
  });

  // 2. Veli Oluştur
  const parent = await prisma.user.create({
    data: {
      email: "veli@edutrack.com",
      passwordHash,
      role: Role.PARENT,
      name: "Mehmet Demir",
      phone: "5559876543",
    },
  });

  // 3. Öğrenciler Oluştur
  const student1 = await prisma.student.create({
    data: {
      name: "Ali Demir",
      grade: "8. Sınıf (LGS)",
      school: "Atatürk Ortaokulu",
      parentId: parent.id,
      monthlyFee: 3500,
      balance: -1500, // 1500 TL borç
      tags: ["Matematik: Çarpanlar", "Fen: Basınç", "Geometri Zayıf"],
    },
  });

  const student2 = await prisma.student.create({
    data: {
      name: "Zeynep Demir",
      grade: "6. Sınıf",
      school: "Cumhuriyet Koleji",
      parentId: parent.id,
      monthlyFee: 2800,
      balance: 0,
      tags: ["Türkçe Güçlü", "İngilizce"],
    },
  });

  await prisma.student.create({
    data: {
      name: "Can Kaya",
      grade: "11. Sınıf (YKS)",
      school: "Anadolu Lisesi",
      monthlyFee: 4000,
      balance: -4000,
      tags: ["Fizik: Vektörler", "Türev"],
    },
  });

  // 4. Grup Oluştur
  const lgsGroup = await prisma.group.create({
    data: {
      name: "8-A LGS Matematik Kampı",
      capacity: 6,
      level: "İleri Seviye",
      students: {
        create: [
          { studentId: student1.id },
        ],
      },
    },
  });

  // 5. Dersler Oluştur
  const today = new Date();
  const lesson1 = await prisma.lesson.create({
    data: {
      title: "LGS Matematik - Üslü Sayılar Soru Çözümü",
      type: LessonType.GROUP,
      date: today,
      startTime: "16:00",
      endTime: "17:30",
      status: LessonStatus.SCHEDULED,
      groupId: lgsGroup.id,
      notePublic: "Ödev kontrolü yapıldı, 50 yeni nesil soru çözüldü.",
      notePrivate: "Ali'nin dikkat dağınıklığı azaldı, yeni nesil soru kalıplarını daha hızlı kavrıyor.",
    },
  });

  await prisma.lesson.create({
    data: {
      title: "Birebir Geometri - Üçgende Açılar",
      type: LessonType.INDIVIDUAL,
      date: today,
      startTime: "18:00",
      endTime: "19:00",
      status: LessonStatus.SCHEDULED,
      studentId: student1.id,
      notePublic: "Üçgenler konusu tamamlandı. 30 soru ödev verildi.",
      notePrivate: "Formülleri ezberlemekte zorlanıyor, görsel modellemeyle pekiştirildi.",
    },
  });

  // 6. Yoklama Kaydı
  await prisma.attendance.create({
    data: {
      lessonId: lesson1.id,
      studentId: student1.id,
      status: AttendanceStatus.ATTENDED,
    },
  });

  // 7. Kitap Okuma Kayıtları
  await prisma.readingLog.createMany({
    data: [
      { studentId: student1.id, bookTitle: "Nutuk - M. Kemal Atatürk", pageCount: 35, logDate: new Date() },
      { studentId: student1.id, bookTitle: "Simyacı - Paulo Coelho", pageCount: 42, logDate: new Date(Date.now() - 86400000 * 2) },
      { studentId: student1.id, bookTitle: "Küçük Prens - Saint-Exupéry", pageCount: 60, logDate: new Date(Date.now() - 86400000 * 5) },
      { studentId: student2.id, bookTitle: "Harry Potter ve Felsefe Taşı", pageCount: 50, logDate: new Date() },
    ],
  });

  // 8. Sınav Sonuçları
  await prisma.examResult.createMany({
    data: [
      {
        studentId: student1.id,
        examName: "LGS Türkiye Geneli Deneme 1",
        examDate: new Date(Date.now() - 86400000 * 14),
        correctCount: 72,
        wrongCount: 15,
        netScore: 67.0,
      },
      {
        studentId: student1.id,
        examName: "LGS Türkiye Geneli Deneme 2",
        examDate: new Date(Date.now() - 86400000 * 7),
        correctCount: 78,
        wrongCount: 10,
        netScore: 74.6,
      },
      {
        studentId: student1.id,
        examName: "LGS Branş Denemesi 3",
        examDate: new Date(),
        correctCount: 82,
        wrongCount: 7,
        netScore: 79.6,
      },
    ],
  });

  // 9. Ödemeler
  await prisma.payment.createMany({
    data: [
      {
        studentId: student1.id,
        amount: 2000,
        paymentDate: new Date(Date.now() - 86400000 * 15),
        paymentMethod: "Havale / EFT",
        description: "Ekim Ayı 1. Taksit Ödemesi",
      },
      {
        studentId: student2.id,
        amount: 2800,
        paymentDate: new Date(Date.now() - 86400000 * 3),
        paymentMethod: "Nakit",
        description: "Ekim Ayı Ders Ücreti Tam Ödeme",
      },
    ],
  });

  console.log("✅ Veritabanı başarıyla tohumlandı!");
  console.log("👨‍🏫 Öğretmen Girişi: ogretmen@edutrack.com / 123456");
  console.log("👨‍👩‍👧 Veli Girişi: veli@edutrack.com / 123456");
}

main()
  .catch((e) => {
    console.error("Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
