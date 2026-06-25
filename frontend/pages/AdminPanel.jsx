import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUsers, updateUserRole, deleteUser, getTickets, getCategories, createCategory, updateCategory, deleteCategory, exportTicketsCSV } from '../services/api';
import api from '../services/api';
import PageLayout from '../src/components/PageLayout';
import StatusBadge from '../src/components/StatusBadge';
import PriorityBadge from '../src/components/PriorityBadge';
import { COLORS, card, labelStyle, inputStyle, btnPrimary, btnSecondary, btnDanger, thStyle, tdStyle, alertError, RADIUS, SHADOW } from '../styles/theme';

// ── Category Management ────────────────────────────────────────────────────────
function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [editId,     setEditId]     = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState({ name: '', description: '' });
  const [saving,     setSaving]     = useState(false);

  const load = () => {
    setLoading(true);
    getCategories()
      .then(res => setCategories(res.data))
      .catch(e => setError(e.response?.data?.message || 'Gagal memuat kategori.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Nama kategori wajib diisi'); return; }
    setSaving(true); setError('');
    try {
      if (editId) {
        const res = await updateCategory(editId, form);
        setCategories(prev => prev.map(c => c.id === editId ? res.data : c));
      } else {
        const res = await createCategory(form);
        setCategories(prev => [...prev, res.data]);
      }
      setForm({ name: '', description: '' }); setEditId(null); setShowForm(false);
    } catch (e) { setError(e.response?.data?.message || 'Gagal menyimpan kategori.'); }
    finally { setSaving(false); }
  };

  const handleCancel = () => { setForm({ name: '', description: '' }); setEditId(null); setShowForm(false); setError(''); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ margin: 0, color: COLORS.textMuted, fontSize: 13 }}>Kelola kategori tiket yang tersedia saat membuat tiket.</p>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', description: '' }); setError(''); }}
            style={btnPrimary}>
            + Tambah Kategori
          </button>
        )}
      </div>

      {error && <div style={{ ...alertError, marginBottom: 16 }}>⚠️ {error}</div>}

      {showForm && (
        <div style={{ background: COLORS.infoBg, border: `1px solid ${COLORS.infoBorder}`, borderRadius: RADIUS.lg, padding: 20, marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 14px', color: COLORS.primaryDark, fontSize: 14, fontWeight: 700 }}>
            {editId ? '✏️ Edit Kategori' : '➕ Tambah Kategori Baru'}
          </h4>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Nama <span style={{ color: COLORS.danger }}>*</span></label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: Hardware" style={inputStyle} autoFocus />
              </div>
              <div>
                <label style={labelStyle}>Deskripsi</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Deskripsi singkat (opsional)" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving}
                style={{ ...btnPrimary, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Menyimpan…' : editId ? '💾 Simpan' : '✔ Tambah'}
              </button>
              <button type="button" onClick={handleCancel} style={btnSecondary}>Batal</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p style={{ color: COLORS.textMuted }}>Memuat…</p> : (
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.lg, overflow: 'hidden', boxShadow: SHADOW.sm }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: COLORS.bgMuted }}>
              {['#', 'Nama', 'Deskripsi', 'Dibuat', 'Aksi'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {categories.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: COLORS.textDisabled }}>Belum ada kategori.</td></tr>
              )}
              {categories.map((cat, i) => (
                <tr key={cat.id}
                  onMouseEnter={e => e.currentTarget.style.background = COLORS.bgMuted}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={tdStyle}>{i + 1}</td>
                  <td style={tdStyle}>
                    <span style={{ background: COLORS.primaryLight, color: COLORS.primaryDark, padding: '2px 10px', borderRadius: 12, fontWeight: 600, fontSize: 12 }}>
                      {cat.name}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: COLORS.textMuted }}>{cat.description || '—'}</td>
                  <td style={{ ...tdStyle, fontSize: 12 }}>{new Date(cat.created_at).toLocaleDateString('id-ID')}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setForm({ name: cat.name, description: cat.description || '' }); setEditId(cat.id); setShowForm(true); setError(''); }}
                        style={{ padding: '3px 12px', background: COLORS.primaryLight, color: COLORS.primaryDark, border: 'none', borderRadius: RADIUS.sm, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        Edit
                      </button>
                      <button onClick={async () => {
                        if (!confirm('Yakin hapus kategori ini?')) return;
                        try { await deleteCategory(cat.id); setCategories(prev => prev.filter(c => c.id !== cat.id)); }
                        catch (e) { setError(e.response?.data?.message || 'Gagal hapus.'); }
                      }} style={btnDanger}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Role Badge ─────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const cfg = {
    admin:    { bg: '#fef3c7', color: '#b45309', label: '⚙️ Admin' },
    engineer: { bg: COLORS.infoBg, color: COLORS.info, label: '🔧 Engineer' },
    user:     { bg: COLORS.successBg, color: COLORS.success, label: '👤 Staff' },
  };
  const c = cfg[role] || cfg.user;
  return (
    <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

// ── Main AdminPanel ────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const navigate = useNavigate();
  const [users,   setUsers]   = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [tab,     setTab]     = useState('categories');

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createForm,     setCreateForm]     = useState({ name: '', email: '', password: '', role: 'user' });
  const [createErr,      setCreateErr]      = useState('');
  const [creating,       setCreating]       = useState(false);

  useEffect(() => {
    Promise.all([getUsers(), getTickets()])
      .then(([uRes, tRes]) => { setUsers(uRes.data); setTickets(tRes.data.data); })
      .catch(err => setError(err.response?.data?.message || 'Gagal memuat data.'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (id, role) => {
    try {
      const res = await updateUserRole(id, role);
      setUsers(prev => prev.map(u => u.id === id ? res.data : u));
    } catch (err) { setError(err.response?.data?.message || 'Gagal update role.'); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Yakin hapus user ini? Semua tiket dan data terkait akan ikut terhapus.')) return;
    try { await deleteUser(id); setUsers(prev => prev.filter(u => u.id !== id)); }
    catch (err) { setError(err.response?.data?.message || 'Gagal hapus user.'); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault(); setCreateErr('');
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setCreateErr('Semua field wajib diisi.'); return;
    }
    if (createForm.password.length < 6) { setCreateErr('Password minimal 6 karakter.'); return; }
    setCreating(true);
    try {
      const res = await api.post('/api/auth/register', createForm);
      setUsers(prev => [...prev, res.data.user]);
      setCreateForm({ name: '', email: '', password: '', role: 'user' });
      setShowCreateUser(false);
    } catch (err) { setCreateErr(err.response?.data?.message || 'Gagal membuat akun.'); }
    finally { setCreating(false); }
  };

  // Export state
  const [exportFrom,     setExportFrom]     = useState('');
  const [exportTo,       setExportTo]       = useState('');
  const [exportStatus,   setExportStatus]   = useState('');
  const [exportPriority, setExportPriority] = useState('');
  const [exporting,      setExporting]      = useState(false);
  const [exportMsg,      setExportMsg]      = useState('');

  const handleExport = async () => {
    setExporting(true);
    setExportMsg('');
    try {
      const params = {};
      if (exportFrom)     params.from     = exportFrom;
      if (exportTo)       params.to       = exportTo;
      if (exportStatus)   params.status   = exportStatus;
      if (exportPriority) params.priority = exportPriority;
      await exportTicketsCSV(params);
      setExportMsg('✓ File CSV berhasil didownload.');
      setTimeout(() => setExportMsg(''), 4000);
    } catch (err) {
      setExportMsg('⚠️ Gagal export: ' + (err.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };
  const TABS = [
    { key: 'categories', label: '🏷️ Kategori' },
    { key: 'users',      label: `👥 Users (${users.length})` },
    { key: 'tickets',    label: `🎫 Semua Tiket (${tickets.length})` },
    { key: 'export',     label: '📥 Export' },
  ];

  return (
    <PageLayout>
      <div style={{ padding: '24px 28px' }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>
            <span onClick={() => navigate('/')} style={{ cursor: 'pointer', color: COLORS.primary }}>Dashboard</span>
            {' › '}Admin Panel
          </div>
          <h2 style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 700, color: COLORS.textMain }}>⚙️ Admin Panel</h2>
          <p style={{ margin: 0, color: COLORS.textMuted, fontSize: 12 }}>Kelola kategori, akun pengguna, dan tiket sistem.</p>
        </div>

        {error && <div style={{ ...alertError, marginBottom: 16 }}>⚠️ {error}</div>}

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 20, borderBottom: `2px solid ${COLORS.border}` }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '9px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? COLORS.primary : COLORS.textMuted,
              borderBottom: tab === t.key ? `2px solid ${COLORS.primary}` : '2px solid transparent',
              marginBottom: -2, transition: 'color 0.15s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Tab: Kategori ── */}
        {tab === 'categories' && <CategoryManager />}

        {/* ── Tab: Users ── */}
        {tab === 'users' && (
          loading ? <p style={{ color: COLORS.textMuted }}>Memuat…</p> : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ margin: 0, color: COLORS.textMuted, fontSize: 13 }}>Kelola akun pengguna sistem.</p>
              {!showCreateUser && (
                <button onClick={() => { setShowCreateUser(true); setCreateErr(''); }} style={btnPrimary}>
                  + Buat Akun
                </button>
              )}
            </div>

            {showCreateUser && (
              <div style={{ background: COLORS.infoBg, border: `1px solid ${COLORS.infoBorder}`, borderRadius: RADIUS.lg, padding: 20, marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 14px', color: COLORS.primaryDark, fontSize: 14, fontWeight: 700 }}>➕ Buat Akun Baru</h4>
                {createErr && <div style={{ ...alertError, marginBottom: 12 }}>⚠️ {createErr}</div>}
                <form onSubmit={handleCreateUser}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={labelStyle}>Nama <span style={{ color: COLORS.danger }}>*</span></label>
                      <input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Nama lengkap" style={inputStyle} autoFocus />
                    </div>
                    <div>
                      <label style={labelStyle}>Email <span style={{ color: COLORS.danger }}>*</span></label>
                      <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="email@domain.com" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Password <span style={{ color: COLORS.danger }}>*</span></label>
                      <input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="Min. 6 karakter" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Role <span style={{ color: COLORS.danger }}>*</span></label>
                      <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))} style={inputStyle}>
                        <option value="user">👤 Staff / Pegawai</option>
                        <option value="engineer">🔧 Engineer / Teknisi IT</option>
                        <option value="admin">⚙️ Administrator</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" disabled={creating}
                      style={{ ...btnPrimary, opacity: creating ? 0.7 : 1, cursor: creating ? 'not-allowed' : 'pointer' }}>
                      {creating ? 'Membuat…' : '✔ Buat Akun'}
                    </button>
                    <button type="button" onClick={() => { setShowCreateUser(false); setCreateErr(''); setCreateForm({ name: '', email: '', password: '', role: 'user' }); }}
                      style={btnSecondary}>Batal</button>
                  </div>
                </form>
              </div>
            )}

            <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.lg, overflow: 'hidden', boxShadow: SHADOW.sm }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: COLORS.bgMuted }}>
                  {['Nama', 'Email', 'Role', 'Dibuat', 'Aksi'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {users.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: COLORS.textDisabled }}>Belum ada user</td></tr>
                  )}
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: `1px solid #edf2f7` }}
                      onMouseEnter={e => e.currentTarget.style.background = COLORS.bgMuted}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                      </td>
                      <td style={{ ...tdStyle, fontSize: 12, color: COLORS.textMuted }}>{u.email}</td>
                      <td style={tdStyle}>
                        <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                          style={{ padding: '4px 8px', border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.sm, fontSize: 12, background: '#fff' }}>
                          <option value="user">user</option>
                          <option value="engineer">engineer</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td style={{ ...tdStyle, fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                      <td style={tdStyle}>
                        <button onClick={() => handleDeleteUser(u.id)} style={btnDanger}>Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* ── Tab: Tickets ── */}
        {tab === 'tickets' && (
          loading ? <p style={{ color: COLORS.textMuted }}>Memuat…</p> : (
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.lg, overflow: 'hidden', boxShadow: SHADOW.sm }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: COLORS.bgMuted }}>
                {['#', 'Judul', 'Kategori', 'Status', 'Prioritas', 'Pembuat', 'Assignee', 'Tanggal', ''].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {tickets.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: 20, textAlign: 'center', color: COLORS.textDisabled }}>Belum ada tiket</td></tr>
                )}
                {tickets.map(t => (
                  <tr key={t.id}
                    onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...tdStyle, color: COLORS.primary, fontWeight: 700 }}>#{t.id}</td>
                    <td style={{ ...tdStyle, maxWidth: 160 }}>
                      <span title={t.title} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                    </td>
                    <td style={tdStyle}>
                      {t.category_name
                        ? <span style={{ background: COLORS.primaryLight, color: COLORS.primaryDark, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{t.category_name}</span>
                        : <span style={{ color: COLORS.textDisabled }}>—</span>}
                    </td>
                    <td style={tdStyle}><StatusBadge status={t.status} /></td>
                    <td style={tdStyle}><PriorityBadge priority={t.priority} /></td>
                    <td style={{ ...tdStyle, fontSize: 12, color: COLORS.textMuted }}>#{t.user_id}</td>
                    <td style={{ ...tdStyle, fontSize: 12 }}>{t.assigned_to_name ?? <span style={{ color: COLORS.textDisabled }}>—</span>}</td>
                    <td style={{ ...tdStyle, fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString('id-ID')}</td>
                    <td style={tdStyle}>
                      <Link to={`/tickets/${t.id}`} style={{ color: COLORS.primary, textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
                        Lihat ›
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {/* ── Tab: Export ── */}
        {tab === 'export' && (
          <div style={{ maxWidth: 560 }}>
            <p style={{ margin: '0 0 20px', color: COLORS.textMuted, fontSize: 13 }}>
              Export data tiket ke file CSV. Bisa difilter berdasarkan tanggal, status, dan prioritas.
            </p>

            <div style={{ ...card, marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: COLORS.textMain }}>
                📅 Filter Export
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Tanggal Dari</label>
                  <input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Tanggal Sampai</label>
                  <input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={exportStatus} onChange={e => setExportStatus(e.target.value)} style={inputStyle}>
                    <option value="">Semua Status</option>
                    {['open','waiting','in_progress','checking','pending','resolved','closed'].map(s => (
                      <option key={s} value={s}>{s.replace('_',' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Prioritas</label>
                  <select value={exportPriority} onChange={e => setExportPriority(e.target.value)} style={inputStyle}>
                    <option value="">Semua Prioritas</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  style={{ ...btnPrimary, opacity: exporting ? 0.7 : 1, cursor: exporting ? 'not-allowed' : 'pointer' }}
                >
                  {exporting ? '⏳ Mengexport…' : '📥 Download CSV'}
                </button>
                {(exportFrom || exportTo || exportStatus || exportPriority) && (
                  <button
                    onClick={() => { setExportFrom(''); setExportTo(''); setExportStatus(''); setExportPriority(''); }}
                    style={btnSecondary}
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {exportMsg && (
                <p style={{ margin: '10px 0 0', fontSize: 13, color: exportMsg.startsWith('✓') ? COLORS.success : COLORS.danger }}>
                  {exportMsg}
                </p>
              )}
            </div>

            <div style={{ background: COLORS.bgMuted, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.md, padding: 14, fontSize: 12, color: COLORS.textMuted }}>
              <strong style={{ color: COLORS.textSecondary }}>Kolom yang diekspor:</strong><br />
              No Tiket, Judul, Nama Store, Kategori, Prioritas, Status, Pembuat, Email, Engineer,
              Tanggal Buat, Tanggal Open, Tanggal Progress, Tanggal Resolved, SLA Deadline, SLA Status, Deskripsi
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
