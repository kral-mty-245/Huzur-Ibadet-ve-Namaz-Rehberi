import { IslamicDay } from '../types';

// Tabular Islamic Calendar Algorithm
// Returns: { day: number, month: number, year: number, monthName: string }
export function getHijriDate(gregorianDate: Date, adjustmentDays: number = 0): {
  day: number;
  month: number;
  year: number;
  monthName: string;
} {
  // Apply manual adjustment (days to add/subtract based on local moon sighting)
  const date = new Date(gregorianDate.getTime());
  date.setDate(date.getDate() + adjustmentDays);

  let year = date.getFullYear();
  let month = date.getMonth() + 1; // 1-12
  let day = date.getDate();

  if (month < 3) {
    year -= 1;
    month += 12;
  }

  let jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day - 1524.5;
  
  // Gregorian calendar correction
  if (jd > 2299160.4) {
    const a = Math.floor(year / 100);
    const b = Math.floor(a / 4);
    jd += 2 - a + b;
  }

  // Adjust to Islamic epoch
  const islamicEpoch = 1948439.5;
  const daysSinceEpoch = jd - islamicEpoch;

  const cycleLength = 10631; // Days in a 30-year tabular cycle
  const cycles = Math.floor(daysSinceEpoch / cycleLength);
  let cycleDays = daysSinceEpoch % cycleLength;

  if (cycleDays < 0) {
    cycleDays += cycleLength;
  }

  // Year calculation within the cycle
  const leapYears = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
  let hijriYear = cycles * 30;
  let yearDays = 0;

  for (let i = 1; i <= 30; i++) {
    const isLeap = leapYears.includes(i);
    const daysInYear = isLeap ? 355 : 354;
    if (cycleDays < yearDays + daysInYear) {
      hijriYear += i - 1;
      cycleDays -= yearDays;
      break;
    }
    yearDays += daysInYear;
  }

  // Month calculation
  // Alternating months: 30, 29, 30, 29...
  let hijriMonth = 1;
  let monthDays = 0;

  for (let m = 1; m <= 12; m++) {
    const daysInMonth = (m % 2 === 1) ? 30 : 29;
    // 12th month has 30 days in leap years
    const actualDays = (m === 12 && leapYears.includes(hijriYear % 30)) ? 30 : daysInMonth;

    if (cycleDays < monthDays + actualDays) {
      hijriMonth = m;
      cycleDays -= monthDays;
      break;
    }
    monthDays += actualDays;
  }

  const hijriDay = Math.floor(cycleDays) + 1;

  const hijriMonthNames = [
    "Muharrem",
    "Safer",
    "Rebiülevvel",
    "Rebiülahir",
    "Cemaziyelevvel",
    "Cemaziyelahir",
    "Recep",
    "Şaban",
    "Ramazan",
    "Şevval",
    "Zilkade",
    "Zilhicce"
  ];

  return {
    day: hijriDay,
    month: hijriMonth,
    year: hijriYear,
    monthName: hijriMonthNames[hijriMonth - 1]
  };
}

// Format Hijri Date to string
export function formatHijriDate(gregorianDate: Date, adjustmentDays: number = 0): string {
  const h = getHijriDate(gregorianDate, adjustmentDays);
  return `${h.day} ${h.monthName} ${h.year}`;
}

