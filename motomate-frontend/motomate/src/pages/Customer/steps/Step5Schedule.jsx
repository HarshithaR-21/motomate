import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CalendarDays, CheckCircle, Zap } from 'lucide-react';
import { CardInput, SectionLabel, StepHeader } from '../components/SharedUI';

const TIME_SLOTS = ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'];

const Step5 = ({ formData, onChange }) => (
    <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
        <StepHeader title="Schedule Booking" subtitle="Pick a date, time, and urgency level" />

        <div>
            <SectionLabel>Select Date</SectionLabel>
            <div className="relative">
                <CalendarDays size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                    type="date"
                    value={formData.selectedDate}
                    onChange={e => onChange('selectedDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
            </div>
        </div>

        <div>
            <SectionLabel>Select Time Slot</SectionLabel>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TIME_SLOTS.map(time => (
                    <CardInput key={time} selected={formData.selectedTime === time} onClick={() => onChange('selectedTime', time)} className="justify-center">
                        <div className="flex flex-col items-center w-full gap-1">
                            <Clock size={18} className={formData.selectedTime === time ? 'text-blue-600' : 'text-gray-400'} />
                            <span className={`text-sm font-semibold ${formData.selectedTime === time ? 'text-blue-700' : 'text-gray-600'}`}>{time}</span>
                        </div>
                    </CardInput>
                ))}
            </div>
        </div>

        <div>
            <SectionLabel>Urgency Level</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CardInput selected={formData.urgency === 'Normal'} onClick={() => onChange('urgency', 'Normal')}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <CheckCircle size={20} className="text-green-600" />
                        </div>
                        <div>
                            <div className="font-semibold text-slate-700">Normal</div>
                            <div className="text-xs text-gray-500">Standard scheduling, no extra charge</div>
                        </div>
                    </div>
                    {formData.urgency === 'Normal' && <CheckCircle size={18} className="text-blue-600 shrink-0" />}
                </CardInput>
                <div
                    onClick={() => onChange('urgency', 'Emergency')}
                    className={`cursor-pointer border-2 rounded-xl p-4 transition-all duration-200 flex items-center justify-between
                        ${formData.urgency === 'Emergency'
                            ? 'border-red-500 bg-red-50 shadow-md'
                            : 'border-gray-200 hover:border-red-300 hover:bg-red-50'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                            <Zap size={20} className="text-red-500" />
                        </div>
                        <div>
                            <div className="font-semibold text-slate-700">Emergency</div>
                            <div className="text-xs text-red-500">Priority service · +₹200</div>
                        </div>
                    </div>
                    {formData.urgency === 'Emergency' && <CheckCircle size={18} className="text-red-500 shrink-0" />}
                </div>
            </div>
        </div>
    </motion.div>
);

export default Step5;
