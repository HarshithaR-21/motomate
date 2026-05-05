import { useState } from 'react';
import { Star, X, Loader2, CheckCircle2, Wrench } from 'lucide-react';

const BASE_URL = 'http://localhost:8080';

/**
 * RatingModal
 *
 * Shown to the customer after job status becomes COMPLETED.
 * Calls PUT /api/services/{booking.id}/rate
 *
 * Props:
 *   booking      object   needs: .id, .assignedWorkerName, .vehicleNumber
 *   onClose      () => void
 *   onSubmitted  () => void
 */
const RatingModal = ({ booking, onClose, onSubmitted }) => {
  const [rating,     setRating]     = useState(0);
  const [hovered,    setHovered]    = useState(0);
  const [feedback,   setFeedback]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState(null);

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
  const colors = ['', 'text-red-500', 'text-orange-400', 'text-yellow-400', 'text-lime-500', 'text-green-500'];

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      // Calls the existing CustomerServiceController endpoint — no new collection
      const res = await fetch(`${BASE_URL}/api/services/${booking.id}/rate`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rating,
          feedback: feedback.trim() || null,
        }),
      });

      if (res.status === 409) {
        // Already rated — treat as success
        setDone(true);
        setTimeout(() => { onSubmitted?.(); onClose(); }, 1800);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit rating');
      }

      setDone(true);
      setTimeout(() => { onSubmitted?.(); onClose(); }, 2200);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">

        {/* ── Success ── */}
        {done ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <h3 className="font-black text-gray-900 text-xl mb-2">Thank You!</h3>
            <p className="text-gray-500 text-sm">Your feedback helps us improve.</p>
          </div>
        ) : (
          <>
            {/* ── Header gradient ── */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 px-6 pt-8 pb-10">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X size={14} className="text-white" />
              </button>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center mb-3">
                  <Wrench size={28} className="text-white" />
                </div>
                <h2 className="text-white font-black text-xl">Rate Your Technician</h2>
                <p className="text-indigo-200 text-sm mt-1">
                  {booking.assignedWorkerName || 'Your Technician'}
                </p>
                {booking.vehicleNumber && (
                  <p className="text-indigo-300 text-xs mt-0.5 font-mono">{booking.vehicleNumber}</p>
                )}
              </div>
            </div>

            {/* ── Pull-up card ── */}
            <div className="-mt-4 bg-white rounded-t-3xl px-6 pt-6 pb-6 space-y-6">

              {/* Stars */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        size={40}
                        className={`transition-all ${
                          star <= (hovered || rating)
                            ? 'text-amber-400 fill-amber-400 drop-shadow-md'
                            : 'text-gray-200 fill-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className={`text-sm font-bold transition-all ${colors[hovered || rating] || 'text-gray-300'}`}>
                  {labels[hovered || rating] || 'Tap a star to rate'}
                </p>
              </div>

              {/* Feedback */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                  Share your experience (optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="What did you like? Any suggestions?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none transition-all"
                />
              </div>

              {error && (
                <p className="text-red-500 text-xs text-center bg-red-50 rounded-xl px-4 py-2">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><Loader2 size={16} className="animate-spin" /> Submitting…</>
                  : 'Submit Rating'}
              </button>

              <button
                onClick={onClose}
                className="w-full text-center text-gray-400 text-sm hover:text-gray-600 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RatingModal;