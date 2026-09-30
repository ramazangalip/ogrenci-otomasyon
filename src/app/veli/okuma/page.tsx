import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReadingClient from "./reading-client";

export default async function VeliReadingPage() {
  const session = await auth();

  if (!session || session.user.role !== "PARENT") {
    redirect("/giris");
  }

  const students = await prisma.student.findMany({
    where: { parentId: session.user.id },
    select: { id: true, name: true },
  });

  const logs = await prisma.readingLog.findMany({
    where: { studentId: { in: students.map((s) => s.id) } },
    orderBy: { logDate: "desc" },
  });

  return <ReadingClient students={students} initialLogs={logs} />;
}
