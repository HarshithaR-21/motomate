import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

const Step9 = ({ errorBooking }) => (
    <motion.div key="step9" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="py-8 text-center">
        {errorBooking ? (
            <>
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
                    <XCircle size={40} className="text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Booking Failed</h2>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto">Something went wrong. Please try again or contact our support team.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-red-500 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-red-600 transition-colors"
                >
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

export default Step9;
