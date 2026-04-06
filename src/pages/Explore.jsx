import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterSidebar from '../components/FilterSidebar';
import BenefitCard from '../components/BenefitCard';
import { useBenefits } from '../hooks/useBenefits';
import { usePreferences } from '../context/PreferencesContext';
import { fetchOUs, fetchSpoInfo } from '../services/api';
import { Loader2 } from 'lucide-react';
import './Explore.css';

const Explore = () => {
  const { benefits, loading } = useBenefits();
  const { preferences } = usePreferences();
  const [searchParams] = useSearchParams();
  const [spoInfo, setSpoInfo] = useState({});
  const [spoNameToId, setSpoNameToId] = useState({});

  const [filters, setFilters] = useState({
    types: [],
    sponsors: []
  });

  useEffect(() => {
    fetchSpoInfo().then(setSpoInfo);
    fetchOUs().then(spos => {
      const map = {};
      spos.forEach(s => { map[s.spoName] = s.hiddenSpoId; });
      setSpoNameToId(map);
    });
  }, []);

  // Initialize filters from URL or "forYou" flag
  useEffect(() => {


    const isForYou = searchParams.get('forYou') === 'true';
    if (isForYou && preferences) {
      setFilters({
        types: preferences.interests || [],
        sponsors: preferences.regions || []
      });
      return;
    }

    const typeParam = searchParams.get('type');
    const spoParam = searchParams.get('spo');
    const newFilters = { types: [], sponsors: [] };
    
    if (typeParam) newFilters.types = [typeParam];
    if (spoParam) newFilters.sponsors = [spoParam];
    
    setFilters(newFilters);
  }, [searchParams, preferences]);

  const filteredBenefits = useMemo(() => {


    return benefits.filter(b => {
      // Type matching
      if (filters.types?.length > 0) {
        if (!filters.types.includes(b.category)) return false;
      }
      
      // Sponsors matching
      if (filters.sponsors?.length > 0) {
        if (!filters.sponsors.includes(b.spoName)) return false;
      }



      return true;
    });
  }, [benefits, filters]);

  return (
    <div className="explore-page">
      <div className="explore-layout">
        <div className="sidebar-container">
          <FilterSidebar filters={filters} setFilters={setFilters} spoInfo={spoInfo} />
        </div>
        
        <div className="content-container">
          <header className="page-header">
            <h1>Explore Benefits</h1>
            <p className="text-muted">Showing {filteredBenefits.length} opportunities based on current filters.</p>
          </header>

          <div className="benefits-grid">
            {loading ? (
              <div className="loading-state" style={{ gridColumn: '1 / -1', minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
                <span>Loading Benefits Data...</span>
              </div>
            ) : filteredBenefits.length > 0 ? (
              filteredBenefits.map(benefit => (
                <BenefitCard key={benefit.id} benefit={benefit} spoInfo={spoInfo} spoNameToId={spoNameToId} />
              ))
            ) : (
              <div className="empty-state">
                <h3>No benefits found</h3>
                <p>Try adjusting your filters to see more results.</p>
                <button className="btn btn-primary" onClick={() => setFilters({types: [], sponsors: []})}>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;
