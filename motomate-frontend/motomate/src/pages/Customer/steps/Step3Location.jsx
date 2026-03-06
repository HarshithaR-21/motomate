import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CheckCircle, Home, Wrench } from 'lucide-react';
import { CardInput, SectionLabel, StepHeader } from '../components/SharedUI';

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

export default Step3;
