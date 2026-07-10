# Taksit Takip Sistemi - Project Context & Handover

## Proje Amacı (Project Purpose)
Local-first (bulut sunucu kullanmayan), çevrimdışı çalışabilen, IndexedDB tabanlı bir Taksit ve Abonelik takip PWA'sı (Progressive Web App). Kullanıcıların banka veya kredi kartlarını ekleyebildiği, bunlara ait taksitli harcamaları veya döngüsel abonelikleri takip edebildiği, kalan borç projeksiyonlarını gördüğü tamamen cihaz-içi bir finansal takip uygulamasıdır.

## Tasarım Dili (Design Philosophy)
- **Aesthetic**: Cyber-utilitarian, brutalist, mobile-first, pure dark mode.
- **Rules**: Asla "drop-shadow" veya "soft glow" kullanılmayacak. Sert ve net çizgiler (`hairline borders`, `border-white/10`, `border-zinc-800`). Arka plan tam siyah veya kuyu gri (`bg-zinc-950`). Vurgu rengi her zaman keskin bir Cyan (`cyan-400` / `primary-fixed`). Fontlar `JetBrains Mono` ve `Inter` kombinasyonu.

## Teknoloji Yığını (Tech Stack & Versions)
- **Core**: Vite v8.1.4, React 19, TypeScript
- **Styling**: Tailwind CSS v4 (Custom color variables in `index.css`)
- **Animation**: Framer Motion
- **State Management**: Zustand
- **Database**: Dexie.js (IndexedDB wrapper) + `dexie-react-hooks`
- **Icons**: Lucide React

## Dizin ve Veritabanı Yapısı (Project Structure & DB)

### 1. Database (`src/db/db.ts`)
Dexie üzerinden `LedgerDB` kuruludur.
- `accounts`: `id`, `name`, `type` ('bank' | 'credit'), `balance`, `currency` ('USD' | 'TRY'), `statementDate`
- `transactions`: `id`, `accountId`, `title`, `totalAmount`, `isRecurring`, `createdAt`
- `installments`: `id`, `transactionId`, `month` (YYYY-MM), `amount`, `isPaid`
*(Not: `installments` tablosunda `accountId` yoktur, işlemler `transactionId` üzerinden birbirine bağlanır.)*

### 2. State Management (`src/store/`)
- `uiStore.ts`: UI state'leri (`activeTab`, `selectedAccountId`, `isAddDrawerOpen`) ve tüm CRUD işlemleri (`addTransaction`, `addAccount`, `deleteAccount`) burada asenkron olarak IndexedDB ile konuşur.
- `langStore.ts`: i18n Desteği (TR/EN). Uygulama içindeki her metin `t('key')` ile çekilir.

### 3. Ana Bileşenler (Key Components)
- `App.tsx`: 3 Ana sekmeden (Home, Data, Prefs) oluşur.
- `AccountsCardStack.tsx`: Apple Wallet stili, Framer Motion ile yığılan (stack) ve açılan hesap kartları animasyon bloğu. Sadece kartların kendi içinde kayabilmesi (scroll) için özel bir container'a sahiptir.
- `CardLedgerDetail.tsx`: Karta tıklandığında açılan detay Modal'ı. O hesaba ait borç grafiğini, taksitleri gösterir. Başlığında hesabı silme (Trash2) ve işlem ekleme (PlusCircle) butonları vardır.
- `AddTransactionDrawer.tsx`: Ekranın altından kayarak açılan (Bottom Sheet Drawer) Brutalist İşlem Ekleme Formu. Taksit veya Abonelik seçimi yaptırır. Eğer `CardLedgerDetail` içinden açıldıysa, `accountId` otomatik kilitlenir.

## Son Yapılan Geliştirmeler (Latest Implementations)
1. Bütün projeye i18n (TR/EN) dil altyapısı kuruldu.
2. Apple Wallet benzeri Card Stack bileşeni entegre edildi.
3. Ayarlar bölümüne (Prefs) "Hesap Ekleme" formu eklendi (Kredi kartı seçildiğinde başlangıç bakiyesi alanı gizleniyor).
4. Hesap oluştururken Döviz (USD / TRY) seçimi eklendi.
5. Card Detail (Hesap Detayı) içerisine "Hesabı Sil" eklendi (Bağlı olan tüm taksit ve işlemleri basamaklı (cascade) olarak IndexedDB'den temizler).
6. Card Detail içinden `AddTransactionDrawer` açıldığında gereksiz hesap seçme dropdown'u gizlendi ve aktif hesaba kilitlendi.
7. İndexedDB "accountId" sorgu hatası çözüldü, sistem tamamen stabil hale getirildi.

---
**Next Agent Instructions:** Bu dosyayı okuyorsanız, sistem oturmuş ve tamamen Type-Safe (hata vermeyen) bir durumdadır. Yeni bir özellik eklerken kesinlikle Brutalist tasarım kurallarına uyun, Zustand + Dexie.js kombinasyonunu bozmayın ve Tailwind v4 utility class'ları kullanmaya özen gösterin.
