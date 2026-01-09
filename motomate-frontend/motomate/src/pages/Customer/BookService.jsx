import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    ChevronLeft,
    Car,
    Bike,
    MapPin,
    Calendar,
    DollarSign,
    FileText,
    CheckCircle,
    Upload,
    AlertTriangle
} from 'lucide-react';
import Navigation from '../../Components/Navigation';
import Footer from '../../Components/Footer';

const BookService = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        vehicleType: '',
        selectedVehicle: '',
        brand: '',
        model: '',
        fuelType: '',
        vehicleNumber: '',
        selectedServices: [],
        serviceLocation: '',
        manualAddress: '',
        serviceMode: '',
        selectedDate: '',
        selectedTime: '',
        urgency: 'Normal',
        additionalNotes: '',
        uploadedFiles: [],
    });

    const totalSteps = 8;

    // Service options
    const serviceOptions = [
        'General Service', 'Periodic Maintenance', 'Oil Change', 'Brake Service',
        'Battery Issue', 'Tyre Issue', 'Engine Check', 'Electrical Repair', 'AC Service'
    ];

    // Cost estimates (dummy data)
    const costEstimates = {
        'General Service': 500,
        'Periodic Maintenance': 800,
        'Oil Change': 300,
        'Brake Service': 600,
        'Battery Issue': 400,
        'Tyre Issue': 250,
        'Engine Check': 700,
        'Electrical Repair': 550,
        'AC Service': 450,
    };

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleServiceToggle = (service) => {
        const updatedServices = formData.selectedServices.includes(service)
            ? formData.selectedServices.filter(s => s !== service)
            : [...formData.selectedServices, service];
        setFormData({ ...formData, selectedServices: updatedServices });
    };

    const calculateTotal = () => {
        const serviceTotal = formData.selectedServices.reduce((sum, service) => sum + (costEstimates[service] || 0), 0);
        const emergencyCharge = formData.urgency === 'Emergency' ? 200 : 0;
        return serviceTotal + emergencyCharge;
    };

    const nextStep = () => {
        if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const confirmBooking = () => {
        // Simulate booking confirmation
        setCurrentStep(8);
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                        <h2 className="text-2xl font-bold text-blue-800 mb-6">1. Vehicle Selection</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Vehicle Type</label>
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => handleInputChange('vehicleType', 'Car')}
                                        className={`flex items-center p-4 border rounded-lg ${formData.vehicleType === 'Car' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                                    >
                                        <Car className="mr-2" /> Car
                                    </button>
                                    <button
                                        onClick={() => handleInputChange('vehicleType', 'Bike')}
                                        className={`flex items-center p-4 border rounded-lg ${formData.vehicleType === 'Bike' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                                    >
                                        <Bike className="mr-2" /> Bike
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Vehicle (Saved or Add New)</label>
                                <select
                                    value={formData.selectedVehicle}
                                    onChange={(e) => handleInputChange('selectedVehicle', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                >
                                    <option value="">Choose a vehicle</option>
                                    <option value="Toyota Camry">Toyota Camry</option>
                                    <option value="Honda Civic">Honda Civic</option>
                                    <option value="Add New">Add New</option>
                                </select>
                            </div>
                            {formData.selectedVehicle === 'Add New' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Brand"
                                        value={formData.brand}
                                        onChange={(e) => handleInputChange('brand', e.target.value)}
                                        className="p-3 border border-gray-300 rounded-lg"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Model"
                                        value={formData.model}
                                        onChange={(e) => handleInputChange('model', e.target.value)}
                                        className="p-3 border border-gray-300 rounded-lg"
                                    />
                                    <select
                                        value={formData.fuelType}
                                        onChange={(e) => handleInputChange('fuelType', e.target.value)}
                                        className="p-3 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">Fuel Type</option>
                                        <option value="Petrol">Petrol</option>
                                        <option value="Diesel">Diesel</option>
                                        <option value="EV">EV</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Vehicle Number (Optional)"
                                        value={formData.vehicleNumber}
                                        onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                                        className="p-3 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                        <h2 className="text-2xl font-bold text-blue-800 mb-6">2. Service Type Selection</h2>
                        <p className="text-gray-600 mb-4">Select one or more services (checkbox-based)</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {serviceOptions.map((service) => (
                                <label key={service} className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.selectedServices.includes(service)}
                                        onChange={() => handleServiceToggle(service)}
                                        className="form-checkbox h-5 w-5 text-blue-600"
                                    />
                                    <span>{service}</span>
                                </label>
                            ))}
                        </div>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                        <h2 className="text-2xl font-bold text-blue-800 mb-6">3. Location & Service Mode</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Service Location</label>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleInputChange('serviceLocation', 'Current Location')}
                                        className={`w-full flex items-center p-3 border rounded-lg ${formData.serviceLocation === 'Current Location' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                                    >
                                        <MapPin className="mr-2" /> Current Location (GPS)
                                    </button>
                                    <button
                                        onClick={() => handleInputChange('serviceLocation', 'Manual')}
                                        className={`w-full flex items-center p-3 border rounded-lg ${formData.serviceLocation === 'Manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                                    >
                                        Enter Address Manually
                                    </button>
                                    {formData.serviceLocation === 'Manual' && (
                                        <textarea
                                            placeholder="Enter address"
                                            value={formData.manualAddress}
                                            onChange={(e) => handleInputChange('manualAddress', e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg mt-2"
                                            rows="3"
                                        />
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Service Mode</label>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleInputChange('serviceMode', 'Doorstep')}
                                        className={`w-full p-3 border rounded-lg ${formData.serviceMode === 'Doorstep' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                                    >
                                        Doorstep Service
                                    </button>
                                    <button
                                        onClick={() => handleInputChange('serviceMode', 'Service Center')}
                                        className={`w-full p-3 border rounded-lg ${formData.serviceMode === 'Service Center' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                                    >
                                        Service Center
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            case 4:
                return (
                    <motion.div key="step4" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                        <h2 className="text-2xl font-bold text-blue-800 mb-6">4. Schedule Booking</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                                <input
                                    type="date"
                                    value={formData.selectedDate}
                                    onChange={(e) => handleInputChange('selectedDate', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Time Slot</label>
                                <select
                                    value={formData.selectedTime}
                                    onChange={(e) => handleInputChange('selectedTime', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                >
                                    <option value="">Choose a time</option>
                                    <option value="9:00 AM">9:00 AM</option>
                                    <option value="11:00 AM">11:00 AM</option>
                                    <option value="2:00 PM">2:00 PM</option>
                                    <option value="4:00 PM">4:00 PM</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => handleInputChange('urgency', 'Normal')}
                                        className={`p-3 border rounded-lg ${formData.urgency === 'Normal' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                                    >
                                        Normal
                                    </button>
                                    <button
                                        onClick={() => handleInputChange('urgency', 'Emergency')}
                                        className={`p-3 border rounded-lg ${formData.urgency === 'Emergency' ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    >
                                        Emergency (Extra Charges)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            case 5:
                return (
                    <motion.div key="step5" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                        <h2 className="text-2xl font-bold text-blue-800 mb-6">5. Cost Estimate</h2>
                        <div className="bg-blue-50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4">Estimated Costs</h3>
                            <ul className="space-y-2 mb-4">
                                {formData.selectedServices.map((service) => (
                                    <li key={service} className="flex justify-between">
                                        <span>{service}</span>
                                        <span>₹{costEstimates[service]}</span>
                                    </li>
                                ))}
                                {formData.urgency === 'Emergency' && (
                                    <li className="flex justify-between text-red-600">
                                        <span>Emergency Charge</span>
                                        <span>₹200</span>
                                    </li>
                                )}
                            </ul>
                            <div className="flex justify-between font-bold text-lg border-t pt-4">
                                <span>Total Estimated Amount</span>
                                <span>₹{calculateTotal()}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-4 flex items-center">
                                <AlertTriangle className="mr-2 text-yellow-500" size={16} />
                                Final cost may vary after inspection
                            </p>
                        </div>
                    </motion.div>
                );
            case 6:
                return (
                    <motion.div key="step6" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                        <h2 className="text-2xl font-bold text-blue-800 mb-6">6. Additional Notes</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Describe the Issue (Optional)</label>
                                <textarea
                                    value={formData.additionalNotes}
                                    onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                    rows="4"
                                    placeholder="Provide any additional details..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image/Video (Optional)</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,video/*"
                                    onChange={(e) => handleInputChange('uploadedFiles', Array.from(e.target.files))}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                />
                                <div className="flex items-center mt-2">
                                    <Upload className="mr-2 text-gray-500" size={20} />
                                    <span className="text-sm text-gray-600">Upload files to help us understand the issue better</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            case 7:
                return (
                    <motion.div key="step7" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                        <h2 className="text-2xl font-bold text-blue-800 mb-6">7. Confirmation</h2>
                        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                            <div><strong>Vehicle:</strong> {formData.vehicleType} - {formData.selectedVehicle || `${formData.brand} ${formData.model}`}</div>
                            <div><strong>Services:</strong> {formData.selectedServices.join(', ')}</div>
                            <div><strong>Date & Time:</strong> {formData.selectedDate} at {formData.selectedTime}</div>
                            <div><strong>Location:</strong> {formData.serviceLocation === 'Manual' ? formData.manualAddress : 'Current Location'}</div>
                            <div><strong>Estimated Cost:</strong> ₹{calculateTotal()}</div>
                        </div>
                        <div className="flex space-x-4 mt-6">
                            <button onClick={confirmBooking} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                                Confirm Booking
                            </button>
                            <button onClick={prevStep} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400">
                                Edit
                            </button>
                        </div>
                    </motion.div>
                );
            case 8:
                return (
                    <motion.div key="step8" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                        <div className="text-center">
                            <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
                            <h2 className="text-2xl font-bold text-blue-800 mb-4">Booking Confirmed!</h2>
                            <p className="text-gray-600 mb-6">Your booking ID is <strong>BS123456</strong>. A mechanic has been assigned.</p>
                            <button
                                onClick={() => window.location.href = '/live-tracking'}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                            >
                                Go to Live Service Tracking
                            </button>
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Navigation />
            <header className="bg-blue-600 text-white p-3 shadow-md">
                <div className="container mx-auto">
                    <h1 className="text-2xl font-bold">Book Service</h1>
                    <p className="text-blue-100 mt-4">Step {currentStep} of {totalSteps}</p>
                </div>
            </header>
            <main className="container mx-auto p-6">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        {Array.from({ length: totalSteps }, (_, i) => (
                            <div key={i} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${i + 1 <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                                    }`}>
                                    {i + 1}
                                </div>
                                {i < totalSteps - 1 && (
                                    <div className={`flex-1 h-1 mx-2 ${i + 1 < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                    <AnimatePresence mode="wait">
                        {renderStep()}
                    </AnimatePresence>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                    {currentStep > 1 && (
                        <button
                            onClick={prevStep}
                            className="flex items-center bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                            <ChevronLeft className="mr-2" size={20} />
                            Previous
                        </button>
                    )}
                    {currentStep < totalSteps && (
                        <button
                            onClick={nextStep}
                            disabled={
                                (currentStep === 1 && (!formData.vehicleType || !formData.selectedVehicle)) ||
                                (currentStep === 2 && formData.selectedServices.length === 0) ||
                                (currentStep === 3 && (!formData.serviceLocation || !formData.serviceMode)) ||
                                (currentStep === 4 && (!formData.selectedDate || !formData.selectedTime))
                            }
                            className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed ml-auto"
                        >
                            Next
                            <ChevronRight className="ml-2" size={20} />
                        </button>
                    )}
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default BookService;