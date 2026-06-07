import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar, Info, Sliders, RefreshCw } from 'lucide-react';
import { getHijriDate, getSpecialDayInfo } from '../utils/calendarHelper';
import { IslamicDay } from '../types';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [adjustmentDays, setAdjustmentDays] = useState<number>(0);
  const [selectedDayInfo, setSelectedDayInfo] = useState<IslamicDay | null>(null);

  useEffect(() => {
    // Load Hijri adjustment offset from localStorage
    const savedAdj = localStorage.getItem('huzur_hicri_adjustment');
    if (savedAdj !== null) {
      setAdjustmentDays(Number(savedAdj));
    }
  }, []);

  const handleAdjustmentChange = (amount: number) => {
    setAdjustmentDays(amount);
    localStorage.setItem('huzur_hicri_adjustment', String(amount));
    
    // Dispatch event to synchronize state across the whole app
    window.dispatchEvent(new Event('hicri_adjusted'));
  };

  // Pre-calculations for lunar and calendar grids:
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  // Start of month first day info
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Convert standard Sunday=0 to Monday=0

  // Days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Selected verbal months representation
  const verbalGregorianMonth = currentDate.toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric'
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayInfo(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayInfo(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDayInfo(null);
  };

  // Render arrays: empty cells for padding
  const paddingCells = Array.from({ length: startDayOfWeek });
  const dayCells = Array.from({ length: daysInMonth }, (_, idx) => idx + 1);

  // Week days checklist
  const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 border border-white/10 shadow-xl shadow-black/25" id="calender-container">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Aspect: Main Calendar Grid */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5.5 h-5.5 text-amber-500" />
              <h3 className="font-serif text-2xl font-semibold text-white" id="calendar-header-title">Çift Yönlü Takvim</h3>
            </div>

            {/* Navigation selectors */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleToday}
                className="text-xs font-semibold px-3 py-1.5 border border-white/10 hover:border-white/20 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer shadow-sm text-slate-300"
              >
                Bugün
              </button>
              <div className="flex bg-white/5 rounded-xl border border-white/5 p-0.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-300 self-center px-2.5 min-w-[110px] text-center font-mono">
                  {verbalGregorianMonth}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid Layout header */}
          <div className="grid grid-cols-7 text-center border-b border-white/5 pb-2 mb-2 font-mono">
            {WEEKDAYS.map(day => (
              <span key={day} className="text-xs font-bold text-slate-500 uppercase tracking-widest py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Core Calendar cells */}
          <div className="grid grid-cols-7 gap-1.5" id="grid-calendar-cells">
            {/* Empty items */}
            {paddingCells.map((_, i) => (
              <div key={`pad-${i}`} className="aspect-square bg-slate-950/20 rounded-xl border border-transparent" />
            ))}

            {/* Practical days */}
            {dayCells.map(dayNum => {
              const currentCellDate = new Date(year, month, dayNum);
              
              // Compute dynamic Hijri info
              const hijri = getHijriDate(currentCellDate, adjustmentDays);
              const customDateStr = currentCellDate.toISOString().split('T')[0];
              const isToday = customDateStr === new Date().toISOString().split('T')[0];

              // Special Day match checks
              const specialInfo = getSpecialDayInfo(currentCellDate, adjustmentDays);

              let bgClass = 'bg-white/5 hover:bg-white/10 border-white/5';
              let textClass = 'text-slate-300';
              let borderClass = 'border';

              if (isToday) {
                borderClass = 'border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]';
                bgClass = 'bg-amber-500/10 hover:bg-amber-500/20';
              }

              if (specialInfo) {
                if (specialInfo.type === 'bayram') {
                  bgClass = 'bg-rose-500/15 hover:bg-rose-500/25 cursor-pointer';
                  borderClass = 'border border-rose-500/35';
                  textClass = 'text-rose-300 font-bold';
                } else if (specialInfo.type === 'kandil') {
                  bgClass = 'bg-amber-500/15 hover:bg-amber-500/25 cursor-pointer';
                  borderClass = 'border border-amber-500/35';
                  textClass = 'text-amber-300 font-bold';
                } else {
                  bgClass = 'bg-indigo-500/15 hover:bg-indigo-500/25 cursor-pointer';
                  borderClass = 'border border-indigo-500/35';
                  textClass = 'text-indigo-350 font-bold';
                }
              }

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => specialInfo && setSelectedDayInfo(specialInfo)}
                  className={`aspect-square p-1.5 sm:p-2.5 rounded-2xl flex flex-col justify-between transition-all select-none ${bgClass} ${borderClass}`}
                  style={{ minHeight: '62px' }}
                >
                  <div className="flex items-center justify-between">
                    {/* Gregorian Large */}
                    <span className={`text-sm font-bold font-mono tracking-tight ${textClass}`}>
                      {dayNum}
                    </span>
                    
                    {/* Special Bullet notifier if special */}
                    {specialInfo && (
                      <span className={`w-2 h-2 rounded-full ${
                        specialInfo.type === 'bayram' ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : specialInfo.type === 'kandil' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-indigo-400 shadow-[0_0_8px_#818cf8]'
                      }`} />
                    )}
                  </div>

                  {/* Subtitle Hijri representation */}
                  <span className="text-[10px] font-sans font-medium text-slate-500 text-right leading-none truncate block group-hover:text-slate-300">
                    {hijri.day} {hijri.monthName.substring(0, 4)}’
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick legend info section */}
          <div className="flex items-center gap-4 mt-4 text-[10px] font-semibold text-slate-450 flex-wrap border-t border-white/5 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-950/40 border border-rose-500/30 block" />
              <span>Dini Bayram</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-950/40 border border-amber-500/30 block" />
              <span>Kandil Gecesi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-indigo-950/40 border border-indigo-500/30 block" />
              <span>Diğer Mübarek Günler</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded border-2 border-amber-500 bg-amber-500/10 block" />
              <span>Bugün</span>
            </div>
          </div>
        </div>

        {/* Right Aspect: Moon adjustment controller & Info Display */}
        <div className="w-full lg:w-4/12 flex flex-col justify-between" id="calendar-settings-panel">
          
          {/* Top content: Selected day description or quick instruction */}
          <div className="bg-gradient-to-br from-indigo-950/10 to-black/30 rounded-2xl p-4 sm:p-5 border border-white/10 h-full min-h-[160px] flex flex-col justify-between mb-4">
            {selectedDayInfo ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[9px] font-bold uppercase rounded px-1.5 py-0.5 ${
                    selectedDayInfo.type === 'bayram'
                      ? 'bg-rose-955/40 text-rose-300 border border-rose-500/20'
                      : 'bg-amber-955/40 text-amber-300 border border-amber-500/20'
                  }`}>
                    {selectedDayInfo.type === 'bayram' ? 'Bayram' : 'Kandil'}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-400">{selectedDayInfo.hijriDate}</span>
                </div>
                <h4 className="font-serif text-lg font-bold text-white mb-2">
                  {selectedDayInfo.name}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                  {selectedDayInfo.description}
                </p>
                
                <button
                  onClick={() => setSelectedDayInfo(null)}
                  className="text-[10px] font-bold text-slate-400 hover:text-white mt-4 transition-colors underline block cursor-pointer"
                >
                  Detayı Kapat
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-6 h-full font-sans">
                <span className="text-2xl text-slate-500 block mb-2">🕌</span>
                <h4 className="font-serif text-sm font-semibold text-slate-400">Gün Detayları</h4>
                <p className="text-xs text-slate-500 max-w-[200px] leading-normal mt-1 mx-auto">
                  Üzerinde renk bulunan mübarek günlere tıklayarak detaylı açıklamalarını okuyabilirsiniz.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Settings controller: Hicri Hijri adjustment slider */}
          <div className="bg-slate-950/30 rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold mb-3">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>Hicri Gün Düzeltmesi</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Hicri takvim ayın evrelerine dayanır ve coğrafyaya göre 1-2 gün farklılık gösterebilir. 
              Günü kaydırmak için aşağıdaki ayarı değiştirin:
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white/5 rounded-xl border border-white/5 p-3 shadow-sm">
                <span className="text-xs font-bold text-slate-400">Mevcut Sapma:</span>
                <span className="text-xs font-bold font-mono text-amber-350 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                  {adjustmentDays === 0 ? '0 (Standart)' : adjustmentDays > 0 ? `+${adjustmentDays} Gün` : `${adjustmentDays} Gün`}
                </span>
              </div>

              {/* Slider list */}
              <div className="flex gap-1">
                {[-2, -1, 0, 1, 2].map(val => (
                  <button
                    key={val}
                    onClick={() => handleAdjustmentChange(val)}
                    className={`flex-1 text-xs font-mono font-bold py-2 rounded-xl border transition-all cursor-pointer ${
                      adjustmentDays === val
                        ? 'bg-amber-500 text-black border-amber-500 shadow-md'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300'
                    }`}
                  >
                    {val === 0 ? '0' : val > 0 ? `+${val}` : val}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
