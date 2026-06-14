import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Bike, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { CardInput, SectionLabel, StepHeader } from '../components/SharedUI';

const BASE = 'http://localhost:8080';

// ── Brand / Model data ────────────────────────────────────────────────────────
const CAR_BRANDS = {
    'Hyundai':       ['i10', 'i20', 'Creta', 'Venue', 'Verna', 'Tucson', 'Exter'],
    'Tata':          ['Nexon', 'Tiago', 'Punch', 'Harrier', 'Safari', 'Altroz', 'Tigor'],
    'Maruti Suzuki': ['Alto', 'Swift', 'Baleno', 'Dzire', 'Ertiga', 'Brezza', 'Grand Vitara', 'Fronx'],
    'Honda Cars':    ['City', 'Amaze', 'Jazz', 'WR-V', 'Elevate'],
    'Toyota':        ['Innova Crysta', 'Innova HyCross', 'Fortuner', 'Glanza', 'Urban Cruiser Hyryder'],
    'Kia':           ['Seltos', 'Sonet', 'Carens', 'EV6'],
    'MG':            ['Hector', 'Astor', 'ZS EV', 'Comet EV'],
    'Volkswagen':    ['Polo', 'Vento', 'Taigun', 'Virtus'],
    'Skoda':         ['Slavia', 'Kushaq', 'Octavia', 'Superb'],
    'Renault':       ['Kwid', 'Triber', 'Kiger'],
    'Nissan':        ['Magnite'],
    'Ford':          ['EcoSport', 'Figo', 'Endeavour'],
    'Jeep':          ['Compass', 'Meridian', 'Grand Cherokee'],
    'Mahindra':      ['Thar', 'XUV700', 'XUV400', 'Scorpio', 'Bolero', 'BE6'],
};

const BIKE_BRANDS = {
    'Honda Bikes':   ['Activa', 'Shine', 'Unicorn', 'CB300R', 'Hornet', 'CB500F', 'CBR650R'],
    'Yamaha':        ['R15', 'MT-15', 'FZ-S', 'FZ25', 'RayZR', 'Fascino', 'Aerox 155'],
    'Hero':          ['Splendor Plus', 'HF Deluxe', 'Passion Pro', 'Glamour', 'XPulse 200', 'Xtreme 160R'],
    'Bajaj':         ['Pulsar 125', 'Pulsar 150', 'Pulsar NS200', 'Pulsar RS200', 'Dominar 400', 'Avenger'],
    'TVS':           ['Apache RTR 160', 'Apache RTR 200', 'Jupiter', 'Ntorq 125', 'XL100', 'Raider 125'],
    'KTM':           ['Duke 125', 'Duke 200', 'Duke 390', 'RC 200', 'RC 390', 'Adventure 250'],
    'Royal Enfield': ['Bullet 350', 'Classic 350', 'Meteor 350', 'Thunderbird', 'Himalayan', 'Interceptor 650'],
    'Suzuki':        ['Gixxer 150', 'Gixxer SF 250', 'Access 125', 'Avenis 125', 'Hayabusa'],
    'Kawasaki':      ['Ninja 300', 'Ninja 400', 'Z650', 'Versys 650', 'Ninja H2'],
};

const OTHER_OPTION = '__OTHER__';

// Indian vehicle number: AA00AA0000 or AA00A0000 patterns
const VEHICLE_NUMBER_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{1,4}$/;

const validateVehicleNumber = (num) => {
    if (!num || !num.trim()) return 'Vehicle number is required';
    const clean = num.replace(/[-\s]/g, '').toUpperCase();
    if (!VEHICLE_NUMBER_REGEX.test(clean)) return 'Invalid format — use KA01AB1234 or KA01A1234';
    return null;
};

