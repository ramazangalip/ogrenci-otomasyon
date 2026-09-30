// shadcn/ui cn() yardımcı fonksiyonu
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Tarih formatlama yardımcıları
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatTime(time: string): string {
  return time;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount);
}

// WhatsApp wa.me dinamik link oluşturucu
export function generateWhatsAppLink(
  phone: string,
  message: string
): string {
  // Telefon numarasını temizle (sadece rakamlar)
  const cleanPhone = phone.replace(/\D/g, "");
  // Türkiye kodu yoksa ekle
  const fullPhone = cleanPhone.startsWith("90")
    ? cleanPhone
    : `90${cleanPhone}`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${fullPhone}?text=${encodedMessage}`;
}

// WhatsApp şablon mesajları
export const whatsAppTemplates = {
  dersHatirlatma: (ogrenci: string, saat: string, tarih: string) =>
    `Merhaba Sayın Veli, ${ogrenci}'nin dersi bugün saat ${saat}'de (${tarih}) yapılacaktır. İyi çalışmalar dileriz. 📚`,

  dersBitis: (ogrenci: string, konu: string) =>
    `Merhaba, ${ogrenci} ile dersimiz tamamlandı. ✅\nİşlenen konu: ${konu}\nBir sonraki derse kadar tekrar yapılması tavsiye edilir.`,

  odemeHatirlatma: (ogrenci: string, tutar: string) =>
    `Merhaba Sayın Veli, ${ogrenci} için ${tutar} tutarında ödemeniz bulunmaktadır. Bilgilerinize sunarız. 💰`,

  devamsizlikBildirimi: (ogrenci: string, tarih: string) =>
    `Merhaba Sayın Veli, ${ogrenci} bugünkü (${tarih}) derse katılamamıştır. Bilgilerinize sunarız.`,
};
