import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Map, Users, Target, Landmark, Layers,
  Trophy, BadgeDollarSign, Code, GraduationCap, Wrench, Video, FileText,
  Book, User, Star, Briefcase, Lightbulb, Award, HelpCircle, Loader2
} from 'lucide-react';
import { useBenefits } from '../hooks/useBenefits';
import { usePreferences } from '../context/PreferencesContext';
import { fetchOUs, fetchCategories } from '../services/api';
import './Home.css';

const iconMap = {
  Trophy, BadgeDollarSign, Map, Users, HelpCircle, Award, Target, Book, Code, Wrench, Video, FileText, GraduationCap, User, Star, Briefcase, Lightbulb, Landmark, Layers
};



const Home = () => {
  const { benefits, loading } = useBenefits();
  const { preferences, setIsModalOpen } = usePreferences();
  const navigate = useNavigate();
  const [spos, setSpos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAllSocieties, setShowAllSocieties] = useState(false);
  const [societyGridCols, setSocietyGridCols] = useState(6);
  const societyGridRef = useRef(null);

  // Detect how many columns the grid actually has
  useEffect(() => {
    const gridEl = societyGridRef.current;
    if (!gridEl) return;
    const observer = new ResizeObserver(() => {
      const style = window.getComputedStyle(gridEl);
      const cols = style.getPropertyValue('grid-template-columns').split(' ').length;
      setSocietyGridCols(cols);
    });
    observer.observe(gridEl);
    return () => observer.disconnect();
  }, [spos]);

  useEffect(() => {
    fetchOUs().then(setSpos);
    fetchCategories().then(setCategories);
  }, []);

  const exploreCategory = (filterType, filterValue) => {
    const params = new URLSearchParams();
    params.append(filterType, filterValue);
    navigate(`/explore?${params.toString()}`);
  };

  const dashboardData = useMemo(() => {
    const typesCount = {};
    const sponsorsCount = {};
    const eligibilitiesCount = {};

    let forYouCount = 0;

    benefits.forEach(b => {
      // Types count
      if (b.category) {
        typesCount[b.category] = (typesCount[b.category] || 0) + 1;
      }

      // OUs count
      if (b.spoName) {
        sponsorsCount[b.spoName] = (sponsorsCount[b.spoName] || 0) + 1;
      }



      // "For You" count
      const matchInterest = preferences.interests.includes(b.category);

      const matchSponsor = !b.spoName || preferences.regions.includes(b.spoName);

      const matchDemo = (preferences.isStudent == null || b.student === preferences.isStudent) &&
        (preferences.isIEEEMember || b.ieeeMembershipRequired === false);

      if (matchInterest || matchSponsor || matchDemo) {
        forYouCount++;
      }
    });

    return { typesCount, sponsorsCount, eligibilitiesCount, forYouCount };
  }, [benefits, preferences]);

  return (
    <div className="home-dashboard">
      <section className="hero-section">
        <h1>Unlock the Benefits of IEEE <span style={{ color: '#678e1e', WebkitTextFillColor: '#678e1e' }}>Student</span> Membership</h1>
        <p className="subtitle" style={{ maxWidth: '800px', lineHeight: '1.6', fontSize: '1.1rem' }}>IEEE is a vast organization with countless opportunities extending far beyond Student Activities. We've curated a comprehensive collection of competitions, awards, funding, and exclusive programs from across the organization to ensure you have the resources needed to advance your technologically-oriented education and career.</p>

      </section>

      <section className="dashboard-section">
        <div className="section-header">
          <Target className="section-icon" />
          <h2>Explore by Benefits Category</h2>
        </div>
        <div className="category-grid">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || HelpCircle;
            const count = dashboardData.typesCount[cat.title] || 0;
            const isDisabled = cat.disabled || (!loading && count === 0);

            return (
              <div
                key={cat.title}
                className={`category-card glass-panel ${isDisabled ? 'disabled' : 'clickable'}`}
                onClick={() => !isDisabled && exploreCategory('type', cat.title)}
                title={isDisabled ? "Data not yet available for this category" : ""}
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.8rem', opacity: isDisabled ? 0.5 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="card-title-wrap">
                    <Icon size={20} className="card-icon" />
                    <h3>{cat.title}</h3>
                  </div>
                  {!isDisabled && <div className="count-badge">{loading ? <Loader2 size={14} className="animate-spin spinner-inline" /> : count}</div>}
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', width: '100%' }}>
                  {cat.description}
                </p>
                {isDisabled && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto' }}>
                    <div className="count-badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>Coming Soon</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>



      <section className="dashboard-section">
        <div className="section-header">
          <Map className="section-icon" />
          <h2>Explore by Organization Units</h2>
        </div>

        <h3 className="subsection-title">IEEE Committees</h3>
        <div className="category-grid tight-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          {spos.filter(spo => spo.spoAcctClass === 'Organizational SPO').map(spo => {
            let totalCount = dashboardData.sponsorsCount[spo.spoName] || 0;
            return (
              <div key={spo.hiddenSpoId} className={`category-card small-card glass-panel clickable ${(!loading && totalCount > 0) ? 'has-items' : ''}`} onClick={() => exploreCategory('spo', spo.spoName)}>
                <h4>{spo.spoName}</h4>
                <span className="count-text">{loading ? <Loader2 size={14} className="animate-spin spinner-inline" /> : `${totalCount} available`}</span>
              </div>
            );
          })}
        </div>

        <h3 className="subsection-title">IEEE Societies & Technical Councils</h3>
        {(() => {
          const allSocieties = spos.filter(spo => spo.spoAcctClass === 'Technical SPO');
          const VISIBLE_ROWS = 3;
          const totalSlots = VISIBLE_ROWS * societyGridCols;
          const needsCollapse = allSocieties.length > totalSlots;
          const isCollapsed = needsCollapse && !showAllSocieties;

          let displayedSocieties;
          if (isCollapsed) {
            // Show totalSlots - 1 cards + 1 "Show All" card
            const limit = totalSlots - 1;
            const withCounts = allSocieties.map(spo => ({
              ...spo,
              _count: dashboardData.sponsorsCount[spo.spoName] || 0
            }));
            const withItems = withCounts.filter(s => s._count > 0);
            const withoutItems = withCounts.filter(s => s._count === 0);
            displayedSocieties = [...withItems, ...withoutItems].slice(0, limit);
          } else {
            displayedSocieties = allSocieties;
          }

          return (
            <div className="category-grid tight-grid" style={{ marginBottom: 'var(--space-xl)' }} ref={societyGridRef}>
              {displayedSocieties.map(spo => {
                let totalCount = dashboardData.sponsorsCount[spo.spoName] || 0;
                return (
                  <div key={spo.hiddenSpoId} className={`category-card small-card glass-panel clickable ${(!loading && totalCount > 0) ? 'has-items' : ''}`} onClick={() => exploreCategory('spo', spo.spoName)}>
                    <h4>{spo.spoName}</h4>
                    <span className="count-text">{loading ? <Loader2 size={14} className="animate-spin spinner-inline" /> : `${totalCount} available`}</span>
                  </div>
                );
              })}
              {isCollapsed && (
                <div
                  className="category-card small-card glass-panel clickable show-all-card"
                  onClick={() => setShowAllSocieties(true)}
                >
                  <h4>Show All</h4>
                  <span className="count-text">{allSocieties.filter(s => !s.spoName.includes('Council')).length} societies & {allSocieties.filter(s => s.spoName.includes('Council')).length} councils</span>
                </div>
              )}
              {showAllSocieties && needsCollapse && (
                <div
                  className="category-card small-card glass-panel clickable show-all-card"
                  onClick={() => setShowAllSocieties(false)}
                  style={{ gridColumn: '1 / -1', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 'var(--space-sm)' }}
                >
                  <span className="count-text">Show Less</span>
                </div>
              )}
            </div>
          );
        })()}

        <h3 className="subsection-title">IEEE Geographic Units</h3>
        <div className="category-grid tight-grid">
          {spos.filter(spo => spo.spoAcctClass === 'Geographic SPO').map(spo => {
            let totalCount = dashboardData.sponsorsCount[spo.spoName] || 0;
            return (
              <div key={spo.hiddenSpoId} className={`category-card small-card glass-panel clickable ${(!loading && totalCount > 0) ? 'has-items' : ''}`} onClick={() => exploreCategory('spo', spo.spoName)}>
                <h4>{spo.spoName}</h4>
                <span className="count-text">{loading ? <Loader2 size={14} className="animate-spin spinner-inline" /> : `${totalCount} available`}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Home;
