import React from 'react';
import { X } from 'lucide-react';
import './ActiveFilters.css';

const ActiveFilters = ({ filters, setFilters }) => {
  const activeFilters = [];

  if (filters.search) {
    activeFilters.push({ id: 'search', type: 'search', label: `"${filters.search}"`, onRemove: () => setFilters(prev => ({ ...prev, search: '' })) });
  }

  filters.types.forEach(type => {
    activeFilters.push({ id: `type-${type}`, type: 'types', label: type, onRemove: () => setFilters(prev => ({ ...prev, types: prev.types.filter(t => t !== type) })) });
  });

  filters.sponsors.forEach(spo => {
    activeFilters.push({ id: `spo-${spo}`, type: 'sponsors', label: spo, onRemove: () => setFilters(prev => ({ ...prev, sponsors: prev.sponsors.filter(s => s !== spo) })) });
  });

  if (filters.eligibility !== 'both') {
    const label = filters.eligibility === 'student' ? 'Students Only' : 'Professionals Only';
    activeFilters.push({ id: 'eligibility', type: 'eligibility', label, onRemove: () => setFilters(prev => ({ ...prev, eligibility: 'both' })) });
  }

  if (filters.membership !== 'all') {
    const label = filters.membership === 'ieee' ? 'IEEE Required' : 'Non-Members';
    activeFilters.push({ id: 'membership', type: 'membership', label, onRemove: () => setFilters(prev => ({ ...prev, membership: 'all' })) });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="active-filters-container">
      <div className="active-filters-list">
        {activeFilters.map(filter => (
          <span key={filter.id} className="active-filter-pill">
            <span className="active-filter-label">{filter.label}</span>
            <button className="active-filter-remove" onClick={filter.onRemove} aria-label={`Remove ${filter.label} filter`}>
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
      {activeFilters.length > 1 && (
        <button 
          className="active-filters-clear-all"
          onClick={() => setFilters({ types: [], sponsors: [], eligibility: 'both', membership: 'all', search: '' })}
        >
          Clear All
        </button>
      )}
    </div>
  );
};

export default ActiveFilters;
