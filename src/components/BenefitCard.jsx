import React, { useState } from 'react';
import { Heart, Calendar, ArrowUpRight } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import OrgLogo from './OrgLogo';
import './BenefitCard.css';

const BenefitCard = ({ benefit, spoInfo, spoNameToId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(benefit.id);

  const handleCardClick = (e) => {
    // Prevent expanding if clicking the favorite button or view link
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const formatDeadline = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return `Apply before ${date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const formatEventDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return `On ${date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const spoId = spoNameToId?.[benefit.spoName] || null;

  return (
    <div className={`benefit-card glass-panel clickable ${isExpanded ? 'expanded' : ''}`} onClick={handleCardClick}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span className={`badge badge-${(benefit.category || '').toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>{benefit.category}</span>
          {benefit.status === 'pending' && <span className="status-badge pending">Pending Verification</span>}
        </div>
        <button
          className={`favorite-btn ${favorite ? 'active' : ''}`}
          onClick={() => toggleFavorite(benefit.id)}
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart size={20} fill={favorite ? 'var(--favorite)' : 'none'} color={favorite ? 'var(--favorite)' : 'var(--text-muted)'} />
        </button>
      </div>

      <div className="card-body">
        <h3 className={`card-title ${isExpanded ? 'expanded' : ''}`}>{benefit.title}</h3>
        <p className={`card-desc ${isExpanded ? 'expanded' : ''}`}>{benefit.description}</p>

        <div className="card-meta">
          <div className="meta-info">
            <span className="meta-label">Organization Unit</span>
            <span className="meta-value">{benefit.spoName}</span>
          </div>
          {spoInfo && (
            <div className="meta-logo">
              <OrgLogo spoId={spoId} spoName={benefit.spoName} spoInfo={spoInfo} variant="banner" />
            </div>
          )}
        </div>
      </div>

      <div className="card-footer">
        {(benefit.date || benefit.deadline) ? (
          <div className="deadline">
            <Calendar size={16} />
            <div className="deadline-lines">
              {benefit.date && <span>{formatEventDate(benefit.date)}</span>}
              {benefit.deadline && <span>{formatDeadline(benefit.deadline)}</span>}
            </div>
          </div>
        ) : (
          <div></div>
        )}
        {benefit.url ? (
          <a href={benefit.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
            View <ArrowUpRight size={16} />
          </a>
        ) : (
          <button className="btn btn-primary btn-sm" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            View <ArrowUpRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default BenefitCard;
