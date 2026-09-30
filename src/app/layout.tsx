import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0f1117",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "DersTakip Akademi | Öğrenci Takip ve Veli Bilgilendirme Sistemi",
  description:
    "Birebir ve grup özel ders veren öğretmenler ve kurumlar için öğrenci takip, veli bilgilendirme ve ders yönetim sistemi.",
  manifest: "/manifest.json",
  icons: {
    icon: "/gemini-svg.svg",
    shortcut: "/gemini-svg.svg",
    apple: "/gemini-svg.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className="min-h-screen animated-bg antialiased">
        {children}
      </body>
    </html>
  );
}