// ── ComboSelect: dropdown + "type your own" fallback ─────────────────────────
const ComboSelect = ({ label, value, options, onChange, onBlur, disabled, placeholder, error }) => {
    const isCustom = value && !options.includes(value);
    const [mode, setMode] = useState(isCustom ? 'custom' : 'select');

    const handleSelectChange = (e) => {
        if (e.target.value === OTHER_OPTION) { setMode('custom'); onChange(''); }
        else { setMode('select'); onChange(e.target.value); }
    };

    const switchToSelect = () => { setMode('select'); onChange(''); };

    const cls = `w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none bg-white text-sm
        ${error ? 'border-red-400' : 'border-gray-300'}
        ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`;

    return (
        <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                {label} *
            </label>
            {mode === 'select' ? (
                <select value={value || ''} onChange={handleSelectChange} onBlur={onBlur}
                    disabled={disabled} className={cls}>
                    <option value="">{disabled ? '— select brand first —' : placeholder}</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                    <option value={OTHER_OPTION}>➕ Not listed? Type your own</option>
                </select>
            ) : (
                <div className="flex gap-2">
                    <input type="text" autoFocus placeholder={`Type ${label.toLowerCase()}`}
                        value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur}
                        className={`flex-1 p-2.5 border rounded-lg text-sm focus:ring-2 outline-none
                            ${error ? 'border-red-400 focus:ring-red-300' : 'border-blue-400 focus:ring-blue-300'}`} />
                    <button type="button" onClick={switchToSelect} title="Back to list"
                        className="px-2.5 border border-gray-300 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs">
                        <ChevronDown size={14} />
                    </button>
                </div>
            )}
            {error && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {error}
                </p>
            )}
        </div>
    );
};

