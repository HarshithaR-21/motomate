import React from 'react';
import { motion } from 'framer-motion';
import { Car, Wrench, CalendarDays, MapPin, Home, Zap, FileText } from 'lucide-react';
import { StepHeader } from '../components/SharedUI';
import { getPriceById } from '../utils';

const Step7 = ({ formData, onConfirm, onEdit }) => {
    const serviceTotal = formData.selectedServices.reduce((sum, id) => sum + getPriceById(id), 0);
    const total = serviceTotal + (formData.urgency === 'Emergency' ? 200 : 0);
    const vehicleName = formData.selectedVehicle !== 'Add New'
        ? formData.selectedVehicle
        : `${formData.brand} ${formData.model} (${formData.fuelType})`;

    const rows = [
        { label: 'Vehicle',      value: `${formData.vehicleType} · ${vehicleName}`,                                               icon: <Car size={16} /> },
        { label: 'Services',     value: formData.selectedServices.join(', '),                                                      icon: <Wrench size={16} /> },
        { label: 'Date & Time',  value: `${formData.selectedDate} at ${formData.selectedTime}`,                                    icon: <CalendarDays size={16} /> },
        { label: 'Location',     value: formData.serviceLocation === 'Manual' ? formData.manualAddress : 'Current Location (GPS)', icon: <MapPin size={16} /> },
        { label: 'Service Mode', value: formData.serviceMode,                                                                      icon: <Home size={16} /> },
        { label: 'Urgency',      value: formData.urgency,                                                                          icon: <Zap size={16} /> },
        ...(formData.additionalNotes ? [{ label: 'Notes', value: formData.additionalNotes, icon: <FileText size={16} /> }] : []),
    ];

    return (
        <motion.div key="step7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <StepHeader title="Review & Confirm" subtitle="Double-check everything before booking" />

            <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                {rows.map(({ label, value, icon }) => (
                    <div key={label} className="flex items-start gap-4 px-5 py-3.5">
                        <div className="text-blue-500 shrink-0 mt-0.5">{icon}</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                            <p className="text-sm text-slate-700 mt-0.5 wrap-break-word">{value}</p>
                        </div>
                    </div>
                ))}
                <div className="flex justify-between items-center px-5 py-4 bg-blue-600">
                    <span className="text-white font-bold">Estimated Total</span>
                    <span className="text-white text-xl font-bold">₹{total}</span>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <button
                    onClick={onConfirm}
                    className="flex-1 bg-blue-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition-all"
                >
                    ✓ Confirm Booking
                </button>
                <button
                    onClick={onEdit}
                    className="px-5 py-3.5 rounded-xl font-semibold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    Edit
                </button>
            </div>
        </motion.div>
    );
};

export default Step7;
