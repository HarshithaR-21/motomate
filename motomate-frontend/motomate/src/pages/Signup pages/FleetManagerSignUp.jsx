import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Car, Truck, Users, MapPin, Phone, Mail, Lock, User,
    Building, ChevronRight, ChevronLeft, CheckCircle,
    FileText, BarChart2, Shield, Upload, Hash
} from 'lucide-react';
import { validatePassword } from '../utils/passwordValidation';
import axios from 'axios';

const STEPS = [
    { id: 1, label: 'Manager Info', icon: User },
    { id: 2, label: 'Company Details', icon: Building },
    { id: 3, label: 'Fleet Info', icon: Truck },
    { id: 4, label: 'Documents', icon: FileText },
];

const VEHICLE_CATEGORIES = [
    'Sedans', 'SUVs', 'Hatchbacks', 'Pickup Trucks',
    'Commercial Trucks', 'Buses / Minibuses', 'Motorcycles',
    'Electric Vehicles (EV)', 'Auto Rickshaws', 'Vans / Tempos',
];

const INDUSTRY_TYPES = [
    'Logistics & Delivery',
    'Cab Aggregator / Taxi',
    'School / College Transport',
    'Corporate Employee Transport',
    'Tourism & Travel',
    'Healthcare / Ambulance',
    'Construction & Mining',
    'Government / Municipal',
    'Other',
];

const SERVICE_NEEDS = [
    'Scheduled Maintenance', 'Tyre Management', 'Emergency Breakdown',
    'Fuel Delivery', 'Oil Change', 'Battery Replacement',
    'GPS & Telematics', 'Driver Management', 'Insurance Claims Support',
];

