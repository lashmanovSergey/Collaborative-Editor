import React, { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

interface LayoutProps {
  children: ReactNode;
  fullBleed?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, fullBleed = false }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <nav className="app-nav">
        <div className="app-nav__content">
          <Link to="/profile" className="app-nav__brand">
            <div>
              <div className="text-text-primary text-lg font-semibold">Collaborative Editor</div>
            </div>
          </Link>
          <div className="app-nav__links">
            <Link to="/profile" className="app-nav__link">
              Profile
            </Link>
            <Link to="/profile" className="app-nav__link">
              Rooms
            </Link>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
      </nav>
      <main className={`app-main ${fullBleed ? 'app-main--fullbleed' : ''}`}>
        {fullBleed ? children : (
          <div className="container mx-auto">
            {children}
          </div>
        )}
      </main>
      <footer className="app-footer">
        <div className="app-footer__content">
          <p className="text-text-tertiary text-xs">
            {new Date().getFullYear()} Collaborative Editor. Made for developers by developers.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
