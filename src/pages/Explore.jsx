import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import ActiveFilters from '../components/ActiveFilters';
import BenefitCard from '../components/BenefitCard';
import { useBenefits } from '../hooks/useBenefits';
import { usePreferences } from '../context/PreferencesContext';
import { fetchOUs, fetchSpoInfo, fetchCategories } from '../services/api';
import {
  Loader2, Trophy, Award, BadgeDollarSign, GraduationCap, Landmark, Layers, Star, Map, Users, HelpCircle, CalendarClock, ChevronUp, ChevronDown, Clock, CalendarDays
} from 'lucide-react';
import './Explore.css';

const iconMap = {
  Trophy, Award, BadgeDollarSign, GraduationCap, Landmark, Layers, Star, Map, Users, HelpCircle
};

const UPCOMING_WINDOW_MONTHS = 2;
const TIMELINE_BATCH_SIZE = 12; // 4 lines (3 cards per row)

const getValidTimestamp = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const t = Date.parse(dateStr);
  return isNaN(t) ? null : t;
};

const getItemTimestamp = (benefit) => {
  return getValidTimestamp(benefit.deadline) ?? getValidTimestamp(benefit.date) ?? null;
};

const getEarliestTimestamp = (benefit) => {
  const dl = getValidTimestamp(benefit.deadline);
  const dt = getValidTimestamp(benefit.date);
  if (dl !== null && dt !== null) return Math.min(dl, dt);
  return dl ?? dt ?? null;
};

