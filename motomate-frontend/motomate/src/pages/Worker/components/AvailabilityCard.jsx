import { useState } from 'react';
import { CheckCircle2, Clock, CalendarOff, ChevronDown, Loader2 } from 'lucide-react';

const STATUSES = [
  { value: 'AVAILABLE',  label: 'Available',   icon: CheckCircle2,  desc: 'Ready to accept jobs',          dot: 'bg-green-400',  ring: 'ring-green-200',  bg: 'bg-green-500',  hover: 'hover:bg-green-50 hover:border-green-300' },
  { value: 'BUSY',       label: 'Busy',         icon: Clock,          desc: 'Currently occupied',            dot: 'bg-amber-400',  ring: 'ring-amber-200',  bg: 'bg-amber-500',  hover: 'hover:bg-amber-50 hover:border-amber-300' },
  { value: 'ON_LEAVE',   label: 'On Leave',     icon: CalendarOff,    desc: 'No jobs will be assigned',      dot: 'bg-gray-400',   ring: 'ring-gray-200',   bg: 'bg-gray-400',   hover: 'hover:bg-gray-50 hover:border-gray-300' },
];

const AvailabilityCard = ({ status, onUpdate, loading }) => {
  const [open, setOpen] = useState(false);

  const current = STATUSES.find(s => s.value === status) || STATUSES[0];
  const Icon = current.icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-gray-700 font-bold text-sm">Availability Status</h3>
          <p className="text-gray-400 text-xs mt-0.5">Visible to admins &amp; job system</p>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full ${current.dot} ring-4 ${current.ring} mt-1`} />
      </div>

      {/* Current status display */}
      <div
        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all
          ${status === 'AVAILABLE' ? 'border-green-200 bg-green-50' : status === 'BUSY' ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}
        `}
        onClick={() => setOpen(o => !o)}
      >
        <div className={`w-9 h-9 rounded-xl ${current.bg} flex items-center justify-center shrink-0`}>
          <Icon size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm">{current.label}</p>
          <p className="text-gray-500 text-xs">{current.desc}</p>
        </div>
        {loading
          ? <Loader2 size={16} className="text-gray-400 animate-spin shrink-0" />
          : <ChevronDown size={16} className={`text-gray-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
        }
      </div>

      {/* Dropdown */}
      {open && !loading && (
        <div className="absolute left-4 right-4 top-full mt-1 z-10 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden">
          {STATUSES.map(s => {
            const SI = s.icon;
            const active = s.value === status;
            return (
              <button
                key={s.value}
                onClick={() => { onUpdate(s.value); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${s.hover} border-b last:border-b-0 border-gray-50 ${active ? 'bg-gray-50' : ''}`}
              >
                <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                  <SI size={13} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-semibold text-sm">{s.label}</p>
                  <p className="text-gray-400 text-xs">{s.desc}</p>
                </div>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AvailabilityCard;
