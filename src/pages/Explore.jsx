import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import BenefitCard from '../components/BenefitCard';
import { useBenefits } from '../hooks/useBenefits';
import { usePreferences } from '../context/PreferencesContext';
import { fetchOUs, fetchSpoInfo, fetchCategories } from '../services/api';
import {
  Loader2, Trophy, Award, BadgeDollarSign, GraduationCap, Landmark, Layers, Star, Map, Users, HelpCircle
} from 'lucide-react';
import './Explore.css';

const iconMap = {
  Trophy, Award, BadgeDollarSign, GraduationCap, Landmark, Layers, Star, Map, Users, HelpCircle
};

const Explore = () => {
  const { benefits, loading } = useBenefits();
  const { preferences } = usePreferences();
  const [searchParams] = useSearchParams();
  const [spoInfo, setSpoInfo] = useState({});
  const [spoNameToId, setSpoNameToId] = useState({});
  const [categories, setCategories] = useState([]);
  const [groupBy, setGroupBy] = useState('none');

  const [filters, setFilters] = useState({
    types: [],
    sponsors: [],
    eligibility: 'both',
    membership: 'all',
    search: ''
  });

  useEffect(() => {
    fetchSpoInfo().then(setSpoInfo);
    fetchCategories().then(setCategories);
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
        sponsors: preferences.regions || [],
        eligibility: preferences.isStudent ? 'student' : 'professional',
        membership: preferences.isIEEEMember ? 'ieee' : 'all',
        search: ''
      });
      return;
    }

    const typeParam = searchParams.get('type');
    const spoParam = searchParams.get('spo');
    const eligibilityParam = searchParams.get('eligibility');
    const membershipParam = searchParams.get('membership');
    const searchParam = searchParams.get('q');
    
    setFilters({
      types: typeParam ? [typeParam] : [],
      sponsors: spoParam ? [spoParam] : [],
      eligibility: eligibilityParam || 'both',
      membership: membershipParam || 'all',
      search: searchParam || ''
    });
  }, [searchParams, preferences]);

  const filteredBenefits = useMemo(() => {
    return benefits.filter(b => {
      // Keyword search matching
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const titleMatch = b.title?.toLowerCase().includes(query);
        const descMatch = b.description?.toLowerCase().includes(query);
        const spoMatch = b.spoName?.toLowerCase().includes(query);
        const catMatch = b.category?.toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !spoMatch && !catMatch) return false;
      }

      // Type matching
      if (filters.types?.length > 0) {
        if (!filters.types.includes(b.category)) return false;
      }
      
      // Sponsors matching
      if (filters.sponsors?.length > 0) {
        if (!filters.sponsors.includes(b.spoName)) return false;
      }

      // Eligibility matching
      if (filters.eligibility === 'student') {
        if (b.student !== true) return false;
      } else if (filters.eligibility === 'professional') {
        if (b.student === true) return false;
      }

      // Membership matching
      if (filters.membership === 'ieee') {
        if (b.ieeeMembershipRequired !== true) return false;
      } else if (filters.membership === 'non-ieee') {
        if (b.ieeeMembershipRequired === true) return false;
      }

      return true;
    });
  }, [benefits, filters]);

  const groupedBenefits = useMemo(() => {
    if (groupBy === 'none') return null;

    const groups = {};

    if (groupBy === 'category') {
      categories.forEach(cat => {
        groups[cat.title] = {
          name: cat.title,
          icon: cat.icon,
          color: cat.color,
          list: []
        };
      });

      const fallbackKey = 'Other';
      if (!groups[fallbackKey]) {
        groups[fallbackKey] = { name: fallbackKey, icon: 'HelpCircle', color: '#475569', list: [] };
      }

      filteredBenefits.forEach(b => {
        const catName = b.category || fallbackKey;
        if (!groups[catName]) {
          groups[catName] = { name: catName, icon: 'HelpCircle', color: '#475569', list: [] };
        }
        groups[catName].list.push(b);
      });
    } else if (groupBy === 'ou') {
      filteredBenefits.forEach(b => {
        const ouName = b.spoName || 'General / Unspecified';
        if (!groups[ouName]) {
          groups[ouName] = { name: ouName, list: [] };
        }
        groups[ouName].list.push(b);
      });
    }

    const resultList = Object.values(groups).filter(g => g.list.length > 0);

    if (groupBy === 'ou') {
      resultList.sort((a, b) => a.name.localeCompare(b.name));
    }

    return resultList;
  }, [filteredBenefits, groupBy, categories]);

  return (
    <div className="explore-page">
      <div className="explore-header-row">
        <header className="page-header">
          <h1>Explore Opportunities</h1>
          <p className="text-muted">Showing {filteredBenefits.length} opportunities based on current filters.</p>
        </header>

        <div className="group-by-container">
          <span className="group-by-label">Group By:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="group-by-select"
          >
            <option value="category">Category</option>
            <option value="ou">Organization Unit (OU)</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} spoInfo={spoInfo} />
      
      {loading ? (
        <div className="loading-state" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
          <span>Loading Benefits Data...</span>
        </div>
      ) : filteredBenefits.length > 0 ? (
        groupBy === 'none' ? (
          <div className="benefits-grid">
            {filteredBenefits.map(benefit => (
              <BenefitCard key={benefit.id} benefit={benefit} spoInfo={spoInfo} spoNameToId={spoNameToId} />
            ))}
          </div>
        ) : (
          <div className="grouped-benefits-container">
            {groupedBenefits.map(group => (
              <div key={group.name} className="benefit-group">
                <div className="group-header-separator">
                  <span className="separator-line"></span>
                  <h3 className="group-title">
                    {groupBy === 'category' && group.icon && (
                      (() => {
                        const GroupIcon = iconMap[group.icon] || HelpCircle;
                        return <GroupIcon size={18} className="group-header-icon" style={{ color: group.color, marginRight: '8px', verticalAlign: 'middle' }} />;
                      })()
                    )}
                    <span style={{ verticalAlign: 'middle' }}>{group.name}</span>
                    <span className="group-count">({group.list.length})</span>
                  </h3>
                  <span className="separator-line"></span>
                </div>
                <div className="benefits-grid">
                  {group.list.map(benefit => (
                    <BenefitCard key={benefit.id} benefit={benefit} spoInfo={spoInfo} spoNameToId={spoNameToId} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="empty-state">
          <h3>No benefits found</h3>
          <p>Try adjusting your filters to see more results.</p>
          <button
            className="btn btn-primary"
            onClick={() => setFilters({ types: [], sponsors: [], eligibility: 'both', membership: 'all', search: '' })}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Explore;

