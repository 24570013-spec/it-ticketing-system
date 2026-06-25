import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicketById, getComments, postComment, deleteComment, updateTicket, getUsers, getTimeline } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PageLayout from '../src/components/PageLayout';
import StatusBadge from '../src/components/StatusBadge';
import PriorityBadge from '../src/components/PriorityBadge';
import { COLORS, card, inputStyle, btnPrimary, alertWarning, alertSuccess, RADIUS, SHADOW } from '../styles/theme';

const ADMIN_STATUSES = [
  { value: 'open',        label: 'Open' },
  { value: 'waiting',     label: 'Waiting' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'checking',    label: 'Checking' },
  { value: 'pending',     label: 'Pending' },
  { value: 'resolved',    label: 'Resolved' },
  { value: 'closed',      label: 'Closed' },
];

const ENGINEER_STATUSES = [
  { value: 'waiting',     label: 'Waiting — Antrian' },
  { value: 'in_progress', label: 'In Progress — Sedang Dikerjakan' },
  { value: 'checking',    label: 'Checking — Sedang Dicek' },
  { value: 'pending',     label: 'Pending — Tertunda' },
  { value: 'resolved',    label: 'Resolved — Selesai' },
];

const STATUS_STEPS = ['open', 'waiting', 'in_progress', 'checking', 'pending', 'resolved', 'closed'];
const STATUS_LABELS = { open:'Open', waiting:'Waiting', in_progress:'In Progress', checking:'Checking', pending:'Pending', resolved:'Resolved', closed:'Closed' };

