import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Eye, User, Clock } from 'lucide-react';
import { fetchUserQueries, fetchQueryDetail, replyToQuery, updateQueryStatus } from '../api';
import {
  SectionHeader, Table, Pagination, StatusBadge,
  FilterBar, Modal, PageLoader, ErrorBlock, DetailRow, Card, Spinner, EmptyState
} from '../components/UI';

const QueriesPage = () => {
  const [data, setData]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [filters, setFilters]   = useState({ status: '', category: '', search: '' });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [selected, setSelected] = useState(null);
  const limit = 12;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUserQueries({ page, limit, ...filters });
      setData(res.data || res.queries || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const updateFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  const columns = [
    { key: 'ticketId',  label: 'Ticket ID',  render: v => <span className="font-mono text-xs text-gray-500">{v || '—'}</span> },
    { key: 'subject',   label: 'Subject',    render: v => <span className="font-semibold text-gray-800 max-w-xs truncate block">{v}</span> },
    { key: 'userName',  label: 'User',       render: (v, r) => (
      <div>
        <p className="text-sm font-medium text-gray-800">{v}</p>
        <p className="text-xs text-gray-400">{r.userEmail}</p>
      </div>
    )},
    { key: 'category',  label: 'Category',   render: v => v ? <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{v}</span> : '—' },
    { key: 'status',    label: 'Status',     render: v => <StatusBadge status={v} /> },
    { key: 'createdAt', label: 'Raised On',  render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: '_id',       label: 'Action',     render: (_, row) => (
      <button
        onClick={e => { e.stopPropagation(); setSelected(row._id || row.id); }}
        className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
      >
        <Eye size={13} /> View
      </button>
    )},
  ];

  return (
    <div>
      <SectionHeader
        title="User Queries"
        subtitle={`${total} total tickets`}
      />

      <Card>
        <FilterBar
          filters={[
            { key: 'status', type: 'select', options: [
              { value: '', label: 'All Statuses' },
              { value: 'open',     label: 'Open' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed',   label: 'Closed' },
            ]},
            { key: 'category', type: 'select', options: [
              { value: '', label: 'All Categories' },
              { value: 'Billing',     label: 'Billing' },
              { value: 'Technical',   label: 'Technical' },
              { value: 'Service',     label: 'Service' },
              { value: 'Account',     label: 'Account' },
              { value: 'Other',       label: 'Other' },
            ]},
            { key: 'search', type: 'text', placeholder: 'Search subject or user…' },
          ]}
          values={filters}
          onChange={updateFilter}
        />

        {error ? (
          <ErrorBlock message={error} onRetry={load} />
        ) : (
          <>
            <Table
              columns={columns}
              data={data}
              loading={loading}
              onRowClick={row => setSelected(row._id || row.id)}
              emptyIcon={MessageSquare}
              emptyTitle="No queries found"
              emptySubtitle="User queries will appear here"
            />
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} />
          </>
        )}
      </Card>

      <QueryDetailModal
        open={!!selected}
        queryId={selected}
        onClose={() => setSelected(null)}
        onAction={load}
      />
    </div>
  );
};

/* ── Query Detail Modal ────────────────────────────────────────── */
const QueryDetailModal = ({ open, queryId, onClose, onAction }) => {
  const [detail, setDetail]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [reply, setReply]       = useState('');
  const [sending, setSending]   = useState(false);
  const [statusLoad, setStatusLoad] = useState(false);

  useEffect(() => {
    if (!open || !queryId) return;
    setDetail(null);
    setReply('');
    setLoading(true);
    fetchQueryDetail(queryId)
      .then(d => setDetail(d))
      .catch(e => setDetail({ error: e.message }))
      .finally(() => setLoading(false));
  }, [open, queryId]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await replyToQuery(queryId, reply);
      setReply('');
      const d = await fetchQueryDetail(queryId);
      setDetail(d);
      onAction();
    } catch (e) { alert(e.message); }
    finally { setSending(false); }
  };

  const handleStatus = async (status) => {
    setStatusLoad(true);
    try {
      await updateQueryStatus(queryId, status);
      const d = await fetchQueryDetail(queryId);
      setDetail(d);
      onAction();
    } catch (e) { alert(e.message); }
    finally { setStatusLoad(false); }
  };

  const d = detail || {};

  return (
    <Modal open={open} onClose={onClose} title={d.subject || 'Query Details'} maxWidth="max-w-2xl">
      {loading ? <PageLoader /> : detail?.error ? (
        <p className="text-red-500 text-sm">{detail.error}</p>
      ) : (
        <div className="space-y-5">
          {/* Meta */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 text-center">
              <p className="text-xs text-gray-400 mb-1">Ticket ID</p>
              <p className="font-mono text-sm font-bold text-gray-800">{d.ticketId || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 text-center">
              <p className="text-xs text-gray-400 mb-1">Category</p>
              <p className="text-sm font-bold text-gray-800">{d.category || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 text-center">
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <div className="flex justify-center"><StatusBadge status={d.status} /></div>
            </div>
          </div>

          {/* User info */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">User</p>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <User size={18} className="text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{d.userName}</p>
                <p className="text-xs text-gray-400">{d.userEmail} · {d.userPhone || ''}</p>
              </div>
            </div>
          </div>

          {/* Original message */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Message</p>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{d.message}</p>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <Clock size={11} />
                {d.createdAt ? new Date(d.createdAt).toLocaleString() : ''}
              </p>
            </div>
          </div>

          {/* Conversation thread */}
          {d.replies && d.replies.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Conversation</p>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {d.replies.map((r, i) => (
                  <div
                    key={i}
                    className={`flex gap-2.5 ${r.sender === 'admin' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${r.sender === 'admin' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {r.sender === 'admin' ? 'A' : (d.userName?.charAt(0) || 'U')}
                    </div>
                    <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${r.sender === 'admin' ? 'bg-red-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                      <p className="leading-relaxed">{r.message}</p>
                      <p className={`text-xs mt-1.5 ${r.sender === 'admin' ? 'text-red-200' : 'text-gray-400'}`}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reply box */}
          {d.status !== 'closed' && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Reply</p>
              <textarea
                rows={3}
                placeholder="Type your reply…"
                value={reply}
                onChange={e => setReply(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleReply}
                  disabled={sending || !reply.trim()}
                  className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {sending ? <Spinner size={14} /> : <Send size={14} />}
                  Send Reply
                </button>
                {d.status === 'open' && (
                  <button
                    onClick={() => handleStatus('resolved')}
                    disabled={statusLoad}
                    className="flex items-center gap-2 border border-green-500 text-green-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-50 transition-colors disabled:opacity-50"
                  >
                    Mark Resolved
                  </button>
                )}
                {d.status !== 'closed' && (
                  <button
                    onClick={() => handleStatus('closed')}
                    disabled={statusLoad}
                    className="flex items-center gap-2 border border-gray-300 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default QueriesPage;
