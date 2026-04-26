import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import WorkerHeader from '../components/WorkerHeader';
import CurrentJobCard from '../components/CurrentJobCard';
import { PageLoader, ErrorBlock, EmptyState, Card } from '../components/UI';
import { fetchCurrentJob, updateJobStatus } from '../api/workerApi';

const CurrentJobPage = () => {
  const { worker, onWorkerUpdate, onMenuClick } = useOutletContext() || {};
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    if (!worker?.id) return;
    setLoading(true); setError(null);
    try {
      const data = await fetchCurrentJob(worker.id);
      setJob(data);
    } catch (e) {
      // 404 = no current job
      if (e?.response?.status === 404) setJob(null);
      else setError(e.message);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="flex-1 overflow-y-auto">
      <WorkerHeader
        onMenuClick={onMenuClick}
        title="Current Job"
        subtitle="Your active assignment"
        onRefresh={load}
        loading={loading}
      />
      <div className="p-4 sm:p-6 max-w-2xl">
        {loading ? <PageLoader /> : error ? <ErrorBlock message={error} onRetry={load} /> : !job ? (
          <Card>
            <EmptyState
              icon={ClipboardCheck}
              title="No Active Job"
              description="Accept an incoming request to start working. Your active job will appear here."
            />
          </Card>
        ) : (
          <CurrentJobCard job={job} onStatusUpdate={handleStatusUpdate} loading={false} />
        )}
      </div>
    </div>
  );
};

export default CurrentJobPage;