// ── Main Step ─────────────────────────────────────────────────────────────────
const Step1 = ({ formData, onChange }) => {
    const [touched, setTouched] = useState({});
    const [userVehicles, setUserVehicles] = useState([]);
    const [loadingUserVehicles, setLoadingUserVehicles] = useState(false);

    const brandMap = formData.vehicleType === 'Car' ? CAR_BRANDS : BIKE_BRANDS;
    const brands   = Object.keys(brandMap);
    const models   = formData.brand && brandMap[formData.brand] ? brandMap[formData.brand] : [];

    const mark = (field) => setTouched(t => ({ ...t, [field]: true }));

    const vehicleNumError = touched.vehicleNumber
        ? validateVehicleNumber(formData.vehicleNumber)
        : null;

    const handleTypeChange = (type) => {
        onChange('vehicleType', type);
        // Reset vehicle-specific fields when type changes
        onChange('brand', '');
        onChange('model', '');
        onChange('fuelType', '');
        onChange('vehicleNumber', '');
        // Set selectedVehicle to indicate a new vehicle is being added
        onChange('selectedVehicle', 'Add New');
    };

    // Load previously serviced vehicles (petrol/diesel) so the customer can
    // reuse their details instead of entering them again.
    React.useEffect(() => {
        let mounted = true;
        setLoadingUserVehicles(true);
        fetch(`${BASE}/api/services/my-vehicles`, { credentials: 'include' })
            .then(res => res.ok ? res.json() : [])
            .then(list => { if (mounted) setUserVehicles(list || []); })
            .catch(() => { if (mounted) setUserVehicles([]); })
            .finally(() => { if (mounted) setLoadingUserVehicles(false); });
        return () => { mounted = false; };
    }, []);

    const applyRegisteredVehicle = (v) => {
        const display = `${v.brand} ${v.model} (${v.vehicleNumber})`;
        onChange('selectedVehicle', display);
        onChange('brand', v.brand || '');
        onChange('model', v.model || '');
        onChange('vehicleNumber', v.vehicleNumber || '');
        onChange('fuelType', v.fuelType || '');
        onChange('vehicleType', v.vehicleType || 'Car');
    };

    return (
        <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <StepHeader
                title="Select Your Vehicle"
                subtitle="Choose type then fill in the details below"
            />

            {/* Registered vehicles selector (if any) */}
            {loadingUserVehicles ? (
                <p className="text-sm text-slate-500">Loading your previously serviced vehicles…</p>
            ) : (userVehicles && userVehicles.length > 0) && (
                <div>
                    <SectionLabel>Use a Previously Serviced Vehicle</SectionLabel>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {userVehicles.map(v => (
                            <button key={v.vehicleNumber} type="button" onClick={() => applyRegisteredVehicle(v)}
                                className="p-3 text-left border rounded-lg hover:bg-slate-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-sm">{v.brand} {v.model}</div>
                                        <div className="text-xs text-slate-500">{v.vehicleNumber}</div>
                                    </div>
                                    <div className="text-xs text-green-600">Select</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Vehicle Type */}
            <div>
                <SectionLabel>Vehicle Type *</SectionLabel>
                <div className="grid grid-cols-2 gap-4">
                    {[{ type: 'Car', Icon: Car }, { type: 'Bike', Icon: Bike }].map(({ type, Icon }) => (
                        <CardInput
                            key={type}
                            selected={formData.vehicleType === type}
                            onClick={() => handleTypeChange(type)}
                        >
                            <div className="flex flex-col items-center w-full">
                                <Icon
                                    size={32}
                                    className={formData.vehicleType === type ? 'text-blue-700' : 'text-gray-400'}
                                />
                                <span className={`mt-2 font-semibold ${formData.vehicleType === type ? 'text-blue-800' : 'text-gray-600'}`}>
                                    {type}
                                </span>
                            </div>
                            {formData.vehicleType === type && (
                                <CheckCircle size={18} className="text-blue-600 shrink-0" />
                            )}
                        </CardInput>
                    ))}
                </div>
                {!formData.vehicleType && touched.vehicleType && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> Please select a vehicle type
                    </p>
                )}
            </div>

            {/* Vehicle details form — shown directly after type is selected, no extra click needed */}
            <AnimatePresence>
                {formData.vehicleType && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            {/* Brand */}
                            <ComboSelect
                                label="Brand"
                                value={formData.brand}
                                options={brands}
                                onChange={v => { onChange('brand', v); onChange('model', ''); }}
                                onBlur={() => mark('brand')}
                                placeholder="Select Brand"
                                error={!formData.brand && touched.brand ? 'Brand is required' : null}
                            />

                            {/* Model */}
                            <ComboSelect
                                label="Model"
                                value={formData.model}
                                options={models}
                                onChange={v => onChange('model', v)}
                                onBlur={() => mark('model')}
                                disabled={!formData.brand}
                                placeholder="Select Model"
                                error={!formData.model && touched.model && formData.brand ? 'Model is required' : null}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Fuel Type */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                    Fuel Type *
                                </label>
                                <select
                                    value={formData.fuelType || ''}
                                    onChange={e => onChange('fuelType', e.target.value)}
                                    onBlur={() => mark('fuelType')}
                                    className={`w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none bg-white
                                        ${!formData.fuelType && touched.fuelType ? 'border-red-400' : 'border-gray-300'}`}
                                >
                                    <option value="">Select</option>
                                    <option value="Petrol">Petrol</option>
                                    <option value="Diesel">Diesel</option>
                                </select>
                                {!formData.fuelType && touched.fuelType && (
                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                        <AlertCircle size={11} /> Required
                                    </p>
                                )}
                            </div>

                            {/* Vehicle Number — NOW MANDATORY */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                    Vehicle Number *
                                </label>
                                <input
                                    type="text"
                                    placeholder="KA01AB1234"
                                    maxLength={12}
                                    value={formData.vehicleNumber || ''}
                                    onChange={e =>
                                        onChange('vehicleNumber', e.target.value.toUpperCase().replace(/\s/g, ''))
                                    }
                                    onBlur={() => mark('vehicleNumber')}
                                    className={`w-full p-2.5 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none
                                        ${vehicleNumError ? 'border-red-400 focus:ring-red-300' : 'border-gray-300'}`}
                                />
                                {vehicleNumError && (
                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                        <AlertCircle size={11} /> {vehicleNumError}
                                    </p>
                                )}
                                {!vehicleNumError && formData.vehicleNumber && (
                                    <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                                        <CheckCircle size={11} /> Valid format
                                    </p>
                                )}
                                <p className="text-gray-400 text-[10px] mt-0.5">Format: KA01AB1234</p>
                            </div>
                        </div>

                        {/* Preview chip */}
                        {formData.brand && formData.model && formData.vehicleNumber &&
                            !validateVehicleNumber(formData.vehicleNumber) && (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                                <CheckCircle size={13} className="shrink-0 text-blue-500" />
                                <span>
                                    <strong>{formData.vehicleNumber}</strong> — {formData.brand} {formData.model}
                                    {formData.fuelType ? ` (${formData.fuelType})` : ''}
                                </span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Step1;
