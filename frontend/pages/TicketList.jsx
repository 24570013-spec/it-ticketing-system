import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTickets } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PageLayout from '../src/components/PageLayout';
import StatusBadge from '../src/components/StatusBadge';

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function SLABadge({ sla }) {
  if (!sla || !sla.deadline) return <span style={{ color: '#a0aec0' }}>—</span>;
  const color = sla.status === 'breached' ? '#c53030' : sla.status === 'warning' ? '#c05621' : '#276749';
  const bg    = sla.status === 'breached' ? '#fff5f5' : sla.status === 'warning' ? '#fffaf0' : '#f0fff4';
  return (
    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: bg, color }}>
      {sla.status === 'breached' ? 'Breached' : sla.status === 'warning' ? 'Warning' : 'OK'}
    </span>
  );
}

function EskBadge({ ticket }) {
  if (!ticket.sla_deadline) return <span style={{ color: '#a0aec0' }}>—</span>;
  const isBreached = ticket.sla && ticket.sla.status === 'breached';
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: isBreached ? '#c53030' : '#276749' }}>
      {isBreached ? '⚠️ Ya' : '✓ Tidak'}
    </span>
  );
}

// ── Column definitions ────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'id',               label: 'No Tiket',              width: 70 },
  { key: 'nama_store',       label: 'Nama Store',            width: 130 },
  { key: 'category_name',    label: 'Kategori',              width: 100 },
  { key: 'title',            label: 'Masalah',               width: 180 },
  { key: 'priority',         label: 'Prioritas',             width: 80 },
  { key: 'status',           label: 'Status',                width: 90 },
  { key: 'eskalasi',         label: 'Eskalasi',              width: 70 },
  { key: 'waktu_eskalasi',   label: 'Waktu Eskalasi',        width: 110 },
  { key: 'waktu_sla',        label: 'Waktu SLA',             width: 90 },
  { key: 'tanggal_open',     label: 'Tanggal Ticket Open',   width: 110 },
  { key: 'tanggal_progress', label: 'Tanggal Ticket On Progress', width: 120 },
  { key: 'tanggal_resolved', label: 'Tanggal Ticket Resolved', width: 120 },
  { key: 'description',      label: 'Detail Masalah',        width: 180 },
  { key: 'assigned_to_name', label: 'Dikerjakan Oleh',       width: 110 },
];

const PRIORITY_COLORS = { high: '#c53030', medium: '#c05621', low: '#276749' };
const PRIORITY_BG     = { high: '#fff5f5', medium: '#fffaf0', low: '#f0fff4' };

