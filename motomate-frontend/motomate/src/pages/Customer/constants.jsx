import React from 'react';
import { Wrench, CalendarDays, AlertCircle, ShieldCheck, Zap, AlertTriangle, Star } from 'lucide-react';

// Fallback static services (used in Estimate & Confirm if no live services loaded yet)
export const SERVICE_OPTIONS = [
    { id: 'General Service',      label: 'General Service',      price: 500,  icon: <Wrench size={20} /> },
    { id: 'Periodic Maintenance', label: 'Periodic Maintenance', price: 800,  icon: <CalendarDays size={20} /> },
    { id: 'Oil Change',           label: 'Oil Change',           price: 300,  icon: <AlertCircle size={20} /> },
    { id: 'Brake Service',        label: 'Brake Service',        price: 600,  icon: <ShieldCheck size={20} /> },
    { id: 'Battery Issue',        label: 'Battery Issue',        price: 400,  icon: <Zap size={20} /> },
    { id: 'Tyre Issue',           label: 'Tyre Issue',           price: 250,  icon: <AlertTriangle size={20} /> },
    { id: 'Engine Check',         label: 'Engine Check',         price: 700,  icon: <Wrench size={20} /> },
    { id: 'Electrical Repair',    label: 'Electrical Repair',    price: 550,  icon: <Zap size={20} /> },
    { id: 'AC Service',           label: 'AC Service',           price: 450,  icon: <Star size={20} /> },
];

// New flow:
// 1 Vehicle → 2 Services → 3 Service Center → 4 Location → 5 Schedule → 6 Estimate → 7 Notes → 8 Confirm → 9 Done
export const STEPS = [
    'Vehicle',
    'Services',
    'Service Center',
    'Location',
    'Schedule',
    'Estimate',
    'Notes',
    'Confirm',
    'Done',
];

export const INITIAL_FORM = {
    userId:                 '',
    // Step 1 – Vehicle
    vehicleType:            '',
    selectedVehicle:        '',
    brand:                  '',
    model:                  '',
    fuelType:               '',
    vehicleNumber:          '',
    // Step 2 – Services (names only at this stage; IDs resolved after center picked)
    selectedServiceNames:   [],   // service name strings chosen in step 2
    // Step 3 – Service Center
    serviceCenterId:        '',   // ownerId of the selected center
    serviceCenterName:      '',
    // Step 3b – resolved service IDs after center is picked (sent to backend)
    selectedServices:       [],   // SCOService IDs from the chosen center
    selectedServiceObjects: [],   // full objects { id, name, price, durationMinutes }
    // Step 4 – Location
    serviceLocation:        '',
    manualAddress:          '',
    serviceMode:            '',
    // Step 5 – Schedule
    selectedDate:           '',
    selectedTime:           '',
    urgency:                'Normal',
    // Step 7 – Notes
    additionalNotes:        '',
    uploadedFiles:          [],
};
