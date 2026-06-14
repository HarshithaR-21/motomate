import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Clock, Shield, Users, Wrench, CheckCircle,
    ChevronDown, ChevronUp, AlertCircle, Loader2, Star,
    Map, List
} from 'lucide-react';
import { StepHeader } from '../components/SharedUI';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const BASE = 'http://localhost:8080';

// ── Helpers ───────────────────────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const StarRating = ({ rating = 0, size = 12 }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
            <svg key={i} width={size} height={size} viewBox="0 0 24 24"
                fill={i <= Math.round(rating) ? '#FBBF24' : '#E5E7EB'} stroke="none">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
        ))}
        <span className="text-xs font-semibold text-gray-500 ml-0.5">
            {rating > 0 ? Number(rating).toFixed(1) : 'New'}
        </span>
    </div>
);

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

// ── Leaflet map icon factory ──────────────────────────────────────────────────
function makeServiceCenterIcon(isSelected, hasCoords) {
    const bg = isSelected ? '#2563EB' : hasCoords ? '#7C3AED' : '#6B7280';
    const ring = isSelected ? '#BFDBFE' : hasCoords ? '#DDD6FE' : '#D1D5DB';
    return L.divIcon({
        className: '',
        html: `<div style="position:relative;width:38px;height:38px;border-radius:50%;
          background:${bg};border:3px solid #fff;
          box-shadow:0 0 0 3px ${ring},0 4px 12px rgba(0,0,0,0.25);
          display:flex;align-items:center;justify-content:center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          ${isSelected ? `<div style="position:absolute;top:-6px;right:-6px;width:14px;height:14px;
            background:#22C55E;border-radius:50%;border:2px solid #fff;
            display:flex;align-items:center;justify-content:center;">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/></svg></div>` : ''}
        </div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
    });
}

