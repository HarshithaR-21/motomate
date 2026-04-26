import { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BriefcaseBusiness, Bell } from 'lucide-react';
import WorkerHeader from '../components/WorkerHeader';
import IncomingJobCard from '../components/IncomingJobCard';
import { PageLoader, ErrorBlock, EmptyState } from '../components/UI';
import { fetchIncomingJobs, acceptJob, rejectJob } from '../api/workerApi';

const IncomingJobsPage = () => {
  const { worker, onWorkerUpdate, onMenuClick } = useOutletContext() || {};
  const [jobs, setJobs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  // Tracks IDs of jobs that just arrived via SSE so we can highlight them
  const [newJobIds, setNewJobIds]     = useState(new Set());

  // ── Load / refresh jobs ──────────────────────────────────────────────
  const load = useCallback(async (silent = false) => {
    if (!worker?.id) return;
    if (!silent) { setLoading(true); setError(null); }
    try {
      const data = await fetchIncomingJobs(worker.id);
      setJobs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [worker?.id]);

  useEffect(() => { load(); }, [load]);

  // ── Register global refresh hook used by WorkerLayout's SSE handler ──
  // WorkerLayout calls window.__workerJobRefresh() after every SSE event.
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);

  useEffect(() => {
    // Register: silent refresh + mark new jobs
    window.__workerJobRefresh = async (incomingData) => {
      if (!worker?.id) return;
      // Silently re-fetch the list
      try {
        const data = await fetchIncomingJobs(worker.id);
        if (Array.isArray(data)) {
          setJobs(prev => {
            const existingIds = new Set(prev.map(j => j.id));
            const arrivedIds  = data
              .filter(j => !existingIds.has(j.id))
              .map(j => j.id);
            if (arrivedIds.length > 0) {
              setNewJobIds(ids => new Set([...ids, ...arrivedIds]));
              // Remove "new" badge after 10 s
              setTimeout(() => {
                setNewJobIds(ids => {
                  const next = new Set(ids);
                  arrivedIds.forEach(id => next.delete(id));
                  return next;
                });
              }, 10_000);
            }
            return data;
          });
        }
      } catch {
        // ignore silent refresh errors
      }
    };

    return () => { window.__workerJobRefresh = null; };
  }, [worker?.id]);

  // ── Accept / Reject handlers ─────────────────────────────────────────
  const handleAccept = async (jobId) => {
    setActionLoading(jobId);
    try {
      await acceptJob(worker.id, jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
      setNewJobIds(ids => { const n = new Set(ids); n.delete(jobId); return n; });
      onWorkerUpdate?.({ ...worker, availability: 'BUSY' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (jobId, reason) => {
    setActionLoading(jobId);
    try {
      await rejectJob(worker.id, jobId, reason);
      setJobs(prev => prev.filter(j => j.id !== jobId));
      setNewJobIds(ids => { const n = new Set(ids); n.delete(jobId); return n; });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <WorkerHeader
        onMenuClick={onMenuClick}
        title="Incoming Requests"
        subtitle={`${jobs.length} pending assignment${jobs.length !== 1 ? 's' : ''}`}
        onRefresh={() => load(false)}
        loading={loading}
      />

      <div className="p-4 sm:p-6 max-w-3xl">
        {loading ? (
          <PageLoader />
        ) : error ? (
          <ErrorBlock message={error} onRetry={() => load(false)} />
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <EmptyState
              icon={BriefcaseBusiness}
              title="No Incoming Requests"
              description="New service requests assigned to you will appear here in real-time."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="relative">
                {/* "NEW" pulse badge for SSE-arrived jobs */}
                {newJobIds.has(job.id) && (
                  <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md animate-bounce">
                    <Bell size={10} /> NEW
                  </div>
                )}
                <IncomingJobCard
                  job={job}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  loading={actionLoading === job.id}
                  highlight={newJobIds.has(job.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomingJobsPage;
