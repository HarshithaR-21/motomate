import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Star, TrendingUp, User, Award, MessageSquare, Calendar, Car, RefreshCw } from 'lucide-react';
import WorkerHeader from '../components/WorkerHeader';
import { PageLoader, ErrorBlock, EmptyState, Card } from '../components/UI';
import { fetchRatings } from '../api/workerApi';

// ── Star display ──────────────────────────────────────────────────────────────
const StarRow = ({ rating = 0, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        size={size}
        className={i <= Math.round(rating)
          ? 'text-amber-400 fill-amber-400'
          : 'text-gray-200 fill-gray-200'}
      />
    ))}
  </div>
);

// ── Average hero card ─────────────────────────────────────────────────────────
const AverageHero = ({ avg, total }) => {
  const pct = (avg / 5) * 100;
  const label =
    avg >= 4.5 ? 'Outstanding' :
    avg >= 4   ? 'Excellent'   :
    avg >= 3.5 ? 'Very Good'   :
    avg >= 3   ? 'Good'        :
    avg >= 2   ? 'Fair'        :
    avg > 0    ? 'Needs Work'  : 'No Ratings Yet';

  return (
    <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
      <div className="flex items-start gap-5">
        {/* Big score */}
        <div className="text-center shrink-0">
          <p className="text-6xl font-black leading-none">
            {avg > 0 ? Number(avg).toFixed(1) : '—'}
          </p>
          <p className="text-indigo-200 text-xs mt-1">out of 5</p>
        </div>

        <div className="flex-1 min-w-0">
          {/* Stars */}
          <div className="flex items-center gap-1.5 mb-3">
            {[1, 2, 3, 4, 5].map(i => (
              <svg key={i} width="22" height="22" viewBox="0 0 24 24"
                fill={i <= Math.round(avg) ? '#FDE68A' : 'rgba(255,255,255,0.2)'} stroke="none">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-amber-300 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 text-white">
              {label}
            </span>
            <p className="text-indigo-200 text-xs">
              {total} review{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Distribution bar ──────────────────────────────────────────────────────────
const DistBar = ({ star, count, total }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const color =
    star >= 4 ? '#34D399' :
    star === 3 ? '#FBBF24' : '#F87171';

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 w-8 shrink-0">
        <span className="text-xs font-bold text-gray-600">{star}</span>
        <Star size={10} className="text-amber-400 fill-amber-400" />
      </div>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-400 w-5 text-right">{count}</span>
    </div>
  );
};

// ── Individual review card ────────────────────────────────────────────────────
const ReviewCard = ({ review }) => {
  const { customerName, vehicleNumber, rating, feedback, date, createdAt } = review;

  const displayDate = date ||
    (createdAt
      ? new Date(createdAt).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric',
        })
      : null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shrink-0 border border-indigo-100">
          <User size={18} className="text-indigo-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-bold text-gray-900 text-sm">
                {customerName || 'Anonymous Customer'}
              </p>
              <StarRow rating={rating ?? 0} size={13} />
            </div>
            {displayDate && (
              <span className="flex items-center gap-1 text-gray-400 text-[11px] shrink-0">
                <Calendar size={10} /> {displayDate}
              </span>
            )}
          </div>

          {vehicleNumber && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-gray-400 font-mono bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg">
              <Car size={9} /> {vehicleNumber}
            </span>
          )}

          {feedback && (
            <p className="text-gray-600 text-sm mt-2 leading-relaxed italic bg-gray-50 rounded-xl px-3 py-2 border-l-2 border-indigo-200">
              "{feedback}"
            </p>
          )}

          {!feedback && (
            <p className="text-gray-300 text-xs mt-1 italic">No written review</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const RatingsPage = () => {
  const { worker, onMenuClick } = useOutletContext() || {};
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState(0); // 0 = all

  const load = async () => {
    if (!worker?.id) return;
    setLoading(true); setError(null);
    try {
      // fetchRatings calls GET /api/worker/{id}/ratings
      // which returns { averageRating, totalRatings, ratings: [...] }
      const r = await fetchRatings(worker.id);
      setData(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [worker?.id]);

  // Normalise: handle both { ratings: [...], averageRating } and plain array
  const ratings    = data?.ratings ?? (Array.isArray(data) ? data : []);
  const avg        = data?.averageRating ??
    (ratings.length
      ? ratings.reduce((a, r) => a + (r.rating ?? 0), 0) / ratings.length
      : 0);
  const total      = data?.totalRatings ?? ratings.length;

  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: ratings.filter(r => Math.round(r.rating ?? 0) === star).length,
  }));

  const filtered = filter === 0
    ? ratings
    : ratings.filter(r => Math.round(r.rating ?? 0) === filter);

  return (
    <div className="flex-1 overflow-y-auto">
      <WorkerHeader
        onMenuClick={onMenuClick}
        title="Ratings & Feedback"
        subtitle="See what customers say about you"
        onRefresh={load}
        loading={loading}
      />

      <div className="p-4 sm:p-6 max-w-2xl space-y-5">
        {loading ? (
          <PageLoader />
        ) : error ? (
          <ErrorBlock message={error} onRetry={load} />
        ) : (
          <>
            {/* ── Average hero ─────────────────────────────────────────── */}
            <AverageHero avg={avg} total={total} />

            {/* ── Distribution + quick stats ──────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {/* Breakdown bars */}
              <div className="sm:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2.5">
                <p className="text-gray-700 font-bold text-sm mb-3 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-indigo-500" /> Rating Breakdown
                </p>
                {dist.map(({ star, count }) => (
                  <DistBar key={star} star={star} count={count} total={total} />
                ))}
              </div>

              {/* Quick stat tiles */}
              <div className="sm:col-span-2 flex flex-col gap-3">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center justify-center text-center flex-1">
                  <Award size={22} className="text-amber-400 mb-1" />
                  <p className="text-2xl font-black text-gray-800">{total}</p>
                  <p className="text-gray-400 text-xs">Total Reviews</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center justify-center text-center flex-1">
                  <MessageSquare size={22} className="text-indigo-400 mb-1" />
                  <p className="text-2xl font-black text-gray-800">
                    {ratings.filter(r => r.feedback).length}
                  </p>
                  <p className="text-gray-400 text-xs">Written Reviews</p>
                </div>
              </div>
            </div>

            {/* ── Filter tabs ──────────────────────────────────────────── */}
            {ratings.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setFilter(0)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    filter === 0
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  All ({ratings.length})
                </button>
                {[5, 4, 3, 2, 1].map(star => {
                  const cnt = dist.find(d => d.star === star)?.count ?? 0;
                  if (cnt === 0) return null;
                  return (
                    <button
                      key={star}
                      onClick={() => setFilter(star)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        filter === star
                          ? 'bg-amber-400 text-white shadow-md shadow-amber-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <Star size={10} className={filter === star ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'} />
                      {star} ({cnt})
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Reviews list ─────────────────────────────────────────── */}
            {ratings.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Star}
                  title="No Ratings Yet"
                  description="Customer ratings will appear here after completed jobs."
                />
              </Card>
            ) : filtered.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">
                No {filter}-star reviews yet
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  {filter === 0
                    ? `All Reviews (${ratings.length})`
                    : `${filter}-Star Reviews (${filtered.length})`}
                </p>
                {filtered.map((r, i) => (
                  <ReviewCard key={r.id || i} review={r} />
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