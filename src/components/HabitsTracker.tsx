import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Square, RefreshCw, Flame, Award, Plus, Minus, ThumbsUp, CalendarOff } from 'lucide-react';
import { SpiritualHabit } from '../types';

const INITIAL_HABITS: SpiritualHabit[] = [
  { id: 'h_sabah', title: 'Sabah Namazı', description: 'Günün ilk bereketi, 2 sünnet 2 farz.', category: 'namaz', isFard: true, streak: 0, completedDates: [] },
  { id: 'h_ogle', title: 'Öğle Namazı', description: 'Günün yoğunluğunda huzur duruşu, 4 ilk sünnet 4 farz 2 son sünnet.', category: 'namaz', isFard: true, streak: 0, completedDates: [] },
  { id: 'h_ikindi', title: 'İkindi Namazı', description: 'İkindi serinliğinde ibadet sıhhati, 4 sünnet 4 farz.', category: 'namaz', isFard: true, streak: 0, completedDates: [] },
  { id: 'h_aksam', title: 'Akşam Namazı', description: 'Günün hitamında teslimiyet, 3 farz 2 sünnet.', category: 'namaz', isFard: true, streak: 0, completedDates: [] },
  { id: 'h_yatsi', title: 'Yatsı Namazı & Vitir', description: 'Gecenin huzurlu kapanışı, 4 ilk sünnet 4 farz 2 son sünnet 3 vitir.', category: 'namaz', isFard: true, streak: 0, completedDates: [] },
  { id: 'h_kuran', title: 'Kur\'an-ı Kerim Okuma', description: 'En az bir sayfa veya meal okumak.', category: 'kuran', isFard: false, streak: 0, completedDates: [] },
  { id: 'h_zikir', title: 'Günlük Tasbihat & Dhikr', description: 'Zikirmatik veya tesbih ile günlük zikir hedefini tamamlamak.', category: 'zikir', isFard: false, streak: 0, completedDates: [] },
  { id: 'h_sadaka', title: 'Günün İyiliği (Sadaka / Tebessüm)', description: 'Maddi veya manevi olarak bir ihtiyaç sahibini sevindirmek.', category: 'diger', isFard: false, streak: 0, completedDates: [] }
];

interface KazaCounters {
  sabah: number;
  ogle: number;
  ikindi: number;
  aksam: number;
  yatsi: number;
  vitir: number;
}

const INITIAL_KAZA: KazaCounters = {
  sabah: 0,
  ogle: 0,
  ikindi: 0,
  aksam: 0,
  yatsi: 0,
  vitir: 0
};

