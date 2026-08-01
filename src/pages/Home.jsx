import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Map, Users, Target, Landmark, Layers,
  Trophy, BadgeDollarSign, Code, GraduationCap, Wrench, Video, FileText,
  Book, User, Star, Briefcase, Lightbulb, Award, HelpCircle, Loader2, Lock,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useBenefits } from '../hooks/useBenefits';
import { usePreferences } from '../context/PreferencesContext';
import { fetchOUs, fetchCategories, fetchSpoInfo } from '../services/api';
import OrgLogo from '../components/OrgLogo';
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
  const [spoInfo, setSpoInfo] = useState({});
  const [showAllSocieties, setShowAllSocieties] = useState(false);
  const [showAllCommittees, setShowAllCommittees] = useState(false);
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
    fetchSpoInfo().then(setSpoInfo);
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
        <h1>Unlock the Benefits of <span style={{ color: '#00629B', WebkitTextFillColor: '#00629B' }}>IEEE</span> Membership</h1>
        <p className="subtitle">IEEE is a vast global organization offering countless professional and academic opportunities. We've curated a comprehensive collection of competitions, awards, funding, and exclusive programs from across the entire IEEE network to ensure you have the resources needed to leverage your membership and advance your career, research, and education.</p>

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
            const isDisabled = !loading && count === 0;

            return (
              <div
                key={cat.title}
                className={`category-card glass-panel ${isDisabled ? 'disabled' : 'clickable'} cat-${cat.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => !isDisabled && exploreCategory('type', cat.title)}
                title={isDisabled ? "Data not yet available for this category" : ""}
                style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch', gap: '0.8rem', opacity: isDisabled ? 0.4 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer', pointerEvents: isDisabled ? 'none' : 'auto' }}
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
                    <div className="count-badge" style={{ background: 'var(--btn-bg)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                      <Lock size={12} /> Coming Soon
                    </div>
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
        {(() => {
          const committeeSpos = spos.filter(spo => spo.spoAcctClass === 'Organizational SPO');
          const committeeCards = [];

          // Predefined Organizational SPOs
          committeeSpos.forEach(spo => {
            let totalCount = dashboardData.sponsorsCount[spo.spoName] || 0;
            committeeCards.push({
              key: spo.hiddenSpoId,
              element: (
                <div key={spo.hiddenSpoId} className={`category-card small-card glass-panel clickable ${(!loading && totalCount > 0) ? 'has-items' : ''}`} onClick={() => exploreCategory('spo', spo.spoName)}>
                  <div className="spo-card-header">
                    <OrgLogo spoId={spo.hiddenSpoId} spoName={spo.spoName} spoInfo={spoInfo} variant="banner" />
                  </div>
                  <div className="spo-card-content">
                    <h4 className="spo-card-title">{spo.spoName}</h4>
                    <span className="spo-count">
                      {loading ? <Loader2 size={14} className="animate-spin spinner-inline" /> : totalCount > 0 ? `${totalCount} ${totalCount === 1 ? 'Benefit' : 'Benefits'}` : <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={12} /> Coming Soon</span>}
                    </span>
                  </div>
                </div>
              )
            });
          });

          // Other Committees card (if there are unlisted SPO benefits)
          const predefinedSpoNames = new Set(spos.map(s => s.spoName));
          const otherCount = benefits.filter(b => b.spoName && !predefinedSpoNames.has(b.spoName)).length;
          if (otherCount > 0) {
            committeeCards.push({
              key: 'other-committees-card',
              element: (
                <div key="other-committees-card" className="category-card small-card glass-panel clickable has-items" onClick={() => exploreCategory('spo', 'Other')}>
                  <div className="spo-card-header">
                    <div className="org-logo org-logo--fallback org-logo--banner">
                      <div className="org-logo-icon-container">
                        <Layers className="fallback-icon" size={48} strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                  <div className="spo-card-content">
                    <h4 className="spo-card-title">Other Committees</h4>
                    <span className="spo-count">
                      {otherCount} {otherCount === 1 ? 'Benefit' : 'Benefits'}
                    </span>
                  </div>
                </div>
              )
            });
          }

          const needsCollapse = committeeCards.length > 9;
          const isCollapsed = needsCollapse && !showAllCommittees;
          const displayedCards = isCollapsed ? committeeCards.slice(0, 9) : committeeCards;

          return (
            <div className="category-grid tight-grid" style={{ marginBottom: 'var(--space-xl)' }}>
              {displayedCards.map(card => card.element)}
              
              {isCollapsed && (
                <div
                  className="category-card small-card glass-panel clickable show-all-card"
                  onClick={() => setShowAllCommittees(true)}
                >
                  <ChevronDown size={32} className="show-all-icon" style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                  <h4>Show All</h4>
                  <span className="count-text">{committeeCards.length} Committees</span>
                </div>
              )}

              {showAllCommittees && needsCollapse && (
                <>
                  <div className="coming-soon-banner" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-md) 0', color: 'var(--text-muted)', fontSize: '0.9rem', borderTop: '1px dashed rgba(255,255,255,0.1)', marginTop: 'var(--space-sm)' }}>
                    We are continually expanding our directory. Additional IEEE Committees and organization units will be supported in future updates.
                  </div>
                  <div
                    className="category-card small-card glass-panel clickable show-all-card"
                    onClick={() => setShowAllCommittees(false)}
                    style={{ gridColumn: '1 / -1', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 'var(--space-sm)' }}
                  >
                    <ChevronUp size={24} className="show-all-icon" style={{ color: 'var(--primary)' }} />
                    <span className="count-text" style={{ fontSize: '1rem', fontWeight: 'bold' }}>Show Less</span>
                  </div>
                </>
              )}
            </div>
          );
        })()}

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
                    <div className="spo-card-header">
                      <OrgLogo spoId={spo.hiddenSpoId} spoName={spo.spoName} spoInfo={spoInfo} variant="banner" />
                    </div>
                    <div className="spo-card-content">
                      <h4 className="spo-card-title">{spo.spoName}</h4>
                      <span className="spo-count">
                        {loading ? <Loader2 size={14} className="animate-spin spinner-inline" /> : totalCount > 0 ? `${totalCount} ${totalCount === 1 ? 'Benefit' : 'Benefits'}` : <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={12} /> Coming Soon</span>}
                      </span>
                    </div>
                  </div>
                );
              })}
              {isCollapsed && (
                <div
                  className="category-card small-card glass-panel clickable show-all-card"
                  onClick={() => setShowAllSocieties(true)}
                >
                  <ChevronDown size={32} className="show-all-icon" style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
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
                  <ChevronUp size={24} className="show-all-icon" style={{ color: 'var(--primary)' }} />
                  <span className="count-text" style={{ fontSize: '1rem', fontWeight: 'bold' }}>Show Less</span>
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
                <div className="spo-card-header">
                  <OrgLogo spoId={spo.hiddenSpoId} spoName={spo.spoName} spoInfo={spoInfo} variant="banner" />
                </div>
                <div className="spo-card-content">
                  <h4 className="spo-card-title">{spo.spoName}</h4>
                  <span className="spo-count">
                    {loading ? <Loader2 size={14} className="animate-spin spinner-inline" /> : totalCount > 0 ? `${totalCount} ${totalCount === 1 ? 'Benefit' : 'Benefits'}` : <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={12} /> Coming Soon</span>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Home;
