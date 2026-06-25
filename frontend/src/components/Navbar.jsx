import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../styles/theme';
import { getNotifications, readAllNotifications } from '../../services/api';

function NotificationBell() {
  const [count,  setCount]  = useState(0);
  const [open,   setOpen]   = useState(false);
  const [items,  setItems]  = useState([]);

  const load = () => {
    getNotifications()
      .then(res => {
        const data = res.data;
        // Support both old array format and new {notifications, unreadCount} format
        if (Array.isArray(data)) {
          setItems(data.slice(0, 10));
          setCount(data.filter(n => !n.is_read).length);
        } else {
          setItems((data.notifications || []).slice(0, 10));
          setCount(data.unreadCount || 0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleReadAll = async () => {
    await readAllNotifications().catch(() => {});
    setCount(0);
    setItems(prev => prev.map(n => ({ ...n, is_read: 1 })));
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 5,
          padding: '5px 10px',
          cursor: 'pointer',
          color: '#fff',
          fontSize: 16,
          position: 'relative',
        }}
        title="Notifikasi"
      >
        🔔
        {count > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#e53e3e', color: '#fff',
            borderRadius: '50%', width: 16, height: 16,
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
          {/* Dropdown */}
          <div style={{
            position: 'absolute', right: 0, top: 36,
            width: 320, background: '#fff',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8, zIndex: 100,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgMuted }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMain }}>Notifikasi</span>
              {count > 0 && (
                <button onClick={handleReadAll} style={{ fontSize: 11, color: COLORS.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  Tandai semua dibaca
                </button>
              )}
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {items.length === 0 && (
                <p style={{ padding: '16px 14px', fontSize: 13, color: COLORS.textDisabled, textAlign: 'center' }}>Tidak ada notifikasi</p>
              )}
              {items.map(n => (
                <div key={n.id} style={{
                  padding: '10px 14px',
                  borderBottom: `1px solid #f7fafc`,
                  background: n.is_read ? '#fff' : COLORS.primaryLight,
                  fontSize: 12,
                }}>
                  <p style={{ margin: '0 0 3px', color: COLORS.textMain, lineHeight: 1.4 }}>{n.message}</p>
                  <span style={{ color: COLORS.textDisabled, fontSize: 10 }}>
                    {new Date(n.created_at).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '0 24px',
      height: 52,
      background: COLORS.primaryDark,
      borderBottom: '1px solid rgba(0,0,0,0.15)',
      flexShrink: 0,
      boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
    }}>
      {/* Left: breadcrumb placeholder or empty */}
      <div style={{ flex: 1 }} />

      {/* Right: user info + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: COLORS.primaryText }}>
          Selamat datang, <strong style={{ color: '#fff', fontWeight: 600 }}>{user?.name || user?.email}</strong>
        </span>

        <NotificationBell />

        {user?.role === 'admin' && (
          <Link to="/admin" style={{
            color: COLORS.primaryText,
            textDecoration: 'none',
            fontSize: 12,
            padding: '5px 12px',
            borderRadius: 5,
            border: '1px solid rgba(255,255,255,0.25)',
            fontWeight: 500,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.primaryText; }}
          >
            ⚙️ Admin
          </Link>
        )}

        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(255,255,255,0.12)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.25)',
            padding: '5px 14px',
            borderRadius: 5,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
