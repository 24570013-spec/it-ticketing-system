import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { COLORS, inputStyle, btnPrimary, RADIUS, SHADOW } from '../styles/theme';

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Email dan password wajib diisi.'); return; }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 50%, #3182ce 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: COLORS.bgCard,
        borderRadius: 12,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2b6cb0, #3182ce)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: SHADOW.md,
          }}>
            <span style={{ fontSize: 26 }}>🎫</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.textMain }}>IT Support System</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: COLORS.textMuted }}>Masuk ke akun kamu</p>
        </div>

        {error && (
          <div style={{
            background: COLORS.dangerBg,
            border: `1px solid ${COLORS.dangerBorder}`,
            borderRadius: RADIUS.md,
            padding: '10px 14px',
            marginBottom: 20,
            color: COLORS.danger,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@domain.com"
              style={{ ...inputStyle, padding: '10px 14px' }}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ ...inputStyle, padding: '10px 14px' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...btnPrimary,
              width: '100%',
              padding: '11px',
              fontSize: 14,
              borderRadius: RADIUS.md,
              opacity: loading ? 0.75 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? COLORS.primaryDark : COLORS.primary,
              letterSpacing: '0.3px',
            }}
          >
            {loading ? 'Masuk…' : 'Masuk'}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: COLORS.textMuted }}>
          © {new Date().getFullYear()} IT Support System
        </p>
      </div>
    </div>
  );
}
