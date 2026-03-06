import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Bike, CheckCircle } from 'lucide-react';
import { CardInput, SectionLabel, StepHeader } from '../components/SharedUI';

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

export default Step1;
