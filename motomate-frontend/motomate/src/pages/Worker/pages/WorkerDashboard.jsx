import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CheckCircle2, Briefcase, Clock, Star, Calendar, Wrench } from 'lucide-react';
import { StatCard, Card, PageLoader, ErrorBlock, StatusBadge, EmptyState, SectionHeader } from '../components/UI';
import AvailabilityCard from '../components/AvailabilityCard';
import CurrentJobCard from '../components/CurrentJobCard';
import WorkerHeader from '../components/WorkerHeader';
import {
  fetchWorkerStats, fetchCurrentJob,
  updateWorkerStatus, updateJobStatus,
  acceptJob, rejectJob,
} from '../api/workerApi';

const WorkerDashboard = () => {
  const { worker, onWorkerUpdate, onMenuClick } = useOutletContext() || {};
  const [stats, setStats]           = useState(null);
  const [currentJob, setCurrentJob] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const load = async () => {
    if (!worker?.id) return;
    setLoading(true); setError(null);
    try {
      const [s, j] = await Promise.allSettled([
        fetchWorkerStats(worker.id),
        fetchCurrentJob(worker.id),
      ]);
      if (s.status === 'fulfilled') setStats(s.value);
      if (j.status === 'fulfilled') setCurrentJob(j.value);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [worker?.id]);

  // ── Worker availability status ────────────────────────────────────────────
  const handleStatusUpdate = async (status) => {
    setStatusLoading(true);
    try {
      await updateWorkerStatus(worker.id, status);
      onWorkerUpdate?.({ ...worker, availability: status });
    } finally {
      setStatusLoading(false);
    }
  };

  // ── Accept job (ASSIGNED → IN_PROGRESS) ──────────────────────────────────
  const handleAcceptJob = async (jobId) => {
    try {
      await acceptJob(worker.id, jobId);

      // 1. Immediately flip to IN_PROGRESS so the status dropdown appears
      //    without waiting for a network round-trip.
      setCurrentJob(prev => prev ? { ...prev, status: 'IN_PROGRESS' } : prev);
      onWorkerUpdate?.({ ...worker, availability: 'BUSY' });

      // 2. Re-fetch after a short delay to confirm server state.
      //    Skips a full load() so we don't flash the spinner or accidentally
      //    snap back to ASSIGNED if the SSE triggers a re-render in between.
      setTimeout(async () => {
        try {
          const fresh = await fetchCurrentJob(worker.id);
          if (fresh) setCurrentJob(fresh);
        } catch (_) { /* silent — local state is already correct */ }
      }, 1500);

    } catch (err) {
      // Accept failed on the backend — restore accurate state from server
      console.error('[handleAcceptJob] failed:', err);
      const restored = await fetchCurrentJob(worker.id).catch(() => null);
      setCurrentJob(restored);
      throw err;
    }
  };

  // ── Reject job (ASSIGNED → PENDING, returned to SCO) ─────────────────────
  const handleRejectJob = async (jobId, reason) => {
    try {
      await rejectJob(worker.id, jobId, reason);
      setCurrentJob(null);
      onWorkerUpdate?.({ ...worker, availability: 'AVAILABLE' });
    } catch (err) {
      console.error('[handleRejectJob] failed:', err);
      const restored = await fetchCurrentJob(worker.id).catch(() => null);
      setCurrentJob(restored);
      throw err;
    }
  };

  // ── Update in-progress job status ────────────────────────────────────────
  const handleJobStatus = async (jobId, status) => {
    try {
      await updateJobStatus(worker.id, jobId, status);

      if (status === 'COMPLETED') {
        setCurrentJob(null);
        onWorkerUpdate?.({ ...worker, availability: 'AVAILABLE' });
        fetchWorkerStats(worker.id).then(setStats).catch(() => {});
      } else {
        // Optimistically update so the dropdown reflects the new status immediately
        setCurrentJob(prev => prev ? { ...prev, status } : prev);

        // Confirm from server after short delay
        setTimeout(async () => {
          try {
            const fresh = await fetchCurrentJob(worker.id);
            if (fresh) setCurrentJob(fresh);
          } catch (_) { /* silent */ }
        }, 1500);
      }
    } catch (err) {
      console.error('[handleJobStatus] failed:', err);
      const restored = await fetchCurrentJob(worker.id).catch(() => null);
      setCurrentJob(restored);
      throw err;
    }
  };

  if (!worker) return <PageLoader />;

  const s     = stats || {};
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <WorkerHeader
        onMenuClick={onMenuClick}
        title="Dashboard"
        subtitle={today}
        onRefresh={load}
        loading={loading}
      />

      <div className="p-4 sm:p-6 space-y-6 w-full">

        {/* Welcome banner */}
        <div
          className="rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #166534 0%, #15803d 50%, #16a34a 100%)' }}
        >
          <div className="relative z-10">
            <p className="text-green-200 text-sm font-medium">Good {getGreeting()},</p>
            <h2 className="text-white font-bold text-xl sm:text-2xl mt-0.5">{worker.name || 'Worker'}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {worker.role && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-white backdrop-blur-sm">
                  <Wrench size={11} /> {worker.role}
                </span>
              )}
              {worker.serviceCenterId && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-white backdrop-blur-sm">
                  <Calendar size={11} /> Service Center
                </span>
              )}
              <StatusBadge status={worker.availability || 'AVAILABLE'} />
            </div>
          </div>
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -right-4 -bottom-12 w-56 h-56 rounded-full bg-white/5" />
        </div>

        {/* Stats row */}
        {loading ? <PageLoader /> : error ? <ErrorBlock message={error} onRetry={load} /> : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={CheckCircle2} label="Jobs Completed"  value={s.completedJobs ?? worker.completedJobs ?? 0}  color="green"  />
              <StatCard icon={Briefcase}   label="Active Job"       value={currentJob ? 1 : 0}                            color="blue"   />
              <StatCard icon={Clock}       label="Pending Requests" value={s.pendingRequests ?? 0}                         color="amber"  />
              <StatCard icon={Star}        label="Avg Rating"
                value={
                  s.averageRating != null
                    ? Number(s.averageRating).toFixed(1)
                    : worker.rating
                    ? Number(worker.rating).toFixed(1)
                    : '—'
                }
                color="purple"
              />
            </div>

            {/* Skills */}
            {worker.skills?.length > 0 && (
              <Card className="p-5">
                <SectionHeader title="My Skills" description="Service categories I'm proficient in" />
                <div className="flex flex-wrap gap-2">
                  {worker.skills.map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-green-50 border border-green-100 text-green-700 rounded-xl text-xs font-semibold">
                      {skill}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left: availability + performance */}
          <div className="lg:col-span-1 space-y-4">
            <AvailabilityCard
              status={worker.availability || 'AVAILABLE'}
              onUpdate={handleStatusUpdate}
              loading={statusLoading}
            />
            {!loading && (
              <Card className="p-5">
                <h3 className="text-gray-700 font-bold text-sm mb-3">Performance</h3>
                <div className="space-y-3">
                  <PerfRow label="Completion Rate"   value={s.completionRate ? `${s.completionRate}%` : '—'} bar={s.completionRate}                        color="green" />
                  <PerfRow label="Avg Response Time" value={s.avgResponseTime ? `${s.avgResponseTime} min` : '—'} />
                  <PerfRow label="Customer Rating"   value={s.averageRating ? `${Number(s.averageRating).toFixed(1)} / 5` : '—'} bar={s.averageRating ? s.averageRating * 20 : 0} color="amber" />
                </div>
              </Card>
            )}
          </div>

          {/* Right: current job */}
          <div className="lg:col-span-2">
            <SectionHeader title="Current Job" description="Your active assignment" />
            {loading ? (
              <PageLoader />
            ) : currentJob ? (
              <CurrentJobCard
                job={currentJob}
                onAccept={handleAcceptJob}
                onReject={handleRejectJob}
                onStatusUpdate={handleJobStatus}
                loading={false}
              />
            ) : (
              <Card>
                <EmptyState
                  icon={Briefcase}
                  title="No Active Job"
                  description="You'll see your current job here once a request is assigned to you."
                />
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PerfRow = ({ label, value, bar, color = 'green' }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-700">{value}</span>
    </div>
    {bar != null && (
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color === 'amber' ? 'bg-amber-400' : 'bg-green-500'}`}
          style={{ width: `${Math.min(bar, 100)}%` }}
        />
      </div>
    )}
  </div>
);

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

export default WorkerDashboard;