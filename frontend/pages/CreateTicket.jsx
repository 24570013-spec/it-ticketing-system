import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket, getCategories } from '../services/api';
import PageLayout from '../src/components/PageLayout';
import { COLORS, labelStyle, inputStyle, btnPrimary, btnSecondary, alertError, card, RADIUS } from '../styles/theme';

const PRIORITY_OPTIONS = [
  { value: 'low',    icon: '🟢', label: 'Low',    desc: 'Tidak mendesak' },
  { value: 'medium', icon: '🟡', label: 'Medium', desc: 'Perlu ditangani' },
  { value: 'high',   icon: '🔴', label: 'High',   desc: 'Mendesak / Urgent' },
];

export default function CreateTicket() {
  const navigate = useNavigate();
  const [title,       setTitle]      = useState('');
  const [namaStore,   setNamaStore]  = useState('');
  const [description, setDesc]       = useState('');
  const [priority,    setPriority]   = useState('medium');
  const [categoryId,  setCategoryId] = useState('');
  const [categories,  setCategories] = useState([]);
  const [error,       setError]      = useState('');
  const [loading,     setLoading]    = useState(false);

  useEffect(() => {
    getCategories().then(res => setCategories(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !description.trim()) {
      setError('Judul dan deskripsi wajib diisi.');
      return;
    }
    setLoading(true);
    try {
      await createTicket({
        title,
        nama_store: namaStore || null,
        description,
        priority,
        category_id: categoryId ? Number(categoryId) : null,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat tiket.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCat = categories.find(c => c.id === Number(categoryId));

  return (
    <PageLayout>
      <div style={{ maxWidth: 640, margin: '28px auto', padding: '0 24px' }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
          <span onClick={() => navigate('/')} style={{ cursor: 'pointer', color: COLORS.primary }}>Dashboard</span>
          <span style={{ margin: '0 6px', opacity: 0.5 }}>›</span>
          Buat Tiket Baru
        </div>

        <div style={{ ...card, padding: 28 }}>
          {/* Header */}
          <div style={{ marginBottom: 24, paddingBottom: 18, borderBottom: `1px solid ${COLORS.border}` }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: COLORS.textMain }}>
              🎫 Buat Tiket Baru
            </h2>
            <p style={{ margin: 0, color: COLORS.textMuted, fontSize: 13 }}>
              Isi form di bawah untuk melaporkan masalah IT ke tim support.
            </p>
          </div>

          {error && (
            <div style={alertError}>⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Grid: Judul + Nama Store */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Judul Tiket <span style={{ color: COLORS.danger }}>*</span></label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Monitor tidak menyala"
                  style={inputStyle}
                  autoFocus
                />
              </div>
              <div>
                <label style={labelStyle}>Nama Store / Lokasi</label>
                <input
                  value={namaStore}
                  onChange={e => setNamaStore(e.target.value)}
                  placeholder="Contoh: McD Sudirman, Lt.3"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Kategori */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Kategori Masalah</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                style={{ ...inputStyle, color: categoryId ? COLORS.textMain : COLORS.textDisabled }}
              >
                <option value="">— Pilih kategori —</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {selectedCat?.description && (
                <p style={{ margin: '4px 0 0', fontSize: 12, color: COLORS.textMuted }}>
                  ℹ️ {selectedCat.description}
                </p>
              )}
            </div>

            {/* Deskripsi */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Deskripsi Masalah <span style={{ color: COLORS.danger }}>*</span></label>
              <textarea
                value={description}
                onChange={e => setDesc(e.target.value)}
                rows={5}
                placeholder="Jelaskan masalah secara detail: kapan terjadi, perangkat apa, sudah dicoba apa…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            {/* Prioritas */}
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Tingkat Prioritas</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {PRIORITY_OPTIONS.map(opt => {
                  const p = COLORS.priority[opt.value];
                  const selected = priority === opt.value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => setPriority(opt.value)}
                      style={{
                        padding: '12px 10px',
                        borderRadius: RADIUS.md,
                        cursor: 'pointer',
                        border: `2px solid ${selected ? p.border : COLORS.border}`,
                        background: selected ? p.bg : COLORS.bgCard,
                        textAlign: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: selected ? p.color : COLORS.textMain }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{opt.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tombol */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...btnPrimary,
                  padding: '10px 28px',
                  opacity: loading ? 0.75 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '⏳ Mengirim…' : '✔ Kirim Tiket'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={btnSecondary}
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}
