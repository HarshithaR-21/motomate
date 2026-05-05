import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import WorkerHeader from '../components/WorkerHeader';
import CurrentJobCard from '../components/CurrentJobCard';
import WorkerJobMapSection from '../WorkerJobMapSection';
import ChatWidget, { ChatButton } from '../../../Components/ChatWidget';
import { PageLoader, ErrorBlock, EmptyState, Card } from '../components/UI';
import { fetchCurrentJob, updateJobStatus } from '../api/workerApi';

const ACTIVE_MAP_STATUSES = ['IN_PROGRESS','REACHED_CENTER','DIAGNOSING','PARTS_ORDERED','WORK_STARTED','TESTING'];

const CurrentJobPage = () => {
  const { worker, onWorkerUpdate, onMenuClick } = useOutletContext() || {};
  const [job,     setJob]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [chatOpen,setChatOpen]= useState(false);

  const load = async () => {
    if (!worker?.id) return;
    setLoading(true); setError(null);
    try { const data = await fetchCurrentJob(worker.id); setJob(data); }
    catch (e) { if (e?.response?.status === 404) setJob(null); else setError(e.message); }
    finally   { setLoading(false); }
  };

  useEffect(() => { load(); }, [worker?.id]);

  const handleStatusUpdate = async (jobId, status) => {
    await updateJobStatus(worker.id, jobId, status);
    if (status === 'COMPLETED') {
      setJob(null);
      onWorkerUpdate?.({ ...worker, availability: 'AVAILABLE' });
    } else {
      setJob(prev => prev ? { ...prev, status } : prev);
    }
  };

  const isMapActive = job ? ACTIVE_MAP_STATUSES.includes(job.status) : false;

  return (
    <div className="flex-1 overflow-y-auto">
      <WorkerHeader onMenuClick={onMenuClick} title="Current Job" subtitle="Your active assignment" onRefresh={load} loading={loading} />

      <div className="p-4 sm:p-6 max-w-2xl">
        {loading ? <PageLoader /> : error ? <ErrorBlock message={error} onRetry={load} /> : !job ? (
          <Card>
            <EmptyState icon={ClipboardCheck} title="No Active Job" description="Accept an incoming request to start working." />
          </Card>
        ) : (
          <>
            <CurrentJobCard job={job} onStatusUpdate={handleStatusUpdate} loading={false} />

            {/* Map */}
            {job.customerLatitude && job.customerLongitude && (
              <WorkerJobMapSection workerId={worker?.id} job={job} isActive={isMapActive} />
            )}

            {/* Chat button — fixed bottom right */}
            <div className="fixed bottom-6 right-6 z-40">
              <ChatButton onClick={() => setChatOpen(o => !o)} />
            </div>

            {/* Chat widget */}
            <ChatWidget
              bookingId={job.id || job.requestId}
              myRole="WORKER"
              myName={worker?.name || worker?.workerName || 'Technician'}
              otherName={job.customerName || 'Customer'}
              isOpen={chatOpen}
              onClose={() => setChatOpen(false)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default CurrentJobPage;
