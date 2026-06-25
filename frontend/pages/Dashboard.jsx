import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  Bar, XAxis, YAxis, CartesianGrid, ComposedChart, Line,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, getTickets } from '../services/api';
import PageLayout from '../src/components/PageLayout';
import StatusBadge from '../src/components/StatusBadge';
import PriorityBadge from '../src/components/PriorityBadge';
import { COLORS, card, thStyle, tdStyle, inputStyle, btnPrimary, SHADOW } from '../styles/theme';

const SLA_COLORS = ['#38a169', '#e53e3e'];
const PIE_COLORS = ['#4299e1','#ed8936','#68d391','#a0aec0','#9f7aea','#f687b3','#76e4f7','#fbd38d','#c6f6d5','#feb2b2','#e9d8fd','#bee3f8'];

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, color, to }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => to && navigate(to)}
      style={{
        background: COLORS.bgCard,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flex: 1,
        minWidth: 0,
        boxShadow: SHADOW.sm,
        cursor: to ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s, transform 0.15s',
        borderLeft: `4px solid ${color}`,
      }}
      onMouseEnter={e => { if (to) { e.currentTarget.style.boxShadow = SHADOW.md; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = SHADOW.sm; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 10,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value ?? 0}</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4, whiteSpace: 'nowrap' }}>{label}</div>
      </div>
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {title}
    </h3>
  );
}

function SimpleTable({ col1, col2, rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={thStyle}>{col1}</th>
            <th style={{ ...thStyle, width: 60, textAlign: 'right' }}>{col2}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={2} style={{ padding: 12, textAlign: 'center', color: COLORS.textDisabled }}>Belum ada data</td></tr>
          )}
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid #edf2f7` }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.bgMuted}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <td style={tdStyle}>{row.label}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 12px', fontSize: 12, boxShadow: SHADOW.sm }}>
      <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
}

function Pagination({ page, totalPages, total, onPrev, onNext }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16, justifyContent: 'center' }}>
      <button onClick={onPrev} disabled={page === 1}
        style={{ padding: '5px 14px', borderRadius: 6, border: `1px solid ${COLORS.border}`, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, background: '#fff' }}>
        ‹ Prev
      </button>
      <span style={{ fontSize: 12, color: COLORS.textMuted }}>Halaman {page} / {totalPages} · {total} tiket</span>
      <button onClick={onNext} disabled={page === totalPages}
        style={{ padding: '5px 14px', borderRadius: 6, border: `1px solid ${COLORS.border}`, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1, background: '#fff' }}>
        Next ›
      </button>
    </div>
  );
}

