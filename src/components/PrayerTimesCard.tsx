import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, MapPin, Search, Navigation, Volume2, VolumeX, ShieldAlert, Sparkles } from 'lucide-react';
import { City, PrayerTimes } from '../types';
import { CITIES, getPrayerTimes, calculateLocalPrayerTimes } from '../utils/prayerCalc';
import { formatHijriDate } from '../utils/calendarHelper';
import { audioSynth } from '../utils/audioSynth';

export default function PrayerTimesCard() {
  const [selectedCity, setSelectedCity] = useState<City>(CITIES[0]); // Default to Istanbul
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Realtime clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Searching details
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [hicriDateStr, setHicriDateStr] = useState<string>('');
  const [audioAlerts, setAudioAlerts] = useState<boolean>(true);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync Hijri and real date
  useEffect(() => {
    const savedCity = localStorage.getItem('huzur_current_city');
    if (savedCity) {
      try {
        const parsed = JSON.parse(savedCity);
        const exists = CITIES.find(c => c.id === parsed.id);
        if (exists) setSelectedCity(exists);
        else setSelectedCity(parsed);
      } catch (e) {
        // Fallback standard
      }
    }

    const savedAlerts = localStorage.getItem('huzur_audio_alerts');
    if (savedAlerts !== null) {
      setAudioAlerts(savedAlerts === 'true');
    }

    // Tick clock every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch times whenever city or date calendar year changes
  useEffect(() => {
    let active = true;

    async function loadTimes() {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const fetched = await getPrayerTimes(currentTime, selectedCity);
        if (active) {
          setTimes(fetched);
          setIsLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setErrorMsg('Vakitler yüklenemedi. Yerel hesaplama yapılıyor.');
          const calculated = calculateLocalPrayerTimes(currentTime, selectedCity.lat, selectedCity.lng);
          setTimes(calculated);
          setIsLoading(false);
        }
      }
    }

    loadTimes();

    // Compute Hijri representation
    const savedAdj = localStorage.getItem('huzur_hicri_adjustment');
    const adj = savedAdj ? Number(savedAdj) : 0;
    setHicriDateStr(formatHijriDate(currentTime, adj));

    return () => {
      active = false;
    };
  }, [selectedCity, currentTime.toDateString()]);

  // Handle local adjustment notification listen to reload Hijri Date representation
  useEffect(() => {
    const handleAdjusted = () => {
      const savedAdj = localStorage.getItem('huzur_hicri_adjustment');
      const adj = savedAdj ? Number(savedAdj) : 0;
      setHicriDateStr(formatHijriDate(currentTime, adj));
    };
    window.addEventListener('hicri_adjusted', handleAdjusted);
    return () => window.removeEventListener('hicri_adjusted', handleAdjusted);
  }, [currentTime]);

  // Dropdown click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectCity = (city: City) => {
    setSelectedCity(city);
    localStorage.setItem('huzur_current_city', JSON.stringify(city));
    setShowDropdown(false);
    setSearchQuery('');
  };

  // Attempt Geolocation coordinates
  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Sisteminizde konum servisi desteklenmiyor.');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const geoCity: City = {
          id: 'geolocation',
          name: 'Mevcut Konumum',
          country: 'Otomatik GPS',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timezone: 'Auto'
        };
        selectCity(geoCity);
      },
      (err) => {
        console.error(err);
        setIsLoading(false);
        alert('Konumunuz belirlenemedi. Lütfen listeden bir şehir seçin.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Toggle alarm alert preferences
  const toggleAlerts = () => {
    const nextState = !audioAlerts;
    setAudioAlerts(nextState);
    localStorage.setItem('huzur_audio_alerts', String(nextState));
    audioSynth.playClick();
  };

  // Time calculations (HH:MM string handling)
  const timeToMinutes = (tStr: string): number => {
    if (!tStr || tStr === '--:--') return 0;
    const parts = tStr.split(':');
    return Number(parts[0]) * 60 + Number(parts[1]);
  };

  // Compute active vakit intervals & remaining times
  // 6 Primary points: Imsak, Gunes, Ogle, Ikindi, Aksam, Yatsi
  const getVakitState = () => {
    if (!times) return null;

    const items = [
      { key: 'Imsak', label: 'İmsak (Sabah)', icon: '🌙' },
      { key: 'Gunes', label: 'Güneş (Kerahat)', icon: '🌅' },
      { key: 'Ogle', label: 'Öğle', icon: '☀️' },
      { key: 'Ikindi', label: 'İkindi', icon: '🌤️' },
      { key: 'Aksam', label: 'Akşam (İftar)', icon: '🌇' },
      { key: 'Yatsi', label: 'Yatsı', icon: '🌌' }
    ];

    const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
    const nowSec = currentTime.getSeconds();
    const totalNowSec = nowMin * 60 + nowSec;

    // Convert keys to seconds of day
    const timesSec: Record<string, number> = {};
    items.forEach(item => {
      timesSec[item.key] = timeToMinutes(times[item.key]) * 60;
    });

    let activeKey = 'Yatsi';
    let nextKey = 'Imsak';
    let nextLabel = 'İmsak (Sabah)';
    let remainingSeconds = 0;
    let totalDurationSeconds = 1; // avoid divide by zero

    // Range checks
    if (totalNowSec >= timesSec.Imsak && totalNowSec < timesSec.Gunes) {
      activeKey = 'Imsak';
      nextKey = 'Gunes';
      nextLabel = 'Güneş';
      remainingSeconds = timesSec.Gunes - totalNowSec;
      totalDurationSeconds = timesSec.Gunes - timesSec.Imsak;
    } else if (totalNowSec >= timesSec.Gunes && totalNowSec < timesSec.Ogle) {
      activeKey = 'Gunes';
      nextKey = 'Ogle';
      nextLabel = 'Öğle';
      remainingSeconds = timesSec.Ogle - totalNowSec;
      totalDurationSeconds = timesSec.Ogle - timesSec.Gunes;
    } else if (totalNowSec >= timesSec.Ogle && totalNowSec < timesSec.Ikindi) {
      activeKey = 'Ogle';
      nextKey = 'Ikindi';
      nextLabel = 'İkindi';
      remainingSeconds = timesSec.Ikindi - totalNowSec;
      totalDurationSeconds = timesSec.Ikindi - timesSec.Ogle;
    } else if (totalNowSec >= timesSec.Ikindi && totalNowSec < timesSec.Aksam) {
      activeKey = 'Ikindi';
      nextKey = 'Aksam';
      nextLabel = 'Akşam (İftar)';
      remainingSeconds = timesSec.Aksam - totalNowSec;
      totalDurationSeconds = timesSec.Aksam - timesSec.Ikindi;
    } else if (totalNowSec >= timesSec.Aksam && totalNowSec < timesSec.Yatsi) {
      activeKey = 'Aksam';
      nextKey = 'Yatsi';
      nextLabel = 'Yatsı';
      remainingSeconds = timesSec.Yatsi - totalNowSec;
      totalDurationSeconds = timesSec.Yatsi - timesSec.Aksam;
    } else {
      // Yatsi to tomorrow's imsak
      activeKey = 'Yatsi';
      nextKey = 'Imsak';
      nextLabel = 'İmsak';
      
      const secondsInDay = 24 * 60 * 60;
      if (totalNowSec >= timesSec.Yatsi) {
        // Past yatsı of tonight
        remainingSeconds = (secondsInDay - totalNowSec) + timesSec.Imsak;
        totalDurationSeconds = (secondsInDay - timesSec.Yatsi) + timesSec.Imsak;
      } else {
        // After midnight, but before Fajr/Imsak
        remainingSeconds = timesSec.Imsak - totalNowSec;
        totalDurationSeconds = (secondsInDay - timesSec.Yatsi) + timesSec.Imsak;
      }
    }

    // Trigger in-app audio chime if exactly when a prayer hits 0 seconds
    if (remainingSeconds === 0 && audioAlerts) {
      audioSynth.playChime();
      alert(`Vakit tamam! Mübarek ${nextLabel} namazı vakti girdi.`);
    }

    const elapsedSeconds = totalDurationSeconds - remainingSeconds;
    const progressPercent = Math.min((elapsedSeconds / totalDurationSeconds) * 100, 100);

    // Format remaining to string
    const h = Math.floor(remainingSeconds / 3600);
    const m = Math.floor((remainingSeconds % 3600) / 60);
    const s = remainingSeconds % 60;

    const formattedRemaining = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    return {
      activeKey,
      nextKey,
      nextLabel,
      formattedRemaining,
      progressPercent,
      hours: h,
      minutes: m
    };
  };

  const currentVakitDetail = getVakitState();
  const searchFilterCities = CITIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 border border-white/10 shadow-xl shadow-black/25 relative overflow-hidden" id="prayer-times-widget-wrapper">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left section: Countdown & Selector */}
        <div className="w-full md:w-5/12 flex flex-col justify-between" id="city-selector-zone">
          <div className="space-y-6">
            
            {/* Header dates display */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 tracking-wider uppercase block">Namaz Vakitleri</span>
                <span className="text-sm font-semibold text-slate-400 font-mono block mt-1">{hicriDateStr || '...'}</span>
              </div>
              
              {/* Voice buzzer Alert controller */}
              <button
                onClick={toggleAlerts}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  audioAlerts
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
                title={audioAlerts ? 'Sesli Uyarıları Kapat' : 'Sesli Uyarıları Aç'}
              >
                {audioAlerts ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
              </button>
            </div>

            {/* City Lookup Autocomplete Selector */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder={`${selectedCity.name}, ${selectedCity.country}`}
                    value={searchQuery}
                    onFocus={() => setShowDropdown(true)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-sm pl-10 pr-4 py-3 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/5 text-white placeholder-slate-500"
                  />
                </div>
                
                {/* Geolocation Button */}
                <button
                  onClick={handleGeolocation}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all cursor-pointer shadow-sm text-slate-300 hover:text-white"
                  title="Konum belirle"
                >
                  <Navigation className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Instant Search Dropdown List */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 right-0 mt-1.5 bg-slate-950 border border-white/10 rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto"
                  >
                    {searchFilterCities.length === 0 ? (
                      <div className="p-4 text-xs text-slate-500 text-center">Şehir bulunamadı</div>
                    ) : (
                      searchFilterCities.map(c => (
                        <div
                          key={c.id}
                          onClick={() => selectCity(c)}
                          className="px-4 py-3 text-sm text-slate-200 hover:bg-white/5 hover:text-white cursor-pointer flex items-center justify-between border-b border-white/5 last:border-0"
                        >
                          <span className="font-semibold">{c.name}</span>
                          <span className="text-xs text-slate-500 font-mono">{c.country}</span>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Micro Timer Widget for active prayer */}
            {currentVakitDetail && (
              <div className="bg-gradient-to-br from-indigo-950/20 to-black/40 rounded-3xl p-5 border border-white/10 relative overflow-hidden" id="countdown-banner">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Sıradaki Vakit
                </span>
                
                <h4 className="font-serif text-lg font-light text-slate-200">
                  <span className="font-serif italic font-light text-amber-200">{currentVakitDetail.nextLabel}</span> Vaktine
                </h4>

                {/* Display clock timer */}
                <div className="text-4xl font-mono font-medium text-amber-400 tracking-tight my-4">
                  {currentVakitDetail.formattedRemaining}
                </div>

                {/* Linear progress metric bar */}
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-1">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    style={{ width: `${currentVakitDetail.progressPercent}%` }}
                  />
                </div>
                
                <span className="text-[10px] font-medium text-slate-450 block text-right">
                  Mevcut vaktin %{Math.round(currentVakitDetail.progressPercent)}'i tamamlandı
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
            <MapPin className="w-4 h-4 text-amber-500" />
            <span className="uppercase tracking-wider">HESAPLAMA: Türkiye Diyanet İşleri Başk.</span>
          </div>
        </div>

        {/* Right section: Timetable Grid highlight */}
        <div className="flex-1" id="timetable-display-grid">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent" />
              <p className="text-xs font-semibold text-slate-400 mt-2">Vakitler yükleniyor...</p>
            </div>
          ) : times ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'Imsak', name: 'İmsak', description: 'Oruç başlangıcı, sabah namazı', icon: '✨' },
                { key: 'Gunes', name: 'Güneş', description: 'Güneşin doğuşu, kerahat vakti', icon: '🌅' },
                { key: 'Ogle', name: 'Öğle', description: 'Zeval vakti, öğle namazı', icon: '☀️' },
                { key: 'Ikindi', name: 'İkindi', description: 'Gölgenin uzama vakti, ikindi namazı', icon: '🌤️' },
                { key: 'Aksam', name: 'Akşam', description: 'İftar, güneş batışı, akşam namazı', icon: '🌇' },
                { key: 'Yatsi', name: 'Yatsı', description: 'Gecenin karanlığı, yatsı namazı', icon: '🌌' }
              ].map(item => {
                const isSelected = currentVakitDetail?.activeKey === item.key;
                return (
                  <motion.div
                    key={item.key}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500 text-black shadow-[0_0_25px_rgba(245,158,11,0.2)] border-amber-400 font-semibold'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl select-none">{item.icon}</span>
                      <div className="min-w-0">
                        <span className={`text-sm font-bold block ${isSelected ? 'text-black' : 'text-slate-200'}`}>
                          {item.name}
                        </span>
                        <span className={`text-[10px] truncate block mt-0.5 font-medium ${isSelected ? 'text-amber-950 font-medium' : 'text-slate-450'}`}>
                          {item.description}
                        </span>
                      </div>
                    </div>
                    
                    <span className={`text-lg font-mono font-bold tracking-tight rounded-xl px-2.5 py-1 ${
                      isSelected
                        ? 'text-black bg-amber-250 font-bold'
                        : 'text-slate-200 bg-white/5 border border-white/5'
                    }`}>
                      {times[item.key] || '--:--'}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full py-12 text-center text-red-400">
              <ShieldAlert className="w-8 h-8 text-red-400 block mx-auto mb-2" />
              <span className="text-xs font-semibold">Bir veri hatası oluştu. Lütfen sayfayı yenileyiniz.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