// ── Main Component ────────────────────────────────────────────────────────────
export default function TicketList() {
  const { user }                    = useAuth();
  const navigate                    = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initStatus = searchParams.get('status') || '';

  const [tickets,    setTickets]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState(initStatus);
  const [priority,   setPriority]   = useState('');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const LIMIT = 20;

  // Sync status dari URL
  useEffect(() => {
    const s = searchParams.get('status') || '';
    setStatus(s);
    setPage(1);
  }, [searchParams]);

  const fetchTickets = useCallback(() => {
    setLoading(true);
    setError('');
    const params = { page, limit: LIMIT };
    if (search)   params.search   = search;
    if (status)   params.status   = status;
    if (priority) params.priority = priority;
    if (dateFrom) params.from     = dateFrom;
    if (dateTo)   params.to       = dateTo;
    getTickets(params)
      .then(res => {
        setTickets(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      })
      .catch(e => setError(e.response?.data?.message || 'Gagal memuat tiket.'))
      .finally(() => setLoading(false));
  }, [page, search, status, priority, dateFrom, dateTo]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const titleMap = {
    open:        '📂 Tiket Open',
    in_progress: '⏳ Tiket Pending',
    resolved:    '💬 Tiket Resolved',
    closed:      '✅ Tiket Close',
    '':          '🎫 Semua Tiket',
  };

  const handleStatusChange = (val) => {
    setStatus(val);
    setPage(1);
    if (val) setSearchParams({ status: val });
    else setSearchParams({});
  };

  return (
    <PageLayout>
      <div style={{ padding: '20px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: '#718096', marginBottom: 4 }}>
              <span onClick={() => navigate('/')} style={{ cursor: 'pointer', color: '#3182ce' }}>Dashboard</span>
              {' › '}{titleMap[status] || 'Tiket'}
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#2d3748' }}>
              {titleMap[status] || 'Tiket'}
              <span style={{ fontSize: 13, fontWeight: 400, color: '#718096', marginLeft: 8 }}>
                ({total} tiket)
              </span>
            </h2>
          </div>
          <button
            onClick={() => navigate('/tickets/new')}
            style={{ padding: '7px 16px', background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: user?.role === 'engineer' ? 'none' : 'block' }}
          >
            + Buat Tiket
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="🔍 Cari masalah / nama store…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, minWidth: 220 }}
          />
          <select value={status} onChange={e => handleStatusChange(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }}>
            <option value="">Semua Status</option>
            <option value="open">Open</option>
            <option value="waiting">Waiting</option>
            <option value="in_progress">In Progress</option>
            <option value="checking">Checking</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select value={priority} onChange={e => { setPriority(e.target.value); setPage(1); }}
            style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }}>
            <option value="">Semua Prioritas</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          {/* Date filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#718096', whiteSpace: 'nowrap' }}>Dari:</span>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              style={{ padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#718096', whiteSpace: 'nowrap' }}>Sampai:</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
              style={{ padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }} />
          </div>
          {(dateFrom || dateTo || search || priority) && (
            <button
              onClick={() => { setSearch(''); setPriority(''); setDateFrom(''); setDateTo(''); setPage(1); }}
              style={{ padding: '5px 12px', background: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}
            >
              ✕ Reset
            </button>
          )}
        </div>

        {/* Error */}
        {error && <p style={{ color: '#e53e3e', fontSize: 13 }}>{error}</p>}
        {loading && <p style={{ color: '#718096', fontSize: 13 }}>Memuat…</p>}

        {/* Table */}
        {!loading && (
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%', minWidth: 1400 }}>
              <thead>
                <tr style={{ background: '#2b6cb0' }}>
                  {COLUMNS.map(col => (
                    <th key={col.key} style={{
                      padding: '10px 10px',
                      color: '#fff',
                      fontWeight: 600,
                      textAlign: 'left',
                      borderRight: '1px solid rgba(255,255,255,0.15)',
                      whiteSpace: 'nowrap',
                      minWidth: col.width,
                      fontSize: 11,
                    }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} style={{ padding: 24, textAlign: 'center', color: '#a0aec0' }}>
                      Tidak ada tiket ditemukan
                    </td>
                  </tr>
                )}
                {tickets.map((t, idx) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    style={{ cursor: 'pointer', background: idx % 2 === 0 ? '#fff' : '#f7fafc', borderBottom: '1px solid #edf2f7' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#ebf8ff'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f7fafc'}
                  >
                    {/* No Tiket */}
                    <td style={td}><strong style={{ color: '#3182ce' }}>#{t.id}</strong></td>

                    {/* Nama Store */}
                    <td style={td}>{t.nama_store || <span style={{ color: '#a0aec0' }}>—</span>}</td>

                    {/* Kategori */}
                    <td style={td}>
                      {t.category_name
                        ? <span style={{ background: '#ebf8ff', color: '#2b6cb0', padding: '2px 7px', borderRadius: 10, fontWeight: 600, fontSize: 11 }}>{t.category_name}</span>
                        : <span style={{ color: '#a0aec0' }}>—</span>}
                    </td>

                    {/* Masalah */}
                    <td style={{ ...td, maxWidth: 200 }}>
                      <span title={t.title} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.title}
                      </span>
                    </td>

                    {/* Prioritas */}
                    <td style={td}>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: PRIORITY_BG[t.priority], color: PRIORITY_COLORS[t.priority] }}>
                        {t.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={td}><StatusBadge status={t.status} /></td>

                    {/* Eskalasi */}
                    <td style={{ ...td, textAlign: 'center' }}><EskBadge ticket={t} /></td>

                    {/* Waktu Eskalasi */}
                    <td style={td}>{t.sla_deadline ? fmtDateTime(t.sla_deadline) : '—'}</td>

                    {/* Waktu SLA */}
                    <td style={td}>
                      {t.sla && t.sla.status
                        ? <SLABadge sla={t.sla} />
                        : <span style={{ color: '#a0aec0' }}>—</span>}
                    </td>

                    {/* Tanggal Open */}
                    <td style={td}>{t.tanggal_open ? fmtDate(t.tanggal_open) : fmtDate(t.created_at)}</td>

                    {/* Tanggal On Progress */}
                    <td style={td}>{fmtDate(t.tanggal_progress)}</td>

                    {/* Tanggal Resolved */}
                    <td style={td}>{fmtDate(t.tanggal_resolved)}</td>

                    {/* Detail Masalah */}
                    <td style={{ ...td, maxWidth: 200 }}>
                      <span title={t.description} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#718096' }}>
                        {t.description}
                      </span>
                    </td>

                    {/* Dikerjakan Oleh */}
                    <td style={td}>{t.assigned_to_name || <span style={{ color: '#a0aec0' }}>Belum assign</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 12, color: '#718096' }}>
              Halaman {page} / {totalPages} · {total} tiket
            </span>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
              style={{ padding: '4px 12px', borderRadius: 5, border: '1px solid #e2e8f0', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 12, opacity: page === 1 ? 0.5 : 1 }}>
              ‹ Prev
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
              style={{ padding: '4px 12px', borderRadius: 5, border: '1px solid #e2e8f0', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 12, opacity: page === totalPages ? 0.5 : 1 }}>
              Next ›
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

const td = { padding: '8px 10px', color: '#2d3748', borderRight: '1px solid #edf2f7', verticalAlign: 'middle' };
