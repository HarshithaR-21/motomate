import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, User, Plus, Trash2, Save, CheckCircle,
  Loader2, AlertCircle, Shield,
} from 'lucide-react';
import { getEmergencyContacts, saveEmergencyContacts } from './sosApi';

const RELATION_OPTIONS = ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Colleague', 'Other'];

// ── Validation ─────────────────────────────────────────────────────────────

const PHONE_RE = /^[+]?[0-9]{7,15}$/;

function validateContacts(contacts) {
  return contacts.map(c => {
    const errs = {};
    if (!c.name.trim())            errs.name   = 'Name is required';
    else if (c.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    else if (c.name.trim().length > 100) errs.name = 'Name too long';

    if (!c.phone.trim())           errs.phone  = 'Phone is required';
    else if (!PHONE_RE.test(c.phone.replace(/\s/g, '')))
      errs.phone = 'Enter a valid phone number (7–15 digits)';

    if (!c.relation)               errs.relation = 'Select a relation';
    return errs;
  });
}

// ── Component ──────────────────────────────────────────────────────────────

const EmergencyContactsManager = ({ customerId }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [touched, setTouched]   = useState([]);

  const id = customerId || JSON.parse(localStorage.getItem('user') || '{}')?.id;

  useEffect(() => {
    if (!id) return;
    getEmergencyContacts(id)
      .then(data => setContacts(data.contacts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Keep field errors in sync
  useEffect(() => {
    setFieldErrors(validateContacts(contacts));
  }, [contacts]);

  const addContact = () => {
    if (contacts.length >= 5) return;
    setContacts(c => [...c, { name: '', phone: '', relation: 'Other' }]);
    setTouched(t => [...t, {}]);
  };

  const removeContact = (idx) => {
    setContacts(c => c.filter((_, i) => i !== idx));
    setTouched(t => t.filter((_, i) => i !== idx));
  };

  const updateContact = (idx, field, value) => {
    setContacts(c => c.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    setTouched(t => t.map((item, i) => i === idx ? { ...item, [field]: true } : item));
  };

  const hasErrors = fieldErrors.some(e => Object.keys(e).length > 0);

  const handleSave = async () => {
    // Touch all fields to reveal errors
    setTouched(contacts.map(() => ({ name: true, phone: true, relation: true })));
    if (hasErrors) { setError('Please fix the errors above before saving.'); return; }

    setError('');
    setSaving(true);
    try {
      await saveEmergencyContacts(id, contacts);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <Loader2 size={24} className="animate-spin text-blue-500"/>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Phone size={20} className="text-red-600"/> Emergency Contacts
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Notified automatically when you submit an SOS · Max 5 contacts
          </p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          contacts.length >= 5 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {contacts.length}/5
        </span>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 flex items-start gap-2 mb-5">
        <Shield size={14} className="shrink-0 mt-0.5"/>
        In an SOS emergency, these contacts receive an alert. Keep them up to date.
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4 flex items-center gap-2">
          <AlertCircle size={16}/> {error}
        </div>
      )}

      {/* Contact rows */}
      <div className="space-y-3 mb-4">
        <AnimatePresence>
          {contacts.map((contact, idx) => {
            const errs = fieldErrors[idx] || {};
            const t    = touched[idx] || {};
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Contact {idx + 1}
                  </span>
                  <button onClick={() => removeContact(idx)}
                    className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 size={15}/>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {/* Name */}
                  <div>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <input
                        className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 bg-white transition-colors ${
                          t.name && errs.name
                            ? 'border-red-400 focus:ring-red-300'
                            : 'border-gray-200 focus:ring-blue-300'
                        }`}
                        placeholder="Full Name *"
                        value={contact.name}
                        onChange={e => updateContact(idx, 'name', e.target.value)}
                        maxLength={100}
                      />
                    </div>
                    {t.name && errs.name && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={11}/> {errs.name}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <input
                        className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 bg-white transition-colors ${
                          t.phone && errs.phone
                            ? 'border-red-400 focus:ring-red-300'
                            : 'border-gray-200 focus:ring-blue-300'
                        }`}
                        placeholder="Phone Number * (+91XXXXXXXXXX)"
                        type="tel"
                        value={contact.phone}
                        onChange={e => updateContact(idx, 'phone', e.target.value)}
                        maxLength={16}
                      />
                    </div>
                    {t.phone && errs.phone && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={11}/> {errs.phone}
                      </p>
                    )}
                  </div>

                  {/* Relation */}
                  <div>
                    <select
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 bg-white text-gray-700 transition-colors ${
                        t.relation && errs.relation
                          ? 'border-red-400 focus:ring-red-300'
                          : 'border-gray-200 focus:ring-blue-300'
                      }`}
                      value={contact.relation}
                      onChange={e => updateContact(idx, 'relation', e.target.value)}
                    >
                      <option value="">Select Relation *</option>
                      {RELATION_OPTIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    {t.relation && errs.relation && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={11}/> {errs.relation}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {contacts.length === 0 && (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            <Phone size={32} className="mx-auto mb-2 opacity-40"/>
            <p className="text-sm">No emergency contacts saved yet</p>
            <p className="text-xs mt-1">Add at least one contact for SOS safety</p>
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="flex gap-3">
        {contacts.length < 5 && (
          <button onClick={addContact}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex-1 justify-center">
            <Plus size={16}/> Add Contact
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving || contacts.length === 0}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-200 disabled:text-gray-400'
          }`}
        >
          {saving ? <Loader2 size={15} className="animate-spin"/>
           : saved  ? <CheckCircle size={15}/>
           : <Save size={15}/>}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Contacts'}
        </button>
      </div>
    </div>
  );
};

export default EmergencyContactsManager;
