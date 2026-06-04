import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  LayoutDashboard, 
  PlusCircle, 
  LogOut, 
  Sun, 
  Moon, 
  User, 
  GraduationCap 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/tests/new') return 'Create Exam';
    if (path.includes('/questions')) return 'Manage Questions';
    if (path.includes('/preview')) return 'Test Preview & Publish';
    if (path.includes('/edit')) return 'Edit Exam Details';
    return 'Preproute';
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <GraduationCap size={28} style={{ marginRight: '8px' }} />
          <span>Preproute</span>
        </div>
        
        <nav className="sidebar-nav">
          <Link 
            to="/dashboard" 
            className={`sidebar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            id="nav-dashboard"
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          
          <Link 
            to="/tests/new" 
            className={`sidebar-link ${location.pathname === '/tests/new' ? 'active' : ''}`}
            id="nav-create-test"
          >
            <PlusCircle size={20} />
            <span>Create Test</span>
          </Link>
        </nav>

        {/* User Card in Sidebar Footer */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0 0.5rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-glow)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : <User size={20} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Admin User'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user?.role || 'Moderator'}
              </span>
            </div>
          </div>

          <button 
            onClick={handleLogout} 
            className="btn btn-secondary" 
            style={{ width: '100%', justifyContent: 'flex-start', padding: '0.6rem 1rem' }}
            id="btn-logout"
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="main-content">
        {/* Header */}
        <header className="app-header">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              {getPageTitle()}
            </h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme} 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px' }}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              id="btn-theme-toggle"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        {/* Content Pane */}
        <main className="content-pane">
          {children}
        </main>
      </div>
    </div>
  );
};
