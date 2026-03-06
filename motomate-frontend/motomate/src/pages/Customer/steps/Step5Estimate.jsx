import React from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle } from 'lucide-react';
import { StepHeader } from '../components/SharedUI';
import { getPriceById } from '../utils';

const Step5 = ({ formData }) => {
    const serviceTotal = formData.selectedServices.reduce((sum, id) => sum + getPriceById(id), 0);
    const emergencyCharge = formData.urgency === 'Emergency' ? 200 : 0;
    const total = serviceTotal + emergencyCharge;

    return (
        <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <StepHeader title="Cost Estimate" subtitle="Review your estimated service charges" />

            <div className="rounded-2xl border border-blue-100 overflow-hidden">
                <div className="px-6 py-4 bg-blue-600">
                    <p className="text-white font-semibold text-sm uppercase tracking-wide">Breakdown</p>
                </div>
                <div className="bg-linear-to-br from-blue-50 to-white divide-y divide-blue-100">
                    {formData.selectedServices.map(id => (
                        <div key={id} className="flex justify-between items-center px-6 py-3.5">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400" />
                                <span className="text-slate-700 text-sm">{id}</span>
                            </div>
                            <span className="font-semibold text-slate-800">₹{getPriceById(id)}</span>
                        </div>
                    ))}
                    {formData.urgency === 'Emergency' && (
                        <div className="flex justify-between items-center px-6 py-3.5 bg-red-50">
                            <div className="flex items-center gap-2">
                                <Zap size={14} className="text-red-500" />
                                <span className="text-red-600 text-sm font-medium">Emergency Charge</span>
                            </div>
                            <span className="font-semibold text-red-600">₹200</span>
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-center px-6 py-4 bg-blue-600">
                    <span className="text-white font-bold">Total Estimated</span>
                    <span className="text-white text-2xl font-bold">₹{total}</span>
                </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">Final cost may vary after the mechanic's on-site inspection. You will be notified before any additional charges.</p>
            </div>
        </motion.div>
    );
};

export default Step5;
