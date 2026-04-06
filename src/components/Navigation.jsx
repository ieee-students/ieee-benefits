import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Heart, Sparkles, User, Menu, Sun, Moon, X } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import './Navigation.css';

const showContribute = import.meta.env.VITE_ENABLE_CONTRIBUTE === 'true';
const showPersonalize = import.meta.env.VITE_ENABLE_PERSONALIZE !== 'false';

const Navigation = () => {
  const location = useLocation();
  const { preferences, updatePreferences, setIsModalOpen } = usePreferences();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleOpenOnboarding = () => {
    setIsModalOpen(true);
  };

  const toggleTheme = () => {
    updatePreferences({ theme: preferences.theme === 'light' ? 'dark' : 'light' });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="navbar glass-panel">
      <div className="nav-container">
        <Link to="/" className="brand-group">
          <span className="brand-text">IEEE Benefits</span>
          <span className="brand-separator">×</span>
          <img src="/logos/CMA7400.png" alt="IEEE Students" className="brand-logo" />
        </Link>

        <div className="nav-right">
          <nav className="nav-links">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
            <Link to="/explore" className={`nav-link ${location.pathname === '/explore' ? 'active' : ''}`}>Explore</Link>
            {showContribute && (
              <Link to="/contribute" className={`nav-link ${location.pathname === '/contribute' ? 'active' : ''}`}>Contribute</Link>
            )}
          </nav>

          <div className="nav-actions">
            <button className="action-btn" onClick={toggleTheme} aria-label="Toggle Theme">
              {preferences.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <Link to="/favorites" className="action-btn desktop-only" aria-label="Favorites">
              <Heart size={20} />
            </Link>
            {showPersonalize && (
              <button className="action-btn personalize-btn desktop-only" onClick={handleOpenOnboarding} aria-label="Personalize">
                <User size={20} />
                <span className="personalize-text" style={{ marginLeft: '6px', fontSize: '0.9rem', fontWeight: '500' }}>Personalize</span>
              </button>
            )}
            <button className="action-btn mobile-only" onClick={toggleMobileMenu} aria-label="Toggle Menu">
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={toggleMobileMenu}>Home</Link>
        <Link to="/explore" className={`nav-link ${location.pathname === '/explore' ? 'active' : ''}`} onClick={toggleMobileMenu}>Explore</Link>
        {showContribute && (
          <Link to="/contribute" className={`nav-link ${location.pathname === '/contribute' ? 'active' : ''}`} onClick={toggleMobileMenu}>Contribute</Link>
        )}
        <Link to="/favorites" className={`nav-link ${location.pathname === '/favorites' ? 'active' : ''}`} onClick={toggleMobileMenu}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={18} /> Favorites
          </div>
        </Link>
        {showPersonalize && (
          <div className="nav-link" style={{ cursor: 'pointer' }} onClick={() => { handleOpenOnboarding(); toggleMobileMenu(); }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} /> Personalize
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navigation;
