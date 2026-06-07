export interface PrayerTimes {
  Imsak: string;
  Gunes: string;
  Ogle: string;
  Ikindi: string;
  Aksam: string;
  Yatsi: string;
  [key: string]: string; // index signature
}

export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
}

export interface IslamicDay {
  id: string;
  name: string;
  date: string; // ISO String (YYYY-MM-DD)
  gregorianYear: number;
  hijriDate: string; // e.g., "1 Şevval 1447"
  type: 'bayram' | 'kandil' | 'mubarek_gundur' | 'yilbasi';
  description: string;
}

export interface SpiritualHabit {
  id: string;
  title: string;
  description: string;
  category: 'namaz' | 'kuran' | 'zikir' | 'diger';
  isFard: boolean;
  streak: number;
  completedDates: string[]; // Keep track of dates done e.g. "YYYY-MM-DD"
}

export interface Dhikr {
  id: string;
  arabic: string;
  turkishName: string;
  meaning: string;
  count: number;
  target?: number;
}

export interface NotificationSetting {
  prayerId: string; // imsak, gunes, ogle etc.
  notifyAtTime: boolean;
  notifyBeforeMs: number; // in milliseconds (e.g., 15 * 60 * 1000 for 15 mins)
}
