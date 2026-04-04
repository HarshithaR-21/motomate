import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Building2, MapPin, Phone, Globe, Clock, CheckCircle2, AlertTriangle, XCircle, FileText } from 'lucide-react';
import { fetchSCOProfile } from '../api';
import { PageLoader, ErrorBlock, StatusBadge, Card } from '../components/UI';

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-purple-50 last:border-0">
    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider sm:w-40 shrink-0">{label}</span>
    <span className="text-sm text-gray-800">{value || '—'}</span>
  </div>
);

const StatusBanner = ({ status }) => {
  const conf = {
    APPROVED: { bg: 'from-green-500 to-emerald-600', Icon: CheckCircle2, msg: 'Your profile is approved. Customers can find and book your services.' },
    PENDING:  { bg: 'from-amber-500 to-orange-500',  Icon: Clock,         msg: 'Your profile is under review. Admin will approve it shortly.' },
    REJECTED: { bg: 'from-red-500 to-rose-600',      Icon: XCircle,       msg: 'Your profile was rejected. Check the remarks and contact support.' },
  };
  const c = conf[status] || conf.PENDING;
  return (
    <div className={`rounded-2xl p-5 text-white bg-linear-to-r ${c.bg} flex items-start gap-4`}>
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
        <c.Icon size={20} />
      </div>
      <div>
        <p className="font-bold text-base">Status: {status}</p>
        <p className="text-white/80 text-sm mt-0.5">{c.msg}</p>
      </div>
    </div>
  );
};

const SCOProfile = () => {
  const outletContext = useOutletContext() || {};
  const { ownerId: contextOwnerId } = outletContext;
  const [ownerId, setOwnerId] = useState(contextOwnerId);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (contextOwnerId) {
      setOwnerId(contextOwnerId);
      return;
    }

    const fetchMe = async () => {
      try {
        const resp = await fetch('http://localhost:8080/api/auth/me', { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          setOwnerId(data.id || data.userId);
        } else {
          console.error('SCO profile fetchMe: invalid response', resp);
          setError('Unable to determine current user. Please login again.');
        }
      } catch (ex) {
        console.error('SCO profile fetchMe error:', ex);
        setError('Unable to determine current user. Please login again.');
      }
    };

    fetchMe();
  }, [contextOwnerId]);

  useEffect(() => {
    if (!ownerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchSCOProfile(ownerId)
      .then(setProfile)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [ownerId]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBlock message={error} />;
  if (!profile) return <ErrorBlock message="Profile not found. Please complete registration first." />;

  const p = profile;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Business Profile</h2>
        <p className="text-sm text-gray-500 mt-1">View your service center details submitted during registration.</p>
      </div>

      <StatusBanner status={p.approvalStatus} />

      {p.adminRemarks && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-700">Admin Remarks</p>
            <p className="text-sm text-red-600 mt-0.5">{p.adminRemarks}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Owner Info */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
              <Building2 size={16} className="text-purple-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Owner Information</h3>
          </div>
          <InfoRow label="Owner Name"  value={p.ownerName} />
          <InfoRow label="Email"       value={p.email} />
          <InfoRow label="Phone"       value={p.phone} />
        </Card>

        {/* Center Details */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
              <MapPin size={16} className="text-violet-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Center Details</h3>
          </div>
          <InfoRow label="Center Name" value={p.centerName} />
          <InfoRow label="Type"        value={p.centerType} />
          <InfoRow label="Address"     value={p.address} />
          <InfoRow label="City"        value={`${p.city}, ${p.state} — ${p.pincode}`} />
          {p.landmark && <InfoRow label="Landmark" value={p.landmark} />}
          {p.website  && <InfoRow label="Website"  value={p.website} />}
        </Card>

        {/* Services & Hours */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Clock size={16} className="text-indigo-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Services & Hours</h3>
          </div>
          <InfoRow label="Open Days"      value={(p.openDays || []).join(', ')} />
          <InfoRow label="Hours"          value={`${p.openTime || '—'} – ${p.closeTime || '—'}`} />
          <InfoRow label="Vehicle Types"  value={(p.vehicleTypes || []).join(', ')} />
          <InfoRow label="Emergency"      value={p.emergencyService ? 'Yes' : 'No'} />
          <div className="py-3">
            <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Offered Services</p>
            <div className="flex flex-wrap gap-1.5">
              {(p.services || []).map((s, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">{s}</span>
              ))}
            </div>
          </div>
        </Card>

        {/* Business Docs */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FileText size={16} className="text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Business Documents</h3>
          </div>
          <InfoRow label="GST Number"      value={p.gstNumber} />
          <InfoRow label="PAN Number"      value={p.panNumber} />
          <InfoRow label="License Number"  value={p.licenseNumber} />
          <InfoRow label="Years in Biz"    value={p.yearsInBusiness ? `${p.yearsInBusiness} years` : '—'} />
          <InfoRow label="Total Bays"      value={p.totalBays} />
          <div className="mt-3 space-y-2">
            {[
              { label: 'GST Certificate', path: p.gstCertificatePath },
              { label: 'Trade License',   path: p.tradeLicensePath },
              { label: 'Shop Photo',      path: p.shopPhotoPath },
            ].map(doc => doc.path && (
              <a key={doc.label}
                href={`http://localhost:8080/api/uploads/${doc.path}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-xs text-purple-600 font-semibold hover:underline">
                <FileText size={13} />{doc.label}
              </a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SCOProfile;