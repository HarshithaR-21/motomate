import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car, Building, MapPin, Phone, Mail, Lock, User, Clock,
  Wrench, ChevronRight, ChevronLeft, Upload, CheckCircle,
  Globe, FileText, Star, Camera
} from 'lucide-react';
import { validatePassword } from '../utils/passwordValidation';
import {toast, Toaster} from 'react-hot-toast'
import axios from 'axios';
import { Spinner } from '../Admin/components/UI';

const STEPS = [
  { id: 1, label: 'Owner Info', icon: User },
  { id: 2, label: 'Center Details', icon: Building },
  { id: 3, label: 'Services & Hours', icon: Wrench },
  { id: 4, label: 'Documents', icon: FileText },
];

const SERVICE_TYPES = [
  'General Servicing', 'Oil Change', 'Tyre Replacement', 'Battery Service',
  'Brake Repair', 'AC Repair', 'Bodywork & Denting', 'Painting',
  'Engine Repair', 'Transmission Repair', 'EV Servicing', 'Roadside Assistance',
];

const VEHICLE_TYPES = ['Cars', 'Bikes', 'Trucks', 'Buses', 'EVs', 'Auto Rickshaws'];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ServiceCenterSignup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    // Step 1 – Owner
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Step 2 – Center
    centerName: '',
    centerType: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    website: '',
    description: '',
    // Step 3 – Services
    services: [],
    vehicleTypes: [],
    openDays: [],
    openTime: '09:00',
    closeTime: '19:00',
    emergencyService: false,
    // Step 4 – Docs
    gstNumber: '',
    panNumber: '',
    licenseNumber: '',
    yearsInBusiness: '',
    totalBays: '',
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
      if (!form.ownerName.trim()) e.ownerName = 'Required';
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
      if (!form.centerName.trim()) e.centerName = 'Required';
      if (!form.address.trim()) e.address = 'Required';
      if (!form.city.trim()) e.city = 'Required';
      if (!form.state.trim()) e.state = 'Required';
      if (!form.pincode.match(/^\d{6}$/)) e.pincode = '6-digit pincode required';
    }
    if (step === 3) {
      if (form.services.length === 0) e.services = 'Select at least one service';
      if (form.vehicleTypes.length === 0) e.vehicleTypes = 'Select at least one vehicle type';
      if (form.openDays.length === 0) e.openDays = 'Select at least one working day';
    }
    if (step === 4) {
      if (!form.gstNumber.trim()) e.gstNumber = 'Required';
      if (!form.panNumber.trim()) {
        e.panNumber = 'Required';
      } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.panNumber)) {
        e.panNumber = 'Invalid PAN format (e.g. ABCDE1234F) — 5 letters, 4 digits, 1 letter';
      }
      if (!form.licenseNumber.trim()) e.licenseNumber = 'Required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);



