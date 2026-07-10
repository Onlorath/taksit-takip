import { create } from 'zustand';

const translations = {
  en: {
    terminal: "TERMINAL",
    total_remaining_debt: "TOTAL REMAINING DEBT",
    upcoming: "UPCOMING",
    accounts: "ACCOUNTS",
    no_accounts: "NO ACCOUNTS FOUND",
    balance: "BALANCE",
    upcoming_payments: "UPCOMING PAYMENTS",
    view_all: "VIEW ALL",
    show_less: "SHOW LESS",
    all_months: "ALL MONTHS",
    no_upcoming_payments: "NO UPCOMING PAYMENTS",
    initiate_transfer: "INITIATE TRANSFER",
    generate_report: "GENERATE REPORT",
    home: "HOME",
    data: "DATA",
    prefs: "PREFS",
    language: "LANGUAGE",
    add_record: "ADD RECORD",
    installment: "INSTALLMENT",
    subscription: "SUBSCRIPTION",
    source_account: "SOURCE_ACCOUNT",
    select_account: "SELECT_ACCOUNT",
    entity_desc: "ENTITY_DESC",
    value_usd: "VALUE_USD",
    periods: "PERIODS",
    maturity_offset: "MATURITY_OFFSET",
    immediate: "IMMEDIATE",
    commit_tx: "COMMIT_TX",
    total_debt: "Total Debt",
    installment_degradation: "Installment Degradation",
    projection: "PROJECTION",
    active_installments: "Active Installments",
    no_active_records: "NO_ACTIVE_RECORDS",
    past_payments: "PAST PAYMENTS",
    no_past_payments: "NO PAST PAYMENTS",
    paid: "PAID",
    recurring: "RECURRING",
    rem: "REM",
    offset_30: "+30_DAYS",
    offset_60: "+60_DAYS",
    offset_90: "+90_DAYS",
    select_lang: "Select Language",
    preferences: "PREFERENCES",
    global_ledger: "GLOBAL LEDGER",
    manage_accounts: "MANAGE ACCOUNTS",
    add_account: "ADD ACCOUNT",
    account_name: "ACCOUNT NAME",
    account_type: "ACCOUNT TYPE",
    initial_balance: "INITIAL BALANCE",
    credit_card: "CREDIT CARD",
    bank_account: "BANK ACCOUNT",
    currency: "CURRENCY",
    delete_account: "DELETE ACCOUNT",
    confirm_delete: "Are you sure you want to delete this account?"
  },
  tr: {
    terminal: "TERMİNAL",
    total_remaining_debt: "TOPLAM KALAN BORÇ",
    upcoming: "GELECEK",
    accounts: "HESAPLAR",
    no_accounts: "HESAP BULUNAMADI",
    balance: "BAKİYE",
    upcoming_payments: "GELECEK ÖDEMELER",
    view_all: "TÜMÜNÜ GÖR",
    show_less: "DAHA AZ GÖSTER",
    all_months: "TÜM AYLAR",
    no_upcoming_payments: "GELECEK ÖDEME YOK",
    initiate_transfer: "TRANSFER BAŞLAT",
    generate_report: "RAPOR OLUŞTUR",
    home: "ANASAYFA",
    data: "VERİ",
    prefs: "AYARLAR",
    language: "DİL",
    add_record: "KAYIT EKLE",
    installment: "TAKSİT",
    subscription: "ABONELİK",
    source_account: "KAYNAK_HESAP",
    select_account: "HESAP_SEÇİN",
    entity_desc: "AÇIKLAMA",
    value_usd: "TUTAR_USD",
    periods: "VADE_SAYISI",
    maturity_offset: "VADE_ÖTELEME",
    immediate: "HEMEN",
    commit_tx: "İŞLEMİ_ONAYLA",
    total_debt: "Toplam Borç",
    installment_degradation: "Taksit Düşüş Grafiği",
    projection: "PROJEKSİYON",
    active_installments: "Aktif Ödemeler",
    no_active_records: "AKTİF_KAYIT_YOK",
    past_payments: "GEÇMİŞ ÖDEMELER",
    no_past_payments: "GEÇMİŞ ÖDEME YOK",
    paid: "ÖDENDİ",
    recurring: "DÖNGÜSEL",
    rem: "KALAN",
    offset_30: "+30_GÜN",
    offset_60: "+60_GÜN",
    offset_90: "+90_GÜN",
    select_lang: "Dil Seçin",
    preferences: "AYARLAR",
    global_ledger: "GENEL DEFTER",
    manage_accounts: "HESAP YÖNETİMİ",
    add_account: "HESAP EKLE",
    account_name: "HESAP ADI",
    account_type: "HESAP TÜRÜ",
    initial_balance: "BAŞLANGIÇ BAKİYESİ",
    credit_card: "KREDİ KARTI",
    bank_account: "BANKA HESABI",
    currency: "PARA BİRİMİ",
    delete_account: "HESABI SİL",
    confirm_delete: "Bu hesabı silmek istediğinizden emin misiniz?"
  }
} as const;

type LangType = 'en' | 'tr';
type TranslationKeys = keyof typeof translations.en;

interface LangState {
  lang: LangType;
  setLang: (lang: LangType) => void;
  t: (key: TranslationKeys) => string;
}

export const useLangStore = create<LangState>((set, get) => ({
  lang: (localStorage.getItem('app-lang') as LangType) || 'en',
  setLang: (lang) => {
    localStorage.setItem('app-lang', lang);
    set({ lang });
  },
  t: (key) => {
    const currentLang = get().lang;
    return translations[currentLang][key] || translations['en'][key] || String(key);
  }
}));
