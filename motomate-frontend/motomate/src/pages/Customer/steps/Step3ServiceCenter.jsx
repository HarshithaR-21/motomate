import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Clock, Shield, Users, Wrench, CheckCircle,
    ChevronDown, ChevronUp, AlertCircle, Loader2, Star
} from 'lucide-react';
import { StepHeader } from '../components/SharedUI';

const BASE = 'http://localhost:8080';

const ServiceBadge = ({ name, price, duration, selected }) => (
    <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs
        ${selected ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50 border border-gray-200'}`}>
        <span className={`font-medium ${selected ? 'text-blue-700' : 'text-gray-600'}`}>{name}</span>
        <div className="flex items-center gap-2 ml-2 shrink-0">
            {price != null && <span className={`font-bold ${selected ? 'text-blue-700' : 'text-gray-700'}`}>₹{price}</span>}
            {duration != null && <span className="text-gray-400">{duration}m</span>}
        </div>
    </div>
);

const CenterCard = ({ center, centerServices, selectedId, onSelect, expanded, onToggle, requestedNames }) => {
    const isSelected = selectedId === center.ownerId;

    // Matched services = services this center offers that match what the customer wants
    const matchedServices = centerServices.filter(s =>
        requestedNames.some(n => s.name?.toLowerCase().includes(n.toLowerCase()) ||
                                 n.toLowerCase().includes(s.name?.toLowerCase()))
    );
    const matchCount = matchedServices.length;
    const totalRequested = requestedNames.length;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border-2 overflow-hidden transition-all duration-200
                ${isSelected ? 'border-blue-500 shadow-lg shadow-blue-100' : 'border-gray-200 hover:border-blue-300'}`}
        >
            {/* Header */}
            <div
                className={`p-4 cursor-pointer ${isSelected ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
                onClick={onToggle}
            >
                <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-lg
                        ${isSelected ? 'bg-blue-600' : 'bg-gradient-to-br from-slate-500 to-slate-700'}`}>
                        {(center.centerName || 'S')[0].toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="font-bold text-slate-800 text-sm">{center.centerName}</p>
                                <p className="text-xs text-slate-500">{center.centerType}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {center.emergencyService && (
                                    <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                                        24/7
                                    </span>
                                )}
                                {matchCount > 0 && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                                        ${matchCount === totalRequested
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-amber-100 text-amber-700'}`}>
                                        {matchCount}/{totalRequested} match
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                <MapPin size={11} /> {center.city}{center.state ? `, ${center.state}` : ''}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock size={11} /> {center.openTime || '9:00'} – {center.closeTime || '18:00'}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Wrench size={11} /> {center.serviceCount || 0} services
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Users size={11} /> {center.workerCount || 0} staff
                            </span>
                        </div>
                    </div>

                    <div className="shrink-0 text-gray-400 mt-1">
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>
            </div>

            {/* Expanded services preview */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100 space-y-3">
                            {/* Address */}
                            {center.address && (
                                <p className="text-xs text-slate-500 flex items-start gap-1.5">
                                    <MapPin size={11} className="shrink-0 mt-0.5 text-slate-400" />
                                    {center.address}{center.landmark ? ` · ${center.landmark}` : ''}
                                    {center.pincode ? ` – ${center.pincode}` : ''}
                                </p>
                            )}

                            {/* Services */}
                            {centerServices.length > 0 ? (
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                                        Services offered
                                    </p>
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                        {centerServices.map(s => (
                                            <ServiceBadge
                                                key={s.id}
                                                name={s.name}
                                                price={s.price}
                                                duration={s.durationMinutes}
                                                selected={requestedNames.some(n =>
                                                    s.name?.toLowerCase().includes(n.toLowerCase()) ||
                                                    n.toLowerCase().includes(s.name?.toLowerCase())
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic">No services listed yet.</p>
                            )}

                            {/* Open days */}
                            {center.openDays?.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
                                        <span key={day} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                                            ${center.openDays.some(d => d.toLowerCase().startsWith(day.toLowerCase()))
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-400'}`}>
                                            {day}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Select button */}
            <div className={`px-4 pb-4 ${expanded ? '' : 'pt-0'} bg-white`}>
                <button
                    type="button"
                    onClick={() => onSelect(center)}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all
                        ${isSelected
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-200'}`}
                >
                    {isSelected ? (
                        <span className="flex items-center justify-center gap-2">
                            <CheckCircle size={16} /> Selected
                        </span>
                    ) : 'Select This Center'}
                </button>
            </div>
        </motion.div>
    );
};

const Step3ServiceCenter = ({ formData, onChange }) => {
    const [centers, setCenters] = useState([]);
    const [servicesMap, setServicesMap] = useState({}); // ownerId → SCOService[]
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [loadingServices, setLoadingServices] = useState({});

    const requestedNames = formData.selectedServiceNames || [];

    // Fetch all approved centers
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${BASE}/api/services/centers`, { credentials: 'include' });
                if (!res.ok) throw new Error('Failed to load service centers');
                const data = await res.json();
                setCenters(data);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Load services for a center when expanded
    const loadCenterServices = useCallback(async (ownerId) => {
        if (!ownerId || servicesMap[ownerId]) return;
        setLoadingServices(prev => ({ ...prev, [ownerId]: true }));
        try {
            const res = await fetch(`${BASE}/api/services/centers/${ownerId}/services`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to load services');
            const data = await res.json();
            setServicesMap(prev => ({ ...prev, [ownerId]: data }));
        } catch {
            setServicesMap(prev => ({ ...prev, [ownerId]: [] }));
        } finally {
            setLoadingServices(prev => ({ ...prev, [ownerId]: false }));
        }
    }, [servicesMap]);

    const handleToggle = (ownerId) => {
        const next = expandedId === ownerId ? null : ownerId;
        setExpandedId(next);
        if (next) loadCenterServices(ownerId);
    };

    const handleSelect = (center) => {
        const ownerId = center.ownerId;
        onChange('serviceCenterId', ownerId);
        onChange('serviceCenterName', center.centerName);

        // Resolve selected service names → actual SCOService objects from this center
        const svcList = servicesMap[ownerId] || [];
        const resolved = [];
        const resolvedIds = [];
        const resolvedNames = [];

        requestedNames.forEach(reqName => {
            const match = svcList.find(s =>
                s.name?.toLowerCase().includes(reqName.toLowerCase()) ||
                reqName.toLowerCase().includes(s.name?.toLowerCase())
            );
            if (match && !resolvedIds.includes(match.id)) {
                resolved.push(match);
                resolvedIds.push(match.id);
                resolvedNames.push(match.name);
            }
        });

        onChange('selectedServices', resolvedIds);
        onChange('selectedServiceObjects', resolved);
        // Update names to resolved names (or keep originals if no match)
        if (resolvedNames.length > 0) {
            onChange('selectedServiceNames', resolvedNames);
        }

        // Auto-expand to show what was matched
        setExpandedId(ownerId);
    };

    // Sort centers: those with more matches first
    const sortedCenters = [...centers].sort((a, b) => {
        const getMatch = (c) => {
            const svcs = servicesMap[c.ownerId] || [];
            return svcs.filter(s => requestedNames.some(n =>
                s.name?.toLowerCase().includes(n.toLowerCase()) ||
                n.toLowerCase().includes(s.name?.toLowerCase())
            )).length;
        };
        return getMatch(b) - getMatch(a);
    });

    return (
        <motion.div
            key="step3sc"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
        >
            <StepHeader
                title="Choose a Service Center"
                subtitle="All centers below are verified & approved"
            />

            {/* Requested services reminder */}
            {requestedNames.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-xs font-bold text-blue-600 w-full mb-1">You need:</span>
                    {requestedNames.map(n => (
                        <span key={n} className="text-xs bg-blue-600 text-white font-semibold px-2.5 py-1 rounded-full">
                            {n}
                        </span>
                    ))}
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
                    <Loader2 size={22} className="animate-spin text-blue-500" />
                    <span className="text-sm">Loading service centers…</span>
                </div>
            )}

            {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-red-700">Could not load centers</p>
                        <p className="text-xs text-red-600 mt-0.5">{error}</p>
                    </div>
                </div>
            )}

            {!loading && !error && centers.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                    <Shield size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No approved service centers yet</p>
                    <p className="text-xs mt-1">Check back soon!</p>
                </div>
            )}

            {!loading && !error && centers.length > 0 && (
                <div className="space-y-3">
                    {sortedCenters.map(center => (
                        <CenterCard
                            key={center.ownerId || center.id}
                            center={center}
                            centerServices={
                                loadingServices[center.ownerId]
                                    ? []
                                    : (servicesMap[center.ownerId] || [])
                            }
                            selectedId={formData.serviceCenterId}
                            onSelect={handleSelect}
                            expanded={expandedId === center.ownerId}
                            onToggle={() => handleToggle(center.ownerId)}
                            requestedNames={requestedNames}
                        />
                    ))}
                </div>
            )}

            {/* Selected center summary */}
            <AnimatePresence>
                {formData.serviceCenterId && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-xl border border-green-300 bg-green-50 p-4 flex items-start gap-3"
                    >
                        <CheckCircle size={18} className="text-green-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-green-800">{formData.serviceCenterName}</p>
                            {formData.selectedServiceObjects?.length > 0 ? (
                                <>
                                    <p className="text-xs text-green-600 mt-0.5">
                                        {formData.selectedServiceObjects.length} service(s) matched & confirmed
                                    </p>
                                    <p className="text-xs text-green-600">
                                        Total: ₹{formData.selectedServiceObjects.reduce((s, o) => s + (o.price || 0), 0)}
                                        {' '}· {formData.selectedServiceObjects.reduce((s, o) => s + (o.durationMinutes || 0), 0)} min
                                    </p>
                                </>
                            ) : (
                                <p className="text-xs text-amber-600 mt-0.5">
                                    Selected, but no exact service matches — you can continue and the center will confirm services.
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Step3ServiceCenter;
