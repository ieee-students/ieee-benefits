import React, { useMemo } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { useBenefits } from '../hooks/useBenefits';
import BenefitCard from '../components/BenefitCard';
import { Link } from 'react-router-dom';
import './Explore.css'; // Reusing grid styles

const Favorites = () => {
  const { favorites } = useFavorites();
  const { benefits, loading } = useBenefits();

  const favoriteBenefits = useMemo(() => {
    return benefits.filter(b => favorites.includes(b.id));
  }, [benefits, favorites]);

  if (loading) return <div className="loading-state">Loading Favorites...</div>;

  return (
    <div className="favorites-page">
      <header className="page-header">
        <h1>Your Favorites</h1>
        <p className="text-muted">You have {favoriteBenefits.length} saved benefits.</p>
      </header>

      <div className="benefits-grid">
        {favoriteBenefits.length > 0 ? (
          favoriteBenefits.map(benefit => (
            <BenefitCard key={benefit.id} benefit={benefit} />
          ))
        ) : (
          <div className="empty-state glass-panel">
            <h3>No favorites yet</h3>
            <p>You haven't added any benefits to your favorites. Explore available opportunities and click the heart icon to save them.</p>
            <Link to="/explore" className="btn btn-primary">Start Exploring</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
