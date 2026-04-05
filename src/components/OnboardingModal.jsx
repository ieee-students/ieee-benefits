import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { fetchOUs, fetchCategories } from '../services/api';
import './OnboardingModal.css';

const OnboardingModal = () => {
  const { preferences, completeOnboarding, isModalOpen, setIsModalOpen } = usePreferences();
  const navigate = useNavigate();

  const [localPrefs, setLocalPrefs] = useState({
    isStudent: preferences.isStudent !== false, // default true
    isIEEEMember: preferences.isIEEEMember !== false, // default true
    regions: preferences.regions || [],
    interests: preferences.interests || []
  });
  const [ous, setOUs] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchOUs().then(setOUs);
    fetchCategories().then(setCategories);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, setIsModalOpen]);



  const toggleArrayItem = (key, value) => {
    setLocalPrefs(prev => {
      const array = prev[key];
      if (array.includes(value)) {
        return { ...prev, [key]: array.filter(item => item !== value) };
      } else {
        return { ...prev, [key]: [...array, value] };
      }
    });
  };

  const toggleSingleItem = (key, value) => {
    setLocalPrefs(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? [] : [value]
    }));
  };

  const handleComplete = () => {
    completeOnboarding(localPrefs);
    setIsModalOpen(false);
    navigate('/explore?forYou=true');
  };

  if (!isModalOpen) return null;

  const interestOptions = categories.map(c => c.title);

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ position: 'relative' }}>
        <button 
          onClick={() => setIsModalOpen(false)} 
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          aria-label="Close"
        >
          <X size={24} />
        </button>
        <div className="modal-header">
          <h2>Welcome to IEEE Benefits</h2>
          <p>Let's personalize your experience. Tell us what you're interested in.</p>
        </div>

        <div className="modal-body">
          <div className="onboarding-section">
            <h3>I'm a...</h3>
            <div className="pill-group">
                <button
                  className={`pill ${localPrefs.isStudent ? 'active' : ''}`}
                  onClick={() => setLocalPrefs(prev => ({ ...prev, isStudent: true }))}
                >
                  Student
                </button>
                <button
                  className={`pill ${!localPrefs.isStudent ? 'active' : ''}`}
                  onClick={() => setLocalPrefs(prev => ({ ...prev, isStudent: false }))}
                >
                  Professional
                </button>
            </div>
          </div>

          <div className="onboarding-section">
            <h3>I'm an...</h3>
            <div className="pill-group">
                <button
                  className={`pill ${localPrefs.isIEEEMember ? 'active' : ''}`}
                  onClick={() => setLocalPrefs(prev => ({ ...prev, isIEEEMember: true }))}
                >
                  IEEE Member
                </button>
                <button
                  className={`pill ${!localPrefs.isIEEEMember ? 'active' : ''}`}
                  onClick={() => setLocalPrefs(prev => ({ ...prev, isIEEEMember: false }))}
                >
                  Non-IEEE Member
                </button>
            </div>
          </div>

          <div className="onboarding-section">
            <h3>I'm from...</h3>
            <div className="pill-group">
              {ous.filter(o => o.spoAcctClass === 'Geographic SPO').map(ou => (
                <button
                  key={ou.hiddenSpoId}
                  className={`pill ${localPrefs.regions.includes(ou.spoName) ? 'active' : ''}`}
                  onClick={() => toggleSingleItem('regions', ou.spoName)}
                >
                  {ou.spoName}
                </button>
              ))}
            </div>
          </div>

          <div className="onboarding-section">
            <h3>I'm interested in...</h3>
            <div className="pill-group">
              {interestOptions.map(opt => (
                <button
                  key={opt}
                  className={`pill ${localPrefs.interests.includes(opt) ? 'active' : ''}`}
                  onClick={() => toggleArrayItem('interests', opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.8rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>This data is saved only in your browser.</span>
          <button className="btn btn-primary" onClick={handleComplete}>
            Let's Explore
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
