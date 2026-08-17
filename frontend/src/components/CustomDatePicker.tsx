'use client';
import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, Clock, ChevronUp, ChevronDown } from 'lucide-react';

interface CustomDatePickerProps {
  type?: 'date' | 'time';
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
}

/* ═══════════════════════════════════════════════
   Custom Time Picker (Hour → Minute → AM/PM)
   ═══════════════════════════════════════════════ */
function CustomTimePicker({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Parse "HH:mm" (24h) into 12h parts
  const parse = (v: string) => {
    const [hStr, mStr] = (v || '09:00').split(':');
    let h24 = parseInt(hStr) || 0;
    const m = parseInt(mStr) || 0;
    const period = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return { h12, m, period };
  };

  const { h12, m, period } = parse(value);

  const to24 = (h: number, min: number, p: string) => {
    let h24 = h;
    if (p === 'AM' && h === 12) h24 = 0;
    else if (p === 'PM' && h !== 12) h24 = h + 12;
    return `${h24.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  };

  const setHour = (h: number) => onChange(to24(h, m, period));
  const setMin = (min: number) => onChange(to24(h12, min, period));
  const setPeriod = (p: string) => onChange(to24(h12, m, p));

  const incHour = () => setHour(h12 >= 12 ? 1 : h12 + 1);
  const decHour = () => setHour(h12 <= 1 ? 12 : h12 - 1);
  const incMin = () => setMin(m >= 55 ? 0 : m + 5);
  const decMin = () => setMin(m <= 0 ? 55 : m - 5);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayTime = `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;

  return (
    <div className="relative w-full" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${className} !pl-10 cursor-pointer text-left flex items-center
          transition-all duration-300 hover:border-[#c5a880] hover:shadow-[0_0_0_3px_rgba(197,168,128,0.15)]`}
      >
        {displayTime}
      </button>
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <Clock className="w-4 h-4" />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-200 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
          style={{ minWidth: 240 }}>

          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Time</span>
          </div>

          <div className="flex items-center justify-center gap-2 px-4 py-5">

            {/* Hour Spinner */}
            <div className="flex flex-col items-center gap-1">
              <button type="button" onClick={decHour}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                <ChevronUp className="w-4 h-4" />
              </button>
              <div className="w-16 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black tracking-tighter shadow-lg">
                {h12.toString().padStart(2, '0')}
              </div>
              <button type="button" onClick={incHour}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                <ChevronDown className="w-4 h-4" />
              </button>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Hour</span>
            </div>

            {/* Colon */}
            <div className="text-2xl font-black text-slate-300 px-0.5 -mt-6">:</div>

            {/* Minute Spinner */}
            <div className="flex flex-col items-center gap-1">
              <button type="button" onClick={decMin}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                <ChevronUp className="w-4 h-4" />
              </button>
              <div className="w-16 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black tracking-tighter shadow-lg">
                {m.toString().padStart(2, '0')}
              </div>
              <button type="button" onClick={incMin}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                <ChevronDown className="w-4 h-4" />
              </button>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Min</span>
            </div>

            {/* AM / PM */}
            <div className="flex flex-col items-center gap-1.5 ml-2">
              <button type="button" onClick={() => setPeriod('AM')}
                className={`w-14 h-10 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  period === 'AM'
                    ? 'bg-[#c5a880] text-white shadow-md shadow-[#c5a880]/20'
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                }`}>
                AM
              </button>
              <button type="button" onClick={() => setPeriod('PM')}
                className={`w-14 h-10 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  period === 'PM'
                    ? 'bg-[#c5a880] text-white shadow-md shadow-[#c5a880]/20'
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                }`}>
                PM
              </button>
            </div>
          </div>

          {/* Done */}
          <div className="px-4 pb-4">
            <button type="button" onClick={() => setOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Main Component (Date or Time)
   ═══════════════════════════════════════════════ */
export default function CustomDatePicker({
  type = 'date',
  value,
  onChange,
  className = 'form-input',
  required,
}: CustomDatePickerProps) {

  if (type === 'time') {
    return <CustomTimePicker value={value} onChange={onChange} className={className} />;
  }

  // Date mode — use react-datepicker
  const parsedDate = value ? new Date(`${value}T00:00:00`) : null;

  const handleChange = (date: Date | null) => {
    if (!date) { onChange(''); return; }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    onChange(`${year}-${month}-${day}`);
  };

  return (
    <div className="relative w-full group">
      <DatePicker
        selected={parsedDate}
        onChange={handleChange}
        dateFormat="dd/MM/yyyy"
        className={`${className} !pl-10 cursor-pointer transition-all duration-300
          group-hover:border-[#c5a880] group-hover:shadow-[0_0_0_3px_rgba(197,168,128,0.15)]`}
        required={required}
        placeholderText="Select date"
      />
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 transition-colors duration-300 group-hover:text-[#c5a880]">
        <Calendar className="w-4 h-4" />
      </div>
    </div>
  );
}
