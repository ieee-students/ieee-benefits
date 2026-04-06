import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { PreferencesProvider, usePreferences } from './context/PreferencesContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { BenefitsProvider } from './context/BenefitsContext';
import Navigation from './components/Navigation';
import MetaNav from './components/MetaNav';
import Footer from './components/Footer';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Favorites from './pages/Favorites';
import Contribute from './pages/Contribute';
import OnboardingModal from './components/OnboardingModal';
import { fetchOUs, fetchCategories } from './services/api';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const MainApp = () => {
  const { preferences } = usePreferences();

  useEffect(() => {
    document.body.className = `theme-${preferences.theme || 'dark'}`;
  }, [preferences.theme]);

  // Dynamically inject CSS variables based on configured categories
  useEffect(() => {
    fetchCategories().then(cats => {
      if (!cats || cats.length === 0) return;
      const styleId = 'dynamic-category-styles';
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      const cssRules = cats.map(cat => {
        if (!cat.color) return '';
        const safeName = (cat.title || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
        const color = cat.color;
        const textColor = cat.textColor || '#ffffff';
        return `
          .cat-${safeName}:hover { border-left-color: ${color} !important; }
          .cat-${safeName} .card-icon { color: ${color} !important; opacity: 1 !important; }
          .cat-${safeName} .count-badge { background: ${color} !important; color: ${textColor} !important; }
          
          .badge.badge-${safeName} {
            background: ${color} !important;
            color: ${textColor} !important;
            border-color: ${color} !important;
          }
        `;
      }).join('\n');
      
      styleEl.innerHTML = cssRules;
    });
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <div className={`app-container theme-${preferences.theme || 'dark'}`}>
        <MetaNav />
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/contribute" element={<Contribute />} />
          </Routes>
        </main>
        <Footer />
        <OnboardingModal />
      </div>
    </Router>
  );
};

function App() {
  return (
    <PreferencesProvider>
      <FavoritesProvider>
        <BenefitsProvider>
          <MainApp />
        </BenefitsProvider>
      </FavoritesProvider>
    </PreferencesProvider>
  );
}

export default App;
