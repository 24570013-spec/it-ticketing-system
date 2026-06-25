import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import { COLORS } from '../../styles/theme';

function SidebarItem({ icon, label, to, small }) {
  const location = useLocation();
  const fullPath  = location.pathname + location.search;

  const isActive =
    fullPath === to ||
    (to === '/' && location.pathname === '/' && !location.search) ||
    (to !== '/' && fullPath.startsWith(to));

  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: small ? '8px 24px' : '11px 20px',
        color: isActive ? '#fff' : COLORS.primaryText,
        textDecoration: 'none',
        fontSize: small ? 12 : 13,
        fontWeight: isActive ? 600 : 400,
        background: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
        borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
        borderRadius: isActive ? '0 6px 6px 0' : 0,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontSize: small ? 13 : 15, flexShrink: 0 }}>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </Link>
  );
}

function SidebarSection({ label }) {
  return (
    <div style={{
      padding: '14px 20px 4px',
      fontSize: 10,
      fontWeight: 700,
      color: 'rgba(255,255,255,0.45)',
      letterSpacing: '0.8px',
      textTransform: 'uppercase',
    }}>
      {label}
    </div>
  );
}

function Sidebar() {
  const { user } = useAuth();
  const [ticketOpen, setTicketOpen] = useState(true);

  const roleLabel = user?.role === 'admin'
    ? 'Administrator'
    : user?.role === 'engineer'
    ? 'Engineer'
    : 'Staff';

  const roleColor = user?.role === 'admin'
    ? '#fbd38d'
    : user?.role === 'engineer'
    ? '#90cdf4'
    : '#9ae6b4';

  return (
    <div style={{
      width: 220,
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1a365d 0%, #2b6cb0 100%)',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>
            🎫
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>IT Support</div>
            <div style={{ color: COLORS.primaryText, fontSize: 11, lineHeight: 1.2 }}>Ticketing System</div>
          </div>
        </Link>

        {/* User info pill */}
        {user && (
          <div style={{
            marginTop: 12,
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.10)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: '#fff', fontWeight: 700, flexShrink: 0,
            }}>
              {(user.name || user.email || '?')[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name || user.email}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, color: roleColor,
                letterSpacing: '0.3px',
              }}>
                {roleLabel}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        <SidebarItem icon="🏠" label="Dashboard" to="/" />

        <SidebarSection label="Manajemen Tiket" />

        {/* Ticket accordion */}
        <div>
          <button
            onClick={() => setTicketOpen(o => !o)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 20px',
              background: 'none',
              border: 'none',
              color: COLORS.primaryText,
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15 }}>🎟️</span> Semua Tiket
            </span>
            <span style={{ fontSize: 10, opacity: 0.7 }}>{ticketOpen ? '▾' : '▸'}</span>
          </button>
          {ticketOpen && (
            <div>
              <SidebarItem icon="📂" label="Tiket Open"       to="/tickets?status=open"        small />
              <SidebarItem icon="🔄" label="Tiket In Progress" to="/tickets?status=in_progress" small />
              <SidebarItem icon="⏸️" label="Tiket Pending"    to="/tickets?status=pending"     small />
              <SidebarItem icon="✅" label="Tiket Resolved"   to="/tickets?status=resolved"    small />
              <SidebarItem icon="🔒" label="Tiket Closed"     to="/tickets?status=closed"      small />
              {user?.role !== 'engineer' && (
                <SidebarItem icon="➕" label="Buat Tiket" to="/tickets/new" small />
              )}
            </div>
          )}
        </div>

        {user?.role === 'admin' && (
          <>
            <SidebarSection label="Administrasi" />
            <SidebarItem icon="⚙️" label="Admin Panel" to="/admin" />
          </>
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.10)', fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
        v1.0.0
      </div>
    </div>
  );
}

export default function PageLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.bgPage }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Navbar />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
