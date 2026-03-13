import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const adminNav = [
  { to: '/admin/dashboard', icon: '▦', label: 'Dashboard' },
  { to: '/admin/contests', icon: '🏆', label: 'Concursos' },
  { to: '/admin/rubrics', icon: '📋', label: 'Rúbricas' },
  { to: '/admin/users', icon: '👥', label: 'Usuarios' },
  { to: '/admin/assignments', icon: '📎', label: 'Asignaciones' },
];

const reviewerNav = [
  { to: '/reviewer/dashboard', icon: '▦', label: 'Dashboard' },
];

const studentNav = [
  { to: '/student/dashboard', icon: '▦', label: 'Mi Proyecto' },
];

export default function Layout({ children, role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const nav = role === 'admin' ? adminNav : role === 'reviewer' ? reviewerNav : studentNav;
  const roleLabel = role === 'admin' ? 'Administrador' : role === 'reviewer' ? 'Revisor' : 'Alumno';
  const roleColor = role === 'admin' ? 'var(--primary)' : role === 'reviewer' ? 'var(--secondary)' : 'var(--success)';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarW = collapsed ? 64 : 240;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarW, minHeight: '100vh', background: 'var(--gray-900)',
        display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, overflowX: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? '20px 12px' : '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏅</div>
            {!collapsed && (
              <div>
                <div style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: 14, lineHeight: 1.2 }}>Sistema de</div>
                <div style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: 14, lineHeight: 1.2 }}>Concursos</div>
              </div>
            )}
          </div>
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: roleColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{roleLabel}</span>
          </div>
        )}

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: collapsed ? '12px 20px' : '11px 20px',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              borderLeft: isActive ? `3px solid ${roleColor}` : '3px solid transparent',
              fontSize: 14, fontWeight: isActive ? 600 : 400, transition: 'all 0.15s',
              textDecoration: 'none',
            })}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: collapsed ? '12px' : '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {!collapsed && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 'var(--radius)',
            color: 'rgba(255,255,255,0.6)', padding: collapsed ? '8px 12px' : '8px 14px',
            fontSize: 13, cursor: 'pointer', width: '100%', justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
            <span>⎋</span>
            {!collapsed && 'Cerrar sesión'}
          </button>
        </div>

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          position: 'absolute', right: -12, top: 72, width: 24, height: 24,
          borderRadius: '50%', background: 'var(--gray-700)', border: '2px solid var(--gray-900)',
          color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {collapsed ? '›' : '‹'}
        </button>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: sidebarW, flex: 1, transition: 'margin-left 0.2s ease', minHeight: '100vh' }}>
        <div style={{ padding: '32px', maxWidth: 1200 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
