# DersTakip Akademi

Özel ders veren öğretmenler ve eğitim kurumları için geliştirilmiş öğrenci takip, ders planlama ve veli bilgilendirme platformu. Öğretmenlerin günlük operasyonlarını tek panelden yürütmesini; velilerin ise öğrencilerinin gelişimini güvenli biçimde takip etmesini sağlar.

## Öne çıkan özellikler

- Öğrenci, veli ve grup yönetimi
- Haftalık ders takvimi, bireysel/grup ders planlama ve tekrarlayan dersler
- Yoklama kaydı, ders notları ve veliye açık notlar
- Kitap okuma takibi ile aylık ilerleme grafikleri
- Deneme sınavı sonuçları, net hesaplama ve gelişim analizi
- Tahsilat, borç ve ödeme geçmişi takibi
- Veliye özel mobil uyumlu portal ve Web Push bildirim tercihleri
- PWA desteği ile cihazlara kurulabilen deneyim

## Teknoloji yığını

- Next.js 16 ve React 19
- TypeScript
- Tailwind CSS 4
- Prisma ORM ve PostgreSQL (Supabase ile uyumlu)
- NextAuth.js ile rol tabanlı oturum yönetimi
- Recharts ile grafikler

## Başlarken

### Gereksinimler

- Node.js 20 veya üzeri
- PostgreSQL veritabanı ya da Supabase PostgreSQL projesi

### Kurulum

```bash
npm install
Copy-Item .env.example .env
```

`.env` dosyasındaki `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL` ve `NEXTAUTH_SECRET` değerlerini kendi ortamınıza göre düzenleyin. Bildirim kullanacaksanız VAPID alanlarını da doldurun.

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

Uygulama varsayılan olarak [http://localhost:3000](http://localhost:3000) adresinde çalışır.

### Kalite kontrolleri

```bash
npm run lint
npm run build
```

## Ekran görüntüleri

### Genel, giriş ve kayıt

| Ana sayfa | Veli kaydı |
| --- | --- |
| ![Ana sayfa](public/screenshots/01-anasayfa.png) | ![Veli kaydı](public/screenshots/02-veli-kayit.png) |

| Giriş |
| --- |
| ![Giriş ekranı](public/screenshots/03-giris.png) |

### Öğretmen paneli

| Panel özeti | Ders takvimi |
| --- | --- |
| ![Öğretmen paneli](public/screenshots/04-ogretmen-paneli.png) | ![Ders takvimi](public/screenshots/05-ders-takvimi.png) |

| Ders planlama | Öğrenciler |
| --- | --- |
| ![Ders planlama penceresi](public/screenshots/06-ders-planlama.png) | ![Öğrenciler](public/screenshots/07-ogrenciler.png) |

| Yeni veli | Yeni öğrenci |
| --- | --- |
| ![Yeni veli ekleme](public/screenshots/08-veli-ekle.png) | ![Yeni öğrenci ekleme](public/screenshots/09-ogrenci-ekle.png) |

| Gruplar | Grup oluşturma |
| --- | --- |
| ![Gruplar](public/screenshots/10-gruplar.png) | ![Yeni grup oluşturma](public/screenshots/11-grup-olustur.png) |

| Yoklama | Yoklama ve ders ekleme |
| --- | --- |
| ![Yoklama yönetimi](public/screenshots/12-yoklama.png) | ![Yoklama ve ders ekleme](public/screenshots/13-yoklama-ekle.png) |

| Kitap takibi | Sınav ve net analizi |
| --- | --- |
| ![Kitap takibi](public/screenshots/14-kitap-takibi.png) | ![Sınav ve net analizi](public/screenshots/15-sinav-net.png) |

| Ödeme ve kasa takibi | Öğretmen profili |
| --- | --- |
| ![Ödeme ve kasa takibi](public/screenshots/16-odemeler.png) | ![Öğretmen profil ayarları](public/screenshots/17-ogretmen-profil.png) |

### Veli portalı

| Ana sayfa | Kitap okuma takibi |
| --- | --- |
| ![Veli ana sayfası](public/screenshots/18-veli-ana-sayfa.png) | ![Veli kitap takibi](public/screenshots/19-veli-kitap-takibi.png) |

| Sınav sonuçları | Ödeme geçmişi |
| --- | --- |
| ![Veli sınav sonuçları](public/screenshots/20-veli-sinav-sonuclari.png) | ![Veli ödeme geçmişi](public/screenshots/21-veli-odemeler.png) |

| Bildirim tercihleri | Veli profili |
| --- | --- |
| ![Veli bildirim tercihleri](public/screenshots/22-veli-bildirimler.png) | ![Veli profil ayarları](public/screenshots/23-veli-profil.png) |

## Geliştirici

Bu sistem [VisionDevStudio](https://visiondevstudio.com.tr/) tarafından geliştirilmiştir.