// ── User / Engineer Dashboard ──────────────────────────────────────────────────
function UserDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets,    setTickets]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState(searchParams.get('status') || '');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const isEngineer  = user?.role === 'engineer';
  const LIMIT = 15;

  useEffect(() => {
    const urlStatus = searchParams.get('status') || '';
    setStatus(urlStatus);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: LIMIT };
    if (search) params.search = search;
    if (status) params.status = status;
    getTickets(params)
      .then(res => {
        setTickets(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      })
      .catch(e => setError(e.response?.data?.message || 'Gagal memuat tiket.'))
      .finally(() => setLoading(false));
  }, [page, search, status]);

  const STATUS_LABELS = {
    open: '📂 Tiket Open', waiting: '⏸ Waiting', in_progress: '🔄 In Progress',
    checking: '🔍 Checking', pending: '⏳ Pending', resolved: '✅ Resolved', closed: '🔒 Closed',
  };
  const pageTitle = status ? (STATUS_LABELS[status] || status) : (isEngineer ? 'Tiket Saya (Assigned)' : 'My Tickets');

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: COLORS.textMain }}>{pageTitle}</h2>
          <p style={{ margin: '4px 0 0', color: COLORS.textMuted, fontSize: 12 }}>
            {isEngineer ? 'Tiket yang di-assign ke kamu' : 'Daftar tiket yang kamu buat'} · {total} tiket
          </p>
        </div>
        {!isEngineer && (
          <Link to="/tickets/new" style={{ ...btnPrimary, textDecoration: 'none', display: 'inline-block', padding: '8px 18px' }}>
            + Buat Tiket
          </Link>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="🔍 Cari tiket…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ ...inputStyle, maxWidth: 280 }}
        />
        <select
          value={status}
          onChange={e => { const v = e.target.value; setStatus(v); setPage(1); if (v) setSearchParams({ status: v }); else setSearchParams({}); }}
          style={{ ...inputStyle, width: 'auto' }}
        >
          <option value="">Semua Status</option>
          {['open','waiting','in_progress','checking','pending','resolved','closed'].map(s => (
            <option key={s} value={s}>{s.replace('_',' ')}</option>
          ))}
        </select>
      </div>

      {loading && <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Memuat…</p>}
      {error   && <p style={{ color: COLORS.danger, fontSize: 13 }}>⚠️ {error}</p>}

      {!loading && (
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: 'hidden', boxShadow: SHADOW.sm }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#2b6cb0' }}>
                {['#', 'Judul', isEngineer ? 'Pembuat' : 'Lokasi', 'Kategori', 'Prioritas', 'Status', 'Tanggal'].map(h => (
                  <th key={h} style={{ ...thStyle, background: 'transparent', color: '#fff', borderBottom: 'none' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: COLORS.textDisabled }}>
                  {isEngineer ? 'Belum ada tiket yang di-assign ke kamu' : 'Belum ada tiket'}
                </td></tr>
              )}
              {tickets.map((t, idx) => (
                <tr key={t.id}
                  onClick={() => navigate(`/tickets/${t.id}`)}
                  style={{ background: idx % 2 === 0 ? '#fff' : COLORS.bgMuted, cursor: 'pointer', borderBottom: `1px solid #edf2f7` }}
                  onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : COLORS.bgMuted}
                >
                  <td style={{ ...tdStyle, color: COLORS.primary, fontWeight: 700 }}>#{t.id}</td>
                  <td style={{ ...tdStyle, maxWidth: 200 }}>
                    <span title={t.title} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {isEngineer
                      ? <span style={{ fontSize: 12, color: COLORS.textMuted }}>{t.user_id}</span>
                      : <span style={{ fontSize: 12 }}>{t.nama_store || '—'}</span>
                    }
                  </td>
                  <td style={tdStyle}>
                    {t.category_name
                      ? <span style={{ background: COLORS.primaryLight, color: COLORS.primaryDark, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{t.category_name}</span>
                      : <span style={{ color: COLORS.textDisabled }}>—</span>}
                  </td>
                  <td style={tdStyle}><PriorityBadge priority={t.priority} /></td>
                  <td style={tdStyle}><StatusBadge status={t.status} /></td>
                  <td style={{ ...tdStyle, fontSize: 12, color: COLORS.textMuted }}>
                    {new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total}
        onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
    </div>
  );
}

// ── Admin Ticket List ─────────────────────────────────────────────────────────
function AdminTicketList({ status }) {
  const [tickets,    setTickets]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [, setSearchParams]         = useSearchParams();
  const navigate                    = useNavigate();
  const LIMIT = 15;

  useEffect(() => {
    setLoading(true);
    getTickets({ page, limit: LIMIT, status, search: search || undefined })
      .then(res => {
        setTickets(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      })
      .catch(e => setError(e.response?.data?.message || 'Gagal memuat tiket.'))
      .finally(() => setLoading(false));
  }, [page, search, status]);

  const STATUS_LABELS = {
    open: '📂 Tiket Open', in_progress: '🔄 In Progress', resolved: '✅ Resolved', closed: '🔒 Closed',
    waiting: '⏸ Waiting', checking: '🔍 Checking', pending: '⏳ Pending',
  };

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>
        <span onClick={() => setSearchParams({})} style={{ cursor: 'pointer', color: COLORS.primary }}>Dashboard</span>
        {' › '}{STATUS_LABELS[status] || status}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: COLORS.textMain }}>
          {STATUS_LABELS[status] || status}
          <span style={{ fontSize: 13, fontWeight: 400, color: COLORS.textMuted, marginLeft: 8 }}>({total} tiket)</span>
        </h2>
        <input placeholder="🔍 Cari tiket…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ ...inputStyle, maxWidth: 260 }} />
      </div>

      {error && <p style={{ color: COLORS.danger, fontSize: 13 }}>⚠️ {error}</p>}
      {loading && <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Memuat…</p>}

      {!loading && (
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: 'hidden', boxShadow: SHADOW.sm }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#2b6cb0' }}>
                {['#', 'Judul', 'Kategori', 'Prioritas', 'Pembuat', 'Assignee', 'Tanggal', ''].map(h => (
                  <th key={h} style={{ ...thStyle, background: 'transparent', color: '#fff', borderBottom: 'none' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: COLORS.textDisabled }}>Tidak ada tiket</td></tr>
              )}
              {tickets.map((t, idx) => (
                <tr key={t.id}
                  onClick={() => navigate(`/tickets/${t.id}`)}
                  style={{ background: idx % 2 === 0 ? '#fff' : COLORS.bgMuted, cursor: 'pointer', borderBottom: `1px solid #edf2f7` }}
                  onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : COLORS.bgMuted}
                >
                  <td style={{ ...tdStyle, color: COLORS.primary, fontWeight: 700 }}>#{t.id}</td>
                  <td style={{ ...tdStyle, maxWidth: 180 }}>
                    <span title={t.title} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                  </td>
                  <td style={tdStyle}>
                    {t.category_name
                      ? <span style={{ background: COLORS.primaryLight, color: COLORS.primaryDark, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{t.category_name}</span>
                      : <span style={{ color: COLORS.textDisabled }}>—</span>}
                  </td>
                  <td style={tdStyle}><PriorityBadge priority={t.priority} /></td>
                  <td style={{ ...tdStyle, fontSize: 12, color: COLORS.textMuted }}>#{t.user_id}</td>
                  <td style={{ ...tdStyle, fontSize: 12 }}>{t.assigned_to_name ?? <span style={{ color: COLORS.textDisabled }}>—</span>}</td>
                  <td style={{ ...tdStyle, fontSize: 12, color: COLORS.textMuted }}>
                    {new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: COLORS.primary, fontSize: 12, fontWeight: 600 }}>Lihat ›</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} total={total}
        onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
    </div>
  );
}

// ── Admin Dashboard (Stats) ───────────────────────────────────────────────────
function AdminDashboard() {
  const [searchParams] = useSearchParams();
  const filterStatus   = searchParams.get('status');
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getDashboardStats()
      .then(res => setStats(res.data))
      .catch(e => setError(e.response?.data?.message || 'Gagal memuat statistik.'))
      .finally(() => setLoading(false));
  }, []);

  if (filterStatus) return <AdminTicketList status={filterStatus} />;
  if (loading) return <div style={{ padding: 40, color: COLORS.textMuted }}>Memuat dashboard…</div>;
  if (error)   return <div style={{ padding: 40, color: COLORS.danger }}>⚠️ {error}</div>;

  const slaData = [
    { name: 'Dalam SLA',    value: Number(stats.within_sla   ?? 0) },
    { name: 'Melewati SLA', value: Number(stats.sla_breached ?? 0) },
  ];
  const topUsers  = (stats.top_users  || []).map(u => ({ label: u.name || u.email, value: u.total }));
  const topIssues = (stats.top_issues || []).map(i => ({ label: i.title, value: i.total }));
  const topArea   = (stats.top_priority_area || []).map(a => ({ label: a.area, value: a.total }));
  const monthlyData = (stats.monthly_chart || []).map(m => ({ name: m.label?.split(' ')[0] || m.month, total: m.total }));
  const dailyData   = (stats.daily_chart || []).map(d => ({
    name: new Date(d.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    total: d.total, exceed: d.exceeded_sla ?? 0,
  }));

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: COLORS.textMain }}>Dashboard</h2>
        <p style={{ margin: '4px 0 0', color: COLORS.textMuted, fontSize: 12 }}>Overview & statistik sistem tiket</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard icon="📂" value={stats.open}        label="Tiket Open"        color="#3182ce" to="/?status=open" />
        <StatCard icon="🔄" value={stats.in_progress}  label="Tiket In Progress" color="#c2410c" to="/?status=in_progress" />
        <StatCard icon="✅" value={stats.resolved}     label="Tiket Resolved"    color="#15803d" to="/?status=resolved" />
        <StatCard icon="🚨" value={stats.sla_breached} label="Tiket Eskalasi"   color="#e53e3e" />
        <StatCard icon="🟢" value={stats.within_sla}   label="Dalam SLA"        color="#38a169" />
        <StatCard icon="🔒" value={stats.closed}        label="Tiket Closed"     color="#6b7280" to="/?status=closed" />
      </div>

      {/* Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={card}>
          <SectionTitle title="SLA Overview" />
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={slaData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ value }) => value || ''}>
                {slaData.map((_, i) => <Cell key={i} fill={SLA_COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <SectionTitle title="Top 10 User (Tiket Terbanyak)" />
          <SimpleTable col1="Nama User" col2="Total" rows={topUsers} />
        </div>
        <div style={card}>
          <SectionTitle title="Top 10 Issue" />
          <SimpleTable col1="Judul Tiket" col2="Total" rows={topIssues} />
        </div>
      </div>

      {/* Row 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={card}>
          <SectionTitle title="Distribusi Prioritas" />
          <SimpleTable col1="Prioritas" col2="Total" rows={topArea} />
        </div>
        <div style={card}>
          <SectionTitle title="Grafik per Bulan" />
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={monthlyData} cx="50%" cy="50%" outerRadius={78} dataKey="total"
                label={({ name, total }) => `${name}(${total})`} labelLine={false}>
                {monthlyData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n, p) => [v, p.payload.name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Daily Chart */}
      <div style={card}>
        <SectionTitle title="Grafik Harian (30 Hari Terakhir)" />
        {dailyData.length === 0
          ? <p style={{ textAlign: 'center', color: COLORS.textDisabled, fontSize: 13, padding: 20 }}>Belum ada data</p>
          : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={dailyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="total" name="Total Tiket" fill="#4299e1" radius={[3,3,0,0]} />
              <Line type="monotone" dataKey="exceed" name="Exceed SLA" stroke="#e53e3e" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <PageLayout>
      {user?.role === 'admin' ? <AdminDashboard /> : <UserDashboard />}
    </PageLayout>
  );
}
