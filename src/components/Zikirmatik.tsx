import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Volume2, VolumeX, Plus, Star, BookOpen, Check, Layers } from 'lucide-react';
import { Dhikr } from '../types';
import { audioSynth } from '../utils/audioSynth';

const DEFAULT_DHIKRS: Omit<Dhikr, 'count'>[] = [
  { id: 'subhanallah', arabic: 'سُبْحَانَ اللَّهِ', turkishName: 'Sübhanallah', meaning: 'Allah noksan sıfatlardan uzaktır, yücedir.', target: 33 },
  { id: 'alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', turkishName: 'Elhamdülillah', meaning: 'Hamd ve şükür yalnızca Allah\'adır.', target: 33 },
  { id: 'allahuekbar', arabic: 'اللَّهُ أَكْبَرُ', turkishName: 'Allahu Ekber', meaning: 'Allah en büyüktür, azamet sahibidir.', target: 33 },
  { id: 'lailaheillallah', arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ', turkishName: 'Lâ ilâhe illallah', meaning: 'Allah\'tan başka hiçbir ilah yoktur.', target: 100 },
  { id: 'estagfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', turkishName: 'Estağfirullah', meaning: 'Yüce Allah\'tan bağışlanma ve mağfiret dilerim.', target: 100 },
  { id: 'salavat', arabic: 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ', turkishName: 'Salavat-ı Şerife', meaning: 'Allah\'ım, Efendimiz Muhammed\'e rahmet ve selam eyle.', target: 100 }
];

