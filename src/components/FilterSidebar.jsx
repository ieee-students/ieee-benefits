import React, { useEffect, useState } from 'react';
import { fetchOUs, fetchCategories, fetchSpoInfo } from '../services/api';
import './FilterSidebar.css';

const FilterSidebar = ({ filters, setFilters, spoInfo: externalSpoInfo }) => {
  const [spos, setSpos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [localSpoInfo, setLocalSpoInfo] = useState({});
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const spoInfo = externalSpoInfo || localSpoInfo;

  useEffect(() => {
    fetchOUs().then(setSpos);
    fetchCategories().then(setCategories);
    if (!externalSpoInfo) {
      fetchSpoInfo().then(setLocalSpoInfo);
    }
  }, [externalSpoInfo]);

  const toggleFilter = (category, value) => {
    setFilters(prev => {
      const current = prev[category] || [];
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter(item => item !== value) };
      }
      return { ...prev, [category]: [...current, value] };
    });
  };

  const clearFilters = () => {
    setFilters({ types: [], sponsors: [] });
  };

  // Count active filters for the badge
  const activeFilterCount = (filters.types?.length || 0) + (filters.sponsors?.length || 0);

  const renderSpoLabel = (spo) => (
    <label key={spo.hiddenSpoId} className="filter-label">
      <input
        type="checkbox"
        checked={filters.sponsors?.includes(spo.spoName) || false}
        onChange={() => toggleFilter('sponsors', spo.spoName)}
      />
      <span className="checkmark"></span>
      {spo.spoName}
    </label>
  );

  return (
    <aside className={`filter-sidebar glass-panel ${mobileExpanded ? 'mobile-expanded' : ''}`}>
      {/* Mobile toggle bar – visible only on mobile */}
      <button
        className="filter-mobile-toggle"
        onClick={() => setMobileExpanded(prev => !prev)}
        aria-expanded={mobileExpanded}
        aria-controls="filter-body"
      >
        <span className="filter-toggle-label">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="16" y2="12" />
            <line x1="4" y1="18" x2="12" y2="18" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="filter-badge">{activeFilterCount}</span>
          )}
        </span>
        <svg
          className={`filter-chevron ${mobileExpanded ? 'rotated' : ''}`}
          width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Filter body – always visible on desktop, collapsible on mobile */}
      <div className="filter-body" id="filter-body">
        <div className="filter-header">
          <h3>Filters</h3>
          <button className="clear-btn" onClick={clearFilters}>Clear All</button>
        </div>

        <div className="filter-group">
          <h4>Category</h4>
          {categories.filter(c => !c.disabled).map(cat => (
            <label key={cat.title} className="filter-label">
              <input
                type="checkbox"
                checked={filters.types?.includes(cat.title) || false}
                onChange={() => toggleFilter('types', cat.title)}
              />
              <span className="checkmark"></span>
              {cat.title}
            </label>
          ))}
        </div>

        <div className="filter-group" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <h4>Organization Units</h4>
          
          <h5 className="filter-subheading">IEEE Committees</h5>
          {spos.filter(s => s.spoAcctClass === 'Organizational SPO').map(renderSpoLabel)}

          <h5 className="filter-subheading">IEEE Societies & Technical Councils</h5>
          {spos.filter(s => s.spoAcctClass === 'Technical SPO').map(renderSpoLabel)}

          <h5 className="filter-subheading">IEEE Geographic Units</h5>
          {spos.filter(s => s.spoAcctClass === 'Geographic SPO').map(renderSpoLabel)}
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
