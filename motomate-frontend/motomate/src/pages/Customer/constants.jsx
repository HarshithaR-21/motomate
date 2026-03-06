import React from 'react';
import { Wrench, CalendarDays, AlertCircle, ShieldCheck, Zap, AlertTriangle, Star } from 'lucide-react';

export const SERVICE_OPTIONS = [
    { id: 'General Service',      label: 'General Service',      price: 500, icon: <Wrench size={20} /> },
    { id: 'Periodic Maintenance', label: 'Periodic Maintenance', price: 800, icon: <CalendarDays size={20} /> },
    { id: 'Oil Change',           label: 'Oil Change',           price: 300, icon: <AlertCircle size={20} /> },
    { id: 'Brake Service',        label: 'Brake Service',        price: 600, icon: <ShieldCheck size={20} /> },
    { id: 'Battery Issue',        label: 'Battery Issue',        price: 400, icon: <Zap size={20} /> },
    { id: 'Tyre Issue',           label: 'Tyre Issue',           price: 250, icon: <AlertTriangle size={20} /> },
    { id: 'Engine Check',         label: 'Engine Check',         price: 700, icon: <Wrench size={20} /> },
    { id: 'Electrical Repair',    label: 'Electrical Repair',    price: 550, icon: <Zap size={20} /> },
    { id: 'AC Service',           label: 'AC Service',           price: 450, icon: <Star size={20} /> },
];

export const STEPS = ['Vehicle', 'Services', 'Location', 'Schedule', 'Estimate', 'Notes', 'Confirm', 'Done'];

export const INITIAL_FORM = {
    userId: '', vehicleType: '', selectedVehicle: '', brand: '', model: '',
    fuelType: '', vehicleNumber: '', selectedServices: [],
    serviceLocation: '', manualAddress: '', serviceMode: '',
    selectedDate: '', selectedTime: '', urgency: 'Normal',
    additionalNotes: '', uploadedFiles: [],
};