export default function Zikirmatik() {
  const [dhikrList, setDhikrList] = useState<Dhikr[]>([]);
  const [activeDhikrId, setActiveDhikrId] = useState<string>('subhanallah');
  const [hasSound, setHasSound] = useState<boolean>(true);
  const [isCelebrated, setIsCelebrated] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customTarget, setCustomTarget] = useState<number>(33);
  const [customArabic, setCustomArabic] = useState<string>('');
  const [showAddCustom, setShowAddCustom] = useState<boolean>(false);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('huzur_zikirler');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setDhikrList(parsed);
          return;
        }
      } catch (e) {
        console.error('Dhikr load error:', e);
      }
    }
    
    // Set default list if empty
    const initial = DEFAULT_DHIKRS.map(d => ({ ...d, count: 0 }));
    setDhikrList(initial);
    localStorage.setItem('huzur_zikirler', JSON.stringify(initial));
  }, []);

  const saveDhikrs = (list: Dhikr[]) => {
    setDhikrList(list);
    localStorage.setItem('huzur_zikirler', JSON.stringify(list));
  };

  const activeDhikr = dhikrList.find(d => d.id === activeDhikrId) || {
    id: 'placeholder',
    turkishName: 'Zikir Seçilmedi',
    arabic: '',
    meaning: '',
    count: 0,
    target: 33
  };

  const handleIncrement = () => {
    if (hasSound) {
      audioSynth.playClick();
    }

    const updated = dhikrList.map(d => {
      if (d.id === activeDhikrId) {
        const newCount = d.count + 1;
        
        // Trigger target chime celebration exactly when target is completed
        if (d.target && newCount === d.target) {
          audioSynth.playChime();
          setIsCelebrated(true);
          setTimeout(() => setIsCelebrated(false), 2000);
          
          // Complete daily target tracker integration
          trackDhikrHabit();
        }
        
        return { ...d, count: newCount };
      }
      return d;
    });

    saveDhikrs(updated);
  };

  const trackDhikrHabit = () => {
    // This connects to the overarching Habits tracking module which we will create shortly
    const todayStr = new Date().toISOString().split('T')[0];
    const savedHabits = localStorage.getItem('huzur_spiritual_habits');
    if (savedHabits) {
      try {
        const habits = JSON.parse(savedHabits);
        const updatedHabits = habits.map((h: any) => {
          if (h.category === 'zikir') {
            if (!h.completedDates.includes(todayStr)) {
              return {
                ...h,
                streak: h.streak + 1,
                completedDates: [...h.completedDates, todayStr]
              };
            }
          }
          return h;
        });
        localStorage.setItem('huzur_spiritual_habits', JSON.stringify(updatedHabits));
        // dispatch custom event to notify Habits Tracker
        window.dispatchEvent(new Event('habits_updated'));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleReset = () => {
    const confirmReset = window.confirm('Bu zikrin sayacını sıfırlamak istediğinizden emin misiniz?');
    if (!confirmReset) return;

    const updated = dhikrList.map(d => {
      if (d.id === activeDhikrId) {
        return { ...d, count: 0 };
      }
      return d;
    });
    saveDhikrs(updated);
  };

  const handleAddDhikr = (e: FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newDhikr: Dhikr = {
      id: 'custom_' + Date.now(),
      turkishName: customName.trim(),
      arabic: customArabic.trim() || '◌',
      meaning: 'Sizin eklediğiniz özel zikir.',
      count: 0,
      target: customTarget > 0 ? customTarget : undefined
    };

    const updated = [...dhikrList, newDhikr];
    saveDhikrs(updated);
    setActiveDhikrId(newDhikr.id);
    setCustomName('');
    setCustomArabic('');
    setCustomTarget(33);
    setShowAddCustom(false);
  };

  const handleDeleteDhikr = (id: string, name: string) => {
    if (DEFAULT_DHIKRS.some(d => d.id === id)) {
      alert('Varsayılan dualar/zikirler silinemez.');
      return;
    }
    const confirmDelete = window.confirm(`"${name}" zikrini silmek istediğinize emin misiniz?`);
    if (!confirmDelete) return;

    const updated = dhikrList.filter(d => d.id !== id);
    saveDhikrs(updated);
    if (activeDhikrId === id) {
      setActiveDhikrId('subhanallah');
    }
  };

  // Progress percentage calculation
  const target = activeDhikr.target || 33;
  const progressPercent = Math.min((activeDhikr.count / target) * 100, 100);

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 border border-white/10 shadow-xl shadow-black/25 transition-all" id="zikirmatik-wrapper">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Side: Selecting Dhikr */}
        <div className="w-full md:w-5/12 flex flex-col justify-between" id="zikirmatik-control-panel">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif text-xl font-medium text-white" id="zikirmatik-menu-title">Zikir Seçimi</h3>
              </div>
              <button
                onClick={() => setShowAddCustom(!showAddCustom)}
                className="text-xs font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                id="btn-add-custom-zikir"
              >
                <Plus className="w-3.5 h-3.5" />
                Özel Ekle
              </button>
            </div>

            {/* Custom Add Form */}
            <AnimatePresence>
              {showAddCustom && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddDhikr}
                  className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-4 overflow-hidden"
                  id="form-add-custom-zikir"
                >
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Zikir Adı <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: Ya Şafi"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full text-sm p-2 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/5 text-white placeholder-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Arapçası (İsteğe bağlı)</label>
                      <input
                        type="text"
                        placeholder="Örn: يَا شَافِي"
                        value={customArabic}
                        onChange={(e) => setCustomArabic(e.target.value)}
                        className="w-full text-sm p-2 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/5 text-slate-300 text-right font-serif"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Hedef Sayı (İsteğe bağlı, varsayılan 33)</label>
                      <input
                        type="number"
                        min="1"
                        value={customTarget}
                        onChange={(e) => setCustomTarget(Number(e.target.value))}
                        className="w-full text-sm p-2 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/5 text-white"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 text-xs font-semibold py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl transition-all cursor-pointer text-center font-bold"
                      >
                        Kaydet
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddCustom(false)}
                        className="flex-1 text-xs font-medium py-2 bg-white/5 hover:bg-white/10 text-slate-350 rounded-xl transition-all cursor-pointer text-center"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Dhikr selection list */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {dhikrList.map(d => {
                const isSelected = d.id === activeDhikrId;
                const isDefault = DEFAULT_DHIKRS.some(df => df.id === d.id);
                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      setActiveDhikrId(d.id);
                      setIsCelebrated(false);
                    }}
                    className={`group w-full text-left p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/30 shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`font-semibold text-sm truncate ${isSelected ? 'text-amber-350 font-bold' : 'text-slate-200'}`}>
                          {d.turkishName}
                        </span>
                        {d.count >= (d.target || 33) && (
                          <span className="text-[10px] items-center bg-amber-500/10 text-amber-300 border border-amber-500/10 rounded px-1.5 font-bold flex gap-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[3]" /> Tamam
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span>Hedef: {d.target || 'Sınırsız'}</span>
                        <span>•</span>
                        <span>Sayılan: {d.count}</span>
                      </div>
                    </div>
                    
                    {!isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDhikr(d.id, d.turkishName);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/15 rounded-xl transition-all text-xs"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick info footer */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-slate-405 text-xs mb-1">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>Anlamı ve Fazileti</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic pr-2">
              "{activeDhikr.meaning}"
            </p>
          </div>
        </div>

        {/* Right Side: Clicker Interface */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950/15 to-black/30 rounded-3xl p-6 border border-white/10 relative overflow-hidden" id="zikirmatik-interactiv-zone">
          
          {/* Sounds and options absolute row */}
          <div className="absolute top-4 right-4 flex gap-1.5 z-10">
            <button
              onClick={() => {
                setHasSound(!hasSound);
                audioSynth.playClick();
              }}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                hasSound
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-300 hover:border-white/20'
              }`}
              title={hasSound ? 'Sesi Kapat' : 'Sesi Aç'}
            >
              {hasSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={handleReset}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20 shadow-sm transition-all cursor-pointer"
              title="Sayıyı Sıfırla"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center w-full max-w-sm mt-6">
            <span className="text-3xl font-serif text-amber-250 block text-center min-h-[44px] mb-1 font-semibold leading-relaxed" dir="rtl">
              {activeDhikr.arabic || '◌'}
            </span>
            <h4 className="text-xl font-serif font-semibold text-white tracking-tight mb-6">
              {activeDhikr.turkishName}
            </h4>

            {/* Circular active clicking container */}
            <div className="relative w-56 h-56 mx-auto flex items-center justify-center" id="counter-circle-box">
              
              {/* Pulsating Celebration Animation when reach target */}
              {isCelebrated && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1.4, opacity: 0 }}
                  transition={{ duration: 1, repeat: 1, ease: 'easeOut' }}
                  className="absolute inset-0 bg-amber-400 rounded-full z-0"
                />
              )}

              {/* Background ring */}
              <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Gray back circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-white/5 fill-transparent"
                  strokeWidth="4"
                />
                {/* Active progress circle */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-amber-500 fill-transparent"
                  strokeWidth="4.5"
                  strokeDasharray="276.4"
                  initial={{ strokeDashoffset: 276.4 }}
                  animate={{ strokeDashoffset: 276.4 - (276.4 * progressPercent) / 100 }}
                  transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                  strokeLinecap="round"
                />
              </svg>

              {/* Tappable core button */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={handleIncrement}
                className="w-44 h-44 rounded-full bg-gradient-to-br from-slate-900 to-slate-950 shadow-2xl border border-white/5 hover:border-white/10 flex flex-col items-center justify-center cursor-pointer relative z-10 group select-none active:outline-none"
                id="btn-zikir-counter"
              >
                <div className="text-xs font-bold font-mono tracking-widest text-slate-500 group-hover:text-slate-400 transition-colors uppercase mb-1">
                  ZİKİR
                </div>
                <span className="text-5xl font-mono font-bold tracking-tight text-white select-none">
                  {activeDhikr.count}
                </span>
                
                {activeDhikr.target && (
                  <div className="text-xs text-slate-450 font-medium font-mono mt-1.5">
                    / {activeDhikr.target}
                  </div>
                )}
              </motion.button>
            </div>

            {/* Instruction tooltip */}
            <p className="mt-8 text-xs text-slate-450/90 font-medium tracking-wide flex items-center justify-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-550/10 text-amber-500" />
              <span>Sayacı artırmak için halkaya tıklayabilirsiniz.</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
