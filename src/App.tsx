import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Calendar, HelpCircle, Sparkles, CheckSquare, Layers, Moon } from 'lucide-react';

// Subcomponents
import PrayerTimesCard from './components/PrayerTimesCard';
import CalendarView from './components/CalendarView';
import IslamicDaysList from './components/IslamicDaysList';
import HabitsTracker from './components/HabitsTracker';
import Zikirmatik from './components/Zikirmatik';

interface Quote {
  source: string;
  text: string;
  type: 'Ayet-i Kerime' | 'Hadis-i Şerif' | 'Manevi Söz';
}

const QUOTES: Quote[] = [
  { type: 'Ayet-i Kerime', text: 'Şüphesiz namaz, müminler üzerine vakitleri belirlenmiş bir farzdır.', source: 'Nisâ Suresi, 103' },
  { type: 'Hadis-i Şerif', text: 'Amellerin Allah’a en sevimli olanı, vaktinde kılınan namazdır.', source: 'Buhârî, Mevâkît, 5' },
  { type: 'Ayet-i Kerime', text: 'Bilesiniz ki, kalpler ancak Allah’ı anmakla (zikirle) huzur bulur.', source: 'Ra’d Suresi, 28' },
  { type: 'Hadis-i Şerif', text: 'Kulun Rabbine en yakın olduğu an, secde anıdır. Secdede duayı çokça yapın.', source: 'Müslim, Salât, 215' },
  { type: 'Ayet-i Kerime', text: 'Siz beni anın ki, ben de sizi anayım. Bana şükredin, nankörlük etmeyin.', source: 'Bakara Suresi, 152' },
  { type: 'Hadis-i Şerif', text: 'Sizin en hayırlınız, Kur’an-ı Kerim’i öğrenen ve öğreteninizdir.', source: 'Buhârî, Fezâilü’l-Kur’an, 21' },
  { type: 'Manevi Söz', text: 'Namaz dinin direğidir, zikir ise kalbin cilasıdır.', source: 'İslam Büyükleri' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'habits' | 'zikir' | 'calendar' | 'special-days'>('habits');
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    // Dynamically cycle the spiritual quotes every 15 seconds
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 15000);

    // Live clock on header
    const clockInterval = setInterval(() => {
      const istanbulTime = new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setTimeStr(istanbulTime);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  const currentQuote = QUOTES[quoteIndex];

  return (
    <div className="min-h-screen bg-[#050B18] text-slate-100 font-sans selection:bg-amber-500/30 selection:text-amber-200 pb-12 relative overflow-hidden" id="app-root">
      
      {/* Atmospheric Background Glows */}
      <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] bg-blue-950/40 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-5%] right-[-10%] w-[500px] h-[500px] bg-amber-950/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-indigo-950/20 rounded-full blur-[110px] pointer-events-none"></div>

      {/* Top Banner and Navigation Bar */}
      <header className="border-b border-white/10 bg-[#050B18]/60 backdrop-blur-xl sticky top-0 z-50 transition-all shadow-md shadow-black/15" id="sticky-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-black font-serif font-bold text-lg shadow-[0_0_25px_rgba(245,158,11,0.25)]">
              M
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold tracking-tight text-white leading-none">Huzur</h1>
              <span className="text-[10px] font-semibold text-amber-400 tracking-wider uppercase block mt-1">Nefes, İbadet ve Takip</span>
            </div>
          </div>

          {/* Desktop Ticking Clock Badge */}
          <div className="flex items-center gap-1.5 bg-white/5 px-3.5 py-1.5 rounded-xl border border-white/10">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
            <span className="text-xs font-mono font-bold text-slate-300 tracking-wide min-w-[70px] text-center">
              {timeStr || '--:--:--'}
            </span>
          </div>

        </div>
      </header>

      {/* Main Container Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 relative z-10" id="primary-layout-container">
        
        {/* Dynamic Spiritual Affirmation Panel (Quote of the day) */}
        <div className="mb-6 sm:mb-8" id="quote-marquee-wrapper">
          <div className="bg-gradient-to-br from-slate-900/50 to-black/40 border border-white/10 text-slate-100 rounded-[2rem] p-5 sm:p-6 backdrop-blur-md relative overflow-hidden">
            
            {/* Absolute visual patterns in background */}
            <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 opacity-5 select-none">
              <span className="text-[140px] font-serif font-semibold">🕌</span>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                    {currentQuote.type}
                  </span>
                </div>
                
                <AnimatePresence mode="wait">
                  <motion.p
                    key={quoteIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="font-serif text-base sm:text-lg leading-relaxed italic text-amber-100 font-medium"
                  >
                    "{currentQuote.text}"
                  </motion.p>
                </AnimatePresence>
                
                <span className="text-xs text-slate-400 font-mono font-semibold block mt-1.5">
                  — {currentQuote.source}
                </span>
              </div>
              
              <button
                onClick={() => setQuoteIndex((prev) => (prev + 1) % QUOTES.length)}
                className="text-xs font-semibold px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-amber-200 rounded-xl transition-all self-start md:self-center cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                Sonraki Söz Getir ➔
              </button>
            </div>
          </div>
        </div>

        {/* Primary Dashboard layout: Right & Left Grid blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start" id="dashboard-grid">
          
          {/* Left Column: Fixed Prayer Times Widget */}
          <section className="lg:col-span-5 w-full" id="left-column-prayertimes">
            <PrayerTimesCard />
          </section>

          {/* Right Column: Tabbed Bento Panels */}
          <section className="lg:col-span-7 w-full space-y-6" id="right-column-tabbed-bento">
            
            {/* Navigative segmented segment bar */}
            <div className="bg-black/30 p-2 rounded-[2rem] border border-white/5 backdrop-blur-xl flex flex-wrap gap-1 shadow-md shadow-black/10" id="inner-navigation-tab-group">
              {[
                { id: 'habits', label: 'İbadet Çetelesi', icon: <CheckSquare className="w-4 h-4" /> },
                { id: 'zikir', label: 'Zikirmatik', icon: <Moon className="w-4 h-4 text-amber-400" /> },
                { id: 'calendar', label: 'Hicri Takvim', icon: <Calendar className="w-4 h-4" /> },
                { id: 'special-days', label: 'Dini Günler', icon: <BookOpen className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.25)] font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Display Zone */}
            <div className="w-full" id="tabbed-content">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  {activeTab === 'habits' && <HabitsTracker />}
                  {activeTab === 'zikir' && <Zikirmatik />}
                  {activeTab === 'calendar' && <CalendarView />}
                  {activeTab === 'special-days' && <IslamicDaysList />}
                </motion.div>
              </AnimatePresence>
            </div>

          </section>

        </div>
      </main>

      {/* Footer copyright section */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-6 border-t border-white/5 text-center relative z-10" id="global-footer">
        <p className="text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} İbadet ve Namaz Hatırlatıcı Rehberi. Hayırlara ve huzura vesile olması duasıyla.
        </p>
      </footer>

    </div>
  );
}
