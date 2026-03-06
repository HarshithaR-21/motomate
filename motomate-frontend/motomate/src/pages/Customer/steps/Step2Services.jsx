import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SERVICE_OPTIONS } from '../constants';
import { ServiceCard, StepHeader } from '../components/SharedUI';

const Step2 = ({ formData, onToggle }) => (
    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
        <StepHeader title="Choose Services" subtitle="Select one or more services required" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SERVICE_OPTIONS.map(service => (
                <ServiceCard
                    key={service.id}
                    service={service}
                    selected={formData.selectedServices.includes(service.id)}
                    onClick={onToggle}
                />
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

export default Step2;
