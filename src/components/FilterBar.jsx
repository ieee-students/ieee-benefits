import React, { useEffect, useState, useRef } from 'react';
import { fetchOUs, fetchCategories, fetchSpoInfo } from '../services/api';
import { Search, ChevronDown, SlidersHorizontal, RotateCcw } from 'lucide-react';
import './FilterBar.css';

const FilterBar = ({ filters, setFilters, spoInfo: externalSpoInfo }) => {
  const [spos, setSpos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [localSpoInfo, setLocalSpoInfo] = useState({});
  
  const [openDropdown, setOpenDropdown] = useState(null); // 'category' | 'ou' | null
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [ouSearch, setOuSearch] = useState('');
  const containerRef = useRef(null);

  const spoInfo = externalSpoInfo || localSpoInfo;

  useEffect(() => {
    fetchOUs().then(setSpos);
    fetchCategories().then(setCategories);
    if (!externalSpoInfo) {
      fetchSpoInfo().then(setLocalSpoInfo);
    }
  }, [externalSpoInfo]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.filter-dropdown-container')) {
        setOpenDropdown(null);
        setOuSearch('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleFilter = (category, value) => {
    setFilters(prev => {
      const current = prev[category] || [];
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter(item => item !== value) };
      }
      return { ...prev, [category]: [...current, value] };
    });
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleEligibilityChange = (value) => {
    setFilters(prev => ({ ...prev, eligibility: value }));
  };

  const handleMembershipChange = (value) => {
    setFilters(prev => ({ ...prev, membership: value }));
  };

  const clearFilters = () => {
    setFilters({
      types: [],
      sponsors: [],
      eligibility: 'both',
      membership: 'all',
      search: ''
    });
  };

  const activeFilterCount =
    (filters.types?.length || 0) +
    (filters.sponsors?.length || 0) +
    (filters.eligibility !== 'both' ? 1 : 0) +
    (filters.membership !== 'all' ? 1 : 0) +
    (filters.search ? 1 : 0);

  const toggleDropdown = (dropdown) => {
    setOpenDropdown(prev => {
      const next = prev === dropdown ? null : dropdown;
      if (next !== 'ou') {
        setOuSearch('');
      }
      return next;
    });
  };

  const renderSpoLabel = (spo) => (
    <label key={spo.hiddenSpoId} className="filter-label">
      <input
        type="checkbox"
        checked={filters.sponsors?.includes(spo.spoName) || false}
        onChange={() => toggleFilter('sponsors', spo.spoName)}
      />
      <span className="checkmark"></span>
      <span className="label-text">{spo.spoName}</span>
    </label>
  );

  const filteredSpos = spos.filter(s =>
    s.spoName?.toLowerCase().includes(ouSearch.toLowerCase())
  );
  const committees = filteredSpos.filter(s => s.spoAcctClass === 'Organizational SPO');
  const societies = filteredSpos.filter(s => s.spoAcctClass === 'Technical SPO');
  const geoUnits = filteredSpos.filter(s => s.spoAcctClass === 'Geographic SPO');

  return (
    <div className="filter-bar-container glass-panel" ref={containerRef}>
      <div className="filter-bar-main">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search opportunities..."
            value={filters.search || ''}
            onChange={handleSearchChange}
          />
        </div>

        <div className="filter-actions-group">
          {/* Categories Dropdown */}
          <div className="filter-dropdown-container">
            <button
              className={`filter-btn ${filters.types?.length > 0 ? 'active' : ''}`}
              onClick={() => toggleDropdown('category')}
              aria-haspopup="true"
              aria-expanded={openDropdown === 'category'}
            >
              <span>
                Category {filters.types?.length > 0 && `(${filters.types.length})`}
              </span>
              <ChevronDown size={16} className={`chevron ${openDropdown === 'category' ? 'rotated' : ''}`} />
            </button>

            {openDropdown === 'category' && (
              <div className="dropdown-panel">
                <div className="dropdown-panel-header">
                  <h4>Select Categories</h4>
                </div>
                <div className="dropdown-panel-content">
                  {categories.map(cat => (
                    <label key={cat.title} className="filter-label">
                      <input
                        type="checkbox"
                        checked={filters.types?.includes(cat.title) || false}
                        onChange={() => toggleFilter('types', cat.title)}
                      />
                      <span className="checkmark"></span>
                      <span className="label-text">{cat.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Org Units Dropdown */}
          <div className="filter-dropdown-container">
            <button
              className={`filter-btn ${filters.sponsors?.length > 0 ? 'active' : ''}`}
              onClick={() => toggleDropdown('ou')}
              aria-haspopup="true"
              aria-expanded={openDropdown === 'ou'}
            >
              <span>
                Organization Unit {filters.sponsors?.length > 0 && `(${filters.sponsors.length})`}
              </span>
              <ChevronDown size={16} className={`chevron ${openDropdown === 'ou' ? 'rotated' : ''}`} />
            </button>

            {openDropdown === 'ou' && (
              <div className="dropdown-panel dropdown-panel-large">
                <div className="dropdown-panel-header">
                  <h4>Select Org Units</h4>
                  <div className="ou-search-wrapper" style={{ marginTop: '8px' }}>
                    <input
                      type="text"
                      className="ou-search-input"
                      placeholder="Search units..."
                      value={ouSearch}
                      onChange={(e) => setOuSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="dropdown-panel-content ou-scroll-container">
                  {committees.length > 0 && (
                    <div className="ou-group">
                      <h5 className="filter-subheading">IEEE Committees</h5>
                      {committees.map(renderSpoLabel)}
                    </div>
                  )}
                  {societies.length > 0 && (
                    <div className="ou-group">
                      <h5 className="filter-subheading">IEEE Societies & Technical Councils</h5>
                      {societies.map(renderSpoLabel)}
                    </div>
                  )}
                  {geoUnits.length > 0 && (
                    <div className="ou-group">
                      <h5 className="filter-subheading">IEEE Geographic Units</h5>
                      {geoUnits.map(renderSpoLabel)}
                    </div>
                  )}
                  {filteredSpos.length === 0 && (
                    <div className="no-ou-results">No organization units match "{ouSearch}"</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Advanced Toggle */}
          <button
            className={`filter-btn advanced-toggle-btn ${showAdvanced ? 'active' : ''}`}
            onClick={() => {
              setShowAdvanced(prev => !prev);
              setOpenDropdown(null); // Close any active dropdowns
              setOuSearch('');
            }}
            aria-expanded={showAdvanced}
          >
            <SlidersHorizontal size={16} />
            <span>Advanced Filters</span>
          </button>

          {/* Clear All */}
          {activeFilterCount > 0 && (
            <button className="clear-all-btn btn btn-sm" onClick={clearFilters}>
              <RotateCcw size={14} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Expandable Row */}
      {showAdvanced && (
        <div className="filter-bar-advanced">
          <div className="advanced-filter-group">
            <span className="advanced-group-label">Eligibility</span>
            <div className="segmented-control">
              <button
                className={`segment-btn ${filters.eligibility === 'both' ? 'active' : ''}`}
                onClick={() => handleEligibilityChange('both')}
              >
                Anyone
              </button>
              <button
                className={`segment-btn ${filters.eligibility === 'student' ? 'active' : ''}`}
                onClick={() => handleEligibilityChange('student')}
              >
                Students Only
              </button>
              <button
                className={`segment-btn ${filters.eligibility === 'professional' ? 'active' : ''}`}
                onClick={() => handleEligibilityChange('professional')}
              >
                Professionals
              </button>
            </div>
          </div>

          <div className="advanced-filter-group">
            <span className="advanced-group-label">Membership</span>
            <div className="segmented-control">
              <button
                className={`segment-btn ${filters.membership === 'all' ? 'active' : ''}`}
                onClick={() => handleMembershipChange('all')}
              >
                All
              </button>
              <button
                className={`segment-btn ${filters.membership === 'ieee' ? 'active' : ''}`}
                onClick={() => handleMembershipChange('ieee')}
              >
                IEEE Required
              </button>
              <button
                className={`segment-btn ${filters.membership === 'non-ieee' ? 'active' : ''}`}
                onClick={() => handleMembershipChange('non-ieee')}
              >
                Open to Non-Members
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