export default function HabitsTracker() {
  const [activeTab, setActiveTab] = useState<'daily' | 'kaza'>('daily');
  const [habits, setHabits] = useState<SpiritualHabit[]>([]);
  const [kaza, setKaza] = useState<KazaCounters>(INITIAL_KAZA);
  const [todayStr, setTodayStr] = useState<string>('');

  useEffect(() => {
    // Sync current date in Turkey timezone format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    setTodayStr(today);

    // Load habits from localStorage
    const savedHabits = localStorage.getItem('huzur_spiritual_habits');
    if (savedHabits) {
      try {
        setHabits(JSON.parse(savedHabits));
      } catch (e) {
        setHabits(INITIAL_HABITS);
      }
    } else {
      setHabits(INITIAL_HABITS);
      localStorage.setItem('huzur_spiritual_habits', JSON.stringify(INITIAL_HABITS));
    }

    // Load kaza counters
    const savedKaza = localStorage.getItem('huzur_kaza_counters');
    if (savedKaza) {
      try {
        setKaza(JSON.parse(savedKaza));
      } catch (e) {
        setKaza(INITIAL_KAZA);
      }
    }

    // Event listener to react when zikirmatik increments state
    const handleLocalUpdate = () => {
      const reloaded = localStorage.getItem('huzur_spiritual_habits');
      if (reloaded) {
        setHabits(JSON.parse(reloaded));
      }
    };
    window.addEventListener('habits_updated', handleLocalUpdate);
    return () => window.removeEventListener('habits_updated', handleLocalUpdate);
  }, []);

  const handleToggleHabit = (id: string) => {
    // Check if finished
    const updated = habits.map(h => {
      if (h.id === id) {
        const completed = h.completedDates.includes(todayStr);
        let nextCompletedDates = [...h.completedDates];
        let nextStreak = h.streak;

        if (completed) {
          // Uncheck
          nextCompletedDates = nextCompletedDates.filter(d => d !== todayStr);
          nextStreak = Math.max(0, nextStreak - 1);
        } else {
          // Check
          nextCompletedDates.push(todayStr);
          nextStreak += 1;
        }

        return {
          ...h,
          streak: nextStreak,
          completedDates: nextCompletedDates
        };
      }
      return h;
    });

    setHabits(updated);
    localStorage.setItem('huzur_spiritual_habits', JSON.stringify(updated));
  };

  const handleResetDaily = () => {
    const confirmReset = window.confirm('Bugünün tüm ibadet işaretlemelerini sıfırlamak istiyor musunuz? (Zinciriniz etkilenmez)');
    if (!confirmReset) return;

    const updated = habits.map(h => {
      return {
        ...h,
        completedDates: h.completedDates.filter(d => d !== todayStr)
      };
    });

    setHabits(updated);
    localStorage.setItem('huzur_spiritual_habits', JSON.stringify(updated));
  };

  // Kaza namazi handles
  const updateKaza = (prayer: keyof KazaCounters, amount: number) => {
    const nextVal = Math.max(0, kaza[prayer] + amount);
    const updated = {
      ...kaza,
      [prayer]: nextVal
    };
    setKaza(updated);
    localStorage.setItem('huzur_kaza_counters', JSON.stringify(updated));
  };

  // Calculations for daily metrics
  const completedTodayCount = habits.filter(h => h.completedDates.includes(todayStr)).length;
  const ratioToday = habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0;
  
  // Calculate average streak
  const maxStreak = habits.reduce((max, h) => (h.streak > max ? h.streak : max), 0);

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 border border-white/10 shadow-xl shadow-black/25" id="habits-tracker-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
        <div>
          <h3 className="font-serif text-2xl font-semibold text-white" id="habits-card-title">Kişisel İbadet Defterim</h3>
          <p className="text-sm text-slate-400 mt-1">Günlük ibadetlerinizin takibini yaparak manevi istikrarınızı koruyun.</p>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 w-fit">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 font-medium text-xs rounded-xl transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-amber-500 text-black shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Günlük Çetele
          </button>
          <button
            onClick={() => setActiveTab('kaza')}
            className={`px-4 py-2 font-medium text-xs rounded-xl transition-all cursor-pointer ${
              activeTab === 'kaza'
                ? 'bg-amber-500 text-black shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Kaza Defteri
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'daily' ? (
          <motion.div
            key="daily-tracker"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Real-time statistics bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="daily-habits-stats-grid">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
                <div className="bg-amber-500 text-black p-2.5 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Bugünkü Oran</span>
                  <span className="text-xl font-bold font-mono text-amber-200">% {ratioToday}</span>
                </div>
              </div>

              <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-4">
                <div className="bg-amber-500 text-black p-2.5 rounded-xl">
                  <Flame className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">En Yüksek Zincir</span>
                  <span className="text-xl font-bold font-mono text-amber-200">{maxStreak} Gün</span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                <div className="bg-slate-850 text-white p-2.5 rounded-xl border border-white/10">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Kazanılan Sevaplar</span>
                  <span className="text-sm font-medium text-slate-300">İhlaslı niyetlerle devam...</span>
                </div>
              </div>
            </div>

            {/* List checklist of habits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="habits-checklist-box">
              {habits.map(h => {
                const completed = h.completedDates.includes(todayStr);
                return (
                  <div
                    key={h.id}
                    onClick={() => handleToggleHabit(h.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                      completed
                        ? 'bg-amber-500/15 border-amber-500/25 shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <button className="mt-1 flex-shrink-0 text-amber-500 outline-none">
                      {completed ? (
                        <CheckSquare className="w-5.5 h-5.5 stroke-[2] text-amber-450" />
                      ) : (
                        <Square className="w-5.5 h-5.5 text-slate-600 stroke-[2] hover:text-slate-550" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-sm font-semibold truncate ${completed ? 'text-amber-200 line-through opacity-70' : 'text-slate-100'}`}>
                          {h.title}
                        </span>
                        {h.isFard && (
                          <span className="text-[9px] bg-red-950/40 text-red-400 border border-red-500/20 font-bold font-sans uppercase px-1 rounded">Farz</span>
                        )}
                        {h.streak > 0 && (
                          <span className="text-[9px] bg-amber-950/40 text-amber-300 border border-amber-500/15 font-bold px-1 rounded flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> +{h.streak}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {h.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleResetDaily}
                disabled={completedTodayCount === 0}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 font-medium px-3.5 py-2 rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Bugünü Temizle
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="kaza-tracker"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 mb-4 flex items-start gap-3">
              <div className="text-amber-400 font-bold mt-0.5">💡</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>Kaza Namazı Bilgisi:</strong> Geçmişte kılamadığınız farz namazları kaza etmek dinimizce bir vecibedir. 
                Her kaza kıldığınızda, aşağıdaki eksi (-) tuşunu kullanarak sayacı azaltın. Eksik her kaza için artı (+) tuşunu kullanabilirsiniz.
              </p>
            </div>

            {/* Kaza table format */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" id="kaza-counters-grid">
              {(Object.keys(kaza) as Array<keyof KazaCounters>).map(prayer => {
                const labelMap: Record<keyof KazaCounters, string> = {
                  sabah: 'Sabah (Farz)',
                  ogle: 'Öğle (Farz)',
                  ikindi: 'İkindi (Farz)',
                  aksam: 'Akşam (Farz)',
                  yatsi: 'Yatsı (Farz)',
                  vitir: 'Vitir (Vacip)'
                };

                const amount = kaza[prayer];

                return (
                  <div key={prayer} className="bg-white/5 border border-white/5 hover:border-white/10 p-4 rounded-2xl flex flex-col items-center justify-between transition-all">
                    <span className="text-xs font-semibold text-slate-400 mb-2">{labelMap[prayer]}</span>
                    
                    {/* Counter value */}
                    <span className="text-3xl font-mono font-bold text-amber-200 my-2">{amount}</span>

                    {/* Plus/minus buttons */}
                    <div className="flex items-center gap-1.5 w-full mt-2">
                      <button
                        onClick={() => updateKaza(prayer, -1)}
                        disabled={amount === 0}
                        className="flex-1 flex items-center justify-center py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 disabled:opacity-20 disabled:hover:bg-white/5 transition-all cursor-pointer"
                        title="-1 Kaza Namazı Kılındı"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => updateKaza(prayer, 1)}
                        className="flex-1 flex items-center justify-center py-2 bg-amber-500 hover:bg-amber-500/90 text-black font-semibold rounded-xl transition-all cursor-pointer"
                        title="+1 Kaza Borcu Ekle"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex gap-1 w-full mt-1.5">
                      <button
                        onClick={() => updateKaza(prayer, -5)}
                        disabled={amount < 5}
                        className="flex-1 text-[9px] font-bold py-1 bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10 rounded-lg disabled:opacity-10 transition-all cursor-pointer"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => updateKaza(prayer, 5)}
                        className="flex-1 text-[9px] font-bold py-1 bg-white/10 hover:bg-white/15 text-slate-300 border border-white/10 rounded-lg transition-all cursor-pointer"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Quick motivative badge */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-3">
              <ThumbsUp className="w-5 h-5 text-amber-400" />
              <p className="text-xs text-slate-400 leading-normal">
                Niyet ve azimle tamamlanan her kaza borcu, amel defterimize hafiflik ve Allah katında sebat kazandıracaktır. Dualarımız sizinle!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