const handleSubmit = async () => {
  if (!validateStep()) return;

  setLoading(true);
  setApiError('');

  try {
    // Destructure File objects out so they don't get into the JSON blob
    const { gstCertificateFile, tradeLicenseFile, shopPhotoFile, ...jsonFields } = form;

    const formData = new FormData();

    // 'data' part — pure JSON, matches @RequestPart("data") on Spring side
    formData.append(
      'data',
      new Blob([JSON.stringify(jsonFields)], { type: 'application/json' })
    );

    // File parts — each matches a @RequestPart("gstCertificate") etc.
    if (gstCertificateFile) formData.append('gstCertificate', gstCertificateFile);
    if (tradeLicenseFile)   formData.append('tradeLicense',   tradeLicenseFile);
    if (shopPhotoFile)      formData.append('shopPhoto',      shopPhotoFile);

    // Do NOT set Content-Type header — let the browser set it with the boundary
    const response = await axios.post(
      'http://localhost:8080/api/v1/service-centers/register',
      formData,
      { withCredentials: true }
    );

    if (response.data?.success) {
      setSubmitted(true);
      toast.success('Request has been sent. Please wait for reply from our side!');
    } else {
      const msg = response.data?.message || 'Submission failed. Please try again.';
      setApiError(msg);
      toast.error(msg);
    }

  } catch (err) {
    // If Spring returns field-level errors in data, pin them onto the form fields
    const fieldErrors = err.response?.data?.data;
    if (fieldErrors && typeof fieldErrors === 'object') {
      setErrors(prev => ({ ...prev, ...fieldErrors }));
      // Navigate back to the step that owns the failing field
      const fieldStepMap = {
        ownerName: 1, email: 1, phone: 1, password: 1, confirmPassword: 1,
        centerName: 2, centerType: 2, address: 2, city: 2, state: 2, pincode: 2,
        services: 3, vehicleTypes: 3, openDays: 3, openTime: 3, closeTime: 3,
        gstNumber: 4, panNumber: 4, licenseNumber: 4,
      };
      const firstFailingStep = Object.keys(fieldErrors)
        .map(f => fieldStepMap[f])
        .filter(Boolean)
        .sort()[0];
      if (firstFailingStep) setStep(firstFailingStep);
    }
    const msg = err.response?.data?.message
      || 'Unable to connect to the server. Please check your internet connection.';
    setApiError(msg);
    toast.error(msg);

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
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
          <p className="text-gray-600 mb-8">
            Your service center registration is under review. We'll verify your documents and
            notify you at <strong>{form.email}</strong> within 2–3 business days.
          </p>
          <Link to="/">
            <button className="w-full bg-linear-to-r from-blue-500 to-blue-600 text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity">
              Back to Home
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      {/* Top Bar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-linear-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Car size={20} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">Moto<span className="text-blue-500">Mate</span></span>
          </Link>
          <span className="text-sm text-gray-500 font-medium">Service Center Registration</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-10 relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-linear-to-r from-blue-500 to-blue-600 z-0 transition-all duration-500"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
          {STEPS.map(s => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex flex-col items-center z-10 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${done ? 'bg-blue-600 border-blue-600' : active ? 'bg-white border-blue-500 shadow-md' : 'bg-white border-gray-300'}`}>
                  {done
                    ? <CheckCircle size={18} className="text-white" />
                    : <Icon size={18} className={active ? 'text-blue-600' : 'text-gray-400'} />
                  }
                </div>
                <span className={`text-xs mt-2 font-medium ${active ? 'text-blue-600' : done ? 'text-gray-700' : 'text-gray-400'}`}>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 md:p-10"
        >
          {/* Step 1: Owner Info */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Owner Information</h2>
              <p className="text-gray-500 mb-8 text-sm">Tell us about the person managing this service center.</p>
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Full Name" icon={User} error={errors.ownerName}>
                  <input className={input(errors.ownerName)} placeholder="John Doe" value={form.ownerName} onChange={e => update('ownerName', e.target.value)} />
                </Field>
                <Field label="Email Address" icon={Mail} error={errors.email}>
                  <input className={input(errors.email)} type="email" placeholder="john@example.com" value={form.email} onChange={e => update('email', e.target.value)} />
                </Field>
                <Field label="Phone Number" icon={Phone} error={errors.phone}>
                  <input className={input(errors.phone)} placeholder="9876543210" maxLength={10} value={form.phone} onChange={e => update('phone', e.target.value)} />
                </Field>
                <div /> {/* spacer */}
                <Field label="Password" icon={Lock} error={errors.password}>
                  <input className={input(errors.password)} type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => update('password', e.target.value)} />
                </Field>
                <Field label="Confirm Password" icon={Lock} error={errors.confirmPassword}>
                  <input className={input(errors.confirmPassword)} type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {/* Step 2: Center Details */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Service Center Details</h2>
              <p className="text-gray-500 mb-8 text-sm">Provide information about your workshop or garage.</p>
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Center Name" icon={Building} error={errors.centerName}>
                  <input className={input(errors.centerName)} placeholder="e.g. Speedy Auto Works" value={form.centerName} onChange={e => update('centerName', e.target.value)} />
                </Field>
                <Field label="Center Type" icon={Wrench} error={errors.centerType}>
                  <select className={input(errors.centerType)} value={form.centerType} onChange={e => update('centerType', e.target.value)}>
                    <option value="">Select type</option>
                    <option>Garage / Workshop</option>
                    <option>Authorized Service Center</option>
                    <option>Multi-Brand Service Center</option>
                    <option>EV Specialist</option>
                    <option>Mobile Service Unit</option>
                  </select>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Full Address" icon={MapPin} error={errors.address}>
                    <input className={input(errors.address)} placeholder="Street address" value={form.address} onChange={e => update('address', e.target.value)} />
                  </Field>
                </div>
                <Field label="Landmark" icon={MapPin}>
                  <input className={input()} placeholder="Near/opposite landmark" value={form.landmark} onChange={e => update('landmark', e.target.value)} />
                </Field>
                <Field label="City" error={errors.city}>
                  <input className={input(errors.city)} placeholder="Bengaluru" value={form.city} onChange={e => update('city', e.target.value)} />
                </Field>
                <Field label="State" error={errors.state}>
                  <input className={input(errors.state)} placeholder="Karnataka" value={form.state} onChange={e => update('state', e.target.value)} />
                </Field>
                <Field label="Pincode" error={errors.pincode}>
                  <input className={input(errors.pincode)} placeholder="560001" maxLength={6} value={form.pincode} onChange={e => update('pincode', e.target.value)} />
                </Field>
                <Field label="Website (optional)" icon={Globe}>
                  <input className={input()} placeholder="https://yoursite.com" value={form.website} onChange={e => update('website', e.target.value)} />
                </Field>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Brief Description</label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 resize-none"
                    placeholder="What makes your service center unique?"
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Services & Hours */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Services & Working Hours</h2>
              <p className="text-gray-500 mb-8 text-sm">Select what you offer and when you're open.</p>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Services Offered</label>
                {errors.services && <p className="text-red-500 text-xs mb-2">{errors.services}</p>}
                <div className="flex flex-wrap gap-2">
                  {SERVICE_TYPES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleArray('services', s)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${form.services.includes(s)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Vehicle Types Serviced</label>
                {errors.vehicleTypes && <p className="text-red-500 text-xs mb-2">{errors.vehicleTypes}</p>}
                <div className="flex flex-wrap gap-2">
                  {VEHICLE_TYPES.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => toggleArray('vehicleTypes', v)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${form.vehicleTypes.includes(v)
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Working Days</label>
                {errors.openDays && <p className="text-red-500 text-xs mb-2">{errors.openDays}</p>}
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleArray('openDays', d)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${form.openDays.includes(d)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}
                    >
                      {d.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                <Field label="Opening Time" icon={Clock}>
                  <input type="time" className={input()} value={form.openTime} onChange={e => update('openTime', e.target.value)} />
                </Field>
                <Field label="Closing Time" icon={Clock}>
                  <input type="time" className={input()} value={form.closeTime} onChange={e => update('closeTime', e.target.value)} />
                </Field>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => update('emergencyService', !form.emergencyService)}
                      className={`w-12 h-6 rounded-full transition-all duration-300 relative ${form.emergencyService ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${form.emergencyService ? 'left-6' : 'left-0.5'}`} />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">24/7 Emergency</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Business Documents</h2>
              <p className="text-gray-500 mb-8 text-sm">These details are used for verification and will remain confidential.</p>
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="GST Number" icon={FileText} error={errors.gstNumber}>
                  <input className={input(errors.gstNumber)} placeholder="22AAAAA0000A1Z5" value={form.gstNumber} onChange={e => update('gstNumber', e.target.value)} />
                </Field>
                <Field label="PAN Number" icon={FileText} error={errors.panNumber}>
                  <input className={input(errors.panNumber)} placeholder="ABCDE1234F" maxLength={10} value={form.panNumber} onChange={e => update('panNumber', e.target.value.toUpperCase())} />
                </Field>
                <Field label="Trade / Shop License Number" icon={FileText} error={errors.licenseNumber}>
                  <input className={input(errors.licenseNumber)} placeholder="License number" value={form.licenseNumber} onChange={e => update('licenseNumber', e.target.value)} />
                </Field>
                <Field label="Years in Business">
                  <input type="number" className={input()} placeholder="e.g. 5" min={0} value={form.yearsInBusiness} onChange={e => update('yearsInBusiness', e.target.value)} />
                </Field>
                <Field label="Total Service Bays">
                  <input type="number" className={input()} placeholder="e.g. 8" min={1} value={form.totalBays} onChange={e => update('totalBays', e.target.value)} />
                </Field>
              </div>

              {/* File uploads — wired to form state */}
              <div className="mt-6 grid md:grid-cols-2 gap-4">
                {[
                  { label: 'GST Certificate', field: 'gstCertificateFile' },
                  { label: 'Trade License',   field: 'tradeLicenseFile'   },
                  { label: 'Shop Photo',      field: 'shopPhotoFile'      },
                ].map(({ label, field }) => (
                  <label
                    key={field}
                    className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer block"
                  >
                    <Upload size={24} className={`mx-auto mb-2 ${form[field] ? 'text-blue-500' : 'text-gray-400'}`} />
                    <p className="text-sm font-medium text-gray-700">
                      {form[field] ? form[field].name : `Upload ${label}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {form[field] ? `${(form[field].size / 1024).toFixed(1)} KB` : 'PDF, JPG or PNG (max 5MB)'}
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 5 * 1024 * 1024) {
                          toast.error(`${label} must be under 5MB`);
                          return;
                        }
                        update(field, file ?? null);
                      }}
                    />
                  </label>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Your application will be reviewed by the MotoMate team within 2–3 business days.
                  You'll be notified via email once your service center is approved and live on the platform.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button onClick={back} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronLeft size={18} /> Back
              </button>
            ) : (
              <Link to="/" className={loading ? "pointer-events-none opacity-50" : "text-sm text-gray-500 hover:text-gray-700 transition-colors"}>← Back to Home</Link>
            )}
            {step < STEPS.length ? (
              <button onClick={next} className="flex items-center gap-2 bg-linear-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-md">
                Continue <ChevronRight size={18} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 bg-linear-to-r from-green-500 to-green-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <>
                    <Spinner size={18} /> Submitting...
                  </>
                ) : (
                  <>Submit Application <CheckCircle size={18} /></>
                )}
              </button>
            )}
          </div>
        </motion.div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
};

/* Helpers */
const input = (err) =>
  `w-full border ${err ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300 focus:border-blue-400'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all bg-white`;

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

export default ServiceCenterSignup;