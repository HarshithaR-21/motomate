import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    ChevronLeft,
    Car,
    Bike,
    MapPin,
    Calendar,
    Clock,
    FileText,
    CheckCircle,
    Upload,
    AlertCircle,
    Wrench,
    Home,
    ShieldCheck,
    Star,
    CalendarDays,
    Zap,
    AlertTriangle,
    XCircle
} from 'lucide-react';
import Navigation from '../../Components/Navigation';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';
import Footer from '../../Components/Footer';

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_OPTIONS = [
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

const STEPS = ['Vehicle', 'Services', 'Location', 'Schedule', 'Estimate', 'Notes', 'Confirm', 'Done'];

const INITIAL_FORM = {
    vehicleType: '', selectedVehicle: '', brand: '', model: '',
    fuelType: '', vehicleNumber: '', selectedServices: [],
    serviceLocation: '', manualAddress: '', serviceMode: '',
    selectedDate: '', selectedTime: '', urgency: 'Normal',
    additionalNotes: '', uploadedFiles: [],
};

// ─── Utility ──────────────────────────────────────────────────────────────────

function convertTo24(timeStr) {
    if (!timeStr) return null;
    const parts = timeStr.trim().split(' ');
    if (parts.length === 1) return parts[0].includes(':') ? parts[0] : parts[0] + ':00';
    const [time, modifier] = parts;
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

function getPriceById(id) {
    return SERVICE_OPTIONS.find(s => s.id === id)?.price || 0;
}

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

const CardInput = ({ selected, onClick, children, className = '' }) => (
    <div
        onClick={onClick}
        className={`cursor-pointer border-2 rounded-xl p-4 transition-all duration-200 flex items-center justify-between
            ${selected
                ? 'border-blue-600 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
            ${className}`}
    >
        {children}
    </div>
);

const ServiceCard = ({ service, selected, onClick }) => (
    <div
        onClick={() => onClick(service.id)}
        className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center text-center transition-all duration-200
            ${selected
                ? 'border-blue-600 bg-blue-600 text-white shadow-lg transform scale-105'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600'}`}
    >
        <div className={`mb-2 ${selected ? 'text-white' : 'text-blue-600'}`}>{service.icon}</div>
        <span className="font-medium text-sm">{service.label}</span>
        <span className={`text-xs mt-1 ${selected ? 'text-blue-100' : 'text-gray-500'}`}>₹{service.price}</span>
    </div>
);

const SectionLabel = ({ children }) => (
    <label className="block text-sm font-bold text-slate-700 mb-3">{children}</label>
);

const StepHeader = ({ title, subtitle }) => (
    <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        <p className="text-slate-500 mt-1">{subtitle}</p>
    </div>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const ProgressBar = ({ currentStep }) => (
    <div className="mb-8">
        <div className="flex items-center">
            {STEPS.map((label, i) => {
                const num = i + 1;
                const done = num < currentStep;
                const active = num === currentStep;
                return (
                    <React.Fragment key={i}>
                        <div className="flex flex-col items-center shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                                ${done ? 'bg-blue-600 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-400'}`}>
                                {done ? '✓' : num}
                            </div>
                            <span className={`text-[10px] mt-1 font-medium hidden sm:block
                                ${active ? 'text-blue-600' : done ? 'text-slate-500' : 'text-slate-300'}`}>
                                {label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mb-4 mx-1 transition-all duration-300 ${done ? 'bg-blue-500' : 'bg-slate-200'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    </div>
);

// ─── Step 1: Vehicle Selection ────────────────────────────────────────────────

const Step1 = ({ formData, onChange }) => (
    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
        <StepHeader title="Select Vehicle" subtitle="Choose your vehicle type and details" />

        <div className="grid grid-cols-2 gap-4">
            {[{ type: 'Car', Icon: Car }, { type: 'Bike', Icon: Bike }].map(({ type, Icon }) => (
                <CardInput key={type} selected={formData.vehicleType === type} onClick={() => onChange('vehicleType', type)}>
                    <div className="flex flex-col items-center w-full">
                        <Icon size={32} className={formData.vehicleType === type ? 'text-blue-700' : 'text-gray-400'} />
                        <span className={`mt-2 font-semibold ${formData.vehicleType === type ? 'text-blue-800' : 'text-gray-600'}`}>{type}</span>
                    </div>
                    {formData.vehicleType === type && <CheckCircle className="text-blue-600 shrink-0" />}
                </CardInput>
            ))}
        </div>

        <div>
            <SectionLabel>Saved Vehicles</SectionLabel>
            <select
                value={formData.selectedVehicle}
                onChange={e => onChange('selectedVehicle', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
                <option value="">Select a vehicle</option>
                <option value="Toyota Camry (Petrol)">Toyota Camry (Petrol)</option>
                <option value="Honda Civic (Diesel)">Honda Civic (Diesel)</option>
                <option value="Add New">+ Add New Vehicle</option>
            </select>
        </div>

        <AnimatePresence>
            {formData.selectedVehicle === 'Add New' && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-4 overflow-hidden"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Brand</label>
                            <input type="text" placeholder="e.g. Toyota" value={formData.brand} onChange={e => onChange('brand', e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Model</label>
                            <input type="text" placeholder="e.g. Innova" value={formData.model} onChange={e => onChange('model', e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Fuel Type</label>
                            <select value={formData.fuelType} onChange={e => onChange('fuelType', e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                <option value="">Select</option>
                                <option value="Petrol">Petrol</option>
                                <option value="Diesel">Diesel</option>
                                <option value="EV">Electric</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Number (Opt.)</label>
                            <input type="text" placeholder="e.g. KA-01-1234" value={formData.vehicleNumber} onChange={e => onChange('vehicleNumber', e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
);

// ─── Step 2: Service Selection ────────────────────────────────────────────────

const Step2 = ({ formData, onToggle }) => (
    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
        <StepHeader title="Choose Services" subtitle="Select one or more services required" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SERVICE_OPTIONS.map(service => (
                <ServiceCard key={service.id} service={service} selected={formData.selectedServices.includes(service.id)} onClick={onToggle} />
            ))}
        </div>
        <AnimatePresence>
            {formData.selectedServices.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2 pt-2">
                    {formData.selectedServices.map(id => (
                        <span key={id} className="text-xs bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-full">{id}</span>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
);

// ─── Step 3: Location & Mode ──────────────────────────────────────────────────

const Step3 = ({ formData, onChange }) => (
    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
        <StepHeader title="Location & Mode" subtitle="Where should we perform the service?" />

        <div>
            <SectionLabel>Service Location</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CardInput selected={formData.serviceLocation === 'Current Location'} onClick={() => onChange('serviceLocation', 'Current Location')}>
                    <div className="flex items-center">
                        <MapPin className="mr-3 text-blue-600" />
                        <div>
                            <div className="font-medium">Current Location</div>
                            <div className="text-xs text-gray-500">Use GPS location</div>
                        </div>
                    </div>
                    {formData.serviceLocation === 'Current Location' && <CheckCircle size={18} className="text-blue-600 shrink-0" />}
                </CardInput>
                <CardInput selected={formData.serviceLocation === 'Manual'} onClick={() => onChange('serviceLocation', 'Manual')}>
                    <div className="flex items-center">
                        <Home className="mr-3 text-blue-600" />
                        <div>
                            <div className="font-medium">Manual Address</div>
                            <div className="text-xs text-gray-500">Enter address manually</div>
                        </div>
                    </div>
                    {formData.serviceLocation === 'Manual' && <CheckCircle size={18} className="text-blue-600 shrink-0" />}
                </CardInput>
            </div>
            <AnimatePresence>
                {formData.serviceLocation === 'Manual' && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-4">
                        <textarea
                            placeholder="Enter full address..."
                            value={formData.manualAddress}
                            onChange={e => onChange('manualAddress', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            rows={3}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div>
            <SectionLabel>Service Mode</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CardInput selected={formData.serviceMode === 'Doorstep'} onClick={() => onChange('serviceMode', 'Doorstep')}>
                    <div className="flex items-center">
                        <Home className="mr-3 text-blue-600" />
                        <div>
                            <div className="font-medium">Doorstep Service</div>
                            <div className="text-xs text-gray-500">Mechanic comes to you</div>
                        </div>
                    </div>
                    {formData.serviceMode === 'Doorstep' && <CheckCircle size={18} className="text-blue-600 shrink-0" />}
                </CardInput>
                <CardInput selected={formData.serviceMode === 'Service Center'} onClick={() => onChange('serviceMode', 'Service Center')}>
                    <div className="flex items-center">
                        <Wrench className="mr-3 text-blue-600" />
                        <div>
                            <div className="font-medium">Service Center</div>
                            <div className="text-xs text-gray-500">Drop your vehicle off</div>
                        </div>
                    </div>
                    {formData.serviceMode === 'Service Center' && <CheckCircle size={18} className="text-blue-600 shrink-0" />}
                </CardInput>
            </div>
        </div>
    </motion.div>
);

// ─── Step 4: Schedule ─────────────────────────────────────────────────────────

const Step4 = ({ formData, onChange }) => {
    const timeSlots = ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'];
    return (
        <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
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
                    {timeSlots.map(time => (
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
};

// ─── Step 5: Cost Estimate ────────────────────────────────────────────────────

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
                <div className="bg-gradient-to-br from-blue-50 to-white divide-y divide-blue-100">
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

// ─── Step 6: Additional Notes ─────────────────────────────────────────────────

const Step6 = ({ formData, onChange }) => (
    <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
        <StepHeader title="Additional Notes" subtitle="Help our mechanic understand the issue better" />

        <div>
            <SectionLabel>Describe the Issue (Optional)</SectionLabel>
            <textarea
                value={formData.additionalNotes}
                onChange={e => onChange('additionalNotes', e.target.value)}
                rows={4}
                placeholder="e.g. Strange noise when braking, engine warning light on since last week..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
        </div>

        <div>
            <SectionLabel>Upload Photo / Video (Optional)</SectionLabel>
            <label className="flex flex-col items-center justify-center gap-3 w-full py-10 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <Upload size={22} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors">Click to upload files</p>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG, MP4 — Max 10MB each</p>
                </div>
                <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={e => onChange('uploadedFiles', Array.from(e.target.files))} />
            </label>
            <AnimatePresence>
                {formData.uploadedFiles.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-sm text-green-700 font-medium">{formData.uploadedFiles.length} file(s) ready to upload</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </motion.div>
);

// ─── Step 7: Confirmation ─────────────────────────────────────────────────────

const Step7 = ({ formData, onConfirm, onEdit }) => {
    const serviceTotal = formData.selectedServices.reduce((sum, id) => sum + getPriceById(id), 0);
    const total = serviceTotal + (formData.urgency === 'Emergency' ? 200 : 0);
    const vehicleName = formData.selectedVehicle !== 'Add New'
        ? formData.selectedVehicle
        : `${formData.brand} ${formData.model} (${formData.fuelType})`;

    const rows = [
        { label: 'Vehicle',      value: `${formData.vehicleType} · ${vehicleName}`,                                              icon: <Car size={16} /> },
        { label: 'Services',     value: formData.selectedServices.join(', '),                                                     icon: <Wrench size={16} /> },
        { label: 'Date & Time',  value: `${formData.selectedDate} at ${formData.selectedTime}`,                                   icon: <CalendarDays size={16} /> },
        { label: 'Location',     value: formData.serviceLocation === 'Manual' ? formData.manualAddress : 'Current Location (GPS)', icon: <MapPin size={16} /> },
        { label: 'Service Mode', value: formData.serviceMode,                                                                     icon: <Home size={16} /> },
        { label: 'Urgency',      value: formData.urgency,                                                                         icon: <Zap size={16} /> },
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
                            <p className="text-sm text-slate-700 mt-0.5 break-words">{value}</p>
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

// ─── Step 8: Result ───────────────────────────────────────────────────────────

const Step8 = ({ errorBooking }) => (
    <motion.div key="step8" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="py-8 text-center">
        {errorBooking ? (
            <>
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
                    <XCircle size={40} className="text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Booking Failed</h2>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto">Something went wrong. Please try again or contact our support team.</p>
                <button onClick={() => window.location.reload()} className="bg-red-500 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-red-600 transition-colors">
                    Try Again
                </button>
            </>
        ) : (
            <>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5"
                >
                    <CheckCircle size={40} className="text-green-500" />
                </motion.div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Booking Confirmed!</h2>
                <p className="text-slate-500 mb-1 text-sm">Your booking reference</p>
                <div className="inline-block bg-blue-50 border border-blue-200 text-blue-700 font-bold text-lg px-5 py-2 rounded-xl mb-4">
                    BS123456
                </div>
                <p className="text-slate-500 text-sm mb-8">A mechanic has been assigned and will contact you shortly.</p>
                <button
                    onClick={() => window.location.href = '/live-tracking'}
                    className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                    Track Live Service →
                </button>
            </>
        )}
    </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const BookService = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [errorBooking, setErrorBooking] = useState(false);

    const handleInputChange = (field, value) =>
        setFormData(prev => ({ ...prev, [field]: value }));

    const handleServiceToggle = id =>
        setFormData(prev => ({
            ...prev,
            selectedServices: prev.selectedServices.includes(id)
                ? prev.selectedServices.filter(s => s !== id)
                : [...prev.selectedServices, id],
        }));

    const isStepValid = step => {
        switch (step) {
            case 1:
                if (!formData.vehicleType || !formData.selectedVehicle) return false;
                if (formData.selectedVehicle === 'Add New') return !!(formData.brand && formData.model && formData.fuelType);
                return true;
            case 2: return formData.selectedServices.length > 0;
            case 3:
                if (!formData.serviceLocation || !formData.serviceMode) return false;
                if (formData.serviceLocation === 'Manual' && !formData.manualAddress) return false;
                return true;
            case 4: return !!(formData.selectedDate && formData.selectedTime);
            default: return true;
        }
    };

    const nextStep = () => {
        if (isStepValid(currentStep)) {
            setCurrentStep(s => s + 1);
        } else {
            toast.error('Please fill in all required fields.');
        }
    };

    const prevStep = () => currentStep > 1 && setCurrentStep(s => s - 1);

    const confirmBooking = async () => {
        setCurrentStep(8);
        try {
            const payload = {
                ...formData,
                selectedTime: convertTo24(formData.selectedTime),
                uploadedFiles: [],
            };
            const response = await axios.post(
                'http://localhost:8080/api/services/book-service',
                payload,
                { withCredentials: true }
            );
            if (response.status === 200 || response.status === 201) {
                toast.success('Booking Confirmed!');
                setErrorBooking(false);
            }
        } catch (error) {
            console.error('Booking failed:', error);
            setErrorBooking(true);
            toast.error('Booking failed. Please try again.');
        }
    };

    const sharedProps = { formData, onChange: handleInputChange };

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <Step1 {...sharedProps} />;
            case 2: return <Step2 {...sharedProps} onToggle={handleServiceToggle} />;
            case 3: return <Step3 {...sharedProps} />;
            case 4: return <Step4 {...sharedProps} />;
            case 5: return <Step5 {...sharedProps} />;
            case 6: return <Step6 {...sharedProps} />;
            case 7: return <Step7 {...sharedProps} onConfirm={confirmBooking} onEdit={prevStep} />;
            case 8: return <Step8 errorBooking={errorBooking} />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Toaster position="top-right" />
            <Navigation />

            <header className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-6 py-5 shadow-lg">
                <div className="container mx-auto flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Wrench size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Book a Service</h1>
                        <p className="text-blue-100 text-sm">Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1]}</p>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 flex-1 max-w-2xl w-full">
                <ProgressBar currentStep={currentStep} />

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                    <AnimatePresence mode="wait">
                        {renderStep()}
                    </AnimatePresence>
                </div>

                {currentStep < STEPS.length && (
                    <div className="flex justify-between mt-6">
                        {currentStep > 1 ? (
                            <button
                                onClick={prevStep}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                            >
                                <ChevronLeft size={18} /> Previous
                            </button>
                        ) : <div />}

                        {currentStep < 7 && (
                            <button
                                onClick={nextStep}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors ml-auto"
                            >
                                Next <ChevronRight size={18} />
                            </button>
                        )}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default BookService;
