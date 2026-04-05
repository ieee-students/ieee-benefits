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
