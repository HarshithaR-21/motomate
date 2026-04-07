import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, CalendarDays, AlertCircle, ShieldCheck, Zap, AlertTriangle, Star, X } from 'lucide-react';
import { StepHeader } from '../components/SharedUI';

// Canonical service categories with icons – these are "intent" choices.
// After the customer picks a service center (Step 3), we resolve these to real DB services.
export const SERVICE_CATALOG = [
    { name: 'General Service',      icon: <Wrench size={20} />,       color: 'blue'   },
    { name: 'Periodic Maintenance', icon: <CalendarDays size={20} />, color: 'indigo' },
    { name: 'Oil Change',           icon: <AlertCircle size={20} />,  color: 'amber'  },
    { name: 'Brake Service',        icon: <ShieldCheck size={20} />,  color: 'green'  },
    { name: 'Battery Issue',        icon: <Zap size={20} />,          color: 'yellow' },
    { name: 'Tyre Issue',           icon: <AlertTriangle size={20} />,color: 'orange' },
    { name: 'Engine Check',         icon: <Wrench size={20} />,       color: 'red'    },
    { name: 'Electrical Repair',    icon: <Zap size={20} />,          color: 'purple' },
    { name: 'AC Service',           icon: <Star size={20} />,         color: 'sky'    },
];

const COLOR_MAP = {
    blue:   { bg: 'bg-blue-600',   light: 'bg-blue-50',   border: 'border-blue-500',   text: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700'   },
    indigo: { bg: 'bg-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700' },
    amber:  { bg: 'bg-amber-500',  light: 'bg-amber-50',  border: 'border-amber-400',  text: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700'   },
    green:  { bg: 'bg-green-600',  light: 'bg-green-50',  border: 'border-green-500',  text: 'text-green-600',  badge: 'bg-green-100 text-green-700'   },
    yellow: { bg: 'bg-yellow-500', light: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700'  },
    orange: { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700'  },
    red:    { bg: 'bg-red-600',    light: 'bg-red-50',    border: 'border-red-500',    text: 'text-red-600',    badge: 'bg-red-100 text-red-700'       },
    purple: { bg: 'bg-purple-600', light: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700'  },
    sky:    { bg: 'bg-sky-600',    light: 'bg-sky-50',    border: 'border-sky-500',    text: 'text-sky-600',    badge: 'bg-sky-100 text-sky-700'       },
};

const Step2 = ({ formData, onChange }) => {
    const selected = formData.selectedServiceNames || [];

    const toggle = (name) => {
        const next = selected.includes(name)
            ? selected.filter(n => n !== name)
            : [...selected, name];
        onChange('selectedServiceNames', next);
        // Clear resolved service IDs — they'll be re-resolved in Step 3
        onChange('selectedServices', []);
        onChange('selectedServiceObjects', []);
        // Also clear the chosen center so user is forced to re-pick if services change
        onChange('serviceCenterId', '');
        onChange('serviceCenterName', '');
    };

    return (
        <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <StepHeader
                title="What do you need?"
                subtitle="Select one or more services — we'll find centers that offer them"
            />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SERVICE_CATALOG.map(svc => {
                    const isSelected = selected.includes(svc.name);
                    const c = COLOR_MAP[svc.color];
                    return (
                        <button
                            key={svc.name}
                            type="button"
                            onClick={() => toggle(svc.name)}
                            className={`relative border-2 rounded-xl p-4 flex flex-col items-center text-center gap-2 transition-all duration-200 cursor-pointer
                                ${isSelected
                                    ? `${c.border} ${c.light} shadow-md scale-[1.03]`
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white'}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                                ${isSelected ? c.bg + ' text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {svc.icon}
                            </div>
                            <span className={`text-xs font-semibold leading-tight ${isSelected ? c.text : 'text-gray-700'}`}>
                                {svc.name}
                            </span>
                            {isSelected && (
                                <div className={`absolute top-2 right-2 w-4 h-4 rounded-full ${c.bg} flex items-center justify-center`}>
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <AnimatePresence>
                {selected.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="rounded-xl border border-blue-200 bg-blue-50 p-4"
                    >
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">
                            Selected ({selected.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {selected.map(name => (
                                <span
                                    key={name}
                                    className="flex items-center gap-1.5 text-xs bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-full"
                                >
                                    {name}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); toggle(name); }}
                                        className="hover:bg-blue-700 rounded-full p-0.5"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <p className="text-xs text-blue-500 mt-2">
                            Next, we'll show service centers that offer these services.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Step2;
