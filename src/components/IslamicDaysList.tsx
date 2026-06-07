import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Hourglass, Info, Check, BellRing } from 'lucide-react';
import { IslamicDay } from '../types';
import { getSpecialDaysForYear } from '../utils/calendarHelper';

export default function IslamicDaysList() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [days, setDays] = useState<IslamicDay[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'bayram' | 'kandil'>('all');
  const [hicriAdjustment, setHicriAdjustment] = useState<number>(0);

  useEffect(() => {
    // Load adjustment if set
    const savedAdj = localStorage.getItem('huzur_hicri_adjustment');
    if (savedAdj) {
      setHicriAdjustment(Number(savedAdj));
    }

    const calculated = getSpecialDaysForYear(selectedYear, savedAdj ? Number(savedAdj) : 0);
    setDays(calculated);
  }, [selectedYear, hicriAdjustment]);

  // Handle local adjustment notification listen
  useEffect(() => {
    const handleAdjusted = () => {
      const savedAdj = localStorage.getItem('huzur_hicri_adjustment');
      if (savedAdj !== null) {
        setHicriAdjustment(Number(savedAdj));
      }
    };
    window.addEventListener('hicri_adjusted', handleAdjusted);
    return () => window.removeEventListener('hicri_adjusted', handleAdjusted);
  }, []);

  // Compute countdown helpers
  const getCountdownString = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const parts = dateStr.split('-');
    const targetDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { msg: 'Geçti', code: 'past', daysClass: 'text-slate-500 bg-white/5' };
    } else if (diffDays === 0) {
      return { msg: 'Bugün!', code: 'today', daysClass: 'text-white bg-red-500 animate-pulse font-bold shadow-[0_0_10px_#ef4444]' };
    } else if (diffDays === 1) {
      return { msg: 'Yarın', code: 'tomorrow', daysClass: 'text-black bg-amber-400 font-semibold shadow-[0_0_10px_#fbbf24]' };
    } else {
      return { msg: `${diffDays} gün kaldı`, code: 'future', daysClass: 'text-amber-200 bg-amber-500/10' };
    }
  };

  const filteredDays = days.filter(d => {
    if (filterType === 'all') return true;
    return d.type === filterType;
  });

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 border border-white/10 shadow-xl shadow-black/25 transition-all" id="dini-gunler-panel-wrapper">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
        <div>
          <h3 className="font-serif text-2xl font-semibold text-white" id="religious-days-title">Mübarek Gün ve Geceler</h3>
          <p className="text-sm text-slate-400 mt-1">Hicri takvime göre mübarek üç aylar, kandiller ve dini bayramlar.</p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            {[(currentYear - 1), currentYear, (currentYear + 1), (currentYear + 2)].map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedYear === yr
                    ? 'bg-amber-500 text-black shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Category Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
            filterType === 'all'
              ? 'bg-amber-500 text-black border-amber-500 font-bold'
              : 'bg-white/5 text-slate-300 border-white/5 hover:border-white/10'
          }`}
        >
          Tüm Günler
        </button>
        <button
          onClick={() => setFilterType('bayram')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
            filterType === 'bayram'
              ? 'bg-rose-500/20 border-rose-500/30 text-rose-300 font-semibold'
              : 'bg-white/5 text-slate-300 border-white/5 hover:border-white/10'
          }`}
        >
          Bayramlar
        </button>
        <button
          onClick={() => setFilterType('kandil')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
            filterType === 'kandil'
              ? 'bg-amber-500/20 border-amber-500/30 text-amber-305 font-semibold'
              : 'bg-white/5 text-slate-300 border-white/5 hover:border-white/10'
          }`}
        >
          Kandiller & Geceler
        </button>
      </div>

      {/* Special religious days listing */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700" id="dini-gunler-scroller">
        <AnimatePresence mode="popLayout">
          {filteredDays.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Aradığınız kategoride dini gün bulunamadı.
            </div>
          ) : (
            filteredDays.map(item => {
              const countdown = getCountdownString(item.date);
              
              // Formatting Turkish Gregorian Date representation
              const parts = item.date.split('-');
              const gregorianDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
              const verbalGregorianDate = gregorianDateObj.toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                weekday: 'long'
              });

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    countdown.code === 'today'
                      ? 'border-red-500/30 bg-red-955/20 shadow-lg shadow-red-950/25'
                      : countdown.code === 'tomorrow'
                      ? 'border-amber-500/30 bg-amber-955/20 shadow-lg shadow-amber-955/25'
                      : 'border-white/5 bg-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-serif text-base font-semibold text-white">
                        {item.name}
                      </span>
                      
                      {/* Badge indicator on type */}
                      <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${
                        item.type === 'bayram'
                          ? 'bg-rose-950/40 text-rose-300 border border-rose-500/20'
                          : item.type === 'kandil'
                          ? 'bg-amber-950/40 text-amber-300 border border-amber-500/20'
                          : item.type === 'yilbasi'
                          ? 'bg-blue-950/40 text-blue-300 border border-blue-500/20'
                          : 'bg-slate-950/40 text-slate-300 border border-white/5'
                      }`}>
                        {item.type === 'bayram' ? 'Bayram' : item.type === 'kandil' ? 'Kandil Gecesi' : item.type === 'yilbasi' ? 'Hicri Yıl' : 'Mübarek Gün'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {verbalGregorianDate}
                      </span>
                      <span>•</span>
                      <span className="font-medium text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">
                        {item.hijriDate}
                      </span>
                    </div>

                    {/* Detailed expandable spiritual description */}
                    <div className="flex items-start gap-1.5 bg-black/20 p-2.5 rounded-xl border border-white/5 mt-2">
                       <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-450 leading-relaxed font-sans">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Countdown tag */}
                  <div className="flex-shrink-0 flex sm:flex-col justify-between items-center sm:items-end gap-2 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                    <span className="text-xs text-slate-500 font-medium sm:hidden">Durum:</span>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 w-fit font-mono ${countdown.daysClass}`}>
                      <Hourglass className="w-3 h-3" />
                      {countdown.msg}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