function RolePill({ role }) {
  const cfg = {
    engineer: { bg: COLORS.infoBg,    color: COLORS.info,    label: '🔧 Engineer' },
    admin:    { bg: '#fef3c7',        color: '#b45309',      label: '⚙️ Admin' },
    user:     { bg: COLORS.successBg, color: COLORS.success, label: '👤 Staff' },
  };
  const c = cfg[role] || cfg.user;
  return (
    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

export default function TicketDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket,           setTicket]           = useState(null);
  const [comments,         setComments]         = useState([]);
  const [users,            setUsers]            = useState([]);
  const [timeline,         setTimeline]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');
  const [comment,          setComment]          = useState('');
  const [commentErr,       setCommentErr]       = useState('');
  const [statusErr,        setStatusErr]        = useState('');
  const [assignErr,        setAssignErr]        = useState('');
  const [assignValue,      setAssignValue]      = useState('');
  const [assignSuccess,    setAssignSuccess]    = useState(false);
  const [resolveLoading,   setResolveLoading]   = useState(false);
  const [resolveMsg,       setResolveMsg]       = useState('');
  const [engStatus,        setEngStatus]        = useState('');
  const [engStatusErr,     setEngStatusErr]     = useState('');
  const [engStatusMsg,     setEngStatusMsg]     = useState('');
  const [engStatusLoading, setEngStatusLoading] = useState(false);

  const isAdmin    = user?.role === 'admin';
  const isEngineer = user?.role === 'engineer';
  const isUser     = user?.role === 'user';

  const load = () => {
    setLoading(true);
    const calls = [getTicketById(id), getComments(id)];
    if (isAdmin) calls.push(getUsers());
    Promise.all(calls)
      .then(([tRes, cRes, uRes]) => {
        setTicket(tRes.data);
        setComments(cRes.data);
        if (uRes) setUsers(uRes.data.filter(u => u.role === 'engineer' || u.role === 'admin'));
        setAssignValue(tRes.data.assigned_to ?? '');
        setEngStatus(tRes.data.status);
        // Load timeline separately — gracefully ignore if table not yet migrated
        getTimeline(id)
          .then(tlRes => setTimeline(tlRes.data))
          .catch(() => setTimeline([]));
      })
      .catch(err => setError(err.response?.data?.message || 'Gagal memuat tiket.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleComment = async (e) => {
    e.preventDefault();
    setCommentErr('');
    if (!comment.trim()) { setCommentErr('Komentar tidak boleh kosong.'); return; }
    try {
      await postComment(id, { content: comment });
      setComment('');
      const res = await getComments(id);
      setComments(res.data);
    } catch (err) { setCommentErr(err.response?.data?.message || 'Gagal mengirim komentar.'); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) { setCommentErr(err.response?.data?.message || 'Gagal hapus komentar.'); }
  };

  const handleStatusChange = async (e) => {
    setStatusErr('');
    try {
      const res = await updateTicket(id, { status: e.target.value });
      setTicket(res.data);
      const tlRes = await getTimeline(id);
      setTimeline(tlRes.data);
    } catch (err) { setStatusErr(err.response?.data?.message || 'Gagal update status.'); }
  };

  const handleEngineerStatusSave = async () => {
    setEngStatusErr(''); setEngStatusMsg(''); setEngStatusLoading(true);
    try {
      const res = await updateTicket(id, { status: engStatus });
      setTicket(res.data);
      const tlRes = await getTimeline(id);
      setTimeline(tlRes.data);
      setEngStatusMsg('✓ Status berhasil diupdate.');
      setTimeout(() => setEngStatusMsg(''), 3000);
    } catch (err) { setEngStatusErr(err.response?.data?.message || 'Gagal update status.'); }
    finally { setEngStatusLoading(false); }
  };

  const handleResolve = async () => {
    setResolveMsg(''); setResolveLoading(true);
    try {
      const res = await updateTicket(id, { status: 'resolved' });
      setTicket(res.data);
      setResolveMsg('✓ Tiket ditandai selesai. Menunggu konfirmasi admin.');
    } catch (err) { setResolveMsg(err.response?.data?.message || 'Gagal update status.'); }
    finally { setResolveLoading(false); }
  };

  if (loading) return <PageLayout><div style={{ padding: 40, color: COLORS.textMuted }}>Memuat tiket…</div></PageLayout>;
  if (error)   return <PageLayout><div style={{ padding: 40, color: COLORS.danger }}>⚠️ {error}</div></PageLayout>;

  const currentStepIdx = STATUS_STEPS.indexOf(ticket.status);

  return (
    <PageLayout>
      <div style={{ maxWidth: 820, margin: '24px auto', padding: '0 24px 40px' }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span onClick={() => navigate(-1)} style={{ cursor: 'pointer', color: COLORS.primary, display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Kembali
          </span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span>Detail Tiket #{id}</span>
        </div>

        {/* ── Header Card ────────────────────────────────────────────── */}
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: COLORS.textMain, lineHeight: 1.3 }}>
                {ticket.title}
              </h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>
                  📅 {new Date(ticket.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
                {ticket.category_name && (
                  <span style={{ fontSize: 11, background: COLORS.primaryLight, color: COLORS.primaryDark, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                    {ticket.category_name}
                  </span>
                )}
              </div>
            </div>

            {/* Assignee info */}
            <div style={{
              padding: '8px 14px',
              background: ticket.assigned_to_name ? COLORS.infoBg : COLORS.bgMuted,
              border: `1px solid ${ticket.assigned_to_name ? COLORS.infoBorder : COLORS.border}`,
              borderRadius: RADIUS.md,
              fontSize: 12,
              color: ticket.assigned_to_name ? COLORS.info : COLORS.textDisabled,
              whiteSpace: 'nowrap',
            }}>
              🔧 {ticket.assigned_to_name ? <><strong>{ticket.assigned_to_name}</strong> (Engineer)</> : 'Belum di-assign'}
            </div>
          </div>

          {ticket.nama_store && (
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 10 }}>
              📍 <strong>Lokasi:</strong> {ticket.nama_store}
            </div>
          )}

          <div style={{ background: COLORS.bgMuted, padding: '12px 16px', borderRadius: RADIUS.md, color: COLORS.textSecondary, lineHeight: 1.7, fontSize: 13, borderLeft: `3px solid ${COLORS.border}` }}>
            {ticket.description}
          </div>

          {/* SLA */}
          {ticket.sla?.deadline && (
            <div style={{
              marginTop: 12,
              padding: '8px 14px',
              borderRadius: RADIUS.md,
              fontSize: 12,
              background: ticket.sla.status === 'breached' ? COLORS.dangerBg : ticket.sla.status === 'warning' ? COLORS.warningBg : COLORS.successBg,
              color: ticket.sla.status === 'breached' ? COLORS.danger : ticket.sla.status === 'warning' ? COLORS.warning : COLORS.success,
              border: `1px solid ${ticket.sla.status === 'breached' ? COLORS.dangerBorder : ticket.sla.status === 'warning' ? COLORS.warningBorder : COLORS.successBorder}`,
            }}>
              ⏱ SLA: {ticket.sla.status === 'breached' ? 'Melewati SLA' : ticket.sla.status === 'warning' ? 'Segera melewati SLA' : 'Dalam SLA'}
              {ticket.sla.hoursRemaining != null && ` · ${Math.abs(ticket.sla.hoursRemaining)} jam ${ticket.sla.status === 'breached' ? 'terlewat' : 'tersisa'}`}
            </div>
          )}
        </div>

        {/* ── Progress Timeline ───────────────────────────────────────── */}
        <div style={{ ...card, padding: '16px 20px', marginBottom: 16 }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Progress Tiket
          </p>
          <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: 4 }}>
            {STATUS_STEPS.map((step, idx) => {
              const isDone    = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div key={step} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 70 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isCurrent ? COLORS.primary : isDone ? '#38a169' : COLORS.border,
                      color: isCurrent || isDone ? '#fff' : COLORS.textDisabled,
                      fontSize: 12, fontWeight: 700,
                      boxShadow: isCurrent ? `0 0 0 3px ${COLORS.primaryLight}` : 'none',
                      transition: 'all 0.2s',
                    }}>
                      {isDone ? '✓' : idx + 1}
                    </div>
                    <span style={{
                      fontSize: 10, marginTop: 5, textAlign: 'center',
                      color: isCurrent ? COLORS.primary : isDone ? '#38a169' : COLORS.textDisabled,
                      fontWeight: isCurrent ? 700 : 400,
                    }}>
                      {STATUS_LABELS[step]}
                    </span>
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div style={{ width: 28, height: 2, background: idx < currentStepIdx ? '#38a169' : COLORS.border, flexShrink: 0, margin: '0 2px', marginBottom: 16 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Status Timeline / Activity Log ────────────────────────── */}
        {timeline.length > 0 && (
          <div style={{ ...card, marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: COLORS.textMain, paddingBottom: 10, borderBottom: `1px solid ${COLORS.border}` }}>
              🕐 Riwayat Aktivitas
            </h4>
            <div style={{ position: 'relative' }}>
              {/* Vertical line */}
              <div style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, background: COLORS.border, zIndex: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {timeline.map((entry, idx) => {
                  const STATUS_COLORS = {
                    open:        { bg: '#dbeafe', color: '#1d4ed8', icon: '📂' },
                    waiting:     { bg: '#ede9fe', color: '#6d28d9', icon: '⏸️' },
                    in_progress: { bg: '#ffedd5', color: '#c2410c', icon: '🔄' },
                    checking:    { bg: '#fef3c7', color: '#b45309', icon: '🔍' },
                    pending:     { bg: '#fce7f3', color: '#be185d', icon: '⏳' },
                    resolved:    { bg: '#dcfce7', color: '#15803d', icon: '✅' },
                    closed:      { bg: '#f3f4f6', color: '#6b7280', icon: '🔒' },
                  };
                  const sc = STATUS_COLORS[entry.to_status] || { bg: COLORS.border, color: COLORS.textMuted, icon: '📌' };
                  const isLast = idx === timeline.length - 1;
                  // Format duration
                  let durationText = '';
                  if (entry.duration_minutes !== null && entry.duration_minutes !== undefined) {
                    if (entry.duration_minutes < 60) {
                      durationText = `${entry.duration_minutes} menit`;
                    } else {
                      const h = Math.floor(entry.duration_minutes / 60);
                      const m = entry.duration_minutes % 60;
                      durationText = m > 0 ? `${h} jam ${m} menit` : `${h} jam`;
                    }
                  }
                  return (
                    <div key={entry.id} style={{ display: 'flex', gap: 14, paddingBottom: isLast ? 0 : 20, position: 'relative', zIndex: 1 }}>
                      {/* Circle indicator */}
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: sc.bg, color: sc.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, flexShrink: 0, border: `2px solid ${sc.color}30`,
                        zIndex: 2, position: 'relative',
                      }}>
                        {sc.icon}
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, paddingTop: 3 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 4 }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMain }}>
                              {entry.from_status
                                ? <><span style={{ color: COLORS.textMuted }}>{entry.from_status.replace('_',' ')}</span> → <span style={{ color: sc.color }}>{entry.to_status.replace('_',' ')}</span></>
                                : <span style={{ color: sc.color }}>Tiket dibuat</span>
                              }
                            </span>
                            {entry.user_name && (
                              <span style={{ fontSize: 11, color: COLORS.textMuted, marginLeft: 8 }}>
                                oleh <strong>{entry.user_name}</strong>
                                {entry.user_role === 'engineer' && ' 🔧'}
                                {entry.user_role === 'admin' && ' ⚙️'}
                              </span>
                            )}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 12, color: COLORS.textMain, fontWeight: 600 }}>
                              {new Date(entry.created_at).toLocaleString('id-ID', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit', second: '2-digit',
                              })}
                            </div>
                            {durationText && (
                              <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                                ⏱ {durationText} di status sebelumnya
                              </div>
                            )}
                          </div>
                        </div>
                        {entry.note && (
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' }}>
                            {entry.note}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Engineer Controls ───────────────────────────────────────── */}
        {isEngineer && Number(ticket.assigned_to) === Number(user?.id) && (
          <div style={{ ...card, border: `1px solid ${COLORS.infoBorder}`, background: '#f0f8ff', marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 12px', color: COLORS.primaryDark, fontSize: 14, fontWeight: 700 }}>🔧 Update Progress</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <select
                value={engStatus}
                onChange={e => { setEngStatus(e.target.value); setEngStatusErr(''); setEngStatusMsg(''); }}
                style={{ ...inputStyle, width: 'auto', minWidth: 240, background: COLORS.bgCard }}
              >
                {ENGINEER_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <button
                onClick={handleEngineerStatusSave}
                disabled={engStatusLoading || engStatus === ticket.status}
                style={{
                  ...btnPrimary,
                  background: engStatus === ticket.status ? COLORS.border : COLORS.primaryDark,
                  color: engStatus === ticket.status ? COLORS.textDisabled : '#fff',
                  cursor: engStatus === ticket.status ? 'default' : 'pointer',
                  opacity: engStatusLoading ? 0.7 : 1,
                }}
              >
                {engStatusLoading ? 'Menyimpan…' : 'Simpan Status'}
              </button>
            </div>
            {engStatusErr && <p style={{ margin: '8px 0 0', fontSize: 12, color: COLORS.danger }}>{engStatusErr}</p>}
            {engStatusMsg && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#38a169' }}>{engStatusMsg}</p>}
          </div>
        )}

        {isEngineer && Number(ticket.assigned_to) !== Number(user?.id) && (
          <div style={{ ...alertWarning, marginBottom: 16 }}>
            ℹ️ Tiket ini tidak di-assign ke kamu. Kamu hanya bisa melihat detailnya.
          </div>
        )}

        {/* ── User (Staff) Controls ───────────────────────────────────── */}
        {isUser && ticket.user_id === user?.id && ticket.status === 'open' && (
          <div style={{ ...card, marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 6px', color: COLORS.textMain, fontSize: 14, fontWeight: 700 }}>✅ Konfirmasi Masalah Selesai</h4>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: COLORS.textMuted }}>
              Masalah sudah diselesaikan oleh engineer? Tandai tiket sebagai <strong>resolved</strong> agar admin bisa mengkonfirmasi.
            </p>
            <button
              onClick={handleResolve}
              disabled={resolveLoading}
              style={{ padding: '8px 20px', background: '#38a169', color: '#fff', border: 'none', borderRadius: RADIUS.md, cursor: resolveLoading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: resolveLoading ? 0.7 : 1 }}
            >
              {resolveLoading ? 'Menyimpan…' : '✓ Tandai Selesai'}
            </button>
            {resolveMsg && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: resolveMsg.startsWith('✓') ? '#38a169' : COLORS.danger }}>
                {resolveMsg}
              </p>
            )}
          </div>
        )}

        {/* User: waiting for engineer to resolve */}
        {isUser && ticket.user_id === user?.id && ['waiting','in_progress','checking','pending'].includes(ticket.status) && (
          <div style={{ background: COLORS.infoBg, border: `1px solid ${COLORS.infoBorder}`, borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: COLORS.info }}>
              🔧 <strong>Sedang dikerjakan engineer</strong> — Tiket kamu sedang dalam proses penanganan.
              Status saat ini: <StatusBadge status={ticket.status} />
            </p>
          </div>
        )}

        {/* User: engineer resolved, user can now close */}
        {isUser && ticket.user_id === user?.id && ticket.status === 'resolved' && (
          <div style={{ ...card, border: `1px solid #9ae6b4`, background: '#f0fff4', marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 8px', color: '#276749', fontSize: 14, fontWeight: 700 }}>🎉 Tiket Siap Ditutup</h4>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#276749' }}>
              Engineer telah menyelesaikan tiket ini. Jika masalah kamu sudah benar-benar selesai, tutup tiket ini.
            </p>
            <button
              onClick={async () => {
                setResolveMsg(''); setResolveLoading(true);
                try {
                  const res = await updateTicket(id, { status: 'closed' });
                  setTicket(res.data);
                  setResolveMsg('✓ Tiket berhasil ditutup.');
                } catch (err) { setResolveMsg(err.response?.data?.message || 'Gagal menutup tiket.'); }
                finally { setResolveLoading(false); }
              }}
              disabled={resolveLoading}
              style={{ padding: '8px 20px', background: '#276749', color: '#fff', border: 'none', borderRadius: RADIUS.md, cursor: resolveLoading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: resolveLoading ? 0.7 : 1 }}
            >
              {resolveLoading ? 'Menutup…' : '🔒 Tutup Tiket'}
            </button>
            {resolveMsg && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: resolveMsg.startsWith('✓') ? '#38a169' : COLORS.danger }}>
                {resolveMsg}
              </p>
            )}
          </div>
        )}

        {isUser && ticket.status === 'closed' && (
          <div style={{ ...alertSuccess, marginBottom: 16 }}>
            ✅ <strong>Tiket telah ditutup</strong> — Terima kasih, tiket ini sudah selesai ditangani.
          </div>
        )}

        {/* ── Admin Controls ───────────────────────────────────────────── */}
        {isAdmin && (
          <div style={{ ...card, marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 16px', color: COLORS.textMain, fontSize: 14, fontWeight: 700, paddingBottom: 12, borderBottom: `1px solid ${COLORS.border}` }}>
              ⚙️ Kontrol Admin
            </h4>
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              {/* Status */}
              <div>
                <label style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Update Status
                </label>
                <select value={ticket.status} onChange={handleStatusChange}
                  style={{ ...inputStyle, width: 'auto', minWidth: 160 }}>
                  {ADMIN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {statusErr && <p style={{ margin: '4px 0 0', fontSize: 12, color: COLORS.danger }}>{statusErr}</p>}
              </div>

              {/* Assign */}
              <div>
                <label style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Assign ke Engineer
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={assignValue ?? ''}
                    onChange={e => { setAssignValue(e.target.value); setAssignErr(''); setAssignSuccess(false); }}
                    style={{ ...inputStyle, width: 'auto', minWidth: 200 }}
                  >
                    <option value="">— Unassigned —</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role === 'engineer' ? '🔧' : '⚙️'} {u.role})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      setAssignErr(''); setAssignSuccess(false);
                      try {
                        const res = await updateTicket(id, { assigned_to: assignValue ? Number(assignValue) : null });
                        setTicket(res.data);
                        setAssignSuccess(true);
                        setTimeout(() => setAssignSuccess(false), 3000);
                      } catch (err) { setAssignErr(err.response?.data?.message || 'Gagal assign tiket.'); }
                    }}
                    style={{ ...btnPrimary, whiteSpace: 'nowrap' }}
                  >
                    Simpan
                  </button>
                </div>
                {assignErr     && <p style={{ margin: '4px 0 0', fontSize: 12, color: COLORS.danger }}>{assignErr}</p>}
                {assignSuccess && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#38a169' }}>✓ Berhasil disimpan</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── Comments ─────────────────────────────────────────────────── */}
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: COLORS.textMain, paddingBottom: 12, borderBottom: `1px solid ${COLORS.border}` }}>
            💬 Komentar & Update Progress
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: COLORS.textMuted }}>({comments.length})</span>
          </h3>

          {comments.length === 0 && (
            <p style={{ color: COLORS.textDisabled, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Belum ada komentar.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: comments.length ? 20 : 0 }}>
            {comments.map(c => (
              <div key={c.id} style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.md,
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                background: c.user_role === 'engineer' ? '#f0f8ff' : c.user_role === 'admin' ? '#fefce8' : COLORS.bgMuted,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMain }}>{c.user_name || 'User'}</span>
                    <RolePill role={c.user_role} />
                    <span style={{ fontSize: 11, color: COLORS.textDisabled }}>
                      {new Date(c.created_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6 }}>{c.content}</p>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDeleteComment(c.id)}
                    style={{ background: COLORS.dangerBg, color: COLORS.danger, border: 'none', padding: '4px 10px', borderRadius: RADIUS.sm, cursor: 'pointer', fontSize: 12, marginLeft: 12, flexShrink: 0, fontWeight: 600 }}>
                    Hapus
                  </button>
                )}
              </div>
            ))}
          </div>

          {(isAdmin || isEngineer || (isUser && ticket.status !== 'closed')) && (
            <form onSubmit={handleComment}>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                placeholder={isEngineer ? 'Tulis update progress, catatan teknis, atau kendala yang ditemukan…' : 'Tulis komentar atau pertanyaan…'}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
              {commentErr && <p style={{ color: COLORS.danger, fontSize: 12, margin: '4px 0 0' }}>{commentErr}</p>}
              <button type="submit" style={{ ...btnPrimary, marginTop: 10 }}>
                {isEngineer ? '📝 Kirim Update' : '💬 Kirim Komentar'}
              </button>
            </form>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