const Explore = () => {
  const { benefits, loading } = useBenefits();
  const { preferences } = usePreferences();
  const [searchParams, setSearchParams] = useSearchParams();
  const [spoInfo, setSpoInfo] = useState({});
  const [spoNameToId, setSpoNameToId] = useState({});
  const [categories, setCategories] = useState([]);
  const isUpcoming = searchParams.get('upcoming') === 'true';
  const isForYou = searchParams.get('forYou') === 'true';

  // Initialize state directly from URL to avoid effect loops
  const [groupBy, setGroupBy] = useState(() => searchParams.get('groupBy') || 'category');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sortBy') || (isUpcoming ? 'date' : 'none'));
  const [spos, setSpos] = useState([]);
  const [showPastItems, setShowPastItems] = useState(false);
  const [showFutureItems, setShowFutureItems] = useState(false);
  const [visiblePastCount, setVisiblePastCount] = useState(TIMELINE_BATCH_SIZE);
  const [visibleFutureCount, setVisibleFutureCount] = useState(TIMELINE_BATCH_SIZE);
  const [visibleExploreCount, setVisibleExploreCount] = useState(TIMELINE_BATCH_SIZE);
  const upcomingRef = useRef(null);
  const pastRevealRef = useRef(null);
  const futureRevealRef = useRef(null);

  const [filters, setFilters] = useState(() => {
    return {
      types: searchParams.getAll('type'),
      sponsors: searchParams.getAll('spo'),
      eligibility: searchParams.get('eligibility') || 'both',
      membership: searchParams.get('membership') || 'all',
      search: searchParams.get('q') || ''
    };
  });

  // Handle "For You" overrides when preferences load
  useEffect(() => {
    if (isForYou && preferences) {
      setFilters(prev => ({
        ...prev,
        types: preferences.interests || [],
        sponsors: preferences.regions || [],
        eligibility: preferences.isStudent ? 'student' : 'professional',
        membership: preferences.isIEEEMember ? 'ieee' : 'all'
      }));
    }
  }, [isForYou, preferences]);

  // Sync state TO URL
  useEffect(() => {
    // Only update if not on "forYou" mode, or if we want to sync even in forYou mode.
    // Let's sync to URL always, it makes it easier to share.
    const params = new URLSearchParams();
    
    if (isUpcoming) params.set('upcoming', 'true');
    if (isForYou) params.set('forYou', 'true');

    if (sortBy !== 'none' && !isUpcoming) params.set('sortBy', sortBy);
    if (groupBy !== 'category' && !isUpcoming && sortBy !== 'date') params.set('groupBy', groupBy);

    filters.types.forEach(t => params.append('type', t));
    filters.sponsors.forEach(s => params.append('spo', s));
    
    if (filters.eligibility !== 'both') params.set('eligibility', filters.eligibility);
    if (filters.membership !== 'all') params.set('membership', filters.membership);
    if (filters.search) params.set('q', filters.search);

    setSearchParams(params, { replace: true });
  }, [filters, sortBy, groupBy, isUpcoming, isForYou, setSearchParams]);

  useEffect(() => {
    fetchSpoInfo().then(setSpoInfo);
    fetchCategories().then(setCategories);
    fetchOUs().then(sposData => {
      setSpos(sposData);
      const map = {};
      sposData.forEach(s => { map[s.spoName] = s.hiddenSpoId; });
      setSpoNameToId(map);
    });
  }, []);

  const predefinedSpoNames = useMemo(() => new Set(spos.map(s => s.spoName)), [spos]);

  // When upcoming mode activates, set sort & group defaults
  useEffect(() => {
    if (isUpcoming) {
      setSortBy('date');
      setGroupBy('none');
      setShowPastItems(false);
      setShowFutureItems(false);
      setVisiblePastCount(TIMELINE_BATCH_SIZE);
      setVisibleFutureCount(TIMELINE_BATCH_SIZE);
    }
  }, [isUpcoming]);



  const filteredBenefits = useMemo(() => {
    return benefits.filter(b => {
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const titleMatch = b.title?.toLowerCase().includes(query);
        const descMatch = b.description?.toLowerCase().includes(query);
        const spoMatch = b.spoName?.toLowerCase().includes(query);
        const catMatch = b.category?.toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !spoMatch && !catMatch) return false;
      }
      if (filters.types?.length > 0) {
        if (!filters.types.includes(b.category)) return false;
      }
      if (filters.sponsors?.length > 0) {
        const hasMatch = filters.sponsors.some(sName => {
          if (sName === 'Other') {
            return b.spoName && !predefinedSpoNames.has(b.spoName);
          }
          return b.spoName === sName;
        });
        if (!hasMatch) return false;
      }
      if (filters.eligibility === 'student') {
        if (b.student !== true) return false;
      } else if (filters.eligibility === 'professional') {
        if (b.student === true) return false;
      }
      if (filters.membership === 'ieee') {
        if (b.ieeeMembershipRequired !== true) return false;
      } else if (filters.membership === 'non-ieee') {
        if (b.ieeeMembershipRequired === true) return false;
      }
      return true;
    });
  }, [benefits, filters, predefinedSpoNames]);

  // Reset pagination when filters/sort change
  useEffect(() => {
    setVisibleExploreCount(TIMELINE_BATCH_SIZE);
    if (sortBy === 'date') {
      setShowPastItems(false);
      setShowFutureItems(false);
      setVisiblePastCount(TIMELINE_BATCH_SIZE);
      setVisibleFutureCount(TIMELINE_BATCH_SIZE);
    }
  }, [filteredBenefits, sortBy, groupBy]);

  const sortedBenefits = useMemo(() => {
    if (sortBy === 'none' || !sortBy) return filteredBenefits;
    return [...filteredBenefits].sort((a, b) => {
      const timeA = getItemTimestamp(a);
      const timeB = getItemTimestamp(b);
      if (timeA !== null && timeB !== null) {
        return timeA - timeB; // always ascending for timeline view
      }
      if (timeA !== null && timeB === null) return -1;
      if (timeA === null && timeB !== null) return 1;
      return 0;
    });
  }, [filteredBenefits, sortBy]);

  // Split into three timeline buckets: past | upcoming | further ahead + no-date
  const { pastItems, upcomingItems, futureItems } = useMemo(() => {
    if (!isUpcoming && sortBy !== 'date') return { pastItems: null, upcomingItems: null, futureItems: null };

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const nowMs = now.getTime();
    const windowEnd = new Date(now.getFullYear(), now.getMonth() + UPCOMING_WINDOW_MONTHS, now.getDate()).getTime();

    const past = [];
    const upcoming = [];
    const future = [];

    sortedBenefits.forEach(b => {
      const ts = getEarliestTimestamp(b);
      if (ts === null) {
        future.push(b);
      } else if (ts < nowMs) {
        past.push(b);
      } else if (ts <= windowEnd) {
        upcoming.push(b);
      } else {
        future.push(b);
      }
    });

    // Sort past so most recent past items appear closest to the upcoming section
    past.sort((a, b) => {
      const tA = getEarliestTimestamp(a) ?? 0;
      const tB = getEarliestTimestamp(b) ?? 0;
      return tA - tB; // ascending: oldest at top, most recent at bottom (closest to upcoming)
    });

    return { pastItems: past, upcomingItems: upcoming, futureItems: future };
  }, [isUpcoming, sortBy, sortedBenefits]);

  const groupedBenefits = useMemo(() => {
    if (groupBy === 'none') return null;
    const groups = {};
    if (groupBy === 'category') {
      categories.forEach(cat => {
        groups[cat.title] = { name: cat.title, icon: cat.icon, color: cat.color, list: [] };
      });
      const fallbackKey = 'Other';
      if (!groups[fallbackKey]) {
        groups[fallbackKey] = { name: fallbackKey, icon: 'HelpCircle', color: '#475569', list: [] };
      }
      sortedBenefits.forEach(b => {
        const catName = b.category || fallbackKey;
        if (!groups[catName]) {
          groups[catName] = { name: catName, icon: 'HelpCircle', color: '#475569', list: [] };
        }
        groups[catName].list.push(b);
      });
    } else if (groupBy === 'ou') {
      sortedBenefits.forEach(b => {
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
  }, [sortedBenefits, groupBy, categories]);

  const handleRevealPast = () => {
    setShowPastItems(true);
    setVisiblePastCount(TIMELINE_BATCH_SIZE);
    setTimeout(() => {
      pastRevealRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleRevealFuture = () => {
    setShowFutureItems(true);
    setVisibleFutureCount(TIMELINE_BATCH_SIZE);
    setTimeout(() => {
      futureRevealRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleLoadMorePast = () => {
    setVisiblePastCount(prev => prev + TIMELINE_BATCH_SIZE);
  };

  const handleCollapsePast = () => {
    setShowPastItems(false);
    setVisiblePastCount(TIMELINE_BATCH_SIZE);
  };

  const handleLoadMoreFuture = () => {
    setVisibleFutureCount(prev => prev + TIMELINE_BATCH_SIZE);
  };

  const handleCollapseFuture = () => {
    setShowFutureItems(false);
    setVisibleFutureCount(TIMELINE_BATCH_SIZE);
  };

  const renderBenefitsGrid = (items) => (
    <div className="benefits-grid">
      {items.map(benefit => (
        <BenefitCard key={benefit.id} benefit={benefit} spoInfo={spoInfo} spoNameToId={spoNameToId} />
      ))}
    </div>
  );

  const isSortActive = sortBy === 'date';

  const renderUpcomingView = () => {
    if (!pastItems || !upcomingItems || !futureItems) return null;

    const displayedPastItems = pastItems.slice(-visiblePastCount);
    const remainingPastCount = Math.max(0, pastItems.length - visiblePastCount);

    const displayedFutureItems = futureItems.slice(0, visibleFutureCount);
    const remainingFutureCount = Math.max(0, futureItems.length - visibleFutureCount);

    return (
      <div className="upcoming-timeline">

        {/* ── Past items (blur barrier at top) ── */}
        {pastItems.length > 0 && (
          <div className="timeline-section timeline-past" ref={pastRevealRef}>
            {!showPastItems ? (
              <div className="timeline-blur-zone timeline-blur-top">
                <div className="timeline-teaser timeline-teaser-top">
                  {renderBenefitsGrid(pastItems.slice(-3))}
                </div>
                <div className="timeline-barrier timeline-barrier-top">
                  <div className="barrier-pill">
                    <Clock size={16} />
                    <span>{pastItems.length} past</span>
                    <button className="btn-barrier" onClick={handleRevealPast}>
                      Show Past
                      <ChevronUp size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="timeline-revealed timeline-revealed-past">
                <div className="timeline-section-label">
                  <span className="separator-line"></span>
                  <h3 className="group-title">
                    <Clock size={16} style={{ opacity: 0.6 }} />
                    <span style={{ verticalAlign: 'middle' }}>Past</span>
                  </h3>
                  <span className="separator-line"></span>
                </div>

                {remainingPastCount > 0 && (
                  <button className="feed-load-more-bar" onClick={handleLoadMorePast}>
                    <div className="feed-load-more-inner">
                      <div className="feed-load-more-line" />
                      <div className="feed-load-more-content">
                        <ChevronUp size={16} className="feed-load-more-icon" />
                        <span className="feed-load-more-text">Load {Math.min(TIMELINE_BATCH_SIZE, remainingPastCount)} more</span>
                        <span className="feed-load-more-count">{remainingPastCount} older</span>
                      </div>
                      <div className="feed-load-more-line" />
                    </div>
                    <div className="feed-load-more-progress">
                      <div className="feed-load-more-progress-fill" style={{ width: `${Math.round((displayedPastItems.length / pastItems.length) * 100)}%` }} />
                    </div>
                  </button>
                )}

                {renderBenefitsGrid(displayedPastItems)}

                <button className="feed-collapse-bar" onClick={handleCollapsePast}>
                  <span className="feed-collapse-line" />
                  <span className="feed-collapse-label">
                    {displayedPastItems.length} of {pastItems.length} shown · Collapse
                    <ChevronDown size={14} />
                  </span>
                  <span className="feed-collapse-line" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Upcoming items (fully visible, the focus) ── */}
        <div className="timeline-section timeline-focus" ref={upcomingRef}>
          <div className="upcoming-section-header">
            <CalendarClock size={20} />
            <span>Next {UPCOMING_WINDOW_MONTHS} months</span>
            <span className="upcoming-count">
              {upcomingItems.length} {upcomingItems.length === 1 ? 'opportunity' : 'opportunities'}
            </span>
          </div>

          {upcomingItems.length > 0 ? (
            renderBenefitsGrid(upcomingItems)
          ) : (
            <div className="upcoming-empty">
              <CalendarClock size={32} />
              <h3>No deadlines or events in the next {UPCOMING_WINDOW_MONTHS} months</h3>
              <p>Check back later or explore past and future items above and below.</p>
            </div>
          )}
        </div>

        {/* ── Future items + no-date items (blur barrier at bottom) ── */}
        {futureItems.length > 0 && (
          <div className="timeline-section timeline-future" ref={futureRevealRef}>
            {!showFutureItems ? (
              <div className="timeline-blur-zone timeline-blur-bottom">
                <div className="timeline-barrier timeline-barrier-bottom">
                  <div className="barrier-pill">
                    <CalendarDays size={16} />
                    <span>{futureItems.length} more upcoming</span>
                    <button className="btn-barrier" onClick={handleRevealFuture}>
                      Show More
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>
                <div className="timeline-teaser timeline-teaser-bottom">
                  {renderBenefitsGrid(futureItems.slice(0, 3))}
                </div>
              </div>
            ) : (
              <div className="timeline-revealed timeline-revealed-future">
                <div className="timeline-section-label">
                  <span className="separator-line"></span>
                  <h3 className="group-title">
                    <CalendarDays size={16} style={{ opacity: 0.6 }} />
                    <span style={{ verticalAlign: 'middle' }}>Later & Ongoing</span>
                  </h3>
                  <span className="separator-line"></span>
                </div>

                {renderBenefitsGrid(displayedFutureItems)}

                {remainingFutureCount > 0 ? (
                  <button className="feed-load-more-bar" onClick={handleLoadMoreFuture}>
                    <div className="feed-load-more-inner">
                      <div className="feed-load-more-line" />
                      <div className="feed-load-more-content">
                        <span className="feed-load-more-text">Load {Math.min(TIMELINE_BATCH_SIZE, remainingFutureCount)} more</span>
                        <span className="feed-load-more-count">{remainingFutureCount} remaining</span>
                        <ChevronDown size={16} className="feed-load-more-icon" />
                      </div>
                      <div className="feed-load-more-line" />
                    </div>
                    <div className="feed-load-more-progress">
                      <div className="feed-load-more-progress-fill" style={{ width: `${Math.round((displayedFutureItems.length / futureItems.length) * 100)}%` }} />
                    </div>
                  </button>
                ) : (
                  <button className="feed-collapse-bar" onClick={handleCollapseFuture}>
                    <span className="feed-collapse-line" />
                    <span className="feed-collapse-label">
                      All {futureItems.length} shown · Collapse
                      <ChevronUp size={14} />
                    </span>
                    <span className="feed-collapse-line" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="explore-page">
      <div className="explore-header-row">
        <header className="page-header">
          <h1>{isUpcoming ? 'Upcoming Opportunities' : 'Explore Opportunities'}</h1>
          <p className="text-muted">
            {isUpcoming
              ? 'Showing deadlines and events coming up soon.'
              : `Showing ${filteredBenefits.length} opportunities based on current filters.`
            }
          </p>
        </header>

        <div className="explore-controls">
          <div className="sort-by-container">
            <span className="sort-by-label">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-by-select"
            >
              <option value="none">Default</option>
              <option value="date">Date</option>
            </select>
          </div>

          {!isUpcoming && sortBy !== 'date' && (
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
          )}
        </div>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} spoInfo={spoInfo} />
      <ActiveFilters filters={filters} setFilters={setFilters} />
      
      {loading ? (
        <div className="loading-state" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
          <span>Loading Benefits Data...</span>
        </div>
      ) : filteredBenefits.length > 0 ? (
        isUpcoming ? (
          renderUpcomingView()
        ) : groupBy === 'none' ? (
          isSortActive ? (
            renderUpcomingView()
          ) : (
            <div className="benefits-grid">
              {sortedBenefits.map(benefit => (
                <BenefitCard key={benefit.id} benefit={benefit} spoInfo={spoInfo} spoNameToId={spoNameToId} />
              ))}
            </div>
          )
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
