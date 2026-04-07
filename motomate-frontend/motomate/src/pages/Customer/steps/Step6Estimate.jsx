import React from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, Building2, Clock } from 'lucide-react';
import { StepHeader } from '../components/SharedUI';

const Step6 = ({ formData }) => {
    // Use resolved service objects if available, else fall back to selected names with ₹0
    const serviceObjects = formData.selectedServiceObjects?.length > 0
        ? formData.selectedServiceObjects
        : (formData.selectedServiceNames || []).map(n => ({ name: n, price: 0, durationMinutes: 0 }));

    const serviceTotal   = serviceObjects.reduce((s, o) => s + (o.price || 0), 0);
    const totalDuration  = serviceObjects.reduce((s, o) => s + (o.durationMinutes || 0), 0);
    const emergencyCharge = formData.urgency === 'Emergency' ? 200 : 0;
    const grandTotal     = serviceTotal + emergencyCharge;

    return (
        <motion.div
            key="step6est"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <StepHeader title="Cost Estimate" subtitle="Review your estimated service charges" />

            {/* Center info */}
            {formData.serviceCenterName && (
                <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <Building2 size={16} className="text-blue-600 shrink-0" />
                    <div>
                        <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Service Center</p>
                        <p className="text-sm font-bold text-blue-800">{formData.serviceCenterName}</p>
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-blue-100 overflow-hidden">
                <div className="px-6 py-4 bg-blue-600 flex items-center justify-between">
                    <p className="text-white font-semibold text-sm uppercase tracking-wide">Breakdown</p>
                    {totalDuration > 0 && (
                        <span className="flex items-center gap-1 text-blue-100 text-xs">
                            <Clock size={12} /> ~{totalDuration} min total
                        </span>
                    )}
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-white divide-y divide-blue-100">
                    {serviceObjects.map((svc, i) => (
                        <div key={i} className="flex justify-between items-center px-6 py-3.5">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400" />
                                <div>
                                    <span className="text-slate-700 text-sm">{svc.name}</span>
                                    {svc.durationMinutes > 0 && (
                                        <span className="text-xs text-slate-400 ml-2">({svc.durationMinutes} min)</span>
                                    )}
                                </div>
                            </div>
                            <span className="font-semibold text-slate-800">
                                {svc.price > 0 ? `₹${svc.price}` : '—'}
                            </span>
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
                    <span className="text-white text-2xl font-bold">
                        {grandTotal > 0 ? `₹${grandTotal}` : 'TBD'}
                    </span>
                </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                    Final cost may vary after the mechanic's on-site inspection.
                    You will be notified before any additional charges.
                </p>
            </div>
        </motion.div>
    );
};

export default Step6;
