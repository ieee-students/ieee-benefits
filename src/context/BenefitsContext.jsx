import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchBenefits } from '../services/api';

const BenefitsContext = createContext();

export const useBenefits = () => useContext(BenefitsContext);

export const BenefitsProvider = ({ children }) => {
  const [benefits, setBenefits] = useState(() => {
    const cached = localStorage.getItem('db_benefits_cache');
    if (cached) {
      try { 
        return JSON.parse(cached); 
      } catch(e) {
        console.warn("Invalid benefits cache");
      }
    }
    return [];
  });
  
  // If we already have cache, we don't need to block UI with a hard loading state
  const [loading, setLoading] = useState(benefits.length === 0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const data = await fetchBenefits();
        if (mounted && data) {
          setBenefits(data);
          localStorage.setItem('db_benefits_cache', JSON.stringify(data));
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      }
    };
    
    // Always trigger a background fetch to keep cache and view fresh
    loadData();

    return () => { mounted = false; };
  }, []);

  return (
    <BenefitsContext.Provider value={{ benefits, loading, error }}>
      {children}
    </BenefitsContext.Provider>
  );
};
