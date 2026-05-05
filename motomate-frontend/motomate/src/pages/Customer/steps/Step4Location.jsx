import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, CheckCircle, Home, Wrench, Loader2,
  AlertTriangle, RefreshCw, Users, ChevronRight, Star,
} from 'lucide-react';
import { CardInput, SectionLabel, StepHeader } from '../components/SharedUI';
import useGeolocation from '../../../hooks/useGeolocation';
import NearbyWorkersMap from '../../../Components/NearbyWorkersMap';

/**
 * Step4Location — Location & Service Mode + Worker Selection
 *
 * When Doorstep is selected:
 *  1. GPS coords are captured and stored in formData
 *  2. A "Find Technician" button appears — opens NearbyWorkersMap
 *  3. Customer sees all available workers on map with distance + rating
 *  4. On confirm, selectedWorkerId + selectedWorkerName go into formData
 *  5. The booking payload sends these so the backend assigns this specific worker
 */
const Step4Location = ({ formData, onChange }) => {
  const { coords, error, loading, refresh, denied } = useGeolocation();
  const [showWorkerMap, setShowWorkerMap] = useState(false);

  const isDoorstep = formData.serviceMode === 'Doorstep';

  // Auto-populate GPS coords into form
  useEffect(() => {
    if (coords && isDoorstep) {
      onChange('customerLatitude',  coords.latitude);
      onChange('customerLongitude', coords.longitude);
    }
  }, [coords, isDoorstep]); // eslint-disable-line

  // Clear GPS + worker selection if switching away from Doorstep
  useEffect(() => {
    if (!isDoorstep) {
      onChange('customerLatitude',    null);
      onChange('customerLongitude',   null);
      onChange('selectedWorkerId',    null);
      onChange('selectedWorkerName',  null);
    }
  }, [isDoorstep]); // eslint-disable-line

  const handleWorkerSelected = (workerId, workerName) => {
    onChange('selectedWorkerId',   workerId);
    onChange('selectedWorkerName', workerName);
    setShowWorkerMap(false);
  };

  const hasWorkerSelected = !!(formData.selectedWorkerId);

  return (
    <motion.div
      key="step4loc"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <StepHeader title="Location & Mode" subtitle="Where should we perform the service?" />

      {/* ── Service Location ───────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Service Location</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardInput
            selected={formData.serviceLocation === 'Current Location'}
            onClick={() => onChange('serviceLocation', 'Current Location')}
          >
            <div className="flex items-center">
              <MapPin className="mr-3 text-blue-600" />
              <div>
                <div className="font-medium">Current Location</div>
                <div className="text-xs text-gray-500">Use GPS location</div>
              </div>
            </div>
            {formData.serviceLocation === 'Current Location' && (
              <CheckCircle size={18} className="text-blue-600 shrink-0" />
            )}
          </CardInput>

          <CardInput
            selected={formData.serviceLocation === 'Manual'}
            onClick={() => onChange('serviceLocation', 'Manual')}
          >
            <div className="flex items-center">
              <Home className="mr-3 text-blue-600" />
              <div>
                <div className="font-medium">Manual Address</div>
                <div className="text-xs text-gray-500">Enter address manually</div>
              </div>
            </div>
            {formData.serviceLocation === 'Manual' && (
              <CheckCircle size={18} className="text-blue-600 shrink-0" />
            )}
          </CardInput>
        </div>

        <AnimatePresence>
          {formData.serviceLocation === 'Manual' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="mt-4"
            >
              <textarea
                placeholder="Enter full address..."
                value={formData.manualAddress}
                onChange={e => onChange('manualAddress', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                rows={3}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Service Mode ───────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Service Mode</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardInput
            selected={isDoorstep}
            onClick={() => onChange('serviceMode', 'Doorstep')}
          >
            <div className="flex items-center">
              <Home className="mr-3 text-blue-600" />
              <div>
                <div className="font-medium">Doorstep Service</div>
                <div className="text-xs text-gray-500">Mechanic comes to you</div>
              </div>
            </div>
            {isDoorstep && <CheckCircle size={18} className="text-blue-600 shrink-0" />}
          </CardInput>

          <CardInput
            selected={formData.serviceMode === 'Service Center'}
            onClick={() => onChange('serviceMode', 'Service Center')}
          >
            <div className="flex items-center">
              <Wrench className="mr-3 text-blue-600" />
              <div>
                <div className="font-medium">Service Center</div>
                <div className="text-xs text-gray-500">Drop your vehicle off</div>
              </div>
            </div>
            {formData.serviceMode === 'Service Center' && (
              <CheckCircle size={18} className="text-blue-600 shrink-0" />
            )}
          </CardInput>
        </div>
      </div>

      {/* ── Doorstep extras ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {isDoorstep && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* GPS status */}
            {loading && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-blue-700 text-sm">
                <Loader2 size={16} className="animate-spin shrink-0" />
                Detecting your location…
              </div>
            )}

            {!loading && coords && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm">
                <CheckCircle size={16} className="shrink-0" />
                <span>
                  Location captured
                  <span className="ml-2 text-green-500 font-mono text-xs">
                    ({coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)})
                  </span>
                </span>
              </div>
            )}

            {!loading && error && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-2">
                <div className="flex items-start gap-3 text-amber-700 text-sm">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                {!denied && (
                  <button onClick={refresh} className="flex items-center gap-1.5 text-xs text-amber-700 underline">
                    <RefreshCw size={12} /> Try again
                  </button>
                )}
              </div>
            )}

            {/* ── Worker selection ──────────────────────────────────────────── */}
            <div className="border-t border-gray-100 pt-4">
              <SectionLabel>Choose Your Technician</SectionLabel>

              {!hasWorkerSelected ? (
                /* "Find Technician" button — opens NearbyWorkersMap */
                <button
                  onClick={() => setShowWorkerMap(true)}
                  disabled={!formData.serviceCenterId}
                  className="w-full flex items-center justify-between gap-3 bg-indigo-50 border-2 border-indigo-200
                    hover:border-indigo-400 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed
                    text-indigo-700 font-semibold px-4 py-4 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                      <Users size={18} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">View Available Technicians</p>
                      <p className="text-indigo-500 text-xs font-normal">
                        See workers on map · Compare ratings · Pick nearest
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                </button>
              ) : (
                /* Selected worker card */
                <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-black text-lg">
                        {(formData.selectedWorkerName || 'T')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{formData.selectedWorkerName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <CheckCircle size={12} className="text-green-500" />
                          <p className="text-green-600 text-xs font-medium">Technician Selected</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowWorkerMap(true)}
                      className="text-xs text-indigo-600 font-semibold underline hover:text-indigo-800 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {!formData.serviceCenterId && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertTriangle size={11} /> Please select a service center in Step 3 first.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NearbyWorkersMap modal ────────────────────────────────────────── */}
      {showWorkerMap && (
        <NearbyWorkersMap
          customerLat={formData.customerLatitude || coords?.latitude}
          customerLng={formData.customerLongitude || coords?.longitude}
          serviceCenterId={formData.serviceCenterId}
          onWorkerSelected={handleWorkerSelected}
          onClose={() => setShowWorkerMap(false)}
        />
      )}
    </motion.div>
  );
};

export default Step4Location;