const FleetManagerSignup = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');


    const [form, setForm] = useState({
        // Step 1 – Manager
        managerName: '',
        designation: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        // Step 2 – Company
        companyName: '',
        industryType: '',
        companyAddress: '',
        city: '',
        state: '',
        pincode: '',
        companyWebsite: '',
        companyDescription: '',
        // Step 3 – Fleet
        totalVehicles: '',
        vehicleCategories: [],
        serviceNeeds: [],
        primaryGarage: '',
        preferredServiceTime: '',
        hasDedicatedMechanic: false,
        // Step 4 – Docs
        gstNumber: '',
        panNumber: '',
        cinNumber: '',
        contactPersonAlt: '',
        altPhone: '',
        gstCertificateFile: null,
        companyPanCardFile: null,
        vehicleRcBookFile: null,
        authorizationLetterFile: null,
    });

    const [errors, setErrors] = useState({});

    const update = (field, value) => {
        setForm(f => ({ ...f, [field]: value }));
        setErrors(e => ({ ...e, [field]: '' }));
    };

    const toggleArray = (field, value) => {
        setForm(f => ({
            ...f,
            [field]: f[field].includes(value)
                ? f[field].filter(v => v !== value)
                : [...f[field], value],
        }));
    };

    const validateStep = () => {
        const e = {};
        if (step === 1) {
            if (!form.managerName.trim()) e.managerName = 'Required';
            if (!form.email.match(/^\S+@\S+\.\S+$/)) e.email = 'Valid email required';
            if (!form.phone.match(/^\d{10}$/)) e.phone = '10-digit phone required';
            const passwordValidation = validatePassword(form.password);
            if (!form.password) {
                e.password = 'Password is required';
            } else if (!passwordValidation.minLength) {
                e.password = 'Password must be at least 8 characters';
            } else if (!passwordValidation.hasUpper || !passwordValidation.hasLower || !passwordValidation.hasNumber || !passwordValidation.hasSpecial) {
                e.password = 'Password must include uppercase, lowercase, number, and special character';
            }
            if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
        }
        if (step === 2) {
            if (!form.companyName.trim()) e.companyName = 'Required';
            if (!form.industryType) e.industryType = 'Required';
            if (!form.companyAddress.trim()) e.companyAddress = 'Required';
            if (!form.city.trim()) e.city = 'Required';
            if (!form.state.trim()) e.state = 'Required';
            if (!form.pincode.match(/^\d{6}$/)) e.pincode = '6-digit pincode required';
        }
        if (step === 3) {
            if (!form.totalVehicles || form.totalVehicles < 1) e.totalVehicles = 'Enter a valid count';
            if (form.vehicleCategories.length === 0) e.vehicleCategories = 'Select at least one category';
            if (form.serviceNeeds.length === 0) e.serviceNeeds = 'Select at least one service need';
        }
        if (step === 4) {
            if (!form.gstNumber.trim()) e.gstNumber = 'Required';
            if (!form.panNumber.trim()) e.panNumber = 'Required';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => { if (validateStep()) setStep(s => s + 1); };
    const back = () => setStep(s => s - 1);

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setLoading(true);
        setApiError('');

        try {
            const formData = new FormData();

            // Append JSON payload as Blob
            formData.append(
                'data',
                new Blob([JSON.stringify(form)], { type: 'application/json' })
            );

            // Append uploaded files (if selected)
            if (form.gstCertificateFile) formData.append('gstCertificate', form.gstCertificateFile);
            if (form.companyPanCardFile) formData.append('companyPanCard', form.companyPanCardFile);
            if (form.vehicleRcBookFile) formData.append('vehicleRcBook', form.vehicleRcBookFile);
            if (form.authorizationLetterFile) formData.append('authorizationLetter', form.authorizationLetterFile);

            const response = await axios.post(
                'http://localhost:8080/api/v1/fleet-managers/register',
                formData, {withCredentials: true }
            );

            if (response.data.success) {
                setSubmitted(true);
            } else {
                setApiError(response.data.message || 'Submission failed. Please try again.');
            }

        } catch (err) {
            if (err.response) {
                // Server responded with a non-2xx status (e.g. 409 duplicate email, 400 validation)
                setApiError(err.response.data.message || 'Submission failed. Please try again.');
            } else if (err.request) {
                // Request was made but no response received
                setApiError('Unable to connect to the server. Please check your connection.');
            } else {
                setApiError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-3xl p-12 text-center max-w-md shadow-xl border border-gray-200"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Fleet Account Created!</h2>
                    <p className="text-gray-600 mb-8">
                        Welcome to MotoMate Fleet. Your account for <strong>{form.companyName}</strong> is being reviewed.
                        We'll reach out at <strong>{form.email}</strong> within 1–2 business days to activate your fleet dashboard.
                    </p>
                    <Link to="/">
                        <button className="w-full bg-linear-to-r from-green-500 to-green-600 text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity">
                            Back to Home
                        </button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Bar */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-linear-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                            <Truck size={20} className="text-white" />
                        </div>
                        <span className="font-bold text-gray-900 text-lg">Moto<span className="text-green-600">Mate</span></span>
                    </Link>
                    <span className="text-sm text-gray-500 font-medium">Fleet Manager Registration</span>
                </div>
            </nav>

            {/* Hero Banner */}
            <div className="bg-linear-to-r from-green-500 to-green-600 text-white py-8 px-6">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">Fleet Management Account</h1>
                        <p className="text-green-100 text-sm">Manage your entire vehicle fleet with one powerful dashboard.</p>
                    </div>
                    <div className="flex gap-6 text-center">
                        {[
                            { label: 'Fleet Vehicles', value: '1000+', icon: Truck },
                            { label: 'Service Centers', value: '50+', icon: Building },
                            { label: 'Uptime Rate', value: '98%', icon: BarChart2 },
                        ].map(({ label, value, icon: Icon }) => (
                            <div key={label}>
                                <Icon size={20} className="mx-auto text-green-200 mb-1" />
                                <div className="text-xl font-bold">{value}</div>
                                <div className="text-xs text-green-200">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-10">
                {/* Step Indicators */}
                <div className="flex items-center justify-between mb-10 relative">
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" />
                    <div
                        className="absolute top-5 left-0 h-0.5 bg-linear-to-r from-green-500 to-green-600 z-0 transition-all duration-500"
                        style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                    />
                    {STEPS.map(s => {
                        const Icon = s.icon;
                        const done = step > s.id;
                        const active = step === s.id;
                        return (
                            <div key={s.id} className="flex flex-col items-center z-10 relative">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${done ? 'bg-green-600 border-green-600' : active ? 'bg-white border-green-500 shadow-md' : 'bg-white border-gray-300'}`}>
                                    {done
                                        ? <CheckCircle size={18} className="text-white" />
                                        : <Icon size={18} className={active ? 'text-green-600' : 'text-gray-400'} />
                                    }
                                </div>
                                <span className={`text-xs mt-2 font-medium ${active ? 'text-green-600' : done ? 'text-gray-700' : 'text-gray-400'}`}>{s.label}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Form Card */}
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 md:p-10"
                >
                    {/* Step 1: Manager Info */}
                    {step === 1 && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Fleet Manager Information</h2>
                            <p className="text-gray-500 mb-8 text-sm">Primary contact person responsible for managing the fleet account.</p>
                            <div className="grid md:grid-cols-2 gap-5">
                                <Field label="Full Name" icon={User} error={errors.managerName}>
                                    <input className={inp(errors.managerName)} placeholder="Ramesh Kumar" value={form.managerName} onChange={e => update('managerName', e.target.value)} />
                                </Field>
                                <Field label="Designation" icon={Users}>
                                    <input className={inp()} placeholder="Fleet Manager / Operations Head" value={form.designation} onChange={e => update('designation', e.target.value)} />
                                </Field>
                                <Field label="Work Email" icon={Mail} error={errors.email}>
                                    <input className={inp(errors.email)} type="email" placeholder="ramesh@company.com" value={form.email} onChange={e => update('email', e.target.value)} />
                                </Field>
                                <Field label="Phone Number" icon={Phone} error={errors.phone}>
                                    <input className={inp(errors.phone)} placeholder="9876543210" maxLength={10} value={form.phone} onChange={e => update('phone', e.target.value)} />
                                </Field>
                                <Field label="Password" icon={Lock} error={errors.password}>
                                    <input className={inp(errors.password)} type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => update('password', e.target.value)} />
                                </Field>
                                <Field label="Confirm Password" icon={Lock} error={errors.confirmPassword}>
                                    <input className={inp(errors.confirmPassword)} type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
                                </Field>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Company Details */}
                    {step === 2 && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Company Details</h2>
                            <p className="text-gray-500 mb-8 text-sm">Tell us about your organization and where it operates.</p>
                            <div className="grid md:grid-cols-2 gap-5">
                                <Field label="Company / Organization Name" icon={Building} error={errors.companyName}>
                                    <input className={inp(errors.companyName)} placeholder="e.g. Rapid Logistics Pvt Ltd" value={form.companyName} onChange={e => update('companyName', e.target.value)} />
                                </Field>
                                <Field label="Industry Type" error={errors.industryType}>
                                    <select className={inp(errors.industryType)} value={form.industryType} onChange={e => update('industryType', e.target.value)}>
                                        <option value="">Select industry</option>
                                        {INDUSTRY_TYPES.map(i => <option key={i}>{i}</option>)}
                                    </select>
                                </Field>
                                <div className="md:col-span-2">
                                    <Field label="Registered Office Address" icon={MapPin} error={errors.companyAddress}>
                                        <input className={inp(errors.companyAddress)} placeholder="Street address" value={form.companyAddress} onChange={e => update('companyAddress', e.target.value)} />
                                    </Field>
                                </div>
                                <Field label="City" error={errors.city}>
                                    <input className={inp(errors.city)} placeholder="Bengaluru" value={form.city} onChange={e => update('city', e.target.value)} />
                                </Field>
                                <Field label="State" error={errors.state}>
                                    <input className={inp(errors.state)} placeholder="Karnataka" value={form.state} onChange={e => update('state', e.target.value)} />
                                </Field>
                                <Field label="Pincode" error={errors.pincode}>
                                    <input className={inp(errors.pincode)} placeholder="560001" maxLength={6} value={form.pincode} onChange={e => update('pincode', e.target.value)} />
                                </Field>
                                <Field label="Website (optional)">
                                    <input className={inp()} placeholder="https://yourcompany.com" value={form.companyWebsite} onChange={e => update('companyWebsite', e.target.value)} />
                                </Field>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Description</label>
                                    <textarea
                                        rows={3}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 resize-none"
                                        placeholder="Briefly describe your company and fleet operations..."
                                        value={form.companyDescription}
                                        onChange={e => update('companyDescription', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Fleet Info */}
                    {step === 3 && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Fleet Information</h2>
                            <p className="text-gray-500 mb-8 text-sm">Help us understand your fleet so we can assign the right resources.</p>

                            <div className="grid md:grid-cols-2 gap-5 mb-6">
                                <Field label="Total Number of Vehicles" icon={Hash} error={errors.totalVehicles}>
                                    <input
                                        type="number"
                                        className={inp(errors.totalVehicles)}
                                        placeholder="e.g. 25"
                                        min={1}
                                        value={form.totalVehicles}
                                        onChange={e => update('totalVehicles', e.target.value)}
                                    />
                                </Field>
                                <Field label="Primary Garage / Depot Location" icon={MapPin}>
                                    <input className={inp()} placeholder="City or area" value={form.primaryGarage} onChange={e => update('primaryGarage', e.target.value)} />
                                </Field>
                                <Field label="Preferred Service Time">
                                    <select className={inp()} value={form.preferredServiceTime} onChange={e => update('preferredServiceTime', e.target.value)}>
                                        <option value="">Select preference</option>
                                        <option>Early Morning (5AM–8AM)</option>
                                        <option>Morning (8AM–12PM)</option>
                                        <option>Afternoon (12PM–4PM)</option>
                                        <option>Evening (4PM–8PM)</option>
                                        <option>Night (8PM–11PM)</option>
                                        <option>Flexible</option>
                                    </select>
                                </Field>
                                <div className="flex items-end pb-1">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div
                                            onClick={() => update('hasDedicatedMechanic', !form.hasDedicatedMechanic)}
                                            className={`w-12 h-6 rounded-full transition-all duration-300 relative ${form.hasDedicatedMechanic ? 'bg-green-600' : 'bg-gray-300'}`}
                                        >
                                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${form.hasDedicatedMechanic ? 'left-6' : 'left-0.5'}`} />
                                        </div>
                                        <span className="text-sm text-gray-700 font-medium">Have in-house mechanic</span>
                                    </label>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Vehicle Categories in Fleet</label>
                                {errors.vehicleCategories && <p className="text-red-500 text-xs mb-2">{errors.vehicleCategories}</p>}
                                <div className="flex flex-wrap gap-2">
                                    {VEHICLE_CATEGORIES.map(v => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => toggleArray('vehicleCategories', v)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${form.vehicleCategories.includes(v)
                                                ? 'bg-green-600 text-white border-green-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'}`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Required Service Types</label>
                                {errors.serviceNeeds && <p className="text-red-500 text-xs mb-2">{errors.serviceNeeds}</p>}
                                <div className="flex flex-wrap gap-2">
                                    {SERVICE_NEEDS.map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => toggleArray('serviceNeeds', s)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${form.serviceNeeds.includes(s)
                                                ? 'bg-green-600 text-white border-green-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Documents */}
                    {step === 4 && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Business Verification</h2>
                            <p className="text-gray-500 mb-8 text-sm">Required for verifying your organization. All data is encrypted and secure.</p>
                            <div className="grid md:grid-cols-2 gap-5">
                                <Field label="GST Number" icon={FileText} error={errors.gstNumber}>
                                    <input className={inp(errors.gstNumber)} placeholder="22AAAAA0000A1Z5" value={form.gstNumber} onChange={e => update('gstNumber', e.target.value)} />
                                </Field>
                                <Field label="Company PAN" icon={FileText} error={errors.panNumber}>
                                    <input className={inp(errors.panNumber)} placeholder="ABCDE1234F" maxLength={10} value={form.panNumber} onChange={e => update('panNumber', e.target.value.toUpperCase())} />
                                </Field>
                                <Field label="CIN / LLPIN (if applicable)">
                                    <input className={inp()} placeholder="U12345KA2010PTC1234" value={form.cinNumber} onChange={e => update('cinNumber', e.target.value)} />
                                </Field>
                                <Field label="Alternate Contact Person">
                                    <input className={inp()} placeholder="Name" value={form.contactPersonAlt} onChange={e => update('contactPersonAlt', e.target.value)} />
                                </Field>
                                <Field label="Alternate Phone" icon={Phone}>
                                    <input className={inp()} placeholder="9876543210" maxLength={10} value={form.altPhone} onChange={e => update('altPhone', e.target.value)} />
                                </Field>
                            </div>

                            <div className="mt-6 grid md:grid-cols-2 gap-4">
                                {[
                                    { label: 'GST Certificate',          field: 'gstCertificateFile' },
                                    { label: 'Company PAN Card',         field: 'companyPanCardFile' },
                                    { label: 'Vehicle RC Book (sample)', field: 'vehicleRcBookFile' },
                                    { label: 'Authorization Letter',     field: 'authorizationLetterFile' },
                                ].map(({ label, field }) => (
                                    <div
                                        key={field}
                                        className={`border-2 border-dashed rounded-2xl p-5 text-center transition-colors ${
                                            form[field] ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-green-400'
                                        }`}
                                    >
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="hidden"
                                            id={field}
                                            onChange={e => update(field, e.target.files[0] || null)}
                                        />
                                        <label htmlFor={field} className="cursor-pointer block">
                                            <Upload
                                                size={22}
                                                className={`mx-auto mb-2 ${form[field] ? 'text-green-500' : 'text-gray-400'}`}
                                            />
                                            <p className={`text-sm font-medium truncate px-2 ${form[field] ? 'text-green-700' : 'text-gray-700'}`}>
                                                {form[field] ? form[field].name : `Upload ${label}`}
                                            </p>
                                            <p className="text-xs mt-1 text-gray-400">
                                                {form[field] ? '✓ File selected — click to change' : 'PDF, JPG or PNG (max 5MB)'}
                                            </p>
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex gap-3">
                                <Shield size={20} className="text-green-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-green-700">
                                    Your documents are encrypted and will only be used for verification by our compliance team.
                                    Fleet accounts are typically activated within 1–2 business days.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
                        {step > 1 ? (
                            <button onClick={back} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                                <ChevronLeft size={18} /> Back
                            </button>
                        ) : (
                            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">← Back to Home</Link>
                        )}
                        {step < STEPS.length ? (
                            <button onClick={next} className="flex items-center gap-2 bg-linear-to-r from-green-500 to-green-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-md">
                                Continue <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button onClick={handleSubmit} className="flex items-center gap-2 bg-linear-to-r from-green-500 to-green-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-md">
                                Create Fleet Account <CheckCircle size={18} />
                            </button>
                        )}
                    </div>
                </motion.div>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Already have a fleet account?{' '}
                    <Link to="/login" className="text-green-600 font-medium hover:underline">Login here</Link>
                </p>
            </div>
        </div>
    );
};

/* Helpers */
const inp = (err) =>
    `w-full border ${err ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-green-300 focus:border-green-400'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all bg-white`;

const Field = ({ label, icon: Icon, error, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {Icon && <Icon size={13} className="inline mr-1.5 text-gray-400" />}
            {label}
        </label>
        {children}
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

export default FleetManagerSignup;