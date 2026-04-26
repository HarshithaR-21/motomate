import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Star, TrendingUp, User } from 'lucide-react';
import WorkerHeader from '../components/WorkerHeader';
import { PageLoader, ErrorBlock, EmptyState, RatingStars, Card, StatCard } from '../components/UI';
import { fetchRatings } from '../api/workerApi';

const RatingsPage = () => {
  const { worker, onMenuClick } = useOutletContext() || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    if (!worker?.id) return;
    setLoading(true); setError(null);
    try {
      const r = await fetchRatings(worker.id);
      setData(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [worker?.id]);

  const ratings = data?.ratings || data || [];
  const avg = data?.averageRating ?? (ratings.length ? ratings.reduce((a, r) => a + (r.rating || 0), 0) / ratings.length : 0);
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: ratings.filter(r => Math.round(r.rating) === star).length,
    pct: ratings.length ? (ratings.filter(r => Math.round(r.rating) === star).length / ratings.length) * 100 : 0,
  }));

  return (
    <div className="flex-1 overflow-y-auto">
      <WorkerHeader
        onMenuClick={onMenuClick}
        title="Ratings & Feedback"
        subtitle="Customer reviews for your service"
        onRefresh={load}
        loading={loading}
      />
      <div className="p-4 sm:p-6 max-w-3xl space-y-5">
        {loading ? <PageLoader /> : error ? <ErrorBlock message={error} onRetry={load} /> : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-5 sm:col-span-1 flex flex-col items-center justify-center text-center">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Average Rating</p>
                <p className="text-5xl font-black text-gray-800">{Number(avg).toFixed(1)}</p>
                <RatingStars rating={avg} size={18} showNumber={false} />
                <p className="text-gray-400 text-xs mt-2">{ratings.length} review{ratings.length !== 1 ? 's' : ''}</p>
              </Card>

              <Card className="p-5 sm:col-span-2">
                <p className="text-gray-700 font-bold text-sm mb-4">Rating Distribution</p>
                <div className="space-y-2">
                  {dist.map(({ star, count, pct }) => (
                    <div key={star} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-12 shrink-0">
                        <span className="text-xs font-semibold text-gray-600">{star}</span>
                        <Star size={11} className="text-amber-400 fill-amber-400" />
                      </div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Reviews */}
            {ratings.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Star}
                  title="No Ratings Yet"
                  description="Customer ratings will appear here after completed jobs."
                />
              </Card>
            ) : (
              <div className="space-y-3">
                <h3 className="text-gray-700 font-bold text-sm">Customer Reviews</h3>
                {ratings.map((r, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                        <User size={16} className="text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-gray-800 font-semibold text-sm">{r.customerName || 'Customer'}</p>
                          <p className="text-gray-400 text-xs">
                            {r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '')}
                          </p>
                        </div>
                        <RatingStars rating={r.rating || 0} size={13} />
                        {r.vehicleNumber && (
                          <p className="text-gray-400 text-xs mt-1 font-mono">{r.vehicleNumber}</p>
                        )}
                        {r.feedback && (
                          <p className="text-gray-600 text-sm mt-2 leading-relaxed italic">"{r.feedback}"</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RatingsPage;