// Database of special Islamic Days (Religious Holidays and Kandils)
const SPECIAL_DAYS_DATABASE: Omit<IslamicDay, 'hijriDate'>[] = [
  // 2025
  { id: '2025_regaib', name: 'Regaib Kandili', date: '2025-01-02', gregorianYear: 2025, type: 'kandil', description: 'Şaban ayının ilk perşembe gecesidir. Rahmet ve bereket gecesidir.' },
  { id: '2025_mirac', name: 'Miraç Kandili', date: '2025-01-26', gregorianYear: 2025, type: 'kandil', description: 'Peygamber Efendimizin (s.a.v) göğe yükseldiği, namazın müjdelendiği kutlu gecedir.' },
  { id: '2025_berat', name: 'Berat Kandili', date: '2025-02-13', gregorianYear: 2025, type: 'kandil', description: 'Günahların affedildiği, rızıkların ve kaderin yazıldığı berat ve kurtuluş gecesidir.' },
  { id: '2025_ramazan_is', name: 'Ramazan Başlangıcı', date: '2025-03-01', gregorianYear: 2025, type: 'yilbasi', description: 'Ramazan-ı Şerif ayının ilk oruç günüdür.' },
  { id: '2025_kadir', name: 'Kadir Gecesi', date: '2025-03-26', gregorianYear: 2025, type: 'kandil', description: 'Kur\'an-ı Kerim\'in indirilmeye başlandığı, bin aydan hayırlı olan mübarek gecedir.' },
  { id: '2025_ram_arefe', name: 'Ramazan Bayramı Arefesi', date: '2025-03-29', gregorianYear: 2025, type: 'mubarek_gundur', description: 'Bayram öncesindeki son hazırlık ve dua günüdür.' },
  { id: '2025_ram_bayram1', name: 'Ramazan Bayramı (1. Gün)', date: '2025-03-30', gregorianYear: 2025, type: 'bayram', description: 'Ramazan orucunun tamamlanmasıyla sevinç ve sıla-i rahim günüdür.' },
  { id: '2025_kur_arefe', name: 'Kurban Bayramı Arefesi', date: '2025-06-05', gregorianYear: 2025, type: 'mubarek_gundur', description: 'Hacıların Arafat\'ta vakfeye durduğu en değerli dua günlerindendir.' },
  { id: '2025_kur_bayram1', name: 'Kurban Bayramı (1. Gün)', date: '2025-06-06', gregorianYear: 2025, type: 'bayram', description: 'Allah\'a yakınlaşma amacıyla kurban ibadetinin eda edildiği bayram günüdür.' },
  { id: '2025_hicri_yil', name: 'Hicri Yılbaşı', date: '2025-06-26', gregorianYear: 2025, type: 'yilbasi', description: 'Peygamber Efendimizin Mekke\'den Medine\'ye hicretini esas alan yeni Hicri yılın (1447) başlangıcıdır.' },
  { id: '2025_asure', name: 'Aşure Günü', date: '2025-07-05', gregorianYear: 2025, type: 'mubarek_gundur', description: 'Muharrem ayının onuncu günüdür. Pek çok mucizenin gerçekleştiği, ikram günüdür.' },
  { id: '2025_mevlid', name: 'Mevlid Kandili', date: '2025-09-04', gregorianYear: 2025, type: 'kandil', description: 'Peygamber Efendimiz Hz. Muhammed\'in (s.a.v) dünyaya teşrif ettiği veladet gecesidir.' },

  // 2026
  { id: '2026_regaib', name: 'Regaib Kandili', date: '2026-01-22', gregorianYear: 2026, type: 'kandil', description: 'Şaban ayının ilk perşembe gecesidir. Rahmet ve bereket gecesidir.' },
  { id: '2026_mirac', name: 'Miraç Kandili', date: '2026-02-14', gregorianYear: 2026, type: 'kandil', description: 'Peygamber Efendimizin (s.a.v) göğe yükseldiği, namazın müjdelendiği kutlu gecedir.' },
  { id: '2026_berat', name: 'Berat Kandili', date: '2026-03-03', gregorianYear: 2026, type: 'kandil', description: 'Günahların affedildiği, rızıkların ve kaderin yazıldığı berat ve kurtuluş gecesidir.' },
  { id: '2026_ramazan_is', name: 'Ramazan Başlangıcı', date: '2026-03-19', gregorianYear: 2026, type: 'yilbasi', description: 'Ramazan-ı Şerif ayının ilk oruç günüdür.' },
  { id: '2026_kadir', name: 'Kadir Gecesi', date: '2026-04-14', gregorianYear: 2026, type: 'kandil', description: 'Kur\'an-ı Kerim\'in indirilmeye başlandığı, bin aydan hayırlı olan mübarek gecedir.' },
  { id: '2026_ram_arefe', name: 'Ramazan Bayramı Arefesi', date: '2026-04-17', gregorianYear: 2026, type: 'mubarek_gundur', description: 'Bayram öncesindeki son hazırlık ve dua günüdür.' },
  { id: '2026_ram_bayram1', name: 'Ramazan Bayramı (1. Gün)', date: '2026-04-18', gregorianYear: 2026, type: 'bayram', description: 'Ramazan orucunun tamamlanmasıyla sevinç ve sıla-i rahim günüdür.' },
  { id: '2026_kur_arefe', name: 'Kurban Bayramı Arefesi', date: '2026-05-26', gregorianYear: 2026, type: 'mubarek_gundur', description: 'Hacıların Arafat\'ta vakfeye durduğu en değerli dua günlerindendir.' },
  { id: '2026_kur_bayram1', name: 'Kurban Bayramı (1. Gün)', date: '2026-05-27', gregorianYear: 2026, type: 'bayram', description: 'Allah\'a yakınlaşma amacıyla kurban ibadetinin eda edildiği bayram günüdür.' },
  { id: '2026_hicri_yil', name: 'Hicri Yılbaşı', date: '2026-06-16', gregorianYear: 2026, type: 'yilbasi', description: 'Peygamber Efendimizin Mekke\'den Medine\'ye hicretini esas alan yeni Hicri yılın (1448) başlangıcıdır.' },
  { id: '2026_asure', name: 'Aşure Günü', date: '2026-06-25', gregorianYear: 2026, type: 'mubarek_gundur', description: 'Muharrem ayının onuncu günüdür. Pek çok mucizenin gerçekleştiği, ikram günüdür.' },
  { id: '2026_mevlid', name: 'Mevlid Kandili', date: '2026-08-25', gregorianYear: 2026, type: 'kandil', description: 'Peygamber Efendimiz Hz. Muhammed\'in (s.a.v) dünyaya teşrif ettiği veladet gecesidir.' },

  // 2027
  { id: '2027_regaib', name: 'Regaib Kandili', date: '2027-01-14', gregorianYear: 2027, type: 'kandil', description: 'Şaban ayının ilk perşembe gecesidir. Rahmet ve bereket gecesidir.' },
  { id: '2027_mirac', name: 'Miraç Kandili', date: '2027-02-03', gregorianYear: 2027, type: 'kandil', description: 'Peygamber Efendimizin (s.a.v) göğe yükseldiği, namazın müjdelendiği kutlu gecedir.' },
  { id: '2027_berat', name: 'Berat Kandili', date: '2027-02-20', gregorianYear: 2027, type: 'kandil', description: 'Günahların affedildiği, rızıkların ve kaderin yazıldığı berat ve kurtuluş gecesidir.' },
  { id: '2027_ramazan_is', name: 'Ramazan Başlangıcı', date: '2027-03-09', gregorianYear: 2027, type: 'yilbasi', description: 'Ramazan-ı Şerif ayının ilk oruç günüdür.' },
  { id: '2027_kadir', name: 'Kadir Gecesi', date: '2027-04-04', gregorianYear: 2027, type: 'kandil', description: 'Kur\'an-ı Kerim\'in indirilmeye başlandığı, bin aydan hayırlı olan mübarek gecedir.' },
  { id: '2027_ram_arefe', name: 'Ramazan Bayramı Arefesi', date: '2027-04-07', gregorianYear: 2027, type: 'mubarek_gundur', description: 'Bayram öncesindeki son hazırlık ve dua günüdür.' },
  { id: '2027_ram_bayram1', name: 'Ramazan Bayramı (1. Gün)', date: '2027-04-08', gregorianYear: 2027, type: 'bayram', description: 'Ramazan orucunun tamamlanmasıyla sevinç ve sıla-i rahim günüdür.' },
  { id: '2027_kur_arefe', name: 'Kurban Bayramı Arefesi', date: '2027-05-15', gregorianYear: 2027, type: 'mubarek_gundur', description: 'Hacıların Arafat\'ta vakfeye durduğu en değerli dua günlerindendir.' },
  { id: '2027_kur_bayram1', name: 'Kurban Bayramı (1. Gün)', date: '2027-05-16', gregorianYear: 2027, type: 'bayram', description: 'Allah\'a yakınlaşma amacıyla kurban ibadetinin eda edildiği bayram günüdür.' },
  { id: '2027_hicri_yil', name: 'Hicri Yılbaşı', date: '2027-06-06', gregorianYear: 2027, type: 'yilbasi', description: 'Peygamber Efendimizin Mekke\'den Medine\'ye hicretini esas alan yeni Hicri yılın (1449) başlangıcıdır.' },
  { id: '2027_asure', name: 'Aşure Günü', date: '2027-06-15', gregorianYear: 2027, type: 'mubarek_gundur', description: 'Muharrem ayının onuncu günüdür. Pek çok mucizenin gerçekleştiği, ikram günüdür.' },
  { id: '2027_mevlid', name: 'Mevlid Kandili', date: '2027-08-15', gregorianYear: 2027, type: 'kandil', description: 'Peygamber Efendimiz Hz. Muhammed\'in (s.a.v) dünyaya teşrif ettiği veladet gecesidir.' },

  // 2028
  { id: '2028_regaib', name: 'Regaib Kandili', date: '2028-01-06', gregorianYear: 2028, type: 'kandil', description: 'Şaban ayının ilk perşembe gecesidir. Rahmet ve bereket gecesidir.' },
  { id: '2028_mirac', name: 'Miraç Kandili', date: '2028-01-23', gregorianYear: 2028, type: 'kandil', description: 'Peygamber Efendimizin (s.a.v) göğe yükseldiği, namazın müjdelendiği kutlu gecedir.' },
  { id: '2028_berat', name: 'Berat Kandili', date: '2028-02-11', gregorianYear: 2028, type: 'kandil', description: 'Günahların affedildiği, rızıkların ve kaderin yazıldığı berat ve kurtuluş gecesidir.' },
  { id: '2028_ramazan_is', name: 'Ramazan Başlangıcı', date: '2028-02-26', gregorianYear: 2028, type: 'yilbasi', description: 'Ramazan-ı Şerif ayının ilk oruç günüdür.' },
  { id: '2028_kadir', name: 'Kadir Gecesi', date: '2028-03-22', gregorianYear: 2028, type: 'kandil', description: 'Kur\'an-ı Kerim\'in indirilmeye başlandığı, bin aydan hayırlı olan mübarek gecedir.' },
  { id: '2028_ram_arefe', name: 'Ramazan Bayramı Arefesi', date: '2028-03-25', gregorianYear: 2028, type: 'mubarek_gundur', description: 'Bayram öncesindeki son hazırlık ve dua günüdür.' },
  { id: '2028_ram_bayram1', name: 'Ramazan Bayramı (1. Gün)', date: '2028-03-26', gregorianYear: 2028, type: 'bayram', description: 'Ramazan orucunun tamamlanmasıyla sevinç ve sıla-i rahim günüdür.' },
  { id: '2028_kur_arefe', name: 'Kurban Bayramı Arefesi', date: '2028-05-03', gregorianYear: 2028, type: 'mubarek_gundur', description: 'Hacıların Arafat\'ta vakfeye durduğu en değerli dua günlerindendir.' },
  { id: '2028_kur_bayram1', name: 'Kurban Bayramı (1. Gün)', date: '2028-05-04', gregorianYear: 2028, type: 'bayram', description: 'Allah\'a yakınlaşma amacıyla kurban ibadetinin eda edildiği bayram günüdür.' },
  { id: '2028_hicri_yil', name: 'Hicri Yılbaşı', date: '2028-05-25', gregorianYear: 2028, type: 'yilbasi', description: 'Peygamber Efendimizin Mekke\'den Medine\'ye hicretini esas alan yeni Hicri yılın (1450) başlangıcıdır.' },
  { id: '2028_asure', name: 'Aşure Günü', date: '2028-06-03', gregorianYear: 2028, type: 'mubarek_gundur', description: 'Muharrem ayının onuncu günüdür. Pek çok mucizenin gerçekleştiği, ikram günüdür.' },
  { id: '2028_mevlid', name: 'Mevlid Kandili', date: '2028-08-03', gregorianYear: 2028, type: 'kandil', description: 'Peygamber Efendimiz Hz. Muhammed\'in (s.a.v) dünyaya teşrif ettiği veladet gecesidir.' },
];

// Returns all Islamic days for a specific year, with computed Hijri formatted dates
export function getSpecialDaysForYear(year: number, adjustmentDays: number = 0): IslamicDay[] {
  const filtered = SPECIAL_DAYS_DATABASE.filter(d => d.gregorianYear === year);
  
  return filtered.map(item => {
    // Determine the exact Hijri date for that Gregorian date automatically
    const parts = item.date.split('-');
    const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const formattedHijri = formatHijriDate(dateObj, adjustmentDays);
    
    return {
      ...item,
      hijriDate: formattedHijri
    };
  });
}

// Check if a specific date is a Special Islamic Day
export function getSpecialDayInfo(gregorianDate: Date, adjustmentDays: number = 0): IslamicDay | undefined {
  const dateStr = gregorianDate.toISOString().split('T')[0];
  const item = SPECIAL_DAYS_DATABASE.find(d => d.date === dateStr);
  if (!item) return undefined;
  
  const formattedHijri = formatHijriDate(gregorianDate, adjustmentDays);
  return {
    ...item,
    hijriDate: formattedHijri
  };
}
