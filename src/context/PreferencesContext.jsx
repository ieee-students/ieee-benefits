import { createContext, useContext, useState, useEffect } from 'react';

const PreferencesContext = createContext();

export const usePreferences = () => useContext(PreferencesContext);

export const PreferencesProvider = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('ieee_preferences');
    if (saved) return JSON.parse(saved);
    
    // Get system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    return {
      onboarded: false,
      isStudent: true,
      isIEEEMember: true,
      regions: ['Global'],
      interests: [],
      theme: prefersDark ? 'dark' : 'light'
    };
  });

  useEffect(() => {
    localStorage.setItem('ieee_preferences', JSON.stringify(preferences));
  }, [preferences]);

  const updatePreferences = (newPrefs) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  };

  const completeOnboarding = (prefs) => {
    setPreferences(prev => ({ ...prev, ...prefs, onboarded: true }));
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences, completeOnboarding, isModalOpen, setIsModalOpen }}>
      {children}
    </PreferencesContext.Provider>
  );
};
