import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle } from 'lucide-react';
import { SectionLabel, StepHeader } from '../components/SharedUI';

const Step7 = ({ formData, onChange }) => (
    <motion.div key="step7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
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
                <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={e => onChange('uploadedFiles', Array.from(e.target.files))}
                />
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

export default Step7;
