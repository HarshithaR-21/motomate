import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, CalendarDays, AlertCircle, ShieldCheck, Zap, AlertTriangle, Star, X, Plus } from 'lucide-react';
import { StepHeader } from '../components/SharedUI';

// Fix 5: All service items use the same theme color (blue) instead of random different colors
export const SERVICE_CATALOG = [
    { name: 'General Service',      icon: <Wrench size={20} /> },
    { name: 'Periodic Maintenance', icon: <CalendarDays size={20} /> },
    { name: 'Oil Change',           icon: <AlertCircle size={20} /> },
    { name: 'Brake Service',        icon: <ShieldCheck size={20} /> },
    { name: 'Battery Issue',        icon: <Zap size={20} /> },
    { name: 'Tyre Issue',           icon: <AlertTriangle size={20} /> },
    { name: 'Engine Check',         icon: <Wrench size={20} /> },
    { name: 'Electrical Repair',    icon: <Zap size={20} /> },
    { name: 'AC Service',           icon: <Star size={20} /> },
];

const Step2 = ({ formData, onChange }) => {
    const selected = formData.selectedServiceNames || [];
    const [customInput, setCustomInput]     = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

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

    const addCustom = () => {
        const trimmed = customInput.trim();
        if (!trimmed) return;
        if (!selected.includes(trimmed)) {
            toggle(trimmed);
        }
        setCustomInput('');
        setShowCustomInput(false);
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
                subtitle="Select one or more services — or add your own"
            />

            {/* Fix 5: All cards use consistent blue theme color */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SERVICE_CATALOG.map(svc => {
                    const isSelected = selected.includes(svc.name);
                    return (
                        <button
                            key={svc.name}
                            type="button"
                            onClick={() => toggle(svc.name)}
                            className={`relative border-2 rounded-xl p-4 flex flex-col items-center text-center gap-2 transition-all duration-200 cursor-pointer
                                ${isSelected
                                    ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.03]'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 bg-white'}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                                ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {svc.icon}
                            </div>
                            <span className={`text-xs font-semibold leading-tight ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                                {svc.name}
                            </span>
                            {isSelected && (
                                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            )}
                        </button>
                    );
                })}

                {/* Add Custom service tile */}
                <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:border-blue-300 hover:bg-blue-50/40 transition-all duration-200 cursor-pointer"
                >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 text-gray-400">
                        <Plus size={20} />
                    </div>
                    <span className="text-xs font-semibold text-gray-400 leading-tight">Add Custom</span>
                </button>
            </div>

            {/* Custom service input — slides in below the grid */}
            <AnimatePresence>
                {showCustomInput && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex gap-2"
                    >
                        <input
                            value={customInput}
                            onChange={e => setCustomInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addCustom()}
                            placeholder="e.g. Windshield Replacement, Denting & Painting…"
                            className="flex-1 px-4 py-2.5 border-2 border-blue-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={addCustom}
                            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Add
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowCustomInput(false); setCustomInput(''); }}
                            className="px-3 py-2.5 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

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