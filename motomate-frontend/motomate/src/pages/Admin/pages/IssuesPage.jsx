import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Eye, CheckCircle, Clock, Loader2, Send, AlertCircle
} from 'lucide-react';
import {
  fetchIssues, fetchIssueById, replyToIssue, updateIssueStatus
} from '../api';
import {
  SectionHeader, Table, Pagination, StatusBadge,
  FilterBar, Modal, PageLoader, ErrorBlock, DetailRow, Spinner, Card
} from '../components/UI';

// ── Issue Detail & Reply Modal ────────────────────────────────────
const IssueDetailModal = ({ open, onClose, issueId, onAction }) => {
  const [detail, setDetail]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending]     = useState(false);
  const [actLoading, setActLoad]  = useState(false);

  useEffect(() => {
    if (!open || !issueId) return;
    setDetail(null);
    setReplyText('');
    setLoading(true);
    fetchIssueById(issueId)
      .then(d => setDetail(d))
      .catch(e => setDetail({ error: e.message }))
      .finally(() => setLoading(false));
  }, [open, issueId]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const updated = await replyToIssue(issueId, replyText);
      setDetail(updated);
      setReplyText('');
      onAction?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status) => {
    setActLoad(true);
    try {
      const updated = await updateIssueStatus(issueId, status);
      setDetail(updated);
      onAction?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setActLoad(false);
    }
  };

  const d = detail || {};

  const statusColors = {
    OPEN:        'bg-blue-50 border-blue-200 text-blue-700',
    IN_PROGRESS: 'bg-amber-50 border-amber-200 text-amber-700',
    RESOLVED:    'bg-green-50 border-green-200 text-green-700',
  };

  return (
    <Modal open={open} onClose={onClose} title="Issue Details" maxWidth="max-w-2xl">
      {loading ? <PageLoader /> : detail?.error ? (
        <p className="text-red-500 text-sm">{detail.error}</p>
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className={`flex items-start gap-4 p-4 rounded-xl border ${statusColors[d.status] || statusColors.OPEN}`}>
            <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
              <MessageSquare size={18} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{d.subject}</p>
              <p className="text-xs mt-0.5 opacity-70">
                {d.ticketId} · {d.category} · {d.createdAt ? new Date(d.createdAt).toLocaleString() : ''}
              </p>
            </div>
            <StatusBadge status={d.status?.toLowerCase()} />
          </div>

          {/* User Info */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Raised By</p>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <DetailRow label="Name"  value={d.userName} />
              <DetailRow label="Email" value={d.userEmail} />
              <DetailRow label="Phone" value={d.userPhone} />
            </div>
          </div>

          {/* Original Message */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Issue Description</p>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
              {d.message || 'No description provided.'}
            </div>
          </div>

          {/* Replies Thread */}
          {d.replies?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                Conversation ({d.replies.length})
              </p>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {d.replies.map((r, i) => (
                  <div key={i} className={`flex gap-3 ${r.sender === 'admin' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
                      ${r.sender === 'admin' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {r.sender === 'admin' ? 'A' : (d.userName?.charAt(0) || 'U')}
                    </div>
                    <div className={`flex-1 max-w-xs rounded-2xl px-4 py-2.5 text-sm
                      ${r.sender === 'admin'
                        ? 'bg-red-600 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                      }`}>
                      <p>{r.message}</p>
                      <p className={`text-[10px] mt-1 ${r.sender === 'admin' ? 'text-red-200' : 'text-gray-400'}`}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reply Box */}
          {d.status !== 'RESOLVED' && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Reply</p>
              <div className="flex gap-2">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply to the user…"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                />
                <button
                  onClick={handleReply}
                  disabled={sending || !replyText.trim()}
                  className="px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  {sending ? <Spinner size={16} /> : <Send size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Update Status</p>
            <div className="flex gap-2 flex-wrap">
              {d.status !== 'OPEN' && (
                <button onClick={() => handleStatusChange('OPEN')} disabled={actLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-blue-200 text-blue-700 bg-blue-50 text-xs font-semibold hover:bg-blue-100 disabled:opacity-50 transition-colors">
                  <Clock size={13} /> Mark Open
                </button>
              )}
              {d.status !== 'IN_PROGRESS' && (
                <button onClick={() => handleStatusChange('IN_PROGRESS')} disabled={actLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-200 text-amber-700 bg-amber-50 text-xs font-semibold hover:bg-amber-100 disabled:opacity-50 transition-colors">
                  <AlertCircle size={13} /> Mark In Progress
                </button>
              )}
              {d.status !== 'RESOLVED' && (
                <button onClick={() => handleStatusChange('RESOLVED')} disabled={actLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-green-200 text-green-700 bg-green-50 text-xs font-semibold hover:bg-green-100 disabled:opacity-50 transition-colors">
                  {actLoading ? <Spinner size={13} /> : <CheckCircle size={13} />} Mark Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

// ── Main Issues Page ──────────────────────────────────────────────
const IssuesPage = () => {
  const [data, setData]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [filters, setFilters]   = useState({ status: '', category: '', search: '' });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [selected, setSelected] = useState(null);
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIssues({ page: page - 1, size: limit, ...filters });
      setData(res.data || []);
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
    { key: 'ticketId',  label: 'Ticket ID', render: v => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{v || '—'}</span> },
    { key: 'subject',   label: 'Subject',   render: v => <span className="font-semibold text-gray-800 text-xs">{v}</span> },
    { key: 'userName',  label: 'User',      render: (v, r) => (
      <div>
        <p className="text-xs font-medium text-gray-800">{v}</p>
        <p className="text-[10px] text-gray-400">{r.userEmail}</p>
      </div>
    )},
    { key: 'category',  label: 'Category',  render: v => <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{v}</span> },
    { key: 'status',    label: 'Status',    render: v => <StatusBadge status={v?.toLowerCase()} /> },
    { key: 'createdAt', label: 'Raised On', render: v => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'replies',   label: 'Replies',   render: v => <span className="text-xs font-semibold text-gray-500">{Array.isArray(v) ? v.length : 0}</span> },
    { key: 'id',        label: 'Action',    render: (_, row) => (
      <button
        onClick={e => { e.stopPropagation(); setSelected(row.id || row._id); }}
        className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
      >
        <Eye size={13} /> View
      </button>
    )},
  ];

  // Status counts for tabs
  const openCount    = data.filter(d => d.status === 'OPEN').length;
  const progressCount = data.filter(d => d.status === 'IN_PROGRESS').length;

  return (
    <div>
      <SectionHeader
        title="Issue Management"
        subtitle={`${total} total issues`}
        actions={
          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              {openCount} Open
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
              {progressCount} In Progress
            </span>
          </div>
        }
      />

      <Card>
        <FilterBar
          filters={[
            { key: 'status', type: 'select', options: [
              { value: '',            label: 'All Statuses' },
              { value: 'OPEN',        label: 'Open' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'RESOLVED',    label: 'Resolved' },
            ]},
            { key: 'category', type: 'select', options: [
              { value: '',          label: 'All Categories' },
              { value: 'Service',   label: 'Service' },
              { value: 'Billing',   label: 'Billing' },
              { value: 'Technical', label: 'Technical' },
              { value: 'Account',   label: 'Account' },
              { value: 'Other',     label: 'Other' },
            ]},
            { key: 'search', type: 'text', placeholder: 'Search subject, user…' },
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
              onRowClick={row => setSelected(row.id || row._id)}
              emptyIcon={MessageSquare}
              emptyTitle="No issues found"
              emptySubtitle="User-raised issues will appear here"
            />
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} />
          </>
        )}
      </Card>

      <IssueDetailModal
        open={!!selected}
        onClose={() => setSelected(null)}
        issueId={selected}
        onAction={load}
      />
    </div>
  );
};

export default IssuesPage;