function makeUserIcon() {
    return L.divIcon({
        className: '',
        html: `<div style="width:28px;height:28px;border-radius:50%;
          background:#3B82F6;border:3px solid #fff;
          box-shadow:0 0 0 3px #BFDBFE,0 4px 12px rgba(59,130,246,0.4);
          display:flex;align-items:center;justify-content:center;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3" fill="#3B82F6"/>
          </svg></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
}

// ── Service Centers Map ───────────────────────────────────────────────────────
const ServiceCentersMap = ({ centers, selectedId, onSelect, userLocation }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef({});
    const userMarkerRef = useRef(null);

    useEffect(() => {
        if (mapInstanceRef.current) return;
        const defaultCenter = userLocation
            ? [userLocation.lat, userLocation.lng]
            : [12.9716, 77.5946]; // Bengaluru default

        const map = L.map(mapRef.current, {
            center: defaultCenter,
            zoom: 12,
            zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        mapInstanceRef.current = map;
    }, []);

    // User location marker
    useEffect(() => {
        if (!mapInstanceRef.current || !userLocation) return;
        if (userMarkerRef.current) userMarkerRef.current.remove();
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
            icon: makeUserIcon(),
            zIndexOffset: 1000,
        })
            .addTo(mapInstanceRef.current)
            .bindPopup('<b>Your Location</b>');
    }, [userLocation]);

    // Center markers
    useEffect(() => {
        if (!mapInstanceRef.current) return;
        const map = mapInstanceRef.current;

        // Remove old markers
        Object.values(markersRef.current).forEach(m => m.remove());
        markersRef.current = {};

        const bounds = [];
        if (userLocation) bounds.push([userLocation.lat, userLocation.lng]);

        centers.forEach(center => {
            if (!center.latitude || !center.longitude) return;
            const isSelected = center.ownerId === selectedId;
            const marker = L.marker([center.latitude, center.longitude], {
                icon: makeServiceCenterIcon(isSelected, true),
            })
                .addTo(map)
                .bindPopup(`
                    <div style="min-width:180px">
                        <b style="font-size:13px">${center.centerName}</b><br/>
                        <span style="font-size:11px;color:#6B7280">${center.address || ''}${center.city ? ', ' + center.city : ''}</span><br/>
                        ${center.averageRating > 0 ? `<span style="font-size:11px;color:#F59E0B">★ ${Number(center.averageRating).toFixed(1)}</span>` : ''}
                        ${center.distanceKm != null ? `<br/><span style="font-size:11px;color:#2563EB;font-weight:bold">📍 ${center.distanceKm < 1 ? (center.distanceKm * 1000).toFixed(0) + 'm' : center.distanceKm.toFixed(1) + ' km'}</span>` : ''}
                    </div>
                `)
                .on('click', () => onSelect(center));

            markersRef.current[center.ownerId] = marker;
            bounds.push([center.latitude, center.longitude]);
        });

        if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [40, 40] });
        }
    }, [centers, selectedId]);

    // Highlight selected center
    useEffect(() => {
        Object.entries(markersRef.current).forEach(([id, marker]) => {
            marker.setIcon(makeServiceCenterIcon(id === selectedId, true));
        });
        if (selectedId && markersRef.current[selectedId]) {
            markersRef.current[selectedId].openPopup();
        }
    }, [selectedId]);

    return (
        <div
            ref={mapRef}
            style={{ height: '360px', width: '100%', borderRadius: '16px', zIndex: 0 }}
            className="border border-gray-200 shadow-sm"
        />
    );
};

// ── CenterCard ────────────────────────────────────────────────────────────────
const CenterCard = ({ center, centerServices, selectedId, onSelect, expanded, onToggle, requestedNames }) => {
    const isSelected = selectedId === center.ownerId;

    const matchedServices = centerServices.filter(s =>
        requestedNames.some(n =>
            s.name?.toLowerCase().includes(n.toLowerCase()) ||
            n.toLowerCase().includes(s.name?.toLowerCase())
        )
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
            <div
                className={`p-4 cursor-pointer ${isSelected ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
                onClick={onToggle}
            >
                <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-lg
                        ${isSelected ? 'bg-blue-600' : 'bg-gradient-to-br from-slate-500 to-slate-700'}`}>
                        {(center.centerName || 'S')[0].toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="font-bold text-slate-800 text-sm">{center.centerName}</p>
                                <p className="text-xs text-slate-500">{center.centerType}</p>
                                {/* ⭐ Rating */}
                                <div className="mt-0.5">
                                    <StarRating rating={center.averageRating || 0} />
                                    {center.totalRatings > 0 && (
                                        <span className="text-[10px] text-gray-400 ml-1">({center.totalRatings} reviews)</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                                {center.emergencyService && (
                                    <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">24/7</span>
                                )}
                                {matchCount > 0 && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                                        ${matchCount === totalRequested ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {matchCount}/{totalRequested} match
                                    </span>
                                )}
                                {center.distanceKm != null && (
                                    <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                                        📍 {center.distanceKm < 1
                                            ? `${(center.distanceKm * 1000).toFixed(0)}m`
                                            : `${center.distanceKm.toFixed(1)} km`}
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

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100 space-y-3">
                            {center.address && (
                                <p className="text-xs text-slate-500 flex items-start gap-1.5">
                                    <MapPin size={11} className="shrink-0 mt-0.5 text-slate-400" />
                                    {center.address}{center.landmark ? ` · ${center.landmark}` : ''}
                                    {center.pincode ? ` – ${center.pincode}` : ''}
                                </p>
                            )}

                            {centerServices.length > 0 ? (
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Services offered</p>
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

                            {center.openDays?.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
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

            <div className={`px-4 pb-4 ${expanded ? '' : 'pt-0'} bg-white`}>
                <button
                    type="button"
                    onClick={() => onSelect(center)}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all
                        ${isSelected
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-200'}`}
                >
                    {isSelected
                        ? <span className="flex items-center justify-center gap-2"><CheckCircle size={16} /> Selected</span>
                        : 'Select This Center'}
                </button>
            </div>
        </motion.div>
    );
};

// ── Brand → vehicle type mapping ──────────────────────────────────────────────
const BRAND_TO_VEHICLE_TYPE = {
    'Hyundai': 'Car', 'Tata': 'Car', 'Maruti Suzuki': 'Car', 'Honda Cars': 'Car',
    'Toyota': 'Car', 'Kia': 'Car', 'MG': 'Car', 'Volkswagen': 'Car',
    'Skoda': 'Car', 'Renault': 'Car', 'Nissan': 'Car', 'Ford': 'Car',
    'Jeep': 'Car', 'Mahindra': 'Car',
    'Honda Bikes': 'Bike', 'Yamaha': 'Bike', 'Hero': 'Bike', 'Bajaj': 'Bike',
    'TVS': 'Bike', 'KTM': 'Bike', 'Royal Enfield': 'Bike', 'Suzuki': 'Bike',
    'Kawasaki': 'Bike',
};

// ── Geocode address using Nominatim (OpenStreetMap – free, no key needed) ─────
// FIX: same issue as service-center signup — a single overly-specific query
// often returns no results. Try structured query, then progressively looser
// free-text fallbacks.
async function geocodeOne(params) {
    try {
        const q = new URLSearchParams({
            format: 'json',
            limit: '1',
            countrycodes: 'in',
            ...params,
        });
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?${q.toString()}`,
            { headers: { 'Accept-Language': 'en' } }
        );
        if (!response.ok) return null;
        const data = await response.json();
        if (data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
        return null;
    } catch (e) {
        console.error('Geocoding error:', e);
        return null;
    }
}

async function geocodeAddress(area, city, state, pinCode) {
    if (!area && !city) return null;

    // 1. Structured query
    let result = await geocodeOne({ street: area, city, state, postalcode: pinCode });
    if (result) return result;

    // 2. Full free-text query
    const addressQuery = [area, city, state, pinCode].filter(Boolean).join(', ');
    result = await geocodeOne({ q: `${addressQuery}, India` });
    if (result) return result;

    // 3. Drop pincode
    const noPinQuery = [area, city, state].filter(Boolean).join(', ');
    result = await geocodeOne({ q: `${noPinQuery}, India` });
    if (result) return result;

    // 4. Fall back to just city/state so the map still centers near the user
    const cityQuery = [city, state].filter(Boolean).join(', ');
    if (cityQuery) {
        result = await geocodeOne({ q: `${cityQuery}, India` });
        if (result) return result;
    }

    return null;
}

// ── Main component ────────────────────────────────────────────────────────────
const Step3ServiceCenter = ({ formData, onChange }) => {
    const [centers, setCenters] = useState([]);
    const [ratingsMap, setRatingsMap] = useState({}); // ownerId → { averageRating, totalRatings }
    const [servicesMap, setServicesMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [loadingServices, setLoadingServices] = useState({});
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
    const [userLocation, setUserLocation] = useState(null);

    const requestedNames = formData.selectedServiceNames || [];
    const selectedVehicleType = formData.vehicleType ||
        (formData.brand ? BRAND_TO_VEHICLE_TYPE[formData.brand] : null);

    // Get user location from registered address, fallback to geolocation
    useEffect(() => {
        const getLocation = async () => {
            // Priority 1: Use user's registered address from registration
            const userAddr = formData.userAddress;
            if (userAddr && (userAddr.area || userAddr.city)) {
                const coords = await geocodeAddress(
                    userAddr.area,
                    userAddr.city,
                    userAddr.state,
                    userAddr.pinCode
                );
                if (coords) {
                    setUserLocation(coords);
                    return;
                }
            }

            // Priority 2: Fallback to browser geolocation
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition(
                pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => { /* silent fail */ }
            );
        };
        getLocation();
    }, [formData.userAddress]);

    // Fetch ALL approved centers (no vehicleType filter – show all, sort matched first)
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${BASE}/api/services/centers`, { credentials: 'include' });
                if (!res.ok) throw new Error('Failed to load service centers');
                const data = await res.json();
                setCenters(data);

                // Fetch ratings for all centers in parallel
                const ratingResults = await Promise.allSettled(
                    data.map(c => c.ownerId
                        ? fetch(`${BASE}/api/ratings/service-center/${c.ownerId}`, { credentials: 'include' })
                            .then(r => r.ok ? r.json() : { averageRating: 0, totalRatings: 0 })
                            .then(r => ({ ownerId: c.ownerId, ...r }))
                        : Promise.resolve({ ownerId: null, averageRating: 0, totalRatings: 0 })
                    )
                );
                const rm = {};
                ratingResults.forEach(r => {
                    if (r.status === 'fulfilled' && r.value?.ownerId) {
                        rm[r.value.ownerId] = {
                            averageRating: r.value.averageRating || 0,
                            totalRatings: r.value.totalRatings || 0,
                        };
                    }
                });
                setRatingsMap(rm);
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
            if (!res.ok) throw new Error();
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

        const svcList = servicesMap[ownerId] || [];
        const resolved = [], resolvedIds = [], resolvedNames = [];

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
        if (resolvedNames.length > 0) onChange('selectedServiceNames', resolvedNames);
        setExpandedId(ownerId);
    };

    // Enrich centers with ratings + distance
    const enrichedCenters = centers.map(c => ({
        ...c,
        averageRating: ratingsMap[c.ownerId]?.averageRating || 0,
        totalRatings: ratingsMap[c.ownerId]?.totalRatings || 0,
        distanceKm: userLocation && c.latitude && c.longitude
            ? haversine(userLocation.lat, userLocation.lng, c.latitude, c.longitude)
            : null,
    }));

    // Determine brand-matched centers for a notice (vehicle type AND/OR supported brand)
    const brandMatchedCenters = (selectedVehicleType || formData.brand)
        ? enrichedCenters.filter(c => {
            const typeMatch = selectedVehicleType
                ? (c.vehicleTypes?.length > 0
                    ? c.vehicleTypes.some(vt => vt.toLowerCase().includes(selectedVehicleType.toLowerCase()))
                    : c.centerType?.toLowerCase().includes(selectedVehicleType.toLowerCase()))
                : true;

            const brandMatch = formData.brand
                ? (c.supportedBrands?.length > 0
                    ? c.supportedBrands.some(b => b?.toLowerCase() === formData.brand.toLowerCase())
                    : true) // centers with no declared brand list are not excluded
                : true;

            return typeMatch && brandMatch;
        })
        : enrichedCenters;

    // Sort: 1) brand/type-matched first, 2) by service match count, 3) by rating, 4) by distance
    const hasPreferenceFilter = !!(selectedVehicleType || formData.brand);
    const sortedCenters = [...enrichedCenters].sort((a, b) => {
        const aMatches = hasPreferenceFilter ? (brandMatchedCenters.some(c => c.ownerId === a.ownerId) ? 1 : 0) : 0;
        const bMatches = hasPreferenceFilter ? (brandMatchedCenters.some(c => c.ownerId === b.ownerId) ? 1 : 0) : 0;
        if (bMatches !== aMatches) return bMatches - aMatches;

        const getSvcMatch = (c) => {
            const svcs = servicesMap[c.ownerId] || [];
            return svcs.filter(s => requestedNames.some(n =>
                s.name?.toLowerCase().includes(n.toLowerCase()) ||
                n.toLowerCase().includes(s.name?.toLowerCase())
            )).length;
        };
        const svcDiff = getSvcMatch(b) - getSvcMatch(a);
        if (svcDiff !== 0) return svcDiff;

        const ratingDiff = (b.averageRating || 0) - (a.averageRating || 0);
        if (ratingDiff !== 0) return ratingDiff;

        if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
        return 0;
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
                subtitle="All centers are verified & approved — pick the one that suits you"
            />

            {/* Brand filter notice */}
            {hasPreferenceFilter && brandMatchedCenters.length < enrichedCenters.length && (
                <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-xs text-indigo-700">
                    <Shield size={14} className="shrink-0" />
                    <span>
                        <strong>{brandMatchedCenters.length}</strong> center{brandMatchedCenters.length !== 1 ? 's' : ''}
                        {selectedVehicleType ? ` specialise in ${selectedVehicleType}s` : ''}
                        {formData.brand ? `${selectedVehicleType ? ' and' : ''} service ${formData.brand}` : ''} — shown first.
                        All {enrichedCenters.length} centers are listed below.
                    </span>
                </div>
            )}

            {/* Requested services */}
            {requestedNames.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-xs font-bold text-blue-600 w-full mb-1">You need:</span>
                    {requestedNames.map(n => (
                        <span key={n} className="text-xs bg-blue-600 text-white font-semibold px-2.5 py-1 rounded-full">{n}</span>
                    ))}
                </div>
            )}

            {/* View toggle */}
            {!loading && !error && enrichedCenters.length > 0 && (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                            ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        <List size={14} /> List
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('map')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                            ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        <Map size={14} /> Map View
                    </button>
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

            {!loading && !error && enrichedCenters.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                    <Shield size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No approved service centers yet</p>
                    <p className="text-xs mt-1">Check back soon!</p>
                </div>
            )}

            {/* Map view */}
            {viewMode === 'map' && !loading && !error && enrichedCenters.length > 0 && (
                <ServiceCentersMap
                    centers={enrichedCenters}
                    selectedId={formData.serviceCenterId}
                    onSelect={c => { loadCenterServices(c.ownerId); handleSelect(c); }}
                    userLocation={userLocation}
                />
            )}

            {/* List view */}
            {viewMode === 'list' && !loading && !error && sortedCenters.length > 0 && (
                <div className="space-y-3">
                    {sortedCenters.map(center => (
                        <CenterCard
                            key={center.ownerId || center.id}
                            center={center}
                            centerServices={loadingServices[center.ownerId] ? [] : (servicesMap[center.ownerId] || [])}
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
                                    Selected — center will confirm services on arrival.
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