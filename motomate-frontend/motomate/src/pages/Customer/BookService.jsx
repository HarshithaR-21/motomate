import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Wrench } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';

import Navigation from '../../Components/Navigation';
import Footer from '../../Components/Footer';


import { convertTo24 } from './utils';
import ProgressBar from './components/ProgressBar';
import Step1 from './Steps/Step1Vehicle';
import Step2 from './steps/Step2Services';
import Step3 from './steps/Step3Location';
import Step4 from './steps/Step4Schedule';
import Step5 from './steps/Step5Estimate';
import Step6 from './steps/Step6Notes';
import Step7 from './steps/Step7Confirm';
import Step8 from './steps/Step8Done';
import { INITIAL_FORM, STEPS } from './constants';
import { fetchUser } from './fetchUser';



const BookService = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [errorBooking, setErrorBooking] = useState(false);

    // Fetch current user on mount
    const hasRef = useRef(false);
    useEffect(() => {
        if(hasRef.current)
            return;
        hasRef.current = true;
        const getUser = async () => {
            const responseData = await fetchUser();
            console.log("userId:", responseData.userId);
            setFormData(prev => ({ ...prev, userId: responseData.userId }));
        }
        getUser();
    }, []);

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
            //console.log('Booking payload:', payload);
            const response = await axios.post('http://localhost:8080/api/services/book-service', payload, { withCredentials: true });
            if (response.status === 200 || response.status === 201) {
                //console.log('Booking successful:', response.data);
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

            <header className="bg-linear-to-r from-blue-700 to-blue-500 text-white px-6 py-5 shadow-lg">
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
